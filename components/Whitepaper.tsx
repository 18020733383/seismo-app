import React, { useEffect, useMemo, useState } from 'react';
import { PeriodFile, PeriodFileEntry, PeriodFileStatus, SeismicLog } from '../types';

interface WhitepaperProps {
  logs: SeismicLog[];
}

interface Indicator {
  name: string;
  score: number;
  reason: string;
}

interface NationalReport {
  title: string;
  generatedAt: string;
  metrics: {
    gdp: string;
    inflation: string;
    stability: number;
    happiness: number;
  };
  indicators: {
    [key: string]: Indicator;
  };
  parliament: {
    rulingParty: string;
    opposition: string;
    recentScandals: string[];
  };
  residents: {
    brain: string;
    heart: string;
    liver: string;
    limbs?: string;
    stomach?: string;
  };
  strategicOutlook: string[];
  roast: string;
}

export const Whitepaper: React.FC<WhitepaperProps> = ({ logs }) => {
  const [report, setReport] = useState<NationalReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [periodFiles, setPeriodFiles] = useState<PeriodFile[]>([]);
  const [isLoadingPeriodFiles, setIsLoadingPeriodFiles] = useState(false);
  const [periodFilesError, setPeriodFilesError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createStart, setCreateStart] = useState('');
  const [createEnd, setCreateEnd] = useState('');
  const [createStatus, setCreateStatus] = useState<PeriodFileStatus>('in_progress');
  const [createDescription, setCreateDescription] = useState('');

  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const activeFile = useMemo(
    () => (activeFileId ? periodFiles.find(f => f.id === activeFileId) || null : null),
    [activeFileId, periodFiles]
  );
  const [activeDraft, setActiveDraft] = useState<PeriodFile | null>(null);
  const [isSavingActive, setIsSavingActive] = useState(false);

  const [entryAt, setEntryAt] = useState('');
  const [entrySubjective, setEntrySubjective] = useState('');
  const [entryObjective, setEntryObjective] = useState('');
  const [entryLogIds, setEntryLogIds] = useState<string[]>([]);
  const [showLogPicker, setShowLogPicker] = useState(false);

  const genId = () => Math.random().toString(36).slice(2, 10);

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const toLocalInputValue = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };
  const formatDateRange = (startTs: number, endTs: number | null) => {
    const s = new Date(startTs).toLocaleDateString('zh-CN');
    if (!endTs) return `${s} - 至今`;
    const e = new Date(endTs).toLocaleDateString('zh-CN');
    return `${s} - ${e}`;
  };

  const STATUS_META: Record<PeriodFileStatus, { label: string; badge: string }> = {
    not_started: { label: '未开始', badge: 'bg-slate-100 text-slate-600 border border-slate-200' },
    in_progress: { label: '进行中', badge: 'bg-blue-50 text-blue-700 border border-blue-200' },
    done: { label: '完成', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    archived: { label: '存档', badge: 'bg-slate-50 text-slate-500 border border-slate-200' },
  };

  useEffect(() => {
    const load = async () => {
      setIsLoadingPeriodFiles(true);
      setPeriodFilesError(null);
      try {
        const res = await fetch(`/api/period-files${showArchived ? '?includeArchived=1' : ''}`);
        if (!res.ok) throw new Error('加载时期文件失败');
        const data = (await res.json()) as PeriodFile[];
        setPeriodFiles(Array.isArray(data) ? data : []);
        localStorage.setItem('period_files_v1', JSON.stringify(Array.isArray(data) ? data : []));
      } catch (e: any) {
        const local = localStorage.getItem('period_files_v1');
        if (local) {
          try {
            const data = JSON.parse(local) as PeriodFile[];
            setPeriodFiles(Array.isArray(data) ? data : []);
          } catch {
            setPeriodFiles([]);
          }
        }
        setPeriodFilesError(e?.message || '加载失败');
      } finally {
        setIsLoadingPeriodFiles(false);
      }
    };
    load();
  }, [showArchived]);

  useEffect(() => {
    if (!activeFile) {
      setActiveDraft(null);
      return;
    }
    setActiveDraft(activeFile);
    setEntryAt(toLocalInputValue(Date.now()));
    setEntrySubjective('');
    setEntryObjective('');
    setEntryLogIds([]);
    setShowLogPicker(false);
  }, [activeFileId]);

  const candidateLogs = useMemo(() => {
    if (!activeDraft) return [];
    const end = activeDraft.endTs ?? Date.now();
    const filtered = logs
      .filter(l => l.timestamp >= activeDraft.startTs && l.timestamp <= end)
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp);
    return filtered.slice(0, 20);
  }, [activeDraft, logs]);

  const saveActiveDraft = async (next: PeriodFile) => {
    setIsSavingActive(true);
    try {
      const res = await fetch(`/api/period-files/${next.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error('保存失败');
      const updated = (await res.json()) as PeriodFile;
      setPeriodFiles(prev => {
        const list = prev.map(p => (p.id === updated.id ? updated : p));
        localStorage.setItem('period_files_v1', JSON.stringify(list));
        return list;
      });
      setActiveDraft(updated);
      if (!showArchived && updated.status === 'archived') {
        setActiveFileId(null);
        setPeriodFiles(prev => {
          const list = prev.filter(p => p.id !== updated.id);
          localStorage.setItem('period_files_v1', JSON.stringify(list));
          return list;
        });
      }
    } catch (e: any) {
      setPeriodFilesError(e?.message || '保存失败');
    } finally {
      setIsSavingActive(false);
    }
  };

  const handleCreate = async () => {
    const title = createTitle.trim();
    const startTs = createStart ? new Date(createStart).getTime() : 0;
    const endTs = createEnd ? new Date(createEnd).getTime() : null;
    if (!title || !startTs) {
      setPeriodFilesError('请填写标题与开始时间');
      return;
    }
    const payload: PeriodFile = {
      id: genId(),
      title,
      startTs,
      endTs,
      status: createStatus,
      description: createDescription,
      entries: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    try {
      const res = await fetch('/api/period-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('创建失败');
      const created = (await res.json()) as PeriodFile;
      setPeriodFiles(prev => {
        const list = [created, ...prev];
        localStorage.setItem('period_files_v1', JSON.stringify(list));
        return list;
      });
      setIsCreatingFile(false);
      setCreateTitle('');
      setCreateStart('');
      setCreateEnd('');
      setCreateDescription('');
      setCreateStatus('in_progress');
      setActiveFileId(created.id);
    } catch (e: any) {
      setPeriodFilesError(e?.message || '创建失败');
    }
  };

  const handleAddEntry = async () => {
    if (!activeDraft) return;
    const ts = entryAt ? new Date(entryAt).getTime() : 0;
    if (!ts || !entrySubjective.trim() || !entryObjective.trim()) {
      setPeriodFilesError('请填写时间、主观情绪与客观背景');
      return;
    }
    const nextEntry: PeriodFileEntry = {
      id: genId(),
      timestamp: ts,
      subjective: entrySubjective.trim(),
      objective: entryObjective.trim(),
      logIds: entryLogIds,
    };
    const next: PeriodFile = {
      ...activeDraft,
      entries: [...(activeDraft.entries || []), nextEntry].sort((a, b) => a.timestamp - b.timestamp),
      updatedAt: Date.now(),
    };
    await saveActiveDraft(next);
    setEntryAt(toLocalInputValue(Date.now()));
    setEntrySubjective('');
    setEntryObjective('');
    setEntryLogIds([]);
    setShowLogPicker(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '生成报告失败');
      }

      const data = await res.json();
      setReport({
        ...data,
        generatedAt: new Date().toLocaleString('zh-CN')
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="pb-24 px-4 pt-8 min-h-screen bg-slate-50">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800">国力分析报告</h2>
        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">National Status Whitepaper</p>
      </div>

      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-3xl shadow-lg border border-white/50 bg-white/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-800">国家时期文件</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Timeline Files · 主观情绪 + 客观背景
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowArchived(v => !v)}
                className="px-3 py-2 rounded-2xl bg-white/70 border border-slate-200 text-[11px] font-black text-slate-700 hover:bg-white transition-all"
              >
                {showArchived ? '隐藏存档' : '显示存档'}
              </button>
              <button
                onClick={() => {
                  setPeriodFilesError(null);
                  setIsCreatingFile(true);
                  setCreateStart(toLocalInputValue(Date.now()));
                  setCreateEnd('');
                }}
                className="px-3 py-2 rounded-2xl bg-slate-900 text-white text-[11px] font-black shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
              >
                ＋ 新增文件
              </button>
            </div>
          </div>

          {periodFilesError && (
            <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold">
              ⚠️ {periodFilesError}
            </div>
          )}

          {isLoadingPeriodFiles ? (
            <div className="flex justify-center py-6">
              <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : periodFiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm font-bold text-slate-500">还没有时期文件</p>
              <p className="text-[10px] text-slate-400 mt-1">用来记录“某段时间发生了什么”，并串起情绪时间线</p>
            </div>
          ) : (
            <div className="space-y-3">
              {periodFiles
                .filter(f => (showArchived ? true : f.status !== 'archived'))
                .map(f => {
                  const meta = STATUS_META[f.status];
                  return (
                    <button
                      key={f.id}
                      onClick={() => setActiveFileId(f.id)}
                      className="w-full text-left bg-white/70 border border-slate-100 rounded-2xl p-4 hover:bg-white transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-slate-800 truncate">{f.title}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
                          </div>
                          <div className="mt-1 text-[11px] font-bold text-slate-500">
                            {formatDateRange(f.startTs, f.endTs)}
                            <span className="mx-2 text-slate-300">·</span>
                            {f.entries?.length || 0} 条记录
                          </div>
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-0.5">
                          打开
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Action Area */}
        <div className="glass-panel p-6 rounded-3xl shadow-lg border border-white/50 bg-white/60">
          <p className="text-sm text-slate-600 mb-4 font-medium leading-relaxed">
            本模块将您的心理活动映射为“国家政治”，生成一份包含经济指标、议会斗争和民生疾苦的深度报告。
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>正在编制国情咨文...</span>
                </>
              ) : (
                <>
                  <span>📊</span>
                  <span>生成国力分析报告 (Gemini)</span>
                </>
              )}
            </button>
            
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold">
                ⚠️ {error}
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-3 text-center">
            * 报告将基于最近 100 条震动日志由 Gemini AI 深度分析生成
          </p>
        </div>

        {/* Report Display */}
        {report && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="text-center mb-8 relative">
              <div className="inline-block border-b-4 border-slate-800 pb-2 mb-2">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">{report.title}</h1>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">绝密 · TOP SECRET</p>
              <p className="text-[10px] text-slate-400 mt-1">生成时间：{report.generatedAt}</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">多巴胺 GDP</p>
                <p className="text-xl font-black text-emerald-600">{report.metrics.gdp}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">情绪通胀率</p>
                <p className="text-xl font-black text-rose-600">{report.metrics.inflation}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">社会稳定指数</p>
                <div className="flex items-end gap-2">
                  <p className="text-xl font-black text-slate-800">{report.metrics.stability}</p>
                  <span className="text-[10px] font-bold text-slate-400 mb-1">/ 100</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">国民幸福度</p>
                <div className="flex items-end gap-2">
                  <p className="text-xl font-black text-slate-800">{report.metrics.happiness}</p>
                  <span className="text-[10px] font-bold text-slate-400 mb-1">/ 100</span>
                </div>
              </div>
            </div>

            {/* Detailed Indicators */}
            <div className="mb-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-xl">📊</span> 核心指标评分
              </h3>
              <div className="space-y-4">
                {Object.values(report.indicators).map((indicator, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-slate-700">{indicator.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              indicator.score >= 80 ? 'bg-emerald-500' : 
                              indicator.score >= 60 ? 'bg-blue-500' : 
                              indicator.score >= 40 ? 'bg-yellow-500' : 'bg-rose-500'
                            }`} 
                            style={{ width: `${indicator.score}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-black ${
                          indicator.score >= 80 ? 'text-emerald-600' : 
                          indicator.score >= 60 ? 'text-blue-600' : 
                          indicator.score >= 40 ? 'text-yellow-600' : 'text-rose-600'
                        }`}>{indicator.score}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {indicator.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Parliament Section */}
            <div className="mb-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 4l6 14H6l6-14z"/></svg>
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-xl">🏛️</span> 议会风云
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-500">执政党</span>
                  <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{report.parliament.rulingParty}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-500">最大反对党</span>
                  <span className="text-sm font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full">{report.parliament.opposition}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-2">近期政治丑闻</span>
                  <ul className="space-y-2">
                    {report.parliament.recentScandals.map((s, i) => (
                      <li key={i} className="text-xs font-medium text-slate-700 flex gap-2">
                        <span className="text-rose-500">⚠️</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Residents Section */}
            <div className="mb-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-xl">🗣️</span> 居民之声
              </h3>
              <div className="grid gap-4">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🧠</span>
                    <span className="text-xs font-black text-slate-700">总统府 (大脑)</span>
                  </div>
                  <p className="text-xs text-slate-600 italic">"{report.residents.brain}"</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🫀</span>
                    <span className="text-xs font-black text-slate-700">动力核心 (心脏)</span>
                  </div>
                  <p className="text-xs text-slate-600 italic">"{report.residents.heart}"</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🧪</span>
                    <span className="text-xs font-black text-slate-700">化工厂 (肝脏)</span>
                  </div>
                  <p className="text-xs text-slate-600 italic">"{report.residents.liver}"</p>
                </div>
              </div>
            </div>

            {/* Strategy Section */}
            <div className="mb-6 bg-slate-900 rounded-3xl p-6 shadow-lg text-white">
              <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <span className="text-xl">🚀</span> 战略展望
              </h3>
              <ul className="space-y-3">
                {report.strategicOutlook.map((item, i) => (
                  <li key={i} className="flex gap-3 items-start text-sm font-medium text-slate-300">
                    <span className="text-emerald-400 font-bold">0{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Roast Section */}
            <div className="bg-amber-50 rounded-3xl p-6 shadow-md border-2 border-amber-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 rotate-12">
                <span className="text-6xl">🔥</span>
              </div>
              <h3 className="text-lg font-black text-amber-800 mb-4 flex items-center gap-2">
                <span className="text-xl">🌶️</span> AI 深度吐槽
              </h3>
              <div className="relative">
                <span className="absolute -top-2 -left-2 text-4xl text-amber-200 opacity-50">“</span>
                <p className="text-sm font-bold text-amber-900 leading-relaxed px-4 py-2 italic relative z-10">
                  {report.roast}
                </p>
                <span className="absolute -bottom-2 -right-2 text-4xl text-amber-200 opacity-50">”</span>
              </div>
            </div>
            
            <div className="mt-8 text-center">
               <div className="inline-block px-4 py-2 rounded-full bg-slate-100 text-[10px] font-bold text-slate-400">
                  以上内容由 Gemini AI 结合您的心理数据深度分析生成，仅供参考
               </div>
            </div>
          </div>
        )}
      </div>

      {isCreatingFile && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-3">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-slate-800">新增时期文件</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  描述一段时间发生了什么
                </div>
              </div>
              <button
                onClick={() => setIsCreatingFile(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-black hover:bg-slate-200 transition-all"
              >
                关闭
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">标题</div>
                <input
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="例如：项目冲刺期 / 搬家周 / 情绪修复期"
                  className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">开始时间</div>
                  <input
                    type="datetime-local"
                    value={createStart}
                    onChange={(e) => setCreateStart(e.target.value)}
                    className="w-full px-3 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-xs font-bold"
                  />
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">结束时间</div>
                  <input
                    type="datetime-local"
                    value={createEnd}
                    onChange={(e) => setCreateEnd(e.target.value)}
                    className="w-full px-3 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-xs font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">标记</div>
                  <select
                    value={createStatus}
                    onChange={(e) => setCreateStatus(e.target.value as PeriodFileStatus)}
                    className="w-full px-3 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-xs font-bold appearance-none"
                  >
                    <option value="not_started">未开始</option>
                    <option value="in_progress">进行中</option>
                    <option value="done">完成</option>
                    <option value="archived">存档（隐藏）</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleCreate}
                    className="w-full py-3 rounded-2xl bg-slate-900 text-white font-black text-xs shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
                  >
                    创建文件
                  </button>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">摘要（可选）</div>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="这段时间的主线事件、压力源、目标…"
                  className="w-full h-24 px-4 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm font-medium resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeDraft && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-3">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-800 truncate">{activeDraft.title}</div>
                <div className="text-[10px] font-bold text-slate-400 mt-1">
                  {formatDateRange(activeDraft.startTs, activeDraft.endTs)}
                </div>
              </div>
              <button
                onClick={() => setActiveFileId(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-black hover:bg-slate-200 transition-all"
              >
                关闭
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[78vh] overflow-auto">
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">标题</div>
                  <input
                    value={activeDraft.title}
                    onChange={(e) => setActiveDraft({ ...activeDraft, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">开始时间</div>
                    <input
                      type="datetime-local"
                      value={toLocalInputValue(activeDraft.startTs)}
                      onChange={(e) => setActiveDraft({ ...activeDraft, startTs: new Date(e.target.value).getTime() })}
                      className="w-full px-3 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-xs font-bold"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">结束时间</div>
                    <input
                      type="datetime-local"
                      value={activeDraft.endTs ? toLocalInputValue(activeDraft.endTs) : ''}
                      onChange={(e) => setActiveDraft({ ...activeDraft, endTs: e.target.value ? new Date(e.target.value).getTime() : null })}
                      className="w-full px-3 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-xs font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">标记</div>
                    <select
                      value={activeDraft.status}
                      onChange={(e) => setActiveDraft({ ...activeDraft, status: e.target.value as PeriodFileStatus })}
                      className="w-full px-3 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-xs font-bold appearance-none"
                    >
                      <option value="not_started">未开始</option>
                      <option value="in_progress">进行中</option>
                      <option value="done">完成</option>
                      <option value="archived">存档（隐藏）</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => saveActiveDraft({ ...activeDraft, updatedAt: Date.now() })}
                      disabled={isSavingActive}
                      className="w-full py-3 rounded-2xl bg-slate-900 text-white font-black text-xs shadow-lg shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-60"
                    >
                      {isSavingActive ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">摘要</div>
                  <textarea
                    value={activeDraft.description || ''}
                    onChange={(e) => setActiveDraft({ ...activeDraft, description: e.target.value })}
                    className="w-full h-24 px-4 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm font-medium resize-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-black text-slate-800">情绪时间线</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      主观情绪 / 客观背景 / 关联日志
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-slate-400">
                    {activeDraft.entries?.length || 0} 条
                  </div>
                </div>

                {activeDraft.entries?.length ? (
                  <div className="space-y-2 mb-4">
                    {activeDraft.entries
                      .slice()
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((en) => (
                        <div key={en.id} className="bg-white rounded-2xl p-3 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <div className="text-[11px] font-black text-slate-700">
                              {new Date(en.timestamp).toLocaleString('zh-CN')}
                            </div>
                            <div className="text-[10px] font-black text-slate-400">
                              {en.logIds?.length ? `${en.logIds.length} 条日志` : '无关联'}
                            </div>
                          </div>
                          <div className="mt-2 space-y-1">
                            <div className="text-xs font-bold text-slate-800">{en.subjective}</div>
                            <div className="text-[11px] font-medium text-slate-600">{en.objective}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 mb-3">
                    <div className="text-xs font-bold text-slate-500">还没有时间线记录</div>
                    <div className="text-[10px] text-slate-400 mt-1">先加一条：当时感觉如何 + 当时发生了什么</div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1">时间</div>
                      <input
                        type="datetime-local"
                        value={entryAt}
                        onChange={(e) => setEntryAt(e.target.value)}
                        className="w-full px-3 py-3 rounded-2xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-xs font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">主观情绪</div>
                    <input
                      value={entrySubjective}
                      onChange={(e) => setEntrySubjective(e.target.value)}
                      placeholder="例如：焦虑/兴奋/麻木/心流/委屈…"
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm font-medium"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">客观背景</div>
                    <input
                      value={entryObjective}
                      onChange={(e) => setEntryObjective(e.target.value)}
                      placeholder="例如：开会被质疑/熬夜赶工/和朋友见面/身体不舒服…"
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setShowLogPicker(v => !v)}
                      className="px-3 py-2 rounded-2xl bg-white border border-slate-200 text-[11px] font-black text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      {showLogPicker ? '收起日志选择' : `关联日志（${entryLogIds.length}）`}
                    </button>
                    <button
                      onClick={handleAddEntry}
                      disabled={isSavingActive}
                      className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-[11px] font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-60"
                    >
                      添加记录
                    </button>
                  </div>

                  {showLogPicker && (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="px-3 py-2 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        范围内最近 20 条日志
                      </div>
                      <div className="max-h-48 overflow-auto divide-y divide-slate-100">
                        {candidateLogs.length === 0 ? (
                          <div className="p-3 text-xs font-bold text-slate-500">该时间范围内暂无日志</div>
                        ) : (
                          candidateLogs.map(l => {
                            const checked = entryLogIds.includes(l.id);
                            return (
                              <label key={l.id} className="flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    setEntryLogIds(prev => (checked ? prev.filter(x => x !== l.id) : [...prev, l.id]))
                                  }
                                  className="mt-0.5 w-4 h-4"
                                />
                                <div className="min-w-0">
                                  <div className="text-[11px] font-black text-slate-700">
                                    {new Date(l.timestamp).toLocaleString('zh-CN')}
                                  </div>
                                  <div className="text-[11px] font-medium text-slate-600 truncate">
                                    {l.content}
                                  </div>
                                  {l.tags?.length ? (
                                    <div className="mt-1 text-[10px] font-bold text-slate-400 truncate">
                                      #{l.tags.join(' #')}
                                    </div>
                                  ) : null}
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
