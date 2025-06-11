/*
 * @Author: Claude
 * @Date: 2025-01-27
 * @Description: 独立战斗引擎核心 - 完全脱离Redux的战斗状态管理
 */

import { generateUniqueId } from '@/utils/idUtils';
import { UNIQUE_ID_PREFIXES, BATTLE_PHASES } from '@/config/enumConfig';
import { processBuffsOnTurnStart, processBuffsOnTurnEnd } from '../logic/buffManager';
import { calculateBattleDamage, applyDamageToTarget } from '../logic/damageCalculation';
import { executeSkillEffect } from '../logic/skillSystem';
import { getValidTargetsForUnit, getValidTargetsForSkill } from '@/features/battle/logic/skillSystem';
import { decideEnemyAction } from '@/features/battle/logic/battleAI';
import { summonConfig } from '@/config/summon/summonConfig';
import { activeSkillConfig } from '@/config/skill/activeSkillConfig';
import { BattleQueueManager } from '../utils/BattleQueue';

// 战斗引擎状态枚举
export const BATTLE_ENGINE_STATES = {
  IDLE: 'idle',
  INITIALIZING: 'initializing', 
  ROUND_START: 'round_start',      // 回合开始阶段
  PREPARATION: 'preparation',      // 行动选择阶段
  EXECUTION: 'execution',          // 执行阶段
  ROUND_END: 'round_end',          // 回合结束阶段
  COMPLETED: 'completed',
  ERROR: 'error'
};

// 战斗引擎事件
export const BATTLE_ENGINE_EVENTS = {
  BATTLE_INITIALIZED: 'battle_initialized',
  ROUND_STARTED: 'round_started',          // 回合开始事件
  PREPARATION_COMPLETE: 'preparation_complete',
  EXECUTION_STARTED: 'execution_started',   // 执行阶段开始
  ACTION_EXECUTED: 'action_executed',
  EXECUTION_COMPLETE: 'execution_complete', // 执行阶段完成
  ROUND_COMPLETE: 'round_complete',
  BATTLE_ENDED: 'battle_ended',
  ERROR_OCCURRED: 'error_occurred'
};

/**
 * 独立战斗引擎类
 * 完全自主管理战斗状态，不依赖外部状态管理系统
 */
export class BattleEngine {
  constructor(options = {}) {
    this.id = generateUniqueId(UNIQUE_ID_PREFIXES.BATTLE);
    this.state = BATTLE_ENGINE_STATES.IDLE;
    this.battleData = null;
    this.currentRound = 0;
    this.actionQueue = [];
    this.battleLog = [];
    this.result = null;
    
    // 回合制相关状态
    this.turnOrder = [];           // 行动顺序（按速度排序）
    this.unitActions = new Map();  // 存储本回合单位行动
    this.activeUnits = [];         // 本回合能行动的单位
    
    // 事件监听器
    this.eventListeners = new Map();
    
    // 双队列管理器 - 延迟初始化，等待事件总线设置
    this.queueManager = null;
    this.externalEventBus = null;
    
    // 配置选项
    this.options = {
      enableLogging: true,
      autoAdvance: true,
      maxRounds: 30,
      ...options
    };
    
    // 绑定方法
    this.initialize = this.initialize.bind(this);
    this.getState = this.getState.bind(this);
    this.submitAction = this.submitAction.bind(this);
    this.advance = this.advance.bind(this);
    this.getResult = this.getResult.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    
    this._log('战斗引擎创建完成', { id: this.id });
  }

  /**
   * 初始化战斗
   * @param {Object} battleConfig - 战斗配置数据
   * @returns {Object} 初始化结果
   */
  initialize(battleConfig) {
    if (this.state !== BATTLE_ENGINE_STATES.IDLE) {
      throw new Error(`无法初始化战斗，当前状态: ${this.state}`);
    }

    try {
      this._setState(BATTLE_ENGINE_STATES.INITIALIZING);
      
      // 验证配置数据
      this._validateBattleConfig(battleConfig);
      
      // 初始化战斗数据
      this.battleData = this._createBattleData(battleConfig);
      this.currentRound = 1;
      this.actionQueue = [];
      this.battleLog = [];
      this.result = null;
      
      this._setState(BATTLE_ENGINE_STATES.ROUND_START);
      this._emit(BATTLE_ENGINE_EVENTS.BATTLE_INITIALIZED, {
        battleId: this.id,
        battleData: this.battleData
      });
      
      this._log('战斗初始化成功', { 
        battleId: this.id,
        playerUnits: Object.keys(this.battleData.playerUnits).length,
        enemyUnits: Object.keys(this.battleData.enemyUnits).length
      });
      
      // 自动推进到准备阶段
      if (this.options.autoAdvance) {
        this.advance().then(advanceResult => {
        this._log('初始化后自动推进', advanceResult);
        }).catch(error => {
          this._log('自动推进失败', { error: error.message });
        });
      }
      
      return {
        success: true,
        battleId: this.id,
        state: this.state
      };
      
    } catch (error) {
      this._setState(BATTLE_ENGINE_STATES.ERROR);
      this._emit(BATTLE_ENGINE_EVENTS.ERROR_OCCURRED, { error });
      this._log('战斗初始化失败', { error: error.message });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取当前战斗状态
   * @returns {Object} 战斗状态数据
   */
  getState() {
    // 合并所有单位数据
    const allUnits = {};
    if (this.battleData) {
      Object.assign(allUnits, this.battleData.playerUnits, this.battleData.enemyUnits);
    }
    
    // 转换unitActions Map为普通对象
    const unitActionsObj = {};
    this.unitActions.forEach((action, unitId) => {
      unitActionsObj[unitId] = action;
    });
    
    return {
      battleId: this.id,
      engineState: this.state,
      currentRound: this.currentRound,
      battleData: this.battleData,
      actionQueue: [...this.actionQueue],
      battleLog: [...this.battleLog],
      result: this.result,
      isActive: this.state !== BATTLE_ENGINE_STATES.IDLE && 
                this.state !== BATTLE_ENGINE_STATES.COMPLETED,
      currentPhase: this._mapEngineStateToPhase(this.state),
      
      // 回合制状态
      turnOrder: [...this.turnOrder],
      unitActions: unitActionsObj,
      activeUnits: [...this.activeUnits],
      
      // UI需要的数据格式
      battleUnits: allUnits,
      playerFormation: this.battleData?.playerFormation || [],
      enemyFormation: this.battleData?.enemyFormation || []
    };
  }

  /**
   * 提交单位行动
   * @param {string} unitId - 单位ID
   * @param {Object} action - 行动数据
   * @returns {Object} 提交结果
   */
  submitAction(unitId, action) {
    if (this.state !== BATTLE_ENGINE_STATES.PREPARATION) {
      return {
        success: false,
        error: `当前不允许提交行动，引擎状态: ${this.state}`
      };
    }

    try {
      // 验证单位和行动
      this._validateAction(unitId, action);
      
      // 存储单位行动
      this.unitActions.set(unitId, {
        unitId,
        action,
        timestamp: Date.now()
      });
      
      this._log('行动提交成功', { unitId, actionType: action.type });
      
      // 检查是否所有单位都已提交行动
      if (this._allActionsSubmitted()) {
        this._emit(BATTLE_ENGINE_EVENTS.PREPARATION_COMPLETE);
      }
      
      return {
        success: true,
        actionStored: true
      };
      
    } catch (error) {
      this._log('行动提交失败', { unitId, error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 推进战斗流程
   * @returns {Object} 推进结果
   */
  async advance() {
    try {
      switch (this.state) {
        case BATTLE_ENGINE_STATES.PREPARATION:
          // 从准备阶段推进到执行阶段
          this._setState(BATTLE_ENGINE_STATES.EXECUTION);
          this._emit(BATTLE_ENGINE_EVENTS.EXECUTION_STARTED);
          return await this._executeAllActions();
          
        case BATTLE_ENGINE_STATES.ROUND_START:
          return this._advanceToPreparation();
          
        case BATTLE_ENGINE_STATES.EXECUTION:
          return await this._executeAllActions();
          
        case BATTLE_ENGINE_STATES.ROUND_END:
          return this._processRoundEnd();
          
        default:
          return {
            success: false,
            error: `无法推进，当前状态: ${this.state}`
          };
      }
    } catch (error) {
      this._setState(BATTLE_ENGINE_STATES.ERROR);
      this._emit(BATTLE_ENGINE_EVENTS.ERROR_OCCURRED, { error });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取战斗结果
   * @returns {Object|null} 战斗结果
   */
  getResult() {
    return this.result;
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  subscribe(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event).add(callback);
    
    // 返回取消订阅函数
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * 取消订阅
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  unsubscribe(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * 重置战斗引擎到初始状态
   * 用于清理之前的战斗状态并准备新的战斗
   */
  reset() {
    this._log('重置战斗引擎', { previousState: this.state });
    
    // 重置所有状态变量
    this.state = BATTLE_ENGINE_STATES.IDLE;
    this.battleData = null;
    this.currentRound = 0;
    this.actionQueue = [];
    this.battleLog = [];
    this.result = null;
    
    // 重置回合制状态
    this.turnOrder = [];
    this.unitActions.clear();
    this.activeUnits = [];
    
    // 清除事件监听器
    this.eventListeners.clear();
    
    this._log('战斗引擎重置完成', { currentState: this.state });
  }

  // ==================== 私有方法 ====================

  /**
   * 设置引擎状态
   * @private
   */
  _setState(newState) {
    const oldState = this.state;
    this.state = newState;
    this._emit('state_changed', { oldState, newState });
    this._log(`状态变更: ${oldState} -> ${newState}`);
  }

  /**
   * 发送事件
   * @private
   */
  _emit(event, data = {}) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback({ event, data, timestamp: Date.now() });
        } catch (error) {
          this._log('事件回调执行失败', { event, error: error.message });
        }
      });
    }
  }

  /**
   * 日志记录
   * @private
   */
  _log(message, data = {}) {
    if (this.options.enableLogging) {
      console.log(`[BattleEngine:${this.id}] ${message}`, data);
    }
    
    // 添加格式化的日志条目到 battleLog 数组
    const logEntry = {
      id: generateUniqueId('log'),
      timestamp: Date.now(),
      message: message,
      phase: this._mapEngineStateToPhase(this.state),
      unitId: data.unitId || null,
      targetId: data.targetId || null,
      actionType: data.actionType || null,
      damage: data.damage || 0,
      data: { ...data }
    };
    
    this.battleLog.push(logEntry);
    
    // 限制日志条目数量，避免内存泄漏
    if (this.battleLog.length > 1000) {
      this.battleLog = this.battleLog.slice(-500); // 保留最新的500条
    }
  }

  /**
   * 验证战斗配置
   * @private
   */
  _validateBattleConfig(config) {
    if (!config) {
      throw new Error('战斗配置不能为空');
    }
    
    if (!config.playerUnits || !config.enemyUnits) {
      throw new Error('缺少玩家或敌方单位配置');
    }
    
    if (Object.keys(config.playerUnits).length === 0) {
      throw new Error('玩家单位不能为空');
    }
    
    if (Object.keys(config.enemyUnits).length === 0) {
      throw new Error('敌方单位不能为空');
    }
  }

  /**
   * 创建战斗数据
   * @private
   */
  _createBattleData(config) {
    // 计算初始回合顺序
    this.turnOrder = this._calculateTurnOrder(config.playerUnits, config.enemyUnits);
    
    return {
      battleId: this.id,
      playerUnits: { ...config.playerUnits },
      enemyUnits: { ...config.enemyUnits },
      playerFormation: config.playerFormation || this._createEmptyFormation(),
      enemyFormation: config.enemyFormation || this._createEmptyFormation(),
      roundEffects: new Map(), // 回合效果
      battleEffects: new Map()  // 持续效果
    };
  }

  /**
   * 创建空阵型
   * @private
   */
  _createEmptyFormation() {
    return Array(3).fill(null).map(() => Array(3).fill(null));
  }

  /**
   * 计算行动顺序
   * @private
   */
  _calculateTurnOrder(playerUnits, enemyUnits) {
    const allUnits = [
      ...Object.values(playerUnits),
      ...Object.values(enemyUnits)
    ];
    
    // 按速度排序，速度相同时随机
    return allUnits
      .sort((a, b) => {
        const speedDiff = (b.stats?.speed || 0) - (a.stats?.speed || 0);
        return speedDiff !== 0 ? speedDiff : Math.random() - 0.5;
      })
      .map(unit => unit.id);
  }

  /**
   * 验证行动
   * @private
   */
  _validateAction(unitId, action) {
    // 检查单位是否存在
    const unit = this.battleData.playerUnits[unitId] || this.battleData.enemyUnits[unitId];
    if (!unit) {
      throw new Error(`单位不存在: ${unitId}`);
    }
    
    // 🚨 新增：检查单位是否已死亡
    if (unit.isDefeated) {
      console.warn(`⚰️ [BattleEngine] 死亡单位试图提交行动:`, {
        unitId,
        unitName: unit.name,
        isDefeated: unit.isDefeated,
        currentHp: unit.stats?.currentHp
      });
      throw new Error(`单位已死亡，无法提交行动: ${unit.name} (${unitId})`);
    }
    
    if (!action || !action.type) {
      throw new Error('行动数据无效');
    }
    
    // 检查是否已经提交过行动
    const existingAction = this.actionQueue.find(a => a.unitId === unitId);
    if (existingAction) {
      throw new Error(`单位 ${unitId} 已经提交过行动`);
    }
  }

  /**
   * 检查是否所有单位都已提交行动
   * @private
   */
  _allActionsSubmitted() {
    // 检查所有能行动的单位是否都已提交行动
    return this.unitActions.size >= this.activeUnits.length;
  }

  /**
   * 开始新回合
   * @private
   */
  _startRound() {
    this._setState(BATTLE_ENGINE_STATES.ROUND_START);
    this._emit(BATTLE_ENGINE_EVENTS.ROUND_STARTED, { round: this.currentRound });
    
    this._log('回合开始', { round: this.currentRound });
    
    // 在autoAdvance模式下自动推进到准备阶段
    if (this.options.autoAdvance) {
      setTimeout(async () => {
        try {
          const result = await this.advance();
        this._log('自动推进到准备阶段结果', result);
        } catch (error) {
          this._log('自动推进到准备阶段失败', { error: error.message });
        }
      }, 500); // 给UI一点时间显示回合开始
    }
    
    return { success: true, state: this.state };
  }

  /**
   * 进入准备阶段
   * @private
   */
  _advanceToPreparation() {
    // 确定本回合能行动的单位
    this._determineActiveUnits();
    
    // 处理回合开始时的状态效果
    this._processRoundStartEffects();
    
    // 计算行动顺序
    this.turnOrder = this._calculateTurnOrder(
      this.battleData.playerUnits, 
      this.battleData.enemyUnits
    );
    
    // 清空之前的行动
    this.unitActions.clear();
    
    this._setState(BATTLE_ENGINE_STATES.PREPARATION);
    this._log('进入准备阶段', { 
      activeUnits: this.activeUnits.length, 
      turnOrder: this.turnOrder 
    });
    
    // 立即处理AI行动（不需要等待）
    const aiResult = this.processAIActions();
    this._log('AI行动处理结果', aiResult);
    
    return { success: true, state: this.state };
  }

  /**
   * 执行所有行动
   * @private
   */
  async _executeAllActions() {
    this._log('开始使用双队列系统执行所有行动', { actionCount: this.unitActions.size });
    
    // 初始化队列管理器（如果还没有初始化）
    if (!this.queueManager) {
      // 优先使用外部事件总线，回退到内部事件系统
      const eventBus = this.externalEventBus || {
        emit: (event, data) => this._emit(event, data),
        subscribe: (event, callback) => this.subscribe(event, callback),
        unsubscribe: (event, callback) => this.unsubscribe(event, callback)
      };
      
      console.log(`🔧 [BattleEngine] 初始化队列管理器，使用事件总线:`, {
        hasExternalEventBus: !!this.externalEventBus,
        eventBusType: this.externalEventBus ? 'external' : 'internal'
      });
      
      this.queueManager = new BattleQueueManager(eventBus);
    }
    
    // 初始化队列系统
    this.queueManager.initialize(this.turnOrder, this.unitActions);
    
    const executionResults = [];
    
    // 使用队列管理器依次执行每个单位的行动
    while (true) {
      const hasNext = await this.queueManager.executeNext((action) => {
        console.log(`🎯 [BattleEngine] 处理单位${action.unitId}的行动逻辑`);
        
        // 检查单位是否还活着
        const sourceUnit = this.battleData.playerUnits[action.unitId] || this.battleData.enemyUnits[action.unitId];
        console.log(`🔍 [BattleEngine] 检查单位${action.unitId}状态:`, {
          unitExists: !!sourceUnit,
          isDefeated: sourceUnit?.isDefeated,
          currentHp: sourceUnit?.stats?.currentHp,
          unitName: sourceUnit?.name
        });
        
        if (!sourceUnit || sourceUnit.isDefeated) {
          console.log(`⚰️ [BattleEngine] 单位${action.unitId}已死亡，跳过行动`);
          return { success: false, skipped: true, reason: 'unit_defeated' };
        }
        
        // 修正数据结构：提取嵌套的action数据以匹配_processAction期望的格式
        const processActionData = {
          unitId: action.unitId,
          action: action.action.action // 双层action结构中提取内层action
        };
      
        console.log(`🔧 [BattleEngine] 修正后的行动数据:`, {
          unitId: processActionData.unitId,
          actionType: processActionData.action.type,
          targets: processActionData.action.targets
        });
        
        // 执行行动逻辑（伤害计算等）
        const result = this._processAction(processActionData);
        
        executionResults.push({
          unitId: action.unitId,
          actionData: action.action,
        result
      });
      
      // 检查战斗是否在此行动后结束
      const battleEndCheck = this._checkBattleEnd();
      if (battleEndCheck.isEnded) {
        this._endBattle(battleEndCheck.result);
          return { ...result, battleEnded: true };
        }
        
        return result;
      });
      
      if (!hasNext) {
        break;
      }
    }
    
    console.log(`🏁 [BattleEngine] 所有单位行动执行完成（双队列模式）`);
    this._setState(BATTLE_ENGINE_STATES.ROUND_END);
    this._emit(BATTLE_ENGINE_EVENTS.EXECUTION_COMPLETE, { results: executionResults });
    
    // 发射数据更新事件，通知UI刷新
    this._emit('BATTLE_DATA_UPDATED', {
      battleUnits: this.getState().battleUnits,
      round: this.currentRound,
      timestamp: Date.now()
    });
    
    // 在autoAdvance模式下自动推进到回合结束处理
    if (this.options.autoAdvance) {
      setTimeout(async () => {
        try {
          const result = await this.advance();
        this._log('自动推进回合结束结果', result);
        } catch (error) {
          this._log('自动推进回合结束失败', { error: error.message });
        }
      }, 1000); // 给UI一点时间显示执行结果
    }
    
    return { success: true, state: this.state, executionResults };
  }

  /**
   * 处理回合结束
   * @private
   */
  _processRoundEnd() {
    this._log('处理回合结束效果');
    
    // 处理所有单位的回合结束效果
    const allUnits = [...Object.values(this.battleData.playerUnits), ...Object.values(this.battleData.enemyUnits)];
    
    allUnits.forEach(unit => {
      if (!unit.isDefeated) {
        const buffResults = processBuffsOnTurnEnd(unit);
        buffResults.forEach(result => {
          this._log(result.message, { type: 'buff_effect', unitId: unit.id });
        });
      }
    });
    
    // 检查战斗是否结束
    const battleEndCheck = this._checkBattleEnd();
    if (battleEndCheck.isEnded) {
      this._endBattle(battleEndCheck.result);
      return { success: true, battleEnded: true, result: battleEndCheck.result };
    }
    
    // 推进到下一回合
    return this._advanceToNextRound();
  }

  /**
   * 推进到下一回合
   * @private
   */
  _advanceToNextRound() {
    this.currentRound++;
    
    // 重置回合状态
    this.unitActions.clear();
    this.activeUnits = [];
    
    // 检查最大回合数
    if (this.currentRound > this.options.maxRounds) {
      this._endBattle({ type: 'draw', reason: 'max_rounds_reached' });
      return { success: true, battleEnded: true, result: this.result };
    }
    
    this._emit(BATTLE_ENGINE_EVENTS.ROUND_COMPLETE, { round: this.currentRound - 1 });
    
    // 开始新回合
    this._log('推进到新回合', { round: this.currentRound });
    return this._startRound();
  }

  /**
   * 确定本回合能行动的单位
   * @private
   */
  _determineActiveUnits() {
    this.activeUnits = [
      ...Object.keys(this.battleData.playerUnits),
      ...Object.keys(this.battleData.enemyUnits)
    ].filter(unitId => {
      const unit = this.battleData.playerUnits[unitId] || this.battleData.enemyUnits[unitId];
      return unit && !unit.isDefeated && !unit.isStunned; // 排除死亡和眩晕单位
    });
    
    this._log('确定能行动单位', { activeUnits: this.activeUnits });
  }

  /**
   * 处理回合开始时的状态效果
   * @private
   */
  _processRoundStartEffects() {
    const allUnits = [...Object.values(this.battleData.playerUnits), ...Object.values(this.battleData.enemyUnits)];
    
    allUnits.forEach(unit => {
      if (!unit.isDefeated) {
        const buffResults = processBuffsOnTurnStart(unit);
        buffResults.forEach(result => {
          this._log(result.message, { type: 'buff_effect', unitId: unit.id });
        });
      }
    });
    
    this._log('回合开始状态效果处理完毕');
  }

  /**
   * 处理单个行动
   * @private
   */
  _processAction(actionData) {
    const { unitId, action } = actionData;
    const sourceUnit = this.battleData.playerUnits[unitId] || this.battleData.enemyUnits[unitId];
    
    if (!sourceUnit) {
      this._log('源单位不存在', { unitId });
      return { success: false, error: '源单位不存在' };
    }
    
    this._log('处理行动', { unitId, actionType: action.type });
    
    try {
      switch (action.type) {
        case 'attack':
          return this._processAttackAction(sourceUnit, action);
        case 'skill':
          return this._processSkillAction(sourceUnit, action);
        case 'defend':
          return this._processDefendAction(sourceUnit, action);
        default:
          this._log('未知行动类型', { actionType: action.type });
          return { success: false, error: `未知行动类型: ${action.type}` };
      }
    } catch (error) {
      this._log('行动处理失败', { unitId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * 处理攻击行动
   * @private
   */
  _processAttackAction(sourceUnit, action) {
    const targetIds = action.targets || action.targetIds || [];
    if (targetIds.length === 0) {
      return { success: false, error: '没有指定目标' };
    }
    
    const results = [];
    
    targetIds.forEach(targetId => {
      const targetUnit = this.battleData.playerUnits[targetId] || 
                        this.battleData.enemyUnits[targetId];
      
      if (!targetUnit || targetUnit.isDefeated) {
        return;
      }
      
                   // 计算伤害
      const damageResult = calculateBattleDamage(sourceUnit, targetUnit, 'physical');
      
      // 应用伤害
      const finalDamage = Math.max(0, damageResult.finalDamage);
      const damageApplyResult = applyDamageToTarget(targetUnit, finalDamage, sourceUnit);
      
      // 更新目标单位数据
      if (damageApplyResult.updatedTarget) {
        // 找到目标单位的位置并更新
        if (this.battleData.playerUnits[targetId]) {
          this.battleData.playerUnits[targetId] = damageApplyResult.updatedTarget;
        } else if (this.battleData.enemyUnits[targetId]) {
          this.battleData.enemyUnits[targetId] = damageApplyResult.updatedTarget;
        }
        
        // 检查是否被击败
        if (damageApplyResult.isDead) {
          damageApplyResult.updatedTarget.isDefeated = true;
        }
      }
      
      // 更新源单位数据（如果有反弹伤害）
      if (damageApplyResult.updatedSource && damageApplyResult.reflectDamage > 0) {
        if (this.battleData.playerUnits[sourceUnit.id]) {
          this.battleData.playerUnits[sourceUnit.id] = damageApplyResult.updatedSource;
        } else if (this.battleData.enemyUnits[sourceUnit.id]) {
          this.battleData.enemyUnits[sourceUnit.id] = damageApplyResult.updatedSource;
        }
      }
      
      results.push({
        targetId,
        damage: finalDamage,
        isCrit: damageResult.isCrit,
        isDefeated: damageApplyResult.isDead,
        previousHp: damageApplyResult.previousHp,
        newHp: damageApplyResult.newHp,
        shieldAbsorbed: damageApplyResult.shieldAbsorbed,
        reflectDamage: damageApplyResult.reflectDamage
      });
      
      // 创建符合BattleUnitSprite期待格式的日志消息
      const critText = damageResult.isCrit ? '暴击！' : '';
      const attackMessage = `${sourceUnit.name} 攻击 ${damageApplyResult.updatedTarget?.name || targetUnit.name} 造成了 ${finalDamage} 点伤害${critText ? `，${critText}` : ''}`;
      
      this._log(attackMessage, {
        unitId: sourceUnit.id,      // 修复：使用unitId而不是sourceId
        sourceId: sourceUnit.id,    // 保留sourceId用于向后兼容
        targetId,
        damage: finalDamage,
        isCrit: damageResult.isCrit,
        previousHp: damageApplyResult.previousHp,
        newHp: damageApplyResult.newHp
      });
      
      // 发射伤害事件供UI处理动画
      this._emit('DAMAGE_DEALT', {
        sourceId: sourceUnit.id,
        sourceName: sourceUnit.name,
        targetId,
        targetName: damageApplyResult.updatedTarget?.name || targetUnit.name,
        damage: finalDamage,
        isCrit: damageResult.isCrit,
        previousHp: damageApplyResult.previousHp,
        newHp: damageApplyResult.newHp,
        isDefeated: damageApplyResult.isDead,
        timestamp: Date.now()
      });
    });
    
    return {
      success: true,
      actionType: 'attack',
      results,
      totalDamage: results.reduce((sum, r) => sum + r.damage, 0)
    };
  }

  /**
   * 处理技能行动
   * @private
   */
  _processSkillAction(sourceUnit, action) {
    const skillId = action.skillId;
    const targetIds = action.targets || action.targetIds || [];
    
    if (!skillId) {
      return { success: false, error: '没有指定技能' };
    }
    
    // 这里应该调用真正的技能系统
    // 暂时简化处理
    this._log(`${sourceUnit.name} 使用技能 ${skillId}`, {
      sourceId: sourceUnit.id,
      skillId,
      targets: targetIds
    });
    
    return {
      success: true,
      actionType: 'skill',
      skillId,
      effects: []
    };
  }

  /**
   * 处理防御行动
   * @private
   */
  _processDefendAction(sourceUnit, action) {
    // 设置防御状态，减少受到的伤害
    sourceUnit.isDefending = true;
    
    this._log(`${sourceUnit.name} 进入防御姿态`, { sourceId: sourceUnit.id });
    
    return {
      success: true,
      actionType: 'defend',
      effects: ['defense_boost']
    };
  }

  /**
   * 检查战斗是否结束
   * @private
   */
  _checkBattleEnd() {
    const playerUnitsAlive = Object.values(this.battleData.playerUnits)
      .some(unit => !unit.isDefeated);
    const enemyUnitsAlive = Object.values(this.battleData.enemyUnits)
      .some(unit => !unit.isDefeated);
    
    if (!playerUnitsAlive) {
      return { isEnded: true, result: { type: 'defeat', reason: 'all_player_units_defeated' } };
    }
    
    if (!enemyUnitsAlive) {
      return { isEnded: true, result: { type: 'victory', reason: 'all_enemy_units_defeated' } };
    }
    
    return { isEnded: false };
  }

  /**
   * 结束战斗
   * @private
   */
  _endBattle(result) {
    this.result = {
      ...result,
      battleId: this.id,
      rounds: this.currentRound,
      timestamp: Date.now()
    };
    
    this._setState(BATTLE_ENGINE_STATES.COMPLETED);
    this._emit(BATTLE_ENGINE_EVENTS.BATTLE_ENDED, { result: this.result });
    
    this._log('战斗结束', { result: this.result });
  }

  /**
   * 映射引擎状态到UI阶段
   * @private
   */
  _mapEngineStateToPhase(engineState) {
    const stateMapping = {
      [BATTLE_ENGINE_STATES.IDLE]: BATTLE_PHASES.BATTLE_END,
      [BATTLE_ENGINE_STATES.INITIALIZING]: BATTLE_PHASES.PREPARATION,
      [BATTLE_ENGINE_STATES.ROUND_START]: BATTLE_PHASES.PREPARATION,
      [BATTLE_ENGINE_STATES.PREPARATION]: BATTLE_PHASES.PREPARATION,
      [BATTLE_ENGINE_STATES.EXECUTION]: BATTLE_PHASES.EXECUTION,
      [BATTLE_ENGINE_STATES.ROUND_END]: BATTLE_PHASES.EXECUTION,
      [BATTLE_ENGINE_STATES.COMPLETED]: BATTLE_PHASES.BATTLE_OVER,
      [BATTLE_ENGINE_STATES.ERROR]: BATTLE_PHASES.BATTLE_END
    };
    
    return stateMapping[engineState] || BATTLE_PHASES.BATTLE_END;
  }

  /**
   * 使用现有AI逻辑处理敌方单位行动
   * @returns {Object} 处理结果
   */
  processAIActions() {
    if (this.state !== BATTLE_ENGINE_STATES.PREPARATION) {
      return {
        success: false,
        error: `当前不允许处理AI行动，引擎状态: ${this.state}`
      };
    }

    try {
      this._log('开始AI行动处理', { 
        engineState: this.state,
        battleDataExists: !!this.battleData,
        enemyUnitsCount: this.battleData ? Object.keys(this.battleData.enemyUnits).length : 0
      });

      const enemyUnits = Object.values(this.battleData.enemyUnits)
        .filter(unit => !unit.isDefeated);
      
      this._log('过滤后的敌方单位', { 
        totalCount: enemyUnits.length,
        units: enemyUnits.map(u => ({ id: u.id, name: u.name, isDefeated: u.isDefeated }))
      });
      
      let actionsProcessed = 0;
      const errors = [];

      enemyUnits.forEach(unit => {
        this._log(`处理AI单位: ${unit.name}`, { unitId: unit.id, hasExistingAction: this.unitActions.has(unit.id) });
        
        // 检查该单位是否已经有行动
        if (!this.unitActions.has(unit.id)) {
          try {
            this._log(`为AI单位 ${unit.name} 生成行动`, { unitId: unit.id });
            const aiAction = this._generateAIAction(unit);
            this._log(`AI行动生成结果`, { unitId: unit.id, action: aiAction });
            
            // 转换行动格式：actionType -> type
            const convertedAction = {
              ...aiAction,
              type: aiAction.actionType
            };
            delete convertedAction.actionType;
            this._log(`转换后的行动格式`, { unitId: unit.id, convertedAction });
            
            const submitResult = this.submitAction(unit.id, convertedAction);
            this._log(`行动提交结果`, { unitId: unit.id, submitResult });
            
            if (submitResult.success) {
              actionsProcessed++;
              this._log(`AI单位 ${unit.name} 行动已设置`, convertedAction);
            } else {
              this._log(`AI单位 ${unit.name} 行动提交失败`, submitResult);
              errors.push({
                unitId: unit.id,
                unitName: unit.name,
                error: submitResult.error
              });
            }
          } catch (error) {
            this._log(`AI单位 ${unit.name} 行动生成异常`, { error: error.message, stack: error.stack });
            errors.push({
              unitId: unit.id,
              unitName: unit.name,
              error: error.message
            });
          }
        } else {
          this._log(`AI单位 ${unit.name} 已有行动，跳过`, this.unitActions.get(unit.id));
        }
      });

      this._log('AI行动处理完成', {
        totalEnemyUnits: enemyUnits.length,
        actionsProcessed,
        errors: errors.length
      });

      // 发射状态更新事件，通知UI刷新
      this._emit('BATTLE_DATA_UPDATED', {
        battleUnits: this.getState().battleUnits,
        unitActions: this.getState().unitActions,
        currentPhase: this.getState().currentPhase,
        timestamp: Date.now()
      });

      return {
        success: true,
        actionsProcessed,
        errors,
        allProcessed: actionsProcessed === enemyUnits.filter(unit => !this.unitActions.has(unit.id)).length
      };

    } catch (error) {
      this._log('AI行动处理失败', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 内部AI决策逻辑 - 为单个AI单位生成行动
   * @param {Object} unit - 敌方单位
   * @returns {Object} AI行动
   */
  _generateAIAction(unit) {
    // 合并所有单位数据
    const allBattleUnits = {
      ...this.battleData.playerUnits,
      ...this.battleData.enemyUnits
    };

    // 分离玩家单位和敌方单位
    const playerUnits = [];
    const enemyUnits = [];
    
    Object.values(allBattleUnits).forEach(battleUnit => {
      if (battleUnit.isPlayerUnit) {
        playerUnits.push(battleUnit);
      } else {
        enemyUnits.push(battleUnit);
      }
    });
    
    // 使用现有的AI决策逻辑
    const action = decideEnemyAction(
      unit, 
      allBattleUnits, 
      playerUnits, 
      enemyUnits, 
      summonConfig,  // 全局宠物配置
      activeSkillConfig  // 技能配置
    );
    
    if (!action) {
      // 如果AI没有返回行动，默认防御
      return {
        type: 'defend',
        skillId: null,
        targetIds: []
      };
    }
    
    this._log(`AI单位 ${unit.name} 生成行动`, action);
    
    return action;
  }

  /**
   * 获取单位可用的主动技能
   * @param {string} unitId - 单位ID
   * @returns {Array} 主动技能列表
   */
  getUnitActiveSkills(unitId) {
    const unit = this.getUnit(unitId);
    if (!unit || !unit.skillSet) {
      return [];
    }
    
    // 从 activeSkillConfig 中获取技能详细信息
    const activeSkills = unit.skillSet
      .filter(skillId => skillId) // 过滤掉空值
      .map(skillId => {
        const skillInfo = activeSkillConfig.find(skill => skill.id === skillId);
        return skillInfo || null;
      })
      .filter(skill => skill !== null) // 过滤掉未找到的技能
      .filter(skill => skill.type !== 'passive'); // 只保留非被动技能
    
    // 移除日志记录，避免频繁调用时的性能问题和无限循环
    return activeSkills;
  }

  /**
   * 获取有效目标列表
   * @param {string} unitId - 单位ID
   * @param {string} actionType - 行动类型
   * @param {string} skillId - 技能ID（可选）
   * @returns {Array} 有效目标列表
   */
  getValidTargets(unitId, actionType, skillId = null) {
    const unit = this.getUnit(unitId);
    if (!unit) return [];
    
    const allUnits = Object.values({
      ...this.battleData.playerUnits,
      ...this.battleData.enemyUnits
    });
    
    if (actionType === 'attack') {
      return getValidTargetsForUnit(unit, allUnits, summonConfig, 'normal');
    } else if (actionType === 'skill' && skillId) {
      return getValidTargetsForSkill(unit, allUnits, skillId, activeSkillConfig);
    }
    
    return [];
  }

  /**
   * 获取技能影响区域
   * @param {string} skillId - 技能ID
   * @param {string} targetId - 目标单位ID
   * @returns {Array} 影响范围内的格子位置数组
   */
  getSkillAffectedArea(skillId, targetId) {
    if (!skillId || !targetId) return [];
    
    const skill = activeSkillConfig.find(s => s.id === skillId);
    if (!skill) return [];
    
    // 获取目标单位
    const targetUnit = this.getUnit(targetId);
    if (!targetUnit) return [];
    
    // 目标位置
    const targetPos = targetUnit.gridPosition;
    const targetTeam = targetPos.team;
    
    // 存储受影响的格子位置
    const affectedPositions = [];
    
    // 根据技能的 targetType 和 areaType 属性确定影响范围
    const targetType = skill.targetType;
    const areaType = skill.areaType;
    
    // 单体技能
    if (targetType === 'single' || !targetType) {
      // 添加目标格子
      affectedPositions.push({
        team: targetTeam,
        row: targetPos.row,
        col: targetPos.col
      });
    }
    // 群体技能
    else if (targetType === 'group') {
      // 添加目标格子
      affectedPositions.push({
        team: targetTeam,
        row: targetPos.row,
        col: targetPos.col
      });
      
      // 根据不同的范围类型计算影响的格子
      if (areaType === 'cross') { // 十字范围
        // 定义上下左右四个相邻格子
        const crossPositions = [
          { row: targetPos.row - 1, col: targetPos.col }, // 上
          { row: targetPos.row + 1, col: targetPos.col }, // 下
          { row: targetPos.row, col: targetPos.col - 1 }, // 左
          { row: targetPos.row, col: targetPos.col + 1 }  // 右
        ];
        
        // 过滤掉超出范围的格子
        crossPositions.forEach(pos => {
          if (pos.row >= 0 && pos.row < 3 && pos.col >= 0 && pos.col < 3) {
            affectedPositions.push({
              team: targetTeam,
              row: pos.row,
              col: pos.col
            });
          }
        });
      }
      else if (areaType === 'row') { // 整行范围
        // 添加同一行的所有格子
        for (let col = 0; col < 3; col++) {
          affectedPositions.push({
            team: targetTeam,
            row: targetPos.row,
            col: col
          });
        }
      }
      else if (areaType === 'column') { // 整列范围
        // 添加同一列的所有格子
        for (let row = 0; row < 3; row++) {
          affectedPositions.push({
            team: targetTeam,
            row: row,
            col: targetPos.col
          });
        }
      }
      else if (areaType === 'square') { // 方形范围
        // 添加 3x3 方形范围内的所有格子
        for (let row = Math.max(0, targetPos.row - 1); row <= Math.min(2, targetPos.row + 1); row++) {
          for (let col = Math.max(0, targetPos.col - 1); col <= Math.min(2, targetPos.col + 1); col++) {
            affectedPositions.push({
              team: targetTeam,
              row: row,
              col: col
            });
          }
        }
      }
      else { // 默认情况，目标及其相邻格子
        // 上下左右四个相邻格子
        const adjacentPositions = [
          { row: targetPos.row - 1, col: targetPos.col }, // 上
          { row: targetPos.row + 1, col: targetPos.col }, // 下
          { row: targetPos.row, col: targetPos.col - 1 }, // 左
          { row: targetPos.row, col: targetPos.col + 1 }  // 右
        ];
        
        // 过滤掉超出范围的格子
        adjacentPositions.forEach(pos => {
          if (pos.row >= 0 && pos.row < 3 && pos.col >= 0 && pos.col < 3) {
            affectedPositions.push({
              team: targetTeam,
              row: pos.row,
              col: pos.col
            });
          }
        });
      }
    }
    // 无目标技能（如自身增益）
    else if (targetType === 'none') {
      // 添加施法者格子
      const caster = this.getUnit(this.currentTurnUnitId);
      if (caster) {
        const casterPos = caster.gridPosition;
        affectedPositions.push({
          team: casterPos.team,
          row: casterPos.row,
          col: casterPos.col
        });
      }
    }
    
    // 去除重复格子
    const uniquePositions = [];
    const positionMap = new Map();
    
    affectedPositions.forEach(pos => {
      const key = `${pos.team}-${pos.row}-${pos.col}`;
      if (!positionMap.has(key)) {
        positionMap.set(key, true);
        uniquePositions.push(pos);
      }
    });
    
    // 移除日志记录，避免频繁调用时的性能问题
    return uniquePositions;
  }

  /**
   * 检查所有单位是否都有行动
   * @returns {boolean} 是否所有单位都已准备
   */
  isAllUnitsReady() {
    const activeUnits = Object.values({
      ...this.battleData.playerUnits,
      ...this.battleData.enemyUnits
    }).filter(unit => !unit.isDefeated);
    
    return activeUnits.length > 0 && 
           activeUnits.every(unit => this.unitActions.has(unit.id));
  }

  /**
   * 获取行动描述
   * @param {string} unitId - 单位ID
   * @returns {string} 行动描述
   */
  getActionDescription(unitId) {
    const actionData = this.unitActions.get(unitId);
    const unit = this.getUnit(unitId);
    
    if (!actionData || !unit) return '无';
    
    const action = actionData.action;
    
    switch (action.type) {
      case 'attack':
        const target = action.targetIds[0] ? this.getUnit(action.targetIds[0]).name : '未知目标';
        return `攻击 ${target}`;
      case 'defend':
        return '防御';
      case 'skill':
        const skillTarget = action.targetIds[0] ? this.getUnit(action.targetIds[0]).name : '未知目标';
        const skill = activeSkillConfig.find(s => s.id === action.skillId);
        return `使用技能 ${skill ? skill.name : action.skillId} 对 ${skillTarget}`;
      default:
        return action.type;
    }
  }

  /**
   * 获取单位可用的行动类型
   * @param {string} unitId - 单位ID
   * @returns {Array} 可用行动类型列表
   */
  getAvailableActionTypes(unitId) {
    const unit = this.getUnit(unitId);
    if (!unit) return [];
    
    const actionTypes = ['attack', 'defend'];
    
    // 检查是否有可用技能
    if (this.getUnitActiveSkills(unitId).length > 0) {
      actionTypes.push('skill');
    }
    
    // 检查特殊行动（如逃跑等）
    if (this.canUnitFlee && this.canUnitFlee(unitId)) {
      actionTypes.push('flee');
    }
    
    return actionTypes;
  }

  /**
   * 获取单位对象
   * @param {string} unitId - 单位ID
   * @returns {Object|null} 单位对象
   */
  getUnit(unitId) {
    if (!this.battleData) return null;
    
    return this.battleData.playerUnits[unitId] || 
           this.battleData.enemyUnits[unitId] || 
           null;
  }

  /**
   * 获取单位可攻击的网格位置
   * @param {string} unitId - 单位ID
   * @returns {Array} 可攻击的网格位置数组
   */
  getAttackableGridPositions(unitId) {
    try {
      if (!unitId || this.state !== BATTLE_ENGINE_STATES.PREPARATION) {
        return [];
      }
      
      const unit = this.getUnit(unitId);
      if (!unit || !unit.isPlayerUnit) {
        return [];
      }
      
      // 获取可攻击的目标单位
      const validTargets = this.getValidTargets(unitId, 'attack');
      
      // 提取目标单位的网格位置
      const attackablePositions = validTargets.map(target => {
        const targetUnit = this.getUnit(target.id);
        if (targetUnit && targetUnit.gridPosition) {
          return {
            team: targetUnit.gridPosition.team,
            row: targetUnit.gridPosition.row,
            col: targetUnit.gridPosition.col
          };
        }
        return null;
      }).filter(pos => pos !== null);
      
      return attackablePositions;
    } catch (error) {
      this._log('获取攻击范围失败', { unitId, error: error.message });
      return [];
    }
  }

  /**
   * 重置指定单位的行动
   * @param {string} unitId - 单位ID
   * @returns {Object} 重置结果
   */
  resetUnitAction(unitId) {
    if (this.state !== BATTLE_ENGINE_STATES.PREPARATION) {
      return {
        success: false,
        error: `当前状态不允许重置行动: ${this.state}`
      };
    }

    if (!unitId) {
      return {
        success: false,
        error: '单位ID不能为空'
      };
    }

    const unit = this.getUnit(unitId);
    if (!unit) {
      return {
        success: false,
        error: '单位不存在'
      };
    }

    if (!unit.isPlayerUnit) {
      return {
        success: false,
        error: '只能重置玩家单位的行动'
      };
    }

    // 删除单位行动
    const hadAction = this.unitActions.has(unitId);
    this.unitActions.delete(unitId);
    
    this._log('单位行动已重置', { unitId, unitName: unit.name, hadAction });
    
    // 发出事件通知
    this._emit('UNIT_ACTION_RESET', {
      unitId,
      unitName: unit.name,
      timestamp: Date.now()
    });

    return {
      success: true,
      unitId,
      hadAction
    };
  }

  /**
   * 设置外部事件总线
   * @param {Object} eventBus - 外部事件总线实例
   */
  setExternalEventBus(eventBus) {
    this.externalEventBus = eventBus;
    console.log(`🔗 [BattleEngine] 外部事件总线已设置:`, !!eventBus);
  }
}

/**
 * 创建战斗引擎实例的工厂函数
 * @param {Object} options - 配置选项
 * @returns {BattleEngine} 战斗引擎实例
 */
export const createBattleEngine = (options = {}) => {
  return new BattleEngine(options);
};

export default BattleEngine; 