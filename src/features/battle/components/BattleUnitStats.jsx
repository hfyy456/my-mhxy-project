import React from 'react';
import { useBattleStateMachineState } from '../hooks/useBattleStateMachine';
import { getUnitStatsDetails } from '@/features/battle/logic/battleLogic';

/**
 * 战斗单位属性显示组件
 * 用于在战斗中显示所有单位的详细属性
 */
const BattleUnitStats = () => {
  // 获取所有战斗单位
  const { battleUnits } = useBattleStateMachineState();
  
  if (!battleUnits || Object.keys(battleUnits).length === 0) {
    return null;
  }
  
  // 分离玩家单位和敌方单位
  const playerUnits = Object.values(battleUnits).filter(unit => unit.isPlayerUnit);
  const enemyUnits = Object.values(battleUnits).filter(unit => !unit.isPlayerUnit);
  
  return (
    <div className="absolute top-20 right-2 z-20 w-64 bg-gray-900 bg-opacity-80 rounded-lg p-2 text-white text-xs overflow-auto max-h-[80vh]">
      <h2 className="text-center font-bold text-yellow-400 mb-2">战斗单位属性</h2>
      
      {/* 玩家单位 */}
      <div className="mb-4">
        <h3 className="text-center bg-blue-900 py-1 rounded mb-2">我方单位</h3>
        {playerUnits.map(unit => (
          <UnitStatsCard key={unit.id} unit={unit} />
        ))}
      </div>
      
      {/* 敌方单位 */}
      <div>
        <h3 className="text-center bg-red-900 py-1 rounded mb-2">敌方单位</h3>
        {enemyUnits.map(unit => (
          <UnitStatsCard key={unit.id} unit={unit} />
        ))}
      </div>
    </div>
  );
};

/**
 * 单位属性卡片组件
 */
const UnitStatsCard = ({ unit }) => {
  const unitDetails = getUnitStatsDetails(unit);
  
  if (!unitDetails) {
    return <div>无效单位</div>;
  }
  
  // 获取状态效果图标和描述
  const getStatusEffects = () => {
    if (!unit.statusEffects || unit.statusEffects.length === 0) {
      return [{ icon: '✓', name: '无状态效果', description: '该单位当前没有任何状态效果' }];
    }
    return unit.statusEffects;
  };

  // 计算HP和MP百分比
  const hpPercent = (unit.stats.currentHp / unit.stats.maxHp) * 100;
  const mpPercent = (unit.stats.currentMp / unit.stats.maxMp) * 100;

  // 根据HP百分比确定颜色
  const getHpColor = (percent) => {
    if (percent <= 25) return 'bg-red-600';
    if (percent <= 50) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  return (
    <div className="mb-2 p-2 bg-gray-800 rounded">
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold">{unitDetails.name}</span>
        <span className="text-gray-400">Lv.{unitDetails.level}</span>
      </div>
      
      {/* 生命和法力条 */}
      <div className="mb-1">
        {/* HP条 */}
        <div className="flex items-center gap-1 mb-1">
          <span className="text-green-400 w-8">HP:</span>
          <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getHpColor(hpPercent)}`}
              style={{ width: `${hpPercent}%` }}
            ></div>
          </div>
          <span className="text-xs font-mono">{unit.stats.currentHp}/{unit.stats.maxHp}</span>
        </div>
        {/* MP条 */}
        <div className="flex items-center gap-1">
          <span className="text-blue-400 w-8">MP:</span>
          <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600"
              style={{ width: `${mpPercent}%` }}
            ></div>
          </div>
          <span className="text-xs font-mono">{unit.stats.currentMp}/{unit.stats.maxMp}</span>
        </div>
      </div>
      
      {/* 攻击和防御 */}
      <div className="grid grid-cols-2 gap-1 mb-1">
        <div className="flex justify-between">
          <span className="text-red-400">物攻:</span>
          <span>{unitDetails.physicalAttack}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-400">法攻:</span>
          <span>{unitDetails.magicalAttack}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-yellow-400">物防:</span>
          <span>{unitDetails.physicalDefense}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-purple-400">法防:</span>
          <span>{unitDetails.magicalDefense}</span>
        </div>
      </div>
      
      {/* 其他属性 */}
      <div className="grid grid-cols-2 gap-1">
        <div className="flex justify-between">
          <span className="text-green-400">速度:</span>
          <span>{unitDetails.speed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-orange-400">暴击:</span>
          <span>{unitDetails.critRate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-pink-400">闪避:</span>
          <span>{unitDetails.dodgeRate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-teal-400">暴伤:</span>
          <span>{unitDetails.critDamage}</span>
        </div>
      </div>
      
      {/* 首选攻击类型 */}
      <div className="mt-1 pt-1 border-t border-gray-700 flex justify-between">
        <span>首选攻击:</span>
        <span className={unitDetails.preferredAttackType === 'physical' ? 'text-red-400' : 'text-blue-400'}>
          {unitDetails.preferredAttackType === 'physical' ? '物理' : '法术'}
        </span>
      </div>
      
      {/* 状态效果 */}
      <div className="mt-1 pt-1 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-1">状态效果</div>
        <div className="flex flex-wrap gap-1">
          {getStatusEffects().map((effect, index) => (
            <div 
              key={index} 
              className="bg-gray-700 rounded px-1.5 py-0.5 text-[10px] flex items-center"
              title={effect.description}
            >
              <span className="mr-1">{effect.icon}</span>
              <span>{effect.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BattleUnitStats;
