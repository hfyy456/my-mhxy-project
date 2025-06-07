import React, { useState, useEffect } from 'react';
import { DungeonManager } from '../classes/DungeonManager.js';
import { PlayerState as DungeonPlayerState } from '../classes/DungeonManager.js';

const DungeonGameplay = ({ dungeonId, onExit, dungeonManager }) => {
  const [dungeonState, setDungeonState] = useState(null);
  const [playerState, setPlayerState] = useState(null);
  const [choices, setChoices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eventResult, setEventResult] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [pathHistory, setPathHistory] = useState([]);

  useEffect(() => {
    // 初始化并开始新副本
    if (dungeonId) {
      try {
        // 确保玩家状态存在于DungeonManager中
        if (!dungeonManager.getPlayerState('player_1')) {
          dungeonManager.playerStates.set('player_1', new DungeonPlayerState({ playerId: 'player_1' }));
        }
        dungeonManager.startDungeon(dungeonId, 'player_1');
        loadDungeonState();
      } catch (error) {
        console.error(`启动副本 ${dungeonId} 失败:`, error);
        alert(`进入副本失败: ${error.message}`);
      }
    }
  }, [dungeonId, dungeonManager]);

  const loadDungeonState = () => {
    try {
      const dungeon = dungeonManager.getPlayerDungeon('player_1');
      const player = dungeonManager.getPlayerState('player_1');
      
      if (dungeon) {
        const state = dungeon.getDungeonState();
        setDungeonState(state);
        setPlayerState(player.createSnapshot());
        setChoices(state.choices);
        setPathHistory(dungeon.getPathHistory());
      }
    } catch (error) {
      console.error('加载副本状态失败:', error);
    }
  };

  const handleChoice = async (choice) => {
    setLoading(true);
    setEventResult(null);
    
    try {
      const result = dungeonManager.makeChoice('player_1', choice);
      
      setEventResult(result.eventResult);
      setDungeonState(result.dungeonState);
      setPlayerState(result.playerState);
      setChoices(result.dungeonState.choices);
      setGameOver(result.gameOver);
      
      // 更新路径历史
      const dungeon = dungeonManager.getPlayerDungeon('player_1');
      if (dungeon) {
        setPathHistory(dungeon.getPathHistory());
      }
      
      // 检查副本是否完成
      if (result.dungeonState.isCompleted && !result.gameOver) {
        const completionResult = dungeonManager.completeDungeon('player_1');
        if (completionResult) {
          setEventResult({
            ...result.eventResult,
            completion: completionResult
          });
        }
      }
      
    } catch (error) {
      alert(`选择失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeIcon = (type) => {
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

  const getHealthBarColor = (health, maxHealth) => {
    const percentage = (health / maxHealth) * 100;
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'text-gray-600 border-gray-300',
      uncommon: 'text-green-600 border-green-300',
      rare: 'text-blue-600 border-blue-300',
      legendary: 'text-purple-600 border-purple-300'
    };
    return colors[rarity] || colors.common;
  };

  if (!dungeonState || !playerState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载副本中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      <div className="container mx-auto px-4 py-8">
        {/* 顶部信息栏 */}
        <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-bold">{dungeonState.name}</h1>
              <div className="text-sm text-gray-300">
                深度: {dungeonState.currentNode?.depth || 0} / {dungeonState.progress.maxDepth}
              </div>
            </div>
            <button
              onClick={onExit}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              退出副本
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：玩家状态 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">冒险者状态</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>生命值</span>
                  <span>{playerState.health} / {playerState.maxHealth}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getHealthBarColor(playerState.health, playerState.maxHealth)}`}
                    style={{ width: `${(playerState.health / playerState.maxHealth) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-gray-600">等级</div>
                  <div className="font-bold text-lg">{playerState.level}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-gray-600">金币</div>
                  <div className="font-bold text-lg text-yellow-600">{playerState.gold}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-gray-600">攻击</div>
                  <div className="font-bold text-lg text-red-600">{playerState.attack}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-gray-600">防御</div>
                  <div className="font-bold text-lg text-blue-600">{playerState.defense}</div>
                </div>
              </div>

              {/* 进度条 */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>探索进度</span>
                  <span>{Math.round(dungeonState.progress.progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dungeonState.progress.progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* 中间：当前事件 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              {dungeonState.currentNode?.event && (
                <>
                  <div className="text-6xl mb-4">
                    {getEventTypeIcon(dungeonState.currentNode.event.type)}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {dungeonState.currentNode.event.name}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {dungeonState.currentNode.event.description}
                  </p>
                  
                  {dungeonState.currentNode.event.rarity && (
                    <div className={`inline-block px-3 py-1 border rounded-full text-sm font-medium mb-4 ${getRarityColor(dungeonState.currentNode.event.rarity)}`}>
                      {dungeonState.currentNode.event.rarity.toUpperCase()}
                    </div>
                  )}
                </>
              )}

              {/* 选择按钮 */}
              {choices && !gameOver && !dungeonState.isCompleted && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">选择你的行动:</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {choices.canChooseLeft && choices.left && (
                      <button
                        onClick={() => handleChoice('left')}
                        disabled={loading}
                        className="group relative p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{choices.left.icon}</span>
                          <div className="text-left">
                            <div className="font-bold">{choices.left.name}</div>
                            <div className="text-sm text-blue-100">{choices.left.description}</div>
                          </div>
                        </div>
                      </button>
                    )}

                    {choices.canChooseRight && choices.right && (
                      <button
                        onClick={() => handleChoice('right')}
                        disabled={loading}
                        className="group relative p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{choices.right.icon}</span>
                          <div className="text-left">
                            <div className="font-bold">{choices.right.name}</div>
                            <div className="text-sm text-purple-100">{choices.right.description}</div>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 副本完成 */}
              {dungeonState.isCompleted && (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-green-600 mb-4">副本完成！</h3>
                  <p className="text-gray-600 mb-4">恭喜你成功完成了这个副本！</p>
                  <button
                    onClick={onExit}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    返回大厅
                  </button>
                </div>
              )}

              {/* 游戏结束 */}
              {gameOver && (
                <div className="text-center">
                  <div className="text-6xl mb-4">💀</div>
                  <h3 className="text-2xl font-bold text-red-600 mb-4">冒险结束</h3>
                  <p className="text-gray-600 mb-4">你在副本中失败了...</p>
                  <button
                    onClick={onExit}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    返回大厅
                  </button>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">处理中...</span>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：历史路径和事件结果 */}
          <div className="space-y-6">
            {/* 事件结果 */}
            {eventResult && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold mb-3 text-gray-800">事件结果</h3>
                <div className={`p-4 rounded-lg ${eventResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-medium ${eventResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {eventResult.message}
                  </p>
                  
                  {eventResult.changes && Object.keys(eventResult.changes).length > 0 && (
                    <div className="mt-3 space-y-1">
                      {Object.entries(eventResult.changes).map(([key, value]) => (
                        <div key={key} className="text-sm text-gray-600">
                          {key}: <span className={value > 0 ? 'text-green-600' : 'text-red-600'}>
                            {value > 0 ? '+' : ''}{value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {eventResult.rewards && eventResult.rewards.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">获得奖励:</div>
                      {eventResult.rewards.map((reward, index) => (
                        <div key={index} className="text-sm text-blue-600">
                          {reward.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 路径历史 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold mb-3 text-gray-800">冒险历程</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {pathHistory.length > 0 ? (
                  pathHistory.map((step, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <div className="text-xl">
                        {step.event ? getEventTypeIcon(step.event.type) : '📍'}
                      </div>
                      <div className="flex-1 text-sm">
                        <div className="font-medium">
                          {step.choiceInfo?.name || '选择'}
                        </div>
                        <div className="text-gray-600">
                          {step.event?.name || '未知事件'}
                        </div>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded ${step.choice === 'left' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {step.choice === 'left' ? '左' : '右'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">还没有开始冒险...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DungeonGameplay; 