/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-19 02:22:59
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-19 04:34:11
 */
import { QUALITY_TYPES } from './enumConfig';

// 基础游戏配置
export const BASE_CONFIG = {
  // 游戏核心常量
  MAX_LEVEL: 100,
  MAX_SKILLS: 12,
  
  // 基础属性
  BASIC_ATTRIBUTES: {
    constitution: "体质",
    strength: "力量",
    agility: "敏捷",
    intelligence: "智力",
    luck: "幸运"
  },

  // 衍生属性配置
  DERIVED_ATTRIBUTES: {
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
  },

  // 品质配置
  QUALITY: {
    names: Object.values(QUALITY_TYPES),
    colors: {
      [QUALITY_TYPES.NORMAL]: "quality-normal",
      [QUALITY_TYPES.RARE]: "quality-rare",
      [QUALITY_TYPES.EPIC]: "quality-epic",
      [QUALITY_TYPES.LEGENDARY]: "quality-legendary",
      [QUALITY_TYPES.MYTHIC]: "quality-mythic",
    },
    attributeMultipliers: [1.0, 1.5, 2.0, 2.5, 3.0],
  },

  // 概率配置
  PROBABILITY: {
    bookSuccessRate: 0.6, // 打书成功率
    skillReplaceChance: 0.3, // 替换已有技能的概率
    initialSkillCount: { min: 1, max: 3 }, // 初始技能数量范围
  }
}; 