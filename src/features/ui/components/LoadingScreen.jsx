/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-22 03:09:59
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-22 04:00:31
 */
import React from 'react';

const LoadingScreen = ({ progress = 0, message = "正在加载游戏资源..." }) => {
  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-50">
      {/* 顶部装饰 */}
      <div className="w-full h-8 bg-gradient-to-r from-purple-500/20 via-purple-600/20 to-purple-500/20"></div>
      
      {/* 主要内容区域 */}
      <div className="flex-grow flex flex-col items-center justify-center p-8">
        {/* 标题 */}
        <h1 className="text-3xl font-bold text-purple-400 mb-8">梦幻西游</h1>
        
        {/* 加载动画 */}
        <div className="relative w-64 h-64 mb-8">
          <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-spin-slow"></div>
          <div className="absolute inset-2 border-4 border-purple-600/40 rounded-full animate-spin-reverse-slow"></div>
          <div className="absolute inset-4 border-4 border-purple-700/50 rounded-full animate-spin-slower"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl text-purple-400">{Math.round(progress)}%</span>
          </div>
        </div>
        
        {/* 加载进度条 */}
        <div className="w-80 h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* 加载信息 */}
        <p className="text-purple-300 text-lg">{message}</p>
      </div>
      
      {/* 底部装饰 */}
      <div className="w-full h-8 bg-gradient-to-r from-purple-500/20 via-purple-600/20 to-purple-500/20"></div>
    </div>
  );
};

export default LoadingScreen; 