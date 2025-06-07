import React, { useState, useEffect } from 'react';
import { DungeonManager } from '../classes/DungeonManager.js';

const DungeonEntrance = ({ onEnterDungeon, dungeonManager }) => {
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 获取可用副本模板
    const templates = dungeonManager.getAvailableTemplates(playerLevel);
    setAvailableTemplates(templates);
  }, [dungeonManager, playerLevel]);

  const handleStartDungeon = (templateId) => {
    if (onEnterDungeon) {
      onEnterDungeon(templateId);
    }
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty <= 2) return 'text-green-600 bg-green-100';
    if (difficulty <= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getDifficultyText = (difficulty) => {
    if (difficulty <= 2) return '简单';
    if (difficulty <= 4) return '中等';
    return '困难';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
          <h1 className="text-3xl font-bold mb-2">副本大厅</h1>
          <p className="text-purple-100">选择一个副本开始你的冒险之旅</p>
        </div>

        <div className="p-6">
          {/* 玩家信息 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">冒险者信息</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">等级:</span>
                <span className="font-bold text-blue-600">{playerLevel}</span>
              </div>
              <button
                onClick={() => setPlayerLevel(prev => Math.min(prev + 1, 20))}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                升级测试
              </button>
            </div>
          </div>

          {/* 副本列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {template.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(template.difficulty)}`}
                    >
                      {getDifficultyText(template.difficulty)}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    {template.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">需要等级:</span>
                      <span className="font-medium">{template.levelRequirement}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">最大深度:</span>
                      <span className="font-medium">{template.maxDepth}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">难度等级:</span>
                      <span className="font-medium">{template.difficulty}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartDungeon(template.id)}
                    disabled={loading || playerLevel < template.levelRequirement}
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
                      playerLevel >= template.levelRequirement
                        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {loading ? '进入中...' : playerLevel >= template.levelRequirement ? '进入副本' : '等级不足'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {availableTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏰</div>
              <h3 className="text-xl font-medium text-gray-500 mb-2">暂无可用副本</h3>
              <p className="text-gray-400">提升等级解锁更多副本</p>
            </div>
          )}
        </div>
      </div>

      {/* 副本详情模态框 */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{selectedTemplate.name}</h3>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">需要等级:</span>
                <span className="font-medium">{selectedTemplate.levelRequirement}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">难度等级:</span>
                <span className="font-medium">{selectedTemplate.difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">最大深度:</span>
                <span className="font-medium">{selectedTemplate.maxDepth}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  handleStartDungeon(selectedTemplate.id);
                  setSelectedTemplate(null);
                }}
                disabled={loading || playerLevel < selectedTemplate.levelRequirement}
                className={`flex-1 py-2 px-4 rounded-md font-medium ${
                  playerLevel >= selectedTemplate.levelRequirement
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                进入副本
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DungeonEntrance; 