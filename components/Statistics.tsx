import React, { useState, useMemo } from 'react';
import { SeismicLog, IntensityLevel, LevelConfig } from '../types';

interface StatisticsProps {
  logs: SeismicLog[];
}

type RangeType = 3 | 7 | 30 | 365;

export const Statistics: React.FC<StatisticsProps> = ({ logs }) => {
  const [range, setRange] = useState<RangeType>(7);

  // 1. Data Processing
  const totalCount = logs.length;
  const levelCounts: Record<IntensityLevel, number> = {
    [IntensityLevel.Level1]: 0,
    [IntensityLevel.Level2]: 0,
    [IntensityLevel.Level3]: 0,
    [IntensityLevel.Level4]: 0,
    [IntensityLevel.Level5]: 0,
    [IntensityLevel.Level6]: 0,
  };

  logs.forEach(log => {
    levelCounts[log.intensity]++;
  });

  const maxCount = Math.max(...Object.values(levelCounts), 1);

  // 2. Timeline Processing
  const { timelineData, intensityData } = useMemo(() => {
    const days = Array.from({ length: range }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (range - 1 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const tData = days.map(date => {
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      const dayLogs = logs.filter(log => {
        const logDate = log.timestamp;
        return logDate >= date.getTime() && logDate < nextDate.getTime();
      });

      // 强度权重统计: L6(1), L5(2), L4(3), L3(4), L2(5), L1(6)
      // 计算方式: 7 - intensity
      const intensitySum = dayLogs.reduce((sum, log) => sum + (7 - log.intensity), 0);

      return {
        label: range > 31 
          ? date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
          : date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        count: dayLogs.length,
        intensitySum
      };
    });

    return { 
      timelineData: tData,
      intensityData: tData 
    };
  }, [logs, range]);

  const maxTimelineCount = Math.max(...timelineData.map(d => d.count), 1);
  const maxIntensitySum = Math.max(...timelineData.map(d => d.intensitySum), 1);

  // 3. Tag Distribution Processing
  const tagCounts: Record<string, number> = {};
  logs.forEach(log => {
    (log.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const maxTagCount = Math.max(...Object.values(tagCounts), 1);

  return (
    <div className="space-y-6 pb-10">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 px-2">
        <div className="glass-panel p-5 rounded-3xl shadow-lg border border-white/50 bg-white/40">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">震感总量</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{totalCount}</span>
            <span className="text-xs text-slate-400 font-medium">次记录</span>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-3xl shadow-lg border border-white/50 bg-white/40">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">活跃程度</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-600">
              {(totalCount / Math.max(logs.length > 0 ? (Date.now() - logs[logs.length-1].timestamp) / (1000*60*60*24) : 1, 1)).toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-medium">次/天</span>
          </div>
        </div>
      </div>

      {/* Distribution Bar Chart */}
      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
            震感强度分布
          </h3>
          <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
            {([3, 7, 30, 365] as RangeType[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                  range === r 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {r === 365 ? '1年' : r === 30 ? '1月' : `${r}天`}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[
            IntensityLevel.Level1, IntensityLevel.Level2, IntensityLevel.Level3, 
            IntensityLevel.Level4, IntensityLevel.Level5, IntensityLevel.Level6
          ].map(level => {
            const count = levelCounts[level];
            const config = LevelConfig[level];
            const percentage = (count / maxCount) * 100;
            
            return (
              <div key={level} className="group">
                <div className="flex justify-between items-end mb-1.5 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded text-white ${config.color}`}>L{level}</span>
                    <span className="text-xs font-bold text-slate-600">{config.alertName}</span>
                  </div>
                  <span className="text-xs font-black text-slate-400 group-hover:text-slate-600 transition-colors">{count}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                  <div 
                    className={`h-full ${config.color} transition-all duration-1000 ease-out rounded-full shadow-sm`}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <h3 className="text-sm font-bold text-slate-700 mb-8 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
          震感频次趋势 (近 {range === 365 ? '1年' : range === 30 ? '1月' : `${range}天`})
        </h3>
        
        <div className="relative h-40 w-full px-2">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none opacity-20">
            {[0, 1, 2, 3].map(i => <div key={i} className="w-full border-t border-slate-400"></div>)}
          </div>

          {/* SVG Line and Area */}
          <svg className="absolute inset-0 w-full h-full px-2 py-4 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Area under the line */}
            <path
              d={`
                M 0 ${100 - (timelineData[0].count / maxTimelineCount) * 100}
                ${timelineData.map((d, i) => `L ${(i / (timelineData.length - 1)) * 100} ${100 - (d.count / maxTimelineCount) * 100}`).join(' ')}
                L 100 100 L 0 100 Z
              `}
              fill="url(#lineGradient)"
              className="transition-all duration-1000 ease-out"
              vectorEffect="non-scaling-stroke"
            />
            
            {/* The actual line */}
            <path
              d={timelineData.map((d, i) => 
                `${i === 0 ? 'M' : 'L'} ${(i / (timelineData.length - 1)) * 100} ${100 - (d.count / maxTimelineCount) * 100}`
              ).join(' ')}
              fill="none"
              stroke="#6366f1"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-1000 ease-out drop-shadow-md"
              vectorEffect="non-scaling-stroke"
            />

            {/* Data Points (Only show for smaller ranges to avoid clutter) */}
            {range <= 31 && timelineData.map((d, i) => (
              <circle
                key={i}
                cx={(i / (timelineData.length - 1)) * 100}
                cy={100 - (d.count / maxTimelineCount) * 100}
                r="1.5"
                fill="white"
                stroke="#6366f1"
                strokeWidth="0.8"
                className="transition-all duration-1000 ease-out"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* Interaction Layer */}
          <div className="absolute inset-0 flex justify-between px-2 py-4">
            {timelineData.map((data, i) => (
              <div key={i} className="relative h-full flex flex-col items-center group" style={{ width: `${100 / timelineData.length}%` }}>
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-bold shadow-xl border border-white/10">
                  {data.count} 次震感 ({data.label})
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
                
                <div className="absolute inset-0 w-full h-full cursor-pointer"></div>
                
                {/* Label - Only show some for large ranges */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                  <span className={`text-[9px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors ${
                    range > 7 && i % Math.ceil(range/7) !== 0 ? 'hidden' : ''
                  }`}>
                    {data.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Intensity Sum Chart */}
      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <h3 className="text-sm font-bold text-slate-700 mb-8 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-rose-500 rounded-full"></div>
          地震强度趋势 (加权总和)
        </h3>
        
        <div className="relative h-40 w-full px-2">
          <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none opacity-20">
            {[0, 1, 2, 3].map(i => <div key={i} className="w-full border-t border-slate-400"></div>)}
          </div>

          <svg className="absolute inset-0 w-full h-full px-2 py-4 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="intensityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            <path
              d={`
                M 0 ${100 - (timelineData[0].intensitySum / maxIntensitySum) * 100}
                ${timelineData.map((d, i) => `L ${(i / (timelineData.length - 1)) * 100} ${100 - (d.intensitySum / maxIntensitySum) * 100}`).join(' ')}
                L 100 100 L 0 100 Z
              `}
              fill="url(#intensityGradient)"
              className="transition-all duration-1000 ease-out"
              vectorEffect="non-scaling-stroke"
            />
            
            <path
              d={timelineData.map((d, i) => 
                `${i === 0 ? 'M' : 'L'} ${(i / (timelineData.length - 1)) * 100} ${100 - (d.intensitySum / maxIntensitySum) * 100}`
              ).join(' ')}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-1000 ease-out drop-shadow-md"
              vectorEffect="non-scaling-stroke"
            />

            {range <= 31 && timelineData.map((d, i) => (
              <circle
                key={i}
                cx={(i / (timelineData.length - 1)) * 100}
                cy={100 - (d.intensitySum / maxIntensitySum) * 100}
                r="1.5"
                fill="white"
                stroke="#f43f5e"
                strokeWidth="0.8"
                className="transition-all duration-1000 ease-out"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          <div className="absolute inset-0 flex justify-between px-2 py-4">
            {timelineData.map((data, i) => (
              <div key={i} className="relative h-full flex flex-col items-center group" style={{ width: `${100 / timelineData.length}%` }}>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-bold shadow-xl border border-white/10">
                  强度值: {data.intensitySum} ({data.label})
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
                
                <div className="absolute inset-0 w-full h-full cursor-pointer"></div>
                
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                  <span className={`text-[9px] font-bold text-slate-400 group-hover:text-rose-600 transition-colors ${
                    range > 7 && i % Math.ceil(range/7) !== 0 ? 'hidden' : ''
                  }`}>
                    {data.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tag Cloud / Distribution */}
      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
          客观事件分布 (Top 10)
        </h3>
        {sortedTags.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {sortedTags.map(([tag, count]) => {
              const fontSize = 0.75 + (count / maxTagCount) * 0.75;
              const opacity = 0.5 + (count / maxTagCount) * 0.5;
              
              return (
                <div 
                  key={tag}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/60 border border-white/80 shadow-sm transition-all hover:scale-110 hover:shadow-md"
                  style={{ 
                    opacity,
                    transform: `scale(${fontSize})`
                  }}
                >
                  <span className="text-xs font-black text-slate-700">#{tag}</span>
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-lg">{count}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-slate-400">暂无标签记录，在记录震感时添加 #标签 即可看到分布</p>
          </div>
        )}
      </div>

      {/* Empty State */}
      {totalCount === 0 && (
        <div className="text-center py-10 opacity-40">
          <p className="text-xs font-medium">暂无震感记录，快去记录第一次震感吧</p>
        </div>
      )}
    </div>
  );
};
