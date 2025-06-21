# 项目文件结构协议 (DIRECTORY STRUCTURE PROTOCOL)

本协议旨在为项目提供一个清晰、一致且可扩展的文件组织规范。遵循此协议有助于开发者快速定位代码、理解模块职责，并降低项目的维护成本。

## 核心原则

1.  **功能切片 (Feature-Sliced)**: 主要的应用逻辑应按功能（如 `battle`, `summon`, `inventory`）组织在 `src/features` 目录下。每个功能模块都是一个独立的单元，包含其自身的组件、逻辑、状态等。
2.  **分层架构**: 在功能模块内部和 `src` 的顶层，代码按其职责（如 `components`, `hooks`, `managers`, `utils`）进行分层。
3.  **共享与私有**: 明确区分可在多处复用的"共享"代码和仅在特定功能模块内使用的"私有"代码。

---

## 根目录结构

```
/
├── docs/               # 项目文档 (设计稿、开发日志、迁移指南)
├── electron/           # Electron 主进程和预加载脚本
├── public/             # Vite 公共静态资源 (会被直接复制到构建目录)
├── scripts/            # NodeJS 工具脚本 (例如, 数据处理、自动化任务)
├── src/                # 应用程序所有源代码
├── tests/              # 端到端或集成测试
├── .eslintrc.js        # ESLint 配置文件
├── index.html          # 应用主 HTML 文件
├── package.json        # 项目依赖与脚本
├── vite.config.mjs     # Vite 配置文件
└── tailwind.config.js  # Tailwind CSS 配置文件
```

---

## `src` 目录结构详解

### `src/features/[feature-name]/` - 功能模块

这是项目最核心的目录，所有业务功能都应在此处以独立的模块形式存在。

-   **`components/`**: **React 组件**。仅在此功能模块内部使用。
-   **`hooks/`**: **React Hooks**。仅在此功能模块内部使用。
-   **`managers/`**: **管理器**。封装功能的核心状态和复杂逻辑的面向对象类 (e.g., `FormationManager.js`)。
-   **`models/`**: **数据模型**。与此功能相关的特定数据结构或类 (e.g., `Formation.js`)。
-   **`logic/` / `systems/` / `engine/`**: **纯逻辑**。无副作用的函数、算法、状态机逻辑等。
-   **`providers/`**: **React Context Providers**。用于向功能组件树注入状态或依赖。
-   **`utils/`**: **工具函数**。仅服务于此功能的辅助函数。
-   **`index.js` / `[FeatureName]Demo.jsx`**: 模块的入口文件或用于开发的演示/调试组件。

### `src/components/` - 共享组件

可被多个功能模块复用的 React 组件。

-   **`ui/`**: **基础 UI 组件**。高度可复用、与业务逻辑无关的原子组件 (e.g., `Button.jsx`, `Modal.jsx`, `Input.jsx`)。

### `src/hooks/` - 共享 Hooks

可被多个功能模块复用的 React Hooks (e.g., `useGameState.js`, `useToast.js`)。

### `src/store/` - 全局状态与核心管理器

此目录负责管理全局状态和跨功能的、核心的游戏管理器。**注意：新的 Redux Slice 不应再被添加，现有 Slice 应逐步重构为 Manager 模式。**

-   **`managers/`**: **核心管理器**。存放跨功能的核心管理器实例或类，例如 `GameStateManager`, `InventoryManager`, `SummonManager`。
-   **`slices/`**: **[遗留] Redux Slices**。现有的 Redux 状态切片，目标是逐步淘汰。
-   `reduxSetup.js`: **[遗留]** Redux store 的配置。

### `src/entities/` - 核心实体

定义游戏中核心概念的纯数据类（POJO / Class）。这些实体是高度复用、贯穿整个应用的。

-   **`Summon.js`**: 召唤兽的定义。
-   **`Npc.js`**: NPC 的定义。
-   **`Player.js`**: 玩家的定义。
-   **`Item.js`**: 物品的定义。

### `src/config/` - 全局配置

存放所有游戏的静态配置数据。

-   **.json**: 纯数据配置 (e.g., `allItems.json`, `buffs.json`)。
-   **.js**: 需要一些逻辑计算或导出为特定格式的配置 (e.g., `summonConfig.js`, `mapConfig.js`)。

### `src/utils/` - 共享工具函数

不依赖任何特定功能模块的、纯粹的、可全局复用的辅助函数 (e.g., `idUtils.js`, `pathfinding.js`)。

### `src/assets/` - 静态资源

图片、字体、音频、GIF 等非代码资源。

### `src/pages/` - 页面级组件

代表一个完整应用页面的顶层组件，通常用于路由。

-   `GamePage.jsx`: 游戏主页面。
-   `StartMenuPage.jsx`: 开始菜单页面。

### `src/styles/` - 全局样式

全局 CSS 文件、主题定义等 (e.g., `index.css`, `customScrollbar.css`)。

### `src/` - 根文件

-   `App.jsx`: 应用的根组件，负责组合页面、Provider 等。
-   `index.jsx`: React 应用的入口文件。

---

## 未来重构建议

1.  **整合管理器**:
    -   将 `src/store/NpcManager.js` 和 `src/managers/NpcManager.js` 合并，并统一放入 `src/store/managers/`。
    -   将 `src/store/SummonManager.js` 和 `src/store/InventoryManager.js` 等明确地移入 `src/store/managers/` 目录，以保持结构一致性。
2.  **迁移核心实体**:
    -   将 `src/store/Summon.js` 移动到 `src/entities/Summon.js`。
    -   为 `Item`, `Equipment` 等核心概念在 `src/entities/` 中创建对应的类文件。
3.  **淘汰 Redux**:
    -   制定计划，将 `src/store/slices/` 中的逻辑逐步迁移到 `src/features/.../managers/` 或 `src/store/managers/` 中。最终移除 Redux 依赖。

遵循此协议将使项目结构更加清晰，为后续的功能开发和维护奠定坚实的基础。 