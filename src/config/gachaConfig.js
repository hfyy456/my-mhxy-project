import { QUALITY_TYPES, FIVE_ELEMENTS } from "./enumConfig";

export const gachaPoolConfig = {
  [QUALITY_TYPES.NORMAL]: {
    probability: 0.55, // 普通品质的整体概率 (55%)
    summons: ["ghost"] // 假设 'ghost' 是普通品质
  },
  [QUALITY_TYPES.RARE]: {
    probability: 0.25, // 稀有品质的整体概率 (25%)
    summons: ["heavenGuard", "catSpirit"]
  },
  [QUALITY_TYPES.EPIC]: {
    probability: 0.15, // 史诗品质的整体概率 (15%)
    summons: ["thunderBird", "vampire", "wildLeopard"]
  },
  [QUALITY_TYPES.LEGENDARY]: {
    probability: 0.04, // 传说品质的整体概率 (4%)
    summons: ["mechanicalBird", "yaksha"]
  },
  [QUALITY_TYPES.MYTHIC]: {
    probability: 0.01, // 神话品质的整体概率 (1%)
    summons: ["dragonGod", "phoenix"] // TODO: 在 summonConfig.js 中定义 dragonGod 和 phoenix
  }
};

// 确保总概率为 1 (或者接近 1，考虑到浮点数精度)
const totalProbability = Object.values(gachaPoolConfig).reduce((sum, qualityPool) => sum + qualityPool.probability, 0);
if (Math.abs(totalProbability - 1.0) > 0.0001) {
  console.warn(`Gacha pool total probability is ${totalProbability}, not 1.0. Please check gachaConfig.js`);
}

// 定义抽卡消耗
export const gachaCost = {
  currencyType: "gold", // 或者 "gems", "tickets" 等，需要与玩家货币系统对应
  amount: 1000
};

// 定义保底机制 (可选)
// 例如：每100抽至少获得一个 LEGENDARY 或 MYTHIC
export const gachaPityRules = {
  guaranteedLegendaryOrMythic: {
    type: "quality", // 保底类型：品质
    count: 100,     // 触发抽数
    qualities: [QUALITY_TYPES.LEGENDARY, QUALITY_TYPES.MYTHIC], // 保证获得的品质列表
    resetOnTrigger: true // 触发后是否重置计数
  },
  // 每10抽至少获得一个 RARE 或以上
  guaranteedRareOrAbove: {
    type: "quality",
    count: 10,
    qualities: [QUALITY_TYPES.RARE, QUALITY_TYPES.EPIC, QUALITY_TYPES.LEGENDARY, QUALITY_TYPES.MYTHIC],
    resetOnTrigger: true
  }
  // 可以添加特定召唤兽的保底，例如:
  // guaranteedSpecificSummon: {
  //   type: "summon",
  //   count: 200,
  //   summonId: "dragonGod",
  //   resetOnTrigger: true
  // }
};

// 记录玩家的抽卡次数和保底状态，通常这部分数据会存储在玩家状态中
// 此处仅为示例结构，实际应由玩家状态管理
export const initialPlayerGachaState = {
  totalDraws: 0,
  pityCounts: {
    guaranteedLegendaryOrMythic: 0,
    guaranteedRareOrAbove: 0,
    // guaranteedSpecificSummonDragonGod: 0 // 如果有特定召唤兽保底
  }
};

// 还可以为特定活动定义特殊的卡池，可以覆盖或补充默认卡池
export const eventGachaPoolConfig = {
  // exampleEvent: {
  //   startDate: "YYYY-MM-DD",
  //   endDate: "YYYY-MM-DD",
  //   overridePool?: { ... }, // 完全覆盖 gachaPoolConfig
  //   bonusSummons?: { [QUALITY_TYPES.LEGENDARY]: ["specialEventSummon"] } // 在原有基础上增加特定召唤兽
  //   probabilityModifiers?: { [QUALITY_TYPES.MYTHIC]: 0.02 } // 修改特定品质概率
  // }
};

// =================================================================
// Fusion System Configs
// =================================================================

/**
 * 合成材料配置
 */
export const FUSION_MATERIALS = {
  BEAST_PILL: {
    id: 'beast_pill',
    name: '兽丹',
    description: '提升合成成功率和技能继承概率',
    successRateBonus: 0.2,
    skillInheritBonus: 0.15,
    rarity: 'rare'
  },
  FIVE_ELEMENT_STONE: {
    id: 'five_element_stone',
    name: '五行石',
    description: '可指定新生召唤兽的五行属性',
    allowElementChoice: true,
    rarity: 'epic'
  },
  SOUL_CRYSTAL: {
    id: 'soul_crystal',
    name: '魂晶',
    description: '大幅提升合成后召唤兽的等级和属性',
    levelBonus: 5,
    attributeBonus: 0.3,
    rarity: 'legendary'
  }
};

/**
 * 合成规则配置
 */
export const FUSION_RULES = {
  // 基础成功率
  BASE_SUCCESS_RATE: 0.7,

  // 技能继承规则
  SKILL_INHERIT: {
    BASE_RATE: 0.32, // 基础继承率32%（30%-35%范围内）
    RATE_VARIANCE: 0.03, // 随机波动±3%，实现30%-35%范围
    SKILL_DECREASE_FACTOR: 0.02 // 技能数量多时的递减因子降低
  },

  // 等级影响
  LEVEL_IMPACT: {
    MIN_LEVEL_RATIO: 0.3, // 最低等级保留比例
    MAX_LEVEL_RATIO: 0.8, // 最高等级保留比例
    AVERAGE_WEIGHT: 0.6    // 平均值权重
  },
  
  // 五行相克加成
  ELEMENT_COMPATIBILITY: {
    [FIVE_ELEMENTS.METAL]: {
      [FIVE_ELEMENTS.WOOD]: 0.1,  // 金克木，轻微加成
      [FIVE_ELEMENTS.FIRE]: -0.1, // 火克金，轻微减成
    },
    [FIVE_ELEMENTS.WOOD]: {
      [FIVE_ELEMENTS.EARTH]: 0.1,
      [FIVE_ELEMENTS.METAL]: -0.1,
    },
    [FIVE_ELEMENTS.WATER]: {
      [FIVE_ELEMENTS.FIRE]: 0.1,
      [FIVE_ELEMENTS.EARTH]: -0.1,
    },
    [FIVE_ELEMENTS.FIRE]: {
      [FIVE_ELEMENTS.METAL]: 0.1,
      [FIVE_ELEMENTS.WATER]: -0.1,
    },
    [FIVE_ELEMENTS.EARTH]: {
      [FIVE_ELEMENTS.WATER]: 0.1,
      [FIVE_ELEMENTS.WOOD]: -0.1,
    }
  },
}; 