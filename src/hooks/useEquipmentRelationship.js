/**
 * 装备关系管理Hook
 * 提供统一的装备操作接口，简化组件的装备管理
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import equipmentRelationshipManager from '../store/EquipmentRelationshipManager';
import { useDispatch } from 'react-redux';

/**
 * 主要的装备关系管理Hook
 */
export const useEquipmentRelationship = () => {
  const [statistics, setStatistics] = useState(() => equipmentRelationshipManager.getStatistics());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  // 初始化状态
  useEffect(() => {
    // 设置初始统计数据
    setStatistics(equipmentRelationshipManager.getStatistics()); 
  }, []); // Empty dependency array ensures this runs once on mount

  // 监听装备关系变化
  useEffect(() => {
    const handleEquipmentChange = () => {
      setStatistics(equipmentRelationshipManager.getStatistics());
    };

    const handleError = (error) => {
      setError(error);
      console.error('[useEquipmentRelationship] 装备操作错误:', error);
    };

    // 注册事件监听器
    equipmentRelationshipManager.on('item_equipped', handleEquipmentChange);
    equipmentRelationshipManager.on('item_unequipped', handleEquipmentChange);
    equipmentRelationshipManager.on('data_imported', handleEquipmentChange);
    equipmentRelationshipManager.on('data_cleared', handleEquipmentChange);

    return () => {
      equipmentRelationshipManager.off('item_equipped', handleEquipmentChange);
      equipmentRelationshipManager.off('item_unequipped', handleEquipmentChange);
      equipmentRelationshipManager.off('data_imported', handleEquipmentChange);
      equipmentRelationshipManager.off('data_cleared', handleEquipmentChange);
    };
  }, []);

  // 装备操作
  const operations = useMemo(() => ({
    /**
     * 装备物品到召唤兽
     */
    equipItem: async (itemId, summonId /*, slotType - no longer needed here */) => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 调用 ERM 新的 equip 方法，它会处理 slotType
        const result = await equipmentRelationshipManager.equip(itemId, summonId);
        
        if (result.success) {
          const itemRelation = equipmentRelationshipManager.getItemEquipmentStatus(itemId);
          if (itemRelation) {
            dispatch({
              type: 'inventory/updateItemStatus',
              payload: { itemId, equipped: true, summonId, slotType: itemRelation.slotType }
            });
            
            dispatch({
              type: 'summon/updateEquipment',
              payload: { summonId, slotType: itemRelation.slotType, itemId }
            });
          }
        }
        
        return result; // 直接返回 ERM 的结果对象
      } catch (error) {
        console.error('[useEquipmentRelationship] equipItem error:', error);
        setError(error.message);
        return { success: false, message: error.message }; // 确保返回标准格式
      } finally {
        setIsLoading(false);
      }
    },

    /**
     * 卸下装备
     */
    unequipItem: async (itemId) => {
      try {
        setIsLoading(true);
        setError(null);
        
        const relation = equipmentRelationshipManager.getItemEquipmentStatus(itemId);
        if (!relation) {
          // throw new Error(`物品 ${itemId} 未被装备`); // ERM.unequip 会处理这种情况
          console.warn(`[useEquipmentRelationship] unequipItem: 物品 ${itemId} 在ERM中没有记录，可能已被卸载或从未装备。`);
          // setError(`物品 ${itemId} 未被装备或记录不一致`);
          // return false; // 如果ERM.unequip会返回false，这里可以依赖它
        }
        
        // 调用 ERM 新的 unequip 方法，需要提供 summonId
        // 如果 relation 为 null, relation.summonId 会出错，但 ERM.unequip 应该能处理 itemid 不存在的情况
        const currentSummonId = relation ? relation.summonId : null;
        if (!currentSummonId && relation) {
            // This case should ideally not happen if an item is in relation map but summonId is missing
             console.error(`[useEquipmentRelationship] Inconsistent state for item ${itemId}: has relation but no summonId.`);
             setError(`物品 ${itemId} 状态不一致。`);
             return false;
        }

        const success = await equipmentRelationshipManager.unequip(itemId, currentSummonId);
        
        if (success && relation) { // 仅当成功且之前有关联时才派发事件
          // 保留现有的Redux dispatch逻辑
          dispatch({
            type: 'inventory/updateItemStatus',
            payload: { itemId, equipped: false }
          });
          
          dispatch({
            type: 'summon/updateEquipment',
            payload: { summonId: relation.summonId, slotType: relation.slotType, itemId: null }
          });
        } else if (!success && relation) {
          // 可选：如果ERM.unequip返回false但之前有关联，可能意味着尝试从错误的召唤兽卸载等
           console.log(`[useEquipmentRelationship] unequipItem: ERM.unequip(${itemId}, ${currentSummonId}) failed.`);
        } else if (!relation) {
            // 如果一开始就没有 relation，ERM.unequip 应该也会返回 false 或处理
             console.log(`[useEquipmentRelationship] unequipItem: No prior relation for ${itemId}, ERM.unequip called.`);
        }
        
        return success;
      } catch (error) {
        setError(error.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },

    /**
     * 从特定槽位卸下装备
     */
    unequipFromSlot: async (summonId, slotType) => {
      try {
        setIsLoading(true);
        setError(null);
        
        const summonEquipment = equipmentRelationshipManager.getSummonEquipment(summonId);
        const itemId = summonEquipment[slotType];
        
        if (!itemId) {
          throw new Error(`召唤兽 ${summonId} 的 ${slotType} 槽位没有装备`);
        }
        
        return await operations.unequipItem(itemId);
      } catch (error) {
        setError(error.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },

    /**
     * 交换装备
     */
    swapEquipment: async (summonId1, summonId2, slotType) => {
      try {
        setIsLoading(true);
        setError(null);
        
        const success = equipmentRelationshipManager.swapEquipment(summonId1, summonId2, slotType);
        
        if (success) {
          // 触发相关系统更新
          dispatch({
            type: 'summon/batchUpdateEquipment',
            payload: [
              { summonId: summonId1 },
              { summonId: summonId2 }
            ]
          });
        }
        
        return success;
      } catch (error) {
        setError(error.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },

    /**
     * 移除召唤兽的所有装备
     */
    removeAllSummonEquipment: async (summonId) => {
      try {
        setIsLoading(true);
        setError(null);
        
        const removedItems = equipmentRelationshipManager.removeAllSummonEquipment(summonId);
        
        if (removedItems.length > 0) {
          // 批量更新背包物品状态
          dispatch({
            type: 'inventory/batchUpdateItemStatus',
            payload: removedItems.map(itemId => ({ itemId, equipped: false }))
          });
          
          // 更新召唤兽装备显示
          dispatch({
            type: 'summon/clearAllEquipment',
            payload: { summonId }
          });
        }
        
        return removedItems;
      } catch (error) {
        setError(error.message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },

    /**
     * 验证数据一致性
     */
    validateConsistency: () => {
      return equipmentRelationshipManager.validateConsistency();
    },

    /**
     * 修复数据不一致性
     */
    repairConsistency: () => {
      return equipmentRelationshipManager.repairConsistency();
    },

    /**
     * 清除错误
     */
    clearError: () => {
      setError(null);
    }
  }), [dispatch]);

  // 查询方法
  const queries = useMemo(() => ({
    /**
     * 获取物品的装备状态
     */
    getItemEquipmentStatus: (itemId) => {
      return equipmentRelationshipManager.getItemEquipmentStatus(itemId);
    },

    /**
     * 获取召唤兽的所有装备
     */
    getSummonEquipment: (summonId) => {
      return equipmentRelationshipManager.getSummonEquipment(summonId);
    },

    /**
     * 检查物品是否被装备
     */
    isItemEquipped: (itemId) => {
      return equipmentRelationshipManager.isItemEquipped(itemId);
    },

    /**
     * 检查召唤兽槽位是否有装备
     */
    isSlotEquipped: (summonId, slotType) => {
      return equipmentRelationshipManager.isSlotEquipped(summonId, slotType);
    },

    /**
     * 获取召唤兽装备的所有物品ID
     */
    getSummonEquippedItems: (summonId) => {
      return equipmentRelationshipManager.getSummonEquippedItems(summonId);
    },

    /**
     * 获取所有装备关系
     */
    getAllEquipmentRelations: () => {
      return equipmentRelationshipManager.getAllEquipmentRelations();
    }
  }), []);

  return {
    // 状态
    statistics,
    isLoading,
    error,
    
    // 操作
    ...operations,
    
    // 查询
    ...queries,
    
    // 直接访问管理器实例 (高级用法)
    manager: equipmentRelationshipManager
  };
};

/**
 * 特定物品的装备状态Hook
 */
export const useItemEquipmentStatus = (itemId) => {
  const [status, setStatus] = useState(() => 
    equipmentRelationshipManager.getItemEquipmentStatus(itemId)
  );

  useEffect(() => {
    if (!itemId) {
      setStatus(null);
      return;
    }

    const updateStatus = () => {
      setStatus(equipmentRelationshipManager.getItemEquipmentStatus(itemId));
    };

    // 监听装备状态变化
    const handleEquipped = (data) => {
      if (data.itemId === itemId) {
        updateStatus();
      }
    };

    const handleUnequipped = (data) => {
      if (data.itemId === itemId) {
        updateStatus();
      }
    };

    equipmentRelationshipManager.on('item_equipped', handleEquipped);
    equipmentRelationshipManager.on('item_unequipped', handleUnequipped);

    // 初始化状态
    updateStatus();

    return () => {
      equipmentRelationshipManager.off('item_equipped', handleEquipped);
      equipmentRelationshipManager.off('item_unequipped', handleUnequipped);
    };
  }, [itemId]);

  return {
    isEquipped: Boolean(status),
    equipmentInfo: status,
    summonId: status?.summonId,
    slotType: status?.slotType,
    equippedAt: status?.equippedAt
  };
};

/**
 * 特定召唤兽的装备状态Hook
 */
export const useSummonEquipmentStatus = (summonId) => {
  const [equipment, setEquipment] = useState(() => 
    equipmentRelationshipManager.getSummonEquipment(summonId)
  );

  useEffect(() => {
    if (!summonId) {
      setEquipment({});
      return;
    }

    const updateEquipment = () => {
      setEquipment(equipmentRelationshipManager.getSummonEquipment(summonId));
    };

    // 监听相关装备变化
    const handleEquipmentChange = (data) => {
      if (data.summonId === summonId) {
        updateEquipment();
      }
    };

    equipmentRelationshipManager.on('item_equipped', handleEquipmentChange);
    equipmentRelationshipManager.on('item_unequipped', handleEquipmentChange);

    // 初始化状态
    updateEquipment();

    return () => {
      equipmentRelationshipManager.off('item_equipped', handleEquipmentChange);
      equipmentRelationshipManager.off('item_unequipped', handleEquipmentChange);
    };
  }, [summonId]);

  const equippedItemIds = useMemo(() => Object.values(equipment), [equipment]);
  const slotCount = useMemo(() => Object.keys(equipment).length, [equipment]);

  return {
    equipment,
    equippedItemIds,
    slotCount,
    isEmpty: slotCount === 0,
    getItemInSlot: (slotType) => equipment[slotType] || null,
    hasItemInSlot: (slotType) => Boolean(equipment[slotType])
  };
};

/**
 * 装备关系统计Hook
 */
export const useEquipmentStatistics = () => {
  const [statistics, setStatistics] = useState(() => 
    equipmentRelationshipManager.getStatistics()
  );

  useEffect(() => {
    const updateStatistics = () => {
      setStatistics(equipmentRelationshipManager.getStatistics());
    };

    equipmentRelationshipManager.on('item_equipped', updateStatistics);
    equipmentRelationshipManager.on('item_unequipped', updateStatistics);
    equipmentRelationshipManager.on('data_imported', updateStatistics);
    equipmentRelationshipManager.on('data_cleared', updateStatistics);

    return () => {
      equipmentRelationshipManager.off('item_equipped', updateStatistics);
      equipmentRelationshipManager.off('item_unequipped', updateStatistics);
      equipmentRelationshipManager.off('data_imported', updateStatistics);
      equipmentRelationshipManager.off('data_cleared', updateStatistics);
    };
  }, []);

  return statistics;
};

export default useEquipmentRelationship; 