# 🎮 NPC系统入口指南

## 🚀 如何访问NPC系统

### 方法一：游戏内访问（推荐）
1. **启动游戏** → 点击"开始游戏"
2. **进入主游戏界面** → 等待资源加载完成
3. **点击底部操作栏** → 找到红色的 **"NPC系统"** 按钮
4. **打开NPC管理界面** → 开始体验完整功能

### 方法二：直接访问组件
```bash
# 文件位置
src/features/npc/components/NpcOOPDemo.jsx
```

## 🎯 系统入口位置

### 主要入口文件
```
📁 项目根目录
├── src/
│   ├── features/npc/components/
│   │   └── NpcOOPDemo.jsx          ← 🎯 主要演示界面
│   ├── entities/
│   │   └── Npc.js                  ← 🏗️ NPC实体类
│   ├── store/managers/
│   │   └── NpcManager.js           ← 🎛️ NPC管理器
│   ├── config/character/
│   │   └── npcTemplatesConfig.js   ← ⚙️ NPC模板配置
│   └── hooks/
│       └── useNpcManager.js        ← 🪝 React集成Hook
```

### 已集成位置
- **GamePage.jsx** (第184行) - 游戏操作栏按钮
- **GamePage.jsx** (第464行) - NPC系统模态框

## 🖥️ 界面功能导航

### 四大功能标签页

#### 1️⃣ 📊 系统概览
- NPC总数统计
- 各场景分布
- 系统状态监控
- 实时数据更新

#### 2️⃣ 👥 NPC管理  
- 从模板创建NPC
- 查看所有NPC列表
- 删除和编辑NPC
- 属性自定义覆盖

#### 3️⃣ 🏗️ 场景分配
- 副本NPC分配
- 节点NPC分配  
- 任务NPC分配
- 家园NPC分配

#### 4️⃣ 🔍 NPC详情
- 选择查看详细信息
- 实时状态显示
- 交互历史记录
- 属性完整展示

## 🎮 快速上手操作

### 第一步：创建NPC
1. 切换到"NPC管理"标签页
2. 选择NPC模板（村长、铁匠、药师等）
3. 可选：自定义名称和属性
4. 点击"创建NPC"

### 第二步：分配场景
1. 切换到"场景分配"标签页
2. 选择要分配的NPC
3. 选择目标场景类型
4. 输入场景ID
5. 点击"分配到场景"

### 第三步：查看详情
1. 切换到"NPC详情"标签页
2. 从下拉列表选择NPC
3. 查看完整属性和状态
4. 可进行交互操作

## 💡 系统特色功能

### ✨ 无位置概念设计
- NPC不存储坐标位置
- 通过场景分配管理位置关系
- 支持一个NPC分配到多个场景

### ⚙️ 完全配置化
- 模板驱动的NPC创建
- 支持属性覆盖和自定义
- 实时配置生效

### 🏗️ 纯OOP架构
- 继承EventEmitter事件机制
- 封装私有属性和方法
- 支持多态行为扩展

### 🔄 事件驱动
- 所有交互发送事件
- 松耦合设计
- 实时状态同步

## 🛠️ 开发者指南

### 扩展NPC模板
编辑文件：`src/config/character/npcTemplatesConfig.js`
```javascript
export const NPC_TEMPLATES = {
  // 添加新模板
  新NPC类型: {
    name: "默认名称",
    type: "NPC_TYPES.新类型", 
    level: 1,
    attributes: { /* 属性配置 */ },
    functions: ["DIALOGUE"], 
    dialogues: { /* 对话配置 */ }
  }
}
```

### 添加新场景类型
1. 更新 `src/config/enumConfig.js` 中的枚举
2. 修改 `NpcManager.js` 中的分配方法
3. 在界面中添加对应选项

## 📋 系统要求
- React 18+
- Redux Toolkit
- 现有游戏架构支持

## 🎉 开始使用
现在就进入游戏，点击底部的**红色"NPC系统"按钮**，开始体验完整的NPC面向对象配置系统！ 