/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-01 05:47:30
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-01 05:47:30
 * @FilePath: \my-mhxy-project\src\features\tower\components\TowerRewards.jsx
 * @Description: 封妖塔奖励组件
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import { TOWER_MAX_FLOOR, getTowerFloorConfig } from '@/config/system/towerConfig';

// 封妖塔奖励组件
const TowerRewards = ({ towerProgress, showToast }) => {
  const dispatch = useDispatch();
  
  // 生成里程碑奖励列表
  const generateMilestoneRewards = () => {
    const milestones = [10, 20, 30, 40, 50, 60]; // BOSS层
    const rewards = [];
    
    milestones.forEach(floor => {
      const floorConfig = getTowerFloorConfig(floor);
      if (!floorConfig) return;
      
      // 检查是否已领取
      const isCollected = towerProgress.collectedRewards.includes(floor);
      // 检查是否可领取（已通过该层但未领取）
      const isAvailable = towerProgress.highestFloor >= floor && !isCollected;
      // 检查是否锁定（未通过该层）
      const isLocked = towerProgress.highestFloor < floor;
      
      rewards.push({
        floor,
        name: `第${floor}层 ${floorConfig.name || 'BOSS'}奖励`,
        description: floorConfig.description || `通关第${floor}层后可领取`,
        rewards: floorConfig.rewards || [],
        isCollected,
        isAvailable,
        isLocked
      });
    });
    
    return rewards;
  };
  
  // 处理领取奖励
  const handleClaimReward = (floor) => {
    // 派发领取奖励的action
    dispatch({
      type: 'tower/claimTowerReward',
      payload: { floor }
    });
    
    // 显示提示
    showToast({
      type: 'success',
      message: `成功领取第${floor}层奖励！`
    });
  };
  
  const milestoneRewards = generateMilestoneRewards();
  
  return (
    <div className="h-full p-4 overflow-y-auto">
      {/* 标题 */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold">封妖塔奖励</h3>
        <p className="text-gray-400 mt-1">
          挑战封妖塔，获取珍稀奖励！已通关至第 {towerProgress.highestFloor} 层
        </p>
      </div>
      
      {/* 里程碑奖励 */}
      <div className="mb-6">
        <h4 className="text-lg font-bold mb-3 flex items-center">
          <i className="fas fa-trophy text-yellow-500 mr-2"></i>
          BOSS层奖励
        </h4>
        
        <div className="space-y-4">
          {milestoneRewards.map(reward => (
            <div 
              key={reward.floor}
              className={`bg-gray-800 rounded-lg p-4 border ${
                reward.isCollected 
                  ? 'border-gray-700' 
                  : reward.isAvailable 
                    ? 'border-yellow-500' 
                    : 'border-gray-700'
              }`}
            >
              {/* 奖励标题 */}
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-lg flex items-center">
                  {reward.isCollected && (
                    <span className="text-green-500 mr-2">
                      <i className="fas fa-check-circle"></i>
                    </span>
                  )}
                  {reward.isAvailable && (
                    <span className="text-yellow-500 animate-pulse mr-2">
                      <i className="fas fa-exclamation-circle"></i>
                    </span>
                  )}
                  {reward.isLocked && (
                    <span className="text-gray-500 mr-2">
                      <i className="fas fa-lock"></i>
                    </span>
                  )}
                  {reward.name}
                </h5>
                
                {reward.isAvailable && (
                  <button
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors duration-150"
                    onClick={() => handleClaimReward(reward.floor)}
                  >
                    领取
                  </button>
                )}
                
                {reward.isCollected && (
                  <span className="px-3 py-1 bg-green-900 text-green-300 rounded-lg">
                    已领取
                  </span>
                )}
                
                {reward.isLocked && (
                  <span className="px-3 py-1 bg-gray-700 text-gray-500 rounded-lg">
                    未解锁
                  </span>
                )}
              </div>
              
              {/* 奖励描述 */}
              <p className="text-gray-400 text-sm mt-1">
                {reward.description}
              </p>
              
              {/* 奖励列表 */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {reward.rewards.map((item, index) => (
                  <div 
                    key={index}
                    className={`flex items-center p-2 rounded ${
                      reward.isCollected 
                        ? 'bg-gray-700 opacity-50' 
                        : 'bg-gray-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                      reward.isCollected ? 'bg-gray-600' : 'bg-gray-600'
                    }`}>
                      <i className={`fas fa-${
                        item.type === 'item' 
                          ? 'box' 
                          : item.type === 'currency' 
                            ? 'coins' 
                            : 'gem'
                      } ${
                        reward.isCollected ? 'text-gray-400' : 'text-yellow-500'
                      }`}></i>
                    </div>
                    <div>
                      <div className={`font-bold text-sm ${
                        reward.isCollected ? 'text-gray-400' : 'text-white'
                      }`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.amount ? `x${item.amount}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 累计通关奖励 */}
      <div className="mb-6">
        <h4 className="text-lg font-bold mb-3 flex items-center">
          <i className="fas fa-star text-blue-500 mr-2"></i>
          累计通关奖励
        </h4>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="relative pt-4">
            {/* 进度条 */}
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                style={{ width: `${(towerProgress.highestFloor / TOWER_MAX_FLOOR) * 100}%` }}
              ></div>
            </div>
            
            {/* 进度点 */}
            {[10, 20, 30, 40, 50, 60].map(milestone => (
              <div 
                key={milestone}
                className={`absolute top-0 transform -translate-x-1/2 flex flex-col items-center`}
                style={{ left: `${(milestone / TOWER_MAX_FLOOR) * 100}%` }}
              >
                <div className={`w-4 h-4 rounded-full ${
                  towerProgress.highestFloor >= milestone 
                    ? 'bg-purple-500' 
                    : 'bg-gray-600'
                }`}></div>
                <span className="text-xs mt-1">{milestone}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>{TOWER_MAX_FLOOR}</span>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-gray-400">
              当前进度: {towerProgress.highestFloor} / {TOWER_MAX_FLOOR}
            </p>
          </div>
        </div>
      </div>
      
      {/* 每日挑战奖励 */}
      <div className="mb-6">
        <h4 className="text-lg font-bold mb-3 flex items-center">
          <i className="fas fa-calendar-day text-green-500 mr-2"></i>
          每日挑战奖励
        </h4>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-center">
            每日首次挑战封妖塔可获得额外奖励
          </p>
          
          <div className="mt-4 flex justify-center">
            <div className={`px-4 py-2 rounded-lg ${
              towerProgress.dailyRewardClaimed 
                ? 'bg-gray-700 text-gray-500' 
                : 'bg-green-700 text-white'
            }`}>
              {towerProgress.dailyRewardClaimed 
                ? '今日已领取' 
                : '今日未领取'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TowerRewards;
