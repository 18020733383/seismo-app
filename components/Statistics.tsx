import React, { useState, useMemo } from 'react';
import { SeismicLog, IntensityLevel, LevelConfig, PositiveLevelConfig, LogType } from '../types';

interface StatisticsProps {
  logs: SeismicLog[];
}

type RangeType = 3 | 7 | 30 | 365;

export const Statistics: React.FC<StatisticsProps> = ({ logs }) => {
  const [range, setRange] = useState<RangeType>(7);
  const [statsType, setStatsType] = useState<LogType>('negative');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => (log.type || 'negative') === statsType);
  }, [logs, statsType]);

  // 1. Data Processing
  const totalCount = filteredLogs.length;
  const levelCounts: Record<IntensityLevel, number> = {
    [IntensityLevel.Level1]: 0,
    [IntensityLevel.Level2]: 0,
    [IntensityLevel.Level3]: 0,
    [IntensityLevel.Level4]: 0,
    [IntensityLevel.Level5]: 0,
    [IntensityLevel.Level6]: 0,
  };

  filteredLogs.forEach(log => {
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
      
      const dayLogs = filteredLogs.filter(log => {
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
  }, [filteredLogs, range]);

  const maxTimelineCount = Math.max(...timelineData.map(d => d.count), 1);
  const maxIntensitySum = Math.max(...timelineData.map(d => d.intensitySum), 1);

  // 3. Tag Distribution Processing
  const tagCounts: Record<string, number> = {};
  filteredLogs.forEach(log => {
    (log.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const maxTagCount = Math.max(...Object.values(tagCounts), 1);

  // 4. Tag Intensity Heatmap Processing
  const tagIntensityMap: Record<string, { totalIntensity: number; count: number }> = {};
  filteredLogs.forEach(log => {
    const intensityVal = 7 - log.intensity; // L1=6, L6=1
    (log.tags || []).forEach(tag => {
      if (!tagIntensityMap[tag]) {
        tagIntensityMap[tag] = { totalIntensity: 0, count: 0 };
      }
      tagIntensityMap[tag].totalIntensity += intensityVal;
      tagIntensityMap[tag].count += 1;
    });
  });

  const tagHeatmapData = Object.entries(tagIntensityMap)
    .map(([tag, data]) => ({
      tag,
      avgIntensity: data.totalIntensity / data.count,
      totalIntensity: data.totalIntensity,
      count: data.count
    }))
    .sort((a, b) => b.totalIntensity - a.totalIntensity)
    .slice(0, 12);

  const maxTagIntensity = Math.max(...tagHeatmapData.map(d => d.totalIntensity), 1);

  // 5. Circadian Distribution Processing (Golden Cycle)
  const circadianData = Array.from({ length: 24 }, () => 0);
  filteredLogs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    circadianData[hour]++;
  });

  const maxCircadianCount = Math.max(...circadianData, 1);

  // Helper for colors
  const isPositive = statsType === 'positive';
  const activeColor = isPositive ? 'bg-emerald-500' : 'bg-blue-500';
  const activeTextColor = isPositive ? 'text-emerald-600' : 'text-blue-600';
  const barColor = isPositive ? 'bg-emerald-400' : 'bg-blue-400';

  return (
    <div className="space-y-6 pb-10">
      
      {/* Type Toggle */}
      <div className="flex justify-center mb-2">
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 shadow-inner">
          <button
            onClick={() => setStatsType('negative')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              statsType === 'negative' 
                ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            📉 震感 (Seismic)
          </button>
          <button
            onClick={() => setStatsType('positive')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              statsType === 'positive' 
                ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            🏗️ 建设 (Build)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 px-2">
        <div className="glass-panel p-5 rounded-3xl shadow-lg border border-white/50 bg-white/40">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
            {isPositive ? '建设总量' : '震感总量'}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{totalCount}</span>
            <span className="text-xs text-slate-400 font-medium">次记录</span>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-3xl shadow-lg border border-white/50 bg-white/40">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
            {isPositive ? '建设热度' : '活跃程度'}
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black ${activeTextColor}`}>
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
            <div className={`w-1.5 h-4 ${activeColor} rounded-full`}></div>
            {isPositive ? '建设等级分布' : '震感强度分布'}
          </h3>
          <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
            {([3, 7, 30, 365] as RangeType[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                  range === r 
                    ? `bg-white ${activeTextColor} shadow-sm` 
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
            const config = isPositive ? PositiveLevelConfig[level] : LevelConfig[level];
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
          <div className={`w-1.5 h-4 ${isPositive ? 'bg-emerald-500' : 'bg-indigo-500'} rounded-full`}></div>
          {isPositive ? '建设频次趋势' : '震感频次趋势'} (近 {range === 365 ? '1年' : range === 30 ? '1月' : `${range}天`})
        </h3>
        
        <div className="relative h-40 w-full px-2">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none opacity-20">
            {[0, 1, 2, 3].map(i => <div key={i} className="w-full border-t border-slate-400"></div>)}
          </div>

          {/* SVG Line and Area (Stretched) */}
          <svg className="absolute inset-0 w-full h-full px-2 py-4 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#10b981' : '#6366f1'} stopOpacity="0.3" />
                <stop offset="100%" stopColor={isPositive ? '#10b981' : '#6366f1'} stopOpacity="0" />
              </linearGradient>
            </defs>
            
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
            
            <path
              d={timelineData.map((d, i) => 
                `${i === 0 ? 'M' : 'L'} ${(i / (timelineData.length - 1)) * 100} ${100 - (d.count / maxTimelineCount) * 100}`
              ).join(' ')}
              fill="none"
              stroke={isPositive ? '#10b981' : '#6366f1'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-1000 ease-out drop-shadow-md"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* SVG Data Points (Not Stretched) */}
          <svg className="absolute inset-0 w-full h-full px-2 py-4 overflow-visible pointer-events-none">
            {range <= 31 && timelineData.map((d, i) => (
              <circle
                key={i}
                cx={`${(i / (timelineData.length - 1)) * 100}%`}
                cy={`${100 - (d.count / maxTimelineCount) * 100}%`}
                r="4"
                fill="white"
                stroke={isPositive ? '#10b981' : '#6366f1'}
                strokeWidth="2"
                className="transition-all duration-1000 ease-out"
              />
            ))}
          </svg>

          {/* Interaction Layer */}
          <div className="absolute inset-0 flex justify-between px-2 py-4">
            {timelineData.map((data, i) => (
              <div key={i} className="relative h-full flex flex-col items-center group" style={{ width: `${100 / timelineData.length}%` }}>
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-bold shadow-xl border border-white/10">
                  {data.count} 次{isPositive ? '记录' : '震感'} ({data.label})
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
                
                <div className="absolute inset-0 w-full h-full cursor-pointer"></div>
                
                {/* Label - Only show some for large ranges */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                  <span className={`text-[9px] font-bold text-slate-400 group-hover:${isPositive ? 'text-emerald-600' : 'text-indigo-600'} transition-colors ${
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
          <div className={`w-1.5 h-4 ${isPositive ? 'bg-amber-500' : 'bg-rose-500'} rounded-full`}></div>
          {isPositive ? '建设强度趋势 (加权)' : '地震强度趋势 (加权)'}
        </h3>
        
        <div className="relative h-40 w-full px-2">
          <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none opacity-20">
            {[0, 1, 2, 3].map(i => <div key={i} className="w-full border-t border-slate-400"></div>)}
          </div>

          {/* SVG Line and Area (Stretched) */}
          <svg className="absolute inset-0 w-full h-full px-2 py-4 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="intensityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#f59e0b' : '#f43f5e'} stopOpacity="0.3" />
                <stop offset="100%" stopColor={isPositive ? '#f59e0b' : '#f43f5e'} stopOpacity="0" />
              </linearGradient>
            </defs>
            
            <path
              d={`
                M 0 ${100 - (intensityData[0].intensitySum / maxIntensitySum) * 100}
                ${intensityData.map((d, i) => `L ${(i / (intensityData.length - 1)) * 100} ${100 - (d.intensitySum / maxIntensitySum) * 100}`).join(' ')}
                L 100 100 L 0 100 Z
              `}
              fill="url(#intensityGradient)"
              className="transition-all duration-1000 ease-out"
              vectorEffect="non-scaling-stroke"
            />
            
            <path
              d={intensityData.map((d, i) => 
                `${i === 0 ? 'M' : 'L'} ${(i / (intensityData.length - 1)) * 100} ${100 - (d.intensitySum / maxIntensitySum) * 100}`
              ).join(' ')}
              fill="none"
              stroke={isPositive ? '#f59e0b' : '#f43f5e'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-1000 ease-out drop-shadow-md"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* SVG Data Points (Not Stretched) */}
          <svg className="absolute inset-0 w-full h-full px-2 py-4 overflow-visible pointer-events-none">
            {range <= 31 && intensityData.map((d, i) => (
              <circle
                key={i}
                cx={`${(i / (intensityData.length - 1)) * 100}%`}
                cy={`${100 - (d.intensitySum / maxIntensitySum) * 100}%`}
                r="4"
                fill="white"
                stroke={isPositive ? '#f59e0b' : '#f43f5e'}
                strokeWidth="2"
                className="transition-all duration-1000 ease-out"
              />
            ))}
          </svg>

          {/* Interaction Layer */}
          <div className="absolute inset-0 flex justify-between px-2 py-4">
            {intensityData.map((data, i) => (
              <div key={i} className="relative h-full flex flex-col items-center group" style={{ width: `${100 / intensityData.length}%` }}>
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-bold shadow-xl border border-white/10">
                  强度值: {data.intensitySum} ({data.label})
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
                
                <div className="absolute inset-0 w-full h-full cursor-pointer"></div>
                
                {/* Label */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                  <span className={`text-[9px] font-bold text-slate-400 group-hover:${isPositive ? 'text-amber-600' : 'text-rose-600'} transition-colors ${
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

      {/* Tag Intensity Heatmap */}
      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
          <div className={`w-1.5 h-4 ${isPositive ? 'bg-orange-500' : 'bg-red-500'} rounded-full`}></div>
          {isPositive ? '建设贡献热力图' : '震感触发源热力图'} (Top 12)
        </h3>
        {tagHeatmapData.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {tagHeatmapData.map((data, index) => {
              const intensityRatio = data.totalIntensity / maxTagIntensity;
              return (
                <div key={data.tag} className="bg-white/60 rounded-xl p-3 flex flex-col gap-2 border border-white/50 relative overflow-hidden group">
                  <div 
                    className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${
                      isPositive ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-rose-400 to-red-600'
                    }`} 
                    style={{ width: `${intensityRatio * 100}%` }}
                  ></div>
                  <div className="flex justify-between items-start z-10">
                    <span className="text-xs font-black text-slate-700 truncate">#{data.tag}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${
                      isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {data.totalIntensity.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center z-10">
                     <span className="text-[10px] text-slate-400">平均强度: {(7 - data.avgIntensity).toFixed(1)}</span>
                     <span className="text-[10px] text-slate-400">{data.count}次</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-slate-400">暂无足够数据生成热力图</p>
          </div>
        )}
      </div>

      {/* Circadian Sovereignty Distribution (Golden Cycle) */}
      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
          <div className={`w-1.5 h-4 ${isPositive ? 'bg-purple-500' : 'bg-slate-800'} rounded-full`}></div>
          黄金周期分布 (24H)
        </h3>
        <div className="relative w-full aspect-square max-w-[300px] mx-auto">
          {/* Clock Face Background */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-100 bg-white/30 backdrop-blur-sm shadow-inner">
             {/* Hour Markers */}
             {[0, 3, 6, 9, 12, 15, 18, 21].map(hour => {
               const angle = (hour / 24) * 360 - 90;
               const radius = 50; // percentage
               const x = 50 + radius * 0.85 * Math.cos(angle * Math.PI / 180);
               const y = 50 + radius * 0.85 * Math.sin(angle * Math.PI / 180);
               return (
                 <div 
                   key={hour} 
                   className="absolute text-[10px] font-bold text-slate-400 transform -translate-x-1/2 -translate-y-1/2"
                   style={{ left: `${x}%`, top: `${y}%` }}
                 >
                   {hour}:00
                 </div>
               );
             })}
          </div>
          
          {/* Radar/Pie Segments */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90 overflow-visible">
            {circadianData.map((count, hour) => {
               if (count === 0) return null;
               const angleSlice = (2 * Math.PI) / 24;
               const startAngle = hour * angleSlice;
               const endAngle = (hour + 1) * angleSlice;
               const innerRadius = 20; // Center hole percentage
               const maxRadius = 45;   // Max reach percentage
               const valueRadius = innerRadius + (count / maxCircadianCount) * (maxRadius - innerRadius);
               
               // Calculate path coordinates
               const x1 = 50 + innerRadius * Math.cos(startAngle);
               const y1 = 50 + innerRadius * Math.sin(startAngle);
               const x2 = 50 + valueRadius * Math.cos(startAngle);
               const y2 = 50 + valueRadius * Math.sin(startAngle);
               const x3 = 50 + valueRadius * Math.cos(endAngle);
               const y3 = 50 + valueRadius * Math.sin(endAngle);
               const x4 = 50 + innerRadius * Math.cos(endAngle);
               const y4 = 50 + innerRadius * Math.sin(endAngle);

               return (
                 <path
                   key={hour}
                   d={`M ${x1} ${y1} L ${x2} ${y2} A ${valueRadius} ${valueRadius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1} Z`}
                   fill={isPositive ? '#10b981' : '#f43f5e'}
                   fillOpacity={0.2 + (count / maxCircadianCount) * 0.6}
                   stroke="white"
                   strokeWidth="0.5"
                   className="transition-all duration-700 hover:opacity-100 cursor-pointer"
                 >
                   <title>{hour}:00 - {hour}:59 : {count}次</title>
                 </path>
               );
            })}
            
            {/* Center Label */}
            <circle cx="50" cy="50" r="18" fill="white" className="shadow-sm" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="text-center">
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">高峰</div>
               <div className={`text-xl font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                 {circadianData.indexOf(maxCircadianCount)}:00
               </div>
             </div>
          </div>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-4">
          * 颜色越深代表该时段发生的{isPositive ? '建设' : '震感'}频率越高，用于发现您的“主权沦陷”规律
        </p>
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
