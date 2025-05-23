import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { finalizeBattleResolution } from '@/store/slices/battleSlice';
import './BattleAnimations.css';

// 战斗动画组件 - 处理攻击动画、特效和伤害数字
const BattleAnimations = () => {
  const dispatch = useDispatch();
  const [animation, setAnimation] = useState(null);
  const [damageNumbers, setDamageNumbers] = useState([]);
  
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
  }, [battleLog, battleUnits, currentPhase]); // 依赖项保持简洁

  // Listen for awaiting_final_animation phase to finalize battle
  useEffect(() => {
    if (currentPhase === 'awaiting_final_animation') {
      // Delay to allow animations to complete (e.g., damage numbers last 2s)
      const animationBufferTime = 2500; // ms
      const timer = setTimeout(() => {
        dispatch(finalizeBattleResolution());
      }, animationBufferTime);
      return () => clearTimeout(timer); // Cleanup timer on component unmount or phase change
    }
  }, [currentPhase, dispatch]);
  
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
    setTimeout(() => {
      setAnimation(null);
    }, 1000);
    
    // 伤害数字动画结束后清除
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.targetId !== targetId));
    }, 2000);
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
  
  return (
    <>
      {renderAttackAnimation()}
      {renderDamageNumbers()}
    </>
  );
};

export default BattleAnimations;
