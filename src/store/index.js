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
import saveReducer from '@/store/slices/saveSlice';
import questReducer from '@/store/slices/questSlice';
import mapReducer from '@/store/slices/mapSlice';
import npcReducer from '@/store/slices/npcSlice';
import formationReducer from '@/store/slices/formationSlice';
import battleReducer from '@/store/slices/battleSlice';
import towerReducer from '@/store/slices/towerSlice';

const store = configureStore({
  reducer: {
    summons: summonReducer,
    items: itemReducer,
    inventory: inventoryReducer,
    incubator: incubatorReducer,
    petCatalog: petCatalogReducer,
    saves: saveReducer,
    quests: questReducer,
    map: mapReducer,
    npcs: npcReducer,
    formation: formationReducer,
    battle: battleReducer,
    tower: towerReducer,
  },
});

export default store; 