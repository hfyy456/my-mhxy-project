/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 01:44:14
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-16 03:19:07
 */
import React from "react";
import CommonModal from "./CommonModal";

const ConfirmDialog = ({ isOpen, onConfirm, onCancel }) => {
  return (
    <CommonModal isOpen={isOpen} onClose={onCancel} title="技能替换确认">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 transform scale-100 transition-transform duration-300">
        <h3 className="text-xl font-bold text-dark mb-4">技能替换确认</h3>
        <p className="text-gray-600 mb-6">
          当前召唤兽技能已满。是否替换一个技能？
        </p>
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
    </CommonModal>
  );
};

export default ConfirmDialog;
