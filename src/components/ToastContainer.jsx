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
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== toastId));
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
            style={{
              backgroundColor: "rgba(30, 41, 59, 0.85)",
              color: "white",
              padding: "12px 20px",
              borderRadius: "6px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              border: "1px solid rgba(51, 65, 85, 0.5)",
              pointerEvents: "auto",
              position: "relative",
              zIndex: 99999,
              width: "360px",
              cursor: "pointer",
              animation: "toastFadeIn 0.3s ease-out",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.95)";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.85)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <i className={`${toast.iconClass} text-lg opacity-80`}></i>
            <div style={{ flex: 1 }}>
              <p style={{ 
                margin: 0, 
                fontSize: "14px", 
                fontWeight: 500,
                opacity: 0.9
              }}>
                {toast.message}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "11px",
                  color: "#94a3b8",
                  opacity: 0.7
                }}
              >
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
