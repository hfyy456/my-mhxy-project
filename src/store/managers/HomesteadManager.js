/**
 * HomesteadManager - 负责管理家园系统的状态和逻辑
 * 这是一个面向对象的管理器，旨在取代 homesteadSlice 和 enhancedHomesteadSlice。
 */
import { EventEmitter } from 'events';
import playerManager from './PlayerManager'; // 引入玩家管理器实例
import { ENHANCED_BUILDINGS, UNLOCK_TYPES } from '@/config/homestead/enhancedBuildingConfig';
import { HOMESTEAD_GENERAL_CONFIG } from '@/config/homestead/homesteadConfig';
import chronographInstance from '@/utils/Chronograph';

const GRID_SIZE_X = 12;
const GRID_SIZE_Y = 10;
const INITIAL_PLOTS = GRID_SIZE_X * GRID_SIZE_Y;

const BUILDING_STATUS = {
  IDLE: 'idle',
  CONSTRUCTING: 'constructing',
  UPGRADING: 'upgrading',
};

// Helper function to initialize plots
const initializePlots = (count) => {
  const plots = [];
  for (let i = 0; i < count; i++) {
    plots.push({ 
      plotId: i, 
      buildingId: null, 
      buildingInstanceId: null, 
      isOccupied: false,
      occupiedBy: null,
      isSecondary: false 
    });
  }
  return plots;
};


class HomesteadManager extends EventEmitter {
  constructor() {
    super();
    this.playerManager = null; // 将在 initialize 中设置
    // 构造函数保持简洁，不进行重度初始化
  }

  /**
   * 初始化管理器，注入依赖项并设置初始状态
   * @param {object} playerManager - PlayerManager 的实例
   */
  initialize(playerManager) {
    this.playerManager = playerManager;
    this.reset();
    // 注册资源更新任务到全局计时器
    chronographInstance.registerTask(
      'homestead-resource-update', 
      () => this.#updateResourceGenerators(), 
      1000 // 每1秒更新一次
    );
    console.log('[HomesteadManager] Initialized with PlayerManager and registered resource task.');
  }

  /**
   * 重置家园状态
   */
  reset() {
    this.homesteadLevel = 1;
    this.homesteadExp = 0;
    this.maxPlots = INITIAL_PLOTS;
    this.plots = initializePlots(INITIAL_PLOTS);
    this.buildings = {}; // 建筑实例
    this.activeTimers = []; // 计时器
    this.unlockedFeatures = {
      shops: [],
      craftingStations: [],
      trainingFacilities: [],
      teleportPoints: [],
      questGivers: [],
      summonCenterFeatures: []
    };
    this.resourceGenerators = [];
    this.statistics = {
      totalBuildingsBuilt: 0,
      totalResourcesProduced: {},
      totalTimeSpent: 0
    };
    
    // The interval is now managed by the global Chronograph.
    // No action is needed here to start or clear intervals.

    this.emit('state_changed', this.getState());
  }

  /**
   * 获取当前家园状态的快照
   */
  getState() {
    return {
      plots: [...this.plots],
      buildings: { ...this.buildings },
      activeTimers: [...this.activeTimers],
      homesteadLevel: this.homesteadLevel,
      homesteadExp: this.homesteadExp,
      unlockedFeatures: { ...this.unlockedFeatures },
      resourceGenerators: [...this.resourceGenerators], // 返回生成器状态
    };
  }

  /**
   * 开始建造建筑
   * @param {{plotId: number, buildingId: string, occupiedPlots: number[]}} payload
   * @returns {{success: boolean, message: string}}
   */
  startBuildingConstruction({ plotId, buildingId, occupiedPlots }) {
    const buildingConfig = ENHANCED_BUILDINGS[buildingId];
    if (!buildingConfig) {
      const message = `Building config not found for ${buildingId}`;
      console.error(message);
      return { success: false, message };
    }

    // 验证地块是否可用
    const plotsToOccupy = occupiedPlots || [plotId];
    const arePlotsAvailable = plotsToOccupy.every(pId => {
      const plot = this.plots.find(p => p.plotId === pId);
      return plot && !plot.isOccupied;
    });

    if (!arePlotsAvailable) {
        const message = `One or more plots for building ${buildingId} are already occupied.`;
        console.error(message);
        return { success: false, message };
    }

    // 检查资源
    const levelConfig = buildingConfig.levels[0];
    const cost = levelConfig.buildCost;
    if (!this.playerManager.hasEnoughResources(cost)) {
      const message = 'Not enough resources to build.';
      console.error(message);
      return { success: false, message };
    }

    // 扣除资源
    if (!this.playerManager.spendResources(cost)) {
      const message = 'Resource spending failed unexpectedly.';
      console.error(message);
      return { success: false, message };
    }

    // 创建建筑实例
    const buildingInstanceId = `building_${Date.now()}_${plotId}`;
    const completesAt = Date.now() + levelConfig.buildTimeSeconds * 1000;

    this.buildings[buildingInstanceId] = {
      buildingId,
      level: 0, // 0 表示建造中
      status: BUILDING_STATUS.CONSTRUCTING, // 设置状态为建造中
      plotId, // 主地块ID
      occupiedPlots: plotsToOccupy,
      startedAt: Date.now(),
      completesAt,
      isActive: false
    };
    
    // 标记地块为占用
    plotsToOccupy.forEach((pId, index) => {
      const plot = this.plots.find(p => p.plotId === pId);
      if (plot) {
        plot.buildingId = buildingId;
        plot.buildingInstanceId = buildingInstanceId;
        plot.isOccupied = true;
        plot.occupiedBy = buildingInstanceId;
        plot.isSecondary = index > 0;
      }
    });
    
    // 添加计时器
    this.activeTimers.push({
      id: `construction_${buildingInstanceId}`,
      type: 'CONSTRUCTION',
      buildingInstanceId,
      completesAt,
    });

    console.log(`Started construction of ${buildingId} at plot ${plotId}`);
    this.emit('state_changed', this.getState());
    return { success: true, message: 'Construction started.' };
  }

  /**
   * 完成建筑施工
   * @param {string} buildingInstanceId 
   */
  completeBuildingConstruction(buildingInstanceId) {
    const building = this.buildings[buildingInstanceId];
    if (!building || building.status !== BUILDING_STATUS.CONSTRUCTING) {
      const message = `Building ${buildingInstanceId} not found or not under construction.`;
      console.error(message);
      return { success: false, message };
    }
    building.level = 1;
    building.status = BUILDING_STATUS.IDLE; // 状态变为空闲
    building.isActive = true;
    building.startedAt = null;
    building.completesAt = null;
    
    // 移除计时器
    this.activeTimers = this.activeTimers.filter(timer => timer.buildingInstanceId !== buildingInstanceId || timer.type !== 'CONSTRUCTION');
    
    // 应用建筑解锁的功能
    const buildingConfig = ENHANCED_BUILDINGS[building.buildingId];
    // 使用 level 1 的配置，因为建筑刚建成
    if (buildingConfig?.levels[0]?.unlocks) {
      buildingConfig.levels[0].unlocks.forEach(unlock => {
        this.#applyUnlock({ unlock, buildingInstanceId });
      });
    }

    this.statistics.totalBuildingsBuilt += 1;
    
    console.log(`Building ${building.buildingId} (Instance: ${buildingInstanceId}) construction completed. Now level 1.`);
    this.emit('state_changed', this.getState());
    return { success: true, message: 'Construction completed.' };
  }

  /**
   * 私有方法，处理建筑完成时的功能解锁
   * @param {{unlock: object, buildingInstanceId: string}} payload
   */
  #applyUnlock({ unlock, buildingInstanceId }) {
    console.log(`Applying unlock: ${unlock.type} for building ${buildingInstanceId}`);
    switch (unlock.type) {
      case UNLOCK_TYPES.SHOP:
        if (!this.unlockedFeatures.shops.includes(unlock.data.shopId)) {
          this.unlockedFeatures.shops.push(unlock.data.shopId);
        }
        break;
        
      case UNLOCK_TYPES.SUMMON_CENTER:
        unlock.data.features.forEach(feature => {
          if (!this.unlockedFeatures.summonCenterFeatures.includes(feature)) {
            this.unlockedFeatures.summonCenterFeatures.push(feature);
          }
        });
        break;
        
      case UNLOCK_TYPES.CRAFTING_STATION:
        this.unlockedFeatures.craftingStations.push({
          stationId: unlock.data.stationId,
          buildingInstanceId,
          recipes: unlock.data.recipes
        });
        break;
        
      case UNLOCK_TYPES.RESOURCE_GENERATOR:
        this.#addResourceGenerator({
            buildingInstanceId,
            generatorData: unlock.data
        });
        break;

      // TODO: 添加其他解锁类型的处理逻辑
      default:
        console.warn(`Unknown unlock type: ${unlock.type}`);
    }
  }

  /**
   * 添加一个新的资源生成器
   * @private
   */
  #addResourceGenerator({ buildingInstanceId, generatorData }) {
    const newGenerator = {
      buildingInstanceId,
      capacity: generatorData.capacity,
      resources: generatorData.resources, // { resource: string, amountPerHour: number }[]
      uncollectedAmounts: generatorData.resources.reduce((acc, res) => {
        acc[res.resource] = 0;
        return acc;
      }, {}),
      lastUpdateTime: Date.now(),
    };
    this.resourceGenerators.push(newGenerator);
    console.log(`Resource generator added for building ${buildingInstanceId}`, newGenerator);
  }

  /**
   * 定时更新所有资源生成器
   * @private
   */
  #updateResourceGenerators() {
    const now = Date.now();
    let changed = false;
    this.resourceGenerators.forEach(generator => {
      const building = this.buildings[generator.buildingInstanceId];
      if (!building || building.status !== BUILDING_STATUS.IDLE) {
        // 如果建筑不在了或者不是空闲状态（比如正在升级），则不生产
        generator.lastUpdateTime = now; // 但需要更新时间戳避免下次产生爆发式增长
        return;
      }

      const elapsedTimeInHours = (now - generator.lastUpdateTime) / (1000 * 3600);
      if (elapsedTimeInHours <= 0) return;

      generator.resources.forEach(resInfo => {
        const currentAmount = generator.uncollectedAmounts[resInfo.resource] || 0;
        const totalCapacity = generator.capacity; // 假设所有资源共享总容量
        const totalUncollected = Object.values(generator.uncollectedAmounts).reduce((sum, val) => sum + val, 0);

        if (totalUncollected >= totalCapacity) {
          return; // 已达到容量上限
        }

        const generatedAmount = resInfo.amountPerHour * elapsedTimeInHours;
        const availableCapacity = totalCapacity - totalUncollected;
        const amountToAdd = Math.min(generatedAmount, availableCapacity);
        
        if(amountToAdd > 0) {
            generator.uncollectedAmounts[resInfo.resource] = currentAmount + amountToAdd;
            changed = true;
        }
      });
      generator.lastUpdateTime = now;
    });

    if (changed) {
      this.emit('state_changed', this.getState());
    }
  }

  /**
   * 收集单个建筑的资源
   * @param {string} buildingInstanceId
   * @returns {{success: boolean, collected: object}}
   */
  collectResourcesFromBuilding(buildingInstanceId) {
    const generator = this.#getGeneratorForBuilding(buildingInstanceId);
    if (!generator) {
      return { success: false, message: "No generator found for this building." };
    }

    const collectedAmounts = { ...generator.uncollectedAmounts };
    const resourcesToCollect = [];
    for (const resource in collectedAmounts) {
        const amount = Math.floor(collectedAmounts[resource]);
        if(amount > 0) {
            resourcesToCollect.push({ resource, amount });
        }
    }
    
    if (resourcesToCollect.length === 0) {
        return { success: true, message: "No resources to collect.", collected: {} };
    }

    // 将资源添加到玩家库存
    this.playerManager.addResources(resourcesToCollect);

    // 更新统计数据
    resourcesToCollect.forEach(({resource, amount}) => {
        this.statistics.totalResourcesProduced[resource] = (this.statistics.totalResourcesProduced[resource] || 0) + amount;
    });
    
    // 重置未收集数量
    for (const resource in generator.uncollectedAmounts) {
        generator.uncollectedAmounts[resource] = 0;
    }

    console.log(`Collected resources from ${buildingInstanceId}:`, collectedAmounts);
    this.emit('state_changed', this.getState());
    
    return { success: true, collected: collectedAmounts };
  }

  /**
   * 收集所有建筑的资源
   * @returns {{success: boolean, totalCollected: object, totalAmount: number}}
   */
  collectAllResources() {
    let totalAmount = 0;
    const totalCollected = {};

    this.resourceGenerators.forEach(generator => {
      for (const resource in generator.uncollectedAmounts) {
        const amount = Math.floor(generator.uncollectedAmounts[resource]);
        if (amount > 0) {
          totalCollected[resource] = (totalCollected[resource] || 0) + amount;
          totalAmount += amount;
        }
        // 清空
        generator.uncollectedAmounts[resource] = 0;
      }
    });

    if (totalAmount === 0) {
      return { success: true, message: "No resources to collect.", totalCollected: {}, totalAmount: 0 };
    }

    // 格式化为 addResources 方法需要的格式
    const resourcesToCollect = Object.entries(totalCollected).map(([resource, amount]) => ({ resource, amount }));
    
    // 将资源添加到玩家库存
    this.playerManager.addResources(resourcesToCollect);

    // 更新统计数据
    resourcesToCollect.forEach(({resource, amount}) => {
        this.statistics.totalResourcesProduced[resource] = (this.statistics.totalResourcesProduced[resource] || 0) + amount;
    });

    console.log(`Collected all resources:`, totalCollected);
    this.emit('state_changed', this.getState());
    
    return { success: true, totalCollected, totalAmount };
  }

  /**
   * 根据建筑实例ID获取其资源生成器
   * @param {string} buildingInstanceId
   * @returns {object | undefined}
   */
  #getGeneratorForBuilding(buildingInstanceId) {
    return this.resourceGenerators.find(g => g.buildingInstanceId === buildingInstanceId);
  }

  /**
   * 获取当前所有可建造的建筑列表 - [已废弃，请使用 getAllBuildingsWithUnlockStatus]
   * @returns {Object} - key为建筑ID，value为建筑配置的对象
   */
  getAvailableBuildings() {
    const available = {};
    const existingBuildings = this.buildings;

    for (const buildingId in ENHANCED_BUILDINGS) {
      const config = ENHANCED_BUILDINGS[buildingId];
      
      // 如果没有解锁要求，则直接可用
      if (!config.requires || config.requires.length === 0) {
        available[buildingId] = config;
        continue;
      }

      // 检查所有解锁条件是否都满足
      const allRequirementsMet = config.requires.every(req => {
        // 查找是否存在满足条件的建筑实例
        const requiredBuildingInstance = Object.values(existingBuildings).find(
          b => b.buildingId === req.buildingId && b.level >= req.minLevel
        );
        return !!requiredBuildingInstance;
      });

      if (allRequirementsMet) {
        available[buildingId] = config;
      }
    }
    return available;
  }

  /**
   * 获取所有建筑及其解锁状态
   * @returns {Array<Object>} - 包含所有建筑配置和附加状态的数组
   */
  getAllBuildingsWithUnlockStatus() {
    const existingBuildings = this.buildings;
    
    return Object.values(ENHANCED_BUILDINGS).map(config => {
      let isUnlocked = true;
      let reason = '';

      // 检查1：数量限制
      if (config.limit) {
        const count = Object.values(existingBuildings).filter(b => b.buildingId === config.id).length;
        if (count >= config.limit) {
          isUnlocked = false;
          reason = '数量已达上限';
        }
      }

      // 检查2：前置建筑要求 (仅在数量未达上限时检查)
      if (isUnlocked && config.requires && config.requires.length > 0) {
        const unmetRequirements = [];
        const allRequirementsMet = config.requires.every(req => {
          const requiredBuilding = Object.values(existingBuildings).find(
            b => b.buildingId === req.buildingId && b.level >= req.minLevel
          );
          if (!requiredBuilding) {
            const requiredBuildingName = ENHANCED_BUILDINGS[req.buildingId]?.name || req.buildingId;
            unmetRequirements.push(`${requiredBuildingName} Lv.${req.minLevel}`);
          }
          return !!requiredBuilding;
        });

        isUnlocked = allRequirementsMet;
        if (!isUnlocked) {
          reason = `需要: ${unmetRequirements.join(', ')}`;
        }
      }

      // 检查3：资源是否足够
      const level1Config = config.levels[0];
      const canAfford = this.playerManager.hasEnoughResources(level1Config.buildCost);

      return {
        config: config,
        isUnlocked,
        reason,
        canAfford,
      };
    });
  }

  // ===========================================
  // 存档/读档接口
  // ===========================================
  
  /**
   * 获取用于存档的家园数据
   * @returns {object}
   */
  getSaveData() {
    // 在保存前最后更新一次资源，确保没有遗漏
    this.#updateResourceGenerators();
    return {
      homesteadLevel: this.homesteadLevel,
      homesteadExp: this.homesteadExp,
      maxPlots: this.maxPlots,
      plots: this.plots,
      buildings: this.buildings,
      activeTimers: this.activeTimers,
      unlockedFeatures: this.unlockedFeatures,
      resourceGenerators: this.resourceGenerators, // 保存生成器的完整状态
      statistics: this.statistics,
    };
  }

  /**
   * 从存档数据中加载家园状态
   * @param {object} data - 从存档加载的数据
   */
  loadSaveData(data) {
    if (!data) return;

    this.homesteadLevel = data.homesteadLevel || 1;
    this.homesteadExp = data.homesteadExp || 0;
    this.maxPlots = data.maxPlots || INITIAL_PLOTS;
    this.plots = data.plots || initializePlots(this.maxPlots);
    this.buildings = data.buildings || {};
    this.activeTimers = data.activeTimers || [];
    this.unlockedFeatures = data.unlockedFeatures || {
      shops: [],
      craftingStations: [],
      trainingFacilities: [],
      teleportPoints: [],
      questGivers: [],
      summonCenterFeatures: []
    };
    this.resourceGenerators = data.resourceGenerators || [];
    this.statistics = data.statistics || {
      totalBuildingsBuilt: 0,
      totalResourcesProduced: {},
      totalTimeSpent: 0
    };

    // 手动执行一次资源更新，以计算离线收益
    this.#updateResourceGenerators();

    console.log('[HomesteadManager] Homestead state loaded from save data.');
    this.emit('state_changed', this.getState());
  }

  // ===========================================
  // 建筑升级
  // ===========================================
  startBuildingUpgrade(buildingInstanceId) {
    const building = this.buildings[buildingInstanceId];
    if (!building || building.status !== BUILDING_STATUS.IDLE) {
      return { success: false, message: 'Building is not idle or not found.' };
    }

    const buildingConfig = ENHANCED_BUILDINGS[building.buildingId];
    const nextLevel = building.level + 1;
    if (!buildingConfig.levels[nextLevel -1]) {
       return { success: false, message: 'No more levels to upgrade.' };
    }
    const nextLevelConfig = buildingConfig.levels[nextLevel - 1];
    
    // 检查并花费资源
    if (!this.playerManager.hasEnoughResources(nextLevelConfig.upgradeCost)) {
      return { success: false, message: 'Not enough resources for upgrade.' };
    }
    this.playerManager.spendResources(nextLevelConfig.upgradeCost);

    // 设置升级状态和计时器
    building.status = BUILDING_STATUS.UPGRADING; // 设置状态为升级中
    building.upgradingTo = nextLevel;
    const completesAt = Date.now() + nextLevelConfig.upgradeTimeSeconds * 1000;
    this.activeTimers.push({
      id: `upgrade_${buildingInstanceId}`,
      type: 'UPGRADE',
      buildingInstanceId,
      completesAt,
    });

    this.emit('state_changed', this.getState());
    return { success: true, message: 'Building upgrade started.' };
  }

  completeBuildingUpgrade(buildingInstanceId) {
    const building = this.buildings[buildingInstanceId];
    if (!building || building.status !== BUILDING_STATUS.UPGRADING) {
      return { success: false, message: 'Building not found or not upgrading.' };
    }
    
    const oldLevel = building.level;
    const newLevel = building.upgradingTo;
    
    building.level = newLevel;
    building.status = BUILDING_STATUS.IDLE; // 状态变为空闲
    delete building.upgradingTo;

    this.activeTimers = this.activeTimers.filter(t => t.id !== `upgrade_${buildingInstanceId}`);
    
    // 应用新等级的解锁
    const buildingConfig = ENHANCED_BUILDINGS[building.buildingId];
    const newLevelConfig = buildingConfig.levels.find(l => l.level === newLevel);
    if (newLevelConfig?.unlocks) {
      newLevelConfig.unlocks.forEach(unlock => {
        this.#applyUnlock({ unlock, buildingInstanceId });
      });
    }

    this.emit('state_changed', this.getState());
    return { success: true, message: `Upgrade to level ${building.level} complete.` };
  }


  // ===========================================
  // 调试接口
  // ===========================================
  debug_instantCompleteAll() {
    [...this.activeTimers].forEach(timer => {
      if (timer.type === 'CONSTRUCTION') {
        this.completeBuildingConstruction(timer.buildingInstanceId);
      } else if (timer.type === 'UPGRADE') {
        this.completeBuildingUpgrade(timer.buildingInstanceId);
      }
    });
    console.log('[HomesteadManager] DEBUG: All timers completed.');
  }
}

export default HomesteadManager; 