import React from 'react';
import BattleGridRenderer from './BattleGridRenderer';
import ActionTypeSelector from './ActionTypeSelector';
import ActionContentSelector from './ActionContentSelector';
import ActionOrderTimeline from './ActionOrderTimeline';
import BattleLogPanel from './BattleLogPanel';
import BattleResultsScreen from './BattleResultsScreen';
import BattleUnitStats from './BattleUnitStats';
import BattleUnitDetailPanel from './BattleUnitDetailPanel';
import BattleStateMachineDebugPanel from './BattleStateMachineDebugPanel';
import { useBattleStateMachine, useBattleStateMachineState } from '../hooks/useBattleStateMachine';
import { useBattleAdapter } from '../context/BattleAdapterContext.jsx';
import { useBattleUI, useBattleComponentData } from '../hooks/useBattleUI.js';



// 使用Tailwind CSS，不需要导入样式文件



const BattleScreen = () => {
  const isDev = process.env.NODE_ENV === 'development';

  // 使用新的UI Hook
  const battleUI = useBattleUI();
  const componentData = useBattleComponentData();
  // console.log(componentData,"componentData");
  
  // 集成状态机 (保留用于调试和控制)
  const {
    state: machineState,
    triggerEvent,
    advanceBattle
  } = useBattleStateMachine();
  
  // 获取适配器状态
  const adapter = useBattleAdapter();
  
  // 获取战斗状态
  const {
    isActive: isBattleActive,
    currentPhase,
    battleUnits,
    battleResult,

  } = useBattleStateMachineState();
  
  // 获取选中的单位信息（直接从battleUI获取）
  const selectedUnit = battleUI.selectedUnitId && battleUnits[battleUI.selectedUnitId] ? 
    battleUnits[battleUI.selectedUnitId] : null;
  
  // 处理退出战斗
  const handleExitBattle = () => {
    // 使用适配器系统结束战斗并将结果返回Redux
    if (adapter) {
      adapter.transferResultsToRedux();
      // console.log('战斗结束，结果已返回Redux');
    }
  };

  // 🚨 增强战斗页面稳定性：避免在动画执行时隐藏页面
  // 如果战斗曾经活跃过，即使临时状态异常也保持页面显示
  const [hasEverBeenActive, setHasEverBeenActive] = React.useState(false);
  
  React.useEffect(() => {
    if (isBattleActive) {
      setHasEverBeenActive(true);
    }
  }, [isBattleActive]);

  if (!isBattleActive && !hasEverBeenActive) {
    return null; // 只有从未激活过的战斗才隐藏页面
  }

  return (
    <div className="battle-screen relative w-full h-full bg-gray-900 text-white font-sans overflow-hidden">
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
      

      
      战斗单位属性面板 - 右侧悬浮
      <BattleUnitStats />
      
      {/* 选中单位详情面板 - 左侧悬浮 */}
      {battleUI.selectedUnitId && battleUnits[battleUI.selectedUnitId] && (
        <div className="absolute top-32 left-4 z-20">
          <BattleUnitDetailPanel unit={battleUnits[battleUI.selectedUnitId]} />
        </div>
      )}
      
      {/* 战斗结算界面 - 绝对定位在最上层 */}
      {currentPhase === 'battle_over' && battleResult && (
          <BattleResultsScreen />
      )}
      
      {/* 战斗网格背景 - 铺满整个屏幕 */}
      <div className="absolute inset-0 w-full h-full bg-cover bg-center" 
           style={{ backgroundImage: 'url(/assets/backgrounds/battle_bg.jpg)', filter: 'brightness(1.1)' }}>
        {/* 战斗网格 - 占据大部分屏幕空间 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <BattleGridRenderer 
            {...componentData.gridData}
          />
        </div>

      </div>
           
      {/* 回合和阶段信息已移至VS上方显示 */}
      
      {/* 行动顺序时间轴 - 悬浮在上方 */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10 w-[80%] max-w-[900px]">
        <ActionOrderTimeline 
          {...componentData.timelineData}
        />
      </div>
      
      {/* 底部操作面板和日志 - 悬浮在战斗网格上 */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10 w-[90%] max-w-[1100px]">
        <div className="grid grid-cols-12 gap-2 bg-gray-900 bg-opacity-40 backdrop-blur-sm rounded-lg p-2 border border-gray-700/30 shadow-lg">
          {/* 左侧区域 - 行动类型选择 */}
          <div className="col-span-3 rounded-lg shadow-md overflow-hidden h-[200px] bg-gray-900/50">
            <ActionTypeSelector 
              selectedUnit={selectedUnit} 
              {...componentData.actionTypeData}
            />
          </div>
          
          {/* 中间区域 - 行动内容选择 */}
          <div className="col-span-4 rounded-lg shadow-md overflow-hidden h-[200px] bg-gray-900/50">
            <ActionContentSelector 
              selectedUnit={selectedUnit}
              {...componentData.actionContentData}
            />
          </div>
          
          {/* 右侧战斗日志面板 */}
          <div className="col-span-5 rounded-lg shadow-md overflow-hidden h-[200px] bg-gray-900/50">
            <BattleLogPanel {...componentData.logData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleScreen;