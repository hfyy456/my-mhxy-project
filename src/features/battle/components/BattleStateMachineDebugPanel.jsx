import React, { useState, useEffect } from 'react';
import { BATTLE_EVENTS } from '../state/BattleStateMachine';
import { useBattleAdapter } from '../context/BattleAdapterContext.jsx';
import { useBattleStateMachineState } from '../hooks/useBattleStateMachine';
import './BattleDebugPanel.css';

const BattleStateMachineDebugPanel = ({ machineState, triggerEvent, reduxPhase }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, engine, adapter, logs
  const [engineDebugInfo, setEngineDebugInfo] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(1000);
  
  const adapter = useBattleAdapter();
  const stateMachineStateData = useBattleStateMachineState();

  // 定期刷新引擎调试信息
  useEffect(() => {
    const updateEngineInfo = () => {
      try {
        if (adapter && adapter.getDebugInfo) {
          const debugInfo = adapter.getDebugInfo();
          setEngineDebugInfo(debugInfo);
        }
      } catch (error) {
        console.warn('[DebugPanel] 获取引擎调试信息失败:', error);
      }
    };

    updateEngineInfo();
    const timer = setInterval(updateEngineInfo, refreshInterval);
    return () => clearInterval(timer);
  }, [adapter, refreshInterval]);

  if (!machineState) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-red-900 bg-opacity-80 text-white p-3 rounded-lg">
        <span className="text-red-300">FSM Debug: No State</span>
      </div>
    );
  }

  const { currentState, currentSubState, context, stateHistory } = machineState;

  const renderState = (stateValue, isActive = false) => {
    const stateColors = {
      'idle': 'text-gray-400',
      'active': 'text-green-400',
      'preparation': 'text-blue-400',
      'execution': 'text-yellow-400',
      'resolution': 'text-purple-400',
      'end': 'text-red-400',
    };
    const color = isActive ? 'text-green-300 bg-green-900/30' : stateColors[stateValue] || 'text-white';
    return <span className={`font-mono font-bold ${color} px-1 rounded`}>{stateValue || 'none'}</span>;
  };

  const renderOverviewTab = () => (
    <div className="space-y-4">
      {/* 实时状态监控区 */}
      <div>
        <h5 className="font-bold text-green-300 mb-2 text-sm">🔴 Live Status</h5>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <span className="text-gray-400">状态机状态:</span>{renderState(currentState, true)}
          <span className="text-gray-400">子状态:</span>{renderState(currentSubState)}
          <span className="text-gray-400">Redux阶段:</span>
          <span className={`font-mono font-bold ${reduxPhase === currentSubState ? 'text-green-400' : 'text-red-400'}`}>
            {reduxPhase}
          </span>
          <span className="text-gray-400">引擎状态:</span>
          <span className="font-mono text-cyan-400">
            {engineDebugInfo?.engine?.state || 'unknown'}
          </span>
          <span className="text-gray-400">当前回合:</span>
          <span className="font-mono text-yellow-400">{context.roundNumber}</span>
          <span className="text-gray-400">行动队列:</span>
          <span className="font-mono text-blue-400">{context.actionQueue?.length || 0}</span>
        </div>
      </div>

      {/* 状态一致性检查 */}
      <div>
        <h5 className="font-bold text-yellow-300 mb-2 text-sm">⚠️ Consistency Check</h5>
        <div className="space-y-1 text-xs">
          <div className={`flex justify-between ${reduxPhase === currentSubState ? 'text-green-400' : 'text-red-400'}`}>
            <span>Redux ↔ StateMachine:</span>
            <span>{reduxPhase === currentSubState ? '✅ 同步' : '❌ 不同步'}</span>
          </div>
          <div className="flex justify-between text-cyan-400">
            <span>引擎连接状态:</span>
            <span>{adapter ? '✅ 已连接' : '❌ 未连接'}</span>
          </div>
          <div className="flex justify-between text-purple-400">
            <span>状态订阅者数:</span>
            <span>{engineDebugInfo?.adapter?.subscriberCounts?.state || 0}</span>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div>
        <h5 className="font-bold text-blue-300 mb-2 text-sm">🎮 Quick Actions</h5>
        <div className="grid grid-cols-2 gap-1">
                     <button
             onClick={() => triggerEvent(BATTLE_EVENTS.START_BATTLE)}
             className="btn-hover px-2 py-1 bg-green-800 hover:bg-green-700 text-green-200 rounded text-xs"
           >
             开始战斗
           </button>
           <button
             onClick={() => triggerEvent(BATTLE_EVENTS.COMPLETE_PREPARATION)}
             className="btn-hover px-2 py-1 bg-blue-800 hover:bg-blue-700 text-blue-200 rounded text-xs"
           >
             完成准备
           </button>
           <button
             onClick={() => triggerEvent(BATTLE_EVENTS.START_EXECUTION)}
             className="btn-hover px-2 py-1 bg-yellow-800 hover:bg-yellow-700 text-yellow-200 rounded text-xs"
           >
             开始执行
           </button>
           <button
             onClick={() => triggerEvent(BATTLE_EVENTS.END_BATTLE)}
             className="btn-hover px-2 py-1 bg-red-800 hover:bg-red-700 text-red-200 rounded text-xs"
           >
             结束战斗
           </button>
        </div>
      </div>
    </div>
  );

  const renderEngineTab = () => (
    <div className="space-y-4">
      <div>
        <h5 className="font-bold text-cyan-300 mb-2 text-sm">🔧 Engine State</h5>
        <div className="bg-gray-900/50 p-2 rounded text-xs font-mono">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-gray-400">引擎ID:</span>
            <span className="text-cyan-400 truncate">{engineDebugInfo?.engine?.battleId}</span>
            <span className="text-gray-400">引擎状态:</span>
            <span className="text-cyan-400">{engineDebugInfo?.engine?.state}</span>
            <span className="text-gray-400">当前回合:</span>
            <span className="text-yellow-400">{engineDebugInfo?.engine?.currentRound}</span>
          </div>
        </div>
      </div>

      <div>
        <h5 className="font-bold text-purple-300 mb-2 text-sm">📊 Adapter Stats</h5>
        <div className="bg-gray-900/50 p-2 rounded text-xs">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">状态订阅者:</span>
              <span className="text-purple-400">{engineDebugInfo?.adapter?.subscriberCounts?.state || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">UI订阅者:</span>
              <span className="text-purple-400">{engineDebugInfo?.adapter?.subscriberCounts?.ui || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">缓存状态:</span>
              <span className="text-purple-400">
                {engineDebugInfo?.adapter?.cacheInfo?.hasCachedState ? '✅' : '❌'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">最后更新:</span>
              <span className="text-purple-400 text-xxs">
                {engineDebugInfo?.adapter?.cacheInfo?.lastUpdate 
                  ? new Date(engineDebugInfo.adapter.cacheInfo.lastUpdate).toLocaleTimeString()
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h5 className="font-bold text-orange-300 mb-2 text-sm">🚌 Event Bus</h5>
        <div className="bg-gray-900/50 p-2 rounded text-xs">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">事件类型数:</span>
              <span className="text-orange-400">{Object.keys(engineDebugInfo?.eventBus?.listeners || {}).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">历史事件数:</span>
              <span className="text-orange-400">{engineDebugInfo?.eventBus?.historySize || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdapterTab = () => (
    <div className="space-y-4">
      <div>
        <h5 className="font-bold text-indigo-300 mb-2 text-sm">🔗 Adapter Status</h5>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">适配器类型:</span>
            <span className="text-indigo-400">{adapter ? adapter.constructor.name : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">控制状态:</span>
            <span className="text-indigo-400">
              {adapter?.getControlStatus ? adapter.getControlStatus().controlledBy : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h5 className="font-bold text-pink-300 mb-2 text-sm">📋 Battle Data</h5>
        <div className="bg-gray-900/50 p-2 rounded text-xs max-h-40 overflow-y-auto">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">玩家单位:</span>
              <span className="text-pink-400">{Object.keys(stateMachineStateData.battleUnits || {}).filter(id => stateMachineStateData.battleUnits[id]?.isPlayerUnit).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">敌方单位:</span>
              <span className="text-pink-400">{Object.keys(stateMachineStateData.battleUnits || {}).filter(id => !stateMachineStateData.battleUnits[id]?.isPlayerUnit).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">已提交行动:</span>
              <span className="text-pink-400">{Object.keys(stateMachineStateData.unitActions || {}).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">日志条目:</span>
              <span className="text-pink-400">{stateMachineStateData.battleLog?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">回合顺序:</span>
              <span className="text-pink-400">{stateMachineStateData.turnOrder?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h5 className="font-bold text-red-300 mb-2 text-sm">🔄 Actions</h5>
        <div className="grid grid-cols-1 gap-1">
          <button
            onClick={() => adapter?.reset?.()}
            className="px-2 py-1 bg-red-800 hover:bg-red-700 text-red-200 rounded text-xs"
          >
            重置适配器
          </button>
          <button
            onClick={() => setRefreshInterval(prev => prev === 1000 ? 500 : prev === 500 ? 2000 : 1000)}
            className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs"
          >
            刷新间隔: {refreshInterval}ms
          </button>
        </div>
      </div>
    </div>
  );

  const renderLogsTab = () => (
    <div className="space-y-4">
      <div>
        <h5 className="font-bold text-green-300 mb-2 text-sm">📜 Event History</h5>
        <div className="h-32 overflow-y-auto bg-gray-900/50 p-2 rounded border border-green-500/20 text-xs">
          {stateHistory && [...stateHistory].reverse().slice(0, 20).map((record, index) => (
            <div key={index} className="mb-1 pb-1 border-b border-gray-700/30 last:border-0">
              <div className="flex justify-between items-center">
                <span className="font-bold text-yellow-400 text-xs">{record.event}</span>
                <span className="text-gray-500 text-xxs">{new Date(record.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="text-gray-400 text-xxs">
                <span className="font-mono">{record.state || 'N/A'}/{record.subState || 'none'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h5 className="font-bold text-blue-300 mb-2 text-sm">📝 Battle Log</h5>
        <div className="h-32 overflow-y-auto bg-gray-900/50 p-2 rounded border border-blue-500/20 text-xs">
          {stateMachineStateData.battleLog?.slice(-10).reverse().map((log, index) => (
            <div key={index} className="mb-1 pb-1 border-b border-gray-700/30 last:border-0">
              <div className="flex justify-between items-center">
                <span className="text-blue-400">{log.message}</span>
                <span className="text-gray-500 text-xxs">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="text-gray-400 text-xxs">
                Phase: {log.phase} | Unit: {log.unitId || 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: '总览', icon: '📊' },
    { id: 'engine', label: '引擎', icon: '🔧' },
    { id: 'adapter', label: '适配器', icon: '🔗' },
    { id: 'logs', label: '日志', icon: '📜' }
  ];

     return (
     <div 
       className={`debug-panel debug-panel-transition fixed top-4 right-4 z-50 bg-gray-900 bg-opacity-95 backdrop-blur-sm text-white rounded-lg shadow-2xl border border-blue-500/30 ${isCollapsed ? 'w-48' : 'w-[500px]'}`}
     >
      <div className="flex justify-between items-center p-3 cursor-pointer border-b border-blue-500/20" onClick={() => setIsCollapsed(!isCollapsed)}>
        <h4 className="font-bold text-sm text-blue-300">🔍 Battle Debug Panel</h4>
        <button className="text-blue-300 hover:text-white transition-colors text-xs">
          {isCollapsed ? '展开' : '收起'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-3">
          {/* 标签页 */}
          <div className="flex mb-3 bg-gray-800/50 rounded p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

                     {/* 标签页内容 */}
           <div className="debug-content scrollbar-thin">
             {activeTab === 'overview' && renderOverviewTab()}
             {activeTab === 'engine' && renderEngineTab()}
             {activeTab === 'adapter' && renderAdapterTab()}
             {activeTab === 'logs' && renderLogsTab()}
           </div>
        </div>
      )}

      
    </div>
  );
};

export default BattleStateMachineDebugPanel; 