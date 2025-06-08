import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import BattleGridRenderer from './BattleGridRenderer';
import ActionTypeSelector from './ActionTypeSelector';
import ActionContentSelector from './ActionContentSelector';
import ActionOrderTimeline from './ActionOrderTimeline';
import BattleLogPanel from './BattleLogPanel';
import BattleAnimations from './BattleAnimations';
import BattleResultsScreen from './BattleResultsScreen';
import BattleUnitStats from './BattleUnitStats';
import BattleUnitDetailPanel from './BattleUnitDetailPanel';
import BattleStateMachineDebugPanel from './BattleStateMachineDebugPanel';
// import BattleStateMachineVisualizer from './BattleStateMachineVisualizer';
import { getValidTargetsForUnit, getValidTargetsForSkill } from '@/features/battle/logic/skillSystem';
import { decideEnemyAction } from '@/features/battle/logic/battleAI';
import { summonConfig } from '@/config/summon/summonConfig';
import { activeSkillConfig } from '@/config/skill/activeSkillConfig';
import { useBattleStateMachine, useBattleStateMachineState } from '../hooks/useBattleStateMachine';
import { useBattleAdapter } from '../context/BattleAdapterContext.jsx';

// Redux选择器已移除，现在完全使用状态机状态

// 导入单位状态，以便在UI中响应
import { UNIT_FSM_STATES } from '../state/UnitStateMachine';

// 使用Tailwind CSS，不需要导入样式文件

/**
 * 使用现有的battleAI逻辑生成AI行动
 * @param {Object} unit - 敌方单位
 * @param {Object} allBattleUnits - 所有战斗单位
 * @returns {Object} AI行动
 */
const generateAIAction = (unit, allBattleUnits) => {
  // 分离玩家单位和敌方单位
  const playerUnits = [];
  const enemyUnits = [];
  
  Object.values(allBattleUnits).forEach(battleUnit => {
    if (battleUnit.isPlayerUnit) {
      playerUnits.push(battleUnit);
    } else {
      enemyUnits.push(battleUnit);
    }
  });
  
  // 使用现有的AI决策逻辑
  const action = decideEnemyAction(
    unit, 
    allBattleUnits, 
    playerUnits, 
    enemyUnits, 
    summonConfig,  // 全局宠物配置
    activeSkillConfig  // 技能配置
  );
  
  if (!action) {
    // 如果AI没有返回行动，默认防御
    return {
      actionType: 'defend',
      skillId: null,
      targetIds: []
    };
  }
  
  console.log(`AI单位 ${unit.name} 选择行动:`, action);
  
  return action;
};

const BattleScreen = () => {
  
  // 模拟的UI消息和伤害数字，后续会从state中获取
  const uiMessages = [];
  const damageNumbers = [];
  const isDev = process.env.NODE_ENV === 'development';

  // 集成状态机
  const {
    startBattle,
    endBattle: stateMachineEndBattle,
    resetBattle,
    completePreparation,
    getCurrentState,
    state: machineState,
    triggerEvent,
    submitAction,
    advanceBattle,
    transferResultsToRedux
  } = useBattleStateMachine();
  
  // 获取适配器状态用于调试
  const adapter = useBattleAdapter();
  
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
    isBattleOver,
    playerFormation,
    enemyFormation,
    currentTurnUnitId,
    turnOrder,
    battleLog
  } = useBattleStateMachineState();
  
  // 计算所有单位是否都有行动
  const allUnitsHaveActions = (() => {
    if (!battleUnits || !unitActions) return false;
    const activeUnits = Object.values(battleUnits).filter(unit => !unit.isDefeated);
    return activeUnits.length > 0 && activeUnits.every(unit => unitActions[unit.id]);
  })();
  
  // 添加选中召唤兽的状态
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  // 添加行动选择相关状态
  const [selectedAction, setSelectedAction] = useState('attack');
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  // 追踪AI行动是否已设置
  const [aiActionsSet, setAiActionsSet] = useState(false);
  
  // 在新架构中，单位状态由引擎内部管理，不需要Redux FSM状态

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
  // 当行动类型改变时，重置技能和目标
  useEffect(() => {
    setSelectedSkill(null);
    setSelectedTarget(null);
  }, [selectedAction]);
  
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
    if (!selectedUnitId) {
      console.warn('Cannot confirm action: No unit selected.');
      return;
    }

    // 构建符合 setUnitAction reducer 期望的 action 对象
    const actionData = {
      actionType: selectedAction, // 确保键名为 actionType
      skillId: selectedAction === 'skill' ? selectedSkill : null,
      targetIds: selectedTarget ? [selectedTarget] : [],
    };

    console.log('[BattleScreen] Confirming Action, dispatching setUnitAction with payload:', { unitId: selectedUnitId, action: actionData });
    
    // 派发带有正确结构的 payload
    // 设置行动 - 使用适配器系统
    const result = submitAction(selectedUnitId, actionData);
    console.log('提交行动结果:', result);

    // 后续的 completePreparation() 将由状态机在所有单位都选择完动作后触发
    // 不再需要在UI层面手动管理
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
      console.log('[BattleScreen] 状态机完整状态:', {
        isActive: isBattleActive,
        currentPhase,
        currentRound,
        battleUnitsCount: Object.keys(battleUnits).length,
        unitActionsCount: Object.keys(unitActions).length,
        playerFormationLength: playerFormation?.length,
        enemyFormationLength: enemyFormation?.length,
        currentTurnUnitId
      });
      console.log('[BattleScreen] 适配器状态:', adapter);
    }
  }, [isBattleActive, currentPhase, currentRound, battleUnits, unitActions, playerFormation, enemyFormation, currentTurnUnitId, adapter]);
  
  // 状态机与Redux状态同步监控
  useEffect(() => {
    if (isInPreparation && allUnitsHaveActions) {
      console.log('[BattleScreen] All units have actions, completing preparation phase.');
      completePreparation();
    }
  }, [allUnitsHaveActions, isInPreparation, completePreparation]);
  
  // 在准备阶段开始时设置敌方AI行动
  useEffect(() => {
    // 当战斗激活且进入准备阶段，并且AI行动尚未设置时
    if (isBattleActive && currentPhase === 'preparation' && !aiActionsSet) {
      console.log('准备阶段开始，为敌方单位设置AI行动。');
      
      // 防止重复执行的保护
      let hasSubmittedAnyAction = false;
      
      // 为每个敌方单位生成AI行动
      Object.values(battleUnits).forEach(unit => {
        if (!unit.isPlayerUnit && !unit.isDefeated) {
          // 检查该单位是否已经有行动
          if (unitActions[unit.id]) {
            console.log(`敌方单位 ${unit.name} 已有行动，跳过AI生成`);
            return;
          }
          
          const aiAction = generateAIAction(unit, battleUnits);
          console.log(`为敌方单位 ${unit.name} 生成AI行动:`, aiAction);
          
          // 通过适配器提交AI行动
          const result = submitAction(unit.id, aiAction);
          console.log(`AI行动提交结果:`, result);
          
          if (result.success !== false) {
            hasSubmittedAnyAction = true;
          }
        }
      });
      
      // 只有在成功提交任何行动后才设置标志位
      if (hasSubmittedAnyAction) {
        setAiActionsSet(true);
      }
    }

    // 当战斗结束时，重置标志位以便下一场战斗
    if (!isBattleActive && aiActionsSet) {
      setAiActionsSet(false);
    }
  }, [isBattleActive, currentPhase, aiActionsSet, submitAction]); // 移除battleUnits依赖
  
  // 监控battleUnits变化，但只在特定条件下重置AI行动标志位
  useEffect(() => {
    // 如果battleUnits发生了显著变化（比如战斗重新开始），重置AI行动标志位
    if (isBattleActive && currentPhase === 'preparation' && aiActionsSet) {
      const enemyUnits = Object.values(battleUnits).filter(unit => !unit.isPlayerUnit && !unit.isDefeated);
      const enemyUnitsWithActions = enemyUnits.filter(unit => unitActions[unit.id]);
      
      // 如果有敌方单位但没有行动，说明需要重新生成AI行动
      if (enemyUnits.length > 0 && enemyUnitsWithActions.length === 0) {
        console.log('检测到敌方单位无行动，重置AI行动标志位');
        setAiActionsSet(false);
      }
    }
  }, [battleUnits, unitActions, isBattleActive, currentPhase, aiActionsSet]);
  
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
  
  // 处理执行阶段的自动推进（新的回合制系统）
  useEffect(() => {
    if (currentPhase === 'execution' && !isProcessingRef.current) {
      // 标记正在处理中
      isProcessingRef.current = true;
      
      console.log('执行阶段开始，等待引擎自动处理所有行动...');
      
      // 监听执行完成或新回合开始
      const handlePhaseChange = () => {
        if (currentPhase !== 'execution') {
          console.log('执行阶段结束，进入下一阶段:', currentPhase);
          isProcessingRef.current = false;
        }
      };
      
      // 监听阶段变化
      const timeoutId = setTimeout(handlePhaseChange, 5000); // 5秒超时
      
      return () => {
        clearTimeout(timeoutId);
        isProcessingRef.current = false;
      };
    }
  }, [currentPhase]);

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
      // 在新架构中，目标选择由UI状态管理，不需要Redux action
      setSelectedTarget(unitId);
      console.log(`选择目标: ${unitId}`);
    }
    // 添加更多条件以处理其他阶段
  }, [currentPhase, playerUnits, setSelectedUnitId]);

  // 处理退出战斗
  const handleExitBattle = () => {
    // 使用适配器系统结束战斗并将结果返回Redux
    transferResultsToRedux();
    console.log('战斗结束，结果已返回Redux');
  };

  if (!isBattleActive) {
    return null; // 如果战斗未激活，不渲染任何内容
  }

  return (
    <div className="relative w-full h-full bg-gray-900 text-white font-sans overflow-hidden">
      {/* 状态机调试面板 - 开发模式显示 */}
      {isDev && (
        <BattleStateMachineDebugPanel
          machineState={machineState}
          triggerEvent={triggerEvent}
          reduxPhase={currentPhase}
        />
      )}

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
          <BattleResultsScreen result={battleResult} onExit={handleExitBattle} />
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
            // 传递状态机数据
            playerFormation={playerFormation}
            enemyFormation={enemyFormation}
            battleUnits={battleUnits}
            unitActions={unitActions}
            currentPhase={currentPhase}
            currentRound={currentRound}
            allUnitsHaveActions={allUnitsHaveActions}
            advanceBattle={advanceBattle}
            battleLog={battleLog}
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
              getActiveSkills={getActiveSkills}
              confirmAction={confirmAction}
              hasAction={unitActions[selectedUnitId]}
              getActionDescription={getActionDescription}
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