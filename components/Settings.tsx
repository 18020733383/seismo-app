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
  'google-ai-studio/gemini-3-flash-preview',
  'google-ai-studio/gemini-1.5-flash',
  'google-ai-studio/gemini-1.5-pro',
];

const Settings: React.FC = () => {
  const [config, setConfig] = useState<GeminiConfig>({
    apiKey: '',
    model: 'google-ai-studio/gemini-2.0-flash',
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>(MODELS);
  const [error, setError] = useState<string | null>(null);
  const [customModel, setCustomModel] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    // 优先从 D1 加载配置
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config/gemini');
        if (res.ok) {
          const data = await res.json();
          if (data.hasKey) {
            const model = data.model || 'google-ai-studio/gemini-2.0-flash';
            setConfig({
              apiKey: data.apiKey, // 这是脱敏后的 key，仅用于显示
              model: model
            });
            
            // 如果加载的模型不在预设列表中，开启自定义模式
            if (!MODELS.includes(model)) {
              setIsCustom(true);
              setCustomModel(model);
            }
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
      
      // 更新可选列表，但不强制切换当前选中的模型（除非当前模型完全失效）
      if (modelNames.length > 0 && !modelNames.includes(config.model) && !isCustom) {
        setConfig(prev => ({ ...prev, model: modelNames[0] }));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSave = async () => {
    const finalModel = isCustom ? customModel : config.model;
    if (!config.apiKey || !finalModel) {
      setError('请输入 API Key 并选择或输入模型');
      return;
    }

    const payload = {
      apiKey: config.apiKey.includes('...') ? 'KEEP_EXISTING' : config.apiKey,
      model: finalModel
    };

    try {
      const res = await fetch('/api/config/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsSaved(true);
        setError(null);
        setConfig(prev => ({ ...prev, model: finalModel }));
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
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase">模型选择</label>
                <button 
                  onClick={() => setIsCustom(!isCustom)}
                  className="text-[10px] font-black text-indigo-500 uppercase hover:text-indigo-600 transition-colors"
                >
                  {isCustom ? '选择预设' : '手动输入'}
                </button>
              </div>
              
              {isCustom ? (
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="例如: google-ai-studio/gemini-3-flash-preview"
                  className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm font-medium"
                />
              ) : (
                <select
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm font-medium appearance-none"
                >
                  {availableModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}
              <p className="mt-1.5 ml-1 text-[9px] text-slate-400 font-medium">
                * 使用 Cloudflare AI Gateway 时，模型名称需包含前缀 (如 google-ai-studio/)
              </p>
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
