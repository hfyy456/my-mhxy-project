import { SKILL_TYPES, SKILL_MODES, SKILL_TARGET_TYPES, PASSIVE_SKILL_TIMING } from './enumConfig';
import { BUFF_TYPES } from './buffConfig';

// 被动技能配置
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
  }
];

// Helper function for passive skillSet
export const getPassiveSkillById = (id) => passiveSkillConfig.find(skill => skill.id === id);
