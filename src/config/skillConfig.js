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
  },
  {
    id: "tiger_roar",
    name: "虎啸",
    description: "发出震慑心魄的虎啸，降低敌人的攻击力和防御力",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-lion",
    mode: SKILL_MODES.ACTIVE,
    damage: 1.2,
    debuff: {
      attackReduction: 0.2,
      defenseReduction: 0.2,
      duration: 3
    },
    cooldown: 15
  },
  {
    id: "turtle_shell",
    name: "龟甲",
    description: "激活龟甲护盾，大幅提升防御力",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-shield-virus",
    mode: SKILL_MODES.ACTIVE,
    defenseBoost: 0.5,
    duration: 5,
    cooldown: 20
  },
  {
    id: "water_escape",
    name: "水遁",
    description: "遁入水中，暂时隐身并恢复生命值",
    type: SKILL_TYPES.SURVIVAL,
    icon: "fa-water",
    mode: SKILL_MODES.ACTIVE,
    stealthDuration: 3,
    healing: 0.3,
    cooldown: 25
  },
  {
    id: "life_death_book",
    name: "生死簿",
    description: "翻开生死簿，对敌人造成持续伤害",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-book-dead",
    mode: SKILL_MODES.ACTIVE,
    damage: 1.5,
    dotDamage: 0.2,
    dotDuration: 5,
    cooldown: 20
  },
  {
    id: "ghost_fire",
    name: "鬼火",
    description: "释放幽冥鬼火，造成范围伤害",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-fire",
    mode: SKILL_MODES.ACTIVE,
    damage: 1.3,
    area: 3,
    cooldown: 12
  },
  {
    id: "yin_yang_switch",
    name: "阴阳转换",
    description: "切换阴阳状态，改变技能效果",
    type: SKILL_TYPES.SUPPORT,
    icon: "fa-yin-yang",
    mode: SKILL_MODES.ACTIVE,
    duration: 10,
    cooldown: 30
  },
  {
    id: "nether_portal",
    name: "冥界之门",
    description: "打开通往冥界的大门，将敌人短暂传送至冥界",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-door-open",
    mode: SKILL_MODES.ACTIVE,
    duration: 3,
    cooldown: 40
  },
  {
    id: "moonlight_power",
    name: "月光之力",
    description: "吸收月光之力，提升自身属性",
    type: SKILL_TYPES.SUPPORT,
    icon: "fa-moon",
    mode: SKILL_MODES.ACTIVE,
    buffs: {
      agility: 0.3,
      intelligence: 0.2,
      luck: 0.2
    },
    duration: 8,
    cooldown: 25
  },
  {
    id: "jump_attack",
    name: "跳跃攻击",
    description: "高高跃起后发动强力攻击",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-person-running",
    mode: SKILL_MODES.ACTIVE,
    damage: 1.6,
    cooldown: 15
  },
  {
    id: "healing",
    name: "治疗",
    description: "恢复目标生命值",
    type: SKILL_TYPES.SUPPORT,
    icon: "fa-heart",
    mode: SKILL_MODES.ACTIVE,
    healing: 0.4,
    cooldown: 10
  },
  {
    id: "thunder_spell",
    name: "雷击",
    description: "召唤雷电攻击敌人",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-bolt",
    mode: SKILL_MODES.ACTIVE,
    damage: 1.8,
    stunDuration: 1,
    cooldown: 15
  },
  {
    id: "divine_power",
    name: "神力",
    description: "被动提升大量攻击力。",
    type: SKILL_TYPES.PHYSICAL,
    icon: "fa-fist-raised",
    mode: SKILL_MODES.PASSIVE,
    attackBonus: 0.25
  },
  {
    id: "chaos_devour",
    name: "混沌吞噬",
    description: "释放混沌之力吞噬目标，造成毁灭性伤害，并将部分伤害转化为自身生命值。",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-skull-crossbones",
    mode: SKILL_MODES.ACTIVE,
    damageMultiplier: 3.0,
    lifestealPercentage: 0.5,
    cooldown: 25,
    manaCost: 100
  },
  {
    id: "storm_judgment",
    name: "风雷天威",
    description: "召唤风暴与雷霆之力，对敌方全体造成伤害，并有几率附加麻痹或禁锢效果。",
    type: SKILL_TYPES.MAGICAL,
    icon: "fa-cloud-bolt",
    mode: SKILL_MODES.ACTIVE,
    damageMultiplier: 1.8,
    targets: "all",
    statusEffects: [
      { type: "paralysis", chance: 0.2, duration: 2 },
      { type: "immobilize", chance: 0.15, duration: 1 }
    ],
    cooldown: 20,
    manaCost: 120
  },
  {
    id: "omniscience",
    name: "通晓万物",
    description: "白泽天生通晓一切，大幅提升自身暴击率、命中率和闪避率。战斗开始时，有一定几率看破敌方一名单位的弱点，使其受到的所有伤害增加，持续数回合。",
    type: SKILL_TYPES.SUPPORT,
    icon: "fa-book-open",
    mode: SKILL_MODES.PASSIVE,
    critRateBonus: 0.20,
    accuracyBonus: 0.20,
    dodgeRateBonus: 0.15,
    revealWeaknessChance: 0.30,
    weaknessTargetCount: 1,
    weaknessDamageIncrease: 0.25,
    weaknessDuration: 3
  },
  {
    id: "magic_defense",
    name: "法术防御",
    description: "被动提升法术防御力。",
    type: SKILL_TYPES.DEFENSIVE,
    icon: "fa-shield-alt",
    mode: SKILL_MODES.PASSIVE,
    effects: {
      magicalDefenseBonusPercentage: 0.2
    }
  }
];