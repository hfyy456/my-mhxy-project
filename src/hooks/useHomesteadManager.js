import { useState, useEffect } from 'react';
import { homesteadManagerInstance as homesteadManager } from '@/store/managers';

/**
 * useHomesteadManager Hook
 * 
 * 这个 Hook 提供了对 HomesteadManager 单例的访问，并订阅其状态更新。
 * 当 HomesteadManager 的状态改变时，使用此 Hook 的组件将自动重新渲染。
 * 
 * @returns {{homesteadState: object, homesteadManager: object}}
 *   - homesteadState: 当前家园状态的快照。
 *   - homesteadManager: HomesteadManager 的实例，用于调用其方法 (e.g., startBuildingConstruction)。
 */
export const useHomesteadManager = () => {
  const [homesteadState, setHomesteadState] = useState(homesteadManager.getState());

  useEffect(() => {
    const handleStateChange = (newState) => {
      setHomesteadState(newState);
    };

    // 订阅状态变更事件
    homesteadManager.on('state_changed', handleStateChange);

    // 组件卸载时取消订阅
    return () => {
      homesteadManager.off('state_changed', handleStateChange);
    };
  }, []);

  return { homesteadState, homesteadManager };
}; 