/**
 * FormationSlice - 简化的阵型Redux状态管理
 * 只负责UI状态管理，业务逻辑由FormationManager(OOP)处理
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { formationManager } from '@/features/formation/managers/FormationManager.js';

// 异步thunk：从FormationManager同步当前阵型到Redux
export const syncFormationFromOOP = createAsyncThunk(
  'formation/syncFromOOP',
  async (_, { rejectWithValue }) => {
    try {
      const currentGrid = formationManager.getCurrentFormationGrid();
      const currentFormationId = formationManager.currentFormationId;
      const isValid = formationManager.isCurrentFormationValid();
      
      return {
        grid: currentGrid || Array(3).fill(null).map(() => Array(3).fill(null)),
        currentFormationId,
        isValid
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 异步thunk：更新OOP层的阵型数据
export const updateFormationInOOP = createAsyncThunk(
  'formation/updateOOP',
  async ({ row, col, summonId }, { rejectWithValue }) => {
    try {
      const success = formationManager.setCurrentSummon(row, col, summonId);
      if (!success) {
        throw new Error('Failed to update formation in OOP layer');
      }
      
      // 返回更新后的数据
      const currentGrid = formationManager.getCurrentFormationGrid();
      const isValid = formationManager.isCurrentFormationValid();
      
      return {
        grid: currentGrid,
        isValid
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // UI状态
  grid: Array(3).fill(null).map(() => Array(3).fill(null)), // 当前显示的阵型网格
  currentFormationId: null, // 当前阵型ID
  isValid: false, // 当前阵型是否有效
  
  // 模态框和UI控制状态
  isFormationModalOpen: false,
  isFormationManagerOpen: false,
  selectedSummonId: null, // 当前选中的召唤兽（用于放置）
  
  // 拖拽状态
  draggedItem: null,
  draggedOverSlot: null,
  
  // 加载和错误状态
  isLoading: false,
  error: null,
  lastSyncTime: null
};

const formationSlice = createSlice({
  name: 'formation',
  initialState,
  reducers: {
    // UI控制actions
    setFormationModalOpen: (state, action) => {
      state.isFormationModalOpen = action.payload;
    },
    
    setFormationManagerOpen: (state, action) => {
      state.isFormationManagerOpen = action.payload;
    },
    
    setSelectedSummonId: (state, action) => {
      state.selectedSummonId = action.payload;
    },
    
    // 拖拽状态管理
    setDraggedItem: (state, action) => {
      state.draggedItem = action.payload;
    },
    
    setDraggedOverSlot: (state, action) => {
      state.draggedOverSlot = action.payload;
    },
    
    clearDragState: (state) => {
      state.draggedItem = null;
      state.draggedOverSlot = null;
    },
    
    // 错误处理
    clearError: (state) => {
      state.error = null;
    },
    
    // 手动设置网格（仅用于向后兼容）
    setGridDirect: (state, action) => {
      const { grid } = action.payload;
      if (grid && Array.isArray(grid) && grid.length === 3) {
        state.grid = grid;
      }
    },
    
    // 强制同步标记
    markForSync: (state) => {
      state.lastSyncTime = Date.now();
    }
  },
  
  extraReducers: (builder) => {
    builder
      // 同步FormationManager数据
      .addCase(syncFormationFromOOP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(syncFormationFromOOP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.grid = action.payload.grid;
        state.currentFormationId = action.payload.currentFormationId;
        state.isValid = action.payload.isValid;
        state.lastSyncTime = Date.now();
      })
      .addCase(syncFormationFromOOP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // 更新OOP层数据
      .addCase(updateFormationInOOP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateFormationInOOP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.grid = action.payload.grid;
        state.isValid = action.payload.isValid;
        state.lastSyncTime = Date.now();
      })
      .addCase(updateFormationInOOP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setFormationModalOpen,
  setFormationManagerOpen,
  setSelectedSummonId,
  setDraggedItem,
  setDraggedOverSlot,
  clearDragState,
  clearError,
  setGridDirect,
  markForSync
} = formationSlice.actions;

// 简化的selectors，主要用于UI状态
export const selectFormationGrid = (state) => state.formation.grid;
export const selectCurrentFormationId = (state) => state.formation.currentFormationId;
export const selectIsFormationValid = (state) => state.formation.isValid;
export const selectIsFormationModalOpen = (state) => state.formation.isFormationModalOpen;
export const selectIsFormationManagerOpen = (state) => state.formation.isFormationManagerOpen;
export const selectSelectedSummonId = (state) => state.formation.selectedSummonId;
export const selectDraggedItem = (state) => state.formation.draggedItem;
export const selectDraggedOverSlot = (state) => state.formation.draggedOverSlot;
export const selectFormationError = (state) => state.formation.error;
export const selectIsFormationLoading = (state) => state.formation.isLoading;
export const selectLastSyncTime = (state) => state.formation.lastSyncTime;

export const selectSummonInSlot = (state, row, col) => {
  if (state.formation.grid && state.formation.grid[row] && state.formation.grid[row][col] !== undefined) {
    return state.formation.grid[row][col];
  }
  return null;
};

export const selectTotalSummonsInFormation = (state) => {
  if (!state.formation.grid) return 0;
  let count = 0;
  state.formation.grid.forEach(row => {
    row.forEach(summonId => {
      if (summonId !== null) {
        count++;
      }
    });
  });
  return count;
};

// 向后兼容的actions（映射到新的异步actions）
export const setSummonInSlot = (payload) => updateFormationInOOP(payload);
export const clearFormation = () => (dispatch) => {
  // 清空OOP层的当前阵型
  const currentFormation = formationManager.getCurrentFormation();
  if (currentFormation) {
    currentFormation.clear();
    formationManager.saveToStorage();
  }
  // 同步到Redux
  dispatch(syncFormationFromOOP());
};
export const setFormation = (payload) => (dispatch) => {
  // 设置OOP层的阵型
  const { newGrid } = payload;
  const currentFormation = formationManager.getCurrentFormation();
  if (currentFormation && newGrid) {
    currentFormation.grid = newGrid;
    currentFormation.updatedAt = Date.now();
    formationManager.saveToStorage();
  }
  // 同步到Redux
  dispatch(syncFormationFromOOP());
};

export default formationSlice.reducer; 