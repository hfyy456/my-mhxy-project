import React from 'react';
import { ENHANCED_BUILDINGS } from '@/config/homestead/enhancedBuildingConfig';
import { BUILDINGS as LEGACY_BUILDINGS } from '@/config/config'; // Import legacy config
import { useSelector } from 'react-redux';

const BuildingDetailModal = ({ 
  isOpen, 
  onClose, 
  buildingInstance,
  onStartFusion,
  onStartRefining,
  onUpgrade,
}) => {
  const unlockedFeatures = useSelector(state => state.enhancedHomestead.unlockedFeatures.summonCenterFeatures) || [];

  if (!isOpen || !buildingInstance) return null;

  // Adapt to both new and legacy building configs
  const buildingConfig = ENHANCED_BUILDINGS[buildingInstance.buildingId] || LEGACY_BUILDINGS[buildingInstance.buildingId];
  if (!buildingConfig) return null;

  const currentLevel = buildingInstance.level;
  const nextLevelConfig = buildingConfig.levels.find(l => l.level === currentLevel + 1);

  // Special features for Summon Home
  const isSummonHome = buildingInstance.buildingId === 'summon_home';
  const isFusionUnlocked = isSummonHome && unlockedFeatures.includes('fusion');
  const isRefiningUnlocked = isSummonHome && unlockedFeatures.includes('refining');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-600 text-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <span className="text-3xl">{buildingConfig.icon || '🏢'}</span>
            {buildingConfig.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {/* Description & Level */}
        <div className="mb-6">
          <p className="text-gray-300 mb-2">{buildingConfig.description}</p>
          <p className="font-semibold text-purple-300">当前等级: {currentLevel}</p>
        </div>

        {/* Functionality Section */}
        {isSummonHome && (
          <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 text-purple-200">核心功能</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (isFusionUnlocked && onStartFusion) {
                    onStartFusion();
                    onClose();
                  }
                }}
                disabled={!isFusionUnlocked}
                className={`w-full px-4 py-3 rounded font-semibold transition-all ${isFusionUnlocked ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 cursor-not-allowed'}`}
                title={!isFusionUnlocked ? "功能未解锁" : "进入召唤兽之家"}
              >
                进入操作面板
              </button>
              <button
                onClick={onStartRefining}
                disabled={!isRefiningUnlocked}
                className={`w-full px-4 py-3 rounded font-semibold transition-all ${isRefiningUnlocked ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'}`}
                title={!isRefiningUnlocked ? "将建筑升至2级以解锁" : "洗练召唤兽"}
              >
                洗练 (开发中)
              </button>
            </div>
          </div>
        )}

        {/* Upgrade Section */}
        <div className="p-4 bg-gray-700/50 rounded-lg">
          <h3 className="font-semibold text-lg mb-3 text-green-300">升级</h3>
          {nextLevelConfig ? (
            <div>
              <p className="mb-2">升级到 <span className="font-bold">Lv. {nextLevelConfig.level}</span> 需要:</p>
              <ul className="list-disc list-inside mb-4 text-gray-300">
                {nextLevelConfig.buildCost.map(cost => (
                  <li key={cost.resource}>{cost.resource}: {cost.amount}</li>
                ))}
                <li>时间: {nextLevelConfig.buildTimeSeconds} 秒</li>
              </ul>
              <button
                onClick={() => onUpgrade(buildingInstance.id)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded transition-all"
              >
                开始升级
              </button>
            </div>
          ) : (
            <p className="text-gray-400">已达到最高等级。</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildingDetailModal; 