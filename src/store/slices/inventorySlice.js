import { createSlice } from '@reduxjs/toolkit';

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    slots: {},  // 背包格子映射，key为格子ID，value为物品ID
    capacity: 20,  // 背包总容量
    gold: 0,  // 金币
    loading: false,
    error: null,
  },
  reducers: {
    // 向背包添加物品
    addToInventory: (state, action) => {
      const { slotId, itemId } = action.payload;
      
      // 如果指定了特定格子，则放入该格子
      if (slotId !== undefined) {
        state.slots[slotId] = itemId;
      } else {
        // 自动寻找空格子
        let emptySlot = null;
        for (let i = 0; i < state.capacity; i++) {
          if (!state.slots[i]) {
            emptySlot = i;
            break;
          }
        }
        
        if (emptySlot !== null) {
          state.slots[emptySlot] = itemId;
        } else {
          // 背包已满，可以在这里设置错误状态
          state.error = '背包已满';
        }
      }
    },
    
    // 从背包移除物品
    removeFromInventory: (state, action) => {
      const slotId = action.payload;
      delete state.slots[slotId];
    },
    
    // 移动背包中的物品（交换两个格子的物品）
    moveInInventory: (state, action) => {
      const { fromSlot, toSlot } = action.payload;
      const temp = state.slots[toSlot];
      state.slots[toSlot] = state.slots[fromSlot];
      state.slots[fromSlot] = temp;
    },
    
    // 扩展背包容量
    expandCapacity: (state, action) => {
      state.capacity += action.payload;
    },
    
    // 设置金币数量
    setGold: (state, action) => {
      state.gold = action.payload;
    },
    
    // 增加金币
    addGold: (state, action) => {
      state.gold += action.payload;
    },
    
    // 减少金币
    removeGold: (state, action) => {
      state.gold -= action.payload;
      // 确保金币不为负
      if (state.gold < 0) {
        state.gold = 0;
      }
    },
    
    // 清空背包
    clearInventory: (state) => {
      state.slots = {};
    },
    
    // 重置背包
    resetInventory: (state) => {
      state.slots = {};
      state.capacity = 20;
      state.gold = 0;
      state.loading = false;
      state.error = null;
    },
    
    // 设置加载状态
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    // 设置错误状态
    setError: (state, action) => {
      state.error = action.payload;
    },

    // 对背包物品进行排序
    sortInventory: (state, action) => {
      const { sortType, sortOrder = 'asc' } = action.payload;
      const currentSlots = { ...state.slots };
      const itemIds = Object.values(currentSlots).filter(id => id !== null);
      
      // 清空当前背包
      state.slots = {};
      
      // 根据排序类型重新分配物品到格子
      let sortedItemIds = [...itemIds];
      
      // 排序逻辑将在组件中实现，这里只负责重新分配格子
      if (sortOrder === 'desc') {
        sortedItemIds.reverse();
      }
      
      // 重新分配格子
      sortedItemIds.forEach((itemId, index) => {
        if (itemId) {
          state.slots[index] = itemId;
        }
      });
    },
  }
});

// 导出Action创建器
export const {
  addToInventory,
  removeFromInventory,
  moveInInventory,
  expandCapacity,
  setGold,
  addGold,
  removeGold,
  clearInventory,
  resetInventory,
  setLoading,
  setError,
  sortInventory
} = inventorySlice.actions;

// 导出选择器
export const selectInventorySlots = state => state.inventory.slots;
export const selectInventoryCapacity = state => state.inventory.capacity;
export const selectInventoryItemIds = state => Object.values(state.inventory.slots).filter(Boolean);
export const selectGold = state => state.inventory.gold;
export const selectInventoryError = state => state.inventory.error;
export const selectIsInventoryFull = state => 
  Object.keys(state.inventory.slots).length >= state.inventory.capacity;

export default inventorySlice.reducer; 