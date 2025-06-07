import { CELL_TYPES, TILE_CONTENT_TYPES, generateMapGrid } from './mapConfig';
import worldMapData from './worldMapConfig.json';

// 交互类型定义
export const NODE_INTERACTION_TYPES = {
  NPC: { id: 'NPC', name: 'NPC对话', icon: '💬', color: '#10B981' },
  EVENT: { id: 'EVENT', name: '触发事件', icon: '⚡', color: '#F59E0B' },
  BATTLE: { id: 'BATTLE', name: '进入战斗', icon: '⚔️', color: '#EF4444' },
  DUNGEON: { id: 'DUNGEON', name: '副本挑战', icon: '🏰', color: '#8B5CF6' },
  QUEST: { id: 'QUEST', name: '任务委托', icon: '📋', color: '#3B82F6' },
  SHOP: { id: 'SHOP', name: '商店购买', icon: '🛒', color: '#6B7280' },
  TELEPORT: { id: 'TELEPORT', name: '传送点', icon: '✨', color: '#EC4899' }
};

// 解锁条件类型
export const UNLOCK_CONDITION_TYPES = {
  LEVEL: 'level',           // 等级要求
  QUEST: 'quest',          // 任务完成
  ITEM: 'item',            // 道具持有
  REGION: 'region',        // 其他区域访问
  NODE: 'node',            // 其他节点完成
  STORY: 'story'           // 剧情进度
};

// 处理交互类型转换的辅助函数
const convertInteractionTypes = (regions) => {
  const converted = JSON.parse(JSON.stringify(regions)); // 深拷贝
  
  Object.keys(converted).forEach(regionKey => {
    const region = converted[regionKey];
    if (region.nodes) {
      Object.keys(region.nodes).forEach(nodeKey => {
        const node = region.nodes[nodeKey];
        if (node.interactions) {
          node.interactions.forEach(interaction => {
            // 将字符串类型转换为对象引用
            if (typeof interaction.type === 'string') {
              const typeObj = NODE_INTERACTION_TYPES[interaction.type];
              if (typeObj) {
                interaction.type = typeObj.id;
              }
            }
          });
        }
        
        // 处理解锁条件类型转换
        if (node.unlockConditions) {
          node.unlockConditions.forEach(condition => {
            if (typeof condition.type === 'string') {
              condition.type = UNLOCK_CONDITION_TYPES[condition.type.toUpperCase()] || condition.type;
            }
          });
        }
      });
    }
    
    // 处理区域级别的解锁条件
    if (region.unlockConditions) {
      region.unlockConditions.forEach(condition => {
        if (typeof condition.type === 'string') {
          condition.type = UNLOCK_CONDITION_TYPES[condition.type.toUpperCase()] || condition.type;
      }
    });
  }
});
  
  return converted;
};

// 世界地图区域定义 - 从JSON导入并处理
export const WORLD_REGIONS = convertInteractionTypes(worldMapData);

// 默认初始区域
export const DEFAULT_REGION_ID = 'nanzhan_region';

// 世界地图配置
export const WORLD_MAP_CONFIG = {
  width: 800,
  height: 600,
  backgroundColor: '#0f1419',
  regionNodeSize: 80,
  regionBorderColor: '#4a5568',
  regionBorderWidth: 3,
  regionSelectedColor: '#fbbf24',
  regionLockedColor: '#6b7280',
  regionUnlockedColor: '#10b981',
  textColor: '#ffffff',
  textShadowColor: '#000000'
};

// 区域详情视图配置
export const REGION_DETAIL_CONFIG = {
  width: 600,
  height: 400,
  backgroundColor: '#1a202c',
  nodeSize: 50,
  nodeBorderWidth: 2,
  connectionLineColor: '#4a5568',
  connectionLineWidth: 2,
  textColor: '#ffffff'
};

// 检查解锁条件的辅助函数
export const checkUnlockConditions = (conditions, gameState) => {
  if (!conditions || conditions.length === 0) return true;
  
  return conditions.every(condition => {
    switch (condition.type) {
      case UNLOCK_CONDITION_TYPES.LEVEL:
        return gameState.playerLevel >= condition.value;
      
      case UNLOCK_CONDITION_TYPES.QUEST:
        return gameState.completedQuests?.includes(condition.questId);
      
      case UNLOCK_CONDITION_TYPES.ITEM:
        const item = gameState.inventory?.find(item => item.id === condition.itemId);
        return item && item.amount >= condition.amount;
      
      case UNLOCK_CONDITION_TYPES.REGION:
        return gameState.unlockedRegions?.includes(condition.regionId);
      
      case UNLOCK_CONDITION_TYPES.NODE:
        const nodeKey = `${condition.regionId || 'current'}_${condition.nodeId}_${condition.interactionId || 'visited'}`;
        return gameState.completedNodes?.includes(nodeKey);
      
      case UNLOCK_CONDITION_TYPES.STORY:
        return gameState.storyProgress >= condition.value;
      
      default:
        return false;
    }
  });
};

// 获取节点状态
export const getNodeStatus = (regionId, nodeId, gameState) => {
  const region = WORLD_REGIONS[regionId];
  if (!region) return 'locked';
  
  const node = region.nodes[nodeId];
  if (!node) return 'locked';
  
  // 检查区域是否解锁
  if (!checkUnlockConditions(region.unlockConditions, gameState)) {
    return 'region_locked';
  }
  
  // 检查节点是否解锁
  if (!checkUnlockConditions(node.unlockConditions, gameState)) {
    return 'locked';
  }
  
  // 检查是否已完成
  const completedKey = `${regionId}_${nodeId}`;
  if (gameState.completedNodes?.includes(completedKey)) {
    return 'completed';
  }
  
  return 'unlocked';
};

// 获取可用的交互选项
export const getAvailableInteractions = (nodeData, gameState) => {
  if (!nodeData || !nodeData.interactions) return [];
  
  return nodeData.interactions.filter(interaction => {
    // 这里可以添加更复杂的交互可用性逻辑
    // 比如检查交互的解锁条件等
    
    // 检查等级要求
    if (interaction.levelRequirement && gameState.playerLevel < interaction.levelRequirement) {
      return false;
    }
    
    // 检查解锁条件
    if (interaction.unlockConditions) {
      return checkUnlockConditions(interaction.unlockConditions, gameState);
    }
    
    return true;
  });
};

// 为了向后兼容，添加selectEncounterForRegion函数
// 从新的节点系统中获取战斗配置
export const selectEncounterForRegion = (regionId, playerLevel) => {
  const region = WORLD_REGIONS[regionId];
  
  if (!region) {
    console.warn(`[selectEncounterForRegion] Region ${regionId} not found`);
    return null;
  }

  // 收集所有可用的战斗交互
  const battleInteractions = [];
  Object.values(region.nodes).forEach(node => {
    if (node.interactions) {
      node.interactions.forEach(interaction => {
        if (interaction.type === NODE_INTERACTION_TYPES.BATTLE.id) {
          // 检查等级要求
          if (interaction.levelRange) {
            if (playerLevel >= interaction.levelRange.min && playerLevel <= interaction.levelRange.max) {
              battleInteractions.push(interaction);
            }
          } else {
            battleInteractions.push(interaction);
          }
        }
      });
    }
  });
  
  if (battleInteractions.length === 0) {
    console.warn(`[selectEncounterForRegion] No suitable battles found for region ${regionId} at level ${playerLevel}`);
    return null;
  }

  // 随机选择一个战斗
  const selectedBattle = battleInteractions[Math.floor(Math.random() * battleInteractions.length)];
  
  // 转换为旧系统期望的格式
  return {
    id: selectedBattle.battleId,
    name: selectedBattle.name,
    description: selectedBattle.description,
    team: selectedBattle.enemyTeam || [],
    difficulty: selectedBattle.difficulty || 'normal',
    // 根据难度设置等级调整
    summonLevelOffset: getDifficultyLevelOffset(selectedBattle.difficulty),
    minLevel: selectedBattle.levelRange?.min || 1,
    maxLevel: selectedBattle.levelRange?.max || playerLevel + 5
  };
};

// 根据难度获取等级偏移
const getDifficultyLevelOffset = (difficulty) => {
  switch (difficulty) {
    case 'easy': return -2;
    case 'normal': return 0;
    case 'hard': return 2;
    case 'boss': return 5;
    case 'legendary': return 8;
    case 'extreme': return 10;
    default: return 0;
  }
}; 