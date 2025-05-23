import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BattleGridRenderer from './BattleGridRenderer';
import BattleInfoPanel from './BattleInfoPanel';
import ActionTypeSelector from './ActionTypeSelector';
import ActionContentSelector from './ActionContentSelector';
import ActionOrderTimeline from './ActionOrderTimeline';
import BattleLogPanel from './BattleLogPanel';
import BattleAnimations from './BattleAnimations';
import BattleResultsScreen from './BattleResultsScreen';
import BattleUnitStats from './BattleUnitStats';
import { getValidTargetsForUnit, getValidTargetsForSkill } from '@/features/battle/logic/battleLogic';
import { petConfig } from '@/config/petConfig';

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
  selectBattleResult,
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
  const battleResult = useSelector(selectBattleResult);
  
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
    
    // 如果是攻击，使用战斗逻辑中的函数获取有效目标
    if (selectedAction === 'attack') {
      // 获取所有单位数组
      const allUnits = Object.values(battleUnits);
      
      // 使用getValidTargetsForUnit函数获取可攻击的目标
      return getValidTargetsForUnit(selectedUnit, allUnits, petConfig, 'normal');
    }
    
    // 如果是技能，使用技能特定的目标选择逻辑
    if (selectedAction === 'skill' && selectedSkill) {
      // 获取所有单位数组
      const allUnits = Object.values(battleUnits);
      
      // 如果有技能配置对象，可以使用getValidTargetsForSkill
      // 这里暂时使用普通攻击目标选择逻辑
      return getValidTargetsForUnit(selectedUnit, allUnits, petConfig, 'skill');
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
  
  // 创建一个ref来跟踪当前处理的单位，防止重复执行
  // 注意：React Hooks必须在函数组件的顶层调用
  const isProcessingRef = React.useRef(false);
  
  // 处理执行阶段的自动行动
  useEffect(() => {
    if (currentPhase === 'execution' && currentTurnUnitId && !isProcessingRef.current) {
      const currentUnit = battleUnits[currentTurnUnitId];
      
      // 标记正在处理中
      isProcessingRef.current = true;
      
      // 如果是敌方单位，自动执行行动
      if (currentUnit && !currentUnit.isPlayerUnit) {
        console.log(`开始处理敌方单位 ${currentUnit.name} 的行动`);
        // 给一个短暂停，让玩家可以看到当前行动单位
        const actionStartTime = performance.now();
        const actionDuration = 800;
        
        const executeActionFrame = (timestamp) => {
          const elapsed = timestamp - actionStartTime;
          if (elapsed < actionDuration) {
            requestAnimationFrame(executeActionFrame);
            return;
          }
          
          dispatch(executeAction());
          
          // 执行完行动后，等待一会再进入下一个单位的回合
          const nextTurnStartTime = performance.now();
          const nextTurnDuration = 1000;
          
          const nextTurnFrame = (innerTimestamp) => {
            const nextElapsed = innerTimestamp - nextTurnStartTime;
            if (nextElapsed < nextTurnDuration) {
              requestAnimationFrame(nextTurnFrame);
              return;
            }
            
            dispatch(nextTurn());
            // 重置处理标记
            isProcessingRef.current = false;
          };
          
          requestAnimationFrame(nextTurnFrame);
        };
        
        requestAnimationFrame(executeActionFrame);
      } 
      // 如果是玩家单位，并且已经设置了行动，则自动执行
      else if (currentUnit && currentUnit.isPlayerUnit && unitActions[currentTurnUnitId]) {
        console.log(`开始处理玩家单位 ${currentUnit.name} 的行动`);
        // 选中当前行动单位
        setSelectedUnitId(currentTurnUnitId);
        
        // 给一个短暂停，让玩家可以看到当前行动单位
        const actionStartTime = performance.now();
        const actionDuration = 1200; // 玩家单位给更长的时间观察
        
        const executeActionFrame = (timestamp) => {
          const elapsed = timestamp - actionStartTime;
          if (elapsed < actionDuration) {
            requestAnimationFrame(executeActionFrame);
            return;
          }
          
          dispatch(executeAction());
          
          // 执行完行动后，等待一会再进入下一个单位的回合
          const nextTurnStartTime = performance.now();
          const nextTurnDuration = 1000;
          
          const nextTurnFrame = (innerTimestamp) => {
            const nextElapsed = innerTimestamp - nextTurnStartTime;
            if (nextElapsed < nextTurnDuration) {
              requestAnimationFrame(nextTurnFrame);
              return;
            }
            
            dispatch(nextTurn());
            // 重置处理标记
            isProcessingRef.current = false;
          };
          
          requestAnimationFrame(nextTurnFrame);
        };
        
        requestAnimationFrame(executeActionFrame);
      } else {
        // 如果没有有效的行动，重置处理标记
        isProcessingRef.current = false;
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
    <div className="relative w-full h-screen bg-gray-900 text-white font-sans overflow-hidden">
      {/* 战斗动画层 - 绝对定位在最上层 */}
      <BattleAnimations />
      
      {/* 战斗单位属性面板 - 右侧悬浮 */}
      <BattleUnitStats />
      
      {/* 战斗结算界面 - 绝对定位在最上层 */}
      {currentPhase === 'battle_end' && battleResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <BattleResultsScreen result={battleResult} />
        </div>
      )}
      
      {/* 战斗网格背景 - 铺满整个屏幕 */}
      <div className="absolute inset-0 w-full h-full bg-cover bg-center" 
           style={{ backgroundImage: 'url(/assets/backgrounds/battle_bg.jpg)', filter: 'brightness(1.1)' }}>
        {/* 战斗网格 - 占据大部分屏幕空间 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <BattleGridRenderer 
            onUnitClick={handleUnitClick} 
            selectedUnitId={selectedUnitId}
            selectedAction={selectedAction}
          />
        </div>
      </div>
      
      {/* 回合和阶段信息已移至VS上方显示 */}
      
      {/* 行动顺序时间轴 - 悬浮在上方 */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10 w-[80%] max-w-[900px]">
        <ActionOrderTimeline 
          units={Object.values(battleUnits).filter(unit => !unit.isDefeated)} 
          currentTurnUnitId={currentTurnUnitId} 
        />
      </div>
      
      {/* 底部操作面板和日志 - 悬浮在战斗网格上 */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10 w-[90%] max-w-[1100px]">
        <div className="grid grid-cols-12 gap-2 bg-gray-900 bg-opacity-40 backdrop-blur-sm rounded-lg p-2 border border-gray-700/30 shadow-lg">
          {/* 左侧区域 - 行动类型选择 */}
          <div className="col-span-3 rounded-lg shadow-md overflow-hidden h-[200px] bg-gray-900/50">
            <ActionTypeSelector 
              selectedUnit={selectedUnit} 
              selectedAction={selectedAction} 
              setSelectedAction={setSelectedAction} 
            />
          </div>
          
          {/* 中间区域 - 行动内容选择 */}
          <div className="col-span-4 rounded-lg shadow-md overflow-hidden h-[200px] bg-gray-900/50">
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
          <div className="col-span-5 rounded-lg shadow-md overflow-hidden h-[200px] bg-gray-900/50">
            <BattleLogPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleScreen;