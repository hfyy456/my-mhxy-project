/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-07 05:51:32
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-22 08:34:52
 */
// src/config/homestead/enhancedBuildingConfig.js
import { HOMESTEAD_GENERAL_CONFIG } from './homesteadConfig';
const { HOMESTEAD_RESOURCES } = HOMESTEAD_GENERAL_CONFIG;

export const BUILDING_CATEGORIES = {
  CORE: 'core',                         // 核心建筑（城镇大厅等）
  RESOURCE_PRODUCTION: 'resource_production', // 资源生产
  CRAFTING: 'crafting',                 // 制作/加工
  COMMERCIAL: 'commercial',             // 商业建筑
  TRAINING: 'training',                 // 训练/提升
  UTILITY: 'utility',                   // 功能性/辅助
  DECORATION: 'decoration',             // 装饰建筑
};

// 建筑解锁的功能类型
export const UNLOCK_TYPES = {
  SHOP: 'shop',                         // 商店功能
  CRAFTING_STATION: 'crafting_station', // 制作台
  TRAINING_FACILITY: 'training_facility', // 训练设施
  RESOURCE_GENERATOR: 'resource_generator', // 资源生成器
  QUEST_GIVER: 'quest_giver',          // 任务发布
  TELEPORT_POINT: 'teleport_point',    // 传送点
  STORAGE_EXPANSION: 'storage_expansion', // 存储扩展
  HOMESTEAD_UPGRADE: 'homestead_upgrade', // 家园升级
  SUMMON_CENTER: 'summon_center',       // 召唤兽中心，解锁所有召唤兽相关功能
};

export const ENHANCED_BUILDINGS = {
  // ===== 核心建筑 =====
  town_hall: {
    id: 'town_hall',
    name: '城镇大厅',
    category: BUILDING_CATEGORIES.CORE,
    description: '家园的管理中心，解锁更多建筑和功能',
    size: { width: 3, height: 3 },
    texture: 'buildings/town_hall.png',
    icon: '🏛️',
    maxLevel: 10,
    isRequired: true, // 必须建筑
    limit: 1, // 数量上限为1
    levels: [
      { 
        level: 1, 
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 200 },
          { resource: HOMESTEAD_RESOURCES.STONE.id, amount: 200 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 1000 }
        ], 
        buildTimeSeconds: 300,
        unlocks: [
          { type: UNLOCK_TYPES.HOMESTEAD_UPGRADE, data: { maxPlots: 16 } },
          { type: UNLOCK_TYPES.QUEST_GIVER, data: { questTypes: ['basic'] } }
        ],
        effects: [
          { type: 'max_buildings_increase', value: 5 },
          { type: 'resource_generation_boost', value: 0.1 }
        ]
      },
      { 
        level: 2, 
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 400 },
          { resource: HOMESTEAD_RESOURCES.STONE.id, amount: 400 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 2000 }
        ], 
        buildTimeSeconds: 600,
        unlocks: [
          { type: UNLOCK_TYPES.HOMESTEAD_UPGRADE, data: { maxPlots: 25 } },
          { type: UNLOCK_TYPES.QUEST_GIVER, data: { questTypes: ['basic', 'advanced'] } }
        ],
        effects: [
          { type: 'max_buildings_increase', value: 10 },
          { type: 'resource_generation_boost', value: 0.2 }
        ]
      }
    ],
  },

  // ===== 商业建筑 =====
  general_store: {
    id: 'general_store',
    name: '杂货店',
    category: BUILDING_CATEGORIES.COMMERCIAL,
    description: '出售基础物品和材料',
    size: { width: 2, height: 2 },
    texture: 'buildings/general_store.png',
    icon: '🏪',
    maxLevel: 5,
    limit: 1, // 数量上限为1
    requires: [{ buildingId: 'town_hall', minLevel: 1 }],
    levels: [
      { 
        level: 1, 
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 150 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 500 }
        ], 
        buildTimeSeconds: 180,
        unlocks: [
          { 
            type: UNLOCK_TYPES.SHOP, 
            data: { 
              shopId: 'general_store_basic',
              items: ['health_potion', 'mana_potion', 'basic_materials']
            } 
          }
        ]
      }
    ],
  },

  equipment_shop: {
    id: 'equipment_shop',
    name: '装备店',
    category: BUILDING_CATEGORIES.COMMERCIAL,
    description: '购买和出售武器装备',
    size: { width: 2, height: 2 },
    texture: 'buildings/equipment_shop.png',
    icon: '⚔️',
    maxLevel: 5,
    limit: 1, // 数量上限为1
    requires: [{ buildingId: 'town_hall', minLevel: 2 }],
    levels: [
      { 
        level: 1, 
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 200 },
          { resource: HOMESTEAD_RESOURCES.STONE.id, amount: 100 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 800 }
        ], 
        buildTimeSeconds: 240,
        unlocks: [
          { 
            type: UNLOCK_TYPES.SHOP, 
            data: { 
              shopId: 'equipment_shop_basic',
              items: ['basic_sword', 'basic_armor', 'basic_accessories']
            } 
          }
        ]
      }
    ],
  },

  // ===== 资源生产建筑 =====
  advanced_mine: {
    id: 'advanced_mine',
    name: '高级采矿场',
    category: BUILDING_CATEGORIES.RESOURCE_PRODUCTION,
    description: '高效开采矿石和珍贵材料',
    size: { width: 2, height: 2 },
    texture: 'buildings/advanced_mine.png',
    icon: '⛏️',
    maxLevel: 8,
    requires: [{ buildingId: 'town_hall', minLevel: 1 }],
    levels: [
      { 
        level: 1, 
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 300 },
          { resource: HOMESTEAD_RESOURCES.STONE.id, amount: 200 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 600 }
        ], 
        buildTimeSeconds: 300,
        unlocks: [
          { 
            type: UNLOCK_TYPES.RESOURCE_GENERATOR, 
            data: { 
              capacity: 400,
              resources: [
                { resource: HOMESTEAD_RESOURCES.ORE.id, amountPerHour: 500 },
                { resource: HOMESTEAD_RESOURCES.STONE.id, amountPerHour: 300 }
              ]
            } 
          }
        ]
      },
      { 
        level: 2, 
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 500 },
          { resource: HOMESTEAD_RESOURCES.ORE.id, amount: 100 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 1200 }
        ], 
        buildTimeSeconds: 450,
        unlocks: [
          { 
            type: UNLOCK_TYPES.RESOURCE_GENERATOR, 
            data: { 
              capacity: 800,
              resources: [
                { resource: HOMESTEAD_RESOURCES.ORE.id, amountPerHour: 800 },
                { resource: HOMESTEAD_RESOURCES.STONE.id, amountPerHour: 500 },
                { resource: HOMESTEAD_RESOURCES.ESSENCE.id, amountPerHour: 50 }
              ]
            } 
          }
        ]
      }
    ],
  },

  lumber_mill: {
    id: 'lumber_mill',
    name: '伐木场',
    category: BUILDING_CATEGORIES.RESOURCE_PRODUCTION,
    description: '高效采集木材资源',
    size: { width: 2, height: 2 },
    texture: 'buildings/lumber_mill.png',
    icon: '🪓',
    maxLevel: 6,
    levels: [
      { 
        level: 1, 
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.STONE.id, amount: 100 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 300 }
        ], 
        buildTimeSeconds: 120,
        unlocks: [
          { 
            type: UNLOCK_TYPES.RESOURCE_GENERATOR, 
            data: { 
              capacity: 800,
              resources: [
                { resource: HOMESTEAD_RESOURCES.WOOD.id, amountPerHour: 1000 }
              ]
            } 
          }
        ]
      }
    ],
  },

  herb_garden: {
    id: 'herb_garden',
    name: '药草园',
    category: BUILDING_CATEGORIES.RESOURCE_PRODUCTION,
    description: '种植和采收各种草药',
    size: { width: 2, height: 2 },
    texture: 'buildings/herb_garden.png',
    icon: '🌿',
    maxLevel: 6,
    levels: [
      { 
        level: 1, 
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 150 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 400 }
        ], 
        buildTimeSeconds: 180,
        unlocks: [
          { 
            type: UNLOCK_TYPES.RESOURCE_GENERATOR, 
            data: { 
              resources: [
                { resource: HOMESTEAD_RESOURCES.HERB.id, amountPerHour: 400 }
              ]
            } 
          }
        ]
      }
    ],
  },

  // ===== 制作建筑 =====
  blacksmith: {
    id: 'blacksmith',
    name: '铁匠铺',
    category: BUILDING_CATEGORIES.CRAFTING,
    description: '锻造强力的武器和装备',
    size: { width: 3, height: 2 },
    texture: 'buildings/blacksmith.png',
    icon: '🔨',
    maxLevel: 8,
    requires: [{ buildingId: 'advanced_mine', minLevel: 1 }],
    levels: [
      { 
        level: 1, 
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 200 },
          { resource: HOMESTEAD_RESOURCES.STONE.id, amount: 300 },
          { resource: HOMESTEAD_RESOURCES.ORE.id, amount: 100 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 1000 }
        ], 
        buildTimeSeconds: 400,
        unlocks: [
          { 
            type: UNLOCK_TYPES.CRAFTING_STATION, 
            data: { 
              stationId: 'blacksmith_basic',
              recipes: ['iron_sword', 'steel_armor', 'basic_tools']
            } 
          }
        ]
      }
    ],
  },

  alchemist_lab: {
    id: 'alchemist_lab',
    name: '炼金实验室',
    category: BUILDING_CATEGORIES.CRAFTING,
    description: '炼制强力药剂和魔法物品',
    size: { width: 2, height: 2},
    texture: 'buildings/alchemist_lab.png',
    icon: '⚗️',
    maxLevel: 8,
    requires: [{ buildingId: 'herb_garden', minLevel: 1 }],
    levels: [
      { 
        level: 1, 
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 250 },
          { resource: HOMESTEAD_RESOURCES.HERB.id, amount: 200 },
          { resource: HOMESTEAD_RESOURCES.ESSENCE.id, amount: 50 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 800 }
        ], 
        buildTimeSeconds: 350,
        unlocks: [
          { 
            type: UNLOCK_TYPES.CRAFTING_STATION, 
            data: { 
              stationId: 'alchemist_lab_basic',
              recipes: ['major_health_potion_recipe', 'mana_regen_potion_recipe']
            } 
          }
        ]
      }
    ],
  },

  // ===== 训练建筑 =====
  training_ground: {
    id: 'training_ground',
    name: '训练场',
    category: BUILDING_CATEGORIES.TRAINING,
    description: '提升召唤兽的战斗能力',
    size: { width: 3, height: 3 },
    texture: 'buildings/training_ground.png',
    icon: '🏟️',
    maxLevel: 6,
    requires: [{ buildingId: 'town_hall', minLevel: 2 }],
    levels: [
      { 
        level: 1, 
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 400 },
          { resource: HOMESTEAD_RESOURCES.STONE.id, amount: 300 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 1500 }
        ], 
        buildTimeSeconds: 500,
        unlocks: [
          { 
            type: UNLOCK_TYPES.TRAINING_FACILITY, 
            data: { 
              facilityId: 'basic_training',
              services: ['exp_boost', 'skill_training', 'stat_enhancement']
            } 
          }
        ]
      }
    ],
  },

  // ===== 功能建筑 =====
  large_warehouse: {
    id: 'large_warehouse',
    name: '大型仓库',
    category: BUILDING_CATEGORIES.UTILITY,
    description: '大幅增加资源储存容量',
    size: { width: 2, height: 2 },
    texture: 'buildings/large_warehouse.png',
    icon: '📦',
    maxLevel: 8,
    levels: [
      { 
        level: 1, 
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 300 },
          { resource: HOMESTEAD_RESOURCES.STONE.id, amount: 200 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 600 }
        ], 
        buildTimeSeconds: 200,
        unlocks: [
          { 
            type: UNLOCK_TYPES.STORAGE_EXPANSION, 
            data: { 
              storageIncrease: 2000,
              resourceTypes: 'all'
            } 
          }
        ]
      }
    ],
  },

  teleport_portal: {
    id: 'teleport_portal',
    name: '传送门',
    category: BUILDING_CATEGORIES.UTILITY,
    description: '快速传送到其他区域',
    size: { width: 2, height: 2 },
    texture: 'buildings/teleport_portal.png',
    icon: '🌀',
    maxLevel: 3,
    requires: [{ buildingId: 'town_hall', minLevel: 3 }],
    levels: [
      { 
        level: 1, 
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.STONE.id, amount: 500 },
          { resource: HOMESTEAD_RESOURCES.ESSENCE.id, amount: 200 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 2000 }
        ], 
        buildTimeSeconds: 600,
        unlocks: [
          { 
            type: UNLOCK_TYPES.TELEPORT_POINT, 
            data: { 
              destinations: ['dongsheng_region', 'xiniu_region', 'nanzhan_region']
            } 
          }
        ]
      }
    ],
  },

  // ===== 装饰建筑 =====
  fountain: {
    id: 'fountain',
    name: '喷泉',
    category: BUILDING_CATEGORIES.DECORATION,
    description: '美丽的装饰喷泉，提升家园魅力',
    size: { width: 1, height: 1 },
    texture: 'buildings/fountain.png',
    icon: '⛲',
    maxLevel: 3,
    levels: [
      { 
        level: 1, 
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.STONE.id, amount: 200 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 400 }
        ], 
        buildTimeSeconds: 120,
        effects: [
          { type: 'homestead_beauty', value: 10 },
          { type: 'visitor_attraction', value: 5 }
        ]
      }
    ],
  },

  flower_bed: {
    id: 'flower_bed',
    name: '花坛',
    category: BUILDING_CATEGORIES.DECORATION,
    description: '色彩斑斓的花坛装饰',
    size: { width: 1, height: 1 },
    texture: 'buildings/flower_bed.png',
    icon: '🌸',
    maxLevel: 2,
    levels: [
      { 
        level: 1, 
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.HERB.id, amount: 50 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 100 }
        ], 
        buildTimeSeconds: 60,
        effects: [
          { type: 'homestead_beauty', value: 5 }
        ]
      }
    ],
  },

  // ===== 召唤兽相关建筑 =====
  summon_home: {
    id: 'summon_home',
    name: '召唤兽之家',
    category: BUILDING_CATEGORIES.UTILITY,
    description: '进行召唤兽融合、洗练、合成等操作的地方',
    size: { width: 2, height: 2 },
    texture: 'buildings/summon_home.png', // 假设一个贴图路径
    icon: '🐾',
    maxLevel: 3,
    requires: [{ buildingId: 'town_hall', minLevel: 2 }],
    levels: [
      {
        level: 1,
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 250 },
          { resource: HOMESTEAD_RESOURCES.STONE.id, amount: 250 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 1200 },
        ],
        buildTimeSeconds: 480,
        unlocks: [
          {
            type: UNLOCK_TYPES.SUMMON_CENTER,
            data: {
              features: ['fusion', 'purification'], // 解锁融合和洗练
            },
          },
        ],
      },
    ],
  },

  summon_altar: {
    id: 'summon_altar',
    name: '召唤祭坛',
    category: BUILDING_CATEGORIES.RESOURCE_PRODUCTION,
    description: '周期性地产生召唤所需的灵气精华',
    size: { width: 2, height: 2 },
    texture: 'buildings/summon_altar.png',
    icon: '🔮',
    maxLevel: 5,
    requires: [{ buildingId: 'town_hall', minLevel: 3 }],
    levels: [
      {
        level: 1,
        buildCost: [
          { resource: HOMESTEAD_RESOURCES.STONE.id, amount: 400 },
          { resource: HOMESTEAD_RESOURCES.ESSENCE.id, amount: 100 },
          { resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 1500 },
        ],
        buildTimeSeconds: 600,
        unlocks: [
          { 
            type: UNLOCK_TYPES.RESOURCE_GENERATOR,
            data: {
              capacity: 1000,
              resources: [
                { resource: HOMESTEAD_RESOURCES.ESSENCE.id, amountPerHour: 200 }
              ]
            }
          }
        ]
      }
    ]
  }
};

// 建筑放置规则
export const PLACEMENT_RULES = {
  // 最小距离规则
  MIN_DISTANCE: {
    'advanced_mine': { 'alchemist_lab': 2 }, // 采矿场距离炼金实验室至少2格
  },
  
  // 相邻加成规则
  ADJACENCY_BONUS: {
    'blacksmith': {
      'advanced_mine': { type: 'production_boost', value: 0.15 }
    },
    'alchemist_lab': {
      'herb_garden': { type: 'production_boost', value: 0.20 }
    }
  },
  
  // 必须相邻规则
  MUST_BE_ADJACENT: {
    // 例如：某些高级建筑必须靠近特定建筑
  }
};

// 建筑解锁链
export const BUILDING_UNLOCK_CHAIN = {
  town_hall: [], // 初始建筑
  lumber_mill: [],
  herb_garden: [],
  general_store: ['town_hall'],
  advanced_mine: ['town_hall'],
  large_warehouse: ['town_hall'],
  blacksmith: ['advanced_mine'],
  alchemist_lab: ['herb_garden'],
  equipment_shop: ['town_hall'],
  training_ground: ['town_hall'],
  teleport_portal: ['town_hall'],
  fountain: [],
  flower_bed: [],
  summon_home: ['town_hall']
};

/**
 * 建筑需求链的简单文本表示，方便快速查阅
 * 注意：这部分不直接参与游戏逻辑，真正的依赖关系在每个建筑的 `requires` 属性中定义。
 */
export const BUILDING_REQUIREMENTS_DOC = {
  general_store: ['town_hall'],
  equipment_shop: ['town_hall'],
  advanced_mine: ['town_hall'],
  blacksmith: ['advanced_mine'],
  alchemist_lab: ['herb_garden'],
  training_ground: ['town_hall'],
  teleport_portal: ['town_hall'],
  summon_home: ['town_hall'],
  // 独立建筑
  lumber_mill: [],
  herb_garden: [],
  large_warehouse: [],
  fountain: [],
  flower_bed: []
}; 