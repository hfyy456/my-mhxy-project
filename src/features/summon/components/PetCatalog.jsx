/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:08:02
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-18 02:48:12
 */
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { petConfig } from "../../../config/config";
import CommonModal from "../../ui/components/CommonModal";
import { selectAllSummons, setCurrentSummon } from "../../../store/slices/summonSlice";

const PetCatalog = ({ isOpen, onClose }) => {
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

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} title="召唤兽图鉴">
      <div className="mt-2 rounded-xl">
        {/* 已有召唤兽列表 */}
        {summonsList.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">我的召唤兽</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {summonsList.map((summon) => (
                <div
                  key={summon.id}
                  className={`bg-slate-700/70 rounded-lg p-4 shadow-lg hover:shadow-purple-500/20 transition-all duration-300 border-l-4 border-${petConfig[summon.name]?.color || 'slate-500'} border-t border-r border-b border-slate-600 hover:border-purple-500/50 cursor-pointer`}
                  onClick={() => handleSelectSummon(summon.id)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-100">{summon.name}</h3>
                    <span className={`text-sm font-medium text-${petConfig[summon.name]?.color || 'slate-400'}`}>
                      {summon.quality}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-400 w-20">等级：</span>
                      <span className="text-sm text-gray-200">{summon.level}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-400 w-20">类型：</span>
                      <span className={`text-sm font-medium text-${petConfig[summon.name]?.color || 'slate-400'}`}>
                        {typeText[petConfig[summon.name]?.type] || petConfig[summon.name]?.type}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-400 w-20">技能：</span>
                      <div className="flex flex-wrap gap-1">
                        {summon.skillSet.filter(Boolean).map((skill, index) => (
                          <span
                            key={index}
                            className="text-xs bg-slate-600 text-gray-200 px-2 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 可获得的召唤兽列表 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-100 mb-3">可获得的召唤兽</h3>
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
      </div>
    </CommonModal>
  );
};

export default PetCatalog; 