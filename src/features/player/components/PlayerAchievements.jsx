import React, { useState } from 'react';
import { usePlayerAchievements } from '@/hooks/usePlayerManager';
import { achievementConfig } from '@/config/character/playerConfig';

/**
 * 玩家成就详细组件
 */
export const PlayerAchievements = () => {
  const { 
    unlocked, 
    total, 
    unlockedCount, 
    progress, 
    byType, 
    available, 
    unlockAchievement,
    error,
    clearError 
  } = usePlayerAchievements();

  const [selectedCategory, setSelectedCategory] = useState('all');

  // 成就类型映射
  const categoryNames = {
    all: '全部成就',
    level: '等级成就',
    refinement: '炼妖成就',
    skillBook: '打书成就',
    equipment: '装备成就'
  };

  // 成就类型图标
  const categoryIcons = {
    all: 'fas fa-trophy',
    level: 'fas fa-star',
    refinement: 'fas fa-magic',
    skillBook: 'fas fa-book',
    equipment: 'fas fa-shield-alt'
  };

  // 获取成就颜色
  const getAchievementColor = (achievement) => {
    const isUnlocked = unlocked.some(a => a.id === achievement.id);
    const isAvailable = available.some(a => a.id === achievement.id);
    
    if (isUnlocked) return 'border-yellow-500 bg-yellow-900/30';
    if (isAvailable) return 'border-green-500 bg-green-900/30';
    return 'border-gray-600 bg-gray-900/30';
  };

  // 获取成就状态文本
  const getAchievementStatus = (achievement) => {
    const isUnlocked = unlocked.some(a => a.id === achievement.id);
    const isAvailable = available.some(a => a.id === achievement.id);
    
    if (isUnlocked) return { text: '已解锁', color: 'text-yellow-400' };
    if (isAvailable) return { text: '可解锁', color: 'text-green-400' };
    return { text: '未解锁', color: 'text-gray-400' };
  };

  // 过滤成就
  const filteredAchievements = selectedCategory === 'all' 
    ? achievementConfig.list 
    : (byType[selectedCategory] || []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 错误提示 */}
      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-500/50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <i className="fas fa-exclamation-triangle text-red-400 mr-2"></i>
            <span className="text-red-100">{error}</span>
          </div>
          <button onClick={clearError} className="text-red-400 hover:text-red-300">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* 标题和总体进度 */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-100 mb-2">
          <i className="fas fa-trophy text-yellow-400/90 mr-3"></i>
          成就系统
        </h2>
        <p className="text-slate-400 mb-4">展示你的游戏成就和进度</p>
        
        {/* 总体进度条 */}
        <div className="bg-slate-800/90 rounded-xl p-6 border border-slate-700/60 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300">总进度</span>
            <span className="text-yellow-400 font-bold">{unlockedCount}/{total}</span>
          </div>
          <div className="relative w-full h-3 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-slate-400">
            完成度: {progress.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 成就分类标签 */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {Object.entries(categoryNames).map(([key, name]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedCategory === key
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <i className={`${categoryIcons[key]} mr-2`}></i>
            {name}
            {key !== 'all' && (
              <span className="ml-2 px-2 py-1 bg-slate-600 rounded-full text-xs">
                {byType[key]?.length || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 可解锁成就提示 */}
      {available.length > 0 && selectedCategory === 'all' && (
        <div className="mb-6 bg-green-900/30 border border-green-500/50 rounded-lg p-4">
          <div className="flex items-center">
            <i className="fas fa-star text-green-400 mr-3"></i>
            <div>
              <div className="text-green-300 font-medium">
                有 {available.length} 个成就可以解锁！
              </div>
              <div className="text-sm text-green-200">
                完成相应条件即可获得奖励
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 成就网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map(achievement => {
          const isUnlocked = unlocked.some(a => a.id === achievement.id);
          const isAvailable = available.some(a => a.id === achievement.id);
          const status = getAchievementStatus(achievement);
          const colorClass = getAchievementColor(achievement);

          return (
            <div
              key={achievement.id}
              className={`bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-2 ${colorClass} transition-all duration-300 hover:scale-105`}
            >
              {/* 成就图标和状态 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isUnlocked ? 'bg-yellow-500' : isAvailable ? 'bg-green-500' : 'bg-gray-600'
                  }`}>
                    <i className={`${categoryIcons[achievement.type]} text-white text-lg`}></i>
                  </div>
                  <div className="ml-3">
                    <div className="text-slate-100 font-semibold">{achievement.title}</div>
                    <div className={`text-sm ${status.color}`}>{status.text}</div>
                  </div>
                </div>
                
                {isUnlocked && (
                  <div className="text-yellow-400">
                    <i className="fas fa-check-circle text-2xl"></i>
                  </div>
                )}
              </div>

              {/* 成就描述 */}
              <div className="text-slate-300 text-sm mb-4">
                {achievement.description}
              </div>

              {/* 进度条 */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>进度</span>
                  <span>{Math.min(achievement.requirement, achievement.requirement)}/{achievement.requirement}</span>
                </div>
                <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnlocked ? 'bg-yellow-500' : isAvailable ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                    style={{ 
                      width: `${isUnlocked ? 100 : isAvailable ? 90 : Math.min(70, (achievement.requirement * 0.7))}%` 
                    }}
                  />
                </div>
              </div>

              {/* 奖励信息 */}
              {achievement.reward && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">奖励</div>
                  <div className="flex items-center">
                    {achievement.reward.experience && (
                      <div className="flex items-center text-yellow-400 text-sm">
                        <i className="fas fa-star mr-1"></i>
                        {achievement.reward.experience} 经验
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 解锁按钮（仅可解锁成就显示） */}
              {isAvailable && (
                <button
                  onClick={() => unlockAchievement(achievement.id)}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                >
                  <i className="fas fa-unlock mr-2"></i>
                  立即解锁
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 空状态 */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-search text-4xl text-slate-500 mb-4"></i>
          <div className="text-slate-400">该分类下暂无成就</div>
        </div>
      )}
    </div>
  );
};

export default PlayerAchievements; 