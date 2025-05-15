import React from "react";
import { petConfig } from "../config";
import CommonModal from "./CommonModal";

const PetCatalog = ({ isOpen, onClose }) => {
  const typeText = {
    法攻: "法术攻击型",
    物攻: "物理攻击型",
    速度: "速度型",
    生命: "防御型",
  };

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} title="技能图鉴">
      <div className="mt-12 bg-white rounded-xl shadow-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(petConfig).map(([name, config]) => (
            <div
              key={name}
              className={`bg-gray-50 rounded-lg p-4 border-l-4 border-${config.color} card-hover`}
            >
              <h3 className="font-bold text-gray-800 mb-2">{name}</h3>
              <p className="text-sm text-gray-600 mb-3">
                {typeText[config.type]}
              </p>
              <div className="space-y-1 text-xs text-gray-500">
                {/* 旧属性展示部分，可根据新属性系统删除 */}
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
                </p>{" "}
                <p>
                  幸运: {config.basicAttributeRanges.luck[0]}-
                  {config.basicAttributeRanges.luck[1]}
                </p>
                {/* 新属性展示部分，可根据新属性系统修改 */}
                {/* 示例：假设新属性为新攻击、新防御 */}
                {/* <p>新攻击: {config.newAttributeRanges.newAttack[0]}-{config.newAttributeRanges.newAttack[1]}</p> */}
                {/* <p>新防御: {config.newAttributeRanges.newDefense[0]}-{config.newAttributeRanges.newDefense[1]}</p> */}
                <p className="mt-2 font-medium text-gray-700">初始技能:</p>
                <div className="flex flex-wrap gap-1">
                  {config.initialSkills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="px-1.5 py-0.5 bg-gray-100 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>{" "}
    </CommonModal>
  );
};

export default PetCatalog;
