import { SKILL_TYPES, SKILL_MODES } from './enumConfig';

// 技能配置
export const skillConfig = [
  {
    id: "magic_critical",
    name: "法术暴击",
    description: "法术攻击时有几率造成双倍伤害",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-bolt",
    mode: SKILL_MODES.PASSIVE,
    probability: 0.3,
    multiplier: 2.0
  },
  {
    id: "combo_attack",
    name: "连击",
    description: "物理攻击时可能连续攻击两次",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-strikethrough",
    mode: SKILL_MODES.PASSIVE,
    probability: 0.25,
    hits: 2
  },
  {
    id: "counter",
    name: "反震",
    description: "受到物理攻击时有几率反弹伤害",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-shield-alt",
    mode: SKILL_MODES.PASSIVE,
    probability: 0.2,
    reflectPercentage: 0.3
  },
  {
    id: "perception",
    name: "感知",
    description: "可以感知到隐身的单位",
    type: SKILL_TYPES.SUPPORT,
    icon: "fa-eye",
    mode: SKILL_MODES.PASSIVE,
    detectRange: 5
  },
  {
    id: "stealth",
    name: "隐身",
    description: "可以隐藏自己的身形",
    type: SKILL_TYPES.SUPPORT,
    icon: "fa-moon",
    mode: SKILL_MODES.ACTIVE,
    duration: 10,
    cooldown: 30
  },
  {
    id: "magic_heart",
    name: "魔之心",
    description: "增加法术伤害",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-fire",
    mode: SKILL_MODES.PASSIVE,
    magicalDamageBonus: 0.15
  },
  {
    id: "agility_boost",
    name: "敏捷",
    description: "提升自身速度",
    type: SKILL_TYPES.SPEED,
    icon: "fa-running",
    mode: SKILL_MODES.PASSIVE,
    speedBonus: 0.2
  },
  {
    id: "luck_boost",
    name: "幸运",
    description: "增加躲避暴击的几率",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-four-leaf-clover",
    mode: SKILL_MODES.PASSIVE,
    critResistance: 0.2
  },
  {
    id: "power_strike",
    name: "强力",
    description: "增加物理攻击伤害",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-bullseye",
    mode: SKILL_MODES.PASSIVE,
    physicalDamageBonus: 0.15
  },
  {
    id: "magic_chain",
    name: "法术连击",
    description: "法术攻击时可能连续攻击两次",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-bolt-lightning",
    mode: SKILL_MODES.PASSIVE,
    probability: 0.25,
    hits: 2
  },
  {
    id: "night_combat",
    name: "夜战",
    description: "夜间战斗能力增强",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-moon-stars",
    mode: SKILL_MODES.PASSIVE,
    nightBonusDamage: 0.3
  },
  {
    id: "magic_surge",
    name: "法术波动",
    description: "法术伤害在一定范围内波动",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-wave-square",
    mode: SKILL_MODES.PASSIVE,
    damageVariation: { min: 0.8, max: 1.4 }
  },
  {
    id: "water_mountain",
    name: "水漫金山",
    description: "施展水属性法术攻击多个目标",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-water",
    mode: SKILL_MODES.ACTIVE,
    damage: 1.2,
    targets: 3,
    cooldown: 15
  },
  {
    id: "fire_spell",
    name: "烈火",
    description: "施展火属性法术攻击目标",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-fire-flame-curved",
    mode: SKILL_MODES.ACTIVE,
    damage: 1.8,
    burnDuration: 3,
    cooldown: 10
  },
  {
    id: "defense_boost",
    name: "防御",
    description: "增加物理防御能力",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-shield",
    mode: SKILL_MODES.PASSIVE,
    defenseBonus: 0.2
  },
  {
    id: "critical_strike",
    name: "必杀",
    description: "物理攻击时有几率造成双倍伤害",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-crown",
    mode: SKILL_MODES.PASSIVE,
    probability: 0.3,
    multiplier: 2.0
  },
  {
    id: "divine_protection",
    name: "神佑复生",
    description: "战斗中死亡时有几率复活",
    type: SKILL_TYPES.SURVIVAL,
    icon: "fa-life-ring",
    mode: SKILL_MODES.PASSIVE,
    probability: 0.15,
    reviveHealthPercentage: 0.3
  },
  {
    id: "sneak_attack",
    name: "偷袭",
    description: "物理攻击时不会受到反击",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-dagger",
    mode: SKILL_MODES.PASSIVE,
    bonusDamage: 0.2
  },
  {
    id: "divine_might",
    name: "神威",
    description: "增加所有攻击的伤害",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-crown",
    mode: SKILL_MODES.PASSIVE,
    allDamageBonus: 0.1
  }
];