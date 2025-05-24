import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import BattleUnitSprite from './BattleUnitSprite';
import './BattleGridRenderer.css';
import {
  selectPlayerFormation,
  selectEnemyFormation,
  selectBattleUnits,
  selectUnitActions,
  selectCurrentPhase,
  selectCurrentRound,
  selectAllUnitsHaveActions,
  startExecutionPhase
} from '@/store/slices/battleSlice';
import { getValidTargetsForUnit } from '@/features/battle/logic/skillSystem';
import { petConfig } from '@/config/petConfig';

const BattleGridRenderer = ({ onUnitClick, selectedUnitId, selectedAction, selectedSkill, selectedTarget, skillAffectedArea }) => {
  const dispatch = useDispatch();
  const playerFormation = useSelector(selectPlayerFormation);
  const enemyFormation = useSelector(selectEnemyFormation);
  const battleUnits = useSelector(selectBattleUnits);
  const unitActions = useSelector(selectUnitActions);
  const currentPhase = useSelector(selectCurrentPhase);
  const currentRound = useSelector(selectCurrentRound);
  const allUnitsHaveActions = useSelector(selectAllUnitsHaveActions);
  
  // 存储可攻击的格子位置
  const [attackableGridPositions, setAttackableGridPositions] = useState([]);

  const handleUnitSpriteClick = (unitId) => {
    if (onUnitClick) {
      onUnitClick(unitId);
    }
  };
  
  // 计算选中单位可攻击的格子位置
  useEffect(() => {
    if (!selectedUnitId || !battleUnits[selectedUnitId]) {
      setAttackableGridPositions([]);
      return;
    }
    
    const selectedUnit = battleUnits[selectedUnitId];
    
    // 如果是准备阶段且选中的是玩家单位，且选择了攻击行动
    if (currentPhase === 'preparation' && selectedUnit.isPlayerUnit && selectedAction === 'attack') {
      // 获取所有单位数组
      const allUnits = Object.values(battleUnits);
      
      // 获取可攻击的目标单位
      const validTargets = getValidTargetsForUnit(selectedUnit, allUnits, petConfig, 'normal');
      
      // 提取可攻击目标的位置信息
      const attackablePositions = validTargets.map(target => {
        return {
          team: target.gridPosition.team,
          row: target.gridPosition.row,
          col: target.gridPosition.col
        };
      });
      
      setAttackableGridPositions(attackablePositions);
    } else {
      setAttackableGridPositions([]);
    }
  }, [selectedUnitId, battleUnits, currentPhase, selectedAction]);
  
  // 检查一个格子是否可攻击或在技能影响范围内
  const isGridCellAttackable = (team, row, col) => {
    // 如果选择了技能并且有影响范围，则检查范围
    if (selectedAction === 'skill' && skillAffectedArea && skillAffectedArea.length > 0) {
      return skillAffectedArea.some(pos => 
        pos.team === team && pos.row === row && pos.col === col
      );
    }
    
    // 否则检查普通攻击范围
    return attackableGridPositions.some(pos => 
      pos.team === team && pos.row === row && pos.col === col
    );
  };
  
  // 处理开始执行按钮点击
  const handleStartExecution = () => {
    if (currentPhase === 'preparation' && allUnitsHaveActions) {
      console.log('点击开始执行按钮，准备进入执行阶段');
      // 添加一个短暂停，确保界面更新
      const startTime = performance.now();
      const duration = 100;
      
      const startExecution = (timestamp) => {
        const elapsed = timestamp - startTime;
        if (elapsed < duration) {
          requestAnimationFrame(startExecution);
          return;
        }
        
        dispatch(startExecutionPhase());
        console.log('已进入执行阶段，单位将按速度依次执行行动');
      };
      
      requestAnimationFrame(startExecution);
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
      <div className="w-[42%] h-full flex flex-col rounded-lg bg-gradient-to-br from-blue-900/20 to-blue-500/5 border border-blue-400/30 shadow-lg" style={{ perspective: '1200px', transform: 'rotateX(5deg)' }}>
        <div className="grid grid-cols-3 grid-rows-3 gap-3 p-4 h-full">
          {playerFormation.map((row, rowIndex) => (
            row.map((unitId, colIndex) => {
              const cellKey = `player-${rowIndex}-${colIndex}`;
              const hasUnit = unitId && battleUnits[unitId];

              return (
                <div 
                  key={cellKey} 
                  className={`border border-blue-400/20 bg-blue-900/10 rounded-lg flex justify-center items-center relative min-h-[80px] shadow-inner grid-cell backdrop-blur-sm ${isGridCellAttackable('player', rowIndex, colIndex) ? (selectedAction === 'skill' ? 'skill-effect-cell' : 'attackable-cell') : ''}`}
                  style={{ 
                    zIndex: 10 - rowIndex * -colIndex, // 第一行z-index最低，最后一行最高
                    overflow: 'visible', // 确保内容不会被裁剪
                    boxShadow: hasUnit ? '0 0 10px rgba(59, 130, 246, 0.1)' : 'none'
                  }}
                  data-row={rowIndex}
                  data-col={colIndex}
                >
                  {hasUnit && (
                    <div className="absolute top-[-20px] left-0 right-0 z-50 overflow-visible">
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
      <div className="w-[42%] h-full flex flex-col rounded-lg bg-gradient-to-br from-red-900/20 to-red-500/5 border border-red-400/30 shadow-lg" style={{ perspective: '1200px', transform: 'rotateX(5deg)' }}>
        <div className="grid grid-cols-3 grid-rows-3 gap-3 p-4 h-full">
          {enemyFormation.map((row, rowIndex) => (
            row.map((unitId, colIndex) => {
              const cellKey = `enemy-${rowIndex}-${colIndex}`;
              const hasUnit = unitId && battleUnits[unitId];
        
              
              return (
                <div 
                  key={cellKey} 
                  className={`border border-red-400/20 bg-red-900/10 rounded-lg flex justify-center items-center relative min-h-[80px] shadow-inner grid-cell backdrop-blur-sm ${isGridCellAttackable('enemy', rowIndex, colIndex) ? (selectedAction === 'skill' ? 'skill-effect-cell' : 'attackable-cell') : ''}`}
                  style={{ 
                    zIndex: 10 - rowIndex * -colIndex, // 第一行z-index最低，最后一行最高
                    overflow: 'visible', // 确保内容不会被裁剪
                    boxShadow: hasUnit ? '0 0 10px rgba(239, 68, 68, 0.1)' : 'none'
                  }}
                  data-row={rowIndex}
                  data-col={colIndex}
                >
                  {hasUnit && (
                    <div className="absolute top-[-20px] left-0 right-0 z-50 overflow-visible">
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
    <div className="flex justify-between items-center w-full h-[500px] p-2 box-border overflow-visible">
      {renderPlayerGrid()}
      
      <div className="flex flex-col items-center justify-center w-[16%]">
        {/* 回合和阶段信息 */}
        <div className="mb-4 px-4 py-2 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg border border-amber-500/30 shadow-lg backdrop-blur-sm text-center">
          <div className="text-amber-400 font-bold text-sm mb-1">回合: {currentPhase === 'battle_end' ? '结算中' : currentRound}</div>
          <div className="text-white text-xs">
            {currentPhase === 'preparation' ? '准备阶段' : 
             currentPhase === 'execution' ? '执行阶段' : 
             currentPhase === 'player_target_selection' ? '选择目标' : 
             currentPhase === 'battle_over' ? '战斗结束' : 
             currentPhase === 'battle_end' ? '战斗结算' : currentPhase}
          </div>
        </div>
        
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/70 to-amber-700/70 flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-amber-400/30 backdrop-blur-sm transform transition-transform hover:scale-110 animate-pulse-slow">
          <span className="drop-shadow-md">VS</span>
        </div>
        
        {/* 开始执行按钮 */}
        <button
          className={`mt-4 px-5 py-2 rounded-md text-white text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm ${isButtonEnabled ? 'bg-gradient-to-r from-green-600/80 to-green-800/80 hover:from-green-500/90 hover:to-green-700/90 border border-green-500/30' : 'bg-gradient-to-r from-gray-600/70 to-gray-700/70 cursor-not-allowed border border-gray-500/30'}`}
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