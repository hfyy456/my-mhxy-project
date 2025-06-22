import React from 'react';
import { useHomesteadManager } from '@/hooks/useHomesteadManager';
import { usePlayerManager } from '@/hooks/usePlayerManager';
import { ENHANCED_BUILDINGS } from '@/config/homestead/enhancedBuildingConfig';
import { HOMESTEAD_GENERAL_CONFIG } from '@/config/homestead/homesteadConfig';

const ResourceProductionOverview = ({ showToast }) => {
  const { homesteadState, homesteadManager } = useHomesteadManager();
  const { resourceGenerators, buildings } = homesteadState;

  const handleCollectAll = () => {
    const result = homesteadManager.collectAllResources();
    if (result.success && result.totalAmount > 0) {
      showToast?.(`💰 成功收集 ${result.totalAmount} 资源!`, 'success');
    } else {
      showToast?.('当前没有可收集的资源。', 'info');
    }
  };

  const totalUncollected = resourceGenerators.reduce((total, gen) => {
    return total + Object.values(gen.uncollectedAmounts).reduce((sum, val) => sum + Math.floor(val), 0);
  }, 0);

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl w-80 max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">资源产出总览</h2>
        <p className="text-sm text-gray-400 mt-1">查看所有建筑的资源产出情况。</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
        {resourceGenerators.length > 0 ? resourceGenerators.map(generator => {
          const buildingInstance = buildings[generator.buildingInstanceId];
          if (!buildingInstance) return null;
          const buildingConfig = ENHANCED_BUILDINGS[buildingInstance.buildingId];
          const currentAmount = Object.values(generator.uncollectedAmounts).reduce((sum, val) => sum + val, 0);
          const capacity = generator.capacity;
          const progress = capacity > 0 ? (currentAmount / capacity) * 100 : 0;

          return (
            <div key={generator.buildingInstanceId} className="bg-gray-700/50 p-3 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{buildingConfig.icon}</div>
                <div className="flex-1">
                  <p className="font-bold text-white">{buildingConfig.name} <span className="text-sm text-gray-400">Lv.{buildingInstance.level}</span></p>
                  <div className="space-y-1 mt-1">
                    {Object.entries(generator.uncollectedAmounts).map(([resource, amount]) => (
                      <div key={resource} className="text-xs text-gray-300 flex justify-between">
                         <span>{HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES[resource.toUpperCase()]?.name || resource}:</span>
                         <span className="font-mono text-green-400">+{Math.floor(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-2">
                 <div className="w-full bg-gray-600 rounded-full h-2.5">
                   <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                 </div>
                 <div className="text-xs text-right text-gray-400 mt-1">
                   {Math.floor(currentAmount)} / {capacity}
                 </div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-10 text-gray-500">
            <p>暂无正在生产资源的建筑。</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleCollectAll}
          disabled={totalUncollected === 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
        >
          一键收集全部
        </button>
      </div>
    </div>
  );
};

export default ResourceProductionOverview; 