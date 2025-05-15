import React from "react";
import { petConfig } from "../config";

const PetCatalog = () => {
  const typeText = {
    法攻: "法术攻击型",
    物攻: "物理攻击型",
    速度: "速度型",
    生命: "防御型",
  };

  return (
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
              <p>
                攻击: {config.attributeRanges.attack[0]}-
                {config.attributeRanges.attack[1]}
              </p>
              <p>
                防御: {config.attributeRanges.defense[0]}-
                {config.attributeRanges.defense[1]}
              </p>
              <p>
                速度: {config.attributeRanges.speed[0]}-
                {config.attributeRanges.speed[1]}
              </p>
              <p>
                气血: {config.attributeRanges.hp[0]}-
                {config.attributeRanges.hp[1]}
              </p>
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
    </div>
  );
};

export default PetCatalog;
