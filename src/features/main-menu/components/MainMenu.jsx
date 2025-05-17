/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 02:54:01
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-17 02:57:07
 */
import React from 'react';

const MainMenu = ({ onOpenSummonSystem }) => {
  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center overflow-hidden">
      <div className="bg-slate-800/80 p-8 rounded-xl shadow-2xl shadow-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h1 className="text-4xl font-bold text-center text-gray-100 mb-8">
          <i className="fa-solid fa-dragon text-amber-400 mr-3"></i>
          梦幻西游模拟器
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={onOpenSummonSystem}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg p-6 shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center group"
          >
            <i className="fa-solid fa-dragon text-4xl mb-3 text-amber-400 group-hover:text-amber-300 transition-colors duration-300"></i>
            <span className="text-xl font-semibold">召唤兽系统</span>
            <p className="text-sm text-gray-300 mt-2 text-center">炼妖、打书、升级，打造你的专属召唤兽</p>
          </button>

          <button
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg p-6 shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center group opacity-50 cursor-not-allowed"
            disabled
          >
            <i className="fa-solid fa-sword text-4xl mb-3 text-blue-300 group-hover:text-blue-200 transition-colors duration-300"></i>
            <span className="text-xl font-semibold">战斗系统</span>
            <p className="text-sm text-gray-300 mt-2 text-center">即将推出</p>
          </button>

          <button
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg p-6 shadow-lg hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center group opacity-50 cursor-not-allowed"
            disabled
          >
            <i className="fa-solid fa-store text-4xl mb-3 text-green-300 group-hover:text-green-200 transition-colors duration-300"></i>
            <span className="text-xl font-semibold">交易系统</span>
            <p className="text-sm text-gray-300 mt-2 text-center">即将推出</p>
          </button>

          <button
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg p-6 shadow-lg hover:shadow-red-500/30 transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center group opacity-50 cursor-not-allowed"
            disabled
          >
            <i className="fa-solid fa-users text-4xl mb-3 text-red-300 group-hover:text-red-200 transition-colors duration-300"></i>
            <span className="text-xl font-semibold">帮派系统</span>
            <p className="text-sm text-gray-300 mt-2 text-center">即将推出</p>
          </button>
        </div>

        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>更多功能正在开发中...</p>
        </div>
      </div>
    </div>
  );
};

export default MainMenu; 