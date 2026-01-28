import React, { useState } from 'react';
import { SeismicLog } from '../types';

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
    </div>
  );
};
