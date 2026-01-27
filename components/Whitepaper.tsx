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
    gdp: string; // Dopamine GDP
    inflation: string; // Mood Volatility
    stability: number;
    happiness: number;
  };
  indicators: {
    politics: Indicator; // 政治生态
    admin: Indicator;    // 行政效能
    economy: Indicator;  // 经济情况
    gini: Indicator;     // 基尼系数
    debt: Indicator;     // 债务杠杆
    defense: Indicator;  // 国防建设
    diplomacy: Indicator;// 外交
    stabilityControl: Indicator; // 维稳力度
    nuclear: Indicator;  // 核按钮指数
  };
  parliament: {
    rulingParty: string;
    opposition: string;
    coalitionStatus: string;
    recentScandals: string[];
  };
  residents: {
    brain: string;
    heart: string;
    liver: string;
    limbs: string;
    stomach: string;
  };
  strategicOutlook: string[];
}

export const Whitepaper: React.FC<WhitepaperProps> = ({ logs }) => {
  const [report, setReport] = useState<NationalReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const generateMockReport = () => {
    setIsGenerating(true);
    
    // Simulate complex calculation
    setTimeout(() => {
      const now = new Date();
      const parties = ['拖延党', '焦虑联盟', '内卷先锋队', '摆烂俱乐部', '多巴胺投机者'];
      const scandals = [
        '“再刷五分钟手机”议案被指控由于脑部贿赂通过',
        '深夜外卖法案在胃部强烈抗议下强行通过',
        '运动计划拨款被再次挪用于“躺平”基础设施建设',
        '睡眠法案连续三晚遭到否决',
      ];

      setReport({
        title: `《${now.getFullYear()}年第${Math.ceil(now.getDate() / 7)}周 心理共和国国情咨文》`,
        generatedAt: now.toLocaleString('zh-CN'),
        metrics: {
          gdp: '5.2% (多巴胺同比)',
          inflation: '8.4% (情绪波动)',
          stability: Math.floor(Math.random() * 40) + 50,
          happiness: Math.floor(Math.random() * 40) + 40,
        },
        indicators: {
          politics: { name: '政治生态', score: 65, reason: '近期情绪波动较大，存在局部动荡风险' },
          admin: { name: '行政效能', score: 42, reason: '大脑指令下达后，四肢执行延迟严重，拖延症蔓延' },
          economy: { name: '经济情况', score: 78, reason: '多巴胺汇率稳定，但实体劳动产出略显不足' },
          gini: { name: '基尼系数', score: 85, reason: '严重依赖短期爽感，长远成就感分配极度匮乏' },
          debt: { name: '债务杠杆', score: 92, reason: '熬夜透支严重，主权信用评级面临下调风险' },
          defense: { name: '国防建设', score: 30, reason: '核心肌群军备废弛，抵抗力防线薄弱' },
          diplomacy: { name: '外交关系', score: 70, reason: '与外界保持正常贸易，但深层盟友关系疏远' },
          stabilityControl: { name: '维稳力度', score: 55, reason: '对夜宵和娱乐的本能欲望控制力较弱' },
          nuclear: { name: '核按钮指数', score: 10, reason: '偶尔有自暴自弃倾向，但总体可控' },
        },
        parliament: {
          rulingParty: parties[Math.floor(Math.random() * parties.length)],
          opposition: parties[Math.floor(Math.random() * parties.length)],
          coalitionStatus: '极度不稳定，随时可能解散',
          recentScandals: scandals.sort(() => 0.5 - Math.random()).slice(0, 2),
        },
        residents: {
          brain: '由于长期高负荷运转，正在策划罢工，并威胁要播放“尴尬回忆录”',
          heart: '心率起伏较大，强烈建议减少咖啡因摄入，增加“心动”预算',
          liver: '作为沉默的大多数，表示“我还能忍，但别太过分”',
          limbs: '抗议严重缺乏运动，声称已经忘记了奔跑的感觉',
          stomach: '表示最近接收的垃圾食品过多，要求增加膳食纤维补贴',
        },
        strategicOutlook: [
          '建议立即启动“早睡早起”紧急法案',
          '削减“无意义刷屏”预算，转向“专注力”基建',
          '与“焦虑联盟”进行和平谈判，签署互不侵犯条约',
        ]
      });
      setIsGenerating(false);
    }, 1500);
  };

  const generatePrompt = () => {
    const recentLogs = logs.slice(0, 20).map(l => 
      `[${new Date(l.timestamp).toLocaleString()}] 类型:${l.type} 强度:L${l.intensity} 内容:${l.content} 标签:${l.tags?.join(',')}`
    ).join('\n');

    return `你现在是“心理共和国”的首席政治分析师和国策顾问。请根据以下最近的“地质勘探日志”（用户的心理/行为记录），撰写一份幽默、讽刺但有深度的《国情咨文》。

**数据输入：**
${recentLogs || '（暂无近期记录，请根据“百废待兴”的状态自由发挥）'}

**报告结构要求：**

1. **国家核心指标（请给出0-100的评分和简短理由）：**
   - **政治生态**（精神状态稳定程度）：是否出现大振幅的情绪波动？
   - **行政效能**（意志力执行率）：决策层（大脑）下达指令后，基层单位（四肢）的响应速度。是否拖延？
   - **经济情况**（多巴胺汇率）：实际劳动与获得的多巴胺回报是否匹配？
   - **基尼系数**（快乐分配）：是沉迷“瞬间爽感（刷手机）”还是追求“长远成就感”？差距是否过大？
   - **债务杠杆率**（Emotional Debt）：为了现在的“闲适”透支了未来多少睡眠和健康？是否存在“违约”风险？
   - **国防建设**（身体状况）：健身与健康储备情况。
   - **外交关系**（人际社交）：社交活跃度与质量。
   - **维稳力度**（自控力）：能否控制本能欲望（食欲、懒惰）或情绪暴走？
   - **核按钮指数**（自毁倾向）：是否有自我伤害或彻底摆烂的危险倾向？

2. **议会风云（幽默讽刺）：**
   - 谁是当前的执政党？（如“熬夜党”、“焦虑党”、“奋斗逼党”）
   - 发生了什么政治丑闻？（如“运动计划拨款被挪用买奶茶”）
   - 党派之间的恩怨情仇。

3. **居民之声（身体各部位的吐槽）：**
   - 大脑（总统/议长）：最近的想法和决策评价。
   - 肝脏（劳模）：对作息的抱怨。
   - 四肢（底层劳工）：对运动量的反馈。
   - 胃部（后勤部长）：对饮食的评价。

4. **战略展望：**
   - 下阶段的国策建议（严肃中带着调侃）。

**风格要求：**
- 模仿官方严肃文件的口吻，但内容极其荒诞幽默。
- 将心理活动比作国家政治博弈。
- 毒舌，但充满关怀。

请直接输出Markdown格式的报告内容。`;
  };

  const handleCopyPrompt = () => {
    const prompt = generatePrompt();
    navigator.clipboard.writeText(prompt).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
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
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={generateMockReport}
              disabled={isGenerating}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
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
                  <span>生成预览报告</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleCopyPrompt}
              className={`flex-1 py-3.5 px-6 rounded-2xl border-2 font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 ${
                copyStatus === 'copied' 
                  ? 'border-emerald-500 text-emerald-600 bg-emerald-50' 
                  : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
              }`}
            >
              {copyStatus === 'copied' ? (
                <>
                  <span>✅</span>
                  <span>已复制 Prompt</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>复制 AI 指令</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 text-center">
            * 点击“复制 AI 指令”可获取针对当前数据的 Prompt，发送给 ChatGPT/Claude/Gemini 即可生成完整报告。
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
            <div className="bg-slate-900 rounded-3xl p-6 shadow-lg text-white">
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
            
            <div className="mt-8 text-center">
               <div className="inline-block px-4 py-2 rounded-full bg-slate-100 text-[10px] font-bold text-slate-400">
                  以上内容由“Seismo-Mind 智库”胡编乱造，仅供娱乐
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
