import { configureStore } from '@reduxjs/toolkit';
import summonReducer from '@/store/slices/summonSlice';
import itemReducer from '@/store/slices/itemSlice';
import inventoryReducer from '@/store/slices/inventorySlice';

const store = configureStore({
  reducer: {
    summons: summonReducer,
    items: itemReducer,
    inventory: inventoryReducer,
  },
});

export default store; 