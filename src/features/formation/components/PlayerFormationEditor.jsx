/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-11 05:22:47
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-15 06:41:31
 */
import React from 'react';
import SimpleFormationGrid from './SimpleFormationGrid';

const EMPTY_GRID = Array(3).fill(null).map(() => Array(3).fill(null));

const PlayerFormationEditor = ({
  playerFormation,
  onFormationChange,
  allSummons,
}) => {
  const currentGrid = playerFormation?.grid || EMPTY_GRID;

  const handleCellClick = (rowIndex, colIndex) => {
    const newGrid = [...currentGrid].map(r => [...r]);
    const clickedSummonId = newGrid[rowIndex][colIndex];
    if (clickedSummonId) {
        newGrid[rowIndex][colIndex] = null; // Remove summon on click
        onFormationChange({ ...playerFormation, grid: newGrid });
    }
  };

  const handleDrop = (e, targetRowIndex, targetColIndex) => {
    e.preventDefault();
    const summonIdFromPool = e.dataTransfer.getData('text/plain');
    if (summonIdFromPool) {
        const newGrid = [...currentGrid].map(r => [...r]);
        
        const isAlreadyDeployed = newGrid.flat().includes(summonIdFromPool);
        if(isAlreadyDeployed) return;

        if(newGrid[targetRowIndex][targetColIndex]) return;

        newGrid[targetRowIndex][targetColIndex] = summonIdFromPool;
        onFormationChange({ ...playerFormation, grid: newGrid });
    }
  };
  
  const renderSummonCell = (summonId) => {
    const summon = allSummons[summonId];
    if (!summon) return null;

    return (
      <div className="flex flex-col items-center justify-center h-full p-1 bg-blue-500/10 rounded-lg pointer-events-none">
        <div className="text-xs font-bold text-white truncate">{summon.nickname}</div>
        <div className="text-[10px] text-slate-300">Lv.{summon.level}</div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-4 h-full">
      <h2 className=" text-slate-300 mb-4">我方阵型</h2>
      <SimpleFormationGrid
        grid={currentGrid}
        isEditable={true}
        onCellClick={handleCellClick}
        onDrop={handleDrop}
        renderCell={renderSummonCell}
        colLabels={['后', '中', '前']}
      />
    </div>
  );
};

export default PlayerFormationEditor; 