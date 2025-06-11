import React from 'react';

const VerticalActionOrder = ({ playerUnits = [], enemyUnits = [] }) => {
  const allUnits = [...playerUnits, ...enemyUnits];
  const sortedUnits = allUnits.sort((a, b) => (b.attributes?.speed ?? 0) - (a.attributes?.speed ?? 0));

  return (
    <div className="bg-slate-900/50 rounded-lg p-3 w-full h-full flex flex-col items-center">
      <h4 className="text-md font-medium text-slate-300 mb-3">行动顺序</h4>
      <div className="space-y-2 w-full overflow-y-auto">
        {sortedUnits.map((unit, index) => (
          <div
            key={unit.id || index}
            className={`flex items-center justify-between p-2 rounded-md text-sm
              ${unit.isEnemy
                ? 'bg-red-500/10 text-red-300'
                : 'bg-blue-500/10 text-blue-300'
              }`
            }
          >
            <span className="font-medium truncate">{unit.nickname || unit.name}</span>
            <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-slate-700/50 rounded-full text-xs text-slate-400">
              {index + 1}
            </span>
          </div>
        ))}
        {sortedUnits.length === 0 && (
          <div className="text-center text-slate-500 text-xs pt-4">无单位</div>
        )}
      </div>
    </div>
  );
};

export default VerticalActionOrder; 