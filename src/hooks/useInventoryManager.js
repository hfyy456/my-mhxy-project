/**
 * 面向对象背包管理的React Hooks
 * 支持与Redux并行运行，实现渐进式迁移
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import inventoryManager from '../store/InventoryManager';

// 基础背包状态Hook
export function useInventoryManager() {
  const [state, setState] = useState(inventoryManager.getState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 初始加载
    const loadInitialState = async () => {
      setIsLoading(true);
      try {
        await inventoryManager.loadFromElectronStore();
        setState(inventoryManager.getState());
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialState();

    // 监听状态变化
    const handleInventoryChange = (newState) => {
      console.log('[useInventoryManager] 状态更新:', newState);
      setState(newState);
    };

    const handleError = (errorData) => {
      setError(errorData.message);
    };

    const handleStateLoaded = (loadedState) => {
      setState(loadedState);
      setError(null);
    };

    const handleStateSaved = () => {
      // 可以在这里添加保存成功的提示
      setError(null);
    };

    // 处理物品添加事件 - 强制刷新状态
    const handleItemAdded = () => {
      console.log('[useInventoryManager] 物品添加，强制刷新状态');
      setState(inventoryManager.getState());
    };

    // 处理物品堆叠事件 - 强制刷新状态
    const handleItemStacked = () => {
      console.log('[useInventoryManager] 物品堆叠，强制刷新状态');
      setState(inventoryManager.getState());
    };

    // 注册事件监听器
    inventoryManager.on('inventory_changed', handleInventoryChange);
    inventoryManager.on('error', handleError);
    inventoryManager.on('state_loaded', handleStateLoaded);
    inventoryManager.on('state_saved', handleStateSaved);
    inventoryManager.on('item_added', handleItemAdded);
    inventoryManager.on('item_stacked', handleItemStacked);

    // 清理事件监听器
    return () => {
      inventoryManager.off('inventory_changed', handleInventoryChange);
      inventoryManager.off('error', handleError);
      inventoryManager.off('state_loaded', handleStateLoaded);
      inventoryManager.off('state_saved', handleStateSaved);
      inventoryManager.off('item_added', handleItemAdded);
      inventoryManager.off('item_stacked', handleItemStacked);
    };
  }, []);

  return {
    ...state,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}

// 背包操作Hook
export function useInventoryActions() {
  return useMemo(() => ({
    // 物品操作
    addItem: (itemData, targetSlot = null) => inventoryManager.addItem(itemData, targetSlot),
    removeItem: (slotIndex, quantity = null) => inventoryManager.removeItem(slotIndex, quantity),
    moveItem: (fromSlot, toSlot) => inventoryManager.moveItem(fromSlot, toSlot),
    useItem: (slotIndex, target = null) => inventoryManager.useItem(slotIndex, target),
    
    // 装备操作
    equipItem: (slotIndex, summonId) => inventoryManager.equipItem(slotIndex, summonId),
    unequipItem: (slotIndex) => inventoryManager.unequipItem(slotIndex),
    
    // 金币操作
    addGold: (amount) => inventoryManager.addGold(amount),
    removeGold: (amount) => inventoryManager.removeGold(amount),
    
    // 背包管理
    expandCapacity: (additionalSlots) => inventoryManager.expandCapacity(additionalSlots),
    sortInventory: (sortType, order) => inventoryManager.sortInventory(sortType, order),
    
    // 查询操作
    getItemById: (itemId) => inventoryManager.getItemById(itemId),
    getItemBySlot: (slotIndex) => inventoryManager.getItemBySlot(slotIndex),
    searchItems: (query, filters) => inventoryManager.searchItems(query, filters),
    
    // 存档操作
    saveToStore: () => inventoryManager.saveToElectronStore(),
    loadFromStore: () => inventoryManager.loadFromElectronStore()
  }), []);
}

// 背包插槽Hook
export function useInventorySlots() {
  const [slots, setSlots] = useState(inventoryManager.getState().slots);

  useEffect(() => {
    const handleInventoryChange = (newState) => {
      console.log('[useInventorySlots] 背包变化，更新插槽:', newState.slots);
      setSlots(newState.slots);
    };

    // 强制刷新插槽状态
    const forceUpdateSlots = () => {
      console.log('[useInventorySlots] 强制刷新插槽状态');
      setSlots(inventoryManager.getState().slots);
    };

    inventoryManager.on('inventory_changed', handleInventoryChange);
    inventoryManager.on('item_added', forceUpdateSlots);
    inventoryManager.on('item_stacked', forceUpdateSlots);
    inventoryManager.on('item_removed', forceUpdateSlots);
    inventoryManager.on('item_moved', forceUpdateSlots);
    
    return () => {
      inventoryManager.off('inventory_changed', handleInventoryChange);
      inventoryManager.off('item_added', forceUpdateSlots);
      inventoryManager.off('item_stacked', forceUpdateSlots);
      inventoryManager.off('item_removed', forceUpdateSlots);
      inventoryManager.off('item_moved', forceUpdateSlots);
    };
  }, []);

  return slots;
}

// 背包物品Hook
export function useInventoryItems() {
  const [items, setItems] = useState(inventoryManager.getItems());

  useEffect(() => {
    const handleInventoryChange = () => {
      setItems(inventoryManager.getItems());
    };

    inventoryManager.on('inventory_changed', handleInventoryChange);
    
    return () => {
      inventoryManager.off('inventory_changed', handleInventoryChange);
    };
  }, []);

  return items;
}

// 金币Hook
export function useGold() {
  const [gold, setGold] = useState(inventoryManager.getState().gold);

  useEffect(() => {
    const handleGoldChange = (newGold) => {
      setGold(newGold);
    };

    const handleInventoryChange = (newState) => {
      setGold(newState.gold);
    };

    inventoryManager.on('gold_changed', handleGoldChange);
    inventoryManager.on('inventory_changed', handleInventoryChange);
    
    return () => {
      inventoryManager.off('gold_changed', handleGoldChange);
      inventoryManager.off('inventory_changed', handleInventoryChange);
    };
  }, []);

  const addGold = useCallback((amount) => {
    inventoryManager.addGold(amount);
  }, []);

  const removeGold = useCallback((amount) => {
    return inventoryManager.removeGold(amount);
  }, []);

  return {
    gold,
    addGold,
    removeGold
  };
}

// 特定物品Hook
export function useInventoryItem(slotIndex) {
  const [item, setItem] = useState(inventoryManager.getItemBySlot(slotIndex));

  useEffect(() => {
    const updateItem = () => {
      setItem(inventoryManager.getItemBySlot(slotIndex));
    };

    // 初始设置
    updateItem();

    // 监听变化
    inventoryManager.on('inventory_changed', updateItem);
    inventoryManager.on('item_added', updateItem);
    inventoryManager.on('item_removed', updateItem);
    inventoryManager.on('item_moved', updateItem);
    
    return () => {
      inventoryManager.off('inventory_changed', updateItem);
      inventoryManager.off('item_added', updateItem);
      inventoryManager.off('item_removed', updateItem);
      inventoryManager.off('item_moved', updateItem);
    };
  }, [slotIndex]);

  return item;
}

// 背包容量Hook
export function useInventoryCapacity() {
  const [capacityInfo, setCapacityInfo] = useState(() => {
    const state = inventoryManager.getState();
    return {
      capacity: state.capacity,
      usedSlots: state.usedSlots,
      availableSlots: state.availableSlots,
      isFull: inventoryManager.isFull()
    };
  });

  useEffect(() => {
    const handleInventoryChange = (newState) => {
      setCapacityInfo({
        capacity: newState.capacity,
        usedSlots: newState.usedSlots,
        availableSlots: newState.availableSlots,
        isFull: inventoryManager.isFull()
      });
    };

    inventoryManager.on('inventory_changed', handleInventoryChange);
    inventoryManager.on('capacity_expanded', handleInventoryChange);
    
    return () => {
      inventoryManager.off('inventory_changed', handleInventoryChange);
      inventoryManager.off('capacity_expanded', handleInventoryChange);
    };
  }, []);

  return capacityInfo;
}

// 背包搜索Hook
export function useInventorySearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({});
  const [searchResults, setSearchResults] = useState([]);

  const performSearch = useCallback(() => {
    const results = inventoryManager.searchItems(searchQuery, searchFilters);
    setSearchResults(results);
  }, [searchQuery, searchFilters]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const updateSearch = useCallback((query, filters = {}) => {
    setSearchQuery(query);
    setSearchFilters(filters);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchFilters({});
  }, []);

  return {
    searchQuery,
    searchFilters,
    searchResults,
    updateSearch,
    clearSearch,
    performSearch
  };
}

// 背包拖拽Hook
export function useInventoryDragDrop() {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragFromSlot, setDragFromSlot] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const startDrag = useCallback((slotIndex) => {
    const item = inventoryManager.getItemBySlot(slotIndex);
    if (item) {
      setDraggedItem(item);
      setDragFromSlot(slotIndex);
      setIsDragging(true);
    }
  }, []);

  const endDrag = useCallback((targetSlot) => {
    if (isDragging && dragFromSlot !== null && targetSlot !== dragFromSlot) {
      inventoryManager.moveItem(dragFromSlot, targetSlot);
    }
    
    setDraggedItem(null);
    setDragFromSlot(null);
    setIsDragging(false);
  }, [isDragging, dragFromSlot]);

  const cancelDrag = useCallback(() => {
    setDraggedItem(null);
    setDragFromSlot(null);
    setIsDragging(false);
  }, []);

  return {
    draggedItem,
    dragFromSlot,
    isDragging,
    startDrag,
    endDrag,
    cancelDrag
  };
}

// 批量操作Hook
export function useInventoryBatchActions() {
  const [isBatching, setIsBatching] = useState(false);

  const batchActions = useCallback((actions) => {
    setIsBatching(true);
    
    try {
      // 暂停事件发送
      const originalEmit = inventoryManager.emit;
      const events = [];
      
      inventoryManager.emit = function(event, ...args) {
        events.push({ event, args });
      };

      // 执行所有操作
      const results = actions.map(action => {
        try {
          return action();
        } catch (error) {
          console.error('批量操作中的错误:', error);
          return null;
        }
      });

      // 恢复事件发送
      inventoryManager.emit = originalEmit;

      // 批量发送事件
      events.forEach(({ event, args }) => {
        inventoryManager.emit(event, ...args);
      });

      return results;
    } finally {
      setIsBatching(false);
    }
  }, []);

  return { batchActions, isBatching };
}

// 背包统计Hook
export function useInventoryStats() {
  const [stats, setStats] = useState(() => calculateStats());

  function calculateStats() {
    const state = inventoryManager.getState();
    const items = inventoryManager.getItems();
    
    const statsByType = {};
    const statsByRarity = {};
    let totalValue = 0;
    let equipmentCount = 0;
    let consumableCount = 0;

    items.forEach(item => {
      // 按类型统计
      statsByType[item.type] = (statsByType[item.type] || 0) + item.quantity;
      
      // 按稀有度统计
      statsByRarity[item.rarity] = (statsByRarity[item.rarity] || 0) + item.quantity;
      
      // 总价值
      totalValue += item.value * item.quantity;
      
      // 分类计数
      if (item.isEquipment) equipmentCount += item.quantity;
      if (item.isConsumable) consumableCount += item.quantity;
    });

    return {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalValue,
      equipmentCount,
      consumableCount,
      statsByType,
      statsByRarity,
      usedSlots: state.usedSlots,
      capacity: state.capacity,
      gold: state.gold
    };
  }

  useEffect(() => {
    const handleInventoryChange = () => {
      setStats(calculateStats());
    };

    inventoryManager.on('inventory_changed', handleInventoryChange);
    
    return () => {
      inventoryManager.off('inventory_changed', handleInventoryChange);
    };
  }, []);

  return stats;
}

// 背包同步Hook（用于从Redux迁移数据）
export function useInventoryMigration() {
  const [migrationStatus, setMigrationStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const migrateFromRedux = useCallback(async (reduxState) => {
    try {
      setIsLoading(true);
      setMigrationStatus('正在从Redux迁移数据...');
      
      console.log('开始迁移Redux数据:', reduxState);
      
      // 获取Redux的inventory和items状态
      const inventoryState = reduxState.inventory || {};
      const itemsState = reduxState.items || {};
      
      // 清空当前背包
      inventoryManager.slots.clear();
      inventoryManager.items.clear();
      
      // 设置基本信息
      inventoryManager.gold = inventoryState.gold || 0;
      inventoryManager.capacity = inventoryState.capacity || 100;
      
      // 重新初始化插槽
      inventoryManager.initializeSlots();
      
      console.log('背包基本信息迁移完成，开始迁移物品...');
      
      // 迁移物品数据
      const slots = inventoryState.slots || {};
      const allItems = itemsState.allItems || {};
      
      for (const [slotId, itemId] of Object.entries(slots)) {
        if (itemId && allItems[itemId]) {
          const reduxItem = allItems[itemId];
          
          // 将Redux物品数据转换为新的GameItem格式
          const itemData = {
            id: reduxItem.id,
            name: reduxItem.name || '未知物品',
            type: reduxItem.itemType || reduxItem.type || 'misc',
            subType: reduxItem.subType || '',
            rarity: mapQualityToRarity(reduxItem.quality),
            quality: reduxItem.quality || 'normal',
            quantity: reduxItem.quantity || 1,
            maxStack: reduxItem.maxStack || (reduxItem.itemType === 'equipment' ? 1 : 99),
            stackable: reduxItem.stackable !== false && (reduxItem.itemType !== 'equipment'),
            description: reduxItem.description || '',
            level: reduxItem.level || 1,
            value: reduxItem.value || 0,
            
            // 装备相关属性
            isEquipment: reduxItem.itemType === 'equipment' || reduxItem.type === 'equipment',
            slotType: reduxItem.slotType || null,
            effects: reduxItem.finalEffects || reduxItem.effects || {},
            requirements: reduxItem.requirements || {},
            
            // 消耗品相关
            isConsumable: reduxItem.itemType === 'consumable' || reduxItem.type === 'consumable',
            useEffect: reduxItem.useEffect || null,
            
            // 状态标记
            isEquipped: reduxItem.isEquipped || false,
            equippedBy: reduxItem.equippedBy || reduxItem.equippedBySummonName || null,
            
            // 时间戳
            createdAt: reduxItem.addedTimestamp || Date.now(),
            updatedAt: Date.now()
          };
          
          console.log(`迁移物品 ${itemData.name} 到插槽 ${slotId}`);
          
          // 添加物品到指定插槽
          const success = inventoryManager.addItem(itemData, parseInt(slotId));
          if (!success) {
            console.warn(`物品 ${itemData.name} 迁移到插槽 ${slotId} 失败`);
          }
        }
      }
      
      // 保存迁移后的状态
      await inventoryManager.saveToElectronStore();
      
      console.log('数据迁移完成');
      setMigrationStatus('迁移成功！');
      
      // 触发状态更新事件
      inventoryManager.emit('migration_completed', {
        migratedItems: Object.keys(slots).length,
        totalSlots: inventoryManager.capacity,
        gold: inventoryManager.gold
      });
      
      return true;
    } catch (error) {
      console.error('背包迁移失败:', error);
      setMigrationStatus(`迁移失败: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
      // 3秒后清除状态消息
      setTimeout(() => setMigrationStatus(''), 3000);
    }
  }, []);

  // 品质映射函数：将Redux的品质映射为新系统的稀有度
  const mapQualityToRarity = (quality) => {
    const qualityMap = {
      '普通': 'common',
      '优秀': 'uncommon', 
      '精良': 'rare',
      '稀有': 'epic',
      '史诗': 'legendary',
      '传说': 'legendary',
      'common': 'common',
      'uncommon': 'uncommon',
      'rare': 'rare',
      'epic': 'epic',
      'legendary': 'legendary'
    };
    return qualityMap[quality] || 'common';
  };

  const syncToRedux = useCallback((dispatch, reduxActions) => {
    // 将当前状态同步回Redux（双向同步）
    const state = inventoryManager.getState();
    
    // 重置Redux状态
    dispatch(reduxActions.resetInventory());
    
    // 同步金币
    dispatch(reduxActions.setGold(state.gold));
    
    // 同步容量
    if (state.capacity !== 100) {
      dispatch(reduxActions.expandCapacity(state.capacity - 100));
    }
    
    // 同步物品和插槽
    state.slots.forEach(slot => {
      if (!slot.isEmpty) {
        const item = inventoryManager.getItemBySlot(slot.index);
        if (item) {
          // 先添加物品到itemSlice
          dispatch(reduxActions.addItem({
            id: item.id,
            name: item.name,
            type: item.type,
            itemType: item.type,
            subType: item.subType,
            quality: item.quality,
            quantity: item.quantity,
            level: item.level,
            value: item.value,
            description: item.description,
            slotType: item.slotType,
            finalEffects: item.effects,
            requirements: item.requirements,
            isEquipped: item.isEquipped,
            equippedBy: item.equippedBy,
            addedTimestamp: item.createdAt
          }));
          
          // 然后添加到背包插槽
          dispatch(reduxActions.addToInventory({
            slotId: slot.index,
            itemId: item.id
          }));
        }
      }
    });
  }, []);

  // 创建测试数据的函数
  const createTestData = useCallback(() => {
    const testItems = [
      {
        name: '生命药水',
        type: 'consumable',
        rarity: 'common',
        quantity: 5,
        value: 50,
        description: '恢复100点生命值',
        useEffect: { type: 'heal', value: 100 }
      },
      {
        name: '钢铁剑',
        type: 'equipment',
        subType: 'weapon',
        rarity: 'uncommon',
        quantity: 1,
        value: 300,
        level: 5,
        description: '锋利的钢铁长剑',
        slotType: 'weapon',
        effects: {
          attack: 25,
          critRate: 0.05
        }
      },
      {
        name: '皮甲',
        type: 'equipment', 
        subType: 'armor',
        rarity: 'common',
        quantity: 1,
        value: 150,
        level: 3,
        description: '简单的皮质护甲',
        slotType: 'armor',
        effects: {
          defense: 15,
          hp: 30
        }
      },
      {
        name: '魔法石',
        type: 'material',
        rarity: 'rare',
        quantity: 10,
        value: 25,
        description: '含有魔法能量的矿石'
      }
    ];

    testItems.forEach(item => {
      inventoryManager.addItem(item);
    });

    // 添加一些金币
    inventoryManager.addGold(1000);

    console.log('测试数据创建完成');
    setMigrationStatus('测试数据创建成功！');
    setTimeout(() => setMigrationStatus(''), 3000);
  }, []);

  return {
    migrateFromRedux,
    syncToRedux,
    createTestData,
    migrationStatus,
    isLoading
  };
}

// 召唤兽装备Hook
export function useSummonEquipment() {
  const [isEquipping, setIsEquipping] = useState(false);
  const [isUnequipping, setIsUnequipping] = useState(false);

  const equipToSummon = useCallback(async (slotIndex, summonId) => {
    setIsEquipping(true);
    try {
      const result = await inventoryManager.equipItemToSummon(slotIndex, summonId);
      return result;
    } finally {
      setIsEquipping(false);
    }
  }, []);

  const unequipFromSummon = useCallback(async (summonId, slotType, targetSlot = null) => {
    setIsUnequipping(true);
    try {
      const result = await inventoryManager.unequipItemFromSummon(summonId, slotType, targetSlot);
      return result;
    } finally {
      setIsUnequipping(false);
    }
  }, []);

  const getEquippableItems = useCallback((slotType = null) => {
    return inventoryManager.getEquippableItems(slotType);
  }, []);

  const canEquipToSummon = useCallback(async (slotIndex, summonId) => {
    return await inventoryManager.canEquipToSummon(slotIndex, summonId);
  }, []);

  return {
    equipToSummon,
    unequipFromSummon,
    getEquippableItems,
    canEquipToSummon,
    isEquipping,
    isUnequipping
  };
}

// 召唤兽管理Hook（集成Redux召唤兽数据）
export function useSummonManager() {
  const [summons, setSummons] = useState([]);
  const [currentSummon, setCurrentSummon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadSummons = useCallback(async () => {
    try {
      setIsLoading(true);
      // 动态导入Redux store
      const store = await import('../store/index.js').then(m => m.default);
      const state = store.getState();
      
      const allSummons = Object.values(state.summons.allSummons || {});
      const currentSummonId = state.summons.currentSummonId;
      const currentSummonData = currentSummonId ? state.summons.allSummons[currentSummonId] : null;
      
      setSummons(allSummons);
      setCurrentSummon(currentSummonData);
    } catch (error) {
      console.error('加载召唤兽数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectSummon = useCallback(async (summonId) => {
    try {
      // 动态导入Redux actions
      const [store, { setCurrentSummon }] = await Promise.all([
        import('../store/index.js').then(m => m.default),
        import('../store/slices/summonSlice.js')
      ]);

      await store.dispatch(setCurrentSummon(summonId));
      await loadSummons(); // 重新加载以获取最新状态
    } catch (error) {
      console.error('选择召唤兽失败:', error);
    }
  }, [loadSummons]);

  useEffect(() => {
    loadSummons();
  }, [loadSummons]);

  return {
    summons,
    currentSummon,
    isLoading,
    loadSummons,
    selectSummon
  };
}

// 装备管理面板Hook
export function useEquipmentPanel() {
  const [selectedSlotType, setSelectedSlotType] = useState(null);
  const [selectedSummon, setSelectedSummon] = useState(null);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [equipmentFilter, setEquipmentFilter] = useState('all');

  const openEquipmentModal = useCallback((summonId, slotType) => {
    setSelectedSummon(summonId);
    setSelectedSlotType(slotType);
    setShowEquipmentModal(true);
  }, []);

  const closeEquipmentModal = useCallback(() => {
    setShowEquipmentModal(false);
    setSelectedSummon(null);
    setSelectedSlotType(null);
  }, []);

  const filteredEquippableItems = useMemo(() => {
    const items = inventoryManager.getEquippableItems(selectedSlotType);
    if (equipmentFilter === 'all') return items;
    return items.filter(item => item.slotType === equipmentFilter);
  }, [selectedSlotType, equipmentFilter]);

  return {
    selectedSlotType,
    selectedSummon,
    showEquipmentModal,
    equipmentFilter,
    filteredEquippableItems,
    setEquipmentFilter,
    openEquipmentModal,
    closeEquipmentModal
  };
} 