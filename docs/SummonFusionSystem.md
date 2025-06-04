# 召唤兽合成系统技术文档

## 系统概述

召唤兽合成系统是游戏中的高级功能，允许玩家将两只召唤兽合成为一只新的召唤兽。该系统采用面向对象编程模式，严格遵循数据与逻辑分离的设计原则。

## 系统架构

### 核心组件

```
src/store/SummonFusionManager.js       - 合成管理器（核心逻辑）
src/features/summon/components/        - UI组件目录
  ├── EnhancedSummonFusionModal.jsx    - 高级合成界面
  ├── FusionHistoryModal.jsx           - 历史记录界面
  └── SummonSystem.jsx                 - 主系统集成
```

### 数据流架构

```
用户操作 → UI组件 → SummonFusionManager → 召唤兽数据变更 → 状态更新 → UI刷新
```

## 合成规则详述

### 1. 基础合成规则

#### 成功率计算
- **基础成功率**: 70%
- **五行相克影响**: 相克+10%，被克-10%
- **等级差异影响**: 每级差异减少1%成功率（最多减少20%）
- **材料加成**: 兽丹+20%，其他材料根据配置加成
- **最终范围**: 10%-95%

#### 技能继承机制
- **基础继承率**: 30%-35%（随机波动）
- **共同技能加成**: 两只召唤兽都拥有的技能继承率提升30%
- **必带技能**: 新召唤兽必定获得其种族的必带技能（guaranteedInitialSkills）
- **技能上限**: 双方技能数之和减1
- **材料加成**: 兽丹额外提升15%继承率

#### 属性继承
- **基础计算**: 两只召唤兽属性平均值的70%
- **材料加成**: 魂晶提升30%属性
- **随机变化**: 每个属性有小幅随机波动

#### 等级计算
- **基础等级**: 两只召唤兽等级平均值的60%
- **材料加成**: 魂晶额外提升5级
- **最低保证**: 至少1级

### 2. 合成材料系统

#### 兽丹 (Beast Pill)
```javascript
{
  id: 'beast_pill',
  name: '兽丹',
  description: '提升合成成功率和技能继承概率',
  successRateBonus: 0.2,      // +20%成功率
  skillInheritBonus: 0.15,    // +15%技能继承率
  rarity: 'rare'
}
```

#### 五行石 (Five Element Stone)
```javascript
{
  id: 'five_element_stone',
  name: '五行石',
  description: '可指定新生召唤兽的五行属性',
  allowElementChoice: true,    // 允许选择任意五行
  rarity: 'epic'
}
```

#### 魂晶 (Soul Crystal)
```javascript
{
  id: 'soul_crystal',
  name: '魂晶',
  description: '大幅提升合成后召唤兽的等级和属性',
  levelBonus: 5,              // +5级
  attributeBonus: 0.3,        // +30%属性
  rarity: 'legendary'
}
```

### 3. 五行相克系统

```javascript
// 相克关系（克制者获得加成）
金 → 木 (+10%成功率)
木 → 土 (+10%成功率)
水 → 火 (+10%成功率)
火 → 金 (+10%成功率)
土 → 水 (+10%成功率)

// 被克关系（被克制者受到减成）
火 → 金 (-10%成功率)
金 → 木 (-10%成功率)
土 → 水 (-10%成功率)
水 → 火 (-10%成功率)
木 → 土 (-10%成功率)
```

## 核心类详述

### SummonFusionManager 类

#### 职责
- 管理合成逻辑和数据
- 提供合成预览计算
- 处理合成执行
- 维护历史记录
- 管理合成材料

#### 核心方法

##### calculateFusionPreview(summon1, summon2, materials)
计算合成预览信息，包括：
- 成功率预测
- 技能继承详细分析
- 属性预期值
- 等级预测
- 可能的五行属性

##### performFusion(summon1, summon2, materials, selectedElement)
执行实际合成操作：
1. 计算成功率并判定成功/失败
2. 消耗合成材料
3. 生成新召唤兽或安慰奖
4. 标记原召唤兽需要删除
5. 记录历史并触发事件

##### calculateIndividualSkillInheritance(summon1, summon2, materials)
详细计算每个技能的继承概率：
- 为每个技能单独计算继承率
- 共同技能获得额外加成
- 返回详细的技能继承分析

### FusionResult 类

#### 数据结构
```javascript
{
  success: boolean,                    // 合成是否成功
  newSummon: Object,                   // 新生成的召唤兽
  inheritedSkills: Array,              // 继承的技能列表
  attributes: Object,                  // 新召唤兽属性
  messages: Array,                     // 合成过程消息
  consumedMaterials: Object,           // 消耗的材料
  parentSummonsToDelete: Array         // 需要删除的父母召唤兽ID
}
```

## UI组件架构

### EnhancedSummonFusionModal 组件

#### 主要功能
- 召唤兽选择界面
- 材料选择和预览
- 合成预览显示
- 结果展示和处理

#### 关键特性
- 使用React Portal避免容器限制
- 响应式设计适配不同屏幕
- 实时预览合成效果
- 详细的技能继承显示

#### 状态管理
```javascript
const [selectedSummon1, setSelectedSummon1] = useState(null);
const [selectedSummon2, setSelectedSummon2] = useState(null);
const [selectedMaterials, setSelectedMaterials] = useState([]);
const [selectedElement, setSelectedElement] = useState(null);
const [fusionResult, setFusionResult] = useState(null);
const [preview, setPreview] = useState(null);
```

### 技能继承显示组件

#### 显示内容
- 技能总数统计
- 共同技能数量
- 每个技能的具体继承概率
- 技能来源标识
- 概率条可视化
- 技能描述信息

#### 排序规则
1. 共同技能优先显示
2. 按继承概率从高到低排序
3. 相同概率按技能名称排序

## 事件系统

### 事件类型
```javascript
'materials_updated'    // 材料数量变化
'fusion_completed'     // 合成完成
'history_updated'      // 历史记录更新
```

### 事件数据结构
```javascript
// fusion_completed 事件
{
  fusionId: string,
  result: FusionResult,
  duration: number
}
```

## 数据持久化

### 历史记录存储
- 本地内存存储（当前会话）
- 限制最大100条记录
- 包含详细的合成信息和结果

### 材料数量管理
- 实时同步材料消耗
- 支持材料不足检查
- 自动扣除消耗材料

## 错误处理

### 合成过程错误
- 材料不足检查
- 召唤兽配置验证
- 生成过程异常捕获
- 用户友好的错误提示

### UI交互错误
- 无效操作阻止
- 状态回滚机制
- 加载状态管理
- 网络错误处理

## 性能优化

### 计算优化
- 预览计算使用useMemo缓存
- 避免不必要的重复计算
- 大量技能时的计算优化

### UI优化
- 虚拟滚动（技能列表较长时）
- 懒加载召唤兽信息
- 动画节流避免性能问题

### 内存管理
- 及时清理事件监听器
- 合理的状态更新策略
- 避免内存泄漏

## 扩展性设计

### 新材料添加
```javascript
// 在FUSION_MATERIALS中添加新配置
NEW_MATERIAL: {
  id: 'new_material',
  name: '新材料',
  description: '效果描述',
  successRateBonus: 0.1,
  // 其他效果配置
}
```

### 新合成规则
- 在FUSION_RULES中添加新规则配置
- 扩展calculateSuccessRate方法
- 添加新的加成计算逻辑

### 新UI功能
- 组件化设计便于功能扩展
- Hook模式便于状态管理
- 事件系统支持新功能集成

## 测试策略

### 单元测试
- 合成逻辑测试
- 概率计算验证
- 边界条件测试

### 集成测试
- UI组件交互测试
- 数据流测试
- 错误处理测试

### 用户体验测试
- 合成流程完整性
- 响应速度测试
- 界面易用性评估

## 配置参数

### 可调整参数
```javascript
// 在FUSION_RULES中的可调参数
BASE_SUCCESS_RATE: 0.7,           // 基础成功率
SKILL_INHERIT.BASE_RATE: 0.32,    // 基础技能继承率
SKILL_INHERIT.RATE_VARIANCE: 0.03, // 继承率随机波动
ELEMENT_COMPATIBILITY: {...},      // 五行相克配置
LEVEL_IMPACT: {...}               // 等级影响配置
```

### 材料效果配置
所有材料的效果都可以通过FUSION_MATERIALS配置调整，支持热更新。

## 注意事项

### 开发注意事项
1. 所有概率计算必须使用Math.random()保证随机性
2. 技能ID必须与skillConfig中的配置保持一致
3. 召唤兽配置必须包含guaranteedInitialSkills字段
4. 合成后必须删除原召唤兽避免重复

### 平衡性考虑
1. 合成成功率不宜过高或过低
2. 技能继承率需要平衡玩家期望
3. 材料获取难度与效果要匹配
4. 五行相克加成不宜过大

### 用户体验
1. 提供详细的预览信息
2. 清晰的进度反馈
3. 友好的错误提示
4. 合理的动画效果

---

## 版本历史

### v1.0.0 (当前版本)
- 基础合成功能实现
- 材料系统设计
- UI界面完成
- 技能继承优化
- 历史记录功能

### 待开发功能
- 合成预设保存
- 批量合成功能
- 高级材料效果
- 合成成就系统
- 数据统计分析 