/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-18 01:33:00
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-08 04:19:23
 */
import { configureStore } from '@reduxjs/toolkit';
import incubatorReducer from '@/store/slices/incubatorSlice';
import summonCatalogReducer from '@/store/slices/summonCatalogSlice';
import questReducer from '@/store/slices/questSlice';
import mapReducer from '@/store/slices/mapSlice';
import npcReducer from '@/store/slices/npcSlice';
import dialogueReducer from '@/store/slices/dialogueSlice';
import formationReducer from '@/store/slices/formationSlice';
import battleReducer from '@/store/slices/battleSlice';
import towerReducer from '@/store/slices/towerSlice';
import playerReducer from '@/store/slices/playerSlice'; // 导入 playerReducer
import homesteadReducer from '@/store/slices/homesteadSlice'; // 导入 homesteadReducer
import enhancedHomesteadReducer from '@/store/slices/enhancedHomesteadSlice'; // 导入增强家园系统

const store = configureStore({
  reducer: {
    player: playerReducer, // 注册 playerReducer
    incubator: incubatorReducer,
    summonCatalog: summonCatalogReducer,
    quests: questReducer,
    map: mapReducer,
    npcs: npcReducer,
    dialogue: dialogueReducer,
    formation: formationReducer,
    battle: battleReducer,
    tower: towerReducer,
    homestead: homesteadReducer, // 注册 homesteadReducer
    enhancedHomestead: enhancedHomesteadReducer, // 注册增强家园系统
  },
});

export default store; 