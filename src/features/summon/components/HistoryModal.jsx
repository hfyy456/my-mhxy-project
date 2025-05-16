import React from "react";
import { qualityConfig, skillConfig, skillTypeConfig } from "../../../config/config";
import CommonModal from "../../../components/CommonModal";

const HistoryModal = ({ historyList, isOpen, onClose }) => {
  return (
    <CommonModal isOpen={isOpen} onClose={onClose} title="历史召唤兽记录">
      <div id="historyContent" className="space-y-4">
        {historyList.length === 0 ? (
          <p className="text-gray-400 italic text-center py-8">暂无历史记录。</p>
        ) : (
          historyList.map((pet, index) => {
            const qualityColorName = qualityConfig.colors[pet.quality] || 'normal';
            return (
              <div
                key={index}
                className="bg-slate-700/40 border border-slate-600 rounded-lg p-4 mb-3 hover:border-purple-500/70 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-100">
                    {pet.name}
                  </h3>
                  <span className={`text-sm font-medium text-${qualityColorName}`}>
                    {pet.quality}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">基础属性</h4>
                    <div className="space-y-1">
                      {Object.entries(pet.basicAttributes).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-400">
                            {key === 'constitution' && '体质'}
                            {key === 'strength' && '力量'}
                            {key === 'agility' && '敏捷'}
                            {key === 'intelligence' && '智力'}
                            {key === 'luck' && '运气'}
                          </span>
                          <span className="text-gray-200">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">技能</h4>
                    <div className="flex flex-wrap gap-1">
                      {pet.skills.map((skillName, skillIndex) => {
                        const skillInfo = skillConfig.find(s => s.name === skillName);
                        const typeConfig = skillInfo?.type ? skillTypeConfig[skillInfo.type] : null;
                        return (
                          <span
                            key={skillIndex}
                            className={`text-xs px-2 py-0.5 rounded ${
                              typeConfig
                                ? `bg-${typeConfig.color}/20 text-${typeConfig.color}`
                                : 'bg-slate-600 text-gray-200'
                            }`}
                          >
                            {skillName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-600">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">装备</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(pet.equipment).map(([slot, item]) => (
                      <div
                        key={slot}
                        className={`text-xs px-2 py-1 rounded ${
                          item
                            ? 'bg-slate-600/50 text-gray-200'
                            : 'bg-slate-700/30 text-gray-400'
                        }`}
                      >
                        {item ? item.name : `${slot}（空）`}
                      </div>
                    ))}
                  </div>
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