import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { eggConfig } from '@/config/eggConfig';
import { getQualityDisplayName } from '@/config/uiTextConfig';
import { QUALITY_TYPES } from '@/config/enumConfig';
import { 
  startIncubation, 
  updateIncubationProgress, 
  completeIncubation, 
  cancelIncubation,
  selectIncubatingEggs 
} from '@/store/slices/incubatorSlice';
import { addSummon } from '@/store/slices/summonSlice';

export const Incubator = () => {
  const dispatch = useDispatch();
  const incubatingEggs = useSelector(selectIncubatingEggs);
  const [selectedEgg, setSelectedEgg] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [eggToCancel, setEggToCancel] = useState(null);

  useEffect(() => {
    // 每秒更新孵化进度
    const timer = setInterval(() => {
      dispatch(updateIncubationProgress());
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatch]);

  const handleCancelIncubation = (eggId) => {
    console.log('Cancelling egg:', eggId);
    setEggToCancel(eggId);
    setShowConfirm(true);
  };

  const confirmCancel = () => {
    console.log('Confirming cancel for egg:', eggToCancel);
    if (eggToCancel) {
      try {
        dispatch(cancelIncubation({ eggId: eggToCancel }));
      } catch (error) {
        console.error('Error cancelling incubation:', error);
      }
    }
    setShowConfirm(false);
    setEggToCancel(null);
  };

  const handleStartIncubation = (eggType) => {
    const eggId = Date.now().toString();
    dispatch(startIncubation({ eggId, eggType }));
    const egg = incubatingEggs.find(egg => egg.eggId === eggId);
    if (egg) {
      setSelectedEgg({
        type: eggType,
        quality: egg.quality,
        name: eggConfig[eggType].name
      });
      setTimeout(() => setSelectedEgg(null), 3000);
    }
  };

  const handleCompleteIncubation = (eggId) => {
    const result = { eggId };
    dispatch(completeIncubation(result));
    
    if (result.result) {
      // 添加新的召唤兽到Redux
      dispatch(addSummon({
        id: Date.now().toString(),
        name: result.result.petType,
        level: 1,
        quality: result.result.petQuality,
        basicAttributes: result.result.petData.baseAttributes,
        race: result.result.petData.race,
      }));

      setSelectedEgg({
        type: result.result.eggType,
        quality: result.result.petQuality,
        name: result.result.petType,
        isComplete: true
      });
      setTimeout(() => setSelectedEgg(null), 3000);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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

      {/* 新获得的蛋或孵化结果提示 */}
      {selectedEgg && (
        <div className="fixed top-4 right-4 bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-lg p-4 animate-slide-in-right z-50 border-l-4 border-amber-400/50">
          <div className="flex items-center">
            <i className="fas fa-egg text-amber-400/90 text-xl mr-3"></i>
            <div>
              <h4 className="font-bold text-slate-100">
                {selectedEgg.isComplete ? "孵化成功！" : "获得新的蛋！"}
              </h4>
              <p className="text-sm text-slate-400">
                {selectedEgg.isComplete
                  ? `你的蛋孵化出了一只${getQualityDisplayName(selectedEgg.quality)}品质的${selectedEgg.name}！`
                  : `获得了一枚${getQualityDisplayName(selectedEgg.quality)}品质的${selectedEgg.name}！`}
              </p>
            </div>
          </div>
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
                <i className={`fas ${egg.icon} text-2xl text-quality-${egg.color} opacity-90`}></i>
                <h4 className="ml-2 font-bold text-slate-100">{egg.name}</h4>
              </div>
              <p className="text-sm text-slate-400 mb-3 line-clamp-2">{egg.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-1 rounded-full bg-quality-${egg.color} bg-opacity-10 text-quality-${egg.color} font-medium`}>
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
          孵化中的蛋 ({incubatingEggs.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incubatingEggs.map((egg) => (
            <div
              key={egg.eggId}
              className={`relative overflow-hidden bg-slate-800/60 rounded-lg border border-slate-700/60 p-4 transform transition-all duration-300 hover:shadow-lg`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-quality-${egg.quality.toLowerCase()} to-transparent opacity-[0.03]`}></div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <i className={`fas ${egg.eggData.icon} text-xl text-quality-${egg.eggData.color} opacity-90 mr-2`}></i>
                  <h4 className="font-bold text-slate-100">{egg.eggData.name}</h4>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full bg-quality-${egg.quality.toLowerCase()} bg-opacity-10 text-quality-${egg.quality.toLowerCase()}`}>
                  {getQualityDisplayName(egg.quality)}品质
                </span>
              </div>

              <div className="mb-3">
                <div className="relative w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full bg-quality-${egg.quality.toLowerCase()} opacity-90 transition-all duration-1000 rounded-full`}
                    style={{ width: `${egg.progress.toFixed(2)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer"></div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-400">
                  <span>{egg.progress.toFixed(2)}%</span>
                  <span>{formatTime(egg.remainingTime)}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 relative z-10">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700/60 transition-colors duration-200 cursor-pointer"
                  onClick={() => {
                    console.log('Cancel button clicked for egg:', egg.eggId);
                    handleCancelIncubation(egg.eggId);
                  }}
                >
                  取消孵化
                </button>
                {egg.isComplete && (
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-quality-${egg.quality.toLowerCase()} bg-opacity-90 hover:bg-opacity-100 transition-colors duration-200 cursor-pointer`}
                    onClick={() => handleCompleteIncubation(egg.eggId)}
                  >
                    完成孵化
                  </button>
                )}
              </div>
            </div>
          ))}
          {incubatingEggs.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-500">
              <i className="fas fa-egg text-4xl mb-3 opacity-30"></i>
              <p>暂无正在孵化的蛋</p>
            </div>
          )}
        </div>
      </div>

      {/* 取消确认对话框 */}
      {showConfirm && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div 
            className="bg-slate-800/95 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h4 className="text-lg font-bold mb-4 text-slate-100">确认取消孵化？</h4>
            <p className="text-slate-400 mb-6">取消孵化后，该蛋将会消失，确定要继续吗？</p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700/60 transition-colors duration-200 cursor-pointer"
                onClick={() => {
                  console.log('Cancel dialog closed');
                  setShowConfirm(false);
                  setEggToCancel(null);
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-500 transition-colors duration-200 cursor-pointer"
                onClick={() => {
                  console.log('Confirm cancel clicked');
                  confirmCancel();
                }}
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