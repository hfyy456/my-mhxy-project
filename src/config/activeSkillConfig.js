import {
  SKILL_TYPES,
  SKILL_MODES,
  ELEMENT_TYPES,
  SKILL_TARGET_TYPES,
  SKILL_AREA_TYPES,
} from "./enumConfig";
import { BUFF_TYPES } from "./buffConfig";

// 主动技能配置
export const activeSkillConfig = [
  {
    id: "stealth",
    name: "隐身",
    description: "可以隐藏自己的身形",
    type: SKILL_TYPES.SUPPORT,
    icon: "fa-moon",
    mode: SKILL_MODES.ACTIVE,
    targetType: SKILL_TARGET_TYPES.SELF,
    cooldownRounds: 5, // 冷却5回合
    mpCost: 15, // 法力消耗15点
    applyBuffs: [
      { buffId: "stealth", level: 1 }, // 应用隐身BUFF
    ],
  },
  {
    id: "water_mountain",
    name: "水漫金山",
    description: "施展水属性法术攻击多个目标",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-water",
    mode: SKILL_MODES.ACTIVE,
    targetType: SKILL_TARGET_TYPES.GROUP,
    attackDistance: 3,
    areaType: SKILL_AREA_TYPES.CROSS,
    damage: 1.2,
    element: ELEMENT_TYPES.WATER,
    cooldownRounds: 3, // 冷却3回合
    mpCost: 20, // 法力消耗20点
    applyBuffs: [
      { buffId: "speed_down", level: 1, chance: 0.3 }, // 30%几率降低目标速度
    ],
  },
  {
    id: "fire_spell",
    name: "烈火",
    description: "施展火属性法术攻击目标",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-fire-flame-curved",
    mode: SKILL_MODES.ACTIVE,
    targetType: SKILL_TARGET_TYPES.SINGLE,
    attackDistance: 2,
    damage: 1.8,
    element: ELEMENT_TYPES.FIRE,
    cooldownRounds: 2, // 冷却2回合
    mpCost: 25, // 法力消耗25点
    applyBuffs: [
      { buffId: "burn", level: 1 }, // 应用灼烧BUFF
    ],
  },
  {
    id: "thunder_strike",
    name: "雷击",
    description: "召唤雷电攻击敌人",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-bolt",
    mode: SKILL_MODES.ACTIVE,
    targetType: SKILL_TARGET_TYPES.SINGLE,
    attackDistance: 3,
    damage: 2.0,
    element: ELEMENT_TYPES.THUNDER,
    cooldownRounds: 3, // 冷却3回合
    mpCost: 30, // 法力消耗30点
    applyBuffs: [
      { buffId: "stun", level: 1, chance: 0.3 }, // 30%几率眩晕目标
    ],
  },
  {
    id: "thunder_spell",
    name: "奔雷咒",
    description: "召唤雷电群体攻击敌人",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-bolt",
    mode: SKILL_MODES.ACTIVE,
    targetType: SKILL_TARGET_TYPES.GROUP,
    attackDistance: 3,
    damage: 1.5,
    element: ELEMENT_TYPES.THUNDER,
    cooldownRounds: 3, // 冷却3回合
    mpCost: 30, // 法力消耗30点
    applyBuffs: [],
  },
  {
    id: "healing_light",
    name: "治愈之光",
    description: "恢复目标生命值并提供持续治疗效果",
    type: SKILL_TYPES.SUPPORT,
    icon: "fa-hand-holding-medical",
    mode: SKILL_MODES.ACTIVE,
    targetType: SKILL_TARGET_TYPES.SINGLE,
    attackDistance: 2,
    healAmount: 1.5,
    cooldownRounds: 2, // 冷却2回合
    mpCost: 20, // 法力消耗20点
    applyBuffs: [
      { buffId: "regeneration", level: 1 }, // 应用生命恢复BUFF
    ],
  },
  {
    id: "earth_shield",
    name: "大地护盾",
    description: "为目标提供一个吸收伤害的护盾",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-shield-halved",
    mode: SKILL_MODES.ACTIVE,
    targetType: SKILL_TARGET_TYPES.SINGLE,
    attackDistance: 1,
    cooldownRounds: 3, // 冷却3回合
    mpCost: 25, // 法力消耗25点
    applyBuffs: [
      { buffId: "shield", level: 1 }, // 应用护盾BUFF
      { buffId: "defense_up", level: 1 }, // 同时提高防御
    ],
  },
  {
    id: "wind_slash",
    name: "风之刃",
    description: "释放风刃攻击敌人，降低其防御",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-wind",
    mode: SKILL_MODES.ACTIVE,
    targetType: SKILL_TARGET_TYPES.SINGLE,
    attackDistance: 2,
    damage: 1.6,
    element: ELEMENT_TYPES.WIND,
    cooldownRounds: 2, // 冷却2回合
    mpCost: 18, // 法力消耗18点
    applyBuffs: [
      { buffId: "defense_down", level: 1 }, // 降低目标防御
    ],
  },
  {
    id: "poison_cloud",
    name: "毒云",
    description: "释放毒云攻击敌方区域",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-cloud",
    mode: SKILL_MODES.ACTIVE,
    targetType: SKILL_TARGET_TYPES.GROUP,
    attackDistance: 3,
    areaType: SKILL_AREA_TYPES.SQUARE,
    damage: 0.8,
    element: ELEMENT_TYPES.POISON,
    cooldownRounds: 4, // 冷却4回合
    applyBuffs: [
      { buffId: "poison", level: 1 }, // 应用中毒BUFF
    ],
  },
  {
    id: "rock_smash",
    name: "碎岩击",
    description: "用大地之力攻击敌人，有几率使其沉默",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-hill-rockslide",
    mode: SKILL_MODES.ACTIVE,
    targetType: SKILL_TARGET_TYPES.SINGLE,
    attackDistance: 1,
    damage: 2.2,
    element: ELEMENT_TYPES.EARTH,
    cooldownRounds: 2, // 冷却2回合
    applyBuffs: [
      { buffId: "silence", level: 1, chance: 0.25 }, // 25%几率使目标沉默
    ],
  },
  {
    id: "ice_prison",
    name: "冰牢",
    description: "将敌人冻结在冰牢中",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-snowflake",
    mode: SKILL_MODES.ACTIVE,
    targetType: SKILL_TARGET_TYPES.SINGLE,
    attackDistance: 2,
    damage: 1.0,
    element: ELEMENT_TYPES.WATER,
    cooldownRounds: 4, // 冷却4回合
    applyBuffs: [
      { buffId: "freeze", level: 1 }, // 应用冻结BUFF
    ],
  },
  {
    id: "storm_judgment",
    name: "风雷天威",
    description:
      "召唤风暴与雷霆之力，对敌方全体造成伤害，并有几率附加麻痹或禁锢效果。",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-cloud-bolt",
    mode: SKILL_MODES.ACTIVE,
    targetType: SKILL_TARGET_TYPES.GROUP,
    attackDistance: 4,
    areaType: SKILL_AREA_TYPES.SQUARE,
    damage: 1.8,
    element: ELEMENT_TYPES.THUNDER,
    cooldownRounds: 5, // 冷却5回合
    mpCost: 40, // 法力消耗40点
    applyBuffs: [
      { buffId: "stun", level: 2, chance: 0.4 }, // 40%几率眩晕目标，更高等级
      { buffId: "speed_down", level: 1, chance: 0.6 }, // 60%几率降低速度
    ],
  },
];

// Helper function for active skillSet
export const getActiveSkillById = (id) =>
  activeSkillConfig.find((skill) => skill.id === id);
