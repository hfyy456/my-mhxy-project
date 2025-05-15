import React from "react";
import { Chart } from "chart.js/auto";
import {
  petConfig,
  skillConfig,
  qualityConfig,
  skillTypeConfig,
} from "../config";
import {
  calculateAttributesByLevel,
  calculateDerivedAttributes,
} from "../gameLogic";
const images = import.meta.glob("../assets/summons/*.png", { eager: true });

const SummonInfo = ({ summon, updateSummonInfo }) => {
  const { name, quality, basicAttributes, skillSet, level } = summon;
  console.log(summon);
  const updatedBasicAttributes = calculateAttributesByLevel(
    name,
    level,
    basicAttributes
  );
  const derivedAttributes = calculateDerivedAttributes(
    updatedBasicAttributes,
    name,
    level
  );
  const qualityIndex = qualityConfig.qualities.indexOf(quality);
  const qualityColor = qualityConfig.colors[qualityIndex];
  const imageUrl =
    images[`../assets/summons/${name}.png`]?.default ||
    images["../assets/summons/default.png"].default;
  React.useEffect(() => {
    const ctx = document.getElementById("radarChart").getContext("2d");
    const radarChart = new Chart(ctx, {
      type: "radar",
      data: {
        labels: ["物攻", "法攻", "法抗", "物抗", "速度", "气血", "法力"],
        datasets: [
          {
            label: "属性值",
            data: [
              derivedAttributes.physicalAttack,
              derivedAttributes.magicalAttack,
              derivedAttributes.magicalDefense,
              derivedAttributes.physicalDefense,
              derivedAttributes.speed,
              derivedAttributes.hp,
              derivedAttributes.mp,
            ],
            backgroundColor: "rgba(138, 43, 226, 0.2)",
            borderColor: "rgba(138, 43, 226, 1)",
            pointBackgroundColor: "rgba(138, 43, 226, 1)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgba(138, 43, 226, 1)",
          },
        ],
      },
      options: {
        scales: {
          r: {
            angleLines: { display: true },
            suggestedMin: 0,
            suggestedMax: 500,
          },
        },
        plugins: { legend: { display: false } },
      },
    });
    return () => {
      radarChart.destroy();
    };
  }, [
    derivedAttributes.physicalAttack,
    derivedAttributes.magicalAttack,
    derivedAttributes.magicalDefense,
    derivedAttributes.physicalDefense,
    derivedAttributes.speed,
    derivedAttributes.hp,
    derivedAttributes.mp,
  ]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <div className="flex justify-center mb-6 ">
          <img
            className="w-60 h-60 object-cover border-2 border-primary shadow-lg"
            src={imageUrl}
            alt="召唤兽"
            onError={(e) => {
              e.target.src = images["../assets/summons/default.png"].default;
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div className="bg-white/80 rounded-lg p-2 shadow-sm">
            <p className="text-gray-500 text-sm">名称</p>
            <div className="bg-white/80 rounded-lg p-2 shadow-sm">
              <p className="text-gray-500 text-sm">等级</p>
              <p className="text-l font-bold text-primary">
                {summon.level || 1}
              </p>
            </div>
            <p className="text-l font-bold text-primary">{name}</p>
          </div>
          <div className="bg-white/80 rounded-lg p-2 shadow-sm">
            <p className="text-gray-500 text-sm">品质</p>
            <p className={`text-l font-bold text-${qualityColor}`}>{quality}</p>
          </div>
        </div>
        <div className="bg-white/80 rounded-lg p-4 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-dark mb-3 flex items-center">
            <i className="fa-solid fa-bolt text-yellow-500 mr-2"></i>
            基础属性
          </h3>
          <ul className="space-y-2 mb-2">
            <li className="flex justify-between">
              <span className="text-gray-600">体质</span>
              <span className="font-semibold">
                {updatedBasicAttributes.constitution}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">力量</span>
              <span className="font-semibold">
                {updatedBasicAttributes.strength}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">敏捷</span>
              <span className="font-semibold">
                {updatedBasicAttributes.agility}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">智力</span>
              <span className="font-semibold">
                {updatedBasicAttributes.intelligence}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">幸运</span>
              <span className="font-semibold">
                {updatedBasicAttributes.luck}
              </span>
            </li>
          </ul>
          <h3 className="text-lg font-semibold text-dark mb-3 flex items-center">
            <i className="fa-solid fa-star text-yellow-400 mr-2"></i>
            衍生属性
          </h3>
          <ul className="space-y-2 mb-2">
            <li className="flex justify-between">
              <span className="text-gray-600">生命值</span>
              <span className="font-semibold">{derivedAttributes.hp}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">法力值</span>
              <span className="font-semibold">{derivedAttributes.mp}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">物攻</span>
              <span className="font-semibold">
                {derivedAttributes.physicalAttack}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">法攻</span>
              <span className="font-semibold">
                {derivedAttributes.magicalAttack}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">法抗</span>
              <span className="font-semibold">
                {derivedAttributes.magicalDefense}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">物抗</span>
              <span className="font-semibold">
                {derivedAttributes.physicalDefense}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">速度</span>
              <span className="font-semibold">{derivedAttributes.speed}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">暴击率</span>
              <span className="font-semibold">
                {derivedAttributes.critRate}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">暴击伤害</span>
              <span className="font-semibold">
                {derivedAttributes.critDamage}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">闪避率</span>
              <span className="font-semibold">
                {derivedAttributes.dodgeRate}
              </span>
            </li>
          </ul>
          <div className="flex justify-center items-center h-[200px]">
            <canvas id="radarChart" className="max-w-full max-h-full"></canvas>
          </div>
        </div>
      </div>
      <div className="md:col-span-2">
        <div className="bg-white/80 rounded-lg p-4 shadow-sm h-full">
          <h3 className="text-lg font-semibold text-dark mb-3 flex items-center">
            <i className="fa-solid fa-star text-yellow-400 mr-2"></i> 技能
            (最多12个)
          </h3>
          <ul id="skills" className="space-y-2 h-full overflow-y-auto">
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 12 }).map((_, i) => {
                if (i < skillSet.length) {
                  const skill = skillSet[i];
                  const skillInfo = skillConfig.find((s) => s.name === skill);
                  const skillType = skillInfo.type;
                  const typeConfig = skillTypeConfig[skillType] || {
                    color: "gray-500",
                    icon: "fa-question",
                  };
                  const colorClass = typeConfig.color.replace("-500", "");
                  return (
                    <div key={i} className="relative">
                      <div
                        className="bg-gray-100 rounded-lg p-4 text-center h-full flex flex-col justify-center items-center 
                        hover:shadow-md transition-all duration-300 cursor-pointer 
                        border-l-3 border-${colorClass}
                        group"
                      >
                        <div
                          className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 
                            group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 w-max"
                        >
                          {skillInfo.description}
                        </div>
                        <i
                          className={`fa-solid ${
                            skillInfo.icon || "fa-paw"
                          } text-${colorClass} mb-2 text-xl`}
                        ></i>
                        <span className="font-medium text-lg">{skill}</span>
                        <span className="text-xs text-gray-500 mt-1">
                          {skillType}
                        </span>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={i} className="relative">
                      <div className="bg-gray-50 rounded-lg p-4 text-center h-full flex flex-col justify-center items-center border border-dashed border-gray-200">
                        <i className="fa-solid fa-ban text-gray-300 text-xl"></i>
                        <span className="text-xs text-gray-400 mt-1">
                          空技能槽
                        </span>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SummonInfo;
