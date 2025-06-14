# 装备属性统一化迁移文档

## 📋 更改概述

本次更新统一了装备系统的属性命名，移除了旧的通用 `attack` 和 `defense` 属性，改为更具体的物理/法术攻击和防御属性。

## 🔄 属性名称变更

### 旧属性 → 新属性
- `attack` → `physicalAttack` (物理攻击)
- `defense` → `physicalDefense` (物理防御)

### 新增属性
- `magicalAttack` (法术攻击)
- `magicalDefense` (法术防御)

## 📁 已更新的文件

### 配置文件
- ✅ `src/config/item/allItems.json`
  - `fineIronSword`: `attack` → `physicalAttack`
  - `legendaryAmulet`: `defense` → `physicalDefense`

### 核心系统文件
- ✅ `src/utils/equipmentEffectUtils.js`
  - 移除了兼容性属性名映射 (`attack: '攻击力'`, `defense: '防御力'`)

- ✅ `src/features/battle/logic/damageCalculation.js`
  - 移除了对 `attacker.derivedAttributes.attack` 的兼容性支持
  - 移除了对 `defender.derivedAttributes.defense` 的兼容性支持
  - 现在只支持 `physicalAttack/pAtk` 和 `physicalDefense/pDef`

- ✅ `src/store/slices/battleSlice.js`
  - 更新了战斗日志中的属性显示
  - 更新了技能伤害计算中的属性引用
  - 添加了对新属性名的支持，保持向后兼容

- ✅ `src/features/battle/logic/battleRewards.js`
  - 更新了战斗奖励装备生成
  - `attack` → `physicalAttack: {type: "flat", value: X}`
  - `defense` → `physicalDefense: {type: "flat", value: X}`
  - `magic` → `magicalAttack: {type: "flat", value: X}`

- ✅ `src/hooks/useInventoryManager.js`
  - 更新了测试数据生成
  - 装备推荐系统已使用正确的新属性名

- ✅ `src/store/GameStateManager.js`
  - 更新了 `Summon` 类的默认属性
  - 添加了 `physicalAttack`, `magicalAttack`, `physicalDefense`, `magicalDefense`

### 前端显示组件
- ✅ `src/features/inventory/components/InventorySystem.jsx`
  - 使用 `formatEffectDisplay` 统一效果显示

- ✅ `src/features/summon/components/EquippableItemsModal.jsx`
  - 使用 `formatEffectDisplay` 统一效果显示
  - 移除了旧的 `formatAttributeValue` 函数

- ✅ `src/config/item/equipmentConfig.js`
  - 更新了 `applyQualityToEquipment` 函数
  - 支持新的效果格式处理

## 🎯 新的属性系统特性

### 1. 明确的属性分类
```javascript
// 攻击属性
physicalAttack: 物理攻击力
magicalAttack: 法术攻击力

// 防御属性  
physicalDefense: 物理防御力
magicalDefense: 法术防御力
```

### 2. 支持的效果格式
```javascript
// 新格式 - 支持数值和百分比
{
  "physicalAttack": { "type": "flat", "value": 25 },
  "magicalAttack": { "type": "percent", "value": 15 },
  "critRate": 0.05  // 百分比属性保持原格式
}
```

### 3. 向后兼容性
- 战斗系统仍支持旧的简写属性名 (`pAtk`, `mAtk`, `pDef`, `mDef`)
- 装备效果计算支持新旧格式混合

## 🔧 开发者注意事项

### 创建新装备时
```javascript
// ✅ 正确的新格式
{
  "effects": {
    "physicalAttack": { "type": "flat", "value": 20 },
    "physicalDefense": { "type": "flat", "value": 15 },
    "magicalAttack": { "type": "percent", "value": 10 }
  }
}

// ❌ 避免使用旧格式
{
  "effects": {
    "attack": 20,
    "defense": 15
  }
}
```

### 在代码中引用属性
```javascript
// ✅ 推荐方式
const physicalAttack = unit.derivedAttributes.physicalAttack || 0;
const magicalAttack = unit.derivedAttributes.magicalAttack || 0;

// ⚠️ 仅在需要兼容性时使用
const physicalAttack = unit.derivedAttributes.physicalAttack || unit.derivedAttributes.pAtk || 0;
```

## 🧪 测试建议

1. **装备效果显示测试**
   - 验证装备详情中的属性显示格式正确
   - 确认新旧格式装备都能正确显示

2. **战斗系统测试**
   - 测试物理攻击和法术攻击的伤害计算
   - 验证防御属性的减伤效果

3. **装备推荐测试**
   - 确认推荐系统能正确识别新属性
   - 验证不同类型召唤兽的推荐准确性

## 📈 性能影响

- ✅ 无性能影响：属性名称更改不影响计算性能
- ✅ 内存使用：新属性结构更清晰，便于理解和维护
- ✅ 兼容性：保持了必要的向后兼容性

## 🚀 后续计划

1. **逐步移除兼容性代码**：在确认所有数据迁移完成后，可以移除对旧属性名的支持
2. **扩展属性系统**：可以考虑添加更多细分属性（如穿透、暴击等）
3. **UI优化**：根据新的属性分类优化装备对比和显示界面

---

**迁移完成时间**: 2025-01-27  
**影响范围**: 装备系统、战斗系统、UI显示  
**兼容性**: 保持向后兼容，支持渐进式迁移 