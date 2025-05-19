import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { resetSummonState } from '@/store/slices/summonSlice';
import { resetItemsState } from '@/store/slices/itemSlice';
import { resetInventory } from '@/store/slices/inventorySlice';
import SaveManager from '@/features/save/components/SaveManager';
import SettingsPanel from '@/features/settings/components/SettingsPanel';

const HomePage = ({ onStartGame, toasts, setToasts }) => {
  const dispatch = useDispatch();
  const [showLoadGame, setShowLoadGame] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleNewGame = () => {
    // 重置所有游戏状态
    dispatch(resetSummonState());
    dispatch(resetItemsState());
    dispatch(resetInventory());
    onStartGame();
  };

  const handleExitGame = () => {
    // 在浏览器环境中，我们可以关闭窗口
    window.close();
    // 如果window.close()不起作用（大多数现代浏览器会阻止），显示一条提示消息
    alert('请直接关闭浏览器窗口来退出游戏');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center">
      <div className="max-w-4xl w-full p-8">
        {/* 游戏标题 */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600 mb-4">
            梦幻西游模拟器
          </h1>
          <p className="text-gray-400 text-lg">
            体验不一样的梦幻人生
          </p>
        </div>

        {/* 主菜单按钮 */}
        <div className="space-y-4 max-w-md mx-auto">
          <button
            onClick={handleNewGame}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 
              text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-amber-500/30 
              transition-all duration-300 transform hover:scale-105"
          >
            <i className="fas fa-play mr-3"></i>
            新游戏
          </button>

          <button
            onClick={() => setShowLoadGame(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 
              text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-blue-500/30 
              transition-all duration-300 transform hover:scale-105"
          >
            <i className="fas fa-folder-open mr-3"></i>
            加载游戏
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 
              text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-purple-500/30 
              transition-all duration-300 transform hover:scale-105"
          >
            <i className="fas fa-cog mr-3"></i>
            设置
          </button>

          <button
            onClick={handleExitGame}
            className="w-full bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 
              text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-red-500/30 
              transition-all duration-300 transform hover:scale-105"
          >
            <i className="fas fa-power-off mr-3"></i>
            退出游戏
          </button>
        </div>

        {/* 版权信息 */}
        <div className="text-center mt-16 text-gray-500">
          <p>© 2025 梦幻西游模拟器 保留所有权利</p>
        </div>

        {/* 加载游戏面板 */}
        {showLoadGame && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-[90%] max-w-4xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">
                  <i className="fas fa-folder-open mr-3 text-blue-400"></i>
                  加载游戏
                </h2>
                <button
                  onClick={() => setShowLoadGame(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <SaveManager toasts={toasts} setToasts={setToasts} onLoadSuccess={onStartGame} />
            </div>
          </div>
        )}

        {/* 设置面板 */}
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          toasts={toasts}
          setToasts={setToasts}
        />
      </div>
    </div>
  );
};

export default HomePage; 