# 面向对象背包系统设计文档

## 概述

基于核心OOP设计原则的御灵录背包系统：**继承与多态**、**双向关联**、**单一职责**、**扩展性**。

## 1. 继承与多态

### 类继承体系

```
Item (基类)
├── Equipment (装备类)
├── Consumable (消耗品类)
├── Material (材料类)
└── QuestItem (任务道具类)
```

### 多态实现

#### Item基类定义虚方法
```javascript
class Item {
  // 虚方法 - 子类必须重写
  use(target = null) {
    throw new Error(`${this.constructor.name}必须实现use方法`);
  }
}
```

#### 子类重写实现不同逻辑

**Equipment类 - 装备逻辑**
```javascript
class Equipment extends Item {
  use(target = null) {
    if (!target || this.isEquipped) {
      return false;
    }
    // 装备到目标召唤兽，触发属性加成
    const success = this.equipTo(target);
    if (success) {
      this.applyEffects(target); // 应用装备效果
    }
    return success;
  }
}
```

**Consumable类 - 消耗品逻辑**
```javascript
class Consumable extends Item {
  use(target = null) {
    if (this.quantity <= 0) return false;
    
    // 消耗一个物品，执行回血等效果
    this.removeQuantity(1);
    this.applyUseEffect(target); // 回血、回蓝等
    
    // 用完自动移除
    if (this.quantity <= 0) {
      this.removeFromInventory();
    }
    return true;
  }
}
```

### 运行时多态调用
```javascript
// 背包管理器中的统一调用
useItem(slotIndex, target = null) {
  const item = this.items.get(slot.itemId);
  // 运行时根据实际类型调用正确的use方法
  const success = item.use(target); // 多态！
}
```

## 2. 双向关联

### 关联关系设计

```javascript
class Item {
  constructor(data) {
    // 双向关联 - 背包引用
    this.inventory = null;    // 指向所属背包
    this.slotIndex = null;    // 知道自己在哪个插槽
  }
  
  // 建立双向关联
  setInventory(inventory, slotIndex) {
    this.inventory = inventory;
    this.slotIndex = slotIndex;
  }
  
  // 物品主动从背包移除自己
  removeFromInventory() {
    if (this.inventory && this.slotIndex !== null) {
      return this.inventory.removeItem(this.slotIndex);
    }
    return false;
  }
}
```

### 背包侧关联
```javascript
class InventoryManager {
  addItemToSlot(item, slotIndex) {
    // 建立双向关联
    item.setInventory(this, slotIndex);
    
    // 设置插槽和物品映射
    slot.setItem(item.id);
    this.items.set(item.id, item);
  }
}
```

### 双向关联的好处

1. **物品自治**：物品可以主动从背包中移除自己
2. **状态一致**：物品状态变化时可通知背包
3. **解耦设计**：减少外部代码对内部实现的依赖

## 3. 单一职责原则

### 职责分离设计

| 类名 | 单一职责 | 具体功能 |
|------|----------|----------|
| `InventoryManager` | 物品存储管理 | 插槽分配、物品映射、持久化 |
| `Item`及子类 | 物品行为封装 | 使用效果、堆叠、分割 |
| `InventorySlot` | 插槽状态管理 | 空/占用状态、物品ID映射 |
| `ItemFactory` | 物品实例创建 | 根据类型创建正确的物品类 |

### 职责边界清晰

```javascript
// ❌ 错误：背包管理器不应该知道具体的使用逻辑
class InventoryManager {
  useItem(slotIndex) {
    const item = this.getItem(slotIndex);
    if (item.type === 'potion') {
      // 恢复血量逻辑...
    } else if (item.type === 'equipment') {
      // 装备逻辑...
    }
  }
}

// ✅ 正确：委托给物品自己处理
class InventoryManager {
  useItem(slotIndex, target) {
    const item = this.getItem(slotIndex);
    return item.use(target); // 委托给物品
  }
}
```

## 4. 扩展性设计

### 新增物品类型的步骤

1. **继承Item基类**
```javascript
class MagicScroll extends Item {
  constructor(data) {
    super({
      ...data,
      type: "magic_scroll",
      stackable: true
    });
    this.spellType = data.spellType;
    this.manaCost = data.manaCost;
  }
}
```

2. **重写use方法**
```javascript
class MagicScroll extends Item {
  use(target = null) {
    if (!target || target.mana < this.manaCost) {
      return false;
    }
    
    // 消耗魔法值，释放法术
    target.mana -= this.manaCost;
    this.castSpell(target);
    this.removeQuantity(1);
    
    return true;
  }
  
  castSpell(target) {
    console.log(`释放${this.spellType}法术`);
    // 具体法术逻辑...
  }
}
```

3. **更新工厂类**
```javascript
class ItemFactory {
  static createItem(data) {
    switch (data.type) {
      case "equipment": return new Equipment(data);
      case "consumable": return new Consumable(data);
      case "material": return new Material(data);
      case "quest": return new QuestItem(data);
      case "magic_scroll": return new MagicScroll(data); // 新增
      default: return new Item(data);
    }
  }
}
```

### 零修改扩展

- **现有代码无需修改**：InventoryManager、UI组件等
- **自动支持新类型**：工厂模式 + 多态机制
- **行为自定义**：新类型可实现完全不同的使用逻辑

## 5. 架构优势

### 对比传统方式

| 特性 | 传统方式 | OOP方式 |
|------|----------|---------|
| 新增类型 | 修改多处switch/if | 只需继承+工厂配置 |
| 使用逻辑 | 集中在管理器中 | 分散在各物品类中 |
| 代码耦合 | 高耦合 | 低耦合 |
| 测试难度 | 难以单独测试 | 可独立测试各类 |
| 维护性 | 一处改动影响全局 | 修改隔离 |

### 性能优化

1. **事件驱动更新**：只有变化的插槽触发UI更新
2. **延迟保存**：1秒延迟批量保存，避免频繁IO
3. **内存优化**：双向关联避免重复查找

## 6. 使用示例

### 创建不同类型物品
```javascript
// 工厂自动创建正确类型
const sword = ItemFactory.createItem({
  name: "青龙偃月刀",
  type: "equipment",
  slotType: "weapon",
  effects: { attack: 50 }
});

const potion = ItemFactory.createItem({
  name: "超级金疮药", 
  type: "consumable",
  useEffect: { heal: 1000 }
});
```

### 多态使用
```javascript
// 统一的使用接口，不同行为
inventoryManager.useItem(0, summonTarget); // 装备武器
inventoryManager.useItem(1, playerTarget);  // 使用药水
```

### 双向关联操作
```javascript
// 物品可以主动移除自己
if (consumable.quantity <= 0) {
  consumable.removeFromInventory(); // 双向关联
}
```

## 7. 最佳实践

### 设计原则
1. **开闭原则**：对扩展开放，对修改关闭
2. **里氏替换**：子类可以完全替换父类
3. **依赖倒置**：依赖抽象而非具体实现
4. **接口隔离**：每个类只暴露必要的接口

### 命名规范
- 类名：大驼峰，名词（Equipment, Consumable）
- 方法名：小驼峰，动词（use, equipTo, removeFromInventory）
- 属性名：小驼峰，名词（slotType, useEffect）

### 代码组织
```
src/store/
├── InventoryManager.js     # 主要逻辑
├── items/                  # 物品类
│   ├── Item.js            # 基类
│   ├── Equipment.js       # 装备类
│   ├── Consumable.js      # 消耗品类
│   └── ItemFactory.js     # 工厂类
└── slots/
    └── InventorySlot.js   # 插槽类
```

## 8. 扩展方向

### 可能的扩展类型
- **MagicScroll**：法术卷轴（消耗魔法值释放技能）
- **KeyItem**：关键道具（触发剧情、开启区域）
- **Recipe**：配方（用于合成系统）
- **Currency**：货币（金币、元宝、声望）

### 系统集成
- **召唤兽系统**：装备效果应用到召唤兽属性
- **战斗系统**：消耗品在战斗中的使用逻辑
- **任务系统**：任务道具的触发机制
- **商店系统**：物品的买卖价格计算

这个设计充分体现了面向对象编程的核心思想，为游戏系统提供了良好的扩展性和维护性。 