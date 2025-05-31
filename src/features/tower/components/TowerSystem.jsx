/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-01 05:38:08
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-01 05:38:08
 * @FilePath: \my-mhxy-project\src\features\tower\components\TowerSystem.jsx
 * @Description: 封妖塔系统主界面组件
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  selectTowerProgress, 
  selectCurrentFloor,
  selectDailyAttemptsRemaining
} from '@/store/slices/towerSlice';
import { TOWER_MAX_FLOOR, getTowerFloorConfig } from '@/config/system/towerConfig';
import TowerFloorList from './TowerFloorList';
import TowerFloorDetail from './TowerFloorDetail';
import TowerRewards from './TowerRewards';
import TowerBattlePreparation from './TowerBattlePreparation';

// 封妖塔系统主组件
const TowerSystem = ({ showToast }) => {
  const dispatch = useDispatch();
  
  // 从Redux获取封妖塔进度信息
  const towerProgress = useSelector(selectTowerProgress);
  const currentFloor = useSelector(selectCurrentFloor);
  const dailyAttemptsRemaining = useSelector(selectDailyAttemptsRemaining);
  
  // 本地状态
  const [selectedFloor, setSelectedFloor] = useState(currentFloor);
  const [showBattlePrep, setShowBattlePrep] = useState(false);
  const [selectedTab, setSelectedTab] = useState('floors'); // 'floors', 'rewards', 'records'
  
  // 当前选中楼层的配置
  const [floorConfig, setFloorConfig] = useState(null);
  
  // 当选中楼层变化时，更新楼层配置
  useEffect(() => {
    if (selectedFloor) {
      const config = getTowerFloorConfig(selectedFloor);
      console.log(`楼层${selectedFloor}配置:`, config);
      
      // 如果没有配置，创建一个默认配置
      if (!config) {
        const defaultConfig = {
          name: `第${selectedFloor}层`,
          description: `封妖塔第${selectedFloor}层，挑战并获取奖励。`,
          enemies: [],
          rewards: {
            exp: selectedFloor * 10,
            gold: selectedFloor * 20,
            guaranteedItems: [],
            randomItems: []
          },
          floorEffects: []
        };
        setFloorConfig(defaultConfig);
      } else {
        setFloorConfig(config);
      }
    }
  }, [selectedFloor]);
  
  // 处理楼层选择
  const handleFloorSelect = (floor) => {
    setSelectedFloor(floor);
    setShowBattlePrep(false);
  };
  
  // 处理挑战按钮点击
  const handleChallenge = () => {
    if (dailyAttemptsRemaining <= 0) {
      showToast({
        type: 'error',
        message: '今日挑战次数已用完，请明日再来！'
      });
      return;
    }
    
    setShowBattlePrep(true);
  };
  
  // 处理取消挑战
  const handleCancelChallenge = () => {
    setShowBattlePrep(false);
  };
  
  // 处理开始战斗
  const handleStartBattle = (formationData) => {
    // 在这里处理开始战斗的逻辑，包括派发Redux action等
    dispatch({ 
      type: 'tower/startTowerBattle', 
      payload: { 
        floor: selectedFloor,
        formation: formationData
      } 
    });
    
    // 显示提示
    showToast({
      type: 'info',
      message: `正在进入封妖塔第${selectedFloor}层战斗...`
    });
    
    // 关闭准备界面
    setShowBattlePrep(false);
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-900 text-white rounded-lg overflow-hidden">
      {/* 封妖塔标题 */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 shadow-lg flex-shrink-0">
        <h2 className="text-2xl font-bold text-center">封妖塔</h2>
        <p className="text-center text-gray-300 mt-1">
          挑战封妖塔，获取珍稀奖励！今日剩余挑战次数: {dailyAttemptsRemaining}
        </p>
      </div>
      
      {/* 标签页导航 */}
      <div className="flex bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <button 
          className={`px-4 py-2 ${selectedTab === 'floors' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
          onClick={() => setSelectedTab('floors')}
        >
          <i className="fas fa-tower-observation mr-2"></i>
          塔层
        </button>
        <button 
          className={`px-4 py-2 ${selectedTab === 'rewards' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
          onClick={() => setSelectedTab('rewards')}
        >
          <i className="fas fa-gift mr-2"></i>
          奖励
        </button>
        <button 
          className={`px-4 py-2 ${selectedTab === 'records' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
          onClick={() => setSelectedTab('records')}
        >
          <i className="fas fa-scroll mr-2"></i>
          记录
        </button>
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {selectedTab === 'floors' && (
          <>
            {/* 左侧楼层列表 */}
            <div className="w-1/3  border-r border-gray-700 overflow-hidden">
              <TowerFloorList 
                maxFloor={TOWER_MAX_FLOOR}
                currentProgress={towerProgress}
                selectedFloor={selectedFloor}
                onSelectFloor={handleFloorSelect}
              />
            </div>
            
            {/* 右侧楼层详情 */}
            <div className="w-2/3 overflow-hidden">
              {showBattlePrep ? (
                <div className="h-full overflow-y-auto">
                  <TowerBattlePreparation 
                    floor={selectedFloor}
                    floorConfig={floorConfig}
                    onCancel={handleCancelChallenge}
                    onStartBattle={handleStartBattle}
                  />
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <TowerFloorDetail 
                    floor={selectedFloor}
                    floorConfig={floorConfig}
                    canChallenge={selectedFloor <= towerProgress.highestFloor + 1 && dailyAttemptsRemaining > 0}
                    onChallenge={handleChallenge}
                  />
                </div>
              )}
            </div>
          </>
        )}
        
        {selectedTab === 'rewards' && (
          <div className="w-full overflow-y-auto">
            <TowerRewards 
              towerProgress={towerProgress}
              showToast={showToast}
            />
          </div>
        )}
        
        {selectedTab === 'records' && (
          <div className="w-full overflow-y-auto p-4">
            <h3 className="text-xl font-bold mb-4">挑战记录</h3>
            {/* 这里可以添加挑战记录的展示组件 */}
            <div className="text-gray-400 italic text-center mt-8">
              <i className="fas fa-scroll text-2xl mb-2"></i>
              <p>挑战记录功能即将开放，敬请期待...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TowerSystem;
