import React, { useState, useEffect, useRef, memo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentPhase, selectUnitActions } from '@/store/slices/battleSlice';
import './BattleUnitSprite.css';

// 动态导入所有精灵图
const images = import.meta.glob('@/assets/summons/*.png', { eager: true });

const BattleUnitSprite = ({ unit, onClick, hasAction = false }) => {
  // 状态用于控制攻击动画
  const [isAttacking, setIsAttacking] = useState(false);
  const [isReceivingDamage, setIsReceivingDamage] = useState(false);
  
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
  const isAnimationInProgressRef = useRef(false);
  const processedLogsRef = useRef(new Set());
  const lastProcessedDamageRef = useRef(null);
  
  // 限制缓存大小，防止内存泄漏
  useEffect(() => {
    // 组件挂载时重置状态
    processedLogsRef.current.clear();
    isAnimationInProgressRef.current = false;
    lastProcessedDamageRef.current = null;
    
    return () => {
      // 组件卸载时清理
      processedLogsRef.current.clear();
      isAnimationInProgressRef.current = false;
      lastProcessedDamageRef.current = null;
    };
  }, []);
  
  // 监听战斗日志变化，触发攻击动画
  useEffect(() => {
    if (!unit || !battleLog.length) return;
    
    // 如果有动画正在进行，则不触发新的动画
    if (isAnimationInProgressRef.current) return;
    
    // 获取最新的战斗日志
    const latestLog = battleLog[battleLog.length - 1];
    
    // 如果没有日志ID或时间戳，则不处理
    if (!latestLog || (!latestLog.id && !latestLog.timestamp)) return;
    
    // 生成稳定的日志ID，确保即使相同事件重复触发也只处理一次
    const timestamp = latestLog.timestamp || Date.now();
    const logId = `${latestLog.unitId || ''}-${latestLog.targetId || ''}-${timestamp}`;
    
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
          
          // 考虑单位的朝向和目标位置关系
          // 玩家单位默认水平翻转，所以实际上是朝右的，而敵人单位朝左
          // 因此当目标在右侧时，玩家单位应该正向移动，敵人单位应该反向移动
          // 当目标在左侧时，玩家单位应该反向移动，敵人单位应该正向移动
          const isTargetOnRight = moveX > 0;
          
          if (unit.isPlayerUnit) {
            // 玩家单位如果目标在右侧，正向移动；如果目标在左侧，反向移动
            document.documentElement.style.setProperty('--move-direction', isTargetOnRight ? '1' : '-1');
          } else {
            // 敵人单位如果目标在右侧，反向移动；如果目标在左侧，正向移动
            document.documentElement.style.setProperty('--move-direction', isTargetOnRight ? '-1' : '1');
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
          }, 800); // 与 CSS 中的动画时间保持一致（从 1200ms 减少到 800ms）
        }
      }
    }
    
    // 如果当前单位是被攻击的目标
    if (latestLog.targetId === unit.id && latestLog.message && latestLog.message.includes('攻击')) {
      // 提取伤害数值
      const damageMatch = latestLog.message.match(/造成 (\d+) 点伤害/);
      const damage = damageMatch ? parseInt(damageMatch[1]) : 0;
      
      // 检查是否已经处理过这个伤害值，避免同一个伤害多次显示
      // 使用logId+damage作为唯一标识
      const damageId = `${logId}-${damage}`;
      if (lastProcessedDamageRef.current === damageId) {
        return;
      }
      
      // 标记动画正在进行
      isAnimationInProgressRef.current = true;
      // 记录已处理的伤害
      lastProcessedDamageRef.current = damageId;
      // 添加到已处理日志集合
      processedLogsRef.current.add(logId);
      
      // 缩短等待时间，加快动画衔接
      setTimeout(() => {
        // 触发受伤动画
        setIsReceivingDamage(true);
        
        setTimeout(() => {
          setIsReceivingDamage(false);
          // 标记动画完成
          isAnimationInProgressRef.current = false;
        }, 800); // 受击动画时间
      }, 300); // 缩短等待时间
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
  const unitBaseClasses = "w-[80px] h-[100px] flex flex-col items-center justify-start z-10 transition-transform duration-200 m-auto";
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
  const spriteContainerClasses = "w-[120px] h-[120px] flex flex-col items-center justify-center relative mb-1 shadow-md";
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
              transform: `scale(1) translateZ(20px) ${isPlayerUnit ? 'scaleX(-1)' : ''}`, 
              transformStyle: 'preserve-3d',
              filter: 'drop-shadow(0 10px 8px rgba(0, 0, 0, 0.3))',
              imageRendering: 'pixelated',
              backfaceVisibility: 'hidden'
            }}
            onError={(e) => {
              // 如果指定的精灵图加载失败，使用默认图
              e.target.src = images['/src/assets/summons/default.png'].default;
            }}
          />
        </div>
        
        {/* 攻击特效 - 增强版本 */}
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
export default memo(BattleUnitSprite, (prevProps, nextProps) => {
  // 只有当关键属性变化时才重新渲染
  return (
    prevProps.unit?.id === nextProps.unit?.id &&
    prevProps.hasAction === nextProps.hasAction &&
    prevProps.unit?.isDefeated === nextProps.unit?.isDefeated &&
    prevProps.unit?.stats?.currentHp === nextProps.unit?.stats?.currentHp &&
    prevProps.unit?.stats?.currentMp === nextProps.unit?.stats?.currentMp
  );
});