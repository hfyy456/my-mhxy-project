// src/features/homestead/components/HomesteadView.jsx
import React, { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectHomesteadPlots,
  selectHomesteadResources,
  selectHomesteadBuildings,
  startBuildingConstruction,
} from '@/store/slices/homesteadSlice';
import { BUILDINGS, HOMESTEAD_GENERAL_CONFIG } from '@/config/config';

const HomesteadView = ({ uiText, toasts, setToasts }) => { // 现在从props接收toasts和setToasts
  const dispatch = useDispatch();
  const { showResult } = useToast(toasts, setToasts);
  const plots = useSelector(selectHomesteadPlots);
  const resources = useSelector(selectHomesteadResources);
  const buildingsInstanceData = useSelector(selectHomesteadBuildings); // For construction status

  const [selectedPlotId, setSelectedPlotId] = useState(null);
  const [showBuildingModal, setShowBuildingModal] = useState(false);

  const handleBuildClick = (plotId) => {
    setSelectedPlotId(plotId);
    setShowBuildingModal(true);
  };

  const handleSelectBuildingToConstruct = (buildingId) => {
    if (selectedPlotId !== null) {
      // Basic check: ensure buildingConfig exists
      if (!BUILDINGS[buildingId] || !BUILDINGS[buildingId].levels[0]) {
          console.error(`Building config or level 0 config for ${buildingId} is missing.`);
          setShowBuildingModal(false);
          return;
      }
      // Basic resource check (can be more robust)
      const cost = BUILDINGS[buildingId].levels[0].buildCost;
      let canAfford = true;
      cost.forEach(c => {
        if (resources[c.resource] < c.amount) {
          canAfford = false;
        }
      });

      if (!canAfford) {
        showResult(uiText.homestead.insufficientResources || '资源不足!', { type: 'error' });
        setShowBuildingModal(false);
        return;
      }
      
      dispatch(startBuildingConstruction({ plotId: selectedPlotId, buildingId }));
    }
    setShowBuildingModal(false);
    setSelectedPlotId(null);
  };

  const getBuildingDisplayInfo = (plot) => {
    if (!plot.buildingInstanceId) return uiText.homestead.emptyPlot || '空地';
    
    const instance = buildingsInstanceData[plot.buildingInstanceId];
    if (!instance) return '错误: 建筑实例数据丢失';

    const buildingConfig = BUILDINGS[instance.buildingId];
    if (!buildingConfig) return '错误: 建筑配置丢失';

    if (instance.level === 0) { // Level 0 indicates construction in progress
        const timeLeft = Math.max(0, Math.round((instance.completesAt - Date.now()) / 1000));
        const constructingText = uiText.homestead.constructingStatus || '建造中... {time}s';
        return `${buildingConfig.name} (${constructingText.replace('{time}', timeLeft)})`;
    }
    const levelText = uiText.homestead.levelStatus || '等级 {level}';
    return `${buildingConfig.name} (${levelText.replace('{level}', instance.level)})`;
  };


  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg shadow-xl max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-yellow-400">{uiText.homestead.title || '我的家园'}</h2>

      {/* 资源显示 */}
      <div className="mb-6 p-4 bg-gray-700 rounded">
        <h3 className="text-xl font-semibold mb-3 text-green-400">{uiText.homestead.resourcesTitle || '家园资源'}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {Object.entries(resources).map(([resourceId, amount]) => {
            const resourceConfig = HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES[Object.keys(HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES).find(key => HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES[key].id === resourceId)];
            const resourceName = resourceConfig ? resourceConfig.name : resourceId;
            return (
              <div key={resourceId} className="p-2 bg-gray-600 rounded text-sm">
                <span className="font-medium">{resourceName}:</span> {amount}
              </div>
            );
          })}
        </div>
      </div>

      {/* 地块显示 */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3 text-blue-400">{uiText.homestead.plotsTitle || '家园地块'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plots.map((plot) => (
            <div key={plot.plotId} className="p-4 bg-gray-700 rounded shadow hover:shadow-lg transition-shadow">
              <p className="font-semibold text-lg mb-2">地块 #{plot.plotId + 1}</p>
              <div className="mb-2 min-h-[24px]"> {/* Placeholder for consistent height */}
                 {getBuildingDisplayInfo(plot)}
              </div>
              {plot.buildingId === null && !plot.buildingInstanceId && (
                <button
                  onClick={() => handleBuildClick(plot.plotId)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  建造
                </button>
              )}
              {/* TODO: Add upgrade/info buttons for existing buildings */}
            </div>
          ))}
        </div>
      </div>

      {/* 建筑选择模态框 */}
      {showBuildingModal && selectedPlotId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">{(uiText.homestead.selectBuildingTitle || '选择建筑 (地块 #{plotNumber})').replace('{plotNumber}', selectedPlotId + 1)}</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Object.values(BUILDINGS)
                .filter(b => b.category !== 'OBSTACLE') // Exclude obstacles if any
                .map((building) => (
                <button
                  key={building.id}
                  onClick={() => handleSelectBuildingToConstruct(building.id)}
                  className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  <p className="font-semibold">{building.name}</p>
                  <p className="text-xs text-gray-400">
                    {building.description} - 成本: {
                      building.levels[0].buildCost.map(c => `${HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES[Object.keys(HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES).find(key => HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES[key].id === c.resource)]?.name || c.resource} x${c.amount}`).join(', ')
                    }
                  </p>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowBuildingModal(false);
                setSelectedPlotId(null);
              }}
              className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              {uiText.homestead.cancelButton || '取消'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Make sure to import uiText from your config if not passing as prop
// import { uiText } from '@/config/ui/uiTextConfig'; 
export default HomesteadView;
