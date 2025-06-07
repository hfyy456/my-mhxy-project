/**
 * NPC实体类 - 面向对象设计
 * 核心设计原则：封装、单一职责、无位置概念
 * 
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-07 
 */

import { EventEmitter } from "events";
import { generateUniqueId } from "@/utils/idUtils";
import { UNIQUE_ID_PREFIXES, NPC_TYPES, NPC_STATES, DIALOGUE_STATES } from "@/config/enumConfig";

/**
 * NPC实体类
 * 特点：无位置概念，可动态分配到不同场景
 */
class Npc extends EventEmitter {
  constructor(data = {}) {
    super();
    
    // 基础属性
    this.id = data.id || generateUniqueId(UNIQUE_ID_PREFIXES.NPC);
    this.templateId = data.templateId || ""; // 模板ID，用于从配置加载基础数据
    this.name = data.name || "未命名NPC";
    this.displayName = data.displayName || this.name; // 显示名称，可以动态修改
    this.description = data.description || "";
    
    // 外观属性
    this.sprite = data.sprite || "default_npc.png";
    this.avatar = data.avatar || null;
    this.animations = data.animations || {};
    
    // 类型和状态
    this.type = data.type || NPC_TYPES.COMMON; // 普通、商人、任务、特殊等
    this.state = data.state || NPC_STATES.IDLE; // 空闲、忙碌、对话中等
    this.level = data.level || 1;
    this.faction = data.faction || "neutral"; // 阵营
    
    // 对话系统
    this.dialogueKey = data.dialogueKey || "default_greeting";
    this.currentDialogueNodeId = null;
    this.dialogueState = DIALOGUE_STATES.IDLE;
    this.dialogueHistory = []; // 对话历史记录
    
    // 功能配置
    this.functions = {
      canTrade: data.functions?.canTrade || false, // 可交易
      canGiveQuests: data.functions?.canGiveQuests || false, // 可发布任务
      canTeach: data.functions?.canTeach || false, // 可教授技能
      canUpgrade: data.functions?.canUpgrade || false, // 可升级装备
      canHeal: data.functions?.canHeal || false, // 可治疗
      ...data.functions
    };
    
    // 关联数据
    this.questIds = data.questIds || []; // 关联的任务ID列表
    this.shopId = data.shopId || null; // 商店ID
    this.teachableSkills = data.teachableSkills || []; // 可教授的技能
    this.services = data.services || []; // 提供的服务列表
    
    // 场景分配（核心特性：可动态分配到不同场景）
    this.assignments = {
      dungeons: data.assignments?.dungeons || [], // 分配到的副本
      nodes: data.assignments?.nodes || [], // 分配到的节点
      quests: data.assignments?.quests || [], // 分配到的任务
      homestead: data.assignments?.homestead || null, // 分配到的家园
      events: data.assignments?.events || [], // 分配到的事件
      ...data.assignments
    };
    
    // 动态属性
    this.attributes = {
      friendliness: data.attributes?.friendliness || 50, // 友好度
      reputation: data.attributes?.reputation || 0, // 声望
      trust: data.attributes?.trust || 0, // 信任度
      ...data.attributes
    };
    
    // 条件和限制
    this.conditions = {
      levelRequirement: data.conditions?.levelRequirement || 1, // 等级要求
      questRequirements: data.conditions?.questRequirements || [], // 任务要求
      itemRequirements: data.conditions?.itemRequirements || [], // 物品要求
      timeRequirements: data.conditions?.timeRequirements || null, // 时间要求
      ...data.conditions
    };
    
    // 行为配置
    this.behavior = {
      greeting: data.behavior?.greeting || "default",
      farewell: data.behavior?.farewell || "default", 
      idle: data.behavior?.idle || [],
      special: data.behavior?.special || {},
      ...data.behavior
    };
    
    // 元数据
    this.metadata = {
      createdAt: data.metadata?.createdAt || Date.now(),
      updatedAt: data.metadata?.updatedAt || Date.now(),
      version: data.metadata?.version || "1.0.0",
      author: data.metadata?.author || "system",
      tags: data.metadata?.tags || [],
      ...data.metadata
    };
    
    // 内部状态
    this._isActive = false;
    this._currentInteractionId = null;
    this._manager = null;
    
    console.log(`[Npc] 创建NPC: ${this.name} (${this.id})`);
  }
  
  // ===========================================
  // 核心方法
  // ===========================================
  
  /**
   * 获取NPC的完整配置数据
   */
  getConfig() {
    return {
      id: this.id,
      templateId: this.templateId,
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      sprite: this.sprite,
      type: this.type,
      functions: { ...this.functions },
      assignments: { ...this.assignments },
      attributes: { ...this.attributes },
      conditions: { ...this.conditions },
      behavior: { ...this.behavior }
    };
  }
  
  /**
   * 检查是否满足交互条件
   */
  canInteract(player) {
    // 检查等级要求
    if (player.level < this.conditions.levelRequirement) {
      return { canInteract: false, reason: "等级不足" };
    }
    
    // 检查任务要求
    if (this.conditions.questRequirements.length > 0) {
      const hasRequiredQuests = this.conditions.questRequirements.every(questId => 
        player.completedQuests?.includes(questId)
      );
      if (!hasRequiredQuests) {
        return { canInteract: false, reason: "任务条件不满足" };
      }
    }
    
    // 检查物品要求
    if (this.conditions.itemRequirements.length > 0) {
      const hasRequiredItems = this.conditions.itemRequirements.every(itemId => 
        player.inventory?.hasItem(itemId)
      );
      if (!hasRequiredItems) {
        return { canInteract: false, reason: "缺少必需物品" };
      }
    }
    
    return { canInteract: true, reason: "满足条件" };
  }
  
  /**
   * 开始对话
   */
  startDialogue(interactionId = null) {
    if (this._isActive) {
      console.warn(`[Npc] ${this.name} 已在对话中`);
      return false;
    }
    
    this._isActive = true;
    this._currentInteractionId = interactionId || generateUniqueId(UNIQUE_ID_PREFIXES.INTERACTION);
    this.dialogueState = DIALOGUE_STATES.ACTIVE;
    this.currentDialogueNodeId = "initial";
    
    this.emit("dialogue_started", {
      npcId: this.id,
      interactionId: this._currentInteractionId,
      dialogueKey: this.dialogueKey
    });
    
    console.log(`[Npc] ${this.name} 开始对话`);
    return true;
  }
  
  /**
   * 结束对话
   */
  endDialogue() {
    if (!this._isActive) {
      return false;
    }
    
    const interactionId = this._currentInteractionId;
    
    this._isActive = false;
    this._currentInteractionId = null;
    this.dialogueState = DIALOGUE_STATES.IDLE;
    this.currentDialogueNodeId = null;
    
    // 记录对话历史
    this.dialogueHistory.push({
      interactionId,
      startTime: Date.now(),
      endTime: Date.now()
    });
    
    this.emit("dialogue_ended", {
      npcId: this.id,
      interactionId
    });
    
    console.log(`[Npc] ${this.name} 结束对话`);
    return true;
  }
  
  /**
   * 处理对话选项
   */
  selectDialogueOption(option) {
    if (!this._isActive || this.dialogueState !== DIALOGUE_STATES.ACTIVE) {
      console.warn(`[Npc] ${this.name} 当前无法处理对话选项`);
      return false;
    }
    
    this.currentDialogueNodeId = option.nextNode;
    
    this.emit("dialogue_option_selected", {
      npcId: this.id,
      interactionId: this._currentInteractionId,
      option,
      nextNode: option.nextNode
    });
    
    // 如果选项包含动作，触发相应事件
    if (option.action) {
      this.emit("dialogue_action", {
        npcId: this.id,
        interactionId: this._currentInteractionId,
        action: option.action
      });
    }
    
    return true;
  }
  
  // ===========================================
  // 场景分配方法
  // ===========================================
  
  /**
   * 分配到副本
   */
  assignToDungeon(dungeonId, role = "npc") {
    if (!this.assignments.dungeons.includes(dungeonId)) {
      this.assignments.dungeons.push(dungeonId);
      this.emit("assigned_to_dungeon", { npcId: this.id, dungeonId, role });
      console.log(`[Npc] ${this.name} 分配到副本: ${dungeonId}`);
    }
  }
  
  /**
   * 从副本移除
   */
  removeFromDungeon(dungeonId) {
    const index = this.assignments.dungeons.indexOf(dungeonId);
    if (index > -1) {
      this.assignments.dungeons.splice(index, 1);
      this.emit("removed_from_dungeon", { npcId: this.id, dungeonId });
      console.log(`[Npc] ${this.name} 从副本移除: ${dungeonId}`);
    }
  }
  
  /**
   * 分配到节点
   */
  assignToNode(nodeId, role = "npc") {
    if (!this.assignments.nodes.includes(nodeId)) {
      this.assignments.nodes.push(nodeId);
      this.emit("assigned_to_node", { npcId: this.id, nodeId, role });
      console.log(`[Npc] ${this.name} 分配到节点: ${nodeId}`);
    }
  }
  
  /**
   * 从节点移除
   */  
  removeFromNode(nodeId) {
    const index = this.assignments.nodes.indexOf(nodeId);
    if (index > -1) {
      this.assignments.nodes.splice(index, 1);
      this.emit("removed_from_node", { npcId: this.id, nodeId });
      console.log(`[Npc] ${this.name} 从节点移除: ${nodeId}`);
    }
  }
  
  /**
   * 分配到任务
   */
  assignToQuest(questId, role = "questgiver") {
    if (!this.assignments.quests.includes(questId)) {
      this.assignments.quests.push(questId);
      this.emit("assigned_to_quest", { npcId: this.id, questId, role });
      console.log(`[Npc] ${this.name} 分配到任务: ${questId}`);
    }
  }
  
  /**
   * 从任务移除
   */
  removeFromQuest(questId) {
    const index = this.assignments.quests.indexOf(questId);
    if (index > -1) {
      this.assignments.quests.splice(index, 1);
      this.emit("removed_from_quest", { npcId: this.id, questId });
      console.log(`[Npc] ${this.name} 从任务移除: ${questId}`);
    }
  }
  
  /**
   * 分配到家园
   */
  assignToHomestead(homesteadId, role = "resident") {
    this.assignments.homestead = homesteadId;
    this.emit("assigned_to_homestead", { npcId: this.id, homesteadId, role });
    console.log(`[Npc] ${this.name} 分配到家园: ${homesteadId}`);
  }
  
  /**
   * 从家园移除
   */
  removeFromHomestead() {
    const homesteadId = this.assignments.homestead;
    this.assignments.homestead = null;
    this.emit("removed_from_homestead", { npcId: this.id, homesteadId });
    console.log(`[Npc] ${this.name} 从家园移除`);
  }
  
  // ===========================================
  // 属性和状态管理
  // ===========================================
  
  /**
   * 更新属性
   */
  updateAttribute(attributeName, value, operation = "set") {
    const oldValue = this.attributes[attributeName] || 0;
    
    switch (operation) {
      case "add":
        this.attributes[attributeName] = oldValue + value;
        break;
      case "subtract":
        this.attributes[attributeName] = Math.max(0, oldValue - value);
        break;
      case "multiply":
        this.attributes[attributeName] = oldValue * value;
        break;
      default:
        this.attributes[attributeName] = value;
    }
    
    this.emit("attribute_updated", {
      npcId: this.id,
      attributeName,
      oldValue,
      newValue: this.attributes[attributeName],
      operation
    });
  }
  
  /**
   * 设置状态
   */
  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    
    this.emit("state_changed", {
      npcId: this.id,
      oldState,
      newState
    });
    
    console.log(`[Npc] ${this.name} 状态变更: ${oldState} -> ${newState}`);
  }
  
  /**
   * 获取是否处于活动状态
   */
  isActive() {
    return this._isActive;
  }
  
  /**
   * 获取当前交互ID
   */
  getCurrentInteractionId() {
    return this._currentInteractionId;
  }
  
  // ===========================================
  // 工具方法
  // ===========================================
  
  /**
   * 检查是否分配到特定场景
   */
  isAssignedTo(sceneType, sceneId) {
    switch (sceneType) {
      case "dungeon":
        return this.assignments.dungeons.includes(sceneId);
      case "node":
        return this.assignments.nodes.includes(sceneId);
      case "quest":
        return this.assignments.quests.includes(sceneId);
      case "homestead":
        return this.assignments.homestead === sceneId;
      default:
        return false;
    }
  }
  
  /**
   * 获取所有分配信息
   */
  getAllAssignments() {
    return {
      dungeons: [...this.assignments.dungeons],
      nodes: [...this.assignments.nodes],
      quests: [...this.assignments.quests],
      homestead: this.assignments.homestead,
      events: [...this.assignments.events]
    };
  }
  
  /**
   * 重置NPC状态
   */
  reset() {
    this.endDialogue();
    this.setState(NPC_STATES.IDLE);
    this.dialogueHistory = [];
    this._currentInteractionId = null;
    
    this.emit("npc_reset", { npcId: this.id });
    console.log(`[Npc] ${this.name} 状态已重置`);
  }
  
  /**
   * 设置管理器引用
   */
  setManager(manager) {
    this._manager = manager;
  }
  
  /**
   * 获取序列化数据
   */
  toJSON() {
    return {
      id: this.id,
      templateId: this.templateId,
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      sprite: this.sprite,
      avatar: this.avatar,
      animations: { ...this.animations },
      type: this.type,
      state: this.state,
      level: this.level,
      faction: this.faction,
      dialogueKey: this.dialogueKey,
      currentDialogueNodeId: this.currentDialogueNodeId,
      dialogueState: this.dialogueState,
      functions: { ...this.functions },
      questIds: [...this.questIds],
      shopId: this.shopId,
      teachableSkills: [...this.teachableSkills],
      services: [...this.services],
      assignments: {
        dungeons: [...this.assignments.dungeons],
        nodes: [...this.assignments.nodes],
        quests: [...this.assignments.quests],
        homestead: this.assignments.homestead,
        events: [...this.assignments.events]
      },
      attributes: { ...this.attributes },
      conditions: { ...this.conditions },
      behavior: { ...this.behavior },
      metadata: { ...this.metadata },
      dialogueHistory: [...this.dialogueHistory]
    };
  }
  
  /**
   * 从JSON数据创建NPC实例
   */
  static fromJSON(jsonData) {
    return new Npc(jsonData);
  }
}

export default Npc; 