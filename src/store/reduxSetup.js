/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-18 01:36:41
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-04 05:09:19
 */
/**
 * 此文件负责设置和初始化整个Redux状态管理系统与现有系统的集成
 * 注意：背包和物品系统已迁移到面向对象的InventoryManager
 * 召唤兽系统也已迁移到面向对象的SummonManager
 */
import store from '@/store';

// 设置自定义钩子以便在React组件中使用Redux
import { useSelector, useDispatch } from 'react-redux';
// 已移除：召唤兽系统已迁移到OOP SummonManager
// 已移除：背包和物品相关的selectors已迁移到InventoryManager
// import { selectAllItemsArray, selectItemById, selectEquippedItemsWithSummonInfo } from '@/store/slices/itemSlice';
// import { selectInventorySlots, selectInventoryCapacity, selectGold } from '@/store/slices/inventorySlice';

// 全局标志，防止循环引用
let isIntegratedWithTraditionalSystem = false;

// 初始化Redux集成（现在主要用于游戏状态管理）
export const initializeReduxIntegration = () => {
  console.log("[Redux] 初始化 Redux...");
  
  // 防止重复初始化和循环引用
  if (isIntegratedWithTraditionalSystem) {
    console.log("[Redux] 已经初始化过，跳过");
    return () => {};
  }
  
  isIntegratedWithTraditionalSystem = true;
  
  console.log("[Redux] Redux 初始化完成! 召唤兽系统使用SummonManager，背包系统使用InventoryManager");
  
  // 返回清理函数（如果需要在组件卸载时调用）
  return () => {
    console.log("[Redux] 清理集成...");
    isIntegratedWithTraditionalSystem = false;
  };
};

// 已移除：召唤兽相关的自定义钩子，现在使用OOP SummonManager
// 请使用 src/hooks/useSummonManager.js 中的hooks

// 已移除：物品和背包相关的hooks，现在使用InventoryManager的hooks
// 请使用 src/hooks/useInventoryManager.js 中的hooks：
// - useInventoryManager() 
// - useInventoryActions()
// - useInventoryStats()
// - useItemOperations()
// 等等

// 导出Redux store
export default store; 