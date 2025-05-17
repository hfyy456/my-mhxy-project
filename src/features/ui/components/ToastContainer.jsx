/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 01:44:18
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-17 05:08:46
 */
import React from "react";

const ToastContainer = ({ toasts, setToasts }) => {
  // console.log("[ToastContainer] Rendering with toasts:", toasts);

  if (!toasts || toasts.length === 0) {
    // console.log("[ToastContainer] No toasts to display");
    return null;
  }

  const handleToastClick = (toastId) => {
    // 点击时添加淡出动画
    setToasts(prevToasts => 
      prevToasts.map(toast => 
        toast.id === toastId 
          ? { ...toast, isExiting: true }
          : toast
      )
    );

    // 等待动画完成后移除
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== toastId));
    }, 300);
  };

  return (
    <div
      id="toastContainer"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        pointerEvents: "none"
      }}
    >
      {toasts.map((toast) => {
        // console.log("[ToastContainer] Rendering toast:", toast);
        return (
          <div
            key={toast.id}
            onClick={() => handleToastClick(toast.id)}
            className={`bg-slate-800/85 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 
              border border-slate-600/50 pointer-events-auto cursor-pointer w-[360px] relative z-[99999]
              hover:bg-slate-700/95 hover:scale-102 transition-all duration-300
              ${toast.isExiting ? 'animate-toastExit' : 'animate-toastEnter'}`}
          >
            <i className={`${toast.iconClass} text-lg opacity-80`}></i>
            <div className="flex-1">
              <p className="m-0 text-sm font-medium opacity-90">
                {toast.message}
              </p>
              <p className="mt-0.5 text-xs text-slate-400 opacity-70">
                {toast.timeString}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer; 