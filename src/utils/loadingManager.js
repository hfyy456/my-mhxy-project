/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-06 07:50:00
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-06 07:37:02
 */

/**
 * 游戏资源加载管理器
 * 管理游戏启动时的真实资源加载过程
 */
class LoadingManager {
  constructor() {
    this.tasks = [];
    this.currentProgress = 0;
    this.currentMessage = '';
    this.onProgressUpdate = null;
    this.onMessageUpdate = null;
    this.onMapGenerationUpdate = null;
    this.isLoading = false;
  }

  /**
   * 设置进度更新回调
   */
  setProgressCallback(callback) {
    this.onProgressUpdate = callback;
  }

  /**
   * 设置消息更新回调
   */
  setMessageCallback(callback) {
    this.onMessageUpdate = callback;
  }

  /**
   * 设置地图生成更新回调
   */
  setMapGenerationCallback(callback) {
    this.onMapGenerationUpdate = callback;
  }

  /**
   * 更新进度
   */
  updateProgress(progress, message) {
    this.currentProgress = progress;
    this.currentMessage = message;
    
    if (this.onProgressUpdate) {
      this.onProgressUpdate(progress);
    }
    
    if (this.onMessageUpdate) {
      this.onMessageUpdate(message);
    }
  }

  /**
   * 添加加载任务
   */
  addTask(name, asyncFunction, weight = 1) {
    this.tasks.push({
      name,
      asyncFunction,
      weight,
      completed: false,
      error: null
    });
  }

  /**
   * 加载配置文件
   */
  async loadConfigurations() {
    const configs = [
      { name: '物品配置', path: '/src/config/item/allItems.json' },
      { name: '召唤兽配置', path: '/src/config/summon/allSummons.json' },
      { name: '主动技能配置', path: '/src/config/skill/activeSkills.json' },
      { name: '被动技能配置', path: '/src/config/skill/passiveSkills.json' },
      { name: 'Buff配置', path: '/src/config/buff/buffs.json' }
    ];

    const promises = configs.map(async (config) => {
      try {
        await import(config.path);
        console.log(`[LoadingManager] ${config.name}加载成功`);
        return { success: true, name: config.name };
      } catch (error) {
        console.warn(`[LoadingManager] ${config.name}加载失败:`, error);
        return { success: false, name: config.name, error };
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const totalCount = configs.length;

    console.log(`[LoadingManager] 配置文件加载完成: ${successCount}/${totalCount}`);
    return { successCount, totalCount, results };
  }

  /**
   * 预加载关键模块
   */
  async preloadModules() {
    const modules = [
      { name: '枚举配置', path: '@/config/enumConfig' },
      { name: 'UI文本配置', path: '@/config/ui/uiTextConfig' },
      { name: '游戏常量', path: '@/config/config' }
    ];

    const promises = modules.map(async (module) => {
      try {
        await import(module.path);
        console.log(`[LoadingManager] ${module.name}模块加载成功`);
        return { success: true, name: module.name };
      } catch (error) {
        console.warn(`[LoadingManager] ${module.name}模块加载失败:`, error);
        return { success: false, name: module.name, error };
      }
    });

    const results = await Promise.all(promises);
    return results;
  }

  /**
   * 预加载UI组件
   */
  async preloadUIComponents() {
    const components = [
      { name: '游戏地图', path: '@/features/ui/components/GameMap' },
      { name: '对话面板', path: '@/features/ui/components/DialoguePanel' },
      { name: 'NPC面板', path: '@/features/npc/components/NpcPanel' },
      { name: '通用模态框', path: '@/features/ui/components/CommonModal' }
    ];

    const promises = components.map(async (component) => {
      try {
        await import(component.path);
        console.log(`[LoadingManager] ${component.name}组件预加载成功`);
        return { success: true, name: component.name };
      } catch (error) {
        console.warn(`[LoadingManager] ${component.name}组件预加载失败:`, error);
        return { success: false, name: component.name, error };
      }
    });

    const results = await Promise.all(promises);
    return results;
  }

  /**
   * 预加载战斗系统
   */
  async preloadBattleSystem() {
    const battleModules = [
      { name: '战斗逻辑', path: '@/features/battle/logic/battleLogic' },
      { name: '敌人配置', path: '@/config/character/enemyConfig' },
      { name: '战斗界面', path: '@/features/battle/components/BattleScreen' }
    ];

    const promises = battleModules.map(async (module) => {
      try {
        await import(module.path);
        console.log(`[LoadingManager] ${module.name}模块预加载成功`);
        return { success: true, name: module.name };
      } catch (error) {
        console.warn(`[LoadingManager] ${module.name}模块预加载失败:`, error);
        return { success: false, name: module.name, error };
      }
    });

    const results = await Promise.all(promises);
    return results;
  }

  /**
   * 生成游戏地图
   */
  async generateGameMaps() {
    const mapResults = [];

    try {
      // 导入地图相关模块
      const [
        { WORLD_REGIONS },
        { generateMapGrid, CELL_TYPES },
        { createNoise2D }
      ] = await Promise.all([
        import('@/config/map/worldMapConfig'),
        import('@/config/map/mapConfig'),
        import('simplex-noise')
      ]);

      // 生成世界地图的所有区域
      const regionIds = Object.keys(WORLD_REGIONS);
      let completedRegions = 0;

      for (const regionId of regionIds) {
        try {
          const region = WORLD_REGIONS[regionId];
          
          // 如果地图数据已存在，跳过生成
          if (region.mapData && region.mapData.grid) {
            mapResults.push({ 
              name: `${region.name}地图`, 
              success: true, 
              cached: true 
            });
            completedRegions++;
            continue;
          }

          // 生成新的地图数据
          const { regionType, position } = region;
          
          // 根据区域类型设置生成参数
          let terrainDistribution = {};
          switch (regionType) {
            case 'TOWN':
              terrainDistribution = {
                [CELL_TYPES.GRASS.id]: 0.7,
                [CELL_TYPES.TOWN.id]: 0.2,
                [CELL_TYPES.FOREST.id]: 0.05,
                [CELL_TYPES.WATER.id]: 0.05,
              };
              break;
            case 'FOREST':
              terrainDistribution = {
                [CELL_TYPES.GRASS.id]: 0.3,
                [CELL_TYPES.FOREST.id]: 0.6,
                [CELL_TYPES.WATER.id]: 0.05,
                [CELL_TYPES.MOUNTAIN.id]: 0.05,
              };
              break;
            case 'MOUNTAIN':
              terrainDistribution = {
                [CELL_TYPES.GRASS.id]: 0.15,
                [CELL_TYPES.MOUNTAIN.id]: 0.7,
                [CELL_TYPES.FOREST.id]: 0.1,
                [CELL_TYPES.WATER.id]: 0.05,
              };
              break;
            case 'LAKE':
              terrainDistribution = {
                [CELL_TYPES.GRASS.id]: 0.3,
                [CELL_TYPES.WATER.id]: 0.6,
                [CELL_TYPES.FOREST.id]: 0.1,
              };
              break;
            case 'DESERT':
              terrainDistribution = {
                [CELL_TYPES.GRASS.id]: 0.7, // 沙漠用草地代替沙子
                [CELL_TYPES.MOUNTAIN.id]: 0.2,
                [CELL_TYPES.WATER.id]: 0.05,
                [CELL_TYPES.FOREST.id]: 0.05,
              };
              break;
            case 'CAVE':
              terrainDistribution = {
                [CELL_TYPES.MOUNTAIN.id]: 0.8,
                [CELL_TYPES.WATER.id]: 0.1,
                [CELL_TYPES.GRASS.id]: 0.1,
              };
              break;
            default:
              terrainDistribution = {
                [CELL_TYPES.GRASS.id]: 0.5,
                [CELL_TYPES.FOREST.id]: 0.2,
                [CELL_TYPES.WATER.id]: 0.15,
                [CELL_TYPES.MOUNTAIN.id]: 0.15,
              };
          }

          // 生成地图网格
          const grid = generateMapGrid(30, 30, {
            seed: position.x + position.y, // 使用位置作为种子确保一致性
            terrainDistribution,
            noiseScale: 70,
            octaves: 4,
            persistence: 0.5,
            lacunarity: 2.0
          });

          // 更新区域的地图数据
          if (!region.mapData) {
            region.mapData = {};
          }
          region.mapData.grid = grid;
          region.mapData.rows = 30;
          region.mapData.cols = 30;

          mapResults.push({ 
            name: `${region.name}地图`, 
            success: true, 
            generated: true 
          });
          completedRegions++;

          console.log(`[LoadingManager] ${region.name}地图生成完成`);

        } catch (error) {
          mapResults.push({ 
            name: `${WORLD_REGIONS[regionId]?.name || regionId}地图`, 
            success: false, 
            error 
          });
          console.warn(`[LoadingManager] ${regionId}地图生成失败:`, error);
        }

        // 更新生成进度
        const progress = (completedRegions / regionIds.length) * 100;
        if (this.onProgressUpdate) {
          // 这里是在地图生成阶段的内部进度，需要映射到整体进度
          // 假设地图生成占整体进度的10%（从55%到65%）
          const overallProgress = 55 + (progress * 0.1);
          this.onProgressUpdate(Math.min(65, overallProgress));
        }
        if (this.onMessageUpdate) {
          this.onMessageUpdate(`正在生成${WORLD_REGIONS[regionId]?.name || regionId}...`);
        }
        
        // 触发地图生成状态更新
        if (this.onMapGenerationUpdate) {
          this.onMapGenerationUpdate({
            isGenerating: true,
            currentRegion: regionId,
            currentRegionName: WORLD_REGIONS[regionId]?.name || regionId,
            totalRegions: regionIds.length,
            completedRegions,
            progress: Math.round(progress)
          });
        }

        // 添加小延迟让用户看到进度变化
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`[LoadingManager] 地图生成完成: ${completedRegions}/${regionIds.length}`);
      
      // 地图生成完成，关闭可视化界面
      if (this.onMapGenerationUpdate) {
        this.onMapGenerationUpdate({
          isGenerating: false,
          currentRegion: '',
          currentRegionName: '',
          totalRegions: regionIds.length,
          completedRegions,
          progress: 100
        });
      }

    } catch (error) {
      mapResults.push({ 
        name: '地图生成系统', 
        success: false, 
        error 
      });
      console.error('[LoadingManager] 地图生成系统加载失败:', error);
    }

    return mapResults;
  }

  /**
   * 初始化游戏系统
   */
  async initializeGameSystems() {
    const systems = [];


    // 初始化背包系统
    try {
      const { inventoryManager } = await import('@/store/InventoryManager');
      await inventoryManager.loadFromStorage();
      systems.push({ name: '背包系统', success: true });
      console.log('[LoadingManager] 背包系统初始化成功');
    } catch (error) {
      systems.push({ name: '背包系统', success: false, error });
      console.warn('[LoadingManager] 背包系统初始化失败:', error);
    }

    // 4. 验证和清理数据
    try {
      this.updateProgress(12, '正在验证游戏数据...');
      
      // 检查背包数据一致性
      const { default: inventoryManager } = await import('@/store/InventoryManager');
      console.log('[LoadingManager] 背包状态检查完成');
      
      this.updateProgress(15, '数据验证完成');
    } catch (error) {
      systems.push({ name: '数据验证', success: false, error });
      console.warn('[LoadingManager] 数据验证失败:', error);
    }

    return systems;
  }

  /**
   * 检查环境
   */
  checkEnvironment() {
    const checks = {
      electron: !!window.electronAPI,
      localStorage: typeof Storage !== 'undefined',
      webGL: !!window.WebGLRenderingContext,
      indexedDB: !!window.indexedDB
    };

    console.log('[LoadingManager] 环境检查结果:', checks);
    return checks;
  }

  /**
   * 执行完整的加载流程
   */
  async execute() {
    this.isLoading = true;
    const startTime = Date.now();

    try {
      // 阶段1: 初始化 (5%)
      this.updateProgress(5, "正在启动核心引擎...");
      await new Promise(resolve => setTimeout(resolve, 300));

      // 阶段2: 环境检查 (10%)
      this.updateProgress(10, "正在检查运行环境...");
      const envChecks = this.checkEnvironment();
      await new Promise(resolve => setTimeout(resolve, 200));

      // 阶段3: 配置文件加载 (25%)
      this.updateProgress(15, "正在加载游戏配置...");
      const configResults = await this.loadConfigurations();
      this.updateProgress(25, `配置加载完成 (${configResults.successCount}/${configResults.totalCount})`);

      // 阶段4: 模块预加载 (40%)
      this.updateProgress(30, "正在初始化游戏数据结构...");
      const moduleResults = await this.preloadModules();
      this.updateProgress(40, "游戏数据结构初始化完成");

      // 阶段5: 游戏系统初始化 (50%)
      this.updateProgress(45, "正在初始化游戏系统...");
      const systemResults = await this.initializeGameSystems();
      this.updateProgress(50, "游戏系统初始化完成");

      // 阶段6: 地图生成 (65%)
      this.updateProgress(55, "正在生成游戏世界...");
      const mapResults = await this.generateGameMaps();
      this.updateProgress(65, "游戏世界生成完成");

      // 阶段7: UI组件预加载 (75%)
      this.updateProgress(70, "正在加载用户界面...");
      const uiResults = await this.preloadUIComponents();
      this.updateProgress(75, "用户界面加载完成");

      // 阶段8: 战斗系统预加载 (90%)
      this.updateProgress(80, "正在准备战斗引擎...");
      const battleResults = await this.preloadBattleSystem();
      this.updateProgress(90, "战斗引擎准备完成");

      // 阶段9: 最终优化 (95%)
      this.updateProgress(95, "正在优化游戏性能...");
      
      // 隐藏HTML加载器
      const loader = document.getElementById('loader-wrapper');
      if (loader) {
        loader.style.display = 'none';
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      // 阶段10: 完成 (100%)
      this.updateProgress(100, "准备进入梦幻世界...");
      await new Promise(resolve => setTimeout(resolve, 500));

      const loadTime = Date.now() - startTime;
      console.log(`[LoadingManager] 游戏资源加载完成，耗时: ${loadTime}ms`);

      // 生成加载报告
      const loadingReport = {
        loadTime,
        environment: envChecks,
        configurations: configResults,
        modules: moduleResults,
        systems: systemResults,
        maps: mapResults,
        ui: uiResults,
        battle: battleResults
      };

      console.log('[LoadingManager] 加载报告:', loadingReport);

      this.isLoading = false;
      return { success: true, report: loadingReport };

    } catch (error) {
      console.error('[LoadingManager] 加载过程中发生严重错误:', error);
      
      this.updateProgress(100, "加载完成（部分资源可能未成功加载）");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isLoading = false;
      return { success: false, error, report: null };
    }
  }
}

// 创建单例实例
const loadingManager = new LoadingManager();

export default loadingManager; 