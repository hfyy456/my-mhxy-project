/**
 * React Hook for 面向对象召唤兽管理系统 - 简化版
 * 提供组件级别的召唤兽管理接口
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import summonManager from '@/store/SummonManager';

/**
 * 主要的召唤兽管理Hook
 * 提供所有召唤兽相关的状态和操作
 */
export const useSummonManager = () => {
  const [state, setState] = useState(() => summonManager.getState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 初始化状态
  useEffect(() => {
    // 设置初始状态
    setState(summonManager.getState());

    const handleStateChange = (newState) => {
      setState(newState);
    };

    const handleError = (errorData) => {
      setError(errorData);
    };

    const handleLoading = (loadingState) => {
      setIsLoading(loadingState.isLoading);
    };

    const handleSummonEvent = (eventData) => {
      console.log('[useSummonManager] 召唤兽事件:', eventData);
      // 强制更新状态
      setState(summonManager.getState());
    };

    // 监听事件
    summonManager.on('state_changed', handleStateChange);
    summonManager.on('error', handleError);
    summonManager.on('loading', handleLoading);
    summonManager.on('summon_level_up', handleSummonEvent);
    summonManager.on('summon_points_allocated', handleSummonEvent);
    summonManager.on('summon_points_reset', handleSummonEvent);
    summonManager.on('summon_skill_learned', handleSummonEvent);
    summonManager.on('summon_skill_forgotten', handleSummonEvent);
    summonManager.on('summon_skill_replaced', handleSummonEvent);
    summonManager.on('summon_item_equipped', handleSummonEvent);
    summonManager.on('summon_item_unequipped', handleSummonEvent);
    summonManager.on('summon_nickname_changed', handleSummonEvent);
    summonManager.on('summon_attributes_updated', handleSummonEvent);

    return () => {
      summonManager.off('state_changed', handleStateChange);
      summonManager.off('error', handleError);
      summonManager.off('loading', handleLoading);
      summonManager.off('summon_level_up', handleSummonEvent);
      summonManager.off('summon_points_allocated', handleSummonEvent);
      summonManager.off('summon_points_reset', handleSummonEvent);
      summonManager.off('summon_skill_learned', handleSummonEvent);
      summonManager.off('summon_skill_forgotten', handleSummonEvent);
      summonManager.off('summon_skill_replaced', handleSummonEvent);
      summonManager.off('summon_item_equipped', handleSummonEvent);
      summonManager.off('summon_item_unequipped', handleSummonEvent);
      summonManager.off('summon_nickname_changed', handleSummonEvent);
      summonManager.off('summon_attributes_updated', handleSummonEvent);
    };
  }, []);

  // 操作方法
  const operations = useMemo(() => ({
    // 升级召唤兽
    levelUpSummon: (summonId, experienceAmount = 1) => {
      try {
        setIsLoading(true);
        const summon = summonManager.getSummonById(summonId);
        if (!summon) {
          setError({ message: '找不到指定的召唤兽', details: `ID: ${summonId}` });
          return false;
        }
        
        const result = summon.gainExperience(experienceAmount);
        // 强制更新状态
        setState(summonManager.getState());
        return result;
      } catch (error) {
        setError({
          message: '升级失败',
          details: error.message
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },

    // 分配属性点
    allocatePoints: (summonId, attributeName, amount) => {
      try {
        setIsLoading(true);
        const summon = summonManager.getSummonById(summonId);
        if (!summon) {
          setError({ message: '找不到指定的召唤兽', details: `ID: ${summonId}` });
          return false;
        }
        
        const result = summon.allocatePoints(attributeName, amount);
        // 强制更新状态
        setState(summonManager.getState());
        return result;
      } catch (error) {
        setError({
          message: '分配属性点失败',
          details: error.message
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },

    // 重置属性点
    resetPoints: (summonId) => {
      try {
        setIsLoading(true);
        const summon = summonManager.getSummonById(summonId);
        if (!summon) {
          setError({ message: '找不到指定的召唤兽', details: `ID: ${summonId}` });
          return false;
        }
        
        const result = summon.resetAllocatedPoints();
        // 强制更新状态
        setState(summonManager.getState());
        return result;
      } catch (error) {
        setError({
          message: '重置属性点失败',
          details: error.message
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },

    // 学习技能
    learnSkill: (summonId, skillId, replaceIndex = -1) => {
      try {
        setIsLoading(true);
        const summon = summonManager.getSummonById(summonId);
        if (!summon) {
          setError({ message: '找不到指定的召唤兽', details: `ID: ${summonId}` });
          return false;
        }
        
        const result = summon.learnSkill(skillId, replaceIndex);
        // 强制更新状态
        setState(summonManager.getState());
        return result;
      } catch (error) {
        setError({
          message: '学习技能失败',
          details: error.message
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },

    // 遗忘技能
    forgetSkill: (summonId, skillId) => {
      try {
        setIsLoading(true);
        const summon = summonManager.getSummonById(summonId);
        if (!summon) {
          setError({ message: '找不到指定的召唤兽', details: `ID: ${summonId}` });
          return false;
        }
        
        const result = summon.forgetSkill(skillId);
        // 强制更新状态
        setState(summonManager.getState());
        return result;
      } catch (error) {
        setError({
          message: '遗忘技能失败',
          details: error.message
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },

    // 获取/设置昵称
    changeSummonNickname: (summonId, nickname) => {
      try {
        const summon = summonManager.getSummonById(summonId);
        if (!summon) {
          setError({ message: '找不到指定的召唤兽', details: `ID: ${summonId}` });
          return false;
        }
        
        summon.setNickname(nickname);
        // 强制更新状态
        setState(summonManager.getState());
        return true;
      } catch (error) {
        setError({
          message: '更改昵称失败',
          details: error.message
        });
        return false;
      }
    },

    // 创建召唤兽
    createSummon: (config) => {
      try {
        setIsLoading(true);
        const result = summonManager.addSummon(config);
        // 强制更新状态
        setState(summonManager.getState());
        return result;
      } catch (error) {
        setError({
          message: '创建召唤兽失败',
          details: error.message
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },

    // 注册已有的召唤兽实例
    registerSummon: (summonInstance) => {
      try {
        setIsLoading(true);
        const result = summonManager.registerSummon(summonInstance);
        // 强制更新状态
        setState(summonManager.getState());
        return result;
      } catch (error) {
        setError({
          message: '注册召唤兽失败',
          details: error.message
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },

    // 删除召唤兽
    deleteSummon: (summonId) => {
      try {
        setIsLoading(true);
        const result = summonManager.releaseSummon(summonId);
        // 强制更新状态
        setState(summonManager.getState());
        return result;
      } catch (error) {
        setError({
          message: '删除召唤兽失败',
          details: error.message
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },

    // 复制召唤兽
    cloneSummon: (summonId) => {
      try {
        setIsLoading(true);
        const result = summonManager.cloneSummon(summonId);
        // 强制更新状态
        setState(summonManager.getState());
        return result;
      } catch (error) {
        setError({
          message: '复制召唤兽失败',
          details: error.message
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },

    // 批量操作
    bulkRelease: (summonIds) => {
      try {
        setIsLoading(true);
        const result = summonManager.bulkRelease(summonIds);
        // 强制更新状态
        setState(summonManager.getState());
        return result;
      } catch (error) {
        setError({
          message: '批量释放失败',
          details: error.message
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },

    // 重新计算所有召唤兽属性
    recalculateAllStats: () => {
      try {
        setIsLoading(true);
        summonManager.recalculateAllStats();
        // 强制更新状态
        setState(summonManager.getState());
        return true;
      } catch (error) {
        setError({
          message: '重新计算属性失败',
          details: error.message
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },

    // 获取召唤兽实例
    getSummonById: (summonId) => {
      return summonManager.getSummonById(summonId);
    },

    // 设置当前召唤兽
    setCurrentSummon: (summonId) => {
      try {
        const result = summonManager.setCurrentSummon(summonId);
        // 强制更新状态
        setState(summonManager.getState());
        return result;
      } catch (error) {
        setError({
          message: '设置当前召唤兽失败',
          details: error.message
        });
        return false;
      }
    },

    // 清除错误
    clearError: () => {
      setError(null);
    }
  }), [summonManager]);

  const currentSummonFullData = useMemo(() => {
    if (!state.currentSummonId || !state.allSummons) {
      return null;
    }
    return state.allSummons[state.currentSummonId] || null;
  }, [state.currentSummonId, state.allSummons]);

  return {
    // 状态
    ...state,
    isLoading,
    error,
    currentSummonFullData,
    
    // 操作
    ...operations,
    
    // 直接访问管理器实例 (高级用法)
    manager: summonManager
  };
};

/**
 * 当前召唤兽Hook - 只关注当前选中的召唤兽
 */
export const useCurrentSummon = () => {
  const { currentSummonId, currentSummonFullData, setCurrentSummon } = useSummonManager();
  
  return {
    summon: currentSummonFullData,
    summonId: currentSummonId,
    setSummon: setCurrentSummon,
    isSelected: Boolean(currentSummonId)
  };
};

/**
 * 召唤兽列表Hook - 提供召唤兽列表相关功能
 */
export const useSummonList = (filters = {}) => {
  const { allSummons, summonCount, maxSummons, availableSlots } = useSummonManager();
  
  const filteredSummons = useMemo(() => {
    let summons = Object.values(allSummons);
    
    // 应用过滤器
    if (filters.quality) {
      summons = summons.filter(summon => summon.quality === filters.quality);
    }
    
    if (filters.minLevel) {
      summons = summons.filter(summon => summon.level >= filters.minLevel);
    }
    
    if (filters.maxLevel) {
      summons = summons.filter(summon => summon.level <= filters.maxLevel);
    }
    
    if (filters.hasSkill) {
      summons = summons.filter(summon => 
        summon.skillSet.includes(filters.hasSkill)
      );
    }
    
    // 排序
    if (filters.sortBy) {
      summons.sort((a, b) => {
        switch (filters.sortBy) {
          case 'level':
            return filters.sortOrder === 'desc' ? b.level - a.level : a.level - b.level;
          case 'power':
            return filters.sortOrder === 'desc' ? b.power - a.power : a.power - b.power;
          case 'name':
            return filters.sortOrder === 'desc' 
              ? (b.nickname || b.id).localeCompare(a.nickname || a.id)
              : (a.nickname || a.id).localeCompare(b.nickname || b.id);
          case 'createdAt':
            return filters.sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
          default:
            return 0;
        }
      });
    }
    
    return summons;
  }, [allSummons, filters]);
  
  return {
    summons: filteredSummons,
    totalCount: summonCount,
    filteredCount: filteredSummons.length,
    maxSummons,
    availableSlots,
    isFull: summonCount >= maxSummons
  };
};

/**
 * 特定召唤兽Hook - 监听特定召唤兽的变化
 */
export const useSummon = (summonId) => {
  const { allSummons, getSummonById } = useSummonManager();
  
  const summon = useMemo(() => {
    return summonId ? allSummons[summonId] : null;
  }, [allSummons, summonId]);
  
  const summonInstance = useMemo(() => {
    return summonId ? getSummonById(summonId) : null;
  }, [summonId, getSummonById]);
  
  return {
    summon,
    summonInstance,
    exists: Boolean(summon),
    isLoaded: Boolean(summonInstance)
  };
};

/**
 * 召唤兽统计Hook - 提供统计信息
 */
export const useSummonStats = () => {
  const { allSummons } = useSummonManager();
  
  const stats = useMemo(() => {
    const summons = Object.values(allSummons);
    
    return {
      total: summons.length,
      byQuality: summons.reduce((acc, summon) => {
        acc[summon.quality] = (acc[summon.quality] || 0) + 1;
        return acc;
      }, {}),
      averageLevel: summons.length > 0 
        ? summons.reduce((sum, summon) => sum + summon.level, 0) / summons.length 
        : 0,
      totalPower: summons.reduce((sum, summon) => sum + (summon.power || 0), 0),
      averagePower: summons.length > 0 
        ? summons.reduce((sum, summon) => sum + (summon.power || 0), 0) / summons.length 
        : 0,
      levelDistribution: summons.reduce((acc, summon) => {
        const levelRange = Math.floor(summon.level / 10) * 10;
        const key = `${levelRange}-${levelRange + 9}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    };
  }, [allSummons]);
  
  return stats;
};

/**
 * 召唤兽操作Hook - 提供批量操作功能
 */
export const useSummonOperations = () => {
  const { 
    addSummon, 
    removeSummon, 
    releaseSummon,
    recalculateSummonStats,
    getAllSummons 
  } = useSummonManager();
  
  const operations = useMemo(() => ({
    // 批量操作
    batchRelease: async (summonIds) => {
      const results = [];
      for (const summonId of summonIds) {
        const result = releaseSummon(summonId);
        results.push({ summonId, success: result });
      }
      return results;
    },
    
    batchRecalculate: async (summonIds = null) => {
      const targetIds = summonIds || getAllSummons().map(s => s.id);
      const results = [];
      
      for (const summonId of targetIds) {
        try {
          const result = await recalculateSummonStats(summonId);
          results.push({ summonId, success: result });
        } catch (error) {
          results.push({ summonId, success: false, error: error.message });
        }
      }
      
      return results;
    },
    
    // 创建召唤兽快捷方法
    createSummon: (summonSourceId, options = {}) => {
      const summonData = {
        summonSourceId,
        level: options.level || 1,
        quality: options.quality || 'normal',
        nickname: options.nickname || '',
        basicAttributes: options.basicAttributes || {},
        ...options
      };
      
      return addSummon(summonData);
    },
    
    // 复制召唤兽（用于测试或特殊功能）
    cloneSummon: (summonId, options = {}) => {
      const originalSummon = getAllSummons().find(s => s.id === summonId);
      if (!originalSummon) return null;
      
      const cloneData = {
        ...originalSummon.toJSON(),
        id: undefined, // 让系统自动生成新ID
        nickname: options.nickname || `${originalSummon.nickname || originalSummon.id} 副本`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...options
      };
      
      return addSummon(cloneData);
    }
  }), [addSummon, removeSummon, releaseSummon, recalculateSummonStats, getAllSummons]);
  
  return operations;
};

// 默认导出主Hook
export default useSummonManager;

// 导出summonManager单例实例供其他模块使用
export { summonManager as summonManagerInstance }; 