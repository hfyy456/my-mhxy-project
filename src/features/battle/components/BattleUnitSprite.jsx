import React, { useState, useEffect, useRef, memo } from "react";
import { getBuffById } from "@/config/skill/buffConfig";
import { useBattleAdapter } from '../context/BattleAdapterContext.jsx';
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
  // 组件实例标识
  const componentInstanceId = useRef(Math.random().toString(36).substr(2, 9));
  
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
  
  // 监听HP变化和死亡状态来触发受击动画
  useEffect(() => {
    if (!unit?.stats) return;

    const currentHp = unit.stats.currentHp;
    const isCurrentlyDefeated = unit.isDefeated;
    
    // 如果HP比之前低，说明受到了伤害（包括致命伤害）
    if (previousHpRef.current !== null && currentHp < previousHpRef.current) {
      const damage = previousHpRef.current - currentHp;
      const isDying = currentHp === 0 && previousHpRef.current > 0;
      
      console.log(`🩸 ${unit.name} HP变化触发受击动画:`, {
        previousHp: previousHpRef.current,
        currentHp,
        damage,
        isDying,
        isDefeated: isCurrentlyDefeated
      });
      
      // 即使单位死亡也要播放受击动画
      setIsReceivingDamage(true);
      setDamageValue(damage);
      setShowDamageNumber(true);
      
      // 如果单位正在防御，显示防御特效
      if (unit.isDefending) {
        setShowDefendEffect(true);
      }
      
      // 如果是致命伤害，设置更长的动画时间，让玩家看清楚
      const animStartTime = performance.now();
      const duration = isDying ? 1200 : 800; // 死亡动画稍长一些
      
      const resetDamageAnimation = (timestamp) => {
        const elapsed = timestamp - animStartTime;
        if (elapsed >= duration) {
          setIsReceivingDamage(false);
          if (showDefendEffect) clearDefendEffect();
          
          // 记录致命伤害，等待受击动画完成
          if (isDying) {
            console.log(`💀 ${unit.name} 致命伤害，标记等待死亡动画`);
            setWaitingForDeathAnimation(true);
          }
          return;
        }
        requestAnimationFrame(resetDamageAnimation);
      };
      
      requestAnimationFrame(resetDamageAnimation);
    }
    
    // 更新上一次的HP值
    previousHpRef.current = currentHp;
  }, [unit?.stats?.currentHp, unit?.isDefeated, unit?.isDefending, showDefendEffect]);

  // 监听单位死亡状态，但只在没有受击动画且没有等待死亡动画时才立即显示
  useEffect(() => {
    if (unit?.isDefeated && !showDeathAnimation && !isReceivingDamage && !waitingForDeathAnimation && previousHpRef.current !== null) {
      // 只有在没有等待受击动画完成的情况下才立即显示死亡动画
      console.log(`💀 ${unit.name} 已死亡且无受击动画，立即显示死亡动画`);
      setShowDeathAnimation(true);
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
    
    if (!adapter?.eventBus || !unit) return;
    
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
            
            // 延迟一点执行，确保DOM已更新
            requestAnimationFrame(() => {
              const targetElement = document.querySelector(`[data-unit-id="${targetId}"]`);
              const attackerElement = document.querySelector(`[data-unit-id="${unit.id}"]`);
              
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
                const knockbackTime = 800; // 40%时触发受击
                const attackDuration = 1000; // 总攻击时长
                
                let knockbackTriggered = false;

                const animationFrame = (timestamp) => {
                  const elapsed = timestamp - attackStartTime;
                  
                  // 在40%时触发受击动画
                  if (!knockbackTriggered && elapsed >= knockbackTime) {
                    knockbackTriggered = true;
                    console.log(`💥 触发 ${targetId} 的受击动画`);
                    if (adapter?.eventBus) {
                      adapter.eventBus.emit('start_knockback', {
                        targetId: targetId,
                        attackerId: unit.id,
                        timestamp: Date.now()
                      });
                    }
                  }
                  
                  // 攻击动画结束
                  if (elapsed >= attackDuration) {
                    setIsAttacking(false);
                    lastAttackEventRef.current = null;
                    console.log(`🔄 ${unit.name} 攻击动画结束`);
                    return;
                  }
                  
                  requestAnimationFrame(animationFrame);
                };
                
                requestAnimationFrame(animationFrame);
              } else {
                console.error(`DOM元素未找到 - 攻击者: ${!!attackerElement}, 目标: ${!!targetElement}`);
                setIsAttacking(true);
                
                const fallbackStartTime = performance.now();
                const fallbackDuration = 800;
                
                const fallbackFrame = (timestamp) => {
                  if (timestamp - fallbackStartTime >= fallbackDuration) {
                    setIsAttacking(false);
                    lastAttackEventRef.current = null;
                    return;
                  }
                  requestAnimationFrame(fallbackFrame);
                };
                
                requestAnimationFrame(fallbackFrame);
              }
            });
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
        console.log(`💥 ${unit.name} 开始受击动画`);
        setIsReceivingDamage(true);
        
        const knockbackStartTime = performance.now();
        const knockbackDuration = 1200; // 延长受击动画到1.2秒
        
        const knockbackFrame = (timestamp) => {
          if (timestamp - knockbackStartTime >= knockbackDuration) {
            setIsReceivingDamage(false);
            console.log(`🔄 ${unit.name} 受击动画结束`);
            
            // 检查是否应该触发死亡动画
            if (waitingForDeathAnimation && !showDeathAnimation) {
              console.log(`💀 ${unit.name} 受击动画结束，开始死亡动画`);
              setShowDeathAnimation(true);
              setWaitingForDeathAnimation(false);
            }
            return;
          }
          requestAnimationFrame(knockbackFrame);
        };
        
        requestAnimationFrame(knockbackFrame);
      }
    };
    
    // 订阅事件
    const unsubscribeAction = adapter.eventBus.subscribe('action_executed', handleActionExecuted);
    const unsubscribeKnockback = adapter.eventBus.subscribe('start_knockback', handleKnockback);
    
    return () => {
      unsubscribeAction();
      unsubscribeKnockback();
    };
  }, [adapter, unit, isAttacking]);



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
    if (onClick && !showDeathAnimation) {
      onClick(unit.id);
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
  const unitHoverClasses = "hover:scale-110 hover:cursor-pointer";
  // 使用延迟的死亡动画状态而不是直接使用isDefeated
  const unitStateClasses = showDeathAnimation ? "opacity-60" : "";
  
  // 精灵图状态类
  const spriteAnimationClasses = `
    ${isAttacking ? "attacker-move" : ""}
    ${isReceivingDamage ? "receiving-damage" : ""}
  `.trim();
  
  // 精灵图容器样式 - 移除阴影
  const spriteContainerClasses =
    "w-[120px] h-[120px] flex flex-col items-center justify-center relative mb-1";
  // 使用延迟的死亡动画状态而不是直接使用isDefeated
  const spriteStateClasses = showDeathAnimation ? "opacity-60" : "";
  
  return (
    <div 
      className={`${unitBaseClasses} ${unitHoverClasses} ${unitStateClasses}`}
      onClick={handleUnitClick}
      style={{ zIndex: 10 }}
      data-unit-id={unit.id}
    >

      <div
        className={`${spriteContainerClasses} ${spriteStateClasses} sprite-container ${spriteAnimationClasses}`}

      >
        {/* 根据spriteAssetKey加载精灵图，如果没有则使用默认图 - 注意友方单位需要翻转 */}
        <div className="relative w-full h-full flex items-center justify-center transform-gpu">
          <img 
            src={
              unit.spriteAssetKey &&
              images[`/src/assets/summons/${unit.spriteAssetKey}.png`]?.default
                ? images[`/src/assets/summons/${unit.spriteAssetKey}.png`]
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
            <div className="defend-effect">
              <i className="fas fa-shield-alt"></i>
            </div>
          </div>
        )}
        
        {/* 伤害数字 */}
        {showDamageNumber && damageValue > 0 && (
          <div className="damage-number-container">
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
        {!showDeathAnimation && unitAction && !isPlayerUnit && (
          <div className="absolute -top-0 right-0 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg animate-pulse z-20">
            {(unitAction.type === "attack" ||
              unitAction.actionType === "attack" ||
              unitAction.action?.type === "attack" ||
              unitAction.action?.actionType === "attack") && (
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
              unitAction.action?.actionType === "defend") && (
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
              unitAction.action?.actionType === "skill") && (
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
