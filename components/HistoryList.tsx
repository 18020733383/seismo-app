import React from 'react';
import { SeismicLog, LevelConfig } from '../types';

interface Props {
  logs: SeismicLog[];
  onDelete: (id: string) => void;
}

export const HistoryList: React.FC<Props> = ({ logs, onDelete }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10">
        <p>地壳暂无异常。</p>
        <p className="text-xs mt-2">No seismic activity recorded.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 pb-20 pt-8">
      <h3 className="text-gray-500 font-bold mb-6 ml-2 flex items-center gap-2">
        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
        观测日志 (Seismic Logs)
      </h3>
      <div className="space-y-6">
        {logs.map((log) => {
          const config = LevelConfig[log.intensity];
          return (
            <div key={log.id} className="relative pl-6 group animate-in fade-in slide-in-from-left-4 duration-500">
              {/* Timeline Line */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200/50 group-last:h-1/2"></div>
              
              {/* Timeline Dot */}
              <div className={`absolute left-[-5px] top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm ${config.color}`}></div>

              <div className="glass-panel rounded-2xl p-5 relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]">
                 {/* Decorative colored strip */}
                 <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.color} opacity-80`}></div>

                 <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded text-white ${config.color}`}>
                                L{log.intensity}
                            </span>
                            <span className={`text-sm font-black ${config.textColor}`}>
                              【{config.alertName}】
                            </span>
                            {log.isAftershock && (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    余震/反刍
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 font-medium">
                            {new Date(log.timestamp).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <button 
                        onClick={() => onDelete(log.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none px-2"
                    >
                        &times;
                    </button>
                 </div>
                 
                 <div className="pl-2">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed font-medium">
                        {log.content}
                    </p>
                    
                    {log.tags && log.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 mb-1">
                        {log.tags.map(tag => (
                          <span key={tag} className="text-[9px] font-bold text-blue-500 bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/30">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 mt-3 border-t border-slate-100 pt-2 italic">
                      核心定义：{config.coreDefinition}
                    </p>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
