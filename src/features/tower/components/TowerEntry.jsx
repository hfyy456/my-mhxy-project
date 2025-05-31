/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-01 05:49:30
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-01 05:49:30
 * @FilePath: \my-mhxy-project\src\features\tower\components\TowerEntry.jsx
 * @Description: 封妖塔入口组件
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { selectTowerProgress, selectDailyAttemptsRemaining } from '@/store/slices/towerSlice';

// 封妖塔入口组件
const TowerEntry = ({ onOpenTower }) => {
  // 从Redux获取封妖塔进度信息
  const towerProgress = useSelector(selectTowerProgress);
  const dailyAttemptsRemaining = useSelector(selectDailyAttemptsRemaining);
  
  return (
    <div 
      className="relative cursor-pointer group"
      onClick={onOpenTower}
    >
      {/* 封妖塔图标 */}
      <div className="w-12 h-12 bg-purple-900 rounded-lg flex items-center justify-center shadow-lg group-hover:bg-purple-800 transition-all duration-200">
        <i className="fas fa-tower-observation text-xl text-white"></i>
      </div>
      
      {/* 封妖塔名称 */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        封妖塔
      </div>
      
      {/* 挑战次数提示 */}
      {dailyAttemptsRemaining > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {dailyAttemptsRemaining}
        </div>
      )}
      
      {/* 新内容提示（如果有新奖励可领取） */}
      {towerProgress.highestFloor > 0 && 
       towerProgress.highestFloor % 10 === 0 && 
       !towerProgress.collectedRewards.includes(towerProgress.highestFloor) && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export default TowerEntry;
