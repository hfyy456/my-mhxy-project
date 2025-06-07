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
import { ENHANCED_BUILDINGS, BUILDING_CATEGORIES, PLACEMENT_RULES } from '@/config/homestead/enhancedBuildingConfig';
import { HOMESTEAD_GENERAL_CONFIG } from '@/config/homestead/homesteadConfig';

const HomesteadMapView = ({ showToast }) => {
  const dispatch = useDispatch();
  const plots = useSelector(selectHomesteadPlots);
  const resources = useSelector(selectHomesteadResources);
  const buildings = useSelector(selectHomesteadBuildings);
  const activeTimers = useSelector(selectActiveHomesteadTimers);

  // 状态管理
  const [selectedPlotIds, setSelectedPlotIds] = useState([]);
  const [showBuildingMenu, setShowBuildingMenu] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [draggedBuilding, setDraggedBuilding] = useState(null);
  const [hoveredPlotId, setHoveredPlotId] = useState(null);

  // 网格尺寸配置
  const GRID_SIZE = 8; // 8x8网格
  const CELL_SIZE = 80; // 每个网格的像素大小

  // 创建网格布局
  const gridLayout = useMemo(() => {
    const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    
    // 将地块填充到网格中
    plots.forEach(plot => {
      const row = Math.floor(plot.plotId / GRID_SIZE);
      const col = plot.plotId % GRID_SIZE;
      if (row < GRID_SIZE && col < GRID_SIZE) {
        grid[row][col] = plot;
      }
    });
    
    return grid;
  }, [plots]);

  // 检查建筑是否可以放置在指定位置
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

    // 检查资源
    const levelConfig = building.levels[0];
    if (levelConfig.buildCost) {
      for (const cost of levelConfig.buildCost) {
        if (resources[cost.resource] < cost.amount) {
          return false;
        }
      }
    }

    return true;
  }, [gridLayout, buildings, resources]);

  // 获取建筑占用的所有地块ID
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
      showToast && showToast('无法在此位置建造该建筑', 'error');
      return;
    }

    const plotIds = getBuildingPlotIds(buildingId, startRow, startCol);
    const mainPlotId = plotIds[0]; // 使用第一个地块作为主地块

    dispatch(startBuildingConstruction({ 
      plotId: mainPlotId, 
      buildingId,
      occupiedPlots: plotIds 
    }));

    setShowBuildingMenu(false);
    setSelectedBuildingId(null);
    showToast && showToast(`开始建造${ENHANCED_BUILDINGS[buildingId].name}`, 'success');
  }, [dispatch, canPlaceBuilding, getBuildingPlotIds, showToast]);

  // 处理地块点击
  const handlePlotClick = useCallback((row, col) => {
    const plot = gridLayout[row][col];
    if (!plot) return;

    if (selectedBuildingId) {
      // 放置建筑模式
      handlePlaceBuilding(selectedBuildingId, row, col);
    } else {
      // 选择地块模式
      if (selectedPlotIds.includes(plot.plotId)) {
        setSelectedPlotIds(prev => prev.filter(id => id !== plot.plotId));
      } else {
        setSelectedPlotIds(prev => [...prev, plot.plotId]);
      }
    }
  }, [gridLayout, selectedBuildingId, selectedPlotIds, handlePlaceBuilding]);

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
          className="w-20 h-20 border border-gray-600 bg-gray-800 flex items-center justify-center"
          style={{ gridRow: row + 1, gridColumn: col + 1 }}
        >
          <span className="text-gray-500 text-xs">×</span>
        </div>
      );
    }

    const isSelected = selectedPlotIds.includes(plot.plotId);
    const isHovered = hoveredPlotId === plot.plotId;
    const building = plot.buildingInstanceId ? buildings[plot.buildingInstanceId] : null;
    const buildingConfig = building ? ENHANCED_BUILDINGS[building.buildingId] : null;
    
    // 检查是否正在建造
    const isConstructing = building && building.level === 0;
    const timer = activeTimers?.find(t => t.buildingInstanceId === plot.buildingInstanceId);
    
    // 预览建筑放置
    const canPlace = selectedBuildingId ? canPlaceBuilding(selectedBuildingId, row, col) : false;
    const previewBuilding = selectedBuildingId ? ENHANCED_BUILDINGS[selectedBuildingId] : null;
    
    // 检查是否应该显示建筑内容
    const showBuildingContent = shouldShowBuildingContent(plot);
    
    // 如果是多格建筑，计算建筑的完整尺寸
    let buildingSize = null;
    if (buildingConfig && showBuildingContent) {
      buildingSize = buildingConfig.size;
    }

    let bgColor = 'bg-green-100';
    let borderColor = 'border-green-300';
    
    if (plot.buildingId) {
      bgColor = isConstructing ? 'bg-yellow-200' : 'bg-blue-200';
      borderColor = isConstructing ? 'border-yellow-400' : 'border-blue-400';
    }
    
    if (isSelected) {
      borderColor = 'border-purple-500 border-2';
    }
    
    if (isHovered && selectedBuildingId) {
      bgColor = canPlace ? 'bg-green-300' : 'bg-red-300';
    }

    return (
      <div
        key={`plot-${plot.plotId}`}
        className={`w-20 h-20 border ${borderColor} ${bgColor} flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-all relative`}
        style={{ gridRow: row + 1, gridColumn: col + 1 }}
        onClick={() => handlePlotClick(row, col)}
        onMouseEnter={() => setHoveredPlotId(plot.plotId)}
        onMouseLeave={() => setHoveredPlotId(null)}
      >
        {/* 建筑内容 - 只在主地块显示 */}
        {buildingConfig && showBuildingContent && (
          <div 
            className="absolute flex flex-col items-center justify-center z-10"
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
                className="mb-1"
                style={{
                  // 根据建筑大小调整图标大小  
                  fontSize: buildingSize ? `${Math.min(buildingSize.width, buildingSize.height) * 1.2 + 0.8}rem` : '2rem'
                }}
              >
                {buildingConfig.icon}
              </div>
              <div className="text-xs font-bold bg-black/50 text-white rounded px-2 py-1">
                {buildingConfig.name}
              </div>
              <div className="text-xs font-bold text-gray-700 bg-white/80 rounded px-1 mt-1">
                {isConstructing ? '建造中' : `Lv.${building.level}`}
              </div>
              {isConstructing && timer && (
                <div className="text-xs text-orange-600 bg-white/80 rounded px-1 mt-1">
                  {Math.max(0, Math.ceil((timer.completesAt - Date.now()) / 1000))}s
                </div>
              )}
            </div>
          </div>
        )}
        
        {!plot.buildingId && (
          <div className="text-center">
            <div className="text-xs text-gray-600">空地</div>
            <div className="text-xs text-gray-500">#{plot.plotId}</div>
          </div>
        )}

        {/* 建筑放置预览 */}
        {selectedBuildingId && isHovered && canPlace && previewBuilding && (
          <div className="absolute inset-0 bg-green-400 bg-opacity-50 border-2 border-green-600 flex items-center justify-center">
            <span className="text-green-800 text-lg">{previewBuilding.icon}</span>
          </div>
        )}
      </div>
    );
  }, [
    selectedPlotIds, 
    hoveredPlotId, 
    buildings, 
    activeTimers, 
    selectedBuildingId, 
    canPlaceBuilding, 
    handlePlotClick,
    shouldShowBuildingContent
  ]);

  // 获取可建造的建筑列表
  const availableBuildings = useMemo(() => {
    return Object.values(ENHANCED_BUILDINGS).filter(building => {
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
    });
  }, [buildings]);

  // 按类别分组建筑
  const buildingsByCategory = useMemo(() => {
    const grouped = {};
    availableBuildings.forEach(building => {
      if (!grouped[building.category]) {
        grouped[building.category] = [];
      }
      grouped[building.category].push(building);
    });
    return grouped;
  }, [availableBuildings]);

  return (
    <div className="w-full h-full bg-gray-900 text-white p-4">
      {/* 顶部工具栏 */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-yellow-400">我的家园</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBuildingMenu(!showBuildingMenu)}
            className={`px-4 py-2 rounded ${
              showBuildingMenu 
                ? 'bg-yellow-600 hover:bg-yellow-500' 
                : 'bg-green-600 hover:bg-green-500'
            } text-white transition-colors`}
          >
            {showBuildingMenu ? '取消建造' : '建造建筑'}
          </button>
          
          {selectedPlotIds.length > 0 && (
            <button
              onClick={() => setSelectedPlotIds([])}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
            >
              取消选择
            </button>
          )}
          
          {/* 测试按钮 */}
          <div className="flex gap-2">
            <button
              onClick={() => dispatch(fillAllResources())}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm transition-colors"
              title="填满所有资源"
            >
              💰 满资源
            </button>
            <button
              onClick={() => dispatch(instantCompleteAllBuildings())}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm transition-colors"
              title="立即完成所有建造"
            >
              ⚡ 完成建造
            </button>
          </div>
        </div>
      </div>

      {/* 资源显示 */}
      <div className="mb-4 p-3 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-green-400">资源</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {Object.entries(HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES).map(([key, resource]) => (
            <div key={resource.id} className="p-2 bg-gray-700 rounded text-sm">
              <span className="font-medium">{resource.name}:</span> {resources[resource.id] || 0}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {/* 主地图区域 */}
        <div className="flex-1 flex justify-center">
          <div 
            className="grid gap-1 p-4 bg-gray-800 rounded-lg"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`
            }}
          >
            {gridLayout.map((row, rowIndex) =>
              row.map((plot, colIndex) => renderPlot(plot, rowIndex, colIndex))
            )}
          </div>
        </div>

        {/* 右侧建筑菜单 */}
        {showBuildingMenu && (
          <div className="w-80 bg-gray-800 rounded-lg p-4 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">选择建筑</h3>
            
            {Object.entries(buildingsByCategory).map(([category, buildings]) => (
              <div key={category} className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-blue-300 capitalize">
                  {category.replace('_', ' ')}
                </h4>
                <div className="space-y-2">
                  {buildings.map(building => {
                    const levelConfig = building.levels[0];
                    const canAfford = levelConfig.buildCost.every(
                      cost => resources[cost.resource] >= cost.amount
                    );
                    
                    return (
                      <div
                        key={building.id}
                        className={`p-3 rounded cursor-pointer transition-colors ${
                          selectedBuildingId === building.id
                            ? 'bg-yellow-600'
                            : canAfford
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-gray-700 opacity-50 cursor-not-allowed'
                        }`}
                        onClick={() => {
                          if (canAfford) {
                            setSelectedBuildingId(
                              selectedBuildingId === building.id ? null : building.id
                            );
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{building.icon}</span>
                          <div className="flex-1">
                            <div className="font-semibold">{building.name}</div>
                            <div className="text-sm text-gray-300">{building.description}</div>
                            <div className="text-xs text-gray-400">
                              大小: {building.size.width}×{building.size.height}
                            </div>
                            <div className="text-xs text-gray-400">
                              成本: {levelConfig.buildCost.map(cost => 
                                `${HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES[
                                  Object.keys(HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES)
                                    .find(k => HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES[k].id === cost.resource)
                                ]?.name || cost.resource} ${cost.amount}`
                              ).join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部说明 */}
      <div className="mt-4 p-3 bg-gray-800 rounded-lg text-sm text-gray-300">
        {selectedBuildingId ? (
          <p>💡 点击地图上的空地来放置 {ENHANCED_BUILDINGS[selectedBuildingId]?.name}</p>
        ) : (
          <p>💡 点击"建造建筑"开始建设，或点击现有建筑查看详情</p>
        )}
      </div>
    </div>
  );
};

export default HomesteadMapView; 