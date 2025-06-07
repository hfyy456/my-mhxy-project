/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-01-25 12:00:00
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-07 04:11:21
 */

import store from '@/store';

/**
 * 新游戏管理器
 * 负责清理所有游戏数据并初始化新游戏状态
 */
class NewGameManager {
  constructor() {
    this.resetActions = [
      // 有专用reset action的slice
      { type: 'player/resetPlayer' },
      { type: 'saves/clearAllSaves' },
      { type: 'dialogue/resetDialogueState' },
      { type: 'summonCatalog/resetCatalog' },
      
      // 需要手动重置到初始状态的slice
      { type: 'battle/resetState' }, // 战斗slice有endBattle，应该也能重置
      { type: 'quest/reset' },
      { type: 'formation/reset' },
      { type: 'map/reset' },
      { type: 'npc/reset' },
      { type: 'tower/reset' },
      { type: 'homestead/reset' },
      { type: 'incubator/reset' },
      { type: 'ui/reset' }
    ];
  }

  /**
   * 执行新游戏重置
   */
  async resetForNewGame() {
    try {
      console.log('[NewGameManager] 开始重置游戏状态...');
      
      // 1. 重置Redux状态
      this.resetReduxState();
      
      // 2. 重置管理器状态
      await this.resetManagers();
      
      // 3. 重置持久化管理器
      await this.resetPersistence();
      
      // 4. 初始化新游戏数据
      this.initializeNewGameData();
      
      console.log('[NewGameManager] 新游戏重置完成');
      return { success: true };
      
    } catch (error) {
      console.error('[NewGameManager] 重置失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 重置Redux状态
   */
  resetReduxState() {
    console.log('[NewGameManager] 重置Redux状态...');
    
    // 首先尝试有专用reset action的slice
    const safeActions = [
      { type: 'player/resetPlayer' },
      { type: 'saves/clearAllSaves' },
      { type: 'dialogue/resetDialogueState' },
      { type: 'summonCatalog/resetCatalog' }
    ];

    safeActions.forEach(action => {
      try {
        store.dispatch(action);
        console.log(`[NewGameManager] ✓ 重置成功: ${action.type}`);
      } catch (error) {
        console.warn(`[NewGameManager] ✗ 重置失败: ${action.type}`, error);
      }
    });

    // 对于没有专用reset action的slice，尝试使用通用方法
    const slicesWithoutReset = [
      'quest', 'formation', 'map', 'npc', 'tower', 
      'homestead', 'incubator', 'ui', 'battle'
    ];

    slicesWithoutReset.forEach(sliceName => {
      try {
        // 尝试dispatch一个setState action来重置到初始状态
        const currentState = store.getState()[sliceName];
        if (currentState) {
          // 获取初始状态的近似值（清空大部分字段）
          const resetState = this.getInitialStateForSlice(sliceName);
          store.dispatch({
            type: `${sliceName}/setState`,
            payload: resetState
          });
          console.log(`[NewGameManager] ✓ 重置成功: ${sliceName}`);
        }
      } catch (error) {
        console.warn(`[NewGameManager] ✗ 重置失败: ${sliceName}`, error);
        // 如果setState失败，尝试其他方法
        try {
          store.dispatch({ type: `${sliceName}/reset` });
          console.log(`[NewGameManager] ✓ 备用重置成功: ${sliceName}`);
        } catch (error2) {
          console.warn(`[NewGameManager] ✗ 备用重置也失败: ${sliceName}`, error2);
        }
      }
    });
  }

  /**
   * 获取slice的初始状态近似值
   */
  getInitialStateForSlice(sliceName) {
    const initialStates = {
      quest: {
        currentQuest: null,
        availableQuests: [],
        completedQuests: [],
        questHistory: []
      },
      formation: {
        grid: [
          [null, null, null],
          [null, null, null],
          [null, null, null]
        ],
        selectedPosition: null
      },
      map: {
        currentMap: 'home',
        playerPosition: { x: 5, y: 5 },
        isWorldMapOpen: false,
        visitedMaps: ['home']
      },
      npc: {
        npcs: {},
        selectedNpc: null,
        dialogueHistory: {}
      },
      tower: {
        currentFloor: 1,
        maxFloor: 1,
        progress: {
          floorsCleared: [],
          lastResetDate: new Date().toDateString()
        },
        isActive: false
      },
      homestead: {
        plots: [],
        buildings: {},
        resources: { gold: 1000 },
        maxPlots: 9
      },
      incubator: {
        slots: [],
        activeProcesses: {}
      },
      ui: {
        activeModal: null,
        notifications: [],
        settings: {}
      },
      battle: {
        isActive: false,
        battleId: null,
        playerTeam: [],
        enemyTeam: [],
        currentTurn: 0,
        round: 1,
        turnOrder: [],
        battleState: 'setup'
      }
    };

    return initialStates[sliceName] || {};
  }

  /**
   * 重置管理器状态
   */
  async resetManagers() {
    console.log('[NewGameManager] 重置管理器状态...');
    
    // 重置背包管理器
    try {
      const { default: inventoryManager } = await import('@/store/InventoryManager');
      if (typeof inventoryManager.reset === 'function') {
        inventoryManager.reset();
      } else if (typeof inventoryManager.clearAll === 'function') {
        inventoryManager.clearAll();
      } else {
        // 手动重置背包
        inventoryManager.items = [];
        inventoryManager.gold = 0;
        inventoryManager.capacity = 20;
      }
      console.log('[NewGameManager] ✓ 背包管理器重置成功');
    } catch (error) {
      console.warn('[NewGameManager] ✗ 背包管理器重置失败:', error);
    }

    // 重置召唤兽管理器
    try {
      const { default: summonManager } = await import('@/store/SummonManager');
      if (typeof summonManager.reset === 'function') {
        summonManager.reset();
      } else if (typeof summonManager.clearAll === 'function') {
        summonManager.clearAll();
      } else {
        // 手动重置召唤兽
        if (summonManager.summons) {
          summonManager.summons.clear();
        }
        if (summonManager.activeSummon) {
          summonManager.activeSummon = null;
        }
      }
      console.log('[NewGameManager] ✓ 召唤兽管理器重置成功');
    } catch (error) {
      console.warn('[NewGameManager] ✗ 召唤兽管理器重置失败:', error);
    }
  }


  /**
   * 初始化新游戏数据
   */
  initializeNewGameData() {
    console.log('[NewGameManager] 初始化新游戏数据...');
    
    try {
      // 初始化玩家基础数据
      store.dispatch({
        type: 'player/updatePlayer',
        payload: {
          name: '新手玩家',
          level: 1,
          experience: 0,
          gameTime: 0
        }
      });

      // 初始化基础资源
      store.dispatch({
        type: 'homestead/setState',
        payload: {
          resources: { gold: 1000 },
          maxPlots: 9,
          plots: []
        }
      });

      // 设置初始地图位置
      store.dispatch({
        type: 'map/setPlayerPosition',
        payload: { x: 5, y: 5 }
      });

      console.log('[NewGameManager] ✓ 新游戏数据初始化成功');
    } catch (error) {
      console.warn('[NewGameManager] ✗ 新游戏数据初始化失败:', error);
    }
  }

  /**
   * 验证重置结果
   */
  validateReset() {
    const state = store.getState();
    const checks = {
      player: state.player?.level === 1,
      saves: Object.keys(state.saves?.saves || {}).length === 0,
      battle: !state.battle?.isActive,
      map: state.map?.currentMap === 'home',
      quest: (state.quest?.currentQuest === null)
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    console.log(`[NewGameManager] 重置验证: ${passedChecks}/${totalChecks} 项通过`, checks);
    
    return {
      success: passedChecks === totalChecks,
      details: checks,
      score: `${passedChecks}/${totalChecks}`
    };
  }
}

// 创建单例实例
const newGameManager = new NewGameManager();

export default newGameManager;
export { NewGameManager }; 