import { INVENTORY_CONFIG, ITEM_BASE_CONFIG } from '../config/inventoryConfig';
import InventoryItem from './InventoryItem';

class Inventory {
  constructor() {
    this.slots = new Array(INVENTORY_CONFIG.MAX_SLOTS).fill(null);
    this.onChange = null; // 用于通知UI更新的回调函数
  }

  // 添加物品到背包
  addItem(itemConfig, quantity = 1) {
    if (!itemConfig) {
      return { success: false, message: '无效的物品配置' };
    }

    // 创建新物品实例
    const newItem = new InventoryItem(itemConfig, quantity);
    
    // 如果是可堆叠物品，先尝试堆叠到现有物品上
    if (INVENTORY_CONFIG.STACK_RULES[newItem.type] > 1) {
      for (let i = 0; i < this.slots.length; i++) {
        const existingItem = this.slots[i];
        if (existingItem && existingItem.canStackWith(newItem)) {
          const stacked = existingItem.stackWith(newItem);
          if (stacked) {
            this._notifyChange();
            return { 
              success: true, 
              message: `物品已堆叠到第 ${i + 1} 格`,
              slot: i
            };
          }
        }
      }
    }

    // 如果无法堆叠或没有可堆叠的物品，寻找空位
    const emptySlot = this.slots.findIndex(slot => slot === null);
    if (emptySlot === -1) {
      return { success: false, message: '背包已满' };
    }

    this.slots[emptySlot] = newItem;
    this._notifyChange();
    return { 
      success: true, 
      message: `物品已添加到第 ${emptySlot + 1} 格`,
      slot: emptySlot
    };
  }

  // 从背包移除物品
  removeItem(slotIndex, quantity = 1) {
    if (slotIndex < 0 || slotIndex >= this.slots.length) {
      return { success: false, message: '无效的背包位置' };
    }

    const item = this.slots[slotIndex];
    if (!item) {
      return { success: false, message: '该位置没有物品' };
    }

    if (quantity >= item.quantity) {
      // 移除整个物品
      this.slots[slotIndex] = null;
    } else {
      // 减少物品数量
      item.quantity -= quantity;
    }

    this._notifyChange();
    return { 
      success: true, 
      message: `已从第 ${slotIndex + 1} 格移除物品`,
      remainingQuantity: item ? item.quantity : 0
    };
  }

  // 移动物品
  moveItem(fromSlot, toSlot) {
    if (fromSlot < 0 || fromSlot >= this.slots.length || 
        toSlot < 0 || toSlot >= this.slots.length) {
      return { success: false, message: '无效的背包位置' };
    }

    const fromItem = this.slots[fromSlot];
    const toItem = this.slots[toSlot];

    if (!fromItem) {
      return { success: false, message: '源位置没有物品' };
    }

    // 如果目标位置为空，直接移动
    if (!toItem) {
      this.slots[toSlot] = fromItem;
      this.slots[fromSlot] = null;
      this._notifyChange();
      return { success: true, message: '物品已移动' };
    }

    // 如果目标位置有相同类型的物品，尝试堆叠
    if (fromItem.canStackWith(toItem)) {
      const stacked = toItem.stackWith(fromItem);
      if (stacked) {
        if (fromItem.quantity === 0) {
          this.slots[fromSlot] = null;
        }
        this._notifyChange();
        return { success: true, message: '物品已堆叠' };
      }
    }

    // 如果无法堆叠，交换位置
    this.slots[fromSlot] = toItem;
    this.slots[toSlot] = fromItem;
    this._notifyChange();
    return { success: true, message: '物品已交换位置' };
  }

  // 使用物品
  useItem(slotIndex, target) {
    if (slotIndex < 0 || slotIndex >= this.slots.length) {
      return { success: false, message: '无效的背包位置' };
    }

    const item = this.slots[slotIndex];
    if (!item) {
      return { success: false, message: '该位置没有物品' };
    }

    const result = item.use(target);
    if (result.success && result.remainingQuantity === 0) {
      this.slots[slotIndex] = null;
    }
    
    this._notifyChange();
    return result;
  }

  // 分割物品
  splitItem(slotIndex, quantity) {
    if (slotIndex < 0 || slotIndex >= this.slots.length) {
      return { success: false, message: '无效的背包位置' };
    }

    const item = this.slots[slotIndex];
    if (!item) {
      return { success: false, message: '该位置没有物品' };
    }

    const newItem = item.split(quantity);
    if (!newItem) {
      return { success: false, message: '无法分割物品' };
    }

    // 寻找空位放置分割出的物品
    const emptySlot = this.slots.findIndex(slot => slot === null);
    if (emptySlot === -1) {
      return { success: false, message: '背包已满，无法分割物品' };
    }

    this.slots[emptySlot] = newItem;
    this._notifyChange();
    return { 
      success: true, 
      message: `物品已分割到第 ${emptySlot + 1} 格`,
      slot: emptySlot
    };
  }

  // 获取背包状态
  getState() {
    return {
      slots: this.slots,
      maxSlots: INVENTORY_CONFIG.MAX_SLOTS,
      usedSlots: this.slots.filter(slot => slot !== null).length
    };
  }

  // 根据 EquipmentEntity ID 查找 InventoryItem
  findItemByEntityId(entityId) {
    if (!entityId) return null;
    for (const item of this.slots) {
      if (item && item.itemType === 'equipment' && item.equipmentEntityId === entityId) {
        return item;
      }
    }
    return null;
  }

  // 设置变更通知回调
  setOnChange(callback) {
    this.onChange = callback;
  }

  // 通知变更
  _notifyChange() {
    if (this.onChange) {
      this.onChange(this.getState());
    }
  }
}

export default Inventory; 