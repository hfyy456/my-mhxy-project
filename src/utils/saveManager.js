/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-20 03:18:11
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-20 04:13:12
 */
import store from '@/store';
import { createSave, setCurrentSaveId } from '@/store/slices/saveSlice';

// 获取需要保存的游戏状态
const getGameState = () => {
  const state = store.getState();
  return {
    summons: state.summons,
    items: state.items,
    inventory: state.inventory,
    incubator: state.incubator,
    petCatalog: state.petCatalog,
  };
};

// 创建新的存档
export const createNewSave = (description = '') => {
  const gameState = getGameState();
  const saveId = Date.now().toString();
  
  try {
    // 保存到 Redux store
    store.dispatch(createSave({
      id: saveId,
      data: gameState,
      description,
    }));

    // 同时保存到 localStorage
    const saves = JSON.parse(localStorage.getItem('mhxy_saves') || '{}');
    saves[saveId] = {
      data: gameState,
      description,
      timestamp: Date.now(),
    };
    localStorage.setItem('mhxy_saves', JSON.stringify(saves));

    return true;
  } catch (error) {
    console.error('保存游戏失败:', error);
    return false;
  }
};

// 从 localStorage 加载存档
export const loadSavesFromStorage = () => {
  try {
    const saves = JSON.parse(localStorage.getItem('mhxy_saves') || '{}');
    return saves;
  } catch (error) {
    console.error('加载存档失败:', error);
    return {};
  }
};

// 加载指定的存档
export const loadSave = (saveId) => {
  try {
    const saves = loadSavesFromStorage();
    const save = saves[saveId];
    
    if (!save) {
      throw new Error('存档不存在');
    }

    // 恢复游戏状态
    const { data } = save;
    
    // 按特定顺序恢复状态，以确保依赖关系正确
    const loadOrder = [
      'items',      // 先加载物品 (改回复数 items)
      'summons',    // 然后是召唤兽，因为它们可能装备了物品
      'inventory',  // 接着是背包，因为它引用了物品
      'incubator',  // 培养皿系统
      'petCatalog', // 宠物图鉴
    ];

    // 按顺序加载每个状态
    loadOrder.forEach(sliceName => {
      if (data[sliceName]) {
        // 特殊处理 inventory 状态
        if (sliceName === 'inventory') {
          // 先重置背包状态
          store.dispatch({ type: 'inventory/resetInventory' });
          
          // 直接恢复完整的背包状态，包括所有槽位信息
          store.dispatch({ 
            type: 'inventory/setState', 
            payload: {
              ...data[sliceName],
              // 确保所有必要的字段都存在
              slots: data[sliceName].slots || {},
              capacity: data[sliceName].capacity || 20,
              gold: data[sliceName].gold || 0,
              loading: false,
              error: null
            }
          });

          console.log('[saveManager] Restored inventory state:', data[sliceName]);
        } else {
          // 其他状态正常恢复
          store.dispatch({
            type: `${sliceName}/setState`,
            payload: data[sliceName],
          });
          console.log(`[saveManager] Restored state for ${sliceName}:`, data[sliceName]);
        }
      } else {
        console.warn(`[saveManager] No data found for ${sliceName} in save file`);
      }
    });

    // 更新当前存档ID
    store.dispatch(setCurrentSaveId(saveId));

    // 更新 localStorage 中的存档时间
    saves[saveId].timestamp = Date.now();
    localStorage.setItem('mhxy_saves', JSON.stringify(saves));

    return true;
  } catch (error) {
    console.error('加载存档失败:', error);
    return false;
  }
};

// 删除指定的存档
export const deleteSave = (saveId) => {
  try {
    // 从 localStorage 中删除
    const saves = loadSavesFromStorage();
    delete saves[saveId];
    localStorage.setItem('mhxy_saves', JSON.stringify(saves));

    // 从 Redux store 中删除
    store.dispatch({
      type: 'save/deleteSave',
      payload: saveId,
    });

    return true;
  } catch (error) {
    console.error('删除存档失败:', error);
    return false;
  }
}; 