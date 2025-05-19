/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-20 01:02:55
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-20 01:03:45
 */
import { createSlice } from '@reduxjs/toolkit';
import { petConfig } from '@/config/petConfig';

const initialState = {
  // 已解锁的召唤兽类型
  unlockedPets: {},
  // 每种召唤兽的获得次数
  petCounts: {},
  // 每种品质的召唤兽获得次数
  qualityCounts: {
    normal: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    mythic: 0
  }
};

const petCatalogSlice = createSlice({
  name: 'petCatalog',
  initialState,
  reducers: {
    // 解锁新的召唤兽类型
    unlockPet: (state, action) => {
      const { petId, quality } = action.payload;
      
      // 更新已解锁的召唤兽
      if (!state.unlockedPets[petId]) {
        state.unlockedPets[petId] = {
          firstUnlockTime: Date.now(),
          qualities: []
        };
      }
      
      // 添加新的品质记录
      if (!state.unlockedPets[petId].qualities.includes(quality)) {
        state.unlockedPets[petId].qualities.push(quality);
      }

      // 更新召唤兽获得次数
      state.petCounts[petId] = (state.petCounts[petId] || 0) + 1;

      // 更新品质获得次数
      state.qualityCounts[quality] = (state.qualityCounts[quality] || 0) + 1;
    },

    // 重置图鉴（用于测试）
    resetCatalog: (state) => {
      return initialState;
    }
  }
});

export const { unlockPet, resetCatalog } = petCatalogSlice.actions;

// 选择器
export const selectUnlockedPets = (state) => state.petCatalog.unlockedPets;
export const selectPetCounts = (state) => state.petCatalog.petCounts;
export const selectQualityCounts = (state) => state.petCatalog.qualityCounts;

// 计算解锁进度
export const selectUnlockProgress = (state) => {
  const totalPets = Object.keys(petConfig).length;
  const unlockedCount = Object.keys(state.petCatalog.unlockedPets).length;
  return {
    unlocked: unlockedCount,
    total: totalPets,
    percentage: (unlockedCount / totalPets) * 100
  };
};

export default petCatalogSlice.reducer; 