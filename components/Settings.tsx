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
  'google-ai-studio/gemini-2.0-flash',
  'google-ai-studio/gemini-1.5-flash',
  'google-ai-studio/gemini-1.5-pro',
];

const Settings: React.FC = () => {
  const [config, setConfig] = useState<GeminiConfig>({
    apiKey: '',
    model: 'google-ai-studio/gemini-1.5-flash',
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>(MODELS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 优先从 D1 加载配置
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config/gemini');
        if (res.ok) {
          const data = await res.json();
          if (data.hasKey) {
            setConfig({
              apiKey: data.apiKey, // 这是脱敏后的 key，仅用于显示
              model: data.model || 'google-ai-studio/gemini-1.5-flash'
            });
          }
        }
      } catch (e) {
        console.error('Failed to load config from D1', e);
      }
    };
    loadConfig();
  }, []);

  const fetchModels = async () => {
    if (!config.apiKey) {
      setError('请先输入 API Key');
      return;
    }
    
    setIsFetchingModels(true);
    setError(null);
    try {
      // 如果 key 包含 ... 说明是脱敏后的，不传给后端，后端会自动从 D1 取
      const queryParam = config.apiKey.includes('...') ? '' : `?apiKey=${config.apiKey}`;
      const res = await fetch(`/api/gemini/models${queryParam}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '获取模型列表失败');
      }
      const models = await res.json();
      const modelNames = models.map((m: any) => m.name);
      setAvailableModels(modelNames);
      if (modelNames.length > 0 && !modelNames.includes(config.model)) {
        setConfig(prev => ({ ...prev, model: modelNames[0] }));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSave = async () => {
    if (!config.apiKey || !config.model) {
      setError('请输入 API Key 并选择模型');
      return;
    }

    // 如果 key 包含 ... 说明没改过，不需要重复保存（或者后端处理）
    // 但为了保险，如果用户改了 key，我们就保存
    if (config.apiKey.includes('...')) {
      // 这种情况下只更新模型
      try {
        const res = await fetch('/api/config/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            apiKey: 'KEEP_EXISTING', // 特殊标识告知后端保留原 key
            model: config.model 
          })
        });
        if (res.ok) {
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2000);
        }
      } catch (e) {
        setError('保存失败');
      }
      return;
    }

    try {
      const res = await fetch('/api/config/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setIsSaved(true);
        setError(null);
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        const data = await res.json();
        setError(data.error || '保存失败');
      }
    } catch (e) {
      setError('保存失败');
    }
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
              <div className="flex gap-2">
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="输入你的 Gemini API Key"
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm font-medium"
                />
                <button
                  onClick={fetchModels}
                  disabled={isFetchingModels}
                  className="px-4 py-3 rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-xs hover:bg-indigo-100 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {isFetchingModels ? '获取中...' : '获取模型'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">模型选择</label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm font-medium appearance-none"
              >
                {availableModels.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold">
                {error}
              </div>
            )}
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
