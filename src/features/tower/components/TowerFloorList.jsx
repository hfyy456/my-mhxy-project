/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-01 05:44:30
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-01 06:00:29
 * @FilePath: \my-mhxy-project\src\features\tower\components\TowerFloorList.jsx
 * @Description: 封妖塔楼层列表组件
 */

import React from 'react';
import { getTowerFloorConfig } from '@/config/system/towerConfig';

// 封妖塔楼层列表组件
const TowerFloorList = ({ maxFloor, currentProgress, selectedFloor, onSelectFloor }) => {
  // 生成楼层列表
  const generateFloorList = () => {
    const floors = [];
    
    // 从最高层到第一层倒序排列
    for (let i = maxFloor; i >= 1; i--) {
      const floorConfig = getTowerFloorConfig(i);
      
      // 判断楼层状态
      let status = 'locked'; // 默认锁定
      if (i <= currentProgress.highestFloor) {
        status = 'completed'; // 已完成
      } else if (i === currentProgress.highestFloor + 1) {
        status = 'current'; // 当前可挑战
      }
      
      // 判断是否为BOSS层
      const isBossFloor = floorConfig?.isBossFloor || false;
      
      floors.push({
        floor: i,
        name: floorConfig?.name || `第${i}层`,
        status,
        isBossFloor
      });
    }
    
    return floors;
  };
  
  const floors = generateFloorList();
  
  return (
    <div className="h-[550px] flex flex-col">
      <div className="p-4 bg-gray-800 sticky top-0 z-10 border-b border-gray-700 flex-shrink-0">
        <h3 className="text-lg font-bold">封妖塔层数</h3>
        <p className="text-sm text-gray-400">已通关至第 {currentProgress.highestFloor} 层</p>
      </div>
      
      <div className="divide-y divide-gray-700 overflow-y-auto flex-grow">
        {floors.map((floor) => (
          <div 
            key={floor.floor}
            className={`p-3 cursor-pointer transition-colors duration-150 flex items-center ${
              selectedFloor === floor.floor 
                ? 'bg-blue-900 bg-opacity-50' 
                : 'hover:bg-gray-800'
            }`}
            onClick={() => onSelectFloor(floor.floor)}
          >
            {/* 楼层状态图标 */}
            <div className="w-8 h-8 flex items-center justify-center mr-3">
              {floor.status === 'completed' && (
                <span className="text-green-500">
                  <i className="fas fa-check-circle"></i>
                </span>
              )}
              {floor.status === 'current' && (
                <span className="text-yellow-500 animate-pulse">
                  <i className="fas fa-star"></i>
                </span>
              )}
              {floor.status === 'locked' && (
                <span className="text-gray-500">
                  <i className="fas fa-lock"></i>
                </span>
              )}
            </div>
            
            {/* 楼层信息 */}
            <div className="flex-1">
              <div className="flex items-center">
                <span className={`font-bold ${floor.status === 'locked' ? 'text-gray-500' : 'text-white'}`}>
                  {floor.floor}层
                </span>
                
                {floor.isBossFloor && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-red-900 text-red-200 rounded-full">
                    BOSS
                  </span>
                )}
              </div>
              
              <div className={`text-sm ${floor.status === 'locked' ? 'text-gray-600' : 'text-gray-400'}`}>
                {floor.name}
              </div>
            </div>
            
            {/* 箭头图标 */}
            <div className="text-gray-500">
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TowerFloorList;
