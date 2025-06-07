# 副本系统 (Dungeon System)

基于二叉树结构的事件选择系统，参考《杀戮尖塔》的游戏机制，使用面向对象编程设计。

## 🌟 系统特性

- **二叉树结构**: 每个节点都有两个选择分支，形成丰富的决策路径
- **面向对象设计**: 清晰的类继承和封装，易于扩展和维护
- **多种事件类型**: 战斗、宝藏、休息、商人、精英怪、Boss等
- **实时进度跟踪**: 显示冒险历程和完成进度
- **动态难度调整**: 根据深度和玩家等级调整事件难度

## 📁 项目结构

```
src/features/dungeon/
├── classes/                    # 核心类文件
│   ├── DungeonEvent.js        # 事件基类和各种事件类型
│   ├── DungeonTree.js         # 二叉树结构和节点管理
│   └── DungeonManager.js      # 副本管理器和玩家状态
├── components/                 # React组件
│   ├── DungeonEntrance.jsx    # 副本入口界面
│   ├── DungeonGameplay.jsx    # 副本游戏界面
│   ├── DungeonMain.jsx        # 主组件
│   └── DungeonTreeVisualization.jsx  # 树形可视化
├── DungeonDemo.jsx            # 演示页面
├── index.js                   # 导出文件
└── README.md                  # 说明文档
```

## 🎮 核心类说明

### DungeonEvent (事件基类)
- **功能**: 定义事件的基本结构和行为
- **子类**: BattleEvent, TreasureEvent, RestEvent, MerchantEvent等
- **特性**: 支持要求检查、结果处理、奖励发放

### DungeonTree (副本树)
- **功能**: 管理二叉树结构，生成事件路径
- **特性**: 递归生成分支、选择处理、进度跟踪

### DungeonManager (副本管理器)
- **功能**: 统一管理副本实例和玩家状态
- **特性**: 模板管理、状态持久化、事件调度

### PlayerState (玩家状态)
- **功能**: 管理玩家的属性和状态
- **特性**: 属性计算、升级处理、状态快照

## 🚀 使用方法

### 1. 基本使用

```jsx
import { DungeonMain } from './features/dungeon';

function App() {
  return <DungeonMain />;
}
```

### 2. 自定义副本模板

```javascript
import { DungeonManager, BattleEvent } from './features/dungeon';

const manager = new DungeonManager();

// 注册自定义副本模板
manager.registerDungeonTemplate('custom_dungeon', {
  id: 'custom_dungeon',
  name: '自定义副本',
  description: '你的专属冒险',
  difficulty: 2,
  maxDepth: 6,
  levelRequirement: 3,
  eventPool: [
    // 自定义事件配置
  ],
  bossEvent: new BattleEvent({
    id: 'custom_boss',
    name: '自定义Boss',
    // ... 更多配置
  })
});
```

### 3. 创建自定义事件

```javascript
import { DungeonEvent, EVENT_TYPES } from './features/dungeon';

class CustomEvent extends DungeonEvent {
  constructor(config) {
    super({
      ...config,
      type: EVENT_TYPES.MYSTERY,
      icon: '🌟'
    });
  }

  execute(playerState, choice) {
    // 自定义事件逻辑
    return super.execute(playerState, choice);
  }
}
```

## 🎯 事件类型

| 类型 | 图标 | 描述 | 特性 |
|------|------|------|------|
| battle | ⚔️ | 战斗事件 | 模拟战斗，给予经验和奖励 |
| treasure | 💰 | 宝藏事件 | 获得金币或物品 |
| rest | 🛌 | 休息事件 | 恢复生命值 |
| merchant | 🛒 | 商人事件 | 购买物品和装备 |
| boss | 👑 | Boss战 | 高难度战斗，丰厚奖励 |
| elite | 🔥 | 精英怪 | 中等难度，平衡风险收益 |
| mystery | ❓ | 神秘事件 | 随机效果，可能是祝福或诅咒 |
| random | ❓ | 随机事件 | 各种意外情况 |

## 🔧 配置选项

### 副本模板配置
```javascript
{
  id: 'dungeon_id',                    // 副本唯一标识
  name: '副本名称',                     // 显示名称
  description: '副本描述',              // 描述文本
  difficulty: 1,                       // 难度等级 (1-10)
  maxDepth: 10,                        // 最大深度
  levelRequirement: 1,                 // 等级要求
  eventPool: [],                       // 事件池
  bossEvent: null                      // Boss事件
}
```

### 事件配置
```javascript
{
  id: 'event_id',                      // 事件唯一标识
  name: '事件名称',                     // 显示名称
  description: '事件描述',              // 描述文本
  type: EVENT_TYPES.BATTLE,            // 事件类型
  rarity: EVENT_RARITIES.COMMON,       // 稀有度
  icon: '⚔️',                          // 显示图标
  requirements: [],                    // 触发要求
  consequences: {}                     // 事件结果
}
```

## 📊 统计和监控

系统提供丰富的统计功能：

- **实时进度**: 当前深度、完成百分比
- **路径历史**: 记录所有选择和结果
- **玩家状态**: 生命值、等级、金币等
- **副本统计**: 总节点数、已完成节点等

## 🎨 界面特性

- **响应式设计**: 适配各种屏幕尺寸
- **美观动画**: 流畅的过渡效果
- **直观图标**: 清晰的视觉指示
- **状态反馈**: 实时的操作反馈

## 🚀 快速开始

1. **导入组件**:
   ```jsx
   import DungeonDemo from './features/dungeon/DungeonDemo.jsx';
   ```

2. **渲染演示**:
   ```jsx
   <DungeonDemo />
   ```

3. **开始游戏**: 选择副本 → 做出选择 → 探索冒险！

## 🔮 扩展可能

系统设计支持以下扩展：

- **更多事件类型**: 谜题、陷阱、NPC对话等
- **物品系统**: 装备、消耗品、技能书等
- **技能系统**: 主动技能、被动效果等
- **存档功能**: 保存和加载游戏进度
- **多人模式**: 团队副本和竞技模式
- **成就系统**: 解锁条件和奖励机制

这个副本系统为游戏提供了丰富的PvE内容，通过二叉树结构确保每次游戏都有不同的体验！ 