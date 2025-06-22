/**
 * PlayerManager - 负责管理玩家核心数据和逻辑的管理器
 * 替代原有的 playerSlice，实现面向对象的状态管理。
 */
import { EventEmitter } from 'events';
import { playerBaseConfig, playerLevelConfig } from '@/config/character/playerConfig';
import { HOMESTEAD_GENERAL_CONFIG } from '@/config/homestead/homesteadConfig'; // 修正导入路径

class PlayerManager extends EventEmitter {
  constructor() {
    super();
    this.reset(); // 初始化状态
  }

  /**
   * 重置玩家状态到初始值
   */
  reset() {
    this.level = playerBaseConfig.initialLevel;
    this.experience = playerBaseConfig.initialExperience;
    this.resources = {}; // 家园资源
    this.achievements = [];
    this.statistics = {
      totalRefinements: 0,
      totalSkillBooks: 0,
      totalEquipmentObtained: 0,
    };
    
    // 初始化家园资源
    Object.values(HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES).forEach(resourceConfig => {
      this.resources[resourceConfig.id] = resourceConfig.initialValue || 0;
    });

    // 派生属性
    this.maxSummons = playerBaseConfig.getMaxSummonsByLevel(this.level);
    this.maxInventorySlots = playerBaseConfig.getMaxInventorySlotsByLevel(this.level);
    
    console.log('[PlayerManager] Player state has been reset.');
    this.emit('state_changed', this.getState());
  }

  /**
   * 增加经验值并处理升级
   * @param {number} amount - 要增加的经验值
   */
  addExperience(amount) {
    if (this.level >= playerBaseConfig.maxLevel) {
      return; // 满级后不再增加经验
    }
    
    this.experience += amount;
    
    let leveledUp = false;
    while (this.level < playerBaseConfig.maxLevel) {
      const expForNextLevel = playerLevelConfig.getRequiredExperience(this.level + 1);
      if (this.experience >= expForNextLevel) {
        this.level += 1;
        leveledUp = true;
      } else {
        break;
      }
    }
    
    if (leveledUp) {
      // 更新派生属性
      const oldMaxSummons = this.maxSummons;
      this.maxSummons = playerBaseConfig.getMaxSummonsByLevel(this.level);
      this.maxInventorySlots = playerBaseConfig.getMaxInventorySlotsByLevel(this.level);
      console.log(`[PlayerManager] Leveled up to ${this.level}!`);

      if (this.maxSummons !== oldMaxSummons) {
        this.emit('max_summons_changed', this.maxSummons);
      }
    }

    this.emit('state_changed', this.getState());
  }

  /**
   * 增加金钱 - [已废弃, 请使用 addResource('gold', amount)]
   * @deprecated
   */
  addGold(amount) {
    this.addResource('gold', amount);
  }

  /**
   * 减少金钱 - [已废弃, 请使用 spendResource('gold', amount)]
   * @deprecated
   */
  removeGold(amount) {
    return this.spendResource('gold', amount);
  }

  // --- 家园资源管理 ---

  /**
   * 增加指定资源
   * @param {string} resourceId - 资源ID (e.g., 'wood')
   * @param {number} amount - 增加的数量
   */
  addResource(resourceId, amount) {
    if (amount <= 0 || this.resources[resourceId] === undefined) return;
    this.resources[resourceId] += amount;
    this.emit('state_changed', this.getState());
  }
  
  /**
   * 批量增加资源
   * @param {Array<{resource: string, amount: number}>} resourcesToAdd
   */
  addResources(resourcesToAdd = []) {
     resourcesToAdd.forEach(({ resource, amount }) => {
      if (amount > 0 && this.resources[resource] !== undefined) {
        this.resources[resource] += amount;
      }
    });
    this.emit('state_changed', this.getState());
  }

  /**
   * 消耗指定资源
   * @param {string} resourceId - 资源ID
   * @param {number} amount - 消耗的数量
   * @returns {boolean} - 是否成功
   */
  spendResource(resourceId, amount) {
    if (amount <= 0 || !this.hasEnoughResource(resourceId, amount)) {
      return false;
    }
    this.resources[resourceId] -= amount;
    this.emit('state_changed', this.getState());
    return true;
  }
  
  /**
   * 检查单一资源是否足够
   * @param {string} resourceId 
   * @param {number} amount 
   * @returns {boolean}
   */
  hasEnoughResource(resourceId, amount) {
    return this.resources[resourceId] !== undefined && this.resources[resourceId] >= amount;
  }

  /**
   * 检查一系列资源成本是否足够
   * @param {Array<{resource: string, amount: number}>} costs - 成本数组
   * @returns {boolean}
   */
  hasEnoughResources(costs = []) {
    return costs.every(cost => this.hasEnoughResource(cost.resource, cost.amount));
  }

  /**
   * 消耗一系列资源
   * @param {Array<{resource: string, amount: number}>} costs - 成本数组
   * @returns {boolean} - 是否成功
   */
  spendResources(costs = []) {
    if (!this.hasEnoughResources(costs)) {
      return false;
    }
    
    costs.forEach(cost => {
      this.spendResource(cost.resource, cost.amount);
    });

    // Note: spendResource already emits state_changed.
    // To avoid multiple events, we could refactor them to not emit
    // and emit a single event here. For now, this is acceptable.
    
    return true;
  }

  /**
   * 更新统计数据
   * @param {string} type - 统计项的键名
   * @param {number} value - 要增加的值
   */
  updateStatistics(type, value = 1) {
    if (this.statistics.hasOwnProperty(type)) {
      this.statistics[type] += value;
      this.emit('state_changed', this.getState());
    }
  }

  /**
   * 添加一个成就
   * @param {object} achievement - 成就对象，应包含id
   */
  addAchievement(achievement) {
    if (!this.achievements.some(a => a.id === achievement.id)) {
      this.achievements.push(achievement);
      this.emit('state_changed', this.getState());
    }
  }

  /**
   * 获取当前玩家状态的快照
   * @returns {object}
   */
  getState() {
    return {
      level: this.level,
      experience: this.experience,
      resources: { ...this.resources },
      maxSummons: this.maxSummons,
      maxInventorySlots: this.maxInventorySlots,
      achievements: [...this.achievements],
      statistics: { ...this.statistics },
    };
  }
  
  // ===========================================
  // 存档/读档接口
  // ===========================================

  /**
   * 获取用于存档的玩家数据
   * @returns {object}
   */
  getSaveData() {
    return {
      level: this.level,
      experience: this.experience,
      resources: this.resources,
      achievements: this.achievements,
      statistics: this.statistics,
    };
  }

  /**
   * 从存档数据中加载玩家状态
   * @param {object} data - 从存档加载的数据
   */
  loadSaveData(data) {
    if (!data) return;

    this.level = data.level || playerBaseConfig.initialLevel;
    this.experience = data.experience || 0;
    this.resources = data.resources || {};
    
    // 向下兼容，如果旧存档有独立的gold字段，则合并它
    if (data.gold && !this.resources.gold) {
        this.resources.gold = data.gold;
    }

    this.achievements = data.achievements || [];
    this.statistics = data.statistics || {};

    // 重新计算派生属性
    this.maxSummons = playerBaseConfig.getMaxSummonsByLevel(this.level);
    this.maxInventorySlots = playerBaseConfig.getMaxInventorySlotsByLevel(this.level);

    console.log('[PlayerManager] Player state loaded from save data.');
    this.emit('state_changed', this.getState());
    // 读档后也需要通知其他管理器
    this.emit('max_summons_changed', this.maxSummons);
  }

  // ===========================================
  // 调试接口
  // ===========================================
  debug_fillAllResources() {
    Object.keys(this.resources).forEach(resourceId => {
      this.resources[resourceId] = 999999;
    });
    console.log('[PlayerManager] [Debug] All resources (including gold) have been filled.');
    this.emit('state_changed', this.getState());
  }
}

// 导出 PlayerManager 类
export default PlayerManager; 