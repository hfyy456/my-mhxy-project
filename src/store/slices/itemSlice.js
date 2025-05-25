import { createSlice, createSelector } from '@reduxjs/toolkit';
// 导入相关的配置，用于计算装备效果
import { petEquipmentConfig as allEquipmentBaseConfig, equipmentQualityConfig } from '@/config/item/petEquipmentConfig'; 
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

      // Ensure itemType is correctly set if type is 'equipment'
      if (processedItemData.type === 'equipment' && !processedItemData.itemType) {
        processedItemData.itemType = 'equipment';
      }

      if (processedItemData.itemType === 'equipment' && (!processedItemData.finalEffects || Object.keys(processedItemData.finalEffects).length === 0)) {
        const { effects, slotType, baseConfig } = calculateEquipmentFinalEffects(
          processedItemData.name, 
          processedItemData.quality,
          processedItemData.level || 1
        );
        processedItemData.finalEffects = effects;
        if (slotType && !processedItemData.slotType) { 
            processedItemData.slotType = slotType;
        }
        if (baseConfig && !processedItemData.icon) processedItemData.icon = baseConfig.icon;
        if (baseConfig && !processedItemData.description) processedItemData.description = baseConfig.description;
      }
      
      processedItemData.addedTimestamp = Date.now();

      state.allItems[processedItemData.id] = processedItemData;
    },

    addItems: (state, action) => {
      const itemsArray = action.payload;
      if (Array.isArray(itemsArray)) {
        itemsArray.forEach(item => {
          const itemData = item; // Assuming 'item' is the payload structure expected by addItem's core logic
          if (!itemData || !itemData.id) {
            console.error("addItems (forEach): Invalid item data or missing ID", itemData);
            return; // continue to next item
          }
          let processedItemData = { ...itemData };
          if (processedItemData.type === 'equipment' && !processedItemData.itemType) {
            processedItemData.itemType = 'equipment';
          }
          if (processedItemData.itemType === 'equipment' && (!processedItemData.finalEffects || Object.keys(processedItemData.finalEffects).length === 0)) {
            const { effects, slotType, baseConfig } = calculateEquipmentFinalEffects(
              processedItemData.name,
              processedItemData.quality,
              processedItemData.level || 1
            );
            processedItemData.finalEffects = effects;
            if (slotType && !processedItemData.slotType) processedItemData.slotType = slotType;
            if (baseConfig && !processedItemData.icon) processedItemData.icon = baseConfig.icon;
            if (baseConfig && !processedItemData.description) processedItemData.description = baseConfig.description;
          }
          processedItemData.addedTimestamp = Date.now();
          state.allItems[processedItemData.id] = processedItemData;
        });
      } else {
        console.error("addItems: payload is not an array", itemsArray);
      }
    },

    updateItem: (state, action) => {
      const { id, ...updates } = action.payload;
      if (state.allItems[id]) {
        const existingItem = state.allItems[id];
        // Ensure not to spread 'isEquipped' or 'equippedBy' from updates if they are being phased out
        const { isEquipped, equippedBy, equippedBySummonName, ...restOfUpdates } = updates;
        const updatedItem = { ...existingItem, ...restOfUpdates };

        if (updatedItem.itemType === 'equipment' && (restOfUpdates.quality || restOfUpdates.level)) {
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

    setState: (state, action) => {
      // 确保正确恢复物品状态
      const loadedAllItems = action.payload.allItems || {};
      const newAllItems = {};

      for (const itemId in loadedAllItems) {
        if (loadedAllItems.hasOwnProperty(itemId)) {
          let itemData = { ...loadedAllItems[itemId] };

          // Ensure itemType is correctly set if type is 'equipment' from saved data
          if (itemData.type === 'equipment' && !itemData.itemType) {
            itemData.itemType = 'equipment';
          }
          // REMOVE isEquipped, equippedBy from loaded item data if they exist from old save
          delete itemData.isEquipped;
          delete itemData.equippedBy;
          delete itemData.equippedBySummonName;

          // 对装备进行特殊处理，确保 finalEffects 等属性是最新的
          if (itemData.itemType === 'equipment') {
            // 检查是否需要重新计算，例如，如果 finalEffects 不存在，或者我们想强制刷新
            // 为确保一致性，这里我们总是重新计算
            const { effects, slotType, baseConfig } = calculateEquipmentFinalEffects(
              itemData.name,
              itemData.quality,
              itemData.level || 1
            );
            itemData.finalEffects = effects;
            if (slotType && !itemData.slotType) { // 仅当存档中没有 slotType 时才更新
              itemData.slotType = slotType;
            } else if (slotType && itemData.slotType !== slotType) { // 如果存档中的 slotType 与配置不符，告警并使用配置的
                console.warn(`[itemSlice] Mismatch in slotType for item ${itemData.name} (ID: ${itemId}). Saved: ${itemData.slotType}, Config: ${slotType}. Using config slotType.`);
                itemData.slotType = slotType;
            }
            
            // 如果存档中没有 icon/description，或者我们想用最新的配置，则更新
            if (baseConfig) {
                if (!itemData.icon || itemData.icon !== baseConfig.icon) {
                    itemData.icon = baseConfig.icon;
                }
                if (!itemData.description || itemData.description !== baseConfig.description) {
                    itemData.description = baseConfig.description;
                }
            }
          }
          newAllItems[itemId] = itemData;
        }
      }

      console.log('[itemSlice.setState] Payload allItems:', action.payload.allItems);
      console.log('[itemSlice.setState] Final newAllItems:', newAllItems);

      return {
        allItems: newAllItems,
        sortType: action.payload.sortType || SORT_TYPES.TIME_DESC
      };
    },
  }
});

// Action Creators (already exported like this is fine)
export const {
  addItem,
  addItems,
  updateItem,
  removeItem,
  removeAllItems,
  resetItemsState,
  setSortType,
  setState,
} = itemSlice.actions;

// Selectors (defined without export initially)
const selectAllItemsMap = state => state.items.allItems;

const selectAllItemsArray = createSelector(
  [selectAllItemsMap],
  (allItems) => Object.values(allItems)
);

const selectItemById = (state, itemId) => state.items.allItems[itemId];

const selectItemsByType = createSelector(
  [selectAllItemsArray, (state, itemType) => itemType],
  (items, itemType) => items.filter(item => item.itemType === itemType)
);

const selectItemsBySlotType = createSelector(
  [selectAllItemsArray, (state, slotType) => slotType],
  (items, slotType) => items.filter(item => item.itemType ==='equipment' && item.slotType === slotType)
);

const selectSortType = state => state.items.sortType;

const selectSortedItems = createSelector(
  [selectAllItemsArray, selectSortType],
  (items, sortType) => {
    const sortableItems = [...items]; 
    return sortableItems.sort((a, b) => {
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
  }
);

const selectItemEquipInfo = createSelector(
  [
    (state) => state.summons.allSummons,
    (state, itemId) => itemId
  ],
  (allSummons, itemId) => {
    console.log(`[selectItemEquipInfo] Checking item ID: ${itemId}, allSummons available:`, !!allSummons);
    if (!allSummons) {
      console.warn("[selectItemEquipInfo] allSummons is undefined or null.");
      return { isEquipped: false, equippedBySummonId: null, equippedOnSlot: null, equippedBySummonName: null };
    }
    for (const summonId in allSummons) {
      const summon = allSummons[summonId];
      if (!summon) {
        console.warn(`[selectItemEquipInfo] Summon object for ID ${summonId} is undefined or null.`);
        continue; 
      }
      console.log(`[selectItemEquipInfo] Checking summon: ${summonId}, Name: ${summon.name}, Nickname: ${summon.nickname}, Equipped IDs:`, summon.equippedItemIds);
      if (summon.equippedItemIds) {
        for (const slotType in summon.equippedItemIds) {
          if (summon.equippedItemIds[slotType] === itemId) {
            const nameToDisplay = summon.nickname || summon.name || '未知召唤兽';
            console.log(`[selectItemEquipInfo] Item ${itemId} FOUND equipped by ${summonId} (${nameToDisplay}) in slot ${slotType}`);
            return {
              isEquipped: true,
              equippedBySummonId: summonId,
              equippedBySummonName: nameToDisplay,
              equippedOnSlot: slotType
            };
          }
        }
      }
    }
    console.log(`[selectItemEquipInfo] Item ${itemId} NOT found equipped.`);
    return { isEquipped: false, equippedBySummonId: null, equippedOnSlot: null, equippedBySummonName: null };
  }
);

const selectItemWithSummonInfo = createSelector(
  [selectItemById, selectItemEquipInfo],
  (item, equipInfo) => {
    if (!item) return null;
    console.log(`[selectItemWithSummonInfo] For item ${item.id} (${item.name}), equipInfo:`, equipInfo);
    return { 
      ...item, 
      isEquipped: equipInfo.isEquipped,
      equippedBy: equipInfo.equippedBySummonId,
      equippedBySummonName: equipInfo.equippedBySummonName,
      equippedOnSlot: equipInfo.equippedOnSlot
    };
  }
);

const selectAllItemsWithSummonInfo = createSelector(
  [selectAllItemsArray, (state) => state], 
  (allItemsArray, state) => {
    return allItemsArray.map(item => selectItemWithSummonInfo(state, item.id));
  }
);

const selectEquippedItemsWithSummonInfo = createSelector(
  [selectAllItemsArray, (state) => state.summons.allSummons],
  (items, allSummons) => {
    if (!allSummons) return [];
    const equippedItemsDetails = [];
    for (const summonId in allSummons) {
      const summon = allSummons[summonId];
      if (summon.equippedItemIds) {
        for (const slotType in summon.equippedItemIds) {
          const itemId = summon.equippedItemIds[slotType];
          if (itemId) {
            const item = items.find(i => i.id === itemId); 
            if (item) {
              equippedItemsDetails.push({
                ...item,
                isEquipped: true,
                equippedBySummonId: summonId,
                equippedBySummonName: summon.nickname || summon.name,
                equippedOnSlot: slotType
              });
            }
          }
        }
      }
    }
    return equippedItemsDetails;
  }
);

// Explicitly export all selectors and the reducer
export {
  selectAllItemsMap,
  selectAllItemsArray,
  selectItemById,
  selectItemsByType,
  selectItemsBySlotType,
  selectSortType,
  selectSortedItems,
  selectItemEquipInfo,
  selectItemWithSummonInfo,
  selectAllItemsWithSummonInfo, // Ensuring this is explicitly exported
  selectEquippedItemsWithSummonInfo
};

export default itemSlice.reducer; 