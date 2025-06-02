/**
 * 统一奖励管理器
 * 将所有游戏奖励（战斗、任务、对话等）集成到面向对象背包系统
 */
import inventoryManager from './InventoryManager';
import { generateUniqueId } from '@/utils/idUtils';

class RewardManager {
  constructor() {
    this.rewardHistory = [];
  }

  /**
   * 给予物品奖励
   * @param {Array} items - 物品数组，格式：[{id, name, type, quantity, ...}]
   * @param {string} source - 奖励来源（battle、quest、dialogue等）
   * @returns {Object} 奖励结果
   */
  async giveItemRewards(items, source = 'unknown') {
    const results = {
      success: true,
      addedItems: [],
      failedItems: [],
      message: ''
    };

    for (const itemData of items) {
      try {
        // 标准化物品数据
        const standardizedItem = this.standardizeItemData(itemData, source);
        
        console.log(`[RewardManager] 尝试添加物品:`, standardizedItem);
        
        // 直接使用quantity进行添加
        const success = inventoryManager.addItem(standardizedItem);

        if (success) {
          results.addedItems.push(standardizedItem);
          console.log(`[RewardManager] 成功添加物品: ${standardizedItem.name} x${standardizedItem.quantity}`);
        } else {
          // 添加失败，可能是背包满了
          results.failedItems.push({
            ...standardizedItem,
            reason: '背包已满'
          });
          console.log(`[RewardManager] 添加物品失败: ${standardizedItem.name}, 原因: 背包已满`);
          results.success = false;
        }

      } catch (error) {
        console.error('[RewardManager] 添加物品奖励失败:', error, itemData);
        results.failedItems.push({
          ...itemData,
          reason: error.message
        });
        results.success = false;
      }
    }

    // 强制触发一次状态更新确保UI同步
    setTimeout(() => {
      inventoryManager.emit('inventory_changed', inventoryManager.getState());
      console.log('[RewardManager] 强制触发背包状态更新');
    }, 10);

    // 记录奖励历史
    this.rewardHistory.push({
      timestamp: Date.now(),
      source,
      results
    });

    // 生成结果消息
    results.message = this.generateRewardMessage(results, source);

    return results;
  }

  /**
   * 给予金币奖励
   * @param {number} amount - 金币数量
   * @param {string} source - 奖励来源
   */
  giveGoldReward(amount, source = 'unknown') {
    if (amount > 0) {
      inventoryManager.addGold(amount);
      console.log(`[RewardManager] 获得 ${amount} 金币 (来源: ${source})`);
      return {
        success: true,
        amount,
        message: `获得 ${amount} 金币！`
      };
    }
    return { success: false, amount: 0, message: '' };
  }

  /**
   * 综合奖励处理
   * @param {Object} rewards - 奖励对象 {items: [], gold: number, experience: number}
   * @param {string} source - 奖励来源
   */
  async giveRewards(rewards, source = 'unknown') {
    const results = {
      items: null,
      gold: null,
      experience: null,
      messages: []
    };

    // 处理物品奖励
    if (rewards.items && rewards.items.length > 0) {
      results.items = await this.giveItemRewards(rewards.items, source);
      if (results.items.message) {
        results.messages.push(results.items.message);
      }
    }

    // 处理金币奖励
    if (rewards.gold && rewards.gold > 0) {
      results.gold = this.giveGoldReward(rewards.gold, source);
      if (results.gold.message) {
        results.messages.push(results.gold.message);
      }
    }

    // 处理经验奖励（TODO: 需要玩家系统）
    if (rewards.experience && rewards.experience > 0) {
      console.log(`[RewardManager] 获得 ${rewards.experience} 经验 (来源: ${source})`);
      results.experience = { amount: rewards.experience, message: `获得 ${rewards.experience} 经验！` };
      results.messages.push(results.experience.message);
    }

    return results;
  }

  /**
   * 标准化物品数据格式
   * @param {Object} itemData - 原始物品数据
   * @param {string} source - 来源
   * @returns {Object} 标准化的物品数据
   */
  standardizeItemData(itemData, source) {
    return {
      id: itemData.id || itemData.itemId || generateUniqueId('reward_item'),
      name: itemData.name || '未知物品',
      type: itemData.type || itemData.itemType || 'misc',
      subType: itemData.subType || '',
      rarity: itemData.rarity || 'common',
      quality: itemData.quality || 'normal',
      quantity: itemData.quantity || 1,
      description: itemData.description || `来自${source}的奖励`,
      value: itemData.value || itemData.sellPrice || 10,
      level: itemData.level || 1,
      source: `reward_${source}`,
      isReward: true,
      rewardedAt: Date.now()
    };
  }

  /**
   * 生成奖励消息
   * @param {Object} results - 奖励结果
   * @param {string} source - 来源
   * @returns {string} 奖励消息
   */
  generateRewardMessage(results, source) {
    const messages = [];

    if (results.addedItems.length > 0) {
      const itemNames = results.addedItems.map(item => 
        `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`
      ).join('、');
      messages.push(`获得物品：${itemNames}`);
    }

    if (results.failedItems.length > 0) {
      const failedCount = results.failedItems.reduce((sum, item) => sum + item.quantity, 0);
      messages.push(`${failedCount}个物品因背包已满未能获得`);
    }

    return messages.join('，') || '无物品奖励';
  }

  /**
   * 获取奖励历史
   * @param {string} source - 可选的来源过滤
   * @returns {Array} 奖励历史
   */
  getRewardHistory(source = null) {
    if (source) {
      return this.rewardHistory.filter(record => record.source === source);
    }
    return this.rewardHistory;
  }

  /**
   * 清理旧的奖励历史
   * @param {number} maxAge - 最大保留时间（毫秒）
   */
  cleanupHistory(maxAge = 7 * 24 * 60 * 60 * 1000) { // 默认7天
    const cutoff = Date.now() - maxAge;
    this.rewardHistory = this.rewardHistory.filter(record => record.timestamp > cutoff);
  }
}

// 创建单例实例
const rewardManager = new RewardManager();
export default rewardManager; 