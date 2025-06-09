/*
 * @Author: Claude
 * @Date: 2025-01-27
 * @LastEditors: Claude
 * @LastEditTime: 2025-01-27
 * @Description: 战斗状态机 React Hook - 重构为使用独立适配器系统
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useBattleAdapter } from '../context/BattleAdapterContext.jsx';

/**
 * 战斗状态机 Hook
 * 通过适配器提供统一的战斗控制接口
 */
export const useBattleStateMachine = () => {
  const adapter = useBattleAdapter();
  
  // 如果适配器不可用，返回空操作函数
  if (!adapter) {
    console.warn('BattleAdapter not available, returning fallback functions');
    return {
      // 战斗控制方法 - 空操作
      initializeBattle: () => console.warn('BattleAdapter not available'),
      startBattle: () => console.warn('BattleAdapter not available'), // 向后兼容性别名
      submitAction: () => console.warn('BattleAdapter not available'),
      advanceBattle: () => console.warn('BattleAdapter not available'),
      transferControlToEngine: () => console.warn('BattleAdapter not available'),
      transferResultsToRedux: () => console.warn('BattleAdapter not available'),
      
      // 状态查询方法 - 返回默认值
      getBattleState: () => null,
      getBattleResult: () => null,
      getControlStatus: () => ({ isReduxControlled: true, isEngineControlled: false }),
      getCurrentState: () => null,
      
      // 订阅方法 - 返回空函数
      subscribeToStateChanges: () => () => {},
      subscribeToEvents: () => () => {},
      
      // 选择器代理 - 返回空对象
      selectors: {},
      
      // 状态机状态 - 为调试面板提供
      state: null,
      
      // 调试方法 - 空操作
      getDebugInfo: () => null,
      reset: () => console.warn('BattleAdapter not available'),
      
      // 事件触发方法
      triggerEvent: () => console.warn('BattleAdapter not available'),
      endBattle: () => console.warn('BattleAdapter not available'),
      resetBattle: () => console.warn('BattleAdapter not available'),
      completePreparation: () => console.warn('BattleAdapter not available')
    };
  }

  // 获取引擎状态并转换为状态机格式
  const getStateMachineState = () => {
    const engineState = adapter.getEngineState();
    if (!engineState) return null;
    
    // 将引擎状态转换为传统状态机格式
    let currentState = 'idle';
    let currentSubState = null;
    
    if (engineState.isActive) {
      currentState = 'active';
      switch (engineState.currentPhase) {
        case 'preparation':
          currentSubState = 'preparation';
          break;
        case 'execution':
          currentSubState = 'execution';
          break;
        case 'resolution':
          currentSubState = 'resolution';
          break;
        case 'battle_over':
        case 'victory':
        case 'defeat':
          currentState = 'end';
          currentSubState = engineState.currentPhase;
          break;
      }
    }
    
    return {
      currentState,
      currentSubState,
      context: {
        roundNumber: engineState.currentRound || 0,
        actionQueue: Object.keys(engineState.unitActions || {}),
        currentProcessingAction: null,
        battleLog: engineState.battleLog || []
      },
      stateHistory: [] // 引擎不维护历史记录
    };
  };

  return {
    // 战斗控制方法
    initializeBattle: adapter.initializeBattleFromRedux,
    startBattle: adapter.initializeBattleFromRedux, // 向后兼容性别名
    submitAction: adapter.submitPlayerAction,
    advanceBattle: adapter.advanceBattle,
    transferControlToEngine: adapter.transferControlToEngine,
    transferResultsToRedux: adapter.transferResultsToRedux,
    
    // 状态查询方法
    getBattleState: adapter.getEngineState,
    getBattleResult: adapter.getBattleResult,
    getControlStatus: adapter.getControlStatus,
    getCurrentState: getStateMachineState,
    
    // 订阅方法
    subscribeToStateChanges: adapter.subscribeToEngineChanges,
    subscribeToEvents: adapter.subscribeToEvents,
    
    // 选择器代理
    selectors: adapter.getSelectorsProxy(),
    
    // 状态机状态 - 为调试面板提供
    state: getStateMachineState(),
    
    // 调试方法
    getDebugInfo: adapter.getDebugInfo,
    reset: adapter.forceReset,
    
    // 事件触发方法
    triggerEvent: (event) => {
      // 将事件转换为适配器操作
      switch (event) {
        case 'START_BATTLE':
          adapter.transferControlToEngine();
          break;
        case 'COMPLETE_PREPARATION':
        case 'START_EXECUTION':
        case 'START_RESOLUTION':
          adapter.advanceBattle();
          break;
        case 'END_BATTLE':
          adapter.transferResultsToRedux();
          break;
        case 'RESET_BATTLE':
          adapter.forceReset();
          break;
        default:
          console.warn('未识别的事件类型:', event);
      }
    },
    endBattle: adapter.transferResultsToRedux,
    resetBattle: adapter.forceReset,
    completePreparation: adapter.advanceBattle
  };
};

/**
 * 战斗状态 Hook
 * 提供响应式的战斗状态数据
 */
export const useBattleStateMachineState = () => {
  const adapter = useBattleAdapter();
  const [battleState, setBattleState] = useState(null);

  useEffect(() => {
    if (!adapter) return;

    // 订阅状态变化
    const unsubscribe = adapter.subscribeToEngineChanges((newState) => {
      console.log('[useBattleStateMachineState] 收到引擎状态更新:', newState);
      setBattleState(newState);
    });

    return unsubscribe;
  }, [adapter]);

  // 如果没有状态，返回默认值
  if (!battleState) {
    return {
      isActive: false,
      currentPhase: 'idle',
      currentRound: 0,
      battleResult: null,
      
      isInPreparation: false,
      isInExecution: false,
      isInResolution: false,
      isBattleOver: false,
      
      battleUnits: {},
      unitActions: {},
      turnOrder: [],
      currentTurnUnitId: null,
      playerFormation: [],
      enemyFormation: [],
      
      battleLog: [],
      rewards: null,
      adapter
    };
  }

  return {
    isActive: battleState.isActive,
    currentPhase: battleState.currentPhase,
    currentRound: battleState.currentRound,
    battleResult: battleState.result,
    
    isInPreparation: battleState.currentPhase === 'preparation',
    isInExecution: battleState.currentPhase === 'execution',
    isInResolution: battleState.currentPhase === 'resolution',
    isBattleOver: ['battle_over', 'victory', 'defeat'].includes(battleState.currentPhase),
    
    battleUnits: battleState.battleUnits || {},
    unitActions: battleState.unitActions || {},
    turnOrder: battleState.turnOrder || [],
    currentTurnUnitId: battleState.currentTurnUnitId,
    playerFormation: battleState.playerFormation || [],
    enemyFormation: battleState.enemyFormation || [],
    
    battleLog: battleState.battleLog || [],
    rewards: battleState.rewards,
    adapter
  };
};

/**
 * 自动战斗 Hook
 * 提供自动推进战斗的功能
 */
export const useAutoBattleStateMachine = (enabled = false) => {
  const { advanceBattle, getControlStatus } = useBattleStateMachine();
  const battleState = useBattleStateMachineState();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!enabled || !battleState.isActive) return;

    const controlStatus = getControlStatus();
    if (!controlStatus || !controlStatus.isEngineControlled) return;

    let timeoutId;

    if (battleState.isInPreparation) {
      // 检查是否所有单位都已提交行动
      const activeUnits = Object.values(battleState.battleUnits).filter(unit => !unit.isDefeated);
      const unitsWithActions = Object.keys(battleState.unitActions).length;
      
      if (unitsWithActions >= activeUnits.length && activeUnits.length > 0) {
        setIsProcessing(true);
        timeoutId = setTimeout(() => {
          advanceBattle();
          setIsProcessing(false);
        }, 1000);
      }
    } else if (battleState.isInExecution) {
      setIsProcessing(true);
      timeoutId = setTimeout(() => {
        advanceBattle();
        setIsProcessing(false);
      }, 2000);
    } else if (battleState.isInResolution) {
      setIsProcessing(true);
      timeoutId = setTimeout(() => {
        advanceBattle();
        setIsProcessing(false);
      }, 1500);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        setIsProcessing(false);
      }
    };
  }, [enabled, battleState, advanceBattle, getControlStatus]);

  return {
    enabled,
    isProcessing,
    isAutoProcessing: enabled && battleState.isActive && isProcessing
  };
};

/**
 * 兼容性 Hook - 提供Redux选择器风格的接口
 * 为现有组件提供向后兼容性
 */
export const useBattleSelectors = () => {
  const { selectors } = useBattleStateMachine();
  
  // 如果没有selectors，返回默认的空实现
  if (!selectors || Object.keys(selectors).length === 0) {
    return {
      useSelector: () => null,
      selectIsBattleActive: () => false,
      selectCurrentPhase: () => 'idle',
      selectCurrentRound: () => 0,
      selectBattleResult: () => null,
      selectBattleUnits: () => ({}),
      selectPlayerFormation: () => [],
      selectEnemyFormation: () => [],
      selectTurnOrder: () => [],
      selectCurrentTurnUnitId: () => null,
      selectUnitActions: () => ({}),
      selectBattleLog: () => [],
      selectRewards: () => null,
      selectBattleUnitById: () => null,
      selectUnitActionById: () => null,
      selectAllUnitsHaveActions: () => false
    };
  }
  
  return {
    useSelector: (selector) => {
      const [value, setValue] = useState(() => {
        try {
          return selector(selectors);
        } catch (error) {
          console.warn('Selector error:', error);
          return null;
        }
      });
      
      useEffect(() => {
        // 由于selectors是代理对象，每次调用都会返回最新值
        // 这里设置一个定时器来模拟状态变化
        const interval = setInterval(() => {
          try {
            const newValue = selector(selectors);
            setValue(newValue);
          } catch (error) {
            console.warn('Selector update error:', error);
          }
        }, 100);
        
        return () => clearInterval(interval);
      }, [selector, selectors]);
      
      return value;
    },
    
    // 直接暴露常用选择器
    selectIsBattleActive: () => selectors.selectIsBattleActive(),
    selectCurrentPhase: () => selectors.selectCurrentPhase(),
    selectCurrentRound: () => selectors.selectCurrentRound(),
    selectBattleResult: () => selectors.selectBattleResult(),
    selectBattleUnits: () => selectors.selectBattleUnits(),
    selectPlayerFormation: () => selectors.selectPlayerFormation(),
    selectEnemyFormation: () => selectors.selectEnemyFormation(),
    selectTurnOrder: () => selectors.selectTurnOrder(),
    selectCurrentTurnUnitId: () => selectors.selectCurrentTurnUnitId(),
    selectUnitActions: () => selectors.selectUnitActions(),
    selectBattleLog: () => selectors.selectBattleLog(),
    selectRewards: () => selectors.selectRewards(),
    selectBattleUnitById: (unitId) => selectors.selectBattleUnitById(unitId),
    selectUnitActionById: (unitId) => selectors.selectUnitActionById(unitId),
    selectAllUnitsHaveActions: () => selectors.selectAllUnitsHaveActions()
  };
};

export default useBattleStateMachine; 