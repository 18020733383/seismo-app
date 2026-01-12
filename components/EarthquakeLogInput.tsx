import React, { useState, useEffect } from 'react';
import { IntensityLevel, LevelConfig } from '../types';

interface Props {
  level: IntensityLevel;
  onSubmit: (content: string, isAftershock: boolean) => void;
  onCancel: () => void;
}

export const EarthquakeLogInput: React.FC<Props> = ({ level, onSubmit, onCancel }) => {
  const [content, setContent] = useState('');
  const [isAftershock, setIsAftershock] = useState(false);
  const config = LevelConfig[level];

  // Auto focus logic or scroll into view could go here
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content, isAftershock);
    setContent('');
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 animate-wave-fast" style={{ animationDuration: '0.5s', animationIterationCount: 1 }}>
      <div className={`rounded-3xl p-6 shadow-2xl border-2 ${config.borderColor} bg-white relative overflow-hidden`}>
        
        {/* Warning Tape for Level 1 */}
        {level === IntensityLevel.Level1 && (
            <div className="absolute top-0 left-0 w-full h-2 bg-red-600 animate-pulse"></div>
        )}

        <div className="flex items-center justify-between mb-4">
            <div>
                <h3 className={`font-bold text-lg ${config.textColor}`}>{config.label}</h3>
                <p className="text-xs text-gray-400">{config.description}</p>
            </div>
            <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center text-white font-bold`}>
                {level}
            </div>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full h-32 p-4 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none mb-4 text-gray-700 placeholder-gray-400"
            style={{ '--tw-ring-color': `var(--${config.color.replace('bg-', '')})` } as any}
            placeholder={level === IntensityLevel.Level1 ? "系统即将熔断...请记录最后遗言..." : "此刻发生了什么？(What's shaking?)"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
          />

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="aftershock"
              checked={isAftershock}
              onChange={(e) => setIsAftershock(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 mr-2 cursor-pointer"
            />
            <label htmlFor="aftershock" className="text-sm text-gray-600 cursor-pointer select-none">
              这是余震 (Aftershock / 反刍)
            </label>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition-colors"
            >
              撤销 (Cancel)
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className={`flex-1 py-3 rounded-xl text-white font-bold shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${config.color}`}
            >
              记录震感 (Log)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
