/*
 * @Author: Claude
 * @Date: 2025-01-27
 * @Description: 行动顺序时间轴组件 - 纯UI展示组件
 */
import React from 'react';

const ActionOrderTimeline = ({ 
  // 基础数据
  units = [],
  currentTurnUnitId,
  
  // 预计算的数据
  sortedUnits = [],
  speedTicks = [],
  
  // 配置选项
  showLegend = true,
  showSpeedTicks = true,
  disabled = false,
  
  // 回调函数
  onUnitClick,
  onUnitHover,
  
  // 样式配置
  maxWidth = "100%",
  height = "auto"
}) => {
  // 处理无单位的情况
  if (!units || units.length === 0) {
    return (
      <div className={`w-full bg-gradient-to-r from-gray-900/80 to-gray-800/80 rounded-lg border border-gray-700/50 p-2 mb-2 shadow-md ${disabled ? 'opacity-50' : ''}`} style={{ maxWidth }}>
        <div className="flex items-center justify-center py-4">
          <div className="text-gray-400 text-sm">暂无单位数据</div>
        </div>
      </div>
    );
  }

  // 获取要显示的单位列表，优先使用排序后的数据
  const displayUnits = sortedUnits.length > 0 ? sortedUnits : units;

  const handleUnitClick = (unit) => {
    if (disabled || !onUnitClick) return;
    onUnitClick(unit);
  };

  const handleUnitHover = (unit, isHovering) => {
    if (disabled || !onUnitHover) return;
    onUnitHover(unit, isHovering);
  };

  return (
    <div 
      className={`w-full bg-gradient-to-r from-gray-900/80 to-gray-800/80 rounded-lg border border-gray-700/50 p-2 mb-2 shadow-md ${disabled ? 'opacity-50 pointer-events-none' : ''}`} 
      style={{ maxWidth, height }}
    >
      {/* 标题和图例 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center mr-2 border border-blue-800/50">
            <span className="text-blue-300 text-xs">⏱️</span>
          </div>
          <div className="text-blue-300 font-bold text-sm">行动顺序时间轴</div>
        </div>
        
        {showLegend && (
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
        )}
      </div>
      
      {/* 时间轴容器 */}
      <div className="relative w-full h-10 bg-gray-800/70 rounded-xl overflow-hidden border border-gray-700/50 shadow-inner px-8">
        {/* 进度条背景 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-purple-900/10 to-red-900/20"></div>
        
        {/* 速度刻度标记 */}
        {showSpeedTicks && speedTicks.length > 0 && (
          <div className="absolute inset-x-0 top-0 h-full">
            {speedTicks.map((tick, index) => (
              <div 
                key={index} 
                className="absolute top-0 h-full w-px bg-gray-600/50 flex flex-col items-center"
                style={{ left: tick.position }}
              >
                <div className="absolute bottom-1 transform -translate-x-1/2 text-[10px] text-gray-400">
                  {tick.value}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* 单位标记 */}
        {displayUnits.map((unit, index) => {
          // 确定单位类型的颜色
          const bgColor = unit.isPlayerUnit ? 'bg-blue-600' : 'bg-red-600';
          const borderColor = unit.isPlayerUnit ? 'border-blue-400' : 'border-red-400';
          
          // 当前行动单位的特殊样式
          const isCurrentUnit = unit.id === currentTurnUnitId;
          const currentUnitStyle = isCurrentUnit ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-gray-800 scale-125 animate-pulse' : '';
          
          // 已倒下单位的样式
          const defeatedStyle = unit.isDefeated ? 'opacity-40 grayscale' : '';
          
          // 可交互的样式
          const interactiveStyle = (onUnitClick || onUnitHover) && !disabled ? 'cursor-pointer hover:scale-110' : '';
          
          return (
            <div 
              key={unit.id}
              className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-7 h-7 ${bgColor} ${borderColor} ${currentUnitStyle} ${defeatedStyle} ${interactiveStyle} rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 shadow-md`}
              style={{ left: unit.timelinePosition || `${10 + (index * 70 / Math.max(1, displayUnits.length - 1))}%` }}
              title={unit.tooltipText || `${unit.name} (速度: ${unit.stats?.speed || '未知'})`}
              onClick={() => handleUnitClick(unit)}
              onMouseEnter={() => handleUnitHover(unit, true)}
              onMouseLeave={() => handleUnitHover(unit, false)}
            >
              <span className="text-white text-xs font-bold">
                {unit.displayIndex !== undefined ? unit.displayIndex : index + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActionOrderTimeline;
