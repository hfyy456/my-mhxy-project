/**
 * FormationGrid - 3x3阵型网格组件
 * 支持召唤兽拖拽放置、位置样式、点击交互
 */

import React, { useState, useCallback } from 'react';

const FormationGrid = ({
  grid,
  getSummonDisplayInfo,
  getPositionStyle,
  onSlotClick,
  onDrop,
  draggedItem,
  className = ''
}) => {
  const [dragOverSlot, setDragOverSlot] = useState(null);

  // 处理拖拽进入
  const handleDragOver = useCallback((e, row, col) => {
    e.preventDefault();
    setDragOverSlot({ row, col });
  }, []);

  // 处理拖拽离开
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    // 只有当离开整个网格区域时才清除
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverSlot(null);
    }
  }, []);

  // 处理放置
  const handleDrop = useCallback((e, row, col) => {
    e.preventDefault();
    setDragOverSlot(null);
    
    // 获取拖拽数据
    const dragData = e.dataTransfer.getData('application/json');
    
    if (onDrop) {
      onDrop(row, col, dragData);
    }
  }, [onDrop]);

  // 处理格子点击
  const handleSlotClick = useCallback((row, col) => {
    if (onSlotClick) {
      onSlotClick(row, col);
    }
  }, [onSlotClick]);

  // 渲染单个格子
  const renderSlot = (row, col) => {
    const summonId = grid?.[row]?.[col];
    const summonInfo = getSummonDisplayInfo ? getSummonDisplayInfo(summonId) : null;
    const positionStyle = getPositionStyle ? getPositionStyle(col) : {};
    
    const isDragOver = dragOverSlot?.row === row && dragOverSlot?.col === col;
    const hasSummon = summonId !== null && summonId !== undefined && summonInfo !== null;
    
    // 根据列位置设置不同颜色
    const getPositionColors = (col) => {
      switch(col) {
        case 0: // 后排
          return {
            bg: 'bg-dreamyPurple-400', // 深紫色
            border: 'border-dreamyPurple-300',
            hoverBg: 'hover:bg-dreamyPurple-400/80'
          };
        case 1: // 中排
          return {
            bg: 'bg-dreamyPurple-300', // 中紫色
            border: 'border-dreamyPurple-200',
            hoverBg: 'hover:bg-dreamyPurple-300/80'
          };
        case 2: // 前排
          return {
            bg: 'bg-dreamyPurple-500', // 米色
            border: 'border-dreamyPurple-400',
            hoverBg: 'hover:bg-dreamyPurple-500/80'
          };
        default:
          return {
            bg: 'bg-gray-700',
            border: 'border-gray-600', 
            hoverBg: 'hover:bg-gray-700/80'
          };
      }
    };
    
    const posColors = getPositionColors(col);
    
    return (
      <div
        key={`${row}-${col}`}
        className={`
          relative w-28 h-28 rounded-lg border-2 cursor-pointer transition-all duration-200
          flex flex-col items-center justify-center text-center
          ${isDragOver 
            ? 'border-yellow-400 bg-yellow-400/20 scale-105' 
            : `hover:border-slate-400 ${posColors.border}`
          }
          ${hasSummon ? 'hover:scale-105 hover:bg-red-500/10 hover:border-red-400' : `hover:bg-opacity-80 ${posColors.hoverBg}`}
          ${posColors.bg}
        `}
        onClick={() => handleSlotClick(row, col)}
        onDragOver={(e) => handleDragOver(e, row, col)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, row, col)}
      >
        {/* 位置标识 */}
        <div className="absolute top-1 left-1 text-xs text-white/60 font-mono">
          {row},{col}
        </div>
        
        {/* 位置类型标识 */}
        <div className="absolute top-1 right-1 text-xs text-white/90 font-medium">
          {col === 2 ? '前' : col === 1 ? '中' : '后'}
        </div>
        
        {hasSummon ? (
          // 有召唤兽时的显示
          <div className="flex flex-col items-center justify-center h-full w-full p-1">
            {/* 召唤兽头像区域 */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dreamyPurple-300 to-dreamyPurple-400 flex items-center justify-center mb-1 shadow-lg">
              <span className="text-white text-sm font-bold">
                {summonInfo?.name ? summonInfo.name.charAt(0) : '?'}
              </span>
            </div>
            
            {/* 召唤兽名称 */}
            <div className="text-xs text-white font-medium truncate w-full">
              {summonInfo?.name || '未知'}
            </div>
            
            {/* 等级和战力 */}
            <div className="text-xs text-white/80 flex items-center gap-1">
              {summonInfo?.level && <span>Lv.{summonInfo.level}</span>}
              {summonInfo?.power > 0 && (
                <span className="text-dreamyPurple-100">{summonInfo.power}</span>
              )}
            </div>
          </div>
        ) : (
          // 空位时的显示
          <div className="flex flex-col items-center justify-center h-full w-full text-white/70">
            <div className="text-2xl mb-1">+</div>
            <div className="text-xs">空位</div>
          </div>
        )}
        
        {/* 拖拽覆盖层 */}
        {isDragOver && (
          <div className="absolute inset-0 bg-yellow-400/30 rounded-lg flex items-center justify-center">
            <div className="text-yellow-100 text-sm font-medium">放置到此</div>
          </div>
        )}
        
        {/* 悬停效果 */}
        <div className="absolute inset-0 rounded-lg bg-white/0 hover:bg-white/10 transition-all duration-200" />
      </div>
    );
  };

  if (!grid || !Array.isArray(grid)) {
    return (
      <div className={`flex items-center justify-center w-80 h-80 ${className}`}>
        <div className="text-slate-400 text-center">
          <div className="text-4xl mb-2">⚔️</div>
          <div>阵型加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      {/* 3x3网格 */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
        {grid.map((row, rowIndex) =>
          row.map((_, colIndex) => renderSlot(rowIndex, colIndex))
        )}
      </div>
      
      {/* 拖拽状态提示 */}
      {draggedItem && (
        <div className="text-center mt-2 text-sm text-yellow-400 animate-pulse">
          正在拖拽：{draggedItem.name || '召唤兽'}
        </div>
      )}
    </div>
  );
};

export default FormationGrid; 