export const QUEST_TYPES = {
  STORY: 'STORY',       // 剧情任务，可能包含多个步骤
  KILL: 'KILL',         // 击杀特定目标
  COLLECT: 'COLLECT',     // 收集特定物品
  // EXPLORE: 'EXPLORE', // 探索特定区域 (未来可能添加)
  // ESCORT: 'ESCORT',   // 护送NPC (未来可能添加)
};

export const QUEST_STATUS = {
  LOCKED: 'LOCKED',             // 未达到前置条件，不可见或不可接
  AVAILABLE: 'AVAILABLE',         // 可接取
  IN_PROGRESS: 'IN_PROGRESS',     // 已接取，进行中
  COMPLETED_PENDING_TURN_IN: 'COMPLETED_PENDING_TURN_IN', // 所有目标完成，等待交付
  TURNED_IN: 'TURNED_IN',         // 已交付，奖励已发放
  FAILED: 'FAILED',               // 任务失败
};

export const OBJECTIVE_TYPES = {
  TALK_TO_NPC: 'TALK_TO_NPC',
  KILL_MONSTERS: 'KILL_MONSTERS',
  COLLECT_ITEMS: 'COLLECT_ITEMS',
  REACH_LOCATION: 'REACH_LOCATION', // 未来可能，需要地图坐标系统支持
  INTERACT_OBJECT: 'INTERACT_OBJECT', // 与特定地图对象互动
};

/**
 * @typedef {Object} QuestObjective
 * @property {string} id - 目标唯一ID (例如 "kill_goblins_obj1")
 * @property {OBJECTIVE_TYPES} type - 目标类型
 * @property {string} description - 目标描述 (例如 "击杀5只哥布林")
 * @property {string} [targetId] - 目标ID (例如怪物ID 'goblin_grunt', 物品ID 'herb_sunsummonal', NPC_ID 'npc_old_man')
 * @property {string} [targetName] - 目标名称 (用于显示，例如 "哥布林投手", "阳光草")
 * @property {number} [requiredAmount] - 需要的数量 (用于击杀/收集类)
 * @property {number} [currentAmount] - 当前完成数量 (用于击杀/收集类)
 * @property {boolean} [isCompleted] - 该目标是否已完成
 * @property {string} [relatedNpcId] - 与此目标相关的NPC ID (例如 TALK_TO_NPC的目标)
 * @property {Object} [targetLocation] - 目标地点 {x, y, mapId} (用于 REACH_LOCATION)
 */

/**
 * @typedef {Object} QuestReward
 * @property {number} [experience] - 奖励经验值
 * @property {number} [gold] - 奖励金币
 * @property {Array<{itemId: string, quantity: number}>} [items] - 奖励物品
 * @property {string} [unlocksQuestId] - 完成此任务后解锁的新任务ID
 * @property {Object} [reputation] - 声望变化 { factionId: string, change: number }
 */

/**
 * @typedef {Object} QuestDefinition
 * @property {string} id - 任务唯一ID (例如 "main_story_001", "kill_goblins_01")
 * @property {string} title - 任务标题 (例如 "村长的烦恼")
 * @property {string} description - 任务详细描述
 * @property {QUEST_TYPES} type - 任务类型
 * @property {string} [giverNpcId] - 任务给予者NPC的ID
 * @property {string} [turnInNpcId] - 任务交付对象NPC的ID (可能与giverNpcId相同)
 * @property {Array<QuestObjective>} objectives - 任务目标列表
 * @property {Array<string>} [prerequisites] - 前置任务ID列表 (需要完成这些任务才能接取此任务)
 * @property {number} [requiredLevel] - 最低接取等级
 * @property {QuestReward} rewards - 任务奖励
 * @property {string} [nextQuestInChainId] - 如果是系列任务，下一个任务的ID
 * @property {boolean} [isRepeatable] - 是否为可重复任务
 * @property {Object<string, string>} [dialogues] - 相关对话 { start: "...", inProgress: "...", readyToComplete: "...", completed: "..."}
 */

/** @type {Object<string, QuestDefinition>} */
export const quests = {
  // --- 示例长剧情任务 ---
  "main_story_001_messenger": {
    id: "main_story_001_messenger",
    title: "新手的旅程：遗失的包裹",
    description: "村口的卫兵似乎遗失了一个重要的包裹，他看起来很焦急。去问问他发生了什么事，看看能不能帮上忙。",
    type: QUEST_TYPES.STORY,
    giverNpcId: "npc_village_guard_01", // 假设的NPC ID
    turnInNpcId: "npc_village_guard_01",
    requiredLevel: 1,
    objectives: [
      { 
        id: "ms001_obj1_talk_guard",
        type: OBJECTIVE_TYPES.TALK_TO_NPC, 
        description: "与村口卫兵对话，了解情况。",
        relatedNpcId: "npc_village_guard_01",
        isCompleted: false,
      },
      // 后续目标可以在TALK_TO_NPC完成后动态添加或在此预定义但设为未激活
    ],
    rewards: {
      experience: 50,
      // gold: 10,
    },
    nextQuestInChainId: "main_story_002_find_package", // 下一个剧情任务
    dialogues: {
      start: "你好冒险者，我遇到了大麻烦！你能帮我吗？",
      inProgress: "找到关于包裹的线索了吗？",
      readyToComplete: "太好了！你找到线索了！", // 或这个剧情直接转到下一个
    }
  },
  "main_story_002_find_package": {
    id: "main_story_002_find_package",
    title: "新手的旅程：寻找包裹",
    description: "卫兵说包裹可能被附近的哥布林抢走了。他请求你帮忙找回包裹。包裹里似乎装着给村长的药材。",
    type: QUEST_TYPES.STORY,
    giverNpcId: "npc_village_guard_01",
    turnInNpcId: "npc_village_chief_01", // 最终交给村长
    prerequisites: ["main_story_001_messenger"], // 需要完成前一个任务
    requiredLevel: 1,
    objectives: [
      {
        id: "ms002_obj1_kill_goblins",
        type: OBJECTIVE_TYPES.KILL_MONSTERS,
        description: "在村外击败哥布林，它们可能会掉落包裹的线索或者直接掉落包裹。",
        targetId: "monster_goblin_thief", // 假设的哥布林盗贼ID
        targetName: "哥布林盗贼",
        requiredAmount: 3, // 击杀3个哥布林盗贼以增加掉落机会
        currentAmount: 0,
      },
      {
        id: "ms002_obj2_collect_package",
        type: OBJECTIVE_TYPES.COLLECT_ITEMS,
        description: "找到卫兵遗失的包裹。",
        targetId: "item_lost_package_01", // 假设的包裹物品ID
        targetName: "遗失的包裹",
        requiredAmount: 1,
        currentAmount: 0,
      },
      {
        id: "ms002_obj3_talk_chief",
        type: OBJECTIVE_TYPES.TALK_TO_NPC,
        description: "将包裹交给村长。",
        relatedNpcId: "npc_village_chief_01",
        isCompleted: false, // 只有在COLLECT_ITEMS完成后才激活或可完成
      }
    ],
    rewards: {
      experience: 150,
      gold: 50,
      items: [{ itemId: "item_basic_sword_01", quantity: 1 }]
    },
    dialogues: {
      start: "那些该死的哥布林！请帮我找回包裹，万分感谢！",
      inProgress: "包裹还没找到吗？村长等着急用呢。",
      readyToComplete: "你找到了！太感谢你了，这是给你的报酬。",
    }
  },

  // --- 示例击杀任务 ---
  "kill_wolves_01": {
    id: "kill_wolves_01",
    title: "清除狼患",
    description: "森林边缘的野狼最近频繁出没，威胁到了村民的安全。猎人发布了悬赏，希望能有人清除这些害兽。",
    type: QUEST_TYPES.KILL,
    giverNpcId: "npc_hunter_john", // 假设的猎人NPC
    turnInNpcId: "npc_hunter_john",
    requiredLevel: 3,
    objectives: [
      {
        id: "kw01_obj1_kill_wolves",
        type: OBJECTIVE_TYPES.KILL_MONSTERS,
        description: "击杀5只森林野狼。",
        targetId: "monster_forest_wolf", // 假设的野狼怪物ID
        targetName: "森林野狼",
        requiredAmount: 5,
        currentAmount: 0,
      }
    ],
    rewards: {
      experience: 100,
      gold: 30,
      // items: [{ itemId: "item_wolf_pelt", quantity: 2 }]
    },
    isRepeatable: true, // 假设这是个可重复的日常任务
    dialogues: {
      start: "那些狼崽子越来越多了，帮我清理一些吧，我会给你报酬的。",
      inProgress: "还没杀够数量吗？小心点，那些狼很凶。",
      readyToComplete: "干得不错！森林暂时安全了。这是你的奖励。",
    }
  },

  // --- 示例收集任务 ---
  "collect_herbs_01": {
    id: "collect_herbs_01",
    title: "草药收集",
    description: "村里的药剂师需要一些特定的草药来制作治疗药水。她承诺会给帮忙的人一些好处。",
    type: QUEST_TYPES.COLLECT,
    giverNpcId: "npc_alchemist_lisa", // 假设的药剂师NPC
    turnInNpcId: "npc_alchemist_lisa",
    requiredLevel: 2,
    objectives: [
      {
        id: "ch01_obj1_collect_herbs",
        type: OBJECTIVE_TYPES.COLLECT_ITEMS,
        description: "收集3株[阳光草]。", // [阳光草] 可以考虑用特定标记，方便后续解析和高亮
        targetId: "item_herb_sunsummonal", // 假设的阳光草物品ID
        targetName: "阳光草",
        requiredAmount: 3,
        currentAmount: 0,
      }
    ],
    rewards: {
      experience: 70,
      items: [{ itemId: "item_healing_potion_small", quantity: 2 }]
    },
    dialogues: {
      start: "我需要一些阳光草来制作药剂，你能帮我收集一些吗？它们通常长在向阳的山坡上。",
      inProgress: "阳光草收集得怎么样了？",
      readyToComplete: "这些阳光草的品质真好！非常感谢，这些药水是给你的。",
    }
  },
};

// 辅助函数 (可选, 也可以放在slice或utils中)
export const getQuestById = (questId) => {
  return quests[questId] || null;
};

export const getQuestObjective = (questId, objectiveId) => {
  const quest = getQuestById(questId);
  if (!quest) return null;
  return quest.objectives.find(obj => obj.id === objectiveId) || null;
};

// TODO:
// - NPC配置：每个NPC有哪些任务可以提供 (giverNpcId在这里定义了，但NPC自身也需要知道)
// - 怪物掉落配置：某些任务物品 (如剧情任务中的 "遗失的包裹") 可能需要特定怪物掉落
// - 物品配置：确保任务相关的物品 (item_lost_package_01, item_herb_sunsummonal) 在物品配置中有定义 