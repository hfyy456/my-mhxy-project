// src/config/mapConfig.js
import { createNoise2D } from 'simplex-noise'; // 更新导入方式

// 定义地图单元格类型
export const CELL_TYPES = {
  EMPTY: { id: 'EMPTY', name: '虚无', movementCost: Infinity, color: '#1E293B', isWalkable: false },
  GRASS: { id: 'GRASS', name: '草地', movementCost: 1, color: '#34D399', isWalkable: true },
  WATER: { id: 'WATER', name: '水域', movementCost: Infinity, color: '#3B82F6', isWalkable: false },
  MOUNTAIN: { id: 'MOUNTAIN', name: '山脉', movementCost: 10, color: '#6B7280', isWalkable: true }, // Mountain walkable but high cost
  FOREST: { id: 'FOREST', name: '森林', movementCost: 3, color: '#10B981', isWalkable: true },
  TOWN: { id: 'TOWN', name: '城镇', movementCost: 1, color: '#D2B48C', isWalkable: true },
  BRIDGE: { id: 'BRIDGE', name: '桥', movementCost: 1, color: '#A0522D', isWalkable: true },
};

export const TILE_CONTENT_TYPES = {
  EMPTY: null, // Explicitly define EMPTY content type if needed, though null serves well
  NPC: 'NPC',
  MONSTER: 'MONSTER',
  RESOURCE: 'RESOURCE',
  PORTAL: 'PORTAL', // Example for future use
};

// Example Data Definitions (can be expanded and moved to separate files later)
export const npcs = {
  npc_001: { 
    id: 'npc_001', 
    name: '老村长', 
    sprite: 'elder.png', // Placeholder sprite
    dialogueKey: 'elder_welcome', // Key for uiTextConfig or other dialogue system
    questsToStart: ['quest_001'],
  },
  npc_002: { id: 'npc_002', name: '铁匠铺老板', sprite: 'blacksmith.png', dialogueKey: 'blacksmith_services' },
};

export const monsters = {
  monster_001: {
    id: 'monster_001',
    name: '野狼',
    sprite: 'wolf.png',
    stats: { hp: 50, attack: 8, defense: 3, speed: 10 },
    lootTable: [ { itemId: 'item_wolf_pelt', chance: 0.5, quantity: 1 } ]
  },
  monster_002: { id: 'monster_002', name: '史莱姆', sprite: 'slime.png', stats: { hp: 20, attack: 3, defense: 1, speed: 5 } },
};

export const resources = {
  res_001: {
    id: 'res_001',
    name: '铁矿脉',
    sprite: 'iron_vein.png',
    itemIdYield: 'item_iron_ore', // ID of the item obtained
    quantityPerGather: [1, 3], // Min-max quantity
    gatherTimeSeconds: 5,
    requiredToolType: 'pickaxe', // Optional: type of tool needed
  },
  res_002: { id: 'res_002', name: '草药丛', sprite: 'herb_bush.png', itemIdYield: 'item_healing_herb', quantityPerGather: [1,2], gatherTimeSeconds: 2 },
};

// 地图视口和UI相关配置
export const MAP_VIEW_CONFIG = {
  VIEWPORT_CELL_COUNT_TARGET: 15,
  VIEWPORT_EDGE_BUFFER_CELLS: 2,
  DEFAULT_CELL_SIZE: 40,
  TITLE_SECTION_HEIGHT_ESTIMATE: 60,
};

// --- 新的地图生成逻辑 ---
const defaultMapRows = 50;
const defaultMapCols = 50;

// 创建 2D 噪声函数实例 (暂时不使用种子)
const baseNoise2D = createNoise2D(); 

// 噪声生成函数，使用 simplex-noise
function generateFractalNoise(x, y, scale, octaves, persistence, lacunarity) {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0; 

  for (let i = 0; i < octaves; i++) {
    // baseNoise2D 返回 -1 到 1
    total += baseNoise2D(x * frequency / scale, y * frequency / scale) * amplitude;
    
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  return (total / maxValue + 1) / 2; // 映射到 [0, 1]
}

const noiseScale = 70; 
const generatedMapGrid = [];

// 1. 生成基础地形
for (let i = 0; i < defaultMapRows; i++) {
  const row = [];
  for (let j = 0; j < defaultMapCols; j++) {
    const noiseValue = generateFractalNoise(j, i, noiseScale, 4, 0.5, 2.0);

    let cellType;
    if (noiseValue < 0.33) {        
      cellType = CELL_TYPES.WATER.id;
    } else if (noiseValue < 0.38) { 
      cellType = CELL_TYPES.GRASS.id; 
    } else if (noiseValue < 0.65) {  
      cellType = CELL_TYPES.GRASS.id;
    } else if (noiseValue < 0.80) {  
      cellType = CELL_TYPES.FOREST.id;
    } else {                         
      cellType = CELL_TYPES.MOUNTAIN.id;
    }
    row.push({ type: cellType });
  }
  generatedMapGrid.push(row);
}

// 2. 放置城镇 (逻辑与之前类似)
const townSize = 5;
const townSearchRadius = 15; 
let townPlaced = false;
let idealTownCenterX = Math.floor(defaultMapCols / 2);
let idealTownCenterY = Math.floor(defaultMapRows / 2);

for (let r = 0; r <= townSearchRadius && !townPlaced; r++) {
  for (let dy = -r; dy <= r && !townPlaced; dy++) {
    for (let dx = -r; dx <= r && !townPlaced; dx++) {
      if (r > 0 && Math.abs(dx) < r && Math.abs(dy) < r) continue;

      let currentCenterX = idealTownCenterX + dx;
      let currentCenterY = idealTownCenterY + dy;

      if (currentCenterX - Math.floor(townSize / 2) < 0 || currentCenterX + Math.floor(townSize / 2) >= defaultMapCols || 
          currentCenterY - Math.floor(townSize / 2) < 0 || currentCenterY + Math.floor(townSize / 2) >= defaultMapRows) {
        continue;
      }
      
      const townStartX = Math.max(0, currentCenterX - Math.floor(townSize / 2));
      const townEndX = Math.min(defaultMapCols - 1, currentCenterX + Math.floor(townSize / 2));
      const townStartY = Math.max(0, currentCenterY - Math.floor(townSize / 2));
      const townEndY = Math.min(defaultMapRows - 1, currentCenterY + Math.floor(townSize / 2));

      let suitableArea = true;
      let flatLandCount = 0;
      for (let y = townStartY; y <= townEndY; y++) {
        for (let x = townStartX; x <= townEndX; x++) {
          const cell = generatedMapGrid[y][x];
          if (cell.type === CELL_TYPES.WATER.id || cell.type === CELL_TYPES.MOUNTAIN.id) {
            suitableArea = false;
            break;
          }
          if (cell.type === CELL_TYPES.GRASS.id || cell.type === CELL_TYPES.EMPTY.id || cell.type === CELL_TYPES.FOREST.id) {
            flatLandCount++;
          }
        }
        if (!suitableArea) break;
      }

      if (suitableArea && flatLandCount >= (townSize * townSize * 0.5)) { 
        for (let y = townStartY; y <= townEndY; y++) {
          for (let x = townStartX; x <= townEndX; x++) {
            generatedMapGrid[y][x] = { type: CELL_TYPES.TOWN.id };
          }
        }
        townPlaced = true;
        idealTownCenterX = currentCenterX;
        idealTownCenterY = currentCenterY;
      }
    }
  }
}

if (!townPlaced) {
    generatedMapGrid[Math.floor(defaultMapRows/2)][Math.floor(defaultMapCols/2)] = { type: CELL_TYPES.TOWN.id, content: null }; // Initialize content as null
    idealTownCenterX = Math.floor(defaultMapCols/2);
    idealTownCenterY = Math.floor(defaultMapRows/2);
}

// 3. Initialize content for all cells and place some example content
for (let i = 0; i < defaultMapRows; i++) {
  for (let j = 0; j < defaultMapCols; j++) {
    if (!generatedMapGrid[i][j].content) { // Ensure content property exists
        generatedMapGrid[i][j].content = null;
    }
  }
}

// Place an NPC (e.g., 老村长 in town or nearby grass)
let npcPlaced = false;
for (let r = 0; r < 5 && !npcPlaced; r++) { // Search in a small radius around town center
    for (let dy = -r; dy <= r && !npcPlaced; dy++) {
        for (let dx = -r; dx <= r && !npcPlaced; dx++) {
            const y = idealTownCenterY + dy;
            const x = idealTownCenterX + dx;
            if (y >= 0 && y < defaultMapRows && x >= 0 && x < defaultMapCols) {
                const cell = generatedMapGrid[y][x];
                if ((cell.type === CELL_TYPES.TOWN.id || cell.type === CELL_TYPES.GRASS.id) && !cell.content) {
                    cell.content = { type: TILE_CONTENT_TYPES.NPC, id: 'npc_001' };
                    npcPlaced = true;
                }
            }
        }
    }
}
if (!npcPlaced && generatedMapGrid[idealTownCenterY][idealTownCenterX]) { // Fallback to town center
    generatedMapGrid[idealTownCenterY][idealTownCenterX].content = { type: TILE_CONTENT_TYPES.NPC, id: 'npc_001' };
}


// Place a Monster (e.g., 野狼 in a forest or grass patch not too close to town)
let monsterPlaced = false;
for (let i = 0; i < 50 && !monsterPlaced; i++) { // Try 50 random spots
    const randRow = Math.floor(Math.random() * defaultMapRows);
    const randCol = Math.floor(Math.random() * defaultMapCols);
    const cell = generatedMapGrid[randRow][randCol];
    // Avoid placing on town, water, mountains, or cells already with content
    if (cell.type !== CELL_TYPES.TOWN.id && 
        cell.type !== CELL_TYPES.WATER.id && 
        cell.type !== CELL_TYPES.MOUNTAIN.id &&
        !cell.content) {
        // Prefer forest, then grass
        if (cell.type === CELL_TYPES.FOREST.id || cell.type === CELL_TYPES.GRASS.id) {
            cell.content = { type: TILE_CONTENT_TYPES.MONSTER, id: 'monster_001' };
            monsterPlaced = true;
        }
    }
}

// Place a Resource (e.g., 铁矿脉 on a mountain or non-town grass/forest)
let resourcePlaced = false;
for (let i = 0; i < 50 && !resourcePlaced; i++) { // Try 50 random spots
    const randRow = Math.floor(Math.random() * defaultMapRows);
    const randCol = Math.floor(Math.random() * defaultMapCols);
    const cell = generatedMapGrid[randRow][randCol];
    if (cell.type !== CELL_TYPES.TOWN.id && 
        cell.type !== CELL_TYPES.WATER.id && // Avoid water for mines
        !cell.content) {
        // Prefer mountain, then forest/grass
        if (cell.type === CELL_TYPES.MOUNTAIN.id || cell.type === CELL_TYPES.FOREST.id || cell.type === CELL_TYPES.GRASS.id) {
             cell.content = { type: TILE_CONTENT_TYPES.RESOURCE, id: 'res_001' };
             resourcePlaced = true;
        }
    }
}

export const initialMapData = {
  rows: defaultMapRows,
  cols: defaultMapCols,
  grid: generatedMapGrid,
  playerStartLocation: { row: idealTownCenterY, col: idealTownCenterX }, 
};

// 也可以在这里定义一些地图相关的辅助函数，例如获取特定单元格数据等 