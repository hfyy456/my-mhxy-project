import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setBattleActive, 
  selectBattleResult,
  selectRewards 
} from '@/store/slices/battleSliceSimplified';
import { useSummonManager } from '@/hooks/useSummonManager';
import CapturedSummonCard from './CapturedSummonCard';

const BattleResultsScreen = () => {
  const dispatch = useDispatch();
  const battleResult = useSelector(selectBattleResult);
  const rewards = useSelector(selectRewards);
  const { summonManager } = useSummonManager();
  
  const [claimedSummons, setClaimedSummons] = useState([]);

  // Extract result details
  const isVictory = battleResult?.result === 'victory';
  const capturedSummons = battleResult?.capturedSummons || [];

  // Derived state to check if all captured summons have been claimed
  const allCapturedClaimed = capturedSummons.length === 0 || claimedSummons.length === capturedSummons.length;

  const handleClaimSummon = (summonId) => {
    const summonToClaim = capturedSummons.find(s => s.id === summonId);
    if (summonToClaim && !claimedSummons.includes(summonId)) {
      console.log("正在认领召唤兽:", summonToClaim);
      summonManager.addSummonFromCapture(summonToClaim);
      setClaimedSummons(prev => [...prev, summonId]);
    }
  };
  
  // 处理退出战斗
  const handleExitBattle = () => {
    if (!allCapturedClaimed) {
      alert("请先认领所有捕获的召唤兽！");
      return;
    }
    dispatch(setBattleActive(false));
  };

  // 安全获取HP/MP值的辅助函数
  const getUnitHP = (unit) => {
    return {
      current: unit.derivedAttributes?.currentHp || 0,
      max: unit.derivedAttributes?.maxHp || 1
    };
  };
  
  // 即使 battleResult 暂时为空，也渲染组件框架，等待 Redux 更新
  // if (!battleResult) {
  //   return null;
  // }

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
        
        {/* Captured Summons Section (Victory Only) */}
        {isVictory && capturedSummons.length > 0 && (
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-xl font-bold mb-3 text-green-400 border-b border-green-400 pb-2">
              捕获的召唤兽
            </h3>
            <div className="space-y-3">
              {capturedSummons.map(summon => (
                <CapturedSummonCard
                  key={summon.id}
                  summon={summon}
                  isClaimed={claimedSummons.includes(summon.id)}
                  onClaim={handleClaimSummon}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* 战斗统计信息 */}
        {/* This section is removed for brevity to focus on the capture flow, but would be here in a full implementation */}

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
            className={`font-bold py-3 px-8 rounded-lg transition duration-200 ${
              !allCapturedClaimed
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
            disabled={!allCapturedClaimed}
          >
            {isVictory ? '领取奖励并退出' : '退出战斗'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleResultsScreen;
