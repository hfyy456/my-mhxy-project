import React from 'react';
import DungeonMain from './components/DungeonMain.jsx';

/**
 * 副本系统演示页面
 * 这个组件展示了完整的副本系统功能
 */
const DungeonDemo = ({ onExit }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 页面标题 */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              🏰 副本系统演示
            </h1>
            <p className="text-gray-600 text-sm">
              基于二叉树结构的事件选择系统，参考《杀戮尖塔》的游戏机制
            </p>
          </div>
          <button
            onClick={onExit}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            返回主菜单
          </button>
        </div>
      </div>

      {/* 系统特性说明 */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">系统特性</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">🌳</div>
              <h3 className="font-medium mb-1">二叉树结构</h3>
              <p className="text-sm text-gray-600">每个节点都有两个选择分支</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-medium mb-1">面向对象设计</h3>
              <p className="text-sm text-gray-600">清晰的类继承和封装</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">⚔️</div>
              <h3 className="font-medium mb-1">多种事件类型</h3>
              <p className="text-sm text-gray-600">战斗、宝藏、休息、商人等</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-medium mb-1">进度跟踪</h3>
              <p className="text-sm text-gray-600">实时显示冒险历程</p>
            </div>
          </div>
        </div>

        {/* 操作说明 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">如何使用</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>选择一个适合你等级的副本进入</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>在每个事件中，你需要在两个选择中做出决定</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>你的选择会影响后续的事件和奖励</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>到达副本终点或生命值归零时结束冒险</span>
            </div>
          </div>
        </div>
      </div>

      {/* 副本系统主界面 */}
      <DungeonMain />
    </div>
  );
};

export default DungeonDemo; 