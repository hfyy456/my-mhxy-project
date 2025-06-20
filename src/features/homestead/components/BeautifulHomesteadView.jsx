import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectHomesteadPlots,
  selectHomesteadResources,
  selectHomesteadBuildings,
  startBuildingConstruction,
  selectActiveHomesteadTimers,
  fillAllResources,
  instantCompleteAllBuildings,
  upgradeBuildingAction,
  completeBuildingConstruction
} from '@/store/slices/enhancedHomesteadSlice';
import { ENHANCED_BUILDINGS } from '@/config/homestead/enhancedBuildingConfig';
import { HOMESTEAD_GENERAL_CONFIG } from '@/config/homestead/homesteadConfig';
import BuildingDetailModal from './BuildingDetailModal';

// 简化的CSS样式，移除动画
const customStyles = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes bounce-in {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  .shimmer-bg { 
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  .bounce-in { animation: bounce-in 0.6s ease-out; }
  
  .hover-lift:hover { transform: translateY(-2px) scale(1.02); }
  
  .glass-effect {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .countdown-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.75rem;
    transition: all 0.3s ease;
  }
`;

const BeautifulHomesteadView = ({ showToast, onOpenSummonHome }) => {
  const dispatch = useDispatch();
  const plots = useSelector(selectHomesteadPlots);
  const resources = useSelector(selectHomesteadResources);
  const buildings = useSelector(selectHomesteadBuildings);
  const activeTimers = useSelector(selectActiveHomesteadTimers);

  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [showBuildingPanel, setShowBuildingPanel] = useState(false);
  const [hoveredPlotId, setHoveredPlotId] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showBuildingInfo, setShowBuildingInfo] = useState(null);

  // 扩大网格到12x10
  const GRID_SIZE_X = 12;
  const GRID_SIZE_Y = 10;

  // 定期更新计时器
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      activeTimers.forEach(timer => {
        if (timer.completesAt <= now) {
          if (timer.type === 'CONSTRUCTION') {
            dispatch(completeBuildingConstruction({ buildingInstanceId: timer.buildingInstanceId }));
          }
        }
        // 注意：不直接修改timer.remainingTime，因为它可能是只读的
        // remainingTime应该在渲染时实时计算
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimers, dispatch]);

  // 创建网格
  const gridLayout = useMemo(() => {
    const grid = Array(GRID_SIZE_Y).fill(null).map(() => Array(GRID_SIZE_X).fill(null));
    plots.forEach(plot => {
      const row = Math.floor(plot.plotId / GRID_SIZE_X);
      const col = plot.plotId % GRID_SIZE_X;
      if (row < GRID_SIZE_Y && col < GRID_SIZE_X) {
        grid[row][col] = plot;
      }
    });
    return grid;
  }, [plots]);

  // 检查是否可放置
  const canPlaceBuilding = useCallback((buildingId, startRow, startCol) => {
    const building = ENHANCED_BUILDINGS[buildingId];
    if (!building) return false;

    const { width, height } = building.size;
    
    if (startRow + height > GRID_SIZE_Y || startCol + width > GRID_SIZE_X) {
      return false;
    }

    for (let r = startRow; r < startRow + height; r++) {
      for (let c = startCol; c < startCol + width; c++) {
        const plot = gridLayout[r][c];
        if (!plot || plot.buildingId) {
          return false;
        }
      }
    }

    return true;
  }, [gridLayout]);

  // 处理建筑放置
  const handlePlaceBuilding = useCallback((buildingId, startRow, startCol) => {
    if (!canPlaceBuilding(buildingId, startRow, startCol)) {
      showToast?.('❌ 无法在此位置建造！', 'error');
      return;
    }

    const building = ENHANCED_BUILDINGS[buildingId];
    const { width, height } = building.size;
    const plotIds = [];
    
    for (let r = startRow; r < startRow + height; r++) {
      for (let c = startCol; c < startCol + width; c++) {
        const plot = gridLayout[r][c];
        if (plot) plotIds.push(plot.plotId);
      }
    }

    dispatch(startBuildingConstruction({ 
      plotId: plotIds[0], 
      buildingId,
      occupiedPlots: plotIds 
    }));

    setShowBuildingPanel(false);
    setSelectedBuildingId(null);
    showToast?.(`🎉 开始建造${building.name}！`, 'success');
  }, [dispatch, canPlaceBuilding, gridLayout, showToast]);

  // 处理建筑升级
  const handleBuildingUpgrade = useCallback((buildingInstanceId) => {
    dispatch(upgradeBuildingAction({ buildingInstanceId }));
    setShowBuildingInfo(null);
    showToast?.('🚀 建筑升级开始！', 'success');
  }, [dispatch, showToast]);

  // 处理地块点击
  const handlePlotClick = useCallback((row, col) => {
    const plot = gridLayout[row][col];
    console.log('--- Plot Click ---');
    console.log('Clicked plot:', plot);
    console.log('Current buildings state:', buildings);
    if (!plot) return;

    if (selectedBuildingId) {
      handlePlaceBuilding(selectedBuildingId, row, col);
    } else if (plot.buildingId) {
      console.log('Plot has buildingId:', plot.buildingId);
      console.log('Plot has buildingInstanceId:', plot.buildingInstanceId);
      const building = plot.buildingInstanceId ? buildings[plot.buildingInstanceId] : null;
      console.log('Found building instance:', building);
      const buildingConfig = ENHANCED_BUILDINGS[plot.buildingId];
      console.log('Found building config:', buildingConfig);
      
      if (buildingConfig && building) {
        console.log('SUCCESS: Conditions met, showing modal.');
        setShowBuildingInfo({
          config: buildingConfig,
          instance: building,
          plot: plot
        });
      } else {
        console.log('FAILURE: Conditions not met.');
      }
    }
  }, [gridLayout, selectedBuildingId, handlePlaceBuilding, buildings]);

  const handleCloseModal = useCallback(() => {
    setShowBuildingInfo(null);
  }, []);

  // 渲染地块
  const renderPlot = useCallback((plot, row, col) => {
    if (!plot) {
      return (
        <div
          key={`empty-${row}-${col}`}
          className="w-20 h-20 border border-gray-700 bg-gray-900/50 rounded-lg flex items-center justify-center opacity-30 hover-lift"
        >
          <span className="text-gray-600 text-xs">×</span>
        </div>
      );
    }

    const isHovered = hoveredPlotId === plot.plotId;
    const building = plot.buildingInstanceId ? buildings[plot.buildingInstanceId] : null;
    const buildingConfig = building ? ENHANCED_BUILDINGS[building.buildingId] : null;
    
    const isConstructing = building && building.level === 0;
    const timer = activeTimers?.find(t => t.buildingInstanceId === plot.buildingInstanceId);
    const canPlace = selectedBuildingId ? canPlaceBuilding(selectedBuildingId, row, col) : false;

    // 检查是否是大型建筑的非主格子
    const isSecondaryCell = plot.buildingId && plot.isSecondary;
    if (isSecondaryCell) {
      return null; // 不渲染次要格子
    }

    // 计算建筑尺寸用于合并显示
    let cellWidth = 'w-20';
    let cellHeight = 'h-20';
    let gridSpan = '';
    
    if (buildingConfig && building) {
      const { width, height } = buildingConfig.size;
      if (width === 3 && height === 3) {
        cellWidth = 'w-60'; // 3 * 20 = 60
        cellHeight = 'h-60';
        gridSpan = 'col-span-3 row-span-3';
      } else if (width === 2 && height === 2) {
        cellWidth = 'w-40'; // 2 * 20 = 40  
        cellHeight = 'h-40';
        gridSpan = 'col-span-2 row-span-2';
      } else if (width === 2 || height === 2) {
        if (width === 2) {
          cellWidth = 'w-40';
          gridSpan = 'col-span-2';
        }
        if (height === 2) {
          cellHeight = 'h-40';
          gridSpan += ' row-span-2';
        }
      }
    }

    let classes = `${cellWidth} ${cellHeight} border-2 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden shadow-lg hover-lift ${gridSpan}`;
    
    if (plot.buildingId) {
      if (isConstructing) {
        classes += " bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-300";
      } else {
        classes += " bg-gradient-to-br from-blue-400 to-purple-500 border-blue-300";
      }
    } else {
      classes += " bg-gradient-to-br from-green-100 to-emerald-200 border-green-300 hover:border-green-400";
    }

    if (isHovered) {
      classes += " ring-4 ring-white/50 scale-105";
    }

    if (selectedBuildingId && canPlace) {
      classes += " ring-2 ring-blue-400 ring-opacity-60";
    }

    // 实时计算剩余时间
    const now = Date.now();
    const remainingTime = timer ? Math.max(0, timer.completesAt - now) : 0;
    const remainingSeconds = timer ? Math.ceil(remainingTime / 1000) : 0;
    
    // 计算进度条进度
    const totalTime = timer ? (timer.completesAt - timer.startedAt) : 0;
    const elapsedTime = timer ? (now - timer.startedAt) : 0;
    const countdownProgress = timer && totalTime > 0 ? 
      Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100)) : 0;

    return (
      <div
        key={plot.plotId}
        className={classes}
        onClick={() => handlePlotClick(row, col)}
        onMouseEnter={() => setHoveredPlotId(plot.plotId)}
        onMouseLeave={() => setHoveredPlotId(null)}
      >
        {/* 地块内容 */}
        <div className="text-center">
          {plot.buildingId ? (
            <>
              <div className="text-2xl mb-1">{buildingConfig?.icon || '🏠'}</div>
              <div className="text-xs font-semibold truncate px-1 max-w-full">
                {buildingConfig?.name}
              </div>
              {building && building.level > 0 && (
                <div className="text-xs text-yellow-300 font-bold">
                  Lv.{building.level}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-2xl mb-1">🌱</div>
              <div className="text-xs text-emerald-700 font-semibold">空地</div>
            </>
          )}
        </div>

        {/* 悬停提示 */}
        {isHovered && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
            <div className="text-center">
              <div className="font-bold">{plot.buildingId ? buildingConfig?.name : '空地'}</div>
              {selectedBuildingId && (
                <div className="text-xs mt-1">
                  {canPlace ? '✅ 可建造' : '❌ 不可建造'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 建造倒计时遮罩 */}
        {isConstructing && timer && (
          <div 
            className="countdown-mask"
            style={{
              background: `conic-gradient(from 0deg, transparent ${countdownProgress * 3.6}deg, rgba(0,0,0,0.8) ${countdownProgress * 3.6}deg)`
            }}
          >
            <div className="text-center text-white">
              <div className="text-lg font-bold">{remainingSeconds}s</div>
              <div className="text-xs opacity-80">建造中</div>
            </div>
          </div>
        )}
      </div>
    );
  }, [hoveredPlotId, buildings, activeTimers, selectedBuildingId, canPlaceBuilding, handlePlotClick]);

  const availableBuildings = Object.values(ENHANCED_BUILDINGS);

  const resourceIcons = {
    gold: '💰', wood: '🪵', stone: '🪨', herb: '🌿', ore: '⛏️', essence: '✨'
  };

  return (
    <>
      {/* 注入自定义样式 */}
      <style>{customStyles}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white relative overflow-hidden">
        {/* 单行合并头部栏 */}
        <div className="relative z-10 glass-effect border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex justify-between items-center">
              {/* 左侧：标题 */}
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  🏰 梦幻家园
                </h1>
                <div className="text-xs text-gray-300 glass-effect rounded-full px-2 py-1">
                  ✨ 建造你的梦想世界！
                </div>
              </div>
              
              {/* 中间：资源栏 */}
              <div className="flex gap-3">
                {Object.entries(HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES).map(([key, resource]) => (
                  <div key={resource.id} className="glass-effect rounded-lg px-2 py-1 text-center hover-lift">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{resourceIcons[resource.id] || '💎'}</span>
                      <div>
                        <div className="text-xs font-medium text-gray-300">{resource.name}</div>
                        <div className="text-xs font-bold text-yellow-400">
                          {(resources[resource.id] || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 右侧：功能按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTutorial(true)}
                  className="px-3 py-1.5 glass-effect hover:bg-blue-500/30 rounded-lg hover-lift text-sm border border-white/20"
                >
                  ❓ 新手指南
                </button>
                
                <button
                  onClick={() => {
                    // 通过事件通知父组件打开ConfigManager
                    const event = new CustomEvent('openConfigManager');
                    window.dispatchEvent(event);
                  }}
                  className="px-3 py-1.5 glass-effect hover:bg-purple-500/30 rounded-lg hover-lift text-sm border border-white/20"
                >
                  ⚙️ 配置管理
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 主内容 - 更大的地图区域 */}
        <div className="relative z-10 p-4" style={{ height: 'calc(100vh - 120px)' }}>
          {/* 地图区域 */}
          <div className="flex justify-center">
            <div className="glass-effect rounded-2xl p-4 border border-white/20">
              <h2 className="text-xl font-bold text-center mb-4 text-blue-300">
                🗺️ 家园规划图 ({GRID_SIZE_X}×{GRID_SIZE_Y})
              </h2>
              
              <div 
                className="grid gap-1 mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${GRID_SIZE_X}, 1fr)`,
                  gridTemplateRows: `repeat(${GRID_SIZE_Y}, 1fr)`
                }}
              >
                {gridLayout.map((row, rowIndex) =>
                  row.map((plot, colIndex) => renderPlot(plot, rowIndex, colIndex))
                )}
              </div>
            </div>
          </div>

          {/* 提示区 */}
          <div className="mt-4 max-w-4xl mx-auto glass-effect rounded-xl p-4">
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">💡</span>
              <div className="text-center">
                {selectedBuildingId ? (
                  <div>
                    <span className="font-bold text-blue-300">🔨 建造模式：</span>
                    <span className="ml-2">点击绿色区域放置 <span className="text-yellow-400 font-bold">{ENHANCED_BUILDINGS[selectedBuildingId]?.name}</span></span>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold text-blue-300">💫 探索模式：</span>
                    <span className="ml-2">点击"开始建造"选择建筑，或点击已有建筑查看详情和升级</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 悬浮建筑工坊 */}
        {showBuildingPanel && (
          <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40">
            <div className="w-80 glass-effect rounded-2xl border border-white/20 overflow-hidden flex flex-col shadow-2xl" style={{ maxHeight: '70vh' }}>
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">🏗️ 建筑工坊</h3>
                    <p className="text-sm opacity-90 mt-1">选择要建造的建筑</p>
                  </div>
                  <button
                    onClick={() => setShowBuildingPanel(false)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                  >
                    ❌
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-3">
                  {availableBuildings.map(building => (
                    <div
                      key={building.id}
                      className={`p-4 rounded-xl cursor-pointer transition-all border-2 hover-lift ${
                        selectedBuildingId === building.id
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-400'
                          : 'glass-effect border-white/20 hover:border-white/40'
                      }`}
                      onClick={() => setSelectedBuildingId(
                        selectedBuildingId === building.id ? null : building.id
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{building.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-base mb-1">{building.name}</div>
                          <div className="text-sm text-gray-300 mb-2 line-clamp-2">{building.description}</div>
                          <div className="text-xs glass-effect text-blue-300 px-2 py-1 rounded-full inline-block">
                            📐 {building.size.width}×{building.size.height}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 底部按钮栏 */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex gap-3">
            <button
              onClick={() => setShowBuildingPanel(!showBuildingPanel)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all hover-lift glass-effect border border-white/20 ${
                showBuildingPanel ? 'bg-red-600/50' : 'bg-green-600/50'
              }`}
            >
              {showBuildingPanel ? '❌ 取消建造' : '🏗️ 开始建造'}
            </button>
            
            <button
              onClick={() => dispatch(fillAllResources())}
              className="px-4 py-2 glass-effect hover:bg-purple-500/30 rounded-xl hover-lift text-sm border border-white/20"
            >
              💰 满资源
            </button>
            <button
              onClick={() => dispatch(instantCompleteAllBuildings())}
              className="px-4 py-2 glass-effect hover:bg-orange-500/30 rounded-xl hover-lift text-sm border border-white/20"
            >
              ⚡ 完成建造
            </button>
          </div>
        </div>

        {/* 建筑信息弹窗 - 增加升级功能 */}
        {showBuildingInfo && (
          <BuildingDetailModal
            isOpen={!!showBuildingInfo}
            onClose={handleCloseModal}
            buildingInstance={showBuildingInfo.instance}
            buildingConfig={showBuildingInfo.config}
            onUpgrade={handleBuildingUpgrade}
            showToast={showToast}
            onStartFusion={onOpenSummonHome}
          />
        )}

        {/* 新手教程 */}
        {showTutorial && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-effect rounded-2xl p-6 max-w-lg">
              <h3 className="text-2xl font-bold mb-4 text-center text-yellow-400">
                🎮 家园建造攻略
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 glass-effect rounded-xl">
                  <span className="text-2xl">🏛️</span>
                  <div>
                    <div className="font-bold text-yellow-400 mb-1">第一步：建造城镇大厅</div>
                    <div className="text-gray-300 text-sm">这是最重要的核心建筑，解锁其他建筑类型</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 glass-effect rounded-xl">
                  <span className="text-2xl">⛏️</span>
                  <div>
                    <div className="font-bold text-blue-400 mb-1">第二步：建造资源建筑</div>
                    <div className="text-gray-300 text-sm">伐木场、采矿场等提供持续资源收入</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 glass-effect rounded-xl">
                  <span className="text-2xl">🏪</span>
                  <div>
                    <div className="font-bold text-green-400 mb-1">第三步：解锁功能建筑</div>
                    <div className="text-gray-300 text-sm">商店、制作台、训练场等提供游戏功能</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 glass-effect rounded-xl">
                  <span className="text-2xl">🚀</span>
                  <div>
                    <div className="font-bold text-purple-400 mb-1">第四步：升级建筑</div>
                    <div className="text-gray-300 text-sm">点击已建造的建筑可以查看详情和升级</div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowTutorial(false)}
                className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl py-3 font-bold transition-all hover-lift"
              >
                🎯 开始建造我的家园！
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BeautifulHomesteadView; 