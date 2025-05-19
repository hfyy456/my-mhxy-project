/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-20 03:17:44
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-20 03:24:16
 */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  saves: {},
  lastSaveTime: null,
  autoSaveEnabled: true,
  currentSaveId: null,
};

const saveSlice = createSlice({
  name: 'saves',
  initialState,
  reducers: {
    createSave: (state, action) => {
      const { id, data, description } = action.payload;
      state.saves[id] = {
        data,
        description,
        timestamp: Date.now(),
      };
      state.lastSaveTime = Date.now();
      state.currentSaveId = id;
    },
    deleteSave: (state, action) => {
      const saveId = action.payload;
      delete state.saves[saveId];
      if (state.currentSaveId === saveId) {
        state.currentSaveId = null;
      }
    },
    setAutoSaveEnabled: (state, action) => {
      state.autoSaveEnabled = action.payload;
    },
    clearAllSaves: (state) => {
      state.saves = {};
      state.lastSaveTime = null;
      state.currentSaveId = null;
    },
    setCurrentSaveId: (state, action) => {
      state.currentSaveId = action.payload;
    },
  },
});

export const {
  createSave,
  deleteSave,
  setAutoSaveEnabled,
  clearAllSaves,
  setCurrentSaveId,
} = saveSlice.actions;

// Selectors
export const selectAllSaves = (state) => state.saves.saves;
export const selectLastSaveTime = (state) => state.saves.lastSaveTime;
export const selectAutoSaveEnabled = (state) => state.saves.autoSaveEnabled;
export const selectCurrentSaveId = (state) => state.saves.currentSaveId;

export default saveSlice.reducer; 