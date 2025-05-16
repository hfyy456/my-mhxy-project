import { useCallback } from 'react';

export const useToast = (toasts, setToasts, gameManager) => {
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
      id: Date.now() + Math.random().toString(36).substring(2, 9),
      message,
      iconClass,
      timeString,
    };

    // console.log('[useToast] Adding new toast:', newToast);
    // console.log('[useToast] Current toasts:', toasts);
    
    setToasts(prevToasts => {
      const newToasts = [...prevToasts, newToast];
      // console.log('[useToast] Previous toasts:', prevToasts);
      // console.log('[useToast] New toasts array:', newToasts);
      return newToasts;
    });
    
    if (gameManager) {
      gameManager.addResultRecord(message);
    }

    setTimeout(() => {
      setToasts(prevToasts => {
        const filteredToasts = prevToasts.filter(toast => toast.id !== newToast.id);
        // console.log('[useToast] Removing toast, remaining toasts:', filteredToasts);
        return filteredToasts;
      });
    }, 3000);
  }, [toasts, setToasts, gameManager]);

  return {
    showResult
  };
}; 