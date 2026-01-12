import React from 'react';
import { SeismicLog, IntensityLevel, LevelConfig } from '../types';

interface StatisticsProps {
  logs: SeismicLog[];
}

export const Statistics: React.FC<StatisticsProps> = ({ logs }) => {
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

  // 2. Timeline Processing (Last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const timelineData = last7Days.map(date => {
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    
    const count = logs.filter(log => {
      const logDate = log.timestamp;
      return logDate >= date.getTime() && logDate < nextDate.getTime();
    }).length;

    return {
      label: date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
      count
    };
  });

  const maxTimelineCount = Math.max(...timelineData.map(d => d.count), 1);

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
        <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
          震感强度分布
        </h3>
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

      {/* Timeline Sparkline */}
      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <h3 className="text-sm font-bold text-slate-700 mb-8 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
          最近 7 天震感趋势
        </h3>
        <div className="relative h-32 w-full flex items-end justify-between px-2">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="w-full border-t border-slate-100"></div>
            <div className="w-full border-t border-slate-100"></div>
            <div className="w-full border-t border-slate-100"></div>
          </div>

          {timelineData.map((data, i) => {
            const height = (data.count / maxTimelineCount) * 100;
            return (
              <div key={i} className="relative flex flex-col items-center group w-full">
                {/* Tooltip */}
                <div className="absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-bold">
                  {data.count} 次震感
                </div>
                
                {/* Bar */}
                <div 
                  className="w-4 bg-gradient-to-t from-blue-500 to-indigo-400 rounded-t-lg transition-all duration-1000 ease-out group-hover:from-blue-400 group-hover:to-indigo-300 shadow-lg shadow-indigo-200/50"
                  style={{ height: `${Math.max(height, 5)}%` }}
                ></div>
                
                {/* Label */}
                <span className="text-[9px] font-bold text-slate-400 mt-3 group-hover:text-slate-600 transition-colors">
                  {data.label}
                </span>
              </div>
            );
          })}
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
