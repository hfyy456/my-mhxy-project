import React, { useState } from 'react';
import { usePlayerManager } from '@/hooks/usePlayerManager';

/**
 * 玩家设置组件
 * 管理游戏偏好、快捷键、显示选项等
 */
export const PlayerSettings = () => {
  const { resetProgress, error, clearError } = usePlayerManager();
  
  // 本地设置状态（实际应该存储在localStorage或Redux中）
  const [settings, setSettings] = useState({
    // 显示设置
    showDamageNumbers: true,
    showBattleAnimations: true,
    showGridLines: true,
    autoSaveEnabled: true,
    
    // 音效设置
    masterVolume: 80,
    soundEffects: true,
    backgroundMusic: true,
    
    // 游戏偏好
    autoSelectTarget: false,
    skipBattleAnimations: false,
    confirmActions: true,
    showTutorialTips: true,
    
    // 召唤兽显示
    showSummonPower: true,
    showSummonLevel: true,
    compactSummonView: false,
    
    // 高级设置
    debugMode: false,
    developerConsole: false
  });

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // 这里应该保存到localStorage或发送到Redux store
    localStorage.setItem('playerSettings', JSON.stringify({
      ...settings,
      [key]: value
    }));
  };

  const handleReset = () => {
    if (resetProgress()) {
      setShowResetConfirm(false);
      // 重置成功的通知
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
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

      {/* 标题 */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-100 mb-2">
          <i className="fas fa-cog text-blue-400/90 mr-3"></i>
          游戏设置
        </h2>
        <p className="text-slate-400">自定义你的游戏体验</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 显示设置 */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/60">
          <h3 className="text-xl font-semibold mb-4 text-slate-100">
            <i className="fas fa-eye text-blue-400/90 mr-2"></i>
            显示设置
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">显示伤害数字</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showDamageNumbers}
                  onChange={(e) => updateSetting('showDamageNumbers', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">战斗动画</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showBattleAnimations}
                  onChange={(e) => updateSetting('showBattleAnimations', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">显示网格线</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showGridLines}
                  onChange={(e) => updateSetting('showGridLines', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 游戏偏好 */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/60">
          <h3 className="text-xl font-semibold mb-4 text-slate-100">
            <i className="fas fa-gamepad text-purple-400/90 mr-2"></i>
            游戏偏好
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">自动选择目标</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSelectTarget}
                  onChange={(e) => updateSetting('autoSelectTarget', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">操作确认提示</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.confirmActions}
                  onChange={(e) => updateSetting('confirmActions', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">显示教程提示</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showTutorialTips}
                  onChange={(e) => updateSetting('showTutorialTips', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">自动保存</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSaveEnabled}
                  onChange={(e) => updateSetting('autoSaveEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 数据管理 */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/60 lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4 text-slate-100">
            <i className="fas fa-database text-orange-400/90 mr-2"></i>
            数据管理
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <i className="fas fa-exclamation-triangle mr-2"></i>
              重置游戏进度
            </button>
            
            <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
              <i className="fas fa-save mr-2"></i>
              手动保存
            </button>

            <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
              <i className="fas fa-cloud-download-alt mr-2"></i>
              备份数据
            </button>
          </div>
          
          {showResetConfirm && (
            <div className="mt-4 p-4 bg-red-900/50 border border-red-500/50 rounded-lg">
              <div className="text-red-200 text-sm mb-3">
                ⚠️ 警告：此操作将删除所有游戏数据，包括召唤兽、装备、等级和成就！
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 bg-red-700 hover:bg-red-800 text-white py-2 px-3 rounded text-sm"
                >
                  确认重置
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerSettings;
 