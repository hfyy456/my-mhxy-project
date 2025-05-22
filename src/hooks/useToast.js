/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 02:57:11
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-19 04:53:06
 */
import { useCallback } from 'react';
import { generateUniqueId } from '@/utils/idUtils';
import { UNIQUE_ID_PREFIXES, TOAST_TYPES } from "@/config/enumConfig";
import { TOAST_ICON_CLASSES } from "@/config/config";

export const useToast = (toasts, setToasts) => {
  const showResult = useCallback((message, type = TOAST_TYPES.INFO) => {
    if (!message) {
      console.log('[useToast] No message provided, returning');
      return;
    }
    
    const now = new Date();
    const timeString = now.toLocaleString();
    
    const iconClass = TOAST_ICON_CLASSES[type] || TOAST_ICON_CLASSES[TOAST_TYPES.INFO];

    const newToast = {
      id: generateUniqueId(UNIQUE_ID_PREFIXES.TOAST),
      message,
      iconClass,
      timeString,
      type,
      isExiting: false
    };

    setToasts(prevToasts => [...prevToasts, newToast]);
    
  }, [setToasts]);

  return {
    showResult
  };
}; 