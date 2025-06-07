import React, { useState } from "react";
import { useSelector } from "react-redux";
import { usePlayerManager, usePlayerStatistics } from "@/hooks/usePlayerManager";
import {
  selectUnlockProgress,
  selectQualityCounts,
} from "@/store/slices/summonCatalogSlice";
import { getQualityDisplayName } from "@/config/ui/uiTextConfig";
import { qualityConfig } from "@/config/config";

export const PlayerInfo = () => {
  // 标签页状态
  const [activeTab, setActiveTab] = useState('overview');

  // 使用新的玩家管理Hook
  const {
    level,
    experience,
    statistics,
    levelInfo,
    summonStats,
    inventoryStats,
    achievementSystem,
    playerCapabilities,
    gameTimeStats,
    gainExperience,
    error,
    clearError
  } = usePlayerManager();

  const { formatTime, getStatDisplayName } = usePlayerStatistics();
  
  // 保留原有的图鉴进度（从Redux）
  const unlockProgress = useSelector(selectUnlockProgress);
  const qualityCounts = useSelector(selectQualityCounts);

  // 标签页配置
  const tabs = [
    { id: 'overview', name: '总览', icon: 'fas fa-home' },
    { id: 'summons', name: '召唤兽', icon: 'fas fa-paw' },
    { id: 'achievements', name: '成就', icon: 'fas fa-trophy' },
    { id: 'abilities', name: '能力', icon: 'fas fa-magic' }
  ];

  // 渲染各个标签页内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'summons':
        return renderSummonsTab();
      case 'achievements':
        return renderAchievementsTab();
      case 'abilities':
        return renderAbilitiesTab();
      default:
        return renderOverviewTab();
    }
  };

  // 总览标签页
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* 核心信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 等级 */}
        <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">召唤师等级</h3>
            <span className="text-xl font-bold text-yellow-400">{level}</span>
          </div>
          <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
              style={{ width: `${levelInfo.progressPercentage}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {levelInfo.isMaxLevel ? '已满级' : `还需 ${levelInfo.expToNextLevel} 经验`}
          </div>
        </div>

        {/* 召唤兽 */}
        <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">召唤兽队伍</h3>
            <span className="text-xl font-bold text-purple-400">
              {summonStats.slots.used}/{summonStats.slots.max}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${summonStats.slots.percentage}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-400">
            总战力: {summonStats.totalPower.toLocaleString()}
          </div>
        </div>

        {/* 金币 */}
        <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">金币</h3>
            <i className="fas fa-coins text-yellow-400"></i>
            </div>
          <div className="text-xl font-bold text-yellow-400">
            {inventoryStats.gold.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            背包: {inventoryStats.slots.used}/{inventoryStats.slots.max}
          </div>
        </div>

        {/* 成就 */}
        <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">成就进度</h3>
            <span className="text-xl font-bold text-orange-400">
              {achievementSystem.unlockedCount}/{achievementSystem.total}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${achievementSystem.progress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-400">
            完成度: {achievementSystem.progress.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 快速统计 */}
      <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/60">
        <h3 className="text-lg font-semibold mb-3 text-slate-100">游戏统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">{statistics.totalRefinements || 0}</div>
            <div className="text-xs text-slate-400">炼妖次数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{statistics.totalSkillBooks || 0}</div>
            <div className="text-xs text-slate-400">打书次数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">{statistics.totalEquipmentObtained || 0}</div>
            <div className="text-xs text-slate-400">装备获得</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">{summonStats.averageLevel.toFixed(1)}</div>
            <div className="text-xs text-slate-400">平均等级</div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/60">
        <h3 className="text-lg font-semibold mb-3 text-slate-100">快速操作</h3>
        <div className="flex gap-3">
          <button
            onClick={() => gainExperience(100)}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
          >
            <i className="fas fa-star mr-2"></i>
            获得经验
          </button>
          {levelInfo.canLevelUp && (
            <div className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-center">
              <i className="fas fa-level-up-alt mr-2"></i>
              可以升级！
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 召唤兽标签页
  const renderSummonsTab = () => (
    <div className="space-y-6">
      {/* 召唤兽概况 */}
      <div className="bg-slate-800/90 rounded-xl p-6 border border-slate-700/60">
        <h3 className="text-lg font-semibold mb-4 text-slate-100">召唤兽概况</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">{summonStats.total}</div>
            <div className="text-slate-400">总数量</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">{summonStats.totalPower.toLocaleString()}</div>
            <div className="text-slate-400">总战力</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{summonStats.averageLevel.toFixed(1)}</div>
            <div className="text-slate-400">平均等级</div>
          </div>
        </div>
      </div>

      {/* 品质分布 */}
      <div className="bg-slate-800/90 rounded-xl p-6 border border-slate-700/60">
        <h3 className="text-lg font-semibold mb-4 text-slate-100">品质分布</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {qualityConfig.names.map((qualityKey) => {
            const count = qualityCounts[qualityKey] || 0;
            const ownedCount = summonStats.qualityStats[qualityKey] || 0;
            const qualityDisplayName = getQualityDisplayName(qualityKey);
            const colorClass = `bg-quality-${qualityKey}`;

            return (
              <div key={qualityKey} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${colorClass} mr-2`}></div>
                  <span className="text-slate-300 text-sm">{qualityDisplayName}</span>
                </div>
                <span className="text-slate-400 text-sm">{ownedCount}只</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 图鉴进度 */}
      <div className="bg-slate-800/90 rounded-xl p-6 border border-slate-700/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">图鉴收集</h3>
          <span className="text-2xl font-bold text-green-400">
            {unlockProgress.unlocked}/{unlockProgress.total}
          </span>
        </div>
        <div className="w-full h-3 bg-slate-700/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${unlockProgress.percentage}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-slate-400">
          收集进度: {unlockProgress.percentage.toFixed(1)}%
        </div>
      </div>
    </div>
  );

  // 成就标签页
  const renderAchievementsTab = () => (
    <div className="space-y-6">
      {/* 成就总览 */}
      <div className="bg-slate-800/90 rounded-xl p-6 border border-slate-700/60">
        <h3 className="text-lg font-semibold mb-4 text-slate-100">成就总览</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400">{achievementSystem.unlockedCount}</div>
            <div className="text-slate-400">已解锁</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{achievementSystem.available.length}</div>
            <div className="text-slate-400">可解锁</div>
          </div>
        </div>
        <div className="mt-4 w-full h-3 bg-slate-700/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${achievementSystem.progress}%` }}
          />
        </div>
        <div className="mt-2 text-center text-slate-400">
          完成度: {achievementSystem.progress.toFixed(1)}%
        </div>
      </div>

      {/* 可解锁成就提示 */}
      {achievementSystem.available.length > 0 && (
        <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
          <div className="flex items-center">
            <i className="fas fa-star text-green-400 mr-3"></i>
            <div>
              <div className="text-green-300 font-medium">
                有 {achievementSystem.available.length} 个成就可以解锁！
              </div>
              <div className="text-sm text-green-200">
                {achievementSystem.available[0]?.title}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 能力标签页
  const renderAbilitiesTab = () => (
    <div className="space-y-6">
      {/* 召唤师能力 */}
      <div className="bg-slate-800/90 rounded-xl p-6 border border-slate-700/60">
        <h3 className="text-lg font-semibold mb-4 text-slate-100">召唤师能力</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-300">最大召唤兽数量</span>
            <span className="text-purple-400 font-bold">{summonStats.slots.max}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-300">背包容量</span>
            <span className="text-green-400 font-bold">{inventoryStats.slots.max}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-300">最高技能书等级</span>
            <span className="text-blue-400 font-bold">Lv.{playerCapabilities.maxSkillBookLevel}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-300">可炼制品质</span>
            <div className="flex gap-1">
              {playerCapabilities.availableRefinementQualities.map(quality => (
                <span key={quality} className={`px-2 py-1 rounded text-xs bg-quality-${quality} text-white`}>
                  {getQualityDisplayName(quality)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 状态提示 */}
      <div className="space-y-3">
        {!playerCapabilities.canSummonMore && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
            <div className="text-red-300 font-medium mb-2">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              召唤兽已满
            </div>
            <div className="text-sm text-red-200">
              提升等级可增加召唤兽容量
            </div>
          </div>
        )}

        {!playerCapabilities.hasInventorySpace && (
          <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-4">
            <div className="text-orange-300 font-medium mb-2">
              <i className="fas fa-box mr-2"></i>
              背包已满
            </div>
            <div className="text-sm text-orange-200">
              清理背包或提升等级扩容
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* 错误提示 */}
      {error && (
        <div className="mb-4 bg-red-900/50 border border-red-500/50 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center">
            <i className="fas fa-exclamation-triangle text-red-400 mr-2"></i>
            <span className="text-red-100 text-sm">{error}</span>
          </div>
          <button onClick={clearError} className="text-red-400 hover:text-red-300">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* 顶部标题区域 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">
          <i className="fas fa-user-circle text-blue-400/90 mr-2"></i>
          召唤师信息
        </h2>
        <p className="text-slate-400 text-sm">管理你的召唤兽和游戏进度</p>
      </div>

      {/* 标签页导航 */}
      <div className="flex space-x-1 mb-6 bg-slate-800/50 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <i className={`${tab.icon} mr-2`}></i>
            {tab.name}
          </button>
        ))}
      </div>

      {/* 标签页内容 */}
      {renderTabContent()}
    </div>
  );
};

export default PlayerInfo;
