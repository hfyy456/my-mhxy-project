/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 02:57:02
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-07 03:51:49
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import gameStateManager from '../store/GameStateManager';
// import GameManager from '@/game/GameManager'; // Removed GameManager
// 使用OOP召唤兽系统替代Redux召唤兽系统
// 如果 resultRecordList 需要保留, 则需要相应的 slice 和 selector
// import { selectResultRecords } from '@/store/slices/resultRecordSlice';
import { useSelector } from 'react-redux';

// 使用OOP召唤兽系统

// 基础状态Hook
export function useGameState() {
  const [state, setState] = useState(gameStateManager.getState());
  
  useEffect(() => {
    const handleStateChange = () => {
      setState(gameStateManager.getState());
    };

    // 监听所有状态变化事件
    const events = [
      'summons:changed',
      'inventory:changed',
      'inventory:gold:changed',
      'scene:changed',
      'state:loaded'
    ];

    events.forEach(event => {
      gameStateManager.on(event, handleStateChange);
    });

    return () => {
      events.forEach(event => {
        gameStateManager.off(event, handleStateChange);
      });
    };
  }, []);

  return state;
}

// 召唤兽相关Hooks
export function useSummons() {
  const [summons, setSummons] = useState([]);

  useEffect(() => {
    // 初始加载
    setSummons(gameStateManager.getSummons());

    const handleSummonsChange = (newSummons) => {
      setSummons(newSummons);
    };

    gameStateManager.on('summons:changed', handleSummonsChange);
    gameStateManager.on('state:loaded', () => {
      setSummons(gameStateManager.getSummons());
    });

    return () => {
      gameStateManager.off('summons:changed', handleSummonsChange);
    };
  }, []);

  const addSummon = useCallback((summonData) => {
    return gameStateManager.addSummon(summonData);
  }, []);

  const updateSummon = useCallback((id, updates) => {
    gameStateManager.updateSummon(id, updates);
  }, []);

  return {
    summons,
    addSummon,
    updateSummon
  };
}

export function useSummon(summonId) {
  const [summon, setSummon] = useState(null);

  useEffect(() => {
    if (!summonId) return;

    // 初始加载
    setSummon(gameStateManager.getSummonById(summonId));

    const handleSummonChange = (updatedSummon) => {
      setSummon(updatedSummon);
    };

    const handleAllSummonsChange = () => {
      setSummon(gameStateManager.getSummonById(summonId));
    };

    gameStateManager.on(`summon:${summonId}:changed`, handleSummonChange);
    gameStateManager.on('summons:changed', handleAllSummonsChange);
    gameStateManager.on('state:loaded', handleAllSummonsChange);

    return () => {
      gameStateManager.off(`summon:${summonId}:changed`, handleSummonChange);
      gameStateManager.off('summons:changed', handleAllSummonsChange);
    };
  }, [summonId]);

  const updateSummon = useCallback((updates) => {
    if (summonId) {
      gameStateManager.updateSummon(summonId, updates);
    }
  }, [summonId]);

  return {
    summon,
    updateSummon
  };
}

// 背包相关Hooks
export function useInventory() {
  const [inventory, setInventory] = useState(gameStateManager.getInventory());

  useEffect(() => {
    const handleInventoryChange = (newInventory) => {
      setInventory(newInventory);
    };

    const handleGoldChange = (newGold) => {
      setInventory(prev => ({ ...prev, gold: newGold }));
    };

    gameStateManager.on('inventory:changed', handleInventoryChange);
    gameStateManager.on('inventory:gold:changed', handleGoldChange);
    gameStateManager.on('state:loaded', () => {
      setInventory(gameStateManager.getInventory());
    });

    return () => {
      gameStateManager.off('inventory:changed', handleInventoryChange);
      gameStateManager.off('inventory:gold:changed', handleGoldChange);
    };
  }, []);

  const addItem = useCallback((itemData, quantity = 1) => {
    return gameStateManager.addItem(itemData, quantity);
  }, []);

  const updateGold = useCallback((amount) => {
    gameStateManager.updateGold(amount);
  }, []);

  return {
    ...inventory,
    addItem,
    updateGold
  };
}

// 游戏场景Hook
export function useGameScene() {
  const [scene, setScene] = useState(gameStateManager.getScene());
  const [sceneData, setSceneData] = useState({});

  useEffect(() => {
    const handleSceneChange = ({ to, data }) => {
      setScene(to);
      setSceneData(data || {});
    };

    gameStateManager.on('scene:changed', handleSceneChange);
    gameStateManager.on('state:loaded', () => {
      setScene(gameStateManager.getScene());
    });

    return () => {
      gameStateManager.off('scene:changed', handleSceneChange);
    };
  }, []);

  const changeScene = useCallback((sceneName, data = {}) => {
    gameStateManager.setScene(sceneName, data);
  }, []);

  return {
    scene,
    sceneData,
    changeScene
  };
}

// 游戏操作Hook（提供游戏逻辑相关的方法）
export function useGameActions() {
  return useMemo(() => ({
    // 召唤兽操作
    summons: {
      add: (summonData) => gameStateManager.addSummon(summonData),
      update: (id, updates) => gameStateManager.updateSummon(id, updates),
      levelUp: (id) => {
        const summon = gameStateManager.state.summons.get(id);
        if (summon) {
          summon.levelUp();
          gameStateManager.emit('summons:changed', gameStateManager.getSummons());
          gameStateManager.emit(`summon:${id}:changed`, summon.toJSON());
          gameStateManager.scheduleStateSave();
        }
      }
    },

    // 背包操作
    inventory: {
      addItem: (itemData, quantity) => gameStateManager.addItem(itemData, quantity),
      updateGold: (amount) => gameStateManager.updateGold(amount),
      addGold: (amount) => gameStateManager.updateGold(amount),
      spendGold: (amount) => gameStateManager.updateGold(-amount)
    },

    // 场景操作
    scene: {
      goto: (sceneName, data) => gameStateManager.setScene(sceneName, data),
      back: () => {
        // 可以实现场景历史栈
        console.log('返回上一场景');
      }
    },

    // 游戏存档操作
    save: {
      manual: () => gameStateManager.saveStateToElectronStore(),
      load: () => gameStateManager.loadStateFromElectronStore()
    }
  }), []);
}

// 性能优化Hook - 仅在特定字段变化时更新
export function useGameStateSelector(selector) {
  const [selectedState, setSelectedState] = useState(() => 
    selector(gameStateManager.getState())
  );

  useEffect(() => {
    const handleStateChange = () => {
      const newSelectedState = selector(gameStateManager.getState());
      setSelectedState(prevState => {
        // 简单的深度比较，避免不必要的渲染
        if (JSON.stringify(prevState) !== JSON.stringify(newSelectedState)) {
          return newSelectedState;
        }
        return prevState;
      });
    };

    const events = [
      'summons:changed',
      'inventory:changed',
      'inventory:gold:changed',
      'scene:changed',
      'state:loaded'
    ];

    events.forEach(event => {
      gameStateManager.on(event, handleStateChange);
    });

    return () => {
      events.forEach(event => {
        gameStateManager.off(event, handleStateChange);
      });
    };
  }, [selector]);

  return selectedState;
}

// 批量操作Hook
export function useBatchGameActions() {
  const [isBatching, setIsBatching] = useState(false);

  const batchActions = useCallback((actions) => {
    setIsBatching(true);
    
    try {
      // 暂停事件发送
      const originalEmit = gameStateManager.emit;
      const events = [];
      
      gameStateManager.emit = function(event, ...args) {
        events.push({ event, args });
      };

      // 执行所有操作
      actions.forEach(action => action());

      // 恢复事件发送
      gameStateManager.emit = originalEmit;

      // 批量发送事件
      events.forEach(({ event, args }) => {
        gameStateManager.emit(event, ...args);
      });

    } finally {
      setIsBatching(false);
    }
  }, []);

  return { batchActions, isBatching };
}

export const useGameStateManager = () => {
  // const [gameManager] = useState(() => new GameManager()); // Removed
  // const [summon, setSummon] = useState(() => gameManager.getCurrentSummon()); // Replaced by selector
  // const [summonVersion, setSummonVersion] = useState(0); // No longer needed
  // const [historyList, setHistoryList] = useState(() => gameManager.getHistoryList()); // Replaced by selector
  // const [resultRecordList, setResultRecordList] = useState(() => gameManager.getResultRecordList()); // Temporarily removed or to be handled by Redux

  const currentSummon = useSelector(selectCurrentSummonFullData);
  const historyList = useSelector(selectRefinementHistory); // Assuming this selector exists
  // const resultRecordList = useSelector(selectResultRecords); // If feature is kept

  // useEffect(() => {
    // gameManager.on("summonUpdated", (newSummon) => {
      // setSummon(newSummon);
      // setSummonVersion(prevVersion => prevVersion + 1);
      // console.log("[useGameState] summonUpdated event. New summon instance:", newSummon);
    // });

    // gameManager.on("historyUpdated", (newHistory) => {
      // setHistoryList(newHistory);
    // });

    // gameManager.on("resultRecordUpdated", (newRecords) => {
      // setResultRecordList(newRecords);
    // });

    // return () => {
      // gameManager.removeAllListeners();
    // };
  // }, [gameManager]); // Removed GameManager dependency

  return {
    // gameManager, // Removed
    summon: currentSummon, // Renamed for compatibility with components expecting 'summon'
    // setSummon, // Removed, state managed by Redux
    historyList,
    // resultRecordList, // Temporarily removed
  };
}; 