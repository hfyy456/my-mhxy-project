# 战斗系统 V3 - 基于 XState 的重构

## 1. 设计哲学与目标

本项目是战斗系统的一次重大重构（版本 V3），其核心目标是解决先前版本（V2）中存在的**开发者心智负担过重**的问题。

V2 架构虽然在技术上实现了逻辑与UI的解耦，但其复杂的内部结构（独立的引擎、事件总线、适配器、Redux/UI中间件）导致开发者在实现新功能或排查问题时，需要在多个文件和抽象层之间频繁跳转，难以形成清晰的逻辑链路。

V3 架构旨在**保留 V2 的优点（逻辑与UI分离）**，同时从根本上简化开发体验。我们通过引入 **XState**，用一个统一、声明式、可预测且可视化的状态机，取代了之前所有手写的、分散的流程控制逻辑。

**核心目标:**
-   **降低复杂性**: 用一个状态机管理所有战斗流程。
-   **提高可维护性**: 逻辑高度内聚，流程一目了然。
-   **增强健壮性**: 杜绝无效状态和非法转换，让系统更可预测。
-   **可视化**: 状态机定义可以被工具可视化，便于理解和调试。

---

## 2. 核心技术栈

-   **XState**: V3 架构的基石。它是一个用于创建、解释和执行状态图（Statecharts）的库。状态图是状态机的超集，能够清晰地描述最复杂的应用逻辑。
-   **React**: 用于构建用户界面。
-   **React Context API**: 用于在组件树中高效地传递状态机实例和生命周期控制函数。

---

## 3. 架构概览

V3 系统的核心组件协同工作，形成了一个单向的数据流，清晰且易于追踪。

```mermaid
graph TD
    subgraph App.jsx
        A[React State: battleKey] -->|updates| B(BattleProviderV3);
        C(BattleLifecycleContext.Provider) -->|provides restartBattle()| D(UI Components);
    end

    subgraph Battle System Core
        B -- instantiates --> E(battleMachine);
        E -- is provided via --> F(BattleContextV3);
        F -- is consumed by --> G(useBattleV3 Hook);
    end

    subgraph UI Layer
        G -- provides [state, send] --> D;
        D -- sends events --> E;
        E -- updates --> B;
        B -- re-renders --> D;
    end

    style B fill:#bbf,stroke:#333,stroke-width:2px
    style E fill:#f9f,stroke:#333,stroke-width:2px
    style C fill:#bbf,stroke:#333,stroke-width:2px
```

**组件职责:**

-   `battleMachine.js` (**大脑**):
    -   使用 XState 定义整个战斗的逻辑流程图。
    -   包含所有可能的状态（如 `idle`, `initializing`, `preparation`, `execution`, `completed`）。
    -   定义状态之间的转换规则、响应的事件、执行的动作（Action）以及调用的异步逻辑（Actor）。

-   `BattleProviderV3.jsx` (**心脏**):
    -   一个 React 组件，其唯一职责是启动并运行 `battleMachine`。
    -   它使用 `@xstate/react` 的 `useMachine` 钩子创建状态机的一个实例（actor/service）。
    -   通过 `BattleContextV3` 将该实例提供给其所有子组件。

-   `useBattleV3.js` (**手臂**):
    -   一个自定义 React 钩子，是 UI 组件与状态机交互的唯一入口。
    -   它从 `BattleContextV3` 中获取状态机实例，并返回给调用者两个核心元素：
        1.  `state`: 状态机的当前状态对象，包含 `value` (当前状态节点) 和 `context` (数据)。
        2.  `send`: 一个函数，用于向状态机发送事件，触发状态转换。

-   `BattleLifecycleContext.js` & `App.jsx` (**重置按钮**):
    -   这是我们实现"重新开始"功能的核心机制。
    -   `App.jsx` 管理一个 `key` 状态，并将其传递给 `BattleProviderV3`。
    -   当需要重置战斗时，UI 组件通过 `BattleLifecycleContext` 调用一个由 `App.jsx` 提供的函数 (`restartBattle`)。
    -   该函数更新 `key`，导致 React 销毁旧的 `BattleProviderV3` 实例（及其内部的状态机）并创建一个全新的实例，从而实现彻底、干净的重置。

-   **UI Components** (如 `BattleV3TestScreen.jsx`):
    -   通过 `useBattleV3()` 获取 `state` 和 `send`。
    -   根据 `state` 的值来渲染不同的界面（例如，`state.matches('completed')` 时显示结束画面）。
    -   响应用户交互（如点击按钮），调用 `send({ type: 'SOME_EVENT' })` 来通知状态机。

---

## 4. 核心工作流程：一次普通攻击

1.  **初始化**:
    -   `BattleProviderV3` 挂载，`useMachine` 启动 `battleMachine`，初始状态为 `idle`。
    -   `BattleV3TestScreen` 渲染，看到 `state.matches('idle')` 为 `true`，显示"初始化战斗"按钮。

2.  **发送事件**:
    -   用户点击"初始化战斗"按钮。
    -   `onClick` 事件处理器调用 `send({ type: 'INITIALIZE_BATTLE', payload: battleData })`。

3.  **状态机响应**:
    -   `battleMachine` 收到 `INITIALIZE_BATTLE` 事件。
    -   根据定义，它从 `idle` 转换到 `initializing` 状态。
    -   在进入 `initializing` 状态时，它会执行一个 `assign` 动作，将 `event.payload` 中的 `battleData` 存入自己的 `context`。
    -   同时，它会 `invoke` (调用) 一个名为 `initializeBattleActor` 的异步 Actor。

4.  **执行异步逻辑**:
    -   `initializeBattleActor` (定义在 `src/features/battle/v3/logic/` 中) 开始执行。它可能会进行一些数据处理，比如计算单位的行动顺序。
    -   完成后，它会向父状态机发送一个 `done.invoke.*` 事件，并附带处理结果。

5.  **逻辑处理与下一状态**:
    -   `battleMachine` 监听到 `onDone` 事件。
    -   它将 Actor 返回的数据通过 `assign` 合并到 `context` 中。
    -   然后转换到 `round.preparation` 状态，等待玩家输入。

6.  **UI 响应**:
    -   `BattleV3TestScreen` 组件因为 `state` 的变化而重新渲染。
    -   现在 `state.matches('round.preparation')` 为 `true`，UI会显示玩家单位的行动按钮。

7.  **循环**:
    -   这个"UI 发送事件 -> 状态机转换/执行逻辑 -> UI 响应新状态"的循环会一直持续，直到状态机进入最终的 `completed` 状态。

---

## 5. 如何扩展

V3 架构的可扩展性是其主要优势之一。

### 添加一个新的游戏逻辑 (例如：天气效果)

1.  **定义逻辑**: 在 `src/features/battle/v3/logic/` 目录下创建一个新文件，如 `weatherLogic.js`。导出一个函数，该函数接收 `context` 和 `event`，并返回计算结果。
2.  **定义 Actor**: 在 `battleMachine.js` 的 `actors` (或 V4 中的 `services`) 配置中，为你的新逻辑创建一个 actor。
    ```javascript
    actors: {
      // ... existing actors
      applyWeatherEffect: fromPromise(async ({ input }) => {
        // ... call your logic from weatherLogic.js
        return updatedContextData;
      }),
    }
    ```
3.  **调用 Actor**: 在某个状态（例如 `round.start`）中，使用 `invoke` 来调用这个 actor。
    ```javascript
    round: {
      initial: 'start',
      states: {
        start: {
          invoke: {
            src: 'applyWeatherEffect',
            input: (context) => ({ a: context.someData }), // pass data to actor
            onDone: {
              target: 'preparation',
              actions: assign({
                // ... merge result from actor
              })
            }
          }
        },
        // ...
      }
    }
    ```

### 添加一个新的玩家动作

1.  **更新 UI**: 在 `BattleV3TestScreen.jsx` 或其他 UI 组件中，添加一个新的按钮（例如"防御"）。
2.  **发送新事件**: 让按钮的 `onClick` 发送一个新类型的事件，例如 `send({ type: 'SUBMIT_DEFENSE', payload: { unitId: '...' } })`。
3.  **处理事件**: 在 `battleMachine.js` 的 `preparation` 状态中，添加对 `SUBMIT_DEFENSE` 事件的监听，并执行相应的 `assign` 动作来更新 `context.unitActions`。

通过遵循这个模式，我们可以不断地为战斗系统添加新功能，同时保持其核心逻辑的清晰和稳定。

---

## 6. 开发注意事项与常见陷阱 (踩坑实录)

在从 V2 迁移和开发 V3 系统的过程中，我们遇到了一些由库版本升级和状态机设计本身带来的问题。记录这些陷阱是为了帮助未来的开发者避免重蹈覆辙。

### 6.1 XState V4 到 V5 的关键 API 变更

我们在开发过程中，无意中混合了 XState V4 和 V5 的 API，导致了一系列难以追踪的 bug。本项目最终使用 **V5**，以下是必须注意的关键区别：

1.  **`cond` 变为 `guard`**:
    -   **旧 (V4)**: `on: { SOME_EVENT: { target: 'nextState', cond: 'someCondition' } }`
    -   **新 (V5)**: `on: { SOME_EVENT: { target: 'nextState', guard: 'someCondition' } }`
    -   **影响**: 使用 `cond` 会被 V5 忽略，导致条件判断失效。

2.  **`services` 变为 `actors`**:
    -   **旧 (V4)**: 在机器配置中，异步操作定义在 `services` 对象下。
    -   **新 (V5)**: `services` 已被重命名为 `actors`。
    -   **影响**: 在 V5 中使用 `services` 会导致 "Actor/Service '...' not found" 的错误。

3.  **`assign` 动作的函数签名改变**:
    -   **旧 (V4)**: `assign((context, event) => { ... })`
    -   **新 (V5)**: `assign(({ context, event }) => { ... })`
    -   **影响**: 这是最隐蔽的错误之一。V5 中，`assign` 的第一个参数变成了一个包含 `context` 和 `event` 的 **对象**。如果仍使用旧签名，`event` 参数将是 `undefined`，导致 `event.payload` 或 `event.data` 的读取错误 (`Cannot read properties of undefined`)。

4.  **事件数据来源 (`payload` vs `data`)**:
    -   从 **UI 或外部** 发送的事件，我们通常将数据放在 `payload` 中 (`send({ type: 'X', payload: data })`)。在 `assign` 或 `guard` 中，通过 `event.payload` 访问。
    -   从一个 **invoked actor** 完成后发送的 `done.invoke.*` 事件，其返回的数据位于 `event.data` 中。
    -   **影响**: 混淆这两者会导致数据无法正确传递和赋值。

### 6.2 状态机内部 `target` 的可访问性

-   **问题**: 我们曾遇到 "Child state 'roundStart' does not exist on parent state 'battle'" 这样的错误。
-   **原因**: 这是因为我们试图从一个顶层状态的 `onDone` 事件处理器直接 `target` 到一个深层嵌套的子状态（例如，从 `initializing` 直接跳到 `round.preparation`）。XState 要求状态转换的目标必须是当前状态节点的可直接访问的子节点或兄弟节点，或者是通过ID指定的绝对路径。
-   **解决方案**: 将 `target` 指向一个合法的父状态（如 `round`），然后让该父状态通过 `initial` 属性自动进入其初始子状态（如 `preparation`）。

### 6.3 状态机的重置机制：`key` vs `INITIALIZE` 事件

-   **问题**: 如何实现一个可靠的"重新开始"功能？
-   **初步尝试**: 在 `completed` 状态下监听一个 `RESTART` 事件，然后跳转回 `idle` 状态并清空 `context`。
-   **陷阱**: 这种方法可能无法完全清除状态机内部的所有状态，特别是如果 Actor (异步进程) 仍在运行或存在其他副作用。它只是状态机内部的一次转换，而不是一次"重生"。
-   **最终方案**: 使用 React 的 `key` 属性。
    -   我们将 `BattleProviderV3` 组件包裹在一个父组件 (`App.jsx`) 中。
    -   父组件持有一个 `battleKey` 状态。
    -   当"重新开始"被触发时，我们更新 `battleKey`。
    -   React 检测到 `key` 的变化后，会 **完全销毁** 旧的 `BattleProviderV3` 组件实例（包括其内部运行的整个 XState 状态机），然后 **创建一个全新的实例**。
    -   **结论**: 这是最彻底、最可靠的重置方式，能确保战斗从一个真正干净的状态开始。 