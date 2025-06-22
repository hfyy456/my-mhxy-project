import { useState, useEffect } from 'react';
import { playerManagerInstance } from '@/store/managers';

/**
 * usePlayerManager Hook
 * 订阅PlayerManager的状态，并在状态变更时触发组件重新渲染。
 * 返回最新的玩家状态和管理器实例。
 */
export const usePlayerManager = () => {
  const [playerState, setPlayerState] = useState(playerManagerInstance.getState());

  useEffect(() => {
    const handleStateChange = (newState) => {
      setPlayerState(newState);
    };

    // 订阅状态变更事件
    playerManagerInstance.on('state_changed', handleStateChange);

    // 组件卸载时取消订阅
    return () => {
      playerManagerInstance.off('state_changed', handleStateChange);
    };
  }, []);
  
  return {
    player: playerState,
    manager: playerManagerInstance,
  };
}; 