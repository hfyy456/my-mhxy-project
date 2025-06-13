import React from 'react';
import { uiText } from '@/config/ui/uiTextConfig';

const CrossSummonEquipConfirmModal = ({ isOpen, onConfirm, onCancel, details }) => {
  if (!isOpen || !details) return null;

  const { itemToEquip, originalSummon, targetSummon, slotType } = details;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-theme-primary rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-theme-light">确认装备转移</h3>
          <button
            onClick={onCancel}
            className="text-theme-secondary hover:text-theme-light"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-theme-secondary mb-4">
            确定要将 {originalSummon.nickname || originalSummon.name} 的装备转移给 {targetSummon.nickname || targetSummon.name} 吗？
          </p>
          <div className="bg-theme-secondary/70 rounded-lg p-4">
            <h4 className="text-lg font-medium text-theme-light mb-2">转移详情</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-theme-secondary">源召唤兽:</span>
                <span className="text-theme-light">{originalSummon.nickname || originalSummon.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-theme-secondary">目标召唤兽:</span>
                <span className="text-theme-light">{targetSummon.nickname || targetSummon.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-theme-secondary">装备数量:</span>
                <span className="text-theme-light">{itemToEquip ? 1 : 0} 件</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-theme-secondary hover:bg-theme-light text-theme-light rounded"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-theme-primary hover:bg-theme-primary-light text-white rounded"
          >
            确认转移
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrossSummonEquipConfirmModal; 