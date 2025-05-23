import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { endBattle, selectBattleUnits, selectRewards } from '@/store/slices/battleSlice';

const BattleResultsScreen = ({ result }) => {
  const dispatch = useDispatch();
  const battleUnits = useSelector(selectBattleUnits);
  const rewards = useSelector(selectRewards);
  
  // 获取玩家单位和敌方单位
  const playerUnits = Object.values(battleUnits).filter(unit => unit.isPlayerUnit);
  const enemyUnits = Object.values(battleUnits).filter(unit => !unit.isPlayerUnit);
  
  // 检查是胜利还是失败
  const isVictory = result === 'victory';
  
  // 处理退出战斗
  const handleExitBattle = () => {
    dispatch(endBattle());
  };

  // 安全获取HP/MP值的辅助函数
  const getUnitHP = (unit) => {
    return {
      current: unit.stats?.currentHp || 0,
      max: unit.stats?.maxHp || 1
    };
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-800 border-2 border-amber-500 rounded-lg shadow-lg w-[800px] max-w-[90vw] text-white p-6 animate-fadeIn">
        <div className="text-center mb-6">
          <h2 className={`text-4xl font-bold mb-2 ${isVictory ? 'text-amber-400' : 'text-red-500'}`}>
            {isVictory ? '战斗胜利！' : '战斗失败！'}
          </h2>
          <p className="text-lg text-gray-300">
            {isVictory 
              ? '你的队伍击败了所有敌人！' 
              : '你的队伍全军覆没...'}
          </p>
        </div>
        
        {/* 战斗统计信息 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-xl font-bold mb-3 text-amber-400 border-b border-amber-400 pb-2">
              我方队伍
            </h3>
            <div className="space-y-2">
              {playerUnits.map(unit => {
                const hp = getUnitHP(unit);
                return (
                  <div key={unit.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${unit.isDefeated ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span>{unit.name}</span>
                    </div>
                    <div className="text-sm">
                      HP: {hp.current}/{hp.max}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-xl font-bold mb-3 text-red-400 border-b border-red-400 pb-2">
              敌方队伍
            </h3>
            <div className="space-y-2">
              {enemyUnits.map(unit => {
                const hp = getUnitHP(unit);
                return (
                  <div key={unit.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${unit.isDefeated ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span>{unit.name}</span>
                    </div>
                    <div className="text-sm">
                      HP: {hp.current}/{hp.max}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* 奖励区域 (仅在胜利时显示) */}
        {isVictory && rewards && (
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-xl font-bold mb-3 text-amber-400 border-b border-amber-400 pb-2">
              战斗奖励
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-lg">经验值: <span className="text-amber-400">{rewards.experience || 0}</span></p>
                <p className="text-lg">金币: <span className="text-amber-400">{rewards.currency || 0}</span></p>
              </div>
              {rewards.items && rewards.items.length > 0 && (
                <div>
                  <p className="font-bold mb-1">获得物品:</p>
                  <ul className="space-y-1">
                    {rewards.items.map((item, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-gray-300">{item.name}</span>
                        <span className="text-amber-400 ml-2">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 按钮区域 */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleExitBattle}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
          >
            {isVictory ? '领取奖励' : '退出战斗'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleResultsScreen;
