/**
 * 战斗队列管理系统
 * 实现单位行动队列和动画播放队列的分离架构
 */

import { ANIMATION_DURATIONS } from '../config/animationConfig';

/**
 * 单位行动队列管理器
 */
export class UnitActionQueue {
  constructor() {
    this.queue = [];
    this.currentIndex = 0;
  }

  /**
   * 初始化队列
   * @param {Array} turnOrder - 行动顺序
   * @param {Map} unitActions - 单位行动数据
   */
  initialize(turnOrder, unitActions) {
    this.queue = turnOrder.map(unitId => ({
      unitId,
      action: unitActions.get(unitId),
      processed: false
    })).filter(item => item.action); // 过滤掉没有行动的单位
    
    this.currentIndex = 0;
    console.log(`📋 [UnitActionQueue] 初始化行动队列:`, {
      totalActions: this.queue.length,
      actions: this.queue.map(item => {
        const realAction = item.action?.action || item.action;
        return `${item.unitId}:${realAction?.type || 'unknown'}`;
      })
    });
  }

  /**
   * 获取下一个单位行动
   * @returns {Object|null} 单位行动对象
   */
  getNext() {
    if (this.currentIndex >= this.queue.length) {
      return null;
    }

    const action = this.queue[this.currentIndex];
    console.log(`➡️ [UnitActionQueue] 获取下个行动: ${action.unitId} (#${this.currentIndex + 1}/${this.queue.length})`);
    return action;
  }

  /**
   * 标记当前行动为已处理，移动到下一个
   */
  markCurrentAsProcessed() {
    if (this.currentIndex < this.queue.length) {
      this.queue[this.currentIndex].processed = true;
      console.log(`✅ [UnitActionQueue] 标记行动已处理: ${this.queue[this.currentIndex].unitId}`);
      this.currentIndex++;
    }
  }

  /**
   * 检查是否还有未处理的行动
   * @returns {boolean}
   */
  hasNext() {
    return this.currentIndex < this.queue.length;
  }

  /**
   * 获取队列状态
   * @returns {Object}
   */
  getStatus() {
    return {
      total: this.queue.length,
      current: this.currentIndex,
      remaining: this.queue.length - this.currentIndex,
      completed: this.currentIndex,
      hasNext: this.hasNext()
    };
  }
}

/**
 * 动画播放队列管理器  
 */
export class AnimationPlayQueue {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.queue = [];
    this.isPlaying = false;
  }

  /**
   * 根据单位行动生成动画序列
   * @param {Object} actionResult - 行动结果
   * @returns {Array} 动画序列
   */
  generateAnimationSequence(actionResult) {
    const { unitId, action, result } = actionResult;
    const animations = [];

    // 提取真正的action数据（处理嵌套结构）
    const realAction = action.action || action;
    
    // 统一目标字段名：支持 targets 或 targetIds
    const targets = realAction.targets || realAction.targetIds;
    
    console.log(`🎬 [AnimationPlayQueue] 为单位${unitId}生成动画序列:`, { 
      actionType: realAction.type,
      targets: targets,
      originalTargets: realAction.targets,
      originalTargetIds: realAction.targetIds,
      actionStructure: action,
      realActionStructure: realAction,
      resultStructure: result
    });

    switch (realAction.type) {
      case 'attack':
        // 检查是否有有效目标
        if (!targets || targets.length === 0) {
          console.warn(`🚫 [AnimationPlayQueue] 单位${unitId}的攻击没有有效目标，跳过动画生成`);
          return []; // 返回空动画序列
        }
        
        // 1. 攻击者攻击动画
        animations.push({
          type: 'attack',
          unitId: unitId,
          duration: ANIMATION_DURATIONS.ATTACK_MOVE,
          data: {
            casterId: unitId,
            targets: targets,
            skill: realAction.skill || { name: '普通攻击' }
          }
        });

        // 2. 目标受击动画（设置延迟，与攻击动画时机同步）
        if (targets && targets.length > 0) {
          targets.forEach(targetId => {
            animations.push({
              type: 'hit',
              unitId: targetId,
              duration: ANIMATION_DURATIONS.HIT_REACTION,
              delay: ANIMATION_DURATIONS.KNOCKBACK_TRIGGER_TIME, // 🚨 添加延迟，与攻击动画同步
              data: {
                targetId: targetId,
                attackerId: unitId,
                damage: result.totalDamage || result.damage || 0
              }
            });

            // 3. 死亡动画（如果目标死亡）
            // 检查result中是否有目标死亡信息
            const targetResult = result.results && result.results.find(r => r.targetId === targetId);
            if (targetResult && targetResult.isDefeated) {
              animations.push({
                type: 'death',
                unitId: targetId,
                duration: ANIMATION_DURATIONS.DEATH_ANIMATION,
                delay: ANIMATION_DURATIONS.KNOCKBACK_TRIGGER_TIME + ANIMATION_DURATIONS.HIT_REACTION, // 在受击动画结束后立即开始 (1200ms)
                data: {
                  unitId: targetId
                }
              });
            }
          });
        }
        break;

      case 'skill':
        // 技能动画序列
        animations.push({
          type: 'skill',
          unitId: unitId,
          duration: ANIMATION_DURATIONS.SKILL_CAST,
          data: {
            casterId: unitId,
            skill: realAction.skill,
            targets: targets
          }
        });

        // 技能效果和受击动画
        if (targets) {
          targets.forEach(targetId => {
            animations.push({
              type: 'skill_effect',
              unitId: targetId,
              duration: ANIMATION_DURATIONS.SKILL_EFFECT,
              data: {
                targetId: targetId,
                skill: realAction.skill
              }
            });
          });
        }
        break;

      case 'defend':
        // 防御动画
        animations.push({
          type: 'defend',
          unitId: unitId,
          duration: ANIMATION_DURATIONS.DEFEND,
          data: {
            unitId: unitId
          }
        });
        break;
    }

    console.log(`📝 [AnimationPlayQueue] 生成${animations.length}个动画:`, 
      animations.map(anim => `${anim.type}(${anim.unitId})`));
    
    return animations;
  }

  /**
   * 将动画序列添加到队列
   * @param {Array} animations - 动画序列
   */
  enqueue(animations) {
    this.queue.push(...animations);
    console.log(`📥 [AnimationPlayQueue] 添加${animations.length}个动画到队列，当前队列长度: ${this.queue.length}`);
  }

  /**
   * 播放队列中的所有动画
   * @returns {Promise} 播放完成的Promise
   */
  async playAll() {
    if (this.queue.length === 0) {
      console.log(`🎭 [AnimationPlayQueue] 动画队列为空，跳过播放`);
      return;
    }

    console.log(`🎭 [AnimationPlayQueue] 开始并行播放${this.queue.length}个动画`);
    this.isPlaying = true;

    // 🚨 改为并行播放：同时启动所有动画，等待全部完成
    const animationPromises = this.queue.map((animation, index) => {
      console.log(`🎬 [AnimationPlayQueue] 启动动画 ${index + 1}/${this.queue.length}: ${animation.type}(${animation.unitId})`);
      return this._playAnimation(animation);
    });

    // 等待所有动画完成
    await Promise.all(animationPromises);

    // 清空队列
    this.queue = [];
    this.isPlaying = false;
    console.log(`🏁 [AnimationPlayQueue] 所有动画并行播放完成，队列已清空`);
  }

  /**
   * 播放单个动画
   * @param {Object} animation - 动画对象
   * @returns {Promise} 动画完成的Promise
   * @private
   */
  async _playAnimation(animation) {
    return new Promise((resolve) => {
      let resolved = false;
      
      // 设置动画完成监听器
      const onAnimationComplete = (event) => {
        const eventData = event.data || event;
        const isMatch = this._isAnimationMatch(animation, eventData);
        
        console.log(`📨 [AnimationPlayQueue] 收到动画完成事件:`, {
          expectedType: animation.type,
          expectedUnit: animation.unitId,
          eventType: this._getEventName(animation.type),
          eventStructure: {
            hasData: !!event.data,
            eventData: eventData,
            rawEvent: event
          },
          isMatch: isMatch
        });
        
        if (isMatch && !resolved) {
          resolved = true;
          console.log(`🎯 [AnimationPlayQueue] 动画完成匹配: ${animation.type}(${animation.unitId})`);
          this.eventBus.unsubscribe(this._getEventName(animation.type), onAnimationComplete);
          resolve();
        } else if (!isMatch) {
          console.log(`❌ [AnimationPlayQueue] 动画完成事件不匹配:`, {
            expectedUnit: animation.unitId,
            receivedUnit: eventData.unitId,
            receivedCaster: eventData.casterId,
            receivedTarget: eventData.targetId
          });
        }
      };

      // 订阅对应的动画完成事件
      const eventName = this._getEventName(animation.type);
      console.log(`👂 [AnimationPlayQueue] 订阅动画完成事件:`, {
        eventName,
        animationType: animation.type,
        unitId: animation.unitId
      });
      this.eventBus.subscribe(eventName, onAnimationComplete);

      // 🚨 支持延迟动画：如果有delay，使用RAF延迟发送开始事件（与UI动画同步）
      const delay = animation.delay || 0;
      const sendAnimationStart = () => {
        console.log(`📤 [AnimationPlayQueue] 发送动画开始事件:`, {
          animationType: animation.type,
          unitId: animation.unitId,
          data: animation.data,
          delay: delay
        });
        this._emitAnimationStart(animation);
      };
      
      if (delay > 0) {
        const delayStartTime = performance.now();
        console.log(`⏰ [AnimationPlayQueue] 使用RAF延迟${delay}ms发送动画开始事件:`, {
          animationType: animation.type,
          unitId: animation.unitId,
          delayDuration: delay,
          delayStartTimestamp: delayStartTime
        });
        // 使用RAF实现精确的延迟，与UI动画同步
        const startTime = performance.now();
        const delayFrame = (timestamp) => {
          const elapsed = timestamp - startTime;
          if (elapsed >= delay) {
            const actualDelay = performance.now() - delayStartTime;
            console.log(`✅ [AnimationPlayQueue] RAF延迟完成:`, {
              animationType: animation.type,
              unitId: animation.unitId,
              expectedDelay: delay,
              actualDelay: actualDelay.toFixed(2),
              delayError: (actualDelay - delay).toFixed(2)
            });
            sendAnimationStart();
          } else {
            requestAnimationFrame(delayFrame);
          }
        };
        requestAnimationFrame(delayFrame);
      } else {
        console.log(`🚀 [AnimationPlayQueue] 立即发送动画开始事件:`, {
          animationType: animation.type,
          unitId: animation.unitId,
          timestamp: performance.now()
        });
        sendAnimationStart();
      }

      // 设置超时保护（考虑延迟时间，使用RAF与UI动画同步）
      const timeoutDuration = animation.duration + delay + 1000; // 动画时长 + 延迟 + 1秒缓冲
      const timeoutStartTime = performance.now();
      const timeoutFrame = (timestamp) => {
        const elapsed = timestamp - timeoutStartTime;
        if (elapsed >= timeoutDuration) {
          if (!resolved) {
            resolved = true;
            console.log(`⏰ [AnimationPlayQueue] 动画超时: ${animation.type}(${animation.unitId})`);
            this.eventBus.unsubscribe(eventName, onAnimationComplete);
            resolve();
          }
        } else if (!resolved) {
          requestAnimationFrame(timeoutFrame);
        }
      };
      requestAnimationFrame(timeoutFrame);
    });
  }

  /**
   * 发送动画开始事件
   * @param {Object} animation - 动画对象
   * @private
   */
  _emitAnimationStart(animation) {
    switch (animation.type) {
      case 'attack':
        const attackEventData = {
          unitId: animation.unitId,
          action: {
            type: 'attack',
            targets: animation.data.targets,
            skill: animation.data.skill
          }
        };
        const attackTimestamp = performance.now();
        console.log(`📤 [EventBus] 发布攻击动画事件:`, {
          eventName: 'action_executed',
          attackerId: animation.unitId,
          targets: animation.data.targets,
          skill: animation.data.skill?.name || '普通攻击',
          timestamp: attackTimestamp,
          delay: animation.delay || 0,
          eventData: attackEventData
        });
        this.eventBus.emit('action_executed', attackEventData);
        break;

      case 'hit':
        const hitEventData = {
          targetId: animation.data.targetId,
          attackerId: animation.data.attackerId,
          damage: animation.data.damage
        };
        const hitTimestamp = performance.now();
        console.log(`📤 [EventBus] 发布受击动画事件:`, {
          eventName: 'start_knockback',
          attackerId: animation.data.attackerId,
          targetId: animation.data.targetId,
          damage: animation.data.damage,
          timestamp: hitTimestamp,
          delay: animation.delay || 0,
          eventData: hitEventData
        });
        this.eventBus.emit('start_knockback', hitEventData);
        break;

      case 'death':
        const deathEventData = {
          unitId: animation.data.unitId
        };
        const deathTimestamp = performance.now();
        console.log(`📤 [EventBus] 发布死亡动画事件:`, {
          eventName: 'unit_death',
          unitId: animation.data.unitId,
          timestamp: deathTimestamp,
          delay: animation.delay || 0,
          eventData: deathEventData
        });
        this.eventBus.emit('unit_death', deathEventData);
        break;

      case 'skill':
        const skillEventData = {
          casterId: animation.unitId,
          skill: animation.data.skill,
          targets: animation.data.targets
        };
        const skillTimestamp = performance.now();
        console.log(`📤 [EventBus] 发布技能动画事件:`, {
          eventName: 'skill_cast',
          casterId: animation.unitId,
          skill: animation.data.skill?.name || '未知技能',
          targets: animation.data.targets,
          timestamp: skillTimestamp,
          delay: animation.delay || 0,
          eventData: skillEventData
        });
        this.eventBus.emit('skill_cast', skillEventData);
        break;

      case 'defend':
        const defendEventData = {
          unitId: animation.unitId
        };
        const defendTimestamp = performance.now();
        console.log(`📤 [EventBus] 发布防御动画事件:`, {
          eventName: 'unit_defend',
          unitId: animation.unitId,
          timestamp: defendTimestamp,
          delay: animation.delay || 0,
          eventData: defendEventData
        });
        this.eventBus.emit('unit_defend', defendEventData);
        break;

      default:
        console.warn(`⚠️ [EventBus] 未知的动画类型:`, {
          animationType: animation.type,
          unitId: animation.unitId,
          data: animation.data
        });
        break;
    }
  }

  /**
   * 获取动画类型对应的完成事件名
   * @param {string} animationType - 动画类型
   * @returns {string} 事件名
   * @private
   */
  _getEventName(animationType) {
    const eventMap = {
      'attack': 'attack_animation_complete',
      'hit': 'hit_animation_complete', 
      'death': 'death_animation_complete',
      'skill': 'skill_animation_complete',
      'skill_effect': 'skill_effect_complete',
      'defend': 'defend_animation_complete'
    };
    return eventMap[animationType] || `${animationType}_animation_complete`;
  }

  /**
   * 检查动画完成事件是否匹配当前动画
   * @param {Object} animation - 当前动画
   * @param {Object} eventData - 事件数据
   * @returns {boolean} 是否匹配
   * @private
   */
  _isAnimationMatch(animation, eventData) {
    return eventData.unitId === animation.unitId || 
           eventData.casterId === animation.unitId ||
           eventData.targetId === animation.unitId;
  }

  /**
   * 获取队列状态
   * @returns {Object}
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      isPlaying: this.isPlaying,
      nextAnimation: this.queue.length > 0 ? this.queue[0] : null
    };
  }
}

/**
 * 战斗队列管理器 - 统一管理两个队列
 */
export class BattleQueueManager {
  constructor(eventBus) {
    this.unitActionQueue = new UnitActionQueue();
    this.animationPlayQueue = new AnimationPlayQueue(eventBus);
    this.eventBus = eventBus;
  }

  /**
   * 初始化队列系统
   * @param {Array} turnOrder - 行动顺序
   * @param {Map} unitActions - 单位行动数据
   */
  initialize(turnOrder, unitActions) {
    this.unitActionQueue.initialize(turnOrder, unitActions);
    console.log(`🚀 [BattleQueueManager] 队列系统初始化完成`);
  }

  /**
   * 执行下一个单位的行动
   * @param {Function} processActionCallback - 处理行动的回调函数
   * @returns {Promise<boolean>} 是否还有更多行动
   */
  async executeNext(processActionCallback) {
    const action = this.unitActionQueue.getNext();
    if (!action) {
      console.log(`🏁 [BattleQueueManager] 所有单位行动执行完成`);
      return false;
    }

    console.log(`🎯 [BattleQueueManager] 开始处理单位${action.unitId}的行动`);

    // 1. 处理单位行动逻辑（伤害计算等）
    const actionResult = processActionCallback(action);

    // 2. 如果行动被跳过，直接完成
    if (actionResult.skipped) {
      console.log(`⏭️ [BattleQueueManager] 单位${action.unitId}行动被跳过: ${actionResult.reason}`);
      this.unitActionQueue.markCurrentAsProcessed();
      return this.unitActionQueue.hasNext();
    }

    // 3. 根据行动结果生成动画序列
    const animations = this.animationPlayQueue.generateAnimationSequence({
      unitId: action.unitId,
      action: action.action,
      result: actionResult
    });

    // 4. 如果没有动画需要播放，直接完成
    if (!animations || animations.length === 0) {
      console.log(`🎭 [BattleQueueManager] 单位${action.unitId}没有动画需要播放，直接完成`);
      this.unitActionQueue.markCurrentAsProcessed();
      return this.unitActionQueue.hasNext();
    }

    // 5. 将动画加入播放队列
    this.animationPlayQueue.enqueue(animations);

    // 6. 播放所有动画
    await this.animationPlayQueue.playAll();

    // 5. 标记当前行动已完成
    this.unitActionQueue.markCurrentAsProcessed();

    console.log(`✅ [BattleQueueManager] 单位${action.unitId}行动完成`);
    return this.unitActionQueue.hasNext();
  }

  /**
   * 获取整体状态
   * @returns {Object}
   */
  getStatus() {
    return {
      unitQueue: this.unitActionQueue.getStatus(),
      animationQueue: this.animationPlayQueue.getStatus()
    };
  }
} 