# 📱 玩家信息系统

## 概述

本系统专为**没有角色，只控制召唤兽**的游戏设计，提供完整的玩家状态管理、进度追踪和个性化设置功能。

## 🎯 核心特点

- **召唤师定位**: 玩家作为召唤师控制多个召唤兽
- **等级系统**: 召唤师等级决定可拥有的召唤兽数量和能力
- **成就系统**: 记录玩家的游戏成就和里程碑
- **资源管理**: 金币、背包容量等资源的统一管理
- **游戏偏好**: 个性化设置和游戏体验优化

## 📁 文件结构

```
src/features/player/
├── components/
│   ├── PlayerInfo.jsx           # 主要玩家信息界面
│   ├── PlayerSettings.jsx       # 游戏设置界面
│   └── PlayerAchievements.jsx   # 成就系统界面
├── hooks/
│   └── usePlayerManager.js      # 玩家管理核心Hook
└── README_PlayerSystem.md       # 本文档
```

## 🔧 核心Hook

### usePlayerManager()

主要的玩家管理Hook，提供所有玩家相关的状态和操作。

```javascript
import { usePlayerManager } from '@/hooks/usePlayerManager';

const MyComponent = () => {
  const {
    // 基础状态
    level,                    // 当前等级
    experience,               // 当前经验
    statistics,               // 统计数据
    achievements,             // 已解锁成就
    error,                    // 错误信息
    
    // 计算属性
    levelInfo,                // 等级详细信息
    summonStats,              // 召唤兽统计
    inventoryStats,           // 背包统计
    achievementSystem,        // 成就系统信息
    playerCapabilities,       // 玩家能力限制
    
    // 操作方法
    gainExperience,           // 获得经验
    updateStats,              // 更新统计
    unlockAchievement,        // 解锁成就
    resetProgress,            // 重置进度
    clearError                // 清除错误
  } = usePlayerManager();
};
```

### 专门化Hook

```javascript
// 等级管理
import { usePlayerLevel } from '@/hooks/usePlayerManager';
const { level, experience, levelInfo, gainExperience } = usePlayerLevel();

// 成就管理
import { usePlayerAchievements } from '@/hooks/usePlayerManager';
const { unlocked, available, unlockAchievement } = usePlayerAchievements();

// 统计数据
import { usePlayerStatistics } from '@/hooks/usePlayerManager';
const { statistics, formatTime, getStatDisplayName } = usePlayerStatistics();

// 召唤兽管理限制
import { usePlayerSummonManagement } from '@/hooks/usePlayerManager';
const { maxSummons, canSummonMore, totalPower } = usePlayerSummonManagement();
```

## 📊 数据结构

### 玩家状态 (Redux playerSlice)

```javascript
{
  level: 1,                    // 召唤师等级
  experience: 0,               // 当前经验值
  maxSummons: 10,              // 最大召唤兽数量
  maxInventorySlots: 10,       // 最大背包容量
  achievements: [],            // 已解锁成就列表
  statistics: {                // 统计数据
    totalRefinements: 0,       // 炼妖次数
    totalSkillBooks: 0,        // 打书次数
    totalEquipmentObtained: 0  // 装备获得数量
  }
}
```

### 等级信息

```javascript
levelInfo: {
  currentLevel: 5,             // 当前等级
  currentExp: 1200,            // 当前经验
  expToNextLevel: 300,         // 升级所需经验
  progressPercentage: 80,      // 进度百分比
  isMaxLevel: false,           // 是否满级
  canLevelUp: false            // 是否可以升级
}
```

### 召唤兽统计

```javascript
summonStats: {
  slots: {
    used: 3,                   // 已使用召唤兽槽位
    max: 10,                   // 最大槽位
    available: 7,              // 可用槽位
    percentage: 30             // 使用率
  },
  total: 3,                    // 总召唤兽数量
  qualityStats: {              // 品质统计
    normal: 1,
    rare: 2
  },
  totalPower: 15000,           // 总战力
  averageLevel: 25,            // 平均等级
  strongest: {...}             // 最强召唤兽
}
```

## 🎮 组件使用

### PlayerInfo 组件

```javascript
import { PlayerInfo } from '@/features/player/components/PlayerInfo';

// 在模态框或页面中使用
<PlayerInfo />
```

功能：
- 显示召唤师等级和经验
- 召唤兽队伍状态
- 图鉴收集进度
- 资源状态（金币、背包）
- 成就进度
- 召唤师能力展示

### PlayerSettings 组件

```javascript
import { PlayerSettings } from '@/features/player/components/PlayerSettings';

<PlayerSettings />
```

功能：
- 显示设置（伤害数字、动画等）
- 游戏偏好（自动选择、确认提示等）
- 数据管理（重置、备份）

### PlayerAchievements 组件

```javascript
import { PlayerAchievements } from '@/features/player/components/PlayerAchievements';

<PlayerAchievements />
```

功能：
- 成就分类显示
- 解锁状态和进度
- 奖励信息
- 一键解锁可达成成就

## ⚡ 集成示例

### 在主游戏页面中集成

```javascript
import { useAppModals } from '@/hooks/useAppModals';
import { PlayerInfo } from '@/features/player/components/PlayerInfo';

const GamePage = () => {
  const { isPlayerInfoOpen, setIsPlayerInfoOpen } = useAppModals();
  
  return (
    <>
      {/* 玩家信息按钮 */}
      <button onClick={() => setIsPlayerInfoOpen(true)}>
        <i className="fas fa-user-circle"></i>
        召唤师信息
      </button>
      
      {/* 玩家信息模态框 */}
      <CommonModal
        isOpen={isPlayerInfoOpen}
        onClose={() => setIsPlayerInfoOpen(false)}
        title="召唤师信息"
      >
        <PlayerInfo />
      </CommonModal>
    </>
  );
};
```

### 在战斗系统中使用

```javascript
import { usePlayerManager } from '@/hooks/usePlayerManager';

const BattleReward = ({ experienceGained }) => {
  const { gainExperience, levelInfo } = usePlayerManager();
  
  useEffect(() => {
    if (experienceGained > 0) {
      gainExperience(experienceGained);
    }
  }, [experienceGained]);
  
  return (
    <div>
      <p>获得经验: {experienceGained}</p>
      {levelInfo.canLevelUp && (
        <p className="text-yellow-400">可以升级！</p>
      )}
    </div>
  );
};
```

### 能力检查

```javascript
const SummonCreationButton = () => {
  const { playerCapabilities } = usePlayerManager();
  
  return (
    <button 
      disabled={!playerCapabilities.canSummonMore}
      className={playerCapabilities.canSummonMore ? 'enabled' : 'disabled'}
    >
      {playerCapabilities.canSummonMore ? '召唤新召唤兽' : '召唤兽槽位已满'}
    </button>
  );
};
```

## 🔄 状态同步

系统自动与以下模块同步：

1. **召唤兽系统** (`useSummonManager`): 召唤兽数量、战力统计
2. **背包系统** (`useInventoryManager`): 金币、容量使用
3. **Redux Store**: 等级、经验、成就数据

## 📈 扩展指南

### 添加新的统计数据

1. 更新 `playerConfig.js` 中的 `statisticsConfig`
2. 在相关业务逻辑中调用 `updateStats()`
3. 在 `PlayerInfo` 组件中添加显示

### 添加新成就

1. 在 `playerConfig.js` 的 `achievementConfig.list` 中添加
2. 设置触发条件和奖励
3. 系统会自动检测并提示解锁

### 自定义玩家能力

修改 `playerBaseConfig` 中的等级限制配置，系统会自动应用新的能力限制。

## 🐛 调试功能

开发模式下可以使用以下功能：

```javascript
// 测试经验获得
gainExperience(100);

// 手动解锁成就
unlockAchievement('first_refinement');

// 重置玩家进度（谨慎使用）
resetProgress();
```

## 📱 移动端适配

所有组件都使用响应式设计，在移动设备上自动调整布局：

- 使用 `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` 进行响应式网格
- 模态框在小屏幕上全屏显示
- 触摸友好的按钮尺寸

## 🎨 主题定制

玩家系统使用统一的设计系统：

- **主色调**: 蓝色系 (`text-blue-400`)
- **成功色**: 绿色系 (`text-green-400`)
- **警告色**: 黄色系 (`text-yellow-400`)
- **错误色**: 红色系 (`text-red-400`)
- **中性色**: 灰色系 (`text-slate-400`)

## 📋 最佳实践

1. **性能优化**: 使用 `useMemo` 和 `useCallback` 优化重复计算
2. **错误处理**: 始终检查 `error` 状态并提供用户友好的错误信息
3. **用户体验**: 提供加载状态和操作反馈
4. **数据持久化**: 重要操作后自动保存到 localStorage
5. **可访问性**: 使用语义化的HTML和ARIA标签

---

*本系统完全融入游戏的"召唤师控制召唤兽"设定，为玩家提供丰富的成长体验和个性化选项。* 