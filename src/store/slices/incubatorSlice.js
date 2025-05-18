import { createSlice } from '@reduxjs/toolkit';
import { eggConfig, eggQualityConfig } from '@/config/eggConfig';
import { petConfig } from '@/config/petConfig';

const initialState = {
  incubatingEggs: {}, // Map<eggId, {eggType, startTime, remainingTime, quality, progress}>
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

      // 计算孵化时间
      const baseHatchTime = eggConfig[eggType].baseHatchTime;
      const qualityIndex = eggQualityConfig.names.indexOf(quality);
      const timeMultiplier = eggQualityConfig.timeMultiplier[qualityIndex];
      const totalHatchTime = Math.floor(baseHatchTime * timeMultiplier);

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
      const now = Date.now();
      Object.entries(state.incubatingEggs).forEach(([eggId, egg]) => {
        if (!egg.isComplete) {
          const elapsed = (now - egg.startTime) / 1000; // 转换为秒
          const remainingTime = Math.max(0, egg.remainingTime - elapsed);
          const progress = ((egg.remainingTime - remainingTime) / egg.remainingTime) * 100;
          
          state.incubatingEggs[eggId] = {
            ...egg,
            progress: Math.min(100, progress),
            remainingTime: Math.max(0, remainingTime),
            isComplete: remainingTime <= 0,
          };
        }
      });
    },

    completeIncubation: (state, action) => {
      const { eggId } = action.payload;
      const egg = state.incubatingEggs[eggId];
      
      if (egg && egg.isComplete) {
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

        // 从培养皿中移除这个蛋
        delete state.incubatingEggs[eggId];

        // 返回孵化结果（通过action.payload传递给组件）
        action.payload.result = {
          eggId,
          eggType: egg.eggType,
          eggQuality: egg.quality,
          petType: randomPet,
          petQuality: petQuality,
          petData: petConfig[randomPet],
        };
      }
    },

    cancelIncubation: (state, action) => {
      const { eggId } = action.payload;
      if (state.incubatingEggs[eggId]) {
        delete state.incubatingEggs[eggId];
      }
    },
  },
});

export const { 
  startIncubation, 
  updateIncubationProgress, 
  completeIncubation, 
  cancelIncubation 
} = incubatorSlice.actions;

export const selectIncubatingEggs = (state) => {
  const eggs = [];
  if (!state?.incubator?.incubatingEggs) {
    return [];
  }
  Object.entries(state.incubator.incubatingEggs).forEach(([eggId, egg]) => {
    eggs.push({
      eggId,
      ...egg,
      eggData: eggConfig[egg.eggType],
    });
  });
  return eggs;
};

export default incubatorSlice.reducer; 