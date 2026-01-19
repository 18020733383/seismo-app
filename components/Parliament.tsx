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

  const metrics = useMemo(() => {
    const counts = {
      [IntensityLevel.Level1]: 0,
      [IntensityLevel.Level2]: 0,
      [IntensityLevel.Level3]: 0,
      [IntensityLevel.Level4]: 0,
      [IntensityLevel.Level5]: 0,
      [IntensityLevel.Level6]: 0,
    };

    recentLogs.forEach(l => {
      counts[l.intensity]++;
    });

    const total = recentLogs.length || 1;
    const weightedSum =
      counts[IntensityLevel.Level1] * 6 +
      counts[IntensityLevel.Level2] * 5 +
      counts[IntensityLevel.Level3] * 4 +
      counts[IntensityLevel.Level4] * 3 +
      counts[IntensityLevel.Level5] * 2 +
      counts[IntensityLevel.Level6] * 1;
    const avgLevel = weightedSum / total;

    const tagCounts: Record<string, number> = {};
    recentLogs.forEach(l => {
      (l.tags || []).forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    return { counts, total, avgLevel, topTags };
  }, [recentLogs]);

  const partyScores = useMemo(() => {
    const score: Record<PartyKey, number> = {
      indul: 0,
      discipline: 0,
      anxiety: 0,
      stability: 0,
      crisis: 0,
    };

    recentLogs.forEach(l => {
      const tags = l.tags || [];
      tags.forEach(t => {
        (Object.keys(PARTY_KEYS) as PartyKey[]).forEach(k => {
          if (PARTY_KEYS[k].some(w => t.includes(w))) {
            score[k] += 1;
          }
        });
      });

      if (l.intensity === IntensityLevel.Level1 || l.intensity === IntensityLevel.Level2 || l.intensity === IntensityLevel.Level3) {
        score.anxiety += 2;
      }
      if (l.intensity === IntensityLevel.Level4) {
        score.crisis += 1.5;
      }
      if (l.intensity === IntensityLevel.Level6) {
        score.stability += 1.5;
      }
      if (l.intensity === IntensityLevel.Level5) {
        score.indul += 1;
      }
    });

    const base = 1;
    (Object.keys(score) as PartyKey[]).forEach(k => {
      score[k] += base;
    });

    return score;
  }, [recentLogs]);

  const seats = useMemo(() => {
    const sum = (Object.values(partyScores).reduce((a, b) => a + b, 0)) || 1;
    const floats = (Object.keys(partyScores) as PartyKey[]).map(k => ({ k, v: (partyScores[k] / sum) * 100 }));
    const floors = floats.map(i => ({ k: i.k, v: Math.floor(i.v) }));
    let used = floors.reduce((a, b) => a + b.v, 0);
    const remain = 100 - used;
    const remainders = floats.map(i => ({ k: i.k, r: i.v - Math.floor(i.v) })).sort((a, b) => b.r - a.r);
    for (let i = 0; i < remain; i++) {
      const k = remainders[i % remainders.length].k;
      const idx = floors.findIndex(f => f.k === k);
      floors[idx].v += 1;
    }
    const out: Record<PartyKey, number> = { indul: 0, discipline: 0, anxiety: 0, stability: 0, crisis: 0 };
    floors.forEach(f => { out[f.k] = f.v; });
    return out;
  }, [partyScores]);

  const dopamineIndex = useMemo(() => {
    const indul = partyScores.indul;
    const disc = partyScores.discipline;
    const ratio = disc === 0 ? indul : indul / disc;
    let status = '平衡';
    if (ratio >= 1.4) status = '超发';
    else if (ratio <= 0.7) status = '紧缩';
    return { ratio: Number(ratio.toFixed(2)), status };
  }, [partyScores]);

  const rulingStrength = useMemo(() => {
    const ruling = seats.discipline + seats.stability + seats.crisis;
    const opposition = seats.indul + seats.anxiety;
    const diff = ruling - opposition;
    let status = '弱势执政';
    if (diff >= 10) status = '稳健执政';
    else if (diff <= -10) status = '在野占优';
    return { ruling, opposition, status, diff };
  }, [seats]);

  const prompt = useMemo(() => {
    const parts = [
      '角色设定：把一个人当成一个国家，脑子是最高决策机构。请基于最近事件给出“议会构成、运转状况、经济（多巴胺）状况”的判断与建议。',
      `时间范围：最近 7 天，样本数=${metrics.total}`,
      `震感强度分布：L1=${metrics.counts[IntensityLevel.Level1]}，L2=${metrics.counts[IntensityLevel.Level2]}，L3=${metrics.counts[IntensityLevel.Level3]}，L4=${metrics.counts[IntensityLevel.Level4]}，L5=${metrics.counts[IntensityLevel.Level5]}，L6=${metrics.counts[IntensityLevel.Level6]}，平均强度=${metrics.avgLevel.toFixed(2)}`,
      `标签Top10：${metrics.topTags.map(([t, c]) => `#${t}(${c})`).join('、') || '无'}`,
      `议会席位总数：100；构成：${PARTY_LABEL.indul}=${seats.indul}、${PARTY_LABEL.discipline}=${seats.discipline}、${PARTY_LABEL.anxiety}=${seats.anxiety}、${PARTY_LABEL.stability}=${seats.stability}、${PARTY_LABEL.crisis}=${seats.crisis}`,
      `运转状况：${rulingStrength.status}（执政联盟=${rulingStrength.ruling}，在野联盟=${rulingStrength.opposition}，席位差=${rulingStrength.diff}）`,
      `多巴胺经济：${dopamineIndex.status}（纵欲/自律比=${dopamineIndex.ratio}）`,
      '输出要求：',
      '1）用简洁结构化语言描述当前议会各派诉求与影响力；',
      '2）评估最高决策机构是否被在野势力牵制；',
      '3）给出 3 条当日可执行的治理建议（含自律与替代行为设计）；',
      '4）用一句话给出今日总体运行结论。',
    ];
    return parts.join('\n');
  }, [metrics, seats, rulingStrength, dopamineIndex]);

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

