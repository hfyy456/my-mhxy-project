/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-11 07:13:53
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-11 09:16:35
 */
import React from 'react';

const SummonPool = ({ deployedUnitIds, allSummons }) => {
  const availableSummons = Object.values(allSummons || {})
    .filter(summon => !deployedUnitIds.includes(summon.id));

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 h-36">
      <h3 className="text-lg font-medium text-white mb-3">我方待命召唤兽</h3>
      <div className="flex items-center space-x-3 overflow-x-auto pb-2">
        <div className="flex space-x-4">
          {availableSummons.map(summon => (
            <div
              key={summon.id}
              draggable={true}
              onDragStart={(e) => {
                console.log('[DragStart] Starting drag for summonId:', summon.id);
                e.dataTransfer.setData('text/plain', summon.id);
              }}
              className="w-24 p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg cursor-grab active:cursor-grabbing border border-slate-700 hover:border-blue-500 transition-colors"
            >
              <div className="font-medium text-white">{summon.nickname}</div>
              <div className="text-xs text-slate-400">Lv.{summon.level}</div>
              <div className="text-xs text-slate-400 mt-1">战力: {summon.power}</div>
            </div>
          ))}
          {availableSummons.length === 0 && (
            <div className="text-slate-500 text-sm">所有召唤兽均已上阵。</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummonPool; 