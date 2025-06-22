/**
 * SaveLoadManager - 存档与读档系统的核心管理器
 * 职责：
 * 1. 与Electron主进程通信，使用electron-store进行本地文件读写。
 * 2. 协调游戏中所有需要持久化的模块（Managers, Redux Slices）。
 * 3. 提供统一的存档、读档、获取存档列表的接口。
 */
import { EventEmitter } from 'events';
import store from '../index'; // 导入Redux store

const MAX_SAVE_SLOTS = 5;

class SaveLoadManager extends EventEmitter {
  constructor() {
    super();
    this.electronStore = window.electronAPI?.store;
    if (!this.electronStore) {
      console.warn('[SaveLoadManager] Electron Store API 未找到。存档功能将不可用。');
    }

    // 依赖将在 initialize 方法中注入
    this.playerManager = null;
    this.summonManager = null;
    this.inventoryManager = null;
    this.homesteadManager = null;
  }

  /**
   * 初始化并注入依赖
   * @param {{playerManager: object, summonManager: object, inventoryManager: object, homesteadManager: object}} managers 
   */
  initialize({ playerManager, summonManager, inventoryManager, homesteadManager }) {
    this.playerManager = playerManager;
    this.summonManager = summonManager;
    this.inventoryManager = inventoryManager;
    this.homesteadManager = homesteadManager;
    console.log('[SaveLoadManager] Initialized with all managers.');
  }

  /**
   * 获取所有存档槽位的元数据列表
   * @returns {Promise<Array<object|null>>}
   */
  async getSaveSlots() {
    if (!this.electronStore) return new Array(MAX_SAVE_SLOTS).fill(null);

    const slots = [];
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
      const slotId = `slot_${i}`;
      const saveData = await this.electronStore.get(`save_${slotId}`);
      slots.push(saveData ? saveData.metadata : null);
    }
    return slots;
  }

  /**
   * 保存当前游戏状态到指定槽位
   * @param {number} slotIndex - 存档槽位索引 (0-based)
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async saveGame(slotIndex) {
    if (!this.electronStore) {
      return { success: false, message: '存档功能不可用' };
    }

    console.log(`[SaveLoadManager] 开始保存游戏到槽位 ${slotIndex}...`);

    try {
      // --- 第一阶段：搭建框架，使用虚拟数据 ---
      const currentState = this.collectFullGameState();
      
      const saveData = {
        metadata: {
          slotId: `slot_${slotIndex + 1}`,
          saveTime: new Date().toISOString(),
          playerName: currentState.redux.player.name || '英雄',
          level: currentState.redux.player.level || 1,
          playtime: '0h 1m', // 占位
        },
        gameState: currentState,
      };

      await this.electronStore.set(`save_slot_${slotIndex + 1}`, saveData);
      
      console.log(`[SaveLoadManager] 存档成功:`, saveData);
      this.emit('saved', { slotIndex });
      return { success: true, message: '存档成功！' };

    } catch (error) {
      console.error(`[SaveLoadManager] 存档到槽位 ${slotIndex} 失败:`, error);
      return { success: false, message: `存档失败: ${error.message}` };
    }
  }

  /**
   * 从指定槽位加载游戏状态
   * @param {number} slotIndex - 存档槽位索引 (0-based)
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async loadGame(slotIndex) {
    if (!this.electronStore) {
      return { success: false, message: '读档功能不可用' };
    }

    console.log(`[SaveLoadManager] 开始从槽位 ${slotIndex} 加载游戏...`);
    
    try {
      const saveData = await this.electronStore.get(`save_slot_${slotIndex + 1}`);
      if (!saveData) {
        throw new Error('找不到存档文件');
      }

      // --- 恢复状态 ---
      this.restoreFullGameState(saveData.gameState);

      console.log(`[SaveLoadManager] 读档成功, 状态已恢复。`);
      this.emit('loaded', { slotIndex });
      return { success: true, message: '读档成功！' };
      
    } catch (error) {
      console.error(`[SaveLoadManager] 从槽位 ${slotIndex} 读档失败:`, error);
      return { success: false, message: `读档失败: ${error.message}` };
    }
  }

  /**
   * 开始一个新游戏，重置所有状态
   */
  startNewGame() {
    console.log('[SaveLoadManager] 开始新游戏，正在重置状态...');
    // this.inventoryManager.reset();
    this.summonManager.reset();
    this.playerManager.reset();
    this.homesteadManager.reset();
    // store.dispatch({ type: 'game/reset' });
    this.emit('new_game_started');
  }

  /**
   * 收集整个游戏的状态
   * @returns {object} - 包含所有需要存档数据的对象
   */
  collectFullGameState() {
    console.log('[SaveLoadManager] 正在收集所有游戏状态...');
    
    // --- 在此逐一实现各模块的数据收集 ---
    const playerData = this.playerManager.getSaveData();
    // const inventoryData = this.inventoryManager.getSaveData();
    const summonData = this.summonManager.getSaveData();
    const homesteadData = this.homesteadManager.getSaveData();
    
    // 不再从Redux获取player state, homestead state
    const { quests, tower, map, formation } = store.getState();

    return {
      managers: {
        player: playerData,
        // inventory: inventoryData, // 占位
        summon: summonData,
        homestead: homesteadData,
      },
      redux: {
        // player state 已被移除
        // homestead state 已被移除
        quests,
        tower,
        map,
        formation,
      },
      // 其他需要保存的数据
      timestamp: Date.now(),
    };
  }

  /**
   * 根据存档数据，恢复整个游戏的状态
   * @param {object} gameState - 从存档文件读取的游戏状态
   */
  restoreFullGameState(gameState) {
    console.log('[SaveLoadManager] 正在恢复所有游戏状态...');

    // --- 在此逐一实现各模块的数据恢复 ---
    if (gameState.managers?.player) {
      this.playerManager.loadSaveData(gameState.managers.player);
    }
    // this.inventoryManager.loadSaveData(gameState.managers.inventory);
    if (gameState.managers?.summon) {
      this.summonManager.loadSaveData(gameState.managers.summon);
    }
    if (gameState.managers?.homestead) {
      this.homesteadManager.loadSaveData(gameState.managers.homestead);
    }
    
    // 恢复Redux状态
    if (gameState.redux) {
      // 推荐使用一个专用的action来替换状态
      store.dispatch({
        type: 'STATE_HYDRATE',
        payload: gameState.redux,
      });
    }

    console.log('[SaveLoadManager] 状态恢复完成。');
  }
}

export default SaveLoadManager; 