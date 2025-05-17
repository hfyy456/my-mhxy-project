import { useCallback } from 'react';

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
      id: Date.now() + Math.random().toString(36).substring(2, 9),
      message,
      iconClass,
      timeString,
      type,
    };

    // console.log('[useToast] Adding new toast:', newToast);
    // console.log('[useToast] Current toasts:', toasts);
    
    setToasts(prevToasts => {
      const newToasts = [...prevToasts, newToast];
      // console.log('[useToast] Previous toasts:', prevToasts);
      // console.log('[useToast] New toasts array:', newToasts);
      return newToasts;
    });
    
    // 根据消息类型设置不同的显示时间
    const duration = type === 'error' ? 5000 : 3000;
    
    setTimeout(() => {
      setToasts(prevToasts => {
        // 添加淡出动画类
        const updatedToasts = prevToasts.map(toast => 
          toast.id === newToast.id 
            ? { ...toast, isExiting: true }
            : toast
        );
        return updatedToasts;
      });

      // 等待动画完成后再移除
      setTimeout(() => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== newToast.id));
      }, 300); // 动画持续时间
    }, duration);
  }, [setToasts]);

  return {
    showResult
  };
}; 