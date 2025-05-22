import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentPhase, selectUnitActions } from '@/store/slices/battleSlice';
import './BattleUnitSprite.css';
// 导入默认精灵图
import defaultSprite from '@/assets/summons/default.png';

const BattleUnitSprite = ({ unit, onClick, hasAction = false }) => {
  // 状态用于控制攻击动画
  const [isAttacking, setIsAttacking] = useState(false);
  const [isReceivingDamage, setIsReceivingDamage] = useState(false);
  const [damageValue, setDamageValue] = useState(null);
  
  // 获取当前战斗阶段和单位行动
  const currentPhase = useSelector(selectCurrentPhase);
  const allUnitActions = useSelector(selectUnitActions);
  const battleLog = useSelector(state => state.battle.battleLog);
  
  // 直接从所有行动中获取当前单位的行动
  const unitAction = unit ? allUnitActions[unit.id] : null;
  
  // 使用useRef跟踪已处理的日志ID，避免重复触发动画
  const lastProcessedLogRef = useRef(null);
  
  // 调试信息
  React.useEffect(() => {
    if (unit && !unit.isPlayerUnit) {
      console.log(`敌方单位 ${unit.name} (ID: ${unit.id}) 的行动:`, unitAction);
      console.log(`所有单位行动:`, allUnitActions);
      console.log(`当前阶段:`, currentPhase);
      console.log(`是否已准备:`, hasAction);
      console.log(`是否显示意图图标:`, !unit.isDefeated && unitAction && !unit.isPlayerUnit);
    }
  }, [unit, unitAction, allUnitActions, currentPhase, hasAction]);
  
  // 使用全局变量跟踪正在进行的动画，避免重复触发
  const isAnimationInProgressRef = useRef(false);
  const processedLogsRef = useRef(new Set());
  
  // 清理已处理的日志集合，防止内存泄漏
  useEffect(() => {
    // 每50条日志清理一次已处理的集合
    if (battleLog.length > 0 && battleLog.length % 50 === 0) {
      processedLogsRef.current = new Set();
    }
  }, [battleLog.length]);
  
  // 监听战斗日志变化，触发攻击动画
  useEffect(() => {
    if (!unit || !battleLog.length) return;
    
    // 如果有动画正在进行，则不触发新的动画
    if (isAnimationInProgressRef.current) return;
    
    // 获取最新的战斗日志
    const latestLog = battleLog[battleLog.length - 1];
    
    // 生成唯一的日志ID
    const logId = latestLog.id || `${latestLog.unitId}-${latestLog.targetId}-${battleLog.length}`;
    
    // 如果这个日志已经处理过，则跳过
    if (processedLogsRef.current.has(logId)) {
      return;
    }
    
    // 如果是当前单位发起的攻击
    if (latestLog.unitId === unit.id && latestLog.message && latestLog.message.includes('攻击') && latestLog.targetId) {
      // 标记动画正在进行
      isAnimationInProgressRef.current = true;
      
      // 添加到已处理日志集合
      processedLogsRef.current.add(logId);
      
      // 获取目标单位的DOM元素
      const targetElement = document.querySelector(`[data-unit-id="${latestLog.targetId}"]`);
      if (targetElement) {
        // 计算攻击者到目标的距离和方向
        const attackerElement = document.querySelector(`[data-unit-id="${unit.id}"]`);
        if (attackerElement) {
          const attackerRect = attackerElement.getBoundingClientRect();
          const targetRect = targetElement.getBoundingClientRect();
          
          // 计算从攻击者到目标的移动距离
          let moveX = targetRect.left - attackerRect.left;
          const moveY = targetRect.top - attackerRect.top;
          
          // 考虑友方单位的翻转，如果是友方单位，移动方向需要反转
          if (unit.isPlayerUnit) {
            document.documentElement.style.setProperty('--move-direction', '-1');
          } else {
            document.documentElement.style.setProperty('--move-direction', '1');
          }
          
          // 设置自定义CSS变量传递移动距离
          document.documentElement.style.setProperty('--move-x', `${moveX}px`);
          document.documentElement.style.setProperty('--move-y', `${moveY}px`);
          
          // 触发攻击动画
          setIsAttacking(true);
          
          // 动画结束后恢复原状态
          setTimeout(() => {
            setIsAttacking(false);
            // 标记动画完成
            isAnimationInProgressRef.current = false;
          }, 1200); // 缩短动画时间以加快衔接
        }
      }
    }
    
    // 如果当前单位是被攻击的目标
    if (latestLog.targetId === unit.id && latestLog.message && latestLog.message.includes('攻击')) {
      // 标记动画正在进行
      isAnimationInProgressRef.current = true;
      
      // 添加到已处理日志集合
      processedLogsRef.current.add(logId);
      
      // 提取伤害数值
      const damageMatch = latestLog.message.match(/造成 (\d+) 点伤害/);
      const damage = damageMatch ? parseInt(damageMatch[1]) : 0;
      
      // 缩短等待时间，加快动画衔接
      setTimeout(() => {
        // 触发受伤动画
        setIsReceivingDamage(true);
        setDamageValue(damage);
        
        setTimeout(() => {
          setIsReceivingDamage(false);
          setDamageValue(null);
          // 标记动画完成
          isAnimationInProgressRef.current = false;
        }, 800); // 缩短受击动画时间
      }, 600); // 缩短等待时间
    }
  }, [battleLog, unit]);
  if (!unit) return null;

  const { name, stats, isPlayerUnit, isDefeated } = unit;
  const { currentHp, maxHp, currentMp, maxMp } = stats;

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
  const unitBaseClasses = "w-[90px] h-[110px] flex flex-col items-center justify-start z-10 transition-transform duration-200 m-auto";
  const unitHoverClasses = "hover:scale-110 hover:cursor-pointer";
  const unitStateClasses = isDefeated ? "opacity-60" : "";
  
  // 精灵图状态类
  const spriteAnimationClasses = `
    ${isAttacking ? 'attacker-move' : ''}
    ${isReceivingDamage ? 'receiving-damage' : ''}
  `;
  
  // 设置较高的z-index，确保精灵图显示在格子上方
  const unitZIndexStyle = { zIndex: 50 };
  
  // 精灵图容器样式
  const spriteContainerClasses = "w-[100px] h-[100px] flex justify-center items-center relative mb-1 shadow-md";
  const spriteStateClasses = isDefeated ? "opacity-60" : "";
  
  return (
    <div 
      className={`${unitBaseClasses} ${unitHoverClasses} ${unitStateClasses}`}
      onClick={handleUnitClick}
      style={unitZIndexStyle}
      data-unit-id={unit.id}
    >
      <div className={`${spriteContainerClasses} ${spriteStateClasses} sprite-container ${spriteAnimationClasses}`}>
        {/* 默认精灵图 - 注意友方单位需要翻转 */}
        <div className="relative w-full h-full flex items-center justify-center transform-gpu">
          <img 
            src={defaultSprite} 
            alt={name}
            className={`w-[100px] h-[100px] object-contain ${isDefeated ? 'grayscale opacity-50' : ''} sprite-image`}
            style={{ 
              transform: `scale(1.4) translateZ(20px) ${isPlayerUnit ? 'scaleX(-1)' : ''}`, 
              transformStyle: 'preserve-3d',
              filter: 'drop-shadow(0 10px 8px rgba(0, 0, 0, 0.3))',
              imageRendering: 'crisp-edges',
              backfaceVisibility: 'hidden'
            }}
          />
        </div>
        
        {/* 伤害数字效果 */}
        {isReceivingDamage && damageValue && (
          <div className="damage-number-container">
            <div className="damage-number">{damageValue}</div>
          </div>
        )}
        
        {/* 攻击特效 - 简化版本 */}
        {isReceivingDamage && (
          <div className="attack-effect-container">
            <div className="attack-effect"></div>
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
          <div className="absolute -top-10 right-0 w-10 h-10 rounded-full border-2 border-white flex items-center justify-center shadow-lg animate-pulse z-20">
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
          <div className="flex flex-col gap-1 w-full items-center">
            <div className="w-[80px] h-[8px] bg-black bg-opacity-50 rounded-md overflow-hidden relative border border-white border-opacity-10 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-white/10 to-white/30 shadow-lg"
                style={{ 
                  width: `${hpPercent}%`,
                  backgroundColor: hpBarColor
                }}
              ></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[7px] font-bold text-white text-shadow whitespace-nowrap tracking-wide">
                {currentHp}/{maxHp}
              </div>
            </div>
            <div className="w-[80px] h-[8px] bg-black bg-opacity-50 rounded-md overflow-hidden relative border border-white border-opacity-10 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-white/10 to-white/30 shadow-lg"
                style={{ 
                  width: `${mpPercent}%`,
                  backgroundColor: mpBarColor
                }}
              ></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[7px] font-bold text-white text-shadow whitespace-nowrap tracking-wide">
                {currentMp}/{maxMp}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isDefeated && (
        <div className="text-red-500 text-xs font-bold mt-1 text-shadow">倒下</div>
      )}
    </div>
  );
};

export default BattleUnitSprite;