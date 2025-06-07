/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-22 03:09:59
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-07 00:03:58
 */
import React, { useState, useEffect } from 'react';
import MapGenerationVisualizer from './MapGenerationVisualizer';

const LoadingScreen = ({ 
  progress = 0, 
  message = "正在加载游戏资源...", 
  mapGenerationState = { isGenerating: false } 
}) => {
  const [showTips, setShowTips] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(0.5);

  // 游戏提示列表
  const gameTips = [
    "💡 提示：召唤兽的五行属性会影响技能效果",
    "⚔️ 提示：合理搭配主动技能和被动技能能大幅提升战斗力",
    "🛡️ 提示：装备的品质越高，属性加成越强",
    "🎯 提示：不同的阵型会给团队带来不同的战术优势",
    "✨ 提示：炼妖可以获得更强力的召唤兽",
    "📖 提示：学习更多技能书能解锁强大的技能组合",
    "🏰 提示：封妖塔挑战可以获得珍贵奖励",
    "💰 提示：合理管理资源是成功的关键",
    "🗺️ 提示：探索不同的地图区域会发现独特的资源和宝藏",
    "🌍 提示：每个区域都有独特的地形和遭遇机制",
    "🚪 提示：寻找传送门可以快速在不同区域间移动",
    "🎨 提示：地图是程序化生成的，每次游戏都有新发现"
  ];

  // 动态光效强度
  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity(prev => 0.3 + Math.sin(Date.now() * 0.003) * 0.4);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // 提示轮播
  useEffect(() => {
    if (progress > 20) {
      setShowTips(true);
      const tipInterval = setInterval(() => {
        setCurrentTip(prev => (prev + 1) % gameTips.length);
      }, 3000);
      return () => clearInterval(tipInterval);
    }
  }, [progress, gameTips.length]);

  // 根据进度显示不同的视觉效果
  const getProgressColor = () => {
    if (progress < 20) return 'from-blue-500 to-cyan-500';
    if (progress < 40) return 'from-cyan-500 to-green-500';
    if (progress < 55) return 'from-green-500 to-purple-500';
    if (progress < 70) return 'from-purple-500 to-pink-500';
    if (progress < 85) return 'from-pink-500 to-amber-500';
    return 'from-amber-500 to-yellow-500';
  };

  const getProgressIcon = () => {
    if (progress < 20) return 'fa-download';
    if (progress < 40) return 'fa-database';
    if (progress < 55) return 'fa-cogs';
    if (progress < 70) return 'fa-map';
    if (progress < 85) return 'fa-palette';
    return 'fa-sparkles';
  };

  // 根据加载消息显示特定的背景效果
  const isGeneratingMaps = message && (
    message.includes('生成') || 
    message.includes('地图') || 
    message.includes('世界')
  );

  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex flex-col items-center justify-center z-50 overflow-hidden">
        {/* 动态背景粒子效果 */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            >
              <div 
                className="w-1 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"
                style={{
                  boxShadow: `0 0 ${4 + Math.random() * 8}px currentColor`
                }}
              ></div>
            </div>
          ))}
        </div>

        {/* 顶部装饰光带 */}
        <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        
        {/* 主要内容区域 */}
        <div className="flex-grow flex flex-col items-center justify-center p-8 relative z-10">
          {/* 游戏LOGO */}
          <div className="mb-12 text-center">
            <div className="relative">
              <h1 
                className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent mb-4"
                style={{
                  textShadow: '0 0 30px rgba(251, 191, 36, 0.5)',
                  filter: `drop-shadow(0 0 ${20 * glowIntensity}px rgba(251, 191, 36, ${glowIntensity}))`
                }}
              >
                梦幻西游
              </h1>
              <p className="text-xl text-slate-300 font-medium tracking-wider">
                炼妖打书模拟器
              </p>
              
              {/* 装饰性元素 */}
              <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-amber-400/50 animate-pulse"></div>
              <div className="absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 border-amber-400/50 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 border-amber-400/50 animate-pulse"></div>
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-amber-400/50 animate-pulse"></div>
            </div>
          </div>

          {/* 主加载动画区域 */}
          <div className="relative mb-12">
            {/* 地图生成时的特殊效果 */}
            {isGeneratingMaps && (
              <div className="absolute inset-0 pointer-events-none">
                {/* 地图网格动画 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-8 gap-1 opacity-30">
                    {[...Array(64)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-gradient-to-br from-green-400 to-blue-400 rounded-sm"
                        style={{
                          animationDelay: `${(i * 50)}ms`,
                          animation: 'pulse 2s ease-in-out infinite'
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 外圈旋转环 */}
            <div className="relative w-48 h-48 md:w-56 md:h-56">
              <div 
                className="absolute inset-0 rounded-full animate-spin-slow"
                style={{
                  background: isGeneratingMaps 
                    ? `conic-gradient(from 0deg, transparent, rgba(34, 197, 94, 0.8), transparent)`
                    : `conic-gradient(from 0deg, transparent, rgba(147, 51, 234, 0.8), transparent)`,
                  filter: 'blur(2px)'
                }}
              ></div>
              
              {/* 中圈反向旋转 */}
              <div 
                className="absolute inset-4 rounded-full animate-reverse-spin"
                style={{
                  background: isGeneratingMaps
                    ? `conic-gradient(from 180deg, transparent, rgba(59, 130, 246, 0.6), transparent)`
                    : `conic-gradient(from 180deg, transparent, rgba(59, 130, 246, 0.6), transparent)`,
                  filter: 'blur(1px)'
                }}
              ></div>
              
              {/* 内圈慢速旋转 */}
              <div 
                className="absolute inset-8 rounded-full animate-spin-slower"
                style={{
                  background: isGeneratingMaps
                    ? `conic-gradient(from 90deg, transparent, rgba(168, 85, 247, 0.4), transparent)`
                    : `conic-gradient(from 90deg, transparent, rgba(236, 72, 153, 0.4), transparent)`,
                  filter: 'blur(0.5px)'
                }}
              ></div>
              
              {/* 中心内容 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div 
                  className={`text-5xl mb-2 bg-gradient-to-r ${getProgressColor()} bg-clip-text text-transparent`}
                  style={{
                    filter: `drop-shadow(0 0 ${15 * glowIntensity}px currentColor)`
                  }}
                >
                  <i className={`fas ${getProgressIcon()} ${isGeneratingMaps ? 'animate-pulse' : ''}`}></i>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{Math.round(progress)}%</div>
                <div className="text-sm text-slate-400">
                  {isGeneratingMaps ? '生成中' : '正在加载'}
                </div>
              </div>
            </div>
          </div>

          {/* 进度条区域 */}
          <div className="w-full max-w-md mb-8">
            <div className="relative">
              {/* 进度条背景 */}
              <div className="w-full h-3 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-slate-700/50">
                {/* 进度条填充 */}
                <div 
                  className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500 ease-out relative`}
                  style={{ width: `${progress}%` }}
                >
                  {/* 进度条光效 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
              
              {/* 进度节点 */}
              <div className="flex justify-between mt-2 px-1">
                {[0, 25, 50, 75, 100].map((milestone) => (
                  <div
                    key={milestone}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      progress >= milestone 
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-lg shadow-amber-400/50' 
                        : 'bg-slate-600'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* 加载信息 */}
          <div className="text-center mb-8">
            <p className="text-lg text-slate-300 mb-2 font-medium">{message}</p>
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>

          {/* 游戏提示 - 固定占位避免布局闪动 */}
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 max-w-md mx-auto min-h-[100px] flex items-center justify-center">
            <div className="text-center w-full">
              {showTips ? (
                <>
                  <div className="text-amber-400 text-sm font-medium mb-2 opacity-100 transition-opacity duration-500">
                    <i className="fas fa-lightbulb mr-2"></i>
                    游戏提示
                  </div>
                  <p className="text-slate-300 text-sm transition-all duration-500 opacity-100">
                    {gameTips[currentTip]}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-slate-500 text-sm font-medium mb-2 opacity-50 transition-opacity duration-500">
                    <i className="fas fa-hourglass-half mr-2 animate-spin"></i>
                    正在准备
                  </div>
                  <p className="text-slate-500 text-sm opacity-50 transition-all duration-500">
                    即将为您展示游戏提示...
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 底部装饰 */}
        <div className="absolute bottom-0 w-full h-2 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        
        {/* 版权信息 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-slate-500 text-xs">
          <p>© 2025 梦幻西游模拟器 | 正在为您准备精彩的游戏世界...</p>
        </div>

        {/* CSS动画定义 */}
        <style jsx>{`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes reverse-spin {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          @keyframes spin-slower {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }
          .animate-reverse-spin {
            animation: reverse-spin 4s linear infinite;
          }
          .animate-spin-slower {
            animation: spin-slower 8s linear infinite;
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>

      {/* 地图生成可视化器 */}
      <MapGenerationVisualizer
        isVisible={mapGenerationState.isGenerating}
        currentRegion={mapGenerationState.currentRegionName}
        totalRegions={mapGenerationState.totalRegions}
        completedRegions={mapGenerationState.completedRegions}
      />
    </>
  );
};

export default LoadingScreen; 