/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-01 05:48:30
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-01 05:48:30
 * @FilePath: \my-mhxy-project\src\store\slices\towerSlice.js
 * @Description: 封妖塔状态管理
 */

import { createSlice } from '@reduxjs/toolkit';
import { TOWER_MAX_FLOOR, prepareTowerBattleData } from '@/config/system/towerConfig';

// 初始状态
const initialState = {
  // 封妖塔进度数据
  progress: {
    highestFloor: 0, // 已通关的最高层数
    currentFloor: 1, // 当前选择的层数
    dailyAttempts: 3, // 每日挑战次数
    dailyAttemptsUsed: 0, // 已使用的挑战次数
    collectedRewards: [], // 已领取的奖励层数
    dailyRewardClaimed: false, // 是否已领取每日奖励
    lastResetDate: null, // 上次重置日期
  },
  // 当前战斗数据
  currentBattle: null,
  // 加载状态
  loading: false,
  // 错误信息
  error: null
};

// 创建封妖塔Slice
const towerSlice = createSlice({
  name: 'tower',
  initialState,
  reducers: {
    // 设置加载状态
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    // 设置错误信息
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    // 更新封妖塔进度
    updateTowerProgress: (state, action) => {
      state.progress = {
        ...state.progress,
        ...action.payload
      };
    },
    
    // 设置当前选择的楼层
    setCurrentFloor: (state, action) => {
      state.progress.currentFloor = action.payload;
    },
    
    // 记录战斗胜利，更新最高层数
    recordTowerVictory: (state, action) => {
      const { floor } = action.payload;
      
      // 如果战胜的层数高于当前记录，更新最高层数
      if (floor > state.progress.highestFloor) {
        state.progress.highestFloor = floor;
      }
      
      // 增加已使用的挑战次数
      state.progress.dailyAttemptsUsed += 1;
      
      // 清空当前战斗数据
      state.currentBattle = null;
    },
    
    // 记录战斗失败
    recordTowerDefeat: (state) => {
      // 增加已使用的挑战次数
      state.progress.dailyAttemptsUsed += 1;
      
      // 清空当前战斗数据
      state.currentBattle = null;
    },
    
    // 领取楼层奖励
    claimFloorReward: (state, action) => {
      const { floor } = action.payload;
      
      // 检查是否已领取
      if (!state.progress.collectedRewards.includes(floor)) {
        state.progress.collectedRewards.push(floor);
      }
    },
    
    // 领取每日奖励
    claimDailyReward: (state) => {
      state.progress.dailyRewardClaimed = true;
    },
    
    // 重置每日数据（每日挑战次数、每日奖励状态）
    resetDailyData: (state) => {
      state.progress.dailyAttemptsUsed = 0;
      state.progress.dailyRewardClaimed = false;
      state.progress.lastResetDate = new Date().toISOString().split('T')[0]; // 当前日期，格式：YYYY-MM-DD
    },
    
    // 准备封妖塔战斗
    prepareTowerBattle: (state, action) => {
      const { floor, formation } = action.payload;
      
      // 创建战斗数据
      const battleData = prepareTowerBattleData(
        floor, 
        formation.summons, 
        formation.formation?.grid || []
      );
      
      // 保存当前战斗数据
      state.currentBattle = {
        floor,
        formationId: formation.formationId,
        battleData
      };
    },
    
    // 清空当前战斗数据
    clearCurrentBattle: (state) => {
      state.currentBattle = null;
    }
  }
});

// 导出Actions
export const {
  setLoading,
  setError,
  updateTowerProgress,
  setCurrentFloor,
  recordTowerVictory,
  recordTowerDefeat,
  claimFloorReward,
  claimDailyReward,
  resetDailyData,
  prepareTowerBattle,
  clearCurrentBattle
} = towerSlice.actions;

// 选择器
export const selectTowerProgress = (state) => state.tower.progress;
export const selectCurrentFloor = (state) => state.tower.progress.currentFloor;
export const selectHighestFloor = (state) => state.tower.progress.highestFloor;
export const selectDailyAttemptsRemaining = (state) => 
  state.tower.progress.dailyAttempts - state.tower.progress.dailyAttemptsUsed;
export const selectCurrentBattle = (state) => state.tower.currentBattle;
export const selectTowerLoading = (state) => state.tower.loading;
export const selectTowerError = (state) => state.tower.error;

// 导出Reducer
export default towerSlice.reducer;

// 异步Action创建器
export const checkAndResetDailyData = () => (dispatch, getState) => {
  const { lastResetDate } = getState().tower.progress;
  const today = new Date().toISOString().split('T')[0]; // 当前日期，格式：YYYY-MM-DD
  
  // 如果上次重置日期不是今天，则重置每日数据
  if (lastResetDate !== today) {
    dispatch(resetDailyData());
  }
};

export const startTowerBattle = (payload) => (dispatch) => {
  const { floor, formation } = payload;
  
  // 设置加载状态
  dispatch(setLoading(true));
  
  try {
    // 准备战斗数据
    dispatch(prepareTowerBattle({ floor, formation }));
    
    // 模拟异步操作（实际项目中可能需要与服务器交互）
    setTimeout(() => {
      // 完成加载
      dispatch(setLoading(false));
    }, 500);
  } catch (error) {
    // 处理错误
    dispatch(setError(error.message));
    dispatch(setLoading(false));
  }
};

export const claimTowerReward = (payload) => (dispatch, getState) => {
  const { floor } = payload;
  const { highestFloor, collectedRewards } = getState().tower.progress;
  
  // 检查是否可以领取奖励
  if (floor <= highestFloor && !collectedRewards.includes(floor)) {
    // 领取奖励
    dispatch(claimFloorReward({ floor }));
    return true;
  }
  
  return false;
};
