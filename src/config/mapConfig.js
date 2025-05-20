// src/config/mapConfig.js

// 定义地图单元格类型
export const CELL_TYPES = {
  GRASS: { name: '草地', id: 'GRASS', movementCost: 1 },
  WATER: { name: '水域', id: 'WATER', movementCost: Infinity }, // 不可通行或高消耗
  MOUNTAIN: { name: '山脉', id: 'MOUNTAIN', movementCost: Infinity }, // 不可通行或高消耗
  FOREST: { name: '森林', id: 'FOREST', movementCost: 2 },
  EMPTY: { name: '空地', id: 'EMPTY', movementCost: 1 },
};

// 示例地图数据
// 每一行代表地图的一行，每个对象代表一个单元格
// 'type' 字段表示地形类型
// 可以根据需要添加更多属性，例如：
//   - resources: [{ type: 'wood', amount: 10 }]
//   - event: 'ENCOUNTER_MONSTER'
//   - isExplored: false
const mapGrid = [
  // Row 0
  [
    { type: CELL_TYPES.MOUNTAIN.id }, { type: CELL_TYPES.MOUNTAIN.id }, { type: CELL_TYPES.FOREST.id }, { type: CELL_TYPES.GRASS.id }, { type: CELL_TYPES.GRASS.id }, 
    { type: CELL_TYPES.GRASS.id }, { type: CELL_TYPES.WATER.id }, { type: CELL_TYPES.WATER.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id },
    { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id },
    { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id },
  ],
  // Row 1
  [
    { type: CELL_TYPES.MOUNTAIN.id }, { type: CELL_TYPES.FOREST.id }, { type: CELL_TYPES.FOREST.id }, { type: CELL_TYPES.GRASS.id }, { type: CELL_TYPES.WATER.id }, 
    { type: CELL_TYPES.WATER.id }, { type: CELL_TYPES.WATER.id }, { type: CELL_TYPES.GRASS.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id },
    { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id },
    { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id },
  ],
  // Row 2
  [
    { type: CELL_TYPES.GRASS.id }, { type: CELL_TYPES.GRASS.id }, { type: CELL_TYPES.GRASS.id }, { type: CELL_TYPES.GRASS.id }, { type: CELL_TYPES.GRASS.id }, 
    { type: CELL_TYPES.GRASS.id }, { type: CELL_TYPES.GRASS.id }, { type: CELL_TYPES.GRASS.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id },
    { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id },
    { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id }, { type: CELL_TYPES.EMPTY.id },
  ],
  // ... (可以根据 mapRows 和 mapCols 填充更多行)
  // 为了简洁，这里只定义了前3行，其余用 EMPTY 填充
];

// 默认地图尺寸 (与 GameMap.jsx 中的一致，可以考虑后续统一管理)
const defaultMapRows = 15;
const defaultMapCols = 20;

// 填充剩余的地图数据
for (let i = mapGrid.length; i < defaultMapRows; i++) {
  const row = [];
  for (let j = 0; j < defaultMapCols; j++) {
    // 随机分配一些基本地形，或者默认为 EMPTY
    // if (mapGrid[i-1] && mapGrid[i-1][j] && Math.random() < 0.7) {
    //   row.push({ type: mapGrid[i-1][j].type }); // 尝试延续上一行的地形
    // } else {
      const randomTypeKey = ['GRASS', 'FOREST', 'EMPTY'][Math.floor(Math.random() * 3)];
      row.push({ type: CELL_TYPES[randomTypeKey].id });
    // }
  }
  mapGrid.push(row);
}

// 确保列数也一致
for (let i = 0; i < defaultMapRows; i++) {
  if (!mapGrid[i]) mapGrid[i] = [];
  for (let j = mapGrid[i].length; j < defaultMapCols; j++) {
    mapGrid[i].push({ type: CELL_TYPES.EMPTY.id });
  }
}


export const initialMapData = {
  rows: defaultMapRows,
  cols: defaultMapCols,
  grid: mapGrid,
};

// 也可以在这里定义一些地图相关的辅助函数，例如获取特定单元格数据等 