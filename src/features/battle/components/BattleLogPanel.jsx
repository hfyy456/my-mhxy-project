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
    <div className={`w-full h-full bg-theme-dark/80 rounded-lg border border-dreamyPurple-400/30 shadow-inner overflow-hidden flex flex-col ${disabled ? 'opacity-50' : ''}`}>
      {/* 标题栏 */}
      <div className="px-3 py-2 bg-dreamyPurple-400/30 border-b border-dreamyPurple-400/20 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full bg-dreamyPurple-300/50 flex items-center justify-center mr-2 border border-dreamyPurple-200/50">
            <span className="text-dreamyPurple-100 text-xs">📜</span>
          </div>
          <div className="text-dreamyPurple-100 font-bold text-sm">战斗日志</div>
        </div>
        {showRecordCount && (
          <div className="text-xs text-gray-400">{displayLogs.length}条记录</div>
        )}
      </div>
      
      {/* 日志内容区域 */}
      <div 
        ref={logContainerRef}
        className={`overflow-y-auto p-2 text-xs space-y-1 custom-scrollbar ${disabled ? 'pointer-events-none' : ''}`}
        style={{
          scrollbarWidth: 'thin',
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
                index % 2 === 0 ? 'bg-dreamyPurple-400/10' : 'bg-dreamyPurple-400/5'
              } ${
                onLogClick && !disabled ? 'hover:bg-dreamyPurple-300/20 cursor-pointer' : 'hover:bg-dreamyPurple-300/10'
              } ${log.highlighted ? 'ring-1 ring-dreamyPurple-200/50' : ''}`}
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
          background: var(--color-dark);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--color-primary);
          opacity: 0.5;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: var(--color-primary);
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default BattleLogPanel;
