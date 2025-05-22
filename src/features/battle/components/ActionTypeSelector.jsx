/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-23 00:40:43
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-23 01:15:14
 * @FilePath: \my-mhxy-project\src\features\battle\components\ActionTypeSelector.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from 'react';
import './ActionTypeSelector.css';

const ActionTypeSelector = ({ selectedUnit, selectedAction, setSelectedAction }) => {
  if (!selectedUnit) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg border border-white/10 p-4 shadow-lg text-white font-sans flex flex-col items-center justify-center">
        <div className="text-blue-300 text-sm md:text-base mb-2">请选择一个单位</div>
        <div className="text-xs text-gray-400 text-center">点击上方状态栏中的召唤兽</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg border border-white/10 p-4 shadow-lg text-white font-sans flex flex-col">
      {/* 拼接召唤兽信息和行动类型标题 */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-600/50">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center mr-2">
            <span className="text-blue-300 text-xs">⚙️</span>
          </div>
          <div className="text-blue-300 font-bold">选择行动类型</div>
        </div>
      </div>
      
      {/* 召唤兽信息区域 */}
      <div className="mb-3 bg-gray-700/30 rounded-lg p-2 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-700/50 flex items-center justify-center mr-2">
            <span className="text-amber-300 text-xs">🐲</span>
          </div>
          <div>
            <div className="text-amber-300 text-sm font-medium">{selectedUnit.name}</div>
            <div className="text-xs text-gray-300">HP: {selectedUnit.currentHP}/{selectedUnit.maxHP} | MP: {selectedUnit.currentMP}/{selectedUnit.maxMP}</div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
        <button 
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-800 shadow-md ${selectedAction === 'attack' ? 'bg-gradient-to-r from-red-700 to-red-600 text-white ring-red-500' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200 ring-gray-500'}`}
          onClick={() => setSelectedAction('attack')}
        >
          <div className="flex items-center">
            <span className="mr-2">⚔️</span>
            <span>攻击</span>
          </div>
        </button>
        
        <button 
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-800 shadow-md ${selectedAction === 'defend' ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white ring-blue-500' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200 ring-gray-500'}`}
          onClick={() => setSelectedAction('defend')}
        >
          <div className="flex items-center">
            <span className="mr-2">🛡️</span>
            <span>防御</span>
          </div>
        </button>
        
        <button 
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-800 shadow-md ${selectedAction === 'skill' ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white ring-purple-500' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200 ring-gray-500'}`}
          onClick={() => setSelectedAction('skill')}
        >
          <div className="flex items-center">
            <span className="mr-2">✨</span>
            <span>技能</span>
          </div>
        </button>
        
        <button 
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-800 shadow-md ${selectedAction === 'item' ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white ring-amber-500' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200 ring-gray-500'}`}
          onClick={() => setSelectedAction('item')}
        >
          <div className="flex items-center">
            <span className="mr-2">🎒</span>
            <span>背包</span>
          </div>
        </button>
        
        <button 
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-800 shadow-md ${selectedAction === 'escape' ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white ring-gray-400' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200 ring-gray-500'}`}
          onClick={() => setSelectedAction('escape')}
        >
          <div className="flex items-center">
            <span className="mr-2">💨</span>
            <span>逃跑</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ActionTypeSelector;
