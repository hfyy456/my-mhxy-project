import React, { useState } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { petConfig, qualityConfig, skillConfig } from "../../../config/config";
import { selectAllSummons, setCurrentSummon, releaseSummon } from "../../../store/slices/summonSlice";
import { 
  uiText, 
  getAttributeDisplayName, 
  getRaceTypeDisplayName,
  getQualityDisplayName,
  getPetTypeDisplayName 
} from "@/config/uiTextConfig";

const SummonList = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const summons = useSelector(selectAllSummons);
  const [summonToRelease, setSummonToRelease] = useState(null);

  const handleSelectSummon = (summonId) => {
    dispatch(setCurrentSummon(summonId));
    onClose();
  };

  const handleReleaseClick = (summon) => {
    setSummonToRelease(summon);
  };

  const handleReleaseConfirm = () => {
    if (summonToRelease) {
      dispatch(releaseSummon(summonToRelease.id));
      setSummonToRelease(null);
    }
  };

  const getTypeColor = (type) => {
    const colorMap = {
      physical: "from-red-600 to-red-700",
      magical: "from-blue-600 to-blue-700",
      speed: "from-green-600 to-green-700",
      defense: "from-teal-600 to-teal-700",
      support: "from-purple-600 to-purple-700",
    };
    return colorMap[type] || "from-gray-600 to-gray-700";
  };

  // 获取品质对应的样式类名
  const getQualityClass = (quality) => {
    return quality ? `text-${qualityConfig.colors[quality]}` : 'text-gray-400';
  };

  // 获取技能名称
  const getSkillName = (skillId) => {
    const skill = skillConfig.find(s => s.id === skillId);
    return skill ? skill.name : skillId;
  };

  if (!isOpen) return null;

  // 空状态显示
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-24 h-24 mb-4 text-slate-600">
        <i className="fa-solid fa-paw text-6xl"></i>
      </div>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">暂无召唤兽</h3>
      <p className="text-gray-400 max-w-sm">
        您还没有任何召唤兽，可以通过炼妖或任务获得召唤兽。
      </p>
      <div className="mt-6 flex gap-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          关闭
        </button>
        <button
          onClick={() => {
            onClose();
            // 这里可以添加跳转到炼妖界面的逻辑
          }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          去炼妖
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">召唤兽列表</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {Object.keys(summons).length === 0 ? (
            <div className="col-span-2">
              <EmptyState />
            </div>
          ) : (
            Object.values(summons).map((summon) => {
              const petInfo = petConfig[summon.petId];
              const displayName = petInfo?.name || summon.name;
              const typeGradient = getTypeColor(petInfo?.type);
              const qualityClassName = getQualityClass(summon.quality);

              return (
                <div
                  key={summon.id}
                  className="group relative bg-slate-800/50 rounded-xl p-4 cursor-pointer transform transition-all duration-300 hover:scale-102 hover:-translate-y-1 border border-slate-600/50 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
                >
                  {/* 背景装饰 */}
                  <div className="absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
                  
                  {/* 主要内容 */}
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                        <h3 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors duration-300">
                          {displayName}
                        </h3>
                        {summon.nickname && (
                          <span className="text-sm text-gray-400 italic mt-1">
                            昵称：{summon.nickname}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${typeGradient} text-white shadow-sm`}>
                          {getPetTypeDisplayName(petInfo?.type)}
                        </span>
                        <span className="text-sm text-gray-300">
                          {getRaceTypeDisplayName(petInfo?.race)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {/* 品质和等级 */}
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-medium ${qualityClassName}`}>
                          {uiText.labels.quality} {getQualityDisplayName(summon.quality)}
                        </span>
                        <span className="text-sm text-amber-400">
                          {uiText.labels.level} {summon.level}
                        </span>
                      </div>
                      
                      {/* 属性展示 */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {Object.entries(summon.basicAttributes || {}).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between bg-slate-700/50 rounded px-2 py-1">
                            <span className="text-xs text-gray-400">
                              {getAttributeDisplayName(key)}
                            </span>
                            <span className="text-xs font-medium text-gray-200">{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* 技能展示 */}
                      <div className="mt-3">
                        <div className="text-xs text-gray-400 mb-1">{uiText.titles.skillSet}:</div>
                        <div className="flex flex-wrap gap-1">
                          {(summon.skillSet || []).map((skillId, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-slate-700/70 text-gray-200 rounded hover:bg-slate-600/70 transition-colors"
                            >
                              {getSkillName(skillId)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex justify-end space-x-2 mt-3">
                        <button
                          onClick={() => handleSelectSummon(summon.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
                        >
                          选择
                        </button>
                        <button
                          onClick={() => handleReleaseClick(summon)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm transition-colors"
                        >
                          释放
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 释放确认对话框 */}
        {summonToRelease && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">确认释放</h3>
              <p className="text-gray-300 mb-6">
                确定要释放召唤兽 {summonToRelease.nickname || summonToRelease.name} 吗？此操作不可撤销。
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setSummonToRelease(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
                >
                  取消
                </button>
                <button
                  onClick={handleReleaseConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded"
                >
                  确认释放
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummonList; 