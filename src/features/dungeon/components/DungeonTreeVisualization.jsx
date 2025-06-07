import React from 'react';

const DungeonTreeVisualization = ({ dungeonTree, currentNodeId, className = '' }) => {
  if (!dungeonTree || !dungeonTree.root) {
    return (
      <div className={`text-center text-gray-500 ${className}`}>
        <p>暂无副本树数据</p>
      </div>
    );
  }

  const getEventIcon = (type) => {
    const icons = {
      battle: '⚔️',
      treasure: '💰',
      rest: '🛌',
      merchant: '🛒',
      boss: '👑',
      mystery: '❓',
      elite: '🔥',
      start: '🚪'
    };
    return icons[type] || '❓';
  };

  const getNodeStyle = (node, isCurrentNode, isVisited) => {
    let baseStyle = 'w-12 h-12 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-200 ';
    
    if (isCurrentNode) {
      baseStyle += 'bg-blue-500 text-white border-blue-600 shadow-lg scale-110 ';
    } else if (isVisited) {
      baseStyle += 'bg-green-100 text-green-700 border-green-400 ';
    } else {
      baseStyle += 'bg-gray-100 text-gray-600 border-gray-300 ';
    }
    
    return baseStyle;
  };

  const renderNode = (node, depth = 0, position = 'center') => {
    if (!node) return null;

    const isCurrentNode = node.id === currentNodeId;
    const isVisited = node.isVisited;
    const event = node.event;

    return (
      <div
        key={node.id}
        className="flex flex-col items-center"
        style={{
          marginTop: depth > 0 ? '24px' : '0',
        }}
      >
        {/* 节点 */}
        <div className="relative">
          <div
            className={getNodeStyle(node, isCurrentNode, isVisited)}
            title={event ? `${event.name} - ${event.description}` : '未知事件'}
          >
            {event ? getEventIcon(event.type) : '❓'}
          </div>
          
          {/* 当前节点标识 */}
          {isCurrentNode && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-xs">📍</span>
            </div>
          )}
        </div>

        {/* 节点信息 */}
        <div className="text-center mt-2 max-w-24">
          <div className="text-xs font-medium text-gray-700 truncate">
            {event ? event.name : '未知'}
          </div>
          <div className="text-xs text-gray-500">
            层级 {depth}
          </div>
        </div>

        {/* 子节点 */}
        {(node.leftChild || node.rightChild) && (
          <div className="relative mt-6">
            {/* 连接线 */}
            <div className="absolute top-0 left-1/2 w-px h-6 bg-gray-300 transform -translate-x-1/2 -translate-y-6"></div>
            
            <div className="flex space-x-8">
              {/* 左子节点 */}
              <div className="flex flex-col items-center">
                {node.leftChild && (
                  <>
                    {/* 左连接线 */}
                    <div className="relative">
                      <div className="absolute -top-6 left-1/2 w-6 h-6 transform -translate-x-1/2">
                        <div className="w-full h-px bg-gray-300 absolute top-0"></div>
                        <div className="w-px h-6 bg-gray-300 absolute right-0"></div>
                      </div>
                    </div>
                    
                    {/* 选择标签 */}
                    {node.leftChoice && (
                      <div className="mb-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        {node.leftChoice.icon} {node.leftChoice.name}
                      </div>
                    )}
                    
                    {renderNode(node.leftChild, depth + 1, 'left')}
                  </>
                )}
              </div>

              {/* 右子节点 */}
              <div className="flex flex-col items-center">
                {node.rightChild && (
                  <>
                    {/* 右连接线 */}
                    <div className="relative">
                      <div className="absolute -top-6 left-1/2 w-6 h-6 transform -translate-x-1/2">
                        <div className="w-full h-px bg-gray-300 absolute top-0"></div>
                        <div className="w-px h-6 bg-gray-300 absolute left-0"></div>
                      </div>
                    </div>
                    
                    {/* 选择标签 */}
                    {node.rightChoice && (
                      <div className="mb-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        {node.rightChoice.icon} {node.rightChoice.name}
                      </div>
                    )}
                    
                    {renderNode(node.rightChild, depth + 1, 'right')}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2">副本路径图</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>当前位置</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-400 rounded-full"></div>
            <span>已探索</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded-full"></div>
            <span>未探索</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-auto">
        <div className="min-w-full flex justify-center">
          {renderNode(dungeonTree.root)}
        </div>
      </div>
      
      {/* 统计信息 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="font-bold text-lg text-blue-600">
              {dungeonTree.completedNodes ? dungeonTree.completedNodes.size : 0}
            </div>
            <div className="text-gray-600">已完成节点</div>
          </div>
          <div>
            <div className="font-bold text-lg text-gray-600">
              {dungeonTree.totalNodes}
            </div>
            <div className="text-gray-600">总节点数</div>
          </div>
          <div>
            <div className="font-bold text-lg text-purple-600">
              {dungeonTree.currentNode ? dungeonTree.currentNode.depth : 0}
            </div>
            <div className="text-gray-600">当前深度</div>
          </div>
          <div>
            <div className="font-bold text-lg text-green-600">
              {Math.round((dungeonTree.completedNodes ? dungeonTree.completedNodes.size : 0) / dungeonTree.totalNodes * 100)}%
            </div>
            <div className="text-gray-600">完成度</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DungeonTreeVisualization; 