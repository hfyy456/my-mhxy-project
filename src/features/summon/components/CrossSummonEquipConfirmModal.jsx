import React from 'react';
import { uiText } from '@/config/uiTextConfig';

const CrossSummonEquipConfirmModal = ({ isOpen, onConfirm, onCancel, details }) => {
  if (!isOpen || !details) return null;

  const { itemToEquip, originalSummon, targetSummon, slotType } = details;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-60 p-4">
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg shadow-xl w-full max-w-lg text-center">
        <h3 className="text-xl font-semibold text-yellow-400 mb-4">装备冲突！</h3>
        <p className="text-slate-300 mb-3">
          物品 <span className="font-semibold text-purple-400">{itemToEquip.name}</span> 当前装备于：
        </p>
        <p className="text-slate-200 font-bold text-lg mb-4">
          {originalSummon.name || originalSummon.nickname}
        </p>
        <p className="text-slate-300 mb-6">
          是否从其身上卸下，并装备给 <span className="font-semibold text-green-400">{targetSummon.name || targetSummon.nickname}</span> 的 <span className="font-semibold text-cyan-400">{uiText.equipmentSlots[slotType] || slotType}</span> 槽位？
        </p>
        <div className="flex justify-around mt-8">
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-8 rounded-md transition-colors duration-150 shadow-md"
          >
            是，卸下并装备
          </button>
          <button
            onClick={onCancel}
            className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-8 rounded-md transition-colors duration-150 shadow-md"
          >
            否，取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrossSummonEquipConfirmModal; 