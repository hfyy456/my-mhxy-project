import React, { useState, useEffect, useRef, memo } from "react";
import { getBuffById } from "@/config/skill/buffConfig";
import { useBattleAdapter } from '../context/BattleAdapterContext.jsx';
import { ANIMATION_DURATIONS, ANIMATION_EVENTS } from '../config/animationConfig.js';
import "./BattleUnitSprite.css";

// 动态导入所有精灵图
const images = import.meta.glob("@/assets/summons/*.png", { eager: true });

const BattleUnitSprite = ({ 
  unit, 
  onClick, 
  hasAction = false,
  // 状态机数据通过props传入
  currentPhase,
  allUnitActions = {},
  battleLog = [],
}) => {
  // 🔍 调试计数器：追踪受击动画订阅和触发次数
  const hitAnimationCounters = useRef({
    subscriptions: 0,
    triggers: 0,
    lastSubscriptionTime: null,
    lastTriggerTime: null
  });

  // 🚨 防重复订阅：跟踪当前订阅状态
  const currentSubscriptionsRef = useRef({
    eventBus: null,
    unitId: null,
    isSubscribed: false
  });

  const logHitAnimationEvent = (eventType, details = {}) => {
    const counter = hitAnimationCounters.current;
    const timestamp = Date.now();
    
    if (eventType === 'subscription') {
      counter.subscriptions++;
      counter.lastSubscriptionTime = timestamp;
    } else if (eventType === 'trigger') {
      counter.triggers++;
      counter.lastTriggerTime = timestamp;
    }
    
    console.log(`🎯 [${unit?.name}] 受击动画${eventType}:`, {
      eventType,
      subscriptions: counter.subscriptions,
      triggers: counter.triggers,
      timeSinceLastSub: counter.lastSubscriptionTime ? timestamp - counter.lastSubscriptionTime : 'N/A',
      timeSinceLastTrigger: counter.lastTriggerTime ? timestamp - counter.lastTriggerTime : 'N/A',
      unitId: unit?.id,
      ...details
    });
  };
  // 直接使用适配器Context，不需要完整的状态机状态
  const adapter = useBattleAdapter();
  // 状态用于控制攻击动画
  const [isAttacking, setIsAttacking] = useState(false);
  const [isReceivingDamage, setIsReceivingDamage] = useState(false);
  const [showDefendEffect, setShowDefendEffect] = useState(false);
  // 添加伤害数字显示状态
  const [showDamageNumber, setShowDamageNumber] = useState(false);
  const [damageValue, setDamageValue] = useState(0);
  const [isCritical, setIsCritical] = useState(false);
  const [damageTimestamp, setDamageTimestamp] = useState(0);
  
  // 添加死亡动画延迟状态
  const [showDeathAnimation, setShowDeathAnimation] = useState(false);
  // 添加死亡等待标记
  const [waitingForDeathAnimation, setWaitingForDeathAnimation] = useState(false);
  
  // 直接从所有行动中获取当前单位的行动
  const unitAction = unit ? allUnitActions[unit.id] : null;
  
  // 保存上一次的HP值，用于检测HP变化
  const previousHpRef = useRef(null);
  const defendEffectAnimFrameRef = useRef(null);
  // 防止重复攻击动画的引用
  const lastAttackEventRef = useRef(null);
  // 🚨 防重复受击：跟踪最后一次受击事件
  const lastKnockbackEventRef = useRef(null);
  // 组件实例标识
  const componentInstanceId = useRef(Math.random().toString(36).substr(2, 9));
  
  // 🚨 添加防御特效引用管理
  const defendEffectRef = useRef(null);
  
  // 组件挂载时初始化HP值
  useEffect(() => {
    if (unit?.stats?.currentHp !== undefined) {
      previousHpRef.current = unit.stats.currentHp;
    }
    
    return () => {
      // 组件卸载时清理
      if (defendEffectAnimFrameRef.current) {
        cancelAnimationFrame(defendEffectAnimFrameRef.current);
      }
    };
  }, []);
  
  // 清除防御特效的函数
  const clearDefendEffect = () => {
    if (defendEffectAnimFrameRef.current) {
      cancelAnimationFrame(defendEffectAnimFrameRef.current);
    }
    
    const startTime = performance.now();
    const duration = 800; // 与受击动画时间相同
    
    const hideDefendEffect = (timestamp) => {
      const elapsed = timestamp - startTime;
      if (elapsed >= duration) {
        setShowDefendEffect(false);
        // 清除动画帧引用
        defendEffectAnimFrameRef.current = null;
        return;
      }
      defendEffectAnimFrameRef.current =
        requestAnimationFrame(hideDefendEffect);
    };
    
    defendEffectAnimFrameRef.current = requestAnimationFrame(hideDefendEffect);
  };
  
  // 🚨 监听HP变化但不直接触发受击动画，只用于数据同步
  // 受击动画现在完全由事件总线系统控制，避免双重触发
  useEffect(() => {
    if (!unit?.stats) return;

    const currentHp = unit.stats.currentHp;
    const isCurrentlyDefeated = unit.isDefeated;
    
    // 如果HP比之前低，说明受到了伤害（包括致命伤害）
    if (previousHpRef.current !== null && currentHp < previousHpRef.current) {
      const damage = previousHpRef.current - currentHp;
      const isDying = currentHp === 0 && previousHpRef.current > 0;
      
      console.log(`🩸 ${unit.name} HP变化检测（不触发动画）:`, {
        previousHp: previousHpRef.current,
        currentHp,
        damage,
        isDying,
        isDefeated: isCurrentlyDefeated
      });
      
      // 🚨 不再直接触发受击动画，改由事件总线控制
      // setIsReceivingDamage(true); // 已禁用
      
      // 只处理伤害数字显示（将在handleKnockback中处理）
      // setDamageValue(damage);
      // setShowDamageNumber(true);
      
      // 如果是致命伤害，设置等待死亡动画标记
      if (isDying) {
        console.log(`💀 ${unit.name} 致命伤害，标记等待死亡动画`);
        setWaitingForDeathAnimation(true);
      }
    }
    
    // 更新上一次的HP值
    previousHpRef.current = currentHp;
  }, [unit?.stats?.currentHp, unit?.isDefeated, unit?.isDefending]);

  // 监听单位死亡状态，但只在没有受击动画且没有等待死亡动画时才立即显示
  // 🚨 添加延迟检查，避免在BattleQueue动画序列执行期间提前触发
  useEffect(() => {
    if (unit?.isDefeated && !showDeathAnimation && !isReceivingDamage && !waitingForDeathAnimation && previousHpRef.current !== null) {
      // 🚨 延迟检查，给BattleQueue的动画序列一些时间来执行
      // 如果3秒后仍然没有死亡动画，则认为事件丢失，启动兜底机制
      const fallbackTimer = setTimeout(() => {
        // 再次检查状态，确保仍然需要兜底
        if (unit?.isDefeated && !showDeathAnimation) {
          console.log(`💀 ${unit.name} 已死亡但3秒内无死亡动画，启动兜底机制`);
          setShowDeathAnimation(true);
        }
      }, 3000); // 给足够时间让正常的动画序列完成

      return () => clearTimeout(fallbackTimer);
    }
  }, [unit?.isDefeated, showDeathAnimation, isReceivingDamage, waitingForDeathAnimation, unit?.name]);

  // 监听isAttacking状态变化
  useEffect(() => {
    console.log(`🎬 ${unit?.name || 'Unknown'} 攻击状态变化:`, {
      isAttacking,
      spriteAnimationClasses: isAttacking ? "attacker-move" : "",
      timestamp: Date.now()
    });
  }, [isAttacking, unit?.name]);

  // 监听ACTION_EXECUTED事件来触发攻击动画
  useEffect(() => {
    console.log(`🔧 ${unit?.name || 'Unknown'} 组件设置ACTION_EXECUTED监听器:`, {
      hasAdapter: !!adapter,
      hasEventBus: !!adapter?.eventBus,
      hasUnit: !!unit,
      unitId: unit?.id
    });
    
    if (!adapter?.eventBus || !unit?.id) return;

    // 🚨 防重复订阅：检查是否已经为同一个单位和事件总线订阅过
    const subscriptionState = currentSubscriptionsRef.current;
    if (subscriptionState.isSubscribed && 
        subscriptionState.eventBus === adapter.eventBus && 
        subscriptionState.unitId === unit.id) {
      console.log(`🚫 [${unit.name}] 已存在订阅，跳过重复订阅`);
      return;
    }

    // 如果之前有订阅但是事件总线或单位ID发生了变化，先清理旧订阅
    if (subscriptionState.isSubscribed) {
      console.log(`🧹 [${unit.name}] 清理旧订阅，准备重新订阅`);
      // 这里暂时不做处理，让useEffect的cleanup函数处理
    }
    
    const handleActionExecuted = (event) => {
      const { data } = event;
      console.log(`📡 ${unit.name} 收到ACTION_EXECUTED事件:`, {
        eventData: data,
        isMyUnit: data.unitId === unit.id,
        hasAction: !!data.action,
        actionStructure: {
          actionData: data.action,
          innerAction: data.action?.action,
          actionType: data.action?.action?.type || data.action?.type
        }
      });
      
      // 获取实际的行动数据（可能嵌套在data.action.action中）
      const actualAction = data.action?.action || data.action;
      
      console.log(`🔍 ${unit.name} 条件检查:`, {
        eventUnitId: data.unitId,
        myUnitId: unit.id,
        unitIdMatch: data.unitId === unit.id,
        actualAction,
        actionType: actualAction?.type,
        actionActionType: actualAction?.actionType,
        isAttack: actualAction?.type === 'attack' || actualAction?.actionType === 'attack'
      });
      
      // 检查是否是攻击行动
      if (actualAction && (actualAction.type === 'attack' || actualAction.actionType === 'attack')) {
        const targets = actualAction.targets || actualAction.targetIds || [];
        
        // 如果当前单位是攻击者
        if (data.unitId === unit.id) {
          // 创建事件唯一标识符
          const eventKey = `${data.unitId}_${data.timestamp || Date.now()}_${targets[0] || 'unknown'}`;
          
          // 检查是否是重复事件
          if (lastAttackEventRef.current === eventKey) {
            console.log(`🚫 ${unit.name} 检测到重复攻击事件，跳过:`, eventKey);
            return;
          }
          
          // 检查是否已经在攻击中
          if (isAttacking) {
            console.log(`🚫 ${unit.name} 已在攻击中，跳过重复动画`);
            return;
          }
          
          // 记录当前事件，防止重复
          lastAttackEventRef.current = eventKey;
          
          console.log(`⚔️ ${unit.name} 开始攻击动画:`, { eventKey, instanceId: componentInstanceId.current });
          
          if (targets.length > 0) {
            const targetId = targets[0];
            
            // 添加重试机制，处理React重新渲染导致的DOM暂时缺失
            const attemptAnimation = (retryCount = 0) => {
              // 添加组件状态检查，防止组件卸载后还执行动画
              if (!unit || !unit.id) {
                console.warn(`⚠️ 组件已卸载，跳过动画执行`);
                return;
              }
              
              // 🚨 检查战斗页面是否还存在
              const battlePage = document.querySelector('.battle-screen') || document.querySelector('[class*="battle"]');
              if (!battlePage) {
                console.warn(`⚠️ 战斗页面已消失，跳过动画执行:`, {
                  unitName: unit.name,
                  reason: 'battlePageNotFound'
                });
                return;
              }
              
              console.log(`🎬 尝试动画执行 (${retryCount + 1}):`, {
                attackerName: unit.name,
                attackerId: unit.id,
                targetId,
                componentMounted: !!unit,
                adaptorExists: !!adapter?.eventBus,
                timestamp: Date.now()
              });
              
              const targetElement = document.querySelector(`[data-unit-id="${targetId}"]`);
              const attackerElement = document.querySelector(`[data-unit-id="${unit.id}"]`);
              const allUnitsInDOM = Array.from(document.querySelectorAll('[data-unit-id]')).map(el => el.getAttribute('data-unit-id'));
              
              console.log(`🔍 DOM查找结果 (尝试${retryCount + 1}):`, {
                attackerId: unit.id,
                targetId,
                attackerFound: !!attackerElement,
                targetFound: !!targetElement,
                allUnitsInDOM,
                totalUnitsFound: allUnitsInDOM.length,
                attackerSelector: `[data-unit-id="${unit.id}"]`,
                targetSelector: `[data-unit-id="${targetId}"]`,
                documentReady: document.readyState,
                bodyChildrenCount: document.body.children.length,
                allDataUnitElements: Array.from(document.querySelectorAll('[data-unit-id]')).length,
                battlePageExists: !!document.querySelector('.battle-page'),
                battleFieldExists: !!document.querySelector('.battle-field')
              });
              
              // 如果页面上完全没有战斗单位，说明可能在重新渲染，稍后重试
              if (allUnitsInDOM.length === 0 && retryCount < 5) {
                console.warn(`⏳ 页面上没有战斗单位，${100 * (retryCount + 1)}ms后重试...`, {
                  retryCount: retryCount + 1,
                  maxRetries: 5,
                  nextRetryDelay: `${100 * (retryCount + 1)}ms`
                });
                setTimeout(() => attemptAnimation(retryCount + 1), 100 * (retryCount + 1));
                return;
              }
              
              // 如果找到了一些单位但目标单位不在，也重试几次
              if (allUnitsInDOM.length > 0 && (!targetElement || !attackerElement) && retryCount < 3) {
                console.warn(`⏳ 找到${allUnitsInDOM.length}个单位，但目标/攻击者缺失，${50 * (retryCount + 1)}ms后重试...`, {
                  foundUnits: allUnitsInDOM,
                  needAttacker: unit.id,
                  needTarget: targetId,
                  retryCount: retryCount + 1
                });
                setTimeout(() => attemptAnimation(retryCount + 1), 50 * (retryCount + 1));
                return;
              }
              
              if (targetElement && attackerElement) {
                const attackerRect = attackerElement.getBoundingClientRect();
                const targetRect = targetElement.getBoundingClientRect();
                
                // 计算两个单位的中心点位置
                const attackerCenterX = attackerRect.left + attackerRect.width / 2;
                const attackerCenterY = attackerRect.top + attackerRect.height / 2;
                const targetCenterX = targetRect.left + targetRect.width / 2;
                const targetCenterY = targetRect.top + targetRect.height / 2;
                
                // 计算攻击方向
                const moveX = targetCenterX - attackerCenterX;
                const moveY = targetCenterY - attackerCenterY;

                // 设置攻击移动CSS变量，增加冲击距离
                document.documentElement.style.setProperty("--move-x", `${moveX * 0.97}px`);
                document.documentElement.style.setProperty("--move-y", `${moveY * 0.97}px`);

                // 同时设置受击单位的退后方向（攻击方向的延续）
                const distance = Math.sqrt(moveX * moveX + moveY * moveY);
                const normalizedX = distance > 0 ? moveX / distance : 0;
                const normalizedY = distance > 0 ? moveY / distance : 0;
                
                document.documentElement.style.setProperty("--knockback-x", normalizedX.toString());
                document.documentElement.style.setProperty("--knockback-y", normalizedY.toString());

                                 console.log(`🎨 ${unit.name} 攻击计算:`, {
                   moveX: `${moveX * 0.97}px`,
                   moveY: `${moveY * 0.97}px`,
                   knockbackDirection: { x: normalizedX, y: normalizedY }
                 });

                // 触发攻击动画
                setIsAttacking(true);
                console.log(`✨ ${unit.name} 攻击动画状态设置为true`);

                // 使用RAF控制动画时机
                const attackStartTime = performance.now();
                const knockbackTime = ANIMATION_DURATIONS.KNOCKBACK_TRIGGER_TIME; // 使用配置的触发时间
                const attackDuration = ANIMATION_DURATIONS.ATTACK_MOVE; // 使用配置的攻击时长
                
                let knockbackTriggered = false;

                const animationFrame = (timestamp) => {
                  const elapsed = timestamp - attackStartTime;
                  
                  // 🚨 禁用攻击动画中的受击触发，改由BattleQueue双队列系统统一管理
                  // 这避免了双重触发问题：BattleQueue + 攻击动画都发送start_knockback
                  if (!knockbackTriggered && elapsed >= knockbackTime) {
                    knockbackTriggered = true;
                    console.log(`💥 攻击时机到达 ${targetId}，但受击动画由BattleQueue管理`);
                    
                    // 🔍 记录跳过的受击动画发送
                    console.log(`🚫 [${unit.name}] 跳过攻击动画中的受击事件发送，交由BattleQueue管理:`, {
                      eventName: 'start_knockback',
                      targetId: targetId,
                      attackerId: unit.id,
                      source: 'attack_animation_frame_skipped'
                    });
                    
                    // 🚨 完全禁用攻击动画发送受击事件，避免与BattleQueue双重触发
                    // if (adapter?.eventBus) {
                    //   adapter.eventBus.emit('start_knockback', {
                    //     targetId: targetId,
                    //     attackerId: unit.id,
                    //     timestamp: Date.now(),
                    //     damage: 0
                    //   });
                    // }
                  }
                  
                  // 攻击动画结束
                  if (elapsed >= attackDuration) {
                    setIsAttacking(false);
                    lastAttackEventRef.current = null;
                    console.log(`✅ ${unit.name} 攻击动画完成，通知AnimationManager`);
                    
                    // 通知AnimationManager攻击动画完成
                    if (adapter?.eventBus) {
                      const eventData = {
                        unitId: unit.id,
                        timestamp: Date.now()
                      };
                      console.log(`📤 [BattleUnitSprite] 发送攻击完成事件:`, {
                        eventName: ANIMATION_EVENTS.ATTACK_COMPLETE,
                        eventData,
                        unitName: unit.name
                      });
                      adapter.eventBus.emit(ANIMATION_EVENTS.ATTACK_COMPLETE, eventData);
                    }
                    return;
                  }
                  
                  requestAnimationFrame(animationFrame);
                };
                
                requestAnimationFrame(animationFrame);
              } else {
                console.error(`🚨 DOM元素未找到 (最终失败):`, {
                  attackerId: unit.id,
                  targetId,
                  attackerFound: !!attackerElement,
                  targetFound: !!targetElement,
                  allUnitsInDOM,
                  totalUnitsFound: allUnitsInDOM.length,
                  retryCount: retryCount,
                  timestamp: Date.now(),
                  possibleCause: allUnitsInDOM.length === 0 ? 'React重新渲染中' : '元素选择器不匹配'
                });
                
                // 🚨 增强的降级处理：即使DOM元素未找到，也要完成动画流程，避免状态卡住
                console.warn(`🎭 [${unit.name}] DOM查找失败，启用降级动画模式`);
                setIsAttacking(true);
                
                const fallbackStartTime = performance.now();
                const fallbackDuration = 800;
                
                const fallbackFrame = (timestamp) => {
                  if (timestamp - fallbackStartTime >= fallbackDuration) {
                    setIsAttacking(false);
                    lastAttackEventRef.current = null;
                    
                    // 发送攻击完成事件，保持流程完整
                    if (adapter?.eventBus) {
                      console.log(`📤 [BattleUnitSprite] 发送攻击完成事件(fallback):`, {
                        unitId: unit.id,
                        timestamp: Date.now()
                      });
                      adapter.eventBus.emit(ANIMATION_EVENTS.ATTACK_COMPLETE, {
                        unitId: unit.id,
                        timestamp: Date.now()
                      });
                    }
                    return;
                  }
                  requestAnimationFrame(fallbackFrame);
                };
                
                requestAnimationFrame(fallbackFrame);
              }
            };
            
            // 开始尝试动画，如果DOM未准备好会自动重试
            requestAnimationFrame(() => attemptAnimation());
          }
        }
        
        // 如果当前单位是受击目标
        if (targets.includes(unit.id)) {
          console.log(`🎯 ${unit.name} 是攻击目标，等待受击动画触发`);
        }
      }
    };
    
    // 监听受击动画触发事件
    const handleKnockback = (event) => {
      const { data } = event;
      if (data.targetId === unit.id) {
        // 🚨 防重复受击：创建事件标识符
        const knockbackEventKey = `${data.attackerId}_${data.targetId}_${data.timestamp || Date.now()}`;
        
        // 检查是否是重复事件（200ms内的相同事件视为重复）
        const now = Date.now();
        if (lastKnockbackEventRef.current && 
            lastKnockbackEventRef.current.key === knockbackEventKey) {
          console.warn(`🚫 [${unit.name}] 检测到重复受击事件，跳过:`, knockbackEventKey);
          return;
        }
        
        // 检查是否已经在受击动画中
        if (isReceivingDamage) {
          console.warn(`🚫 [${unit.name}] 已在受击动画中，跳过重复触发`);
          return;
        }
        
        // 记录当前事件
        lastKnockbackEventRef.current = {
          key: knockbackEventKey,
          timestamp: now
        };
        
        logHitAnimationEvent('trigger', {
          targetId: data.targetId,
          attackerId: data.attackerId,
          damage: data.damage,
          eventSource: 'handleKnockback',
          eventKey: knockbackEventKey
        });
        
        console.log(`💥 ${unit.name} 开始受击动画`);
        setIsReceivingDamage(true);
        
        // 🚨 在事件总线系统中处理伤害数字和防御特效
        const damage = data.damage || 0;
        if (damage > 0) {
          setDamageValue(damage);
          setDamageTimestamp(Date.now());
          setShowDamageNumber(true);
        }
        console.log(unit,"unit.isDefending");
        // 如果单位正在防御，显示防御特效
        if (unit.isDefending) {
          // 🚨 清理之前的防御特效引用
          if (defendEffectRef.current) {
            defendEffectRef.current.shouldClear = true;
          }
          
          // 🚨 创建新的防御特效引用
          const currentDefendEffect = {
            id: Date.now(),
            shouldClear: false
          };
          defendEffectRef.current = currentDefendEffect;
          
          setShowDefendEffect(true);
          console.log(`🛡️ ${unit.name} 开始防御特效 (ID: ${currentDefendEffect.id})`);
        }
        
        const knockbackStartTime = performance.now();
        const knockbackDuration = ANIMATION_DURATIONS.HIT_REACTION; // 使用配置的受击动画时长
        
        const knockbackFrame = (timestamp) => {
          if (timestamp - knockbackStartTime >= knockbackDuration) {
            setIsReceivingDamage(false);
            
            // 🚨 清理防御特效（使用函数式更新和引用检查）
            setShowDefendEffect(prevShow => {
              if (prevShow && defendEffectRef.current && !defendEffectRef.current.shouldClear) {
                console.log(`🛡️ ${unit.name} 防御特效随受击动画结束 (ID: ${defendEffectRef.current.id})`);
                defendEffectRef.current = null;
                return false;
              }
              return prevShow;
            });
            
            // 🚨 延迟清理伤害数字显示，让CSS动画完成
            setTimeout(() => {
              setShowDamageNumber(false);
              setDamageValue(0);
              setDamageTimestamp(0);
            }, 1200); // 等待CSS动画完成 (1.8s - 0.6s = 1.2s)
            
            // 🚨 清理受击事件引用
            lastKnockbackEventRef.current = null;
            
            console.log(`✅ ${unit.name} 受击动画完成，通知AnimationManager`);
            
            // 通知AnimationManager受击动画完成
            if (adapter?.eventBus) {
              const eventData = {
                unitId: unit.id,
                timestamp: Date.now(),
                damage: data.damage,
                isCrit: data.isCrit,
              };
              console.log(`📤 [BattleUnitSprite] 发送受击完成事件:`, {
                eventName: ANIMATION_EVENTS.HIT_COMPLETE,
                eventData,
                unitName: unit.name
              });
              adapter.eventBus.emit(ANIMATION_EVENTS.HIT_COMPLETE, eventData);
            }
            
            // 检查是否应该触发死亡动画
            if (waitingForDeathAnimation && !showDeathAnimation) {
              console.log(`💀 ${unit.name} 受击动画结束，开始死亡动画`);
              setShowDeathAnimation(true);
              setWaitingForDeathAnimation(false);
              
              // 设置死亡动画完成通知
              const deathStartTime = performance.now();
              const deathDuration = ANIMATION_DURATIONS.DEATH_ANIMATION;
              
              const deathFrame = (timestamp) => {
                if (timestamp - deathStartTime >= deathDuration) {
                  console.log(`✅ ${unit.name} 死亡动画完成，通知AnimationManager`);
                  
                  // 通知AnimationManager死亡动画完成
                  if (adapter?.eventBus) {
                    adapter.eventBus.emit(ANIMATION_EVENTS.DEATH_COMPLETE, {
                      unitId: unit.id,
                      timestamp: Date.now()
                    });
                  }
                  return;
                }
                requestAnimationFrame(deathFrame);
              };
              
              requestAnimationFrame(deathFrame);
            }
            return;
          }
          requestAnimationFrame(knockbackFrame);
        };
        
        requestAnimationFrame(knockbackFrame);
      }
    };
    
    // 监听死亡动画触发事件
    const handleUnitDeath = (event) => {
      const { data } = event;
      if (data.unitId === unit.id) {
        console.log(`💀 [BattleUnitSprite] ${unit.name} 收到死亡动画触发事件`);
        setShowDeathAnimation(true);
        setWaitingForDeathAnimation(false);
        
        // 设置死亡动画完成通知
        const deathStartTime = performance.now();
        const deathDuration = ANIMATION_DURATIONS.DEATH_ANIMATION;
        
        const deathFrame = (timestamp) => {
          if (timestamp - deathStartTime >= deathDuration) {
            console.log(`✅ ${unit.name} 死亡动画完成，通知AnimationManager`);
            
            // 通知AnimationManager死亡动画完成
            if (adapter?.eventBus) {
              const eventData = {
                unitId: unit.id,
                timestamp: Date.now()
              };
              console.log(`📤 [BattleUnitSprite] 发送死亡完成事件:`, {
                eventName: ANIMATION_EVENTS.DEATH_COMPLETE,
                eventData,
                unitName: unit.name
              });
              adapter.eventBus.emit(ANIMATION_EVENTS.DEATH_COMPLETE, eventData);
            }
            return;
          }
          requestAnimationFrame(deathFrame);
        };
        
        requestAnimationFrame(deathFrame);
      }
    };

    // 订阅事件
    const unsubscribeAction = adapter.eventBus.subscribe('action_executed', handleActionExecuted);
    
    // 🔍 记录受击动画订阅
    logHitAnimationEvent('subscription', {
      eventName: 'start_knockback',
      unitId: unit.id,
      unitName: unit.name,
      subscriptionSource: 'useEffect_adapter'
    });
    const unsubscribeKnockback = adapter.eventBus.subscribe('start_knockback', handleKnockback);
    
    const unsubscribeDeath = adapter.eventBus.subscribe('unit_death', handleUnitDeath);

    // 🚨 更新订阅状态
    currentSubscriptionsRef.current = {
      eventBus: adapter.eventBus,
      unitId: unit.id,
      isSubscribed: true
    };

    console.log(`✅ [${unit.name}] 事件订阅完成:`, {
      unitId: unit.id,
      eventBusExists: !!adapter.eventBus,
      subscriptionTimestamp: Date.now()
    });
    
    return () => {
      // 🔍 组件卸载时记录受击动画统计
      const counter = hitAnimationCounters.current;
      console.log(`📊 [${unit?.name}] 组件卸载，受击动画统计:`, {
        totalSubscriptions: counter.subscriptions,
        totalTriggers: counter.triggers,
        subscriptionTriggerRatio: counter.subscriptions > 0 ? (counter.triggers / counter.subscriptions).toFixed(2) : 'N/A',
        unitId: unit?.id
      });
      
      unsubscribeAction();
      unsubscribeKnockback();
      unsubscribeDeath();

      // 🚨 清理订阅状态
      currentSubscriptionsRef.current = {
        eventBus: null,
        unitId: null,
        isSubscribed: false
      };

      console.log(`🧹 [${unit?.name}] 事件订阅已清理`);
    };
  }, [adapter?.eventBus, unit?.id]); // 🚨 修复：只依赖稳定的标识符，避免重复订阅

  // 组件卸载时清理动画帧
  useEffect(() => {
    return () => {
      if (defendEffectAnimFrameRef.current) {
        cancelAnimationFrame(defendEffectAnimFrameRef.current);
      }
      // 🚨 清理防御特效引用
      if (defendEffectRef.current) {
        defendEffectRef.current.shouldClear = true;
        defendEffectRef.current = null;
      }
    };
  }, []);

  if (!unit) return null;

  const { name, stats, isPlayerUnit, isDefeated } = unit;
  const { currentHp, maxHp, currentMp, maxMp } = stats;
  
  // 调试日志：检查unitAction结构（放在isPlayerUnit定义之后）
  useEffect(() => {
    if (unitAction && !isPlayerUnit) {
      console.log(`🎯 ${unit?.name} 意图图标数据:`, {
        unitAction,
        type: unitAction.type,
        actionType: unitAction.actionType,
        nestedAction: unitAction.action,
        nestedType: unitAction.action?.type,
        nestedActionType: unitAction.action?.actionType
      });
    }
  }, [unitAction, isPlayerUnit, unit?.name]);
  
  // 组件卸载时清理动画帧
  useEffect(() => {
    return () => {
      if (defendEffectAnimFrameRef.current) {
        cancelAnimationFrame(defendEffectAnimFrameRef.current);
      }
    };
  }, []);

  const handleUnitClick = () => {
    // 🚨 修复严重BUG：死亡单位不能被点击选择
    if (onClick && !showDeathAnimation && !unit.isDefeated) {
      console.log(`🎯 单位点击:`, {
        unitName: unit.name,
        isDefeated: unit.isDefeated,
        showDeathAnimation,
        canClick: !unit.isDefeated && !showDeathAnimation
      });
      onClick(unit.id);
    } else if (unit.isDefeated) {
      console.warn(`⚠️ ${unit.name} 已死亡，无法选择为目标`);
    }
  };

  // 在等待死亡动画时，使用上一次的HP值来避免血条立即变为0
  const displayHp = waitingForDeathAnimation ? (previousHpRef.current || currentHp) : currentHp;
  const hpPercent = (displayHp / maxHp) * 100;
  const mpPercent = (currentMp / maxMp) * 100;
  
  let hpBarColor = "#00ff66"; // 更亮的绿色代表高HP
  if (hpPercent < 30) {
    hpBarColor = "#ff3333"; // 更亮的红色代表低HP
  } else if (hpPercent < 60) {
    hpBarColor = "#ffaa00"; // 更亮的橙色代表中等HP
  }
  
  const mpBarColor = "#0099ff"; // 更亮的蓝色代表MP

  // 单位基础样式
  const unitBaseClasses =
    "w-[80px] h-[100px] flex flex-col items-center justify-start z-10 transition-transform duration-200 m-auto";
  // 🚨 修复：死亡单位不显示悬停效果，不可点击
  const unitHoverClasses = (!unit.isDefeated && !showDeathAnimation) ? "hover:scale-110 hover:cursor-pointer" : "cursor-not-allowed";
  // 使用延迟的死亡动画状态而不是直接使用isDefeated
  const unitStateClasses = (showDeathAnimation || unit.isDefeated) ? "" : "";
  
  // 精灵图状态类
  const spriteAnimationClasses = `
    ${isAttacking ? "attacker-move" : ""}
    ${isReceivingDamage ? "receiving-damage" : ""}
  `.trim();
  
  // 精灵图容器样式 - 移除阴影
  const spriteContainerClasses =
    "w-[120px] h-[120px] flex flex-col items-center justify-center relative mb-1";
  // 使用延迟的死亡动画状态而不是直接使用isDefeated
  const spriteStateClasses = showDeathAnimation ? "" : "";
  
  return (
    <div 
      className={`${unitBaseClasses} ${unitHoverClasses} ${unitStateClasses}`}
      onClick={handleUnitClick}
      style={{ zIndex: 10 }}
      data-unit-id={unit.id}
      data-debug-unit-name={unit.name}
    >

      <div
        className={`${spriteContainerClasses} ${spriteStateClasses} sprite-container ${spriteAnimationClasses}`}

      >
        {/* 根据spriteAssetKey加载精灵图，如果没有则使用默认图 - 注意友方单位需要翻转 */}
        <div className="relative w-full h-full flex items-center justify-center transform-gpu">
          <img 
            src={
              unit.spriteAssetKey &&
              images[`/src/assets/summons/${unit.id}.png`]?.default
                ? images[`/src/assets/summons/${unit.id}.png`]
                    .default
                : images["/src/assets/summons/default.png"].default
            }
            alt={name}
            className={`w-[120px] h-[120px] object-contain ${
              showDeathAnimation ? "grayscale opacity-50" : ""
            } sprite-image`}
            style={{ 
              // 使用CSS变量控制精灵方向，便于动画使用
              "--sprite-direction": isPlayerUnit ? "-1" : "1",
              transformStyle: "preserve-3d",
              // 移除阴影效果
              imageRendering: "pixelated",
              backfaceVisibility: "hidden",
            }}
            onError={(e) => {
              // 如果指定的精灵图加载失败，使用默认图
              e.target.src = images["/src/assets/summons/default.png"].default;
            }}
          />
          {/* 阴影元素已移除 */}
        </div>
        
        {/* 攻击特效 - 增强版本 */}
        {isReceivingDamage && (
          <div className="attack-effect-container">
            <div className="attack-effect"></div>
          </div>
        )}
        
        {/* 防御特效 */}
        {showDefendEffect && (
          <div className="defend-effect-container">
            <div className="defend-effect"></div>
          </div>
        )}
        
        {/* 伤害数字 */}
        {showDamageNumber && damageValue > 0 && (
          <div className="damage-number-container" key={`damage-${unit.id}-${damageTimestamp}`}>
            <div className={`damage-number ${isCritical ? "critical" : ""}`}>
              {isCritical && <div className="critical-text">暴击！</div>}
              <div className="damage-value">{damageValue}</div>
            </div>
          </div>
        )}
        
        {showDeathAnimation && (
          <div className="absolute w-full h-full z-10 flex items-center justify-center">
            <div className="relative w-[60px] h-[60px]">
              <div className="absolute top-1/2 left-1/2 w-full h-[3px] bg-red-500 transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
              <div className="absolute top-1/2 left-1/2 w-full h-[3px] bg-red-500 transform -translate-x-1/2 -translate-y-1/2 -rotate-45"></div>
            </div>
          </div>
        )}
        {/* 准备状态标记 - 只有玩家单位显示准备完成标记 */}
        {!showDeathAnimation &&
          hasAction &&
          currentPhase === "preparation" &&
          isPlayerUnit && (
          <div className="absolute top-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-md z-20">
            <span className="text-white text-[10px] font-bold">✓</span>
          </div>
        )}
        
        {/* 行动意图图标 - 只有敌方单位显示意图图标 */}
        {!showDeathAnimation && !unit.isDefeated && unitAction && !isPlayerUnit && (
          <div className="absolute -top-0 right-0 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg animate-pulse z-20">
            {(unitAction.type === "attack" ||
              unitAction.actionType === "attack" ||
              unitAction.action?.type === "attack" ||
              unitAction.action?.actionType === "attack" ||
              unitAction.action?.action?.type === "attack") && (
              <div className="w-full h-full bg-red-600 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            )}
            {(unitAction.type === "defend" ||
              unitAction.actionType === "defend" ||
              unitAction.action?.type === "defend" ||
              unitAction.action?.actionType === "defend" ||
              unitAction.action?.action?.type === "defend") && (
              <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
            )}
            {(unitAction.type === "skill" ||
              unitAction.actionType === "skill" ||
              unitAction.action?.type === "skill" ||
              unitAction.action?.actionType === "skill" ||
              unitAction.action?.action?.type === "skill") && (
              <div className="w-full h-full bg-purple-600 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 单位名称 */}
      <div className="text-center w-full mb-1">
        <span className={`text-xs font-bold text-white drop-shadow-md ${
          showDeathAnimation ? "opacity-60" : ""
        }`}>
          {name}
        </span>
      </div>

      {/* HP血条 */}
      <div className={`w-[70px] h-[12px] bg-gray-800 rounded-full border-2 border-gray-300 relative shadow-lg ${
        showDeathAnimation ? "opacity-60 grayscale" : ""
      }`}>
        <div
          className="h-[4px] rounded-full transition-all duration-300 relative  shadow-inner"
          style={{ 
            width: `${Math.max(0, (hpPercent * 66) / 100)}px`,
            backgroundColor: hpBarColor,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-[9px] text-white font-bold drop-shadow-lg ${
            showDeathAnimation ? "opacity-60" : ""
          }`} style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
          </span>
        </div>
      </div>
            
      {/* MP魔法条 */}
      <div className={`w-[70px] h-[8px] bg-gray-800 rounded-full border border-gray-300 relative mt-1 shadow-md ${
        showDeathAnimation ? "opacity-60 grayscale" : ""
      }`}>
        <div
          className="h-[4px] rounded-full transition-all duration-300 relative  shadow-inner"
          style={{
            width: `${Math.max(0, (mpPercent * 68) / 100)}px`,
            backgroundColor: mpBarColor,
            boxShadow: `inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)`
          }}
        />
      </div>
    </div>
  );
};

// 使用React.memo包装组件，避免不必要的重新渲染
export default memo(BattleUnitSprite);
