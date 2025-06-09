import React, { useState, useEffect, useRef } from 'react';
import { useBattleStateMachineState } from '../hooks/useBattleStateMachine';
import './BattleAnimations.css';

// 战斗动画组件 - 处理攻击动画、特效和伤害数字
const BattleAnimations = () => {
  const [animation, setAnimation] = useState(null);
  const [damageNumbers, setDamageNumbers] = useState([]);
  const [effects, setEffects] = useState([]);
  
  // 从状态机获取当前战斗状态
  const {
    currentTurnUnitId,
    battleUnits,
    unitActions,
    currentPhase,
    battleLog,
    // 需要从hook中获取事件总线或适配器实例
    adapter
  } = useBattleStateMachineState();
  
  const processedDamageTimestampRef = useRef(null);
  
  // 监听DAMAGE_DEALT事件来触发动画
  useEffect(() => {
    if (!adapter?.eventBus) return;
    
    const handleDamageDealt = (event) => {
      const { data } = event;
      console.log('🎯 收到DAMAGE_DEALT事件:', data);
      
      // 检查是否是新的伤害事件（避免重复处理）
      if (data.timestamp === processedDamageTimestampRef.current) {
        return;
      }
      
      // 只在执行阶段处理动画
      if (currentPhase === 'execution') {
        const attacker = battleUnits[data.sourceId];
        const target = battleUnits[data.targetId];

        if (attacker && target) {
          triggerAttackAnimation(data.sourceId, data.targetId, data.damage, data.isCrit);
          processedDamageTimestampRef.current = data.timestamp;
        }
      }
    };
    
    // 订阅DAMAGE_DEALT事件
    const unsubscribe = adapter.eventBus.subscribe('damage_dealt', handleDamageDealt);
    
    // 清理函数
    return () => {
      unsubscribe();
    };
  }, [adapter, battleUnits, currentPhase]);

  // 动画处理逻辑 - 在新架构中，动画完成不需要特殊处理
  useEffect(() => {
    // 在新架构中，动画纯粹是视觉效果，不影响战斗流程
    // 状态机会自动管理战斗进度
  }, [currentPhase]);
  
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
  const triggerAttackAnimation = (attackerId, targetId, damage, isCrit = false) => {
    console.log('🎬 触发攻击动画:', { attackerId, targetId, damage, isCrit });
    
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
        isCrit,
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
        setDamageNumbers(prev => prev.filter(d => d.targetId !== targetId || d.startTime !== Date.now()));
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
      const { id, targetId, damage, isCrit, startTime } = damageInfo;
      
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
        transform: 'translateX(-50%)',
        zIndex: 1001,
        pointerEvents: 'none'
      };
      
      return (
        <div key={id} className={`damage-number ${isCrit ? 'critical' : ''}`} style={numberStyle}>
          {isCrit && <span className="crit-text">暴击！</span>}
          <span className="damage-value">{damage}</span>
        </div>
      );
    });
  };
  
  // 渲染特效
  const renderEffects = () => {
    return effects.map(effect => {
      const { id, unitId, type, icon, color, size } = effect;
      
      // 获取单位的DOM元素位置
      const unitElement = document.querySelector(`[data-unit-id="${unitId}"]`);
      if (!unitElement) return null;
      
      // 获取元素在页面中的位置
      const unitRect = unitElement.getBoundingClientRect();
      
      // 计算特效位置
      const effectStyle = {
        position: 'fixed',
        top: `${unitRect.top + unitRect.height / 2}px`,
        left: `${unitRect.left + unitRect.width / 2}px`,
        transform: 'translate(-50%, -50%)',
        fontSize: size || '24px',
        color: color || '#ffffff',
        zIndex: 1002,
        pointerEvents: 'none'
      };
      
      return (
        <div key={id} className={`battle-effect ${type}`} style={effectStyle}>
          {icon}
        </div>
      );
    });
  };
  
  return (
    <div className="battle-animations-container">
      {renderAttackAnimation()}
      {renderDamageNumbers()}
      {renderEffects()}
    </div>
  );
};

export default BattleAnimations;
