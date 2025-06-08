/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-23 02:45:30
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-23 02:45:30
 * @FilePath: \my-mhxy-project\src\features\battle\components\BattleLogPanel.jsx
 * @Description: 战斗日志面板组件
 */
import React, { useRef, useEffect } from 'react';
import { useBattleStateMachineState } from '../hooks/useBattleStateMachine';

const BattleLogPanel = () => {
  const { battleLog } = useBattleStateMachineState();
  const logContainerRef = useRef(null);
  
  // 当日志更新时，自动滚动到底部
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [battleLog]);
  
  // 格式化时间戳
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };
  
  // 根据日志类型返回不同的样式
  const getLogStyle = (log) => {
    if (log.phase === 'preparation') {
      return 'text-blue-300';
    } else if (log.phase === 'execution') {
      return 'text-amber-300';
    } else if (log.phase === 'battle_end') {
      return 'text-green-300 font-bold';
    } else if (log.phase === 'end') {
      return 'text-purple-300';
    } else if (log.unitId) {
      return 'text-gray-300';
    } else {
      return 'text-white';
    }
  };
  
  return (
    <div className="w-full h-full bg-gray-900/80 rounded-lg border border-gray-700 shadow-inner overflow-hidden flex flex-col">
      <div className="px-3 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full bg-amber-900/50 flex items-center justify-center mr-2 border border-amber-800/50">
            <span className="text-amber-300 text-xs">📜</span>
          </div>
          <div className="text-amber-300 font-bold text-sm">战斗日志</div>
        </div>
        <div className="text-xs text-gray-500">{battleLog.length}条记录</div>
      </div>
      
      <div 
        ref={logContainerRef}
        className="overflow-y-auto p-2 text-xs space-y-1 custom-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#4B5563 #1F2937',
          height: '160px',
          maxHeight: '160px'
        }}
      >
        {battleLog.length === 0 ? (
          <div className="text-gray-500 italic text-center py-4 flex flex-col items-center">
            <span className="text-2xl mb-2">📝</span>
            <span>战斗尚未开始...</span>
          </div>
        ) : (
          battleLog.map((log, index) => (
            <div 
              key={index} 
              className={`py-1.5 px-2.5 rounded ${index % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-800/30'} transition-colors duration-200 hover:bg-gray-700/50`}
            >
              <span className="text-gray-500 mr-2 font-mono text-[10px]">[{formatTimestamp(log.timestamp)}]</span>
              <span className={`${getLogStyle(log)} transition-colors duration-200`}>{log.message}</span>
            </div>
          ))
        )}
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1F2937;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #4B5563;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default BattleLogPanel;
