/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:55:08
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-19 04:25:51
 */
import { QUALITY_TYPES, ITEM_TYPES } from './enumConfig';

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

  // 物品品质颜色映射
  QUALITY_COLORS: {
    [QUALITY_TYPES.NORMAL]: 'quality-normal',
    [QUALITY_TYPES.RARE]: 'quality-rare',
    [QUALITY_TYPES.EPIC]: 'quality-epic',
    [QUALITY_TYPES.LEGENDARY]: 'quality-legendary',
    [QUALITY_TYPES.MYTHIC]: 'quality-mythic'
  },

  // 物品堆叠规则
  STACK_RULES: {
    [ITEM_TYPES.EQUIPMENT]: 1,      // 装备不可堆叠
    [ITEM_TYPES.CONSUMABLE]: 99,    // 消耗品最多堆叠99个
    [ITEM_TYPES.MATERIAL]: 999,     // 材料最多堆叠999个
    [ITEM_TYPES.QUEST]: 1          // 任务物品不可堆叠
  }
};

// 背包物品基础配置
export const ITEM_BASE_CONFIG = {
  // 消耗品配置
  consumables: {
    basicExpPill: {
      id: "basicExpPill",
      name: "初级经验丹",
      type: ITEM_TYPES.CONSUMABLE,
      quality: QUALITY_TYPES.NORMAL,
      description: "使用后获得1000点经验值",
      icon: "fa-pills",
      effect: {
        type: "experience",
        value: 1000
      }
    },
    intermediateExpPill: {
      id: "intermediateExpPill",
      name: "中级经验丹",
      type: ITEM_TYPES.CONSUMABLE,
      quality: QUALITY_TYPES.RARE,
      description: "使用后获得5000点经验值",
      icon: "fa-pills",
      effect: {
        type: "experience",
        value: 5000
      }
    },
    advancedExpPill: {
      id: "advancedExpPill",
      name: "高级经验丹",
      type: ITEM_TYPES.CONSUMABLE,
      quality: QUALITY_TYPES.EPIC,
      description: "使用后获得20000点经验值",
      icon: "fa-pills",
      effect: {
        type: "experience",
        value: 20000
      }
    }
  },

  // 材料配置
  materials: {
    refinementStone: {
      id: "refinementStone",
      name: "炼妖石",
      type: ITEM_TYPES.MATERIAL,
      quality: QUALITY_TYPES.NORMAL,
      description: "用于炼妖的基础材料",
      icon: "fa-gem"
    },
    advancedRefinementStone: {
      id: "advancedRefinementStone",
      name: "高级炼妖石",
      type: ITEM_TYPES.MATERIAL,
      quality: QUALITY_TYPES.RARE,
      description: "用于炼妖的高级材料",
      icon: "fa-gem"
    }
  }
}; 