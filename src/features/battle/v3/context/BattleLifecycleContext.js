import React from 'react';

/**
 * @description
 * 这个上下文提供了一个用于控制战斗生命周期的函数，
 * 主要是为了允许子组件请求父组件重置整个战斗状态机。
 * 
 * 使用场景:
 * - 当战斗结束（胜利或失败）后，UI中的"重新开始"按钮需要一种方式
 *   来通知顶层组件（如 App.jsx）销毁当前的 `BattleProviderV3` 实例
 *   并创建一个全新的实例。
 */
export const BattleLifecycleContext = React.createContext({
  // 默认值是一个空函数，以防止在没有 Provider 的情况下调用时出错。
  restartBattle: () => {
    console.warn('BattleLifecycleContext: restartBattle was called without a Provider.');
  },
}); 