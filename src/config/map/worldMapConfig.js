import { CELL_TYPES, TILE_CONTENT_TYPES, generateMapGrid } from './mapConfig';

// 区域类型定义
export const REGION_TYPES = {
  TOWN: { id: 'TOWN', name: '城镇', color: '#D2B48C', thumbnail: 'town_thumbnail.png' },
  FOREST: { id: 'FOREST', name: '森林', color: '#10B981', thumbnail: 'forest_thumbnail.png' },
  MOUNTAIN: { id: 'MOUNTAIN', name: '山脉', color: '#6B7280', thumbnail: 'mountain_thumbnail.png' },
  LAKE: { id: 'LAKE', name: '湖泊', color: '#3B82F6', thumbnail: 'lake_thumbnail.png' },
  DESERT: { id: 'DESERT', name: '沙漠', color: '#F59E0B', thumbnail: 'desert_thumbnail.png' },
  CAVE: { id: 'CAVE', name: '洞穴', color: '#4B5563', thumbnail: 'cave_thumbnail.png' },
};

// 生成特定区域的地图数据
const generateRegionMap = (regionType, rows = 30, cols = 30, options = {}) => {
  const mapOptions = {
    seed: Math.random(),
    terrainDistribution: {},
    ...options
  };
  
  // 根据区域类型配置地形分布特点
  switch (regionType) {
    case REGION_TYPES.TOWN.id:
      mapOptions.terrainDistribution = {
        [CELL_TYPES.GRASS.id]: 0.7,
        [CELL_TYPES.TOWN.id]: 0.2,
        [CELL_TYPES.FOREST.id]: 0.05,
        [CELL_TYPES.WATER.id]: 0.05,
      };
      break;
    case REGION_TYPES.FOREST.id:
      mapOptions.terrainDistribution = {
        [CELL_TYPES.GRASS.id]: 0.3,
        [CELL_TYPES.FOREST.id]: 0.6,
        [CELL_TYPES.WATER.id]: 0.05,
        [CELL_TYPES.MOUNTAIN.id]: 0.05,
      };
      break;
    case REGION_TYPES.MOUNTAIN.id:
      mapOptions.terrainDistribution = {
        [CELL_TYPES.GRASS.id]: 0.15,
        [CELL_TYPES.MOUNTAIN.id]: 0.7,
        [CELL_TYPES.FOREST.id]: 0.1,
        [CELL_TYPES.WATER.id]: 0.05,
      };
      break;
    case REGION_TYPES.LAKE.id:
      mapOptions.terrainDistribution = {
        [CELL_TYPES.GRASS.id]: 0.3,
        [CELL_TYPES.WATER.id]: 0.6,
        [CELL_TYPES.FOREST.id]: 0.1,
      };
      break;
    case REGION_TYPES.DESERT.id:
      mapOptions.terrainDistribution = {
        [CELL_TYPES.GRASS.id]: 0.1,
        [CELL_TYPES.MOUNTAIN.id]: 0.2,
        [CELL_TYPES.GRASS.id]: 0.7, // 注意: 这里有重复键，会覆盖之前的值
      };
      break;
    case REGION_TYPES.CAVE.id:
      mapOptions.terrainDistribution = {
        [CELL_TYPES.MOUNTAIN.id]: 0.8,
        [CELL_TYPES.WATER.id]: 0.1,
        [CELL_TYPES.GRASS.id]: 0.1,
      };
      break;
    default:
      // 默认配置
      mapOptions.terrainDistribution = {
        [CELL_TYPES.GRASS.id]: 0.5,
        [CELL_TYPES.FOREST.id]: 0.2,
        [CELL_TYPES.WATER.id]: 0.15,
        [CELL_TYPES.MOUNTAIN.id]: 0.15,
      };
  }
  
  // 生成基础地图
  return {
    rows,
    cols,
    grid: generateMapGrid(rows, cols, mapOptions),
    regionType,
    playerStartLocation: options.playerStartLocation || { row: Math.floor(rows / 2), col: Math.floor(cols / 2) }
  };
};

// 区域定义
export const WORLD_REGIONS = {
  // 中央城镇 - 玩家起始位置
  central_town: {
    id: 'central_town',
    name: '长安城',
    description: '游戏的中心城镇，各种设施齐全。',
    regionType: REGION_TYPES.TOWN.id,
    position: { x: 400, y: 300 }, // 世界地图上的坐标
    mapData: generateRegionMap(REGION_TYPES.TOWN.id, 30, 30, {
      playerStartLocation: { row: 15, col: 15 },
      seed: 12345 // 固定种子使地图生成一致
    }),
    connections: [
      { regionId: 'eastern_forest', exitPoint: { row: 15, col: 29 }, enterPoint: { row: 15, col: 0 } },
      { regionId: 'northern_mountains', exitPoint: { row: 0, col: 15 }, enterPoint: { row: 29, col: 15 } },
      { regionId: 'western_lake', exitPoint: { row: 15, col: 0 }, enterPoint: { row: 15, col: 29 } },
      { regionId: 'southern_desert', exitPoint: { row: 29, col: 15 }, enterPoint: { row: 0, col: 15 } }
    ],
    encounterConfig: {
      levelRange: { min: 1, max: 3 },
      encounterRate: 0.15, // 15% 遭遇几率
      description: '长安城郊外或治安事件',
      encounters: [
        { weight: 70, team: ['thief'], summonLevelFixed: 1 },
        { weight: 25, team: ['thief', 'thief'], summonLevelFixed: 1 },
        { weight: 5, team: ['ruffian'], summonLevelFixed: 2 },
      ],
    }
  },
  
  // 东部森林
  eastern_forest: {
    id: 'eastern_forest',
    name: '东海林区',
    description: '茂密的森林，有各种珍稀植物和动物。',
    regionType: REGION_TYPES.FOREST.id,
    position: { x: 600, y: 300 }, // 世界地图上的坐标
    mapData: generateRegionMap(REGION_TYPES.FOREST.id, 30, 30, {
      playerStartLocation: { row: 15, col: 0 }, // 玩家从西边进入
      seed: 23456
    }),
    connections: [
      { regionId: 'central_town', exitPoint: { row: 15, col: 0 }, enterPoint: { row: 15, col: 29 } },
      { regionId: 'forest_cave', exitPoint: { row: 20, col: 25 }, enterPoint: { row: 5, col: 5 } }
    ],
    encounterConfig: {
      levelRange: { min: 1, max: 5 },
      description: '新手森林外围',
      encounters: [
        { weight: 60, team: ['ghost'], summonLevelOverride: null },
        { weight: 30, team: ['ghost', 'thunderBird'], summonLevelOverride: { min: 2, max: 4 } },
        { weight: 10, team: ['catSpirit'], summonLevelFixed: 5 },
      ],
    }
  },
  
  // 北部山脉
  northern_mountains: {
    id: 'northern_mountains',
    name: '北方山脉',
    description: '陡峭的山脉，有隐藏的矿藏和危险的怪物。',
    regionType: REGION_TYPES.MOUNTAIN.id,
    position: { x: 400, y: 100 }, // 世界地图上的坐标
    mapData: generateRegionMap(REGION_TYPES.MOUNTAIN.id, 30, 30, {
      playerStartLocation: { row: 29, col: 15 }, // 玩家从南边进入
      seed: 34567
    }),
    connections: [
      { regionId: 'central_town', exitPoint: { row: 29, col: 15 }, enterPoint: { row: 0, col: 15 } }
    ],
    encounterConfig: null
  },
  
  // 西部湖泊
  western_lake: {
    id: 'western_lake',
    name: '西湖水域',
    description: '美丽的湖泊，是钓鱼和采集水生资源的好地方。',
    regionType: REGION_TYPES.LAKE.id,
    position: { x: 200, y: 300 }, // 世界地图上的坐标
    mapData: generateRegionMap(REGION_TYPES.LAKE.id, 30, 30, {
      playerStartLocation: { row: 15, col: 29 }, // 玩家从东边进入
      seed: 45678
    }),
    connections: [
      { regionId: 'central_town', exitPoint: { row: 15, col: 29 }, enterPoint: { row: 15, col: 0 } }
    ],
    encounterConfig: null
  },
  
  // 南部沙漠
  southern_desert: {
    id: 'southern_desert',
    name: '南方沙漠',
    description: '炎热的沙漠，藏有珍贵的资源和神秘遗迹。',
    regionType: REGION_TYPES.DESERT.id,
    position: { x: 400, y: 500 }, // 世界地图上的坐标
    mapData: generateRegionMap(REGION_TYPES.DESERT.id, 30, 30, {
      playerStartLocation: { row: 0, col: 15 }, // 玩家从北边进入
      seed: 56789
    }),
    connections: [
      { regionId: 'central_town', exitPoint: { row: 0, col: 15 }, enterPoint: { row: 29, col: 15 } }
    ],
    encounterConfig: {
      levelRange: { min: 6, max: 10 },
      description: '闹鬼沼泽A区',
      encounters: [
        { weight: 50, team: ['heavenGuard', 'heavenGuard'] },
        { weight: 30, team: ['vampire', 'thunderBird'], summonLevelOffset: 1 },
        { weight: 20, team: ['mechanicalBird'], summonLevelFixed: 10 },
      ],
    }
  },
  
  // 森林洞穴 - 隐藏区域
  forest_cave: {
    id: 'forest_cave',
    name: '密林洞穴',
    description: '森林深处的神秘洞穴，传说有宝藏。',
    regionType: REGION_TYPES.CAVE.id,
    position: { x: 700, y: 350 }, // 世界地图上的坐标
    mapData: generateRegionMap(REGION_TYPES.CAVE.id, 20, 20, {
      playerStartLocation: { row: 5, col: 5 },
      seed: 67890
    }),
    connections: [
      { regionId: 'eastern_forest', exitPoint: { row: 5, col: 5 }, enterPoint: { row: 20, col: 25 } }
    ],
    encounterConfig: null
  }
};

// 在地图数据中根据 connections 设置传送门
Object.values(WORLD_REGIONS).forEach(region => {
  if (region.connections && region.mapData && region.mapData.grid) {
    const { grid, rows, cols } = region.mapData;
    region.connections.forEach(connection => {
      const { exitPoint, regionId: targetRegionId, enterPoint: targetEnterPoint } = connection;
      // 确保 exitPoint 有效且在网格边界内
      if (exitPoint && 
          exitPoint.row >= 0 && exitPoint.row < rows &&
          exitPoint.col >= 0 && exitPoint.col < cols &&
          grid[exitPoint.row] && grid[exitPoint.row][exitPoint.col]) {
        
        grid[exitPoint.row][exitPoint.col].content = {
          type: TILE_CONTENT_TYPES.PORTAL,
          targetRegionId: targetRegionId,
          targetEnterPoint: targetEnterPoint,
          label: `通往 ${WORLD_REGIONS[targetRegionId]?.name || targetRegionId}` 
        };
        // 你也可以考虑在这里改变单元格的基础类型，例如：
        // grid[exitPoint.row][exitPoint.col].type = CELL_TYPES.BRIDGE.id; 
        // 但目前我们只设置 content，让渲染器处理传送门的视觉效果。
      } else {
        console.warn(`区域 ${region.id} 中通往 ${targetRegionId} 的传送门出口点无效:`, exitPoint);
      }
    });
  }
});

// 默认初始区域
export const DEFAULT_REGION_ID = 'central_town';

// 世界地图尺寸和配置
export const WORLD_MAP_CONFIG = {
  width: 800,
  height: 600,
  backgroundColor: '#1a202c',
  regionNodeSize: 60,
  lineColor: '#4a5568',
  lineWidth: 2
};

/**
 * 根据区域的遭遇配置和当前等级选择一个遭遇。
 * @param {object | null} regionEncounterConfig - 特定区域的 encounterConfig 对象，或 null。
 * @param {number} currentLevel - 当前玩家等级或区域基准等级。
 * @returns {object|null} 包含遭遇队伍信息的对象，或 null 如果没有匹配或不应遭遇。
 */
export const selectEncounterForRegion = (regionEncounterConfig, currentLevel) => {
  if (!regionEncounterConfig) {
    // console.log(`[worldMapConfig] No encounter configuration for this region.`);
    return null;
  }

  if (!regionEncounterConfig.levelRange || !regionEncounterConfig.encounters) {
    console.warn(`[worldMapConfig] Encounter configuration is malformed (missing levelRange or encounters). Region description: ${regionEncounterConfig.description}`);
    return null;
  }
  
  if (regionEncounterConfig.encounters.length === 0) {
    // console.log(`[worldMapConfig] Region configured with no encounters (e.g., towns). Description: ${regionEncounterConfig.description}`);
    return null;
  }

  if (currentLevel < regionEncounterConfig.levelRange.min || currentLevel > regionEncounterConfig.levelRange.max) {
    // console.warn(`[worldMapConfig] currentLevel ${currentLevel} is outside the configured range (${regionEncounterConfig.levelRange.min}-${regionEncounterConfig.levelRange.max}) for region: ${regionEncounterConfig.description}.`);
    return null;
  }

  const possibleEncounters = regionEncounterConfig.encounters;
  if (possibleEncounters.length === 0) {
    // This case should ideally be caught by the earlier check
    // console.warn(`[worldMapConfig] No encounters available for region: ${regionEncounterConfig.description} (after level check).`);
    return null;
  }

  const totalWeight = possibleEncounters.reduce((sum, enc) => sum + (enc.weight || 1), 0);
  if (totalWeight <= 0) {
      console.warn(`[worldMapConfig] Total weight of encounters is not positive for region: ${regionEncounterConfig.description}. Cannot select an encounter.`);
      // Fallback to the first encounter if weights are problematic but encounters exist
      return possibleEncounters.length > 0 ? { ...possibleEncounters[0] } : null;
  }
  
  let randomPick = Math.random() * totalWeight;

  for (const encounter of possibleEncounters) {
    const weight = encounter.weight || 1;
    if (randomPick < weight) {
      return { ...encounter }; // Return a copy
    }
    randomPick -= weight;
  }
  
  // Fallback: Should ideally not be reached if weights are positive and sum > 0.
  // If it is reached (e.g. floating point inaccuracies for the last item), return the last one.
  return possibleEncounters.length > 0 ? { ...possibleEncounters[possibleEncounters.length - 1] } : null;
}; 