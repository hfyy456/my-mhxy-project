import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCurrentPhase,
  selectCurrentRound,
  selectBattleUnits,
  selectPlayerFormation,
  selectEnemyFormation,
  selectUnitActions,
  selectAllUnitsHaveActions,
  setUnitAction,
  startExecutionPhase,
  endRound
} from '@/store/slices/battleSlice';

const BattleActionPanel = ({ selectedUnitId }) => {
  const dispatch = useDispatch();
  const currentPhase = useSelector(selectCurrentPhase);
  const currentRound = useSelector(selectCurrentRound);
  const battleUnits = useSelector(selectBattleUnits);
  const playerFormation = useSelector(selectPlayerFormation);
  const enemyFormation = useSelector(selectEnemyFormation);
  const unitActions = useSelector(selectUnitActions);
  const allUnitsHaveActions = useSelector(selectAllUnitsHaveActions);
  
  const [selectedAction, setSelectedAction] = useState('attack');
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  
  const selectedUnit = selectedUnitId ? battleUnits[selectedUnitId] : null;
  
  // 重置选择状态
  useEffect(() => {
    setSelectedAction('attack');
    setSelectedTarget(null);
    setSelectedSkill(null);
  }, [selectedUnitId]);
  
  // 获取可选目标
  const getTargets = () => {
    if (!selectedUnit) return [];
    
    // 如果是攻击或技能，目标是敌方单位
    if (selectedAction === 'attack' || selectedAction === 'skill') {
      return Object.values(battleUnits)
        .filter(unit => !unit.isPlayerUnit && !unit.isDefeated);
    }
    
    // 如果是防御或其他，没有目标
    return [];
  };
  
  // 获取单位可用技能
  const getSkills = () => {
    if (!selectedUnit || !selectedUnit.skills) return [];
    return selectedUnit.skills;
  };
  
  // 确认行动
  const confirmAction = () => {
    if (!selectedUnit) return;
    
    let action = {
      actionType: selectedAction,
      targetIds: [],
      skillId: null
    };
    
    // 根据行动类型设置目标和技能
    if (selectedAction === 'attack' && selectedTarget) {
      action.targetIds = [selectedTarget];
    } else if (selectedAction === 'skill' && selectedSkill && selectedTarget) {
      action.targetIds = [selectedTarget];
      action.skillId = selectedSkill;
    }
    
    // 派发行动
    dispatch(setUnitAction({
      unitId: selectedUnitId,
      action
    }));
    
    // 重置选择
    setSelectedAction('attack');
    setSelectedTarget(null);
    setSelectedSkill(null);
  };
  
  // 开始执行阶段
  const startExecution = () => {
    dispatch(startExecutionPhase());
  };
  
  // 结束当前回合
  const finishRound = () => {
    dispatch(endRound());
  };
  
  // 渲染准备阶段UI
  const renderPreparationPhase = () => {
    if (!selectedUnit) {
      return (
        <div className="h-full p-4 text-center text-gray-300 bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg border border-gray-700 shadow-inner flex flex-col items-center justify-center">
          <div className="text-blue-300 text-sm md:text-base mb-2">请选择一个单位</div>
          <div className="text-xs text-gray-400 max-w-md">点击左侧战斗区域中的召唤兽来分配行动</div>
          <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800/30 max-w-xs">
            <div className="flex items-center text-left">
              <span className="text-blue-300 mr-2">💡</span>
              <span className="text-xs text-blue-200">提示: 你可以为每个召唤兽分配不同的行动，当所有召唤兽都分配好行动后，就可以开始执行回合了。</span>
            </div>
          </div>
        </div>
      );
    }
    
    // 检查该单位是否已有行动
    const hasAction = unitActions[selectedUnitId];
    if (hasAction) {
      return (
        <div className="h-full p-4 bg-gradient-to-b from-gray-800/60 to-gray-900/60 rounded-lg border border-gray-700 shadow-inner flex flex-col">
          <div className="flex items-center mb-4 pb-3 border-b border-gray-700/50">
            <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center mr-3 border border-blue-700/50">
              <span className="text-blue-300 text-lg font-bold">✓</span>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-300 mb-1">{selectedUnit.name}</div>
              <div className="text-md font-medium text-blue-300 bg-blue-900/30 px-3 py-1 rounded-md border border-blue-800/30 inline-block">
                {getActionDescription(hasAction)}
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center mb-4">
            <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-800/30 mb-6 max-w-md">
              <div className="flex items-start">
                <span className="text-blue-300 mr-2 mt-0.5">💡</span>
                <span className="text-sm text-blue-200">行动已设置完成。你可以继续选择其他召唤兽来设置行动，或者重新设置当前召唤兽的行动。</span>
              </div>
            </div>
            
            <div className="w-full max-w-xs">
              <button 
                className="w-full px-4 py-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-lg transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 shadow-md transform hover:scale-[1.02] active:scale-[0.98]" 
                onClick={() => dispatch(setUnitAction({
                  unitId: selectedUnitId,
                  action: null
                }))}
              >
                <div className="flex items-center justify-center">
                  <span className="mr-2">🔄</span>
                  <span>重新设置行动</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="p-4 bg-gradient-to-b from-gray-800/70 to-gray-900/70 rounded-lg border border-gray-700 shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="text-sm text-blue-300 mb-1 font-medium">选择行动类型：</div>
          <div className="flex flex-wrap gap-3 justify-center mb-3">
            <button 
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-800 shadow-md transform hover:scale-105 active:scale-95 ${selectedAction === 'attack' ? 'bg-gradient-to-r from-red-700 to-red-600 text-white ring-red-500' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200 hover:from-gray-600 hover:to-gray-700 ring-gray-500'}`}
              onClick={() => setSelectedAction('attack')}
            >
              <div className="flex items-center">
                <span className="mr-2">⚔️</span>
                <span>攻击</span>
              </div>
            </button>
            <button 
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-800 shadow-md transform hover:scale-105 active:scale-95 ${selectedAction === 'defend' ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white ring-blue-500' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200 hover:from-gray-600 hover:to-gray-700 ring-gray-500'}`}
              onClick={() => setSelectedAction('defend')}
            >
              <div className="flex items-center">
                <span className="mr-2">🛡️</span>
                <span>防御</span>
              </div>
            </button>
            <button 
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-800 shadow-md transform hover:scale-105 active:scale-95 ${selectedAction === 'skill' ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white ring-purple-500' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200 hover:from-gray-600 hover:to-gray-700 ring-gray-500'}`}
              onClick={() => setSelectedAction('skill')}
            >
              <div className="flex items-center">
                <span className="mr-2">✨</span>
                <span>技能</span>
              </div>
            </button>
          </div>
          
          {selectedAction === 'skill' && (
            <div className="p-4 bg-gradient-to-b from-purple-900/20 to-purple-900/30 rounded-lg border border-purple-700/30 mb-4 shadow-inner">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 rounded-full bg-purple-800/50 flex items-center justify-center mr-2">
                  <span className="text-purple-300 text-xs">✨</span>
                </div>
                <div className="text-sm font-medium text-purple-300">选择技能</div>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {getSkills().map(skill => (
                  <button
                    key={skill.id}
                    className={`px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-200 shadow-sm transform hover:scale-105 active:scale-95 ${selectedSkill === skill.id ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium ring-1 ring-purple-400' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200 hover:from-gray-600 hover:to-gray-700'}`}
                    onClick={() => setSelectedSkill(skill.id)}
                  >
                    <div className="flex items-center">
                      <span className="mr-1.5">✨</span>
                      <span>{skill.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {(selectedAction === 'attack' || (selectedAction === 'skill' && selectedSkill)) && (
            <div className="p-4 bg-gradient-to-b from-red-900/20 to-red-900/30 rounded-lg border border-red-700/30 mb-4 shadow-inner">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 rounded-full bg-red-800/50 flex items-center justify-center mr-2">
                  <span className="text-red-300 text-xs">🚨</span>
                </div>
                <div className="text-sm font-medium text-red-300">选择目标</div>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {getTargets().map(target => (
                  <button
                    key={target.id}
                    className={`px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-200 shadow-sm transform hover:scale-105 active:scale-95 ${selectedTarget === target.id ? 'bg-gradient-to-r from-red-600 to-red-500 text-white font-medium ring-1 ring-red-400' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200 hover:from-gray-600 hover:to-gray-700'}`}
                    onClick={() => setSelectedTarget(target.id)}
                  >
                    <div className="flex items-center">
                      <span className="mr-1.5">👹</span>
                      <span>{target.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <button 
            className={`mt-4 px-6 py-3 rounded-lg font-bold text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-lg transform hover:scale-105 active:scale-95 ${(
              (selectedAction === 'attack' && !selectedTarget) ||
              (selectedAction === 'skill' && (!selectedSkill || !selectedTarget))
            ) ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'}`}
            onClick={confirmAction}
            disabled={
              (selectedAction === 'attack' && !selectedTarget) ||
              (selectedAction === 'skill' && (!selectedSkill || !selectedTarget))
            }
          >
            <div className="flex items-center justify-center">
              <span className="mr-2">✅</span>
              <span>确认行动</span>
            </div>
          </button>
        </div>
      </div>
    );
  };
  
  // 渲染执行阶段UI
  const renderExecutionPhase = () => {
    return (
      <div className="p-4 bg-gray-800 bg-opacity-70 rounded-lg border border-gray-700 shadow-lg flex flex-col items-center">
        <div className="mb-4 p-3 bg-indigo-900 bg-opacity-50 rounded-md border border-indigo-700 text-indigo-200 font-medium w-full text-center">
          执行阶段 - 单位按速度依次执行行动
        </div>
        <button className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-md transition-colors duration-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" onClick={finishRound}>
          结束回合
        </button>
      </div>
    );
  };
  
  // 获取行动描述
  const getActionDescription = (action) => {
    if (!action) return '无';
    
    switch (action.actionType) {
      case 'attack':
        const target = action.targetIds[0] ? battleUnits[action.targetIds[0]].name : '未知目标';
        return `攻击 ${target}`;
      case 'defend':
        return '防御';
      case 'skill':
        const skillTarget = action.targetIds[0] ? battleUnits[action.targetIds[0]].name : '未知目标';
        const skill = selectedUnit?.skills?.find(s => s.id === action.skillId);
        return `使用技能 ${skill ? skill.name : action.skillId} 对 ${skillTarget}`;
      default:
        return action.actionType;
    }
  };
  
  // 渲染回合和阶段信息
  const renderPhaseInfo = () => {
    return (
      <div className="0">
        {/* <div className="text-amber-400 font-bold px-3 py-1 bg-gray-800 rounded-md">回合 {currentRound}</div>
        <div className="text-blue-300 font-bold px-3 py-1 bg-gray-800 rounded-md">
          {currentPhase === 'preparation' ? '准备阶段' : 
           currentPhase === 'execution' ? '执行阶段' : currentPhase}
        </div> */}
      </div>
    );
  };
  
  // 渲染单位行动状态
  const renderUnitActionStatus = () => {
    if (currentPhase !== 'preparation') return null;
    
    const playerUnits = playerFormation.flat()
      .filter(id => id && battleUnits[id])
      .map(id => battleUnits[id]);
      
    return (
      <div className="h-full p-3 bg-gradient-to-b from-gray-800/70 to-gray-900/70 rounded-lg border border-gray-700 shadow-md flex flex-col">
        <div className="flex items-center mb-3 pb-2 border-b border-gray-600/50">
          <div className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center mr-2">
            <span className="text-blue-300 text-xs">📊</span>
          </div>
          <div className="text-blue-300 font-bold">单位状态</div>
        </div>
        
        <div className="flex-1 overflow-y-auto mb-3 pr-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900/30 hover:scrollbar-thumb-gray-500">
          <div className="space-y-2">
            {playerUnits.map(unit => {
              const hasAction = unitActions[unit.id];
              return (
                <div 
                  key={unit.id} 
                  className={`flex items-center p-2 rounded-lg transition-all duration-200 ${hasAction 
                    ? 'bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-700/30' 
                    : 'bg-gradient-to-r from-gray-800/30 to-gray-700/30 border border-gray-600/30'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2 border border-gray-600">
                    {hasAction ? (
                      <span className="text-green-400 text-xs">✔</span>
                    ) : (
                      <span className="text-gray-400 text-xs">⏳</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{unit.name}</div>
                    <div className={`text-xs ${hasAction ? 'text-green-400' : 'text-gray-400'}`}>
                      {hasAction ? '已准备好行动' : '等待分配行动'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {allUnitsHaveActions && (
          <button 
            className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg transition-all duration-300 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={startExecution}
          >
            <div className="flex items-center justify-center">
              <span className="mr-2">▶️</span>
              <span>开始执行回合</span>
            </div>
          </button>
        )}
      </div>
    );
  };
  
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg border border-white/10 p-4 shadow-lg text-white font-sans flex flex-col overflow-hidden">
      {renderPhaseInfo()}
      
      <div className="flex flex-col md:flex-row gap-4 h-full">
        {/* 左侧面板 - 单位状态 */}
        <div className="md:w-1/3 flex-shrink-0">
          {currentPhase === 'preparation' && renderUnitActionStatus()}
        </div>
        
        {/* 右侧面板 - 行动选择 */}
        <div className="flex-1">
          {currentPhase === 'preparation' ? (
            renderPreparationPhase()
          ) : currentPhase === 'execution' ? (
            renderExecutionPhase()
          ) : (
            <div className="p-4 text-center text-gray-300 bg-gray-800/50 rounded-lg border border-gray-700 shadow-inner h-full flex items-center justify-center">
              {currentPhase}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleActionPanel;
