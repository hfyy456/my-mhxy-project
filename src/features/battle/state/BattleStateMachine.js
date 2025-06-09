/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-01-27
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-09 06:21:15
 * @Description: 战斗系统状态机 - 使用分层状态机管理复杂战斗流程
 */

import { generateUniqueId } from '@/utils/idUtils';
import { BATTLE_PHASES, UNIQUE_ID_PREFIXES } from '@/config/enumConfig';
import { 
  calculateBattleDamage, 
  applyDamageToTarget,
  calculateHealing,
  applyHealingToTarget 
} from '../logic/damageCalculation';
import { 
  executeSkillEffect,
  getSkillById,
  processBuffEffects 
} from '../logic/skillSystem';
import { 
  processBuffsOnTurnStart,
  processBuffsOnTurnEnd,
  isUnitAffectedByEffect 
} from '../logic/buffManager';
import { triggerPassiveSkillEffects } from '../logic/passiveSkillSystem';
import { BattleUnit } from '../models/BattleUnit';
import { determineActionOrder } from '../logic/turnOrder';
import { playAction } from '../logic/actionPlayer';
import { setUnitFsmState } from '@/store/slices/battleSlice';

// 战斗状态枚举
export const BATTLE_STATES = {
  // 主状态
  IDLE: 'idle',
  INITIALIZATION: 'initialization', 
  ACTIVE: 'active',
  END: 'end',
  
  // 激活状态的子状态
  ROUND_START: 'round_start',
  PREPARATION: 'preparation',
  EXECUTION: 'execution', 
  RESOLUTION: 'resolution',
  
  // 准备阶段子状态
  PREP_PROCESS_ROUND_START_BUFFS: 'prep_process_round_start_buffs',
  PREP_PLAYER_ACTION_SELECTION: 'prep_player_action_selection',
  PREP_AI_ACTION_SELECTION: 'prep_ai_action_selection',
  PREP_ALL_ACTIONS_READY: 'prep_all_actions_ready',
  
  // 执行阶段子状态
  EXEC_DETERMINE_ACTION_ORDER: 'exec_determine_action_order',
  EXEC_EXECUTE_NEXT_ACTION: 'exec_execute_next_action',
  EXEC_PROCESS_ACTION: 'exec_process_action',
  EXEC_CHECK_MORE_ACTIONS: 'exec_check_more_actions',
  
  // 行动处理子状态
  ACTION_VALIDATE: 'action_validate',
  ACTION_CALCULATE_EFFECT: 'action_calculate_effect',
  ACTION_APPLY_DAMAGE: 'action_apply_damage',
  ACTION_APPLY_BUFFS: 'action_apply_buffs',
  ACTION_TRIGGER_PASSIVES: 'action_trigger_passives',
  
  // 结算阶段子状态
  RESOL_PROCESS_ROUND_END_BUFFS: 'resol_process_round_end_buffs',
  RESOL_CHECK_DEFEAT_CONDITIONS: 'resol_check_defeat_conditions',
  RESOL_UPDATE_BATTLE_STATE: 'resol_update_battle_state'
};

// 战斗事件
export const BATTLE_EVENTS = {
  START_BATTLE: 'start_battle',
  INITIALIZATION_COMPLETE: 'initialization_complete',
  ROUND_START: 'round_start',
  PREPARATION_COMPLETE: 'preparation_complete',
  EXECUTION_COMPLETE: 'execution_complete',
  RESOLUTION_COMPLETE: 'resolution_complete',
  BATTLE_END: 'battle_end',
  RESET_BATTLE: 'reset_battle',
  
  // 内部状态转换事件
  BUFFS_PROCESSED: 'buffs_processed',
  ACTIONS_SELECTED: 'actions_selected',
  ACTION_ORDER_DETERMINED: 'action_order_determined',
  ACTION_EXECUTED: 'action_executed',
  NO_MORE_ACTIONS: 'no_more_actions',
  CONDITIONS_CHECKED: 'conditions_checked',
  STATE_UPDATED: 'state_updated'
};

/**
 * 战斗状态机类
 */
export class BattleStateMachine {
  constructor(dispatch, getState, options = { enableLogging: true }) {
    this.dispatch = dispatch;
    this.getState = getState;
    this.currentState = BATTLE_STATES.IDLE;
    this.currentSubState = null;
    this.stateHistory = [];
    this.eventHandlers = this._initializeEventHandlers();
    this.context = {
      currentActionIndex: 0,
      actionQueue: [],
      currentProcessingAction: null,
      battleLog: [],
      roundNumber: 0
    };
    this.loggingEnabled = options.enableLogging;
    this.listeners = new Set();
    
    // 引擎集成支持
    this.battleEngine = options.battleEngine || null;
    this.engineIntegrationEnabled = options.engineIntegrationEnabled || false;
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener) {
    this.listeners.add(listener);
    // 返回一个取消订阅的函数
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听者状态已更新
   */
  _notifyListeners() {
    const currentState = this.getCurrentState();
    for (const listener of this.listeners) {
      try {
        listener(currentState);
      } catch (error) {
        console.error('[BattleStateMachine] 调用监听者时出错:', error);
      }
    }
  }

  /**
   * 内部日志记录帮助函数
   */
  _log(message) {
    if (this.loggingEnabled) {
      console.log(`[BattleStateMachine] ${message}`);
    }
  }

  /**
   * 初始化事件处理器
   */
  _initializeEventHandlers() {
    return {
      [BATTLE_EVENTS.START_BATTLE]: this._handleStartBattle.bind(this),
      [BATTLE_EVENTS.INITIALIZATION_COMPLETE]: this._handleInitializationComplete.bind(this),
      [BATTLE_EVENTS.ROUND_START]: this._handleRoundStart.bind(this),
      [BATTLE_EVENTS.PREPARATION_COMPLETE]: this._handlePreparationComplete.bind(this),
      [BATTLE_EVENTS.EXECUTION_COMPLETE]: this._handleExecutionComplete.bind(this),
      [BATTLE_EVENTS.RESOLUTION_COMPLETE]: this._handleResolutionComplete.bind(this),
      [BATTLE_EVENTS.BATTLE_END]: this._handleBattleEnd.bind(this),
      [BATTLE_EVENTS.RESET_BATTLE]: this._handleResetBattle.bind(this),
      
      // 内部事件
      [BATTLE_EVENTS.BUFFS_PROCESSED]: this._handleBuffsProcessed.bind(this),
      [BATTLE_EVENTS.ACTIONS_SELECTED]: this._handleActionsSelected.bind(this),
      [BATTLE_EVENTS.ACTION_ORDER_DETERMINED]: this._handleActionOrderDetermined.bind(this),
      [BATTLE_EVENTS.ACTION_EXECUTED]: this._handleActionExecuted.bind(this),
      [BATTLE_EVENTS.NO_MORE_ACTIONS]: this._handleNoMoreActions.bind(this),
      [BATTLE_EVENTS.CONDITIONS_CHECKED]: this._handleConditionsChecked.bind(this),
      [BATTLE_EVENTS.STATE_UPDATED]: this._handleStateUpdated.bind(this)
    };
  }

  /**
   * 触发事件，驱动状态机转换
   */
  trigger(event, payload = null) {
    this._log(`EVENT TRIGGERED: ${event} | Current State: ${this.currentState}/${this.currentSubState || 'none'}`);
    
    // 记录状态历史
    this.stateHistory.push({
      state: this.currentState,
      subState: this.currentSubState,
      event,
      timestamp: Date.now(),
      payload
    });

    // 执行事件处理器
    const handler = this.eventHandlers[event];
    if (handler) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[BattleStateMachine] 处理事件 ${event} 时发生错误:`, error);
        this._logError(`处理事件 ${event} 失败: ${error.message}`);
      }
    } else {
      console.warn(`[BattleStateMachine] 未找到事件处理器: ${event}`);
      this._log(`WARN: No handler found for event ${event}`);
    }
  }

  /**
   * 获取当前状态信息
   */
  getCurrentState() {
    return {
      state: this.currentState,
      subState: this.currentSubState,
      context: { ...this.context }
    };
  }

  /**
   * 切换到新状态
   */
  _transitionTo(newState, newSubState = null) {
    const previousState = this.currentState;
    const previousSubState = this.currentSubState;
    
    this.currentState = newState;
    this.currentSubState = newSubState;
    
    this._log(`STATE TRANSITION: ${previousState}/${previousSubState || 'none'} -> ${newState}/${newSubState || 'none'}`);
    
    // 触发状态进入处理
    this._onStateEnter(newState, newSubState);
    
    // 通知监听者状态已改变
    this._notifyListeners();
  }

  /**
   * 状态进入处理
   */
  _onStateEnter(state, subState) {
    this._log(`ENTERING STATE: ${state}/${subState || 'none'}`);
    switch (state) {
      case BATTLE_STATES.INITIALIZATION:
        this._initializeBattle();
        break;
      case BATTLE_STATES.ACTIVE:
        if (subState === BATTLE_STATES.ROUND_START) {
          this._startNewRound();
        }
        break;
      case BATTLE_STATES.PREPARATION:
        this._enterPreparationPhase();
        break;
      case BATTLE_STATES.EXECUTION:
        this._enterExecutionPhase();
        break;
      case BATTLE_STATES.RESOLUTION:
        this._enterResolutionPhase();
        break;
      case BATTLE_STATES.END:
        this._endBattle();
        break;
    }
  }

  // ==================== 事件处理器 ====================

  _handleStartBattle(payload) {
    this._log(`EVENT: START_BATTLE received. Dispatching 'setupBattle' to Redux.`);
    
    // Dispatch the setup action to synchronously prepare the state in Redux.
    this.dispatch({
        type: 'battle/setupBattle',
        payload
    });

    // Directly transition to the ACTIVE state, starting with the ROUND_START sub-state.
    this._transitionTo(BATTLE_STATES.ACTIVE, BATTLE_STATES.ROUND_START);
  }

  _handleInitializationComplete(payload) {
    if (this.currentState === BATTLE_STATES.INITIALIZATION) {
      this._transitionTo(BATTLE_STATES.ACTIVE, BATTLE_STATES.ROUND_START);
    }
  }

  _handleRoundStart(payload) {
    if (this.currentState === BATTLE_STATES.ACTIVE) {
      this._transitionTo(BATTLE_STATES.ACTIVE, BATTLE_STATES.PREPARATION);
    }
  }

  _handlePreparationComplete(payload) {
    if (this.currentSubState === BATTLE_STATES.PREPARATION) {
      this._transitionTo(BATTLE_STATES.ACTIVE, BATTLE_STATES.EXECUTION);
    }
  }

  _handleExecutionComplete(payload) {
    if (this.currentSubState === BATTLE_STATES.EXECUTION) {
      this._transitionTo(BATTLE_STATES.ACTIVE, BATTLE_STATES.RESOLUTION);
    }
  }

  _handleResolutionComplete(payload) {
    if (this.currentSubState === BATTLE_STATES.RESOLUTION) {
      const battleState = this.getState().battle;
      
      // 检查战斗是否结束
      if (this._checkBattleEndConditions(battleState)) {
        this._transitionTo(BATTLE_STATES.END);
      } else {
        // 开始新回合
        this._transitionTo(BATTLE_STATES.ACTIVE, BATTLE_STATES.ROUND_START);
      }
    }
  }

  _handleBattleEnd(payload) {
    this._transitionTo(BATTLE_STATES.END);
  }

  _handleResetBattle(payload) {
    this._transitionTo(BATTLE_STATES.IDLE);
    this._resetContext();
  }

  // 内部事件处理器
  _handleBuffsProcessed(payload) {
    if (this.currentSubState === BATTLE_STATES.PREPARATION) {
      // 根据当前准备阶段的具体子状态决定下一步
      this._advancePreparationPhase();
    }
  }

  _handleActionsSelected(payload) {
    if (this.currentSubState === BATTLE_STATES.PREPARATION) {
      this.trigger(BATTLE_EVENTS.PREPARATION_COMPLETE);
    }
  }

  _handleActionOrderDetermined(payload) {
    if (this.currentSubState === BATTLE_STATES.EXECUTION) {
      this._executeNextAction();
    }
  }

  _handleActionExecuted(payload) {
    if (this.currentSubState === BATTLE_STATES.EXEC_EXECUTE_NEXT_ACTION) {
      // 在异步模型中，这个事件由 _executeNextAction 内部处理
      // this._checkForMoreActions();
    }
  }

  _handleNoMoreActions(payload) {
    if (this.currentSubState === BATTLE_STATES.EXECUTION) {
      this.trigger(BATTLE_EVENTS.EXECUTION_COMPLETE);
    }
  }

  _handleConditionsChecked(payload) {
    if (this.currentSubState === BATTLE_STATES.RESOLUTION) {
      this.trigger(BATTLE_EVENTS.STATE_UPDATED);
    }
  }

  _handleStateUpdated(payload) {
    if (this.currentSubState === BATTLE_STATES.RESOLUTION) {
      this.trigger(BATTLE_EVENTS.RESOLUTION_COMPLETE);
    }
  }

  // ==================== 状态处理方法 ====================

  /**
   * 初始化战斗，准备所有单位和数据
   * This method now assumes the Redux state is already populated by 'setupBattle' reducer.
   */
  _initializeBattle() {
    this._log('Phase: INITIALIZATION - Reading pre-prepared state from Redux.');
    
    // At this point, `setupBattle` has run, so the state is ready.
    const { battleId, battleUnits, playerTeam, enemyTeam } = this.getState().battle;

    if (!battleId || !battleUnits) {
        this._logError("CRITICAL: _initializeBattle called but state is not ready. 'setupBattle' might have failed.");
        return;
    }

    this._log(`Battle initialized with ID: ${battleId}. Units are ready.`);
    
    // The state is already set up. We just need to trigger the completion event
    // for the state machine to proceed.
    this.trigger(BATTLE_EVENTS.INITIALIZATION_COMPLETE);
  }

  /**
   * 开始新回合
   */
  _startNewRound() {
    this.context.roundNumber += 1;
    this._log(`Phase: ROUND START - Beginning round ${this.context.roundNumber}.`);
    this.dispatch({ type: 'battle/startRound', payload: this.context.roundNumber });
    this._transitionTo(BATTLE_STATES.ACTIVE, BATTLE_STATES.PREPARATION);
  }

  /**
   * 进入准备阶段
   */
  _enterPreparationPhase() {
    this._log('Sub-Phase: PREPARATION - Processing round-start buffs and waiting for action selections.');
    this._processRoundStartBuffs();
    
    // 如果启用了引擎集成，自动处理AI行动
    if (this.engineIntegrationEnabled && this.battleEngine) {
      this._log('状态机自动调用引擎AI处理');
      setTimeout(() => {
        this._processAIActionsWithEngine();
      }, 500); // 延迟500ms确保BUFF处理完成
    }
    
    // 接下来等待UI触发 `completePreparation` 或AI完成选择
  }

  /**
   * 处理回合开始时的BUFF效果
   */
  _processRoundStartBuffs() {
    this._log('Sub-Phase: PREPARATION - Processing round-start buffs.');
    const battleState = this.getState().battle;
    const allUnits = Object.values(battleState.battleUnits);
    
    allUnits.forEach(unit => {
      if (!unit.isDefeated) {
        const buffResults = processBuffsOnTurnStart(unit);
        
        buffResults.forEach(result => {
          this.dispatch({
            type: 'battle/addBattleLog',
            payload: {
              message: result.message,
              timestamp: Date.now(),
              unitId: unit.id,
              type: 'BUFF_EFFECT'
            }
          });
        });
      }
    });

    // BUFF处理完成，进入下一阶段
    this.trigger(BATTLE_EVENTS.BUFFS_PROCESSED);
  }

  /**
   * 使用引擎自动处理AI行动
   * @private
   */
  _processAIActionsWithEngine() {
    if (!this.battleEngine) {
      this._log('警告：引擎未设置，跳过AI处理');
      return;
    }

    try {
      this._log('开始自动AI行动处理');
      const result = this.battleEngine.processAIActions();
      
      if (result.success) {
        this._log(`AI行动处理成功: ${result.actionsProcessed} 个行动已设置`);
        
        if (result.errors && result.errors.length > 0) {
          this._log(`AI处理中有错误:`, result.errors);
        }
        
        // 检查是否所有单位都已准备完成
        setTimeout(() => {
          this._checkAllUnitsReady();
        }, 100);
      } else {
        this._logError(`AI行动处理失败: ${result.error}`);
      }
    } catch (error) {
      this._logError(`AI行动处理异常: ${error.message}`);
    }
  }

  /**
   * 检查所有单位是否都已准备完成（引擎集成版本）
   * @private
   */
  _checkAllUnitsReady() {
    if (!this.battleEngine) {
      // 回退到原有逻辑
      this._advancePreparationPhase();
      return;
    }

    try {
      const allReady = this.battleEngine.isAllUnitsReady();
      
      if (allReady) {
        this._log('所有单位行动已准备完成，触发准备完成事件');
        this.trigger(BATTLE_EVENTS.ACTIONS_SELECTED);
      } else {
        this._log('仍有单位未完成行动选择，等待中...');
        // 可以设置一个定时器再次检查
        setTimeout(() => {
          this._checkAllUnitsReady();
        }, 1000);
      }
    } catch (error) {
      this._logError(`检查单位准备状态失败: ${error.message}`);
      // 回退到原有逻辑
      this._advancePreparationPhase();
    }
  }

  /**
   * 推进准备阶段（保留原有逻辑作为后备）
   */
  _advancePreparationPhase() {
    // 检查所有单位是否都已选择行动
    const battleState = this.getState().battle;
    const activeUnits = Object.values(battleState.battleUnits).filter(unit => !unit.isDefeated);
    const unitsWithActions = Object.keys(battleState.unitActions).length;
    
    if (unitsWithActions >= activeUnits.length) {
      this.trigger(BATTLE_EVENTS.ACTIONS_SELECTED);
    } else {
      console.log('[BattleStateMachine] 等待所有单位选择行动...');
    }
  }

  /**
   * 进入执行阶段（集成引擎支持）
   */
  _enterExecutionPhase() {
    this._log('ENTERING EXECUTION PHASE. Determining action order.');
    this._transitionTo(BATTLE_STATES.ACTIVE, BATTLE_STATES.EXEC_DETERMINE_ACTION_ORDER);
    
    // 如果启用引擎集成，使用引擎处理执行阶段
    if (this.engineIntegrationEnabled && this.battleEngine) {
      this._executeWithEngine();
    } else {
      // 使用原有逻辑
      this._determineActionOrder();
    }
  }

  /**
   * 使用引擎执行战斗行动
   * @private
   */
  _executeWithEngine() {
    this._log('使用引擎执行战斗阶段');
    
    try {
      // 引擎会自动处理行动执行
      const result = this.battleEngine.advance();
      
      if (result.success) {
        this._log('引擎执行阶段完成');
        
        // 设置自动推进到解析阶段
        setTimeout(() => {
          this.trigger(BATTLE_EVENTS.NO_MORE_ACTIONS);
        }, 2000);
      } else {
        this._logError(`引擎执行失败: ${result.error}`);
        // 回退到原有逻辑
        this._determineActionOrder();
      }
    } catch (error) {
      this._logError(`引擎执行异常: ${error.message}`);
      // 回退到原有逻辑
      this._determineActionOrder();
    }
  }

  /**
   * 确定行动顺序
   */
  _determineActionOrder() {
    const allUnits = Object.values(this.getState().battle.battleUnits);
    const actions = Object.values(this.getState().battle.unitActions);
    const turnOrder = determineActionOrder(allUnits, actions);
    this.context.actionQueue = turnOrder;
    this.context.currentActionIndex = 0;
    this._log(`Action order determined: ${this.context.actionQueue.map(a => a.unitId).join(', ')}`);
    this.trigger(BATTLE_EVENTS.ACTION_ORDER_DETERMINED);
  }

  // 将 _executeNextAction 修改为 async 函数
  async _executeNextAction() {
    if (this.context.currentActionIndex >= this.context.actionQueue.length) {
      this._log('No more actions in queue.');
      this.trigger(BATTLE_EVENTS.NO_MORE_ACTIONS);
      return;
    }

    const action = this.context.actionQueue[this.context.currentActionIndex];
    const { unitId, skillId, targetIds } = action; // 假设 action 结构如此

    this._log(`Executing action #${this.context.currentActionIndex + 1} for unit ${unitId}`);
    this._transitionTo(BATTLE_STATES.ACTIVE, BATTLE_STATES.EXEC_EXECUTE_NEXT_ACTION);

    // ******* 开始异步改造 *******

    // 1. 更新单位FSM状态为EXECUTING
    this.dispatch(setUnitFsmState({ unitId, fsmState: 'EXECUTING' }));

    // 2. 调用 playAction 并等待其完成
    // 注意：playAction 需要一个更完整的 action 对象
    // 我们在这里模拟构建它
    const battleState = this.getState().battle;
    const skill = getSkillById(skillId, battleState); // 假设有这个函数
    const damage = 10; // 伤害计算需要在这里或 playAction 内部完成，暂时硬编码

    // 假设是单体技能
    const targetId = targetIds[0];

    const fullActionPayload = {
      casterId: unitId,
      targetId: targetId,
      skill: skill,
      damage: damage,
    };

    await playAction(fullActionPayload, this.dispatch);

    // 3. 动作完成后，将单位状态恢复为IDLE
    this.dispatch(setUnitFsmState({ unitId, fsmState: 'IDLE' }));

    // ******* 结束异步改造 *******

    // 4. 继续下一个动作
    this.context.currentActionIndex++;
    this._checkForMoreActions();
  }

  _processAction(unitInstance, action) {
    // 这个函数的功能现在被 playAction 和相关的系统（如damageCalculation）所取代。
    // 在完全重构后，这个函数可能会被移除或简化为只做数据准备。
    // 为了平滑过渡，我们暂时保留它，但执行流程不再调用它。
    this._log(`[DEPRECATED] _processAction called for unit ${unitInstance.id}. This logic should be moved to actionPlayer.`);
    // ... 原有的伤害计算、buff施加等逻辑
  }

  /**
   * 检查是否还有更多行动
   */
  _checkForMoreActions() {
    if (this.context.currentActionIndex < this.context.actionQueue.length) {
      this._log('There are more actions. Executing next one.');
      this._executeNextAction(); // 直接调用
    } else {
      this.trigger(BATTLE_EVENTS.NO_MORE_ACTIONS);
    }
  }

  /**
   * 进入结算阶段
   */
  _enterResolutionPhase() {
    this._log('Sub-Phase: RESOLUTION - All actions for the round are complete.');
    this._transitionTo(BATTLE_STATES.ACTIVE, BATTLE_STATES.RESOL_PROCESS_ROUND_END_BUFFS);
  }

  /**
   * 处理回合结束时的Buff效果
   */
  _processRoundEndBuffs() {
    this._log('RESOLUTION - Processing end-of-round effects (like poison, regeneration).');
    const battleState = this.getState().battle;
    const units = Object.values(battleState.battleUnits);
    const results = processBuffsOnTurnEnd(units);
    
    results.forEach(result => {
      this._log(`  - ${result.unitName}: ${result.effectName} deals ${result.damage || 0} damage, heals ${result.healing || 0} HP.`);
    });

    this._transitionTo(BATTLE_STATES.ACTIVE, BATTLE_STATES.RESOL_CHECK_DEFEAT_CONDITIONS);
  }

  /**
   * 结束战斗
   */
  _endBattle() {
    console.log('[BattleStateMachine] 战斗结束');
    
    const battleState = this.getState().battle;
    
    this.dispatch({
      type: 'battle/setCurrentPhase',
      payload: BATTLE_PHASES.BATTLE_END
    });

    this._logAction('战斗结束');
  }

  // ==================== 辅助方法 ====================

  /**
   * 检查单位是否无法行动
   */
  _isUnitIncapacitated(unit) {
    return isUnitAffectedByEffect(unit, 'stun') || 
           isUnitAffectedByEffect(unit, 'freeze') ||
           isUnitAffectedByEffect(unit, 'fear');
  }

  /**
   * 检查战斗结束条件
   */
  _checkBattleEndConditions(battleState) {
    this._log('RESOLUTION - Checking for battle end conditions (win/loss).');
    const playerTeam = Object.values(battleState.battleUnits).filter(u => u.isPlayerUnit);
    const enemyTeam = Object.values(battleState.battleUnits).filter(u => !u.isPlayerUnit);

    const playerTeamDefeated = playerTeam.every(u => u.isDefeated);
    const enemyTeamDefeated = enemyTeam.every(u => u.isDefeated);

    if (playerTeamDefeated) {
      this._log('  - >> Result: Player team defeated. Battle LOST.');
      this._endBattle({ winner: 'enemy' });
    } else if (enemyTeamDefeated) {
      this._log('  - >> Result: Enemy team defeated. Battle WON!');
      this._endBattle({ winner: 'player' });
    } else if (this.context.roundNumber >= (this.context.maxRounds || 30)) {
      this._log('  - >> Result: Max rounds reached. Battle DRAW.');
      this._endBattle({ winner: 'draw' });
    } else {
      this._log('  - >> Result: Battle continues.');
      this.trigger(BATTLE_EVENTS.RESOLUTION_COMPLETE);
    }
  }

  /**
   * 记录行动日志
   */
  _logAction(message) {
    this.dispatch({
      type: 'battle/addBattleLog',
      payload: {
        message,
        timestamp: Date.now(),
        type: 'ACTION'
      }
    });
  }

  /**
   * 记录错误日志
   */
  _logError(message) {
    this.dispatch({
      type: 'battle/addBattleLog',
      payload: {
        message: `错误: ${message}`,
        timestamp: Date.now(),
        type: 'ERROR'
      }
    });
  }

  /**
   * 重置上下文
   */
  _resetContext() {
    this._log('Context has been reset.');
    this.context = {
      roundNumber: 0,
      currentActionIndex: 0,
      actionQueue: [],
      currentProcessingAction: null,
      battleLog: []
    };
    this.stateHistory = [];
  }

  /**
   * 设置战斗引擎实例
   * @param {Object} engine - 战斗引擎实例
   */
  setBattleEngine(engine) {
    this.battleEngine = engine;
    this.engineIntegrationEnabled = true;
    this._log('战斗引擎已集成到状态机');
  }
}

/**
 * 创建战斗状态机实例
 */
export const createBattleStateMachine = (dispatch, getState) => {
  return new BattleStateMachine(dispatch, getState);
};

export default BattleStateMachine; 