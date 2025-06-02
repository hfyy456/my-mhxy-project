/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-20 01:02:55
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-03 04:19:05
 */
import { createSlice, createSelector } from '@reduxjs/toolkit';
import { summonConfig } from '@/config/summon/summonConfig';

const initialState = {
  // 已解锁的召唤兽类型
  unlockedSummons: {},
  // 每种召唤兽的获得次数
  summonCounts: {},
  // 每种品质的召唤兽获得次数
  qualityCounts: {
    normal: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    mythic: 0
  },
  favoriteSummons: []
};

const summonCatalogSlice = createSlice({
  name: 'summonCatalog',
  initialState,
  reducers: {
    // 解锁新的召唤兽类型
    unlockSummon: (state, action) => {
      const { summonSourceId, quality } = action.payload;
      
      // 更新已解锁的召唤兽
      if (!state.unlockedSummons[summonSourceId]) {
        state.unlockedSummons[summonSourceId] = {
          firstUnlockTime: Date.now(),
          qualities: []
        };
      }
      
      // 添加新的品质记录
      if (!state.unlockedSummons[summonSourceId].qualities.includes(quality)) {
        state.unlockedSummons[summonSourceId].qualities.push(quality);
      }

      // 更新召唤兽获得次数
      state.summonCounts[summonSourceId] = (state.summonCounts[summonSourceId] || 0) + 1;

      // 更新品质获得次数
      state.qualityCounts[quality] = (state.qualityCounts[quality] || 0) + 1;
    },

    // 重置图鉴（用于测试）
    resetCatalog: (state) => {
      return initialState;
    },

    setFavorite: (state, action) => {
      const { summonSourceId, isFavorite } = action.payload;
      if (isFavorite) {
        if (!state.favoriteSummons.includes(summonSourceId)) {
          state.favoriteSummons.push(summonSourceId);
        }
      } else {
        state.favoriteSummons = state.favoriteSummons.filter(id => id !== summonSourceId);
      }
    },

    setState: (state, action) => {
      // 完全替换状态
      return action.payload;
    }
  }
});

export const { 
  unlockSummon, 
  resetCatalog,
  setFavorite,
  setState
} = summonCatalogSlice.actions;

// 选择器
export const selectUnlockedSummons = (state) => state.summonCatalog.unlockedSummons;
export const selectSummonCounts = (state) => state.summonCatalog.summonCounts;
export const selectQualityCounts = (state) => state.summonCatalog.qualityCounts;

// 计算解锁进度 - Memoized
export const selectUnlockProgress = createSelector(
  [selectUnlockedSummons], // Depends on the unlockedSummons part of the state
  (unlockedSummonsMap) => {
    const totalSummons = Object.keys(summonConfig).length;
    const unlockedCount = Object.keys(unlockedSummonsMap).length;
    const percentage = totalSummons > 0 ? (unlockedCount / totalSummons) * 100 : 0;
    return {
      unlocked: unlockedCount,
      total: totalSummons,
      percentage: percentage
    };
  }
);

export default summonCatalogSlice.reducer; 