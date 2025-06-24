/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:08:02
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-07 05:25:18
 */
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

// 使用图鉴系统和OOP召唤兽系统
import { useSummonManager } from "../../../hooks/useSummonManager";
import { usePlayerManager } from "@/hooks/usePlayerManager";
import { summonConfig } from "@/config/config";
import { skillConfig } from "@/config/skill/skillConfig";
import { FIVE_ELEMENT_COLORS, SUMMON_NATURE_CONFIG } from "@/config/enumConfig";
import {
  getPetTypeDisplayName,
  getFiveElementDisplayName,
  getAttributeDisplayName,
  getQualityDisplayName,
  getSummonNatureTypeDisplayName,
} from "@/config/ui/uiTextConfig";

// 加载召唤兽图片
const images = import.meta.glob("@/assets/summons/*.png", {
  eager: true,
});

// 详细信息模态框组件
const SummonDetailModal = ({
  summon,
  summonSourceId,
  isOpen,
  onClose,
  isUnlocked,
  isFavorite,
  onToggleFavorite,
}) => {
  if (!isOpen || !summon) return null;

  const imageUrl =
    (summonSourceId &&
      images[`/src/assets/summons/${summonSourceId}.png`]?.default) ||
    images["/src/assets/summons/default.png"]?.default;

  // 处理ESC键关闭
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 处理背景点击关闭
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 阻止内容区域点击冒泡
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[9999]"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-theme-modal rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl"
        onClick={handleContentClick}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-purple-300">
              {summon.name}
            </h2>
            {isUnlocked && (
              <button
                onClick={onToggleFavorite}
                className={`p-2 rounded-full transition-colors ${
                  isFavorite
                    ? "text-yellow-400 hover:text-yellow-300"
                    : "text-slate-400 hover:text-yellow-400"
                }`}
                title={isFavorite ? "取消收藏" : "添加收藏"}
              >
                <i
                  className={`fas ${
                    isFavorite ? "fa-star" : "fa-star"
                  } text-lg`}
                ></i>
              </button>
            )}
          </div>
          <button
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-full"
            onClick={onClose}
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="overflow-y-auto p-4 max-h-[calc(85vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 左侧：图片和基本信息 */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt={summon.name}
                    className={`w-48 h-48 object-contain border-4 rounded-xl ${
                      summon.color
                        ? `border-${summon.color}`
                        : "border-slate-500"
                    } ${!isUnlocked ? "filter grayscale opacity-50" : ""}`}
                    onError={(e) => {
                      e.target.src =
                        images["/src/assets/summons/default.png"]?.default;
                    }}
                  />
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-xl">
                      <i className="fas fa-lock text-4xl text-slate-400"></i>
                    </div>
                  )}
                </div>
              </div>

              {/* 标签区域 */}
              <div className="flex flex-wrap justify-center gap-2">
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full bg-${
                    summon.color?.split("-")[0]
                  }-600 text-${summon.color?.split("-")[0]}-100`}
                >
                  {getPetTypeDisplayName(summon.type)}
                </span>
                {summon.quality && (
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      qualityConfig.bgColors?.[summon.quality] || "bg-slate-600"
                    } ${
                      qualityConfig.textColors?.[summon.quality] ||
                      "text-slate-100"
                    }`}
                  >
                    {getQualityDisplayName(summon.quality)}
                  </span>
                )}
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    FIVE_ELEMENT_COLORS[summon.fiveElement] ||
                    "bg-gray-500 text-white"
                  }`}
                >
                  {getFiveElementDisplayName(summon.fiveElement)}
                </span>
                {summon.natureType && (
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      SUMMON_NATURE_CONFIG[summon.natureType]?.bgColor ||
                      "bg-slate-600"
                    } ${
                      SUMMON_NATURE_CONFIG[summon.natureType]?.color ||
                      "text-white"
                    }`}
                  >
                    {getSummonNatureTypeDisplayName(summon.natureType)}
                  </span>
                )}
              </div>

              {/* 背景描述 */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-purple-300 mb-2">
                  背景描述
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  {isUnlocked ? summon.background : "???"}
                </p>
              </div>
            </div>

            {/* 右侧：详细属性信息 */}
            <div className="space-y-4">
              {/* 成长率 */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-purple-300 mb-3">
                  成长率
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(summon.growthRates || {}).map(
                    ([attr, value]) => (
                      <div
                        key={`growth-${attr}`}
                        className="flex justify-between items-center"
                      >
                        <span className="text-slate-400">
                          {getAttributeDisplayName(attr)}:
                        </span>
                        <span className="font-semibold text-white">
                          {isUnlocked ? (value || 0).toFixed(3) : "???"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* 初始属性范围 */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-purple-300 mb-3">
                  初始属性范围
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(summon.basicAttributeRanges || {}).map(
                    ([attr, range]) => (
                      <div
                        key={`range-${attr}`}
                        className="flex justify-between items-center"
                      >
                        <span className="text-slate-400">
                          {getAttributeDisplayName(attr)}:
                        </span>
                        <span className="font-semibold text-white">
                          {isUnlocked ? range?.join?.("-") || "未知" : "???"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* 初始技能 */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-purple-300 mb-3">
                  初始技能
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(summon.guaranteedInitialSkills || []).map((skillId) => {
                    const skill = skillConfig.find((s) => s.id === skillId);
                    return (
                      <span
                        key={`gskill-${skillId}`}
                        title={skill?.description || '必带技能'}
                        className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-600 text-yellow-900"
                      >
                        {isUnlocked ? skill?.name || skillId : "???"}
                      </span>
                    );
                  })}
                  {(summon.initialSkillPool || []).map((skillId, index) => {
                    const skill = skillConfig.find((s) => s.id === skillId);
                    return (
                      <span
                        key={`pskill-${skillId}-${index}`}
                        title={skill?.description || '可能携带的技能'}
                        className="px-3 py-1 text-sm font-medium rounded-full bg-sky-700 text-sky-100"
                      >
                        {isUnlocked ? skill?.name || skillId : "???"}
                      </span>
                    );
                  })}
                  {(!summon.guaranteedInitialSkills && !summon.initialSkillPool) && (
                    <span className="text-slate-400">无初始技能</span>
                  )}
                </div>
              </div>

              {/* 获得信息 */}
              {isUnlocked && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-purple-300 mb-3">
                    获得信息
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">获得途径:</span>
                      <span className="text-white">蛋孵化、召唤</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">稀有度:</span>
                      <span className="text-white">
                        {getQualityDisplayName(summon.quality || "normal")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

const SummonCatalog = ({ isOpen, onClose }) => {
  const { allSummonTemplates = [], ...summonManagerRest } = useSummonManager();
  const { player: playerState, manager: playerManager } = usePlayerManager();
  const unlockedSummons = useMemo(() => new Set(playerState.discoveredSummons || []), [playerState.discoveredSummons]);

  const [selectedSummonId, setSelectedSummonId] = useState(null);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  
  // 收藏状态暂时移至本地管理
  const [favorites, setFavorites] = useState(() => {
    try {
      const savedFavorites = localStorage.getItem('summon_catalog_favorites');
      return savedFavorites ? new Set(JSON.parse(savedFavorites)) : new Set();
    } catch (error) {
      return new Set();
    }
  });

  const unlockedCount = unlockedSummons.size;
  const totalCount = allSummonTemplates.length;
  const unlockProgress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  // 调试用：解锁所有图鉴
  const unlockAllForDebug = () => {
    allSummonTemplates.forEach(template => {
      playerManager.discoverSummon(template.id);
    });
  };

  const handleSelectSummon = (summonSourceId) => {
    const summon = allSummonTemplates.find((s) => s.id === summonSourceId);
    if (summon) {
      openDetailModal(summonSourceId);
    }
  };

  const openDetailModal = (summonSourceId) => {
    setSelectedSummonId(summonSourceId);
    setDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedSummonId(null);
  };

  const toggleFavorite = (summonSourceId) => {
    setFavorites(prevFavorites => {
      const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(summonSourceId)) {
        newFavorites.delete(summonSourceId);
      } else {
        newFavorites.add(summonSourceId);
      }
      localStorage.setItem('summon_catalog_favorites', JSON.stringify([...newFavorites]));
      return newFavorites;
    });
  };

  if (!isOpen) return null;

  // 处理ESC键关闭主模态框
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isDetailModalOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isDetailModalOpen, onClose]);

  // 处理主模态框背景点击关闭
  const handleMainBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isDetailModalOpen) {
      onClose();
    }
  };

  // 阻止主模态框内容区域点击冒泡
  const handleMainContentClick = (e) => {
    e.stopPropagation();
  };

  const mainModalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[9998] transition-opacity duration-300"
      onClick={handleMainBackdropClick}
    >
      <div 
        className="relative bg-theme-modal rounded-xl w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={handleMainContentClick}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-purple-300">召唤兽图鉴</h2>
          <div className="flex items-center gap-2">
            <button onClick={unlockAllForDebug} className="text-xs px-2 py-1 bg-yellow-600 rounded">调试：解锁全部</button>
            <button
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-full"
              onClick={onClose}
              aria-label="Close catalog"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {allSummonTemplates.map((summon) => {
              const isUnlocked = unlockedSummons.has(summon.id);
              const imageUrl =
                images[`/src/assets/summons/${summon.id}.png`]?.default ||
                images["/src/assets/summons/default.png"]?.default;

              return (
                <div
                  key={summon.id}
                  className="group bg-slate-700/70 rounded-lg p-3 shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 flex flex-col border border-slate-600 hover:border-purple-400/80 relative"
                >
                  {/* 收藏按钮 */}
                  {isUnlocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(summon.id);
                      }}
                      className={`absolute top-2 right-2 p-1 rounded-full transition-colors z-10 ${
                        favorites.has(summon.id)
                          ? "text-yellow-400 hover:text-yellow-300"
                          : "text-slate-400 hover:text-yellow-400"
                      }`}
                      title={favorites.has(summon.id) ? "取消收藏" : "添加收藏"}
                    >
                      <i className={`fas fa-star text-sm`}></i>
                    </button>
                  )}

                  {/* 解锁状态指示器 */}
                  {!isUnlocked && (
                    <div className="absolute top-2 left-2 bg-slate-800 rounded-full p-1">
                      <i className="fas fa-lock text-slate-400 text-xs"></i>
                    </div>
                  )}

                  <div className="flex items-start mb-2">
                    <div
                      className={`w-16 h-16 flex-shrink-0 mr-3 bg-slate-600/50 rounded-md flex items-center justify-center overflow-hidden border-2 ${
                        summon.color
                          ? `border-${summon.color}`
                          : "border-slate-500"
                      } transition-colors duration-300 cursor-pointer`}
                      onClick={() => openDetailModal(summon.id)}
                    >
                      <img
                        src={imageUrl}
                        alt={summon.name}
                        className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 ${
                          !isUnlocked ? "filter grayscale opacity-50" : ""
                        }`}
                        onError={(e) => {
                          e.target.src =
                            images["/src/assets/summons/default.png"]?.default;
                        }}
                      />
                    </div>

                    <div className="flex-grow min-w-0">
                      <h3
                        className="text-sm font-semibold text-purple-300 mb-1 truncate cursor-pointer hover:text-purple-200"
                        title={summon.name}
                        onClick={() => openDetailModal(summon.id)}
                      >
                        {isUnlocked ? summon.name : "???"}
                      </h3>
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-${
                            summon.color?.split("-")[0]
                          }-600 text-${summon.color?.split("-")[0]}-100`}
                        >
                          {isUnlocked
                            ? getPetTypeDisplayName(summon.type)
                            : "???"}
                        </span>
                        {summon.quality && isUnlocked && (
                          <span 
                            className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ml-1 ${
                              qualityConfig.bgColors?.[summon.quality] ||
                              "bg-slate-600"
                            } ${
                              qualityConfig.textColors?.[summon.quality] ||
                              "text-slate-100"
                            }`}
                          >
                            {getQualityDisplayName(summon.quality)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col flex-grow">
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2 flex-shrink-0">
                      {isUnlocked ? summon.background : "获得后解锁详细信息"}
                    </p>

                    <div className="mt-auto pt-2 space-y-2">
                      {isUnlocked && (
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`inline-block px-1.5 py-0.5 text-xs rounded-full ${
                              FIVE_ELEMENT_COLORS[summon.fiveElement] ||
                              "bg-gray-500 text-white"
                            }`}
                          >
                            {getFiveElementDisplayName(summon.fiveElement)}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectSummon(summon.id)}
                          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium py-1.5 px-2 rounded transition-colors"
                        >
                          {isUnlocked ? "选择" : "获得"}
                        </button>
                        <button
                          onClick={() => openDetailModal(summon.id)}
                          className="bg-slate-600 hover:bg-slate-500 text-white text-xs font-medium py-1.5 px-2 rounded transition-colors"
                          title="查看详情"
                        >
                          <i className="fas fa-info"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(mainModalContent, document.body)}

      {/* 详细信息模态框 */}
      {selectedSummonId && (
        <SummonDetailModal
          summon={allSummonTemplates.find((s) => s.id === selectedSummonId)}
          summonSourceId={selectedSummonId}
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          isUnlocked={unlockedSummons.has(selectedSummonId)}
          isFavorite={favorites.has(selectedSummonId)}
          onToggleFavorite={() => toggleFavorite(selectedSummonId)}
        />
      )}
    </>
  );
};

export default SummonCatalog;
