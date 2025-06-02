// src/store/slices/homesteadSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { HOMESTEAD_GENERAL_CONFIG, BUILDINGS } from '@/config/config'; // 导入配置

const initialState = {
  plots: [], // 例如: [{ plotId: 0, buildingId: null, level: 0 }, ...]
  buildings: {}, // 例如: { 'uniqueBuildingInstanceId1': { buildingId: 'lumber_mill_1', level: 1, plotId: 0, startedAt: null, completesAt: null } }
  resources: { // 初始化资源，可以从 HOMESTEAD_RESOURCES 动态生成
    // gold will be initialized from HOMESTEAD_GENERAL_CONFIG.INITIAL_FUNDS if available
  },
  homesteadLevel: 1,
  homesteadExp: 0,
  maxPlots: HOMESTEAD_GENERAL_CONFIG.INITIAL_PLOTS, // 当前最大地块数量
  activeTimers: [], // { id: 'timerId', type: 'build', buildingInstanceId: '...', completesAt: timestamp }
};

// Helper function to initialize plots based on maxPlots
const initializePlots = (count) => {
  const plots = [];
  for (let i = 0; i < count; i++) {
    plots.push({ plotId: i, buildingId: null, buildingInstanceId: null, level: 0 });
  }
  return plots;
};

initialState.plots = initializePlots(initialState.maxPlots);

// Initialize resources from config
Object.keys(HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES).forEach(resourceKey => {
  const resourceConfig = HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES[resourceKey];
  initialState.resources[resourceConfig.id] = 0; // Default to 0
});
// Set initial gold if defined
if (HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES.GOLD && HOMESTEAD_GENERAL_CONFIG.INITIAL_FUNDS !== undefined) {
    initialState.resources[HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES.GOLD.id] = HOMESTEAD_GENERAL_CONFIG.INITIAL_FUNDS;
} else if (HOMESTEAD_GENERAL_CONFIG.INITIAL_FUNDS !== undefined) {
    // Fallback if GOLD is not in HOMESTEAD_RESOURCES but INITIAL_FUNDS is present (e.g. 'gold' key directly)
    initialState.resources['gold'] = HOMESTEAD_GENERAL_CONFIG.INITIAL_FUNDS;
}


const homesteadSlice = createSlice({
  name: 'homestead',
  initialState,
  reducers: {
    // --- 地块与建筑管理 ---
    startBuildingConstruction: (state, action) => {
      const { plotId, buildingId } = action.payload;
      const buildingConfig = BUILDINGS[buildingId];
      if (!buildingConfig) {
        console.error(`Building config not found for ${buildingId}`);
        return;
      }
      const targetPlot = state.plots.find(p => p.plotId === plotId);
      if (!targetPlot || targetPlot.buildingId) {
        console.error(`Plot ${plotId} is not available or already occupied.`);
        return;
      }

      // 检查资源是否足够 (level 1 cost)
      const cost = buildingConfig.levels[0].buildCost;
      let canAfford = true;
      cost.forEach(c => {
        if (state.resources[c.resource] < c.amount) {
          canAfford = false;
        }
      });

      if (!canAfford) {
        console.error('Not enough resources to build.');
        // TODO: Dispatch a notification to UI
        return;
      }

      // 扣除资源
      cost.forEach(c => {
        state.resources[c.resource] -= c.amount;
      });

      // 创建建筑实例
      const buildingInstanceId = `building_${Date.now()}_${plotId}`; // 简易唯一ID
      const buildTimeSeconds = buildingConfig.levels[0].buildTimeSeconds;
      const completesAt = Date.now() + buildTimeSeconds * 1000;

      state.buildings[buildingInstanceId] = {
        buildingId,
        level: 0, // 0 表示正在建造中，完成后变为 1
        plotId,
        startedAt: Date.now(),
        completesAt,
      };
      targetPlot.buildingId = buildingId; // 标记地块被占用
      targetPlot.buildingInstanceId = buildingInstanceId;
      
      // 添加到计时器
      state.activeTimers.push({
        id: `timer_${buildingInstanceId}`,
        type: 'CONSTRUCTION',
        buildingInstanceId,
        completesAt,
      });
      console.log(`Started construction of ${buildingId} on plot ${plotId}. Will complete at ${new Date(completesAt)}`);
    },
    completeBuildingConstruction: (state, action) => {
      const { buildingInstanceId } = action.payload;
      const building = state.buildings[buildingInstanceId];
      if (!building || building.level !== 0) {
        console.error(`Building ${buildingInstanceId} not found or not under construction.`);
        return;
      }
      building.level = 1; // 建造完成，设为1级
      building.startedAt = null;
      building.completesAt = null;
      // 移除计时器
      state.activeTimers = state.activeTimers.filter(timer => timer.buildingInstanceId !== buildingInstanceId || timer.type !== 'CONSTRUCTION');
      console.log(`Building ${building.buildingId} (Instance: ${buildingInstanceId}) construction completed. Now level 1.`);
      // TODO: 可能需要触发建筑的初始生产或效果
    },
    // TODO: startBuildingUpgrade, completeBuildingUpgrade
    // TODO: demolishBuilding

    // --- 资源管理 ---
    addResource: (state, action) => {
      const { resourceId, amount } = action.payload;
      if (state.resources[resourceId] !== undefined) {
        state.resources[resourceId] += amount;
      }
    },
    spendResource: (state, action) => {
      const { resourceId, amount } = action.payload;
      if (state.resources[resourceId] !== undefined && state.resources[resourceId] >= amount) {
        state.resources[resourceId] -= amount;
        // return true; // Cannot return value from reducer
      } else {
        // console.error(`Not enough ${resourceId} to spend.`);
        // return false;
      }
    },

    // --- 计时器管理 ---
    removeTimer: (state, action) => {
        const { timerId } = action.payload;
        state.activeTimers = state.activeTimers.filter(timer => timer.id !== timerId);
    },
    
    // --- 家园等级与地块 ---
    // TODO: addHomesteadExp, levelUpHomestead
    // TODO: expandPlot (增加 maxPlots 并初始化新地块)

    // --- 用于从保存数据加载 ---
    setHomesteadState: (state, action) => {
      // Be careful with deep merging if needed, for now a shallow merge of top-level keys
      const newState = { ...state, ...action.payload };
      // Ensure plots are re-initialized if maxPlots changes during load
      if (action.payload.maxPlots && action.payload.maxPlots !== state.maxPlots) {
        newState.plots = initializePlots(action.payload.maxPlots);
        // If plots data is also in payload, merge it carefully
        if (action.payload.plots) {
            action.payload.plots.forEach(loadedPlot => {
                const existingPlot = newState.plots.find(p => p.plotId === loadedPlot.plotId);
                if (existingPlot) {
                    Object.assign(existingPlot, loadedPlot);
                }
            });
        }
      }
      return newState;
    }
  },
});

export const {
  startBuildingConstruction,
  completeBuildingConstruction,
  addResource,
  spendResource,
  removeTimer,
  setHomesteadState,
} = homesteadSlice.actions;

// Selectors
export const selectHomesteadPlots = (state) => state.homestead.plots;
export const selectHomesteadBuildings = (state) => state.homestead.buildings;
export const selectHomesteadResources = (state) => state.homestead.resources;
export const selectHomesteadLevel = (state) => state.homestead.homesteadLevel;
export const selectHomesteadExp = (state) => state.homestead.homesteadExp;
export const selectActiveHomesteadTimers = (state) => state.homestead.activeTimers;
export const selectPlotById = (plotId) => (state) => state.homestead.plots.find(p => p.plotId === plotId);
export const selectBuildingInstanceById = (instanceId) => (state) => state.homestead.buildings[instanceId];


export default homesteadSlice.reducer;
