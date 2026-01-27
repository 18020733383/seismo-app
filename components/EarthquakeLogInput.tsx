import React, { useState, useEffect } from 'react';
import { IntensityLevel, LevelConfig, PositiveLevelConfig, LogType } from '../types';

interface Props {
  level: IntensityLevel;
  onSubmit: (content: string, isAftershock: boolean, tags: string[], type: LogType) => void;
  onCancel: () => void;
  existingTags?: string[];
  logType: LogType;
  setLogType: (type: LogType) => void;
}

export const EarthquakeLogInput: React.FC<Props> = ({ level, onSubmit, onCancel, existingTags = [], logType, setLogType }) => {
  const [content, setContent] = useState('');
  const [isAftershock, setIsAftershock] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const config = logType === 'positive' ? PositiveLevelConfig[level] : LevelConfig[level];

  const handleAddTag = (tag: string) => {
    const cleanTag = tag.trim().replace(/^#/, '');
    if (cleanTag && !selectedTags.includes(cleanTag)) {
      setSelectedTags([...selectedTags, cleanTag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    // Automatically add current tag input if it's not empty
    let finalTags = [...selectedTags];
    const cleanTag = tagInput.trim().replace(/^#/, '');
    if (cleanTag && !finalTags.includes(cleanTag)) {
      finalTags.push(cleanTag);
    }
    
    onSubmit(content, isAftershock, finalTags, logType);
    setContent('');
    setSelectedTags([]);
    setTagInput('');
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 animate-wave-fast" style={{ animationDuration: '0.5s', animationIterationCount: 1 }}>
      <div className={`rounded-3xl p-6 shadow-2xl border-2 ${config.borderColor} bg-white relative overflow-hidden`}>
        
        {/* Warning Tape for Level 1 & 2 */}
        {(level === IntensityLevel.Level1 || level === IntensityLevel.Level2) && (
            <div className={`absolute top-0 left-0 w-full h-2 ${level === IntensityLevel.Level1 ? 'bg-red-600 animate-pulse' : 'bg-orange-600'} `}></div>
        )}

        {/* Type Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setLogType('negative')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                logType === 'negative' 
                  ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              📉 震感记录 (Seismic)
            </button>
            <button
              type="button"
              onClick={() => setLogType('positive')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                logType === 'positive' 
                  ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              🏗️ 建设记录 (Build)
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
            <div>
                <h3 className={`font-black text-xl flex items-center gap-2 ${config.textColor}`}>
                  {config.label}
                  <span className="text-base font-bold bg-slate-100 px-2 py-0.5 rounded-lg text-slate-700">【{config.alertName}】</span>
                </h3>
                <p className="text-xs text-gray-500 font-bold mt-1 leading-relaxed">
                  {config.coreDefinition}
                </p>
            </div>
            <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center text-white font-black shadow-lg`}>
                {level}
            </div>
        </div>

        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">当下感觉 / Sensory</p>
          <p className="text-xs text-slate-600 leading-relaxed italic">"{config.sensoryDescription}"</p>
          <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-start gap-2">
            <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-bold">视觉参考</span>
            <p className="text-[11px] text-slate-500">{config.visualRef}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full h-32 p-4 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none mb-4 text-gray-700 placeholder-gray-400"
            style={{ '--tw-ring-color': `var(--${config.color.replace('bg-', '')})` } as any}
            placeholder={
              level === IntensityLevel.Level1 ? "遗言记录中..." : 
              level === IntensityLevel.Level2 ? "在废墟中刻字..." :
              "此刻发生了什么？(What's shaking?)"
            }
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

          {/* Tag System */}
          <div className="mb-6">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">事件标签 / Tags</p>
            
            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 animate-in zoom-in-50 duration-200">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </span>
              ))}
            </div>

            {/* Tag Input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder="添加客观标签 (如 #组会)"
                className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-bold active:scale-95 transition-transform"
              >
                添加
              </button>
            </div>

            {/* Existing Tags Suggestions */}
            {existingTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {existingTags.filter(tag => !selectedTags.includes(tag)).slice(0, 8).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold hover:bg-slate-200 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
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
