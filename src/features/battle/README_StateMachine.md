# 战斗系统状态机重构指南

## 概述

基于现有的战斗系统、技能配置和BUFF系统，我们实现了一个**分层状态机 (Hierarchical State Machine)**来重构战斗系统。这个状态机提供了更清晰的状态管理、更好的可维护性和更强的扩展性。

## 状态机架构

### 主要特点

1. **分层设计**：主状态和子状态的层次结构
2. **事件驱动**：通过事件触发状态转换
3. **Redux集成**：与现有Redux战斗状态无缝集成
4. **可视化调试**：开发模式下提供实时状态监控
5. **配置化**：通过配置文件定制状态机行为

### 状态层次结构

```
BattleStateMachine
├── IDLE (闲置)
├── INITIALIZATION (初始化)
├── ACTIVE (激活) 
│   ├── ROUND_START (回合开始)
│   ├── PREPARATION (准备阶段)
│   │   ├── 处理回合开始BUFF
│   │   ├── 玩家行动选择
│   │   ├── AI行动选择
│   │   └── 所有行动准备完毕
│   ├── EXECUTION (执行阶段)
│   │   ├── 确定行动顺序
│   │   ├── 执行下一个行动
│   │   ├── 处理行动效果
│   │   └── 检查更多行动
│   └── RESOLUTION (结算阶段)
│       ├── 处理回合结束BUFF
│       ├── 检查战败条件
│       └── 更新战斗状态
└── END (结束)
```

## 核心组件

### 1. BattleStateMachine 类
**位置**: `src/features/battle/state/BattleStateMachine.js`

主要的状态机实现，负责：
- 状态转换管理
- 事件处理
- 战斗逻辑执行
- 与Redux状态同步

```javascript
// 创建状态机实例
const stateMachine = createBattleStateMachine(dispatch, getState);

// 触发事件
stateMachine.trigger(BATTLE_EVENTS.START_BATTLE, battleConfig);
```

### 2. useBattleStateMachine Hook
**位置**: `src/features/battle/hooks/useBattleStateMachine.js`

React Hook，提供状态机控制接口：

```javascript
const {
  startBattle,
  endBattle,
  resetBattle,
  completePreparation,
  getCurrentState,
  state: stateMachineState
} = useBattleStateMachine();
```

### 3. BattleStateMachineVisualizer 组件
**位置**: `src/features/battle/components/BattleStateMachineVisualizer.jsx`

开发模式下的可视化调试组件，显示：
- 当前状态和子状态
- 状态历史
- 手动事件触发
- 状态图可视化

### 4. 配置文件
**位置**: `src/features/battle/config/battleStateMachineConfig.js`

状态机的配置选项：
- 时间设置
- 行为配置
- 转换规则
- 验证规则

## 使用方法

### 基本使用

1. **在组件中集成状态机**：

```javascript
import { useBattleStateMachine, useBattleStateMachineState } from '../hooks/useBattleStateMachine';

const BattleComponent = () => {
  const { startBattle, endBattle, state } = useBattleStateMachine();
  const { isInPreparation, isInExecution, currentRound } = useBattleStateMachineState();
  
  // 开始战斗
  const handleStartBattle = () => {
    startBattle({ playerTeam: [...], enemyTeam: [...] });
  };
  
  return (
    <div>
      <div>当前状态: {state.currentState}</div>
      <div>当前回合: {currentRound}</div>
      {isInPreparation && <div>准备阶段</div>}
      {isInExecution && <div>执行阶段</div>}
    </div>
  );
};
```

2. **手动控制状态转换**：

```javascript
const { completePreparation, triggerEvent } = useBattleStateMachine();

// 完成准备阶段
completePreparation();

// 直接触发事件
triggerEvent(BATTLE_EVENTS.EXECUTION_COMPLETE);
```

### 自动战斗模式

使用 `useAutoBattleStateMachine` Hook 启用自动战斗：

```javascript
import { useAutoBattleStateMachine } from '../hooks/useBattleStateMachine';

const AutoBattleComponent = () => {
  const { enabled, isAutoProcessing } = useAutoBattleStateMachine(true);
  
  return (
    <div>
      {isAutoProcessing && <div>自动战斗进行中...</div>}
    </div>
  );
};
```

## 状态机事件

### 主要事件

```javascript
export const BATTLE_EVENTS = {
  START_BATTLE: 'start_battle',
  INITIALIZATION_COMPLETE: 'initialization_complete',
  ROUND_START: 'round_start',
  PREPARATION_COMPLETE: 'preparation_complete',
  EXECUTION_COMPLETE: 'execution_complete',
  RESOLUTION_COMPLETE: 'resolution_complete',
  BATTLE_END: 'battle_end',
  RESET_BATTLE: 'reset_battle'
};
```

### 内部事件

```javascript
BUFFS_PROCESSED: 'buffs_processed',
ACTIONS_SELECTED: 'actions_selected',
ACTION_ORDER_DETERMINED: 'action_order_determined',
ACTION_EXECUTED: 'action_executed',
NO_MORE_ACTIONS: 'no_more_actions'
```

## 与现有系统的集成

### Redux 集成

状态机与现有的Redux battleSlice完全兼容：

```javascript
// 状态机会自动分发Redux actions
this.dispatch({
  type: 'battle/setupBattle',
  payload: { battleId, ... }
});

// 监听Redux状态变化
const battleState = this.getState().battle;
```

### 技能系统集成

状态机调用现有的技能系统：

```javascript
import { executeSkillEffect, getSkillById } from '../logic/skillSystem';

// 在状态机中执行技能
const skillResult = executeSkillEffect(caster, target, skillId, battleState);
```

### BUFF系统集成

状态机管理BUFF的生命周期：

```javascript
import { processBuffsOnTurnStart, processBuffsOnTurnEnd } from '../logic/buffManager';

// 处理回合开始/结束的BUFF效果
const buffResults = processBuffsOnTurnStart(unit);
```

## 调试和监控

### 开发模式调试

在开发模式下，会显示状态机可视化组件：

1. **当前状态**：主状态和子状态
2. **状态历史**：最近的状态转换记录
3. **手动控制**：直接触发事件
4. **性能指标**：状态机运行统计

### 日志输出

状态机提供详细的控制台日志：

```
[BattleStateMachine] 触发事件: start_battle, 当前状态: idle, 子状态: null
[BattleStateMachine] 状态切换: idle/null -> initialization/null
[BattleStateMachine] 初始化战斗...
```

### 状态验证

可配置的状态验证规则确保状态转换的正确性：

```javascript
PRECONDITIONS: {
  preparation: (state) => state.battleUnits && Object.keys(state.battleUnits).length > 0,
  execution: (state) => state.unitActions && Object.keys(state.unitActions).length > 0
}
```

## 配置选项

### 时间配置

```javascript
export const STATE_MACHINE_TIMING = {
  INITIALIZATION_DELAY: 100,
  PREPARATION_AUTO_ADVANCE: 2000,
  EXECUTION_ACTION_DELAY: 1000,
  // ...
};
```

### 行为配置

```javascript
export const STATE_MACHINE_BEHAVIOR = {
  AUTO_ADVANCE_PREPARATION: false,
  AUTO_ADVANCE_EXECUTION: true,
  ERROR_RECOVERY_ENABLED: true,
  // ...
};
```

## 扩展指南

### 添加新状态

1. 在 `BATTLE_STATES` 中定义新状态
2. 在状态机中添加状态处理逻辑
3. 更新状态转换规则
4. 添加相应的事件处理器

### 添加新事件

1. 在 `BATTLE_EVENTS` 中定义新事件
2. 添加事件处理器
3. 在适当的地方触发事件

### 自定义中间件

可以添加自定义中间件来扩展状态机功能：

```javascript
const customMiddleware = {
  beforeTransition: (from, to, event) => {
    // 转换前的处理
  },
  afterTransition: (from, to, event) => {
    // 转换后的处理
  }
};
```

## 最佳实践

1. **状态原子性**：确保每个状态都有明确的职责
2. **事件驱动**：通过事件而不是直接调用来触发状态转换
3. **错误处理**：为异常情况提供回退机制
4. **测试覆盖**：为关键状态转换编写测试
5. **文档更新**：状态变更时及时更新文档

## 性能考虑

1. **状态历史限制**：自动清理过多的历史记录
2. **事件队列**：避免事件堆积
3. **异步处理**：耗时操作使用异步处理
4. **内存管理**：及时清理不需要的上下文数据

## 常见问题

### Q: 状态机与Redux状态不同步怎么办？
A: 检查状态机的事件触发是否正确，确保Redux actions被正确分发。

### Q: 如何调试状态转换问题？
A: 使用可视化组件查看状态历史，启用详细日志输出。

### Q: 如何处理异常状态？
A: 配置错误恢复机制，设置合适的回退状态。

### Q: 性能是否会受到影响？
A: 状态机设计为轻量级，正常使用不会有明显性能影响。

## 总结

通过引入分层状态机，我们实现了：

1. **清晰的战斗流程管理**
2. **更好的代码组织和维护性**  
3. **强大的调试和监控能力**
4. **灵活的配置和扩展机制**
5. **与现有系统的完美集成**

这个状态机系统为战斗系统提供了坚实的基础，支持未来的功能扩展和优化。 