import React, { useState } from 'react';
import { getUnitStatsDetails } from '@/features/battle/logic/battleLogic';

const BattleInfoPanel = ({ unit }) => {
  if (!unit) {
    return (
      <div className="w-full h-full bg-theme-dark/80 rounded-lg border border-dreamyPurple-300/20 p-3 shadow-lg text-white font-sans flex flex-col overflow-hidden">
        <div className="text-center p-5 text-gray-400 italic">无可用召唤兽</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-theme-dark/80 rounded-lg border border-dreamyPurple-300/20 p-3 shadow-lg text-white font-sans flex flex-col overflow-hidden">
      <div className="flex justify-center items-center h-full p-2">
        <UnitInfoCard unit={unit} />
      </div>
    </div>
  );
};

const UnitInfoCard = ({ unit }) => {
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const { name, stats, spriteAssetKey, isDefeated, isPlayerUnit } = unit;
  const { currentHp, maxHp, currentMp, maxMp } = stats;
  
  // 获取单位的详细属性
  const unitDetails = getUnitStatsDetails(unit);

  // 计算HP和MP百分比
  const hpPercent = (currentHp / maxHp) * 100;
  const mpPercent = (currentMp / maxMp) * 100;

  // 根据HP百分比确定颜色
  const getHpColor = (percent) => {
    if (percent <= 25) return 'bg-red-500';
    if (percent <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // 获取状态效果图标和描述
  const getStatusEffects = () => {
    if (!unit.statusEffects || unit.statusEffects.length === 0) {
      return [{ icon: '✓', name: '无状态效果', description: '该单位当前没有任何状态效果' }];
    }
    return unit.statusEffects;
  };

  const cardClasses = isDefeated ? 'opacity-60 grayscale' : '';

  return (
    <div className={`flex flex-col bg-gradient-to-b from-dreamyPurple-400/30 to-dreamyPurple-400/10 rounded-lg p-2 transition-all duration-300 h-full w-full box-border gap-2 shadow-lg ${cardClasses}`}>
      {/* 单位名称和类型 */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-dreamyPurple-300/20 relative">
        {/* 单位头像 */}
        <div className="flex items-center gap-2">
          <div className="w-[40px] h-[40px] flex justify-center items-center">
            <div 
              className={`w-[36px] h-[36px] rounded-full border-2 border-white/30 flex justify-center items-center relative shadow-md ${isDefeated ? 'bg-gray-500' : 'bg-dreamyPurple-300'}`}
            >
              {isDefeated && (
                <div className="absolute w-full h-full">
                  <div className="absolute top-1/2 left-1/2 w-[70%] h-[3px] bg-red-500 transform -translate-x-1/2 -translate-y-1/2 rotate-45 shadow-sm"></div>
                  <div className="absolute top-1/2 left-1/2 w-[70%] h-[3px] bg-red-500 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 shadow-sm"></div>
                </div>
              )}
            </div>
          </div>
          
          {/* 单位名称 */}
          <div className="flex-1">
            <div className="font-bold text-dreamyPurple-100 text-xs mb-0.5 drop-shadow-md">{name}</div>
            <div className="text-[10px] text-gray-300 italic">{isDefeated ? '已倒下' : '战斗中'}</div>
          </div>
        </div>
        
        <div className="bg-dreamyPurple-300/30 text-dreamyPurple-100 text-xs px-2 py-1 rounded-full border border-dreamyPurple-200/50">
          {isPlayerUnit ? '我方' : '敌方'}
        </div>
      </div>
      
      {/* 生命值和法力值条 */}
      <div className="flex flex-col gap-1">
        {/* HP条 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold w-8">HP</span>
          <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getHpColor(hpPercent)}`}
              style={{ width: `${hpPercent}%` }}
            ></div>
          </div>
          <span className="text-xs font-mono">{currentHp}/{maxHp}</span>
        </div>
        
        {/* MP条 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold w-8">MP</span>
          <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${mpPercent}%` }}
            ></div>
          </div>
          <span className="text-xs font-mono">{currentMp}/{maxMp}</span>
        </div>
      </div>
      
      {/* 切换详细属性按钮 */}
      <button 
        onClick={() => setShowDetailedStats(!showDetailedStats)}
        className="bg-dreamyPurple-300 hover:bg-dreamyPurple-400 text-white text-xs py-1 px-2 rounded transition-colors duration-200"
      >
        {showDetailedStats ? '隐藏详细属性' : '显示详细属性'}
      </button>
      
      {/* 详细属性面板 */}
      {showDetailedStats && (
        <div className="mt-2 p-2 bg-dreamyPurple-400/20 rounded-lg text-xs">
          <h3 className="text-center font-semibold mb-2 text-dreamyPurple-100">单位详细属性</h3>
          
          {/* 攻击属性 */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-dreamyPurple-400/30 p-1 rounded flex justify-between">
              <span className="text-red-300">物理攻击</span>
              <span className="font-mono">{unitDetails.physicalAttack}</span>
            </div>
            <div className="bg-dreamyPurple-400/30 p-1 rounded flex justify-between">
              <span className="text-blue-300">法术攻击</span>
              <span className="font-mono">{unitDetails.magicalAttack}</span>
            </div>
          </div>
          
          {/* 防御属性 */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-dreamyPurple-400/30 p-1 rounded flex justify-between">
              <span className="text-yellow-300">物理防御</span>
              <span className="font-mono">{unitDetails.physicalDefense}</span>
            </div>
            <div className="bg-dreamyPurple-400/30 p-1 rounded flex justify-between">
              <span className="text-purple-300">法术防御</span>
              <span className="font-mono">{unitDetails.magicalDefense}</span>
            </div>
          </div>
          
          {/* 战斗相关属性 */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-dreamyPurple-400/30 p-1 rounded flex justify-between">
              <span className="text-green-300">速度</span>
              <span className="font-mono">{unitDetails.speed}</span>
            </div>
            <div className="bg-dreamyPurple-400/30 p-1 rounded flex justify-between">
              <span className="text-indigo-300">命中率</span>
              <span className="font-mono">{unitDetails.hitRate}</span>
            </div>
          </div>
          
          {/* 暴击和闪避 */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-dreamyPurple-400/30 p-1 rounded flex justify-between">
              <span className="text-orange-300">暴击率</span>
              <span className="font-mono">{unitDetails.critRate}</span>
            </div>
            <div className="bg-dreamyPurple-400/30 p-1 rounded flex justify-between">
              <span className="text-teal-300">暴击伤害</span>
              <span className="font-mono">{unitDetails.critDamage}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-dreamyPurple-400/30 p-1 rounded flex justify-between">
              <span className="text-pink-300">闪避率</span>
              <span className="font-mono">{unitDetails.dodgeRate}</span>
            </div>
            <div className="bg-dreamyPurple-400/30 p-1 rounded flex justify-between">
              <span className="text-gray-300">减伤率</span>
              <span className="font-mono">{unitDetails.percentDamageReduction}</span>
            </div>
          </div>
          
          {/* 首选攻击类型 */}
          <div className="bg-dreamyPurple-400/30 p-1 rounded flex justify-between mt-1">
            <span className="text-white">首选攻击类型</span>
            <span className={unitDetails.preferredAttackType === 'physical' ? 'text-red-300' : 'text-blue-300'}>
              {unitDetails.preferredAttackType === 'physical' ? '物理攻击' : '法术攻击'}
            </span>
          </div>
        </div>
      )}
      
      {/* 基础属性概览 */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-dreamyPurple-400/20 p-1 rounded flex justify-between">
          <span>攻击</span>
          <span className="font-mono">{Math.max(stats.physicalAttack, stats.magicalAttack)}</span>
        </div>
        <div className="bg-dreamyPurple-400/20 p-1 rounded flex justify-between">
          <span>防御</span>
          <span className="font-mono">{Math.max(stats.physicalDefense, stats.magicalDefense)}</span>
        </div>
        <div className="bg-dreamyPurple-400/20 p-1 rounded flex justify-between">
          <span>速度</span>
          <span className="font-mono">{stats.speed}</span>
        </div>
      </div>
      
      {/* 状态效果 */}
      {unit.statusEffects && (
        <div className="mt-2">
          <div className="text-xs text-gray-400 mb-1 border-b border-dreamyPurple-400/20 pb-1">状态效果</div>
          <div className="flex flex-wrap gap-1">
            {getStatusEffects().map((effect, index) => (
              <div 
                key={index} 
                className="bg-dreamyPurple-400/30 rounded px-2 py-1 text-xs flex items-center"
                title={effect.description}
              >
                <span className="mr-1">{effect.icon}</span>
                <span>{effect.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleInfoPanel;
