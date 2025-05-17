/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 01:44:31
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-17 03:14:55
 */
/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 01:44:31
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-16 21:11:17
 */
import { petConfig } from "@/config/petConfig";
import { skillConfig } from "@/config/skillConfig";
// 此处可继续导入其他拆分的配置文件

// 合并所有配置，可根据实际需求修改合并方式
export {
  petConfig,
  skillConfig,
  // 此处可继续添加其他配置
};

// 技能类型配置
export const skillTypeConfig = {
  物理: { color: "red-500", icon: "fa-fist-raised" },
  法术: { color: "blue-500", icon: "fa-bolt" },
  防御: { color: "green-500", icon: "fa-shield-alt" },
  辅助: { color: "purple-500", icon: "fa-hand-holding-heart" },
  生存: { color: "yellow-500", icon: "fa-life-ring" },
  速度: { color: "teal-500", icon: "fa-running" },
};

// 品质配置
export const qualityConfig = {
  names: ["普通", "稀有", "史诗", "传说", "神话"],
  colors: {
    普通: "quality-normal",
    稀有: "quality-rare",
    史诗: "quality-epic",
    传说: "quality-legendary",
    神话: "quality-mythic",
  },
  attributeMultipliers: [1.0, 1.5, 2.0, 2.5, 3.0],
};

// 衍生属性配置
export const derivedAttributeConfig = {
  hp: { attributes: ["constitution"], multiplier: 25 },
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
  "饰品",
  "遗物",
  "血脉",
  "符文",
];

// 等级经验配置
// levelExperienceRequirements[level] 表示从 level 级升到 level + 1 级所需的经验值
// 例如 levelExperienceRequirements[1] 是从1级升到2级所需经验
export const levelExperienceRequirements = [
  null, // level 0 (哨兵或未使用)
  100,  // 从 1 级到 2 级
  250,  // 从 2 级到 3 级
  500,  // 从 3 级到 4 级
  800,  // 从 4 级到 5 级
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
export const POINTS_PER_LEVEL = 5; // 每升一级获得的潜力点 (注意: petConfig 中也可能有此设定，需协调)
export const MAX_SKILLS = 12; // 召唤兽最大技能槽数量
export const ACTIVE_SKILL_LIMIT = 2; // 最大可拥有主动技能数量
