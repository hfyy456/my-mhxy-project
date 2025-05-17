import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { petConfig, qualityConfig } from "../../../config/config";
import CommonModal from "../../ui/components/CommonModal";
import { selectAllSummons, setCurrentSummon } from "../../../store/slices/summonSlice";

const SummonList = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const allSummons = useSelector(selectAllSummons);
  const summonsList = Object.values(allSummons || {});

  const typeText = {
    法攻: "法术攻击型",
    物攻: "物理攻击型",
    速度: "速度型",
    生命: "防御型",
    辅助: "辅助型",
  };

  const handleSelectSummon = (summonId) => {
    dispatch(setCurrentSummon(summonId));
    onClose();
  };

  const getTypeColor = (type) => {
    const colorMap = {
      法攻: "from-blue-600 to-blue-700",
      物攻: "from-red-600 to-red-700",
      速度: "from-green-600 to-green-700",
      生命: "from-teal-600 to-teal-700",
      辅助: "from-purple-600 to-purple-700",
    };
    return colorMap[type] || "from-gray-600 to-gray-700";
  };

  // 获取品质对应的样式类名
  const getQualityClass = (quality) => {
    const qualityStyle = qualityConfig.colors[quality]?.split('-')[1] || 'normal';
    return `text-quality-${qualityStyle}`;
  };

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} title="选择召唤兽">
      <div className="p-4">
        {summonsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <i className="fas fa-ghost text-6xl text-gray-400 mb-4 animate-bounce"></i>
            <p className="text-gray-400 text-lg mb-2">暂无召唤兽</p>
            <p className="text-gray-500 text-sm">请先通过炼妖获取召唤兽</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {summonsList.map((summon) => {
              const petInfo = petConfig[summon.name] || {};
              const typeGradient = getTypeColor(petInfo.type);
              const qualityClassName = getQualityClass(summon.quality);
              return (
                <div
                  key={summon.id}
                  onClick={() => handleSelectSummon(summon.id)}
                  className="group relative bg-slate-800/50 rounded-xl p-4 cursor-pointer transform transition-all duration-300 hover:scale-102 hover:-translate-y-1 border border-slate-600/50 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
                >
                  {/* 背景装饰 */}
                  <div className="absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
                  
                  {/* 主要内容 */}
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors duration-300">
                        {summon.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${typeGradient} text-white shadow-sm`}>
                        {typeText[petInfo.type] || petInfo.type}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {/* 品质和等级 */}
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-medium ${qualityClassName}`}>
                          品质: {summon.quality}
                        </span>
                        <span className="text-sm text-amber-400">
                          等级: {summon.level}
                        </span>
                      </div>
                      
                      {/* 属性展示 */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {Object.entries(summon.basicAttributes || {}).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between bg-slate-700/50 rounded px-2 py-1">
                            <span className="text-xs text-gray-400">
                              {key === 'constitution' && '体质'}
                              {key === 'strength' && '力量'}
                              {key === 'agility' && '敏捷'}
                              {key === 'intelligence' && '智力'}
                              {key === 'luck' && '运气'}
                            </span>
                            <span className="text-xs font-medium text-gray-200">{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* 技能展示 */}
                      <div className="mt-3">
                        <div className="text-xs text-gray-400 mb-1">已学技能:</div>
                        <div className="flex flex-wrap gap-1">
                          {(summon.skillSet || []).map((skill, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-slate-700/70 text-gray-200 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 选择按钮 */}
                    <button
                      onClick={() => handleSelectSummon(summon.id)}
                      className="mt-4 w-full py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg text-sm transition-all duration-300 flex items-center justify-center group-hover:shadow-lg"
                    >
                      <i className="fas fa-check mr-2"></i>
                      选择此召唤兽
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CommonModal>
  );
};

export default SummonList; 