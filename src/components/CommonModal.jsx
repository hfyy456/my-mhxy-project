/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 03:14:12
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-16 03:14:16
 */
import React from 'react';

const CommonModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 opacity-100 pointer-events-auto transition-opacity duration-300">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto transform scale-100 transition-transform duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-dark">{title}</h3>
          <button className="text-gray-500 hover:text-gray-700 transition-colors" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default CommonModal;