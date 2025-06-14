import React from 'react';
import { getBuffById } from '@/config/skill/buffConfig';
import './BattleUnitSprite.css';

// 单位详情面板组件
const BattleUnitDetailPanel = ({ unit }) => {
  if (!unit) return null;

  const { name, derivedAttributes, level, elementType } = unit;
  const { currentHp, maxHp, currentMp, maxMp, physicalAttack, physicalDefense, speed, magicalAttack, magicalDefense } = derivedAttributes;
  
  // 计算百分比
  const hpPercent = (currentHp / maxHp) * 100;
  const mpPercent = (currentMp / maxMp) * 100;
  
  // 获取HP条颜色
  const getHpBarColorClass = (percent) => {
    if (percent < 30) return 'bg-red-500'; // 低血量
    if (percent < 60) return 'bg-yellow-500'; // 中等血量
    return 'bg-green-500'; // 高血量
  };

  // 获取元素类型对应的颜色和图标
  const getElementInfo = (type) => {
    switch (type) {
      case 'fire':
        return { color: 'bg-red-500', icon: 'fa-fire', name: '火' };
      case 'water':
        return { color: 'bg-blue-500', icon: 'fa-water', name: '水' };
      case 'thunder':
        return { color: 'bg-yellow-500', icon: 'fa-bolt', name: '雷' };
      case 'earth':
        return { color: 'bg-amber-700', icon: 'fa-mountain', name: '土' };
      case 'wind':
        return { color: 'bg-teal-500', icon: 'fa-wind', name: '风' };
      default:
        return { color: 'bg-gray-500', icon: 'fa-circle', name: '无' };
    }
  };

  const elementInfo = getElementInfo(elementType);
  const hpBarColorClass = getHpBarColorClass(hpPercent);

  return (
    <div className="bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-lg p-2 border border-gray-700 shadow-lg w-[220px] text-white">
      {/* 头部信息 */}
      <div className="flex items-center mb-2">
        {/* 单位头像 */}
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-600 mr-2 flex-shrink-0">
          <img 
            src={unit.spriteAssetKey ? `/assets/summons/${unit.spriteAssetKey}.png` : '/assets/summons/default.png'} 
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/assets/summons/default.png';
            }}
          />
        </div>
        
        {/* 名称和等级 */}
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">{name}</h3>
            <div className="flex items-center">
              <span className="text-xs bg-gray-700 rounded-full px-1.5 py-0.5">Lv.{level || 1}</span>
              <div className={`ml-1 ${elementInfo.color} rounded-full w-4 h-4 flex items-center justify-center`} title={`${elementInfo.name}属性`}>
                <i className={`fas ${elementInfo.icon} text-[10px] text-white`}></i>
              </div>
            </div>
          </div>
          
          {/* HP条 */}
          <div className="mt-1 w-full h-3 bg-gray-800 rounded-sm overflow-hidden relative border border-gray-600">
            <div 
              className={`h-full transition-all duration-300 ease-out ${hpBarColorClass}`}
              style={{ width: `${hpPercent}%` }}
            ></div>
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-white drop-shadow-lg">HP: {currentHp}/{maxHp}</span>
            </div>
          </div>
          
          {/* MP条 */}
          <div className="mt-1 w-full h-3 bg-gray-800 rounded-sm overflow-hidden relative border border-gray-600">
            <div 
              className="h-full transition-all duration-300 ease-out bg-blue-500"
              style={{ width: `${mpPercent}%` }}
            ></div>
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-white drop-shadow-lg">MP: {currentMp}/{maxMp}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 属性信息 */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        <div className="flex items-center justify-between bg-gray-800 rounded p-1">
          <span className="text-[10px] text-gray-400">物攻</span>
          <span className="text-xs font-medium">{physicalAttack}</span>
        </div>
        <div className="flex items-center justify-between bg-gray-800 rounded p-1">
          <span className="text-[10px] text-gray-400">防御</span>
          <span className="text-xs font-medium">{physicalDefense}</span>
        </div>
        <div className="flex items-center justify-between bg-gray-800 rounded p-1">
          <span className="text-[10px] text-gray-400">法攻</span>
          <span className="text-xs font-medium">{magicalAttack}</span>
        </div>
        <div className="flex items-center justify-between bg-gray-800 rounded p-1">
          <span className="text-[10px] text-gray-400">法防</span>
          <span className="text-xs font-medium">{magicalDefense}</span>
        </div>
        <div className="flex items-center justify-between bg-gray-800 rounded p-1 col-span-2">
          <span className="text-[10px] text-gray-400">速度</span>
          <span className="text-xs font-medium">{speed}</span>
        </div>
      </div>
      
      {/* BUFF区域 */}
      {unit.statusEffects && unit.statusEffects.length > 0 && (
        <div className="mt-1">
          <h4 className="text-xs font-semibold mb-1 border-b border-gray-700 pb-0.5">状态效果</h4>
          <div className="buff-container flex flex-wrap gap-1.5">
            {unit.statusEffects.map((buff, index) => {
              const buffConfig = getBuffById(buff.buffId);
              const isPositive = buffConfig?.type === 'positive';
              const isNegative = buffConfig?.type === 'negative';
              const isPermanent = buff.remainingRounds === -1;
              // 检查BUFF是否生效
              const isActive = buff.isActive !== false; // 如果未定义或为true，则认为是生效的
              
              return (
                <div 
                  key={`${buff.buffId}-${index}`}
                  className={`buff-icon w-6 h-6 rounded-full flex items-center justify-center text-[10px] relative
                    ${isPositive ? 'bg-green-600 positive-buff' : isNegative ? 'bg-red-600 negative-buff' : 'bg-blue-600'}
                    ${isPermanent ? 'border-2 border-yellow-400 permanent-buff' : ''}
                    ${!isActive ? 'opacity-50 grayscale' : ''}
                  `}
                  title={`${buffConfig?.name || buff.buffId}: ${buffConfig?.description || '未知效果'} ${!isActive ? '(未生效)' : '(生效中)'}`}
                >
                  <i className={`fas ${buffConfig?.icon || 'fa-question'} text-white`}></i>
                  {!isPermanent && buff.remainingRounds > 0 && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
                      <span className="text-white text-[6px] font-bold">{buff.remainingRounds}</span>
                    </div>
                  )}
                  {buff.stacks > 1 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[6px] font-bold">{buff.stacks}</span>
                    </div>
                  )}
                  {/* 显示BUFF是否生效的标记 */}
                  {!isActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-[2px] bg-red-500 transform rotate-45"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleUnitDetailPanel;
