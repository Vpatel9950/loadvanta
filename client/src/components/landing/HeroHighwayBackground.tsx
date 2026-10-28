import React from 'react';

export const HeroHighwayBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none bg-slate-950">
      {/* 1. VISIBLE APPROACHING ROAD MOVEMENT (DUR SE PASS AANA) */}
      <div className="relative w-[116%] -left-[8%] h-full overflow-hidden animate-[truckApproachFromDistance_8s_ease-in-out_infinite]">
        <img
          src="/images/hero-sunset-truck.jpg"
          alt="Loadvanta Commercial Freight Truck Moving on Highway"
          className="w-full h-full object-cover object-center"
          style={{
            filter: 'contrast(1.12) saturate(1.15) brightness(0.96)'
          }}
        />

        {/* 2. GOLDEN SUNSET PULSING LIGHT FLARE */}
        <div className="absolute top-[38%] left-[2%] sm:left-[3%] w-28 h-28 rounded-full bg-amber-400/35 blur-2xl animate-pulse pointer-events-none" />

        {/* 3. REALISTIC VEHICLE HEADLIGHT GLOW (Synchronized with the Moving Truck) */}
        {/* Left Front Headlight Glow */}
        <div className="absolute bottom-[32%] sm:bottom-[34%] left-[34%] sm:left-[35%] w-6 h-6 rounded-full bg-white shadow-[0_0_26px_9px_rgba(254,240,138,0.95)] animate-pulse pointer-events-none" />

        {/* Right Front Headlight Glow */}
        <div className="absolute bottom-[31%] sm:bottom-[33%] left-[47.5%] sm:left-[48.5%] w-6 h-6 rounded-full bg-white shadow-[0_0_26px_9px_rgba(254,240,138,0.95)] animate-pulse pointer-events-none" />

        {/* Forward Headlight Beam on the Road */}
        <div className="absolute bottom-[14%] left-[30%] sm:left-[32%] w-[42%] h-[26%] bg-gradient-to-t from-amber-100/25 via-amber-200/8 to-transparent [clip-path:polygon(30%_0%,70%_0%,100%_100%,0%_100%)] blur-md pointer-events-none" />
      </div>

      {/* 4. RUSHING ROAD MARKINGS & HIGHWAY SPEED STREAKS (Simulates high-speed road movement) */}
      <div className="absolute bottom-0 left-0 w-full h-[40%] overflow-hidden pointer-events-none opacity-50">
        <div className="w-[200%] h-full flex animate-[roadStreak_0.4s_linear_infinite]">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="w-2 sm:w-2.5 h-16 bg-white/75 mx-8 sm:mx-14 transform -skew-x-28 blur-[0.5px]"
              style={{ marginTop: `${(i % 4) * 22}px` }}
            />
          ))}
        </div>
      </div>

      {/* Dynamic Road Center Dash Highlights */}
      <div className="absolute bottom-[10%] right-[25%] sm:right-[35%] w-[40%] h-3 bg-gradient-to-r from-transparent via-white/85 to-transparent blur-[1px] opacity-75 animate-[pulse_1.1s_ease-in-out_infinite]" />

      {/* 5. PASSING HIGHWAY WIND & SPEED STREAMS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
        <div className="absolute top-[48%] left-0 w-[200%] h-36 animate-[windSpeed_0.9s_linear_infinite]">
          <div className="w-32 h-0.5 bg-white/85 rounded-full inline-block mr-44 blur-[0.5px]" />
          <div className="w-48 h-0.5 bg-amber-300/85 rounded-full inline-block mr-56 blur-[0.5px]" />
          <div className="w-28 h-0.5 bg-white/85 rounded-full inline-block mr-40 blur-[0.5px]" />
        </div>
      </div>

      {/* 6. SUBTLE GRADIENTS FOR HIGH CONTRAST & READABILITY */}
      <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-slate-950/85 via-slate-950/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/60 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-at-center from-transparent via-slate-950/15 to-slate-950/45 pointer-events-none" />
    </div>
  );
};
