import React, { useMemo, useState } from 'react';
import { SeismicLog, IntensityLevel, LevelConfig } from '../types';

interface ParliamentProps {
  logs: SeismicLog[];
}

const PARTY_KEYS = {
  indul: ['纵欲', '娱乐', '视频', '刷', '游戏', '熬夜', '外卖', '酒', '性', '社交'],
  discipline: ['自律', '健身', '跑步', '学习', '早睡', '复盘', '阅读', '写作', '冥想', '规划', '科研', '代码', '任务', 'ddl', 'deadline'],
  anxiety: ['焦虑', '组会', '父母', '年龄', 'proposal', '催命', '崩', '恐惧', '危机'],
  stability: ['平稳', '正常', '放松', '开心', '满足', '平和', '宁静'],
  crisis: ['应对', '会议', '准备', '修复', '处理', '加班', '解决', '补救', '排查'],
};

type PartyKey = 'indul' | 'discipline' | 'anxiety' | 'stability' | 'crisis';

const PARTY_LABEL: Record<PartyKey, string> = {
  indul: '纵欲党',
  discipline: '自律党',
  anxiety: '焦虑派',
  stability: '稳定派',
  crisis: '危机管理派',
};

export const Parliament: React.FC<ParliamentProps> = ({ logs }) => {
  const [showPrompt, setShowPrompt] = useState(false);

  const recentLogs = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    const start = d.getTime();
    const end = Date.now();
    return logs.filter(l => l.timestamp >= start && l.timestamp <= end);
  }, [logs]);

  const { seats, rulingStrength, dopamineIndex, metrics } = useMemo(() => {
    // Basic metrics
    const total = recentLogs.length;
    const counts = {
      [IntensityLevel.Level1]: 0,
      [IntensityLevel.Level2]: 0,
      [IntensityLevel.Level3]: 0,
      [IntensityLevel.Level4]: 0,
      [IntensityLevel.Level5]: 0,
      [IntensityLevel.Level6]: 0,
    };
    let sumLevel = 0;
    const tagsMap: Record<string, number> = {};

    recentLogs.forEach(l => {
      counts[l.intensity]++;
      sumLevel += l.intensity;
      (l.tags || []).forEach(t => tagsMap[t] = (tagsMap[t] || 0) + 1);
    });

    const avgLevel = total > 0 ? sumLevel / total : 6;
    const topTags = Object.entries(tagsMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Simple keyword mapping for local UI visualization only
    const getKeywordWeight = (log: SeismicLog) => {
      const text = (log.content + (log.tags || []).join('')).toLowerCase();
      const weights = { indul: 0, discipline: 0, anxiety: 0, stability: 0, crisis: 0 };
      
      if (/玩|刷|吃|睡|懒|拖|欲|爽/.test(text)) weights.indul += 2;
      if (/学|练|读|完|成|律|刻|苦/.test(text)) weights.discipline += 2;
      if (/急|愁|怕|虑|死|考|试|会/.test(text)) weights.anxiety += 2;
      if (log.intensity >= 5) weights.stability += 1;
      if (log.intensity <= 2) weights.crisis += 2;
      
      return weights;
    };

    const totalWeights = recentLogs.reduce((acc, log) => {
      const w = getKeywordWeight(log);
      acc.indul += w.indul;
      acc.discipline += w.discipline;
      acc.anxiety += w.anxiety;
      acc.stability += w.stability;
      acc.crisis += w.crisis;
      return acc;
    }, { indul: 0, discipline: 0, anxiety: 0, stability: 0, crisis: 0 });

    const totalW = (totalWeights.indul + totalWeights.discipline + totalWeights.anxiety + totalWeights.stability + totalWeights.crisis) || 1;
    const seats = {
      indul: Math.round((totalWeights.indul / totalW) * 100),
      discipline: Math.round((totalWeights.discipline / totalW) * 100),
      anxiety: Math.round((totalWeights.anxiety / totalW) * 100),
      stability: Math.round((totalWeights.stability / totalW) * 100),
      crisis: 100 - (Math.round((totalWeights.indul / totalW) * 100) + Math.round((totalWeights.discipline / totalW) * 100) + Math.round((totalWeights.anxiety / totalW) * 100) + Math.round((totalWeights.stability / totalW) * 100))
    };

    const ruling = seats.discipline + seats.stability;
    const opposition = seats.indul + seats.anxiety;
    const diff = ruling - opposition;
    const status = diff > 20 ? '稳健扩张' : diff > 0 ? '微弱执政' : diff > -20 ? '陷入僵局' : '全面失控';

    const ratio = seats.indul / (seats.discipline || 1);
    const dopamine = ratio > 1.5 ? '严重通胀' : ratio > 0.8 ? '温和扩张' : ratio > 0.4 ? '紧缩周期' : '极度低迷';

    return { 
      seats, 
      rulingStrength: { ruling, opposition, diff, status },
      dopamineIndex: { ratio, status: dopamine },
      metrics: { total, counts, avgLevel, topTags }
    };
  }, [recentLogs]);

  const prompt = useMemo(() => {
    const sortedLogs = [...recentLogs].sort((a, b) => b.timestamp - a.timestamp);

    const logDetails = sortedLogs.map(log => {
       const config = LevelConfig[log.intensity];
       const date = new Date(log.timestamp).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
       const tagsText = log.tags?.length ? ` #标签:${log.tags.join(',')}` : '';
       const aftershockText = log.isAftershock ? ' [余震:代表历史事件的次生波]' : '';
       return `[${date}] 强度:${config.alertName}(L${log.intensity})${aftershockText} - 内容:${log.content}${tagsText}`;
     }).join('\n');

    return `你是一位卓越的国家治理专家与心理分析师。现在请执行以下分析指令：

【核心设定】
1. 将“人”视作一个主权国家。
2. “大脑/意识”是该国家的最高决策机构（议会）。
3. 心理震感（情绪波动）即为国家发生的社会/政治/自然事件。

【分析对象：最近 7 天的震感记录】
${logDetails || '（暂无记录）'}

【任务要求】
请基于上述记录，从以下维度深度总结当前国家的现状：
1. **议会构成**：总席位 100 人。请根据事件的性质（如：纵欲、焦虑、自律、社交压力等）判断当前有哪些“党派”在议会中占据主导地位，并分配席位比例。
2. **运转状况**：判断议会目前是处于高效决策期、政治僵局期、还是处于无政府状态？执政联盟（理智与长远利益）与在野党（短期诱惑与即时情绪）的博弈情况如何？
3. **经济（多巴胺）状况**：分析多巴胺的货币政策。是否存在“多巴胺超发（过度纵欲导致的贬值）”？还是处于“多巴胺紧缩（极度压抑导致的动力不足）”？或者是稳健的平衡状态？
4. **国家安全建议**：面对当前的“议会构成”，最高决策者应采取何种“行政手段”来优化国家运转？

请用专业、犀利且极具社会科学感的文风进行深度分析。`;
  }, [recentLogs]);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {}
  };

  const partyOrder: PartyKey[] = ['discipline', 'stability', 'crisis', 'anxiety', 'indul'];

  return (
    <div className="space-y-6 pb-10">
      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800">议会构成</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1">席位总数 100，基于最近 7 天数据推断</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyPrompt} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow hover:bg-indigo-500">生成并复制 Prompt</button>
            <button onClick={() => setShowPrompt(s => !s)} className="px-3 py-2 rounded-xl bg-white text-indigo-600 text-xs font-bold border border-indigo-200 hover:bg-indigo-50">预览</button>
          </div>
        </div>
        {showPrompt && (
          <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <pre className="text-[11px] leading-5 whitespace-pre-wrap font-medium text-slate-700">{prompt}</pre>
          </div>
        )}
      </div>

      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
          席位分布
        </h4>
        <div className="space-y-3">
          {partyOrder.map(k => {
            const count = seats[k];
            const color =
              k === 'discipline' ? 'from-emerald-500 to-emerald-400' :
              k === 'stability' ? 'from-sky-500 to-sky-400' :
              k === 'crisis' ? 'from-indigo-500 to-indigo-400' :
              k === 'anxiety' ? 'from-rose-500 to-rose-400' :
              'from-amber-500 to-amber-400';
            return (
              <div key={k}>
                <div className="flex justify-between items-end mb-1.5 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded text-white bg-slate-800">{PARTY_LABEL[k]}</span>
                    <span className="text-xs font-bold text-slate-600">席位</span>
                  </div>
                  <span className="text-xs font-black text-slate-600">{count}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                  <div className={`h-full bg-gradient-to-r ${color} transition-all duration-700 ease-out rounded-full shadow-sm`} style={{ width: `${Math.max((count / 100) * 100, 2)}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-violet-500 rounded-full"></div>
          运行与经济
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/60 border border-white/80">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">运转状况</p>
            <div className="text-sm font-black text-slate-800">{rulingStrength.status}</div>
            <div className="text-[11px] text-slate-500 mt-1">执政联盟 {rulingStrength.ruling} / 在野联盟 {rulingStrength.opposition}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/60 border border-white/80">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">多巴胺经济</p>
            <div className="text-sm font-black text-slate-800">{dopamineIndex.status}</div>
            <div className="text-[11px] text-slate-500 mt-1">纵欲/自律比 {dopamineIndex.ratio}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

