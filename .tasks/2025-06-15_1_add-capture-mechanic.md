<!--
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-13 11:24:42
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-13 11:26:49
-->
# Context
File name: 2025-06-15_1
Created at: 2025-06-15_10:30:00
Created by: [USER_NAME]
Main branch: main
Task Branch: task/add-capture-mechanic-2025-06-15_1
Yolo Mode: Off

# Task Description
增加战斗中捕捉功能，把战斗召唤兽化为玩家自己的。
- 捕捉到的召唤兽需要保留其在战斗中表现出的独一无二的属性。
- 这意味着在捕捉时，需要将其基础属性和成长率一并记录下来。
- 战斗结束后，根据这些记录的数据来创建一个新的、完全一致的召唤兽实例，并加入到玩家的队伍中。

# Project Overview
这是一个基于React和JavaScript的回合制战斗游戏。战斗系统由一个独立的`BattleEngine`驱动，UI使用React组件构建。玩家状态，包括召唤兽列表，通过自定义的`useSummonManager` hook进行管理，该hook封装了一个面向对象的`SummonManager`类。

⚠️ WARNING: NEVER MODIFY THIS SECTION ⚠️
RIPER-5 Protocol Summary:
1.  **RESEARCH**: Gather information, no suggestions.
2.  **INNOVATE**: Brainstorm approaches, no code.
3.  **PLAN**: Create detailed technical specifications and a checklist.
4.  **EXECUTE**: Implement the plan exactly.
5.  **REVIEW**: Validate implementation against the plan.
Mode transition requires explicit user command.
⚠️ WARNING: NEVER MODIFY THIS SECTION ⚠️

# Analysis
- **UI:** 需要修改 `ActionTypeSelector.jsx` 以显示"捕捉"按钮。
- **Engine:** `BattleEngine.js` 需要添加新的 `capture` 行动类型处理逻辑。
- **Logic:** 需要创建一个新的 `captureLogic.js` 文件来计算捕捉成功率。
- **Data:**
    - 需要确保敌方单位在战斗开始时就生成了固定的基础属性和成长率，并能在捕捉时被访问到。
- **State Management:** `SummonManager.js` 需要一个新方法，能根据捕捉到的数据快照（包含基础属性和成长率）来创建召唤兽实例。

# Proposed Solution
### IMPLEMENTATION CHECKLIST:

**1. 配置文件和枚举**
- [ ] **(1a)** 在 `src/config/enumConfig.js` 中，为行动类型枚举添加 `CAPTURE: 'capture'`。
- [ ] **(1b)** 在 `src/config/summon/allSummons.json` 中，为所有可捕捉的召唤兽添加 `captureRate` 和 `isCapturable: true` 属性。

**2. 创建捕捉逻辑模块**
- [ ] **(2a)** 创建新文件 `src/features/battle/logic/captureLogic.js`。
- [ ] **(2b)** 在该文件中，实现 `calculateCaptureSuccess(targetUnit, baseCaptureRate)` 函数。

**3. 战斗单位数据结构调整**
- [ ] **(3a)** 定位创建敌方战斗单位的逻辑。
- [ ] **(3b)** 确保在创建敌方 `BattleUnit` 对象时，其生成的`baseAttributes` 和 `growthRates` 被作为一个字段（例如 `innateProfile`）保存到单位对象中。

**4. UI实现**
- [ ] **(4a)** 在 `src/features/battle/components/ActionTypeSelector.jsx` 的 `actionConfigs` 对象中，为 `capture` 添加配置。
- [ ] **(4b)** 在 `BattleScreen.jsx` 或相关组件中，更新 `availableActions` 的逻辑，使其在目标可捕捉时显示"捕捉"按钮。

**5. 战斗引擎集成**
- [ ] **(5a)** 在 `BattleEngine.js` 的构造函数中，初始化 `this.capturedSummonsData = []`。
- [ ] **(5b)** 在 `_processAction` 方法中添加 `case 'capture':`，调用 `_processCaptureAction(sourceUnit, action)`。
- [ ] **(5c)** 实现 `_processCaptureAction` 方法，用于处理捕捉逻辑并创建包含 `innateProfile` 的数据快照。
- [ ] **(5d)** 在 `_checkBattleEnd` 中，将 `isCaptured` 等同于 `isDefeated` 处理。
- [ ] **(5e)** 在 `_endBattle` 中，将 `this.capturedSummonsData` 附加到 `result` 对象。

**6. 状态管理与最终处理**
- [ ] **(6a)** 在 `src/store/SummonManager.js` 中，修改或新增方法以根据捕捉数据快照（包含`baseAttributes`和`growthRates`）创建召唤兽，不进行任何随机化。
- [ ] **(6b)** 在 `BattleScreen.jsx` 的战斗结束逻辑中，调用 `useSummonManager` 的相应方法来处理 `capturedSummonsData`。

# Current execution step: "1. Create the task file"

# Task Progress
- `2025-06-15_10:30:00` - Task file created.

# Final Review:
[Post-completion summary] 