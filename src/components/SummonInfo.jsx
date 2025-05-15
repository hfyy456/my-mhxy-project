import React from 'react';
import { Chart } from 'chart.js/auto';
import { petConfig, skillConfig, qualityConfig, skillTypeConfig } from '../config';

const SummonInfo = ({ summon, updateSummonInfo }) => {
  const { name, quality, attack, defense, speed, hp, skillSet } = summon;
  const qualityIndex = qualityConfig.qualities.indexOf(quality);
  const qualityColor = qualityConfig.colors[qualityIndex];

  React.useEffect(() => {
    const ctx = document.getElementById('radarChart').getContext('2d');
    const radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['攻击', '防御', '速度', '气血'],
        datasets: [
          {
            label: '属性值',
            data: [attack, defense, speed, hp],
            backgroundColor: 'rgba(138, 43, 226, 0.2)',
            borderColor: 'rgba(138, 43, 226, 1)',
            pointBackgroundColor: 'rgba(138, 43, 226, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(138, 43, 226, 1)',
          },
        ],
      },
      options: {
        scales: {
          r: {
            angleLines: {
              display: true,
            },
            suggestedMin: 0,
            suggestedMax: 500,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });

    return () => {
      radarChart.destroy();
    };
  }, [attack, defense, speed, hp]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <div className="flex justify-center mb-6">
          <img
            id="petImage"
            src={`./images/${name}.jpg`}
            alt="召唤兽图片"
            className="w-40 h-40 object-cover rounded-full border-2 border-primary shadow-lg"
            // onError={(e) => (e.target.src = './images/default.jpg')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div className="bg-white/80 rounded-lg p-2 shadow-sm">
            <p className="text-gray-500 text-sm">名称</p>
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
            属性与属性分布
          </h3>
          <ul className="space-y-2 mb-2">
            <li className="flex justify-between">
              <span className="text-gray-600">攻击</span>
              <span className="font-semibold">{attack}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">防御</span>
              <span className="font-semibold">{defense}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">速度</span>
              <span className="font-semibold">{speed}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">气血</span>
              <span className="font-semibold">{hp}</span>
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
            {skillSet.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 12 }).map((_, i) => {
                  if (i < skillSet.length) {
                    const skill = skillSet[i];
                    const skillInfo = skillConfig.find((s) => s.name === skill);
                    const skillType = skillInfo.type;
                    const typeConfig = skillTypeConfig[skillType] || {
                      color: 'gray-500',
                      icon: 'fa-question',
                    };
                    const colorClass = typeConfig.color.replace('-500', '');
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
                            className={`fa-solid ${skillInfo.icon || 'fa-paw'} text-${colorClass} mb-2 text-xl`}
                          ></i>
                          <span className="font-medium text-lg">{skill}</span>
                          <span className="text-xs text-gray-500 mt-1">{skillType}</span>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={i} className="relative">
                        <div
                          className="bg-gray-50 rounded-lg p-4 text-center h-full flex flex-col justify-center items-center border border-dashed border-gray-200"
                        >
                          <i className="fa-solid fa-ban text-gray-300 text-xl"></i>
                          <span className="text-xs text-gray-400 mt-1">空技能槽</span>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3">
                  <i className="fa-solid fa-skull-crossbones text-gray-400 text-xl"></i>
                </div>
                <p className="text-gray-500 italic">该召唤兽暂无技能</p>
              </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SummonInfo;