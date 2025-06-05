/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:55:08
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-06 06:31:15
 */
/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:55:08
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-06 03:21:20
 */
import { QUALITY_TYPES, ITEM_TYPES, EQUIPMENT_SLOT_TYPES } from '../enumConfig';
import itemBaseConfigData from './allItems.json';

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

// 处理枚举类型转换的辅助函数
const convertEnumTypes = (config) => {
  const converted = JSON.parse(JSON.stringify(config)); // 深拷贝
  
  // 转换装备类型
  Object.keys(converted.equipments || {}).forEach(key => {
    const item = converted.equipments[key];
    item.type = ITEM_TYPES.EQUIPMENT;
    
    // 转换装备槽位类型
    switch(item.slotType) {
      case 'accessory':
        item.slotType = EQUIPMENT_SLOT_TYPES.ACCESSORY;
        break;
      case 'relic':
        item.slotType = EQUIPMENT_SLOT_TYPES.RELIC;
        break;
      case 'bloodline':
        item.slotType = EQUIPMENT_SLOT_TYPES.BLOODLINE;
        break;
      case 'rune':
        item.slotType = EQUIPMENT_SLOT_TYPES.RUNE;
        break;
    }
  });
  
  // 转换消耗品类型
  Object.keys(converted.consumables || {}).forEach(key => {
    const item = converted.consumables[key];
    item.type = ITEM_TYPES.CONSUMABLE;
    
    // 转换品质类型
    switch(item.quality) {
      case 'normal':
        item.quality = QUALITY_TYPES.NORMAL;
        break;
      case 'rare':
        item.quality = QUALITY_TYPES.RARE;
        break;
      case 'epic':
        item.quality = QUALITY_TYPES.EPIC;
        break;
      case 'legendary':
        item.quality = QUALITY_TYPES.LEGENDARY;
        break;
      case 'mythic':
        item.quality = QUALITY_TYPES.MYTHIC;
        break;
    }
  });
  
  // 转换材料类型
  Object.keys(converted.materials || {}).forEach(key => {
    const item = converted.materials[key];
    item.type = ITEM_TYPES.MATERIAL;
    
    // 转换品质类型
    switch(item.quality) {
      case 'normal':
        item.quality = QUALITY_TYPES.NORMAL;
        break;
      case 'rare':
        item.quality = QUALITY_TYPES.RARE;
        break;
      case 'epic':
        item.quality = QUALITY_TYPES.EPIC;
        break;
      case 'legendary':
        item.quality = QUALITY_TYPES.LEGENDARY;
        break;
      case 'mythic':
        item.quality = QUALITY_TYPES.MYTHIC;
        break;
    }
  });
  
  return converted;
};

// 背包物品基础配置
export const ITEM_BASE_CONFIG = convertEnumTypes(itemBaseConfigData); 