import { createSlice } from '@reduxjs/toolkit';
import { eggConfig, eggQualityConfig } from '@/config/pet/eggConfig';
import { petConfig } from '@/config/pet/petConfig';
import { playerBaseConfig } from '@/config/character/playerConfig';

const initialState = {
  incubatingEggs: {}, // Map<eggId, {eggType, startTime, remainingTime, quality, progress}>
  completedEggs: {}, // 存储已孵化完成但未取出的蛋
};

const incubatorSlice = createSlice({
  name: 'incubator',
  initialState,
  reducers: {
    startIncubation: (state, action) => {
      const { eggId, eggType } = action.payload;
      
      // 生成蛋的品质
      const totalWeight = eggQualityConfig.weight.reduce((sum, weight) => sum + weight, 0);
      let random = Math.random() * totalWeight;
      let quality = eggQualityConfig.names[0];
      
      for (let i = 0; i < eggQualityConfig.names.length; i++) {
        random -= eggQualityConfig.weight[i];
        if (random <= 0) {
          quality = eggQualityConfig.names[i];
          break;
        }
      }

      // 直接使用基础孵化时间（秒）
      const totalHatchTime = eggConfig[eggType].baseHatchTime;

      state.incubatingEggs[eggId] = {
        eggType,
        startTime: Date.now(),
        remainingTime: totalHatchTime,
        quality,
        progress: 0,
        isComplete: false,
      };
    },

    updateIncubationProgress: (state) => {
      const currentTime = Date.now();
      Object.entries(state.incubatingEggs).forEach(([eggId, egg]) => {
        // 计算已经过去的时间（秒）
        const elapsed = Math.floor((currentTime - egg.startTime) / 1000);
        // 计算剩余时间（秒）
        const remainingTime = Math.max(0, egg.remainingTime - elapsed);
        // 计算进度百分比
        const progress = ((egg.remainingTime - remainingTime) / egg.remainingTime) * 100;

        // 更新蛋的状态
        egg.progress = Math.min(100, progress);
        egg.remainingTime = remainingTime;
        egg.isComplete = remainingTime <= 0;

        if (egg.isComplete) {
          // 将完成的蛋移动到completedEggs中
          state.completedEggs[eggId] = {
            eggType: egg.eggType,
            quality: egg.quality,
            completedAt: currentTime
          };
          delete state.incubatingEggs[eggId];
        }
      });
    },

    completeIncubation: (state, action) => {
      const { eggId, playerLevel, currentSummonCount } = action.payload;
      const egg = state.completedEggs[eggId];

      if (!egg) {
        action.payload.error = "找不到已完成的蛋";
        return;
      }

      // 检查召唤兽数量限制
      const maxSummons = playerBaseConfig.getMaxSummonsByLevel(playerLevel);
      if (currentSummonCount >= maxSummons) {
        action.payload.error = `当前召唤兽数量已达上限(${maxSummons}个)，无法取出新的召唤兽`;
        return;
      }

      // 生成召唤兽品质
      const qualityIndex = eggQualityConfig.names.indexOf(egg.quality);
      const qualities = eggQualityConfig.names;
      const chances = eggQualityConfig.petQualityChances[qualityIndex];
      
      let random = Math.random();
      let sum = 0;
      let petQuality = qualities[0];
      
      for (let i = 0; i < qualities.length; i++) {
        sum += chances[i];
        if (random < sum) {
          petQuality = qualities[i];
          break;
        }
      }

      // 随机选择一个可能的宠物
      const eggData = eggConfig[egg.eggType];
      const possiblePets = eggData.possiblePets;
      const randomPet = possiblePets[Math.floor(Math.random() * possiblePets.length)];

      // 从completedEggs中移除这个蛋
      delete state.completedEggs[eggId];

      // 返回孵化结果
      action.payload.result = {
        eggId,
        eggType: egg.eggType,
        eggQuality: egg.quality,
        petType: randomPet,
        petQuality: petQuality,
        petData: petConfig[randomPet],
      };
    },

    cancelIncubation: (state, action) => {
      const { eggId } = action.payload;
      if (state.incubatingEggs[eggId]) {
        delete state.incubatingEggs[eggId];
      }
    },

    setState: (state, action) => {
      // 完全替换状态
      return action.payload;
    },
  },
});

export const { 
  startIncubation, 
  updateIncubationProgress, 
  completeIncubation, 
  cancelIncubation,
  setState
} = incubatorSlice.actions;

export const selectIncubatingEggs = (state) => state.incubator.incubatingEggs;
export const selectCompletedEggs = (state) => state.incubator.completedEggs;

export default incubatorSlice.reducer; 