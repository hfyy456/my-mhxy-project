/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-01-27
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-01-27
 * @Description: 战斗状态机可视化组件 - 用于调试和监控状态机状态
 */

import React, { useState, useEffect } from 'react';
import { useBattleStateMachine, useBattleStateMachineState } from '../hooks/useBattleStateMachine';
import { BATTLE_STATES, BATTLE_EVENTS } from '../state/BattleStateMachine';

const BattleStateMachineVisualizer = ({ isVisible = true }) => {
  const {
    getCurrentState,
    getStateHistory,
    triggerEvent,
    state: stateMachineState
  } = useBattleStateMachine();
  
  const {
    currentPhase,
    currentRound,
    isInPreparation,
    isInExecution,
    isInResolution,
    isBattleOver
  } = useBattleStateMachineState();
  
  const [expandedHistory, setExpandedHistory] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  
  if (!isVisible) return null;

  const currentState = getCurrentState();
  const stateHistory = getStateHistory();
  
  // 获取最近的5个状态历史
  const recentHistory = stateHistory.slice(-5).reverse();

  // 状态颜色映射
  const getStateColor = (state) => {
    switch (state) {
      case BATTLE_STATES.IDLE:
        return 'bg-gray-500';
      case BATTLE_STATES.INITIALIZATION:
        return 'bg-yellow-500';
      case BATTLE_STATES.ACTIVE:
        return 'bg-green-500';
      case BATTLE_STATES.END:
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  // 子状态颜色映射
  const getSubStateColor = (subState) => {
    switch (subState) {
      case BATTLE_STATES.PREPARATION:
        return 'bg-orange-400';
      case BATTLE_STATES.EXECUTION:
        return 'bg-purple-400';
      case BATTLE_STATES.RESOLUTION:
        return 'bg-teal-400';
      default:
        return 'bg-gray-400';
    }
  };

  // 可用事件列表
  const availableEvents = Object.values(BATTLE_EVENTS);

  return (
    <div className="fixed top-4 left-4 z-50 bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-lg max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">状态机监控</h3>
        <div className="text-xs text-gray-300">
          回合 {currentRound}
        </div>
      </div>

      {/* 当前状态显示 */}
      <div className="mb-4">
        <div className="text-sm font-semibold mb-2">当前状态</div>
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded-full ${getStateColor(stateMachineState.currentState)}`}></div>
          <span className="text-sm">{stateMachineState.currentState}</span>
          {stateMachineState.currentSubState && (
            <>
              <span className="text-gray-400">→</span>
              <div className={`w-3 h-3 rounded-full ${getSubStateColor(stateMachineState.currentSubState)}`}></div>
              <span className="text-xs text-gray-300">{stateMachineState.currentSubState}</span>
            </>
          )}
        </div>
      </div>

      {/* Redux状态同步显示 */}
      <div className="mb-4">
        <div className="text-sm font-semibold mb-2">Redux状态</div>
        <div className="text-xs space-y-1">
          <div>阶段: <span className="text-yellow-300">{currentPhase}</span></div>
          <div className="flex space-x-3">
            <span className={isInPreparation ? 'text-green-400' : 'text-gray-500'}>准备</span>
            <span className={isInExecution ? 'text-green-400' : 'text-gray-500'}>执行</span>
            <span className={isInResolution ? 'text-green-400' : 'text-gray-500'}>结算</span>
            <span className={isBattleOver ? 'text-red-400' : 'text-gray-500'}>结束</span>
          </div>
        </div>
      </div>

      {/* 状态历史 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">状态历史</div>
          <button
            onClick={() => setExpandedHistory(!expandedHistory)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {expandedHistory ? '收起' : '展开'}
          </button>
        </div>
        
        <div className="space-y-1 text-xs">
          {recentHistory.slice(0, expandedHistory ? 10 : 3).map((history, index) => (
            <div key={index} className="flex items-center space-x-2 py-1 px-2 bg-gray-800 rounded">
              <div className={`w-2 h-2 rounded-full ${getStateColor(history.state)}`}></div>
              <span className="text-gray-300">{history.event}</span>
              <span className="text-gray-500 text-xs">
                {new Date(history.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 手动事件触发 */}
      <div className="mb-4">
        <div className="text-sm font-semibold mb-2">手动触发事件</div>
        <div className="flex space-x-2">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="flex-1 px-2 py-1 bg-gray-700 text-white text-xs rounded"
          >
            <option value="">选择事件</option>
            {availableEvents.map(event => (
              <option key={event} value={event}>
                {event}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (selectedEvent) {
                triggerEvent(selectedEvent);
                setSelectedEvent('');
              }
            }}
            disabled={!selectedEvent}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-xs"
          >
            触发
          </button>
        </div>
      </div>

      {/* 状态机上下文信息 */}
      {stateMachineState.context && Object.keys(stateMachineState.context).length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-semibold mb-2">上下文信息</div>
          <div className="text-xs space-y-1">
            {Object.entries(stateMachineState.context).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-400">{key}:</span>
                <span className="text-gray-300">
                  {typeof value === 'object' 
                    ? Array.isArray(value) 
                      ? `[${value.length}]` 
                      : JSON.stringify(value).slice(0, 20) + '...'
                    : String(value).slice(0, 20)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 状态图可视化 */}
      <div className="mb-4">
        <div className="text-sm font-semibold mb-2">状态图</div>
        <div className="flex items-center justify-center space-x-2">
          {/* 简化的状态图 */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 
            ${stateMachineState.currentState === BATTLE_STATES.IDLE 
              ? 'bg-gray-500 border-white' 
              : 'bg-gray-700 border-gray-500'}`}>
            闲
          </div>
          <div className="text-gray-400">→</div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 
            ${stateMachineState.currentState === BATTLE_STATES.INITIALIZATION 
              ? 'bg-yellow-500 border-white' 
              : 'bg-gray-700 border-gray-500'}`}>
            初
          </div>
          <div className="text-gray-400">→</div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 
            ${stateMachineState.currentState === BATTLE_STATES.ACTIVE 
              ? 'bg-green-500 border-white' 
              : 'bg-gray-700 border-gray-500'}`}>
            战
          </div>
          <div className="text-gray-400">→</div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 
            ${stateMachineState.currentState === BATTLE_STATES.END 
              ? 'bg-red-500 border-white' 
              : 'bg-gray-700 border-gray-500'}`}>
            终
          </div>
        </div>
        
        {/* 子状态显示 */}
        {stateMachineState.currentState === BATTLE_STATES.ACTIVE && (
          <div className="mt-2 flex items-center justify-center space-x-1">
            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs border 
              ${stateMachineState.currentSubState === BATTLE_STATES.PREPARATION 
                ? 'bg-orange-400 border-white text-black' 
                : 'bg-gray-600 border-gray-400'}`}>
              准
            </div>
            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs border 
              ${stateMachineState.currentSubState === BATTLE_STATES.EXECUTION 
                ? 'bg-purple-400 border-white text-black' 
                : 'bg-gray-600 border-gray-400'}`}>
              执
            </div>
            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs border 
              ${stateMachineState.currentSubState === BATTLE_STATES.RESOLUTION 
                ? 'bg-teal-400 border-white text-black' 
                : 'bg-gray-600 border-gray-400'}`}>
              算
            </div>
          </div>
        )}
      </div>

      {/* 性能指标 */}
      <div className="text-xs text-gray-400">
        <div>状态数: {stateHistory.length}</div>
        <div>活跃: {stateMachineState.isActive ? '是' : '否'}</div>
        <div>战斗中: {stateMachineState.isInBattle ? '是' : '否'}</div>
      </div>
    </div>
  );
};

export default BattleStateMachineVisualizer; 