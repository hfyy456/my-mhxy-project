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
  applyBuff, 
  removeBuff,
  processBuffsOnTurnStart,
  processBuffsOnTurnEnd,
  isUnitAffectedByEffect 
} from '../logic/buffManager';
import { triggerPassiveSkillEffects } from '../logic/passiveSkillSystem';

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
  constructor(dispatch, getState) {
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
      battleLog: []
    };
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
    console.log(`[BattleStateMachine] 触发事件: ${event}, 当前状态: ${this.currentState}, 子状态: ${this.currentSubState}`);
    
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
    
    console.log(`[BattleStateMachine] 状态切换: ${previousState}/${previousSubState} -> ${newState}/${newSubState}`);
    
    // 触发状态进入处理
    this._onStateEnter(newState, newSubState);
  }

  /**
   * 状态进入处理
   */
  _onStateEnter(state, subState) {
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
    if (this.currentState === BATTLE_STATES.IDLE) {
      this._transitionTo(BATTLE_STATES.INITIALIZATION);
    }
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
   * 初始化战斗
   */
  _initializeBattle() {
    console.log('[BattleStateMachine] 初始化战斗...');
    
    // 分发初始化战斗的 Redux action
    this.dispatch({
      type: 'battle/setupBattle',
      payload: {
        battleId: generateUniqueId(UNIQUE_ID_PREFIXES.BATTLE),
        // 其他初始化参数...
      }
    });

    // 模拟异步初始化过程
    setTimeout(() => {
      this.trigger(BATTLE_EVENTS.INITIALIZATION_COMPLETE);
    }, 100);
  }

  /**
   * 开始新回合
   */
  _startNewRound() {
    console.log('[BattleStateMachine] 开始新回合...');
    
    const battleState = this.getState().battle;
    
    this.dispatch({
      type: 'battle/addBattleLog',
      payload: {
        message: `=== 回合 ${battleState.currentRound} 开始 ===`,
        timestamp: Date.now(),
        type: 'ROUND_START'
      }
    });

    // 立即进入准备阶段
    this.trigger(BATTLE_EVENTS.ROUND_START);
  }

  /**
   * 进入准备阶段
   */
  _enterPreparationPhase() {
    console.log('[BattleStateMachine] 进入准备阶段...');
    
    this.dispatch({
      type: 'battle/setCurrentPhase', 
      payload: BATTLE_PHASES.PREPARATION
    });

    // 开始处理回合开始时的BUFF效果
    this._processRoundStartBuffs();
  }

  /**
   * 处理回合开始时的BUFF效果
   */
  _processRoundStartBuffs() {
    console.log('[BattleStateMachine] 处理回合开始BUFF效果...');
    
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
    console.log('[BattleStateMachine] 进入执行阶段...');
    
    this.dispatch({
      type: 'battle/setCurrentPhase',
      payload: BATTLE_PHASES.EXECUTION
    });

    // 确定行动顺序
    this._determineActionOrder();
  }

  /**
   * 确定行动顺序
   */
  _determineActionOrder() {
    const battleState = this.getState().battle;
    const activeUnits = Object.values(battleState.battleUnits)
      .filter(unit => !unit.isDefeated && battleState.unitActions[unit.id]);
    
    // 按速度排序（速度高的先行动）
    this.context.actionQueue = activeUnits
      .sort((a, b) => (b.stats.speed || 0) - (a.stats.speed || 0))
      .map(unit => ({
        unitId: unit.id,
        action: battleState.unitActions[unit.id]
      }));
    
    this.context.currentActionIndex = 0;
    
    console.log('[BattleStateMachine] 行动顺序确定:', this.context.actionQueue.map(item => item.unitId));
    
    this.trigger(BATTLE_EVENTS.ACTION_ORDER_DETERMINED);
  }

  /**
   * 执行下一个行动
   */
  _executeNextAction() {
    if (this.context.currentActionIndex >= this.context.actionQueue.length) {
      this.trigger(BATTLE_EVENTS.NO_MORE_ACTIONS);
      return;
    }

    const currentActionData = this.context.actionQueue[this.context.currentActionIndex];
    this.context.currentProcessingAction = currentActionData;
    
    console.log(`[BattleStateMachine] 执行行动: ${currentActionData.unitId}`, currentActionData.action);
    
    // 执行具体行动
    this._processAction(currentActionData);
  }

  /**
   * 处理具体行动
   */
  _processAction(actionData) {
    const { unitId, action } = actionData;
    const battleState = this.getState().battle;
    const unit = battleState.battleUnits[unitId];
    
    if (!unit || unit.isDefeated) {
      console.log(`[BattleStateMachine] 单位 ${unitId} 已被击败，跳过行动`);
      this._actionComplete();
      return;
    }

    // 检查单位是否能行动（眩晕、冻结等状态）
    if (this._isUnitIncapacitated(unit)) {
      this.dispatch({
        type: 'battle/addBattleLog',
        payload: {
          message: `${unit.name} 无法行动（受到控制效果影响）`,
          timestamp: Date.now(),
          unitId: unit.id,
          type: 'ACTION_BLOCKED'
        }
      });
      this._actionComplete();
      return;
    }

    // 根据行动类型处理
    switch (action.actionType) {
      case 'attack':
        this._processAttackAction(unit, action);
        break;
      case 'skill':
        this._processSkillAction(unit, action);
        break;
      case 'defend':
        this._processDefendAction(unit, action);
        break;
      case 'item':
        this._processItemAction(unit, action);
        break;
      default:
        console.warn(`[BattleStateMachine] 未知行动类型: ${action.actionType}`);
        this._actionComplete();
    }
  }

  /**
   * 处理攻击行动
   */
  _processAttackAction(unit, action) {
    const battleState = this.getState().battle;
    const targetId = action.targetIds[0];
    const target = battleState.battleUnits[targetId];
    
    if (!target || target.isDefeated) {
      this._logAction(`${unit.name} 的攻击目标已失效`);
      this._actionComplete();
      return;
    }

    // 计算伤害
    const damageResult = calculateBattleDamage(unit, target, 'auto');
    
    // 应用伤害
    const damageApplied = applyDamageToTarget(target, damageResult.finalDamage, unit);
    
    // 更新Redux状态
    this.dispatch({
      type: 'battle/updateBattleUnit',
      payload: {
        unitId: target.id,
        changes: {
          stats: {
            ...target.stats,
            currentHp: Math.max(0, target.stats.currentHp - damageApplied.damageApplied)
          }
        }
      }
    });

    // 记录战斗日志
    this._logAction(
      `${unit.name} 攻击 ${target.name}，造成 ${damageApplied.damageApplied} 点伤害${damageResult.details.isCritical ? '（暴击）' : ''}`
    );

    // 触发被动技能
    this._triggerPassiveSkills(unit, 'AFTER_NORMAL_ATTACK', {
      targetUnit: target,
      damage: damageApplied.damageApplied,
      isCritical: damageResult.details.isCritical
    });

    this._actionComplete();
  }

  /**
   * 处理技能行动
   */
  _processSkillAction(unit, action) {
    const { skillId, targetIds } = action;
    const skill = getSkillById(skillId);
    
    if (!skill) {
      this._logAction(`${unit.name} 使用的技能 ${skillId} 不存在`);
      this._actionComplete();
      return;
    }

    // 检查MP消耗
    if (skill.mpCost && unit.stats.currentMp < skill.mpCost) {
      this._logAction(`${unit.name} 法力值不足，无法使用 ${skill.name}`);
      this._actionComplete();
      return;
    }

    // 消耗MP
    if (skill.mpCost) {
      this.dispatch({
        type: 'battle/updateBattleUnit',
        payload: {
          unitId: unit.id,
          changes: {
            stats: {
              ...unit.stats,
              currentMp: Math.max(0, unit.stats.currentMp - skill.mpCost)
            }
          }
        }
      });
    }

    this._logAction(`${unit.name} 使用了 ${skill.name}`);

    // 对每个目标执行技能效果
    const battleState = this.getState().battle;
    targetIds.forEach(targetId => {
      const target = battleState.battleUnits[targetId];
      if (target && !target.isDefeated) {
        const skillResult = executeSkillEffect(unit, target, skillId, battleState);
        
        if (skillResult.success) {
          // 处理技能效果
          skillResult.effects.forEach(effect => {
            this._processSkillEffect(effect, unit, target);
          });
        }
      }
    });

    // 触发被动技能
    this._triggerPassiveSkills(unit, 'AFTER_MAGIC_SKILL', {
      skillId: skillId,
      targetIds: targetIds,
      isSkill: true
    });

    this._actionComplete();
  }

  /**
   * 处理防御行动
   */
  _processDefendAction(unit, action) {
    // 设置防御状态
    this.dispatch({
      type: 'battle/updateBattleUnit',
      payload: {
        unitId: unit.id,
        changes: {
          isDefending: true
        }
      }
    });

    this._logAction(`${unit.name} 进入防御姿态`);
    this._actionComplete();
  }

  /**
   * 处理道具使用
   */
  _processItemAction(unit, action) {
    // TODO: 实现道具使用逻辑
    this._logAction(`${unit.name} 使用了道具`);
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
    const damage = effect.value;
    
    this.dispatch({
      type: 'battle/updateBattleUnit',
      payload: {
        unitId: target.id,
        changes: {
          stats: {
            ...target.stats,
            currentHp: Math.max(0, target.stats.currentHp - damage)
          }
        }
      }
    });

    this._logAction(
      `${target.name} 受到 ${damage} 点${effect.details?.element || ''}伤害`
    );
  }

  /**
   * 应用技能治疗
   */
  _applySkillHealing(effect, caster, target) {
    const healing = effect.value;
    
    this.dispatch({
      type: 'battle/updateBattleUnit',
      payload: {
        unitId: target.id,
        changes: {
          stats: {
            ...target.stats,
            currentHp: Math.min(target.stats.maxHp, target.stats.currentHp + healing)
          }
        }
      }
    });

    this._logAction(`${target.name} 恢复了 ${healing} 点生命值`);
  }

  /**
   * 应用技能BUFF
   */
  _applySkillBuffs(effect, caster, target) {
    effect.buffs.forEach(buffResult => {
      if (buffResult.success) {
        this._logAction(buffResult.message);
      }
    });
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
    console.log('[BattleStateMachine] 进入结算阶段...');
    
    this.dispatch({
      type: 'battle/setCurrentPhase',
      payload: BATTLE_PHASES.RESOLUTION
    });

    // 处理回合结束时的BUFF效果
    this._processRoundEndBuffs();
  }

  /**
   * 处理回合结束时的BUFF效果
   */
  _processRoundEndBuffs() {
    console.log('[BattleStateMachine] 处理回合结束BUFF效果...');
    
    const battleState = this.getState().battle;
    const allUnits = Object.values(battleState.battleUnits);
    
    allUnits.forEach(unit => {
      if (!unit.isDefeated) {
        const buffResults = processBuffsOnTurnEnd(unit);
        
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
          
          // 如果单位因为BUFF效果死亡
          if (result.type === 'defeat') {
            this.dispatch({
              type: 'battle/updateBattleUnit',
              payload: {
                unitId: unit.id,
                changes: { isDefeated: true }
              }
            });
          }
        });
      }
    });

    this.trigger(BATTLE_EVENTS.CONDITIONS_CHECKED);
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
    const playerUnits = Object.values(battleState.battleUnits).filter(unit => unit.isPlayerUnit);
    const enemyUnits = Object.values(battleState.battleUnits).filter(unit => !unit.isPlayerUnit);
    
    const allPlayerDefeated = playerUnits.every(unit => unit.isDefeated);
    const allEnemyDefeated = enemyUnits.every(unit => unit.isDefeated);
    
    return allPlayerDefeated || allEnemyDefeated;
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
    this.context = {
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