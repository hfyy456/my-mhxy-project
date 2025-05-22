import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import './BattleAnimations.css';

// 战斗动画组件 - 处理攻击动画、特效和伤害数字
const BattleAnimations = () => {
  const [animation, setAnimation] = useState(null);
  const [damageNumbers, setDamageNumbers] = useState([]);
  
  // 从Redux获取当前战斗状态
  const currentTurnUnitId = useSelector(state => state.battle.currentTurnUnitId);
  const battleUnits = useSelector(state => state.battle.battleUnits);
  const unitActions = useSelector(state => state.battle.unitActions);
  const currentPhase = useSelector(state => state.battle.currentPhase);
  const battleLog = useSelector(state => state.battle.battleLog);
  
  // 监听战斗日志变化，触发动画
  useEffect(() => {
    if (battleLog.length === 0 || currentPhase !== 'execution') return;
    
    // 获取最新的战斗日志
    const latestLog = battleLog[battleLog.length - 1];
    
    // 如果日志包含攻击信息，触发攻击动画
    if (latestLog.unitId && latestLog.targetId && latestLog.message.includes('攻击')) {
      const attacker = battleUnits[latestLog.unitId];
      const target = battleUnits[latestLog.targetId];
      
      if (attacker && target) {
        // 提取伤害数值
        const damageMatch = latestLog.message.match(/造成 (\d+) 点伤害/);
        const damage = damageMatch ? parseInt(damageMatch[1]) : 0;
        
        // 触发攻击动画
        triggerAttackAnimation(latestLog.unitId, latestLog.targetId, damage);
      }
    }
  }, [battleLog, battleUnits, currentPhase]);
  
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
