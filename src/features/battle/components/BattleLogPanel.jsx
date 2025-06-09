/*
 * @Author: Claude
 * @Date: 2025-01-27
 * @Description: 战斗日志面板组件 - 纯UI展示组件
 */
import React, { useRef, useEffect } from 'react';

const BattleLogPanel = ({
  // 基础数据
  battleLog = [],
  
  // 预处理的日志数据
  processedLogs = [],
  
  // 配置选项
  autoScroll = true,
  showTimestamp = true,
  showRecordCount = true,
  maxHeight = '160px',
  
  // 样式配置
  emptyStateIcon = '📝',
  emptyStateText = '战斗尚未开始...',
  
  // 回调函数
  onLogClick,
  onLogHover,
  
  // 状态
  disabled = false
}) => {
  const logContainerRef = useRef(null);
  
  // 获取要显示的日志列表，优先使用预处理的数据
  const displayLogs = processedLogs.length > 0 ? processedLogs : battleLog;
  
  // 当日志更新时，自动滚动到底部
  useEffect(() => {
    if (autoScroll && logContainerRef.current && !disabled) {
      const container = logContainerRef.current;
      const shouldScroll = container.scrollHeight > container.clientHeight;
      
      if (shouldScroll) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [displayLogs, autoScroll, disabled]);

  const handleLogClick = (log, index) => {
    if (disabled || !onLogClick) return;
    onLogClick(log, index);
  };

  const handleLogHover = (log, index, isHovering) => {
    if (disabled || !onLogHover) return;
    onLogHover(log, index, isHovering);
  };

  return (
    <div className={`w-full h-full bg-gray-900/80 rounded-lg border border-gray-700 shadow-inner overflow-hidden flex flex-col ${disabled ? 'opacity-50' : ''}`}>
      {/* 标题栏 */}
      <div className="px-3 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full bg-amber-900/50 flex items-center justify-center mr-2 border border-amber-800/50">
            <span className="text-amber-300 text-xs">📜</span>
          </div>
          <div className="text-amber-300 font-bold text-sm">战斗日志</div>
        </div>
        {showRecordCount && (
          <div className="text-xs text-gray-500">{displayLogs.length}条记录</div>
        )}
      </div>
      
      {/* 日志内容区域 */}
      <div 
        ref={logContainerRef}
        className={`overflow-y-auto p-2 text-xs space-y-1 custom-scrollbar ${disabled ? 'pointer-events-none' : ''}`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#4B5563 #1F2937',
          height: maxHeight,
          maxHeight: maxHeight
        }}
      >
        {displayLogs.length === 0 ? (
          <div className="text-gray-500 italic text-center py-4 flex flex-col items-center">
            <span className="text-2xl mb-2">{emptyStateIcon}</span>
            <span>{emptyStateText}</span>
          </div>
        ) : (
          displayLogs.map((log, index) => (
            <div 
              key={log.id || index} 
              className={`py-1.5 px-2.5 rounded transition-colors duration-200 ${
                index % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-800/30'
              } ${
                onLogClick && !disabled ? 'hover:bg-gray-700/50 cursor-pointer' : 'hover:bg-gray-700/50'
              } ${log.highlighted ? 'ring-1 ring-blue-500/50' : ''}`}
              onClick={() => handleLogClick(log, index)}
              onMouseEnter={() => handleLogHover(log, index, true)}
              onMouseLeave={() => handleLogHover(log, index, false)}
            >
              {showTimestamp && log.formattedTimestamp && (
                <span className="text-gray-500 mr-2 font-mono text-[10px]">
                  [{log.formattedTimestamp}]
                </span>
              )}
              <span 
                className={`transition-colors duration-200 ${log.styleClass || 'text-white'}`}
                title={log.tooltip}
              >
                {log.displayMessage || log.message}
              </span>
              {log.badge && (
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${log.badge.className}`}>
                  {log.badge.text}
                </span>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* 自定义滚动条样式 */}
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
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #6B7280;
        }
      `}</style>
    </div>
  );
};

export default BattleLogPanel;
