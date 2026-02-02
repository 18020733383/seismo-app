import React, { useState, useMemo } from 'react';
import { SeismicLog, LevelConfig, PositiveLevelConfig, IntensityLevel, LogType } from '../types';

interface Props {
  logs: SeismicLog[];
  onDelete: (id: string) => void;
  onUpdate: (log: SeismicLog) => void;
}

export const HistoryList: React.FC<Props> = ({ logs, onDelete, onUpdate }) => {
  const [filterLevel, setFilterLevel] = useState<IntensityLevel | 'all'>('all');
  const [filterType, setFilterType] = useState<LogType | 'all'>('all');
  const [editingLog, setEditingLog] = useState<SeismicLog | null>(null);
  const [editIntensity, setEditIntensity] = useState<IntensityLevel>(IntensityLevel.Level6);
  const [editType, setEditType] = useState<LogType>('negative');
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
        const matchLevel = filterLevel === 'all' || log.intensity === filterLevel;
        const matchType = filterType === 'all' || (log.type || 'negative') === filterType;
        return matchLevel && matchType;
    });
  }, [logs, filterLevel, filterType]);

  const openEdit = (log: SeismicLog) => {
    setEditingLog(log);
    setEditIntensity(log.intensity);
    setEditType(log.type || 'negative');
    setEditContent(log.content || '');
    setEditError(null);
  };

  const closeEdit = () => {
    if (isSavingEdit) return;
    setEditingLog(null);
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editingLog) return;
    setIsSavingEdit(true);
    setEditError(null);
    try {
      await onUpdate({
        ...editingLog,
        intensity: editIntensity,
        type: editType,
        content: editContent,
      });
      setEditingLog(null);
      setEditError(null);
    } catch (e: any) {
      setEditError(e?.message || '保存失败');
    } finally {
      setIsSavingEdit(false);
    }
  };

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
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 sm:items-center sm:pb-0">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-slate-800">编辑观测日志</div>
                  <div className="mt-1 text-[11px] font-bold text-slate-400">
                    {new Date(editingLog.timestamp).toLocaleString('zh-CN')}
                  </div>
                </div>
                <button
                  onClick={closeEdit}
                  disabled={isSavingEdit}
                  className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none px-2 disabled:opacity-50"
                >
                  &times;
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">性质</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditType('negative')}
                      className={`flex-1 py-2.5 rounded-2xl text-xs font-black transition-all ${
                        editType === 'negative' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}
                    >
                      📉 震感
                    </button>
                    <button
                      onClick={() => setEditType('positive')}
                      className={`flex-1 py-2.5 rounded-2xl text-xs font-black transition-all ${
                        editType === 'positive' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}
                    >
                      🏗️ 建设
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">等级</div>
                  <select
                    value={editIntensity}
                    onChange={(e) => setEditIntensity(Number(e.target.value) as IntensityLevel)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-bold appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(level => (
                      <option key={level} value={level}>L{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">内容</div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-medium resize-none"
                  />
                </div>

                {editError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold">
                    {editError}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                onClick={closeEdit}
                disabled={isSavingEdit}
                className="flex-1 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-sm disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={saveEdit}
                disabled={isSavingEdit}
                className="flex-1 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm shadow-lg disabled:opacity-60"
              >
                {isSavingEdit ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between ml-2 pr-2">
            <h3 className="text-gray-500 font-bold flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
              观测日志 (Logs)
            </h3>
            
            <div className="flex gap-2">
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as LogType | 'all')}
                  className="bg-white/50 border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-black text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer pr-6 relative"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.2rem center',
                    backgroundSize: '0.8rem'
                  }}
                >
                  <option value="all">全部类型</option>
                  <option value="negative">📉 震感</option>
                  <option value="positive">🏗️ 建设</option>
                </select>

                <select 
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value === 'all' ? 'all' : Number(e.target.value) as IntensityLevel)}
                  className="bg-white/50 border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-black text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer pr-6 relative"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.2rem center',
                    backgroundSize: '0.8rem'
                  }}
                >
                  <option value="all">全部等级</option>
                  {[6, 5, 4, 3, 2, 1].map(level => (
                    <option key={level} value={level}>L{level}</option>
                  ))}
                </select>
            </div>
          </div>
      </div>

      <div className="space-y-6">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const isPositive = log.type === 'positive';
            const config = isPositive ? PositiveLevelConfig[log.intensity] : LevelConfig[log.intensity];
            
            return (
              <div key={log.id} className="relative pl-6 group animate-in fade-in slide-in-from-left-4 duration-500">
                {/* Timeline Line */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200/50 group-last:h-1/2"></div>
                
                {/* Timeline Dot */}
                <div className={`absolute left-[-5px] top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm ${config.color}`}></div>

                <div className={`glass-panel rounded-2xl p-5 relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] ${isPositive ? 'bg-gradient-to-br from-white to-slate-50' : ''}`}>
                   {/* Decorative colored strip */}
                   <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.color} opacity-80`}></div>

                   <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded text-white ${config.color}`}>
                                  L{log.intensity}
                              </span>
                              <span className={`text-sm font-black ${config.textColor}`}>
                                  {isPositive ? '🏗️' : '📉'} 【{config.alertName}】
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
                          onClick={() => openEdit(log)}
                          className="text-slate-300 hover:text-slate-600 transition-colors text-sm leading-none px-2"
                      >
                          ✎
                      </button>
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
          })
        ) : (
          <div className="text-center py-20 opacity-40">
            <p className="text-xs font-bold text-slate-400">该等级下暂无观测记录</p>
          </div>
        )}
      </div>
    </div>
  );
};
