/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-11 05:22:24
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-11 09:33:53
 */
import React, { useState, useCallback } from 'react';
import BattleBriefing from './BattleBriefing';

const BattlePreparationModal = ({ show, onConfirm, onCancel, enemyGroup }) => {
  const [playerFormationData, setPlayerFormationData] = useState({
    grid: null,
    units: [],
    analysis: null,
    errors: [],
  });

  const handleFormationChange = useCallback((data) => {
    setPlayerFormationData(data);
  }, []);
  
  const handleConfirm = () => {
    if (playerFormationData.errors.length === 0) {
      onConfirm({
        playerFormation: playerFormationData.grid,
      });
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 backdrop-blur-sm">
      <div className="w-full h-full max-w-[90vw] max-h-[90vh] bg-slate-900/80 rounded-lg shadow-2xl flex flex-col">
        <header className="px-6 py-3 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">战斗准备</h2>
        </header>

        <main className="flex-grow overflow-hidden">
          <BattleBriefing
            enemyGroup={enemyGroup}
            playerFormationData={playerFormationData}
            onFormationChange={handleFormationChange}
            onConfirm={handleConfirm}
            onCancel={onCancel}
            isConfirmDisabled={playerFormationData.errors.length > 0}
          />
        </main>
      </div>
    </div>
  );
};

export default BattlePreparationModal; 