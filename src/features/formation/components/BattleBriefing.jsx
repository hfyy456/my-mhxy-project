/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-11 08:50:18
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-11 10:18:03
 */
import React, { useState } from 'react';
import PlayerFormationEditor from './PlayerFormationEditor';
import EnemyInfoPanel from './EnemyInfoPanel';
import VerticalActionOrder from './VerticalActionOrder';
import SummonPool from './SummonPool';
import { useSummonManager } from '@/hooks/useSummonManager';
import { arrangeFormationIntelligently } from '../formationLogic';

const PlayerInfoPanel = ({ formationData }) => {
    const { analysis, errors } = formationData;

    const renderValidationErrors = () => {
        if (!errors || errors.length === 0) {
            return <div className="p-2 text-center bg-green-500/10 border border-green-500/20 rounded-lg text-green-300 text-xs">✓ 阵型有效</div>;
        }
        return (
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <h4 className="text-red-400 font-medium text-sm mb-1 text-center">阵型错误</h4>
                <ul className="text-red-300 text-xs list-disc list-inside">
                    {errors.map((error, index) => <li key={index}>{error}</li>)}
                </ul>
            </div>
        );
    };

    return (
        <div className="space-y-2">
            {renderValidationErrors()}
        </div>
    );
};


const BattleBriefing = ({ 
  enemyGroup, 
  playerFormationData, 
  onFormationChange,
  onConfirm,
  onCancel,
  isConfirmDisabled
}) => {
  const { analysis, units: playerUnits, grid } = playerFormationData;
  const { allSummons } = useSummonManager();

  const handleSmartArrange = () => {
    const summonsForArrangement = Object.values(allSummons || {});
    const newGrid = arrangeFormationIntelligently(summonsForArrangement, 'player');
    onFormationChange({ ...playerFormationData, grid: newGrid });
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex-grow grid grid-cols-12 gap-4 min-h-0">
        {/* Left Panel: Player */}
        <div className="col-span-5 bg-slate-800/50 rounded-lg p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white">我方情报</h3>
            <div className="text-right">
              <div className="text-sm text-slate-300">总战力</div>
              <div className="text-xl font-bold text-green-400">{analysis?.totalPower || 0}</div>
            </div>
          </div>
          <div className="flex-grow flex flex-col gap-2">
              <div className="flex-grow">
                <PlayerFormationEditor 
                    playerFormation={playerFormationData}
                    onFormationChange={onFormationChange}
                    allSummons={allSummons}
                />
              </div>
              <div className="h-28">
                <PlayerInfoPanel formationData={playerFormationData} />
              </div>
          </div>
        </div>

        {/* Center Panel: Action Order */}
        <div className="col-span-2 flex flex-col items-center justify-between py-4">
            <VerticalActionOrder 
                playerUnits={playerUnits} 
                enemyUnits={enemyGroup?.enemies?.map(e => ({...e, isEnemy: true}))}
            />
            <div className="flex flex-col space-y-3 w-4/5">
                <button
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                    onClick={handleSmartArrange}
                >
                    一键布阵
                </button>
                <button
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                    onClick={onConfirm}
                    disabled={isConfirmDisabled}
                >
                    开始战斗
                </button>
                <button
                    className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                    onClick={onCancel}
                >
                    撤退
                </button>
            </div>
        </div>

        {/* Right Panel: Enemy */}
        <div className="col-span-5">
            <EnemyInfoPanel enemyGroup={enemyGroup} />
        </div>
      </div>

      <div className="flex-shrink-0">
        <SummonPool 
            deployedUnitIds={grid?.flat() || []}
            allSummons={allSummons}
        />
      </div>
    </div>
  );
};

export default BattleBriefing;