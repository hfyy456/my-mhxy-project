# NPC面向对象配置化系统

## 🎯 系统概述

这是一个完整的NPC面向对象配置化系统，核心特性是**无位置概念**，NPC可以动态分配到不同场景（副本、节点、任务、家园）中使用。

### 核心设计原则
- **面向对象编程**：完整的OOP架构，支持继承、封装、多态
- **数据与逻辑分离**：配置数据与业务逻辑完全分离
- **无位置概念**：NPC不绑定到固定位置，可动态分配
- **场景配置化**：支持副本、节点、任务、家园四种场景类型
- **事件驱动**：基于事件系统的状态管理和通信

## 📦 系统架构

```
src/
├── entities/
│   └── Npc.js                           # NPC实体类
├── store/managers/
│   └── NpcManager.js                    # NPC管理器
├── config/character/
│   └── npcTemplatesConfig.js            # NPC模板配置
├── hooks/
│   └── useNpcManager.js                 # React Hook
├── features/npc/components/
│   └── NpcOOPDemo.jsx                   # 演示组件
└── config/
    └── enumConfig.js                    # 枚举配置
```

## 🔧 核心组件

### 1. NPC实体类 (`src/entities/Npc.js`)

完整的NPC类实现，包含以下核心功能：

```javascript
class Npc extends EventEmitter {
  constructor(data = {}) {
    // 基础属性、外观、类型、状态
    // 对话系统、功能配置、关联数据
    // 场景分配、动态属性、条件限制
    // 行为配置、元数据
  }
  
  // 场景分配方法
  assignToDungeon(dungeonId, role)     // 分配到副本
  assignToNode(nodeId, role)           // 分配到节点
  assignToQuest(questId, role)         // 分配到任务
  assignToHomestead(homesteadId, role) // 分配到家园
  
  // 对话系统
  startDialogue(interactionId)         // 开始对话
  endDialogue()                        // 结束对话
  selectDialogueOption(option)         // 选择对话选项
  
  // 状态管理
  setState(newState)                   // 设置状态
  updateAttribute(name, value, op)     // 更新属性
  canInteract(player)                  // 检查交互条件
}
```

### 2. NPC管理器 (`src/store/managers/NpcManager.js`)

负责NPC的生命周期管理和场景分配：

```javascript
class NpcManager extends EventEmitter {
  // 模板管理
  registerTemplate(templateId, data)   // 注册模板
  registerTemplates(templatesData)     // 批量注册
  
  // NPC实例管理
  createNpc(templateId, overrides)     // 创建NPC
  removeNpc(npcId)                     // 删除NPC
  getNpc(npcId)                        // 获取NPC
  getAllNpcs()                         // 获取所有NPC
  
  // 场景分配管理
  assignNpcToDungeon(npcId, dungeonId, role)
  assignNpcToNode(npcId, nodeId, role)
  assignNpcToQuest(npcId, questId, role)
  assignNpcToHomestead(npcId, homesteadId, role)
  
  // 查询方法
  getNpcsInDungeon(dungeonId)          // 获取副本中的NPC
  getNpcsInNode(nodeId)                // 获取节点中的NPC
  getNpcsInQuest(questId)              // 获取任务相关NPC
  getNpcInHomestead(homesteadId)       // 获取家园中的NPC
  
  // 交互管理
  startInteraction(npcId, playerId)    // 开始交互
  endInteraction(interactionId)        // 结束交互
}
```

### 3. React Hook (`src/hooks/useNpcManager.js`)

提供React组件的NPC系统集成：

```javascript
const {
  // 状态
  npcs, templates, statistics, activeInteractions,
  isInitialized, error,
  
  // NPC管理
  createNpc, removeNpc, getNpc, getNpcsByType,
  
  // 场景分配
  assignNpcToDungeon, assignNpcToNode,
  assignNpcToQuest, assignNpcToHomestead,
  
  // 查询方法
  getNpcsInDungeon, getNpcsInNode,
  getNpcsInQuest, getNpcInHomestead,
  
  // 交互管理
  startInteraction, endInteraction,
  
  // 批量操作
  createNpcsFromTemplates, resetAllNpcs
} = useNpcManager();
```

## 📋 配置系统

### NPC模板配置 (`src/config/character/npcTemplatesConfig.js`)

```javascript
export const npcTemplates = {
  village_elder: {
    templateId: "village_elder",
    name: "老村长",
    type: NPC_TYPES.QUEST_GIVER,
    level: 10,
    
    // 功能配置
    functions: {
      canGiveQuests: true,
      canTrade: false,
      canTeach: false
    },
    
    // 动态属性
    attributes: {
      friendliness: 80,
      reputation: 100,
      trust: 90
    },
    
    // 条件限制
    conditions: {
      levelRequirement: 1,
      questRequirements: [],
      itemRequirements: []
    }
  }
};
```

### 场景专用模板

```javascript
// 副本专用NPC
export const dungeonNpcTemplates = {
  dungeon_guide: { /* ... */ },
  dungeon_merchant: { /* ... */ }
};

// 家园专用NPC
export const homesteadNpcTemplates = {
  house_keeper: { /* ... */ },
  gardener: { /* ... */ }
};
```

## 🎮 使用示例

### 1. 基础使用

```javascript
import { useNpcManager } from '@/hooks/useNpcManager';

function MyComponent() {
  const { 
    createNpc, 
    assignNpcToDungeon, 
    getNpcsInDungeon 
  } = useNpcManager();
  
  // 创建NPC
  const handleCreateNpc = () => {
    const npc = createNpc('village_elder', {
      name: '特殊村长',
      level: 15
    });
    console.log('创建NPC:', npc);
  };
  
  // 分配到副本
  const handleAssignToDungeon = (npcId) => {
    const success = assignNpcToDungeon(npcId, 'dungeon_001', 'guide');
    console.log('分配结果:', success);
  };
  
  // 查询副本中的NPC
  const handleQueryDungeon = () => {
    const npcs = getNpcsInDungeon('dungeon_001');
    console.log('副本中的NPC:', npcs);
  };
  
  return (
    <div>
      <button onClick={handleCreateNpc}>创建NPC</button>
      {/* ... */}
    </div>
  );
}
```

### 2. 场景分配示例

```javascript
// 分配NPC到不同场景
const npcId = 'npc_12345';

// 分配到副本（作为向导）
assignNpcToDungeon(npcId, 'dungeon_fire_cave', 'guide');

// 分配到节点（作为守卫）
assignNpcToNode(npcId, 'node_village_entrance', 'guard');

// 分配到任务（作为任务发布者）
assignNpcToQuest(npcId, 'quest_save_princess', 'questgiver');

// 分配到家园（作为管家）
assignNpcToHomestead(npcId, 'homestead_player_house', 'housekeeper');
```

### 3. 查询场景中的NPC

```javascript
// 查询不同场景中的NPC
const dungeonNpcs = getNpcsInDungeon('dungeon_fire_cave');
const nodeNpcs = getNpcsInNode('node_village_entrance');
const questNpcs = getNpcsInQuest('quest_save_princess');
const homesteadNpc = getNpcInHomestead('homestead_player_house');

console.log('副本NPC:', dungeonNpcs);
console.log('节点NPC:', nodeNpcs);
console.log('任务NPC:', questNpcs);
console.log('家园NPC:', homesteadNpc);
```

### 4. 批量操作

```javascript
// 批量创建NPC
const batchConfigs = [
  { templateId: 'village_elder', count: 1 },
  { templateId: 'blacksmith', count: 1 },
  { templateId: 'city_guard', count: 3 }
];

const createdNpcs = createNpcsFromTemplates(batchConfigs);
console.log('批量创建完成:', createdNpcs);
```

## 🔄 事件系统

NPC系统使用事件驱动架构，支持以下事件：

```javascript
// NPC生命周期事件
manager.on('npc_created', (data) => { /* ... */ });
manager.on('npc_removed', (data) => { /* ... */ });

// 场景分配事件
manager.on('npc_assigned_to_dungeon', (data) => { /* ... */ });
manager.on('npc_assigned_to_node', (data) => { /* ... */ });
manager.on('npc_assigned_to_quest', (data) => { /* ... */ });
manager.on('npc_assigned_to_homestead', (data) => { /* ... */ });

// 交互事件
manager.on('npc_dialogue_started', (data) => { /* ... */ });
manager.on('npc_dialogue_ended', (data) => { /* ... */ });
manager.on('npc_state_changed', (data) => { /* ... */ });
```

## 🎯 核心特性

### ✅ 无位置概念
- NPC对象不包含位置信息
- 通过场景分配系统动态管理位置关系
- 支持一个NPC分配到多个场景

### ✅ 场景配置化
- **副本**: 支持多个NPC，适用于副本向导、商人等
- **节点**: 支持多个NPC，适用于关卡守卫、引导等
- **任务**: 支持多个NPC，适用于任务相关角色
- **家园**: 支持单个NPC，适用于管家、园丁等

### ✅ 完整的OOP设计
- 继承：基于EventEmitter的事件系统
- 封装：私有属性和方法保护
- 多态：不同类型NPC的行为差异

### ✅ 配置驱动
- 基于模板的创建机制
- 灵活的属性覆盖系统
- 分场景的专用配置

## 🚀 演示组件

运行 `NpcOOPDemo` 组件来体验完整功能：

```javascript
import NpcOOPDemo from '@/features/npc/components/NpcOOPDemo';

function App() {
  const [showDemo, setShowDemo] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowDemo(true)}>
        打开NPC系统演示
      </button>
      
      {showDemo && (
        <NpcOOPDemo onClose={() => setShowDemo(false)} />
      )}
    </div>
  );
}
```

演示组件包含四个功能模块：
1. **概览** - 系统统计和状态
2. **NPC管理** - 创建、删除、列表管理
3. **场景分配** - 分配NPC到不同场景
4. **NPC详情** - 查看NPC的完整信息

## 📈 扩展指南

### 添加新的NPC类型

1. 在 `enumConfig.js` 中添加新类型：
```javascript
export const NPC_TYPES = {
  // 现有类型...
  BANKER: 'banker',        // 新增银行家类型
  AUCTIONEER: 'auctioneer' // 新增拍卖师类型
};
```

2. 在 `npcTemplatesConfig.js` 中添加模板：
```javascript
export const npcTemplates = {
  // 现有模板...
  banker: {
    templateId: "banker",
    name: "银行家",
    type: NPC_TYPES.BANKER,
    functions: {
      canTrade: false,
      canBank: true // 新功能
    }
  }
};
```

### 添加新的场景类型

1. 在NPC类中添加新的分配方法：
```javascript
// Npc.js
assignToMarket(marketId, role = "vendor") {
  if (!this.assignments.markets) {
    this.assignments.markets = [];
  }
  if (!this.assignments.markets.includes(marketId)) {
    this.assignments.markets.push(marketId);
    this.emit("assigned_to_market", { npcId: this.id, marketId, role });
  }
}
```

2. 在管理器中添加对应方法：
```javascript
// NpcManager.js
assignNpcToMarket(npcId, marketId, role = "vendor") {
  const npc = this.getNpc(npcId);
  if (!npc) return false;
  
  npc.assignToMarket(marketId, role);
  
  if (!this.assignmentIndex.markets) {
    this.assignmentIndex.markets = new Map();
  }
  if (!this.assignmentIndex.markets.has(marketId)) {
    this.assignmentIndex.markets.set(marketId, new Set());
  }
  this.assignmentIndex.markets.get(marketId).add(npcId);
  
  return true;
}
```

## 🔧 最佳实践

1. **模板设计**：为不同场景设计专用模板
2. **事件监听**：使用事件系统进行解耦通信
3. **批量操作**：大量NPC操作时使用批量接口
4. **错误处理**：始终检查操作结果和错误状态
5. **性能优化**：合理使用缓存和索引查询

这个NPC系统提供了完整的面向对象配置化解决方案，支持灵活的场景分配和强大的扩展能力。 