/**
 * 玩家信息管理Hook
 * 专为没有角色，只控制召唤兽的游戏设计
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addExperience, updateStatistics, addAchievement, resetPlayer } from '@/store/slices/playerSlice';
import { useSummonManager } from './useSummonManager';
import { useInventoryManager } from './useInventoryManager';
import { playerBaseConfig, playerLevelConfig, achievementConfig } from '@/config/character/playerConfig';

/**
 * 主要的玩家管理Hook
 */
export const usePlayerManager = () => {
  const dispatch = useDispatch();
  
  // Redux状态
  const playerState = useSelector(state => state.player);
  const { level, experience, maxSummons, maxInventorySlots, achievements, statistics } = playerState;
  
  // 关联的管理系统
  const { allSummons } = useSummonManager();
  const { gold, filledSlots } = useInventoryManager();
  
  // 本地状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 计算等级相关信息
  const levelInfo = useMemo(() => {
    const currentLevelExp = playerLevelConfig.getRequiredExperience(level);
    const nextLevelExp = playerLevelConfig.getRequiredExperience(level + 1);
    const expToNextLevel = nextLevelExp - experience;
    const expInCurrentLevel = experience - currentLevelExp;
    const expNeededForCurrentLevel = nextLevelExp - currentLevelExp;
    const progressPercentage = expNeededForCurrentLevel > 0 
      ? (expInCurrentLevel / expNeededForCurrentLevel) * 100 
      : 100;

    return {
      currentLevel: level,
      currentExp: experience,
      expToNextLevel: level >= playerBaseConfig.maxLevel ? 0 : expToNextLevel,
      progressPercentage: Math.min(progressPercentage, 100),
      isMaxLevel: level >= playerBaseConfig.maxLevel,
      canLevelUp: experience >= nextLevelExp && level < playerBaseConfig.maxLevel
    };
  }, [level, experience]);

  // 召唤兽统计
  const summonStats = useMemo(() => {
    const summonsArray = Object.values(allSummons || {});
    const totalSummons = summonsArray.length;
    const summonSlots = {
      used: totalSummons,
      max: maxSummons,
      available: maxSummons - totalSummons,
      percentage: maxSummons > 0 ? (totalSummons / maxSummons) * 100 : 0
    };

    // 按品质统计
    const qualityStats = summonsArray.reduce((acc, summon) => {
      acc[summon.quality] = (acc[summon.quality] || 0) + 1;
      return acc;
    }, {});

    // 等级分布
    const levelDistribution = summonsArray.reduce((acc, summon) => {
      const range = Math.floor(summon.level / 10) * 10;
      const key = `${range}-${range + 9}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // 总战力
    const totalPower = summonsArray.reduce((sum, summon) => {
      return sum + (summon.power || summon.level * 10); // 使用power或基于等级的估算
    }, 0);

    return {
      slots: summonSlots,
      total: totalSummons,
      qualityStats,
      levelDistribution,
      totalPower,
      averageLevel: totalSummons > 0 ? summonsArray.reduce((sum, s) => sum + s.level, 0) / totalSummons : 0,
      averagePower: totalSummons > 0 ? totalPower / totalSummons : 0,
      strongest: summonsArray.length > 0 ? summonsArray.reduce((max, s) => 
        (s.power || s.level * 10) > (max.power || max.level * 10) ? s : max
      ) : null
    };
  }, [allSummons, maxSummons]);

  // 背包统计
  const inventoryStats = useMemo(() => ({
    gold,
    slots: {
      used: filledSlots,
      max: maxInventorySlots,
      available: maxInventorySlots - filledSlots,
      percentage: maxInventorySlots > 0 ? (filledSlots / maxInventorySlots) * 100 : 0
    }
  }), [gold, filledSlots, maxInventorySlots]);

  // 成就系统
  const achievementSystem = useMemo(() => {
    const unlockedAchievements = achievements || [];
    const allAchievements = achievementConfig.list;
    const totalAchievements = allAchievements.length;
    const unlockedCount = unlockedAchievements.length;
    
    // 按类型分组
    const achievementsByType = allAchievements.reduce((acc, achievement) => {
      if (!acc[achievement.type]) acc[achievement.type] = [];
      acc[achievement.type].push(achievement);
      return acc;
    }, {});

    // 检查可解锁的成就
    const availableAchievements = allAchievements.filter(achievement => {
      const isUnlocked = unlockedAchievements.some(a => a.id === achievement.id);
      if (isUnlocked) return false;

      // 检查解锁条件
      switch (achievement.type) {
        case 'level':
          return level >= achievement.requirement;
        case 'refinement':
          return statistics.totalRefinements >= achievement.requirement;
        case 'skillBook':
          return statistics.totalSkillBooks >= achievement.requirement;
        case 'equipment':
          return statistics.totalEquipmentObtained >= achievement.requirement;
        default:
          return false;
      }
    });

    return {
      unlocked: unlockedAchievements,
      total: totalAchievements,
      unlockedCount,
      progress: totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0,
      byType: achievementsByType,
      available: availableAchievements
    };
  }, [achievements, level, statistics]);

  // 玩家操作
  const playerActions = useMemo(() => ({
    // 经验和等级
    gainExperience: (amount) => {
      try {
        dispatch(addExperience(amount));
        return true;
      } catch (error) {
        setError(`获得经验失败: ${error.message}`);
        return false;
      }
    },

    // 统计数据
    updateStats: (type, value) => {
      try {
        dispatch(updateStatistics({ type, value }));
        return true;
      } catch (error) {
        setError(`更新统计失败: ${error.message}`);
        return false;
      }
    },

    // 手动解锁成就
    unlockAchievement: (achievementId) => {
      try {
        const achievement = achievementConfig.list.find(a => a.id === achievementId);
        if (!achievement) {
          throw new Error('成就不存在');
        }
        
        const isAlreadyUnlocked = achievements.some(a => a.id === achievementId);
        if (isAlreadyUnlocked) {
          throw new Error('成就已解锁');
        }
        
        dispatch(addAchievement(achievement));
        
        // 如果成就有经验奖励，自动获得
        if (achievement.reward?.experience) {
          dispatch(addExperience(achievement.reward.experience));
        }
        
        return true;
      } catch (error) {
        setError(`解锁成就失败: ${error.message}`);
        return false;
      }
    },

    // 重置玩家（新游戏）
    resetProgress: () => {
      try {
        dispatch(resetPlayer());
        return true;
      } catch (error) {
        setError(`重置失败: ${error.message}`);
        return false;
      }
    },

    // 清除错误
    clearError: () => setError(null)
  }), [dispatch, statistics, achievements]);

  // 玩家能力检查
  const playerCapabilities = useMemo(() => ({
    // 召唤兽相关
    canSummonMore: summonStats.slots.available > 0,
    maxSummons,
    
    // 背包相关
    hasInventorySpace: inventoryStats.slots.available > 0,
    maxInventorySlots,
    
    // 炼妖相关
    availableRefinementQualities: playerBaseConfig.getAvailableRefinementQualities(level),
    canRefineQuality: (quality) => playerBaseConfig.getAvailableRefinementQualities(level).includes(quality),
    
    // 技能书相关
    maxSkillBookLevel: playerBaseConfig.getMaxSkillBookLevel(level),
    canUseSkillBook: (bookLevel) => bookLevel <= playerBaseConfig.getMaxSkillBookLevel(level),
    
    // 等级检查
    canLevelUp: levelInfo.canLevelUp,
    isMaxLevel: levelInfo.isMaxLevel
  }), [level, summonStats.slots, inventoryStats.slots, levelInfo, maxSummons, maxInventorySlots]);

  // 游戏时间和活动统计
  const [gameTimeStats, setGameTimeStats] = useState({
    sessionStartTime: Date.now(),
    totalPlayTime: 0,
    lastLoginTime: Date.now()
  });

  return {
    // 基础状态
    level,
    experience,
    statistics,
    achievements,
    isLoading,
    error,
    
    // 计算属性
    levelInfo,
    summonStats,
    inventoryStats,
    achievementSystem,
    playerCapabilities,
    gameTimeStats,
    
    // 操作方法
    ...playerActions
  };
};

/**
 * 玩家成就Hook - 专门处理成就系统
 */
export const usePlayerAchievements = () => {
  const { achievementSystem, unlockAchievement, error, clearError } = usePlayerManager();
  
  return {
    ...achievementSystem,
    unlockAchievement,
    error,
    clearError
  };
};

/**
 * 玩家统计Hook - 专门处理统计数据
 */
export const usePlayerStatistics = () => {
  const { statistics, updateStats, summonStats, inventoryStats, gameTimeStats } = usePlayerManager();
  
  const formatTime = useCallback((milliseconds) => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    return `${hours}小时${minutes}分钟`;
  }, []);
  
  const getStatDisplayName = useCallback((statType) => {
    const displayNames = {
      totalRefinements: '炼妖次数',
      totalSkillBooks: '打书次数',
      totalEquipmentObtained: '装备获得'
    };
    return displayNames[statType] || statType;
  }, []);
  
  return {
    statistics,
    updateStats,
    summonStats,
    inventoryStats,
    gameTimeStats,
    formatTime,
    getStatDisplayName
  };
};

/**
 * 玩家等级Hook - 专门处理等级和经验
 */
export const usePlayerLevel = () => {
  const { level, experience, levelInfo, gainExperience, playerCapabilities } = usePlayerManager();
  
  return {
    level,
    experience,
    levelInfo,
    gainExperience,
    canLevelUp: playerCapabilities.canLevelUp,
    isMaxLevel: playerCapabilities.isMaxLevel
  };
};

/**
 * 玩家召唤兽管理Hook - 专门处理召唤兽相关的玩家限制
 */
export const usePlayerSummonManagement = () => {
  const { summonStats, playerCapabilities, maxSummons } = usePlayerManager();
  
  return {
    summonStats,
    maxSummons,
    canSummonMore: playerCapabilities.canSummonMore,
    availableSlots: summonStats.slots.available,
    usedSlots: summonStats.slots.used,
    slotsPercentage: summonStats.slots.percentage,
    totalPower: summonStats.totalPower,
    averageLevel: summonStats.averageLevel,
    strongestSummon: summonStats.strongest
  };
};

export default usePlayerManager; 