import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { eggConfig } from "@/config/summon/eggConfig";
import { getQualityDisplayName } from "@/config/ui/uiTextConfig";
import { QUALITY_TYPES } from "@/config/enumConfig";
import {
  startIncubation,
  updateIncubationProgress,
  completeIncubation,
  cancelIncubation,
  selectIncubatingEggs,
  selectCompletedEggs,

} from "@/store/slices/incubatorSlice";
import { useSummonManager } from "@/hooks/useSummonManager";
import { summonConfig } from "@/config/summon/summonConfig";
import { playerBaseConfig } from "@/config/character/playerConfig";
import { useToast } from "@/hooks/useToast";
import { unlockSummon } from '@/store/slices/summonCatalogSlice';

export const Incubator = ({ toasts, setToasts }) => {
  const dispatch = useDispatch();
  const incubatingEggs = useSelector(selectIncubatingEggs);
  const completedEggs = useSelector(selectCompletedEggs);
  const { allSummons, createSummon } = useSummonManager();
  const [selectedEgg, setSelectedEgg] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [eggToCancel, setEggToCancel] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const { showResult } = useToast(toasts, setToasts);

  useEffect(() => {
    // 每秒更新孵化进度
    const timer = setInterval(() => {
      dispatch(updateIncubationProgress());
    }, 1000);

    // 立即执行一次更新，避免等待第一秒
    dispatch(updateIncubationProgress());

    return () => clearInterval(timer);
  }, [dispatch]);

  const handleCancelIncubation = (eggId) => {
    setEggToCancel(eggId);
    setShowConfirm(true);
  };

  const confirmCancel = () => {
    if (eggToCancel) {
      try {
        dispatch(cancelIncubation({ eggId: eggToCancel }));
        showResult("已取消孵化", "success");
      } catch (error) {
        console.error("Error cancelling incubation:", error);
        showResult("取消孵化失败", "error");
      }
    }
    setShowConfirm(false);
    setEggToCancel(null);
  };

  const handleStartIncubation = (eggType) => {
    const eggId = `egg_${Date.now()}`;
    try {
      dispatch(startIncubation({ eggId, eggType }));
      const eggData = eggConfig[eggType];
      showResult(`开始孵化${eggData.name}`, "success");
    } catch (error) {
      console.error("Error starting incubation:", error);
      showResult("开始孵化失败", "error");
    }
  };

  const handleCompleteIncubation = (eggId) => {
    const playerLevel = 1; // 这里需要从玩家状态中获取实际等级
    const currentSummonCount = Object.keys(allSummons).length;
    
    const action = dispatch(completeIncubation({ 
      eggId, 
      playerLevel,
      currentSummonCount
    }));

    if (action.payload.error) {
      setErrorMessage(action.payload.error);
      showResult(action.payload.error, "error");
      return;
    }

    if (action.payload.result) {
      const { summonType, summonQuality } = action.payload.result;

      const summonDataForCreation = {
        templateId: summonType,
        level: 1,
      };
      
      const result = createSummon(summonDataForCreation);

      if (result) {
        setErrorMessage(null);
        
        // 获取召唤兽名称和品质显示名
        const summonData = summonConfig[summonType];
        const qualityDisplayName = getQualityDisplayName(summonQuality);
        
        // 解锁图鉴
        dispatch(unlockSummon({ 
          summonSourceId: summonType, 
          quality: summonQuality 
        }));
        
        showResult(`恭喜！获得了一只${qualityDisplayName}品质的${summonData.name}！`, "success");
      } else {
        showResult("创建召唤兽失败", "error");
      }
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-900/95">
      {/* 顶部标题区域 */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-100 mb-2">
          <i className="fas fa-flask-vial text-amber-400/90 mr-3"></i>
          培养皿系统
        </h2>
        <p className="text-slate-400">孵化珍稀召唤兽，提升战斗力</p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
          {errorMessage}
        </div>
      )}

      {/* 可选择的蛋类型 */}
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 border border-slate-700/60">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-slate-100">
          <i className="fas fa-egg text-amber-400/90 mr-2"></i>
          可用蛋类型
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(eggConfig).map(([type, egg]) => (
            <div
              key={type}
              onClick={() => handleStartIncubation(type)}
              className="group relative bg-slate-800/60 rounded-lg border border-slate-700/60 p-4 cursor-pointer transform transition-all duration-300 hover:scale-102 hover:shadow-lg hover:border-amber-400/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-quality-${egg.color} to-transparent opacity-[0.03] rounded-lg transition-opacity group-hover:opacity-[0.05]"></div>
              <div className="flex items-center mb-3">
                <i
                  className={`fas ${egg.icon} text-2xl text-quality-${egg.color} opacity-90`}
                ></i>
                <h4 className="ml-2 font-bold text-slate-100">{egg.name}</h4>
              </div>
              <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                {egg.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full bg-quality-${egg.color} bg-opacity-10 text-quality-${egg.color} font-medium`}
                >
                  {getQualityDisplayName(egg.rarity)}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-700/60 text-slate-300">
                  <i className="fas fa-clock mr-1"></i>
                  {formatTime(egg.baseHatchTime)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 正在孵化的蛋 */}
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/60">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-slate-100">
          <i className="fas fa-vial text-amber-400/90 mr-2"></i>
          孵化中的蛋 ({Object.keys(incubatingEggs).length + Object.keys(completedEggs).length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 正在孵化的蛋 */}
          {Object.entries(incubatingEggs).map(([eggId, egg]) => {
            const eggData = eggConfig[egg.eggType];
            return (
              <div
                key={eggId}
                className={`relative overflow-hidden bg-slate-800/60 rounded-lg border border-slate-700/60 p-4 transform transition-all duration-300 hover:shadow-lg`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br from-quality-${egg.quality.toLowerCase()} to-transparent opacity-[0.03]`}
                ></div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <i
                      className={`fas ${eggData?.icon || 'fa-egg'} text-xl text-quality-${eggData?.color || 'normal'} opacity-90 mr-2`}
                    ></i>
                    <h4 className="font-bold text-slate-100">
                      {eggData?.name || egg.eggType}
                    </h4>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full bg-quality-${egg.quality.toLowerCase()} bg-opacity-10 text-quality-${egg.quality.toLowerCase()}`}
                  >
                    {getQualityDisplayName(egg.quality)}品质
                  </span>
                </div>

                <div className="mb-3">
                  <div className="relative w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full bg-quality-${egg.quality.toLowerCase()} opacity-90 transition-all duration-1000 rounded-full`}
                      style={{ width: `${egg.progress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer"></div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-slate-400">
                    <span>{Math.floor(egg.progress)}%</span>
                    <span>{formatTime(egg.remainingTime)}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 relative z-10">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700/60 transition-colors duration-200 cursor-pointer"
                    onClick={() => handleCancelIncubation(eggId)}
                  >
                    取消孵化
                  </button>
                </div>
              </div>
            );
          })}

          {/* 已完成的蛋 */}
          {Object.entries(completedEggs).map(([eggId, egg]) => {
            const eggData = eggConfig[egg.eggType];
            return (
              <div
                key={eggId}
                className="relative overflow-hidden bg-slate-800/60 rounded-lg border border-slate-700/60 p-4 transform transition-all duration-300 hover:shadow-lg"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br from-quality-${egg.quality.toLowerCase()} to-transparent opacity-[0.03]`}
                ></div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <i
                      className={`fas ${eggData?.icon || 'fa-egg'} text-xl text-quality-${eggData?.color || 'normal'} opacity-90 mr-2`}
                    ></i>
                    <h4 className="font-bold text-slate-100">
                      {eggData?.name || egg.eggType}
                    </h4>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full bg-quality-${egg.quality.toLowerCase()} bg-opacity-10 text-quality-${egg.quality.toLowerCase()}`}
                  >
                    {getQualityDisplayName(egg.quality)}品质
                  </span>
                </div>

                <div className="mb-3">
                  <div className="relative w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full bg-quality-${egg.quality.toLowerCase()} opacity-90 rounded-full`}
                      style={{ width: '100%' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer"></div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 text-center">
                    孵化完成
                  </div>
                </div>

                <div className="flex justify-end space-x-2 relative z-10">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors duration-200 cursor-pointer"
                    onClick={() => handleCompleteIncubation(eggId)}
                  >
                    取出召唤兽
                  </button>
                </div>
              </div>
            );
          })}

          {Object.keys(incubatingEggs).length === 0 && Object.keys(completedEggs).length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-500">
              <i className="fas fa-egg text-4xl mb-3 opacity-30"></i>
              <p>暂无正在孵化的蛋</p>
            </div>
          )}
        </div>
      </div>

      {/* 取消确认对话框 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="bg-slate-800/95 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-bold mb-4 text-slate-100">
              确认取消孵化？
            </h4>
            <p className="text-slate-400 mb-6">
              取消孵化后，该蛋将会消失，确定要继续吗？
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700/60 transition-colors duration-200 cursor-pointer"
                onClick={() => {
                  setShowConfirm(false);
                  setEggToCancel(null);
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors duration-200 cursor-pointer"
                onClick={confirmCancel}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
