import React from "react";
import { petConfig } from "../../../config/config";
import CommonModal from "../../../components/CommonModal";

const PetCatalog = ({ isOpen, onClose }) => {
  const typeText = {
    法攻: "法术攻击型",
    物攻: "物理攻击型",
    速度: "速度型",
    生命: "防御型",
  };

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} title="召唤兽图鉴">
      <div className="mt-2 rounded-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {Object.entries(petConfig).map(([name, config]) => (
            <div
              key={name}
              className={`bg-slate-700/70 rounded-lg p-4 shadow-lg hover:shadow-purple-500/20 transition-all duration-300 border-l-4 border-${config.color || 'slate-500'} border-t border-r border-b border-slate-600 hover:border-purple-500/50`}
            >
              <h3 className="text-lg font-semibold text-gray-100 mb-2">{name}</h3>
              <p className="text-sm text-gray-300 mb-3">{config.background}</p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm text-gray-400 w-20">类型：</span>
                  <span className={`text-sm font-medium text-${config.color || 'slate-400'}`}>
                    {typeText[config.type] || config.type}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-400 w-20">初始技能：</span>
                  <div className="flex flex-wrap gap-1">
                    {config.initialSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="text-xs bg-slate-600 text-gray-200 px-2 py-0.5 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-400 w-20">成长率：</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(config.growthRates).map(([attr, rate]) => (
                      <span
                        key={attr}
                        className="text-xs bg-slate-600 text-gray-200 px-2 py-0.5 rounded"
                      >
                        {attr === 'constitution' && '体质'}
                        {attr === 'strength' && '力量'}
                        {attr === 'agility' && '敏捷'}
                        {attr === 'intelligence' && '智力'}
                        {attr === 'luck' && '运气'}
                        : {(rate * 100).toFixed(1)}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CommonModal>
  );
};

export default PetCatalog; 