import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Zap,
  Radio,
  Sun,
  Moon,
  Volume2,
  Gauge,
  ShieldCheck,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const LiveTruckHighwayAnimation: React.FC = () => {
  const [isNight, setIsNight] = useState(true);
  const [speedMode, setSpeedMode] = useState<'eco' | 'cruise' | 'express'>('cruise');
  const [honking, setHonking] = useState(false);
  const [milestoneIndex, setMilestoneIndex] = useState(0);

  const speedValues = {
    eco: { kmh: 48, roadDuration: '1.6s', label: 'Eco Freight (48 km/h)' },
    cruise: { kmh: 68, roadDuration: '1.0s', label: 'Highway Cruise (68 km/h)' },
    express: { kmh: 88, roadDuration: '0.65s', label: 'Express Corridor (88 km/h)' }
  };

  const currentSpeed = speedValues[speedMode];

  const milestones = [
    { city: 'Mohali Logistics Depot', dist: 'KM 0 • Origin Departed', code: 'PB-65' },
    { city: 'Khanna Grain Terminal', dist: 'KM 58 • Corridor Waypoint', code: 'PB-23' },
    { city: 'Ludhiana Industrial Bypass (NH-44)', dist: 'KM 112 • Transit Hub', code: 'PB-10' },
    { city: 'Bathinda Dry Port', dist: 'KM 224 • Matched Return Delivery', code: 'PB-03' }
  ];

  // Rotate milestones every 6 seconds to show progress along the corridor
  useEffect(() => {
    const interval = setInterval(() => {
      setMilestoneIndex((prev) => (prev + 1) % milestones.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [milestones.length]);

  const triggerHorn = () => {
    setHonking(true);
    setTimeout(() => setHonking(false), 900);
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-12 px-4 sm:px-6">
      {/* Container Frame */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl transition-colors duration-500">
        {/* Top Control Bar & Telemetry HUD */}
        <div className="p-4 sm:p-5 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-4">
          {/* Status Badge & Milestone */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/40 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
              <span>LIVE FREIGHT CORRIDOR</span>
            </div>
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-300 font-mono">
              <span className="text-slate-500">|</span>
              <span className="font-bold text-brand-orange">{milestones[milestoneIndex].code}</span>
              <span>•</span>
              <span>{milestones[milestoneIndex].city}</span>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
            {/* Speed Selector */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              {(['eco', 'cruise', 'express'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSpeedMode(mode)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    speedMode === mode
                      ? 'bg-brand-orange text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Day / Night Toggle */}
            <button
              type="button"
              onClick={() => setIsNight(!isNight)}
              className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isNight ? 'Switch to Daylight Highway' : 'Switch to Night Highway'}
            >
              {isNight ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-300" />}
            </button>

            {/* Horn / Alert Interaction */}
            <button
              type="button"
              onClick={triggerHorn}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 border transition-all ${
                honking
                  ? 'bg-amber-500 text-slate-950 border-amber-400 scale-105'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Horn</span>
            </button>
          </div>
        </div>

        {/* MAIN ANIMATED HIGHWAY STAGE */}
        <div
          className={`relative w-full h-[320px] sm:h-[380px] overflow-hidden select-none transition-colors duration-700 ${
            isNight
              ? 'bg-gradient-to-b from-[#020617] via-[#0B1528] to-[#1E293B]'
              : 'bg-gradient-to-b from-[#38BDF8] via-[#BAE6FD] to-[#E0F2FE]'
          }`}
        >
          {/* SKY / BACKGROUND MOUNTAINS & STARS */}
          {isNight ? (
            <div className="absolute inset-0 pointer-events-none">
              {/* Moon */}
              <div className="absolute top-6 right-16 w-12 h-12 rounded-full bg-amber-100 shadow-[0_0_35px_rgba(254,240,138,0.7)]" />
              {/* Stars */}
              <div className="absolute top-10 left-24 w-1 h-1 bg-white rounded-full opacity-80" />
              <div className="absolute top-16 left-64 w-1.5 h-1.5 bg-white rounded-full opacity-90 shadow-sm" />
              <div className="absolute top-8 left-1/2 w-1 h-1 bg-white rounded-full opacity-70" />
              <div className="absolute top-20 right-48 w-1.5 h-1.5 bg-white rounded-full opacity-85" />
            </div>
          ) : (
            <div className="absolute inset-0 pointer-events-none">
              {/* Sun */}
              <div className="absolute top-8 right-20 w-16 h-16 rounded-full bg-amber-300 shadow-[0_0_60px_rgba(251,191,36,0.9)]" />
              {/* Fluffy Clouds */}
              <div className="absolute top-12 left-12 w-32 h-10 bg-white/70 rounded-full blur-[1px]" />
              <div className="absolute top-16 left-28 w-24 h-12 bg-white/80 rounded-full blur-[1px]" />
              <div className="absolute top-10 right-48 w-40 h-10 bg-white/60 rounded-full blur-[1px]" />
            </div>
          )}

          {/* PARALLAX HORIZON & DISTANT HILLS */}
          <svg
            className={`absolute bottom-[110px] sm:bottom-[130px] w-[200%] h-24 transition-opacity duration-700 ${
              isNight ? 'opacity-30 fill-[#0F172A]' : 'opacity-40 fill-[#047857]'
            }`}
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path d="M0,80 Q150,20 300,70 T600,60 T900,40 T1200,80 L1200,120 L0,120 Z" />
          </svg>

          {/* PASSING HIGHWAY MILESTONE BOARD (Animated Right-to-Left) */}
          <div
            key={milestoneIndex}
            className="absolute bottom-[130px] sm:bottom-[150px] right-0 z-10 animate-[milestoneSlide_6s_linear_infinite]"
          >
            <div className="flex flex-col items-center">
              <div className="px-3 py-1.5 rounded-lg bg-green-700 text-white font-mono font-black text-[11px] border-2 border-white shadow-xl flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-300" />
                <span>{milestones[milestoneIndex].city}</span>
              </div>
              <div className="w-1.5 h-7 bg-slate-400" />
            </div>
          </div>

          {/* PASSING STREET LIGHT POLE (Parallax) */}
          <div className="absolute bottom-[125px] sm:bottom-[145px] w-full pointer-events-none overflow-hidden">
            <div
              className="w-1.5 h-36 bg-slate-500 rounded-t-sm shadow-md animate-[streetPoleSlide_3s_linear_infinite]"
              style={{ animationDuration: currentSpeed.roadDuration === '0.65s' ? '1.8s' : currentSpeed.roadDuration === '1.0s' ? '2.5s' : '3.5s' }}
            >
              {/* Lamp Head */}
              <div className="w-6 h-2 bg-slate-700 rounded-full -ml-4 -mt-1 shadow-md" />
              {isNight && (
                <div className="w-28 h-40 bg-gradient-to-b from-amber-200/25 to-transparent -ml-16 transform -rotate-12 blur-[2px]" />
              )}
            </div>
          </div>

          {/* ROAD SURFACES & RUNWAY */}
          <div className="absolute bottom-0 w-full h-[125px] sm:h-[145px] bg-[#1E293B] border-t-4 border-[#334155] shadow-inner">
            {/* Upper Highway Guardrail */}
            <div className="absolute top-0 w-full h-2 bg-[#64748B] flex items-center justify-around opacity-80">
              <div className="w-full h-0.5 bg-white/40" />
            </div>

            {/* Asphalt Texture Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black opacity-90" />

            {/* TOP YELLOW HIGHWAY SHOULDER LINE */}
            <div className="absolute top-4 w-full h-1 bg-amber-400 opacity-90 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />

            {/* ANIMATED HIGHWAY CENTER DASHED WHITE LINES (Simulates high-speed movement) */}
            <div className="absolute top-[52px] sm:top-[60px] w-[200%] h-2.5 flex overflow-hidden">
              <div
                className="w-full h-full flex items-center animate-[roadDash_linear_infinite]"
                style={{ animationDuration: currentSpeed.roadDuration }}
              >
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} className="flex shrink-0 items-center mr-12 sm:mr-16">
                    <div className="w-16 sm:w-24 h-2 bg-white rounded-sm shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                  </div>
                ))}
              </div>
            </div>

            {/* BOTTOM SOLID WHITE SHOULDER LINE */}
            <div className="absolute bottom-5 w-full h-1 bg-white opacity-80" />

            {/* ROAD PAVEMENT EDGE REFLECTORS (Cat's Eyes) */}
            <div className="absolute bottom-3 w-full flex justify-between px-6 opacity-60">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="w-2 h-1 bg-amber-400 rounded-full shadow-[0_0_4px_rgba(251,191,36,0.9)]" />
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* ULTRA-DETAILED COMMERCIAL FREIGHT TRUCK (SVG VECTOR)     */}
          {/* ======================================================== */}
          <div className="absolute bottom-[24px] sm:bottom-[34px] left-2 sm:left-[14%] z-20">
            {/* Visual Horn Shockwave */}
            {honking && (
              <div className="absolute -top-12 left-[210px] sm:left-[340px] px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs animate-bounce shadow-xl flex items-center space-x-1">
                <span>🔊 BEEP BEEP!</span>
              </div>
            )}

            {/* Realistic Vehicle Shadow */}
            <div className="absolute -bottom-2.5 left-2 sm:left-4 w-[270px] sm:w-[410px] h-4 sm:h-5 bg-black/80 rounded-full blur-[4px]" />

            {/* Truck Body with Suspension Vibration */}
            <div className="relative animate-[truckSway_1.6s_ease-in-out_infinite]">
              {/* NIGHT-TIME HEADLIGHT LIGHT BEAM CONE */}
              {isNight && (
                <div className="absolute top-[38px] sm:top-[56px] left-[240px] sm:left-[390px] w-[240px] sm:w-[480px] h-[55px] sm:h-[90px] bg-gradient-to-r from-amber-100/70 via-amber-200/20 to-transparent pointer-events-none transform -rotate-1 origin-left [clip-path:polygon(0%_25%,100%_0%,100%_100%,0%_75%)] blur-[2px]" />
              )}

              {/* The Truck SVG */}
              <svg
                className="w-[280px] sm:w-[430px] h-auto drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
                viewBox="0 0 520 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* 1. CARGO TRAILER / CONTAINER (Loadvanta Branded) */}
                <rect x="20" y="24" width="310" height="116" rx="8" fill="#0F172A" stroke="#334155" strokeWidth="3" />
                {/* Container Ribs / Corrugated Steel Texture */}
                {Array.from({ length: 14 }).map((_, i) => (
                  <line
                    key={i}
                    x1={42 + i * 20}
                    y1="28"
                    x2={42 + i * 20}
                    y2="136"
                    stroke="#1E293B"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                ))}

                {/* Top Safety Rail & Reflectors */}
                <line x1="24" y1="28" x2="326" y2="28" stroke="#EA580C" strokeWidth="4" />
                <circle cx="28" cy="35" r="3" fill="#DC2626" />
                <circle cx="322" cy="35" r="3" fill="#F59E0B" />

                {/* Container Brand Decal Badge */}
                <rect x="75" y="52" width="195" height="58" rx="10" fill="#1E293B" stroke="#EA580C" strokeWidth="2.5" />
                <text x="92" y="80" fill="#FFFFFF" fontSize="19" fontWeight="900" fontFamily="sans-serif">
                  LOAD<tspan fill="#EA580C">VANTA</tspan>
                </text>
                <text x="92" y="98" fill="#94A3B8" fontSize="9.5" fontWeight="700" letterSpacing="1.5" fontFamily="sans-serif">
                  SMART RETURN FREIGHT
                </text>

                {/* Trailer Side Safety Reflective Strip */}
                <rect x="25" y="125" width="300" height="7" fill="#FBBF24" opacity="0.9" />

                {/* Trailer Underbody Toolbox & Spare Carrier */}
                <rect x="65" y="142" width="65" height="20" rx="3" fill="#334155" stroke="#1E293B" strokeWidth="2" />
                <rect x="150" y="142" width="55" height="20" rx="3" fill="#1E293B" />

                {/* 2. CHASSIS / FIFTH WHEEL COUPLING */}
                <rect x="315" y="120" width="38" height="26" fill="#1E293B" rx="3" />
                <rect x="325" y="112" width="16" height="12" fill="#475569" rx="2" />

                {/* 3. MODERN CABIN (Commercial Tractor Unit) */}
                {/* Main Cabin Body */}
                <path
                  d="M335 50 C335 40, 345 32, 360 32 L405 32 C425 32, 445 48, 456 75 L472 115 C476 125, 476 142, 470 148 L335 148 Z"
                  fill="#EA580C"
                  stroke="#C2410C"
                  strokeWidth="3"
                />

                {/* Cabin Windshield with Driver Silhouette */}
                <path
                  d="M395 38 L428 38 C440 48, 450 68, 456 82 L395 82 Z"
                  fill="#0F172A"
                  stroke="#7C2D12"
                  strokeWidth="2"
                />
                <circle cx="418" cy="62" r="7" fill="#64748B" />
                <path d="M410 78 C410 70, 426 70, 426 78 Z" fill="#64748B" />

                {/* Front Chrome Grille */}
                <rect x="456" y="95" width="22" height="42" rx="4" fill="#0F172A" stroke="#E2E8F0" strokeWidth="2" />
                <line x1="458" y1="104" x2="476" y2="104" stroke="#CBD5E1" strokeWidth="2" />
                <line x1="458" y1="114" x2="476" y2="114" stroke="#CBD5E1" strokeWidth="2" />
                <line x1="458" y1="124" x2="476" y2="124" stroke="#CBD5E1" strokeWidth="2" />

                {/* Heavy Duty Front Bumper */}
                <rect x="450" y="137" width="32" height="15" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />

                {/* Chrome Side Mirror */}
                <rect x="382" y="48" width="6" height="24" rx="2" fill="#E2E8F0" />
                <line x1="388" y1="56" x2="396" y2="56" stroke="#94A3B8" strokeWidth="2.5" />

                {/* Side Door & Handle */}
                <rect x="350" y="82" width="42" height="56" rx="3" fill="#C2410C" opacity="0.4" />
                <rect x="354" y="105" width="10" height="3" rx="1" fill="#FFFFFF" />

                {/* Cabin Steps */}
                <rect x="352" y="142" width="28" height="4" fill="#94A3B8" rx="1" />
                <rect x="356" y="148" width="20" height="3" fill="#94A3B8" rx="1" />

                {/* Vertical Chrome Exhaust Stack */}
                <rect x="338" y="12" width="7" height="38" rx="2" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
                {/* Exhaust Smoke Particle Animation */}
                <circle cx="341" cy="6" r="3" fill="#94A3B8" opacity="0.6" className="animate-ping" />

                {/* 4. LIGHTING SYSTEM */}
                {/* Front Headlight (Bright Xenon LED) */}
                <circle cx="474" cy="115" r="6" fill="#FEF08A" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="474" cy="115" r="9" fill="#FDE047" opacity="0.5" className="animate-pulse" />

                {/* Fog Lights */}
                <circle cx="468" cy="144" r="3.5" fill="#FBBF24" />

                {/* Cabin Roof Clearance Lights */}
                <circle cx="365" cy="30" r="2.5" fill="#F59E0B" />
                <circle cx="385" cy="30" r="2.5" fill="#F59E0B" />
                <circle cx="405" cy="30" r="2.5" fill="#F59E0B" />

                {/* Rear Tail Light (Bright Red) */}
                <rect x="16" y="118" width="5" height="14" rx="1.5" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />

                {/* 5. MULTI-AXLE TRUCK WHEELS (Spinning Animation) */}
                {/* Axle 1: Trailer Rear Left */}
                <g className="animate-[wheelSpin_0.5s_linear_infinite]" style={{ transformOrigin: '55px 165px' }}>
                  <circle cx="55" cy="165" r="24" fill="#0F172A" stroke="#334155" strokeWidth="4" />
                  <circle cx="55" cy="165" r="13" fill="#64748B" stroke="#E2E8F0" strokeWidth="2" />
                  <circle cx="55" cy="165" r="4" fill="#0F172A" />
                  <line x1="55" y1="152" x2="55" y2="178" stroke="#CBD5E1" strokeWidth="2" />
                  <line x1="42" y1="165" x2="68" y2="165" stroke="#CBD5E1" strokeWidth="2" />
                </g>

                {/* Axle 2: Trailer Rear Right */}
                <g className="animate-[wheelSpin_0.5s_linear_infinite]" style={{ transformOrigin: '110px 165px' }}>
                  <circle cx="110" cy="165" r="24" fill="#0F172A" stroke="#334155" strokeWidth="4" />
                  <circle cx="110" cy="165" r="13" fill="#64748B" stroke="#E2E8F0" strokeWidth="2" />
                  <circle cx="110" cy="165" r="4" fill="#0F172A" />
                  <line x1="110" y1="152" x2="110" y2="178" stroke="#CBD5E1" strokeWidth="2" />
                  <line x1="97" y1="165" x2="123" y2="165" stroke="#CBD5E1" strokeWidth="2" />
                </g>

                {/* Axle 3: Drive Axle */}
                <g className="animate-[wheelSpin_0.5s_linear_infinite]" style={{ transformOrigin: '335px 165px' }}>
                  <circle cx="335" cy="165" r="24" fill="#0F172A" stroke="#334155" strokeWidth="4" />
                  <circle cx="335" cy="165" r="13" fill="#64748B" stroke="#E2E8F0" strokeWidth="2" />
                  <circle cx="335" cy="165" r="4" fill="#0F172A" />
                  <line x1="335" y1="152" x2="335" y2="178" stroke="#CBD5E1" strokeWidth="2" />
                  <line x1="322" y1="165" x2="348" y2="165" stroke="#CBD5E1" strokeWidth="2" />
                </g>

                {/* Axle 4: Steer Axle */}
                <g className="animate-[wheelSpin_0.5s_linear_infinite]" style={{ transformOrigin: '425px 165px' }}>
                  <circle cx="425" cy="165" r="24" fill="#0F172A" stroke="#334155" strokeWidth="4" />
                  <circle cx="425" cy="165" r="13" fill="#64748B" stroke="#E2E8F0" strokeWidth="2" />
                  <circle cx="425" cy="165" r="4" fill="#0F172A" />
                  <line x1="425" y1="152" x2="425" y2="178" stroke="#CBD5E1" strokeWidth="2" />
                  <line x1="412" y1="165" x2="438" y2="165" stroke="#CBD5E1" strokeWidth="2" />
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* BOTTOM METRICS HUD FOOTER */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-900 border-t border-slate-800 text-xs">
          <div className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <Gauge className="w-4 h-4 text-brand-orange shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px] block font-medium">LIVE TELEMETRY</span>
              <strong className="text-white font-mono text-sm">{currentSpeed.kmh} km/h</strong>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <Radio className="w-4 h-4 text-green-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px] block font-medium">GPS REFRESH RATE</span>
              <strong className="text-green-400 font-mono text-sm">Every 1.0s (Socket.IO)</strong>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px] block font-medium">RETURN EMPTY TRIP</span>
              <strong className="text-amber-300 font-mono text-sm">0% (100% Back-Haul)</strong>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px] block font-medium">SHIPPER ASSURANCE</span>
              <strong className="text-blue-300 font-mono text-sm">Zero Broker Delay</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
