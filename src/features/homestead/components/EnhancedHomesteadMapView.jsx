import React, { useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectHomesteadPlots,
  selectHomesteadResources,
  selectHomesteadBuildings,
  startBuildingConstruction,
  selectActiveHomesteadTimers,
  fillAllResources,
  instantCompleteAllBuildings
} from '@/store/slices/enhancedHomesteadSlice';
import { ENHANCED_BUILDINGS, BUILDING_CATEGORIES } from '@/config/homestead/enhancedBuildingConfig';
import { HOMESTEAD_GENERAL_CONFIG } from '@/config/homestead/homesteadConfig';

const EnhancedHomesteadMapView = ({ showToast }) => {
  const dispatch = useDispatch();
  const plots = useSelector(selectHomesteadPlots);
  const resources = useSelector(selectHomesteadResources);
  const buildings = useSelector(selectHomesteadBuildings);
  const activeTimers = useSelector(selectActiveHomesteadTimers);

  // 状态管理
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [showBuildingPanel, setShowBuildingPanel] = useState(false);
  const [hoveredPlotId, setHoveredPlotId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showTutorial, setShowTutorial] = useState(false);

  // 网格配置
  const GRID_SIZE = 8;
  const CELL_SIZE = 88;

  // 创建网格布局
  const gridLayout = useMemo(() => {
    const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    plots.forEach(plot => {
      const row = Math.floor(plot.plotId / GRID_SIZE);
      const col = plot.plotId % GRID_SIZE;
      if (row < GRID_SIZE && col < GRID_SIZE) {
        grid[row][col] = plot;
      }
    });
    return grid;
  }, [plots]);

  // 检查建筑是否可以放置
  const canPlaceBuilding = useCallback((buildingId, startRow, startCol) => {
    const building = ENHANCED_BUILDINGS[buildingId];
    if (!building) return false;

    const { width, height } = building.size;
    
    // 检查边界
    if (startRow + height > GRID_SIZE || startCol + width > GRID_SIZE) {
      return false;
    }

    // 检查每个格子是否可用
    for (let r = startRow; r < startRow + height; r++) {
      for (let c = startCol; c < startCol + width; c++) {
        const plot = gridLayout[r][c];
        if (!plot || plot.buildingId) {
          return false;
        }
      }
    }

    // 检查建筑需求
    if (building.requires) {
      for (const requirement of building.requires) {
        const hasRequiredBuilding = Object.values(buildings).some(
          inst => inst.buildingId === requirement.buildingId && 
                  inst.level >= requirement.minLevel
        );
        if (!hasRequiredBuilding) {
          return false;
        }
      }
    }

    return true;
  }, [gridLayout, buildings]);

  // 获取建筑占用的地块ID
  const getBuildingPlotIds = useCallback((buildingId, startRow, startCol) => {
    const building = ENHANCED_BUILDINGS[buildingId];
    if (!building) return [];

    const { width, height } = building.size;
    const plotIds = [];
    
    for (let r = startRow; r < startRow + height; r++) {
      for (let c = startCol; c < startCol + width; c++) {
        const plot = gridLayout[r][c];
        if (plot) {
          plotIds.push(plot.plotId);
        }
      }
    }
    
    return plotIds;
  }, [gridLayout]);

  // 处理建筑放置
  const handlePlaceBuilding = useCallback((buildingId, startRow, startCol) => {
    if (!canPlaceBuilding(buildingId, startRow, startCol)) {
      showToast && showToast('无法在此位置建造该建筑！', 'error');
      return;
    }

    const plotIds = getBuildingPlotIds(buildingId, startRow, startCol);
    const mainPlotId = plotIds[0];

    dispatch(startBuildingConstruction({ 
      plotId: mainPlotId, 
      buildingId,
      occupiedPlots: plotIds 
    }));

    setShowBuildingPanel(false);
    setSelectedBuildingId(null);
    showToast && showToast(`开始建造${ENHANCED_BUILDINGS[buildingId].name}！`, 'success');
  }, [dispatch, canPlaceBuilding, getBuildingPlotIds, showToast]);

  // 处理地块点击
  const handlePlotClick = useCallback((row, col) => {
    const plot = gridLayout[row][col];
    if (!plot) return;

    if (selectedBuildingId) {
      handlePlaceBuilding(selectedBuildingId, row, col);
    } else if (plot.buildingId) {
      // 点击已有建筑，显示建筑信息
      showToast && showToast(`这是${ENHANCED_BUILDINGS[plot.buildingId]?.name || '建筑'}`, 'info');
    }
  }, [gridLayout, selectedBuildingId, handlePlaceBuilding, showToast]);

  // 获取可建造的建筑列表
  const availableBuildings = useMemo(() => {
    return Object.values(ENHANCED_BUILDINGS).filter(building => {
      if (building.requires) {
        return building.requires.every(requirement => {
          return Object.values(buildings).some(
            inst => inst.buildingId === requirement.buildingId && 
                    inst.level >= requirement.minLevel
          );
        });
      }
      return true;
    });
  }, [buildings]);

  // 按类别过滤建筑
  const filteredBuildings = useMemo(() => {
    if (selectedCategory === 'all') return availableBuildings;
    return availableBuildings.filter(building => building.category === selectedCategory);
  }, [availableBuildings, selectedCategory]);

  // 获取建筑的主地块位置（左上角）
  const getBuildingMainPlot = useCallback((buildingInstanceId) => {
    if (!buildingInstanceId) return null;
    
    const building = buildings[buildingInstanceId];
    if (!building) return null;
    
    // 找到包含此建筑的所有地块
    const buildingPlots = plots.filter(plot => plot.buildingInstanceId === buildingInstanceId);
    if (buildingPlots.length === 0) return null;
    
    // 找到左上角的地块（plotId最小的）
    return buildingPlots.reduce((min, plot) => 
      plot.plotId < min.plotId ? plot : min
    );
  }, [buildings, plots]);

  // 检查当前地块是否应该显示建筑内容（只有主地块显示）
  const shouldShowBuildingContent = useCallback((plot) => {
    if (!plot?.buildingInstanceId) return false;
    
    const mainPlot = getBuildingMainPlot(plot.buildingInstanceId);
    return mainPlot && mainPlot.plotId === plot.plotId;
  }, [getBuildingMainPlot]);

  // 渲染单个地块
  const renderPlot = useCallback((plot, row, col) => {
    if (!plot) {
      return (
        <div
          key={`empty-${row}-${col}`}
          className="aspect-square border border-gray-700 bg-gray-900 rounded-lg flex items-center justify-center opacity-30"
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
    const previewBuilding = selectedBuildingId ? ENHANCED_BUILDINGS[selectedBuildingId] : null;
    
    // 检查是否应该显示建筑内容
    const showBuildingContent = shouldShowBuildingContent(plot);
    
    // 如果是多格建筑，计算建筑的完整尺寸来设置内容大小
    let buildingSize = null;
    if (buildingConfig && showBuildingContent) {
      buildingSize = buildingConfig.size;
    }

    let plotStyle = "aspect-square border-2 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden";
    
    if (plot.buildingId) {
      plotStyle += isConstructing 
        ? " bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-400 shadow-lg shadow-yellow-400/25" 
        : " bg-gradient-to-br from-blue-400 to-blue-600 border-blue-400 shadow-lg shadow-blue-400/25";
    } else {
      plotStyle += " bg-gradient-to-br from-green-50 to-green-100 border-green-300 hover:border-green-400 hover:shadow-md";
    }
    
    if (isHovered && selectedBuildingId) {
      plotStyle += canPlace 
        ? " ring-4 ring-green-400 ring-opacity-50 scale-105" 
        : " ring-4 ring-red-400 ring-opacity-50";
    }

    return (
      <div
        key={`plot-${plot.plotId}`}
        className={plotStyle}
        onClick={() => handlePlotClick(row, col)}
        onMouseEnter={() => setHoveredPlotId(plot.plotId)}
        onMouseLeave={() => setHoveredPlotId(null)}
      >
        {/* 建筑内容 - 只在主地块显示 */}
        {buildingConfig && showBuildingContent && (
          <div 
            className="absolute flex flex-col items-center justify-center text-white z-10 pointer-events-none"
            style={{
              // 扩展到整个建筑区域并居中定位
              width: buildingSize ? `${buildingSize.width * CELL_SIZE}px` : `${CELL_SIZE}px`,
              height: buildingSize ? `${buildingSize.height * CELL_SIZE}px` : `${CELL_SIZE}px`,
              left: 0,
              top: 0,
            }}
          >
            <div className="text-center">
              <div 
                className="mb-2 filter drop-shadow-lg"
                style={{
                  // 根据建筑大小调整图标大小
                  fontSize: buildingSize ? `${Math.min(buildingSize.width, buildingSize.height) * 1.5 + 1}rem` : '3rem'
                }}
              >
                {buildingConfig.icon}
              </div>
              <div className="text-xs font-bold bg-black/50 rounded-full px-3 py-1 backdrop-blur-sm">
                {buildingConfig.name}
              </div>
              <div className="text-xs font-semibold bg-black/30 rounded-full px-2 py-1 backdrop-blur-sm mt-1">
                {isConstructing ? '建造中' : `等级 ${building.level}`}
              </div>
              {isConstructing && timer && (
                <div className="text-xs text-yellow-200 mt-1 font-semibold bg-black/30 rounded-full px-2 py-1 backdrop-blur-sm">
                  {Math.max(0, Math.ceil((timer.completesAt - Date.now()) / 1000))}秒
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 空地显示 */}
        {!plot.buildingId && (
          <div className="text-center text-gray-600">
            <div className="text-xs mb-1">空地</div>
            <div className="text-xs opacity-60">#{plot.plotId}</div>
          </div>
        )}

        {/* 建筑放置预览 */}
        {selectedBuildingId && isHovered && previewBuilding && (
          <div className={`absolute inset-0 flex items-center justify-center rounded-xl ${
            canPlace 
              ? 'bg-green-400/60 border-2 border-green-500' 
              : 'bg-red-400/60 border-2 border-red-500'
          }`}>
            <div className="text-center text-white">
              <div className="text-2xl filter drop-shadow-lg">{previewBuilding.icon}</div>
              <div className="text-xs font-bold mt-1">
                {canPlace ? '可建造' : '不可建造'}
              </div>
            </div>
          </div>
        )}

        {/* 建造进度条 - 只在主地块显示 */}
        {isConstructing && timer && showBuildingContent && (
          <div 
            className="absolute bottom-0 left-0 h-2 bg-black/30 z-20"
            style={{
              width: buildingSize ? `${buildingSize.width * 100}%` : '100%'
            }}
          >
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000"
              style={{
                width: `${Math.min(100, Math.max(0, 
                  ((Date.now() - building.startedAt) / (timer.completesAt - building.startedAt)) * 100
                ))}%`
              }}
            />
          </div>
        )}
      </div>
    );
  }, [
    hoveredPlotId, 
    buildings, 
    activeTimers, 
    selectedBuildingId, 
    canPlaceBuilding, 
    handlePlotClick,
    shouldShowBuildingContent
  ]);

  // 类别选项
  const categoryOptions = [
    { id: 'all', name: '全部', icon: '🏠' },
    { id: 'core', name: '核心', icon: '🏛️' },
    { id: 'resource_production', name: '资源', icon: '⛏️' },
    { id: 'commercial', name: '商业', icon: '🏪' },
    { id: 'crafting', name: '制作', icon: '🔨' },
    { id: 'training', name: '训练', icon: '🏟️' },
    { id: 'utility', name: '功能', icon: '📦' },
    { id: 'decoration', name: '装饰', icon: '🌸' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* 顶部标题栏 */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              🏡 我的家园
            </h1>
            <div className="text-sm text-gray-300">
              建造你的梦想家园，解锁更多精彩功能！
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTutorial(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>❓</span> 帮助
            </button>
            
            <button
              onClick={() => setShowBuildingPanel(!showBuildingPanel)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                showBuildingPanel 
                  ? 'bg-red-600 hover:bg-red-500 shadow-lg' 
                  : 'bg-green-600 hover:bg-green-500 shadow-lg hover:shadow-green-500/25'
              }`}
            >
              <span>{showBuildingPanel ? '✖️' : '🏗️'}</span>
              {showBuildingPanel ? '取消建造' : '开始建造'}
            </button>
          </div>
        </div>
      </div>

      {/* 资源显示栏 */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES).map(([key, resource]) => (
              <div key={resource.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-center">
                  <div className="text-2xl mb-1">
                    {resource.id === 'gold' ? '💰' : 
                     resource.id === 'wood' ? '🪵' :
                     resource.id === 'stone' ? '🪨' :
                     resource.id === 'herb' ? '🌿' :
                     resource.id === 'ore' ? '⛏️' : '✨'}
                  </div>
                  <div className="font-semibold text-sm">{resource.name}</div>
                  <div className="text-xl font-bold text-yellow-400">
                    {(resources[resource.id] || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto gap-6 p-6">
        {/* 主地图区域 */}
        <div className="flex-1">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 flex justify-center">
            <div 
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
              }}
            >
              {gridLayout.map((row, rowIndex) =>
                row.map((plot, colIndex) => renderPlot(plot, rowIndex, colIndex))
              )}
            </div>
          </div>

          {/* 底部提示 */}
          <div className="mt-4 bg-blue-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                {selectedBuildingId ? (
                  <div>
                    <span className="font-semibold text-blue-300">建造模式：</span>
                    <span className="ml-2">点击绿色区域放置 {ENHANCED_BUILDINGS[selectedBuildingId]?.name}</span>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-blue-300">提示：</span>
                    <span className="ml-2">点击"开始建造"选择建筑，或点击现有建筑查看详情</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧建筑选择面板 */}
        {showBuildingPanel && (
          <div className="w-96 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span>🏗️</span> 选择建筑
              </h3>
              <p className="text-sm opacity-90 mt-1">选择要建造的建筑类型</p>
            </div>
            
            {/* 类别选择 */}
            <div className="p-4 border-b border-white/10">
              <div className="grid grid-cols-4 gap-2">
                {categoryOptions.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-2 rounded-lg text-xs transition-all ${
                      selectedCategory === category.id
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-white/10 hover:bg-white/20 text-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{category.icon}</div>
                    <div>{category.name}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* 建筑列表 */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {filteredBuildings.map(building => {
                  const levelConfig = building.levels[0];
                  const canAfford = levelConfig.buildCost.every(
                    cost => resources[cost.resource] >= cost.amount
                  );
                  
                  return (
                    <div
                      key={building.id}
                      className={`p-4 rounded-lg cursor-pointer transition-all border ${
                        selectedBuildingId === building.id
                          ? 'bg-yellow-600 border-yellow-400 shadow-lg scale-105'
                          : canAfford
                          ? 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/40'
                          : 'bg-gray-700/50 border-gray-600 opacity-50 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (canAfford) {
                          setSelectedBuildingId(
                            selectedBuildingId === building.id ? null : building.id
                          );
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{building.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm mb-1">{building.name}</div>
                          <div className="text-xs text-gray-300 mb-2 line-clamp-2">
                            {building.description}
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-blue-300">
                              尺寸: {building.size.width}×{building.size.height}
                            </span>
                            <span className="text-purple-300">
                              时间: {levelConfig.buildTimeSeconds}秒
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {levelConfig.buildCost.map(cost => {
                              const resourceConfig = Object.values(HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES)
                                .find(r => r.id === cost.resource);
                              const hasEnough = resources[cost.resource] >= cost.amount;
                              
                              return (
                                <span 
                                  key={cost.resource}
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    hasEnough 
                                      ? 'bg-green-600/30 text-green-300' 
                                      : 'bg-red-600/30 text-red-300'
                                  }`}
                                >
                                  {resourceConfig?.name} {cost.amount}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 测试工具栏 */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        <button
          onClick={() => dispatch(fillAllResources())}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg shadow-lg transition-all hover:scale-105"
          title="填满所有资源"
        >
          💰 满资源
        </button>
        <button
          onClick={() => dispatch(instantCompleteAllBuildings())}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg shadow-lg transition-all hover:scale-105"
          title="立即完成所有建造"
        >
          ⚡ 完成建造
        </button>
      </div>

      {/* 新手教程模态框 */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-lg border border-white/20 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">🎮 家园建造指南</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-lg">🏛️</span>
                <div>
                  <div className="font-semibold">1. 建造城镇大厅</div>
                  <div className="text-gray-300">这是核心建筑，可以解锁其他建筑类型</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">⛏️</span>
                <div>
                  <div className="font-semibold">2. 建造资源建筑</div>
                  <div className="text-gray-300">伐木场、采矿场等提供基础资源</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">🏪</span>
                <div>
                  <div className="font-semibold">3. 解锁功能建筑</div>
                  <div className="text-gray-300">商店、制作台、训练场等提供游戏功能</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">💡</span>
                <div>
                  <div className="font-semibold">小贴士</div>
                  <div className="text-gray-300">某些建筑需要前置建筑才能解锁</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-500 rounded-lg py-2 transition-colors"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedHomesteadMapView; 