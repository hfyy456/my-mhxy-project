/**
 * 数据清理管理器 - 完善版
 * 用于清理游戏中的各种数据存储，支持OOP架构
 */
import inventoryManager from './InventoryManager';
import summonManager from './SummonManager';

class DataClearManager {
  constructor() {
    this.clearHistory = [];
  }

  /**
   * 清理OOP召唤兽系统数据
   */
  async clearSummonManagerData() {
    try {
      console.log('[DataClearManager] 开始清理OOP召唤兽系统数据...');
      
      // 清理内存中的召唤兽数据
      summonManager.summons.clear();
      summonManager.currentSummonId = null;
      summonManager.maxSummons = 6; // 重置为默认值
      
      // 清理持久化存储
      if (window.electronAPI?.store) {
        await window.electronAPI.store.delete('summonState');  // 修正存储键名
        await window.electronAPI.store.delete('summonManagerState');
        await window.electronAPI.store.delete('summonData');
      }
      
      // 触发状态更新事件
      summonManager.emit('system_cleared');
      summonManager.emit('state_changed', summonManager.getState());
      
      this.recordClearOperation('oop_summons', 'OOP召唤兽系统数据已清理');
      console.log('[DataClearManager] OOP召唤兽系统数据清理完成');
      
      return { success: true, message: 'OOP召唤兽系统数据已清理' };
    } catch (error) {
      console.error('[DataClearManager] 清理OOP召唤兽系统数据失败:', error);
      return { success: false, message: `清理OOP召唤兽系统数据失败: ${error.message}` };
    }
  }

  /**
   * 清理背包系统数据
   */
  async clearInventoryData() {
    try {
      console.log('[DataClearManager] 开始清理背包数据...');
      
      // 清理内存中的数据
      inventoryManager.items.clear();
      inventoryManager.gold = 0;
      inventoryManager.capacity = 100;
      
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
   * 清理Redux状态（保持兼容性）
   */
  async clearReduxData(dispatch) {
    try {
      console.log('[DataClearManager] 开始清理Redux状态...');
      
      // 动态导入所有slice的重置actions
      const [
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
        'summonManagerState',  // OOP召唤兽系统
        'gameState',
        'playerData',
        'summonData',          // Redux召唤兽数据
        'questData',
        'battleData',
        'settingsData',
        'saveData',
        'homesteadData',
        'formationData',
        'npcData',
        'mapData',
        'towerData'
      ];

      let deletedCount = 0;
      for (const key of keysToDelete) {
        try {
          await window.electronAPI.store.delete(key);
          deletedCount++;
          console.log(`[DataClearManager] 已删除键: ${key}`);
        } catch (error) {
          console.warn(`[DataClearManager] 删除键失败: ${key}`, error);
        }
      }

      this.recordClearOperation('electron_store', `Electron Store数据已清理 (${deletedCount}/${keysToDelete.length})`);
      console.log('[DataClearManager] Electron Store清理完成');
      
      return { success: true, message: `Electron Store数据已清理 (${deletedCount}/${keysToDelete.length})` };
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
        if (key && (key.startsWith('mhxy_') || key.startsWith('game_') || key.includes('inventory') || key.includes('summon'))) {
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
        if (key && (key.startsWith('mhxy_') || key.startsWith('game_') || key.includes('inventory') || key.includes('summon'))) {
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
   * 数据验证和修复
   */
  async validateAndRepairData() {
    try {
      console.log('[DataClearManager] 开始数据验证和修复...');
      
      const issues = [];
      const repairs = [];

      // 验证召唤兽和装备的关联
      const summons = summonManager.getAllSummons();
      for (const summon of summons) {
        if (summon.equippedItemIds) {
          for (const [slotType, itemId] of Object.entries(summon.equippedItemIds)) {
            if (itemId) {
              const item = inventoryManager.getItemById(itemId);
              if (!item) {
                issues.push(`召唤兽 ${summon.id} 装备了不存在的物品 ${itemId}`);
                // 修复：移除无效装备引用
                delete summon.equippedItemIds[slotType];
                repairs.push(`已移除召唤兽 ${summon.id} 对无效装备 ${itemId} 的引用`);
              } else if (!item.isEquipped || item.equippedBy !== summon.id) {
                issues.push(`装备 ${itemId} 的状态与召唤兽 ${summon.id} 不匹配`);
                // 修复：同步装备状态
                item.isEquipped = true;
                item.equippedBy = summon.id;
                item.equippedSlot = slotType;
                repairs.push(`已同步装备 ${itemId} 的状态`);
              }
            }
          }
        }
      }

      // 验证装备的召唤兽引用
      const items = inventoryManager.getItems();
      for (const item of items) {
        if (item.type === 'equipment' && item.isEquipped && item.equippedBy) {
          const summon = summonManager.getSummonById(item.equippedBy);
          if (!summon) {
            issues.push(`装备 ${item.id} 引用了不存在的召唤兽 ${item.equippedBy}`);
            // 修复：重置装备状态
            item.isEquipped = false;
            item.equippedBy = null;
            item.equippedSlot = null;
            repairs.push(`已重置装备 ${item.id} 的状态`);
          } else if (!summon.equippedItemIds || summon.equippedItemIds[item.equippedSlot] !== item.id) {
            issues.push(`装备 ${item.id} 与召唤兽 ${item.equippedBy} 的装备记录不匹配`);
            // 修复：重置装备状态
            item.isEquipped = false;
            item.equippedBy = null;
            item.equippedSlot = null;
            repairs.push(`已重置装备 ${item.id} 的状态`);
          }
        }
      }

      // 保存修复后的数据
      if (repairs.length > 0) {
        await summonManager.saveToElectronStore();
        await inventoryManager.saveToElectronStore();
      }

      this.recordClearOperation('validation', `数据验证完成: ${issues.length} 个问题, ${repairs.length} 个修复`);
      console.log('[DataClearManager] 数据验证和修复完成');
      
      return { 
        success: true, 
        message: `数据验证完成: 发现 ${issues.length} 个问题，完成 ${repairs.length} 个修复`,
        issues,
        repairs
      };
    } catch (error) {
      console.error('[DataClearManager] 数据验证和修复失败:', error);
      return { success: false, message: `数据验证和修复失败: ${error.message}` };
    }
  }

  /**
   * 数据优化
   */
  async optimizeData() {
    try {
      console.log('[DataClearManager] 开始数据优化...');
      
      const optimizations = [];

      // 清理过期的临时数据
      const now = Date.now();
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

      // 清理历史记录
      const oldHistoryCount = this.clearHistory.length;
      this.clearHistory = this.clearHistory.filter(record => record.timestamp > oneWeekAgo);
      if (oldHistoryCount > this.clearHistory.length) {
        optimizations.push(`清理了 ${oldHistoryCount - this.clearHistory.length} 条过期的清理历史记录`);
      }

      // 重新计算所有召唤兽属性（确保数据一致性）
      const summons = summonManager.getAllSummons();
      let recalculatedCount = 0;
      for (const summon of summons) {
        try {
          summon.recalculateAttributes();
          recalculatedCount++;
        } catch (error) {
          console.warn(`[DataClearManager] 重新计算召唤兽 ${summon.id} 属性失败:`, error);
        }
      }
      if (recalculatedCount > 0) {
        optimizations.push(`重新计算了 ${recalculatedCount} 个召唤兽的属性`);
      }

      // 整理背包物品
      const beforeItemCount = inventoryManager.items.size;
      // 移除数量为0的物品
      let removedCount = 0;
      for (const [itemId, item] of inventoryManager.items) {
        if (item.quantity <= 0) {
          inventoryManager.items.delete(itemId);
          removedCount++;
        }
      }
      if (removedCount > 0) {
        optimizations.push(`清理了 ${removedCount} 个无效物品`);
      }

      // 保存优化后的数据
      if (optimizations.length > 0) {
        await summonManager.saveToElectronStore();
        await inventoryManager.saveToElectronStore();
      }

      this.recordClearOperation('optimization', `数据优化完成: ${optimizations.length} 项优化`);
      console.log('[DataClearManager] 数据优化完成');
      
      return { 
        success: true, 
        message: `数据优化完成: 执行了 ${optimizations.length} 项优化`,
        optimizations
      };
    } catch (error) {
      console.error('[DataClearManager] 数据优化失败:', error);
      return { success: false, message: `数据优化失败: ${error.message}` };
    }
  }

  /**
   * 全面清理所有数据
   */
  async clearAllData(dispatch) {
    const results = {
      oopSummons: null,
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
    results.oopSummons = await this.clearSummonManagerData();
    results.inventory = await this.clearInventoryData();
    results.redux = await this.clearReduxData(dispatch);
    results.electronStore = await this.clearElectronStore();
    results.browserStorage = await this.clearBrowserStorage();

    // 统计结果
    const operations = [results.oopSummons, results.inventory, results.redux, results.electronStore, results.browserStorage];
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

    if (options.oopSummons) {
      results.oopSummons = await this.clearSummonManagerData();
      totalOperations++;
      if (results.oopSummons.success) successfulOperations++;
    }

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

    if (options.validate) {
      results.validation = await this.validateAndRepairData();
      totalOperations++;
      if (results.validation.success) successfulOperations++;
    }

    if (options.optimize) {
      results.optimization = await this.optimizeData();
      totalOperations++;
      if (results.optimization.success) successfulOperations++;
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
   * 快速修复数据不一致问题
   */
  async quickFix() {
    console.log('[DataClearManager] 开始快速修复...');
    
    const results = {
      validation: await this.validateAndRepairData(),
      optimization: await this.optimizeData()
    };
    
    const successCount = [results.validation.success, results.optimization.success].filter(Boolean).length;
    
    this.recordClearOperation('quick_fix', `快速修复完成: ${successCount}/2 成功`);
    
    return {
      success: successCount === 2,
      message: `快速修复完成: ${successCount}/2 操作成功`,
      results
    };
  }

  /**
   * 数据迁移（从Redux到OOP）
   */
  async migrateDataFromReduxToOOP(reduxStore) {
    try {
      console.log('[DataClearManager] 开始数据迁移（Redux -> OOP）...');
      
      const migrations = [];
      
      // 获取Redux中的召唤兽数据
      const reduxState = reduxStore.getState();
      const reduxSummons = reduxState.summons?.allSummons || {};
      
      let migratedCount = 0;
      for (const [summonId, summonData] of Object.entries(reduxSummons)) {
        try {
          // 检查OOP系统中是否已存在
          const existingSummon = summonManager.getSummonById(summonId);
          if (existingSummon) {
            migrations.push(`召唤兽 ${summonId} 已存在于OOP系统中，跳过迁移`);
            continue;
          }
          
          // 迁移到OOP系统
          const migratedSummon = summonManager.addSummon({
            ...summonData,
            id: summonId // 保持原有ID
          });
          
          if (migratedSummon) {
            migratedCount++;
            migrations.push(`成功迁移召唤兽 ${summonId} 到OOP系统`);
          } else {
            migrations.push(`迁移召唤兽 ${summonId} 失败`);
          }
        } catch (error) {
          migrations.push(`迁移召唤兽 ${summonId} 时出错: ${error.message}`);
        }
      }
      
      // 设置当前召唤兽
      if (reduxState.summons?.currentSummonId && summonManager.getSummonById(reduxState.summons.currentSummonId)) {
        summonManager.setCurrentSummon(reduxState.summons.currentSummonId);
        migrations.push(`已设置当前召唤兽: ${reduxState.summons.currentSummonId}`);
      }
      
      // 保存迁移后的数据
      if (migratedCount > 0) {
        await summonManager.saveToElectronStore();
      }
      
      this.recordClearOperation('migration', `数据迁移完成: ${migratedCount} 个召唤兽`);
      console.log('[DataClearManager] 数据迁移完成');
      
      return {
        success: true,
        message: `数据迁移完成: 成功迁移 ${migratedCount} 个召唤兽`,
        migratedCount,
        migrations
      };
    } catch (error) {
      console.error('[DataClearManager] 数据迁移失败:', error);
      return { success: false, message: `数据迁移失败: ${error.message}` };
    }
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

    // 保留最近100条记录
    if (this.clearHistory.length > 100) {
      this.clearHistory = this.clearHistory.slice(-100);
    }
  }

  /**
   * 获取清理历史
   */
  getClearHistory() {
    return [...this.clearHistory].reverse(); // 最新的在前
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
      oopSummons: {
        count: summonManager.getAllSummons().length,
        currentSummonId: summonManager.currentSummonId,
        maxSummons: summonManager.maxSummons
      },
      inventory: {
        itemCount: inventoryManager.items.size,
        usedSlots: inventoryManager.getUsedSlotsCount(),
        gold: inventoryManager.gold
      },
      electronStore: null,
      browserStorage: {
        localStorageKeys: 0,
        sessionStorageKeys: 0
      },
      dataConsistency: {
        equipmentIssues: [],
        validationNeeded: false
      }
    };

    // 检查Electron Store
    if (window.electronAPI?.store) {
      try {
        const [inventoryState, summonManagerState] = await Promise.all([
          window.electronAPI.store.get('inventoryState'),
          window.electronAPI.store.get('summonManagerState')
        ]);
        
        status.electronStore = {
          hasInventoryData: !!inventoryState,
          hasSummonData: !!summonManagerState,
          inventoryDataSize: inventoryState ? JSON.stringify(inventoryState).length : 0,
          summonDataSize: summonManagerState ? JSON.stringify(summonManagerState).length : 0
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
      if (key && (key.startsWith('mhxy_') || key.startsWith('game_') || key.includes('inventory') || key.includes('summon'))) {
        status.browserStorage.localStorageKeys++;
      }
    }

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('mhxy_') || key.startsWith('game_') || key.includes('inventory') || key.includes('summon'))) {
        status.browserStorage.sessionStorageKeys++;
      }
    }

    // 快速检查数据一致性
    const summons = summonManager.getAllSummons();
    for (const summon of summons) {
      if (summon.equippedItemIds) {
        for (const [slotType, itemId] of Object.entries(summon.equippedItemIds)) {
          if (itemId) {
            const item = inventoryManager.getItemById(itemId);
            if (!item || !item.isEquipped || item.equippedBy !== summon.id) {
              status.dataConsistency.equipmentIssues.push(`召唤兽 ${summon.id} 的装备 ${itemId} 状态不一致`);
              status.dataConsistency.validationNeeded = true;
            }
          }
        }
      }
    }

    return status;
  }

  /**
   * 生成数据备份
   */
  async createDataBackup() {
    try {
      console.log('[DataClearManager] 创建数据备份...');
      
      const backup = {
        timestamp: Date.now(),
        date: new Date().toISOString(),
        version: '1.0',
        data: {
          summons: summonManager.serializeForStorage(),
          inventory: inventoryManager.serializeForStorage(),
          clearHistory: this.clearHistory
        }
      };
      
      // 保存到Electron Store
      if (window.electronAPI?.store) {
        const backupKey = `backup_${backup.timestamp}`;
        await window.electronAPI.store.set(backupKey, backup);
        
        // 清理旧备份（保留最近10个）
        const allKeys = await window.electronAPI.store.keys();
        const backupKeys = allKeys.filter(key => key.startsWith('backup_')).sort().reverse();
        if (backupKeys.length > 10) {
          for (const oldKey of backupKeys.slice(10)) {
            await window.electronAPI.store.delete(oldKey);
          }
        }
      }
      
      this.recordClearOperation('backup', '数据备份已创建');
      console.log('[DataClearManager] 数据备份创建完成');
      
      return {
        success: true,
        message: '数据备份创建成功',
        backupId: backup.timestamp
      };
    } catch (error) {
      console.error('[DataClearManager] 创建数据备份失败:', error);
      return { success: false, message: `创建数据备份失败: ${error.message}` };
    }
  }

  /**
   * 恢复数据备份
   */
  async restoreDataBackup(backupId) {
    try {
      console.log('[DataClearManager] 恢复数据备份:', backupId);
      
      if (!window.electronAPI?.store) {
        return { success: false, message: 'Electron Store API不可用' };
      }
      
      const backupKey = `backup_${backupId}`;
      const backup = await window.electronAPI.store.get(backupKey);
      
      if (!backup) {
        return { success: false, message: '找不到指定的备份' };
      }
      
      // 恢复数据
      if (backup.data.summons) {
        summonManager.deserializeFromStorage(backup.data.summons);
      }
      
      if (backup.data.inventory) {
        inventoryManager.deserializeFromStorage(backup.data.inventory);
      }
      
      if (backup.data.clearHistory) {
        this.clearHistory = backup.data.clearHistory;
      }
      
      this.recordClearOperation('restore', `已恢复备份: ${backup.date}`);
      console.log('[DataClearManager] 数据备份恢复完成');
      
      return {
        success: true,
        message: `数据备份恢复成功: ${backup.date}`
      };
    } catch (error) {
      console.error('[DataClearManager] 恢复数据备份失败:', error);
      return { success: false, message: `恢复数据备份失败: ${error.message}` };
    }
  }

  /**
   * 获取可用备份列表
   */
  async getAvailableBackups() {
    try {
      if (!window.electronAPI?.store) {
        return { success: false, message: 'Electron Store API不可用' };
      }
      
      const allKeys = await window.electronAPI.store.keys();
      const backupKeys = allKeys.filter(key => key.startsWith('backup_'));
      
      const backups = [];
      for (const key of backupKeys) {
        try {
          const backup = await window.electronAPI.store.get(key);
          if (backup && backup.timestamp) {
            backups.push({
              id: backup.timestamp,
              date: backup.date,
              version: backup.version || '未知',
              size: JSON.stringify(backup).length
            });
          }
        } catch (error) {
          console.warn(`[DataClearManager] 读取备份 ${key} 失败:`, error);
        }
      }
      
      // 按时间倒序排列
      backups.sort((a, b) => b.id - a.id);
      
      return {
        success: true,
        backups
      };
    } catch (error) {
      console.error('[DataClearManager] 获取备份列表失败:', error);
      return { success: false, message: `获取备份列表失败: ${error.message}` };
    }
  }
}

// 创建单例实例
const dataClearManager = new DataClearManager();
export default dataClearManager; 