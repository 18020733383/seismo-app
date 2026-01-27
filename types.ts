export enum IntensityLevel {
  Level1 = 1, // 核爆级 / 奇迹级
  Level2 = 2, // 熔断级 / 盛世级
  Level3 = 3, // 震荡级 / 繁荣级
  Level4 = 4, // 干扰级 / 落成级
  Level5 = 5, // 噪音级 / 加固级
  Level6 = 6, // 蚊子级 / 基建级
}

export type LogType = 'negative' | 'positive';

export interface SeismicLog {
  id: string;
  intensity: IntensityLevel;
  content: string;
  isAftershock: boolean;
  timestamp: number;
  tags?: string[];
  type: LogType;
}

export interface LevelMetadata {
  label: string;
  alertName: string;
  coreDefinition: string;
  sensoryDescription: string;
  visualRef: string;
  color: string;
  textColor: string;
  borderColor: string;
  shadow: string;
  bgGradient: string;
}

export const LevelConfig: Record<IntensityLevel, LevelMetadata> = {
  [IntensityLevel.Level1]: {
    label: "Level 1",
    alertName: "核爆级",
    coreDefinition: "生存威胁/彻底崩盘/不可逆毁灭",
    sensoryDescription: "世界末日感拉满，心脏像被锤子砸碎，随时当场暴毙或自爆",
    visualRef: "你这时候已经不是人了，是行尸",
    color: "bg-red-600",
    textColor: "text-red-700",
    borderColor: "border-red-600",
    shadow: "shadow-red-600/50",
    bgGradient: "from-red-950 via-red-900 to-black",
  },
  [IntensityLevel.Level2]: {
    label: "Level 2",
    alertName: "熔断级",
    coreDefinition: "结构性永久损伤/核心信念碎裂",
    sensoryDescription: "活着就是耻辱，自我价值归零，反刍到想死但又不敢死",
    visualRef: "盯着天花板灵魂出窍的虚无脸",
    color: "bg-orange-600",
    textColor: "text-orange-700",
    borderColor: "border-orange-600",
    shadow: "shadow-orange-600/50",
    bgGradient: "from-orange-950 via-orange-900 to-black",
  },
  [IntensityLevel.Level3]: {
    label: "Level 3",
    alertName: "震荡级",
    coreDefinition: "强烈的生理不适/无法集中注意力",
    sensoryDescription: "想吐，手抖，心慌，必须立刻停下手头的事找个地方躲起来",
    visualRef: "抱头蹲防的瑟瑟发抖状",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-500",
    shadow: "shadow-yellow-500/50",
    bgGradient: "from-yellow-100 via-orange-50 to-white",
  },
  [IntensityLevel.Level4]: {
    label: "Level 4",
    alertName: "干扰级",
    coreDefinition: "明显的情绪波动/需要克制",
    sensoryDescription: "像被针扎了一下，虽然能忍但很难受，如果不处理可能会升级",
    visualRef: "皱着眉头的烦躁表情",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    borderColor: "border-blue-500",
    shadow: "shadow-blue-500/50",
    bgGradient: "from-blue-100 via-slate-50 to-white",
  },
  [IntensityLevel.Level5]: {
    label: "Level 5",
    alertName: "噪音级",
    coreDefinition: "轻微不悦/背景噪音",
    sensoryDescription: "听到隔壁装修的声音，有点烦但还能继续干活",
    visualRef: "戴上耳机继续工作的样子",
    color: "bg-teal-500",
    textColor: "text-teal-700",
    borderColor: "border-teal-500",
    shadow: "shadow-teal-500/50",
    bgGradient: "from-teal-100 via-slate-50 to-white",
  },
  [IntensityLevel.Level6]: {
    label: "Level 6",
    alertName: "蚊子级",
    coreDefinition: "几乎无感/正常人波动",
    sensoryDescription: "刷到个沙雕视频笑了两秒就过去了",
    visualRef: "还能正常苟活的普通人脸",
    color: "bg-slate-400",
    textColor: "text-slate-600",
    borderColor: "border-slate-400",
    shadow: "shadow-slate-400/50",
    bgGradient: "from-slate-200 to-white",
  },
};

export const PositiveLevelConfig: Record<IntensityLevel, LevelMetadata> = {
  [IntensityLevel.Level1]: {
    label: "Level 1",
    alertName: "奇迹级",
    coreDefinition: "历史性突破/人生里程碑/极度狂喜",
    sensoryDescription: "感觉自己无所不能，多巴胺爆炸，人生巅峰体验",
    visualRef: "在灯塔顶端放烟花庆祝的人群",
    color: "bg-amber-500",
    textColor: "text-amber-700",
    borderColor: "border-amber-500",
    shadow: "shadow-amber-500/50",
    bgGradient: "from-amber-100 via-orange-50 to-white",
  },
  [IntensityLevel.Level2]: {
    label: "Level 2",
    alertName: "盛世级",
    coreDefinition: "重大成就/极度满足/深度心流",
    sensoryDescription: "浑身充满力量，对未来充满希望，不仅是快乐更是充实",
    visualRef: "灯塔周围欢呼跳跃的人群",
    color: "bg-indigo-500",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-500",
    shadow: "shadow-indigo-500/50",
    bgGradient: "from-indigo-100 via-blue-50 to-white",
  },
  [IntensityLevel.Level3]: {
    label: "Level 3",
    alertName: "繁荣级",
    coreDefinition: "显著进步/高效产出/社交滋养",
    sensoryDescription: "事情都在往好的方向发展，感觉很顺，不仅是舒服",
    visualRef: "灯塔光芒稳定且温暖",
    color: "bg-sky-500",
    textColor: "text-sky-700",
    borderColor: "border-sky-500",
    shadow: "shadow-sky-500/50",
    bgGradient: "from-sky-100 via-cyan-50 to-white",
  },
  [IntensityLevel.Level4]: {
    label: "Level 4",
    alertName: "落成级",
    coreDefinition: "完成任务/自律达成/小确幸",
    sensoryDescription: "今天的计划完成了，心里很踏实，没有负罪感",
    visualRef: "灯塔结构完整，外墙粉刷一新",
    color: "bg-cyan-500",
    textColor: "text-cyan-700",
    borderColor: "border-cyan-500",
    shadow: "shadow-cyan-500/50",
    bgGradient: "from-cyan-100 via-teal-50 to-white",
  },
  [IntensityLevel.Level5]: {
    label: "Level 5",
    alertName: "加固级",
    coreDefinition: "正面尝试/克制冲动/有益行为",
    sensoryDescription: "虽然有点累但知道这对我有好处，比如忍住没吃夜宵",
    visualRef: "灯塔周围搭起了稳固的脚手架",
    color: "bg-teal-500",
    textColor: "text-teal-700",
    borderColor: "border-teal-500",
    shadow: "shadow-teal-500/50",
    bgGradient: "from-teal-100 via-emerald-50 to-white",
  },
  [IntensityLevel.Level6]: {
    label: "Level 6",
    alertName: "基建级",
    coreDefinition: "微小积累/正常作息/无痛感",
    sensoryDescription: "今天过得还行，没什么特别坏的事，按时吃饭睡觉",
    visualRef: "开始清理地基，准备建设",
    color: "bg-emerald-400",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-400",
    shadow: "shadow-emerald-400/50",
    bgGradient: "from-emerald-100 via-green-50 to-white",
  },
};
