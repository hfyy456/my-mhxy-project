import { SKILL_TYPES, SKILL_MODES, SKILL_TARGET_TYPES, PASSIVE_SKILL_TIMING, ELEMENT_TYPES } from '@/config/enumConfig';
import { BUFF_TYPES } from './buffConfig';

// 被动技能配置
// 被动技能分为几种主要类型：
// 1. 属性增强型：永久提升某些属性
// 2. 触发型：在特定条件下触发效果
// 3. 反应型：对敌人的行动做出反应
// 4. 特殊效果型：具有独特机制的被动技能
export const passiveSkillConfig = [
  {
    id: "magic_critical",
    name: "法术暴击",
    description: "法术攻击时有几率造成双倍伤害",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-bolt",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.BEFORE_MAGIC_SKILL,
    probability: 0.3,
    multiplier: 2.0,
    triggerBuffs: [
      { buffId: "magic_surge", level: 1, target: "self", chance: 0.3 }
    ]
  },
  {
    id: "combo_attack",
    name: "连击",
    description: "物理攻击时可能连续攻击两次",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-strikethrough",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.AFTER_NORMAL_ATTACK,
    probability: 0.25,
    hits: 2,
    triggerBuffs: [
      { buffId: "attack_up", level: 1, target: "self", chance: 0.25, duration: 1 }
    ]
  },
  {
    id: "counter",
    name: "反震",
    description: "受到物理攻击时有几率反弹伤害",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-shield-alt",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ON_PHYSICAL_DAMAGE,
    probability: 0.2,
    reflectPercentage: 0.3,
    triggerBuffs: [
      { buffId: "reflect", level: 1, target: "self", chance: 0.2, duration: 1 }
    ]
  },
  {
    id: "perception",
    name: "感知",
    description: "可以感知到隐身的单位",
    type: SKILL_TYPES.SUPPORT,
    icon: "fa-eye",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    detectRange: 5,
    permanentBuffs: [
      { buffId: "perception", level: 1, target: "self" }
    ]
  },
  {
    id: "magic_heart",
    name: "魔之心",
    description: "增加法术伤害",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-fire",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    magicalDamageBonus: 0.15,
    permanentBuffs: [
      { buffId: "magic_attack_up", level: 1, target: "self" }
    ]
  },
  {
    id: "agility_boost",
    name: "敏捷",
    description: "提升自身速度",
    type: SKILL_TYPES.SPEED,
    icon: "fa-running",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    speedBonus: 0.2,
    permanentBuffs: [
      { buffId: "speed_up", level: 1, target: "self" }
    ]
  },
  {
    id: "luck_boost",
    name: "幸运",
    description: "增加躲避暴击的几率",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-four-leaf-clover",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    critResistance: 0.2,
    permanentBuffs: [
      { buffId: "crit_resistance", level: 1, target: "self" }
    ]
  },
  {
    id: "power_strike",
    name: "强力",
    description: "增加物理攻击伤害",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-bullseye",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    physicalDamageBonus: 0.15,
    permanentBuffs: [
      { buffId: "attack_up", level: 1, target: "self" }
    ]
  },
  {
    id: "magic_chain",
    name: "法术连击",
    description: "法术攻击时可能连续攻击两次",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-bolt-lightning",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.AFTER_MAGIC_SKILL,
    probability: 0.25,
    hits: 2,
    triggerBuffs: [
      { buffId: "magic_attack_up", level: 1, target: "self", chance: 0.25, duration: 1 }
    ]
  },
  {
    id: "night_combat",
    name: "夜战",
    description: "夜间战斗能力增强",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-moon-stars",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.BATTLE_START,
    nightBonusDamage: 0.3
  },
  {
    id: "magic_surge",
    name: "法术波动",
    description: "法术伤害在一定范围内波动",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-wave-square",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.BEFORE_MAGIC_SKILL,
    damageVariation: { min: 0.8, max: 1.4 }
  },
  {
    id: "defense_boost",
    name: "防御",
    description: "增加物理防御能力",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-shield",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    defenseBonus: 0.2,
    permanentBuffs: [
      { buffId: "defense_up", level: 1, target: "self" }
    ]
  },
  {
    id: "critical_strike",
    name: "必杀",
    description: "物理攻击时有几率造成双倍伤害",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-crown",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.BEFORE_NORMAL_ATTACK,
    probability: 0.3,
    multiplier: 2.0,
    triggerBuffs: [
      { buffId: "attack_up", level: 2, target: "self", chance: 0.3, duration: 1 }
    ]
  },
  {
    id: "divine_protection",
    name: "神佑复生",
    description: "战斗中死亡时有几率复活",
    type: SKILL_TYPES.SURVIVAL,
    icon: "fa-life-ring",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ON_DEATH,
    probability: 0.15,
    reviveHealthPercentage: 0.3,
    triggerBuffs: [
      { buffId: "regeneration", level: 2, target: "self", chance: 1.0, duration: 3 }
    ]
  },
  {
    id: "sneak_attack",
    name: "偷袭",
    description: "物理攻击时不会受到反击",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-dagger",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.BEFORE_PHYSICAL_SKILL,
    bonusDamage: 0.2
  },
  {
    id: "divine_might",
    name: "神力",
    description: "增加所有攻击伤害",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-hand-fist",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    damageBonus: 0.2
  },
  {
    id: "magic_resistance",
    name: "魔法抗性",
    description: "减少受到的法术伤害",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-hat-wizard",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ON_MAGICAL_DAMAGE,
    magicResistance: 0.2,
    permanentBuffs: [
      { buffId: "magic_defense_up", level: 1, target: "self" }
    ],
    triggerBuffs: [
      { buffId: "magic_defense_up", level: 1, target: "self", chance: 0.3, duration: 1 }
    ]
  },
  {
    id: "life_force",
    name: "生命力",
    description: "增加最大生命值",
    type: SKILL_TYPES.SURVIVAL,
    icon: "fa-heart",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    healthBonus: 0.2
  },
  {
    id: "mana_flow",
    name: "法力流",
    description: "增加最大法力值",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-droplet",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    manaBonus: 0.2
  },
  {
    id: "elemental_mastery",
    name: "元素掌控",
    description: "增加元素伤害",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-wand-sparkles",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    elementalDamageBonus: 0.15
  },
  {
    id: "quick_recovery",
    name: "快速恢复",
    description: "每回合恢复少量生命值",
    type: SKILL_TYPES.SURVIVAL,
    icon: "fa-heart-pulse",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.TURN_START,
    healthRecovery: 0.05
  },
  {
    id: "mana_regeneration",
    name: "法力再生",
    description: "每回合恢复少量法力值",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-droplet-percent",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.TURN_START,
    manaRecovery: 0.05
  },
  {
    id: "first_strike",
    name: "先发制人",
    description: "战斗开始时有几率先手攻击",
    type: SKILL_TYPES.SPEED,
    icon: "fa-bolt-lightning",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.BATTLE_START,
    probability: 0.3
  },
  {
    id: "damage_reduction",
    name: "伤害减免",
    description: "减少受到的所有伤害",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-shield-heart",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ON_ANY_DAMAGE,
    damageReduction: 0.1
  },
  {
    id: "spirit_link",
    name: "灵魂链接",
    description: "与主人共享部分生命值",
    type: SKILL_TYPES.SUPPORT,
    icon: "fa-link",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.AFTER_DAMAGE,
    linkPercentage: 0.2
  },
  {
    id: "elemental_resistance",
    name: "元素抗性",
    description: "减少受到的元素伤害",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-fire-flame-simple",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ON_MAGICAL_DAMAGE,
    elementalResistance: 0.15
  },
  {
    id: "dodge",
    name: "闪避",
    description: "有几率完全闪避普通攻击",
    type: SKILL_TYPES.SPEED,
    icon: "fa-person-running",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.BEFORE_NORMAL_ATTACK,
    dodgeChance: 0.15
  },
  // 元素增强类被动技能
  {
    id: "fire_mastery",
    name: "火系精通",
    description: "增加火系技能伤害，减少受到的火系伤害",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-fire",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    elementType: ELEMENT_TYPES.FIRE,
    elementDamageBonus: 0.2, // 增加20%火系伤害
    elementResistance: 0.15, // 减少15%受到的火系伤害
    permanentBuffs: [
      { buffId: "fire_power", level: 1, target: "self" }
    ]
  },
  {
    id: "water_mastery",
    name: "水系精通",
    description: "增加水系技能伤害，减少受到的水系伤害",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-water",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    elementType: ELEMENT_TYPES.WATER,
    elementDamageBonus: 0.2,
    elementResistance: 0.15,
    permanentBuffs: [
      { buffId: "water_power", level: 1, target: "self" }
    ]
  },
  {
    id: "thunder_mastery",
    name: "雷系精通",
    description: "增加雷系技能伤害，减少受到的雷系伤害",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-bolt",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    elementType: ELEMENT_TYPES.THUNDER,
    elementDamageBonus: 0.2,
    elementResistance: 0.15,
    permanentBuffs: [
      { buffId: "thunder_power", level: 1, target: "self" }
    ]
  },
  // 战斗机制类被动技能
  {
    id: "first_strike",
    name: "先手",
    description: "战斗开始时有几率立即行动一次",
    type: SKILL_TYPES.SPEED,
    icon: "fa-forward",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.BATTLE_START,
    probability: 0.3,
    extraAction: true,
    triggerBuffs: [
      { buffId: "speed_up", level: 1, target: "self", chance: 1.0, duration: 1 }
    ]
  },
  {
    id: "last_stand",
    name: "背水一战",
    description: "生命值低于30%时，攻击和防御大幅提升",
    type: SKILL_TYPES.SURVIVAL,
    icon: "fa-skull",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ON_ANY_DAMAGE,
    conditions: {
      hpPercentBelow: 30
    },
    probability: 1.0, // 100%触发
    triggerBuffs: [
      { buffId: "last_stand", level: 1, target: "self", chance: 1.0, duration: 3 }
    ]
  },
  {
    id: "vengeance",
    name: "复仇",
    description: "队友被击败时，获得攻击和速度提升",
    type: SKILL_TYPES.ATTACK,
    icon: "fa-gavel",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALLY_DEFEATED,
    probability: 1.0,
    triggerBuffs: [
      { buffId: "attack_up", level: 2, target: "self", chance: 1.0, duration: 3 },
      { buffId: "speed_up", level: 1, target: "self", chance: 1.0, duration: 3 }
    ]
  },
  {
    id: "life_link",
    name: "生命链接",
    description: "战斗开始时，与随机一名队友建立生命链接，共享伤害",
    type: SKILL_TYPES.SUPPORT,
    icon: "fa-link",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.BATTLE_START,
    probability: 0.8,
    damageSharing: 0.3, // 分担30%伤害
    permanentBuffs: [
      { buffId: "life_link", level: 1, target: "self" },
      { buffId: "life_link", level: 1, target: "ally" }
    ]
  },
  {
    id: "mana_shield",
    name: "法力护盾",
    description: "受到伤害时，消耗MP抵消部分伤害",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-shield-alt",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ON_ANY_DAMAGE,
    probability: 0.7,
    mpToHpRatio: 2, // 每1点MP可以抵消2点伤害
    triggerBuffs: [
      { buffId: "mana_shield", level: 1, target: "self", chance: 1.0, duration: 1 }
    ]
  },
  {
    id: "thorns",
    name: "荆棘",
    description: "受到近战攻击时，对攻击者造成少量伤害",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-cactus",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ON_PHYSICAL_DAMAGE,
    probability: 1.0,
    reflectDamage: 5, // 固定反弹5点伤害
    reflectPercentage: 0.1, // 额外反弹10%伤害
    permanentBuffs: [
      { buffId: "thorns", level: 1, target: "self" }
    ]
  },
  {
    id: "vampiric_touch",
    name: "吸血",
    description: "攻击时有几率吸取目标生命值",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-droplet",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.AFTER_ANY_ATTACK,
    probability: 0.3,
    lifeStealPercent: 0.2, // 吸取造成伤害的20%
    triggerBuffs: [
      { buffId: "vampiric_aura", level: 1, target: "self", chance: 0.3, duration: 1 }
    ]
  },
  {
    id: "meditation",
    name: "冥想",
    description: "回合结束时恢复少量MP",
    type: SKILL_TYPES.SUPPORT,
    icon: "fa-brain",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.TURN_END,
    probability: 1.0,
    mpRecovery: 5, // 每回合恢复5点MP
    permanentBuffs: [
      { buffId: "meditation", level: 1, target: "self" }
    ]
  },
  {
    id: "elemental_harmony",
    name: "元素和谐",
    description: "使用元素技能后，下一个不同元素的技能威力提升",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-yin-yang",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.AFTER_MAGIC_SKILL,
    probability: 0.8,
    elementalBonus: 0.25, // 提升25%伤害
    triggerBuffs: [
      { buffId: "elemental_harmony", level: 1, target: "self", chance: 0.8, duration: 2 }
    ]
  },
  {
    id: "magic_defense",
    name: "魔法防御占位",
    description: "占位符技能 - 减少受到的法术伤害。",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-shield-alt",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ON_MAGICAL_DAMAGE,
    magicResistance: 0.1, // 示例值
    permanentBuffs: [{ buffId: "magic_defense_placeholder", level: 1, target: "self" }]
  },
  {
    id: "turtle_shell",
    name: "龟甲术占位",
    description: "占位符技能 - 大幅提升物理和法术防御力。",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-shield-halved",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    defenseBonus: 0.15, // 示例值
    magicResistance: 0.15, // 示例值
    permanentBuffs: [{ buffId: "turtle_shell_placeholder", level: 1, target: "self" }]
  },
  {
    id: "moonlight_power",
    name: "月华之力占位",
    description: "占位符技能 - 提升自身某种属性或提供持续恢复。",
    type: SKILL_TYPES.SUPPORT,
    icon: "fa-moon",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    // Placeholder effect, e.g., mana regeneration
    manaRecovery: 0.05, // 示例值
    permanentBuffs: [{ buffId: "moonlight_power_placeholder", level: 1, target: "self" }]
  },
  {
    id: "omniscience",
    name: "全知占位",
    description: "占位符技能 - 拥有洞察敌人信息或特殊战场感知能力。",
    type: SKILL_TYPES.SUPPORT,
    icon: "fa-brain",
    mode: SKILL_MODES.PASSIVE,
    targetType: SKILL_TARGET_TYPES.NONE,
    timing: PASSIVE_SKILL_TIMING.ALWAYS,
    // Placeholder effect, e.g., increased accuracy or crit chance
    accuracyBonus: 0.1, // 示例值
    permanentBuffs: [{ buffId: "omniscience_placeholder", level: 1, target: "self" }]
  }
];

/**
 * 获取被动技能配置
 * @param {string} id - 被动技能ID
 * @returns {Object|null} - 被动技能配置或null
 */
export const getPassiveSkillById = (id) => {
  return passiveSkillConfig.find(skill => skill.id === id);
};

/**
 * 获取指定类型的所有被动技能
 * @param {string} type - 技能类型
 * @returns {Array} - 被动技能数组
 */
export const getPassiveSkillsByType = (type) => {
  return passiveSkillConfig.filter(skill => skill.type === type);
};

/**
 * 获取指定触发时机的所有被动技能
 * @param {string} timing - 触发时机
 * @returns {Array} - 被动技能数组
 */
export const getPassiveSkillsByTiming = (timing) => {
  return passiveSkillConfig.filter(skill => skill.timing === timing);
};
