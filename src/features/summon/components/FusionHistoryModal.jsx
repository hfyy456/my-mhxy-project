/**
 * 召唤兽合成历史模态框
 * 显示历史合成记录和统计信息
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FIVE_ELEMENTS } from '@/config/enumConfig';
import { FUSION_MATERIALS } from '../../../store/SummonFusionManager';
import summonFusionManager from '../../../store/SummonFusionManager';

const FusionHistoryModal = ({ isOpen, onClose }) => {
  const [fusionHistory, setFusionHistory] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'success', 'failed'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest'

  useEffect(() => {
    if (isOpen) {
      const history = summonFusionManager.getFusionHistory();
      setFusionHistory(history);
    }

    const handleHistoryUpdate = (newHistory) => {
      setFusionHistory(newHistory);
    };

    summonFusionManager.on('history_updated', handleHistoryUpdate);

    return () => {
      summonFusionManager.off('history_updated', handleHistoryUpdate);
    };
  }, [isOpen]);

  // 过滤和排序历史记录
  const filteredAndSortedHistory = React.useMemo(() => {
    let filtered = fusionHistory;

    // 过滤
    if (filterType === 'success') {
      filtered = filtered.filter(entry => entry.result.success);
    } else if (filterType === 'failed') {
      filtered = filtered.filter(entry => !entry.result.success);
    }

    // 排序
    if (sortBy === 'newest') {
      filtered = filtered.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortBy === 'oldest') {
      filtered = filtered.sort((a, b) => a.timestamp - b.timestamp);
    }

    return filtered;
  }, [fusionHistory, filterType, sortBy]);

  // 统计信息
  const derivedAttributes = React.useMemo(() => {
    const total = fusionHistory.length;
    const successful = fusionHistory.filter(entry => entry.result.success).length;
    const failed = total - successful;
    const successRate = total > 0 ? (successful / total * 100).toFixed(1) : 0;

    return { total, successful, failed, successRate };
  }, [fusionHistory]);

  // 格式化时间
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 获取材料显示名称
  const getMaterialName = (materialId) => {
    return FUSION_MATERIALS[materialId]?.name || materialId;
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-amber-700/30"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 标题栏 */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-xl flex items-center">
            <i className="fas fa-history mr-3"></i>
            合成历史记录
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-amber-200 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* 统计信息栏 */}
        <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{derivedAttributes.total}</div>
              <div className="text-sm text-gray-400">总合成次数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{derivedAttributes.successful}</div>
              <div className="text-sm text-gray-400">成功次数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{derivedAttributes.failed}</div>
              <div className="text-sm text-gray-400">失败次数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{derivedAttributes.successRate}%</div>
              <div className="text-sm text-gray-400">成功率</div>
            </div>
          </div>
        </div>

        {/* 过滤和排序控制 */}
        <div className="px-6 py-4 bg-slate-700/30 border-b border-slate-600">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm">过滤:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-700 text-white rounded px-3 py-1 text-sm border border-slate-600"
              >
                <option value="all">全部</option>
                <option value="success">仅成功</option>
                <option value="failed">仅失败</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-700 text-white rounded px-3 py-1 text-sm border border-slate-600"
              >
                <option value="newest">最新优先</option>
                <option value="oldest">最旧优先</option>
              </select>
            </div>

            <div className="flex-grow"></div>

            <button
              onClick={() => {
                if (confirm('确定要清除所有合成历史记录吗？此操作无法撤销。')) {
                  summonFusionManager.clearHistory();
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm"
            >
              <i className="fas fa-trash mr-2"></i>
              清除历史
            </button>
          </div>
        </div>

        {/* 历史记录列表 */}
        <div className="flex-grow overflow-y-auto p-6">
          {filteredAndSortedHistory.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <i className="fas fa-history text-4xl mb-4"></i>
              <p>暂无合成历史记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedHistory.map((entry) => (
                <div
                  key={entry.id}
                  className={`bg-slate-700/50 rounded-lg p-4 border-l-4 ${
                    entry.result.success ? 'border-green-500' : 'border-red-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        entry.result.success ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-white font-medium">
                        {entry.result.success ? '合成成功' : '合成失败'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTime(entry.timestamp)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 父母召唤兽信息 */}
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-300 mb-2">合成材料:</div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-paw text-blue-400"></i>
                          <span className="text-white">{entry.parent1.name}</span>
                          <span className="text-xs text-gray-400">Lv.{entry.parent1.level}</span>
                        </div>
                        <div className="text-gray-400">+</div>
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-paw text-blue-400"></i>
                          <span className="text-white">{entry.parent2.name}</span>
                          <span className="text-xs text-gray-400">Lv.{entry.parent2.level}</span>
                        </div>
                      </div>

                      {/* 使用的材料 */}
                      {entry.materials && entry.materials.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-400 mb-1">使用材料:</div>
                          <div className="flex flex-wrap gap-1">
                            {entry.materials.map((materialId, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-purple-600/30 text-purple-300 text-xs rounded"
                              >
                                {getMaterialName(materialId)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 结果信息 */}
                    <div>
                      {entry.result.success ? (
                        <div>
                          <div className="text-sm text-gray-300 mb-2">合成结果:</div>
                          <div className="space-y-1">
                            <div className="text-white font-medium">
                              {entry.result.newSummonName}
                            </div>
                            <div className="text-xs text-green-400">
                              <i className="fas fa-check-circle mr-1"></i>
                              合成成功
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-gray-300 mb-2">合成结果:</div>
                          <div className="text-xs text-red-400">
                            <i className="fas fa-times-circle mr-1"></i>
                            合成失败，召唤兽消失
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 消息 */}
                  {entry.result.messages && entry.result.messages.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <div className="text-xs text-gray-400 mb-1">详细信息:</div>
                      <div className="space-y-1">
                        {entry.result.messages.map((msg, index) => (
                          <div
                            key={index}
                            className={`text-xs ${
                              msg.type === 'success' ? 'text-green-400' :
                              msg.type === 'error' ? 'text-red-400' : 'text-gray-300'
                            }`}
                          >
                            {msg.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部按钮栏 */}
        <div className="bg-slate-700/50 px-6 py-4 flex justify-end border-t border-slate-600">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors font-medium"
          >
            <i className="fas fa-check mr-2"></i>
            关闭
          </button>
        </div>
      </div>
    </div>
  );

  // 使用 Portal 将模态框渲染到 document.body
  return createPortal(modalContent, document.body);
};

export default FusionHistoryModal; 