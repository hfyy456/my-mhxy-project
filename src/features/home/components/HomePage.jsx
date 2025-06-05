/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-22 04:01:49
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-06 07:45:00
 */
import React, { useState, useEffect } from 'react';
import SaveManager from '@/features/save/components/SaveManager';
import { useToast } from "@/hooks/useToast";

const HomePage = ({ onStartGame, onOpenSettings }) => {
  const [showLoadGame, setShowLoadGame] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [glowIntensity, setGlowIntensity] = useState(0.5);
  const { showResult } = useToast(toasts, setToasts);

  // 动态光效强度
  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity(prev => 0.3 + Math.sin(Date.now() * 0.002) * 0.4);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleNewGame = () => {
    showResult('欢迎来到梦幻西游！', 'success');
    onStartGame();
  };

  const handleExitGame = () => {
    if (window.electronAPI && window.electronAPI.window) {
      window.electronAPI.window.close();
    } else {
      window.close();
    }
  };

  const menuItems = [
    {
      id: 'new-game',
      label: '新游戏',
      icon: 'fa-play',
      description: '开始全新的冒险之旅',
      color: 'from-amber-500 to-amber-700',
      hoverColor: 'from-amber-600 to-amber-800',
      shadowColor: 'shadow-amber-500/30',
      action: handleNewGame
    },
    {
      id: 'load-game',
      label: '加载游戏',
      icon: 'fa-folder-open',
      description: '继续之前的冒险',
      color: 'from-blue-500 to-blue-700',
      hoverColor: 'from-blue-600 to-blue-800',
      shadowColor: 'shadow-blue-500/30',
      action: () => setShowLoadGame(true)
    },
    {
      id: 'settings',
      label: '游戏设置',
      icon: 'fa-cog',
      description: '调整游戏选项和偏好',
      color: 'from-purple-500 to-purple-700',
      hoverColor: 'from-purple-600 to-purple-800',
      shadowColor: 'shadow-purple-500/30',
      action: onOpenSettings
    },
    {
      id: 'exit',
      label: '退出游戏',
      icon: 'fa-power-off',
      description: '离开游戏世界',
      color: 'from-red-500 to-red-700',
      hoverColor: 'from-red-600 to-red-800',
      shadowColor: 'shadow-red-500/30',
      action: handleExitGame
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center overflow-hidden relative">
      {/* 动态背景粒子效果 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          >
            <div 
              className="w-1 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"
              style={{
                boxShadow: `0 0 ${6 + Math.random() * 12}px currentColor`
              }}
            ></div>
          </div>
        ))}
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-6xl w-full p-8 relative z-10">
        {/* 游戏标题区域 */}
        <div className="text-center mb-16">
          <div className="relative inline-block">
            {/* 主标题 */}
            <h1 
              className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent mb-6"
              style={{
                textShadow: '0 0 50px rgba(251, 191, 36, 0.5)',
                filter: `drop-shadow(0 0 ${30 * glowIntensity}px rgba(251, 191, 36, ${glowIntensity}))`
              }}
            >
              梦幻西游
            </h1>

            {/* 副标题 */}
            <div className="relative">
              <p className="text-2xl md:text-3xl text-slate-300 font-medium tracking-widest mb-4">
                炼妖打书模拟器
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto rounded-full"></div>
            </div>

            {/* 装饰性元素 */}
            <div className="absolute -top-8 -left-8 w-16 h-16 border-t-4 border-l-4 border-amber-400/30 rounded-tl-lg animate-pulse"></div>
            <div className="absolute -top-8 -right-8 w-16 h-16 border-t-4 border-r-4 border-amber-400/30 rounded-tr-lg animate-pulse"></div>
            <div className="absolute -bottom-8 -left-8 w-16 h-16 border-b-4 border-l-4 border-amber-400/30 rounded-bl-lg animate-pulse"></div>
            <div className="absolute -bottom-8 -right-8 w-16 h-16 border-b-4 border-r-4 border-amber-400/30 rounded-br-lg animate-pulse"></div>
          </div>

          {/* 欢迎文字 */}
          <p className="text-slate-400 text-lg md:text-xl mt-8 font-light">
            体验不一样的梦幻人生，在这里书写属于你的传奇故事
          </p>
        </div>

        {/* 主菜单区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={item.action}
              onMouseEnter={() => setHoveredButton(item.id)}
              onMouseLeave={() => setHoveredButton(null)}
              className={`group relative bg-gradient-to-r ${
                hoveredButton === item.id ? item.hoverColor : item.color
              } text-white font-bold py-6 px-8 rounded-2xl shadow-2xl ${item.shadowColor} 
              transition-all duration-500 transform hover:scale-105 hover:-translate-y-2
              border border-white/10 backdrop-blur-sm overflow-hidden`}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              {/* 按钮背景光效 */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 
                            transform -skew-x-12 -translate-x-full group-hover:translate-x-full 
                            transition-transform duration-1000"></div>
              
              {/* 按钮内容 */}
              <div className="relative z-10 flex items-center justify-center gap-4">
                <div className="flex flex-col items-center md:flex-row md:justify-start w-full">
                  {/* 图标区域 */}
                  <div className="mb-3 md:mb-0 md:mr-4">
                    <div className="w-16 h-16 md:w-12 md:h-12 flex items-center justify-center 
                                  bg-white/20 rounded-xl backdrop-blur-sm
                                  group-hover:bg-white/30 transition-all duration-300
                                  group-hover:scale-110 group-hover:rotate-6">
                      <i className={`fas ${item.icon} text-2xl md:text-xl text-white 
                                   group-hover:text-yellow-200 transition-colors duration-300`}></i>
                    </div>
                  </div>
                  
                  {/* 文字区域 */}
                  <div className="text-center md:text-left flex-1">
                    <div className="text-xl md:text-2xl font-bold mb-1 
                                  group-hover:text-yellow-200 transition-colors duration-300">
                      {item.label}
                    </div>
                    <div className="text-sm md:text-base text-white/80 font-normal 
                                  group-hover:text-white transition-colors duration-300">
                      {item.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* 按钮边框动画 */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent 
                            group-hover:border-white/30 transition-colors duration-300"></div>
            </button>
          ))}
        </div>

        {/* 底部信息区域 */}
        <div className="text-center mt-16 space-y-4">
          {/* 版本信息 */}
          <div className="flex items-center justify-center gap-6 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <i className="fas fa-code-branch"></i>
              <span>版本 1.0.0</span>
            </div>
            <div className="w-1 h-4 bg-slate-600 rounded-full"></div>
            <div className="flex items-center gap-2">
              <i className="fas fa-calendar-alt"></i>
              <span>2025年最新版</span>
            </div>
            <div className="w-1 h-4 bg-slate-600 rounded-full"></div>
            <div className="flex items-center gap-2">
              <i className="fas fa-users"></i>
              <span>单机版</span>
            </div>
          </div>

          {/* 版权信息 */}
          <div className="text-slate-600 text-xs">
            <p>© 2025 梦幻西游模拟器 保留所有权利</p>
            <p className="mt-1">本游戏仅供学习交流使用，请支持正版游戏</p>
          </div>
        </div>
      </div>

      {/* 加载游戏面板 */}
      {showLoadGame && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            {/* 面板头部 */}
            <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg">
                  <i className="fas fa-folder-open text-2xl text-white"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">加载游戏</h2>
                  <p className="text-sm text-slate-400">选择一个存档继续您的冒险</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoadGame(false)}
                className="group p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-300"
              >
                <i className="fas fa-times text-xl group-hover:rotate-90 transition-transform duration-300"></i>
              </button>
            </div>

            {/* 面板内容 */}
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <SaveManager 
                toasts={toasts} 
                setToasts={setToasts} 
                onLoadSuccess={onStartGame} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast消息 */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-300 ${
              toast.type === 'success' 
                ? 'bg-emerald-600/90 border-emerald-500 text-white' 
                : toast.type === 'error'
                ? 'bg-red-600/90 border-red-500 text-white'
                : 'bg-amber-600/90 border-amber-500 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <i className={`fas ${
                toast.type === 'success' ? 'fa-check-circle' 
                : toast.type === 'error' ? 'fa-exclamation-circle'
                : 'fa-info-circle'
              }`}></i>
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage; 