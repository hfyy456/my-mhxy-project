/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-01-27
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-01-27
 * @Description: 战斗状态机 React Hook - 集成状态机到Redux战斗系统
 */

import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createBattleStateMachine, BATTLE_EVENTS, BATTLE_STATES } from '../state/BattleStateMachine';

/**
 * 战斗状态机 Hook
 * 提供状态机控制接口，管理战斗流程
 */
export const useBattleStateMachine = () => {
  const dispatch = useDispatch();
  const battleState = useSelector(state => state.battle);
  const stateMachineRef = useRef(null);

  // 初始化状态机
  useEffect(() => {
    if (!stateMachineRef.current) {
      stateMachineRef.current = createBattleStateMachine(
        dispatch,
        () => ({ battle: battleState })
      );
      
      console.log('[useBattleStateMachine] 状态机已初始化');
    }
  }, [dispatch, battleState]);

  // 监听Redux状态变化，同步状态机
  useEffect(() => {
    if (!stateMachineRef.current) return;

    const stateMachine = stateMachineRef.current;
    const currentPhase = battleState.currentPhase;

    // 根据Redux状态同步状态机状态
    switch (currentPhase) {
      case 'preparation':
        // 检查是否所有单位都已选择行动
        const activeUnits = Object.values(battleState.battleUnits).filter(unit => !unit.isDefeated);
        const unitsWithActions = Object.keys(battleState.unitActions).length;
        
        if (unitsWithActions >= activeUnits.length && activeUnits.length > 0) {
          // 所有单位都已选择行动，可以进入执行阶段
          if (stateMachine.currentSubState === BATTLE_STATES.PREPARATION) {
            stateMachine.trigger(BATTLE_EVENTS.PREPARATION_COMPLETE);
          }
        }
        break;

      case 'execution':
        // 执行阶段的逻辑由状态机内部管理
        break;

      case 'battle_over':
      case 'victory':
      case 'defeat':
        // 战斗结束
        if (stateMachine.currentState !== BATTLE_STATES.END) {
          stateMachine.trigger(BATTLE_EVENTS.BATTLE_END);
        }
        break;
    }
  }, [battleState.currentPhase, battleState.unitActions, battleState.battleUnits]);

  // 状态机控制接口
  const stateMachineAPI = {
    /**
     * 开始战斗
     */
    startBattle: useCallback((battleConfig) => {
      if (stateMachineRef.current) {
        console.log('[useBattleStateMachine] 开始战斗');
        stateMachineRef.current.trigger(BATTLE_EVENTS.START_BATTLE, battleConfig);
      }
    }, []),

    /**
     * 结束战斗
     */
    endBattle: useCallback(() => {
      if (stateMachineRef.current) {
        console.log('[useBattleStateMachine] 结束战斗');
        stateMachineRef.current.trigger(BATTLE_EVENTS.BATTLE_END);
      }
    }, []),

    /**
     * 重置战斗
     */
    resetBattle: useCallback(() => {
      if (stateMachineRef.current) {
        console.log('[useBattleStateMachine] 重置战斗');
        stateMachineRef.current.trigger(BATTLE_EVENTS.RESET_BATTLE);
      }
    }, []),

    /**
     * 强制进入下一回合
     */
    forceNextRound: useCallback(() => {
      if (stateMachineRef.current) {
        console.log('[useBattleStateMachine] 强制进入下一回合');
        stateMachineRef.current.trigger(BATTLE_EVENTS.RESOLUTION_COMPLETE);
      }
    }, []),

    /**
     * 手动触发准备阶段完成
     */
    completePreparation: useCallback(() => {
      if (stateMachineRef.current) {
        console.log('[useBattleStateMachine] 手动完成准备阶段');
        stateMachineRef.current.trigger(BATTLE_EVENTS.PREPARATION_COMPLETE);
      }
    }, []),

    /**
     * 手动触发执行阶段完成
     */
    completeExecution: useCallback(() => {
      if (stateMachineRef.current) {
        console.log('[useBattleStateMachine] 手动完成执行阶段');
        stateMachineRef.current.trigger(BATTLE_EVENTS.EXECUTION_COMPLETE);
      }
    }, []),

    /**
     * 获取当前状态机状态
     */
    getCurrentState: useCallback(() => {
      if (stateMachineRef.current) {
        return stateMachineRef.current.getCurrentState();
      }
      return null;
    }, []),

    /**
     * 获取状态历史
     */
    getStateHistory: useCallback(() => {
      if (stateMachineRef.current) {
        return stateMachineRef.current.stateHistory;
      }
      return [];
    }, []),

    /**
     * 直接触发事件（调试用）
     */
    triggerEvent: useCallback((event, payload) => {
      if (stateMachineRef.current) {
        console.log(`[useBattleStateMachine] 手动触发事件: ${event}`, payload);
        stateMachineRef.current.trigger(event, payload);
      }
    }, [])
  };

  // 状态机状态信息
  const stateMachineState = stateMachineRef.current ? {
    currentState: stateMachineRef.current.currentState,
    currentSubState: stateMachineRef.current.currentSubState,
    isActive: stateMachineRef.current.currentState !== BATTLE_STATES.IDLE,
    isInBattle: stateMachineRef.current.currentState === BATTLE_STATES.ACTIVE,
    context: stateMachineRef.current.context
  } : {
    currentState: BATTLE_STATES.IDLE,
    currentSubState: null,
    isActive: false,
    isInBattle: false,
    context: {}
  };

  return {
    ...stateMachineAPI,
    stateMachine: stateMachineRef.current,
    state: stateMachineState,
    battleState
  };
};

/**
 * 战斗状态机状态选择器Hook
 * 提供对状态机状态的响应式访问
 */
export const useBattleStateMachineState = () => {
  const battleState = useSelector(state => state.battle);
  
  return {
    // Redux战斗状态
    isActive: battleState.isActive,
    currentPhase: battleState.currentPhase,
    currentRound: battleState.currentRound,
    battleResult: battleState.battleResult,
    
    // 计算得出的状态
    isInPreparation: battleState.currentPhase === 'preparation',
    isInExecution: battleState.currentPhase === 'execution', 
    isInResolution: battleState.currentPhase === 'resolution',
    isBattleOver: ['battle_over', 'victory', 'defeat'].includes(battleState.currentPhase),
    
    // 单位状态
    battleUnits: battleState.battleUnits,
    unitActions: battleState.unitActions,
    turnOrder: battleState.turnOrder,
    currentTurnUnitId: battleState.currentTurnUnitId,
    
    // 战斗日志
    battleLog: battleState.battleLog,
    rewards: battleState.rewards
  };
};

/**
 * 自动战斗状态机Hook
 * 提供自动战斗模式，减少手动干预
 */
export const useAutoBattleStateMachine = (enabled = false) => {
  const { startBattle, completePreparation, completeExecution, state } = useBattleStateMachine();
  const battleState = useSelector(state => state.battle);

  // 自动处理战斗流程
  useEffect(() => {
    if (!enabled) return;

    const { currentState, currentSubState } = state;

    // 自动处理准备阶段
    if (currentSubState === BATTLE_STATES.PREPARATION) {
      const activeUnits = Object.values(battleState.battleUnits).filter(unit => !unit.isDefeated);
      const unitsWithActions = Object.keys(battleState.unitActions).length;
      
      // 如果所有单位都有行动，自动进入执行阶段
      if (unitsWithActions >= activeUnits.length && activeUnits.length > 0) {
        setTimeout(() => {
          completePreparation();
        }, 1000); // 1秒延迟，让玩家看到准备完成
      }
    }

    // 自动处理执行阶段
    if (currentSubState === BATTLE_STATES.EXECUTION) {
      // 执行阶段由状态机自动管理，这里可以添加额外的自动化逻辑
      setTimeout(() => {
        // 自动完成执行阶段（仅在测试模式下）
        if (process.env.NODE_ENV === 'development') {
          completeExecution();
        }
      }, 3000); // 3秒后自动完成
    }
  }, [enabled, state.currentSubState, battleState.unitActions, battleState.battleUnits, completePreparation, completeExecution]);

  return {
    enabled,
    isAutoProcessing: enabled && state.isInBattle
  };
};

export default useBattleStateMachine; 