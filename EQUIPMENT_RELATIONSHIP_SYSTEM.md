# 装备关系管理系统

## 概述

装备关系管理系统是一个中间层，用于统一管理背包系统和召唤兽系统之间的装备关系，解决原有系统中装备状态不一致和管理混乱的问题。

## 架构设计

### 核心组件

1. **EquipmentRelationshipManager** - 核心管理器类
2. **useEquipmentRelationship** - React Hook 接口
3. **EquipmentRelationshipDemo** - 演示和测试组件

### 设计原则

- **数据一致性**: 统一的装备关系存储，避免多个系统间的数据不同步
- **事件驱动**: 基于 EventEmitter 的状态同步机制
- **面向对象**: 清晰的职责分离和接口设计
- **双向索引**: 支持高效的正向和反向查询

## 核心功能

### 1. 装备关系管理

```javascript
// 装备物品到召唤兽
equipItem(itemId, summonId, slotType)

// 卸下装备
unequipItem(itemId)

// 从特定槽位卸下装备
unequipFromSlot(summonId, slotType)

// 交换两个召唤兽的装备
swapEquipment(summonId1, summonId2, slotType)

// 移除召唤兽的所有装备
removeAllSummonEquipment(summonId)
```

### 2. 状态查询

```javascript
// 获取物品的装备状态
getItemEquipmentStatus(itemId)

// 获取召唤兽的所有装备
getSummonEquipment(summonId)

// 检查物品是否被装备
isItemEquipped(itemId)

// 检查召唤兽槽位是否有装备
isSlotEquipped(summonId, slotType)
```

### 3. 数据维护

```javascript
// 验证数据一致性
validateConsistency()

// 修复数据不一致
repairConsistency()

// 获取统计信息
getStatistics()
```

## 数据结构

### 装备关系表
```javascript
// itemId -> { summonId, slotType, equippedAt }
Map<string, {
  summonId: string,
  slotType: string,
  equippedAt: number
}>
```

### 召唤兽装备索引
```javascript
// summonId -> { slotType: itemId }
Map<string, {
  [slotType: string]: string
}>
```

## React Hooks

### useEquipmentRelationship()
主要的装备关系管理 Hook，提供完整的操作和查询接口。

```javascript
const {
  equipItem,
  unequipItem,
  getSummonEquipment,
  isItemEquipped,
  statistics,
  isLoading,
  error
} = useEquipmentRelationship();
```

### useItemEquipmentStatus(itemId)
监听特定物品的装备状态变化。

```javascript
const {
  isEquipped,
  equipmentInfo,
  summonId,
  slotType,
  equippedAt
} = useItemEquipmentStatus(itemId);
```

### useSummonEquipmentStatus(summonId)
监听特定召唤兽的装备状态变化。

```javascript
const {
  equipment,
  equippedItemIds,
  slotCount,
  isEmpty,
  getItemInSlot,
  hasItemInSlot
} = useSummonEquipmentStatus(summonId);
```

### useEquipmentStatistics()
获取装备关系的统计信息。

```javascript
const statistics = useEquipmentStatistics();
// {
//   totalRelations: number,
//   totalSummons: number,
//   averageEquipmentPerSummon: number,
//   slotTypeDistribution: object,
//   summonEquipmentCounts: object
// }
```

## 事件系统

装备关系管理器基于 EventEmitter 实现，支持以下事件：

- `item_equipped` - 物品被装备时触发
- `item_unequipped` - 物品被卸下时触发
- `data_imported` - 数据导入完成时触发
- `data_cleared` - 数据被清空时触发

## 与现有系统的集成

### 背包系统集成
装备关系变化时，自动触发 Redux action 更新背包中物品的装备状态：

```javascript
dispatch({
  type: 'inventory/updateItemStatus',
  payload: { itemId, equipped: true, summonId, slotType }
});
```

### 召唤兽系统集成
装备关系变化时，自动触发 Redux action 更新召唤兽的装备显示：

```javascript
dispatch({
  type: 'summon/updateEquipment',
  payload: { summonId, slotType, itemId }
});
```

## 使用示例

### 基本装备操作
```javascript
import { useEquipmentRelationship } from '../hooks/useEquipmentRelationship';

const MyComponent = () => {
  const { equipItem, unequipItem, getSummonEquipment } = useEquipmentRelationship();

  const handleEquip = async () => {
    const success = await equipItem('item_001', 'summon_001', 'weapon');
    if (success) {
      console.log('装备成功');
    }
  };

  const handleUnequip = async () => {
    const success = await unequipItem('item_001');
    if (success) {
      console.log('卸装成功');
    }
  };

  const equipment = getSummonEquipment('summon_001');
  console.log('召唤兽装备:', equipment);
};
```

### 状态监听
```javascript
import { useItemEquipmentStatus } from '../hooks/useEquipmentRelationship';

const ItemComponent = ({ itemId }) => {
  const { isEquipped, summonId, slotType } = useItemEquipmentStatus(itemId);

  return (
    <div>
      <div>装备状态: {isEquipped ? '已装备' : '未装备'}</div>
      {isEquipped && (
        <div>
          <div>装备的召唤兽: {summonId}</div>
          <div>装备槽位: {slotType}</div>
        </div>
      )}
    </div>
  );
};
```

## 测试和调试

### 演示系统
项目中包含 `EquipmentRelationshipDemo` 组件，提供：

- 基本操作测试界面
- 状态查询测试
- 数据一致性检查
- 统计信息显示
- 装备关系列表

### 调试工具
在开发环境下，装备关系管理器挂载到全局对象：

```javascript
// 浏览器控制台
window.equipmentRelationshipManager.getStatistics()
window.equipmentRelationshipManager.validateConsistency()
window.equipmentRelationshipManager.getAllEquipmentRelations()
```

### 访问入口
1. 启动项目: `npm run dev:vite`
2. 在游戏底部菜单栏点击蓝色的"装备关系"按钮
3. 在打开的演示界面中进行测试

## 优势

1. **统一管理**: 所有装备关系通过统一接口管理，避免数据不一致
2. **高性能**: 双向索引设计，支持高效查询
3. **自动同步**: 基于事件的状态同步，确保UI实时更新
4. **数据完整性**: 内置一致性检查和修复机制
5. **易于扩展**: 清晰的接口设计，便于添加新功能
6. **开发友好**: 完善的Hook接口和调试工具

## 未来扩展

- 装备推荐系统
- 装备组合效果
- 装备历史记录
- 批量装备操作
- 装备模板保存/加载

## 注意事项

1. 在进行装备操作前，确保相关的物品和召唤兽存在
2. 装备操作是异步的，需要等待操作完成
3. 定期运行数据一致性检查，确保系统稳定
4. 在生产环境中，建议添加更多的错误处理和用户提示 