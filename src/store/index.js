/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-18 01:33:00
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-08 04:19:23
 */
import { configureStore } from '@reduxjs/toolkit';
import incubatorReducer from '@/store/slices/incubatorSlice';
import questReducer from '@/store/slices/questSlice';
import mapReducer from '@/store/slices/mapSlice';
import npcReducer from '@/store/slices/npcSlice';
import dialogueReducer from '@/store/slices/dialogueSlice';
import formationReducer from '@/store/slices/formationSlice';
import battleReducer from '@/store/slices/battleSliceSimplified';
import towerReducer from '@/store/slices/towerSlice';

const store = configureStore({
  reducer: {
    incubator: incubatorReducer,
    quests: questReducer,
    map: mapReducer,
    npcs: npcReducer,
    dialogue: dialogueReducer,
    formation: formationReducer,
    battle: battleReducer,
    tower: towerReducer,
  },
});

export default store; 