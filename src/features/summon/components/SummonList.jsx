import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { petConfig, qualityConfig, skillConfig } from "../../../config/config";
import CommonModal from "../../ui/components/CommonModal";
import { selectAllSummons, setCurrentSummon } from "../../../store/slices/summonSlice";
import { 
  uiText, 
  getAttributeDisplayName, 
  getRaceTypeDisplayName,
  getQualityDisplayName,
  getPetTypeDisplayName 
} from "@/config/uiTextConfig";

const SummonList = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const allSummons = useSelector(selectAllSummons);
  const summonsList = Object.values(allSummons || {});

  const handleSelectSummon = (summonId) => {
    dispatch(setCurrentSummon(summonId));
    onClose();
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

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} title={uiText.titles.petList}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-h-[70vh] overflow-y-auto">
        {summonsList.map((summon) => {
          const petInfo = petConfig[summon.petId];
          const displayName = petInfo.name;
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
                      {getPetTypeDisplayName(petInfo.type)}
                    </span>
                    <span className="text-sm text-gray-300">
                      {getRaceTypeDisplayName(petInfo.race)}
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
                    <div className="text-xs text-gray-400 mb-1">{uiText.titles.skills}:</div>
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
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CommonModal>
  );
};

export default SummonList; 