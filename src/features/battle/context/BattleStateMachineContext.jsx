/*
 * @Author: Claude
 * @Date: 2025-01-27
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-09 04:44:30
 * @Description: 战斗状态机Context - 更新为使用适配器系统的兼容层
 */
import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createBattleStateMachine, BATTLE_EVENTS, BATTLE_STATES } from '../state/BattleStateMachine';
import { useBattleAdapter } from './BattleAdapterContext.jsx';

// 1. 创建 Context
const BattleStateMachineContext = createContext(null);

// 2. 创建 Provider 组件 - 兼容性包装器
export const BattleStateMachineProvider = ({ children }) => {
  const dispatch = useDispatch();
  const battleAdapter = useBattleAdapter();
  const stateMachineRef = useRef(null);

  const [machineState, setMachineState] = useState({
    currentState: BATTLE_STATES.IDLE,
    currentSubState: null,
    isActive: false,
    isInBattle: false,
    context: {},
    stateHistory: [],
  });
  
  const battleState = useSelector(state => state.battle);
  const battleStateRef = useRef(battleState);
  useEffect(() => {
    battleStateRef.current = battleState;
  });

  // 初始化状态机实例和订阅
  useEffect(() => {
    // 优先使用适配器，如果没有适配器则使用传统状态机
    if (battleAdapter) {
      // 使用适配器模式
      const unsubscribe = battleAdapter.subscribeToEngineChanges((engineState) => {
        if (engineState) {
          // 将引擎状态转换为传统状态机格式
          let currentState = BATTLE_STATES.IDLE;
          let currentSubState = null;
          
          if (engineState.isActive) {
            currentState = BATTLE_STATES.ACTIVE;
            switch (engineState.currentPhase) {
              case 'preparation':
                currentSubState = BATTLE_STATES.PREPARATION;
                break;
              case 'execution':
                currentSubState = BATTLE_STATES.EXECUTION;
                break;
              case 'resolution':
                currentSubState = BATTLE_STATES.RESOLUTION;
                break;
              case 'battle_over':
              case 'victory':
              case 'defeat':
                currentState = BATTLE_STATES.END;
                currentSubState = engineState.currentPhase;
                break;
            }
          }
          
          setMachineState({
            currentState,
            currentSubState,
            isActive: engineState.isActive,
            isInBattle: engineState.isActive && currentState === BATTLE_STATES.ACTIVE,
            context: { engineState },
            stateHistory: [], // 引擎不维护历史记录
          });
        }
      });

      return unsubscribe;
    } else {
      // 传统状态机模式（向后兼容）
      const getStateForMachine = () => ({ battle: battleStateRef.current });
      const machine = createBattleStateMachine(dispatch, getStateForMachine);
      stateMachineRef.current = machine;

      const unsubscribe = machine.subscribe(newState => {
        setMachineState({
          currentState: newState.state,
          currentSubState: newState.subState,
          isActive: newState.state !== BATTLE_STATES.IDLE,
          isInBattle: newState.state === BATTLE_STATES.ACTIVE,
          context: newState.context,
          stateHistory: machine.stateHistory,
        });
      });
      
      // 初始化时设置一次初始状态
      setMachineState({
        currentState: machine.currentState,
        currentSubState: machine.currentSubState,
        isActive: machine.currentState !== BATTLE_STATES.IDLE,
        isInBattle: machine.currentState === BATTLE_STATES.ACTIVE,
        context: machine.context,
        stateHistory: machine.stateHistory,
      });

      return unsubscribe;
    }
  }, [dispatch, battleAdapter]);

  // 根据 Redux 状态同步状态机
  useEffect(() => {
    if (!stateMachineRef.current) return;
    const machine = stateMachineRef.current;
    const { currentPhase, battleUnits, unitActions } = battleState;

    if (currentPhase === 'preparation') {
      const activeUnits = Object.values(battleUnits).filter(unit => !unit.isDefeated);
      const unitsWithActions = Object.keys(unitActions).length;
      if (unitsWithActions >= activeUnits.length && activeUnits.length > 0) {
        if (machine.currentSubState === BATTLE_STATES.PREPARATION) {
          machine.trigger(BATTLE_EVENTS.PREPARATION_COMPLETE);
        }
      }
    } else if (['battle_over', 'victory', 'defeat'].includes(currentPhase)) {
      if (machine.currentState !== BATTLE_STATES.END) {
        machine.trigger(BATTLE_EVENTS.BATTLE_END);
      }
    }
  }, [battleState.currentPhase, battleState.unitActions, battleState.battleUnits]);

  // 创建提供给组件的 API - 适配器优先模式
  const stateMachineAPI = {
    startBattle: useCallback((battleConfig) => {
      if (battleAdapter) {
        // 使用适配器启动战斗
        battleAdapter.initializeBattleFromRedux(battleConfig);
        battleAdapter.transferControlToEngine();
      } else if (stateMachineRef.current) {
        stateMachineRef.current.trigger(BATTLE_EVENTS.START_BATTLE, battleConfig);
      }
    }, [battleAdapter]),
    
    endBattle: useCallback(() => {
      if (battleAdapter) {
        // 通过适配器结束战斗
        battleAdapter.transferResultsToRedux();
      } else if (stateMachineRef.current) {
        stateMachineRef.current.trigger(BATTLE_EVENTS.BATTLE_END);
      }
    }, [battleAdapter]),
    
    resetBattle: useCallback(() => {
      if (battleAdapter) {
        battleAdapter.forceReset();
      } else if (stateMachineRef.current) {
        stateMachineRef.current.trigger(BATTLE_EVENTS.RESET_BATTLE);
      }
    }, [battleAdapter]),
    
    completePreparation: useCallback(() => {
      if (battleAdapter) {
        battleAdapter.advanceBattle();
      } else if (stateMachineRef.current) {
        stateMachineRef.current.trigger(BATTLE_EVENTS.PREPARATION_COMPLETE);
      }
    }, [battleAdapter]),
    
    completeExecution: useCallback(() => {
      if (battleAdapter) {
        battleAdapter.advanceBattle();
      } else if (stateMachineRef.current) {
        stateMachineRef.current.trigger(BATTLE_EVENTS.EXECUTION_COMPLETE);
      }
    }, [battleAdapter]),
    
    forceNextRound: useCallback(() => {
      if (battleAdapter) {
        battleAdapter.advanceBattle();
      } else if (stateMachineRef.current) {
        stateMachineRef.current.trigger(BATTLE_EVENTS.RESOLUTION_COMPLETE);
      }
    }, [battleAdapter]),
    
    getCurrentState: useCallback(() => {
      if (battleAdapter) {
        const engineState = battleAdapter.getEngineState();
        return engineState ? {
          currentState: engineState.currentPhase,
          isActive: engineState.isActive,
          context: engineState
        } : null;
      } else if (stateMachineRef.current) {
        return stateMachineRef.current.getCurrentState();
      }
      return null;
    }, [battleAdapter]),
    
    getStateHistory: useCallback(() => {
      if (battleAdapter) {
        // 适配器模式下没有历史记录
        return [];
      } else if (stateMachineRef.current) {
        return stateMachineRef.current.stateHistory;
      }
      return [];
    }, [battleAdapter]),
    
    triggerEvent: useCallback((event, payload) => {
      if (battleAdapter) {
        // 将事件转换为适配器操作
        switch (event) {
          case BATTLE_EVENTS.START_BATTLE:
            battleAdapter.initializeBattleFromRedux(payload);
            battleAdapter.transferControlToEngine();
            break;
          case BATTLE_EVENTS.BATTLE_END:
            battleAdapter.transferResultsToRedux();
            break;
          case BATTLE_EVENTS.PREPARATION_COMPLETE:
          case BATTLE_EVENTS.EXECUTION_COMPLETE:
          case BATTLE_EVENTS.RESOLUTION_COMPLETE:
            battleAdapter.advanceBattle();
            break;
          case BATTLE_EVENTS.RESET_BATTLE:
            battleAdapter.forceReset();
            break;
          default:
            console.warn('未识别的事件类型:', event);
        }
      } else if (stateMachineRef.current) {
        stateMachineRef.current.trigger(event, payload);
      }
    }, [battleAdapter]),
    
    // 适配器专用方法
    submitAction: useCallback((action) => {
      if (battleAdapter) {
        battleAdapter.submitPlayerAction(action);
      }
    }, [battleAdapter]),
    
    getControlStatus: useCallback(() => {
      if (battleAdapter) {
        return battleAdapter.getControlStatus();
      }
      return { isReduxControlled: true, isEngineControlled: false };
    }, [battleAdapter])
  };

  // 将状态和API组合成 value
  const value = {
    ...stateMachineAPI,
    state: machineState,
    stateMachine: stateMachineRef.current,
  };

  return (
    <BattleStateMachineContext.Provider value={value}>
      {children}
    </BattleStateMachineContext.Provider>
  );
};

// 3. 创建一个自定义 Hook 来消费 Context
export const useBattleStateMachine = () => {
  const context = useContext(BattleStateMachineContext);
  if (!context) {
    throw new Error('useBattleStateMachine must be used within a BattleStateMachineProvider');
  }
  return context;
}; 