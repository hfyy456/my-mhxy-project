/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-01 05:38:08
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-01 05:38:08
 * @FilePath: \my-mhxy-project\src\config\character\towerEnemyConfig.js
 * @Description: 封妖塔敌人配置文件
 */

import { ELEMENT_TYPES, FIVE_ELEMENTS } from '@/config/enumConfig';

// 封妖塔特有敌人配置
export const towerEnemyConfig = {
  // 第10层BOSS - 火焰魔王
  fire_demon_lord: {
    id: "fire_demon_lord",
    name: "火焰魔王",
    level: 10,
    spriteAssetKey: "fire_demon_lord_sprite", // 需要添加对应的精灵图
    stats: {
      maxHp: 500,
      maxMp: 100,
      attack: 35,
      defense: 20,
      speed: 12,
      hitRate: 0.95,
      dodgeRate: 0.08,
      critRate: 0.1,
      critDamageMultiplier: 1.8,
    },
    element: ELEMENT_TYPES.FIRE,
    fiveElement: FIVE_ELEMENTS.FIRE,
    attackRange: 3,
    skillSet: ["basic_attack", "flame_burst", "fire_shield", "inferno"], // 需要在skillConfig中添加这些技能
    rewards: {
      experience: 500,
      gold: 1000,
      items: [
        { itemId: "fire_essence", dropChance: 1.0, quantity: 3 }, // 火元素精华，100%掉落
        { itemId: "fire_demon_core", dropChance: 0.5, quantity: 1 }, // 火魔核心，50%掉落
        { itemId: "equipment_fire_ring", dropChance: 0.3, quantity: 1 }, // 火焰戒指，30%掉落
      ],
    },
    // BOSS特有属性
    isBoss: true,
    bossAbilities: [
      {
        name: "烈焰护体",
        description: "每回合开始时，有30%几率获得火焰护盾，减免下一次受到的伤害50%",
        triggerChance: 0.3,
        effect: "damage_reduction",
        value: 0.5,
        duration: 1
      },
      {
        name: "火焰爆发",
        description: "生命值低于30%时，对所有敌人造成火属性伤害，并提高自身攻击力20%",
        triggerHealthPercent: 0.3,
        effect: "aoe_damage",
        damageType: ELEMENT_TYPES.FIRE,
        damageValue: 50,
        selfBuff: {
          stat: "attack",
          value: 0.2,
          duration: -1 // 永久
        }
      }
    ]
  },
  
  // 第20层BOSS - 水晶巨蟹
  crystal_crab_king: {
    id: "crystal_crab_king",
    name: "水晶巨蟹",
    level: 20,
    spriteAssetKey: "crystal_crab_king_sprite", // 需要添加对应的精灵图
    stats: {
      maxHp: 1200,
      maxMp: 150,
      attack: 60,
      defense: 50,
      speed: 8,
      hitRate: 0.9,
      dodgeRate: 0.05,
      critRate: 0.08,
      critDamageMultiplier: 1.6,
    },
    element: ELEMENT_TYPES.WATER,
    fiveElement: FIVE_ELEMENTS.WATER,
    attackRange: 2,
    skillSet: ["basic_attack", "water_cannon", "crystal_shield", "tidal_wave"], // 需要在skillConfig中添加这些技能
    rewards: {
      experience: 1000,
      gold: 2000,
      items: [
        { itemId: "water_essence", dropChance: 1.0, quantity: 5 }, // 水元素精华，100%掉落
        { itemId: "crystal_fragment", dropChance: 0.6, quantity: 2 }, // 水晶碎片，60%掉落
        { itemId: "equipment_water_amulet", dropChance: 0.35, quantity: 1 }, // 水灵护符，35%掉落
      ],
    },
    // BOSS特有属性
    isBoss: true,
    bossAbilities: [
      {
        name: "水晶甲壳",
        description: "受到暴击伤害时，有50%几率反弹20%伤害给攻击者",
        triggerOnCrit: true,
        triggerChance: 0.5,
        effect: "damage_reflect",
        value: 0.2
      },
      {
        name: "潮汐庇护",
        description: "每3回合，为自身恢复10%最大生命值",
        triggerTurnInterval: 3,
        effect: "heal_percent",
        value: 0.1
      }
    ]
  },
  
  // 第30层BOSS - 雷霆鹰王
  thunder_eagle_king: {
    id: "thunder_eagle_king",
    name: "雷霆鹰王",
    level: 30,
    spriteAssetKey: "thunder_eagle_king_sprite", // 需要添加对应的精灵图
    stats: {
      maxHp: 2000,
      maxMp: 300,
      attack: 100,
      defense: 70,
      speed: 18, // 非常快
      hitRate: 0.95,
      dodgeRate: 0.15,
      critRate: 0.12,
      critDamageMultiplier: 2.0,
    },
    element: ELEMENT_TYPES.THUNDER,
    fiveElement: FIVE_ELEMENTS.METAL, // 金属性
    attackRange: 4, // 攻击范围大
    skillSet: ["basic_attack", "lightning_strike", "thunder_call", "storm_rage"], // 需要在skillConfig中添加这些技能
    rewards: {
      experience: 2000,
      gold: 3500,
      items: [
        { itemId: "thunder_essence", dropChance: 1.0, quantity: 8 }, // 雷电精华，100%掉落
        { itemId: "eagle_feather", dropChance: 0.7, quantity: 3 }, // 鹰王羽毛，70%掉落
        { itemId: "equipment_thunder_talisman", dropChance: 0.4, quantity: 1 }, // 雷霆符咒，40%掉落
      ],
    },
    // BOSS特有属性
    isBoss: true,
    bossAbilities: [
      {
        name: "雷霆之怒",
        description: "攻击有15%几率附加雷电伤害，并使目标眩晕1回合",
        triggerChance: 0.15,
        effect: "additional_damage",
        damageType: ELEMENT_TYPES.THUNDER,
        damageValue: 30,
        statusEffect: {
          type: "stun",
          duration: 1
        }
      },
      {
        name: "疾风羽翼",
        description: "受到攻击后，有25%几率提高闪避率20%，持续2回合",
        triggerOnDamaged: true,
        triggerChance: 0.25,
        effect: "stat_boost",
        stat: "dodgeRate",
        value: 0.2,
        duration: 2
      },
      {
        name: "风雷万钧",
        description: "生命值低于40%时，对所有敌人造成大量雷电伤害，并恢复自身15%生命值",
        triggerHealthPercent: 0.4,
        effect: "aoe_damage",
        damageType: ELEMENT_TYPES.THUNDER,
        damageValue: 120,
        selfHeal: {
          type: "percent",
          value: 0.15
        }
      }
    ]
  },
  
  // 第40层BOSS - 幽冥使者
  nether_messenger: {
    id: "nether_messenger",
    name: "幽冥使者",
    level: 40,
    spriteAssetKey: "nether_messenger_sprite", // 需要添加对应的精灵图
    stats: {
      maxHp: 3500,
      maxMp: 500,
      attack: 150,
      defense: 100,
      speed: 15,
      hitRate: 0.98,
      dodgeRate: 0.1,
      critRate: 0.15,
      critDamageMultiplier: 2.2,
    },
    element: ELEMENT_TYPES.DARK,
    fiveElement: FIVE_ELEMENTS.EARTH, // 土属性
    attackRange: 3,
    skillSet: ["basic_attack", "soul_drain", "dark_binding", "nether_gate"], // 需要在skillConfig中添加这些技能
    rewards: {
      experience: 3500,
      gold: 5000,
      items: [
        { itemId: "dark_essence", dropChance: 1.0, quantity: 10 }, // 黑暗精华，100%掉落
        { itemId: "soul_fragment", dropChance: 0.8, quantity: 3 }, // 灵魂碎片，80%掉落
        { itemId: "equipment_dark_robe", dropChance: 0.45, quantity: 1 }, // 幽冥法袍，45%掉落
      ],
    },
    // BOSS特有属性
    isBoss: true,
    bossAbilities: [
      {
        name: "灵魂汲取",
        description: "攻击时，有20%几率吸取目标5%最大生命值，并恢复自身等量生命值",
        triggerChance: 0.2,
        effect: "life_steal_percent",
        value: 0.05
      },
      {
        name: "幽冥护盾",
        description: "生命值低于50%时，获得一个可吸收200点伤害的护盾，持续3回合",
        triggerHealthPercent: 0.5,
        effect: "damage_shield",
        value: 200,
        duration: 3
      },
      {
        name: "死亡召唤",
        description: "每5回合，召唤一个幽灵协助战斗",
        triggerTurnInterval: 5,
        effect: "summon",
        summonId: "ghost_minion",
        position: { row: 0, col: 0 } // 默认位置，实际应该动态选择空位
      }
    ]
  },
  
  // 第50层BOSS - 天界守卫
  celestial_guardian: {
    id: "celestial_guardian",
    name: "天界守卫",
    level: 50,
    spriteAssetKey: "celestial_guardian_sprite", // 需要添加对应的精灵图
    stats: {
      maxHp: 5000,
      maxMp: 800,
      attack: 200,
      defense: 150,
      speed: 16,
      hitRate: 0.99,
      dodgeRate: 0.12,
      critRate: 0.18,
      critDamageMultiplier: 2.5,
    },
    element: ELEMENT_TYPES.LIGHT,
    fiveElement: FIVE_ELEMENTS.FIRE, // 火属性
    attackRange: 4,
    skillSet: ["basic_attack", "divine_judgment", "holy_shield", "celestial_wrath"], // 需要在skillConfig中添加这些技能
    rewards: {
      experience: 5000,
      gold: 8000,
      items: [
        { itemId: "light_essence", dropChance: 1.0, quantity: 15 }, // 光明精华，100%掉落
        { itemId: "celestial_fragment", dropChance: 0.9, quantity: 5 }, // 天界碎片，90%掉落
        { itemId: "equipment_divine_sword", dropChance: 0.5, quantity: 1 }, // 神圣之剑，50%掉落
      ],
    },
    // BOSS特有属性
    isBoss: true,
    bossAbilities: [
      {
        name: "神圣裁决",
        description: "攻击时，有25%几率对目标造成额外的光属性伤害，并降低目标20%防御，持续2回合",
        triggerChance: 0.25,
        effect: "additional_damage",
        damageType: ELEMENT_TYPES.LIGHT,
        damageValue: 100,
        targetDebuff: {
          stat: "defense",
          value: -0.2,
          duration: 2
        }
      },
      {
        name: "天界庇护",
        description: "每4回合，为自身和所有友方单位恢复15%最大生命值",
        triggerTurnInterval: 4,
        effect: "team_heal_percent",
        value: 0.15
      },
      {
        name: "神圣净化",
        description: "受到控制效果时，有50%几率立即解除并免疫所有控制效果2回合",
        triggerOnControl: true,
        triggerChance: 0.5,
        effect: "cleanse_and_immunity",
        duration: 2
      },
      {
        name: "天罚之光",
        description: "生命值低于30%时，对所有敌人造成大量光属性伤害，并使自身攻击力提高30%，持续到战斗结束",
        triggerHealthPercent: 0.3,
        effect: "aoe_damage",
        damageType: ELEMENT_TYPES.LIGHT,
        damageValue: 250,
        selfBuff: {
          stat: "attack",
          value: 0.3,
          duration: -1 // 永久
        }
      }
    ]
  },
  
  // 第60层最终BOSS - 混沌妖王
  chaos_demon_king: {
    id: "chaos_demon_king",
    name: "混沌妖王",
    level: 60,
    spriteAssetKey: "chaos_demon_king_sprite", // 需要添加对应的精灵图
    stats: {
      maxHp: 8000,
      maxMp: 1000,
      attack: 300,
      defense: 200,
      speed: 20,
      hitRate: 1.0,
      dodgeRate: 0.15,
      critRate: 0.2,
      critDamageMultiplier: 3.0,
    },
    element: ELEMENT_TYPES.DARK, // 主要是黑暗元素
    secondaryElement: ELEMENT_TYPES.FIRE, // 次要元素是火
    fiveElement: FIVE_ELEMENTS.EARTH, // 土属性
    attackRange: 5, // 全场攻击范围
    skillSet: ["basic_attack", "chaos_blast", "void_shield", "dimension_rift", "apocalypse"], // 需要在skillConfig中添加这些技能
    rewards: {
      experience: 10000,
      gold: 15000,
      items: [
        { itemId: "chaos_essence", dropChance: 1.0, quantity: 20 }, // 混沌精华，100%掉落
        { itemId: "demon_king_soul", dropChance: 1.0, quantity: 1 }, // 妖王之魂，100%掉落
        { itemId: "equipment_chaos_crown", dropChance: 0.6, quantity: 1 }, // 混沌王冠，60%掉落
        { itemId: "tower_completion_token", dropChance: 1.0, quantity: 1 }, // 封妖塔完成令牌，100%掉落
      ],
    },
    // BOSS特有属性
    isBoss: true,
    isFinalBoss: true, // 最终BOSS标记
    bossAbilities: [
      {
        name: "元素转换",
        description: "每3回合，随机变换自身元素属性，获得对应元素50%伤害加成",
        triggerTurnInterval: 3,
        effect: "element_shift",
        possibleElements: [ELEMENT_TYPES.FIRE, ELEMENT_TYPES.WATER, ELEMENT_TYPES.THUNDER, ELEMENT_TYPES.DARK, ELEMENT_TYPES.LIGHT],
        damageBoost: 0.5
      },
      {
        name: "虚空吞噬",
        description: "攻击时，有20%几率吸取目标10%最大生命值和法力值",
        triggerChance: 0.2,
        effect: "dual_steal_percent",
        hpValue: 0.1,
        mpValue: 0.1
      },
      {
        name: "次元裂隙",
        description: "每5回合，对所有敌人造成当前生命值20%的真实伤害",
        triggerTurnInterval: 5,
        effect: "true_damage_percent",
        value: 0.2
      },
      {
        name: "混沌屏障",
        description: "生命值低于60%时，获得一个可反弹30%伤害的护盾，持续3回合",
        triggerHealthPercent: 0.6,
        effect: "reflect_shield",
        reflectPercent: 0.3,
        duration: 3
      },
      {
        name: "绝望深渊",
        description: "生命值低于30%时，封印所有敌人的技能2回合，并恢复自身25%最大生命值",
        triggerHealthPercent: 0.3,
        effect: "skill_seal",
        duration: 2,
        selfHeal: {
          type: "percent",
          value: 0.25
        }
      },
      {
        name: "末日审判",
        description: "生命值低于10%时，对所有敌人造成500点混沌伤害，无视防御和抗性",
        triggerHealthPercent: 0.1,
        effect: "true_damage_fixed",
        value: 500
      }
    ]
  },
  
  // 小怪 - 幽灵随从（被幽冥使者召唤）
  ghost_minion: {
    id: "ghost_minion",
    name: "幽灵随从",
    level: 35,
    spriteAssetKey: "ghost_minion_sprite", // 需要添加对应的精灵图
    stats: {
      maxHp: 800,
      maxMp: 100,
      attack: 80,
      defense: 40,
      speed: 12,
      hitRate: 0.9,
      dodgeRate: 0.1,
      critRate: 0.05,
      critDamageMultiplier: 1.5,
    },
    element: ELEMENT_TYPES.DARK,
    fiveElement: FIVE_ELEMENTS.EARTH,
    attackRange: 2,
    skillSet: ["basic_attack", "soul_touch"], // 需要在skillConfig中添加这些技能
    rewards: {
      experience: 200,
      gold: 100,
      items: [
        { itemId: "ghost_essence", dropChance: 0.3, quantity: 1 }
      ],
    },
    // 特殊属性
    isSummoned: true, // 标记为被召唤的单位
    specialAbilities: [
      {
        name: "虚无形态",
        description: "物理伤害减免30%，但受到的法术伤害增加20%",
        effect: "damage_modification",
        physicalMod: -0.3,
        magicalMod: 0.2
      }
    ]
  }
};

// 获取封妖塔敌人模板
export const getTowerEnemyById = (id) => {
  return towerEnemyConfig[id] || null;
};

// 合并普通敌人配置和封妖塔敌人配置
export const getAllEnemies = (regularEnemyConfig) => {
  return {
    ...regularEnemyConfig,
    ...towerEnemyConfig
  };
};
