/**
 * FormationList - 阵型列表管理组件
 * 支持阵型选择、重命名、删除、复制等操作
 */

import React, { useState, useCallback } from 'react';

const FormationList = ({
  formations,
  currentFormationId,
  onSelectFormation,
  onRenameFormation,
  onDeleteFormation,
  onDuplicateFormation
}) => {
  const [editingFormationId, setEditingFormationId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [expandedFormationId, setExpandedFormationId] = useState(null);

  // 开始编辑名称
  const startEditing = useCallback((formation) => {
    setEditingFormationId(formation.id);
    setEditingName(formation.name);
  }, []);

  // 取消编辑
  const cancelEditing = useCallback(() => {
    setEditingFormationId(null);
    setEditingName('');
  }, []);

  // 保存编辑
  const saveEditing = useCallback(() => {
    if (editingName.trim() && onRenameFormation) {
      const success = onRenameFormation(editingFormationId, editingName.trim());
      if (success) {
        setEditingFormationId(null);
        setEditingName('');
      }
    }
  }, [editingFormationId, editingName, onRenameFormation]);

  // 处理键盘事件
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      saveEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  }, [saveEditing, cancelEditing]);

  // 切换详情展开
  const toggleExpanded = useCallback((formationId) => {
    setExpandedFormationId(prev => prev === formationId ? null : formationId);
  }, []);

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // 获取阵型状态标识
  const getFormationStatusIcon = (formation) => {
    if (formation.isEmpty) return '❌';
    if (formation.summonCount >= 5) return '✅';
    if (formation.summonCount >= 3) return '⚠️';
    return '🔸';
  };

  // 获取阵型状态颜色
  const getFormationStatusColor = (formation) => {
    if (formation.isEmpty) return 'text-red-400';
    if (formation.summonCount >= 5) return 'text-green-400';
    if (formation.summonCount >= 3) return 'text-yellow-400';
    return 'text-blue-400';
  };

  if (!formations || formations.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400">
        <div className="text-4xl mb-4">📋</div>
        <div className="text-lg mb-2">暂无阵型</div>
        <div className="text-sm">创建你的第一个阵型吧</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {formations.map((formation) => {
        const isCurrentFormation = formation.id === currentFormationId;
        const isEditing = editingFormationId === formation.id;
        const isExpanded = expandedFormationId === formation.id;

        return (
          <div
            key={formation.id}
            className={`
              rounded-lg border transition-all duration-200 overflow-hidden
              ${isCurrentFormation 
                ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20' 
                : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
              }
            `}
          >
            {/* 主要信息栏 */}
            <div className="p-3">
              <div className="flex items-center justify-between">
                {/* 左侧：阵型信息 */}
                <div 
                  className="flex items-center space-x-3 flex-1 cursor-pointer"
                  onClick={() => onSelectFormation && onSelectFormation(formation.id)}
                >
                  {/* 状态指示 */}
                  <div className="flex flex-col items-center">
                    <span className="text-lg">{getFormationStatusIcon(formation)}</span>
                    <div className={`text-xs ${getFormationStatusColor(formation)}`}>
                      {formation.summonCount}/5
                    </div>
                  </div>
                  
                  {/* 阵型名称 */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={saveEditing}
                        className="w-full px-2 py-1 bg-slate-700 text-white rounded border border-slate-500 focus:border-blue-500 focus:outline-none"
                        maxLength={20}
                        autoFocus
                      />
                    ) : (
                      <div>
                        <div className={`font-medium truncate ${isCurrentFormation ? 'text-white' : 'text-slate-200'}`}>
                          {formation.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {formation.description || '无描述'}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 当前阵型标识 */}
                  {isCurrentFormation && (
                    <div className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      当前
                    </div>
                  )}
                </div>
                
                {/* 右侧：操作按钮 */}
                <div className="flex items-center space-x-1">
                  {/* 详情展开按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(formation.id);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                    title="详细信息"
                  >
                    <svg 
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* 重命名按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(formation);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                    title="重命名"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  {/* 复制按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateFormation && onDuplicateFormation(formation.id);
                    }}
                    className="p-1 text-slate-400 hover:text-green-400 transition-colors"
                    title="复制阵型"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFormation && onDeleteFormation(formation.id);
                    }}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    title="删除阵型"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* 详细信息展开区域 */}
            {isExpanded && (
              <div className="border-t border-slate-700 bg-slate-900/50 p-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400 mb-1">基本信息</div>
                    <div className="space-y-1">
                      <div className="text-slate-300">
                        召唤兽数量：<span className={getFormationStatusColor(formation)}>{formation.summonCount}/5</span>
                      </div>
                      <div className="text-slate-300">
                        状态：<span className={formation.isEmpty ? 'text-red-400' : 'text-green-400'}>
                          {formation.isEmpty ? '空阵型' : '已配置'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-slate-400 mb-1">时间信息</div>
                    <div className="space-y-1">
                      <div className="text-slate-300 text-xs">
                        创建：{formatTime(formation.createdAt)}
                      </div>
                      <div className="text-slate-300 text-xs">
                        更新：{formatTime(formation.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 阵型预览 */}
                <div className="mt-3">
                  <div className="text-slate-400 text-sm mb-2">阵型预览</div>
                  <div className="grid grid-cols-3 gap-1 w-fit">
                    {Array(9).fill(null).map((_, index) => {
                      const row = Math.floor(index / 3);
                      const col = index % 3;
                      const hasSummon = !formation.isEmpty; // 简化显示，实际应该根据具体位置判断
                      
                      return (
                        <div
                          key={index}
                          className={`
                            w-6 h-6 rounded border text-xs flex items-center justify-center
                            ${hasSummon && index < formation.summonCount 
                              ? 'bg-blue-500/30 border-blue-400 text-blue-300' 
                              : 'bg-slate-700 border-slate-600 text-slate-500'
                            }
                          `}
                        >
                          {hasSummon && index < formation.summonCount ? '●' : '○'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FormationList; 