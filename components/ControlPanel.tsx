import React from 'react';
import { IntensityLevel, LevelConfig } from '../types';

interface ControlPanelProps {
  onSelectLevel: (level: IntensityLevel) => void;
  selectedLevel: IntensityLevel | null;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onSelectLevel, selectedLevel }) => {
  return (
    <div className="w-full max-w-md mx-auto p-4 z-30 relative -mt-8">
      <div className="glass-panel rounded-3xl p-6 shadow-xl">
        <h2 className="text-center text-gray-700 font-bold mb-4">记录当前震感 (Current Seismic Activity)</h2>
        <div className="grid grid-cols-2 gap-4">
          {[IntensityLevel.Level4, IntensityLevel.Level3, IntensityLevel.Level2, IntensityLevel.Level1].map((level) => {
            const config = LevelConfig[level];
            const isSelected = selectedLevel === level;
            
            return (
              <button
                key={level}
                onClick={() => onSelectLevel(level)}
                className={`
                  relative overflow-hidden group p-4 rounded-2xl border-2 transition-all duration-300 transform
                  ${isSelected ? `scale-105 ${config.borderColor} ${config.color} text-white` : `bg-white border-gray-200 text-gray-600 hover:border-gray-300`}
                  ${level === IntensityLevel.Level1 ? 'hover:animate-shake' : ''}
                `}
              >
                <div className="flex flex-col items-center z-10 relative">
                  <span className={`text-2xl font-black mb-1 ${isSelected ? 'text-white' : config.textColor}`}>
                    L{level}
                  </span>
                  <span className="text-xs font-medium opacity-90">{config.label.split(':')[1]}</span>
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
