/*
 * @Author: Claude
 * @Date: 2025-01-27
 * @Description: 战斗事件总线 - 实现发布-订阅模式的事件系统
 */

/**
 * 战斗事件总线类
 * 提供事件的发布、订阅和管理功能
 */
export class BattleEventBus {
  constructor(options = {}) {
    this.listeners = new Map(); // eventType -> Set<listener>
    this.eventHistory = [];
    this.isEnabled = true;
    this.recentEvents = new Map(); // 用于去重的近期事件记录
    
    this.options = {
      enableHistory: true,
      maxHistorySize: 1000,
      enableLogging: false,
      enableDeduplication: true, // 启用事件去重
      deduplicationWindow: 100, // 去重时间窗口（毫秒）
      ...options
    };
  }

  /**
   * 订阅事件
   * @param {string} eventType - 事件类型
   * @param {Function} listener - 事件监听器
   * @returns {Function} 取消订阅函数
   */
  subscribe(eventType, listener) {
    if (typeof listener !== 'function') {
      throw new Error('监听器必须是函数');
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType).add(listener);

    this._log(`订阅事件: ${eventType}`, { listenerCount: this.listeners.get(eventType).size });

    // 返回取消订阅函数
    return () => this.unsubscribe(eventType, listener);
  }

  /**
   * 取消订阅事件
   * @param {string} eventType - 事件类型
   * @param {Function} listener - 事件监听器
   * @returns {boolean} 是否成功取消订阅
   */
  unsubscribe(eventType, listener) {
    const listeners = this.listeners.get(eventType);
    if (!listeners) {
      return false;
    }

    const removed = listeners.delete(listener);
    
    // 如果没有监听器了，删除事件类型
    if (listeners.size === 0) {
      this.listeners.delete(eventType);
    }

    if (removed) {
      this._log(`取消订阅事件: ${eventType}`, { listenerCount: listeners.size });
    }

    return removed;
  }

  /**
   * 发布事件
   * @param {string} eventType - 事件类型
   * @param {Object} eventData - 事件数据
   * @returns {Object} 发布结果
   */
  emit(eventType, eventData = {}) {
    if (!this.isEnabled) {
      return { success: false, reason: 'EventBus is disabled' };
    }

    const event = {
      type: eventType,
      data: eventData,
      timestamp: Date.now(),
      id: this._generateEventId()
    };

    // 事件去重检查
    if (this.options.enableDeduplication && this._isDuplicateEvent(eventType, eventData)) {
      this._log(`跳过重复事件: ${eventType}`, { eventData });
      return { success: true, skipped: true, reason: 'Duplicate event' };
    }

    // 记录事件历史
    if (this.options.enableHistory) {
      this._addToHistory(event);
    }

    const listeners = this.listeners.get(eventType);
    if (!listeners || listeners.size === 0) {
      this._log(`发布事件: ${eventType} (无监听器)`, event);
      return { success: true, listenerCount: 0, event };
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // 调用所有监听器
    for (const listener of listeners) {
      try {
        listener(event);
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          listener,
          error: error.message,
          stack: error.stack
        });
        this._log(`事件监听器执行失败: ${eventType}`, { error: error.message });
      }
    }

    this._log(`发布事件: ${eventType}`, {
      listenerCount: listeners.size,
      successCount,
      errorCount
    });

    return {
      success: errorCount === 0,
      listenerCount: listeners.size,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
      event
    };
  }

  /**
   * 一次性订阅事件（事件触发一次后自动取消订阅）
   * @param {string} eventType - 事件类型
   * @param {Function} listener - 事件监听器
   * @returns {Function} 取消订阅函数
   */
  once(eventType, listener) {
    const onceListener = (event) => {
      listener(event);
      this.unsubscribe(eventType, onceListener);
    };

    return this.subscribe(eventType, onceListener);
  }

  /**
   * 等待特定事件
   * @param {string} eventType - 事件类型
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise} 事件Promise
   */
  waitFor(eventType, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.unsubscribe(eventType, listener);
        reject(new Error(`等待事件 ${eventType} 超时`));
      }, timeout);

      const listener = (event) => {
        clearTimeout(timer);
        this.unsubscribe(eventType, listener);
        resolve(event);
      };

      this.subscribe(eventType, listener);
    });
  }

  /**
   * 批量订阅事件
   * @param {Object} eventListeners - 事件监听器映射 { eventType: listener }
   * @returns {Function} 批量取消订阅函数
   */
  subscribeMultiple(eventListeners) {
    const unsubscribeFunctions = [];

    for (const [eventType, listener] of Object.entries(eventListeners)) {
      const unsubscribe = this.subscribe(eventType, listener);
      unsubscribeFunctions.push(unsubscribe);
    }

    // 返回批量取消订阅函数
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * 获取事件监听器数量
   * @param {string} eventType - 事件类型（可选）
   * @returns {number|Object} 监听器数量或各事件类型的监听器数量
   */
  getListenerCount(eventType) {
    if (eventType) {
      const listeners = this.listeners.get(eventType);
      return listeners ? listeners.size : 0;
    }

    const counts = {};
    for (const [type, listeners] of this.listeners) {
      counts[type] = listeners.size;
    }
    return counts;
  }

  /**
   * 获取事件历史
   * @param {string} eventType - 事件类型（可选）
   * @param {number} limit - 限制数量
   * @returns {Array} 事件历史数组
   */
  getEventHistory(eventType, limit = 100) {
    let history = this.eventHistory;

    if (eventType) {
      history = history.filter(event => event.type === eventType);
    }

    return history.slice(-limit);
  }

  /**
   * 清空事件历史
   */
  clearHistory() {
    this.eventHistory = [];
    this._log('事件历史已清空');
  }

  /**
   * 清空所有监听器
   */
  clearAllListeners() {
    const totalListeners = Array.from(this.listeners.values())
      .reduce((sum, listeners) => sum + listeners.size, 0);

    this.listeners.clear();
    this._log(`已清空所有监听器`, { totalListeners });
  }

  /**
   * 启用/禁用事件总线
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    this._log(`事件总线 ${enabled ? '已启用' : '已禁用'}`);
  }

  /**
   * 获取调试信息
   * @returns {Object} 调试信息
   */
  getDebugInfo() {
    return {
      isEnabled: this.isEnabled,
      listenerCounts: this.getListenerCount(),
      totalListeners: Array.from(this.listeners.values())
        .reduce((sum, listeners) => sum + listeners.size, 0),
      eventHistorySize: this.eventHistory.length,
      options: { ...this.options }
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 生成事件ID
   * @private
   */
  _generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加到事件历史
   * @private
   */
  _addToHistory(event) {
    this.eventHistory.push(event);

    // 限制历史记录大小
    if (this.eventHistory.length > this.options.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.options.maxHistorySize);
    }
  }

  /**
   * 日志记录
   * @private
   */
  _log(message, data = {}) {
    if (this.options.enableLogging) {
      console.log(`[BattleEventBus] ${message}`, data);
    }
  }

  /**
   * 检查是否为重复事件
   * @param {string} eventType - 事件类型
   * @param {Object} eventData - 事件数据
   * @returns {boolean} 是否为重复事件
   * @private
   */
  _isDuplicateEvent(eventType, eventData) {
    const now = Date.now();
    const eventKey = this._generateEventKey(eventType, eventData);
    
    // 清理过期的事件记录
    this._cleanupExpiredEvents(now);
    
    // 检查是否存在相同的事件
    if (this.recentEvents.has(eventKey)) {
      const lastEventTime = this.recentEvents.get(eventKey);
      if (now - lastEventTime < this.options.deduplicationWindow) {
        return true; // 是重复事件
      }
    }
    
    // 记录新事件
    this.recentEvents.set(eventKey, now);
    return false;
  }

  /**
   * 生成事件键用于去重
   * @param {string} eventType - 事件类型
   * @param {Object} eventData - 事件数据
   * @returns {string} 事件键
   * @private
   */
  _generateEventKey(eventType, eventData) {
    // 对于ACTION_EXECUTED事件，使用unitId和目标来生成唯一键
    if (eventType === 'action_executed' && eventData.unitId) {
      const targets = eventData.action?.action?.targets || eventData.action?.targets || [];
      return `${eventType}_${eventData.unitId}_${targets.join('_')}`;
    }
    
    // 对于其他事件，使用简单的字符串化
    return `${eventType}_${JSON.stringify(eventData)}`;
  }

  /**
   * 清理过期的事件记录
   * @param {number} now - 当前时间戳
   * @private
   */
  _cleanupExpiredEvents(now) {
    for (const [eventKey, timestamp] of this.recentEvents.entries()) {
      if (now - timestamp > this.options.deduplicationWindow * 2) {
        this.recentEvents.delete(eventKey);
      }
    }
  }
}

/**
 * 创建事件总线实例的工厂函数
 * @param {Object} options - 配置选项
 * @returns {BattleEventBus} 事件总线实例
 */
export const createBattleEventBus = (options = {}) => {
  return new BattleEventBus(options);
};

// 导出常用的事件类型常量
export const BATTLE_EVENTS = {
  // 战斗生命周期事件
  BATTLE_INITIALIZED: 'battle_initialized',
  BATTLE_STARTED: 'battle_started',
  BATTLE_ENDED: 'battle_ended',
  BATTLE_PAUSED: 'battle_paused',
  BATTLE_RESUMED: 'battle_resumed',
  
  // 回合事件
  ROUND_STARTED: 'round_started',
  ROUND_ENDED: 'round_ended',
  TURN_STARTED: 'turn_started',
  TURN_ENDED: 'turn_ended',
  
  // 行动事件
  ACTION_SUBMITTED: 'action_submitted',
  ACTION_EXECUTED: 'action_executed',
  ACTION_CANCELLED: 'action_cancelled',
  
  // 战斗效果事件
  DAMAGE_DEALT: 'damage_dealt',
  HEALING_APPLIED: 'healing_applied',
  STATUS_EFFECT_APPLIED: 'status_effect_applied',
  STATUS_EFFECT_REMOVED: 'status_effect_removed',
  
  // 单位事件
  UNIT_DEFEATED: 'unit_defeated',
  UNIT_REVIVED: 'unit_revived',
  UNIT_STATS_CHANGED: 'unit_stats_changed',
  
  // 阶段转换事件
  PHASE_CHANGED: 'phase_changed',
  PREPARATION_COMPLETE: 'preparation_complete',
  EXECUTION_COMPLETE: 'execution_complete',
  RESOLUTION_COMPLETE: 'resolution_complete',
  
  // 错误事件
  ERROR_OCCURRED: 'error_occurred',
  VALIDATION_FAILED: 'validation_failed'
};

export default BattleEventBus; 