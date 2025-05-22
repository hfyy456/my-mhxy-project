/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-18 01:36:41
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-22 18:29:42
 */
/**
 * 此文件负责设置和初始化整个Redux状态管理系统与现有系统的集成
 */
import store from '@/store';

// 设置自定义钩子以便在React组件中使用Redux
import { useSelector, useDispatch } from 'react-redux';
import { selectAllSummons, selectCurrentSummonFullData, selectSummonById } from '@/store/slices/summonSlice';
import { selectAllItemsArray, selectItemById, selectEquippedItemsWithSummonInfo } from '@/store/slices/itemSlice';
import { selectInventorySlots, selectInventoryCapacity, selectGold } from '@/store/slices/inventorySlice';

// 全局标志，防止循环引用
let isIntegratedWithTraditionalSystem = false;

// 初始化所有Redux与传统系统的集成
export const initializeReduxIntegration = (inventoryInstance) => {
  console.log("[Redux] 初始化 Redux...");
  
  // 防止重复初始化和循环引用
  if (isIntegratedWithTraditionalSystem) {
    console.log("[Redux] 已经初始化过，跳过");
    return () => {};
  }
  
  isIntegratedWithTraditionalSystem = true;
  
  // 此处不再需要适配器相关的设置
  
  console.log("[Redux] Redux 初始化完成! 现在应用将主要使用Redux来管理状态");
  
  // 返回清理函数（如果需要在组件卸载时调用）
  return () => {
    console.log("[Redux] 清理集成...");
    isIntegratedWithTraditionalSystem = false;
    // 如果需要清理，可以在这里添加取消订阅等逻辑
  };
};

// 召唤兽相关的自定义钩子
export const useSummons = () => {
  return useSelector(selectAllSummons);
};

export const useCurrentSummon = () => {
  return useSelector(selectCurrentSummonFullData);
};

export const useSummonById = (summonId) => {
  return useSelector(state => selectSummonById(state, summonId));
};

// 物品相关的自定义钩子
export const useItems = () => {
  return useSelector(selectAllItemsArray);
};

export const useItemById = (itemId) => {
  return useSelector(state => selectItemById(state, itemId));
};

export const useEquippedItems = () => {
  return useSelector(selectEquippedItemsWithSummonInfo);
};

// 背包相关的自定义钩子
export const useInventory = () => {
  const slots = useSelector(selectInventorySlots);
  const capacity = useSelector(selectInventoryCapacity);
  const gold = useSelector(selectGold);
  
  return { slots, capacity, gold };
};

// 导出Redux store
export default store; 