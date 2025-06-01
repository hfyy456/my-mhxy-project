import React, { useState, useEffect, useRef, memo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentPhase, selectUnitActions } from '@/store/slices/battleSlice';
import { getBuffById } from '@/config/skill/buffConfig';
import './BattleUnitSprite.css';

// 动态导入所有精灵图
const images = import.meta.glob('@/assets/summons/*.png', { eager: true });

const BattleUnitSprite = ({ unit, onClick, hasAction = false }) => {
  // 状态用于控制攻击动画
  const [isAttacking, setIsAttacking] = useState(false);
  const [isReceivingDamage, setIsReceivingDamage] = useState(false);
  const [showDefendEffect, setShowDefendEffect] = useState(false);
  // 添加伤害数字显示状态
  const [showDamageNumber, setShowDamageNumber] = useState(false);
  const [damageValue, setDamageValue] = useState(0);
  const [isCritical, setIsCritical] = useState(false);
  
  // 获取当前战斗阶段和单位行动
  const currentPhase = useSelector(selectCurrentPhase);
  const allUnitActions = useSelector(selectUnitActions);
  const battleLog = useSelector(state => state.battle.battleLog);
  
  // 直接从所有行动中获取当前单位的行动
  const unitAction = unit ? allUnitActions[unit.id] : null;
  
  // 使用useRef跟踪已处理的日志ID，避免重复触发动画
  const lastProcessedLogRef = useRef(null);
  
  // 仅在开发环境下保留调试信息
  // useEffect(() => {
  //   if (unit && !unit.isPlayerUnit) {
  //     console.log(`敌方单位 ${unit.name} (ID: ${unit.id}) 的行动:`, unitAction);
  //     console.log(`所有单位行动:`, allUnitActions);
  //     console.log(`当前阶段:`, currentPhase);
  //     console.log(`是否已准备:`, hasAction);
  //     console.log(`是否显示意图图标:`, !unit.isDefeated && unitAction && !unit.isPlayerUnit);
  //   }
  // }, [unit, unitAction, allUnitActions, currentPhase, hasAction]);
  
  // 使用全局变量跟踪动画状态
  const attackAnimInProgressRef = useRef(false); // 单独跟踪攻击动画状态
  const hitAnimInProgressRef = useRef(false);   // 单独跟踪受击动画状态
  const isAnimationInProgressRef = useRef(false); // 总体动画状态标记
  const processedLogsRef = useRef(new Set());
  const latestDamageRef = useRef(null); // Stores the most recent damage amount for the floater
  const latestCritFlagRef = useRef(false); // Stores if the most recent hit was a crit
  const defendEffectAnimFrameRef = useRef(null);
  
  // 限制缓存大小，防止内存泄漏
  useEffect(() => {
    // 组件挂载时重置状态
    processedLogsRef.current.clear();
    isAnimationInProgressRef.current = false;
    attackAnimInProgressRef.current = false;
    hitAnimInProgressRef.current = false;
    
    return () => {
      // 组件卸载时清理
      processedLogsRef.current.clear();
      isAnimationInProgressRef.current = false;
      attackAnimInProgressRef.current = false;
      hitAnimInProgressRef.current = false;
        
      // 清理防御特效的动画帧
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
      defendEffectAnimFrameRef.current = requestAnimationFrame(hideDefendEffect);
    };
    
    defendEffectAnimFrameRef.current = requestAnimationFrame(hideDefendEffect);
  };
  
  // 监听战斗日志变化，触发攻击或受击动画
  useEffect(() => {
    if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_INPUTS - battleLogLen: ${battleLog.length}, isAnimInProgress: ${isAnimationInProgressRef.current}, processedLogs:`, Array.from(processedLogsRef.current));
    if (!unit || !battleLog.length) return;

    // 先创建变量，然后再检查动画状态

    let logToAnimate = null;
    let animationRole = null; // 'attacker' or 'receiver'
    let uniqueLogIdForProcessing = null;

    // 从后向前遍历战斗日志，查找最近的、未处理的、与攻击相关的日志
    if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_SEARCH_START - Searching for animatable log.`);
    for (let i = battleLog.length - 1; i >= 0; i--) {
      const currentLog = battleLog[i];

      if (!currentLog || (!currentLog.id && !currentLog.timestamp) || !currentLog.message) {
        if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_SEARCH_SKIP_INVALID_LOG - Index: ${i}, Log:`, currentLog);
        continue;
      }
      
      // 动画只由包含“攻击”的日志触发
      if (!currentLog.message.includes('攻击')) {
        if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_SEARCH_SKIP_NO_ATTACK_KEYWORD - Index: ${i}, Log:`, JSON.parse(JSON.stringify(currentLog)));
        continue;
      }

      const timestamp = currentLog.timestamp || Date.now(); // Ensure timestamp for ID generation
      const baseLogIdentifier = `${currentLog.unitId || 'unknownUnit'}-${currentLog.targetId || 'unknownTarget'}-${timestamp}`;

      // 检查当前单位是否是此日志中的攻击者
      if (currentLog.unitId === unit.id && currentLog.targetId) {
        const potentialLogId = `attack-${baseLogIdentifier}`;
        if (!processedLogsRef.current.has(potentialLogId)) {
          if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_SEARCH_FOUND_ATTACKER - Index: ${i}, Log:`, JSON.parse(JSON.stringify(currentLog)), `ID: ${potentialLogId}`);
          logToAnimate = currentLog;
          animationRole = 'attacker';
          uniqueLogIdForProcessing = potentialLogId;
          break; 
        }
        if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_SEARCH_ATTACKER_PROCESSED - Index: ${i}, ID: ${potentialLogId}`);
      }

      // 检查当前单位是否是此日志中的受击者
      if (currentLog.targetId === unit.id && currentLog.unitId) {
        const potentialLogId = `hit-${baseLogIdentifier}`;
        // 如果这条日志已经被当前单位作为攻击者选中了，就不要再作为受击者重复处理
        if (logToAnimate === currentLog && animationRole === 'attacker' && unit.id === currentLog.unitId) {
            if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_SEARCH_RECEIVER_SKIP_SELF_ATTACK_PROCESSED - Index: ${i}, ID: ${potentialLogId}`);
            continue;
        }
        if (!processedLogsRef.current.has(potentialLogId)) {
          if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_SEARCH_FOUND_RECEIVER - Index: ${i}, Log:`, JSON.parse(JSON.stringify(currentLog)), `ID: ${potentialLogId}`);
          logToAnimate = currentLog;
          animationRole = 'receiver';
          uniqueLogIdForProcessing = potentialLogId;
          break; 
        }
        if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_SEARCH_RECEIVER_PROCESSED - Index: ${i}, ID: ${potentialLogId}`);
      }
    }

    if (!logToAnimate || !animationRole || !uniqueLogIdForProcessing) {
      if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_NO_ANIMATABLE_LOG_FOUND`);
      return;
    }
    
    // 检查动画状态，允许不同类型的动画并行运行
    // 如果是攻击者角色但已经有攻击动画在运行，则跳过
    // 如果是受击者角色但已经有受击动画在运行，则跳过
    if ((animationRole === 'attacker' && attackAnimInProgressRef.current) || 
        (animationRole === 'receiver' && hitAnimInProgressRef.current)) {
      if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_SKIP - ${animationRole} animation already in progress.`);
      return;
    }

    if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_WILL_ANIMATE - Role: ${animationRole}, Log:`, JSON.parse(JSON.stringify(logToAnimate)), `ProcessedID: ${uniqueLogIdForProcessing}`);
    
    // 根据动画角色设置相应的动画状态
    if (animationRole === 'attacker') {
      attackAnimInProgressRef.current = true;
    } else if (animationRole === 'receiver') {
      hitAnimInProgressRef.current = true;
    }
    
    isAnimationInProgressRef.current = true;
    processedLogsRef.current.add(uniqueLogIdForProcessing);

    if (animationRole === 'attacker') {
      const targetElement = document.querySelector(`[data-unit-id="${logToAnimate.targetId}"]`);
      if (targetElement) {
        const attackerElement = document.querySelector(`[data-unit-id="${unit.id}"]`);
        if (attackerElement) {
          const attackerRect = attackerElement.getBoundingClientRect();
          const targetRect = targetElement.getBoundingClientRect();
          let moveX = targetRect.left - attackerRect.left;
          const moveY = targetRect.top - attackerRect.top;
          const isTargetOnRight = moveX > 0;

          if (unit.isPlayerUnit) {
            document.documentElement.style.setProperty('--move-direction', isTargetOnRight ? '1' : '-1');
          } else {
            document.documentElement.style.setProperty('--move-direction', isTargetOnRight ? '-1' : '1');
          }
          document.documentElement.style.setProperty('--move-x', `${moveX}px`);
          document.documentElement.style.setProperty('--move-y', `${moveY}px`);

          setIsAttacking(true);
          const startTime = performance.now();
          const duration = 800; 
          const resetAttackAnimation = (timestamp) => {
            const elapsed = timestamp - startTime;
            if (elapsed >= duration) {
              setIsAttacking(false);
              attackAnimInProgressRef.current = false;
              isAnimationInProgressRef.current = attackAnimInProgressRef.current || hitAnimInProgressRef.current;
              if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_ATTACK_END - isAnimInProgress: ${isAnimationInProgressRef.current}`);
              return;
            }
            requestAnimationFrame(resetAttackAnimation);
          };
          requestAnimationFrame(resetAttackAnimation);
        } else {
          attackAnimInProgressRef.current = false;
          isAnimationInProgressRef.current = attackAnimInProgressRef.current || hitAnimInProgressRef.current; // Attacker element not found
          if (unit) console.error(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_ERROR_ATTACKER_ELEMENT_NOT_FOUND`);
        }
      } else {
        attackAnimInProgressRef.current = false;
        isAnimationInProgressRef.current = attackAnimInProgressRef.current || hitAnimInProgressRef.current; // Target element not found
        if (unit) console.error(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_ERROR_TARGET_ELEMENT_NOT_FOUND_FOR_ATTACK - TargetID: ${logToAnimate.targetId}`);
      }
    } else if (animationRole === 'receiver') {
      // Parse damage and critical hit status from the log message
      const damageRegex = /造成了? (\d+) 点伤害/;
      const damageMatch = logToAnimate.message.match(damageRegex);
      if (damageMatch && damageMatch[1]) {
        latestDamageRef.current = parseInt(damageMatch[1], 10);
        // 设置伤害值到状态
        setDamageValue(parseInt(damageMatch[1], 10));
      } else {
        latestDamageRef.current = 0; // Default to 0 if no damage found in log
        setDamageValue(0);
      }
      
      // Check for critical hit (assuming "暴击" indicates a critical hit)
      if (logToAnimate.message.includes('暴击')) {
        latestCritFlagRef.current = true;
        setIsCritical(true);
      } else {
        latestCritFlagRef.current = false;
        setIsCritical(false);
      }
      if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_RECEIVER_DAMAGE_PARSED - Damage: ${latestDamageRef.current}, Crit: ${latestCritFlagRef.current}, Log:`, JSON.parse(JSON.stringify(logToAnimate)));

      // For receiver, we might want a slight delay if the attacker is also animating
      // This part can be refined based on desired animation timing
      const startWaitTime = performance.now();
      const waitDuration = 100; // Short delay to allow attacker animation to potentially start

      const startDamageAnimation = (timestamp) => {
        const elapsedSinceWaitStart = timestamp - startWaitTime;
        if (elapsedSinceWaitStart < waitDuration) {
          requestAnimationFrame(startDamageAnimation);
          return;
        }

        setIsReceivingDamage(true);
        // 显示伤害数字
        if (latestDamageRef.current > 0) {
          setShowDamageNumber(true);
          if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_SHOW_DAMAGE_NUMBER - Value: ${latestDamageRef.current}, Crit: ${latestCritFlagRef.current}`);
        }
        
        if (unit.isDefending) { // Check unit's current defending state
            setShowDefendEffect(true);
            if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_SHOW_DEFEND_EFFECT`);
        }

        const animStartTime = performance.now();
        const duration = 800;
        const resetDamageAnimation = (ts) => {
          const elapsed = ts - animStartTime;
          if (elapsed >= duration) {
            setIsReceivingDamage(false);
            // 延迟隐藏伤害数字，让它完成动画
          //   setTimeout(() => {
          // setShowDamageNumber(false);
          //   }, 500);
            hitAnimInProgressRef.current = false;
            isAnimationInProgressRef.current = attackAnimInProgressRef.current || hitAnimInProgressRef.current;
            if (showDefendEffect) clearDefendEffect(); // Clear defend effect if it was shown
            if (unit) console.log(`[BattleUnitSprite ${unit.name}(${unit.id})] ANIM_EFFECT_HIT_END - isAnimInProgress: ${isAnimationInProgressRef.current}`);
            return;
          }
          requestAnimationFrame(resetDamageAnimation);
        };
        requestAnimationFrame(resetDamageAnimation);
      };
      requestAnimationFrame(startDamageAnimation);
    }
  }, [battleLog, unit]); // Removed isAnimationInProgressRef from dependencies as it's a ref

  if (!unit) return null;

  const { name, stats, isPlayerUnit, isDefeated } = unit;
  const { currentHp, maxHp, currentMp, maxMp } = stats;
  
  // 组件卸载时清理动画帧
  useEffect(() => {
    return () => {
      if (defendEffectAnimFrameRef.current) {
        cancelAnimationFrame(defendEffectAnimFrameRef.current);
      }
    };
  }, []);

  const handleUnitClick = () => {
    if (onClick && !isDefeated) {
      onClick(unit.id);
    }
  };

  const hpPercent = currentHp / maxHp * 100;
  const mpPercent = currentMp / maxMp * 100;
  
  let hpBarColor = '#2ecc71'; // 绿色代表高HP
  if (hpPercent < 30) {
    hpBarColor = '#e74c3c'; // 红色代表低HP
  } else if (hpPercent < 60) {
    hpBarColor = '#f39c12'; // 橙色代表中等HP
  }
  
  const mpBarColor = '#3498db'; // 蓝色代表MP

  // 单位基础样式
  const unitBaseClasses = "w-[80px] h-[100px] flex flex-col items-center justify-start z-10 transition-transform duration-200 m-auto";
  const unitHoverClasses = "hover:scale-110 hover:cursor-pointer";
  const unitStateClasses = isDefeated ? "opacity-60" : "";
  
  // 精灵图状态类
  const spriteAnimationClasses = `
    ${isAttacking ? 'attacker-move' : ''}
    ${isReceivingDamage ? 'receiving-damage' : ''}
    ${unit.isDefending || showDefendEffect ? 'defending' : ''}
  `;
  
  // 设置较高的z-index，确保精灵图显示在格子上方
  const unitZIndexStyle = { zIndex: 50 };
  
  // 精灵图容器样式 - 移除阴影
  const spriteContainerClasses = "w-[120px] h-[120px] flex flex-col items-center justify-center relative mb-1";
  const spriteStateClasses = isDefeated ? "opacity-60" : "";
  
  return (
    <div 
      className={`${unitBaseClasses} ${unitHoverClasses} ${unitStateClasses}`}
      onClick={handleUnitClick}
      style={unitZIndexStyle}
      data-unit-id={unit.id}
    >
      <div className={`${spriteContainerClasses} ${spriteStateClasses} sprite-container ${spriteAnimationClasses}`}>
        {/* 根据spriteAssetKey加载精灵图，如果没有则使用默认图 - 注意友方单位需要翻转 */}
        <div className="relative w-full h-full flex items-center justify-center transform-gpu">
          <img 
            src={unit.spriteAssetKey && images[`/src/assets/summons/${unit.spriteAssetKey}.png`]?.default ? 
                 images[`/src/assets/summons/${unit.spriteAssetKey}.png`].default : 
                 images['/src/assets/summons/default.png'].default} 
            alt={name}
            className={`w-[120px] h-[120px] object-contain ${isDefeated ? 'grayscale opacity-50' : ''} sprite-image`}
            style={{ 
              // 使用CSS变量控制精灵方向，便于动画使用
              '--sprite-direction': isPlayerUnit ? '-1' : '1',
              transformStyle: 'preserve-3d',
              // 移除阴影效果
              imageRendering: 'pixelated',
              backfaceVisibility: 'hidden'
            }}
            onError={(e) => {
              // 如果指定的精灵图加载失败，使用默认图
              e.target.src = images['/src/assets/summons/default.png'].default;
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
            <div className={`damage-number ${isCritical ? 'critical' : ''}`}>
              {isCritical ? '暴击！' : ''} {damageValue}
            </div>
          </div>
        )}
        
        {isDefeated && (
          <div className="absolute w-full h-full z-10 flex items-center justify-center">
            <div className="relative w-[60px] h-[60px]">
              <div className="absolute top-1/2 left-1/2 w-full h-[3px] bg-red-500 transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
              <div className="absolute top-1/2 left-1/2 w-full h-[3px] bg-red-500 transform -translate-x-1/2 -translate-y-1/2 -rotate-45"></div>
            </div>
          </div>
        )}
        
        {/* 准备状态标记 - 只有玩家单位显示准备完成标记 */}
        {!isDefeated && hasAction && currentPhase === 'preparation' && isPlayerUnit && (
          <div className="absolute top-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-md z-20">
            <span className="text-white text-[10px] font-bold">✓</span>
          </div>
        )}
        
        {/* 行动意图图标 - 只有敌方单位显示意图图标 */}
        {!isDefeated && unitAction && !isPlayerUnit && (
          <div className="absolute -top-0 right-0 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg animate-pulse z-20">
            {unitAction.actionType === 'attack' && (
              <div className="w-full h-full bg-red-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            )}
            {unitAction.actionType === 'defend' && (
              <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            )}
            {unitAction.actionType === 'skill' && (
              <div className="w-full h-full bg-purple-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
      
      {!isDefeated && (
        <div className="flex flex-col items-center w-full mt-1">
          <div className="flex flex-col gap-1 w-full items-center bg-black bg-opacity-40 p-1 rounded-md">
            {/* HP条 */}
            <div className="w-[80px] h-[8px] bg-gray-900 rounded-md overflow-hidden relative border border-white border-opacity-20 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-white/20 to-white/40 shadow-lg"
                style={{ 
                  width: `${hpPercent}%`,
                  backgroundColor: hpBarColor
                }}
              ></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[7px] font-bold text-white drop-shadow-[0_0_2px_rgba(0,0,0,1)] whitespace-nowrap tracking-wide">
                {currentHp}/{maxHp}
              </div>
            </div>
            {/* MP条 */}
            <div className="w-[80px] h-[8px] bg-gray-900 rounded-md overflow-hidden relative border border-white border-opacity-20 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-white/20 to-white/40 shadow-lg"
                style={{ 
                  width: `${mpPercent}%`,
                  backgroundColor: mpBarColor
                }}
              ></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[7px] font-bold text-white drop-shadow-[0_0_2px_rgba(0,0,0,1)] whitespace-nowrap tracking-wide">
                {currentMp}/{maxMp}
              </div>
            </div>
            
            {/* BUFF栏已移至单位详情面板 */}
          </div>
        </div>
      )}
      
      {isDefeated && (
        <div className="text-red-500 text-xs font-bold mt-1 text-shadow">倒下</div>
      )}
    </div>
  );
};

// 使用React.memo包装组件，避免不必要的重新渲染
export default memo(BattleUnitSprite);