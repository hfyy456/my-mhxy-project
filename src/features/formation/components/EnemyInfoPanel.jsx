/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-11 05:22:36
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-11 08:41:09
 */
import React from 'react';
import SimpleFormationGrid from './SimpleFormationGrid';

const EnemyInfoPanel = ({ enemyGroup }) => {
  if (!enemyGroup || !enemyGroup.enemies || enemyGroup.enemies.length === 0) {
    return (
      <div className="p-4 bg-slate-800/50 rounded-lg text-center h-full flex items-center justify-center">
        <p className="text-slate-400">没有发现敌人信息。</p>
      </div>
    );
  }

  const renderEnemyCell = (enemyId) => {
    if (!enemyId) return null;
    const enemy = enemyGroup.enemies.find(e => e.id === enemyId);
    if (!enemy) return null;

    return (
      <div className="flex flex-col items-center justify-center h-full p-1 bg-red-500/10 rounded-lg">
        <div className="text-xs font-bold text-white truncate">{enemy.nickname || enemy.name}</div>
        <div className="text-[10px] text-slate-300">Lv.{enemy.level}</div>
      </div>
    );
  };

  const renderEnemyUnit = (unit) => {
    if (!unit) return null;
    return (
      <div 
        key={unit.id} 
        className="p-3 bg-red-900/30 border border-red-500/20 rounded-lg"
      >
        <h4 className="font-bold text-red-300 truncate">{unit.nickname || unit.name} <span className="text-xs font-normal text-slate-400">Lv.{unit.level}</span></h4>
        <div className="mt-2 text-sm">
          <div className="text-slate-300">生命: <span className="font-medium text-white">{unit.derivedAttributes.hp}</span></div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4 bg-slate-800/50 rounded-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">敌方情报</h3>
          <div className="text-right">
              <div className="text-sm text-slate-300">总战力</div>
              <div className="text-xl font-bold text-red-400">{enemyGroup.totalPower || 0}</div>
          </div>
      </div>

      <div className="flex flex-col gap-4 flex-grow min-h-0">
          <div className="flex flex-col items-center justify-center flex-grow">
              <h4 className="text-md text-slate-400 mb-2">敌方阵型</h4>
              <SimpleFormationGrid
                grid={enemyGroup.enemyFormation?.grid || []}
                editable={false}
                renderCell={renderEnemyCell}
                colLabels={['前', '中', '后']}
              />
          </div>

          <div className="space-y-2 overflow-y-auto pr-2 h-28">
              {enemyGroup.enemies.map(renderEnemyUnit)}
          </div>
      </div>
    </div>
  );
};

export default EnemyInfoPanel; 