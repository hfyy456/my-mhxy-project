/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-22 00:02:10
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-26 04:21:16
 */
import { selectDialogueOption as npcSelectDialogueOption } from '../slices/npcSlice'; // Renamed for clarity
import { acceptQuest as questAcceptQuest, turnInQuest } from '../slices/questSlice'; // 移除不存在的addQuest导入
import { dialogues as dialogueConfig } from '../../config/ui/dialogueConfig';
import { setCurrentDialogue, setActiveQuest } from '../slices/dialogueSlice';
import rewardManager from '../RewardManager'; // 导入奖励管理器
// npcConfig is not directly used in this thunk, but good to keep if future logic needs it.
// import { npcs as npcConfig } from '../../config/npcConfig'; 

/**
 * Thunk to handle player selecting a dialogue option.
 * It dispatches actions to update dialogue state, start quests, and give rewards.
 */
export const handleDialogueOptionSelectThunk = (npcId, selectedOption) => async (dispatch, getState) => {
  const state = getState();
  const interactingNpc = state.npcs.npcs[npcId];
  
  if (!interactingNpc || !selectedOption) {
    console.warn('[DialogueThunk] NPC or selected option not found', { npcId, selectedOption });
    return;
  }

  // 1. Get the current dialogue node *before* updating to the next one, to check for rewards on this node.
  const dialogueKey = interactingNpc.dialogueKey || 'default_greeting';
  const dialogueSet = dialogueConfig[dialogueKey] || dialogueConfig.default_greeting;
  const currentDialogueNodeId = interactingNpc.currentDialogueNodeId;
  const currentNode = dialogueSet?.nodes?.[currentDialogueNodeId];

  // 2. Dispatch action to update dialogue state (move to next node or end interaction)
  // This will internally handle if nextNode is null or action is END_INTERACTION
  dispatch(npcSelectDialogueOption({ npcId, option: selectedOption }));

  // 3. Handle actions defined in the selected option (e.g., START_QUEST, OPEN_SHOP)
  if (selectedOption.action) {
    switch (selectedOption.action.type) {
      case 'START_QUEST':
        if (selectedOption.action.questId) {
          // Check if quest is already active or completed to avoid duplicates
          const playerQuests = state.quests.playerQuests;
          const questAlreadyActive = Object.values(playerQuests).some(
            pq => pq.questDefId === selectedOption.action.questId && 
                  (pq.status === 'IN_PROGRESS' || pq.status === 'COMPLETED_PENDING_TURN_IN' || pq.status === 'TURNED_IN')
          );
          if (!questAlreadyActive) {
            dispatch(questAcceptQuest(selectedOption.action.questId));
            console.log(`[DialogueThunk] Quest '${selectedOption.action.questId}' accepted via dialogue.`);
          } else {
            console.log(`[DialogueThunk] Quest '${selectedOption.action.questId}' is already active or completed.`);
          }
        }
        break;
      case 'OPEN_SHOP':
        // Assuming a UI slice handles shop visibility
        // dispatch(uiSlice.actions.openShop(selectedOption.action.shopId));
        console.log(`[DialogueThunk] Action: Open shop '${selectedOption.action.shopId}'`);
        break;
      // Add more action types as needed (e.g., TRIGGER_EVENT, TELEPORT_PLAYER)
      default:
        break;
    }
  }

  // 4. Handle rewards defined on the current dialogue node (the one just completed)
  if (currentNode && currentNode.rewards) {
    const rewardItems = [];
    
    currentNode.rewards.forEach(reward => {
      switch (reward.type) {
        case 'ITEM':
          if (reward.itemId && reward.quantity) {
            // 收集物品奖励，稍后统一分发
            rewardItems.push({
              id: reward.itemId,
              quantity: reward.quantity || 1
            });
            console.log(`[DialogueThunk] 准备奖励物品: ${reward.itemId}, 数量: ${reward.quantity}`);
          }
          break;
        case 'GOLD':
          // 直接给予金币奖励
          rewardManager.giveGoldReward(reward.amount, 'dialogue');
          console.log(`[DialogueThunk] 获得金币: ${reward.amount}`);
          break;
        // Add more reward types (XP, FACTION_REP, etc.)
      }
    });

    // 统一分发物品奖励
    if (rewardItems.length > 0) {
      rewardManager.giveItemRewards(rewardItems, 'dialogue').then(results => {
        console.log('[DialogueThunk] 对话奖励已分发:', results);
      }).catch(error => {
        console.error('[DialogueThunk] 对话奖励分发失败:', error);
      });
    }
  }

  // 5. If the interaction ended as a result of selectDialogueOption (e.g., nextNode was null or action was END_INTERACTION)
  // we might need to re-check the state to see if interactingWithNpcId is now null.
  // The `npcSlice.actions.selectDialogueOption` reducer itself handles setting interactingWithNpcId to null.
}; 