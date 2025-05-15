import React from 'react';

const ConfirmDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 opacity-100 pointer-events-auto transition-opacity duration-300">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 transform scale-100 transition-transform duration-300">
        <h3 className="text-xl font-bold text-dark mb-4">技能替换确认</h3>
        <p className="text-gray-600 mb-6">当前召唤兽技能已满。是否替换一个技能？</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={onCancel}
          >
            否
          </button>
          <button
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            onClick={onConfirm}
          >
            是
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;