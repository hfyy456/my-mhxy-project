import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  WORLD_REGIONS, 
  checkUnlockConditions
} from '@/config/map/worldMapConfig';
import { usePlayerManager } from '@/hooks/usePlayerManager';
import CommonModal from '@/features/ui/components/CommonModal';

const WorldMapSelector = ({ isOpen, onClose, onRegionSelect }) => {
  const dispatch = useDispatch();
  const { player } = usePlayerManager();
  const playerLevel = player.level;
  const completedQuests = []; // 临时数据
  const inventory = []; // 临时数据
  
  const [selectedRegion, setSelectedRegion] = useState(null);
  
  // 构建游戏状态对象用于检查解锁条件
  const gameState = {
    playerLevel,
    completedQuests,
    inventory,
    unlockedRegions: [], 
    completedNodes: [], 
    storyProgress: 0 
  };

  // 处理区域选择 - 允许查看未解锁区域的基本信息
  const handleRegionSelect = useCallback((regionId) => {
    setSelectedRegion(regionId);
  }, []);

  // 获取当前选中区域的信息
  const selectedRegionData = selectedRegion ? WORLD_REGIONS[selectedRegion] : null;
  const selectedRegionUnlocked = selectedRegionData ? 
    checkUnlockConditions(selectedRegionData.unlockConditions, gameState) && 
    playerLevel >= selectedRegionData.levelRequirement : false;

  // 处理进入区域 - 只有解锁后才能进入
  const handleEnterRegion = useCallback(() => {
    if (selectedRegion && selectedRegionUnlocked && onRegionSelect) {
      onRegionSelect(selectedRegion);
    }
  }, [selectedRegion, selectedRegionUnlocked, onRegionSelect]);

  // 定义区域位置布局（按照配置文件中的四大部洲）
  const regionPositions = {
    'dongsheng_region': { x: 75, y: 25, size: 'large' },      // 东胜神州 - 右上
    'xiniu_region': { x: 25, y: 25, size: 'large' },          // 西牛贺州 - 左上  
    'nanzhan_region': { x: 50, y: 65, size: 'large' },        // 南赡部洲 - 中下（起始区域）
    'beijulu_region': { x: 50, y: 15, size: 'medium' },       // 北俱芦洲 - 中上
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title="🌍 梦幻世界地图"
      maxWidthClass="max-w-7xl"
      centerContent={false}
    >
      <div className="h-[700px] bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-900 relative overflow-hidden">
        {/* 地图背景装饰 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-green-500/30 rounded-full blur-xl"></div>
          <div className="absolute top-20 right-20 w-40 h-40 bg-blue-500/30 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-purple-500/30 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-28 h-28 bg-yellow-500/30 rounded-full blur-xl"></div>
        </div>

        <div className="flex h-full">
          {/* 主地图区域 */}
          <div className="flex-1 relative p-8">
            <div className="h-full bg-slate-900/30 backdrop-blur-sm rounded-2xl border border-slate-600/50 relative overflow-hidden">
              {/* 地图标题 */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                <h2 className="text-2xl font-bold text-yellow-400 text-center">
                  🗺️ 探索世界
                </h2>
                <p className="text-gray-300 text-sm text-center mt-1">选择想要探索的区域</p>
              </div>

              {/* 区域节点 */}
              {Object.values(WORLD_REGIONS).map(region => {
                const position = regionPositions[region.id] || { x: 50, y: 50, size: 'medium' };
                const isUnlocked = checkUnlockConditions(region.unlockConditions, gameState) && 
                                  playerLevel >= region.levelRequirement;
                const isSelected = selectedRegion === region.id;
                
                // 根据尺寸确定节点大小
                const sizeClasses = {
                  small: 'w-16 h-16',
                  medium: 'w-20 h-20', 
                  large: 'w-24 h-24'
                };

                return (
                  <div
                    key={region.id}
                    onClick={() => handleRegionSelect(region.id)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${sizeClasses[position.size]}`}
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                    }}
                  >
                    {/* 区域发光效果 */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-yellow-400/30 rounded-full animate-ping"></div>
                    )}
                    
                    {/* 主要区域节点 */}
                    <div className={`
                      relative w-full h-full rounded-full border-4 flex items-center justify-center transition-all duration-300 transform hover:scale-110
                      ${isSelected 
                        ? 'border-yellow-400 bg-gradient-to-br from-yellow-500/40 to-orange-500/40 shadow-lg shadow-yellow-500/50 scale-110' 
                        : isUnlocked 
                          ? 'border-green-500 bg-gradient-to-br from-green-500/30 to-blue-500/30 hover:shadow-lg hover:shadow-green-500/30'
                          : 'border-gray-600 bg-gradient-to-br from-gray-500/20 to-gray-600/20 opacity-60 cursor-not-allowed'
                      }
                    `}>
                      {/* 状态图标 */}
                      <div className="text-2xl">
                        {isUnlocked ? '🏰' : '🔒'}
                      </div>
                      
                      {/* 区域名称 */}
                      <div className={`
                        absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap
                        ${isUnlocked ? 'text-white' : 'text-gray-500'}
                      `}>
                        <div className="text-sm font-bold">{region.name}</div>
                        <div className="text-xs">Lv.{region.levelRequirement}</div>
                      </div>
                      
                      {/* 解锁状态指示器 */}
                      <div className="absolute -top-2 -right-2">
                        {isUnlocked ? (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                            <span className="text-white text-xs">🔒</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 连接线 - 按照西游记路径 */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                {/* 南赡部洲 -> 东胜神州 */}
                <line
                  x1="50%" y1="65%"
                  x2="75%" y2="25%"
                  stroke="rgba(59, 130, 246, 0.4)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                {/* 南赡部洲 -> 西牛贺州 */}
                <line
                  x1="50%" y1="65%"
                  x2="25%" y2="25%"
                  stroke="rgba(59, 130, 246, 0.4)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                {/* 南赡部洲 -> 北俱芦洲 */}
                <line
                  x1="50%" y1="65%"
                  x2="50%" y2="15%"
                  stroke="rgba(59, 130, 246, 0.4)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                {/* 东胜神州 -> 北俱芦洲 */}
                <line
                  x1="75%" y1="25%"
                  x2="50%" y2="15%"
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                {/* 西牛贺州 -> 北俱芦洲 */}
                <line
                  x1="25%" y1="25%"
                  x2="50%" y2="15%"
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              </svg>
            </div>

            {/* 地图图例 */}
            <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-600">
              <h4 className="text-yellow-400 text-sm font-bold mb-2">四大部洲</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full border border-green-400"></div>
                  <span className="text-gray-300">已解锁区域</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-500 rounded-full border border-gray-400"></div>
                  <span className="text-gray-300">未解锁区域</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-300"></div>
                  <span className="text-gray-300">当前选中</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 右侧信息面板 - 简洁重设计 */}
          <div className="w-80 p-4">
            <div className="h-full bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-600/50 flex flex-col">
              {selectedRegionData ? (
                <>
                  {/* 区域信息头部 - 紧凑设计 */}
                  <div className="p-4 border-b border-slate-600/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-xl">🏰</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-yellow-400 truncate">
                          {selectedRegionData.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            selectedRegionUnlocked ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {selectedRegionUnlocked ? '已解锁' : '未解锁'}
                          </span>
                          <span className="text-gray-400">Lv.{selectedRegionData.levelRequirement}</span>
                          <span className="text-gray-400">{Object.keys(selectedRegionData.nodes).length}节点</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      {selectedRegionData.description}
                    </p>
                  </div>
                  
                  {/* 节点列表 - 单一滚动区域 */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-white">探索节点</h4>
                      <span className="text-xs text-gray-400 bg-slate-700/50 px-2 py-1 rounded">
                        {Object.keys(selectedRegionData.nodes).length}个
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {Object.values(selectedRegionData.nodes).map(node => (
                        <div key={node.id} className={`rounded-lg p-3 border ${
                          selectedRegionUnlocked 
                            ? 'bg-slate-700/30 border-slate-600/30' 
                            : 'bg-slate-700/20 border-slate-600/20 opacity-75'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className={`text-sm font-medium truncate ${
                              selectedRegionUnlocked ? 'text-white' : 'text-gray-300'
                            }`}>
                              {selectedRegionUnlocked ? node.name : '???'}
                            </h5>
                            <span className="text-xs text-gray-400 bg-slate-600 px-1.5 py-0.5 rounded flex-shrink-0 ml-2">
                              Lv.{node.levelRequirement}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                            {selectedRegionUnlocked ? node.description : '未知的神秘区域，需要解锁后才能了解详情...'}
                          </p>
                          
                          {selectedRegionUnlocked ? (
                            <div className="flex flex-wrap gap-1">
                              {node.interactions.slice(0, 2).map((interaction, idx) => (
                                <span 
                                  key={idx}
                                  className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded"
                                >
                                  {interaction.name}
                                </span>
                              ))}
                              {node.interactions.length > 2 && (
                                <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                                  +{node.interactions.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs px-1.5 py-0.5 bg-gray-500/30 text-gray-400 rounded">
                                🔒 未知内容
                              </span>
                              <span className="text-xs px-1.5 py-0.5 bg-gray-500/30 text-gray-400 rounded">
                                神秘功能
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* 底部操作区 - 固定且紧凑 */}
                  <div className="p-4 border-t border-slate-600/30">
                    <button
                      onClick={handleEnterRegion}
                      disabled={!selectedRegionUnlocked}
                      className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 text-sm ${
                        selectedRegionUnlocked
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white'
                          : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {selectedRegionUnlocked ? `🚀 进入 ${selectedRegionData.name}` : '🔒 暂未解锁'}
                    </button>
                    
                    {!selectedRegionUnlocked && (
                      <div className="mt-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                        <h5 className="text-xs font-bold text-yellow-400 mb-2">🔓 解锁条件</h5>
                        <div className="space-y-1 text-xs text-gray-400">
                          <div className={`flex items-center gap-2 ${
                            playerLevel >= selectedRegionData.levelRequirement ? 'text-green-400' : 'text-red-400'
                          }`}>
                            <span>{playerLevel >= selectedRegionData.levelRequirement ? '✓' : '✗'}</span>
                            <span>等级达到 Lv.{selectedRegionData.levelRequirement}</span>
                          </div>
                          {selectedRegionData.unlockConditions && selectedRegionData.unlockConditions.length > 0 && (
                            selectedRegionData.unlockConditions.map((condition, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-gray-400">
                                <span>•</span>
                                <span>
                                  {condition.type === 'quest' ? `完成任务: ${condition.questId}` :
                                   condition.type === 'item' ? `持有道具: ${condition.itemId} x${condition.amount}` :
                                   condition.type === 'level' ? `等级要求: Lv.${condition.value}` :
                                   condition.type === 'region' ? `解锁区域: ${condition.regionId}` :
                                   condition.type === 'story' ? `剧情进度: ${condition.storyId}` :
                                   '其他条件'}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center space-y-3">
                    <div className="text-4xl">🗺️</div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-white">探索四大部洲</h3>
                      <p className="text-gray-400 text-sm">点击地图上的区域节点</p>
                      <p className="text-gray-500 text-xs">查看详细信息和探索内容</p>
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

export default WorldMapSelector; 