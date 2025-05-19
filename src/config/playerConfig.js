/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-20 00:18:08
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-20 04:47:04
 */
// 玩家等级经验值配置
export const playerLevelConfig = {
  // 每级所需经验值
  experienceRequirements: {
    1: 0,
    2: 100,
    3: 300,
    4: 600,
    5: 1000,
    6: 1500,
    7: 2100,
    8: 2800,
    9: 3600,
    10: 4500,
    // 可以继续添加更多等级
  },
  
  // 获取指定等级所需经验值
  getRequiredExperience: (level) => {
    return playerLevelConfig.experienceRequirements[level] || 0;
  },
  
  // 获取当前等级可获得的经验值上限
  getMaxExperience: (level) => {
    return playerLevelConfig.experienceRequirements[level + 1] || Infinity;
  }
};

// 玩家基础信息配置
export const playerBaseConfig = {
  maxLevel: 10,
  initialLevel: 1,
  initialExperience: 0,
  // 玩家可以拥有的最大召唤兽数量
  maxSummons: 5,
  // 玩家可以拥有的最大背包容量
  maxInventorySlots: 20,
  // 等级限制配置
  levelRestrictions: {
    // 召唤兽数量限制
    summonCount: {
      1: 10,  // 1级可以拥有1个召唤兽
      5: 20,  // 5级可以拥有2个召唤兽
      10: 30, // 10级可以拥有3个召唤兽
      15: 40, // 15级可以拥有4个召唤兽
      20: 50  // 20级可以拥有5个召唤兽
    },
    // 背包容量限制
    inventorySlots: {
      1: 10,   // 1级背包容量为10
      5: 15,   // 5级背包容量为15
      10: 20,  // 10级背包容量为20
      15: 25,  // 15级背包容量为25
      20: 30   // 20级背包容量为30
    },
    // 可炼妖品质限制
    refinementQuality: {
      1: ['normal'],           // 1级只能炼出普通品质
      5: ['normal', 'rare'],   // 5级可以炼出普通和稀有品质
      10: ['normal', 'rare', 'epic'], // 10级可以炼出普通、稀有和史诗品质
      15: ['normal', 'rare', 'epic', 'legendary'], // 15级可以炼出普通、稀有、史诗和传说品质
      20: ['normal', 'rare', 'epic', 'legendary', 'mythic'] // 20级可以炼出所有品质
    },
    // 可打书技能限制
    skillBookLevel: {
      1: 1,   // 1级只能打1级技能书
      5: 2,   // 5级可以打2级技能书
      10: 3,  // 10级可以打3级技能书
      15: 4,  // 15级可以打4级技能书
      20: 5   // 20级可以打5级技能书
    }
  },
  // 获取当前等级可用的最大召唤兽数量
  getMaxSummonsByLevel: (level) => {
    const levels = Object.keys(playerBaseConfig.levelRestrictions.summonCount)
      .map(Number)
      .sort((a, b) => a - b);
    
    for (let i = levels.length - 1; i >= 0; i--) {
      if (level >= levels[i]) {
        return playerBaseConfig.levelRestrictions.summonCount[levels[i]];
      }
    }
    return 1; // 默认返回1
  },
  // 获取当前等级可用的最大背包容量
  getMaxInventorySlotsByLevel: (level) => {
    const levels = Object.keys(playerBaseConfig.levelRestrictions.inventorySlots)
      .map(Number)
      .sort((a, b) => a - b);
    
    for (let i = levels.length - 1; i >= 0; i--) {
      if (level >= levels[i]) {
        return playerBaseConfig.levelRestrictions.inventorySlots[levels[i]];
      }
    }
    return 10; // 默认返回10
  },
  // 获取当前等级可炼妖的品质列表
  getAvailableRefinementQualities: (level) => {
    const levels = Object.keys(playerBaseConfig.levelRestrictions.refinementQuality)
      .map(Number)
      .sort((a, b) => a - b);
    
    for (let i = levels.length - 1; i >= 0; i--) {
      if (level >= levels[i]) {
        return playerBaseConfig.levelRestrictions.refinementQuality[levels[i]];
      }
    }
    return ['normal']; // 默认返回普通品质
  },
  // 获取当前等级可打书的最高等级
  getMaxSkillBookLevel: (level) => {
    const levels = Object.keys(playerBaseConfig.levelRestrictions.skillBookLevel)
      .map(Number)
      .sort((a, b) => a - b);
    
    for (let i = levels.length - 1; i >= 0; i--) {
      if (level >= levels[i]) {
        return playerBaseConfig.levelRestrictions.skillBookLevel[levels[i]];
      }
    }
    return 1; // 默认返回1级
  }
};

// 经验值获取配置
export const experienceConfig = {
  // 炼妖经验值配置
  refinement: {
    normal: 10,
    rare: 20,
    epic: 30,
    legendary: 40,
    mythic: 50
  },
  // 打书经验值配置
  skillBook: {
    success: 15,
    failure: 5
  }
};

// 统计数据配置
export const statisticsConfig = {
  types: {
    totalRefinements: 'refinement_count',
    totalSkillBooks: 'skill_book_count',
    totalEquipmentObtained: 'equipment_count'
  },
  // 显示名称映射
  displayNames: {
    refinement_count: '炼妖次数',
    skill_book_count: '打书次数',
    equipment_count: '获得装备'
  }
};

// 成就系统配置
export const achievementConfig = {
  // 成就类型
  types: {
    REFINEMENT: 'refinement',
    SKILL_BOOK: 'skillBook',
    EQUIPMENT: 'equipment',
    LEVEL: 'level'
  },
  
  // 成就列表
  list: [
    {
      id: 'first_refinement',
      type: 'refinement',
      title: '初次炼妖',
      description: '完成第一次炼妖',
      requirement: 1,
      reward: {
        experience: 50
      }
    },
    {
      id: 'refinement_master',
      type: 'refinement',
      title: '炼妖大师',
      description: '完成100次炼妖',
      requirement: 100,
      reward: {
        experience: 500
      }
    },
    {
      id: 'first_skill_book',
      type: 'skillBook',
      title: '初次打书',
      description: '完成第一次打书',
      requirement: 1,
      reward: {
        experience: 30
      }
    },
    {
      id: 'skill_book_master',
      type: 'skillBook',
      title: '打书大师',
      description: '完成50次打书',
      requirement: 50,
      reward: {
        experience: 300
      }
    },
    {
      id: 'first_equipment',
      type: 'equipment',
      title: '装备收集者',
      description: '获得第一件装备',
      requirement: 1,
      reward: {
        experience: 20
      }
    },
    {
      id: 'equipment_master',
      type: 'equipment',
      title: '装备大师',
      description: '获得100件装备',
      requirement: 100,
      reward: {
        experience: 200
      }
    },
    {
      id: 'level_5',
      type: 'level',
      title: '初出茅庐',
      description: '达到5级',
      requirement: 5,
      reward: {
        experience: 100
      }
    },
    {
      id: 'level_10',
      type: 'level',
      title: '小有所成',
      description: '达到10级',
      requirement: 10,
      reward: {
        experience: 200
      }
    }
  ]
}; 