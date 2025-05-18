import { createSlice } from '@reduxjs/toolkit';
// 导入相关的配置，用于计算装备效果
import { equipmentConfig as allEquipmentBaseConfig, equipmentQualityConfig } from '@/config/equipmentConfig'; 
import { qualityConfig as generalQualityConfig } from '@/config/config'; 

// 排序常量
export const SORT_TYPES = {
  TIME_ASC: 'TIME_ASC',
  TIME_DESC: 'TIME_DESC',
  QUALITY_ASC: 'QUALITY_ASC',
  QUALITY_DESC: 'QUALITY_DESC',
  LEVEL_ASC: 'LEVEL_ASC',
  LEVEL_DESC: 'LEVEL_DESC',
  TYPE: 'TYPE'
};

// 品质权重映射
const QUALITY_WEIGHTS = {
  '普通': 1,
  '优秀': 2,
  '精良': 3,
  '稀有': 4,
  '史诗': 5,
  '传说': 6,
};

// --- Helper Function for calculating equipment final effects ---
const calculateEquipmentFinalEffects = (baseConfigName, qualityName, level = 1) => {
  let foundBaseConfig = null;
  let itemSlotType = null;

  for (const categoryKey in allEquipmentBaseConfig) {
    foundBaseConfig = allEquipmentBaseConfig[categoryKey].find(eq => eq.name === baseConfigName);
    if (foundBaseConfig) {
      itemSlotType = categoryKey;
      break;
    }
  }

  if (!foundBaseConfig) {
    console.error(`[itemSlice] Base config for "${baseConfigName}" not found.`);
    return { effects: {}, slotType: null, baseConfig: null }; 
  }

  const finalEffects = {};
  const rawEffectsFromBase = foundBaseConfig.effects;
  
  const qualityNameToUse = equipmentQualityConfig.names.includes(qualityName) ? qualityName : 
                           (generalQualityConfig.names.includes(qualityName) ? qualityName : null);

  let qualityMultiplier = 1; // Default to 1 if quality name not found
  if (qualityNameToUse) {
    qualityMultiplier = (equipmentQualityConfig.effectMultiplier && equipmentQualityConfig.effectMultiplier[equipmentQualityConfig.names.indexOf(qualityNameToUse)]) ||
                        (generalQualityConfig.attributeMultipliers && generalQualityConfig.attributeMultipliers[generalQualityConfig.names.indexOf(qualityNameToUse)]) ||
                        1;
  } else {
    console.warn(`[itemSlice] Quality name "${qualityName}" for ${baseConfigName} not found in specific or general quality configs. Using default multiplier 1.`);
  }

  const percentageEffectKeys = ["critRate", "critDamage", "dodgeRate", "fireResistance"]; 

  if (rawEffectsFromBase) {
    for (const effectKey in rawEffectsFromBase) {
      if (rawEffectsFromBase.hasOwnProperty(effectKey)) {
        let baseValue = rawEffectsFromBase[effectKey];
        let valueWithQuality = baseValue * qualityMultiplier;
        let finalValue = valueWithQuality * (1 + (level - 1) * (foundBaseConfig.levelFactor || 0.05));

        if (percentageEffectKeys.includes(effectKey)) {
          finalEffects[effectKey] = parseFloat(finalValue.toFixed(5));
        } else {
          finalEffects[effectKey] = Math.floor(finalValue);
        }
      }
    }
  }
  return { effects: finalEffects, slotType: itemSlotType, baseConfig: foundBaseConfig };
};


const initialState = {
  allItems: {}, // id: itemObject
  sortType: SORT_TYPES.TIME_DESC, // 默认按时间倒序
};

const itemSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const itemData = action.payload; 
      if (!itemData || !itemData.id) {
        console.error("addItem: Invalid item data or missing ID", itemData);
        return;
      }

      let processedItemData = { ...itemData };

      if (itemData.itemType === 'equipment' && (!itemData.finalEffects || Object.keys(itemData.finalEffects).length === 0)) {
        const { effects, slotType, baseConfig } = calculateEquipmentFinalEffects(
          itemData.name, 
          itemData.quality,
          itemData.level || 1
        );
        processedItemData.finalEffects = effects;
        if (slotType && !processedItemData.slotType) { 
            processedItemData.slotType = slotType;
        }
        if (baseConfig && !processedItemData.icon) processedItemData.icon = baseConfig.icon;
        if (baseConfig && !processedItemData.description) processedItemData.description = baseConfig.description;
      }
      
      processedItemData.isEquipped = processedItemData.isEquipped || false;
      processedItemData.equippedBy = processedItemData.equippedBy || null;
      processedItemData.equippedBySummonName = processedItemData.equippedBySummonName || null;
      processedItemData.addedTimestamp = Date.now();

      state.allItems[processedItemData.id] = processedItemData;
    },

    addItems: (state, action) => {
      const itemsArray = action.payload;
      if (Array.isArray(itemsArray)) {
        itemsArray.forEach(item => {
          itemSlice.caseReducers.addItem(state, { payload: item });
        });
      } else {
        console.error("addItems: payload is not an array", itemsArray);
      }
    },

    updateItem: (state, action) => {
      const { id, ...updates } = action.payload;
      if (state.allItems[id]) {
        const existingItem = state.allItems[id];
        const updatedItem = { ...existingItem, ...updates };

        if (updatedItem.itemType === 'equipment' && (updates.quality || updates.level)) {
          const { effects } = calculateEquipmentFinalEffects(
            updatedItem.name, 
            updatedItem.quality,
            updatedItem.level || 1
          );
          updatedItem.finalEffects = effects;
        }
        state.allItems[id] = updatedItem;
      } else {
        console.error("updateItem: Item ID not found", id);
      }
    },

    setItemStatus: (state, action) => {
      const { id, isEquipped, equippedBy } = action.payload;
      if (state.allItems[id]) {
        state.allItems[id].isEquipped = isEquipped;
        state.allItems[id].equippedBy = equippedBy || null;
      }
    },

    removeItem: (state, action) => {
      const itemId = action.payload;
      delete state.allItems[itemId];
    },

    removeAllItems: (state) => { 
      state.allItems = {};
    },
    
    resetItemsState: () => initialState, 

    setSortType: (state, action) => {
      state.sortType = action.payload;
    },
  }
});

export const {
  addItem,
  addItems,
  updateItem,
  setItemStatus,
  removeItem,
  removeAllItems,
  resetItemsState,
  setSortType,
} = itemSlice.actions;

// Selectors
export const selectAllItemsMap = state => state.items.allItems; 
export const selectAllItemsArray = state => Object.values(state.items.allItems);
export const selectItemById = (state, itemId) => state.items.allItems[itemId];

export const selectEquippedItems = state =>
  Object.values(state.items.allItems).filter(item => item.isEquipped);

export const selectItemsByType = (state, itemType) =>
  Object.values(state.items.allItems).filter(item => item.itemType === itemType);

export const selectItemsBySlotType = (state, slotType) =>
  Object.values(state.items.allItems).filter(item => item.itemType ==='equipment' && item.slotType === slotType);

export const selectSortType = state => state.items.sortType;

export const selectSortedItems = state => {
  const items = Object.values(state.items.allItems);
  const sortType = state.items.sortType;

  return items.sort((a, b) => {
    switch (sortType) {
      case SORT_TYPES.TIME_ASC:
        return a.addedTimestamp - b.addedTimestamp;
      case SORT_TYPES.TIME_DESC:
        return b.addedTimestamp - a.addedTimestamp;
      case SORT_TYPES.QUALITY_ASC:
        return (QUALITY_WEIGHTS[a.quality] || 0) - (QUALITY_WEIGHTS[b.quality] || 0);
      case SORT_TYPES.QUALITY_DESC:
        return (QUALITY_WEIGHTS[b.quality] || 0) - (QUALITY_WEIGHTS[a.quality] || 0);
      case SORT_TYPES.LEVEL_ASC:
        return (a.level || 0) - (b.level || 0);
      case SORT_TYPES.LEVEL_DESC:
        return (b.level || 0) - (a.level || 0);
      case SORT_TYPES.TYPE:
        return (a.itemType || '').localeCompare(b.itemType || '');
      default:
        return 0;
    }
  });
};

export const selectItemWithSummonInfo = (state, itemId) => {
  const item = state.items.allItems[itemId];
  if (!item) return null;

  const result = { ...item };
  if (item.equippedBy) {
    const summon = state.summons.allSummons[item.equippedBy];
    if (summon) {
      result.equippedBySummonName = summon.nickname || summon.name;
    }
  }
  return result;
};

export const selectEquippedItemsWithSummonInfo = state => {
  return Object.values(state.items.allItems)
    .filter(item => item.isEquipped)
    .map(item => {
      const result = { ...item };
      if (item.equippedBy) {
        const summon = state.summons.allSummons[item.equippedBy];
        if (summon) {
          result.equippedBySummonName = summon.nickname || summon.name;
        }
      }
      return result;
    });
};

export default itemSlice.reducer; 