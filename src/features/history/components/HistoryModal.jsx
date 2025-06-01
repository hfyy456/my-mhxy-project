/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 01:44:03
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-16 03:19:34
 */
import React from "react";
import { qualityConfig, skillConfig, skillTypeConfig, summonConfig } from "@/config/config";
import CommonModal from "@/features/ui/components/CommonModal";
import { getQualityDisplayName, getSkillTypeDisplayName } from "@/config/ui/uiTextConfig";

const HistoryModal = ({ historyList, isOpen, onClose }) => {
  return (
    <CommonModal isOpen={isOpen} onClose={onClose} title="历史召唤兽记录">
      <div id="historyContent" className="space-y-4">
        {historyList.length === 0 ? (
          <p className="text-gray-400 italic text-center py-8">暂无历史记录。</p>
        ) : (
          historyList.map((summon, index) => {
            const displayName = summonConfig[summon.name]?.name || summon.name;
            const qualityColorName = qualityConfig.colors[summon.quality] || 'normal';
            return (
              <div
                key={index}
                className="bg-slate-700/40 border border-slate-600 rounded-lg p-4 mb-3 hover:border-purple-500/70 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-purple-300">
                    {displayName}
                    <span className={`text-${qualityColorName} ml-2`}>
                      ({getQualityDisplayName(summon.quality)})
                    </span>
                  </h4>
                  <span className="text-xs text-gray-400">
                    炼妖 #{index + 1}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">攻击:</span>
                    <span className="font-medium text-gray-100">{summon.attack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">防御:</span>
                    <span className="font-medium text-gray-100">{summon.defense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">速度:</span>
                    <span className="font-medium text-gray-100">{summon.speed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">气血:</span>
                    <span className="font-medium text-gray-100">{summon.hp}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {summon.skillSet.map((skillName) => {
                    const skillInfo = skillConfig.find(
                      (s) => s.name === skillName
                    );
                    const typeColor = skillInfo && skillTypeConfig[skillInfo.type] ? skillTypeConfig[skillInfo.type].color : 'gray-500';
                    const bgColorClass = `bg-${typeColor.replace('-500', '-700')}`;
                    const textColorClass = `text-${typeColor.replace('-500', '-200')}`;
                    
                    return (
                      <span
                        key={skillName}
                        className={`px-2 py-1 rounded text-xs font-medium ${bgColorClass} ${textColorClass} border border-transparent hover:border-current`}
                        title={`${getSkillTypeDisplayName(skillInfo?.type || '')}`}
                      >
                        {skillName}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </CommonModal>
  );
};

export default HistoryModal; 