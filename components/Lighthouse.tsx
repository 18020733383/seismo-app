import React from 'react';
import { IntensityLevel, LogType } from '../types';

interface LighthouseProps {
  level: IntensityLevel | null;
  type?: LogType;
}

export const Lighthouse: React.FC<LighthouseProps> = ({ level, type = 'negative' }) => {
  const isPositive = type === 'positive';
  
  // Negative Animation States
  const isExtremeShaking = !isPositive && level === IntensityLevel.Level1;
  const isShaking = !isPositive && (level === IntensityLevel.Level2 || level === IntensityLevel.Level3);
  const isMildShaking = !isPositive && level === IntensityLevel.Level4;
  const isStormy = !isPositive && (level === IntensityLevel.Level1 || level === IntensityLevel.Level2 || level === IntensityLevel.Level3);
  
  // Positive Animation States
  const isConstruction = isPositive && (level === IntensityLevel.Level6 || level === IntensityLevel.Level5);
  const isCelebration = isPositive && (level === IntensityLevel.Level4 || level === IntensityLevel.Level3 || level === IntensityLevel.Level2 || level === IntensityLevel.Level1);
  const isMiracle = isPositive && level === IntensityLevel.Level1;

  const skyColor = isPositive
    ? isMiracle ? 'fill-amber-900' : 'fill-sky-900' // Night sky for fireworks or clear sky
    : level === IntensityLevel.Level1 
      ? 'fill-red-950' 
      : level === IntensityLevel.Level2 
        ? 'fill-gray-900' 
        : level === IntensityLevel.Level3
          ? 'fill-slate-800'
          : 'fill-transparent';

  const beamColor = isPositive
    ? 'rgba(255, 223, 0, 0.6)' // Gold beam
    : level === IntensityLevel.Level1 
      ? 'rgba(255, 0, 0, 0.8)' 
      : level === IntensityLevel.Level2
        ? 'rgba(255, 100, 0, 0.6)'
        : 'rgba(255, 255, 200, 0.5)';

  // Jumping People for Celebration
  const getPeopleCount = () => {
    if (!isCelebration || !level) return 0;
    switch(level) {
      case IntensityLevel.Level1: return 18;
      case IntensityLevel.Level2: return 12;
      case IntensityLevel.Level3: return 8;
      case IntensityLevel.Level4: return 4;
      default: return 0;
    }
  };

  const peopleCount = getPeopleCount();

  return (
    <div className={`relative w-full h-64 md:h-80 transition-all duration-700 overflow-hidden rounded-b-[3rem] 
      ${isExtremeShaking ? 'animate-shake-extreme' : isShaking ? 'animate-shake' : isMildShaking ? 'animate-shake-mild' : ''}`}>
       {/* Sky/Atmosphere Layer */}
       <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
         <rect width="100%" height="100%" className={`transition-colors duration-1000 ${skyColor}`} />
         
         {/* Moon / Sun */}
         <circle cx="85%" cy="20%" r="30" className={`transition-all duration-1000 ${
            isPositive 
              ? 'fill-yellow-200 blur-md opacity-90' 
              : level === IntensityLevel.Level1 ? 'fill-red-600 blur-sm' : 'fill-yellow-100 opacity-80'
         }`} />
         
         {/* Confetti / Ribbons for high positive levels (Level 1-3) */}
         {isCelebration && level && level <= IntensityLevel.Level3 && (
           <g>
             {[...Array(30)].map((_, i) => (
               <rect
                 key={`confetti-${i}`}
                 x={`${Math.random() * 100}%`}
                 y="-10"
                 width="3"
                 height="8"
                 fill={['#fbbf24', '#34d399', '#60a5fa', '#f87171', '#a78bfa', '#fb7185'][i % 6]}
                 opacity="0.8"
               >
                 <animateTransform
                   attributeName="transform"
                   type="translate"
                   from={`0 -10`}
                   to={`0 400`}
                   dur={`${2 + Math.random() * 2}s`}
                   repeatCount="indefinite"
                 />
                 <animateTransform
                   attributeName="transform"
                   type="rotate"
                   from="0"
                   to="360"
                   dur={`${1 + Math.random() * 1.5}s`}
                   repeatCount="indefinite"
                   additive="sum"
                 />
               </rect>
             ))}
           </g>
         )}

         {/* Clouds / Fireworks (Level 1-2) */}
         {isCelebration && level && level <= IntensityLevel.Level2 ? (
             // Enhanced Fireworks for Top Positive Levels
             <g>
                {[...Array(level === IntensityLevel.Level1 ? 15 : 8)].map((_, i) => {
                  const x = 10 + Math.random() * 80;
                  const y = 10 + Math.random() * 50;
                  const color = ['#fbbf24', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899'][i % 6];
                  return (
                    <g key={`firework-group-${i}`}>
                      {/* Central Flash */}
                      <circle 
                        cx={`${x}%`} 
                        cy={`${y}%`} 
                        r="2" 
                        fill={color}
                        className="animate-ping" 
                        style={{ 
                          animationDuration: `${0.8 + Math.random()}s`, 
                          animationDelay: `${Math.random() * 3}s` 
                        }} 
                      />
                      {/* Burst Particles */}
                      {[...Array(6)].map((_, j) => (
                        <circle
                          key={`burst-${i}-${j}`}
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="1"
                          fill={color}
                        >
                          <animate
                            attributeName="cx"
                            from={`${x}%`}
                            to={`${x + (Math.random() - 0.5) * 15}%`}
                            dur="1s"
                            begin={`${Math.random() * 3}s`}
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="cy"
                            from={`${y}%`}
                            to={`${y + (Math.random() - 0.5) * 15}%`}
                            dur="1s"
                            begin={`${Math.random() * 3}s`}
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            from="1"
                            to="0"
                            dur="1s"
                            begin={`${Math.random() * 3}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                      ))}
                    </g>
                  );
                })}
             </g>
         ) : (
             <g className={`transition-transform duration-[10s] ${isStormy ? 'translate-x-10' : 'translate-x-0'}`}>
                <path d="M10,50 Q30,30 50,50 T90,50" stroke="white" strokeWidth="0" fill="rgba(255,255,255,0.4)" className="opacity-60" />
                <circle cx="20%" cy="30%" r="20" fill="rgba(255,255,255,0.2)" />
                <circle cx="25%" cy="25%" r="25" fill="rgba(255,255,255,0.2)" />
             </g>
         )}
       </svg>

       {/* Lighthouse Structure */}
       <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
          
          {/* Scaffolding for Construction Levels */}
          {isConstruction && (
            <div className="absolute inset-0 w-full h-full z-20 pointer-events-none">
                {/* Vertical Poles */}
                <div className="absolute bottom-0 left-[-10px] w-1 h-32 bg-slate-400/80"></div>
                <div className="absolute bottom-0 right-[-10px] w-1 h-32 bg-slate-400/80"></div>
                
                {/* Horizontal Bars */}
                <div className="absolute bottom-10 left-[-10px] w-[calc(100%+20px)] h-1 bg-slate-400/80"></div>
                <div className="absolute bottom-20 left-[-10px] w-[calc(100%+20px)] h-1 bg-slate-400/80"></div>
                <div className="absolute bottom-30 left-[-10px] w-[calc(100%+20px)] h-1 bg-slate-400/80"></div>

                {/* Cross Bracing (X shapes) */}
                <div className="absolute bottom-0 left-[-10px] w-[calc(100%+20px)] h-10 border-slate-400/60 border-t-0 border-b-0" 
                     style={{ background: 'linear-gradient(to top right, transparent 48%, #94a3b8 49%, #94a3b8 51%, transparent 52%), linear-gradient(to top left, transparent 48%, #94a3b8 49%, #94a3b8 51%, transparent 52%)' }}></div>
                <div className="absolute bottom-10 left-[-10px] w-[calc(100%+20px)] h-10 border-slate-400/60 border-t-0 border-b-0" 
                     style={{ background: 'linear-gradient(to top right, transparent 48%, #94a3b8 49%, #94a3b8 51%, transparent 52%), linear-gradient(to top left, transparent 48%, #94a3b8 49%, #94a3b8 51%, transparent 52%)' }}></div>
                <div className="absolute bottom-20 left-[-10px] w-[calc(100%+20px)] h-10 border-slate-400/60 border-t-0 border-b-0" 
                     style={{ background: 'linear-gradient(to top right, transparent 48%, #94a3b8 49%, #94a3b8 51%, transparent 52%), linear-gradient(to top left, transparent 48%, #94a3b8 49%, #94a3b8 51%, transparent 52%)' }}></div>
            </div>
          )}

          {/* Light Beam System */}
          <div className="absolute top-[18px] left-[-6px] z-30 pointer-events-none">
             {/* Main Rotating Beam */}
             <div 
               className="absolute top-0 left-0 w-0 h-0 border-l-[30px] border-r-[30px] border-b-[250px] border-l-transparent border-r-transparent transition-all duration-300"
               style={{ 
                 borderBottomColor: beamColor,
                 transformOrigin: '50% 0%',
                 transform: level === IntensityLevel.Level1 && !isPositive
                   ? 'rotate(-45deg) scale(1.5)' 
                   : 'rotate(-45deg)',
                 animation: level === IntensityLevel.Level1 && !isPositive
                   ? 'none' 
                   : 'beam-rotate-from-corner 5s infinite ease-in-out alternate',
                 filter: 'blur(4px)'
               }}
             ></div>
             
             {/* The Bulb Glow at the origin point */}
             <div className={`w-4 h-4 rounded-full bg-yellow-100 blur-sm absolute -top-2 -left-2 ${level === IntensityLevel.Level1 && !isPositive ? 'animate-ping bg-red-500' : ''}`}></div>
          </div>

          {/* Roof */}
          <div className="w-16 h-8 bg-slate-700 rounded-t-full z-10 relative"></div>
          
          {/* Lantern Room */}
          <div className="w-12 h-10 bg-yellow-100 z-10 relative border-x-4 border-slate-700 flex justify-center items-center overflow-hidden">
             <div className={`w-full h-full bg-yellow-200 opacity-50 ${level === IntensityLevel.Level1 && !isPositive ? 'bg-red-500 animate-pulse' : ''}`}></div>
          </div>
          
          {/* Balcony & Jumping People on Balcony */}
          <div className="w-20 h-4 bg-slate-800 rounded-full z-10 relative -mt-1 flex justify-center items-end">
             {isCelebration && (
               <div className="absolute -top-4 flex gap-1 items-end px-2">
                 {[...Array(Math.min(peopleCount, 6))].map((_, i) => (
                   <div key={`balcony-person-${i}`} className="w-1 bg-yellow-400 rounded-t-full animate-bounce"
                        style={{ 
                          height: `${6 + Math.random() * 4}px`, 
                          animationDuration: `${0.3 + Math.random() * 0.3}s`,
                          animationDelay: `${Math.random()}s` 
                        }}></div>
                 ))}
               </div>
             )}
          </div>
          
          {/* Tower Body */}
          <div className="w-16 h-40 bg-white relative z-10 flex flex-col items-center justify-around py-4" 
               style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)', background: 'linear-gradient(90deg, #f1f5f9 0%, #cbd5e1 100%)' }}>
             <div className={`w-full h-4 opacity-80 ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
             <div className={`w-full h-4 opacity-80 ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
             <div className={`w-full h-4 opacity-80 ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          </div>

          {/* Base & Jumping People on Base */}
          <div className="w-24 h-12 bg-slate-800 rounded-t-lg z-10 relative -mt-2 flex justify-center items-start pt-1">
             {isCelebration && (
               <div className="absolute -top-5 w-full flex justify-around items-end px-1">
                 {[...Array(Math.max(0, peopleCount - 6))].map((_, i) => (
                   <div key={`base-person-${i}`} className="w-1.5 bg-yellow-500 rounded-t-full animate-bounce"
                        style={{ 
                          height: `${10 + Math.random() * 8}px`, 
                          animationDuration: `${0.4 + Math.random() * 0.4}s`,
                          animationDelay: `${Math.random()}s` 
                        }}></div>
                 ))}
               </div>
             )}
          </div>
       </div>

       {/* Ocean / Waves */}
       <div className="absolute bottom-0 w-full h-16 z-20 overflow-hidden">
          <svg className={`w-[200%] h-full absolute bottom-0 transition-transform ${level === IntensityLevel.Level1 && !isPositive ? 'fill-red-900 animate-shake' : isPositive ? 'fill-emerald-600/60 animate-wave-slow' : 'fill-blue-500/60 animate-wave-slow'}`} viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
          <svg className={`w-[200%] h-full absolute bottom-0 left-[-20px] opacity-60 transition-transform ${level === IntensityLevel.Level1 && !isPositive ? 'fill-gray-900 animate-pulse' : isPositive ? 'fill-emerald-400/60 animate-wave-fast' : 'fill-blue-400/60 animate-wave-fast'}`} viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ animationDelay: '-1s' }}>
             <path d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,224C672,213,768,171,864,149.3C960,128,1056,128,1152,149.3C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
       </div>

    </div>
  );
};
