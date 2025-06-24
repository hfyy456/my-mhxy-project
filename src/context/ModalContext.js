import { createContext } from 'react';

/**
 * ModalContext - 提供一个全局共享的模态框控制接口
 * 
 * @property {function} open - 打开一个模态框的函数
 * @property {function} close - 关闭最上层模态框的函数
 */
export const ModalContext = createContext({
  open: () => console.warn('ModalProvider not found'),
  close: () => console.warn('ModalProvider not found'),
}); 