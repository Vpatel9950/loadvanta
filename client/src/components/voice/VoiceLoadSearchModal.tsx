import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Mic,
  Sparkles,
  X,
  Search,
  CheckCircle2,
  ArrowRight,
  Globe,
  RefreshCw,
  Send
} from 'lucide-react';

interface VoiceLoadSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters?: (filters: { pickupCity?: string; deliveryCity?: string; cargoType?: string }) => void;
}

const PUNJAB_CITIES_MAP: Record<string, string> = {
  'बठिंडा': 'Bathinda',
  'बटिंडा': 'Bathinda',
  'bathinda': 'Bathinda',
  'ਭਟਿੰਡਾ': 'Bathinda',
  'ਬਠਿੰਡਾ': 'Bathinda',
  'खन्ना': 'Khanna',
  'खाना': 'Khanna',
  'ਖੰਨਾ': 'Khanna',
  'khanna': 'Khanna',
  'लुधियाना': 'Ludhiana',
  'ਲੁਧਿਆਣਾ': 'Ludhiana',
  'ludhiana': 'Ludhiana',
  'जालंधर': 'Jalandhar',
  'ਜਲੰਧਰ': 'Jalandhar',
  'jalandhar': 'Jalandhar',
  'अमृतसर': 'Amritsar',
  'ਅੰਮ੍ਰਿਤਸਰ': 'Amritsar',
  'amritsar': 'Amritsar',
  'पटियाला': 'Patiala',
  'ਪਟਿਆਲਾ': 'Patiala',
  'patiala': 'Patiala',
  'मोहाली': 'Mohali',
  'ਮੋਹਾਲੀ': 'Mohali',
  'mohali': 'Mohali',
  'चंडीगढ़': 'Chandigarh',
  'ਚੰਡੀਗੜ੍ਹ': 'Chandigarh',
  'chandigarh': 'Chandigarh',
  'मंडी गोबिंदगढ़': 'Mandi Gobindgarh',
  'गोबिंदगढ़': 'Mandi Gobindgarh',
  'ਮੰਡੀ ਗੋਬਿੰਦਗੜ੍ਹ': 'Mandi Gobindgarh',
  'दिल्ली': 'Delhi',
  'ਦਿੱਲੀ': 'Delhi',
  'delhi': 'Delhi'
};

export const VoiceLoadSearchModal: React.FC<VoiceLoadSearchModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters
}) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'pa-IN' | 'hi-IN' | 'en-IN'>('hi-IN');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Web Speech API is not supported in this browser. Please use Chrome on Android or Desktop.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      if (currentTranscript.trim()) {
        transcriptRef.current = currentTranscript;
        setTranscript(currentTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[SpeechRecognition Error]', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow microphone access in your browser.');
      } else if (event.error === 'no-speech') {
        if (!transcriptRef.current) {
          setError('No speech detected. Please tap mic and speak clearly.');
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      const heard = transcriptRef.current.trim();
      // Auto-process once driver stops speaking
      if (heard && !isProcessingRef.current) {
        processWithAI(heard);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [selectedLanguage, isOpen]);

  // Start or Stop Voice Recording
  const toggleListening = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
      const heard = transcriptRef.current.trim();
      if (heard) {
        processWithAI(heard);
      }
    } else {
      transcriptRef.current = '';
      setTranscript('');
      setParsedData(null);
      setError(null);
      try {
        recognitionRef.current?.start();
      } catch {
        try {
          recognitionRef.current?.stop();
        } catch {}
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch {}
        }, 150);
      }
    }
  };

  // Direct Gemini fallback if backend lacks key or fails
  const parseWithDirectGemini = async (queryText: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error('No Gemini API key configured');
    }
    const prompt = `You are an expert AI logistics assistant for Loadvanta, a B2B freight marketplace in Punjab and North India.
The user (a truck driver or transporter) said:
"${queryText}"

Extract freight search filters from this voice query. Known cities in Punjab and North India include: Ludhiana, Jalandhar, Amritsar, Bathinda, Patiala, Mohali, Chandigarh, Khanna, Mandi Gobindgarh, Ambala, Panipat, Delhi, Kharar, Rupnagar.
Note: In voice recognition, "खाना" or "खन्ना" refers to the city "Khanna". "बठिंडा" or "बटिंडा" refers to "Bathinda". "तो" or "से" means "from" or "to".
Valid cargo types: AGRICULTURAL, INDUSTRIAL, TEXTILES, STEEL, FMCG, AUTOMOTIVE, GENERAL.
Valid vehicle types: LIGHT_COMMERCIAL, MEDIUM_DUTY, HEAVY_DUTY, MULTI_AXLE_TRAILER.

Return ONLY a JSON object with this exact structure:
{
  "pickupCity": string or null,
  "deliveryCity": string or null,
  "weightTons": number or null,
  "cargoType": string or null,
  "vehicleType": string or null,
  "hindiSummary": string,
  "punjabiSummary": string
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.statusText}`);
    }

    const data = await res.json() as any;
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textResponse) {
      const parsed = JSON.parse(textResponse);
      return {
        pickupCity: parsed.pickupCity || undefined,
        deliveryCity: parsed.deliveryCity || undefined,
        weightTons: parsed.weightTons ? Number(parsed.weightTons) : undefined,
        cargoType: parsed.cargoType || undefined,
        vehicleType: parsed.vehicleType || undefined,
        hindiSummary: parsed.hindiSummary || `लोड: ${queryText}`,
        punjabiSummary: parsed.punjabiSummary || `ਲੋਡ: ${queryText}`,
        rawText: queryText
      };
    }
    throw new Error('Empty Gemini response');
  };

  // Rule-based heuristic backup
  const parseWithLocalHeuristics = (queryText: string) => {
    let pickupCity: string | undefined;
    let deliveryCity: string | undefined;
    let cargoType: string | undefined;
    let weightTons: number | undefined;

    const lower = queryText.toLowerCase();

    // Weight detection
    const tonMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:ton|tonnes?|टन|ਟਨ)/i);
    if (tonMatch) {
      weightTons = parseFloat(tonMatch[1]);
    }

    // Cargo detection
    if (/कपड़ा|cloth|garment|textile|धागा|yarn/i.test(queryText)) {
      cargoType = 'TEXTILES';
    } else if (/गेहूं|wheat|अनाज|grain|धान|paddy/i.test(queryText)) {
      cargoType = 'AGRICULTURAL';
    } else if (/लोहा|steel|metal|सरिया/i.test(queryText)) {
      cargoType = 'STEEL';
    }

    // Detect cities by matching known names/phonetics
    const foundCities: string[] = [];
    for (const [alias, realCity] of Object.entries(PUNJAB_CITIES_MAP)) {
      if (queryText.includes(alias) || lower.includes(alias.toLowerCase())) {
        if (!foundCities.includes(realCity)) {
          foundCities.push(realCity);
        }
      }
    }

    if (foundCities.length >= 2) {
      pickupCity = foundCities[0];
      deliveryCity = foundCities[1];
    } else if (foundCities.length === 1) {
      if (/to|tak|nu|tak|ਲਈ|को|तक|खाना|खन्ना/i.test(queryText)) {
        deliveryCity = foundCities[0];
      } else {
        pickupCity = foundCities[0];
      }
    }

    return {
      pickupCity,
      deliveryCity,
      weightTons,
      cargoType,
      hindiSummary: `${pickupCity || 'Any'} se ${deliveryCity || 'Any'} ke liye load`,
      punjabiSummary: `${pickupCity || 'ਕੋਈ ਵੀ'} ਤੋਂ ${deliveryCity || 'ਕੋਈ ਵੀ'} ਲਈ ਲੋਡ`,
      rawText: queryText
    };
  };

  // Process natural voice query with Gemini AI
  const processWithAI = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsProcessing(true);
    isProcessingRef.current = true;
    setError(null);

    try {
      let finalData: any = null;

      // 1. Try backend endpoint first
      try {
        const res = await api.post('/ai/voice-parse', { text: queryText });
        if (res.data?.success && res.data?.data && (res.data.data.pickupCity || res.data.data.deliveryCity)) {
          finalData = res.data.data;
        }
      } catch (backendErr) {
        console.warn('[Backend /ai/voice-parse unavailable, trying direct Gemini]', backendErr);
      }

      // 2. If backend didn't resolve cities (e.g. Render lacked key or heuristic fallback failed), use Direct Gemini
      if (!finalData || (!finalData.pickupCity && !finalData.deliveryCity)) {
        try {
          finalData = await parseWithDirectGemini(queryText);
        } catch (geminiErr) {
          console.warn('[Direct Gemini failed, using local heuristics]', geminiErr);
          finalData = parseWithLocalHeuristics(queryText);
        }
      }

      setParsedData(finalData);

      // Auditory Feedback (Voice Readout)
      if ('speechSynthesis' in window && finalData) {
        const speakText = finalData.hindiSummary || finalData.punjabiSummary;
        if (speakText) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(speakText);
          utterance.lang = selectedLanguage;
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (err: any) {
      console.error('[AI Voice Parse Error]', err);
      setError(err.message || 'AI Voice parsing failed. Please try again.');
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  const handleApply = () => {
    if (!parsedData) return;
    const { pickupCity, deliveryCity, cargoType } = parsedData;

    if (onApplyFilters) {
      onApplyFilters({ pickupCity, deliveryCity, cargoType });
      onClose();
    } else {
      const params = new URLSearchParams();
      if (pickupCity) params.set('pickupCity', pickupCity);
      if (deliveryCity) params.set('deliveryCity', deliveryCity);
      if (cargoType) params.set('cargoType', cargoType);

      onClose();
      navigate(`/find-loads?${params.toString()}`);
    }
  };

  const sampleQueries = [
    {
      lang: 'Punjabi',
      text: 'ਮੈਨੂੰ ਲੁਧਿਆਣੇ ਤੋਂ ਦਿੱਲੀ ਲਈ 16 ਟਨ ਕੱਪੜੇ ਦਾ ਲੋਡ ਚਾਹੀਦਾ ਹੈ',
      label: 'ਲੁਧਿਆਣਾ ➔ ਦਿੱਲੀ (16T ਕੱਪੜਾ)'
    },
    {
      lang: 'Hindi',
      text: 'Bathinda se Khanna 20 ton gehu load chahiye',
      label: 'Bathinda ➔ Khanna (20T Wheat)'
    },
    {
      lang: 'Hindi/Voice',
      text: 'बठिंडा तो खाना',
      label: 'बठिंडा ➔ खन्ना'
    },
    {
      lang: 'Hinglish',
      text: 'Mandi Gobindgarh to Delhi 25 ton steel consignment',
      label: 'Mandi Gobindgarh ➔ Delhi (25T Steel)'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-orange/20 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight flex items-center space-x-2">
                <span>AI Voice Load Search</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                  GEMINI 3.5 AI
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ਬੋਲ ਕੇ ਲੋਡ ਲੱਭੋ • Bol Kar Load Khojein
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Selector */}
        <div className="flex items-center justify-between bg-slate-950/70 p-2 rounded-2xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium px-2 flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>Language:</span>
          </span>
          <div className="flex space-x-1">
            {[
              { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
              { code: 'pa-IN', label: 'ਪੰਜਾਬੀ (Punjabi)' },
              { code: 'en-IN', label: 'English / Hinglish' }
            ].map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setSelectedLanguage(l.code as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  selectedLanguage === l.code
                    ? 'bg-brand-orange text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Central Animated Microphone Button */}
        <div className="flex flex-col items-center justify-center py-3 space-y-3">
          <div className="relative">
            {/* Pulsing Ripple Rings when listening */}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-brand-orange/30 animate-ping" />
                <span className="absolute -inset-4 rounded-full bg-brand-orange/20 animate-pulse" />
              </>
            )}

            <button
              type="button"
              onClick={toggleListening}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
                isListening
                  ? 'bg-red-600 text-white shadow-red-500/50'
                  : 'bg-gradient-to-tr from-brand-orange to-amber-500 text-white shadow-orange-500/40'
              }`}
            >
              {isListening ? (
                <div className="flex flex-col items-center">
                  <Mic className="w-9 h-9 animate-bounce" />
                  <span className="text-[10px] font-black uppercase mt-0.5">Listening...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Mic className="w-9 h-9" />
                  <span className="text-[10px] font-black uppercase mt-0.5">TAP & SPEAK</span>
                </div>
              )}
            </button>
          </div>

          <p className="text-xs text-center text-slate-300 max-w-xs font-medium">
            {isListening
              ? 'Aap boliye... Jaise hi bolna band karenge, Gemini AI automatically search karega!'
              : 'Mic dabayein aur boliye (e.g. "Bathinda se Khanna 20 ton gehu load")'}
          </p>

          {/* Soundwave Bars Indicator when listening */}
          {isListening && (
            <div className="flex items-center space-x-1.5 h-5">
              {[4, 10, 16, 22, 14, 8, 18, 12, 6].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-brand-orange rounded-full animate-pulse"
                  style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Live Speech Transcript Box with 1-Click Search */}
        {(transcript || isListening) && (
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Heard Voice Speech:
              </span>
              {!isListening && transcript && (
                <button
                  type="button"
                  onClick={() => processWithAI(transcript)}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Search className="w-3 h-3" />
                  <span>Search with AI</span>
                </button>
              )}
            </div>
            <div className="text-slate-100 font-medium italic text-base">
              "{transcript || 'Waiting for speech...'}"
            </div>
          </div>
        )}

        {/* Processing Spinner */}
        {isProcessing && (
          <div className="p-4 rounded-2xl bg-brand-orange/10 border border-brand-orange/30 text-brand-orange text-xs flex items-center justify-center space-x-2 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span className="font-bold">Gemini AI is parsing your Punjabi/Hindi query...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Parsed Extracted AI Results */}
        {parsedData && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-green-500/40 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-green-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>AI Extracted Parameters:</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">Ready to Match</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Pickup City</span>
                <strong className="text-white font-mono text-sm">
                  {parsedData.pickupCity || 'Any (All Punjab)'}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Delivery Destination</span>
                <strong className="text-white font-mono text-sm">
                  {parsedData.deliveryCity || 'Any Destination'}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Weight</span>
                <strong className="text-brand-orange font-mono text-sm">
                  {parsedData.weightTons ? `${parsedData.weightTons} Tons` : 'Any'}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Cargo Category</span>
                <strong className="text-green-300 font-mono text-sm">
                  {parsedData.cargoType || 'General Freight'}
                </strong>
              </div>
            </div>

            {(parsedData.punjabiSummary || parsedData.hindiSummary) && (
              <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <b>AI Summary:</b> {parsedData.hindiSummary || parsedData.punjabiSummary}
              </div>
            )}

            <button
              type="button"
              onClick={handleApply}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-orangeHover hover:to-amber-600 text-white font-bold text-sm shadow-xl shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>View Matched Freight Loads</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Sample Voice Prompts (1-Click Try) */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Or Click a Sample Driver Query to Test:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTranscript(q.text);
                  transcriptRef.current = q.text;
                  processWithAI(q.text);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-[11px] transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <span>🗣️</span>
                <span>{q.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
