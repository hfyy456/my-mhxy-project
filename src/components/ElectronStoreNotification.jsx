/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-06 08:35:00
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-06 08:35:00
 */

import React, { useState, useEffect } from 'react';

const ElectronStoreNotification = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 检查是否已经显示过此通知
    const hasShownNotification = localStorage.getItem('electron_store_notification_shown');
    
    // 检查是否在Electron环境
    const isElectronEnv = window.electronAPI?.store;
    
    if (!hasShownNotification && isElectronEnv) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('electron_store_notification_shown', 'true');
    if (onClose) onClose();
  };

  const handleDontShowAgain = () => {
    localStorage.setItem('electron_store_notification_shown', 'true');
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="fas fa-info-circle text-blue-600"></i>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              存档系统升级通知
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                🎉 <strong>存档系统已升级！</strong>
              </p>
              <p>
                为了提供更好的存档体验，游戏现在使用 <strong>Electron Store</strong> 来保存您的存档数据。
              </p>
              <div className="bg-blue-50 p-3 rounded-md mt-3">
                <h4 className="font-medium text-blue-900 mb-1">主要改进：</h4>
                <ul className="text-blue-800 text-xs space-y-1">
                  <li>• 更安全的数据存储</li>
                  <li>• 更好的性能表现</li>
                  <li>• 自动备份机制</li>
                  <li>• 支持更大的存档文件</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-3 rounded-md mt-3">
                <p className="text-yellow-800 text-xs">
                  <strong>注意：</strong> 旧的localStorage存档数据将不再被使用。请重新开始游戏或使用新的存档功能。
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleDontShowAgain}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            不再显示
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElectronStoreNotification; 