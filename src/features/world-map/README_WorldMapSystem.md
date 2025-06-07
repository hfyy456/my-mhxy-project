# 世界地图系统 - 区域节点架构

## 概述

新的世界地图系统采用了分层结构，包含**区域选择**和**节点交互**两个主要层级，为梦幻西游类型的游戏提供丰富的探索体验。

## 系统架构

### 1. 配置层 (`worldMapConfig.js`)

#### 交互类型定义
```javascript
export const NODE_INTERACTION_TYPES = {
  NPC: { id: 'NPC', name: 'NPC对话', icon: '💬', color: '#10B981' },
  EVENT: { id: 'EVENT', name: '触发事件', icon: '⚡', color: '#F59E0B' },
  BATTLE: { id: 'BATTLE', name: '进入战斗', icon: '⚔️', color: '#EF4444' },
  DUNGEON: { id: 'DUNGEON', name: '副本挑战', icon: '🏰', color: '#8B5CF6' },
  QUEST: { id: 'QUEST', name: '任务委托', icon: '📋', color: '#3B82F6' },
  SHOP: { id: 'SHOP', name: '商店购买', icon: '🛒', color: '#6B7280' },
  TELEPORT: { id: 'TELEPORT', name: '传送点', icon: '✨', color: '#EC4899' }
};
```

#### 解锁条件类型
```javascript
export const UNLOCK_CONDITION_TYPES = {
  LEVEL: 'level',           // 等级要求
  QUEST: 'quest',          // 任务完成
  ITEM: 'item',            // 道具持有
  REGION: 'region',        // 其他区域访问
  NODE: 'node',            // 其他节点完成
  STORY: 'story'           // 剧情进度
};
```

### 2. 组件层

#### WorldMapController
- **功能**: 主控制器，管理整个世界地图的状态和流程
- **职责**: 
  - 视图切换（世界地图 ↔ 区域详情）
  - 交互处理协调
  - 状态同步

#### WorldMapSelector
- **功能**: 世界地图区域选择界面
- **特性**:
  - Canvas绘制的地图界面
  - 区域解锁状态可视化
  - 实时等级和条件检查
  - 交互式区域选择

#### RegionDetailView
- **功能**: 区域内节点详情界面
- **特性**:
  - 节点状态管理（锁定/解锁/完成）
  - 交互选项展示
  - 实时交互执行

### 3. 逻辑层 (`NodeInteractionHandler`)

#### 交互处理系统
```javascript
// 支持的交互类型处理
- handleNpcInteraction()      // NPC对话
- handleEventInteraction()    // 随机事件
- handleBattleInteraction()   // 战斗启动
- handleDungeonInteraction()  // 副本挑战
- handleQuestInteraction()    // 任务接受
- handleShopInteraction()     // 商店交易
- handleTeleportInteraction() // 传送服务
```

### 4. 状态管理 (`mapSlice.js`)

#### 核心状态
```javascript
{
  currentRegionId: 'nanzhan_region',
  unlockedRegions: ['nanzhan_region'],
  completedNodes: ['nanzhan_region_changan_city'],
  nodeInteractionHistory: [...],
  regionProgress: {
    nanzhan_region: {
      completedNodes: 1,
      totalNodes: 3,
      completionRate: 33.33
    }
  }
}
```

## 使用指南

### 1. 基本使用

```jsx
import WorldMapModal from '@/features/world-map/components/WorldMapModal';

function GameScreen() {
  const [showWorldMap, setShowWorldMap] = useState(false);
  
  const showToast = (message, type) => {
    // 你的toast实现
  };

  return (
    <div>
      <button onClick={() => setShowWorldMap(true)}>
        打开世界地图
      </button>
      
      <WorldMapModal
        isOpen={showWorldMap}
        onClose={() => setShowWorldMap(false)}
        showToast={showToast}
      />
    </div>
  );
}
```

### 2. 添加新区域

在 `worldMapConfig.js` 中添加：

```javascript
new_region: {
  id: 'new_region',
  name: '新区域',
  description: '区域描述',
  position: { x: 300, y: 400 },
  levelRequirement: 15,
  unlockConditions: [
    { type: UNLOCK_CONDITION_TYPES.LEVEL, value: 15 },
    { type: UNLOCK_CONDITION_TYPES.QUEST, questId: 'prerequisite_quest' }
  ],
  nodes: {
    new_node: {
      id: 'new_node',
      name: '新节点',
      description: '节点描述',
      position: { x: 150, y: 100 },
      levelRequirement: 15,
      unlockConditions: [],
      interactions: [
        {
          id: 'npc_interaction',
          type: NODE_INTERACTION_TYPES.NPC.id,
          name: 'NPC名称',
          description: '交互描述',
          npcId: 'npc_id',
          rewards: [{ type: 'exp', amount: 100 }]
        }
      ]
    }
  }
}
```

### 3. 自定义交互处理

扩展 `NodeInteractionHandler`:

```javascript
// 添加新的交互类型处理
async handleCustomInteraction(interaction) {
  // 自定义逻辑
  const result = await customLogic(interaction);
  
  if (result.success) {
    this.showToast('交互成功', 'success');
    return {
      success: true,
      type: 'custom',
      message: result.message,
      rewards: result.rewards
    };
  }
  
  return { success: false, message: result.error };
}
```

## 数据结构

### 区域数据结构
```typescript
interface Region {
  id: string;
  name: string;
  description: string;
  backgroundImage?: string;
  position: { x: number; y: number };
  levelRequirement: number;
  unlockConditions: UnlockCondition[];
  isUnlocked: boolean;
  nodes: { [nodeId: string]: Node };
}
```

### 节点数据结构
```typescript
interface Node {
  id: string;
  name: string;
  description: string;
  position: { x: number; y: number };
  levelRequirement: number;
  unlockConditions: UnlockCondition[];
  isUnlocked: boolean;
  interactions: Interaction[];
}
```

### 交互数据结构
```typescript
interface Interaction {
  id: string;
  type: string;
  name: string;
  description: string;
  [key: string]: any; // 特定交互类型的额外属性
  rewards?: Reward[];
}
```

## 特性亮点

### 1. 渐进式解锁
- 基于等级、任务、道具等多种条件
- 动态解锁检查
- 可视化解锁状态

### 2. 丰富的交互类型
- 7种不同的交互类型
- 可扩展的交互系统
- 统一的交互处理流程

### 3. 进度跟踪
- 区域完成度统计
- 节点交互历史
- 整体游戏进度

### 4. 用户体验优化
- 流畅的视图切换
- 实时状态反馈
- 直观的视觉设计

### 5. 开发友好
- 模块化架构
- 易于扩展
- 完善的类型定义

## 集成示例

### 与战斗系统集成
```javascript
async handleBattleInteraction(interaction) {
  // 启动战斗系统
  this.dispatch(initiateBattleAction({
    battleId: interaction.battleId,
    enemyTeam: interaction.enemyTeam,
    difficulty: interaction.difficulty,
    source: 'world_map_node'
  }));
  
  return {
    success: true,
    type: 'battle',
    message: `开始战斗: ${interaction.name}`
  };
}
```

### 与任务系统集成
```javascript
async handleQuestInteraction(interaction) {
  this.dispatch(acceptQuestAction({ 
    questId: interaction.questId, 
    source: 'world_map_node' 
  }));
  
  return {
    success: true,
    type: 'quest',
    message: `已接受任务: ${interaction.name}`,
    questId: interaction.questId
  };
}
```

## 调试和开发

### 开发模式功能
- 节点状态可视化
- 交互历史记录
- 实时进度查看
- 条件检查调试

### 常用调试命令
```javascript
// 解锁所有区域
dispatch(initializeMapProgressAction({ 
  playerLevel: 999, 
  completedQuests: [], 
  inventory: [] 
}));

// 重置地图进度
dispatch(resetMapProgressAction());

// 强制完成节点
dispatch(completeNodeAction({ 
  regionId: 'region_id', 
  nodeId: 'node_id' 
}));
```

## 扩展建议

1. **添加地图背景图片支持**
2. **实现区域间的传送动画**
3. **增加成就系统集成**
4. **支持多人协作节点**
5. **添加随机事件节点**
6. **实现季节性/时间性内容**

这个世界地图系统为游戏提供了一个强大而灵活的探索框架，支持复杂的游戏逻辑和丰富的玩家体验。 