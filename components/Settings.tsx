import React, { useState, useEffect } from 'react';

interface GeminiConfig {
  apiKey: string;
  model: string;
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

      <div className="glass-panel p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <h3 className="text-sm font-bold text-slate-700 mb-2">关于 Seismo Mind</h3>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          Seismo Mind 是一款将情绪波动具象化为“心理震感”的观测工具。通过议会制隐喻，帮助你更好地理解自己的内心世界与多巴胺经济。
        </p>
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-300 uppercase">Version 1.0.0</span>
          <span className="text-[10px] font-black text-slate-300 uppercase">Made with ❤️</span>
        </div>
      </div>
    </div>
  );
};

export default Settings;
