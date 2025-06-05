/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-06 08:00:00
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-06 07:45:15
 */
import React, { useState, useEffect } from 'react';

/**
 * 地图生成可视化组件
 * 显示地图生成的详细进度和效果
 */
const MapGenerationVisualizer = ({ 
  isVisible = false, 
  currentRegion = '', 
  totalRegions = 0, 
  completedRegions = 0 
}) => {
  const [animationGrid, setAnimationGrid] = useState([]);
  const [generatedCells, setGeneratedCells] = useState(new Set());

  // 地图区域类型到颜色的映射
  const regionColors = {
    'central_town': 'from-amber-500 to-amber-600',
    'eastern_forest': 'from-green-500 to-green-600',
    'northern_mountains': 'from-gray-500 to-gray-600',
    'western_lake': 'from-blue-500 to-blue-600',
    'southern_desert': 'from-yellow-500 to-orange-500',
    'forest_cave': 'from-purple-500 to-purple-600',
    'default': 'from-slate-500 to-slate-600'
  };

  // 初始化动画网格
  useEffect(() => {
    if (isVisible) {
      const gridSize = 12;
      const grid = [];
      for (let i = 0; i < gridSize * gridSize; i++) {
        grid.push({
          id: i,
          active: false,
          type: 'empty',
          delay: Math.random() * 1000
        });
      }
      setAnimationGrid(grid);
      setGeneratedCells(new Set());
    }
  }, [isVisible]);

  // 模拟地图生成动画
  useEffect(() => {
    if (!isVisible || !currentRegion) return;

    const interval = setInterval(() => {
      setGeneratedCells(prev => {
        const newSet = new Set(prev);
        const remainingCells = animationGrid
          .map((_, index) => index)
          .filter(index => !newSet.has(index));
        
        if (remainingCells.length > 0) {
          // 随机选择一些未生成的格子
          const cellsToAdd = Math.min(3, remainingCells.length);
          for (let i = 0; i < cellsToAdd; i++) {
            const randomIndex = Math.floor(Math.random() * remainingCells.length);
            newSet.add(remainingCells[randomIndex]);
            remainingCells.splice(randomIndex, 1);
          }
        }
        
        return newSet;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isVisible, currentRegion, animationGrid]);

  // 获取当前区域的颜色
  const getCurrentRegionColor = () => {
    return regionColors[currentRegion] || regionColors.default;
  };

  // 获取地形类型图标
  const getTerrainIcon = (cellIndex) => {
    const icons = ['fa-tree', 'fa-mountain', 'fa-water', 'fa-home', 'fa-grass'];
    return icons[cellIndex % icons.length];
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4">
      <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 border-b border-slate-700/50">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              <i className="fas fa-map mr-3 text-emerald-400"></i>
              正在生成游戏世界
            </h2>
            <p className="text-slate-300 text-lg">
              创造独特的冒险地图，每个区域都充满惊喜
            </p>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="p-8">
          {/* 当前生成区域信息 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-4 bg-slate-700/50 rounded-xl px-6 py-4">
              <div className="text-2xl">
                <i className="fas fa-cogs text-emerald-400 animate-spin"></i>
              </div>
              <div>
                <div className="text-white font-semibold text-lg">
                  正在生成：{currentRegion || '未知区域'}
                </div>
                <div className="text-slate-400 text-sm">
                  进度：{completedRegions} / {totalRegions} 个区域
                </div>
              </div>
            </div>
          </div>

          {/* 地图生成可视化网格 */}
          <div className="mb-8">
            <div className="bg-slate-900/50 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 text-center">
                <i className="fas fa-map-marked-alt mr-2 text-emerald-400"></i>
                实时地图生成
              </h3>
              
              <div className="grid grid-cols-12 gap-1 max-w-md mx-auto">
                {animationGrid.map((cell, index) => (
                  <div
                    key={cell.id}
                    className={`aspect-square rounded-sm transition-all duration-500 flex items-center justify-center text-xs ${
                      generatedCells.has(index)
                        ? `bg-gradient-to-br ${getCurrentRegionColor()} text-white shadow-lg`
                        : 'bg-slate-700/30 text-slate-600'
                    }`}
                    style={{
                      animationDelay: `${cell.delay}ms`
                    }}
                  >
                    {generatedCells.has(index) && (
                      <i className={`fas ${getTerrainIcon(index)} animate-bounce`}></i>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 区域生成状态 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* 已完成的区域 */}
            <div className="bg-slate-700/30 rounded-xl p-4">
              <h4 className="text-emerald-400 font-semibold mb-3 flex items-center">
                <i className="fas fa-check-circle mr-2"></i>
                已完成区域 ({completedRegions})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Array.from({ length: completedRegions }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-emerald-500/20 rounded-lg px-3 py-2"
                  >
                    <span className="text-emerald-300 text-sm">区域 {index + 1}</span>
                    <i className="fas fa-check text-emerald-400"></i>
                  </div>
                ))}
              </div>
            </div>

            {/* 待生成的区域 */}
            <div className="bg-slate-700/30 rounded-xl p-4">
              <h4 className="text-slate-400 font-semibold mb-3 flex items-center">
                <i className="fas fa-clock mr-2"></i>
                待生成区域 ({totalRegions - completedRegions})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Array.from({ length: Math.max(0, totalRegions - completedRegions) }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-600/20 rounded-lg px-3 py-2"
                  >
                    <span className="text-slate-400 text-sm">区域 {completedRegions + index + 1}</span>
                    <i className="fas fa-hourglass-half text-slate-500"></i>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 生成统计 */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-white font-semibold mb-4 text-center">
              <i className="fas fa-chart-bar mr-2 text-blue-400"></i>
              生成统计
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-500/20 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-400">{totalRegions}</div>
                <div className="text-blue-300 text-sm">总区域数</div>
              </div>
              <div className="bg-emerald-500/20 rounded-lg p-3">
                <div className="text-2xl font-bold text-emerald-400">{completedRegions}</div>
                <div className="text-emerald-300 text-sm">已完成</div>
              </div>
              <div className="bg-amber-500/20 rounded-lg p-3">
                <div className="text-2xl font-bold text-amber-400">
                  {Math.round((completedRegions / Math.max(totalRegions, 1)) * 100)}%
                </div>
                <div className="text-amber-300 text-sm">完成度</div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部进度条 */}
        <div className="bg-slate-800/50 p-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 text-sm">整体进度</span>
            <span className="text-slate-300 text-sm">
              {Math.round((completedRegions / Math.max(totalRegions, 1)) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-1000 ease-out"
              style={{ width: `${(completedRegions / Math.max(totalRegions, 1)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapGenerationVisualizer;
