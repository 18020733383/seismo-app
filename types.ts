export enum IntensityLevel {
  Level1 = 1, // 熔断级 - Meltdown
  Level2 = 2, // 震荡级 - Shock
  Level3 = 3, // 干扰级 - Interference
  Level4 = 4, // 噪音级 - Noise
}

export interface SeismicLog {
  id: string;
  intensity: IntensityLevel;
  content: string;
  isAftershock: boolean;
  timestamp: number;
}

export const LevelConfig = {
  [IntensityLevel.Level1]: {
    label: "Level 1: 熔断级",
    description: "生存威胁 / 彻底崩溃",
    color: "bg-red-500",
    textColor: "text-red-600",
    borderColor: "border-red-500",
    shadow: "shadow-red-500/50",
    bgGradient: "from-red-900 to-black",
  },
  [IntensityLevel.Level2]: {
    label: "Level 2: 震荡级",
    description: "结构性危机 / 极度焦虑",
    color: "bg-orange-500",
    textColor: "text-orange-600",
    borderColor: "border-orange-500",
    shadow: "shadow-orange-500/50",
    bgGradient: "from-orange-700 to-gray-900",
  },
  [IntensityLevel.Level3]: {
    label: "Level 3: 干扰级",
    description: "效率受阻 / 心烦意乱",
    color: "bg-yellow-400",
    textColor: "text-yellow-600",
    borderColor: "border-yellow-400",
    shadow: "shadow-yellow-400/50",
    bgGradient: "from-yellow-200 to-blue-300",
  },
  [IntensityLevel.Level4]: {
    label: "Level 4: 噪音级",
    description: "情绪垃圾 / 轻微不适",
    color: "bg-teal-400",
    textColor: "text-teal-600",
    borderColor: "border-teal-400",
    shadow: "shadow-teal-400/50",
    bgGradient: "from-blue-200 to-cyan-100",
  },
};
