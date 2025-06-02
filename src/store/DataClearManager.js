/**
 * 数据清理管理器
 * 用于清理游戏中的各种数据存储
 */
import inventoryManager from './InventoryManager';

class DataClearManager {
  constructor() {
    this.clearHistory = [];
  }

  /**
   * 清理背包系统数据
   */
  async clearInventoryData() {
    try {
      console.log('[DataClearManager] 开始清理背包数据...');
      
      // 清理内存中的数据
      inventoryManager.slots.clear();
      inventoryManager.items.clear();
      inventoryManager.gold = 0;
      inventoryManager.capacity = 100;
      
      // 重新初始化插槽
      inventoryManager.initializeSlots();
      
      // 清理持久化存储
      if (window.electronAPI?.store) {
        await window.electronAPI.store.delete('inventoryState');
      }
      
      // 触发状态更新
      inventoryManager.emit('inventory_cleared');
      inventoryManager.emit('inventory_changed', inventoryManager.getState());
      
      this.recordClearOperation('inventory', '背包数据已清理');
      console.log('[DataClearManager] 背包数据清理完成');
      
      return { success: true, message: '背包数据已清理' };
    } catch (error) {
      console.error('[DataClearManager] 清理背包数据失败:', error);
      return { success: false, message: `清理背包数据失败: ${error.message}` };
    }
  }

  /**
   * 清理Redux状态
   */
  async clearReduxData(dispatch) {
    try {
      console.log('[DataClearManager] 开始清理Redux状态...');
      
      // 动态导入所有slice的重置actions
      const [
        { resetSummons },
        { resetItems },
        { resetInventory },
        { resetQuests },
        { resetPlayer },
        { resetBattle },
        { resetDialogue },
        { resetFormation },
        { resetMap },
        { resetNpcs },
        { resetTower },
        { resetHomestead }
      ] = await Promise.all([
        import('./slices/summonSlice.js').then(m => ({ resetSummons: m.resetSummons || (() => ({ type: 'summons/reset' })) })),
        import('./slices/itemSlice.js').then(m => ({ resetItems: m.resetItems || (() => ({ type: 'items/reset' })) })),
        import('./slices/inventorySlice.js').then(m => ({ resetInventory: m.resetInventory || (() => ({ type: 'inventory/reset' })) })),
        import('./slices/questSlice.js').then(m => ({ resetQuests: m.resetQuests || (() => ({ type: 'quests/reset' })) })),
        import('./slices/playerSlice.js').then(m => ({ resetPlayer: m.resetPlayer || (() => ({ type: 'player/reset' })) })),
        import('./slices/battleSlice.js').then(m => ({ resetBattle: m.resetBattle || (() => ({ type: 'battle/reset' })) })),
        import('./slices/dialogueSlice.js').then(m => ({ resetDialogue: m.resetDialogue || (() => ({ type: 'dialogue/reset' })) })),
        import('./slices/formationSlice.js').then(m => ({ resetFormation: m.resetFormation || (() => ({ type: 'formation/reset' })) })),
        import('./slices/mapSlice.js').then(m => ({ resetMap: m.resetMap || (() => ({ type: 'map/reset' })) })),
        import('./slices/npcSlice.js').then(m => ({ resetNpcs: m.resetNpcs || (() => ({ type: 'npcs/reset' })) })),
        import('./slices/towerSlice.js').then(m => ({ resetTower: m.resetTower || (() => ({ type: 'tower/reset' })) })),
        import('./slices/homesteadSlice.js').then(m => ({ resetHomestead: m.resetHomestead || (() => ({ type: 'homestead/reset' })) }))
      ]);

      // 分发重置actions
      const resetActions = [
        resetSummons(),
        resetItems(),
        resetInventory(),
        resetQuests(),
        resetPlayer(),
        resetBattle(),
        resetDialogue(),
        resetFormation(),
        resetMap(),
        resetNpcs(),
        resetTower(),
        resetHomestead()
      ];

      resetActions.forEach(action => {
        try {
          dispatch(action);
        } catch (error) {
          console.warn(`[DataClearManager] 重置action失败: ${action.type}`, error);
        }
      });

      this.recordClearOperation('redux', 'Redux状态已重置');
      console.log('[DataClearManager] Redux状态清理完成');
      
      return { success: true, message: 'Redux状态已重置' };
    } catch (error) {
      console.error('[DataClearManager] 清理Redux状态失败:', error);
      return { success: false, message: `清理Redux状态失败: ${error.message}` };
    }
  }

  /**
   * 清理Electron Store持久化数据
   */
  async clearElectronStore() {
    try {
      console.log('[DataClearManager] 开始清理Electron Store...');
      
      if (!window.electronAPI?.store) {
        return { success: false, message: 'Electron Store API不可用' };
      }

      // 清理所有持久化数据
      const keysToDelete = [
        'inventoryState',
        'gameState',
        'playerData',
        'summonData', 
        'questData',
        'battleData',
        'settingsData',
        'saveData'
      ];

      for (const key of keysToDelete) {
        try {
          await window.electronAPI.store.delete(key);
          console.log(`[DataClearManager] 已删除键: ${key}`);
        } catch (error) {
          console.warn(`[DataClearManager] 删除键失败: ${key}`, error);
        }
      }

      this.recordClearOperation('electron_store', 'Electron Store数据已清理');
      console.log('[DataClearManager] Electron Store清理完成');
      
      return { success: true, message: 'Electron Store数据已清理' };
    } catch (error) {
      console.error('[DataClearManager] 清理Electron Store失败:', error);
      return { success: false, message: `清理Electron Store失败: ${error.message}` };
    }
  }

  /**
   * 清理浏览器本地存储
   */
  async clearBrowserStorage() {
    try {
      console.log('[DataClearManager] 开始清理浏览器存储...');
      
      // 清理localStorage
      const localStorageKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('mhxy_') || key.startsWith('game_') || key.includes('inventory'))) {
          localStorageKeys.push(key);
        }
      }
      
      localStorageKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`[DataClearManager] 已删除localStorage键: ${key}`);
      });

      // 清理sessionStorage
      const sessionStorageKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('mhxy_') || key.startsWith('game_') || key.includes('inventory'))) {
          sessionStorageKeys.push(key);
        }
      }
      
      sessionStorageKeys.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`[DataClearManager] 已删除sessionStorage键: ${key}`);
      });

      this.recordClearOperation('browser_storage', '浏览器存储已清理');
      console.log('[DataClearManager] 浏览器存储清理完成');
      
      return { 
        success: true, 
        message: `浏览器存储已清理 (localStorage: ${localStorageKeys.length}, sessionStorage: ${sessionStorageKeys.length})` 
      };
    } catch (error) {
      console.error('[DataClearManager] 清理浏览器存储失败:', error);
      return { success: false, message: `清理浏览器存储失败: ${error.message}` };
    }
  }

  /**
   * 全面清理所有数据
   */
  async clearAllData(dispatch) {
    const results = {
      inventory: null,
      redux: null,
      electronStore: null,
      browserStorage: null,
      summary: {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        errors: []
      }
    };

    console.log('[DataClearManager] 开始全面清理数据...');

    // 依次执行各项清理操作
    results.inventory = await this.clearInventoryData();
    results.redux = await this.clearReduxData(dispatch);
    results.electronStore = await this.clearElectronStore();
    results.browserStorage = await this.clearBrowserStorage();

    // 统计结果
    const operations = [results.inventory, results.redux, results.electronStore, results.browserStorage];
    results.summary.totalOperations = operations.length;
    results.summary.successfulOperations = operations.filter(op => op.success).length;
    results.summary.failedOperations = operations.filter(op => !op.success).length;
    results.summary.errors = operations.filter(op => !op.success).map(op => op.message);

    this.recordClearOperation('complete', `全面清理完成: ${results.summary.successfulOperations}/${results.summary.totalOperations} 成功`);
    
    console.log('[DataClearManager] 全面清理完成:', results);

    return results;
  }

  /**
   * 选择性清理数据
   */
  async clearSelectedData(options, dispatch) {
    const results = {};
    let totalOperations = 0;
    let successfulOperations = 0;

    console.log('[DataClearManager] 开始选择性清理数据:', options);

    if (options.inventory) {
      results.inventory = await this.clearInventoryData();
      totalOperations++;
      if (results.inventory.success) successfulOperations++;
    }

    if (options.redux) {
      results.redux = await this.clearReduxData(dispatch);
      totalOperations++;
      if (results.redux.success) successfulOperations++;
    }

    if (options.electronStore) {
      results.electronStore = await this.clearElectronStore();
      totalOperations++;
      if (results.electronStore.success) successfulOperations++;
    }

    if (options.browserStorage) {
      results.browserStorage = await this.clearBrowserStorage();
      totalOperations++;
      if (results.browserStorage.success) successfulOperations++;
    }

    results.summary = {
      totalOperations,
      successfulOperations,
      failedOperations: totalOperations - successfulOperations
    };

    this.recordClearOperation('selective', `选择性清理完成: ${successfulOperations}/${totalOperations} 成功`);

    return results;
  }

  /**
   * 记录清理操作
   */
  recordClearOperation(type, message) {
    this.clearHistory.push({
      type,
      message,
      timestamp: Date.now(),
      date: new Date().toLocaleString('zh-CN')
    });

    // 保留最近50条记录
    if (this.clearHistory.length > 50) {
      this.clearHistory = this.clearHistory.slice(-50);
    }
  }

  /**
   * 获取清理历史
   */
  getClearHistory() {
    return this.clearHistory;
  }

  /**
   * 清空清理历史
   */
  clearClearHistory() {
    this.clearHistory = [];
  }

  /**
   * 检查数据状态
   */
  async checkDataStatus() {
    const status = {
      inventory: {
        itemCount: inventoryManager.items.size,
        usedSlots: inventoryManager.getUsedSlotsCount(),
        gold: inventoryManager.gold
      },
      electronStore: null,
      browserStorage: {
        localStorageKeys: 0,
        sessionStorageKeys: 0
      }
    };

    // 检查Electron Store
    if (window.electronAPI?.store) {
      try {
        const inventoryState = await window.electronAPI.store.get('inventoryState');
        status.electronStore = {
          hasInventoryData: !!inventoryState,
          inventoryDataSize: inventoryState ? JSON.stringify(inventoryState).length : 0
        };
      } catch (error) {
        status.electronStore = { error: error.message };
      }
    } else {
      status.electronStore = { available: false };
    }

    // 检查浏览器存储
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('mhxy_') || key.startsWith('game_') || key.includes('inventory'))) {
        status.browserStorage.localStorageKeys++;
      }
    }

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('mhxy_') || key.startsWith('game_') || key.includes('inventory'))) {
        status.browserStorage.sessionStorageKeys++;
      }
    }

    return status;
  }
}

// 创建单例实例
const dataClearManager = new DataClearManager();
export default dataClearManager; 