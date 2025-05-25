/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:55:08
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-19 04:25:51
 */
import { QUALITY_TYPES, ITEM_TYPES } from '../enumConfig';

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
    },
    // 魔兽要诀 - 用于给召唤兽添加技能的消耗品
    monsterManualFire: {
      id: "monsterManualFire",
      name: "火系魔兽要诀",
      type: ITEM_TYPES.CONSUMABLE,
      quality: QUALITY_TYPES.RARE,
      description: "使用后可以为召唤兽学习一个火系技能",
      icon: "fa-book-flame",
      effect: {
        type: "learn_skill",
        skillElement: "FIRE",
        skillPool: ["烈火", "三味真火", "烈焰护体"]
      }
    },
    monsterManualWater: {
      id: "monsterManualWater",
      name: "水系魔兽要诀",
      type: ITEM_TYPES.CONSUMABLE,
      quality: QUALITY_TYPES.RARE,
      description: "使用后可以为召唤兽学习一个水系技能",
      icon: "fa-book-sparkles",
      effect: {
        type: "learn_skill",
        skillElement: "WATER",
        skillPool: ["水漫金山", "冰牢", "水盾"]
      }
    },
    monsterManualThunder: {
      id: "monsterManualThunder",
      name: "雷系魔兽要诀",
      type: ITEM_TYPES.CONSUMABLE,
      quality: QUALITY_TYPES.RARE,
      description: "使用后可以为召唤兽学习一个雷系技能",
      icon: "fa-book-bolt",
      effect: {
        type: "learn_skill",
        skillElement: "THUNDER",
        skillPool: ["雷击", "奔雷咒", "风雷天威"]
      }
    },
    monsterManualSupport: {
      id: "monsterManualSupport",
      name: "辅助魔兽要诀",
      type: ITEM_TYPES.CONSUMABLE,
      quality: QUALITY_TYPES.RARE,
      description: "使用后可以为召唤兽学习一个辅助技能",
      icon: "fa-book-medical",
      effect: {
        type: "learn_skill",
        skillType: "SUPPORT",
        skillPool: ["治愈之光", "隐身", "大地护盾"]
      }
    },
    monsterManualPassive: {
      id: "monsterManualPassive",
      name: "被动魔兽要诀",
      type: ITEM_TYPES.CONSUMABLE,
      quality: QUALITY_TYPES.EPIC,
      description: "使用后可以为召唤兽学习一个被动技能",
      icon: "fa-book-open",
      effect: {
        type: "learn_skill",
        skillMode: "PASSIVE",
        skillPool: ["法术暴击", "连击", "反震", "感知", "魔之心", "敏捷", "幸运", "强力", "法术连击", "夜战", "法术波动", "防御", "必杀", "神佑复生", "闪避"]
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