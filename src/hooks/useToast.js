/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 02:57:11
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-19 04:53:06
 */
import { useCallback } from 'react';
import { generateUniqueId } from '@/utils/idUtils';

export const useToast = (toasts, setToasts) => {
  const showResult = useCallback((message, type) => {
    // console.log('[useToast] showResult called:', { message, type });
    if (!message) {
      console.log('[useToast] No message provided, returning');
      return;
    }
    
    const now = new Date();
    const timeString = now.toLocaleString();
    let iconClass;
    if (type === "success") {
      iconClass = "fa-solid fa-check-circle text-green-500";
    } else if (type === "error") {
      iconClass = "fa-solid fa-times-circle text-red-500";
    } else {
      iconClass = "fa-solid fa-info-circle text-blue-500";
    }

    const newToast = {
      id: generateUniqueId('toast'),
      message,
      iconClass,
      timeString,
      type,
      isExiting: false
    };

    // console.log('[useToast] Adding new toast:', newToast);
    // console.log('[useToast] Current toasts:', toasts);
    
    setToasts(prevToasts => {
      const newToasts = [...prevToasts, newToast];
      // console.log('[useToast] Previous toasts:', prevToasts);
      // console.log('[useToast] New toasts array:', newToasts);
      return newToasts;
    });
    
    // Removed setTimeout logic for auto-dismissal from here
  }, [setToasts]);

  return {
    showResult
  };
}; 