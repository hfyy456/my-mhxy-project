/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 01:44:31
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-16 05:44:38
 */
import { petConfig } from "./petConfig";
import { skillConfig } from "./skillConfig";
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
  qualities: ["普通", "优秀", "精良", "卓越", "完美"],
  colors: ["gray-500", "green-500", "blue-500", "purple-500", "yellow-500"],
  attributeMultipliers: [0.8, 0.9, 1.0, 1.1, 1.2],
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
