/*
 * @Author: Claude
 * @Date: 2025-01-27
 * @Description: 战斗引擎主适配器 - 提供统一的接口封装战斗引擎
 */

import { BattleEngine } from '../engine/BattleEngine';
import { BattleEventBus, BATTLE_EVENTS } from '../engine/BattleEventBus';
import cloneDeep from 'lodash/cloneDeep';

/**
 * 战斗引擎适配器类
 * 封装战斗引擎，提供统一的外部接口
 */
export class BattleEngineAdapter {
  constructor(options = {}) {
    // 创建战斗引擎实例
    this.engine = new BattleEngine({
      enableLogging: options.enableLogging !== false,
      autoAdvance: options.autoAdvance !== false,
      maxRounds: options.maxRounds || 30
    });

    // 创建事件总线
    this.eventBus = new BattleEventBus({
      enableLogging: options.enableLogging !== false,
      enableHistory: options.enableHistory !== false
    });

    // 将事件总线传递给引擎，用于双队列系统
    this.engine.setExternalEventBus(this.eventBus);

    // UI订阅者管理
    this.uiSubscribers = new Set();
    this.stateSubscribers = new Set();

    // 缓存当前状态，用于性能优化
    this.cachedState = null;
    this.lastStateUpdate = 0;

    // 绑定方法
    this.initializeBattle = this.initializeBattle.bind(this);
    this.getBattleState = this.getBattleState.bind(this);
    this.submitPlayerAction = this.submitPlayerAction.bind(this);
    this.advanceBattle = this.advanceBattle.bind(this);
    this.subscribeToStateChanges = this.subscribeToStateChanges.bind(this);
    this.subscribeToEvents = this.subscribeToEvents.bind(this);

    // 设置引擎事件监听
    this._setupEngineEventListeners();

    this._log('战斗引擎适配器创建完成');
  }

  /**
   * 初始化战斗
   * @param {Object} battleConfig - 战斗配置数据
   * @returns {Object} 初始化结果
   */
  initializeBattle(battleConfig) {
    try {
      this._log('开始初始化战斗', { playerUnits: Object.keys(battleConfig.playerUnits || {}).length });

      // 使用引擎初始化战斗
      const result = this.engine.initialize(battleConfig);

      if (result.success) {
        // 发布战斗初始化事件
        this.eventBus.emit(BATTLE_EVENTS.BATTLE_INITIALIZED, {
          battleId: result.battleId,
          config: battleConfig
        });

        // 更新缓存状态
        this._updateCachedState();

        // 通知所有订阅者
        this._notifyStateSubscribers();

        this._log('战斗初始化成功', { battleId: result.battleId });
      }

      return result;
    } catch (error) {
      this._log('战斗初始化失败', { error: error.message });
      this.eventBus.emit(BATTLE_EVENTS.ERROR_OCCURRED, { error });
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取战斗状态（为UI提供的格式化状态）
   * @returns {Object} 格式化的战斗状态
   */
  getBattleState() {
    // 如果缓存状态存在且未过期，直接返回
    const now = Date.now();
    if (this.cachedState && (now - this.lastStateUpdate) < 100) {
      return this.cachedState;
    }

    const engineState = this.engine.getState();
    
    // 将引擎状态转换为UI友好的格式
    const formattedState = this._formatStateForUI(engineState);
    
    // 更新缓存
    this.cachedState = formattedState;
    this.lastStateUpdate = now;

    return formattedState;
  }

  /**
   * 提交玩家行动
   * @param {string} unitId - 单位ID
   * @param {Object} action - 行动数据
   * @returns {Object} 提交结果
   */
  submitPlayerAction(unitId, action) {
    try {
      const result = this.engine.submitAction(unitId, action);

      if (result.success) {
        // 发布行动提交事件
        this.eventBus.emit(BATTLE_EVENTS.ACTION_SUBMITTED, {
          unitId,
          action,
          queuePosition: result.queuePosition
        });

        // 更新状态并通知订阅者
        this._updateCachedState();
        this._notifyStateSubscribers();

        this._log('玩家行动提交成功', { unitId, actionType: action.type });
      }

      return result;
    } catch (error) {
      this._log('玩家行动提交失败', { unitId, error: error.message });
      this.eventBus.emit(BATTLE_EVENTS.ERROR_OCCURRED, { error });
      return { success: false, error: error.message };
    }
  }

  /**
   * 推进战斗流程
   * @returns {Object} 推进结果
   */
  advanceBattle() {
    try {
      const result = this.engine.advance();

      if (result.success) {
        // 根据结果发布相应事件
        if (result.battleEnded) {
          this.eventBus.emit(BATTLE_EVENTS.BATTLE_ENDED, { result: result.result });
        } else if (result.actionExecuted) {
          this.eventBus.emit(BATTLE_EVENTS.ACTION_EXECUTED, {
            actionsRemaining: result.actionsRemaining
          });
        } else if (result.newRound) {
          this.eventBus.emit(BATTLE_EVENTS.ROUND_STARTED, { round: result.newRound });
        }

        // 更新状态并通知订阅者
        this._updateCachedState();
        this._notifyStateSubscribers();

        this._log('战斗推进成功', result);
      }

      return result;
    } catch (error) {
      this._log('战斗推进失败', { error: error.message });
      this.eventBus.emit(BATTLE_EVENTS.ERROR_OCCURRED, { error });
      return { success: false, error: error.message };
    }
  }

  /**
   * 订阅状态变化
   * @param {Function} callback - 状态变化回调函数
   * @returns {Function} 取消订阅函数
   */
  subscribeToStateChanges(callback) {
    this.stateSubscribers.add(callback);

    // 立即调用一次以获取当前状态
    try {
      const engineState = this.engine.getState();
      const formattedState = this.getBattleState();
      
      console.log('[BattleEngineAdapter] 引擎原始状态:', engineState);
      console.log('[BattleEngineAdapter] 格式化后状态:', formattedState);
      
      callback(formattedState);
    } catch (error) {
      this._log('状态订阅回调执行失败', { error: error.message });
    }

    // 返回取消订阅函数
    return () => {
      this.stateSubscribers.delete(callback);
    };
  }

  /**
   * 订阅战斗事件
   * @param {string|Object} eventType - 事件类型或事件映射对象
   * @param {Function} callback - 事件回调函数
   * @returns {Function} 取消订阅函数
   */
  subscribeToEvents(eventType, callback) {
    if (typeof eventType === 'object') {
      // 批量订阅
      return this.eventBus.subscribeMultiple(eventType);
    } else {
      // 单个订阅
      return this.eventBus.subscribe(eventType, callback);
    }
  }

  /**
   * 获取战斗结果
   * @returns {Object|null} 战斗结果
   */
  getBattleResult() {
    return this.engine.getResult();
  }

  /**
   * 获取单位的交互数据
   * @param {string} unitId - 单位ID
   * @returns {Object} - 包含可用技能、目标等信息的对象
   */
  getUnitInteractionData(unitId) {
    if (!this.engine || !unitId) {
      return {
        activeSkills: [],
        validTargets: [],
        availableActionTypes: [],
        actionDescription: '无',
        skillAffectedArea: []
      };
    }

    const unit = this.engine.getUnit(unitId);
    if (!unit) return {};

    // 注意：这里需要从引擎获取更多数据
    return {
      activeSkills: this.engine.getUnitActiveSkills(unitId),
      validTargets: [], // 暂时为空
      availableActionTypes: this.engine.getAvailableActionTypes(unitId),
      actionDescription: this.engine.getActionDescription(unitId),
      skillAffectedArea: [], // 暂时为空
    };
  }

  /**
   * 获取兼容Redux选择器的代理对象
   * @returns {Object} 选择器代理
   */
  getSelectorsProxy() {
    const state = this.getBattleState();

    return {
      // 基本状态选择器
      selectIsBattleActive: () => state.isActive,
      selectCurrentPhase: () => state.currentPhase,
      selectCurrentRound: () => state.currentRound,
      selectBattleResult: () => state.result,

      // 单位相关选择器
      selectBattleUnits: () => state.battleUnits || {},
      selectPlayerFormation: () => state.playerFormation || [],
      selectEnemyFormation: () => state.enemyFormation || [],
      
      // 行动相关选择器
      selectTurnOrder: () => state.turnOrder || [],
      selectCurrentTurnUnitId: () => state.currentTurnUnitId,
      selectUnitActions: () => state.unitActions || {},
      
      // 日志和奖励
      selectBattleLog: () => state.battleLog || [],
      selectRewards: () => state.rewards,

      // 单位查询选择器
      selectBattleUnitById: (unitId) => state.battleUnits?.[unitId] || null,
      selectUnitActionById: (unitId) => state.unitActions?.[unitId] || null,

      // 状态检查选择器
      selectAllUnitsHaveActions: () => {
        const units = state.battleUnits || {};
        const actions = state.unitActions || {};
        const activeUnits = Object.values(units).filter(unit => !unit.isDefeated);
        return activeUnits.length > 0 && activeUnits.every(unit => actions[unit.id]);
      }
    };
  }

  /**
   * 获取调试信息
   * @returns {Object} 调试信息
   */
  getDebugInfo() {
    return {
      engine: {
        state: this.engine.state,
        battleId: this.engine.id,
        currentRound: this.engine.currentRound
      },
      eventBus: this.eventBus.getDebugInfo(),
      adapter: {
        subscriberCounts: {
          state: this.stateSubscribers.size,
          ui: this.uiSubscribers.size
        },
        cacheInfo: {
          hasCachedState: !!this.cachedState,
          lastUpdate: this.lastStateUpdate
        }
      }
    };
  }

  /**
   * 重置适配器
   */
  reset() {
    // 重置底层战斗引擎
    this.engine.reset();

    // 清空订阅者
    this.stateSubscribers.clear();
    this.uiSubscribers.clear();

    // 清空缓存
    this.cachedState = null;
    this.lastStateUpdate = 0;

    // 清空事件总线
    this.eventBus.clearAllListeners();
    this.eventBus.clearHistory();

    // 重新设置引擎事件监听
    this._setupEngineEventListeners();

    this._log('适配器已重置');
  }

  // ==================== 私有方法 ====================

  /**
   * 设置引擎事件监听器
   * @private
   */
  _setupEngineEventListeners() {
    // 监听引擎内部事件并转发到事件总线
    this.engine.subscribe('state_changed', (event) => {
      this.eventBus.emit(BATTLE_EVENTS.PHASE_CHANGED, {
        oldState: event.data.oldState,
        newState: event.data.newState
      });
      
      // 强制更新缓存状态并通知订阅者
      this._updateCachedState();
      this._notifyStateSubscribers();
    });

    this.engine.subscribe('battle_initialized', (event) => {
      this.eventBus.emit(BATTLE_EVENTS.BATTLE_STARTED, event.data);
      this._updateCachedState();
      this._notifyStateSubscribers();
    });

    this.engine.subscribe('action_executed', (event) => {
      console.log('🔄 适配器接收到action_executed事件:', event.data);
      this.eventBus.emit(BATTLE_EVENTS.ACTION_EXECUTED, event.data);
      console.log('📤 适配器转发ACTION_EXECUTED事件到事件总线');
      this._updateCachedState();
      this._notifyStateSubscribers();
    });

    this.engine.subscribe('battle_ended', (event) => {
      this.eventBus.emit(BATTLE_EVENTS.BATTLE_ENDED, event.data);
      this._updateCachedState();
      this._notifyStateSubscribers();
    });
    
    // 监听我们新添加的伤害事件
    this.engine.subscribe('DAMAGE_DEALT', (event) => {
      this.eventBus.emit(BATTLE_EVENTS.DAMAGE_DEALT, event.data);
      this._updateCachedState();
      this._notifyStateSubscribers();
    });
    
    // 监听数据更新事件
    this.engine.subscribe('BATTLE_DATA_UPDATED', (event) => {
      this._updateCachedState();
      this._notifyStateSubscribers();
    });
  }

  /**
   * 更新缓存状态
   * @private
   */
  _updateCachedState() {
    this.cachedState = null; // 清空缓存，强制下次获取时重新计算
  }

  /**
   * 通知状态订阅者
   * @private
   */
  _notifyStateSubscribers() {
    const currentState = this.getBattleState();

    for (const callback of this.stateSubscribers) {
      try {
        callback(currentState);
      } catch (error) {
        this._log('状态订阅者回调执行失败', { error: error.message });
      }
    }
  }

  /**
   * 将引擎状态格式化为UI友好的格式
   * @private
   */
  _formatStateForUI(engineState) {
    if (!engineState || !engineState.battleData) {
      return {
        isActive: false,
        battleId: null,
        currentPhase: 'idle',
        currentRound: 0,
        battleUnits: {},
        playerFormation: [],
        enemyFormation: [],
        turnOrder: [],
        unitActions: {},
        battleLog: [],
        result: null
      };
    }

    // 转换单位数据格式
    const battleUnits = {};
    if (engineState.battleData.playerUnits) {
      Object.assign(battleUnits, engineState.battleData.playerUnits);
    }
    if (engineState.battleData.enemyUnits) {
      Object.assign(battleUnits, engineState.battleData.enemyUnits);
    }

    // 使用引擎直接提供的unitActions数据
    const unitActions = engineState.unitActions || {};
    console.log(battleUnits,"更新，battleUnits");
    return {
      isActive: engineState.isActive,
      battleId: engineState.battleId,
      currentPhase: engineState.currentPhase,
      currentRound: engineState.currentRound,
      battleUnits: cloneDeep(battleUnits),
      playerFormation: engineState.battleData.playerFormation || [],
      enemyFormation: engineState.battleData.enemyFormation || [],
      turnOrder: engineState.battleData.turnOrder || [],
      currentTurnUnitId: this._getCurrentTurnUnitId(engineState),
      unitActions,
      battleLog: engineState.battleLog || [],
      result: engineState.result,
      rewards: engineState.result?.rewards || null
    };
  }

  /**
   * 获取当前行动单位ID
   * @private
   */
  _getCurrentTurnUnitId(engineState) {
    if (!engineState.battleData?.turnOrder) return null;
    
    const { turnOrder, currentTurnIndex = 0 } = engineState.battleData;
    return turnOrder[currentTurnIndex] || null;
  }

  /**
   * 日志记录
   * @private
   */
  _log(message, data = {}) {
    console.log(`[BattleEngineAdapter] ${message}`, data);
  }

  /**
   * 检查是否需要处理AI行动
   * @private
   */
  _processAIActionsIfNeeded() {
    try {
      // 检查引擎状态是否为准备阶段
      if (this.engine.state !== 'preparation') {
        return;
      }
      
      // 获取所有玩家单位，看是否都已有行动
      const allPlayerUnits = Object.values(this.engine.battleData.playerUnits || {});
      const playerUnitsWithActions = allPlayerUnits.filter(unit => 
        !unit.isDefeated && this.engine.unitActions.has(unit.id)
      );
      
      const activePlayerUnits = allPlayerUnits.filter(unit => !unit.isDefeated);
      
      // 如果所有玩家单位都有行动了，处理AI行动
      if (activePlayerUnits.length > 0 && playerUnitsWithActions.length === activePlayerUnits.length) {
        this._log('所有玩家单位已有行动，开始处理AI行动');
        
        const result = this.engine.processAIActions();
        
        if (result.success) {
          this._log(`AI行动处理完成: ${result.actionsProcessed} 个行动已设置`);
          
          // 更新状态并通知订阅者
          this._updateCachedState();
          this._notifyStateSubscribers();
        } else {
          this._log('AI行动处理失败', { error: result.error });
        }
      } else {
        this._log('等待更多玩家行动', { 
          activePlayerUnits: activePlayerUnits.length,
          playerUnitsWithActions: playerUnitsWithActions.length 
        });
      }
    } catch (error) {
      this._log('AI行动处理检查失败', { error: error.message });
    }
  }
}

// /**
//  * 创建战斗引擎适配器实例
//  * @param {Object} options - 配置选项
//  * @returns {BattleEngineAdapter} 适配器实例
//  */
export const createBattleEngineAdapter = (options = {}) => {
  return new BattleEngineAdapter(options);
};

export default BattleEngineAdapter; 