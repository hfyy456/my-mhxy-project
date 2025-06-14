import { useContext } from 'react';
import { BattleContextV3 } from '../context/BattleContextV3';

/**
 * @description V3 战斗系统的核心 React Hook
 * 
 * 这个 Hook 是 UI 组件与战斗状态机交互的主要入口。
 * 它从 React Context 中获取战斗状态机服务，并将其返回。
 * 
 * @returns {[object, function]} 返回一个元组，其中：
 *  - `state`: XState 的当前状态对象，包含了 `value` (当前状态名) 和 `context` (数据)。
 *  - `send`: 用于向状态机发送事件的函数。
 * 
 * @example
 * const [state, send] = useBattleV3();
 * if (state.matches('active.preparation')) {
 *   // ... 渲染准备阶段的 UI
 * }
 * send({ type: 'SUBMIT_ACTION', payload: myAction });
 */
export const useBattleV3 = () => {
  const battleService = useContext(BattleContextV3);

  if (!battleService) {
    throw new Error('useBattleV3 must be used within a BattleProviderV3');
  }

  // useMachine 返回的是 [state, send, service]，我们通常只需要 state 和 send
  // const [state, send] = battleService; // 这个二次解构是错误的

  return battleService;
}; 