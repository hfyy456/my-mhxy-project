/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-21 23:57:32
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-26 04:17:12
 */
import { createSlice } from '@reduxjs/toolkit';
import { npcs as npcConfig } from '@/config/character/npcConfig';
import { dialogues as dialogueConfig } from '@/config/ui/dialogueConfig';

// 初始状态，可以考虑将配置中的NPC数据转换为运行时状态
// 例如，每个NPC实例可以有自己的动态数据，如当前对话、任务状态等
const initialState = {
  // allNpcs: {}, // 存储所有NPC实例的状态，以NPC ID为键
  // activeInteractions: {}, // 存储当前与玩家交互的NPC信息
  npcs: Object.keys(npcConfig).reduce((acc, npcId) => {
    acc[npcId] = {
      ...npcConfig[npcId], // 从配置加载静态数据
      // 在这里可以添加NPC的动态状态字段
      currentDialogueNodeId: null, // 当前对话节点ID
      isActive: false, // 是否正在与玩家交互
      // 更多动态状态...
    };
    return acc;
  }, {}),
  // 可以添加一个字段来跟踪当前正在交互的NPC ID
  interactingWithNpcId: null, 
};

const npcSlice = createSlice({
  name: 'npcs',
  initialState,
  reducers: {
    // 初始化NPC数据 (如果需要从其他地方加载，或者在游戏开始时设置)
    // loadNpcs: (state, action) => {
    //   state.allNpcs = action.payload; // 假设 payload 是NPC数据的对象
    // },

    // 开始与NPC交互
    startInteraction: (state, action) => {
      const { npcId } = action.payload;
      if (state.npcs[npcId]) {
        state.interactingWithNpcId = npcId;
        state.npcs[npcId].isActive = true;
        
        const npcDialogueKey = npcConfig[npcId].dialogueKey || 'default_greeting';
        const dialogue = dialogueConfig[npcDialogueKey];
        if (dialogue && dialogue.initial) {
          state.npcs[npcId].currentDialogueNodeId = dialogue.initial;
        } else {
          // 如果找不到特定对话或初始节点，可以设置一个默认的回退
          const fallbackDialogue = dialogueConfig['default_greeting'];
          state.npcs[npcId].currentDialogueNodeId = fallbackDialogue?.initial || null;
          console.warn(`Dialogue or initial node not found for NPC: ${npcId}, dialogueKey: ${npcDialogueKey}. Using fallback.`);
        }
      }
    },
    // 结束与NPC交互
    endInteraction: (state) => {
      if (state.interactingWithNpcId && state.npcs[state.interactingWithNpcId]) {
        state.npcs[state.interactingWithNpcId].isActive = false;
        state.npcs[state.interactingWithNpcId].currentDialogueNodeId = null;
      }
      state.interactingWithNpcId = null;
    },
    // 修改 updateDialogue 为 selectDialogueOption
    selectDialogueOption: (state, action) => {
      const { npcId, option } = action.payload; // option 对象包含 nextNode 和 action
      if (!npcId || !state.npcs[npcId] || !option) return;

      const npc = state.npcs[npcId];
      const dialogueKey = npc.dialogueKey || 'default_greeting';
      const currentDialogue = dialogueConfig[dialogueKey] || dialogueConfig['default_greeting'];

      if (option.action?.type === 'END_INTERACTION' || !option.nextNode) {
        npc.isActive = false;
        npc.currentDialogueNodeId = null;
        state.interactingWithNpcId = null;
        // 实际的action处理 (如 START_QUEST, OPEN_SHOP) 将通过 thunk 或 middleware 处理
        return; 
      }

      if (currentDialogue && currentDialogue.nodes && currentDialogue.nodes[option.nextNode]) {
        npc.currentDialogueNodeId = option.nextNode;
      } else {
        console.warn(`Next dialogue node "${option.nextNode}" not found for NPC ${npcId}. Ending interaction.`);
        npc.isActive = false;
        npc.currentDialogueNodeId = null;
        state.interactingWithNpcId = null;
      }
    },
    // 示例：更新NPC特定状态 (可以根据需要扩展)
    // setNpcQuestState: (state, action) => {
    //   const { npcId, questId, status } = action.payload;
    //   if (state.allNpcs[npcId] && state.allNpcs[npcId].quests) {
    //     state.allNpcs[npcId].quests[questId] = status;
    //   }
    // },
  },
  // 可以添加 extraReducers 来处理异步 thunks 或其他 slice 的 actions
  // extraReducers: (builder) => {
  //   // builder.addCase(...)
  // }
});

export const { 
  startInteraction, 
  endInteraction, 
  selectDialogueOption,
  // loadNpcs, 
  // setNpcQuestState 
} = npcSlice.actions;

// Selectors
export const selectAllNpcs = (state) => state.npcs.npcs;
export const selectNpcById = (npcId) => (state) => state.npcs.npcs[npcId];
export const selectInteractingNpcId = (state) => state.npcs.interactingWithNpcId;

// 修改 selector 以返回完整的当前对话节点对象，而不仅仅是ID
export const selectCurrentDialogue = (state) => {
  const npcId = state.npcs.interactingWithNpcId;
  if (!npcId) return null;

  const npc = state.npcs.npcs[npcId];
  if (!npc || !npc.currentDialogueNodeId) return null;

  const dialogueKey = npc.dialogueKey || 'default_greeting';
  const dialogueSet = dialogueConfig[dialogueKey] || dialogueConfig['default_greeting'];
  
  if (dialogueSet && dialogueSet.nodes) {
    return dialogueSet.nodes[npc.currentDialogueNodeId] || null;
  }
  return null;
};


export default npcSlice.reducer; 