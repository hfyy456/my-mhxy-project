/*
 * @Author: Claude
 * @Date: 2025-01-27
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-09 05:00:08
 * @Description: 战斗适配器 React Context - 提供适配器实例的全局访问
 */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ReduxBattleAdapter } from '../adapters/ReduxBattleAdapter.js';
import summonManagerInstance from '@/store/SummonManager';

// 创建Context
const BattleAdapterContext = createContext(null);

/**
 * 战斗适配器提供者组件
 * 管理适配器实例的生命周期和状态同步
 */
export const BattleAdapterProvider = ({ children }) => {
  const dispatch = useDispatch();
  const battleState = useSelector(state => state.battle);
  const [adapter, setAdapter] = useState(null);
  const adapterRef = useRef(null);

  useEffect(() => {
    // getState函数 - 从Redux store获取状态
    const getState = () => ({ battle: battleState });
    
    // 创建Redux战斗适配器（内部会创建引擎适配器）
    const reduxBattleAdapter = new ReduxBattleAdapter(dispatch, getState, summonManagerInstance);
    
    adapterRef.current = reduxBattleAdapter;
    setAdapter(reduxBattleAdapter);

    // 清理函数
    return () => {
      if (adapterRef.current) {
        // 清理适配器资源
        try {
          adapterRef.current.cleanup && adapterRef.current.cleanup();
        } catch (error) {
          console.warn('适配器清理失败:', error);
        }
        adapterRef.current = null;
      }
      setAdapter(null);
    };
  }, [dispatch]);

  // 监听Redux状态变化，同步到适配器
  useEffect(() => {
    if (!adapter || !battleState) return;

    // 如果Redux状态发生变化，可能需要同步到引擎
    // 这主要用于处理外部对Redux状态的修改
    try {
      const engineState = adapter.getEngineState();
      const controlStatus = adapter.getControlStatus();
      
      // 如果Redux控制且状态不同步，则需要更新引擎
      if (controlStatus.isReduxControlled && engineState && battleState.isActive) {
        // 这里可以添加状态比较和同步逻辑
        // 目前简化处理，仅记录状态变化
        console.debug('Redux状态变化检测:', {
          reduxPhase: battleState.currentPhase,
          enginePhase: engineState.currentPhase,
          controlStatus
        });
      }
    } catch (error) {
      console.warn('状态同步检查失败:', error);
    }
  }, [adapter, battleState]);

  // 提供适配器实例给子组件
  return (
    <BattleAdapterContext.Provider value={adapter}>
      {children}
    </BattleAdapterContext.Provider>
  );
};

/**
 * 获取战斗适配器的Hook
 * @returns {ReduxBattleAdapter|null}
 */
export const useBattleAdapter = () => {
  const context = useContext(BattleAdapterContext);
  
  // 检查是否在Provider内 - undefined表示不在Provider内
  if (context === undefined) {
    throw new Error('useBattleAdapter must be used within a BattleAdapterProvider');
  }
  
  // context可能是null（适配器还在初始化），这是正常的
  return context;
};

/**
 * 战斗适配器高阶组件
 * 为组件提供适配器功能
 */
export const withBattleAdapter = (Component) => {
  return React.forwardRef((props, ref) => {
    const adapter = useBattleAdapter();
    
    return (
      <Component
        {...props}
        ref={ref}
        battleAdapter={adapter}
      />
    );
  });
};

/**
 * 适配器状态监听Hook
 * 提供适配器内部状态的响应式访问
 */
export const useBattleAdapterState = () => {
  const adapter = useBattleAdapter();
  const [adapterState, setAdapterState] = useState(null);

  useEffect(() => {
    if (!adapter) return;

    const updateState = () => {
      try {
        const engineState = adapter.getEngineState();
        const controlStatus = adapter.getControlStatus();
        const debugInfo = adapter.getDebugInfo();
        
        setAdapterState({
          engineState,
          controlStatus,
          debugInfo,
          isInitialized: true
        });
      } catch (error) {
        console.warn('获取适配器状态失败:', error);
        setAdapterState({
          engineState: null,
          controlStatus: { isReduxControlled: true, isEngineControlled: false },
          debugInfo: null,
          isInitialized: false,
          error: error.message
        });
      }
    };

    // 初始状态
    updateState();

    // 订阅状态变化
    const unsubscribe = adapter.subscribeToEngineChanges(() => {
      updateState();
    });

    return unsubscribe;
  }, [adapter]);

  return adapterState;
};

/**
 * 适配器调试Hook
 * 提供调试和监控功能
 */
export const useBattleAdapterDebug = () => {
  const adapter = useBattleAdapter();
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    if (!adapter) return;

    const updateDebugInfo = () => {
      try {
        const info = adapter.getDebugInfo();
        setDebugInfo(info);
      } catch (error) {
        console.warn('获取调试信息失败:', error);
      }
    };

    // 定期更新调试信息
    const interval = setInterval(updateDebugInfo, 1000);
    updateDebugInfo();

    return () => clearInterval(interval);
  }, [adapter]);

  const forceRefresh = () => {
    if (adapter) {
      try {
        const info = adapter.getDebugInfo();
        setDebugInfo(info);
      } catch (error) {
        console.warn('强制刷新调试信息失败:', error);
      }
    }
  };

  const reset = () => {
    if (adapter) {
      try {
        adapter.forceReset();
        forceRefresh();
      } catch (error) {
        console.warn('重置适配器失败:', error);
      }
    }
  };

  return {
    debugInfo,
    forceRefresh,
    reset,
    isAvailable: !!adapter
  };
};

export default BattleAdapterContext; 