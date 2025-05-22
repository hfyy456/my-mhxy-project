import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import BattleUnitSprite from './BattleUnitSprite';
import './BattleGridRenderer.css';
import {
  selectPlayerFormation,
  selectEnemyFormation,
  selectBattleUnits,
  selectUnitActions,
  selectCurrentPhase,
  selectAllUnitsHaveActions,
  startExecutionPhase
} from '@/store/slices/battleSlice';

const BattleGridRenderer = ({ onUnitClick }) => {
  const dispatch = useDispatch();
  const playerFormation = useSelector(selectPlayerFormation);
  const enemyFormation = useSelector(selectEnemyFormation);
  const battleUnits = useSelector(selectBattleUnits);
  const unitActions = useSelector(selectUnitActions);
  const currentPhase = useSelector(selectCurrentPhase);
  const allUnitsHaveActions = useSelector(selectAllUnitsHaveActions);

  const handleUnitSpriteClick = (unitId) => {
    if (onUnitClick) {
      onUnitClick(unitId);
    }
  };
  
  // 处理开始执行按钮点击
  const handleStartExecution = () => {
    if (currentPhase === 'preparation' && allUnitsHaveActions) {
      dispatch(startExecutionPhase());
    }
  };
  
  // 根据当前阶段和单位行动状态决定按钮文案和状态
  const getButtonText = () => {
    if (currentPhase === 'execution') {
      return '执行中...';
    } else if (currentPhase === 'preparation' && !allUnitsHaveActions) {
      return '等待指令...';
    } else if (currentPhase === 'preparation' && allUnitsHaveActions) {
      return '开始执行';
    } else if (currentPhase === 'battle_end') {
      return '战斗结束';
    } else {
      return '等待中...';
    }
  };
  
  // 按钮是否可用
  const isButtonEnabled = currentPhase === 'preparation' && allUnitsHaveActions;

  // 渲染玩家阵营网格和单位
  const renderPlayerGrid = () => {
    return (
      <div className="w-[42%] h-full flex flex-col rounded-lg overflow-hidden bg-gradient-to-br from-blue-900/30 to-blue-500/10 border-2 border-blue-500/70 shadow-lg" style={{ perspective: '1200px', transform: 'rotateX(5deg)' }}>
        <div className="grid grid-cols-3 grid-rows-3 gap-2 p-3 h-full">
          {playerFormation.map((row, rowIndex) => (
            row.map((unitId, colIndex) => {
              const cellKey = `player-${rowIndex}-${colIndex}`;
              const hasUnit = unitId && battleUnits[unitId];

              return (
                <div 
                  key={cellKey} 
                  className="border border-blue-500/40 bg-blue-900/20 rounded-lg flex justify-center items-center relative min-h-[80px] shadow-inner grid-cell"
                  style={{ 
                    zIndex:10 - rowIndex *  -colIndex // 第一行z-index最低，最后一行最高
                  }}
                  data-row={rowIndex}
                  data-col={colIndex}
                >
                  {hasUnit && (
                    <div className="absolute top-[-10px] left-0 right-0 z-50">
                      <BattleUnitSprite
                        key={battleUnits[unitId].id}
                        unit={battleUnits[unitId]}
                        onClick={handleUnitSpriteClick}
                        hasAction={unitActions[unitId] ? true : false}
                      />
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>
    );
  };

  // 渲染敌人阵营网格和单位
  const renderEnemyGrid = () => {
    return (
      <div className="w-[42%] h-full flex flex-col rounded-lg overflow-hidden bg-gradient-to-br from-red-900/30 to-red-500/10 border-2 border-red-500/70 shadow-lg" style={{ perspective: '1200px', transform: 'rotateX(5deg)' }}>
        <div className="grid grid-cols-3 grid-rows-3 gap-2 p-3 h-full">
          {enemyFormation.map((row, rowIndex) => (
            row.map((unitId, colIndex) => {
              const cellKey = `enemy-${rowIndex}-${colIndex}`;
              const hasUnit = unitId && battleUnits[unitId];
        
              
              return (
                <div 
                  key={cellKey} 
                  className="border border-red-500/40 bg-red-900/20 rounded-lg flex justify-center items-center relative min-h-[80px] shadow-inner grid-cell"
                  style={{ 
                    zIndex: 10 - rowIndex *  -colIndex // 第一行z-index最低，最后一行最高
                  }}
                  data-row={rowIndex}
                  data-col={colIndex}
                >
                  {hasUnit && (
                    <div className="absolute top-[-10px] left-0 right-0 z-50">
                      <BattleUnitSprite
                        key={battleUnits[unitId].id}
                        unit={battleUnits[unitId]}
                        onClick={handleUnitSpriteClick}
                        hasAction={unitActions[unitId] ? true : false}
                      />
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex justify-between items-center w-full h-[450px] p-2 box-border">
      {renderPlayerGrid()}
      
      <div className="flex flex-col items-center justify-center w-[16%]">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg border-4 border-amber-500/50 transform transition-transform hover:scale-110 animate-pulse-slow">
          <span className="drop-shadow-md">VS</span>
        </div>
        
        {/* 开始执行按钮 */}
        <button
          className={`mt-6 px-6 py-3 rounded-md text-white text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg ${isButtonEnabled ? 'bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 border border-green-500/50' : 'bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed border border-gray-500/50'}`}
          onClick={handleStartExecution}
          disabled={!isButtonEnabled}
        >
          {getButtonText()}
        </button>
      </div>
      
      {renderEnemyGrid()}
    </div>
  );
};

export default BattleGridRenderer;