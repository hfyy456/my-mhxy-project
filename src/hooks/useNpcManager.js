/**
 * useNpcManager Hook - NPC管理器集成
 * 提供NPC系统的React集成
 * 
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-07
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import npcManagerInstance from '@/store/managers/NpcManager';
import { allNpcTemplates } from '@/config/character/npcTemplatesConfig';

export const useNpcManager = () => {
  // 状态管理
  const [npcs, setNpcs] = useState({});
  const [templates, setTemplates] = useState({});
  const [statistics, setStatistics] = useState({});
  const [activeInteractions, setActiveInteractions] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  // 引用
  const managerRef = useRef(npcManagerInstance);

  // 初始化
  useEffect(() => {
    const initializeNpcManager = async () => {
      try {
        console.log('[useNpcManager] 开始初始化NPC管理器');
        
        // 注册所有模板
        managerRef.current.registerTemplates(allNpcTemplates);
        
        // 初始化状态
        updateAllStates();
        
        // 注册事件监听器
        registerEventListeners();
        
        setIsInitialized(true);
        console.log('[useNpcManager] NPC管理器初始化完成');
      } catch (err) {
        console.error('[useNpcManager] 初始化失败:', err);
        setError(err.message);
      }
    };

    initializeNpcManager();

    // 清理函数
    return () => {
      unregisterEventListeners();
    };
  }, []);

  // 更新所有状态
  const updateAllStates = useCallback(() => {
    try {
      // 更新NPC列表
      const allNpcs = managerRef.current.getAllNpcs();
      const npcsMap = {};
      allNpcs.forEach(npc => {
        npcsMap[npc.id] = npc.toJSON();
      });
      setNpcs(npcsMap);

      // 更新模板
      setTemplates(managerRef.current.getAllTemplates());

      // 更新统计信息
      setStatistics(managerRef.current.getStatistics());

      // 更新活动交互
      setActiveInteractions(managerRef.current.getActiveInteractions());
    } catch (err) {
      console.error('[useNpcManager] 更新状态失败:', err);
      setError(err.message);
    }
  }, []);

  // 注册事件监听器
  const registerEventListeners = useCallback(() => {
    const manager = managerRef.current;

    const eventHandlers = {
      npc_created: () => updateAllStates(),
      npc_removed: () => updateAllStates(),
      npc_added: () => updateAllStates(),
      template_registered: () => updateAllStates(),
      interaction_started: () => updateAllStates(),
      interaction_ended: () => updateAllStates(),
      npc_dialogue_started: () => updateAllStates(),
      npc_dialogue_ended: () => updateAllStates(),
      npc_state_changed: () => updateAllStates(),
      npc_attribute_updated: () => updateAllStates(),
      npc_assigned_to_dungeon: () => updateAllStates(),
      npc_assigned_to_node: () => updateAllStates(),
      npc_assigned_to_quest: () => updateAllStates(),
      npc_assigned_to_homestead: () => updateAllStates(),
      npc_removed_from_dungeon: () => updateAllStates(),
      npc_removed_from_node: () => updateAllStates(),
      npc_removed_from_quest: () => updateAllStates(),
      npc_removed_from_homestead: () => updateAllStates(),
      all_npcs_reset: () => updateAllStates()
    };

    // 注册所有事件监听器
    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      manager.on(eventName, handler);
    });

    // 保存处理器引用以便清理
    manager._hookEventHandlers = eventHandlers;
  }, [updateAllStates]);

  // 注销事件监听器
  const unregisterEventListeners = useCallback(() => {
    const manager = managerRef.current;
    if (manager._hookEventHandlers) {
      Object.entries(manager._hookEventHandlers).forEach(([eventName, handler]) => {
        manager.off(eventName, handler);
      });
      delete manager._hookEventHandlers;
    }
  }, []);

  // ===========================================
  // NPC管理方法
  // ===========================================

  // 创建NPC
  const createNpc = useCallback((templateId, overrides = {}) => {
    try {
      const npc = managerRef.current.createNpc(templateId, overrides);
      if (npc) {
        console.log(`[useNpcManager] 创建NPC成功: ${npc.name} (${npc.id})`);
        return npc.toJSON();
      }
      return null;
    } catch (err) {
      console.error('[useNpcManager] 创建NPC失败:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // 删除NPC
  const removeNpc = useCallback((npcId) => {
    try {
      const result = managerRef.current.removeNpc(npcId);
      console.log(`[useNpcManager] 删除NPC ${result ? '成功' : '失败'}: ${npcId}`);
      return result;
    } catch (err) {
      console.error('[useNpcManager] 删除NPC失败:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // 获取NPC
  const getNpc = useCallback((npcId) => {
    try {
      const npc = managerRef.current.getNpc(npcId);
      return npc ? npc.toJSON() : null;
    } catch (err) {
      console.error('[useNpcManager] 获取NPC失败:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // 根据类型获取NPC列表
  const getNpcsByType = useCallback((type) => {
    try {
      const npcsArray = managerRef.current.getNpcsByType(type);
      return npcsArray.map(npc => npc.toJSON());
    } catch (err) {
      console.error('[useNpcManager] 根据类型获取NPC失败:', err);
      setError(err.message);
      return [];
    }
  }, []);

  // 根据模板获取NPC列表
  const getNpcsByTemplate = useCallback((templateId) => {
    try {
      const npcsArray = managerRef.current.getNpcsByTemplate(templateId);
      return npcsArray.map(npc => npc.toJSON());
    } catch (err) {
      console.error('[useNpcManager] 根据模板获取NPC失败:', err);
      setError(err.message);
      return [];
    }
  }, []);

  // ===========================================
  // 场景分配方法
  // ===========================================

  // 分配NPC到副本
  const assignNpcToDungeon = useCallback((npcId, dungeonId, role = "npc") => {
    try {
      const result = managerRef.current.assignNpcToDungeon(npcId, dungeonId, role);
      console.log(`[useNpcManager] 分配NPC到副本 ${result ? '成功' : '失败'}: ${npcId} -> ${dungeonId}`);
      return result;
    } catch (err) {
      console.error('[useNpcManager] 分配NPC到副本失败:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // 分配NPC到节点
  const assignNpcToNode = useCallback((npcId, nodeId, role = "npc") => {
    try {
      const result = managerRef.current.assignNpcToNode(npcId, nodeId, role);
      console.log(`[useNpcManager] 分配NPC到节点 ${result ? '成功' : '失败'}: ${npcId} -> ${nodeId}`);
      return result;
    } catch (err) {
      console.error('[useNpcManager] 分配NPC到节点失败:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // 分配NPC到任务
  const assignNpcToQuest = useCallback((npcId, questId, role = "questgiver") => {
    try {
      const result = managerRef.current.assignNpcToQuest(npcId, questId, role);
      console.log(`[useNpcManager] 分配NPC到任务 ${result ? '成功' : '失败'}: ${npcId} -> ${questId}`);
      return result;
    } catch (err) {
      console.error('[useNpcManager] 分配NPC到任务失败:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // 分配NPC到家园
  const assignNpcToHomestead = useCallback((npcId, homesteadId, role = "resident") => {
    try {
      const result = managerRef.current.assignNpcToHomestead(npcId, homesteadId, role);
      console.log(`[useNpcManager] 分配NPC到家园 ${result ? '成功' : '失败'}: ${npcId} -> ${homesteadId}`);
      return result;
    } catch (err) {
      console.error('[useNpcManager] 分配NPC到家园失败:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // ===========================================
  // 查询方法
  // ===========================================

  // 获取副本中的NPC
  const getNpcsInDungeon = useCallback((dungeonId) => {
    try {
      const npcsArray = managerRef.current.getNpcsInDungeon(dungeonId);
      return npcsArray.map(npc => npc.toJSON());
    } catch (err) {
      console.error('[useNpcManager] 获取副本NPC失败:', err);
      setError(err.message);
      return [];
    }
  }, []);

  // 获取节点中的NPC
  const getNpcsInNode = useCallback((nodeId) => {
    try {
      const npcsArray = managerRef.current.getNpcsInNode(nodeId);
      return npcsArray.map(npc => npc.toJSON());
    } catch (err) {
      console.error('[useNpcManager] 获取节点NPC失败:', err);
      setError(err.message);
      return [];
    }
  }, []);

  // 获取任务相关的NPC
  const getNpcsInQuest = useCallback((questId) => {
    try {
      const npcsArray = managerRef.current.getNpcsInQuest(questId);
      return npcsArray.map(npc => npc.toJSON());
    } catch (err) {
      console.error('[useNpcManager] 获取任务NPC失败:', err);
      setError(err.message);
      return [];
    }
  }, []);

  // 获取家园中的NPC
  const getNpcInHomestead = useCallback((homesteadId) => {
    try {
      const npc = managerRef.current.getNpcInHomestead(homesteadId);
      return npc ? npc.toJSON() : null;
    } catch (err) {
      console.error('[useNpcManager] 获取家园NPC失败:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // ===========================================
  // 交互方法
  // ===========================================

  // 开始交互
  const startInteraction = useCallback((npcId, playerId = "player") => {
    try {
      const interactionId = managerRef.current.startInteraction(npcId, playerId);
      if (interactionId) {
        console.log(`[useNpcManager] 开始交互成功: ${interactionId}`);
        return interactionId;
      }
      return null;
    } catch (err) {
      console.error('[useNpcManager] 开始交互失败:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // 结束交互
  const endInteraction = useCallback((interactionId) => {
    try {
      const result = managerRef.current.endInteraction(interactionId);
      console.log(`[useNpcManager] 结束交互 ${result ? '成功' : '失败'}: ${interactionId}`);
      return result;
    } catch (err) {
      console.error('[useNpcManager] 结束交互失败:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // ===========================================
  // 批量操作方法
  // ===========================================

  // 批量创建NPC
  const createNpcsFromTemplates = useCallback((templateConfigs) => {
    try {
      const createdNpcs = managerRef.current.createNpcsFromTemplates(templateConfigs);
      console.log(`[useNpcManager] 批量创建NPC完成，共创建 ${createdNpcs.length} 个`);
      return createdNpcs.map(npc => npc.toJSON());
    } catch (err) {
      console.error('[useNpcManager] 批量创建NPC失败:', err);
      setError(err.message);
      return [];
    }
  }, []);

  // 重置所有NPC
  const resetAllNpcs = useCallback(() => {
    try {
      managerRef.current.resetAllNpcs();
      console.log('[useNpcManager] 重置所有NPC完成');
      return true;
    } catch (err) {
      console.error('[useNpcManager] 重置所有NPC失败:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // ===========================================
  // 工具方法
  // ===========================================

  // 检查NPC是否分配到特定场景
  const isNpcAssignedTo = useCallback((npcId, sceneType, sceneId) => {
    try {
      const npc = managerRef.current.getNpc(npcId);
      return npc ? npc.isAssignedTo(sceneType, sceneId) : false;
    } catch (err) {
      console.error('[useNpcManager] 检查NPC分配失败:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 手动刷新状态
  const refreshState = useCallback(() => {
    updateAllStates();
  }, [updateAllStates]);

  // ===========================================
  // 返回接口
  // ===========================================

  return {
    // 状态
    npcs,
    templates,
    statistics,
    activeInteractions,
    isInitialized,
    error,

    // NPC管理
    createNpc,
    removeNpc,
    getNpc,
    getNpcsByType,
    getNpcsByTemplate,

    // 场景分配
    assignNpcToDungeon,
    assignNpcToNode,
    assignNpcToQuest,
    assignNpcToHomestead,

    // 查询方法
    getNpcsInDungeon,
    getNpcsInNode,
    getNpcsInQuest,
    getNpcInHomestead,

    // 交互管理
    startInteraction,
    endInteraction,

    // 批量操作
    createNpcsFromTemplates,
    resetAllNpcs,

    // 工具方法
    isNpcAssignedTo,
    clearError,
    refreshState,

    // 管理器引用（高级用法）
    manager: managerRef.current
  };
};

export default useNpcManager; 