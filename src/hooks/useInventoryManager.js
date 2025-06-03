/**
 * 面向对象背包管理的React Hooks
 * 支持与Redux并行运行，实现渐进式迁移
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import inventoryManager from '../store/InventoryManager';
import { EQUIPMENT_SLOT_TYPES } from '@/config/enumConfig';

// 基础背包状态Hook
export function useInventoryManager() {
  const [state, setState] = useState(() => inventoryManager.getState());
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
    const handleItemAdded = ({ item }) => {
      console.log(`[useInventoryManager] 物品已添加: ${item.name}`);
      setState(inventoryManager.getState());
    };

    // 处理物品堆叠事件 - 强制刷新状态
    const handleItemStacked = () => {
      console.log('[useInventoryManager] 物品堆叠，强制刷新状态');
      setState(inventoryManager.getState());
    };

    // 处理物品移除事件 - 强制刷新状态
    const handleItemRemoved = ({ item }) => {
      console.log(`[useInventoryManager] 物品已移除: ${item.name}`);
      setState(inventoryManager.getState());
    };

    // 处理物品使用事件 - 强制刷新状态
    const handleItemUsed = ({ item, success }) => {
      console.log(`[useInventoryManager] 物品使用: ${item.name} ${success ? '成功' : '失败'}`);
      setState(inventoryManager.getState());
    };

    // 注册事件监听器
    inventoryManager.on('inventory_changed', handleInventoryChange);
    inventoryManager.on('error', handleError);
    inventoryManager.on('state_loaded', handleStateLoaded);
    inventoryManager.on('state_saved', handleStateSaved);
    inventoryManager.on('item_added', handleItemAdded);
    inventoryManager.on('item_stacked', handleItemStacked);
    inventoryManager.on('item_removed', handleItemRemoved);
    inventoryManager.on('item_used', handleItemUsed);

    // 清理事件监听器
    return () => {
      inventoryManager.off('inventory_changed', handleInventoryChange);
      inventoryManager.off('error', handleError);
      inventoryManager.off('state_loaded', handleStateLoaded);
      inventoryManager.off('state_saved', handleStateSaved);
      inventoryManager.off('item_added', handleItemAdded);
      inventoryManager.off('item_stacked', handleItemStacked);
      inventoryManager.off('item_removed', handleItemRemoved);
      inventoryManager.off('item_used', handleItemUsed);
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
    // 物品操作 - 基于物品ID
    addItem: (itemData) => inventoryManager.addItem(itemData),
    removeItem: (itemId, quantity = null) => inventoryManager.removeItem(itemId, quantity),
    useItem: (itemId, target = null) => inventoryManager.useItem(itemId, target),
    
    // 装备操作 - 基于物品ID
    equipItem: (itemId, summonId) => inventoryManager.equipItem(itemId, summonId),
    unequipItem: (summonId, slotType) => inventoryManager.unequipItem(summonId, slotType),
    
    // 金币操作
    addGold: (amount) => inventoryManager.addGold(amount),
    removeGold: (amount) => inventoryManager.removeGold(amount),
    
    // 背包管理
    expandCapacity: (additionalSlots) => inventoryManager.expandCapacity(additionalSlots),
    
    // 查询操作 - 基于物品ID
    getItemById: (itemId) => inventoryManager.getItemById(itemId),
    searchItems: (query, filters) => inventoryManager.searchItems(query, filters),
    
    // 存档操作
    saveToStore: () => inventoryManager.saveToElectronStore(),
    loadFromStore: () => inventoryManager.loadFromElectronStore(),

    // 获取可装备物品列表
    getEquippableItems: (slotType = null, includeEquipped = false) => inventoryManager.getEquippableItems(slotType, includeEquipped),

    // 检查是否可装备给召唤兽 - 基于物品ID
    canEquipToSummon: async (itemId, summonId) => {
      return await inventoryManager.canEquipToSummon(itemId, summonId);
    },

    // 获取召唤兽装备状态
    getSummonEquipmentStatus: async (summonId) => {
      return await inventoryManager.getSummonEquipmentStatus(summonId);
    },

    // 获取装备槽位类型显示名称
    getSlotTypeDisplayName: (slotType) => inventoryManager.getSlotTypeDisplayName(slotType)
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

// 背包容量Hook
export function useInventoryCapacity() {
  const [capacity, setCapacity] = useState({
    total: inventoryManager.capacity,
    used: inventoryManager.getUsedSlotsCount(),
    available: inventoryManager.getAvailableSlotsCount()
  });

  useEffect(() => {
    const handleInventoryChange = (newState) => {
      setCapacity({
        total: newState.capacity,
        used: newState.usedSlots,
        available: newState.availableSlots
      });
    };

    inventoryManager.on('inventory_changed', handleInventoryChange);
    inventoryManager.on('capacity_expanded', (data) => {
      setCapacity(prev => ({
        ...prev,
        total: data.newCapacity,
        available: data.newCapacity - prev.used
      }));
    });

    return () => {
      inventoryManager.off('inventory_changed', handleInventoryChange);
      inventoryManager.off('capacity_expanded', () => {});
    };
  }, []);

  return capacity;
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
  const [dragFromItemId, setDragFromItemId] = useState(null);

  const startDrag = useCallback((itemId) => {
    const item = inventoryManager.getItemById(itemId);
    if (item) {
      setDraggedItem(item);
      setDragFromItemId(itemId);
    }
  }, []);

  const endDrag = useCallback(() => {
    setDraggedItem(null);
    setDragFromItemId(null);
  }, []);

  const handleDrop = useCallback((targetItemId) => {
    if (dragFromItemId && targetItemId && dragFromItemId !== targetItemId) {
      console.log(`Moving item from ${dragFromItemId} to ${targetItemId}`);
      // 实际的移动逻辑可以在这里实现，目前简化处理
    }
    endDrag();
  }, [dragFromItemId, endDrag]);

  return {
    draggedItem,
    dragFromItemId,
    startDrag,
    endDrag,
    handleDrop,
    isDragging: !!draggedItem
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
  const state = useInventoryManager();

  return useMemo(() => {
    const slots = state.slots || [];
    const items = state.items || [];
    
    // 基础统计
    const totalSlots = state.capacity || 0;
    const usedSlots = state.usedSlots || 0;
    const availableSlots = state.availableSlots || 0;
    const gold = state.gold || 0;

    // 物品类型统计
    const itemTypeStats = {};
    const rarityStats = {};
    let totalValue = 0;

    items.forEach(item => {
      // 类型统计
      itemTypeStats[item.type] = (itemTypeStats[item.type] || 0) + item.quantity;
      
      // 稀有度统计
      rarityStats[item.rarity] = (rarityStats[item.rarity] || 0) + 1;
      
      // 总价值
      totalValue += (item.value || 0) * item.quantity;
    });

    // 装备统计
    const equipmentStats = items
      .filter(item => item.type === 'equipment')
      .reduce((stats, item) => {
        stats[item.slotType] = (stats[item.slotType] || 0) + 1;
        stats.equipped = (stats.equipped || 0) + (item.isEquipped ? 1 : 0);
        return stats;
      }, {});

    return {
      totalSlots,
      usedSlots,
      availableSlots,
      usagePercentage: totalSlots > 0 ? (usedSlots / totalSlots * 100).toFixed(1) : 0,
      gold,
      totalItems: items.length,
      totalItemQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalValue,
      itemTypeStats,
      rarityStats,
      equipmentStats,
      isFull: usedSlots >= totalSlots,
      isEmpty: usedSlots === 0
    };
  }, [state]);
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
            slotType: reduxItem.slotType || null,
            effects: reduxItem.finalEffects || reduxItem.effects || {},
            requirements: reduxItem.requirements || {},
            
            // 消耗品相关
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
  const [equipmentState, setEquipmentState] = useState({});

  useEffect(() => {
    // 监听装备状态变化
    const handleEquipmentApplied = ({ equipment, summonId }) => {
      setEquipmentState(prev => ({
        ...prev,
        [summonId]: {
          ...prev[summonId],
          [equipment.slotType]: equipment
        }
      }));
    };

    const handleEquipmentRemoved = ({ equipment, summonId }) => {
      setEquipmentState(prev => {
        const newState = { ...prev };
        if (newState[summonId]) {
          delete newState[summonId][equipment.slotType];
        }
        return newState;
      });
    };

    const handleInventoryChange = () => {
      // 重新加载装备状态
      setEquipmentState({});
    };

    inventoryManager.on('equipment_applied', handleEquipmentApplied);
    inventoryManager.on('equipment_removed', handleEquipmentRemoved);
    inventoryManager.on('inventory_changed', handleInventoryChange);

    return () => {
      inventoryManager.off('equipment_applied', handleEquipmentApplied);
      inventoryManager.off('equipment_removed', handleEquipmentRemoved);
      inventoryManager.off('inventory_changed', handleInventoryChange);
    };
  }, []);

  const equipToSummon = useCallback(async (itemId, summonId) => {
    try {
      const result = await inventoryManager.equipItem(itemId, summonId);
      return result;
    } catch (error) {
      console.error('装备失败:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const unequipFromSummon = useCallback(async (summonId, slotType) => {
    try {
      const result = await inventoryManager.unequipItem(summonId, slotType);
      return result;
    } catch (error) {
      console.error('卸装失败:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const canEquipToSummon = useCallback(async (itemId, summonId) => {
    return await inventoryManager.canEquipToSummon(itemId, summonId);
  }, []);

  const getSummonEquipment = useCallback((summonId) => {
    return equipmentState[summonId] || {};
  }, [equipmentState]);

  return {
    equipmentState,
    equipToSummon,
    unequipFromSummon,
    canEquipToSummon,
    getSummonEquipment
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
      // 使用OOP召唤兽系统
      const summonManager = await import('../store/SummonManager.js').then(m => m.summonManagerInstance);
      summonManager.setCurrentSummon(summonId);
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

// 物品操作Hook
export function useItemOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const actions = useMemo(() => ({
    // 使用物品
    useItem: async (itemId, target = null) => {
      setIsLoading(true);
      setError(null);
      try {
        const success = inventoryManager.useItem(itemId, target);
        return { success };
      } catch (error) {
        setError(error.message);
        return { success: false, error: error.message };
      } finally {
        setIsLoading(false);
      }
    },

    // 移除物品
    removeItem: async (itemId, quantity = null) => {
      setIsLoading(true);
      setError(null);
      try {
        const removedItem = inventoryManager.removeItem(itemId, quantity);
        return { success: !!removedItem, removedItem };
      } catch (error) {
        setError(error.message);
        return { success: false, error: error.message };
      } finally {
        setIsLoading(false);
      }
    },

    // 装备物品
    equipItem: async (itemId, summonId) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await inventoryManager.equipItem(itemId, summonId);
        return result;
      } catch (error) {
        setError(error.message);
        return { success: false, error: error.message };
      } finally {
        setIsLoading(false);
      }
    },

    // 快速使用物品（根据上下文自动选择目标）
    quickUseItem: (itemId, targetContext = {}) => {
      const item = inventoryManager.getItemById(itemId);
      if (!item) {
        return { success: false, error: '物品不存在' };
      }

      // 根据物品类型和上下文确定目标
      let target = null;
      if (item.type === 'consumable' && targetContext.summon) {
        target = targetContext.summon;
      } else if (item.type === 'equipment' && targetContext.summon) {
        target = targetContext.summon;
      }

      return actions.useItem(itemId, target);
    },

    // 获取物品详细信息
    getItemInfo: (itemId) => {
      const item = inventoryManager.getItemById(itemId);
      return item ? item.getDetailedInfo() : null;
    }
  }), []);

  return {
    ...actions,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}

// 背包过滤和搜索hook
export function useInventoryFilter() {
  const [filters, setFilters] = useState({
    type: '',
    rarity: '',
    searchQuery: ''
  });

  const actions = useInventoryActions();

  const filteredItems = useMemo(() => {
    if (!filters.searchQuery && !filters.type && !filters.rarity) {
      return [];
    }

    const searchFilters = {};
    if (filters.type) searchFilters.type = filters.type;
    if (filters.rarity) searchFilters.rarity = filters.rarity;

    return actions.searchItems(filters.searchQuery, searchFilters);
  }, [filters, actions]);

  return {
    filters,
    setFilters,
    filteredItems,
    clearFilters: () => setFilters({ type: '', rarity: '', searchQuery: '' })
  };
}

// 召唤兽装备状态Hook
export function useSummonEquipmentStatus(summonId) {
  const [equipmentStatus, setEquipmentStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadEquipmentStatus = useCallback(async () => {
    if (!summonId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await inventoryManager.getSummonEquipmentStatus(summonId);
      if (result.success) {
        setEquipmentStatus(result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [summonId]);

  useEffect(() => {
    loadEquipmentStatus();
  }, [loadEquipmentStatus]);

  // 监听装备变化事件
  useEffect(() => {
    const handleEquipmentChange = () => {
      loadEquipmentStatus();
    };

    inventoryManager.on('item_equipped_to_summon', handleEquipmentChange);
    inventoryManager.on('item_unequipped_from_summon', handleEquipmentChange);
    
    return () => {
      inventoryManager.off('item_equipped_to_summon', handleEquipmentChange);
      inventoryManager.off('item_unequipped_from_summon', handleEquipmentChange);
    };
  }, [loadEquipmentStatus]);

  return {
    equipmentStatus,
    isLoading,
    error,
    reload: loadEquipmentStatus
  };
}

// 装备槽位配置Hook
export function useEquipmentSlotConfig() {
  return useMemo(() => {
    const slotConfig = Object.values(EQUIPMENT_SLOT_TYPES).map(slotType => ({
      type: slotType,
      displayName: inventoryManager.getSlotTypeDisplayName(slotType),
      icon: getSlotTypeIcon(slotType),
      description: getSlotTypeDescription(slotType)
    }));

    return {
      slotTypes: EQUIPMENT_SLOT_TYPES,
      slotConfig,
      getSlotDisplayName: (slotType) => inventoryManager.getSlotTypeDisplayName(slotType),
      getSlotIcon: getSlotTypeIcon,
      getSlotDescription: getSlotTypeDescription
    };
  }, []);
}

// 获取装备槽位图标
function getSlotTypeIcon(slotType) {
  const icons = {
    [EQUIPMENT_SLOT_TYPES.ACCESSORY]: "fa-gem",      // 饰品
    [EQUIPMENT_SLOT_TYPES.RELIC]: "fa-scroll",       // 遗物
    [EQUIPMENT_SLOT_TYPES.BLOODLINE]: "fa-dna",      // 血脉
    [EQUIPMENT_SLOT_TYPES.RUNE]: "fa-magic"          // 符文
  };
  return icons[slotType] || "fa-square";
}

// 获取装备槽位描述
function getSlotTypeDescription(slotType) {
  const descriptions = {
    [EQUIPMENT_SLOT_TYPES.ACCESSORY]: "装饰性物品，提供额外属性",
    [EQUIPMENT_SLOT_TYPES.RELIC]: "古老的遗物，具有特殊效果",
    [EQUIPMENT_SLOT_TYPES.BLOODLINE]: "血脉之力，提供种族特性",
    [EQUIPMENT_SLOT_TYPES.RUNE]: "符文之力，增强基础属性"
  };
  return descriptions[slotType] || "";
}

// 装备对比Hook
export function useEquipmentComparison() {
  const [comparisonItems, setComparisonItems] = useState([]);

  const addToComparison = useCallback((item) => {
    setComparisonItems(prev => {
      // 限制对比物品数量
      const newItems = prev.filter(existingItem => existingItem.id !== item.id);
      if (newItems.length >= 3) {
        newItems.shift(); // 移除最旧的对比项
      }
      return [...newItems, item];
    });
  }, []);

  const removeFromComparison = useCallback((itemId) => {
    setComparisonItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonItems([]);
  }, []);

  const compareAttributes = useMemo(() => {
    if (comparisonItems.length < 2) return null;

    const attributes = new Set();
    comparisonItems.forEach(item => {
      if (item.effects) {
        Object.keys(item.effects).forEach(attr => attributes.add(attr));
      }
    });

    const comparison = {};
    attributes.forEach(attr => {
      comparison[attr] = comparisonItems.map(item => ({
        itemId: item.id,
        itemName: item.name,
        value: item.effects?.[attr] || 0
      }));
    });

    return comparison;
  }, [comparisonItems]);

  return {
    comparisonItems,
    addToComparison,
    removeFromComparison,
    clearComparison,
    compareAttributes,
    canCompare: comparisonItems.length >= 2
  };
}

// 装备推荐Hook
export function useEquipmentRecommendation(summonId) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateRecommendations = useCallback(async () => {
    if (!summonId) return;

    setIsLoading(true);
    try {
      // 动态导入Redux store
      const store = await import('../store/index.js').then(m => m.default);
      const summon = store.getState().summons.allSummons[summonId];
      
      if (!summon) {
        setRecommendations([]);
        return;
      }

      // 获取背包中的所有装备
      const allEquipment = inventoryManager.getEquippableItems();
      
      // 根据召唤兽属性推荐装备
      const summonLevel = summon.level || 1;
      const summonType = summon.petType || 'physical';
      
      const recommendedItems = allEquipment
        .filter(item => {
          // 过滤掉等级要求过高的装备
          if (item.requirements?.level && item.requirements.level > summonLevel) {
            return false;
          }
          return true;
        })
        .map(item => {
          // 计算推荐分数
          let score = 0;
          
          // 基础分数
          score += (item.level || 1) * 10;
          
          // 根据召唤兽类型调整分数
          if (item.effects) {
            if (summonType === 'physical') {
              score += (item.effects.physicalAttack || 0) * 2;
              score += (item.effects.strength || 0) * 1.5;
            } else if (summonType === 'magical') {
              score += (item.effects.magicalAttack || 0) * 2;
              score += (item.effects.intelligence || 0) * 1.5;
            } else if (summonType === 'defense') {
              score += (item.effects.physicalDefense || 0) * 1.5;
              score += (item.effects.magicalDefense || 0) * 1.5;
              score += (item.effects.constitution || 0) * 1.5;
            }
          }
          
          return { ...item, recommendScore: score };
        })
        .sort((a, b) => b.recommendScore - a.recommendScore)
        .slice(0, 10); // 只保留前10个推荐

      setRecommendations(recommendedItems);
    } catch (error) {
      console.error('生成装备推荐失败:', error);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, [summonId]);

  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  return {
    recommendations,
    isLoading,
    regenerate: generateRecommendations
  };
} 