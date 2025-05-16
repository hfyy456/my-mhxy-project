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
      <div className="max-w-md w-full mx-auto text-center">
        <p className="text-gray-300 mb-6 text-base">
          当前召唤兽技能已满。是否替换一个技能？
        </p>
        <div className="flex justify-end gap-4 mt-8">
          <button
            className="px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-700 hover:text-gray-100 text-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
            onClick={onCancel}
          >
            否
          </button>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 border border-purple-700 hover:border-purple-400 shadow-md hover:shadow-lg shadow-purple-500/30"
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
