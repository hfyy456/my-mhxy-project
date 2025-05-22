import React from 'react';

const BattleInfoPanel = ({ unit }) => {
  if (!unit) {
    return (
      <div className="w-full h-full bg-gray-800 bg-opacity-80 rounded-lg border border-white border-opacity-10 p-3 shadow-lg text-white font-sans flex flex-col overflow-hidden">
        <div className="text-center p-5 text-gray-400 italic">无可用召唤兽</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-800 bg-opacity-80 rounded-lg border border-white border-opacity-10 p-3 shadow-lg text-white font-sans flex flex-col overflow-hidden">
      <div className="flex justify-center items-center h-full p-2">
        <UnitInfoCard unit={unit} />
      </div>
    </div>
  );
};

const UnitInfoCard = ({ unit }) => {
  const { name, stats, spriteAssetKey, isDefeated, isPlayerUnit } = unit;
  const { hp, maxHp, mp, maxMp, attack, defense, speed } = stats;

  // 计算HP和MP百分比
  const hpPercent = (hp / maxHp) * 100;
  const mpPercent = (mp / maxMp) * 100;

  // 根据HP百分比确定颜色
  const getHpColor = (percent) => {
    if (percent <= 25) return 'bg-red-600';
    if (percent <= 50) return 'bg-yellow-600';
    return 'bg-green-600';
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
    <div className={`flex flex-col bg-gradient-to-b from-gray-700 to-gray-800 bg-opacity-80 rounded-lg p-2 transition-all duration-300 h-full w-full box-border gap-2 shadow-lg ${cardClasses}`}>
      {/* 单位名称和类型 */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/20 relative">
        {/* 单位头像 */}
        <div className="flex items-center gap-2">
          <div className="w-[40px] h-[40px] flex justify-center items-center">
            <div 
              className="w-[36px] h-[36px] rounded-full border-2 border-white/30 flex justify-center items-center relative shadow-md" 
              style={{ 
                backgroundColor: isDefeated ? '#7f8c8d' : '#3498db',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)'
              }}
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
            <div className="font-bold text-blue-300 text-xs mb-0.5 drop-shadow-md">{name}</div>
            <div className="text-[10px] text-gray-300 italic">{isDefeated ? '已倒下' : '战斗中'}</div>
          </div>
        </div>
        
        <div className="bg-amber-900/30 text-amber-300 text-xs px-2 py-1 rounded-full border border-amber-800/50">
          {isPlayerUnit ? '我方' : '敌方'}
        </div>
      </div>
      
      {/* 生命值和法力值条 */}
      <div className="flex flex-col gap-1 w-full mt-0.5">
        {/* HP条 */}
        <div>
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-green-400">生命值</span>
            <span className="text-green-400">{hp}/{maxHp}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getHpColor(hpPercent)} transition-all duration-500`}
              style={{ width: `${hpPercent}%` }}
            ></div>
          </div>
        </div>
        
        {/* MP条 */}
        <div>
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-blue-400">法力值</span>
            <span className="text-blue-400">{mp}/{maxMp}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${mpPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
      {/* 状态效果 */}
      {unit.statusEffects && (
        <div className="mt-2">
          <div className="text-xs text-gray-400 mb-1 border-b border-gray-700 pb-1">状态效果</div>
          <div className="flex flex-wrap gap-1">
            {getStatusEffects().map((effect, index) => (
              <div 
                key={index} 
                className="bg-gray-800 rounded px-2 py-1 text-xs flex items-center"
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
