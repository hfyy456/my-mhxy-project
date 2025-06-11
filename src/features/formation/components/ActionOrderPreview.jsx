/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-11 08:35:42
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-11 08:35:42
 */
import React from 'react';

const ActionOrderPreview = ({ playerUnits = [], enemyUnits = [] }) => {
  const allUnits = [...playerUnits, ...enemyUnits]
    .filter(unit => unit && unit.attributes) // 确保单位有效
    .sort((a, b) => b.attributes.speed - a.attributes.speed);

  return (
    <div className="p-4 bg-slate-800/50 rounded-lg">
      <h3 className="text-lg font-medium text-white mb-3">行动顺序预览</h3>
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {allUnits.map((unit, index) => (
          <div
            key={unit.id || index}
            className={`flex-shrink-0 flex flex-col items-center p-2 rounded-lg w-24
              ${unit.creatureType === 'monster' || unit.isEnemy ? 'bg-red-500/20 border border-red-500/30' : 'bg-blue-500/20 border border-blue-500/30'}`}
          >
            <div className="text-sm font-bold text-white truncate w-full text-center">{unit.name}</div>
            <div className="text-xs text-slate-300">速度: {unit.attributes.speed}</div>
            <div className="mt-1 text-xs font-mono px-1.5 py-0.5 bg-slate-900/50 rounded">{index + 1}</div>
          </div>
        ))}
        {allUnits.length === 0 && (
          <div className="text-slate-400 text-sm">等待双方阵营部署单位...</div>
        )}
      </div>
    </div>
  );
};

export default ActionOrderPreview; 