/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-18 01:33:00
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-20 01:13:35
 */
import { configureStore } from '@reduxjs/toolkit';
import summonReducer from '@/store/slices/summonSlice';
import itemReducer from '@/store/slices/itemSlice';
import inventoryReducer from '@/store/slices/inventorySlice';
import incubatorReducer from '@/store/slices/incubatorSlice';
import petCatalogReducer from '@/store/slices/petCatalogSlice';

const store = configureStore({
  reducer: {
    summons: summonReducer,
    items: itemReducer,
    inventory: inventoryReducer,
    incubator: incubatorReducer,
    petCatalog: petCatalogReducer,
  },
});

export default store; 