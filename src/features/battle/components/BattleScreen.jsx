import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BattleGridRenderer from './BattleGridRenderer';
import BattleInfoPanel from './BattleInfoPanel';
import ActionTypeSelector from './ActionTypeSelector';
import ActionContentSelector from './ActionContentSelector';
import ActionOrderTimeline from './ActionOrderTimeline';
import BattleLogPanel from './BattleLogPanel';
import BattleAnimations from './BattleAnimations';

import {
  selectIsBattleActive,
  selectCurrentPhase,
  selectCurrentRound,
  selectCurrentTurnUnitId,
  selectBattleUnits,
  selectPlayerFormation,
  selectEnemyFormation,
  selectUnitActions,
  selectAllUnitsHaveActions,
  selectTurnOrder,
  playerSelectTargets,
  endBattle,
  startPreparationPhase,
  startExecutionPhase,
  setUnitAction,
  executeAction,
  nextTurn,
  setEnemyAIActions
} from '@/store/slices/battleSlice';

// 使用Tailwind CSS，不需要导入样式文件

const BattleScreen = () => {
  const dispatch = useDispatch();
  const isBattleActive = useSelector(selectIsBattleActive);
  const currentPhase = useSelector(selectCurrentPhase);
  const currentRound = useSelector(selectCurrentRound);
  const currentTurnUnitId = useSelector(selectCurrentTurnUnitId);
  const battleUnits = useSelector(selectBattleUnits);
  const playerFormation = useSelector(selectPlayerFormation);
  const enemyFormation = useSelector(selectEnemyFormation);
  const unitActions = useSelector(selectUnitActions);
  const allUnitsHaveActions = useSelector(selectAllUnitsHaveActions);
  
  // 添加选中召唤兽的状态
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  // 添加行动选择相关状态
  const [selectedAction, setSelectedAction] = useState('attack');
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  
  // 获取玩家单位列表
  const playerUnits = playerFormation.flat()
    .filter(id => id && battleUnits[id])
    .map(id => battleUnits[id]);
    
  // 获取选中的单位信息
  const selectedUnit = selectedUnitId && battleUnits[selectedUnitId] ? 
    battleUnits[selectedUnitId] : 
    (playerUnits.length > 0 ? playerUnits[0] : null);
    
  // 初始化时选择第一个玩家单位
  useEffect(() => {
    if (!selectedUnitId && playerUnits.length > 0) {
      setSelectedUnitId(playerUnits[0].id);
    }
  }, [playerUnits, selectedUnitId]);
  
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
    } else if (selectedAction === 'defend') {
      // 防御不需要目标
    } else if (selectedAction === 'escape') {
      // 逃跑不需要目标
      dispatch(endBattle());
      return;
    } else if (selectedAction === 'backpack') {
      // 背包功能暂时不实现
      return;
    } else {
      // 如果没有选择有效行动，不执行
      return;
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
  
  // 初始化战斗时进入准备阶段
  useEffect(() => {
    if (isBattleActive && currentPhase === 'idle') {
      dispatch(startPreparationPhase());
    }
  }, [isBattleActive, currentPhase, dispatch]);
  
  // 在准备阶段开始时设置敌方AI行动
  useEffect(() => {
    if (currentPhase === 'preparation' && Object.keys(unitActions).length === 0) {
      // 当进入准备阶段且没有单位行动时，设置敌方AI行动
      console.log('设置敌方AI行动');
      dispatch(setEnemyAIActions());
    }
  }, [currentPhase, unitActions, dispatch]);
  
  // 监控准备阶段的行动状态（仅用于调试）
  useEffect(() => {
    if (currentPhase === 'preparation') {
      // 打印所有单位的行动情况
      console.log('准备阶段单位行动状态:');
      console.log('所有单位行动:', unitActions);
      
      // 打印敌方单位的行动
      Object.values(battleUnits).forEach(unit => {
        if (!unit.isPlayerUnit) {
          console.log(`敌方单位 ${unit.name} (ID: ${unit.id}) 的行动:`, unitActions[unit.id]);
        }
      });
      
      // 注意：移除了自动进入执行阶段的逻辑，现在由VS下方的按钮控制
    }
  }, [currentPhase, unitActions, battleUnits]);
  
  // 处理执行阶段的自动行动
  useEffect(() => {
    if (currentPhase === 'execution' && currentTurnUnitId) {
      const currentUnit = battleUnits[currentTurnUnitId];
      
      // 如果是敌方单位，自动执行行动
      if (currentUnit && !currentUnit.isPlayerUnit) {
        // 给一个短暂停，让玩家可以看到当前行动单位
        const actionTimer = setTimeout(() => {
          dispatch(executeAction());
          
          // 执行完行动后，等待一会再进入下一个单位的回合
          const nextTurnTimer = setTimeout(() => {
            dispatch(nextTurn());
          }, 1000);
          
          return () => clearTimeout(nextTurnTimer);
        }, 800);
        
        return () => clearTimeout(actionTimer);
      } 
      // 如果是玩家单位，并且已经设置了行动，则自动执行
      else if (currentUnit && currentUnit.isPlayerUnit && unitActions[currentTurnUnitId]) {
        // 选中当前行动单位
        setSelectedUnitId(currentTurnUnitId);
        
        // 给一个短暂停，让玩家可以看到当前行动单位
        const actionTimer = setTimeout(() => {
          dispatch(executeAction());
          
          // 执行完行动后，等待一会再进入下一个单位的回合
          const nextTurnTimer = setTimeout(() => {
            dispatch(nextTurn());
          }, 1000);
          
          return () => clearTimeout(nextTurnTimer);
        }, 1200); // 玩家单位给更长的时间观察
        
        return () => clearTimeout(actionTimer);
      }
    }
  }, [currentPhase, currentTurnUnitId, battleUnits, unitActions, dispatch, setSelectedUnitId]);

  // 处理单位点击事件
  const handleUnitClick = useCallback((unitId) => {
    console.log(`Unit clicked: ${unitId}`);
    
    // 检查是否是玩家单位
    const isPlayerUnit = playerUnits.some(unit => unit.id === unitId);
    
    // 如果是玩家单位，设置为选中单位
    if (isPlayerUnit) {
      setSelectedUnitId(unitId);
      console.log(`Selected player unit: ${unitId}`);
      return;
    }
    
    // 根据当前战斗阶段分发相应的动作
    if (currentPhase === 'player_target_selection') {
      dispatch(playerSelectTargets({ targetIds: [unitId] }));
      console.log(`Dispatching playerSelectTargets with target: ${unitId}`);
    }
    // 添加更多条件以处理其他阶段
  }, [dispatch, currentPhase, playerUnits, setSelectedUnitId]);

  // 处理退出战斗
  const handleExitBattle = () => {
    dispatch(endBattle());
  };

  if (!isBattleActive) {
    return null; // 如果战斗未激活，不渲染任何内容
  }

  return (
    <div className="flex flex-col bg-gray-900 bg-opacity-90 p-6 text-white font-sans max-w-[1600px] mx-auto">
      {/* 战斗动画层 */}
      <BattleAnimations />
      <div className="flex justify-between items-center p-2 bg-gray-800 bg-opacity-70 rounded-lg mb-4 border border-gray-700 shadow-md">
        <div className="text-amber-400 font-bold px-3 py-1 bg-gray-900 rounded-md mx-auto">
          回合: {currentRound} | 阶段: {
            currentPhase === 'preparation' ? '准备阶段' : 
            currentPhase === 'execution' ? '执行阶段' : 
            currentPhase === 'player_target_selection' ? '选择目标' : currentPhase
          }
        </div>
      </div>
      
      <div className=" bg-gray-800 bg-opacity-50 rounded-lg mb-4 border border-gray-700 shadow-lg overflow-hidden">
        <BattleGridRenderer onUnitClick={handleUnitClick} />
      </div>
      
      {/* 行动顺序时间轴 */}
      <ActionOrderTimeline 
        units={Object.values(battleUnits).filter(unit => !unit.isDefeated)} 
        currentTurnUnitId={currentTurnUnitId} 
      />
  

      {/* 底部面板 - 简化版本 */}
      <div className="grid grid-cols-12 gap-3 h-[400px] bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700 shadow-lg overflow-hidden">
        {/* 左侧区域 - 行动类型选择 */}
        <div className="col-span-3 rounded-lg shadow-md overflow-hidden">
          <ActionTypeSelector 
            selectedUnit={selectedUnit} 
            selectedAction={selectedAction} 
            setSelectedAction={setSelectedAction} 
          />
        </div>
        
        {/* 中间区域 - 行动内容选择 */}
        <div className="col-span-4 rounded-lg shadow-md overflow-hidden">
          <ActionContentSelector 
            selectedUnit={selectedUnit}
            selectedAction={selectedAction}
            selectedSkill={selectedSkill}
            setSelectedSkill={setSelectedSkill}
            selectedTarget={selectedTarget}
            setSelectedTarget={setSelectedTarget}
            getTargets={getTargets}
            getSkills={getSkills}
            confirmAction={confirmAction}
            hasAction={unitActions[selectedUnitId]}
            getActionDescription={getActionDescription}
            dispatch={dispatch}
            setUnitAction={setUnitAction}
            selectedUnitId={selectedUnitId}
          />
        </div>
        
        {/* 右侧战斗日志面板 */}
        <div className="col-span-5 rounded-lg shadow-md overflow-hidden">
          <BattleLogPanel />
        </div>
      </div>
    </div>
  );
};

export default BattleScreen;