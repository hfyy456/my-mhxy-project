import React from 'react';

const ToastContainer = ({ toasts }) => {
  return (
    <div id="toastContainer" className="fixed top-4 right-4 z-50">
      {toasts.map((toast, index) => (
        <div
          key={index}
          className={`bg-white shadow-lg rounded-lg p-4 mb-2 flex items-center space-x-2 transition-opacity duration-300 opacity-100`}
        >
          <i className={toast.iconClass}></i>
          <div>
            <p className="text-sm font-medium">{toast.message}</p>
            <p className="text-xs text-gray-500">{toast.timeString}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;