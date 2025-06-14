import React from 'react';
import { useMachine } from '@xstate/react';
import { BattleContextV3 } from '../context/BattleContextV3';
import { battleMachine } from '../machine/battleMachine';

/**
 * @description V3 战斗系统的顶层 Provider 组件
 * 
 * 该组件负责:
 * 1. 使用 `useMachine` hook 启动和运行 `battleMachine`。
 * 2. 通过 `BattleContextV3.Provider` 将状态机的服务实例 (`state`, `send`) 提供给整个子组件树。
 * 3. （可选）可以在这里传入开发工具的配置。
 */
export const BattleProviderV3 = ({ children }) => {
  // useMachine 返回一个元组，[0]是当前状态，[1]是发送事件的函数
  const battleService = useMachine(battleMachine, {
    // 可以在这里为状态机添加 devTools 等配置
    // devTools: true,
  });

  return (
    <BattleContextV3.Provider value={battleService}>
      {children}
    </BattleContextV3.Provider>
  );
}; 