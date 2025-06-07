/**
 * NPC管理器 - 面向对象设计
 * 负责NPC的创建、管理、场景分配等核心功能
 * 
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-07
 */

import { EventEmitter } from "events";
import Npc from "@/entities/Npc";
import { generateUniqueId } from "@/utils/idUtils";
import { UNIQUE_ID_PREFIXES, NPC_TYPES, NPC_STATES } from "@/config/enumConfig";

/**
 * NPC工厂类
 */
class NpcFactory {
  /**
   * 从模板创建NPC实例
   */
  static createFromTemplate(templateId, templateData, overrides = {}) {
    const npcData = {
      templateId,
      ...templateData,
      ...overrides,
      id: overrides.id || generateUniqueId(UNIQUE_ID_PREFIXES.NPC)
    };
    
    return new Npc(npcData);
  }
  
  /**
   * 从JSON数据创建NPC实例
   */
  static createFromJSON(jsonData) {
    return Npc.fromJSON(jsonData);
  }
  
  /**
   * 创建空白NPC实例
   */
  static createBlank(overrides = {}) {
    return new Npc(overrides);
  }
}

/**
 * NPC管理器类
 * 核心功能：NPC生命周期管理、场景分配、交互控制
 */
class NpcManager extends EventEmitter {
  constructor() {
    super();
    
    // NPC存储
    this.npcs = new Map(); // 所有NPC实例 Map<npcId, Npc>
    this.templates = new Map(); // NPC模板 Map<templateId, TemplateData>
    
    // 场景分配索引
    this.assignmentIndex = {
      dungeons: new Map(), // Map<dungeonId, Set<npcId>>
      nodes: new Map(), // Map<nodeId, Set<npcId>>
      quests: new Map(), // Map<questId, Set<npcId>>
      homesteads: new Map(), // Map<homesteadId, npcId>
      events: new Map() // Map<eventId, Set<npcId>>
    };
    
    // 状态管理
    this.activeInteractions = new Map(); // Map<interactionId, {npcId, playerId, startTime}>
    this.statistics = {
      totalNpcs: 0,
      activeNpcs: 0,
      totalInteractions: 0,
      createdAt: Date.now()
    };
    
    console.log("[NpcManager] NPC管理器已初始化");
  }
  
  // ===========================================
  // 模板管理
  // ===========================================
  
  /**
   * 注册NPC模板
   */
  registerTemplate(templateId, templateData) {
    if (this.templates.has(templateId)) {
      console.warn(`[NpcManager] 模板 ${templateId} 已存在，将被覆盖`);
    }
    
    this.templates.set(templateId, { 
      ...templateData, 
      templateId,
      registeredAt: Date.now() 
    });
    
    this.emit("template_registered", { templateId, templateData });
    console.log(`[NpcManager] 注册模板: ${templateId}`);
  }
  
  /**
   * 批量注册模板
   */
  registerTemplates(templatesData) {
    Object.entries(templatesData).forEach(([templateId, templateData]) => {
      this.registerTemplate(templateId, templateData);
    });
  }
  
  /**
   * 获取模板
   */
  getTemplate(templateId) {
    return this.templates.get(templateId);
  }
  
  /**
   * 获取所有模板
   */
  getAllTemplates() {
    return Object.fromEntries(this.templates);
  }
  
  // ===========================================
  // NPC实例管理
  // ===========================================
  
  /**
   * 创建NPC实例
   */
  createNpc(templateId, overrides = {}) {
    const template = this.getTemplate(templateId);
    if (!template) {
      console.error(`[NpcManager] 模板 ${templateId} 不存在`);
      return null;
    }
    
    const npc = NpcFactory.createFromTemplate(templateId, template, overrides);
    npc.setManager(this);
    
    // 注册事件监听
    this._registerNpcEvents(npc);
    
    // 存储NPC
    this.npcs.set(npc.id, npc);
    this.statistics.totalNpcs++;
    
    this.emit("npc_created", { npcId: npc.id, templateId, npc });
    console.log(`[NpcManager] 创建NPC: ${npc.name} (${npc.id})`);
    
    return npc;
  }
  
  /**
   * 添加现有NPC实例
   */
  addNpc(npc) {
    if (!(npc instanceof Npc)) {
      console.error("[NpcManager] 传入的不是有效的NPC实例");
      return false;
    }
    
    if (this.npcs.has(npc.id)) {
      console.warn(`[NpcManager] NPC ${npc.id} 已存在`);
      return false;
    }
    
    npc.setManager(this);
    this._registerNpcEvents(npc);
    
    this.npcs.set(npc.id, npc);
    this.statistics.totalNpcs++;
    
    this.emit("npc_added", { npcId: npc.id, npc });
    console.log(`[NpcManager] 添加NPC: ${npc.name} (${npc.id})`);
    
    return true;
  }
  
  /**
   * 删除NPC实例
   */
  removeNpc(npcId) {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      console.warn(`[NpcManager] NPC ${npcId} 不存在`);
      return false;
    }
    
    // 清理分配关系
    this._cleanupNpcAssignments(npc);
    
    // 结束活动对话
    if (npc.isActive()) {
      npc.endDialogue();
    }
    
    // 移除事件监听
    npc.removeAllListeners();
    
    // 从存储中移除
    this.npcs.delete(npcId);
    this.statistics.totalNpcs--;
    
    this.emit("npc_removed", { npcId, npc });
    console.log(`[NpcManager] 移除NPC: ${npc.name} (${npcId})`);
    
    return true;
  }
  
  /**
   * 获取NPC实例
   */
  getNpc(npcId) {
    return this.npcs.get(npcId);
  }
  
  /**
   * 获取所有NPC
   */
  getAllNpcs() {
    return Array.from(this.npcs.values());
  }
  
  /**
   * 根据模板ID获取NPC列表
   */
  getNpcsByTemplate(templateId) {
    return this.getAllNpcs().filter(npc => npc.templateId === templateId);
  }
  
  /**
   * 根据类型获取NPC列表
   */
  getNpcsByType(type) {
    return this.getAllNpcs().filter(npc => npc.type === type);
  }
  
  // ===========================================
  // 场景分配管理
  // ===========================================
  
  /**
   * 分配NPC到副本
   */
  assignNpcToDungeon(npcId, dungeonId, role = "npc") {
    const npc = this.getNpc(npcId);
    if (!npc) {
      console.error(`[NpcManager] NPC ${npcId} 不存在`);
      return false;
    }
    
    // 在NPC对象上分配
    npc.assignToDungeon(dungeonId, role);
    
    // 更新索引
    if (!this.assignmentIndex.dungeons.has(dungeonId)) {
      this.assignmentIndex.dungeons.set(dungeonId, new Set());
    }
    this.assignmentIndex.dungeons.get(dungeonId).add(npcId);
    
    this.emit("npc_assigned_to_dungeon", { npcId, dungeonId, role });
    console.log(`[NpcManager] NPC ${npc.name} 分配到副本 ${dungeonId}`);
    
    return true;
  }
  
  /**
   * 从副本移除NPC
   */
  removeNpcFromDungeon(npcId, dungeonId) {
    const npc = this.getNpc(npcId);
    if (!npc) {
      console.error(`[NpcManager] NPC ${npcId} 不存在`);
      return false;
    }
    
    // 从NPC对象移除
    npc.removeFromDungeon(dungeonId);
    
    // 更新索引
    if (this.assignmentIndex.dungeons.has(dungeonId)) {
      this.assignmentIndex.dungeons.get(dungeonId).delete(npcId);
      if (this.assignmentIndex.dungeons.get(dungeonId).size === 0) {
        this.assignmentIndex.dungeons.delete(dungeonId);
      }
    }
    
    this.emit("npc_removed_from_dungeon", { npcId, dungeonId });
    console.log(`[NpcManager] NPC ${npc.name} 从副本 ${dungeonId} 移除`);
    
    return true;
  }
  
  /**
   * 分配NPC到节点
   */
  assignNpcToNode(npcId, nodeId, role = "npc") {
    const npc = this.getNpc(npcId);
    if (!npc) {
      console.error(`[NpcManager] NPC ${npcId} 不存在`);
      return false;
    }
    
    npc.assignToNode(nodeId, role);
    
    if (!this.assignmentIndex.nodes.has(nodeId)) {
      this.assignmentIndex.nodes.set(nodeId, new Set());
    }
    this.assignmentIndex.nodes.get(nodeId).add(npcId);
    
    this.emit("npc_assigned_to_node", { npcId, nodeId, role });
    console.log(`[NpcManager] NPC ${npc.name} 分配到节点 ${nodeId}`);
    
    return true;
  }
  
  /**
   * 从节点移除NPC
   */
  removeNpcFromNode(npcId, nodeId) {
    const npc = this.getNpc(npcId);
    if (!npc) {
      console.error(`[NpcManager] NPC ${npcId} 不存在`);
      return false;
    }
    
    npc.removeFromNode(nodeId);
    
    if (this.assignmentIndex.nodes.has(nodeId)) {
      this.assignmentIndex.nodes.get(nodeId).delete(npcId);
      if (this.assignmentIndex.nodes.get(nodeId).size === 0) {
        this.assignmentIndex.nodes.delete(nodeId);
      }
    }
    
    this.emit("npc_removed_from_node", { npcId, nodeId });
    console.log(`[NpcManager] NPC ${npc.name} 从节点 ${nodeId} 移除`);
    
    return true;
  }
  
  /**
   * 分配NPC到任务
   */
  assignNpcToQuest(npcId, questId, role = "questgiver") {
    const npc = this.getNpc(npcId);
    if (!npc) {
      console.error(`[NpcManager] NPC ${npcId} 不存在`);
      return false;
    }
    
    npc.assignToQuest(questId, role);
    
    if (!this.assignmentIndex.quests.has(questId)) {
      this.assignmentIndex.quests.set(questId, new Set());
    }
    this.assignmentIndex.quests.get(questId).add(npcId);
    
    this.emit("npc_assigned_to_quest", { npcId, questId, role });
    console.log(`[NpcManager] NPC ${npc.name} 分配到任务 ${questId}`);
    
    return true;
  }
  
  /**
   * 从任务移除NPC
   */
  removeNpcFromQuest(npcId, questId) {
    const npc = this.getNpc(npcId);
    if (!npc) {
      console.error(`[NpcManager] NPC ${npcId} 不存在`);
      return false;
    }
    
    npc.removeFromQuest(questId);
    
    if (this.assignmentIndex.quests.has(questId)) {
      this.assignmentIndex.quests.get(questId).delete(npcId);
      if (this.assignmentIndex.quests.get(questId).size === 0) {
        this.assignmentIndex.quests.delete(questId);
      }
    }
    
    this.emit("npc_removed_from_quest", { npcId, questId });
    console.log(`[NpcManager] NPC ${npc.name} 从任务 ${questId} 移除`);
    
    return true;
  }
  
  /**
   * 分配NPC到家园
   */
  assignNpcToHomestead(npcId, homesteadId, role = "resident") {
    const npc = this.getNpc(npcId);
    if (!npc) {
      console.error(`[NpcManager] NPC ${npcId} 不存在`);
      return false;
    }
    
    npc.assignToHomestead(homesteadId, role);
    this.assignmentIndex.homesteads.set(homesteadId, npcId);
    
    this.emit("npc_assigned_to_homestead", { npcId, homesteadId, role });
    console.log(`[NpcManager] NPC ${npc.name} 分配到家园 ${homesteadId}`);
    
    return true;
  }
  
  /**
   * 从家园移除NPC
   */
  removeNpcFromHomestead(npcId) {
    const npc = this.getNpc(npcId);
    if (!npc) {
      console.error(`[NpcManager] NPC ${npcId} 不存在`);
      return false;
    }
    
    const homesteadId = npc.assignments.homestead;
    npc.removeFromHomestead();
    
    if (homesteadId) {
      this.assignmentIndex.homesteads.delete(homesteadId);
    }
    
    this.emit("npc_removed_from_homestead", { npcId, homesteadId });
    console.log(`[NpcManager] NPC ${npc.name} 从家园移除`);
    
    return true;
  }
  
  // ===========================================
  // 查询方法
  // ===========================================
  
  /**
   * 获取副本中的所有NPC
   */
  getNpcsInDungeon(dungeonId) {
    const npcIds = this.assignmentIndex.dungeons.get(dungeonId) || new Set();
    return Array.from(npcIds).map(npcId => this.getNpc(npcId)).filter(Boolean);
  }
  
  /**
   * 获取节点中的所有NPC
   */
  getNpcsInNode(nodeId) {
    const npcIds = this.assignmentIndex.nodes.get(nodeId) || new Set();
    return Array.from(npcIds).map(npcId => this.getNpc(npcId)).filter(Boolean);
  }
  
  /**
   * 获取任务相关的所有NPC
   */
  getNpcsInQuest(questId) {
    const npcIds = this.assignmentIndex.quests.get(questId) || new Set();
    return Array.from(npcIds).map(npcId => this.getNpc(npcId)).filter(Boolean);
  }
  
  /**
   * 获取家园中的NPC
   */
  getNpcInHomestead(homesteadId) {
    const npcId = this.assignmentIndex.homesteads.get(homesteadId);
    return npcId ? this.getNpc(npcId) : null;
  }
  
  // ===========================================
  // 交互管理
  // ===========================================
  
  /**
   * 开始NPC交互
   */
  startInteraction(npcId, playerId = "player") {
    const npc = this.getNpc(npcId);
    if (!npc) {
      console.error(`[NpcManager] NPC ${npcId} 不存在`);
      return null;
    }
    
    const interactionId = generateUniqueId(UNIQUE_ID_PREFIXES.INTERACTION);
    const success = npc.startDialogue(interactionId);
    
    if (success) {
      this.activeInteractions.set(interactionId, {
        npcId,
        playerId,
        startTime: Date.now()
      });
      
      this.statistics.totalInteractions++;
      this.statistics.activeNpcs++;
      
      this.emit("interaction_started", { npcId, playerId, interactionId });
      console.log(`[NpcManager] 开始交互: ${npc.name} <- ${playerId}`);
      
      return interactionId;
    }
    
    return null;
  }
  
  /**
   * 结束NPC交互
   */
  endInteraction(interactionId) {
    const interaction = this.activeInteractions.get(interactionId);
    if (!interaction) {
      console.warn(`[NpcManager] 交互 ${interactionId} 不存在`);
      return false;
    }
    
    const npc = this.getNpc(interaction.npcId);
    if (npc) {
      npc.endDialogue();
    }
    
    this.activeInteractions.delete(interactionId);
    this.statistics.activeNpcs = Math.max(0, this.statistics.activeNpcs - 1);
    
    this.emit("interaction_ended", { 
      interactionId, 
      npcId: interaction.npcId, 
      playerId: interaction.playerId,
      duration: Date.now() - interaction.startTime 
    });
    
    console.log(`[NpcManager] 结束交互: ${interactionId}`);
    return true;
  }
  
  /**
   * 获取活动交互列表
   */
  getActiveInteractions() {
    return Object.fromEntries(this.activeInteractions);
  }
  
  // ===========================================
  // 批量操作
  // ===========================================
  
  /**
   * 批量创建NPC
   */
  createNpcsFromTemplates(templates) {
    const createdNpcs = [];
    
    templates.forEach(({ templateId, overrides = {}, count = 1 }) => {
      for (let i = 0; i < count; i++) {
        const npc = this.createNpc(templateId, overrides);
        if (npc) {
          createdNpcs.push(npc);
        }
      }
    });
    
    console.log(`[NpcManager] 批量创建NPC完成，共创建 ${createdNpcs.length} 个`);
    return createdNpcs;
  }
  
  /**
   * 重置所有NPC状态
   */
  resetAllNpcs() {
    let resetCount = 0;
    
    this.npcs.forEach(npc => {
      npc.reset();
      resetCount++;
    });
    
    // 清理活动交互
    this.activeInteractions.clear();
    this.statistics.activeNpcs = 0;
    
    this.emit("all_npcs_reset", { resetCount });
    console.log(`[NpcManager] 重置所有NPC状态，共重置 ${resetCount} 个`);
  }
  
  // ===========================================
  // 内部方法
  // ===========================================
  
  /**
   * 注册NPC事件监听
   */
  _registerNpcEvents(npc) {
    // 转发NPC事件到管理器
    npc.on("dialogue_started", (data) => {
      this.emit("npc_dialogue_started", data);
    });
    
    npc.on("dialogue_ended", (data) => {
      this.emit("npc_dialogue_ended", data);
      // 清理交互记录
      const interactionId = data.interactionId;
      if (this.activeInteractions.has(interactionId)) {
        this.endInteraction(interactionId);
      }
    });
    
    npc.on("dialogue_option_selected", (data) => {
      this.emit("npc_dialogue_option_selected", data);
    });
    
    npc.on("dialogue_action", (data) => {
      this.emit("npc_dialogue_action", data);
    });
    
    npc.on("state_changed", (data) => {
      this.emit("npc_state_changed", data);
    });
    
    npc.on("attribute_updated", (data) => {
      this.emit("npc_attribute_updated", data);
    });
  }
  
  /**
   * 清理NPC的所有分配关系
   */
  _cleanupNpcAssignments(npc) {
    const assignments = npc.getAllAssignments();
    
    // 清理副本分配
    assignments.dungeons.forEach(dungeonId => {
      this.removeNpcFromDungeon(npc.id, dungeonId);
    });
    
    // 清理节点分配
    assignments.nodes.forEach(nodeId => {
      this.removeNpcFromNode(npc.id, nodeId);
    });
    
    // 清理任务分配
    assignments.quests.forEach(questId => {
      this.removeNpcFromQuest(npc.id, questId);
    });
    
    // 清理家园分配
    if (assignments.homestead) {
      this.removeNpcFromHomestead(npc.id);
    }
  }
  
  // ===========================================
  // 状态和统计
  // ===========================================
  
  /**
   * 获取管理器状态
   */
  getState() {
    return {
      statistics: { ...this.statistics },
      totalTemplates: this.templates.size,
      assignmentCounts: {
        dungeons: this.assignmentIndex.dungeons.size,
        nodes: this.assignmentIndex.nodes.size,
        quests: this.assignmentIndex.quests.size,
        homesteads: this.assignmentIndex.homesteads.size
      },
      activeInteractions: this.activeInteractions.size
    };
  }
  
  /**
   * 获取统计信息
   */
  getStatistics() {
    const state = this.getState();
    const npcsByType = {};
    const npcsByState = {};
    
    this.getAllNpcs().forEach(npc => {
      // 按类型统计
      npcsByType[npc.type] = (npcsByType[npc.type] || 0) + 1;
      // 按状态统计
      npcsByState[npc.state] = (npcsByState[npc.state] || 0) + 1;
    });
    
    return {
      ...state,
      npcsByType,
      npcsByState,
      uptime: Date.now() - this.statistics.createdAt
    };
  }
  
  /**
   * 销毁管理器
   */
  destroy() {
    console.log("[NpcManager] 正在销毁NPC管理器...");
    
    // 清理所有NPC
    this.npcs.forEach(npc => {
      npc.removeAllListeners();
    });
    this.npcs.clear();
    
    // 清理模板
    this.templates.clear();
    
    // 清理索引
    this.assignmentIndex.dungeons.clear();
    this.assignmentIndex.nodes.clear();
    this.assignmentIndex.quests.clear();
    this.assignmentIndex.homesteads.clear();
    this.assignmentIndex.events.clear();
    
    // 清理交互
    this.activeInteractions.clear();
    
    // 移除所有监听器
    this.removeAllListeners();
    
    console.log("[NpcManager] NPC管理器已销毁");
  }
}

// ===========================================
// 单例实例
// ===========================================

const npcManagerInstance = new NpcManager();

export { NpcManager, NpcFactory, npcManagerInstance };
export default npcManagerInstance; 