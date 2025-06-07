import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BattleGridRenderer from './BattleGridRenderer';
import ActionTypeSelector from './ActionTypeSelector';
import ActionContentSelector from './ActionContentSelector';
import ActionOrderTimeline from './ActionOrderTimeline';
import BattleLogPanel from './BattleLogPanel';
import BattleAnimations from './BattleAnimations';
import BattleResultsScreen from './BattleResultsScreen';
import BattleUnitStats from './BattleUnitStats';
import BattleUnitDetailPanel from './BattleUnitDetailPanel';
// import BattleStateMachineVisualizer from './BattleStateMachineVisualizer';
import { getValidTargetsForUnit, getValidTargetsForSkill } from '@/features/battle/logic/skillSystem';
import { summonConfig } from '@/config/summon/summonConfig';
import { activeSkillConfig } from '@/config/skill/activeSkillConfig';
import { useBattleStateMachine, useBattleStateMachineState } from '../hooks/useBattleStateMachine';

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
  
  // 集成状态机
  const {
    startBattle,
    endBattle: stateMachineEndBattle,
    resetBattle,
    completePreparation,
    getCurrentState,
    state: stateMachineState
  } = useBattleStateMachine();
  
  const {
    isActive: isBattleActive,
    currentPhase,
    currentRound,
    battleUnits,
    unitActions,
    battleResult,
    isInPreparation,
    isInExecution,
    isInResolution,
    isBattleOver
  } = useBattleStateMachineState();
  
  // 原有的选择器保持不变，以便向后兼容
  const playerFormation = useSelector(selectPlayerFormation);
  const enemyFormation = useSelector(selectEnemyFormation);
  const currentTurnUnitId = useSelector(selectCurrentTurnUnitId);
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
    
    // 如果是攻击，使用战斗逻辑中的函数获取有效目标
    if (selectedAction === 'attack') {
      // 获取所有单位数组
      const allUnits = Object.values(battleUnits);
      
      // 使用getValidTargetsForUnit函数获取可攻击的目标
      return getValidTargetsForUnit(selectedUnit, allUnits, summonConfig, 'normal');
    }
    
    // 如果是技能，使用技能特定的目标选择逻辑
    if (selectedAction === 'skill' && selectedSkill) {
      // 获取所有单位数组
      const allUnits = Object.values(battleUnits);
      
      // 如果有技能配置对象，可以使用getValidTargetsForSkill
      // 这里暂时使用普通攻击目标选择逻辑
      return getValidTargetsForUnit(selectedUnit, allUnits, summonConfig, 'skill');
    }
    
    // 如果是防御或其他，没有目标
    return [];
  };
  
  // 获取单位可用的主动技能
  const getActiveSkills = () => {
    console.log('获取主动技能 - 当前选中单位:', selectedUnit?.name);
    
    if (!selectedUnit) {
      console.log('未选中单位');
      return [];
    }
    
    if (!selectedUnit.skillSet) {
      console.log('单位没有 skillSet 属性:', selectedUnit.id);
      return [];
    }
    
    console.log('单位技能列表 (skillSet):', selectedUnit.skillSet);
    
    // 从 activeSkillConfig 中获取技能详细信息
    const activeSkills = selectedUnit.skillSet
      .filter(skillId => skillId) // 过滤掉空值
      .map(skillId => {
        const skillInfo = activeSkillConfig.find(skill => skill.id === skillId);
        return skillInfo || null;
      })
      .filter(skill => skill !== null) // 过滤掉未找到的技能
      .filter(skill => skill.type !== 'passive'); // 只保留非被动技能
    
    console.log('获取到的主动技能列表:', activeSkills.map(s => s.name));
    return activeSkills;
  };
  
  // 获取技能影响范围
  /**
   * 获取技能影响范围
   * @param {string} skillId - 技能ID
   * @param {string} targetId - 目标单位ID
   * @returns {Array} - 影响范围内的格子位置数组
   */
  const getSkillAffectedArea = (skillId, targetId) => {
    if (!skillId || !selectedUnit || !targetId) return [];
    
    const skill = activeSkillConfig.find(s => s.id === skillId);
    if (!skill) return [];
    
    console.log('获取技能影响范围:', skill.name, '目标ID:', targetId);
    
    // 获取目标单位
    const targetUnit = battleUnits[targetId];
    if (!targetUnit) return [];
    
    // 目标位置
    const targetPos = targetUnit.gridPosition;
    const targetTeam = targetPos.team;
    
    // 存储受影响的格子位置
    const affectedPositions = [];
    
    // 根据技能的 targetType 和 areaType 属性确定影响范围
    const targetType = skill.targetType;
    const areaType = skill.areaType;
    
    // 单体技能
    if (targetType === 'single' || !targetType) {
      // 添加目标格子
      affectedPositions.push({
        team: targetTeam,
        row: targetPos.row,
        col: targetPos.col
      });
    }
    // 群体技能
    else if (targetType === 'group') {
      // 添加目标格子
      affectedPositions.push({
        team: targetTeam,
        row: targetPos.row,
        col: targetPos.col
      });
      
      // 根据不同的范围类型计算影响的格子
      if (areaType === 'cross') { // 十字范围
        // 定义上下左右四个相邻格子
        const crossPositions = [
          { row: targetPos.row - 1, col: targetPos.col }, // 上
          { row: targetPos.row + 1, col: targetPos.col }, // 下
          { row: targetPos.row, col: targetPos.col - 1 }, // 左
          { row: targetPos.row, col: targetPos.col + 1 }  // 右
        ];
        
        // 过滤掉超出范围的格子
        crossPositions.forEach(pos => {
          if (pos.row >= 0 && pos.row < 3 && pos.col >= 0 && pos.col < 3) {
            affectedPositions.push({
              team: targetTeam,
              row: pos.row,
              col: pos.col
            });
          }
        });
        
        console.log('十字范围格子:', affectedPositions);
      }
      else if (areaType === 'row') { // 整行范围
        // 添加同一行的所有格子
        for (let col = 0; col < 3; col++) {
          affectedPositions.push({
            team: targetTeam,
            row: targetPos.row,
            col: col
          });
        }
      }
      else if (areaType === 'column') { // 整列范围
        // 添加同一列的所有格子
        for (let row = 0; row < 3; row++) {
          affectedPositions.push({
            team: targetTeam,
            row: row,
            col: targetPos.col
          });
        }
      }
      else if (areaType === 'square') { // 方形范围
        // 添加 3x3 方形范围内的所有格子
        for (let row = Math.max(0, targetPos.row - 1); row <= Math.min(2, targetPos.row + 1); row++) {
          for (let col = Math.max(0, targetPos.col - 1); col <= Math.min(2, targetPos.col + 1); col++) {
            affectedPositions.push({
              team: targetTeam,
              row: row,
              col: col
            });
          }
        }
      }
      else { // 默认情况，目标及其相邻格子
        // 上下左右四个相邻格子
        const adjacentPositions = [
          { row: targetPos.row - 1, col: targetPos.col }, // 上
          { row: targetPos.row + 1, col: targetPos.col }, // 下
          { row: targetPos.row, col: targetPos.col - 1 }, // 左
          { row: targetPos.row, col: targetPos.col + 1 }  // 右
        ];
        
        // 过滤掉超出范围的格子
        adjacentPositions.forEach(pos => {
          if (pos.row >= 0 && pos.row < 3 && pos.col >= 0 && pos.col < 3) {
            affectedPositions.push({
              team: targetTeam,
              row: pos.row,
              col: pos.col
            });
          }
        });
      }
    }
    // 无目标技能（如自身增益）
    else if (targetType === 'none') {
      // 添加施法者格子
      const casterPos = selectedUnit.gridPosition;
      affectedPositions.push({
        team: casterPos.team,
        row: casterPos.row,
        col: casterPos.col
      });
    }
    
    // 去除重复格子
    const uniquePositions = [];
    const positionMap = new Map();
    
    affectedPositions.forEach(pos => {
      const key = `${pos.team}-${pos.row}-${pos.col}`;
      if (!positionMap.has(key)) {
        positionMap.set(key, true);
        uniquePositions.push(pos);
      }
    });
    
    console.log('技能实际影响范围位置:', uniquePositions);
    return uniquePositions;
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
        const skill = selectedUnit?.skillSet?.find(s => s.id === action.skillId);
        return `使用技能 ${skill ? skill.name : action.skillId} 对 ${skillTarget}`;
      default:
        return action.actionType;
    }
  };
  
  // 状态机状态监控（开发模式）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[BattleScreen] 状态机状态:', stateMachineState);
      console.log('[BattleScreen] Redux战斗状态:', { currentPhase, currentRound, isBattleActive });
    }
  }, [stateMachineState, currentPhase, currentRound, isBattleActive]);
  
  // 状态机与Redux状态同步监控
  useEffect(() => {
    if (isInPreparation && allUnitsHaveActions) {
      console.log('[BattleScreen] 所有单位已准备就绪，可以进入执行阶段');
    }
  }, [isInPreparation, allUnitsHaveActions]);
  
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
    <div className="relative w-full h-full bg-gray-900 text-white font-sans overflow-hidden">
      {/* 状态机可视化组件 - 开发模式显示 */}
        {/* {process.env.NODE_ENV === 'development' && (
          <BattleStateMachineVisualizer isVisible={true} />
        )} */}
      
      {/* 战斗动画层 - 绝对定位在最上层 */}
      <BattleAnimations />
      
      战斗单位属性面板 - 右侧悬浮
      <BattleUnitStats />
      
      {/* 选中单位详情面板 - 左侧悬浮 */}
      {selectedUnitId && battleUnits[selectedUnitId] && (
        <div className="absolute top-32 left-4 z-20">
          <BattleUnitDetailPanel unit={battleUnits[selectedUnitId]} />
        </div>
      )}
      
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
            selectedSkill={selectedSkill}
            selectedTarget={selectedTarget}
            skillAffectedArea={selectedSkill && selectedAction === 'skill' && selectedTarget ? getSkillAffectedArea(selectedSkill, selectedTarget) : []}
          />
        </div>
      </div>
      
      {/* 状态机调试面板 - 开发模式显示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 z-30 bg-black bg-opacity-80 text-white p-4 rounded-lg text-sm">
          <h4 className="font-bold mb-2">状态机调试</h4>
          <div>主状态: {stateMachineState.currentState}</div>
          <div>子状态: {stateMachineState.currentSubState || '无'}</div>
          <div>Redux阶段: {currentPhase}</div>
          <div className="mt-2 space-y-1">
            <button 
              onClick={completePreparation}
              disabled={!isInPreparation}
              className="block w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-xs"
            >
              完成准备阶段
            </button>
            <button 
              onClick={() => stateMachineEndBattle()}
              className="block w-full px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
            >
              结束战斗
            </button>
            <button 
              onClick={resetBattle}
              className="block w-full px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
            >
              重置战斗
            </button>
          </div>
        </div>
      )}
      
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
              getActiveSkills={getActiveSkills}
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