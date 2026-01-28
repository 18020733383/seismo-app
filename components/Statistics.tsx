import React, { useState, useMemo } from 'react';
import { SeismicLog, IntensityLevel, LevelConfig, PositiveLevelConfig, LogType } from '../types';

interface StatisticsProps {
  logs: SeismicLog[];
}

type RangeType = 3 | 7 | 30 | 365;

export const Statistics: React.FC<StatisticsProps> = ({ logs }) => {
  const [range, setRange] = useState<RangeType>(7);
  const [statsType, setStatsType] = useState<LogType>('negative');
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [isExportingPoster, setIsExportingPoster] = useState(false);
  const [posterStatus, setPosterStatus] = useState<'idle' | 'done' | 'error'>('idle');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => (log.type || 'negative') === statsType);
  }, [logs, statsType]);

  const posterData = useMemo(() => {
    const levels: IntensityLevel[] = [
      IntensityLevel.Level1,
      IntensityLevel.Level2,
      IntensityLevel.Level3,
      IntensityLevel.Level4,
      IntensityLevel.Level5,
      IntensityLevel.Level6,
    ];

    const compute = (type: LogType) => {
      const typeLogs = logs.filter(l => (l.type || 'negative') === type);
      const levelCountsLocal: Record<IntensityLevel, number> = {
        [IntensityLevel.Level1]: 0,
        [IntensityLevel.Level2]: 0,
        [IntensityLevel.Level3]: 0,
        [IntensityLevel.Level4]: 0,
        [IntensityLevel.Level5]: 0,
        [IntensityLevel.Level6]: 0,
      };
      const hours = Array.from({ length: 24 }, () => 0);
      const tagHeatmapCounts: Record<string, Record<number, number>> = {};

      let minTs = Infinity;
      let maxTs = -Infinity;

      for (const log of typeLogs) {
        levelCountsLocal[log.intensity]++;
        const h = new Date(log.timestamp).getHours();
        hours[h] += 1;

        minTs = Math.min(minTs, log.timestamp);
        maxTs = Math.max(maxTs, log.timestamp);

        for (const tag of log.tags || []) {
          if (!tagHeatmapCounts[tag]) tagHeatmapCounts[tag] = {};
          tagHeatmapCounts[tag][log.intensity] = (tagHeatmapCounts[tag][log.intensity] || 0) + 1;
        }
      }

      const total = typeLogs.length;
      const daysSpan =
        total === 0 ? 1 : Math.max(1, Math.ceil((Date.now() - minTs) / (1000 * 60 * 60 * 24)));
      const perDay = total / daysSpan;

      const maxLevelCount = Math.max(...levels.map(l => levelCountsLocal[l]), 1);
      const maxHour = Math.max(...hours, 1);

      const tagKeys = Object.keys(tagHeatmapCounts).sort((a, b) => {
        const sumA = levels.reduce((sum, level) => sum + (tagHeatmapCounts[a]?.[level] || 0), 0);
        const sumB = levels.reduce((sum, level) => sum + (tagHeatmapCounts[b]?.[level] || 0), 0);
        return sumB - sumA;
      });

      let maxCell = 0;
      for (const tag of tagKeys) {
        for (const level of levels) {
          maxCell = Math.max(maxCell, tagHeatmapCounts[tag]?.[level] || 0);
        }
      }

      const intensityWeightSum = typeLogs.reduce((sum, l) => sum + (7 - l.intensity), 0);
      const avgIntensityWeight = total === 0 ? 0 : intensityWeightSum / total;

      return {
        type,
        total,
        perDay,
        daysSpan,
        levelCounts: levelCountsLocal,
        maxLevelCount,
        hours,
        maxHour,
        tagKeys,
        tagHeatmapCounts,
        tagHeatmapMaxCell: Math.max(maxCell, 1),
        avgIntensityWeight,
        timeRangeText:
          total === 0
            ? '暂无记录'
            : `${new Date(minTs).toLocaleDateString('zh-CN')} - ${new Date(maxTs).toLocaleDateString('zh-CN')}`,
      };
    };

    return {
      negative: compute('negative'),
      positive: compute('positive'),
      levels,
    };
  }, [logs]);

  // 1. Data Processing
  const totalCount = filteredLogs.length;
  const levelCounts: Record<IntensityLevel, number> = {
    [IntensityLevel.Level1]: 0,
    [IntensityLevel.Level2]: 0,
    [IntensityLevel.Level3]: 0,
    [IntensityLevel.Level4]: 0,
    [IntensityLevel.Level5]: 0,
    [IntensityLevel.Level6]: 0,
  };

  filteredLogs.forEach(log => {
    levelCounts[log.intensity]++;
  });

  const maxCount = Math.max(...Object.values(levelCounts), 1);

  // 2. Timeline Processing
  const { timelineData, intensityData } = useMemo(() => {
    const days = Array.from({ length: range }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (range - 1 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const tData = days.map(date => {
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      const dayLogs = filteredLogs.filter(log => {
        const logDate = log.timestamp;
        return logDate >= date.getTime() && logDate < nextDate.getTime();
      });

      // 强度权重统计: L6(1), L5(2), L4(3), L3(4), L2(5), L1(6)
      // 计算方式: 7 - intensity
      const intensitySum = dayLogs.reduce((sum, log) => sum + (7 - log.intensity), 0);

      return {
        label: range > 31 
          ? date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
          : date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        count: dayLogs.length,
        intensitySum
      };
    });

    return { 
      timelineData: tData,
      intensityData: tData 
    };
  }, [filteredLogs, range]);

  const maxTimelineCount = Math.max(...timelineData.map(d => d.count), 1);
  const maxIntensitySum = Math.max(...timelineData.map(d => d.intensitySum), 1);

  // 3. Tag Distribution Processing
  const tagCounts: Record<string, number> = {};
  filteredLogs.forEach(log => {
    (log.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const maxTagCount = Math.max(...Object.values(tagCounts), 1);

  const tagHeatmapLevels = useMemo(() => {
    return [
      IntensityLevel.Level6,
      IntensityLevel.Level5,
      IntensityLevel.Level4,
      IntensityLevel.Level3,
      IntensityLevel.Level2,
      IntensityLevel.Level1,
    ];
  }, []);

  const tagHeatmap = useMemo(() => {
    const counts: Record<string, Record<number, number>> = {};
    for (const log of filteredLogs) {
      for (const tag of log.tags || []) {
        if (!counts[tag]) counts[tag] = {};
        counts[tag][log.intensity] = (counts[tag][log.intensity] || 0) + 1;
      }
    }

    const tags = Object.keys(counts).sort((a, b) => {
      const sumA = tagHeatmapLevels.reduce((sum, level) => sum + (counts[a]?.[level] || 0), 0);
      const sumB = tagHeatmapLevels.reduce((sum, level) => sum + (counts[b]?.[level] || 0), 0);
      return sumB - sumA;
    });

    let maxCell = 0;
    for (const tag of tags) {
      for (const level of tagHeatmapLevels) {
        maxCell = Math.max(maxCell, counts[tag]?.[level] || 0);
      }
    }

    return { tags, counts, maxCell };
  }, [filteredLogs, tagHeatmapLevels]);

  const circadian = useMemo(() => {
    const hours = Array.from({ length: 24 }, () => 0);
    for (const log of filteredLogs) {
      const h = new Date(log.timestamp).getHours();
      hours[h] += 1;
    }
    const max = Math.max(...hours, 1);
    const total = hours.reduce((sum, c) => sum + c, 0);
    return { hours, max, total };
  }, [filteredLogs]);

  // Helper for colors
  const isPositive = statsType === 'positive';
  const activeColor = isPositive ? 'bg-emerald-500' : 'bg-blue-500';
  const activeTextColor = isPositive ? 'text-emerald-600' : 'text-blue-600';
  const barColor = isPositive ? 'bg-emerald-400' : 'bg-blue-400';

  const getColorRgba = (count: number, max: number) => {
    const maxSafe = Math.max(max, 1);
    const ratio = Math.min(Math.max(count / maxSafe, 0), 1);
    const alpha = count === 0 ? 0.06 : 0.08 + ratio * 0.92;
    const base = isPositive ? { r: 16, g: 185, b: 129 } : { r: 99, g: 102, b: 241 };
    return `rgba(${base.r},${base.g},${base.b},${alpha})`;
  };

  const getColorRgbaByType = (count: number, max: number, type: LogType) => {
    const maxSafe = Math.max(max, 1);
    const ratio = Math.min(Math.max(count / maxSafe, 0), 1);
    const alpha = count === 0 ? 0.06 : 0.10 + ratio * 0.90;
    const base = type === 'positive' ? { r: 16, g: 185, b: 129 } : { r: 99, g: 102, b: 241 };
    return {
      rgb: `rgb(${base.r},${base.g},${base.b})`,
      alpha: alpha.toFixed(2),
      rgba: `rgba(${base.r},${base.g},${base.b},${alpha})`
    };
  };

  const escapeXml = (input: string) => {
    return input
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  };

  const polarToCartesian = (cx: number, cy: number, r: number, angleRad: number) => {
    return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
  };

  const describeRingSegment = (
    cx: number,
    cy: number,
    innerR: number,
    outerR: number,
    startAngleRad: number,
    endAngleRad: number
  ) => {
    const largeArcFlag = endAngleRad - startAngleRad > Math.PI ? 1 : 0;
    const p1o = polarToCartesian(cx, cy, outerR, startAngleRad);
    const p2o = polarToCartesian(cx, cy, outerR, endAngleRad);
    const p2i = polarToCartesian(cx, cy, innerR, endAngleRad);
    const p1i = polarToCartesian(cx, cy, innerR, startAngleRad);
    return [
      `M ${p1o.x} ${p1o.y}`,
      `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${p2o.x} ${p2o.y}`,
      `L ${p2i.x} ${p2i.y}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${p1i.x} ${p1i.y}`,
      'Z',
    ].join(' ');
  };

  const buildPosterSvg = () => {
    const W = 1080;
    const H = 1920;
    const P = 64;
    const innerW = W - P * 2;
    const now = new Date();

    const slogans = [
      '今日主权未沦陷：纯属侥幸',
      '本报告不构成任何快乐建议',
      '以震感为鉴，以建设为纲',
      '别问，问就是财政吃紧',
      '维稳靠咖啡，增长靠奇迹',
    ];
    const slogan = slogans[(now.getDate() + now.getHours()) % slogans.length];

    const palette = {
      bg: '#0b1220',
      card: 'rgb(255,255,255)',
      cardAlpha: '0.10',
      cardStroke: 'rgb(255,255,255)',
      cardStrokeAlpha: '0.18',
      textMain: 'rgb(255,255,255)',
      textMainAlpha: '0.92',
      textSub: 'rgb(226,232,240)',
      textSubAlpha: '0.72',
      textDim: 'rgb(148,163,184)',
      textDimAlpha: '0.75',
      indigo: '#6366f1',
      emerald: '#10b981',
      warn: '#f59e0b',
      danger: '#fb7185',
    };

    const fontFamily = "sans-serif";

    const headerH = 170;
    const topSectionY = P + headerH;
    const topSectionH = 410;
    const heatmapSectionY = topSectionY + topSectionH + 24;
    const heatmapSectionH = H - heatmapSectionY - P;

    const leftX = P;
    const rightX = P + innerW / 2 + 14;
    const columnW = innerW / 2 - 14;

    const cardR = 28;
    const cardPad = 26;

    const renderDistributionBars = (x: number, y: number, w: number, stats: typeof posterData.negative) => {
      const rowH = 24;
      const barMaxW = w - 86;
      const rows = posterData.levels
        .slice()
        .sort((a, b) => b - a)
        .map((level, idx) => {
          const count = stats.levelCounts[level] || 0;
          const pct = count / Math.max(stats.maxLevelCount, 1);
          const bw = Math.max(4, Math.round(barMaxW * pct));
          const label = `L${level}`;
          const cy = y + idx * rowH;
          const fill = level <= 2 ? palette.danger : level === 3 ? palette.warn : stats.type === 'positive' ? palette.emerald : palette.indigo;
          return `
            <text x="${x}" y="${cy + 16}" fill="${palette.textSub}" fill-opacity="${palette.textSubAlpha}" font-size="12" font-weight="800" font-family="${fontFamily}">${label}</text>
            <rect x="${x + 32}" y="${cy + 6}" width="${barMaxW}" height="12" rx="6" fill="rgb(255,255,255)" fill-opacity="0.10" />
            <rect x="${x + 32}" y="${cy + 6}" width="${bw}" height="12" rx="6" fill="${fill}" />
            <text x="${x + 32 + barMaxW + 10}" y="${cy + 16}" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="12" font-weight="800" font-family="${fontFamily}">${count}</text>
          `;
        })
        .join('');

      return rows;
    };

    const renderCircadianRing = (cx: number, cy: number, rInner: number, rOuter: number, stats: typeof posterData.negative) => {
      const segments = stats.hours
        .map((count, hour) => {
          const start = (hour / 24) * Math.PI * 2 - Math.PI / 2;
          const end = ((hour + 1) / 24) * Math.PI * 2 - Math.PI / 2;
          const d = describeRingSegment(cx, cy, rInner, rOuter, start, end);
          const fill = getColorRgbaByType(count, stats.maxHour, stats.type);
          return `<path d="${d}" fill="${fill.rgb}" fill-opacity="${fill.alpha}" stroke="rgb(255,255,255)" stroke-opacity="0.55" stroke-width="0.8" />`;
        })
        .join('');

      const title = stats.type === 'positive' ? '建设黄金周期' : '主权沦陷周期';
      const peak = stats.hours.reduce(
        (acc, v, idx) => (v > acc.v ? { v, idx } : acc),
        { v: -1, idx: 0 }
      );
      const peakLabel = peak.v <= 0 ? '无峰值' : `${String(peak.idx).padStart(2, '0')}:00`;

      return `
        <circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="rgb(255,255,255)" fill-opacity="0.05" stroke="rgb(255,255,255)" stroke-opacity="0.12" stroke-width="1" />
        ${segments}
        <circle cx="${cx}" cy="${cy}" r="${rInner - 10}" fill="rgb(11,18,32)" fill-opacity="0.70" stroke="rgb(255,255,255)" stroke-opacity="0.10" stroke-width="1" />
        <text x="${cx}" y="${cy - 8}" text-anchor="middle" fill="${palette.textSub}" fill-opacity="${palette.textSubAlpha}" font-size="12" font-weight="700" font-family="${fontFamily}">${title}</text>
        <text x="${cx}" y="${cy + 18}" text-anchor="middle" fill="${palette.textMain}" fill-opacity="${palette.textMainAlpha}" font-size="22" font-weight="900" font-family="${fontFamily}">${stats.total}</text>
        <text x="${cx}" y="${cy + 38}" text-anchor="middle" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="11" font-weight="700" font-family="${fontFamily}">峰值 ${peakLabel}</text>
      `;
    };

    const renderHeatmap = (
      x: number,
      y: number,
      w: number,
      h: number,
      stats: typeof posterData.negative,
      title: string
    ) => {
      const tags = stats.tagKeys;
      if (tags.length === 0) {
        return `
          <text x="${x}" y="${y + 18}" fill="${palette.textSub}" fill-opacity="${palette.textSubAlpha}" font-size="14" font-weight="900" font-family="${fontFamily}">${escapeXml(title)}</text>
          <text x="${x}" y="${y + 46}" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="12" font-weight="800" font-family="${fontFamily}">暂无标签数据</text>
        `;
      }

      const headerHLocal = 40;
      const bodyY = y + headerHLocal;
      const availH = Math.max(10, h - headerHLocal);

      let cols = 1;
      let cell = 12;
      let labelW = 80;
      let rowH = 14;

      const computeLayout = () => {
        const rowsPerCol = Math.max(1, Math.floor(availH / rowH));
        cols = Math.max(1, Math.ceil(tags.length / rowsPerCol));
        const gap = 10;
        const colW = (w - gap * (cols - 1)) / cols;
        labelW = Math.min(120, Math.max(65, Math.floor(colW * 0.45)));
        cell = Math.floor((colW - labelW - 2) / 6);
        rowH = Math.max(12, cell + 2);
        return { rowsPerCol, gap, colW };
      };

      let layout = computeLayout();
      while (cell < 12 && cols < 4) {
        cols += 1;
        layout = computeLayout();
      }
      if (cell < 10) cell = 10;

      const renderHeader = (colX: number) => {
        const levelLabels = posterData.levels
          .slice()
          .sort((a, b) => b - a)
          .map((level, i) => {
            const lx = colX + labelW + 2 + i * cell + cell / 2;
            return `<text x="${lx}" y="${bodyY - 12}" text-anchor="middle" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="10" font-weight="900" font-family="${fontFamily}">L${level}</text>`;
          })
          .join('');
        return `
          <text x="${colX}" y="${bodyY - 12}" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="10" font-weight="900" font-family="${fontFamily}">TAG</text>
          ${levelLabels}
        `;
      };

      const levelOrder = posterData.levels.slice().sort((a, b) => b - a);

      let out = `
        <text x="${x}" y="${y + 18}" fill="${palette.textSub}" fill-opacity="${palette.textSubAlpha}" font-size="14" font-weight="900" font-family="${fontFamily}">${escapeXml(title)}</text>
        <text x="${x + w}" y="${y + 18}" text-anchor="end" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="11" font-weight="900" font-family="${fontFamily}">${escapeXml(stats.timeRangeText)}</text>
      `;

      for (let c = 0; c < cols; c++) {
        const colX = x + c * (layout.colW + layout.gap);
        out += renderHeader(colX);
        const startIdx = c * layout.rowsPerCol;
        const endIdx = Math.min(tags.length, startIdx + layout.rowsPerCol);
        for (let i = startIdx; i < endIdx; i++) {
          const tag = tags[i];
          const row = i - startIdx;
          const ry = bodyY + row * rowH;
          const tagText = `#${tag}`;
          out += `<text x="${colX}" y="${ry + cell - 1}" fill="${palette.textMain}" fill-opacity="${palette.textMainAlpha}" font-size="10" font-weight="900" font-family="${fontFamily}">${escapeXml(tagText)}</text>`;
          for (let j = 0; j < 6; j++) {
            const level = levelOrder[j];
            const count = stats.tagHeatmapCounts[tag]?.[level] || 0;
            const cx = colX + labelW + 2 + j * cell;
            const fill = getColorRgbaByType(count, stats.tagHeatmapMaxCell, stats.type);
            const textFill =
              count === 0
                ? 'rgb(148,163,184)'
                : count / Math.max(stats.tagHeatmapMaxCell, 1) >= 0.6
                ? 'rgb(255,255,255)'
                : 'rgb(15,23,42)';
            const textOpacity = 
              count === 0
                ? '0.45'
                : count / Math.max(stats.tagHeatmapMaxCell, 1) >= 0.6
                ? '0.95'
                : '0.88';
            out += `
              <rect x="${cx}" y="${ry + 1}" width="${cell - 1}" height="${cell - 1}" rx="2" fill="${fill.rgb}" fill-opacity="${fill.alpha}" stroke="rgb(255,255,255)" stroke-opacity="0.08" />
              <text x="${cx + (cell - 1) / 2}" y="${ry + cell / 2 + 3.5}" text-anchor="middle" fill="${textFill}" fill-opacity="${textOpacity}" font-size="8" font-weight="900" font-family="${fontFamily}">${count === 0 ? '·' : count}</text>
            `;
          }
        }
      }

      return out;
    };

    const renderTopCard = (x: number, y: number, w: number, h: number, stats: typeof posterData.negative) => {
      const title = stats.type === 'positive' ? '建设财政部' : '震感应急部';
      const accent = stats.type === 'positive' ? palette.emerald : palette.indigo;
      const badge = stats.type === 'positive' ? 'BUILD' : 'SEISMIC';
      const tip =
        stats.type === 'positive'
          ? '基建不是刷出来的，是一砖一瓦地把自己扶起来'
          : '如果你又在21:00后崩：这是地缘政治，不是你的错';

      const ringCx = x + w - 120;
      const ringCy = y + 148;
      const distX = x + cardPad;
      const distY = y + 196;

      return `
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${cardR}" fill="${palette.card}" fill-opacity="${palette.cardAlpha}" stroke="${palette.cardStroke}" stroke-opacity="${palette.cardStrokeAlpha}" />
        <rect x="${x + cardPad}" y="${y + cardPad - 2}" width="6" height="22" rx="3" fill="${accent}" />
        <text x="${x + cardPad + 14}" y="${y + cardPad + 14}" fill="${palette.textMain}" fill-opacity="${palette.textMainAlpha}" font-size="18" font-weight="900" font-family="${fontFamily}">${escapeXml(title)}</text>
        <text x="${x + w - cardPad}" y="${y + cardPad + 14}" text-anchor="end" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="12" font-weight="900" font-family="${fontFamily}">${badge}</text>

        <text x="${x + cardPad + 14}" y="${y + 78}" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="11" font-weight="700" font-family="${fontFamily}">总事件</text>
        <text x="${x + cardPad + 14}" y="${y + 115}" fill="${palette.textMain}" fill-opacity="${palette.textMainAlpha}" font-size="44" font-weight="900" font-family="${fontFamily}">${stats.total}</text>

        <text x="${x + cardPad + 190}" y="${y + 78}" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="11" font-weight="700" font-family="${fontFamily}">日均</text>
        <text x="${x + cardPad + 190}" y="${y + 115}" fill="${palette.textMain}" fill-opacity="${palette.textMainAlpha}" font-size="26" font-weight="900" font-family="${fontFamily}">${stats.perDay.toFixed(1)}</text>
        <text x="${x + cardPad + 252}" y="${y + 115}" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="12" font-weight="700" font-family="${fontFamily}">/天</text>

        <text x="${x + cardPad + 190}" y="${y + 148}" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="11" font-weight="700" font-family="${fontFamily}">强度权重均值</text>
        <text x="${x + cardPad + 190}" y="${y + 178}" fill="${palette.textMain}" fill-opacity="${palette.textMainAlpha}" font-size="22" font-weight="900" font-family="${fontFamily}">${stats.avgIntensityWeight.toFixed(2)}</text>
        <text x="${x + cardPad + 252}" y="${y + 178}" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="12" font-weight="700" font-family="${fontFamily}">/ 6</text>

        <g>
          ${renderCircadianRing(ringCx, ringCy, 42, 62, stats)}
        </g>

        <text x="${distX}" y="${distY - 10}" fill="${palette.textSub}" fill-opacity="${palette.textSubAlpha}" font-size="12" font-weight="900" font-family="${fontFamily}">强度分布（L6→L1）</text>
        <g>
          ${renderDistributionBars(distX, distY, w - cardPad * 2, stats)}
        </g>

        <text x="${x + cardPad}" y="${y + h - 18}" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="11" font-weight="700" font-family="${fontFamily}">${escapeXml(tip)}</text>
      `;
    };

    const poster = `<?xml version="1.0" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b1220"/>
      <stop offset="100%" stop-color="#050914"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgb(255,255,255)" stop-opacity="0.18"/>
      <stop offset="60%" stop-color="rgb(255,255,255)" stop-opacity="0.02"/>
      <stop offset="100%" stop-color="rgb(255,255,255)" stop-opacity="0.00"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#bgGrad)" />
  <circle cx="${W - 120}" cy="120" r="220" fill="rgb(99,102,241)" fill-opacity="0.10"/>
  <circle cx="140" cy="${H - 120}" r="260" fill="rgb(16,185,129)" fill-opacity="0.10"/>

  <g font-family="${fontFamily}">
    <text x="${P}" y="${P + 34}" fill="${palette.textMain}" fill-opacity="${palette.textMainAlpha}" font-size="36" font-weight="900">《国家地震与建设统计海报》</text>
    <text x="${P}" y="${P + 70}" fill="${palette.textSub}" fill-opacity="${palette.textSubAlpha}" font-size="14" font-weight="700">Seismo-Mind · Circadian Sovereignty & Tag Impact Matrix</text>
    <text x="${P}" y="${P + 102}" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="13" font-weight="700">${escapeXml(now.toLocaleString('zh-CN'))}</text>
    <text x="${W - P}" y="${P + 102}" text-anchor="end" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="13" font-weight="700">${escapeXml(slogan)}</text>

    <rect x="${P}" y="${topSectionY}" width="${innerW}" height="${topSectionH}" rx="${cardR}" fill="rgb(255,255,255)" fill-opacity="0.06" stroke="${palette.cardStroke}" stroke-opacity="${palette.cardStrokeAlpha}" />
    <rect x="${P}" y="${topSectionY}" width="${innerW}" height="${topSectionH}" rx="${cardR}" fill="url(#shine)" />

    <g>
      ${renderTopCard(leftX + 18, topSectionY + 18, columnW - 18, topSectionH - 36, posterData.negative)}
      ${renderTopCard(rightX, topSectionY + 18, columnW - 18, topSectionH - 36, posterData.positive)}
    </g>

    <rect x="${P}" y="${heatmapSectionY}" width="${innerW}" height="${heatmapSectionH}" rx="${cardR}" fill="rgb(255,255,255)" fill-opacity="0.06" stroke="${palette.cardStroke}" stroke-opacity="${palette.cardStrokeAlpha}" />
    <rect x="${P}" y="${heatmapSectionY}" width="${innerW}" height="${heatmapSectionH}" rx="${cardR}" fill="url(#shine)" />
    
    <g>
      ${renderHeatmap(P + 22, heatmapSectionY + 22, innerW - 44, Math.floor((heatmapSectionH - 66) / 2), posterData.negative, '震感标签×强度热力图（全量）')}
      ${renderHeatmap(P + 22, heatmapSectionY + 22 + Math.floor((heatmapSectionH - 66) / 2) + 22, innerW - 44, Math.floor((heatmapSectionH - 66) / 2), posterData.positive, '建设标签×强度热力图（全量）')}
      <text x="${P + 22}" y="${heatmapSectionY + heatmapSectionH - 18}" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="11" font-weight="700">注：颜色越深代表该标签在该强度出现越频繁。你不是脆弱，你是在高频训练神经系统。</text>
      <text x="${W - P - 22}" y="${heatmapSectionY + heatmapSectionH - 18}" text-anchor="end" fill="${palette.textDim}" fill-opacity="${palette.textDimAlpha}" font-size="11" font-weight="700">© Seismo-Mind 智库 · 仅供自嘲与复盘</text>
    </g>
  </g>
</svg>`.trim();

    return poster;
  };

  const exportPosterPng = async () => {
    if (isExportingPoster) return;
    setIsExportingPoster(true);
    setPosterStatus('idle');
    try {
      console.log('Starting poster export...');
      const svg = buildPosterSvg();
      console.log('SVG generated, length:', svg.length);
      console.log('SVG head:', svg.slice(0, 200));
      
      // Validation step
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const errorNode = doc.querySelector('parsererror');
      if (errorNode) {
        console.error('SVG Parse Error:', errorNode.textContent);
        throw new Error('Invalid SVG structure');
      }
      console.log('SVG structure validated');

      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      
      // Use Base64 encoding for better compatibility with Image loading
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read SVG blob'));
        reader.readAsDataURL(blob);
      });
      
      console.log('Data URL created, length:', dataUrl.length);

      const img = new Image();
      const loaded = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Image load timeout (5s)')), 5000);
        img.onload = () => {
          clearTimeout(timeout);
          console.log('SVG image loaded. Natural size:', img.naturalWidth, 'x', img.naturalHeight);
          // Small delay to ensure rendering is complete
          setTimeout(resolve, 300);
        };
        img.onerror = (err) => {
          clearTimeout(timeout);
          console.error('Image load failed at img.onerror. Check if SVG is valid and all resources are accessible.');
          reject(new Error('Image load failed'));
        };
      });
      img.src = dataUrl;
      await loaded;

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('No canvas context');
      
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      console.log('Drawing image to canvas...');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
      });

      if (!pngBlob) throw new Error('PNG encode failed');
      console.log('PNG blob created, size:', pngBlob.size);

      const a = document.createElement('a');
      const pngUrl = URL.createObjectURL(pngBlob);
      a.href = pngUrl;
      a.download = `seismo-poster-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
      }, 300);

      setPosterStatus('done');
      setTimeout(() => setPosterStatus('idle'), 2500);
    } catch (e) {
      console.error('Export failed caught in catch:', e);
      setPosterStatus('error');
      setTimeout(() => setPosterStatus('idle'), 3000);
    } finally {
      setIsExportingPoster(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Type Toggle */}
      <div className="flex justify-center mb-2">
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 shadow-inner">
          <button
            onClick={() => setStatsType('negative')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              statsType === 'negative' 
                ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            📉 震感 (Seismic)
          </button>
          <button
            onClick={() => setStatsType('positive')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              statsType === 'positive' 
                ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            🏗️ 建设 (Build)
          </button>
        </div>
      </div>

      <div className="px-2 flex items-center justify-between">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          海报导出会同时包含 震感 + 建设
        </div>
        <button
          onClick={exportPosterPng}
          disabled={isExportingPoster}
          className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all active:scale-95 ${
            posterStatus === 'done'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : posterStatus === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
          } ${isExportingPoster ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {posterStatus === 'done'
            ? '✅ 已导出'
            : posterStatus === 'error'
            ? '⚠️ 导出失败'
            : isExportingPoster
            ? '正在生成海报...'
            : '🖼️ 导出统计海报'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 px-2">
        <div className="glass-panel p-5 rounded-3xl shadow-lg border border-white/50 bg-white/40">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
            {isPositive ? '建设总量' : '震感总量'}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{totalCount}</span>
            <span className="text-xs text-slate-400 font-medium">次记录</span>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-3xl shadow-lg border border-white/50 bg-white/40">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
            {isPositive ? '建设热度' : '活跃程度'}
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black ${activeTextColor}`}>
              {(totalCount / Math.max(logs.length > 0 ? (Date.now() - logs[logs.length-1].timestamp) / (1000*60*60*24) : 1, 1)).toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-medium">次/天</span>
          </div>
        </div>
      </div>

      {/* Circadian Distribution */}
      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
          <div className={`w-1.5 h-4 ${isPositive ? 'bg-emerald-500' : 'bg-indigo-500'} rounded-full`}></div>
          黄金周期分布图 (Circadian Sovereignty Distribution)
        </h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-5">
          00:00-23:59 · 看看你的“主权沦陷”是否有规律
        </p>
        {circadian.total > 0 ? (
          <div className="relative flex justify-center">
            <svg width="260" height="260" viewBox="0 0 260 260" className="drop-shadow-sm">
              <defs>
                <filter id="circadianGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle cx="130" cy="130" r="108" fill="rgba(255,255,255,0.4)" stroke="rgba(148,163,184,0.35)" strokeWidth="1" />
              {circadian.hours.map((count, hour) => {
                const start = (hour / 24) * Math.PI * 2 - Math.PI / 2;
                const end = ((hour + 1) / 24) * Math.PI * 2 - Math.PI / 2;
                const path = describeRingSegment(130, 130, 78, 108, start, end);
                const fill = getColorRgba(count, circadian.max);
                return (
                  <path
                    key={hour}
                    d={path}
                    fill={fill}
                    stroke="rgba(255,255,255,0.85)"
                    strokeWidth={0.8}
                    filter="url(#circadianGlow)"
                    onMouseEnter={() => setHoveredHour(hour)}
                    onMouseLeave={() => setHoveredHour(null)}
                    className="cursor-pointer transition-all"
                  />
                );
              })}
              <text x="130" y="18" textAnchor="middle" fill="rgba(100,116,139,0.8)" fontSize="10" fontWeight="700">00</text>
              <text x="242" y="134" textAnchor="middle" fill="rgba(100,116,139,0.8)" fontSize="10" fontWeight="700">06</text>
              <text x="130" y="252" textAnchor="middle" fill="rgba(100,116,139,0.8)" fontSize="10" fontWeight="700">12</text>
              <text x="18" y="134" textAnchor="middle" fill="rgba(100,116,139,0.8)" fontSize="10" fontWeight="700">18</text>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {hoveredHour === null
                  ? '今日主权概览'
                  : `${String(hoveredHour).padStart(2, '0')}:00 - ${String((hoveredHour + 1) % 24).padStart(2, '0')}:00`}
              </div>
              <div className={`text-3xl font-black ${activeTextColor}`}>
                {hoveredHour === null ? circadian.total : circadian.hours[hoveredHour]}
              </div>
              <div className="text-[10px] font-bold text-slate-400">
                {hoveredHour === null ? `总${isPositive ? '建设' : '沦陷'}事件` : `该时段${isPositive ? '建设' : '沦陷'}次数`}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs text-slate-400">暂无数据，国家暂未发生“主权事件”</p>
          </div>
        )}
      </div>

      {/* Distribution Bar Chart */}
      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <div className={`w-1.5 h-4 ${activeColor} rounded-full`}></div>
            {isPositive ? '建设等级分布' : '震感强度分布'}
          </h3>
          <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
            {([3, 7, 30, 365] as RangeType[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                  range === r 
                    ? `bg-white ${activeTextColor} shadow-sm` 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {r === 365 ? '1年' : r === 30 ? '1月' : `${r}天`}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[
            IntensityLevel.Level1, IntensityLevel.Level2, IntensityLevel.Level3, 
            IntensityLevel.Level4, IntensityLevel.Level5, IntensityLevel.Level6
          ].map(level => {
            const count = levelCounts[level];
            const config = isPositive ? PositiveLevelConfig[level] : LevelConfig[level];
            const percentage = (count / maxCount) * 100;
            
            return (
              <div key={level} className="group">
                <div className="flex justify-between items-end mb-1.5 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded text-white ${config.color}`}>L{level}</span>
                    <span className="text-xs font-bold text-slate-600">{config.alertName}</span>
                  </div>
                  <span className="text-xs font-black text-slate-400 group-hover:text-slate-600 transition-colors">{count}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                  <div 
                    className={`h-full ${config.color} transition-all duration-1000 ease-out rounded-full shadow-sm`}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <h3 className="text-sm font-bold text-slate-700 mb-8 flex items-center gap-2">
          <div className={`w-1.5 h-4 ${isPositive ? 'bg-emerald-500' : 'bg-indigo-500'} rounded-full`}></div>
          {isPositive ? '建设频次趋势' : '震感频次趋势'} (近 {range === 365 ? '1年' : range === 30 ? '1月' : `${range}天`})
        </h3>
        
        <div className="relative h-40 w-full px-2">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none opacity-20">
            {[0, 1, 2, 3].map(i => <div key={i} className="w-full border-t border-slate-400"></div>)}
          </div>

          {/* SVG Line and Area (Stretched) */}
          <svg className="absolute inset-0 w-full h-full px-2 py-4 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#10b981' : '#6366f1'} stopOpacity="0.3" />
                <stop offset="100%" stopColor={isPositive ? '#10b981' : '#6366f1'} stopOpacity="0" />
              </linearGradient>
            </defs>
            
            <path
              d={`
                M 0 ${100 - (timelineData[0].count / maxTimelineCount) * 100}
                ${timelineData.map((d, i) => `L ${(i / (timelineData.length - 1)) * 100} ${100 - (d.count / maxTimelineCount) * 100}`).join(' ')}
                L 100 100 L 0 100 Z
              `}
              fill="url(#lineGradient)"
              className="transition-all duration-1000 ease-out"
              vectorEffect="non-scaling-stroke"
            />
            
            <path
              d={timelineData.map((d, i) => 
                `${i === 0 ? 'M' : 'L'} ${(i / (timelineData.length - 1)) * 100} ${100 - (d.count / maxTimelineCount) * 100}`
              ).join(' ')}
              fill="none"
              stroke={isPositive ? '#10b981' : '#6366f1'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-1000 ease-out drop-shadow-md"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* SVG Data Points (Not Stretched) */}
          <svg className="absolute inset-0 w-full h-full px-2 py-4 overflow-visible pointer-events-none">
            {range <= 31 && timelineData.map((d, i) => (
              <circle
                key={i}
                cx={`${(i / (timelineData.length - 1)) * 100}%`}
                cy={`${100 - (d.count / maxTimelineCount) * 100}%`}
                r="4"
                fill="white"
                stroke={isPositive ? '#10b981' : '#6366f1'}
                strokeWidth="2"
                className="transition-all duration-1000 ease-out"
              />
            ))}
          </svg>

          {/* Interaction Layer */}
          <div className="absolute inset-0 flex justify-between px-2 py-4">
            {timelineData.map((data, i) => (
              <div key={i} className="relative h-full flex flex-col items-center group" style={{ width: `${100 / timelineData.length}%` }}>
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-bold shadow-xl border border-white/10">
                  {data.count} 次{isPositive ? '记录' : '震感'} ({data.label})
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
                
                <div className="absolute inset-0 w-full h-full cursor-pointer"></div>
                
                {/* Label - Only show some for large ranges */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                  <span className={`text-[9px] font-bold text-slate-400 group-hover:${isPositive ? 'text-emerald-600' : 'text-indigo-600'} transition-colors ${
                    range > 7 && i % Math.ceil(range/7) !== 0 ? 'hidden' : ''
                  }`}>
                    {data.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Intensity Sum Chart */}
      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <h3 className="text-sm font-bold text-slate-700 mb-8 flex items-center gap-2">
          <div className={`w-1.5 h-4 ${isPositive ? 'bg-amber-500' : 'bg-rose-500'} rounded-full`}></div>
          {isPositive ? '建设强度趋势 (加权)' : '地震强度趋势 (加权)'}
        </h3>
        
        <div className="relative h-40 w-full px-2">
          <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none opacity-20">
            {[0, 1, 2, 3].map(i => <div key={i} className="w-full border-t border-slate-400"></div>)}
          </div>

          {/* SVG Line and Area (Stretched) */}
          <svg className="absolute inset-0 w-full h-full px-2 py-4 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="intensityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#f59e0b' : '#f43f5e'} stopOpacity="0.3" />
                <stop offset="100%" stopColor={isPositive ? '#f59e0b' : '#f43f5e'} stopOpacity="0" />
              </linearGradient>
            </defs>
            
            <path
              d={`
                M 0 ${100 - (intensityData[0].intensitySum / maxIntensitySum) * 100}
                ${intensityData.map((d, i) => `L ${(i / (intensityData.length - 1)) * 100} ${100 - (d.intensitySum / maxIntensitySum) * 100}`).join(' ')}
                L 100 100 L 0 100 Z
              `}
              fill="url(#intensityGradient)"
              className="transition-all duration-1000 ease-out"
              vectorEffect="non-scaling-stroke"
            />
            
            <path
              d={intensityData.map((d, i) => 
                `${i === 0 ? 'M' : 'L'} ${(i / (intensityData.length - 1)) * 100} ${100 - (d.intensitySum / maxIntensitySum) * 100}`
              ).join(' ')}
              fill="none"
              stroke={isPositive ? '#f59e0b' : '#f43f5e'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-1000 ease-out drop-shadow-md"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* SVG Data Points (Not Stretched) */}
          <svg className="absolute inset-0 w-full h-full px-2 py-4 overflow-visible pointer-events-none">
            {range <= 31 && intensityData.map((d, i) => (
              <circle
                key={i}
                cx={`${(i / (intensityData.length - 1)) * 100}%`}
                cy={`${100 - (d.intensitySum / maxIntensitySum) * 100}%`}
                r="4"
                fill="white"
                stroke={isPositive ? '#f59e0b' : '#f43f5e'}
                strokeWidth="2"
                className="transition-all duration-1000 ease-out"
              />
            ))}
          </svg>

          {/* Interaction Layer */}
          <div className="absolute inset-0 flex justify-between px-2 py-4">
            {intensityData.map((data, i) => (
              <div key={i} className="relative h-full flex flex-col items-center group" style={{ width: `${100 / intensityData.length}%` }}>
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-bold shadow-xl border border-white/10">
                  强度值: {data.intensitySum} ({data.label})
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
                
                <div className="absolute inset-0 w-full h-full cursor-pointer"></div>
                
                {/* Label */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                  <span className={`text-[9px] font-bold text-slate-400 group-hover:${isPositive ? 'text-amber-600' : 'text-rose-600'} transition-colors ${
                    range > 7 && i % Math.ceil(range/7) !== 0 ? 'hidden' : ''
                  }`}>
                    {data.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tag Cloud / Distribution */}
      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
          客观事件分布 (Top 10)
        </h3>
        {sortedTags.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {sortedTags.map(([tag, count]) => {
              const fontSize = 0.75 + (count / maxTagCount) * 0.75;
              const opacity = 0.5 + (count / maxTagCount) * 0.5;
              
              return (
                <div 
                  key={tag}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/60 border border-white/80 shadow-sm transition-all hover:scale-110 hover:shadow-md"
                  style={{ 
                    opacity,
                    transform: `scale(${fontSize})`
                  }}
                >
                  <span className="text-xs font-black text-slate-700">#{tag}</span>
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-lg">{count}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-slate-400">暂无标签记录，在记录震感时添加 #标签 即可看到分布</p>
          </div>
        )}
      </div>

      {/* Tag x Intensity Heatmap */}
      <div className="glass-panel mx-2 p-6 rounded-3xl shadow-lg border border-white/50 bg-white/40">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <div className={`w-1.5 h-4 ${isPositive ? 'bg-emerald-500' : 'bg-indigo-500'} rounded-full`}></div>
            标签 × 强度热力图 (L6→L1)
          </h3>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            哪些标签触动最大
          </div>
        </div>
        {tagHeatmap.tags.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/70 bg-white/50">
            <div className="w-full">
              <div className="grid grid-cols-[1fr_repeat(6,20px)] sticky top-0 bg-white/80 backdrop-blur border-b border-slate-100">
                <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">标签</div>
                {tagHeatmapLevels.map(level => (
                  <div key={level} className="px-0 py-2 text-center text-[10px] font-black text-slate-500">
                    L{level}
                  </div>
                ))}
              </div>
              <div className="divide-y divide-slate-100/70">
                {tagHeatmap.tags.map(tag => (
                  <div key={tag} className="grid grid-cols-[1fr_repeat(6,20px)]">
                    <div className="px-3 py-1 flex items-center gap-1 overflow-hidden">
                      <span className="text-[10px] font-black text-slate-700 truncate">#{tag}</span>
                      <span className="text-[8px] font-bold text-slate-300 flex-shrink-0">
                        {tagHeatmapLevels.reduce((sum, level) => sum + (tagHeatmap.counts[tag]?.[level] || 0), 0)}
                      </span>
                    </div>
                    {tagHeatmapLevels.map(level => {
                      const count = tagHeatmap.counts[tag]?.[level] || 0;
                      const bg = getColorRgba(count, tagHeatmap.maxCell);
                      const text =
                        count === 0
                          ? 'text-slate-300'
                          : count / Math.max(tagHeatmap.maxCell, 1) >= 0.6
                          ? 'text-white'
                          : 'text-slate-700';
                      return (
                        <div key={`${tag}-${level}`} className="p-[0.5px]">
                          <div
                            className={`h-5 rounded-sm flex items-center justify-center font-black text-[9px] border border-white/10 shadow-sm ${text}`}
                            style={{ backgroundColor: bg }}
                            title={`#${tag} · L${level} · ${count} 次`}
                          >
                            {count === 0 ? '·' : count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs text-slate-400">暂无标签数据，先在记录里加几个 #标签 吧</p>
          </div>
        )}
      </div>

      {/* Empty State */}
      {totalCount === 0 && (
        <div className="text-center py-10 opacity-40">
          <p className="text-xs font-medium">暂无震感记录，快去记录第一次震感吧</p>
        </div>
      )}
    </div>
  );
};
