import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { finalizeBattleResolution } from '@/store/slices/battleSlice';
import './BattleAnimations.css';

// 战斗动画组件 - 处理攻击动画、特效和伤害数字
const BattleAnimations = () => {
  const dispatch = useDispatch();
  const [animation, setAnimation] = useState(null);
  const [damageNumbers, setDamageNumbers] = useState([]);
  const [effects, setEffects] = useState([]);
  
  // 从Redux获取当前战斗状态
  const currentTurnUnitId = useSelector(state => state.battle.currentTurnUnitId);
  const battleUnits = useSelector(state => state.battle.battleUnits);
  const unitActions = useSelector(state => state.battle.unitActions);
  const currentPhase = useSelector(state => state.battle.currentPhase);
  const battleLog = useSelector(state => state.battle.battleLog);
  const processedAttackLogTimestampRef = useRef(null);
  
  // 监听战斗日志变化，触发动画
  useEffect(() => {
    if (battleLog.length === 0) return;

    const latestLog = battleLog[battleLog.length - 1];

    // 检查最新的日志是否为攻击类型，并且其时间戳与已处理的攻击日志时间戳不同
    if (
      latestLog.unitId &&
      latestLog.targetId &&
      latestLog.message && latestLog.message.includes('攻击') &&
      latestLog.timestamp && // 确保日志有时间戳
      latestLog.timestamp !== processedAttackLogTimestampRef.current
    ) {
      // 允许在 'execution' 或 'awaiting_final_animation' 阶段触发
      // 因为阶段可能因为此攻击的结果而刚刚改变
      if (currentPhase === 'execution' || currentPhase === 'awaiting_final_animation') {
        const attacker = battleUnits[latestLog.unitId];
        const target = battleUnits[latestLog.targetId];

        if (attacker && target) {
          const damageMatch = latestLog.message.match(/造成 (\d+) 点伤害/);
          const damage = damageMatch ? parseInt(damageMatch[1]) : 0;

          triggerAttackAnimation(latestLog.unitId, latestLog.targetId, damage);
          processedAttackLogTimestampRef.current = latestLog.timestamp; // 标记此日志已处理动画
        }
      }
    }
    
    // 检查是否有特效信息
    if (latestLog.effect && latestLog.unitId) {
      triggerEffect(latestLog.unitId, latestLog.effect);
    }
  }, [battleLog, battleUnits, currentPhase]); // 依赖项保持简洁

  // Listen for awaiting_final_animation phase to finalize battle
  useEffect(() => {
    if (currentPhase === 'awaiting_final_animation') {
      // Delay to allow animations to complete (e.g., damage numbers last 2s)
      const animationBufferTime = 2500; // ms
      const startTime = performance.now();
      
      const finalizeAnimation = (timestamp) => {
        const elapsed = timestamp - startTime;
        if (elapsed >= animationBufferTime) {
          dispatch(finalizeBattleResolution());
          return;
        }
        const animFrameId = requestAnimationFrame(finalizeAnimation);
        return () => cancelAnimationFrame(animFrameId);
      };
      
      const animFrameId = requestAnimationFrame(finalizeAnimation);
      return () => cancelAnimationFrame(animFrameId); // Cleanup animation frame on component unmount or phase change
    }
  }, [currentPhase, dispatch]);
  
  // 触发特效
  const triggerEffect = (unitId, effectInfo) => {
    const { type, icon, color, size, duration } = effectInfo;
    
    // 添加新特效
    setEffects(prev => [
      ...prev,
      {
        id: `effect-${Date.now()}`,
        unitId,
        type,
        icon,
        color,
        size,
        startTime: Date.now(),
        duration: duration || 1000
      }
    ]);
    
    // 特效结束后清除
    const startTime = performance.now();
    const effectDuration = duration || 1000;
    
    const clearEffect = (timestamp) => {
      const elapsed = timestamp - startTime;
      if (elapsed >= effectDuration) {
        setEffects(prev => prev.filter(e => e.unitId !== unitId || e.type !== type));
        return;
      }
      requestAnimationFrame(clearEffect);
    };
    
    requestAnimationFrame(clearEffect);
  };
  
  // 触发攻击动画
  const triggerAttackAnimation = (attackerId, targetId, damage) => {
    setAnimation({
      attackerId,
      targetId,
      type: 'attack',
      startTime: Date.now()
    });
    
    // 添加伤害数字
    setDamageNumbers(prev => [
      ...prev,
      {
        id: `damage-${Date.now()}`,
        targetId,
        damage,
        startTime: Date.now()
      }
    ]);
    
    // 动画结束后清除
    const animStartTime = performance.now();
    
    const clearAnimation = (timestamp) => {
      const elapsed = timestamp - animStartTime;
      if (elapsed >= 1000) {
        setAnimation(null);
        return;
      }
      requestAnimationFrame(clearAnimation);
    };
    
    requestAnimationFrame(clearAnimation);
    
    // 伤害数字动画结束后清除
    const damageStartTime = performance.now();
    
    const clearDamageNumbers = (timestamp) => {
      const elapsed = timestamp - damageStartTime;
      if (elapsed >= 2000) {
        setDamageNumbers(prev => prev.filter(d => d.targetId !== targetId));
        return;
      }
      requestAnimationFrame(clearDamageNumbers);
    };
    
    requestAnimationFrame(clearDamageNumbers);
  };
  
  // 渲染攻击动画
  const renderAttackAnimation = () => {
    if (!animation) return null;
    
    const { attackerId, targetId, type } = animation;
    
    // 获取攻击者和目标的DOM元素位置
    const attackerElement = document.querySelector(`[data-unit-id="${attackerId}"]`);
    const targetElement = document.querySelector(`[data-unit-id="${targetId}"]`);
    
    if (!attackerElement || !targetElement) return null;
    
    // 获取元素在页面中的位置
    const attackerRect = attackerElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // 计算动画位置和大小
    const animationStyle = {
      position: 'fixed',
      top: `${targetRect.top}px`,
      left: `${targetRect.left}px`,
      width: `${targetRect.width}px`,
      height: `${targetRect.height}px`,
      zIndex: 1000
    };
    
    return (
      <div className="attack-animation-container" style={animationStyle}>
        <div className="attack-effect"></div>
      </div>
    );
  };
  
  // 渲染伤害数字
  const renderDamageNumbers = () => {
    return damageNumbers.map(damageInfo => {
      const { id, targetId, damage, startTime } = damageInfo;
      
      // 获取目标的DOM元素位置
      const targetElement = document.querySelector(`[data-unit-id="${targetId}"]`);
      if (!targetElement) return null;
      
      // 获取元素在页面中的位置
      const targetRect = targetElement.getBoundingClientRect();
      
      // 计算动画位置
      const numberStyle = {
        position: 'fixed',
        top: `${targetRect.top - 30}px`,
        left: `${targetRect.left + targetRect.width / 2}px`,
        zIndex: 1001
      };
      
      return (
        <div key={id} className="damage-number" style={numberStyle}>
          {damage}
        </div>
      );
    });
  };
  
  // 渲染特效
  const renderEffects = () => {
    return effects.map(effectInfo => {
      const { id, unitId, type, icon, color, size, startTime } = effectInfo;
      
      // 获取目标的DOM元素位置
      const unitElement = document.querySelector(`[data-unit-id="${unitId}"]`);
      if (!unitElement) return null;
      
      // 获取元素在页面中的位置
      const unitRect = unitElement.getBoundingClientRect();
      
      // 计算特效位置
      const effectStyle = {
        position: 'fixed',
        top: `${unitRect.top}px`,
        left: `${unitRect.left}px`,
        width: `${unitRect.width}px`,
        height: `${unitRect.height}px`,
        zIndex: 1002,
        color: color || '#ffffff',
        fontSize: size === 'large' ? '48px' : '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      };
      
      return (
        <div key={id} className={`battle-effect ${type}-effect`} style={effectStyle}>
          <i className={`fas ${icon}`}></i>
        </div>
      );
    });
  };
  
  return (
    <>
      {renderAttackAnimation()}
      {renderDamageNumbers()}
      {renderEffects()}
    </>
  );
};

export default BattleAnimations;
