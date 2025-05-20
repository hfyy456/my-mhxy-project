import { createSlice } from '@reduxjs/toolkit';
import { quests as allQuestDefinitions, QUEST_STATUS, OBJECTIVE_TYPES } from '@/config/questConfig';
import { nanoid } from 'nanoid'; // 用于生成唯一的运行时任务实例ID，如果需要的话

// Helper function to deep clone quest definitions for active quests
const cloneQuest = (quest) => JSON.parse(JSON.stringify(quest));

const initialState = {
  /** @type {Object<string, import('@/config/questConfig').QuestDefinition>} */
  allQuests: allQuestDefinitions, // 所有任务的定义，从配置加载
  
  /** @type {Object<string, PlayerQuestInstance>} */
  playerQuests: {}, // 玩家当前的任务实例 { runtimeQuestId: PlayerQuestInstance }
                    // runtimeQuestId 是玩家接取任务时生成的唯一ID
  
  // Potentially, we can also have specific lists for faster access in UI
  // availableQuestIds: [], // 基于玩家等级、已完成任务等动态计算得出
  // completedQuestIds: [], // 存放已完成的任务定义ID (非runtimeId)
};

/**
 * @typedef {import('@/config/questConfig').QuestDefinition} QuestDefinition
 * @typedef {import('@/config/questConfig').QuestObjective} QuestObjective
 */

/**
 * @typedef {Object} PlayerQuestInstance
 * @property {string} runtimeId - 玩家任务实例的唯一运行时ID
 * @property {string} questDefId - 对应的任务定义ID (来自allQuests)
 * @property {QUEST_STATUS} status - 当前任务状态
 * @property {Array<QuestObjective>} objectives - 任务目标的当前状态 (克隆自定义并包含进度)
 * @property {number} acceptedAt - 接取任务的时间戳 (可选)
 */

const questSlice = createSlice({
  name: 'quests',
  initialState,
  reducers: {
    initializePlayerQuests: (state) => {
      state.allQuests = allQuestDefinitions; // Ensure definitions are loaded
      state.playerQuests = {}; // Clear any existing player quests before pre-populating

      // 1. Auto-accept the first story quest
      const firstStoryQuestId = "main_story_001_messenger";
      const firstStoryQuestDef = state.allQuests[firstStoryQuestId];
      if (firstStoryQuestDef) {
        const storyRuntimeId = `pq_debug_${nanoid()}`;
        state.playerQuests[storyRuntimeId] = {
          runtimeId: storyRuntimeId,
          questDefId: firstStoryQuestId,
          status: QUEST_STATUS.IN_PROGRESS,
          objectives: cloneQuest(firstStoryQuestDef.objectives).map(obj => ({
            ...obj,
            currentAmount: 0,
            isCompleted: false,
          })),
          acceptedAt: Date.now(),
        };
      }

      // 2. Auto-accept kill_wolves_01 and set some progress
      const killWolvesQuestId = "kill_wolves_01";
      const killWolvesQuestDef = state.allQuests[killWolvesQuestId];
      if (killWolvesQuestDef) {
        const killRuntimeId = `pq_debug_${nanoid()}`;
        const killObjectives = cloneQuest(killWolvesQuestDef.objectives).map(obj => {
          if (obj.id === "kw01_obj1_kill_wolves") {
            return { ...obj, currentAmount: 2, isCompleted: false };
          }
          return { ...obj, currentAmount: 0, isCompleted: false };
        });
        state.playerQuests[killRuntimeId] = {
          runtimeId: killRuntimeId,
          questDefId: killWolvesQuestId,
          status: QUEST_STATUS.IN_PROGRESS,
          objectives: killObjectives,
          acceptedAt: Date.now(),
        };
      }

      // 3. Manually add a completed and turned-in collect_herbs_01 quest
      const collectHerbsQuestId = "collect_herbs_01";
      const collectHerbsQuestDef = state.allQuests[collectHerbsQuestId];
      if (collectHerbsQuestDef) {
        const collectRuntimeId = `pq_debug_${nanoid()}`;
        state.playerQuests[collectRuntimeId] = {
          runtimeId: collectRuntimeId,
          questDefId: collectHerbsQuestId,
          status: QUEST_STATUS.TURNED_IN,
          objectives: cloneQuest(collectHerbsQuestDef.objectives).map(obj => ({
            ...obj,
            currentAmount: obj.requiredAmount, // Mark as collected full amount
            isCompleted: true, // Mark objective as completed
          })),
          acceptedAt: Date.now() - 100000, // Accepted some time ago
        };
      }
      console.log("[QuestSlice] Pre-populated quests for UI testing.", state.playerQuests);
    },

    acceptQuest: (state, action) => {
      const questId = action.payload; // payload is questDefId
      const questDef = state.allQuests[questId];

      if (!questDef) {
        console.warn(`Quest definition not found: ${questId}`);
        return;
      }
      // Check if already accepted or completed (simplified check)
      if (Object.values(state.playerQuests).some(pq => pq.questDefId === questId && pq.status !== QUEST_STATUS.FAILED)) {
        console.warn(`Quest ${questId} already in progress or completed.`);
        return;
      }
      // TODO: Add more detailed prerequisite checks (level, other quests)

      const runtimeId = `pq_${nanoid()}`;
      /** @type {PlayerQuestInstance} */
      const newPlayerQuest = {
        runtimeId,
        questDefId: questId,
        status: QUEST_STATUS.IN_PROGRESS,
        objectives: cloneQuest(questDef.objectives).map(obj => ({
          ...obj,
          currentAmount: obj.currentAmount || 0, // Ensure currentAmount is initialized
          isCompleted: obj.isCompleted || false, // Ensure isCompleted is initialized
        })),
        acceptedAt: Date.now(),
      };
      state.playerQuests[runtimeId] = newPlayerQuest;
      // console.log(`Quest accepted: ${questDef.title} (Runtime ID: ${runtimeId})`);
    },

    updateQuestObjectiveProgress: (state, action) => {
      const { runtimeQuestId, objectiveId, progress } = action.payload; 
      // progress: { amount: number } for kill/collect, or { completed: true } for others

      const playerQuest = state.playerQuests[runtimeQuestId];
      if (!playerQuest) {
        console.warn(`Player quest instance not found: ${runtimeQuestId}`);
        return;
      }

      const objective = playerQuest.objectives.find(obj => obj.id === objectiveId);
      if (!objective) {
        console.warn(`Objective ${objectiveId} not found in quest ${playerQuest.questDefId}`);
        return;
      }

      if (objective.isCompleted) return; // Already completed

      let objectiveCompleted = false;
      if (objective.type === OBJECTIVE_TYPES.KILL_MONSTERS || objective.type === OBJECTIVE_TYPES.COLLECT_ITEMS) {
        objective.currentAmount = (objective.currentAmount || 0) + (progress.amount || 0);
        if (objective.currentAmount >= objective.requiredAmount) {
          objective.currentAmount = objective.requiredAmount; // Cap at required amount
          objectiveCompleted = true;
        }
      } else if (objective.type === OBJECTIVE_TYPES.TALK_TO_NPC || objective.type === OBJECTIVE_TYPES.REACH_LOCATION || objective.type === OBJECTIVE_TYPES.INTERACT_OBJECT) {
        if (progress.completed) {
          objectiveCompleted = true;
        }
      }
      
      if (objectiveCompleted) {
        objective.isCompleted = true;
        // console.log(`Objective ${objectiveId} completed for quest ${playerQuest.questDefId}`);
      }

      // Check if all objectives for this quest are completed
      const allObjectivesCompleted = playerQuest.objectives.every(obj => obj.isCompleted);
      if (allObjectivesCompleted && playerQuest.status === QUEST_STATUS.IN_PROGRESS) {
        playerQuest.status = QUEST_STATUS.COMPLETED_PENDING_TURN_IN;
        // console.log(`Quest ${playerQuest.questDefId} ready to be turned in.`);
      }
    },

    turnInQuest: (state, action) => {
      const { runtimeQuestId } = action.payload;
      const playerQuest = state.playerQuests[runtimeQuestId];

      if (!playerQuest) {
        console.warn(`Player quest instance not found: ${runtimeQuestId}`);
        return;
      }

      if (playerQuest.status !== QUEST_STATUS.COMPLETED_PENDING_TURN_IN) {
        console.warn(`Quest ${playerQuest.questDefId} is not ready to be turned in.`);
        return;
      }

      const questDef = state.allQuests[playerQuest.questDefId];
      if (!questDef) {
        // Should not happen if data integrity is maintained
        console.error(`Quest definition ${playerQuest.questDefId} not found during turn-in!`);
        // Potentially mark as failed or remove to prevent further issues
        delete state.playerQuests[runtimeQuestId];
        return;
      }

      // TODO: Logic to give rewards to player (dispatch actions to update player stats, inventory, etc.)
      // console.log(`Turning in quest: ${questDef.title}. Rewards:`, questDef.rewards);
      // Example: dispatch(addExperience(questDef.rewards.experience));
      //          dispatch(addGold(questDef.rewards.gold));
      //          questDef.rewards.items.forEach(item => dispatch(addItemToInventory({itemId: item.itemId, quantity: item.quantity})));

      playerQuest.status = QUEST_STATUS.TURNED_IN;
      // console.log(`Quest ${questDef.title} turned in successfully.`);

      // If there's a next quest in chain and it's not locked/already active, make it available or auto-accept?
      // For now, we assume UI or NPC interaction will handle offering the next quest.
      if (questDef.nextQuestInChainId) {
        // console.log(`Next quest in chain available: ${questDef.nextQuestInChainId}`);
        // Potentially: dispatch(questSlice.actions.makeQuestAvailable(questDef.nextQuestInChainId));
      }
       // If the quest is not repeatable, we might remove it from playerQuests or move to a completed log.
       // For simplicity, we currently keep it with TURNED_IN status.
       // If repeatable, its status might revert to AVAILABLE or require re-accepting.
    },

    abandonQuest: (state, action) => {
      const { runtimeQuestId } = action.payload;
      const playerQuest = state.playerQuests[runtimeQuestId];

      if (!playerQuest) {
        console.warn(`Player quest instance not found: ${runtimeQuestId}`);
        return;
      }

      const questDef = state.allQuests[playerQuest.questDefId];
      // console.log(`Quest abandoned: ${questDef?.title || runtimeQuestId}`);
      // Optionally, mark as FAILED or simply remove.
      // If objectives have progress, they will be reset if the quest is accepted again (due to cloning).
      delete state.playerQuests[runtimeQuestId];
    },
    
    // Could add more reducers like:
    // failQuest: (state, action) => { ... }
    // loadPlayerQuests: (state, action) => { state.playerQuests = action.payload; } // For loading saved game
  }
});

export const {
  initializePlayerQuests,
  acceptQuest,
  updateQuestObjectiveProgress,
  turnInQuest,
  abandonQuest,
} = questSlice.actions;

export default questSlice.reducer;

// Selectors
export const selectAllQuestDefinitions = (state) => state.quests.allQuests;
export const selectPlayerQuests = (state) => state.quests.playerQuests;
export const selectActivePlayerQuests = (state) => {
  return Object.values(state.quests.playerQuests).filter(
    q => q.status === QUEST_STATUS.IN_PROGRESS || q.status === QUEST_STATUS.COMPLETED_PENDING_TURN_IN
  );
};
export const selectCompletedPlayerQuests = (state) => {
  return Object.values(state.quests.playerQuests).filter(q => q.status === QUEST_STATUS.TURNED_IN);
};

// Selector to get a specific player quest instance by its runtimeId
export const selectPlayerQuestByRuntimeId = (state, runtimeQuestId) => state.quests.playerQuests[runtimeQuestId];

// Selector to get available quests (basic example, needs refinement)
// This is a very basic example. A real implementation would check prerequisites, level, etc.
export const selectAvailableQuests = (state) => {
  const allDefs = state.quests.allQuests;
  const activeOrCompletedDefIds = new Set(
    Object.values(state.quests.playerQuests).map(pq => pq.questDefId)
  );

  return Object.values(allDefs).filter(questDef => {
    if (activeOrCompletedDefIds.has(questDef.id)) return false; // Already active or done (simplification)
    
    // Check prerequisites (basic check for now)
    if (questDef.prerequisites && questDef.prerequisites.length > 0) {
      const completedDefIds = new Set(
        Object.values(state.quests.playerQuests)
          .filter(pq => pq.status === QUEST_STATUS.TURNED_IN)
          .map(pq => pq.questDefId)
      );
      for (const prereqId of questDef.prerequisites) {
        if (!completedDefIds.has(prereqId)) {
          return false; // Prerequisite not met
        }
      }
    }
    // TODO: Check player level (needs access to player slice)
    // const playerLevel = state.player.stats.level; 
    // if (questDef.requiredLevel && playerLevel < questDef.requiredLevel) return false;

    return true;
  });
}; 