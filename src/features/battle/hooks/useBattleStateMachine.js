/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-01-27
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-08 06:06:46
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
  
  const battleStateRef = useRef(battleState);
  useEffect(() => {
    battleStateRef.current = battleState;
  });

  useEffect(() => {
    if (!stateMachineRef.current) {
      const getStateForMachine = () => ({ battle: battleStateRef.current });

      stateMachineRef.current = createBattleStateMachine(
        dispatch,
        getStateForMachine
      );
    }
  }, [dispatch]);

  useEffect(() => {
    if (!stateMachineRef.current) return;

    const stateMachine = stateMachineRef.current;
    const currentPhase = battleState.currentPhase;

    switch (currentPhase) {
      case 'preparation':
        const activeUnits = Object.values(battleState.battleUnits).filter(unit => !unit.isDefeated);
        const unitsWithActions = Object.keys(battleState.unitActions).length;
        
        if (unitsWithActions >= activeUnits.length && activeUnits.length > 0) {
          if (stateMachine.currentSubState === BATTLE_STATES.PREPARATION) {
            stateMachine.trigger(BATTLE_EVENTS.PREPARATION_COMPLETE);
          }
        }
        break;

      case 'execution':
        break;

      case 'battle_over':
      case 'victory':
      case 'defeat':
        if (stateMachine.currentState !== BATTLE_STATES.END) {
          stateMachine.trigger(BATTLE_EVENTS.BATTLE_END);
        }
        break;
    }
  }, [battleState.currentPhase, battleState.unitActions, battleState.battleUnits]);

  const stateMachineAPI = {
    startBattle: useCallback((battleConfig) => {
      if (!stateMachineRef.current) {
        console.error("[useBattleStateMachine] 状态机尚未初始化，无法开始战斗。");
        return;
      }
      stateMachineRef.current.trigger(BATTLE_EVENTS.START_BATTLE, battleConfig);
    }, []),

    endBattle: useCallback(() => {
      if (stateMachineRef.current) {
        stateMachineRef.current.trigger(BATTLE_EVENTS.BATTLE_END);
      }
    }, []),

    resetBattle: useCallback(() => {
      if (stateMachineRef.current) {
        stateMachineRef.current.trigger(BATTLE_EVENTS.RESET_BATTLE);
      }
    }, []),

    forceNextRound: useCallback(() => {
      if (stateMachineRef.current) {
        stateMachineRef.current.trigger(BATTLE_EVENTS.RESOLUTION_COMPLETE);
      }
    }, []),

    completePreparation: useCallback(() => {
      if (stateMachineRef.current) {
        stateMachineRef.current.trigger(BATTLE_EVENTS.PREPARATION_COMPLETE);
      }
    }, []),

    completeExecution: useCallback(() => {
      if (stateMachineRef.current) {
        stateMachineRef.current.trigger(BATTLE_EVENTS.EXECUTION_COMPLETE);
      }
    }, []),

    getCurrentState: useCallback(() => {
      if (stateMachineRef.current) {
        return stateMachineRef.current.getCurrentState();
      }
      return null;
    }, []),

    getStateHistory: useCallback(() => {
      if (stateMachineRef.current) {
        return stateMachineRef.current.stateHistory;
      }
      return [];
    }, []),

    triggerEvent: useCallback((event, payload) => {
      if (stateMachineRef.current) {
        stateMachineRef.current.trigger(event, payload);
      }
    }, [])
  };

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
    getState: () => ({ battle: battleState })
  };
};

export const useBattleStateMachineState = () => {
  const getState = useSelector(state => state.battle);
  
  return {
    isActive: getState.isActive,
    currentPhase: getState.currentPhase,
    currentRound: getState.currentRound,
    battleResult: getState.battleResult,
    
    isInPreparation: getState.currentPhase === 'preparation',
    isInExecution: getState.currentPhase === 'execution', 
    isInResolution: getState.currentPhase === 'resolution',
    isBattleOver: ['battle_over', 'victory', 'defeat'].includes(getState.currentPhase),
    
    battleUnits: getState.battleUnits,
    unitActions: getState.unitActions,
    turnOrder: getState.turnOrder,
    currentTurnUnitId: getState.currentTurnUnitId,
    
    battleLog: getState.battleLog,
    rewards: getState.rewards
  };
};

export const useAutoBattleStateMachine = (enabled = false) => {
  const { startBattle, completePreparation, completeExecution, state } = useBattleStateMachine();
  const battleState = useSelector(state => state.battle);

  useEffect(() => {
    if (!enabled) return;

    const { currentState, currentSubState } = state;

    if (currentSubState === BATTLE_STATES.PREPARATION) {
      const activeUnits = Object.values(battleState.battleUnits).filter(unit => !unit.isDefeated);
      const unitsWithActions = Object.keys(battleState.unitActions).length;
      
      if (unitsWithActions >= activeUnits.length && activeUnits.length > 0) {
        setTimeout(() => {
          completePreparation();
        }, 1000);
      }
    }

    if (currentSubState === BATTLE_STATES.EXECUTION) {
      setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
          completeExecution();
        }
      }, 3000);
    }
  }, [enabled, state.currentSubState, battleState.unitActions, battleState.battleUnits, completePreparation, completeExecution]);

  return {
    enabled,
    isAutoProcessing: enabled && state.isInBattle
  };
};

export default useBattleStateMachine; 