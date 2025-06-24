import { useContext } from 'react';
import { ModalContext } from '@/context/ModalContext';

/**
 * useModal - 一个自定义Hook，用于轻松访问模态框控制函数
 * 必须在 ModalProvider 的子组件中使用。
 * 
 * @returns {{open: function, close: function}}
 */
export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}; 