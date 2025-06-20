import { createSlice } from '@reduxjs/toolkit';
import { HOMESTEAD_GENERAL_CONFIG } from '@/config/homestead/homesteadConfig';
import { ENHANCED_BUILDINGS, UNLOCK_TYPES } from '@/config/homestead/enhancedBuildingConfig';

const GRID_SIZE_X = 12; // 12x10网格
const GRID_SIZE_Y = 10;
const INITIAL_PLOTS = GRID_SIZE_X * GRID_SIZE_Y; // 120个地块

// Helper function to initialize plots
const initializePlots = (count) => {
  const plots = [];
  for (let i = 0; i < count; i++) {
    plots.push({ 
      plotId: i, 
      buildingId: null, 
      buildingInstanceId: null, 
      isOccupied: false, // 是否被多格建筑占用
      occupiedBy: null,   // 被哪个建筑实例占用
      isSecondary: false  // 是否是大型建筑的次要格子
    });
  }
  return plots;
};

// 初始化资源
const initializeResources = () => {
  const resources = {};
  Object.keys(HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES).forEach(resourceKey => {
    const resourceConfig = HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES[resourceKey];
    resources[resourceConfig.id] = 0;
  });
  
  // 设置测试用满资源
  resources[HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES.GOLD.id] = 999999;
  resources[HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES.WOOD.id] = 999999;
  resources[HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES.STONE.id] = 999999;
  resources[HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES.HERB.id] = 999999;
  resources[HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES.ORE.id] = 999999;
  resources[HOMESTEAD_GENERAL_CONFIG.HOMESTEAD_RESOURCES.ESSENCE.id] = 999999;
  
  return resources;
};

const initialState = {
  // 基础状态
  homesteadLevel: 1,
  homesteadExp: 0,
  maxPlots: INITIAL_PLOTS,
  
  // 地块系统
  plots: initializePlots(INITIAL_PLOTS),
  
  // 建筑系统
  buildings: {}, // { instanceId: { buildingId, level, plotId, occupiedPlots, startedAt, completesAt, ... } }
  
  // 资源系统
  resources: initializeResources(),
  resourceStorageLimit: {}, // 资源存储上限
  
  // 解锁功能系统
  unlockedFeatures: {
    shops: [],                    // 解锁的商店
    craftingStations: [],         // 解锁的制作台
    trainingFacilities: [],       // 解锁的训练设施
    teleportPoints: [],           // 解锁的传送点
    questGivers: [],              // 解锁的任务发布者
    summonCenterFeatures: []      // 解锁的召唤兽中心功能
  },
  
  // 计时器系统
  activeTimers: [], // { id, type, buildingInstanceId, completesAt, ... }
  
  // 生产系统
  resourceGenerators: [], // { buildingInstanceId, resources: [{ resourceId, amountPerHour, lastCollected }] }
  
  // 统计数据
  statistics: {
    totalBuildingsBuilt: 0,
    totalResourcesProduced: {},
    totalTimeSpent: 0
  }
};

const enhancedHomesteadSlice = createSlice({
  name: 'enhancedHomestead',
  initialState,
  reducers: {
    // ===== 建筑建造系统 =====
    startBuildingConstruction: (state, action) => {
      const { plotId, buildingId, occupiedPlots } = action.payload;
      const buildingConfig = ENHANCED_BUILDINGS[buildingId];
      
      if (!buildingConfig) {
        console.error(`Building config not found for ${buildingId}`);
        return;
      }
      
      // 检查资源（测试模式下跳过）
      const levelConfig = buildingConfig.levels[0];
      
      // 创建建筑实例
      const buildingInstanceId = `building_${Date.now()}_${plotId}`;
      const completesAt = Date.now() + levelConfig.buildTimeSeconds * 1000;
      
      state.buildings[buildingInstanceId] = {
        buildingId,
        level: 0, // 0 表示建造中
        plotId,
        occupiedPlots: occupiedPlots || [plotId],
        startedAt: Date.now(),
        completesAt,
        isActive: false
      };
      
      // 标记地块为占用，区分主格子和次要格子
      const plotsToOccupy = occupiedPlots || [plotId];
      plotsToOccupy.forEach((pId, index) => {
        const plot = state.plots.find(p => p.plotId === pId);
        if (plot) {
          plot.buildingId = buildingId;
          plot.buildingInstanceId = buildingInstanceId;
          plot.isOccupied = true;
          plot.occupiedBy = buildingInstanceId;
          plot.isSecondary = index > 0; // 第一个格子是主格子，其余是次要格子
        }
      });
      
      // 添加建造计时器
      const totalTime = levelConfig.buildTimeSeconds * 1000;
      state.activeTimers.push({
        id: `construction_${buildingInstanceId}`,
        type: 'CONSTRUCTION',
        buildingInstanceId,
        completesAt,
        totalTime,
        remainingTime: totalTime
      });
      
      console.log(`Started construction of ${buildingId} at plot ${plotId}`);
    },

    completeBuildingConstruction: (state, action) => {
      const { buildingInstanceId } = action.payload;
      const building = state.buildings[buildingInstanceId];
      
      if (!building || building.level !== 0) {
        console.error(`Building ${buildingInstanceId} not found or not under construction`);
        return;
      }
      
      // 完成建造
      building.level = 1;
      building.isActive = true;
      building.startedAt = null;
      building.completesAt = null;
      
      // 移除建造计时器
      state.activeTimers = state.activeTimers.filter(
        timer => timer.buildingInstanceId !== buildingInstanceId || timer.type !== 'CONSTRUCTION'
      );
      
      // 应用建筑解锁的功能
      const buildingConfig = ENHANCED_BUILDINGS[building.buildingId];
      if (buildingConfig?.levels[0]?.unlocks) {
        buildingConfig.levels[0].unlocks.forEach(unlock => {
          enhancedHomesteadSlice.caseReducers.applyUnlock(state, { payload: { unlock, buildingInstanceId } });
        });
      }
      
      // 更新统计
      state.statistics.totalBuildingsBuilt += 1;
      
      console.log(`Completed construction of ${building.buildingId}`);
    },

    // ===== 功能解锁系统 =====
    applyUnlock: (state, action) => {
      const { unlock, buildingInstanceId } = action.payload;
      
      switch (unlock.type) {
        case UNLOCK_TYPES.SHOP:
          if (!state.unlockedFeatures.shops.includes(unlock.data.shopId)) {
            state.unlockedFeatures.shops.push(unlock.data.shopId);
          }
          break;
          
        case UNLOCK_TYPES.SUMMON_CENTER:
          unlock.data.features.forEach(feature => {
            if (!state.unlockedFeatures.summonCenterFeatures.includes(feature)) {
              state.unlockedFeatures.summonCenterFeatures.push(feature);
            }
          });
          break;
          
        case UNLOCK_TYPES.CRAFTING_STATION:
          const craftingStation = {
            stationId: unlock.data.stationId,
            buildingInstanceId,
            recipes: unlock.data.recipes
          };
          state.unlockedFeatures.craftingStations.push(craftingStation);
          break;
          
        case UNLOCK_TYPES.TRAINING_FACILITY:
          const trainingFacility = {
            facilityId: unlock.data.facilityId,
            buildingInstanceId,
            services: unlock.data.services
          };
          state.unlockedFeatures.trainingFacilities.push(trainingFacility);
          break;
          
        case UNLOCK_TYPES.RESOURCE_GENERATOR:
          const generator = {
            buildingInstanceId,
            resources: unlock.data.resources.map(res => ({
              ...res,
              lastCollected: Date.now()
            }))
          };
          state.resourceGenerators.push(generator);
          break;
          
        case UNLOCK_TYPES.TELEPORT_POINT:
          const teleportPoint = {
            buildingInstanceId,
            destinations: unlock.data.destinations
          };
          state.unlockedFeatures.teleportPoints.push(teleportPoint);
          break;
          
        case UNLOCK_TYPES.STORAGE_EXPANSION:
          Object.keys(state.resources).forEach(resourceId => {
            if (!state.resourceStorageLimit[resourceId]) {
              state.resourceStorageLimit[resourceId] = 10000; // 默认上限
            }
            state.resourceStorageLimit[resourceId] += unlock.data.storageIncrease;
          });
          break;
          
        case UNLOCK_TYPES.HOMESTEAD_UPGRADE:
          if (unlock.data.maxPlots && unlock.data.maxPlots > state.maxPlots) {
            const oldPlotCount = state.plots.length;
            const newPlotCount = unlock.data.maxPlots;
            
            // 添加新地块
            for (let i = oldPlotCount; i < newPlotCount; i++) {
              state.plots.push({
                plotId: i,
                buildingId: null,
                buildingInstanceId: null,
                isOccupied: false,
                occupiedBy: null
              });
            }
            
            state.maxPlots = newPlotCount;
          }
          break;
          
        case UNLOCK_TYPES.QUEST_GIVER:
          const questGiver = {
            buildingInstanceId,
            questTypes: unlock.data.questTypes
          };
          state.unlockedFeatures.questGivers.push(questGiver);
          break;
      }
    },

    // ===== 资源管理系统 =====
    addResource: (state, action) => {
      const { resourceId, amount } = action.payload;
      if (state.resources[resourceId] !== undefined) {
        const limit = state.resourceStorageLimit[resourceId] || 999999;
        state.resources[resourceId] = Math.min(state.resources[resourceId] + amount, limit);
        
        // 更新统计
        if (!state.statistics.totalResourcesProduced[resourceId]) {
          state.statistics.totalResourcesProduced[resourceId] = 0;
        }
        state.statistics.totalResourcesProduced[resourceId] += amount;
      }
    },

    spendResource: (state, action) => {
      const { resourceId, amount } = action.payload;
      if (state.resources[resourceId] !== undefined && state.resources[resourceId] >= amount) {
        state.resources[resourceId] -= amount;
      }
    },

    // ===== 资源生产系统 =====
    collectResources: (state, action) => {
      const { buildingInstanceId } = action.payload;
      const generator = state.resourceGenerators.find(g => g.buildingInstanceId === buildingInstanceId);
      
      if (generator) {
        const now = Date.now();
        generator.resources.forEach(res => {
          const timeDiff = now - res.lastCollected;
          const hoursElapsed = timeDiff / (1000 * 60 * 60);
          const amountToCollect = Math.floor(hoursElapsed * res.amountPerHour);
          
          if (amountToCollect > 0) {
            enhancedHomesteadSlice.caseReducers.addResource(state, {
              payload: { resourceId: res.resource, amount: amountToCollect }
            });
            res.lastCollected = now;
          }
        });
      }
    },

    collectAllResources: (state) => {
      state.resourceGenerators.forEach(generator => {
        enhancedHomesteadSlice.caseReducers.collectResources(state, {
          payload: { buildingInstanceId: generator.buildingInstanceId }
        });
      });
    },

    // ===== 建筑管理 =====
    demolishBuilding: (state, action) => {
      const { buildingInstanceId } = action.payload;
      const building = state.buildings[buildingInstanceId];
      
      if (!building) return;
      
      // 释放地块
      building.occupiedPlots.forEach(plotId => {
        const plot = state.plots.find(p => p.plotId === plotId);
        if (plot) {
          plot.buildingId = null;
          plot.buildingInstanceId = null;
          plot.isOccupied = false;
          plot.occupiedBy = null;
        }
      });
      
      // 移除建筑
      delete state.buildings[buildingInstanceId];
      
      // 移除相关的计时器
      state.activeTimers = state.activeTimers.filter(
        timer => timer.buildingInstanceId !== buildingInstanceId
      );
      
      // 移除相关的资源生成器
      state.resourceGenerators = state.resourceGenerators.filter(
        gen => gen.buildingInstanceId !== buildingInstanceId
      );
      
      // 移除相关的解锁功能（需要重新计算）
      // TODO: 实现功能回收逻辑
    },

    // ===== 计时器管理 =====
    removeTimer: (state, action) => {
      const { timerId } = action.payload;
      state.activeTimers = state.activeTimers.filter(timer => timer.id !== timerId);
    },

    // ===== 数据重置和加载 =====
    setHomesteadState: (state, action) => {
      return { ...state, ...action.payload };
    },

    resetHomestead: (state) => {
      return initialState;
    },

    // ===== 测试辅助功能 =====
    fillAllResources: (state) => {
      Object.keys(state.resources).forEach(resourceId => {
        state.resources[resourceId] = 999999;
      });
    },

    instantCompleteBuilding: (state, action) => {
      const { buildingInstanceId } = action.payload;
      enhancedHomesteadSlice.caseReducers.completeBuildingConstruction(state, { payload: { buildingInstanceId } });
    },

    instantCompleteAllBuildings: (state) => {
      const constructingBuildings = Object.keys(state.buildings).filter(
        id => state.buildings[id].level === 0
      );
      constructingBuildings.forEach(buildingInstanceId => {
        enhancedHomesteadSlice.caseReducers.completeBuildingConstruction(state, { payload: { buildingInstanceId } });
      });
    },

    // ===== 建筑升级系统 =====
    upgradeBuildingAction: (state, action) => {
      const { buildingInstanceId } = action.payload;
      const building = state.buildings[buildingInstanceId];
      
      if (!building || building.level === 0) {
        console.error(`Building ${buildingInstanceId} not found or under construction`);
        return;
      }
      
      const buildingConfig = ENHANCED_BUILDINGS[building.buildingId];
      if (!buildingConfig || building.level >= buildingConfig.levels.length) {
        console.error(`Cannot upgrade building ${buildingInstanceId} - max level reached`);
        return;
      }
      
      const nextLevelConfig = buildingConfig.levels[building.level];
      const completesAt = Date.now() + (nextLevelConfig.buildTimeSeconds || 60) * 1000;
      
      // 设置升级状态
      building.isUpgrading = true;
      building.upgradeStartedAt = Date.now();
      building.upgradeCompletesAt = completesAt;
      building.targetLevel = building.level + 1;
      
      // 添加升级计时器
      state.activeTimers.push({
        id: `upgrade_${buildingInstanceId}`,
        type: 'UPGRADE',
        buildingInstanceId,
        completesAt,
        targetLevel: building.level + 1
      });
      
      console.log(`Started upgrade of ${building.buildingId} to level ${building.level + 1}`);
    },

    completeBuildingUpgrade: (state, action) => {
      const { buildingInstanceId } = action.payload;
      const building = state.buildings[buildingInstanceId];
      
      if (!building || !building.isUpgrading) {
        console.error(`Building ${buildingInstanceId} not found or not upgrading`);
        return;
      }
      
      // 完成升级
      building.level = building.targetLevel;
      building.isUpgrading = false;
      building.upgradeStartedAt = null;
      building.upgradeCompletesAt = null;
      building.targetLevel = null;
      
      // 移除升级计时器
      state.activeTimers = state.activeTimers.filter(
        timer => timer.buildingInstanceId !== buildingInstanceId || timer.type !== 'UPGRADE'
      );
      
      // 应用新等级的解锁功能
      const buildingConfig = ENHANCED_BUILDINGS[building.buildingId];
      const levelConfig = buildingConfig.levels[building.level - 1];
      if (levelConfig?.unlocks) {
        levelConfig.unlocks.forEach(unlock => {
          enhancedHomesteadSlice.caseReducers.applyUnlock(state, { payload: { unlock, buildingInstanceId } });
        });
      }
      
      console.log(`Completed upgrade of ${building.buildingId} to level ${building.level}`);
    }
  },
});

export const {
  startBuildingConstruction,
  completeBuildingConstruction,
  applyUnlock,
  addResource,
  spendResource,
  collectResources,
  collectAllResources,
  demolishBuilding,
  removeTimer,
  setHomesteadState,
  resetHomestead,
  fillAllResources,
  instantCompleteBuilding,
  instantCompleteAllBuildings,
  upgradeBuildingAction,
  completeBuildingUpgrade,
} = enhancedHomesteadSlice.actions;

// ===== Selectors =====
export const selectHomesteadPlots = (state) => state.enhancedHomestead.plots;
export const selectHomesteadResources = (state) => state.enhancedHomestead.resources;
export const selectHomesteadBuildings = (state) => state.enhancedHomestead.buildings;
export const selectActiveHomesteadTimers = (state) => state.enhancedHomestead.activeTimers;
export const selectUnlockedFeatures = (state) => state.enhancedHomestead.unlockedFeatures;
export const selectResourceGenerators = (state) => state.enhancedHomestead.resourceGenerators;
export const selectHomesteadStatistics = (state) => state.enhancedHomestead.statistics;

// 复合选择器
export const selectBuildingByPlot = (plotId) => (state) => {
  const plot = state.enhancedHomestead.plots.find(p => p.plotId === plotId);
  return plot?.buildingInstanceId ? state.enhancedHomestead.buildings[plot.buildingInstanceId] : null;
};

export const selectAvailableBuildings = (state) => {
  const buildings = state.enhancedHomestead.buildings;
  return Object.values(ENHANCED_BUILDINGS).filter(buildingConfig => {
    // 检查建筑需求
    if (buildingConfig.requires) {
      return buildingConfig.requires.every(requirement => {
        return Object.values(buildings).some(
          inst => inst.buildingId === requirement.buildingId && 
                  inst.level >= requirement.minLevel
        );
      });
    }
    return true;
  });
};

export const selectResourceProductionRate = (state) => {
  const rates = {};
  state.enhancedHomestead.resourceGenerators.forEach(generator => {
    generator.resources.forEach(res => {
      if (!rates[res.resource]) rates[res.resource] = 0;
      rates[res.resource] += res.amountPerHour;
    });
  });
  return rates;
};

export const selectPendingResources = (state) => {
  const pending = {};
  const now = Date.now();
  
  state.enhancedHomestead.resourceGenerators.forEach(generator => {
    generator.resources.forEach(res => {
      const timeDiff = now - res.lastCollected;
      const hoursElapsed = timeDiff / (1000 * 60 * 60);
      const amountToCollect = Math.floor(hoursElapsed * res.amountPerHour);
      
      if (amountToCollect > 0) {
        if (!pending[res.resource]) pending[res.resource] = 0;
        pending[res.resource] += amountToCollect;
      }
    });
  });
  
  return pending;
};

export default enhancedHomesteadSlice.reducer; 