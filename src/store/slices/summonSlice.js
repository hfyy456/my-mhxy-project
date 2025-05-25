import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import {
  petConfig,
  qualityConfig,
  derivedAttributeConfig,
  STANDARD_EQUIPMENT_SLOTS,
  levelExperienceRequirements,
  skillConfig,
  MAX_LEVEL,
  POINTS_PER_LEVEL,
  MAX_SKILLS,
  ACTIVE_SKILL_LIMIT,
  // skillTypeConfig // Not directly used in reducers here, but could be for UI selectors
} from '@/config/config'; // Assuming a merged config
// import { equipmentConfig } from '@/config/equipmentConfig'; // Not directly used in this slice's reducers after items are pure data
import { getRaceBonus } from '@/config/pet/raceConfig'; // 引入种族加成函数
import { SKILL_MODES } from "@/config/enumConfig";
// REMOVED: import { setItemStatus } from './itemSlice';
import { playerBaseConfig } from '@/config/character/playerConfig';
import { calculateDerivedAttributes, getExperienceForLevel } from '@/utils/summonUtils';
import { selectAllItemsMap } from './itemSlice'; // Make sure to import this selector from itemSlice

// --- Helper Functions ---

// Helper function (can be co-located or imported if it becomes complex)
// This function helps in constructing the currentSummonFullData by attaching item objects.
// It needs access to the items part of the state.
const selectEquippedItemsForSummonLogic = (summonState, summonId, itemsState) => {
  const summon = summonState.allSummons[summonId];
  if (!summon || !summon.equippedItemIds || !itemsState || !itemsState.allItems) return {};
  
  const equippedItemsData = {};
  for (const slotType in summon.equippedItemIds) {
      const itemId = summon.equippedItemIds[slotType];
      if (itemId && itemsState.allItems[itemId]) {
          equippedItemsData[slotType] = itemsState.allItems[itemId];
      } else {
          if (STANDARD_EQUIPMENT_SLOTS.includes(slotType)) {
               equippedItemsData[slotType] = null;
          }
      }
  }
  STANDARD_EQUIPMENT_SLOTS.forEach(slot => {
      if (!equippedItemsData.hasOwnProperty(slot)) {
          equippedItemsData[slot] = null;
      }
  });
  return equippedItemsData;
};

const initialState = {
  allSummons: {},
  currentSummonId: null,
  currentSummonFullData: null,
  isLoading: false,
  error: null,
  refinementHistory: [],
  maxSummons: playerBaseConfig.getMaxSummonsByLevel(playerBaseConfig.initialLevel),
};

// Async thunk for setting current summon and ensuring full data is populated
export const setCurrentSummon = createAsyncThunk(
  'summon/setCurrentSummon',
  async (summonId, { getState, dispatch }) => {
    // Dispatch a plain action to update currentSummonId immediately
    dispatch(setCurrentSummonAction(summonId)); 
    if (summonId) {
      // After ID is set, dispatch recalculateSummonStats to ensure currentSummonFullData is updated
      // This thunk will fetch all items and calculate stats.
      await dispatch(recalculateSummonStats({ summonId }));
    }
    return summonId; // Optional: return the id for further chaining or logging
  }
);

// Thunk for recalculating stats, expects all items to be available in itemSlice
export const recalculateSummonStats = createAsyncThunk(
  'summon/recalculateSummonStats',
  async ({ summonId }, { getState }) => {
    const state = getState();
    // ---- START DIAGNOSTIC LOG ----
    console.log('[recalculateSummonStats] Received summonId:', summonId);
    console.log('[recalculateSummonStats] Keys in state.summons.allSummons:', Object.keys(state.summons.allSummons || {}));
    // ---- END DIAGNOSTIC LOG ----
    const summon = state.summons.allSummons[summonId];
    if (!summon) {
      throw new Error('Summon not found for recalculation');
    }
    const allItemsMap = state.items.allItems; // Changed state.item to state.items
    const equippedItemsDataMap = {};
    if (summon.equippedItemIds) {
      for (const slotType in summon.equippedItemIds) {
        const itemId = summon.equippedItemIds[slotType];
        if (itemId && allItemsMap[itemId]) {
          equippedItemsDataMap[slotType] = allItemsMap[itemId];
        } else {
          equippedItemsDataMap[slotType] = null;
        }
      }
    }
     // Ensure all standard slots are present
    STANDARD_EQUIPMENT_SLOTS.forEach(slot => {
        if (!equippedItemsDataMap.hasOwnProperty(slot)) {
            equippedItemsDataMap[slot] = null;
        }
    });
    return { summonId, allCurrentlyEquippedItemsDataMap: equippedItemsDataMap };
  }
);

const summonSlice = createSlice({
  name: 'summons',
  initialState,
  reducers: {
    setCurrentSummonAction: (state, action) => { // Plain action handled by setCurrentSummon thunk
      state.currentSummonId = action.payload;
      // Full data update is now handled by recalculateSummonStats thunk completion
      if (!action.payload) { // If null is passed, clear full data
          state.currentSummonFullData = null;
      }
    },
    addSummon: (state, action) => {
      const summonData = action.payload;
      if (!summonData || !summonData.id || !petConfig[summonData.petId]) {
        console.error('addSummon: Invalid summonData, missing ID, or missing petConfig entry for:', summonData.petId, summonData);
        state.error = 'Failed to add summon: Invalid data.';
        return;
      }

      const currentSummonCount = Object.keys(state.allSummons).length;
      const maxSummons = state.maxSummons;

      if (currentSummonCount >= maxSummons) {
        state.error = `无法添加更多召唤兽，已达到上限 (${maxSummons}个)。请先释放一些召唤兽或提升玩家等级。`;
        return;
      }

      const petBaseConf = petConfig[summonData.petId];
      const newSummon = {
        ...summonData, 
        experience: summonData.experience || 0,
        potentialPoints: summonData.potentialPoints !== undefined ? summonData.potentialPoints : (summonData.level -1) * (petBaseConf?.potentialPointsPerLevel || 5),
        allocatedPoints: summonData.allocatedPoints || { constitution: 0, strength: 0, agility: 0, intelligence: 0, luck: 0 },
        derivedAttributes: {}, 
        equipmentContributions: {},
        equipmentBonusesToBasic: {},
        experienceToNextLevel: getExperienceForLevel(summonData.level),
        equippedItemIds: STANDARD_EQUIPMENT_SLOTS.reduce((acc, slot) => {
            acc[slot] = summonData.equippedItemIds?.[slot] || null;
            return acc;
        }, {}),
      };
      state.allSummons[newSummon.id] = newSummon;
      state.error = null;

      // Calculate initial stats without equipment effects for now.
      const initialBasicWithAllocated = { ...newSummon.basicAttributes };
      for(const attr in newSummon.allocatedPoints) {
            initialBasicWithAllocated[attr] = (initialBasicWithAllocated[attr] || 0) + newSummon.allocatedPoints[attr];
      }
      const { derivedAttributes, equipmentContributions, equipmentBonusesToBasic } = calculateDerivedAttributes(
          initialBasicWithAllocated,
          {}, // Pass empty map for items initially
          newSummon.level,
          summonData.race
      );
      state.allSummons[newSummon.id].derivedAttributes = derivedAttributes;
      state.allSummons[newSummon.id].equipmentContributions = equipmentContributions;
      state.allSummons[newSummon.id].equipmentBonusesToBasic = equipmentBonusesToBasic;
    },
    
    _internalUpdateSummonCalculatedFields: (state, summonId, allCurrentlyEquippedItemsData = {}) => {
        const summon = state.allSummons[summonId];
        if (!summon) {
            console.warn(`_internalUpdateSummonCalculatedFields: Summon ID ${summonId} not found.`);
            return;
        }

        const currentBasicAttributesWithPoints = { ...summon.basicAttributes };
        for (const attr in summon.allocatedPoints) {
            currentBasicAttributesWithPoints[attr] = (currentBasicAttributesWithPoints[attr] || 0) + summon.allocatedPoints[attr];
        }

        const { derivedAttributes, equipmentContributions, equipmentBonusesToBasic } = calculateDerivedAttributes(
            currentBasicAttributesWithPoints,
            allCurrentlyEquippedItemsData,
            summon.level,
            summon.race
        );
        summon.derivedAttributes = derivedAttributes;
        summon.equipmentContributions = equipmentContributions || {};
        summon.equipmentBonusesToBasic = equipmentBonusesToBasic || {};
        summon.experienceToNextLevel = getExperienceForLevel(summon.level); // Keep XpToNextLevel updated
    },

    addExperienceToSummon: (state, action) => {
      const { summonId, experienceAmount } = action.payload;
      const summon = state.allSummons[summonId];
      if (!summon) return;
      
      // Attempt to get pet-specific config for potential points per level
      const currentPetConfig = petConfig[summon.name];
      const pointsToGainPerLevel = currentPetConfig?.potentialPointsPerLevel !== undefined 
                                    ? currentPetConfig.potentialPointsPerLevel 
                                    : POINTS_PER_LEVEL; // Fallback to global config

      let baseConfig = {}; // For attributeGrowth
      try {
        // Assuming summon.baseConfig might be the petConfig entry for this summon, stored during addSummon
        // Or, if summon.baseConfig is not reliably populated, use petConfig[summon.name]
        const petBaseConfForGrowth = summon.baseConfig || currentPetConfig || {};
        baseConfig = JSON.parse(JSON.stringify(petBaseConfForGrowth));
      } catch (e) { console.error("Error parsing baseConfig in addExperienceToSummon", e); }

      summon.experience = (summon.experience || 0) + experienceAmount;
      let leveledUp = false;
      while (summon.level < MAX_LEVEL && summon.experience >= summon.experienceToNextLevel) {
        summon.experience -= summon.experienceToNextLevel;
        summon.level++;
        leveledUp = true;
        const growth = baseConfig?.attributeGrowth || {};
        for (const attr in growth) {
            if (summon.basicAttributes.hasOwnProperty(attr)) { // Ensure attribute exists before adding
                 summon.basicAttributes[attr] = (summon.basicAttributes[attr] || 0) + growth[attr];
          } else {
                // console.warn(`[addExperienceToSummon] Attribute ${attr} for growth not found in summon's basicAttributes`);
            }
        }
        summon.potentialPoints = (summon.potentialPoints || 0) + pointsToGainPerLevel;
        summon.experienceToNextLevel = getExperienceForLevel(summon.level);
        if (summon.experienceToNextLevel === Infinity) {
          summon.experience = 0; // Clear exp if max level reached during this loop
          break;
        }
      }
      if (leveledUp) {
        const equippedItemsData = state.currentSummonId === summonId && state.currentSummonFullData ? state.currentSummonFullData.equippedItems : {};
        summonSlice.caseReducers._internalUpdateSummonCalculatedFields(state, summonId, equippedItemsData);
         if (state.currentSummonId === summonId) {
           state.currentSummonFullData = { ...state.allSummons[summonId], equippedItems: equippedItemsData };
         }
      }
    },

    allocatePointToSummon: (state, action) => {
      const { summonId, attributeName, amount } = action.payload;
      const summon = state.allSummons[summonId];
      if (!summon || !summon.basicAttributes.hasOwnProperty(attributeName) || summon.potentialPoints < amount) {
        return;
      }
      summon.allocatedPoints[attributeName] = (summon.allocatedPoints[attributeName] || 0) + amount;
      summon.potentialPoints -= amount;
      const equippedItemsData = state.currentSummonId === summonId && state.currentSummonFullData ? state.currentSummonFullData.equippedItems : {};
      summonSlice.caseReducers._internalUpdateSummonCalculatedFields(state, summonId, equippedItemsData);
      if (state.currentSummonId === summonId) {
        state.currentSummonFullData = { ...summon, equippedItems: equippedItemsData };
      }
    },

    resetAllocatedPointsForSummon: (state, action) => {
      const { summonId } = action.payload;
      const summon = state.allSummons[summonId];
      if (!summon) return;
      let reclaimedPoints = 0;
      for (const attr in summon.allocatedPoints) {
        reclaimedPoints += summon.allocatedPoints[attr];
        summon.allocatedPoints[attr] = 0;
      }
      summon.potentialPoints += reclaimedPoints;
      const equippedItemsData = state.currentSummonId === summonId && state.currentSummonFullData ? state.currentSummonFullData.equippedItems : {};
      summonSlice.caseReducers._internalUpdateSummonCalculatedFields(state, summonId, equippedItemsData);
        if (state.currentSummonId === summonId) {
        state.currentSummonFullData = { ...summon, equippedItems: equippedItemsData };
      }
    },
    
    equipItemToSummon: (state, action) => {
      const { summonId, itemId, slotType } = action.payload;
      const summon = state.allSummons[summonId];
      if (summon) {
        if (!summon.equippedItemIds) {
          summon.equippedItemIds = {};
        }
        // Ensure all standard slots are initialized if not already present
        STANDARD_EQUIPMENT_SLOTS.forEach(standardSlot => {
          if (!(standardSlot in summon.equippedItemIds)) {
            summon.equippedItemIds[standardSlot] = null;
          }
        });
        // Note: Stat recalculation should be triggered by a thunk that calls this action
        // and then calls recalculateSummonStats for the summonId.
        // Inventory interaction (removing item from inventory, returning old item) 
        // should also be handled by that thunk.
        summon.equippedItemIds[slotType] = itemId;
      }
    },

    unequipItemFromSummon: (state, action) => {
      const { summonId, itemId, slotType } = action.payload; // itemId is for verification
      const summon = state.allSummons[summonId];
      if (summon && summon.equippedItemIds && summon.equippedItemIds[slotType] === itemId) {
        // Note: Stat recalculation should be triggered by a thunk that calls this action
        // and then calls recalculateSummonStats for the summonId.
        // Inventory interaction (returning item to inventory) 
        // should also be handled by that thunk.
        summon.equippedItemIds[slotType] = null;
      } else {
        console.warn(`[summonSlice] Failed to unequip item ${itemId} from slot ${slotType} for summon ${summonId}. Slot or item mismatch.`);
      }
    },

    // New reducer to remove a specific item from all summons that might be equipping it
    // This should be dispatched when an item is deleted from itemSlice.
    removeItemFromAllSummons: (state, action) => {
      const itemIdToRemove = action.payload;
      let affectedSummonIds = [];
      for (const summonId in state.allSummons) {
        const summon = state.allSummons[summonId];
        if (summon.equippedItemIds) {
          for (const slotType in summon.equippedItemIds) {
            if (summon.equippedItemIds[slotType] === itemIdToRemove) {
              summon.equippedItemIds[slotType] = null;
              if (!affectedSummonIds.includes(summonId)) {
                affectedSummonIds.push(summonId);
              }
            }
          }
        }
      }
      // Note: After this, a thunk or subsequent logic should iterate through affectedSummonIds
      // and dispatch recalculateSummonStats for each to update their derived stats.
      // For currentSummonFullData, if the currentSummonId is in affectedSummonIds,
      // recalculateSummonStats for it will handle the update.
    },
    
    learnSkill: (state, action) => {
      const { summonId, skillName, slotIndex } = action.payload;
      const summon = state.allSummons[summonId];
      if (!summon || !skillName || slotIndex < 0 || slotIndex >= MAX_SKILLS) return;
      if (!Array.isArray(summon.skillSet)) summon.skillSet = [];
      while(summon.skillSet.length < MAX_SKILLS) summon.skillSet.push(null); 
      const skillDetails = skillConfig.find(s => s.name === skillName);
      if (summon.skillSet.filter(s => s !== null).length >= ACTIVE_SKILL_LIMIT && skillDetails?.mode === SKILL_MODES.ACTIVE && !summon.skillSet[slotIndex]) {
        console.warn("Cannot learn more active skillSet.");
        return; 
      }
      summon.skillSet[slotIndex] = skillName;
      if (state.currentSummonId === summonId) {
        state.currentSummonFullData = { ...state.allSummons[summonId], equippedItems: state.currentSummonFullData?.equippedItems || {} }; 
      }
    },

    replaceSkill: (state, action) => {
      const { summonId, newSkillName, slotIndexToReplace } = action.payload;
      const summon = state.allSummons[summonId];
      if (!summon || !newSkillName || slotIndexToReplace < 0 || slotIndexToReplace >= MAX_SKILLS) return;
      if (!Array.isArray(summon.skillSet) || summon.skillSet.length !== MAX_SKILLS) {
         while(summon.skillSet.length < MAX_SKILLS) summon.skillSet.push(null);
      }
      const oldSkillName = summon.skillSet[slotIndexToReplace];
      const oldSkillIsActive = oldSkillName && skillConfig.find(s => s.name === oldSkillName)?.mode === 'active';
      const newSkillIsActive = skillConfig.find(s => s.name === newSkillName)?.mode === 'active';
      if (!oldSkillIsActive && newSkillIsActive && summon.skillSet.filter(s => s !== null && skillConfig.find(sk => sk.name === s)?.mode === 'active').length >= ACTIVE_SKILL_LIMIT) {
          console.warn("Cannot replace passive/empty with active skill if active skill limit is reached.");
          return;
      }
      summon.skillSet[slotIndexToReplace] = newSkillName;
      if (state.currentSummonId === summonId) {
        state.currentSummonFullData = { ...state.allSummons[summonId], equippedItems: state.currentSummonFullData?.equippedItems || {} };
      }
    },

    resetSummonState: () => initialState,
    
    addRefinementHistoryItem: (state, action) => {
      const historyItem = action.payload;
      if (historyItem) {
        state.refinementHistory.unshift(historyItem);
        if (state.refinementHistory.length > 50) {
          state.refinementHistory.pop();
        }
      }
    },

    updateSummonNickname: (state, action) => {
      const { id, nickname } = action.payload;
      if (state.allSummons[id]) {
        state.allSummons[id].nickname = nickname;
        // 如果是当前选中的召唤兽，也更新currentSummonFullData
        if (state.currentSummonId === id && state.currentSummonFullData) {
          state.currentSummonFullData.nickname = nickname;
        }
      }
    },

    releaseSummon: (state, action) => {
      const summonId = action.payload;
      const summon = state.allSummons[summonId];
      
      if (!summon) {
        state.error = '找不到要释放的召唤兽';
        return;
      }

      // 如果当前选中的召唤兽是要释放的召唤兽，清除当前选中
      if (state.currentSummonId === summonId) {
        state.currentSummonId = null;
        state.currentSummonFullData = null;
      }

      // 删除召唤兽
      delete state.allSummons[summonId];
      state.error = null;
    },

    fuseSummons: (state, action) => {
      const { newSummon, summonId1, summonId2 } = action.payload;
      
      // 验证两个父召唤兽是否存在
      if (!summonId1 || !summonId2 || !state.allSummons[summonId1] || !state.allSummons[summonId2]) {
        state.error = '合成失败：选择的召唤兽不存在';
        return;
      }

      // 验证新召唤兽数据是否有效
      if (!newSummon || !newSummon.id || !petConfig[newSummon.petId]) {
        state.error = '合成失败：新召唤兽数据无效';
        return;
      }

      const currentSummonCount = Object.keys(state.allSummons).length;
      const maxSummons = state.maxSummons;

      // 合成会消耗两个召唤兽，但会产生一个新的，所以净减少1个
      if (currentSummonCount - 1 >= maxSummons) {
        state.error = `无法合成：已达到召唤兽上限 (${maxSummons}个)。请先释放一些召唤兽或提升玩家等级。`;
        return;
      }

      // 获取父召唤兽的配置
      const petBaseConf = petConfig[newSummon.petId];
      
      // 创建新的召唤兽
      const fusedSummon = {
        ...newSummon,
        experience: 0,
        potentialPoints: newSummon.potentialPoints !== undefined ? newSummon.potentialPoints : (newSummon.level - 1) * (petBaseConf?.potentialPointsPerLevel || 5),
        allocatedPoints: newSummon.allocatedPoints || { constitution: 0, strength: 0, agility: 0, intelligence: 0, luck: 0 },
        derivedAttributes: {},
        equipmentContributions: {},
        equipmentBonusesToBasic: {},
        experienceToNextLevel: getExperienceForLevel(newSummon.level),
        equippedItemIds: STANDARD_EQUIPMENT_SLOTS.reduce((acc, slot) => {
          acc[slot] = newSummon.equippedItemIds?.[slot] || null;
          return acc;
        }, {}),
        // 确保技能集是一个数组
        skillSet: Array.isArray(newSummon.skillSet) ? newSummon.skillSet : (newSummon.inheritedSkills || [])
      };

      // 添加新召唤兽
      state.allSummons[fusedSummon.id] = fusedSummon;
      
      // 删除两个父召唤兽
      delete state.allSummons[summonId1];
      delete state.allSummons[summonId2];
      
      // 如果当前选中的召唤兽是要删除的召唤兽之一，将新召唤兽设为当前选中
      if (state.currentSummonId === summonId1 || state.currentSummonId === summonId2) {
        state.currentSummonId = fusedSummon.id;
        // 全数据更新将由recalculateSummonStats thunk完成
      }
      
      state.error = null;

      // 计算初始属性
      const initialBasicWithAllocated = { ...fusedSummon.basicAttributes };
      for(const attr in fusedSummon.allocatedPoints) {
        initialBasicWithAllocated[attr] = (initialBasicWithAllocated[attr] || 0) + fusedSummon.allocatedPoints[attr];
      }
      
      const { derivedAttributes, equipmentContributions, equipmentBonusesToBasic } = calculateDerivedAttributes(
        initialBasicWithAllocated,
        {}, // 初始时传入空装备映射
        fusedSummon.level,
        fusedSummon.race
      );
      
      state.allSummons[fusedSummon.id].derivedAttributes = derivedAttributes;
      state.allSummons[fusedSummon.id].equipmentContributions = equipmentContributions;
      state.allSummons[fusedSummon.id].equipmentBonusesToBasic = equipmentBonusesToBasic;
    },
    
    setState: (state, action) => {
      // 完全替换状态
      return action.payload;
    },

  },
  extraReducers: (builder) => {
    builder
      .addCase(setCurrentSummon.fulfilled, (state, action) => {
        // The recalculateSummonStats called within setCurrentSummon thunk handles updating full data.
        // currentSummonId is already set by setCurrentSummonAction.
        // This case might just be for logging or additional logic if needed.
      })
      .addCase(setCurrentSummon.rejected, (state, action) => {
        state.error = action.error.message;
        state.currentSummonFullData = null; // Clear full data on error
      })
      .addCase(recalculateSummonStats.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(recalculateSummonStats.fulfilled, (state, action) => {
        const { summonId, allCurrentlyEquippedItemsDataMap } = action.payload;
        const summon = state.allSummons[summonId];
        if (summon) {
          summonSlice.caseReducers._internalUpdateSummonCalculatedFields(state, summonId, allCurrentlyEquippedItemsDataMap);
          // If this is the currently selected summon, update currentSummonFullData
          if (state.currentSummonId === summonId) {
            state.currentSummonFullData = {
              ...summon, // Spread the already updated summon from allSummons
              equippedItems: allCurrentlyEquippedItemsDataMap // Attach the item objects map
            };
          }
        }
        state.isLoading = false;
        state.error = null;
      })
      .addCase(recalculateSummonStats.rejected, (state, action) => {
        console.error("[recalculateSummonStats.rejected] Error:", action.error.message);
        state.isLoading = false;
        state.error = action.error.message;
        // Optionally, if current summon failed recalculation, clear its full data
        if (state.currentSummonId === action.meta.arg.summonId) {
            state.currentSummonFullData = null;
        }
      });
  },
});

export const {
  setCurrentSummonAction,
  addSummon,
  _internalUpdateSummonCalculatedFields,
  addExperienceToSummon,
  allocatePointToSummon,
  resetAllocatedPointsForSummon,
  equipItemToSummon,
  unequipItemFromSummon,
  removeItemFromAllSummons,
  learnSkill,
  replaceSkill,
  resetSummonState,
  addRefinementHistoryItem,
  updateSummonNickname,
  releaseSummon,
  fuseSummons,
  setState,
} = summonSlice.actions;

// Selectors
export const selectAllSummons = state => state.summons.allSummons;
export const selectCurrentSummonId = state => state.summons.currentSummonId;
export const selectSummonById = (state, summonId) => state.summons.allSummons[summonId];

export const selectEquippedItemsForSummon = createSelector(
  [
    // Input selector for the specific summon object based on summonId
    (state, summonId) => state.summons.allSummons[summonId],
    // Input selector for all items map
    selectAllItemsMap 
  ],
  (summon, allItems) => {
    if (!summon || !summon.equippedItemIds || !allItems) return {};
    
    const equippedItemsData = {};
    for (const slotType in summon.equippedItemIds) {
        const itemId = summon.equippedItemIds[slotType];
        if (itemId && allItems[itemId]) {
            equippedItemsData[slotType] = allItems[itemId];
        } else {
            if (STANDARD_EQUIPMENT_SLOTS.includes(slotType)) {
                 equippedItemsData[slotType] = null;
            }
        }
    }
    STANDARD_EQUIPMENT_SLOTS.forEach(slot => {
        if (!equippedItemsData.hasOwnProperty(slot)) {
            equippedItemsData[slot] = null;
        }
    });
    return equippedItemsData;
  }
);

export const selectCurrentSummonFullData = createSelector(
  [
    selectCurrentSummonId,
    selectAllSummons,
    selectAllItemsMap // Depends on the items map directly now
  ],
  (currentSummonId, allSummons, allItems) => {
    if (!currentSummonId) return null;
    const summon = allSummons[currentSummonId];
    if (!summon) return null;

    // Re-implement the logic of selectEquippedItemsForSummon here for the current summon
    // or call a memoized version if selectEquippedItemsForSummon can be made to work with createSelector easily
    // For directness and to ensure memoization path is clear for *this* selector:
    const equippedItems = {};
    if (summon.equippedItemIds && allItems) {
      for (const slotType in summon.equippedItemIds) {
        const itemId = summon.equippedItemIds[slotType];
        if (itemId && allItems[itemId]) {
          equippedItems[slotType] = allItems[itemId];
        } else {
          if (STANDARD_EQUIPMENT_SLOTS.includes(slotType)) {
            equippedItems[slotType] = null;
          }
        }
      }
      STANDARD_EQUIPMENT_SLOTS.forEach(slot => {
        if (!equippedItems.hasOwnProperty(slot)) {
          equippedItems[slot] = null;
        }
      });
    }

    return {
      ...summon,
      equippedItems,
    };
  }
);

export const selectSummonError = state => state.summons.error;

// Selector for refinement history
export const selectRefinementHistory = (state) => state.summons.refinementHistory;

export default summonSlice.reducer; 