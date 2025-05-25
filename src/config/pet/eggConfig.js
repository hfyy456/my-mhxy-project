/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-19 01:51:40
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-20 00:59:55
 */
import { QUALITY_TYPES } from '../enumConfig';

// 蛋的配置
export const eggQualityConfig = {
  names: Object.values(QUALITY_TYPES),
  colors: {
    [QUALITY_TYPES.NORMAL]: "normal",
    [QUALITY_TYPES.RARE]: "rare",
    [QUALITY_TYPES.EPIC]: "epic",
    [QUALITY_TYPES.LEGENDARY]: "legendary",
    [QUALITY_TYPES.MYTHIC]: "mythic",
  },
  timeMultiplier: [1.0, 1.5, 2.0, 2.5, 3.0], // 品质对孵化时间的乘数
  weight: [50, 30, 15, 4, 1], // 抽取权重
  // 品质概率表 - 每行代表蛋的品质，每列代表可能获得的召唤兽品质的概率
  petQualityChances: [
    // 普通  稀有  史诗  传说  神话
    [0.80, 0.15, 0.05, 0.00, 0.00], // 普通蛋
    [0.40, 0.40, 0.15, 0.05, 0.00], // 稀有蛋
    [0.20, 0.30, 0.30, 0.15, 0.05], // 史诗蛋
    [0.10, 0.20, 0.30, 0.30, 0.10], // 传说蛋
    [0.00, 0.10, 0.20, 0.40, 0.30], // 神话蛋
  ],
};

export const eggConfig = {
  netherEgg: {
    id: "netherEgg",
    name: "冥灵之蛋",
    description: "散发着幽暗气息的神秘蛋，孵化后可能获得幽灵、吸血鬼、混沌兽或夜叉",
    color: QUALITY_TYPES.EPIC,
    baseHatchTime: 3600,
    possiblePets: ["ghost", "vampire", "chaosBeast", "yaksha"],
    rarity: QUALITY_TYPES.RARE,
    icon: "fa-skull",
  },
  divineEgg: {
    id: "divineEgg",
    name: "神兵之蛋",
    description: "闪耀着金光的神圣蛋，孵化后可能获得持国巡守",
    color: QUALITY_TYPES.LEGENDARY,
    baseHatchTime: 3,
    possiblePets: ["heavenGuard"],
    rarity: QUALITY_TYPES.EPIC,
    icon: "fa-shield-halved",
  },
  spiritEgg: {
    id: "spiritEgg",
    name: "精怪之蛋",
    description: "充满灵气的奇异蛋，孵化后可能获得雷鸟人或猫灵",
    color: QUALITY_TYPES.RARE,
    baseHatchTime: 2700,
    possiblePets: ["thunderBird", "catSpirit"],
    rarity: QUALITY_TYPES.RARE,
    icon: "fa-dragon",
  },
  mechanicalEgg: {
    id: "mechanicalEgg",
    name: "机关之蛋",
    description: "表面有奇特纹路的金属蛋，孵化后可能获得机关鸟",
    color: QUALITY_TYPES.LEGENDARY,
    baseHatchTime: 2400,
    possiblePets: ["mechanicalBird"],
    rarity: QUALITY_TYPES.RARE,
    icon: "fa-gear",
  },
  beastEgg: {
    id: "beastEgg",
    name: "瑞兽之蛋",
    description: "散发祥瑞之气的神秘蛋，孵化后可能获得狂豹或蛟龙",
    color: QUALITY_TYPES.EPIC,
    baseHatchTime: 3300,
    possiblePets: ["wildLeopard", "dragonSnake"],
    rarity: QUALITY_TYPES.EPIC,
    icon: "fa-paw",
  },
  celestialEgg: {
    id: "celestialEgg",
    name: "仙灵之蛋",
    description: "缭绕着仙气的神圣蛋，孵化后可能获得凤凰",
    color: QUALITY_TYPES.MYTHIC,
    baseHatchTime: 3900,
    possiblePets: ["phoenix"],
    rarity: QUALITY_TYPES.LEGENDARY,
    icon: "fa-fire",
  }
}; 