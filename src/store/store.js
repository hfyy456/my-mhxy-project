import { configureStore } from '@reduxjs/toolkit';
import summonReducer from './slices/summonSlice';
import itemReducer from './slices/itemSlice';
import inventoryReducer from './slices/inventorySlice';
import incubatorReducer from './slices/incubatorSlice';

export const store = configureStore({
  reducer: {
    summons: summonReducer,
    items: itemReducer,
    inventory: inventoryReducer,
    incubator: incubatorReducer,
  },
});

export default store; 