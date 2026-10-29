import { config } from '../../config/env';

export interface ParsedVoiceQuery {
  pickupCity?: string;
  deliveryCity?: string;
  weightTons?: number;
  cargoType?: string;
  vehicleType?: string;
  hindiSummary?: string;
  punjabiSummary?: string;
  rawText: string;
}

const PUNJAB_CORRIDORS = [
  'Ludhiana',
  'Jalandhar',
  'Amritsar',
  'Bathinda',
  'Patiala',
  'Mohali',
  'Chandigarh',
  'Khanna',
  'Mandi Gobindgarh',
  'Ambala',
  'Panipat',
  'Delhi',
  'Kharar',
  'Rupnagar'
];

export class AiVoiceService {
  public static async parseVoiceQuery(text: string): Promise<ParsedVoiceQuery> {
    const trimmed = text.trim();
    if (!trimmed) {
      return { rawText: '' };
    }

    const apiKey = config.gemini.apiKey;
    if (apiKey) {
      try {
        const prompt = `You are an expert AI logistics assistant for Loadvanta, a B2B freight marketplace in Punjab and North India.
The user (a truck driver or transporter) said:
"${trimmed}"

Extract freight search filters from this voice query. Known cities in this corridor include: ${PUNJAB_CORRIDORS.join(', ')}.
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

        if (res.ok) {
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
              hindiSummary: parsed.hindiSummary || `Khoja ja raha hai: ${trimmed}`,
              punjabiSummary: parsed.punjabiSummary || `ਲੱਭਿਆ ਜਾ ਰਿਹਾ ਹੈ: ${trimmed}`,
              rawText: trimmed
            };
          }
        }
      } catch (err: any) {
        console.warn('[AiVoiceService] Gemini API call failed, falling back to heuristics:', err.message);
      }
    }

    // Heuristic Fallback
    return this.fallbackHeuristic(trimmed);
  }

  private static fallbackHeuristic(text: string): ParsedVoiceQuery {
    const lower = text.toLowerCase();
    let pickupCity: string | undefined;
    let deliveryCity: string | undefined;

    for (const city of PUNJAB_CORRIDORS) {
      const cityLower = city.toLowerCase();
      if (lower.includes(`from ${cityLower}`) || lower.includes(`${cityLower} se`) || lower.includes(`${cityLower} ton`)) {
        pickupCity = city;
      } else if (lower.includes(`to ${cityLower}`) || lower.includes(`${cityLower} ke liye`) || lower.includes(`${cityLower} layi`)) {
        deliveryCity = city;
      } else if (lower.includes(cityLower)) {
        if (!pickupCity) pickupCity = city;
        else if (!deliveryCity) deliveryCity = city;
      }
    }

    const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:ton|t|tan|ਟਨ)/i);
    const weightTons = weightMatch ? parseFloat(weightMatch[1]) : undefined;

    let cargoType: string | undefined;
    if (lower.includes('kapda') || lower.includes('cloth') || lower.includes('textile') || lower.includes('ਕੱਪੜ')) cargoType = 'TEXTILES';
    else if (lower.includes('steel') || lower.includes('loha') || lower.includes('ਸਟੀਲ')) cargoType = 'STEEL';
    else if (lower.includes('grain') || lower.includes('wheat') || lower.includes('gehu') || lower.includes('chawal') || lower.includes('dhaan')) cargoType = 'AGRICULTURAL';

    return {
      pickupCity,
      deliveryCity,
      weightTons,
      cargoType,
      hindiSummary: `${pickupCity || 'Any'} se ${deliveryCity || 'Any'} ke liye load`,
      punjabiSummary: `${pickupCity || 'ਕੋਈ ਵੀ'} ਤੋਂ ${deliveryCity || 'ਕੋਈ ਵੀ'} ਲਈ ਲੋਡ`,
      rawText: text
    };
  }
}
