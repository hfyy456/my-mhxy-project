/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 03:14:12
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-17 03:56:34
 */
import React, { useEffect, useRef } from 'react';

const CommonModal = ({ isOpen, onClose, title, children }) => {
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
        className={`bg-slate-800 rounded-xl max-w-4xl w-full mx-4 max-h-[80vh] transform transition-all duration-300 border border-slate-600 shadow-2xl shadow-purple-500/30 flex flex-col overflow-hidden ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Fixed Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-slate-700">
          <h3 id="modal-title" className="text-xl font-bold text-purple-300">{title}</h3>
          <button 
            ref={closeButtonRef} 
            className="text-gray-400 hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-md p-1"
            onClick={onClose}
            aria-label="Close modal"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        {/* Scrollable Content Area */}
        <div className="overflow-y-auto px-6 pb-6 pt-4 flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CommonModal; 