/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 01:44:31
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-02 05:21:05
 */
import { summonConfig } from "@/config/summon/summonConfig";
import { skillConfig } from "@/config/skill/skillConfig";
import { SKILL_TYPES, EQUIPMENT_SLOT_TYPES } from "@/config/enumConfig";
import { HOMESTEAD_GENERAL_CONFIG, PLOT_TYPES } from "@/config/homestead/homesteadConfig";
import { BUILDINGS, BUILDING_CATEGORIES } from "@/config/homestead/buildingConfig";
// 此处可继续导入其他拆分的配置文件

// 合并所有配置，可根据实际需求修改合并方式
export {
  summonConfig,
  skillConfig,
  HOMESTEAD_GENERAL_CONFIG,
  PLOT_TYPES,
  BUILDINGS,
  BUILDING_CATEGORIES,
  // 此处可继续添加其他配置
};

// 技能类型配置
export const skillTypeConfig = {
  [SKILL_TYPES.PHYSICAL]: { color: "red-500", icon: "fa-fist-raised" },
  [SKILL_TYPES.MAGICAL]: { color: "blue-500", icon: "fa-bolt" },
  [SKILL_TYPES.DEFENSIVE]: { color: "green-500", icon: "fa-shield-alt" },
  [SKILL_TYPES.SUPPORT]: { color: "purple-500", icon: "fa-hand-holding-heart" },
  [SKILL_TYPES.SURVIVAL]: { color: "yellow-500", icon: "fa-life-ring" },
  [SKILL_TYPES.SPEED]: { color: "teal-500", icon: "fa-running" },
};

// 品质配置
export const qualityConfig = {
  names: ["normal", "rare", "epic", "legendary", "mythic"],
  colors: {
    normal: "quality-normal",
    rare: "quality-rare",
    epic: "quality-epic",
    legendary: "quality-legendary",
    mythic: "quality-mythic",
  },
  attributeMultipliers: [1.0, 1.5, 2.0, 2.5, 3.0],
};

// 衍生属性配置
export const derivedAttributeConfig = {
  hp: { attributes: ["constitution"], multiplier: 15 },
  mp: { attributes: ["intelligence"], multiplier: 10 },
  physicalAttack: { attributes: ["strength"], multiplier: 1 },
  magicalAttack: { attributes: ["intelligence"], multiplier: 1 },
  magicalDefense: {
    attributes: ["constitution", "intelligence"],
    multiplier: 0.5,
  },
  physicalDefense: {
    attributes: ["constitution", "strength"],
    multiplier: 0.5,
  },
  speed: { attributes: ["agility"], multiplier: 1.5 },
  critRate: { attributes: ["luck"], multiplier: 0.0005 },
  critDamage: { attributes: ["luck"], multiplier: 0.003 },
  dodgeRate: { attributes: ["luck"], multiplier: 0.0005 },
};

// 概率配置
export const probabilityConfig = {
  bookSuccessRate: 0.6, // 打书成功率
  skillReplaceChance: 0.3, // 替换已有技能的概率
  initialSkillCount: { min: 1, max: 3 }, // 初始技能数量范围
};

export const STANDARD_EQUIPMENT_SLOTS = [
  EQUIPMENT_SLOT_TYPES.ACCESSORY,
  EQUIPMENT_SLOT_TYPES.RELIC,
  EQUIPMENT_SLOT_TYPES.BLOODLINE,
  EQUIPMENT_SLOT_TYPES.RUNE,
];

// 等级经验配置
// levelExperienceRequirements[level] 表示从 level 级升到 level + 1 级所需的经验值
// 例如 levelExperienceRequirements[1] 是从1级升到2级所需经验
export const levelExperienceRequirements = [
  null, // level 0 (哨兵或未使用)
  100, // 从 1 级到 2 级
  250, // 从 2 级到 3 级
  500, // 从 3 级到 4 级
  800, // 从 4 级到 5 级
  1200, // 从 5 级到 6 级
  1700, // 从 6 级到 7 级
  2300, // 从 7 级到 8 级
  3000, // 从 8 级到 9 级
  3800, // 从 9 级到 10 级
  5000, // 从 10 级到 11 级 (示例，可以继续添加)
  // ... add more levels or use a formula if max level is high
];

// 游戏核心设定常量
export const MAX_LEVEL = 100; // 召唤兽最大等级
export const POINTS_PER_LEVEL = 5; // 每升一级获得的潜力点 (注意: summonConfig 中也可能有此设定，需协调)
export const MAX_SKILLS = 12; // 召唤兽最大技能槽数量
export const ACTIVE_SKILL_LIMIT = 2; // 最大可拥有主动技能数量

export const LOADER_WRAPPER_ID = 'loader-wrapper';

// Toast Icon Classes
import { TOAST_TYPES } from "./enumConfig"; // Import TOAST_TYPES

export const TOAST_ICON_CLASSES = {
  [TOAST_TYPES.SUCCESS]: "fa-solid fa-check-circle text-green-500",
  [TOAST_TYPES.ERROR]: "fa-solid fa-times-circle text-red-500",
  [TOAST_TYPES.INFO]: "fa-solid fa-info-circle text-blue-500",
};

// Local Storage Keys
export const LOCAL_STORAGE_SAVES_KEY = 'mhxy_saves';

// Inventory Config
export const INITIAL_INVENTORY_CAPACITY = 20;
export const INITIAL_GOLD = 0;

// Formation Config
export const FORMATION_ROWS = 3;
export const FORMATION_COLS = 3;
