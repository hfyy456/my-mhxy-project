import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  WORLD_REGIONS, 
  NODE_INTERACTION_TYPES,
  checkUnlockConditions,
  getNodeStatus,
  getAvailableInteractions
} from '@/config/map/worldMapConfig';
import { selectPlayerLevel } from '@/store/slices/playerSlice';
import CommonModal from '@/features/ui/components/CommonModal';

const RegionDetailView = ({ 
  isOpen, 
  onClose, 
  regionId, 
  onNodeInteraction,
  onBackToWorldMap 
}) => {
  const dispatch = useDispatch();
  const playerLevel = useSelector(selectPlayerLevel);
  const completedQuests = [];
  const inventory = [];
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  
  // 构建游戏状态对象
  const gameState = {
    playerLevel,
    completedQuests,
    inventory,
    unlockedRegions: [],
    completedNodes: [],
    storyProgress: 0
  };

  // 获取区域数据
  const regionData = regionId ? WORLD_REGIONS[regionId] : null;
  const nodes = regionData ? Object.values(regionData.nodes) : [];

  // 定义节点位置布局（地图样式）
  const nodePositions = {
    // 东胜神州的节点布局
    'huaguo_mountain': { x: 20, y: 70 },
    'aolai_country': { x: 60, y: 40 },
    'underwater_crystal_palace': { x: 80, y: 80 },
    
    // 西牛贺州的节点布局
    'thunder_temple': { x: 30, y: 30 },
    'flame_mountain': { x: 70, y: 60 },
    
    // 南赡部洲的节点布局
    'changan_city': { x: 50, y: 50 },
    'daughter_country': { x: 20, y: 70 },
    'lion_camel_ridge': { x: 80, y: 30 },
    
    // 北俱芦洲的节点布局
    'demon_king_palace': { x: 40, y: 40 },
    'ice_cave': { x: 70, y: 70 },
  };

  // 为节点分配位置
  const getNodePosition = (nodeId, index) => {
    if (nodePositions[nodeId]) {
      return nodePositions[nodeId];
    }
    // 如果没有预定义位置，使用默认布局
    const defaultPositions = [
      { x: 20, y: 60 }, { x: 40, y: 40 }, { x: 60, y: 70 }, { x: 80, y: 50 },
      { x: 30, y: 25 }, { x: 70, y: 25 }, { x: 25, y: 85 }, { x: 75, y: 85 }
    ];
    return defaultPositions[index % defaultPositions.length] || { x: 50, y: 50 };
  };

  // 处理节点选择
  const handleNodeSelect = useCallback((nodeId) => {
    const node = regionData?.nodes[nodeId];
    if (!node) return;
    
    const nodeStatus = getNodeStatus(regionId, nodeId, gameState);
    if (nodeStatus === 'locked' || nodeStatus === 'region_locked') {
      return; // 锁定的节点不能选择
    }
    
    setSelectedNode(nodeId);
    setSelectedInteraction(null);
  }, [regionData, regionId, gameState]);

  // 处理交互选择
  const handleInteractionSelect = useCallback((interaction) => {
    setSelectedInteraction(interaction);
  }, []);

  // 执行交互
  const handleExecuteInteraction = useCallback(async () => {
    if (!selectedNode || !selectedInteraction || !onNodeInteraction) return;
    
    try {
      const interactionData = {
        regionId,
        nodeId: selectedNode,
        interactionId: selectedInteraction.id,
        interactionType: selectedInteraction.type,
        ...selectedInteraction
      };
      
      await onNodeInteraction(interactionData);
    } catch (error) {
      console.error('执行交互失败:', error);
    }
  }, [regionId, selectedNode, selectedInteraction, onNodeInteraction]);

  // 获取节点状态样式
  const getNodeStatusColor = (nodeStatus) => {
    switch (nodeStatus) {
      case 'unlocked':
        return { bg: 'from-green-500/40 to-blue-500/40', border: 'border-green-500', shadow: 'shadow-green-500/30' };
      case 'completed':
        return { bg: 'from-blue-500/40 to-purple-500/40', border: 'border-blue-500', shadow: 'shadow-blue-500/30' };
      case 'locked':
      case 'region_locked':
        return { bg: 'from-gray-500/20 to-gray-600/20', border: 'border-gray-600', shadow: 'shadow-none' };
      default:
        return { bg: 'from-gray-500/20 to-gray-500/20', border: 'border-gray-500', shadow: 'shadow-none' };
    }
  };

  // 获取节点状态图标
  const getNodeStatusIcon = (nodeStatus, interactions) => {
    switch (nodeStatus) {
      case 'locked':
      case 'region_locked':
        return '🔒';
      case 'completed':
        return '✅';
      case 'unlocked':
        return interactions[0] ? NODE_INTERACTION_TYPES[interactions[0].type]?.icon || '📍' : '📍';
      default:
        return '❓';
    }
  };

  // 获取选中节点的数据
  const selectedNodeData = selectedNode ? regionData?.nodes[selectedNode] : null;
  const selectedNodeStatus = selectedNodeData ? getNodeStatus(regionId, selectedNode, gameState) : null;
  const availableInteractions = selectedNodeData ? getAvailableInteractions(selectedNodeData, gameState) : [];

  if (!regionData) {
    return null;
  }

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={`🗺️ ${regionData.name}`}
      maxWidthClass="max-w-7xl"
      centerContent={false}
    >
      <div className="h-[700px] bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative overflow-hidden">
        {/* 顶部导航 */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <button
            onClick={onBackToWorldMap}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/80 hover:bg-slate-600/80 rounded-lg transition-all duration-200 text-white backdrop-blur-sm"
          >
            <span>← 返回世界地图</span>
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-yellow-400">{regionData.name}</h2>
            <p className="text-gray-300 text-sm">{regionData.description}</p>
          </div>
          
          <div className="text-right text-sm text-gray-300 bg-slate-700/80 backdrop-blur-sm rounded-lg px-3 py-2">
            <div>节点: {nodes.length}</div>
            <div>等级: Lv.{playerLevel}</div>
          </div>
        </div>

        <div className="flex h-full pt-20">
          {/* 主地图区域 */}
          <div className="flex-1 relative p-6">
            <div className="h-full bg-slate-900/30 backdrop-blur-sm rounded-2xl border border-slate-600/50 relative overflow-hidden">
              {/* 地图装饰背景 */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-green-500/30 rounded-full blur-xl"></div>
                <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-blue-500/30 rounded-full blur-xl"></div>
                <div className="absolute bottom-1/4 left-1/3 w-28 h-28 bg-purple-500/30 rounded-full blur-xl"></div>
              </div>

              {/* 节点地图 */}
              <div className="relative w-full h-full">
                {/* 连接线 */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                  {nodes.map((node, index) => {
                    if (index === nodes.length - 1) return null; // 最后一个节点不画线
                    
                    const currentPos = getNodePosition(node.id, index);
                    const nextNode = nodes[index + 1];
                    const nextPos = getNodePosition(nextNode.id, index + 1);
                    
                    return (
                      <line
                        key={`line-${node.id}-${nextNode.id}`}
                        x1={`${currentPos.x}%`} y1={`${currentPos.y}%`}
                        x2={`${nextPos.x}%`} y2={`${nextPos.y}%`}
                        stroke="rgba(59, 130, 246, 0.3)"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                      />
                    );
                  })}
                  
                  {/* 额外的连接线（分支路径） */}
                  {nodes.length >= 4 && (
                    <>
                      {/* 第一个到第三个的连线 */}
                      <line
                        x1={`${getNodePosition(nodes[0].id, 0).x}%`} y1={`${getNodePosition(nodes[0].id, 0).y}%`}
                        x2={`${getNodePosition(nodes[2].id, 2).x}%`} y2={`${getNodePosition(nodes[2].id, 2).y}%`}
                        stroke="rgba(59, 130, 246, 0.2)"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />
                    </>
                  )}
                </svg>

                {/* 节点 */}
                {nodes.map((node, index) => {
                  const position = getNodePosition(node.id, index);
                  const nodeStatus = getNodeStatus(regionId, node.id, gameState);
                  const isSelected = selectedNode === node.id;
                  const isClickable = nodeStatus !== 'locked' && nodeStatus !== 'region_locked';
                  const statusColor = getNodeStatusColor(nodeStatus);

                  return (
                    <div
                      key={node.id}
                      onClick={() => isClickable && handleNodeSelect(node.id)}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                        isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'
                      }`}
                      style={{
                        left: `${position.x}%`,
                        top: `${position.y}%`,
                        zIndex: isSelected ? 20 : 10
                      }}
                    >
                      {/* 选中发光效果 */}
                      {isSelected && (
                        <div className="absolute inset-0 w-20 h-20 -m-2 bg-yellow-400/30 rounded-full animate-ping"></div>
                      )}
                      
                      {/* 节点主体 */}
                      <div className={`
                        relative w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-300
                        bg-gradient-to-br ${statusColor.bg} ${statusColor.border} ${statusColor.shadow}
                        ${isSelected ? 'scale-125 border-yellow-400 shadow-lg shadow-yellow-500/50' : 'shadow-lg'}
                        ${isClickable ? 'hover:shadow-xl' : ''}
                      `}>
                        {/* 状态图标 */}
                        <div className="text-xl">
                          {getNodeStatusIcon(nodeStatus, node.interactions)}
                        </div>
                        
                        {/* 等级要求 */}
                        {node.levelRequirement > 1 && (
                          <div className={`absolute -top-2 -left-2 text-xs px-1 py-0.5 rounded ${
                            playerLevel >= node.levelRequirement 
                              ? 'bg-green-500/80 text-white' 
                              : 'bg-red-500/80 text-white'
                          }`}>
                            {node.levelRequirement}
                          </div>
                        )}
                      </div>
                      
                      {/* 节点名称 */}
                      <div className={`
                        absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap
                        ${isClickable ? 'text-white' : 'text-gray-500'}
                      `}>
                        <div className="text-xs font-bold bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                          {node.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 地图图例 */}
              <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-600 text-xs">
                <h4 className="text-yellow-400 font-bold mb-2">节点状态</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300">可探索</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300">已完成</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-gray-300">未解锁</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 右侧交互面板 - 简洁重设计 */}
          <div className="w-80 p-4">
            <div className="h-full bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-600/50 flex flex-col">
              {selectedNodeData ? (
                <>
                  {/* 节点信息头部 - 紧凑设计 */}
                  <div className="p-4 border-b border-slate-600/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-xl">
                        {getNodeStatusIcon(selectedNodeStatus, selectedNodeData.interactions)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-yellow-400 truncate">
                          {selectedNodeData.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            selectedNodeStatus === 'unlocked' ? 'bg-green-500/20 text-green-400' :
                            selectedNodeStatus === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {selectedNodeStatus === 'unlocked' ? '可探索' :
                             selectedNodeStatus === 'completed' ? '已完成' :
                             '未解锁'}
                          </span>
                          <span className="text-gray-400">Lv.{selectedNodeData.levelRequirement}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      {selectedNodeData.description}
                    </p>
                  </div>
                  
                  {/* 交互列表 - 单一滚动区域 */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-white">可用交互</h4>
                      <span className="text-xs text-gray-400 bg-slate-700/50 px-2 py-1 rounded">
                        {availableInteractions.length}个
                      </span>
                    </div>
                    
                    {availableInteractions.length > 0 ? (
                      <div className="space-y-2">
                        {availableInteractions.map(interaction => {
                          const interactionType = NODE_INTERACTION_TYPES[interaction.type];
                          const isSelected = selectedInteraction?.id === interaction.id;
                          
                          return (
                            <div
                              key={interaction.id}
                              onClick={() => handleInteractionSelect(interaction)}
                              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-yellow-500/20 border border-yellow-400/50' 
                                  : 'bg-slate-700/30 border border-slate-600/30 hover:bg-slate-700/50'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div 
                                  className="text-lg flex-shrink-0 mt-0.5"
                                  style={{ color: interactionType?.color || '#6b7280' }}
                                >
                                  {interactionType?.icon || '❓'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h5 className="font-medium text-white text-sm truncate">
                                      {interaction.name}
                                    </h5>
                                    {isSelected && (
                                      <div className="text-yellow-400 text-xs ml-2 flex-shrink-0">
                                        ✓
                                      </div>
                                    )}
                                  </div>
                                  
                                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                                    {interaction.description}
                                  </p>
                                  
                                  <div className="flex items-center justify-between">
                                    <span 
                                      className="text-xs px-1.5 py-0.5 rounded"
                                      style={{
                                        backgroundColor: `${interactionType?.color || '#6b7280'}20`,
                                        color: interactionType?.color || '#9ca3af'
                                      }}
                                    >
                                      {interactionType?.name || '未知'}
                                    </span>
                                    
                                    {interaction.rewards && interaction.rewards.length > 0 && (
                                      <span className="text-xs text-yellow-400">
                                        💰
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <div className="text-3xl mb-2">🚫</div>
                        <div className="text-sm text-center">
                          <div className="font-medium">暂无可用交互</div>
                          <div className="text-xs mt-1">
                            {selectedNodeStatus === 'locked' || selectedNodeStatus === 'region_locked' 
                              ? '节点尚未解锁' 
                              : '条件不满足'
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 底部操作区 - 固定且紧凑 */}
                  <div className="p-4 border-t border-slate-600/30">
                    {selectedInteraction ? (
                      <button
                        onClick={handleExecuteInteraction}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                      >
                        🚀 执行 {selectedInteraction.name}
                      </button>
                    ) : (
                      <div className="text-center py-2">
                        <div className="text-gray-500 text-sm">选择一个交互来执行</div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center space-y-3">
                    <div className="text-4xl">📍</div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-white">选择探索节点</h3>
                      <p className="text-gray-400 text-sm">点击地图上的节点</p>
                      <p className="text-gray-500 text-xs">查看可用交互</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CommonModal>
  );
};

export default RegionDetailView; 