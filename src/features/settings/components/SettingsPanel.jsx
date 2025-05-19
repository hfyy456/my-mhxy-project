import React from 'react';
import SaveManager from '@/features/save/components/SaveManager';

const SettingsPanel = ({ isOpen, onClose, toasts, setToasts }) => {
  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${
        isOpen ? "opacity-100 z-[1000]" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-slate-900 rounded-lg shadow-xl w-[90%] max-w-6xl h-[90vh] overflow-auto relative">
        <div className="sticky top-0 bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-white">
            <i className="fas fa-cog mr-3 text-blue-400"></i>
            设置
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-6">
          {/* 设置选项卡 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 存档管理 */}
            <div className="col-span-1 md:col-span-2">
              <div className="bg-slate-800 rounded-lg overflow-hidden">
                <div className="p-4 bg-slate-700">
                  <h3 className="text-xl font-semibold text-white">
                    <i className="fas fa-save mr-2 text-blue-400"></i>
                    存档管理
                  </h3>
                </div>
                <div className="p-4">
                  <SaveManager toasts={toasts} setToasts={setToasts} />
                </div>
              </div>
            </div>

            {/* 其他设置选项可以在这里添加 */}
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-white mb-4">
                <i className="fas fa-volume-up mr-2 text-green-400"></i>
                音效设置
              </h3>
              <div className="space-y-4">
                <label className="flex items-center text-white">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  背景音乐
                </label>
                <label className="flex items-center text-white">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  音效
                </label>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-white mb-4">
                <i className="fas fa-palette mr-2 text-purple-400"></i>
                界面设置
              </h3>
              <div className="space-y-4">
                <label className="flex items-center text-white">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  显示技能特效
                </label>
                <label className="flex items-center text-white">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  显示伤害数字
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel; 