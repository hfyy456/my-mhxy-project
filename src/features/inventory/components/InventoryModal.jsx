/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-03 04:49:24
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-03 05:21:35
 */
/**
 * 背包系统模态框
 * 主背包系统的模态框包装器
 */
import React from 'react';
import InventorySystem from './InventorySystem';

const InventoryModal = ({ isOpen, onClose, showToast }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl max-w-7xl max-h-[95vh] w-full overflow-auto shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between border-b border-slate-300 z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎒</span>
            <h2 className="text-xl font-bold">背包系统</h2>
          </div>
          <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 flex items-center justify-center transition-colors duration-200 text-lg font-bold"
            title="关闭背包"
          >
            ×
          </button>
        </div>

        {/* 背包系统内容 */}
        <div className="p-0">
          <InventorySystem />
        </div>
      </div>
    </div>
  );
};

export default InventoryModal; 