# 战斗系统架构文档

## 概述

本项目的战斗系统已重构为独立的状态机架构，通过适配器模式与Redux和UI组件解耦。新架构实现了以下目标：

- ✅ 完全独立的战斗引擎，不依赖Redux
- ✅ 清晰的数据边界和控制权交接
- ✅ UI组件接口保持不变
- ✅ 向后兼容性支持

## 架构组件

### 1. 核心引擎层 (`/engine`)

#### BattleEngine.js
- **职责**: 独立的战斗逻辑处理核心
- **特点**: 无外部依赖，纯函数式状态管理
- **功能**: 战斗初始化、回合管理、行动处理、结果计算

#### BattleState.js
- **职责**: 战斗状态数据结构定义
- **包含**: BattleUnit类、BattleState类
- **功能**: 单位属性管理、阵型管理、状态序列化

#### BattleEventBus.js
- **职责**: 事件发布-订阅系统
- **功能**: 事件分发、历史记录、批量操作、调试支持

### 2. 适配器层 (`/adapters`)

#### BattleEngineAdapter.js
- **职责**: 战斗引擎的主适配器
- **功能**: 
  - 包装引擎实例
  - 提供统一接口
  - 状态缓存和格式化
  - 选择器代理

#### ReduxBattleAdapter.js
- **职责**: Redux集成适配器
- **功能**:
  - Redux ↔ 引擎数据转换
  - 控制权管理
  - 结果同步
  - 无缝切换

### 3. Hook系统 (`/hooks`)

#### useBattleStateMachine.js
- **重构内容**: 使用适配器系统
- **新功能**:
  - 适配器优先模式
  - 响应式状态管理
  - 兼容性Hook
  - 选择器代理

### 4. Context系统 (`/context`)

#### BattleAdapterContext.js
- **新增**: 适配器Context提供器
- **功能**: 适配器实例管理、状态监听、调试支持

#### BattleStateMachineContext.jsx
- **更新**: 适配器集成兼容层
- **保持**: 向后兼容的API

### 5. Provider系统 (`/providers`)

#### BattleSystemProvider.jsx
- **新增**: 顶层Provider包装器
- **功能**: 组合所有Context、开发模式支持

### 6. Redux简化 (`/store/slices`)

#### battleSliceSimplified.js
- **替代**: 原有的复杂battleSlice
- **保留**: 基本状态管理、选择器兼容性
- **新增**: 适配器集成接口、控制模式管理

## 数据流架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Redux Store   │◄──►│  Redux Adapter   │◄──►│ Battle Engine   │
│  (简化状态)     │    │   (数据转换)     │    │  (独立逻辑)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  UI Components  │◄──►│ Engine Adapter   │◄──►│  Event Bus      │
│   (不变接口)    │    │   (接口统一)     │    │  (事件系统)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 控制权流转

### 1. 战斗初始化
```
Redux → Redux Adapter → Engine Adapter → Battle Engine
```

### 2. 战斗进行中
```
Battle Engine ← Event Bus ← User Actions
Battle Engine → Event Bus → UI Updates
```

### 3. 战斗结束
```
Battle Engine → Engine Adapter → Redux Adapter → Redux
```

## 使用指南

### 基本使用

```jsx
// 1. 在应用顶层包装Provider
import { BattleSystemProvider } from '@/features/battle/providers/BattleSystemProvider';

function App() {
  return (
    <BattleSystemProvider>
      <GameContent />
    </BattleSystemProvider>
  );
}

// 2. 在组件中使用Hook
import { useBattleStateMachine, useBattleStateMachineState } from '@/features/battle/hooks/useBattleStateMachine';

function BattleComponent() {
  const { initializeBattle, submitAction, advanceBattle } = useBattleStateMachine();
  const { isActive, currentPhase, battleUnits } = useBattleStateMachineState();
  
  // 使用战斗功能...
}
```

### 适配器直接使用

```jsx
import { useBattleAdapter } from '@/features/battle/context/BattleAdapterContext';

function AdvancedBattleComponent() {
  const adapter = useBattleAdapter();
  
  // 直接控制引擎
  const engineState = adapter.getEngineState();
  const controlStatus = adapter.getControlStatus();
  
  // 订阅引擎变化
  useEffect(() => {
    const unsubscribe = adapter.subscribeToEngineChanges((newState) => {
      console.log('引擎状态变化:', newState);
    });
    return unsubscribe;
  }, [adapter]);
}
```

## 兼容性说明

### UI组件
- ✅ 所有现有UI组件无需修改
- ✅ 选择器接口保持一致
- ✅ Hook接口向后兼容

### Redux集成
- ✅ 简化版Slice保持选择器兼容
- ✅ Action接口基本保持
- ✅ 中间件和其他Redux功能正常

### 状态机
- ✅ 传统状态机API保持可用
- ✅ 事件系统向后兼容
- ✅ 渐进式迁移支持

## 测试和调试

### 集成测试
```javascript
import { runBattleSystemIntegrationTests } from '@/features/battle/tests/BattleSystemIntegration.test.js';

// 运行完整测试套件
runBattleSystemIntegrationTests();
```

### 调试工具
- 开发模式下自动运行测试
- 适配器状态监控Hook
- 引擎事件历史记录
- Redux DevTools集成

## 性能优化

### 内存管理
- 引擎状态缓存
- 事件历史限制
- 自动清理机制

### 响应性优化
- 选择性状态订阅
- 批量状态更新
- 防抖处理

## 未来扩展

### 可扩展点
1. **引擎插件系统**: 支持自定义战斗逻辑
2. **多引擎支持**: 不同类型战斗使用不同引擎
3. **网络同步**: 多人战斗支持
4. **AI系统**: 独立的AI决策引擎

### 迁移路径
1. 当前版本: 适配器模式兼容
2. 下一版本: 逐步移除传统状态机
3. 最终版本: 纯引擎架构

## 故障排除

### 常见问题

1. **Hook错误**: 确保组件在BattleSystemProvider内
2. **状态不同步**: 检查适配器订阅是否正常
3. **选择器失效**: 验证Redux Slice导入路径
4. **事件丢失**: 确认事件总线订阅时机

### 调试步骤

1. 检查控制台测试输出
2. 验证适配器状态
3. 查看Redux DevTools
4. 检查事件历史记录

---

**重构完成时间**: 2025-01-27  
**架构版本**: v2.0  
**兼容性**: 向后兼容v1.x 