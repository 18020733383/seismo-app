export enum IntensityLevel {
  Level1 = 1, // 核爆级
  Level2 = 2, // 熔断级
  Level3 = 3, // 震荡级
  Level4 = 4, // 干扰级
  Level5 = 5, // 噪音级
  Level6 = 6, // 蚊子级
}

export interface SeismicLog {
  id: string;
  intensity: IntensityLevel;
  content: string;
  isAftershock: boolean;
  timestamp: number;
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
    bgGradient: "from-orange-900 via-gray-900 to-black",
  },
  [IntensityLevel.Level3]: {
    label: "Level 3",
    alertName: "震荡级",
    coreDefinition: "重大连锁危机/情绪地基松动",
    sensoryDescription: "年龄焦虑/proposal无头绪/父母催命，脑子转圈圈想砸东西",
    visualRef: "刷到别人高光后瞬间想死的表情",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-500",
    shadow: "shadow-yellow-500/50",
    bgGradient: "from-yellow-700 via-slate-800 to-slate-900",
  },
  [IntensityLevel.Level4]: {
    label: "Level 4",
    alertName: "干扰级",
    coreDefinition: "效率崩坏/短期尖峰不适",
    sensoryDescription: "明天组会要死了、心率140+、手抖拿不住手机",
    visualRef: "丧尸模式硬撑的社畜鬼样",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    borderColor: "border-blue-500",
    shadow: "shadow-blue-500/50",
    bgGradient: "from-blue-400 via-slate-100 to-white",
  },
  [IntensityLevel.Level5]: {
    label: "Level 5",
    alertName: "噪音级",
    coreDefinition: "日常垃圾情绪/小事放大成烦",
    sensoryDescription: "作业有点烦、外卖洒了、被人阴阳怪气",
    visualRef: "抠手咬指甲的小崩溃",
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
