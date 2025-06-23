import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useHomesteadManager } from '@/hooks/useHomesteadManager';
import { usePlayerManager } from '@/hooks/usePlayerManager';
import { ENHANCED_BUILDINGS } from '@/config/homestead/enhancedBuildingConfig';
import { HOMESTEAD_GENERAL_CONFIG } from '@/config/homestead/homesteadConfig';
import BuildingDetailModal from './BuildingDetailModal';

// 简化的CSS样式，移除动画
const customStyles = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes slide-in-from-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .slide-in-from-right {
    animation: slide-in-from-right 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
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
  const { homesteadState, homesteadManager } = useHomesteadManager();
  const { plots, buildings, activeTimers } = homesteadState;

  const { player, manager: playerManager } = usePlayerManager();
  const resources = player?.resources || {};

  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [showBuildingPanel, setShowBuildingPanel] = useState(false);
  const [hoveredPlotId, setHoveredPlotId] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showBuildingInfo, setShowBuildingInfo] = useState(null);

  // 扩大网格到12x10
  const GRID_SIZE_X = 12;
  const GRID_SIZE_Y = 10;

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

    //直接调用管理器方法
    const result = homesteadManager.startBuildingConstruction({ 
      plotId: plotIds[0], 
      buildingId,
      occupiedPlots: plotIds 
    });

    if (result.success) {
    setShowBuildingPanel(false);
    setSelectedBuildingId(null);
    showToast?.(`🎉 开始建造${building.name}！`, 'success');
    } else {
      showToast?.(`❌ ${result.message}`, 'error');
    }
  }, [homesteadManager, canPlaceBuilding, gridLayout, showToast]);

  // 处理建筑升级
  const handleBuildingUpgrade = useCallback((buildingInstanceId) => {
    console.log(`[View] Attempting to upgrade building: ${buildingInstanceId}`);
    try {
      const result = homesteadManager.startBuildingUpgrade(buildingInstanceId);
      console.log('[View] Result from startBuildingUpgrade:', result);

      if (result && result.success) {
        console.log('[View] Upgrade started successfully.');
        showToast?.('🚀 建筑升级开始！', 'success');
      } else {
        const errorMessage = result ? result.message : 'An unknown error occurred during upgrade.';
        console.error(`[View] Upgrade failed: ${errorMessage}`);
        alert(`升级失败: ${errorMessage}`); // 使用 alert 确保消息可见
      }
    } catch (error) {
      console.error('[View] An exception was thrown during startBuildingUpgrade:', error);
      alert(`升级时发生严重错误: ${error.message}`); // 显示异常信息
    } finally {
      setShowBuildingInfo(null);
    }
  }, [homesteadManager, showToast]);

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

  const isFusionUnlocked = useMemo(() => 
    homesteadState.unlockedFeatures?.summonCenterFeatures?.includes('fusion') || false,
    [homesteadState.unlockedFeatures]
  );

  const handleOpenBuildingPanel = () => {
    const townHallExists = Object.values(buildings).some(b => b.buildingId === 'town_hall' && b.status !== 'constructing');
    if (!townHallExists && Object.keys(buildings).length > 0) {
      showToast?.('需要先完成城镇大厅的建造才能解锁更多建筑！', 'warning');
      return;
    }
    setShowBuildingPanel(true);
  };

  const availableBuildings = useMemo(() => {
    return homesteadManager.getAllBuildingsWithUnlockStatus();
  }, [homesteadState, homesteadManager]);

  // 渲染地块
  const renderPlot = useCallback((plot, row, col) => {
    // 这是一个后备，理论上gridLayout中不应该有null
    if (!plot) { 
      return null;
    }

    // 正确的逻辑第一步：如果是大型建筑的次要地块，则不渲染它
    if (plot.isSecondary) {
      return null;
    }

    const building = plot.buildingInstanceId ? buildings[plot.buildingInstanceId] : null;
    const buildingConfig = building ? ENHANCED_BUILDINGS[building.buildingId] : null;

    // 正确的逻辑第二步：如果地块上有建筑，则渲染建筑
    if (building && buildingConfig) {
      const { width, height } = buildingConfig.size;
      const timer = activeTimers.find(t => t.buildingInstanceId === building.id);
      
      let progressOverlay = null;

      // 升级或建造中的UI叠加层
      if ((building.status === 'constructing' || building.status === 'upgrading') && timer) {
        const isUpgrading = building.status === 'upgrading';
        const totalTime = (timer.completesAt - (building.startedAt || Date.now())) || 1;
        const elapsedTime = Date.now() - (building.startedAt || Date.now());
        const progress = Math.min(100, (elapsedTime / totalTime) * 100);
        const remainingTime = Math.max(0, Math.ceil((timer.completesAt - Date.now()) / 1000));
        
        progressOverlay = (
          <div className="absolute inset-0 bg-gray-900 rounded-lg bg-opacity-80 flex flex-col items-center justify-center text-white p-1 text-center pointer-events-none">
            <span className="text-xs font-bold leading-tight">{buildingConfig.name}</span>
            <span className={`text-xs mt-1 ${isUpgrading ? 'text-purple-400' : 'text-yellow-400'}`}>
              {isUpgrading ? `升级至 Lv.${building.upgradingTo}` : '建造中...'}
            </span>
            <span className="text-sm font-mono mt-1">{remainingTime}s</span>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-600 rounded-b-lg overflow-hidden">
              <div className={`h-full ${isUpgrading ? 'bg-purple-500' : 'bg-green-500'}`} style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        );
      }

      const generator = homesteadState.resourceGenerators?.find(g => g.buildingInstanceId === building.id);
      const uncollectedAmount = generator ? Math.floor(Object.values(generator.uncollectedAmounts).reduce((sum, val) => sum + val, 0)) : 0;

      return (
        <div
          key={plot.plotId}
          className="relative transition-transform duration-200 ease-out hover-lift cursor-pointer"
          style={{ gridColumnEnd: `span ${width}`, gridRowEnd: `span ${height}` }}
          onClick={() => handlePlotClick(row, col)}
        >
          <img src={buildingConfig.image} alt={buildingConfig.name} className="w-full h-full object-cover rounded-lg shadow-md" />
          {building.level > 0 && (
            <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              <span>Lv. {building.level}</span>
            </div>
          )}
          {progressOverlay}
          {uncollectedAmount > 0 && building.status === 'idle' && (
            <div 
              className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg cursor-pointer animate-bounce z-10"
              onClick={(e) => {
                e.stopPropagation();
                const result = homesteadManager.collectResourcesFromBuilding(building.id);
                if (result.success) {
                  const collectedTotal = Object.values(result.collected).reduce((sum, val) => sum + Math.floor(val), 0);
                  showToast?.(`💰 成功收集 ${collectedTotal} 资源!`, 'success');
                }
              }}
            >
              💰
            </div>
          )}
        </div>
      );
    }
    
    // 正确的逻辑第三步：如果地块为空，则渲染可建造的空地
    const clickHandler = selectedBuildingId ? () => handlePlotClick(row, col) : handleOpenBuildingPanel;
    const canPlace = selectedBuildingId ? canPlaceBuilding(selectedBuildingId, row, col) : false;

    return (
      <div
        key={`empty-${plot.plotId}`}
        onClick={clickHandler}
        className={`w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer hover-lift relative
          ${selectedBuildingId ? (canPlace ? 'bg-green-800/50 border-green-500' : 'bg-red-800/50 border-red-500') : 'bg-gray-800/50 border-gray-600 hover:bg-gray-700/70'}`
        }
      >
        <span className="text-3xl font-thin text-gray-400">+</span>
        {selectedBuildingId && (
          <div className={`absolute bottom-1 text-xs font-semibold ${canPlace ? 'text-green-300' : 'text-red-300'}`}>
            {canPlace ? '可放置' : '不可放置'}
          </div>
        )}
      </div>
    );
  }, [homesteadState, buildings, activeTimers, handlePlotClick, showToast, homesteadManager, handleOpenBuildingPanel, selectedBuildingId, canPlaceBuilding]);

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

        {/* 建筑选择面板 */}
        {showBuildingPanel && (
          <div className="fixed right-4 top-16 z-40 slide-in-from-right">
            <div className="w-80 glass-effect rounded-2xl border border-white/20 overflow-hidden flex flex-col shadow-2xl" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">🏗️ 建筑工坊</h3>
                    <p className="text-sm opacity-90 mt-1">选择要建造的建筑</p>
                  </div>
                  <button onClick={() => setShowBuildingPanel(false)} className="text-white hover:bg-white/20 rounded-lg p-2 transition-all">
                    ❌
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {availableBuildings.map(({ config, isUnlocked, reason, canAfford }) => {
                  const isSelected = selectedBuildingId === config.id;
                  const level1Config = config.levels[0];

                  // 决定卡片的可交互性和样式
                  const isInteractable = isUnlocked && canAfford;
                  let cardClass = 'p-3 rounded-lg transition-all border-2 hover-lift relative ';
                  
                  if (!isUnlocked) {
                    cardClass += 'bg-black/40 border-gray-600/50 opacity-60 cursor-not-allowed';
                  } else if (!canAfford) {
                    cardClass += 'glass-effect border-red-500/50 opacity-80 cursor-not-allowed';
                  } else if (isSelected) {
                    cardClass += 'bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-400 cursor-pointer';
                  } else {
                    cardClass += 'glass-effect border-white/20 hover:border-white/40 cursor-pointer';
                  }

                  return (
                    <div
                      key={config.id}
                      onClick={() => {
                        if (isInteractable) {
                          setSelectedBuildingId(isSelected ? null : config.id);
                        } else if (!isUnlocked) {
                          showToast?.(reason, 'error');
                        } else if (!canAfford) {
                          showToast?.('资源不足!', 'error');
                        }
                      }}
                      className={cardClass}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl pt-1">{config.icon}</div>
                        <div className="flex-1 min-w-0 relative">
                          <div className="font-bold text-base">{config.name}</div>
                          <div className="text-xs text-gray-300 mb-2 line-clamp-2">{config.description}</div>
                          
                          <div className="space-y-1">
                            {level1Config.buildCost.map(({ resource, amount }) => {
                                const playerAmount = resources[resource] || 0;
                                const hasEnough = playerAmount >= amount;
                                return (
                                  <div key={resource} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-300">{HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES[resource.toUpperCase()]?.name || resource}</span>
                                    <span className={`font-mono ${hasEnough ? 'text-green-300' : 'text-red-400'}`}>
                                      {playerAmount} / {amount}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                      
                      {/* 锁定或资源不足的覆盖提示 */}
                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-3xl" role="img" aria-label="locked">🔒</span>
                          <span className="text-xs text-red-300 font-semibold mt-1 text-center px-1">
                            {reason}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
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
              onClick={() => playerManager.debug_fillAllResources()}
              className="px-4 py-2 glass-effect hover:bg-purple-500/30 rounded-xl hover-lift text-sm border border-white/20"
            >
              💰 满资源
            </button>
            <button
              onClick={() => homesteadManager.debug_instantCompleteAll()}
              className="px-4 py-2 glass-effect hover:bg-orange-500/30 rounded-xl hover-lift text-sm border border-white/20"
            >
              ⚡️ 瞬间完成
            </button>
          </div>
        </div>

        {/* 建筑信息弹窗 - 增加升级功能 */}
        {showBuildingInfo && (
          <BuildingDetailModal
            isOpen={!!showBuildingInfo}
            onClose={handleCloseModal}
            buildingConfig={showBuildingInfo.config}
            buildingInstance={showBuildingInfo.instance}
            onUpgrade={handleBuildingUpgrade}
            isFusionUnlocked={isFusionUnlocked}
            onStartFusion={() => {
              if (onOpenSummonHome) {
                console.log('onOpenSummonHome', onOpenSummonHome);
                onOpenSummonHome();
              }
              handleCloseModal();
            }}
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