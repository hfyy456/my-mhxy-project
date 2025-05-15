import React from 'react';
import { qualityConfig, skillConfig, skillTypeConfig } from '../config';

const HistoryModal = ({ historyList, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 opacity-100 pointer-events-auto transition-opacity duration-300">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto transform scale-100 transition-transform duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-dark">历史召唤兽记录</h3>
          <button className="text-gray-500 hover:text-gray-700 transition-colors" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        <div id="historyContent" className="space-y-4">
          {historyList.length === 0 ? (
            <p className="text-gray-500 italic">暂无历史记录。</p>
          ) : (
            historyList.map((pet, index) => {
              const qualityIndex = qualityConfig.qualities.indexOf(pet.quality);
              const qualityColor = qualityConfig.colors[qualityIndex];
              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold">
                      {pet.name} <span className={`text-${qualityColor}`}>({pet.quality})</span>
                    </h4>
                    <span className="text-xs text-gray-500">炼妖 #{index + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">攻击:</span>
                      <span className="font-medium">{pet.attack}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">防御:</span>
                      <span className="font-medium">{pet.defense}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">速度:</span>
                      <span className="font-medium">{pet.speed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">气血:</span>
                      <span className="font-medium">{pet.hp}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pet.skills.map((skill) => {
                      const skillInfo = skillConfig.find((s) => s.name === skill);
                      const typeConfig = skillTypeConfig[skillInfo.type] || {
                        color: 'gray-500',
                      };
                      return (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: `rgb(var(--tw-color-${typeConfig.color.replace(
                              '-500',
                              '-100'
                            )}))`,
                            color: `rgb(var(--tw-color-${typeConfig.color.replace('-500', '-700')}))`,
                          }}
                        >
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;