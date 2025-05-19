import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
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
import { getRaceBonus } from '@/config/raceConfig'; // 引入种族加成函数
import { SKILL_MODES } from "@/config/enumConfig";
import { setItemStatus } from './itemSlice';
import { playerBaseConfig } from '@/config/playerConfig';
import { calculateDerivedAttributes, getExperienceForLevel } from '@/utils/summonUtils';

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

      // 检查玩家等级限制
      const currentSummonCount = Object.keys(state.allSummons).length;
      const maxSummons = playerBaseConfig.getMaxSummonsByLevel(state.playerLevel);
      
      if (currentSummonCount >= maxSummons) {
        state.error = `无法添加更多召唤兽，当前等级(${state.playerLevel})最多可拥有${maxSummons}个召唤兽`;
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
        summon.equippedItemIds[slotType] = itemId;
      }
    },

    unequipItemFromSummon: (state, action) => {
      const { summonId, itemId, slotType } = action.payload;
      const summon = state.allSummons[summonId];
      if (summon && summon.equippedItemIds && summon.equippedItemIds[slotType] === itemId) {
        summon.equippedItemIds[slotType] = null;
      } else {
        console.warn(`[summonSlice] Failed to unequip item ${itemId} from slot ${slotType} for summon ${summonId}. Slot or item mismatch.`);
      }
    },
    
    learnSkill: (state, action) => {
      const { summonId, skillName, slotIndex } = action.payload;
      const summon = state.allSummons[summonId];
      if (!summon || !skillName || slotIndex < 0 || slotIndex >= MAX_SKILLS) return;
      if (!Array.isArray(summon.skillSet)) summon.skillSet = [];
      while(summon.skillSet.length < MAX_SKILLS) summon.skillSet.push(null); 
      const skillDetails = skillConfig.find(s => s.name === skillName);
      if (summon.skillSet.filter(s => s !== null).length >= ACTIVE_SKILL_LIMIT && skillDetails?.mode === SKILL_MODES.ACTIVE && !summon.skillSet[slotIndex]) {
        console.warn("Cannot learn more active skills.");
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(setCurrentSummon.fulfilled, (state, action) => {
        // The main logic for setting currentSummonId is done by dispatching setCurrentSummonAction within the thunk.
        // Here, we mostly handle the final state after recalculateSummonStats (also part of setCurrentSummon thunk) is done.
        // The recalculateSummonStats.fulfilled reducer will primarily update currentSummonFullData.
        console.log("setCurrentSummon thunk fulfilled, ID:", action.payload);
      })
      .addCase(recalculateSummonStats.fulfilled, (state, action) => {
        const { summonId, allCurrentlyEquippedItemsDataMap } = action.payload;
        if (state.allSummons[summonId]) {
          summonSlice.caseReducers._internalUpdateSummonCalculatedFields(state, summonId, allCurrentlyEquippedItemsDataMap);
          if (state.currentSummonId === summonId) {
            state.currentSummonFullData = {
              ...state.allSummons[summonId], // Get the latest version of the summon
              equippedItems: allCurrentlyEquippedItemsDataMap,
            };
          }
        }
      })
      .addCase(recalculateSummonStats.rejected, (state, action) => {
        console.error("recalculateSummonStats failed:", action.error.message);
        state.error = action.error.message;
      })
      .addCase('player/addExperience', (state, action) => {
        // 当玩家升级时，更新召唤兽数量限制
        const newLevel = action.payload.level;
        const maxSummons = playerBaseConfig.getMaxSummonsByLevel(newLevel);
        state.maxSummons = maxSummons;
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
  learnSkill,
  replaceSkill,
  addRefinementHistoryItem,
  resetSummonState,
  updateSummonNickname,
  releaseSummon
} = summonSlice.actions;

// Selectors
export const selectAllSummons = state => state.summons.allSummons;
export const selectCurrentSummonId = state => state.summons.currentSummonId;
export const selectSummonById = (state, summonId) => state.summons.allSummons[summonId]; // Basic selector

// Selector that hydrates with equipped item data
export const selectSummonByIdWithEquippedItems = (state, summonId) => {
  const summon = state.summons.allSummons[summonId];
  if (!summon) return null;

  const equippedItemsData = {};
  if (summon.equippedItemIds && state.items && state.items.allItems) {
    for (const slotType in summon.equippedItemIds) {
      const itemId = summon.equippedItemIds[slotType];
      if (itemId && state.items.allItems[itemId]) {
        equippedItemsData[slotType] = state.items.allItems[itemId];
      } else {
        equippedItemsData[slotType] = null;
      }
    }
  }
  return { ...summon, equippedItemsData }; // Return a new object with the hydrated data
};

export const selectCurrentSummonFullData = state => {
  const currentSummonId = state.summons.currentSummonId;
  if (!currentSummonId) return null;

  const summon = state.summons.allSummons[currentSummonId];
  if (!summon) return null;

  // 获取装备数据
  const equippedItems = selectEquippedItemsForSummon(state, currentSummonId);

  return {
    ...summon,
    equippedItems,
  };
};

export const selectEquippedItemsForSummon = (state, summonId) => {
    const summon = state.summons.allSummons[summonId];
    if (!summon || !summon.equippedItemIds || !state.items || !state.items.allItems) return {};
    
    const equippedItemsData = {};
    for (const slotType in summon.equippedItemIds) {
        const itemId = summon.equippedItemIds[slotType];
        if (itemId && state.items.allItems[itemId]) {
            equippedItemsData[slotType] = state.items.allItems[itemId];
        } else {
            // It's important to represent the slot, even if empty
            if (STANDARD_EQUIPMENT_SLOTS.includes(slotType)) {
                 equippedItemsData[slotType] = null;
            }
        }
    }
    // Ensure all standard slots are present in the returned object
    STANDARD_EQUIPMENT_SLOTS.forEach(slot => {
        if (!equippedItemsData.hasOwnProperty(slot)) {
            equippedItemsData[slot] = null;
        }
    });
    return equippedItemsData;
};

export const selectSummonError = state => state.summons.error;

// Selector for refinement history
export const selectRefinementHistory = (state) => state.summons.refinementHistory;

export default summonSlice.reducer; 