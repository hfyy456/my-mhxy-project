/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 03:14:12
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-23 01:00:00
 */
import React, { useEffect, useRef } from 'react';

const CommonModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = "",
  style = {},
  contentStyle = {},
  maxWidthClass = "max-w-4xl",
  centerContent = false,
  fullScreen = false,
  hideCloseButton = false,
  padding = "px-6 pt-6 pb-4"
}) => {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Handle Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle click outside
  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };
  
  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      const previouslyFocusedElement = document.activeElement;
      closeButtonRef.current.focus();
      
      // Cleanup function to return focus
      return () => {
        if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
          previouslyFocusedElement.focus();
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 bg-slate-900/70 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      onClick={handleOverlayClick} 
    >
      <div 
        ref={modalRef} 
        className={`bg-slate-800 rounded-xl transform transition-all duration-300 border border-slate-600 shadow-2xl shadow-purple-500/30 flex flex-col overflow-hidden ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'} ${fullScreen ? 'w-full h-full max-w-none m-0 rounded-none' : `mx-4 ${className || `w-full ${maxWidthClass}`}`}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={style}
      >
        {/* Fixed Header */}
        {title && (
          <div className={`flex justify-between items-center ${padding} border-b border-slate-700`}>
            <h3 id="modal-title" className="text-xl font-bold text-purple-300">{title}</h3>
            {!hideCloseButton && (
              <button 
                ref={closeButtonRef} 
                className="text-gray-400 hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-md p-1"
                onClick={onClose}
                aria-label="Close modal"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            )}
          </div>
        )}
        {/* Content Area */}
        <div 
          className={`flex-grow ${centerContent ? 'flex items-center justify-center' : 'overflow-y-auto'}`}
          style={contentStyle}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default CommonModal; 