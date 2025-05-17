/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:55:08
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-17 04:04:24
 */
// 背包系统配置
export const INVENTORY_CONFIG = {
  // 背包最大格子数
  MAX_SLOTS: 50,
  
  // 物品类型
  ITEM_TYPES: {
    EQUIPMENT: 'equipment',    // 装备
    CONSUMABLE: 'consumable',  // 消耗品
    MATERIAL: 'material',      // 材料
    QUEST: 'quest',           // 任务物品
  },

  // 物品品质
  ITEM_QUALITY: {
    NORMAL: 'normal',     // 普通
    RARE: 'rare',        // 稀有
    EPIC: 'epic',        // 史诗
    LEGENDARY: 'legendary', // 传说
    MYTHIC: 'mythic'     // 神话
  },

  // 物品品质颜色映射
  QUALITY_COLORS: {
    normal: 'quality-normal',
    rare: 'quality-rare',
    epic: 'quality-epic',
    legendary: 'quality-legendary',
    mythic: 'quality-mythic'
  },

  // 物品堆叠规则
  STACK_RULES: {
    equipment: 1,      // 装备不可堆叠
    consumable: 99,    // 消耗品最多堆叠99个
    material: 999,     // 材料最多堆叠999个
    quest: 1          // 任务物品不可堆叠
  }
};

// 背包物品基础配置
export const ITEM_BASE_CONFIG = {
  // 消耗品配置
  consumables: {
    '初级经验丹': {
      name: '初级经验丹',
      type: 'consumable',
      quality: 'normal',
      description: '使用后获得1000点经验值',
      icon: 'fa-pills',
      effect: {
        type: 'experience',
        value: 1000
      }
    },
    '中级经验丹': {
      name: '中级经验丹',
      type: 'consumable',
      quality: 'rare',
      description: '使用后获得5000点经验值',
      icon: 'fa-pills',
      effect: {
        type: 'experience',
        value: 5000
      }
    },
    '高级经验丹': {
      name: '高级经验丹',
      type: 'consumable',
      quality: 'epic',
      description: '使用后获得20000点经验值',
      icon: 'fa-pills',
      effect: {
        type: 'experience',
        value: 20000
      }
    }
  },

  // 材料配置
  materials: {
    '炼妖石': {
      name: '炼妖石',
      type: 'material',
      quality: 'normal',
      description: '用于炼妖的基础材料',
      icon: 'fa-gem'
    },
    '高级炼妖石': {
      name: '高级炼妖石',
      type: 'material',
      quality: 'rare',
      description: '用于炼妖的高级材料',
      icon: 'fa-gem'
    }
  }
}; 