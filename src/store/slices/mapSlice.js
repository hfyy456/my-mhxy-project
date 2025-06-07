import { createSlice } from '@reduxjs/toolkit';
import { initialMapData } from '@/config/map/mapConfig'; // 导入默认地图数据
import { WORLD_REGIONS, DEFAULT_REGION_ID, checkUnlockConditions } from '@/config/map/worldMapConfig'; // 导入世界地图配置

// Helper function to get initial player position from mapConfig
const getInitialPlayerPosition = () => {
  // 对于新的世界地图系统，使用默认的网格位置
  // 因为新系统不再使用传统的网格地图，而是基于节点的
  if (WORLD_REGIONS && WORLD_REGIONS[DEFAULT_REGION_ID]) {
    const regionData = WORLD_REGIONS[DEFAULT_REGION_ID];
    
    // 检查是否有mapData（向后兼容）
    if (regionData.mapData && regionData.mapData.playerStartLocation) {
      return regionData.mapData.playerStartLocation;
    }
    
    // 新系统：返回一个默认的网格位置
    // 这主要用于向后兼容需要网格位置的组件
    return { row: 15, col: 15 }; // 默认中心位置
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
  // 当前区域相关
  currentRegionId: DEFAULT_REGION_ID,
  
  // 解锁状态
  unlockedRegions: [DEFAULT_REGION_ID], // 已解锁的区域
  completedNodes: [], // 已完成的节点 (格式: "regionId_nodeId")
  nodeInteractionHistory: [], // 节点交互历史
  
  // UI状态
  isWorldMapOpen: false,
  currentMapView: 'world_map', // 'world_map' | 'region_detail'
  selectedRegionForDetail: null,
  
  // 进度跟踪
  regionProgress: {}, // 各区域的完成进度
  totalNodesCompleted: 0,
  
  // 玩家偏好
  lastVisitedRegion: DEFAULT_REGION_ID,
  favoriteNodes: [], // 收藏的节点
  
  // 为了向后兼容，保留玩家位置概念
  playerPosition: getInitialPlayerPosition(),
  
  // 选中的tile坐标（用于显示tile信息面板）
  selectedTileCoordinates: null,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    // 区域相关操作
    unlockRegionAction: (state, action) => {
      const { regionId } = action.payload;
      if (WORLD_REGIONS[regionId] && !state.unlockedRegions.includes(regionId)) {
        state.unlockedRegions.push(regionId);
      }
    },

    setCurrentRegionAction: (state, action) => {
      const { regionId } = action.payload;
      if (WORLD_REGIONS[regionId] && state.unlockedRegions.includes(regionId)) {
        state.currentRegionId = regionId;
        state.lastVisitedRegion = regionId;
      }
    },

    // 节点相关操作
    completeNodeAction: (state, action) => {
      const { regionId, nodeId, interactionId } = action.payload;
      const nodeKey = `${regionId}_${nodeId}`;
      const interactionKey = `${nodeKey}_${interactionId}`;
      
      // 添加到已完成节点
      if (!state.completedNodes.includes(nodeKey)) {
        state.completedNodes.push(nodeKey);
        state.totalNodesCompleted += 1;
      }
      
      // 更新区域进度
      if (!state.regionProgress[regionId]) {
        state.regionProgress[regionId] = {
          completedNodes: 0,
          totalNodes: Object.keys(WORLD_REGIONS[regionId]?.nodes || {}).length,
          completionRate: 0
        };
      }
      
      const regionProg = state.regionProgress[regionId];
      const completedInRegion = state.completedNodes.filter(node => 
        node.startsWith(`${regionId}_`)
      ).length;
      
      regionProg.completedNodes = completedInRegion;
      regionProg.completionRate = regionProg.totalNodes > 0 ? 
        (completedInRegion / regionProg.totalNodes) * 100 : 0;
    },

    addNodeInteractionHistoryAction: (state, action) => {
      const { regionId, nodeId, interaction, result, timestamp } = action.payload;
      
      state.nodeInteractionHistory.push({
        regionId,
        nodeId,
        interaction,
        result,
        timestamp: timestamp || Date.now()
      });

      // 保持历史记录在合理范围内（最多500条）
      if (state.nodeInteractionHistory.length > 500) {
        state.nodeInteractionHistory = state.nodeInteractionHistory.slice(-500);
      }
    },

    // UI状态管理
    setWorldMapOpenAction: (state, action) => {
      state.isWorldMapOpen = !!action.payload;
    },

    setMapViewAction: (state, action) => {
      const { view, regionId = null } = action.payload;
      state.currentMapView = view;
      if (view === 'region_detail' && regionId) {
        state.selectedRegionForDetail = regionId;
      } else if (view === 'world_map') {
        state.selectedRegionForDetail = null;
      }
    },

    // 玩家偏好
    addFavoriteNodeAction: (state, action) => {
      const { regionId, nodeId } = action.payload;
      const favoriteKey = `${regionId}_${nodeId}`;
      
      if (!state.favoriteNodes.includes(favoriteKey)) {
        state.favoriteNodes.push(favoriteKey);
      }
    },

    removeFavoriteNodeAction: (state, action) => {
      const { regionId, nodeId } = action.payload;
      const favoriteKey = `${regionId}_${nodeId}`;
      
      state.favoriteNodes = state.favoriteNodes.filter(fav => fav !== favoriteKey);
    },

    // 批量操作
    initializeMapProgressAction: (state, action) => {
      const { playerLevel, completedQuests, inventory } = action.payload;
      
      // 根据游戏状态计算应该解锁的区域
      const gameState = {
        playerLevel,
        completedQuests: completedQuests || [],
        inventory: inventory || [],
        unlockedRegions: state.unlockedRegions,
        completedNodes: state.completedNodes,
        storyProgress: 0
      };

      Object.values(WORLD_REGIONS).forEach(region => {
        const shouldUnlock = checkUnlockConditions(region.unlockConditions, gameState) &&
                           playerLevel >= region.levelRequirement;
        
        if (shouldUnlock && !state.unlockedRegions.includes(region.id)) {
          state.unlockedRegions.push(region.id);
        }
      });

      // 初始化区域进度
      Object.values(WORLD_REGIONS).forEach(region => {
        if (!state.regionProgress[region.id]) {
          state.regionProgress[region.id] = {
            completedNodes: 0,
            totalNodes: Object.keys(region.nodes || {}).length,
            completionRate: 0
          };
        }
      });
    },

    resetMapProgressAction: (state) => {
      // 保留基础解锁的区域
      state.unlockedRegions = [DEFAULT_REGION_ID];
      state.completedNodes = [];
      state.nodeInteractionHistory = [];
      state.regionProgress = {};
      state.totalNodesCompleted = 0;
      state.favoriteNodes = [];
      state.currentRegionId = DEFAULT_REGION_ID;
      state.lastVisitedRegion = DEFAULT_REGION_ID;
    },

    // 为了向后兼容，添加玩家位置管理
    setPlayerPositionAction: (state, action) => {
      const { row, col, regionId } = action.payload;
      state.playerPosition = { row, col };
      
      // 如果提供了regionId，也更新当前区域
      if (regionId && WORLD_REGIONS[regionId] && state.unlockedRegions.includes(regionId)) {
        state.currentRegionId = regionId;
        state.lastVisitedRegion = regionId;
      }
    },

    // 为了向后兼容，添加区域切换功能
    changeRegionAction: (state, action) => {
      const { regionId, enterPoint } = action.payload;
      
      if (WORLD_REGIONS[regionId] && state.unlockedRegions.includes(regionId)) {
        state.currentRegionId = regionId;
        state.lastVisitedRegion = regionId;
        
        // 如果提供了enterPoint，更新玩家位置
        if (enterPoint && typeof enterPoint.row === 'number' && typeof enterPoint.col === 'number') {
          state.playerPosition = { row: enterPoint.row, col: enterPoint.col };
        } else {
          // 使用区域的默认起始位置
          const regionData = WORLD_REGIONS[regionId];
          if (regionData.mapData && regionData.mapData.playerStartLocation) {
            state.playerPosition = regionData.mapData.playerStartLocation;
          }
        }
      }
    },

    // tile选择相关
    setSelectedTileCoordinatesAction: (state, action) => {
      state.selectedTileCoordinates = action.payload;
    }
  },
});

export const { 
  unlockRegionAction,
  setCurrentRegionAction,
  completeNodeAction,
  addNodeInteractionHistoryAction,
  setWorldMapOpenAction,
  setMapViewAction,
  addFavoriteNodeAction,
  removeFavoriteNodeAction,
  initializeMapProgressAction,
  resetMapProgressAction,
  setPlayerPositionAction,
  changeRegionAction,
  setSelectedTileCoordinatesAction
} = mapSlice.actions;

// Selectors
export const selectCurrentRegionId = (state) => state.map.currentRegionId;
export const selectUnlockedRegions = (state) => state.map.unlockedRegions;
export const selectCompletedNodes = (state) => state.map.completedNodes;
export const selectNodeInteractionHistory = (state) => state.map.nodeInteractionHistory;
export const selectIsWorldMapOpen = (state) => state.map.isWorldMapOpen;
export const selectCurrentMapView = (state) => state.map.currentMapView;
export const selectSelectedRegionForDetail = (state) => state.map.selectedRegionForDetail;
export const selectRegionProgress = (state) => state.map.regionProgress;
export const selectTotalNodesCompleted = (state) => state.map.totalNodesCompleted;
export const selectLastVisitedRegion = (state) => state.map.lastVisitedRegion;
export const selectFavoriteNodes = (state) => state.map.favoriteNodes;

// 复合选择器
export const selectRegionProgressByRegionId = (regionId) => (state) => 
  state.map.regionProgress[regionId] || {
    completedNodes: 0,
    totalNodes: Object.keys(WORLD_REGIONS[regionId]?.nodes || {}).length,
    completionRate: 0
  };

export const selectIsNodeCompleted = (regionId, nodeId) => (state) => 
  state.map.completedNodes.includes(`${regionId}_${nodeId}`);

export const selectIsNodeFavorite = (regionId, nodeId) => (state) => 
  state.map.favoriteNodes.includes(`${regionId}_${nodeId}`);

export const selectOverallProgress = (state) => {
  const totalNodes = Object.values(WORLD_REGIONS).reduce((total, region) => 
    total + Object.keys(region.nodes || {}).length, 0
  );
  
  return totalNodes > 0 ? (state.map.totalNodesCompleted / totalNodes) * 100 : 0;
};

export const selectAvailableRegions = (state, gameState) => {
  return Object.values(WORLD_REGIONS).filter(region => {
    return checkUnlockConditions(region.unlockConditions, gameState) &&
           gameState.playerLevel >= region.levelRequirement;
  });
};

export const selectPlayerPosition = (state) => state.map.playerPosition;
export const selectSelectedTileCoordinates = (state) => state.map.selectedTileCoordinates;

// 获取当前区域的地图数据
export const selectCurrentRegionMapData = (state) => {
  const currentRegionId = state.map.currentRegionId;
  return getCurrentRegionMapData(currentRegionId);
};

export default mapSlice.reducer; 