import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentDialogue: null, // 当前激活的对话
  dialogueHistory: [], // 对话历史
  activeQuest: null, // 当前激活的任务
  availableDialogues: {}, // 可用的对话选项
  dialogueFlags: {}, // 对话标记和条件
  isDialogueActive: false, // 是否有对话正在进行
};

const dialogueSlice = createSlice({
  name: 'dialogue',
  initialState,
  reducers: {
    // 设置当前对话
    setCurrentDialogue: (state, action) => {
      state.currentDialogue = action.payload;
      state.isDialogueActive = action.payload !== null;
    },

    // 添加对话到历史
    addDialogueToHistory: (state, action) => {
      const { npcId, dialogueId, selectedOption, timestamp } = action.payload;
      state.dialogueHistory.push({
        npcId,
        dialogueId,
        selectedOption,
        timestamp: timestamp || Date.now()
      });
    },

    // 设置激活的任务
    setActiveQuest: (state, action) => {
      state.activeQuest = action.payload;
    },

    // 设置可用对话选项
    setAvailableDialogues: (state, action) => {
      const { npcId, dialogues } = action.payload;
      state.availableDialogues[npcId] = dialogues;
    },

    // 设置对话标记
    setDialogueFlag: (state, action) => {
      const { flagName, value } = action.payload;
      state.dialogueFlags[flagName] = value;
    },

    // 批量设置对话标记
    setDialogueFlags: (state, action) => {
      state.dialogueFlags = { ...state.dialogueFlags, ...action.payload };
    },

    // 清除对话标记
    clearDialogueFlag: (state, action) => {
      delete state.dialogueFlags[action.payload];
    },

    // 结束对话
    endDialogue: (state) => {
      state.currentDialogue = null;
      state.isDialogueActive = false;
    },

    // 重置对话系统状态
    resetDialogueState: (state) => {
      return { ...initialState };
    },

    // 更新NPC对话状态
    updateNpcDialogueState: (state, action) => {
      const { npcId, dialogueState } = action.payload;
      if (!state.availableDialogues[npcId]) {
        state.availableDialogues[npcId] = {};
      }
      state.availableDialogues[npcId] = {
        ...state.availableDialogues[npcId],
        ...dialogueState
      };
    },

    // 标记对话为已完成
    markDialogueAsCompleted: (state, action) => {
      const { npcId, dialogueId } = action.payload;
      if (!state.dialogueFlags.completedDialogues) {
        state.dialogueFlags.completedDialogues = {};
      }
      if (!state.dialogueFlags.completedDialogues[npcId]) {
        state.dialogueFlags.completedDialogues[npcId] = [];
      }
      if (!state.dialogueFlags.completedDialogues[npcId].includes(dialogueId)) {
        state.dialogueFlags.completedDialogues[npcId].push(dialogueId);
      }
    }
  }
});

// Actions
export const {
  setCurrentDialogue,
  addDialogueToHistory,
  setActiveQuest,
  setAvailableDialogues,
  setDialogueFlag,
  setDialogueFlags,
  clearDialogueFlag,
  endDialogue,
  resetDialogueState,
  updateNpcDialogueState,
  markDialogueAsCompleted
} = dialogueSlice.actions;

// Selectors
export const selectCurrentDialogue = (state) => state.dialogue.currentDialogue;
export const selectDialogueHistory = (state) => state.dialogue.dialogueHistory;
export const selectActiveQuest = (state) => state.dialogue.activeQuest;
export const selectAvailableDialogues = (state) => state.dialogue.availableDialogues;
export const selectDialogueFlags = (state) => state.dialogue.dialogueFlags;
export const selectIsDialogueActive = (state) => state.dialogue.isDialogueActive;

// 获取特定NPC的对话选项
export const selectNpcDialogues = (state, npcId) => 
  state.dialogue.availableDialogues[npcId] || {};

// 检查对话标记
export const selectDialogueFlag = (state, flagName) => 
  state.dialogue.dialogueFlags[flagName];

// 检查对话是否已完成
export const selectIsDialogueCompleted = (state, npcId, dialogueId) => {
  const completedDialogues = state.dialogue.dialogueFlags.completedDialogues;
  return completedDialogues?.[npcId]?.includes(dialogueId) || false;
};

// 获取NPC的对话历史
export const selectNpcDialogueHistory = (state, npcId) =>
  state.dialogue.dialogueHistory.filter(entry => entry.npcId === npcId);

export default dialogueSlice.reducer; 