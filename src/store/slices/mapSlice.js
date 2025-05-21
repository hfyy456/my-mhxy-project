import { createSlice } from '@reduxjs/toolkit';
import { initialMapData } from '@/config/mapConfig'; // 导入默认地图数据
import { WORLD_REGIONS, DEFAULT_REGION_ID } from '@/config/worldMapConfig'; // 导入世界地图配置

// Helper function to get initial player position from mapConfig
const getInitialPlayerPosition = () => {
  // 如果使用世界地图，从当前区域获取初始位置
  if (WORLD_REGIONS && WORLD_REGIONS[DEFAULT_REGION_ID]) {
    const regionData = WORLD_REGIONS[DEFAULT_REGION_ID];
    const { playerStartLocation } = regionData.mapData;
    return playerStartLocation;
  }
  
  // 否则使用旧的默认地图数据
  const { rows, cols, playerStartLocation } = initialMapData;
  if (playerStartLocation === 'center') {
    return { row: Math.floor(rows / 2), col: Math.floor(cols / 2) };
  }
  if (
    typeof playerStartLocation === 'object' &&
    playerStartLocation !== null &&
    typeof playerStartLocation.row === 'number' &&
    typeof playerStartLocation.col === 'number'
  ) {
    return { row: playerStartLocation.row, col: playerStartLocation.col };
  }
  // Default fallback to center if config is incorrect
  console.warn(
    'Invalid playerStartLocation in mapConfig for mapSlice, defaulting to center.'
  );
  return { row: Math.floor(rows / 2), col: Math.floor(cols / 2) };
};

// 获取当前区域的地图数据
const getCurrentRegionMapData = (regionId = DEFAULT_REGION_ID) => {
  if (WORLD_REGIONS && WORLD_REGIONS[regionId]) {
    return WORLD_REGIONS[regionId].mapData;
  }
  return initialMapData;
};

const initialState = {
  currentRegionId: DEFAULT_REGION_ID, // 当前区域ID
  playerPosition: getInitialPlayerPosition(),
  selectedTileCoordinates: null, // { row: number, col: number } | null
  regionsDiscovered: [DEFAULT_REGION_ID], // 已发现的区域
  portalMarkers: [], // 用于在地图上标记传送点
  isWorldMapOpen: false, // 是否打开世界地图
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setPlayerPositionAction: (state, action) => {
      // Payload should be { row: number, col: number }
      if (
        action.payload &&
        typeof action.payload.row === 'number' &&
        typeof action.payload.col === 'number'
      ) {
        state.playerPosition = action.payload;
        
        // 检查玩家是否位于区域边界，尝试进行区域切换
        const currentRegion = WORLD_REGIONS[state.currentRegionId];
        if (currentRegion && currentRegion.connections) {
          for (const connection of currentRegion.connections) {
            const { regionId, exitPoint } = connection;
            if (
              action.payload.row === exitPoint.row && 
              action.payload.col === exitPoint.col
            ) {
              // 找到匹配的出口点，切换区域
              state.currentRegionId = regionId;
              
              // 设置进入新区域的位置
              const newRegion = WORLD_REGIONS[regionId];
              if (newRegion) {
                for (const conn of newRegion.connections) {
                  if (conn.regionId === currentRegion.id) {
                    // 找到返回当前区域的连接
                    state.playerPosition = conn.exitPoint;
                    break;
                  }
                }
              }
              
              // 标记该区域为已发现
              if (!state.regionsDiscovered.includes(regionId)) {
                state.regionsDiscovered.push(regionId);
              }
              
              break;
            }
          }
        }
      } else {
        console.error('Invalid payload for setPlayerPositionAction:', action.payload);
      }
    },
    
    setSelectedTileCoordinatesAction: (state, action) => {
      // Payload can be { row: number, col: number } or null to deselect
      if (action.payload === null) {
        state.selectedTileCoordinates = null;
      } else if (
        action.payload &&
        typeof action.payload.row === 'number' &&
        typeof action.payload.col === 'number'
      ) {
        state.selectedTileCoordinates = action.payload;
      } else {
        console.error(
          'Invalid payload for setSelectedTileCoordinatesAction:',
          action.payload
        );
      }
    },
    
    changeRegionAction: (state, action) => {
      // Payload should be { regionId: string, enterPoint?: { row: number, col: number } }
      if (action.payload && action.payload.regionId && WORLD_REGIONS[action.payload.regionId]) {
        const newRegionId = action.payload.regionId;
        state.currentRegionId = newRegionId;
        
        // 设置玩家位置
        if (action.payload.enterPoint) {
          state.playerPosition = action.payload.enterPoint;
        } else {
          // 使用区域默认的玩家起始位置
          state.playerPosition = WORLD_REGIONS[newRegionId].mapData.playerStartLocation;
        }
        
        // 标记该区域为已发现
        if (!state.regionsDiscovered.includes(newRegionId)) {
          state.regionsDiscovered.push(newRegionId);
        }
      } else {
        console.error('Invalid payload for changeRegionAction:', action.payload);
      }
    },
    
    setWorldMapOpenAction: (state, action) => {
      state.isWorldMapOpen = !!action.payload;
    },
    
    addPortalMarkerAction: (state, action) => {
      // Payload should be { position: { row, col }, targetRegionId: string, label: string }
      if (
        action.payload && 
        action.payload.position && 
        action.payload.targetRegionId && 
        WORLD_REGIONS[action.payload.targetRegionId]
      ) {
        state.portalMarkers.push({
          id: `portal_${Date.now()}`,
          position: action.payload.position,
          targetRegionId: action.payload.targetRegionId,
          label: action.payload.label || WORLD_REGIONS[action.payload.targetRegionId].name
        });
      }
    },
    
    removePortalMarkerAction: (state, action) => {
      // Payload should be { id: string } or { position: { row, col } }
      if (action.payload.id) {
        state.portalMarkers = state.portalMarkers.filter(marker => marker.id !== action.payload.id);
      } else if (action.payload.position) {
        const { row, col } = action.payload.position;
        state.portalMarkers = state.portalMarkers.filter(
          marker => marker.position.row !== row || marker.position.col !== col
        );
      }
    }
  },
});

export const { 
  setPlayerPositionAction, 
  setSelectedTileCoordinatesAction,
  changeRegionAction,
  setWorldMapOpenAction,
  addPortalMarkerAction,
  removePortalMarkerAction
} = mapSlice.actions;

// Selectors
export const selectPlayerPosition = (state) => state.map.playerPosition;
export const selectSelectedTileCoordinates = (state) => state.map.selectedTileCoordinates;
export const selectCurrentRegionId = (state) => state.map.currentRegionId;
export const selectRegionsDiscovered = (state) => state.map.regionsDiscovered;
export const selectIsWorldMapOpen = (state) => state.map.isWorldMapOpen;
export const selectPortalMarkers = (state) => state.map.portalMarkers;

// 选择当前区域的地图数据
export const selectCurrentRegionMapData = (state) => {
  const regionId = state.map.currentRegionId;
  return getCurrentRegionMapData(regionId);
};

export default mapSlice.reducer; 