/**
 * PlayerManager - 负责管理玩家核心数据和逻辑的管理器
 * 替代原有的 playerSlice，实现面向对象的状态管理。
 */
import { EventEmitter } from 'events';
import { playerBaseConfig, playerLevelConfig } from '@/config/character/playerConfig';

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
    this.gold = playerBaseConfig.initialGold || 0;
    this.achievements = [];
    this.statistics = {
      totalRefinements: 0,
      totalSkillBooks: 0,
      totalEquipmentObtained: 0,
    };
    
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
   * 增加金钱
   * @param {number} amount - 要增加的数量
   */
  addGold(amount) {
    if (amount <= 0) return;
    this.gold += amount;
    this.emit('state_changed', this.getState());
  }

  /**
   * 减少金钱
   * @param {number} amount - 要减少的数量
   * @returns {boolean} - 是否成功
   */
  removeGold(amount) {
    if (amount <= 0 || this.gold < amount) {
      return false;
    }
    this.gold -= amount;
    this.emit('state_changed', this.getState());
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
      gold: this.gold,
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
      gold: this.gold,
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
    this.gold = data.gold || 0;
    this.achievements = data.achievements || [];
    this.statistics = data.statistics || {
      totalRefinements: 0,
      totalSkillBooks: 0,
      totalEquipmentObtained: 0,
    };

    // 重新计算派生属性
    this.maxSummons = playerBaseConfig.getMaxSummonsByLevel(this.level);
    this.maxInventorySlots = playerBaseConfig.getMaxInventorySlotsByLevel(this.level);

    console.log('[PlayerManager] Player state loaded from save data.');
    this.emit('state_changed', this.getState());
    // 读档后也需要通知其他管理器
    this.emit('max_summons_changed', this.maxSummons);
  }
}

const playerManagerInstance = new PlayerManager();
export default playerManagerInstance; 