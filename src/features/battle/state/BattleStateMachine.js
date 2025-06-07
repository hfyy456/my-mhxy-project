/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-01-27
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-07 04:37:08
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

    // Now that the state is prepared, transition the state machine.
    this._transitionTo(BATTLE_STATES.INITIALIZATION);
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
    if (this.currentSubState === BATTLE_STATES.EXECUTION) {
      this._checkForMoreActions();
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
   * 推进准备阶段
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
   * 进入执行阶段
   */
  _enterExecutionPhase() {
    this._log('Sub-Phase: EXECUTION - All actions are selected, preparing to execute.');
    this._transitionTo(BATTLE_STATES.ACTIVE, BATTLE_STATES.EXEC_DETERMINE_ACTION_ORDER);
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
    this._log(`EXECUTION - Turn order determined: ${turnOrder.map(a => a.unit.name).join(', ')}`);
    this._transitionTo(BATTLE_STATES.ACTIVE, BATTLE_STATES.EXEC_EXECUTE_NEXT_ACTION);
  }

  /**
   * 执行队列中的下一个行动
   */
  _executeNextAction() {
    const action = this.context.actionQueue[this.context.currentActionIndex];
    this.context.currentProcessingAction = action;
    
    this._log(`EXECUTION - Executing action for ${action.unit.name} (Action: ${action.type})`);

    // Create a BattleUnit instance on-the-fly from plain data
    const unitInstance = new BattleUnit(action.unit, action.unit.isPlayerUnit, action.unit.gridPosition, {});

    if (!unitInstance.canAct()) {
      this._log(`  - !! ${unitInstance.name} cannot act (e.g., stunned). Skipping turn.`);
      this._actionComplete();
      return;
    }

    this._processAction(unitInstance, action);
  }

  _processAction(unitInstance, action) {
    switch (action.type) {
        case 'attack':
            this._processAttackAction(unitInstance, action);
            break;
        case 'skill':
            this._processSkillAction(unitInstance, action);
            break;
        case 'defend':
            this._processDefendAction(unitInstance, action);
            break;
        case 'item':
            this._processItemAction(unitInstance, action);
            break;
        default:
            console.warn(`[BattleStateMachine] 未知行动类型: ${action.type}`);
            this._actionComplete();
    }
  }

  _processAttackAction(unitInstance, action) {
    const battleState = this.getState().battle;
    const targetData = battleState.battleUnits[action.targetId];
    this._log(`  - Action Details: ${unitInstance.name} performs PHYSICAL ATTACK on ${targetData.name}.`);

    // Create target instance
    const targetInstance = new BattleUnit(targetData, targetData.isPlayerUnit, targetData.gridPosition, {});
    
    const damageResult = calculateBattleDamage(unitInstance, targetInstance, 'physical');
    
    // Use the takeDamage method on the BattleUnit instance
    targetInstance.takeDamage(damageResult.finalDamage, unitInstance);
    
    this._log(`  - Action Result: ${targetInstance.name} takes ${damageResult.finalDamage} damage. HP: ${targetInstance.stats.currentHp}/${targetInstance.stats.maxHp}`);
    if (targetInstance.isDefeated) {
      this._log(`  - >> ${targetInstance.name} has been defeated!`);
    }

    // Dispatch the updated PLAIN data to Redux
    this.dispatch({
        type: 'battle/updateUnit',
        payload: {
            unitId: targetInstance.id,
            changes: {
                stats: targetInstance.stats,
                isDefeated: targetInstance.isDefeated,
            }
        }
    });

    // 触发被动技能等
    this._triggerPassiveSkills(unitInstance, 'AFTER_ATTACK', { target: targetInstance, damage: damageResult });

    this._actionComplete();
  }

  _processSkillAction(unitInstance, action) {
    const battleState = this.getState().battle;
    const skill = getSkillById(action.skillId);
    if (!skill) {
      this._logError(`Skill ${action.skillId} not found.`);
      this._actionComplete();
      return;
    }
    
    const targets = action.targetIds.map(id => battleState.battleUnits[id]);
    this._log(`  - Action Details: ${unitInstance.name} uses SKILL ${skill.name} on ${targets.map(t => t.name).join(', ')}.`);

    const skillResult = executeSkillEffect(unitInstance, targets, skill, battleState);
    
    // 假设 executeSkillEffect 内部已经调用了 unit 的方法
    // 这里只记录高级日志
    skillResult.effects.forEach(res => {
        if (res.type === 'damage') {
            this._log(`  - Action Result (Damage): ${res.target.name} takes ${res.finalDamage} damage. HP: ${res.target.stats.currentHp}/${res.target.stats.maxHp}`);
            if (res.target.isDefeated) {
                this._log(`  - >> ${res.target.name} has been defeated!`);
            }
        }
        if (res.type === 'buff' && res.buff) {
            this._log(`  - Action Result (Buff): ${res.target} gets ${res.buff}.`);
        }
    });

    this._actionComplete();
  }

  /**
   * 处理防御行动
   */
  _processDefendAction(unitInstance, action) {
    // 设置防御状态
    this.dispatch({
      type: 'battle/updateBattleUnit',
      payload: {
        unitId: unitInstance.id,
        changes: {
          isDefending: true
        }
      }
    });

    this._logAction(`${unitInstance.name} 进入防御姿态`);
    this._actionComplete();
  }

  /**
   * 处理道具使用
   */
  _processItemAction(unitInstance, action) {
    // TODO: 实现道具使用逻辑
    this._logAction(`${unitInstance.name} 使用了道具`);
    this._actionComplete();
  }

  /**
   * 处理技能效果
   */
  _processSkillEffect(effect, caster, target) {
    switch (effect.type) {
      case 'damage':
        this._applySkillDamage(effect, caster, target);
        break;
      case 'healing':
        this._applySkillHealing(effect, caster, target);
        break;
      case 'buffs':
        this._applySkillBuffs(effect, caster, target);
        break;
      // 处理其他效果类型...
    }
  }

  /**
   * 应用技能伤害
   */
  _applySkillDamage(effect, caster, target) {
    const damageResult = calculateBattleDamage(caster, target, effect.damageType, effect.bonus);
    // Call the instance method
    const appliedResult = target.takeDamage(damageResult.finalDamage, caster);
    return { ...appliedResult, type: 'damage' };
  }

  /**
   * 应用技能治疗
   */
  _applySkillHealing(effect, caster, target) {
    const healingAmount = calculateHealing(caster.stats.magicalAttack, effect.bonus);
    // Call the instance method
    const appliedResult = target.applyHealing(healingAmount.finalHeal);
    return { ...appliedResult, type: 'healing' };
  }

  /**
   * 应用技能BUFF
   */
  _applySkillBuffs(effect, caster, target) {
    // Call the instance method
    const buffResult = target.applyBuff(effect.buffId, caster.id);
    if (buffResult.success) {
        return {
            type: 'buff',
            buff: buffResult.appliedBuff.name,
            target: target.name
        };
    }
    return null;
  }

  /**
   * 触发被动技能
   */
  _triggerPassiveSkills(unit, triggerType, context) {
    const passiveResults = triggerPassiveSkillEffects(unit, triggerType, context);
    
    passiveResults.forEach(result => {
      this._logAction(`${unit.name} 的 ${result.skillName} 被动技能触发`);
      
      result.effects.forEach(effect => {
        // 处理被动技能效果
        this._processPassiveEffect(effect, unit, context);
      });
    });
  }

  /**
   * 处理被动技能效果
   */
  _processPassiveEffect(effect, unit, context) {
    switch (effect.type) {
      case 'damage':
        if (effect.targetId && effect.damage) {
          const battleState = this.getState().battle;
          const target = battleState.battleUnits[effect.targetId];
          if (target) {
            this.dispatch({
              type: 'battle/updateBattleUnit',
              payload: {
                unitId: target.id,
                changes: {
                  stats: {
                    ...target.stats,
                    currentHp: Math.max(0, target.stats.currentHp - effect.damage)
                  }
                }
              }
            });
          }
        }
        break;
      case 'revive':
        if (effect.hp && unit.isDefeated) {
          this.dispatch({
            type: 'battle/updateBattleUnit',
            payload: {
              unitId: unit.id,
              changes: {
                isDefeated: false,
                stats: {
                  ...unit.stats,
                  currentHp: effect.hp
                }
              }
            }
          });
        }
        break;
      // 处理其他被动效果...
    }
  }

  /**
   * 行动完成
   */
  _actionComplete() {
    this.context.currentActionIndex++;
    this.trigger(BATTLE_EVENTS.ACTION_EXECUTED);
  }

  /**
   * 检查是否还有更多行动
   */
  _checkForMoreActions() {
    if (this.context.currentActionIndex >= this.context.actionQueue.length) {
      this.trigger(BATTLE_EVENTS.NO_MORE_ACTIONS);
    } else {
      this._executeNextAction();
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
}

/**
 * 创建战斗状态机实例
 */
export const createBattleStateMachine = (dispatch, getState) => {
  return new BattleStateMachine(dispatch, getState);
};

export default BattleStateMachine; 