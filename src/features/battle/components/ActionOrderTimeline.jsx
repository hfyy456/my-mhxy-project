/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-23 00:45:38
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-23 01:26:56
 * @FilePath: \my-mhxy-project\src\features\battle\components\ActionOrderTimeline.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from 'react';

const ActionOrderTimeline = ({ units, currentTurnUnitId }) => {
  if (!units || units.length === 0) {
    return null;
  }

  // 按速度排序单位，速度高的先行动
  const sortedUnits = [...units].sort((a, b) => b.stats.speed - a.stats.speed);
  
  // 计算速度范围，用于动态生成刻度
  // 确保即使没有单位也能正常显示
  const speeds = units.map(unit => unit.stats.speed);
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 100;
  const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0;
  
  // 计算刻度间隔，生成5个刻度点
  const speedRange = Math.max(1, maxSpeed - minSpeed); // 防止除以0
  const tickInterval = speedRange / 4; // 分成4份，产生5个点
  
  return (
    <div className="w-full bg-gradient-to-r from-gray-900/80 to-gray-800/80 rounded-lg border border-gray-700/50 p-2 mb-2 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center mr-2 border border-blue-800/50">
            <span className="text-blue-300 text-xs">⏱️</span>
          </div>
          <div className="text-blue-300 font-bold text-sm">行动顺序时间轴</div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-600 border border-blue-400 mr-1"></div>
            <span className="text-xs text-blue-300">我方单位</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-600 border border-red-400 mr-1"></div>
            <span className="text-xs text-red-300">敌方单位</span>
          </div>
        </div>
      </div>
      
      <div className="relative w-full h-10 bg-gray-800/70 rounded-xl overflow-hidden border border-gray-700/50 shadow-inner px-8">
        {/* 进度条背景 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-purple-900/10 to-red-900/20"></div>
        
        {/* 速度刻度标记 */}
        <div className="absolute inset-x-0 top-0 h-full">
          {Array.from({ length: 5 }).map((_, i) => {
            // 计算当前刻度的速度值，从左到右速度值递增
            const speedValue = minSpeed + (i * tickInterval);
            // 计算位置百分比，从左到右
            const position = `${i * 25}%`;
            return (
              <div 
                key={i} 
                className="absolute top-0 h-full w-px bg-gray-600/50 flex flex-col items-center"
                style={{ left: position }}
              >
                <div className="absolute bottom-1 transform -translate-x-1/2 text-[10px] text-gray-400">
                  {Math.round(speedValue)}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 单位标记 */}
        {sortedUnits.map((unit, index) => {
          // 计算位置百分比，基于单位速度属性和当前速度范围
          // 将单位速度映射到0-100%的范围内
          // 速度越高，越靠右边
          const speedPercent = speedRange > 0 
            ? ((unit.stats.speed - minSpeed) / speedRange) * 100 
            : 50; // 如果所有单位速度相同，则平均分布
          // 考虑到内边距，使用相对位置，留出10%的左右内边距
          const position = `calc(10% + ${speedPercent * 0.8}%)`;
          
          // 确定单位类型的颜色
          const bgColor = unit.isPlayerUnit ? 'bg-blue-600' : 'bg-red-600';
          const borderColor = unit.isPlayerUnit ? 'border-blue-400' : 'border-red-400';
          const textColor = unit.isPlayerUnit ? 'text-blue-300' : 'text-red-300';
          
          // 当前行动单位的特殊样式
          const isCurrentUnit = unit.id === currentTurnUnitId;
          const currentUnitStyle = isCurrentUnit ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-gray-800 scale-125 animate-pulse' : '';
          
          // 已倒下单位的样式
          const defeatedStyle = unit.isDefeated ? 'opacity-40 grayscale' : '';
          
          return (
            <div 
              key={unit.id}
              className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-7 h-7 ${bgColor} ${borderColor} ${currentUnitStyle} ${defeatedStyle} rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 shadow-md hover:scale-110`}
              style={{ left: position }}
              title={`${unit.name} (速度: ${unit.stats.speed})`}
            >
              <span className="text-white text-xs font-bold">{index + 1}</span>
            </div>
          );
        })}
      </div>
    
    </div>
  );
};

export default ActionOrderTimeline;
