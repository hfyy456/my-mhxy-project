import React from 'react';
import BattleUnitSprite from './BattleUnitSprite';
import './BattleGridRenderer.css';

const BattleGridRenderer = ({ 
  // 基础数据
  selectedUnitId, 
  selectedAction, 
  selectedSkill, 
  selectedTarget, 
  
  // 网格和单位数据
  playerFormation,
  enemyFormation,
  battleUnits,
  unitActions = {},
  
  // 状态数据
  currentPhase,
  currentRound,
  battleLog = [],
  
  // 预计算的UI数据
  attackableGridPositions = [],
  skillAffectedArea = [],
  allUnitsHaveActions = false,
  
  // 按钮状态数据
  executionButtonText = '等待中...',
  executionButtonEnabled = false,
  
  // 回调函数
  onUnitClick,
  onStartExecution,
  
  // 配置选项
  disabled = false,
  showPhaseInfo = true,
  showExecutionButton = true
}) => {

  const handleUnitSpriteClick = (unitId) => {
    if (disabled || !onUnitClick) return;
    onUnitClick(unitId);
  };
  
  const handleStartExecution = () => {
    if (disabled || !executionButtonEnabled || !onStartExecution) return;
    onStartExecution();
  };
  
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

  // 获取阶段显示文本
  const getPhaseDisplayText = () => {
    switch (currentPhase) {
      case 'preparation':
        return '准备阶段';
      case 'execution':
        return '执行阶段';
      case 'player_target_selection':
        return '选择目标';
      case 'battle_over':
        return '战斗结束';
      case 'battle_end':
        return '战斗结算';
      default:
        return currentPhase;
    }
  };

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
                  className={`border border-blue-400/20 bg-blue-900/10 rounded-lg flex justify-center items-center relative min-h-[80px] shadow-inner grid-cell backdrop-blur-sm ${isGridCellAttackable('player', rowIndex, colIndex) ? (selectedAction === 'skill' ? 'skill-effect-cell' : 'attackable-cell') : ''} ${disabled ? 'opacity-50' : ''}`}
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
                        key={`player-sprite-${unitId}-${rowIndex}-${colIndex}`}
                        unit={battleUnits[unitId]}
                        onClick={handleUnitSpriteClick}
                        hasAction={unitActions[unitId] ? true : false}
                        currentPhase={currentPhase}
                        allUnitActions={unitActions}
                        battleLog={battleLog}
                        disabled={disabled}
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
                  className={`border border-red-400/20 bg-red-900/10 rounded-lg flex justify-center items-center relative min-h-[80px] shadow-inner grid-cell backdrop-blur-sm ${isGridCellAttackable('enemy', rowIndex, colIndex) ? (selectedAction === 'skill' ? 'skill-effect-cell' : 'attackable-cell') : ''} ${disabled ? 'opacity-50' : ''}`}
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
                        key={`enemy-sprite-${unitId}-${rowIndex}-${colIndex}`}
                        unit={battleUnits[unitId]}
                        onClick={handleUnitSpriteClick}
                        hasAction={unitActions[unitId] ? true : false}
                        currentPhase={currentPhase}
                        allUnitActions={unitActions}
                        battleLog={battleLog}
                        disabled={disabled}
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
    <div className={`flex justify-between items-center w-full h-[500px] p-2 box-border overflow-visible ${disabled ? 'pointer-events-none' : ''}`}>
      {renderPlayerGrid()}
      
      <div className="flex flex-col items-center justify-center w-[16%]">
        {/* 回合和阶段信息 */}
        {showPhaseInfo && (
          <div className="mb-4 px-4 py-2 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg border border-amber-500/30 shadow-lg backdrop-blur-sm text-center">
            <div className="text-amber-400 font-bold text-sm mb-1">
              回合: {currentPhase === 'battle_end' ? '结算中' : currentRound}
            </div>
            <div className="text-white text-xs">
              {getPhaseDisplayText()}
            </div>
          </div>
        )}
        
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/70 to-amber-700/70 flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-amber-400/30 backdrop-blur-sm transform transition-transform hover:scale-110 animate-pulse-slow">
          <span className="drop-shadow-md">VS</span>
        </div>
        
        {/* 开始执行按钮 */}
        {showExecutionButton && (
          <button
            className={`mt-4 px-5 py-2 rounded-md text-white text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm ${
              executionButtonEnabled && !disabled
                ? 'bg-gradient-to-r from-green-600/80 to-green-800/80 hover:from-green-500/90 hover:to-green-700/90 border border-green-500/30' 
                : 'bg-gradient-to-r from-gray-600/70 to-gray-700/70 cursor-not-allowed border border-gray-500/30'
            }`}
            onClick={handleStartExecution}
            disabled={!executionButtonEnabled || disabled}
          >
            {executionButtonText}
          </button>
        )}
      </div>
      
      {renderEnemyGrid()}
    </div>
  );
};

export default BattleGridRenderer;