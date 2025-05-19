import { createSlice } from '@reduxjs/toolkit';
import { playerBaseConfig, playerLevelConfig, achievementConfig } from '@/config/playerConfig';

const initialState = {
  level: playerBaseConfig.initialLevel,
  experience: playerBaseConfig.initialExperience,
  maxSummons: playerBaseConfig.getMaxSummonsByLevel(playerBaseConfig.initialLevel),
  maxInventorySlots: playerBaseConfig.getMaxInventorySlotsByLevel(playerBaseConfig.initialLevel),
  // 玩家成就系统
  achievements: [],
  // 玩家统计数据
  statistics: {
    totalRefinements: 0,
    totalSkillBooks: 0,
    totalEquipmentObtained: 0
  }
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    // 增加经验值
    addExperience: (state, action) => {
      const experienceToAdd = action.payload;
      state.experience += experienceToAdd;
      
      // 检查是否可以升级
      while (state.level < playerBaseConfig.maxLevel) {
        const nextLevelExp = playerLevelConfig.getRequiredExperience(state.level + 1);
        if (state.experience >= nextLevelExp) {
          state.level += 1;
          // 更新等级相关的限制
          state.maxSummons = playerBaseConfig.getMaxSummonsByLevel(state.level);
          state.maxInventorySlots = playerBaseConfig.getMaxInventorySlotsByLevel(state.level);
        } else {
          break;
        }
      }
      
      // 如果超过最大等级，将经验值限制在最大等级所需经验值
      if (state.level >= playerBaseConfig.maxLevel) {
        const maxExp = playerLevelConfig.getRequiredExperience(playerBaseConfig.maxLevel);
        state.experience = Math.min(state.experience, maxExp);
      }
    },
    
    // 更新统计数据
    updateStatistics: (state, action) => {
      const { type, value } = action.payload;
      if (state.statistics.hasOwnProperty(type)) {
        state.statistics[type] += value;
      }
    },
    
    // 添加成就
    addAchievement: (state, action) => {
      const achievement = action.payload;
      if (!state.achievements.some(a => a.id === achievement.id)) {
        state.achievements.push(achievement);
      }
    },
    
    // 重置玩家状态（用于新游戏）
    resetPlayer: () => initialState
  }
});

export const { 
  addExperience, 
  updateStatistics, 
  addAchievement, 
  resetPlayer 
} = playerSlice.actions;

export default playerSlice.reducer; 