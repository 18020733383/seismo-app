import React, { useState, useEffect } from 'react';

interface GeminiConfig {
  apiKey: string;
  model: string;
}

interface SummaryData {
  rangeLabel: string;
  title: string;
  subtitle: string;
  generatedAt: string;
  stats: {
    total: number;
    positive: number;
    negative: number;
    avgIntensity: string;
    focusTag: string;
    stabilityIndex: number;
  };
  seats: { name: string; value: number; color: string }[];
  highlights: string[];
}

const MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

const Settings: React.FC = () => {
  const [config, setConfig] = useState<GeminiConfig>({
    apiKey: '',
    model: 'gemini-2.0-flash-exp',
  });
  const [isSaved, setIsSaved] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('gemini_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load config', e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('gemini_config', JSON.stringify(config));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const buildSeats = () => {
    const groups = [
      { name: '稳健派', color: 'bg-emerald-500' },
      { name: '进取派', color: 'bg-indigo-500' },
      { name: '民生派', color: 'bg-amber-500' },
      { name: '安全派', color: 'bg-rose-500' },
      { name: '科技派', color: 'bg-sky-500' },
    ];
    const weights = groups.map(() => Math.random());
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const raw = weights.map(w => Math.max(5, Math.round((w / totalWeight) * 100)));
    let diff = 100 - raw.reduce((sum, v) => sum + v, 0);
    const adjusted = [...raw];
    while (diff !== 0) {
      const index = randomInt(0, adjusted.length - 1);
      if (diff > 0) {
        adjusted[index] += 1;
        diff -= 1;
      } else if (adjusted[index] > 5) {
        adjusted[index] -= 1;
        diff += 1;
      }
    }
    return groups.map((g, i) => ({
      name: g.name,
      value: adjusted[i],
      color: g.color,
    }));
  };

  const generateSummary = (range: 'month' | 'week') => {
    setIsGenerating(true);
    const total = range === 'month' ? randomInt(40, 180) : randomInt(12, 70);
    const positive = Math.round(total * (0.35 + Math.random() * 0.4));
    const negative = total - positive;
    const avgIntensity = (1.8 + Math.random() * 3.6).toFixed(1);
    const tags = ['睡眠', '运动', '工作', '亲密关系', '饮食', '专注', '社交', '创造'];
    const focusTag = tags[randomInt(0, tags.length - 1)];
    const stabilityIndex = randomInt(55, 92);
    const highlights = [
      `正向记录占比 ${Math.round((positive / total) * 100)}%，情绪修复能力保持稳定`,
      `核心关注集中在“${focusTag}”，建议延续该策略`,
      `高强度波动日为 ${randomInt(1, 5)} 天，恢复速度良好`,
    ];
    const now = new Date();
    const rangeLabel = range === 'month'
      ? `${now.getFullYear()}年${now.getMonth() + 1}月`
      : `${now.getFullYear()}年 第${Math.ceil(now.getDate() / 7)}周`;
    setTimeout(() => {
      setSummary({
        rangeLabel,
        title: range === 'month' ? '国家主权安全与发展月度白皮书' : '国家主权安全与发展周度白皮书',
        subtitle: 'Seismo-Mind 白皮书试运行版本',
        generatedAt: now.toLocaleString('zh-CN'),
        stats: {
          total,
          positive,
          negative,
          avgIntensity,
          focusTag,
          stabilityIndex,
        },
        seats: buildSeats(),
        highlights,
      });
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-20 px-4">
      <div className="pt-8 pb-4">
        <h2 className="text-2xl font-black text-slate-800">设置</h2>
        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">App Settings & AI Configuration</p>
      </div>

      <div className="glass-panel p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
            Gemini AI 配置
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">API Key</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="输入你的 Gemini API Key"
                className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">模型选择</label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm font-medium appearance-none"
              >
                {MODELS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 ${
            isSaved ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          {isSaved ? '已保存配置' : '保存设置'}
        </button>
      </div>

    </div>
  );
};

export default Settings;
