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
        const advanceResult = this.advance();
        this._log('初始化后自动推进', advanceResult);
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
        if (this.options.autoAdvance) {
          // 准备阶段完成，进入执行阶段
          this._setState(BATTLE_ENGINE_STATES.EXECUTION);
          this._emit(BATTLE_ENGINE_EVENTS.EXECUTION_STARTED);
          
          // 立即执行所有行动
          setTimeout(() => {
            const result = this.advance();
            this._log('自动执行行动结果', result);
            
            // 执行完成后立即发射状态更新事件
            this._emit('state_changed', {
              oldState: BATTLE_ENGINE_STATES.EXECUTION,
              newState: this.state,
              battleLog: this.battleLog,
              timestamp: Date.now()
            });
          }, 100); // 给UI一点时间更新显示
        }
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
  advance() {
    try {
      switch (this.state) {
        case BATTLE_ENGINE_STATES.PREPARATION:
          return this._startRound();
          
        case BATTLE_ENGINE_STATES.ROUND_START:
          return this._advanceToPreparation();
          
        case BATTLE_ENGINE_STATES.EXECUTION:
          return this._executeAllActions();
          
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
    if (!this.battleData.playerUnits[unitId] && !this.battleData.enemyUnits[unitId]) {
      throw new Error(`单位不存在: ${unitId}`);
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
    
    return { success: true, state: this.state };
  }

  /**
   * 执行所有行动
   * @private
   */
  _executeAllActions() {
    this._log('开始执行所有行动', { actionCount: this.unitActions.size });
    
    // 按速度顺序执行所有行动
    const executionResults = [];
    
    for (const unitId of this.turnOrder) {
      const actionData = this.unitActions.get(unitId);
      if (!actionData) continue;
      
      const unit = this.battleData.playerUnits[unitId] || this.battleData.enemyUnits[unitId];
      if (!unit || unit.isDefeated) continue;
      
      this._log('执行单位行动', { unitId, action: actionData.action });
      
      // 执行行动
      const result = this._processAction(actionData);
      
      executionResults.push({
        unitId,
        actionData,
        result
      });
      
      this._emit(BATTLE_ENGINE_EVENTS.ACTION_EXECUTED, {
        unitId,
        action: actionData,
        result
      });
      
      // 检查战斗是否在此行动后结束
      const battleEndCheck = this._checkBattleEnd();
      if (battleEndCheck.isEnded) {
        this._endBattle(battleEndCheck.result);
        return { success: true, battleEnded: true, result: battleEndCheck.result };
      }
    }
    
    this._setState(BATTLE_ENGINE_STATES.ROUND_END);
    this._emit(BATTLE_ENGINE_EVENTS.EXECUTION_COMPLETE, { results: executionResults });
    
    // 发射数据更新事件，通知UI刷新
    this._emit('BATTLE_DATA_UPDATED', {
      battleUnits: this.getState().battleUnits,
      round: this.currentRound,
      timestamp: Date.now()
    });
    
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
        sourceId: sourceUnit.id,
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