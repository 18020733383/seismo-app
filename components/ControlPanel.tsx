import React from 'react';
import { IntensityLevel, LevelConfig, PositiveLevelConfig, LogType } from '../types';

interface ControlPanelProps {
  onSelectLevel: (level: IntensityLevel) => void;
  selectedLevel: IntensityLevel | null;
  logType: LogType;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onSelectLevel, selectedLevel, logType }) => {
  const levels = [
    IntensityLevel.Level1, IntensityLevel.Level2,
    IntensityLevel.Level3, IntensityLevel.Level4,
    IntensityLevel.Level5, IntensityLevel.Level6
  ];

  return (
    <div className="w-full max-w-md mx-auto p-4 z-30 relative -mt-8">
      <div className="glass-panel rounded-3xl p-6 shadow-xl">
        <h2 className="text-center text-gray-700 font-bold mb-6 flex flex-col items-center">
          <span className="text-lg">{logType === 'positive' ? '新增建设记录' : '记录当前震感'}</span>
          <span className="text-[10px] opacity-40 uppercase tracking-widest mt-1">
            {logType === 'positive' ? 'New Construction Progress' : 'Current Seismic Activity'}
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {levels.map((level) => {
            const config = logType === 'positive' ? PositiveLevelConfig[level] : LevelConfig[level];
            const isSelected = selectedLevel === level;
            
            return (
              <button
                key={level}
                onClick={() => onSelectLevel(level)}
                className={`
                  relative overflow-hidden group p-3 rounded-2xl border-2 transition-all duration-300 transform
                  ${isSelected ? `scale-105 ${config.borderColor} ${config.color} text-white` : `bg-white/60 border-gray-100 text-gray-600 hover:border-gray-200`}
                  ${level === IntensityLevel.Level1 ? 'hover:animate-shake-extreme' : level === IntensityLevel.Level2 ? 'hover:animate-shake' : ''}
                `}
              >
                <div className="flex flex-col items-center z-10 relative">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-xl font-black ${isSelected ? 'text-white' : config.textColor}`}>
                      L{level}
                    </span>
                    <span className={`text-xs font-bold ${isSelected ? 'text-white/90' : 'text-slate-800'}`}>
                      {config.alertName}
                    </span>
                  </div>
                  <span className={`text-[9px] leading-tight text-center font-medium ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    {config.coreDefinition}
                  </span>
                </div>
                
                {/* Hover Effect */}
                {!isSelected && (
                   <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 ${config.color} transition-opacity`}></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
