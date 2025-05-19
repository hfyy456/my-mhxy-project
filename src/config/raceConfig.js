import { BASE_CONFIG } from './baseConfig';
import { RACE_TYPES, RACE_TRAIT_TYPES, ELEMENT_TYPES } from './enumConfig';

// 种族配置
export const raceConfig = {
  [RACE_TYPES.CELESTIAL]: {
    description: "修炼成仙的生物，拥有强大的法术能力和神秘力量",
    color: "blue-500",
    traits: [
      {
        name: "神圣之力",
        type: RACE_TRAIT_TYPES.MAGIC,
        effect: "法术伤害提升15%"
      },
      {
        name: "法术精通",
        type: RACE_TRAIT_TYPES.MAGIC,
        effect: "法术暴击率提升5%"
      },
      {
        name: "灵气亲和",
        type: RACE_TRAIT_TYPES.PASSIVE,
        effect: "每回合恢复2%最大法力值"
      }
    ],
    bonus: {
      intelligence: 0.1,
      luck: 0.05,
    },
    preferredSkills: ["法术暴击", "魔之心", "法术波动"],
    elementalResistance: {
      [ELEMENT_TYPES.FIRE]: 0.1,
      [ELEMENT_TYPES.WATER]: 0.1,
      [ELEMENT_TYPES.THUNDER]: 0.1
    }
  },
  [RACE_TYPES.NETHER]: {
    description: "来自幽冥世界的黑暗生物，掌握邪恶的力量",
    color: "purple-600",
    traits: [
      {
        name: "黑暗之力",
        type: RACE_TRAIT_TYPES.COMBAT,
        effect: "夜间伤害提升20%"
      },
      {
        name: "生命汲取",
        type: RACE_TRAIT_TYPES.UTILITY,
        effect: "攻击时有10%几率吸取目标5%生命值"
      },
      {
        name: "魔法抗性",
        type: RACE_TRAIT_TYPES.DEFENSE,
        effect: "受到的法术伤害降低10%"
      }
    ],
    bonus: {
      strength: 0.08,
      intelligence: 0.07,
    },
    preferredSkills: ["夜战", "隐身", "生命汲取"],
    elementalResistance: {
      [ELEMENT_TYPES.DARK]: 0.2,
      [ELEMENT_TYPES.LIGHT]: -0.1
    }
  },
  [RACE_TYPES.BEAST]: {
    description: "各种野兽和修炼成精的动物，力量与速度并存",
    color: "green-500",
    traits: [
      {
        name: "野性本能",
        type: RACE_TRAIT_TYPES.COMBAT,
        effect: "物理暴击伤害提升20%"
      },
      {
        name: "强健体魄",
        type: RACE_TRAIT_TYPES.DEFENSE,
        effect: "最大生命值提升10%"
      },
      {
        name: "灵活身姿",
        type: RACE_TRAIT_TYPES.UTILITY,
        effect: "闪避率提升5%"
      }
    ],
    bonus: {
      strength: 0.05,
      agility: 0.1,
    },
    preferredSkills: ["必杀", "连击", "强力"],
    elementalResistance: {
      [ELEMENT_TYPES.PHYSICAL]: 0.1,
      [ELEMENT_TYPES.POISON]: 0.1
    }
  },
  [RACE_TYPES.SPIRIT]: {
    description: "自然中诞生的精灵和妖精，灵活多变",
    color: "yellow-400",
    traits: [
      {
        name: "自然亲和",
        type: RACE_TRAIT_TYPES.PASSIVE,
        effect: "每回合恢复1%最大生命值"
      },
      {
        name: "幻术",
        type: RACE_TRAIT_TYPES.UTILITY,
        effect: "有15%几率躲避攻击"
      },
      {
        name: "灵巧",
        type: RACE_TRAIT_TYPES.COMBAT,
        effect: "攻击速度提升10%"
      }
    ],
    bonus: {
      agility: 0.08,
      luck: 0.07,
    },
    preferredSkills: ["敏捷", "隐身", "幸运"],
    elementalResistance: {
      [ELEMENT_TYPES.NATURE]: 0.2,
      [ELEMENT_TYPES.WIND]: 0.1
    }
  },
  [RACE_TYPES.MACHINE]: {
    description: "由古代技术制造的机关生物，精确而坚固",
    color: "gray-500",
    traits: [
      {
        name: "钢铁之躯",
        type: RACE_TRAIT_TYPES.DEFENSE,
        effect: "物理防御提升15%"
      },
      {
        name: "精密计算",
        type: RACE_TRAIT_TYPES.COMBAT,
        effect: "暴击率提升5%"
      },
      {
        name: "能量护盾",
        type: RACE_TRAIT_TYPES.DEFENSE,
        effect: "受到伤害时有20%几率减免50%伤害"
      }
    ],
    bonus: {
      constitution: 0.1,
      intelligence: 0.05,
    },
    preferredSkills: ["防御", "反震", "强力"],
    elementalResistance: {
      [ELEMENT_TYPES.PHYSICAL]: 0.15,
      [ELEMENT_TYPES.THUNDER]: -0.1
    }
  },
  [RACE_TYPES.WARRIOR]: {
    description: "天庭的精锐战士，身负神威，擅长近身作战",
    color: "amber-500",
    traits: [
      {
        name: "神威",
        type: RACE_TRAIT_TYPES.COMBAT,
        effect: "所有伤害提升10%"
      },
      {
        name: "战斗精通",
        type: RACE_TRAIT_TYPES.COMBAT,
        effect: "连击率提升10%"
      },
      {
        name: "天兵意志",
        type: RACE_TRAIT_TYPES.DEFENSE,
        effect: "受到的控制效果时间减少20%"
      }
    ],
    bonus: {
      strength: 0.08,
      constitution: 0.07,
      intelligence: 0.05,
    },
    preferredSkills: ["必杀", "神威", "连击"],
    elementalResistance: {
      [ELEMENT_TYPES.LIGHT]: 0.15,
      [ELEMENT_TYPES.DARK]: 0.1
    }
  },
  [RACE_TYPES.ANCIENT_BEAST]: {
    description: "来自远古洪荒的神秘神兽，拥有毁天灭地的力量",
    color: "yellow-600",
    traits: [
      {
        name: "洪荒之力",
        type: RACE_TRAIT_TYPES.COMBAT,
        effect: "所有伤害提升20%"
      },
      {
        name: "不朽之躯",
        type: RACE_TRAIT_TYPES.DEFENSE,
        effect: "受到所有伤害减免10%"
      },
      {
        name: "远古血脉",
        type: RACE_TRAIT_TYPES.PASSIVE,
        effect: "每回合恢复5%最大生命值和法力值"
      }
    ],
    bonus: {
      constitution: 0.15,
      strength: 0.15,
      intelligence: 0.1,
      agility: 0.05,
      luck: 0.1
    },
    preferredSkills: ["神威", "必杀", "法术暴击"],
    elementalResistance: {
      [ELEMENT_TYPES.PHYSICAL]: 0.2,
      [ELEMENT_TYPES.FIRE]: 0.15,
      [ELEMENT_TYPES.WATER]: 0.15,
      [ELEMENT_TYPES.THUNDER]: 0.15,
      [ELEMENT_TYPES.LIGHT]: 0.1,
      [ELEMENT_TYPES.DARK]: 0.1
    }
  }
};

// 获取种族加成
export const getRaceBonus = (race, attribute) => {
  if (
    !raceConfig[race] ||
    !raceConfig[race].bonus ||
    !raceConfig[race].bonus[attribute]
  ) {
    return 1;
  }
  return 1 + raceConfig[race].bonus[attribute];
};

// 获取所有种族列表
export const getAllRaces = () => {
  return Object.keys(raceConfig);
};

// 根据种族获取特性
export const getRaceTraits = (race) => {
  if (!raceConfig[race]) {
    return [];
  }
  return raceConfig[race].traits || [];
};
