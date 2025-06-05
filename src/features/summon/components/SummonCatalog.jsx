/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:08:02
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-06 06:47:15
 */
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSelector, useDispatch } from "react-redux";

// 使用图鉴系统和OOP召唤兽系统
import { useSummonManager } from "../../../hooks/useSummonManager";
import { summonConfig, qualityConfig } from "@/config/config";
import { skillConfig } from "@/config/skill/skillConfig";
import { FIVE_ELEMENT_COLORS, SUMMON_NATURE_CONFIG } from "@/config/enumConfig";
import {
  getPetTypeDisplayName,
  getFiveElementDisplayName,
  getAttributeDisplayName,
  getQualityDisplayName,
  getSummonNatureTypeDisplayName,
} from "@/config/ui/uiTextConfig";
import {
  selectUnlockedSummons,
  selectUnlockProgress,
  setFavorite,
  unlockSummon,
} from "../../../store/slices/summonCatalogSlice";

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
        className="bg-slate-800 rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl"
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
                        key={attr}
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
                        key={attr}
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
                  {summon.initialSkills?.map((skillId) => {
                    const skill = skillConfig.find((s) => s.id === skillId);
                    return (
                      <span
                        key={skillId}
                        className="px-3 py-1 text-sm font-medium rounded-full bg-sky-700 text-sky-100"
                      >
                        {isUnlocked ? skill?.name || skillId : "???"}
                      </span>
                    );
                  }) || <span className="text-slate-400">无初始技能</span>}
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
  const dispatch = useDispatch();
  const unlockedSummons = useSelector(selectUnlockedSummons);
  const unlockProgress = useSelector(selectUnlockProgress);
  const favoriteSummons = useSelector(
    (state) => state.summonCatalog.favoriteSummons || []
  );
  
  // 使用OOP召唤兽管理系统
  const { manager } = useSummonManager();

  // 筛选状态
  const [filters, setFilters] = useState({
    type: "all",
    quality: "all",
    element: "all",
    onlyUnlocked: false,
    onlyFavorites: false,
    searchText: "",
  });

  // 详细视图状态
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    summonSourceId: null,
  });

  // 获取所有召唤兽条目
  const summonEntries = Object.entries(summonConfig);

  // 筛选后的召唤兽
  const filteredSummons = useMemo(() => {
    return summonEntries.filter(([summonSourceId, summon]) => {
      // 类型筛选
      if (filters.type !== "all" && summon.type !== filters.type) {
        return false;
      }

      // 品质筛选
      if (filters.quality !== "all" && summon.quality !== filters.quality) {
        return false;
      }

      // 五行筛选
      if (filters.element !== "all" && summon.fiveElement !== filters.element) {
        return false;
      }

      // 仅显示已解锁
      if (filters.onlyUnlocked && !unlockedSummons[summonSourceId]) {
        return false;
      }

      // 仅显示收藏
      if (filters.onlyFavorites && !favoriteSummons.includes(summonSourceId)) {
        return false;
      }

      // 文本搜索
      if (
        filters.searchText &&
        !summon.name.toLowerCase().includes(filters.searchText.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [summonEntries, filters, unlockedSummons, favoriteSummons]);

  // 获取唯一的类型、品质、五行列表
  const uniqueTypes = [
    ...new Set(summonEntries.map(([_, summon]) => summon.type)),
  ];
  const uniqueQualities = [
    ...new Set(
      summonEntries.map(([_, summon]) => summon.quality).filter(Boolean)
    ),
  ];
  const uniqueElements = [
    ...new Set(summonEntries.map(([_, summon]) => summon.fiveElement)),
  ];

  const handleSelectSummon = (summonSourceId) => {
    // 使用OOP系统创建召唤兽实例
    const result = manager.createSummon(summonSourceId);

    if (result) {
      // 解锁图鉴
      if (!unlockedSummons[summonSourceId]) {
        const summonInfo = summonConfig[summonSourceId];
        dispatch(
          unlockSummon({
            summonSourceId,
            quality: summonInfo.quality || "normal",
          })
        );
      }

      onClose();
    } else {
      console.error("创建召唤兽失败");
    }
  };

  const openDetailModal = (summonSourceId) => {
    setDetailModal({ isOpen: true, summonSourceId });
  };

  const closeDetailModal = () => {
    setDetailModal({ isOpen: false, summonSourceId: null });
  };

  const toggleFavorite = (summonSourceId) => {
    const isFavorite = favoriteSummons.includes(summonSourceId);
    dispatch(setFavorite({ summonSourceId, isFavorite: !isFavorite }));
  };

  if (!isOpen) return null;

  // 处理ESC键关闭主模态框
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !detailModal.isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, detailModal.isOpen, onClose]);

  // 处理主模态框背景点击关闭
  const handleMainBackdropClick = (e) => {
    if (e.target === e.currentTarget && !detailModal.isOpen) {
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
        className="bg-slate-800 rounded-xl w-full max-w-7xl max-h-[88vh] overflow-hidden shadow-2xl shadow-purple-500/30 flex flex-col"
        onClick={handleMainContentClick}
      >
        <div className="flex justify-between items-center p-5 border-b border-slate-700">
          <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-purple-300">召唤兽图鉴</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-slate-400">
                总进度:{" "}
                <span className="text-white font-semibold">
                  {unlockProgress.unlocked}/{unlockProgress.total}
                </span>{" "}
                ({unlockProgress.percentage.toFixed(1)}%)
              </div>
              <div className="h-4 w-px bg-slate-600"></div>
              <div className="flex items-center gap-3">
                {/* 品质统计 */}
                {qualityConfig.names.map((quality) => {
                  const totalOfQuality = summonEntries.filter(
                    ([_, summon]) => summon.quality === quality
                  ).length;
                  const unlockedOfQuality = summonEntries.filter(
                    ([summonSourceId, summon]) =>
                      summon.quality === quality &&
                      unlockedSummons[summonSourceId]
                  ).length;

                  if (totalOfQuality === 0) return null;

                  return (
                    <div key={quality} className="flex items-center gap-1">
                      <div
                        className={`w-3 h-3 rounded-full ${qualityConfig.bgColors[quality]}`}
                      ></div>
                      <span className="text-xs text-slate-400">
                        {unlockedOfQuality}/{totalOfQuality}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <button
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-full"
            onClick={onClose}
            aria-label="Close catalog"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* 筛选器区域 */}
        <div className="p-4 border-b border-slate-700 bg-slate-700/60 space-y-3">
          {/* 搜索框 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
              <input
                type="text"
                placeholder="搜索召唤兽名称..."
                value={filters.searchText}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    searchText: e.target.value,
                  }))
                }
                className="w-full pl-10 pr-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* 快速筛选按钮 */}
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    onlyUnlocked: !prev.onlyUnlocked,
                  }))
                }
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.onlyUnlocked
                    ? "bg-purple-600 text-white"
                    : "bg-slate-600 text-slate-300 hover:bg-slate-500"
                }`}
              >
                <i className="fas fa-unlock mr-1"></i>
                已解锁
              </button>
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    onlyFavorites: !prev.onlyFavorites,
                  }))
                }
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.onlyFavorites
                    ? "bg-yellow-600 text-white"
                    : "bg-slate-600 text-slate-300 hover:bg-slate-500"
                }`}
              >
                <i className="fas fa-star mr-1"></i>
                收藏
              </button>

              {/* 开发者调试按钮 */}
              {process.env.NODE_ENV === "development" && (
                <button
                  onClick={() => {
                    // 解锁所有召唤兽用于测试
                    Object.entries(summonConfig).forEach(
                      ([summonSourceId, summon]) => {
                        if (!unlockedSummons[summonSourceId]) {
                          dispatch(
                            unlockSummon({
                              summonSourceId,
                              quality: summon.quality || "normal",
                            })
                          );
                        }
                      }
                    );
                  }}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-500 transition-colors"
                  title="开发者测试：解锁所有召唤兽"
                >
                  <i className="fas fa-key mr-1"></i>
                  解锁全部
                </button>
              )}
            </div>
          </div>

          {/* 详细筛选 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 类型筛选 */}
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, type: e.target.value }))
              }
              className="bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">所有类型</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {getPetTypeDisplayName(type)}
                </option>
              ))}
            </select>

            {/* 品质筛选 */}
            <select
              value={filters.quality}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, quality: e.target.value }))
              }
              className="bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">所有品质</option>
              {uniqueQualities.map((quality) => (
                <option key={quality} value={quality}>
                  {getQualityDisplayName(quality)}
                </option>
              ))}
            </select>

            {/* 五行筛选 */}
            <select
              value={filters.element}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, element: e.target.value }))
              }
              className="bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">所有五行</option>
              {uniqueElements.map((element) => (
                <option key={element} value={element}>
                  {getFiveElementDisplayName(element)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 召唤兽网格 */}
        <div className="overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[calc(88vh-240px)]">
          {filteredSummons.length === 0 && (
            <div className="col-span-full text-center py-10">
              <p className="text-slate-400 text-lg">未找到符合条件的召唤兽。</p>
            </div>
          )}

          {filteredSummons.map(([summonSourceId, summon]) => {
            const imageUrl =
              (summonSourceId &&
                images[`/src/assets/summons/${summonSourceId}.png`]?.default) ||
              images["/src/assets/summons/default.png"]?.default;

            const isUnlocked = !!unlockedSummons[summonSourceId];
            const isFavorite = favoriteSummons.includes(summonSourceId);
            const typeColorClass = summon.color
              ? `border-${summon.color}`
              : "border-slate-500";

            return (
              <div
                key={summonSourceId}
                className="group bg-slate-700/70 rounded-lg p-3 shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 flex flex-col border border-slate-600 hover:border-purple-400/80 relative"
              >
                {/* 收藏按钮 */}
                {isUnlocked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(summonSourceId);
                    }}
                    className={`absolute top-2 right-2 p-1 rounded-full transition-colors z-10 ${
                      isFavorite
                        ? "text-yellow-400 hover:text-yellow-300"
                        : "text-slate-400 hover:text-yellow-400"
                    }`}
                    title={isFavorite ? "取消收藏" : "添加收藏"}
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
                    className={`w-16 h-16 flex-shrink-0 mr-3 bg-slate-600/50 rounded-md flex items-center justify-center overflow-hidden border-2 ${typeColorClass} transition-colors duration-300 cursor-pointer`}
                    onClick={() => openDetailModal(summonSourceId)}
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
                      onClick={() => openDetailModal(summonSourceId)}
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
                        onClick={() => handleSelectSummon(summonSourceId)}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium py-1.5 px-2 rounded transition-colors"
                      >
                        {isUnlocked ? "选择" : "获得"}
                      </button>
                      <button
                        onClick={() => openDetailModal(summonSourceId)}
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
  );

  return (
    <>
      {createPortal(mainModalContent, document.body)}

      {/* 详细信息模态框 */}
      <SummonDetailModal
        summon={
          detailModal.summonSourceId
            ? summonConfig[detailModal.summonSourceId]
            : null
        }
        summonSourceId={detailModal.summonSourceId}
        isOpen={detailModal.isOpen}
        onClose={closeDetailModal}
        isUnlocked={!!unlockedSummons[detailModal.summonSourceId]}
        isFavorite={favoriteSummons.includes(detailModal.summonSourceId)}
        onToggleFavorite={() => toggleFavorite(detailModal.summonSourceId)}
      />
    </>
  );
};

export default SummonCatalog;
