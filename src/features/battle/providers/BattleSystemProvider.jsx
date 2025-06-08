/*
 * @Author: Claude
 * @Date: 2025-01-27
 * @LastEditors: Claude
 * @LastEditTime: 2025-01-27
 * @Description: 战斗系统顶层Provider - 组合所有战斗相关的Context提供器
 */
import React from 'react';
import { BattleAdapterProvider } from '../context/BattleAdapterContext.jsx';
import { BattleStateMachineProvider } from '../context/BattleStateMachineContext';

/**
 * 战斗系统顶层Provider
 * 按正确顺序组合所有战斗相关的Context提供器
 */
export const BattleSystemProvider = ({ children }) => {
  return (
    <BattleAdapterProvider>
      <BattleStateMachineProvider>
        {children}
      </BattleStateMachineProvider>
    </BattleAdapterProvider>
  );
};

/**
 * 战斗页面专用Provider
 * 为战斗页面提供完整的战斗系统上下文
 */
export const BattlePageProvider = ({ children }) => {
  return (
    <BattleSystemProvider>
      {children}
    </BattleSystemProvider>
  );
};

/**
 * 开发模式Provider
 * 在开发环境下提供额外的调试功能
 */
export const BattleSystemDevProvider = ({ children, enableDebug = false }) => {
  if (process.env.NODE_ENV === 'development' && enableDebug) {
    return (
      <BattleSystemProvider>
        <div className="relative">
          {children}
          {/* 可以在这里添加开发模式下的调试组件 */}
        </div>
      </BattleSystemProvider>
    );
  }
  
  return (
    <BattleSystemProvider>
      {children}
    </BattleSystemProvider>
  );
};

export default BattleSystemProvider; 