/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-21 03:41:01
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-21 04:24:04
 */
import React from 'react';

const Modal = ({ isOpen, onClose, title, children, maxWidthClass = 'max-w-lg' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-slate-800 p-6 rounded-lg shadow-xl w-full relative flex flex-col ${maxWidthClass}`}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-xl font-semibold text-slate-100">{title || '提示'}</h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="text-slate-300 overflow-y-auto flex-grow min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 