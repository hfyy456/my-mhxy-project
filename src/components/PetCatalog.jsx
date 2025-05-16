/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 01:43:57
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-16 18:28:38
 */
import React from "react";
import { petConfig } from "../config/config";
import CommonModal from "./CommonModal";

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
              <h3 className="text-lg font-bold text-purple-300 mb-1.5">{name}</h3>
              <p className="text-sm text-indigo-400 font-medium mb-2.5">
                {typeText[config.type]}
              </p>
              <div className="space-y-2 text-xs text-gray-400">
                <div>
                  <p className="font-semibold text-gray-300 mb-0.5">
                    资质范围:
                  </p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <p>
                      体质: {config.basicAttributeRanges.constitution[0]}-
                      {config.basicAttributeRanges.constitution[1]}
                    </p>
                    <p>
                      力量: {config.basicAttributeRanges.strength[0]}-
                      {config.basicAttributeRanges.strength[1]}
                    </p>
                    <p>
                      敏捷: {config.basicAttributeRanges.agility[0]}-
                      {config.basicAttributeRanges.agility[1]}
                    </p>
                    <p>
                      智力: {config.basicAttributeRanges.intelligence[0]}-
                      {config.basicAttributeRanges.intelligence[1]}
                    </p>
                    <p>
                      幸运: {config.basicAttributeRanges.luck[0]}-
                      {config.basicAttributeRanges.luck[1]}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mt-1.5 font-semibold text-gray-300 mb-0">
                    成长率:
                  </p>
                  <div className="flex flex-wrap gap-x-2">
                    <p>体:{config.growthRates.constitution}</p>
                    <p>力:{config.growthRates.strength}</p>
                    <p>敏:{config.growthRates.agility}</p>
                    <p>智:{config.growthRates.intelligence}</p>
                    <p>幸:{config.growthRates.luck}</p>
                  </div>
                </div>
                {/* 新属性展示部分，可根据新属性系统修改 */}
                {/* 示例：假设新属性为新攻击、新防御 */}
                {/* <p>新攻击: {config.newAttributeRanges.newAttack[0]}-{config.newAttributeRanges.newAttack[1]}</p> */}
                {/* <p>新防御: {config.newAttributeRanges.newDefense[0]}-{config.newAttributeRanges.newDefense[1]}</p> */}
                <p className="mt-2 font-semibold text-gray-300 mb-0.5">
                  初始技能:
                </p>
                <div className="flex flex-wrap gap-1">
                  {config.initialSkills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-slate-600 text-slate-200 rounded-md text-xs shadow-sm hover:bg-purple-700 hover:text-white transition-colors duration-200 border border-slate-500 hover:border-purple-500"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                {/* 新增：显示背景故事 */}
                {config.background && (
                  <div className="mt-3 pt-2 border-t border-slate-600/50">
                    <p className="font-semibold text-gray-300 mb-0.5">
                      背景故事:
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {config.background}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>{" "}
    </CommonModal>
  );
};

export default PetCatalog;
