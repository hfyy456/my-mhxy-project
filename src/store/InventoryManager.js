/**
 * 面向对象的背包管理器
 * 特点：数据与逻辑分离，支持与Redux并行运行
 */
import { EventEmitter } from "events";
import { generateUniqueId } from "@/utils/idUtils";
// 背包插槽类
class InventorySlot {
  constructor(index, itemId = null) {
    this.index = index;
    this.itemId = itemId;
    this.isEmpty = itemId === null;
  }

  setItem(itemId) {
    this.itemId = itemId;
    this.isEmpty = false;
  }

  removeItem() {
    this.itemId = null;
    this.isEmpty = true;
    return this.itemId;
  }

  toJSON() {
    return {
      index: this.index,
      itemId: this.itemId,
      isEmpty: this.isEmpty,
    };
  }
}

// 游戏物品类（扩展版本）
class GameItem {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.name = data.name || "";
    this.type = data.type || "misc";
    this.subType = data.subType || "";
    this.rarity = data.rarity || "common";
    this.quality = data.quality || "normal";
    this.quantity = data.quantity || 1;
    this.maxStack = data.maxStack || 1;
    this.stackable = data.stackable !== false && this.maxStack > 1;
    this.description = data.description || "";
    this.level = data.level || 1;
    this.value = data.value || 0; // 商店价值

    // 装备相关属性
    this.isEquipment = data.type === "equipment";
    this.slotType = data.slotType || null; // 装备槽位类型
    this.effects = data.effects || {}; // 装备效果
    this.requirements = data.requirements || {}; // 装备需求

    // 消耗品相关
    this.isConsumable = data.type === "consumable";
    this.useEffect = data.useEffect || null; // 使用效果

    // 状态标记
    this.isEquipped = data.isEquipped || false;
    this.equippedBy = data.equippedBy || null; // 装备者ID

    // 时间戳
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  // 是否可以与另一个物品堆叠
  canStackWith(otherItem) {
    return (
      this.stackable &&
      otherItem.id === this.id &&
      !this.isEquipped &&
      !otherItem.isEquipped &&
      this.quantity + otherItem.quantity <= this.maxStack
    );
  }

  // 增加数量
  addQuantity(amount) {
    if (!this.stackable) return false;

    const newQuantity = this.quantity + amount;
    if (newQuantity <= this.maxStack) {
      this.quantity = newQuantity;
      this.updatedAt = Date.now();
      return true;
    }
    return false;
  }

  // 减少数量
  removeQuantity(amount) {
    if (amount >= this.quantity) {
      const removedQuantity = this.quantity;
      this.quantity = 0;
      return removedQuantity;
    } else {
      this.quantity -= amount;
      this.updatedAt = Date.now();
      return amount;
    }
  }

  // 分割物品
  split(amount) {
    if (!this.stackable || amount >= this.quantity) return null;

    const splitItem = new GameItem({
      ...this.toJSON(),
      id: this.generateId(),
      quantity: amount,
    });

    this.quantity -= amount;
    this.updatedAt = Date.now();

    return splitItem;
  }

  // 装备到召唤兽
  equipTo(summonId) {
    if (!this.isEquipment) return false;

    this.isEquipped = true;
    this.equippedBy = summonId;
    this.updatedAt = Date.now();
    return true;
  }

  // 卸下装备
  unequip() {
    this.isEquipped = false;
    this.equippedBy = null;
    this.updatedAt = Date.now();
  }

  // 使用物品
  use(target = null) {
    if (!this.isConsumable || this.quantity <= 0) return false;

    this.removeQuantity(1);

    // 执行使用效果
    if (this.useEffect && typeof this.useEffect === "function") {
      this.useEffect(target);
    }

    return this.quantity > 0; // 返回是否还有剩余
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      subType: this.subType,
      rarity: this.rarity,
      quality: this.quality,
      quantity: this.quantity,
      maxStack: this.maxStack,
      stackable: this.stackable,
      description: this.description,
      level: this.level,
      value: this.value,
      isEquipment: this.isEquipment,
      slotType: this.slotType,
      effects: { ...this.effects },
      requirements: { ...this.requirements },
      isConsumable: this.isConsumable,
      useEffect: this.useEffect,
      isEquipped: this.isEquipped,
      equippedBy: this.equippedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  generateId() {
    return generateUniqueId("item");
  }
}

// 背包管理器类
class InventoryManager extends EventEmitter {
  constructor(initialCapacity = 100) {
    super();

    this.slots = new Map(); // 插槽映射
    this.items = new Map(); // 物品映射
    this.capacity = initialCapacity;
    this.gold = 0;

    // 初始化插槽
    this.initializeSlots();

    // 自动保存机制
    this.setupAutoSave();
  }

  // 初始化插槽
  initializeSlots() {
    for (let i = 0; i < this.capacity; i++) {
      this.slots.set(i, new InventorySlot(i));
    }
  }

  // 初始化默认物品
  initializeDefaultItems() {}

  // 获取状态快照
  getState() {
    return {
      slots: Array.from(this.slots.values()).map((slot) => slot.toJSON()),
      items: Array.from(this.items.values()).map((item) => item.toJSON()),
      capacity: this.capacity,
      gold: this.gold,
      usedSlots: this.getUsedSlotsCount(),
      availableSlots: this.getAvailableSlotsCount(),
    };
  }

  // 获取已使用插槽数量
  getUsedSlotsCount() {
    return Array.from(this.slots.values()).filter((slot) => !slot.isEmpty)
      .length;
  }

  // 获取可用插槽数量
  getAvailableSlotsCount() {
    return this.capacity - this.getUsedSlotsCount();
  }

  // 检查背包是否已满
  isFull() {
    return this.getUsedSlotsCount() >= this.capacity;
  }

  // 寻找空插槽
  findEmptySlot() {
    for (const slot of this.slots.values()) {
      if (slot.isEmpty) {
        return slot.index;
      }
    }
    return -1;
  }

  // 寻找可堆叠的插槽
  findStackableSlot(item) {
    if (!item.stackable) return -1;

    for (const slot of this.slots.values()) {
      if (!slot.isEmpty && slot.itemId) {
        const existingItem = this.items.get(slot.itemId);
        if (existingItem && existingItem.canStackWith(item)) {
          return slot.index;
        }
      }
    }
    return -1;
  }

  // 添加物品到背包
  addItem(itemData, targetSlot = null) {
    try {
      const item =
        itemData instanceof GameItem ? itemData : new GameItem(itemData);

      // 如果指定了目标插槽
      if (targetSlot !== null) {
        return this.addItemToSlot(item, targetSlot);
      }

      // 尝试堆叠
      if (item.stackable) {
        const stackableSlot = this.findStackableSlot(item);
        if (stackableSlot !== -1) {
          return this.stackItem(item, stackableSlot);
        }
      }

      // 寻找空插槽
      const emptySlot = this.findEmptySlot();
      if (emptySlot === -1) {
        this.emit("error", { type: "inventory_full", message: "背包已满" });
        return false;
      }

      return this.addItemToSlot(item, emptySlot);
    } catch (error) {
      this.emit("error", { type: "add_item_failed", message: error.message });
      return false;
    }
  }

  // 添加物品到指定插槽
  addItemToSlot(item, slotIndex) {
    const slot = this.slots.get(slotIndex);
    if (!slot) {
      throw new Error(`插槽 ${slotIndex} 不存在`);
    }

    if (!slot.isEmpty) {
      throw new Error(`插槽 ${slotIndex} 已被占用`);
    }

    this.items.set(item.id, item);
    slot.setItem(item.id);

    this.emit("item_added", { item: item.toJSON(), slotIndex });
    this.emit("inventory_changed", this.getState());
    this.scheduleAutoSave();

    return true;
  }

  // 堆叠物品
  stackItem(newItem, slotIndex) {
    const slot = this.slots.get(slotIndex);
    const existingItem = this.items.get(slot.itemId);

    if (!existingItem || !existingItem.canStackWith(newItem)) {
      return false;
    }

    const addedQuantity = Math.min(
      newItem.quantity,
      existingItem.maxStack - existingItem.quantity
    );

    existingItem.addQuantity(addedQuantity);
    newItem.removeQuantity(addedQuantity);

    this.emit("item_stacked", {
      item: existingItem.toJSON(),
      slotIndex,
      addedQuantity,
    });

    // 立即触发inventory_changed事件
    this.emit("inventory_changed", this.getState());

    // 如果新物品还有剩余，尝试放入其他插槽
    if (newItem.quantity > 0) {
      const result = this.addItem(newItem);
      // 即使递归调用addItem也要确保触发状态更新
      this.emit("inventory_changed", this.getState());
      this.scheduleAutoSave();
      return result;
    }

    this.scheduleAutoSave();
    return true;
  }

  // 移除物品
  removeItem(slotIndex, quantity = null) {
    const slot = this.slots.get(slotIndex);
    if (!slot || slot.isEmpty) {
      return null;
    }

    const item = this.items.get(slot.itemId);
    if (!item) return null;

    let removedItem;

    if (quantity === null || quantity >= item.quantity) {
      // 移除整个物品
      removedItem = item;
      this.items.delete(item.id);
      slot.removeItem();
    } else {
      // 部分移除
      removedItem = item.split(quantity);
      if (!removedItem) return null;
    }

    this.emit("item_removed", {
      item: removedItem.toJSON(),
      slotIndex,
      remaining: item.quantity > 0 ? item.toJSON() : null,
    });
    this.emit("inventory_changed", this.getState());
    this.scheduleAutoSave();

    return removedItem;
  }

  // 移动物品
  moveItem(fromSlot, toSlot) {
    const fromSlotObj = this.slots.get(fromSlot);
    const toSlotObj = this.slots.get(toSlot);

    if (!fromSlotObj || !toSlotObj) {
      throw new Error("无效的插槽索引");
    }

    if (fromSlotObj.isEmpty) {
      return false;
    }

    // 交换物品
    const temp = toSlotObj.itemId;
    toSlotObj.itemId = fromSlotObj.itemId;
    toSlotObj.isEmpty = false;

    if (temp === null) {
      fromSlotObj.removeItem();
    } else {
      fromSlotObj.setItem(temp);
    }

    this.emit("item_moved", { fromSlot, toSlot });
    this.emit("inventory_changed", this.getState());
    this.scheduleAutoSave();

    return true;
  }

  // 使用物品
  useItem(slotIndex, target = null) {
    const slot = this.slots.get(slotIndex);
    if (!slot || slot.isEmpty) {
      return false;
    }

    const item = this.items.get(slot.itemId);
    if (!item || !item.isConsumable) {
      return false;
    }

    const hasRemaining = item.use(target);

    if (!hasRemaining) {
      this.items.delete(item.id);
      slot.removeItem();
    }

    this.emit("item_used", {
      item: item.toJSON(),
      slotIndex,
      target,
      hasRemaining,
    });
    this.emit("inventory_changed", this.getState());
    this.scheduleAutoSave();

    return true;
  }

  // 装备物品
  equipItem(slotIndex, summonId) {
    const slot = this.slots.get(slotIndex);
    if (!slot || slot.isEmpty) {
      return false;
    }

    const item = this.items.get(slot.itemId);
    if (!item || !item.isEquipment) {
      return false;
    }

    const success = item.equipTo(summonId);
    if (success) {
      this.emit("item_equipped", {
        item: item.toJSON(),
        slotIndex,
        summonId,
      });
      this.emit("inventory_changed", this.getState());
      this.scheduleAutoSave();
    }

    return success;
  }

  // 卸下装备
  unequipItem(slotIndex) {
    const slot = this.slots.get(slotIndex);
    if (!slot || slot.isEmpty) {
      return false;
    }

    const item = this.items.get(slot.itemId);
    if (!item || !item.isEquipped) {
      return false;
    }

    item.unequip();

    this.emit("item_unequipped", {
      item: item.toJSON(),
      slotIndex,
    });
    this.emit("inventory_changed", this.getState());
    this.scheduleAutoSave();

    return true;
  }

  // 金币操作
  addGold(amount) {
    this.gold += Math.max(0, amount);
    this.emit("gold_changed", this.gold);
    this.emit("inventory_changed", this.getState());
    this.scheduleAutoSave();
  }

  removeGold(amount) {
    const removed = Math.min(this.gold, Math.max(0, amount));
    this.gold -= removed;
    this.emit("gold_changed", this.gold);
    this.emit("inventory_changed", this.getState());
    this.scheduleAutoSave();
    return removed;
  }

  // 扩展容量
  expandCapacity(additionalSlots) {
    const oldCapacity = this.capacity;
    this.capacity += additionalSlots;

    // 添加新插槽
    for (let i = oldCapacity; i < this.capacity; i++) {
      this.slots.set(i, new InventorySlot(i));
    }

    this.emit("capacity_expanded", {
      oldCapacity,
      newCapacity: this.capacity,
      additionalSlots,
    });
    this.emit("inventory_changed", this.getState());
    this.scheduleAutoSave();
  }

  // 排序背包
  sortInventory(sortType = "type", order = "asc") {
    const items = Array.from(this.items.values());
    const itemSlotMap = new Map();

    // 记录当前物品所在插槽
    for (const [slotIndex, slot] of this.slots.entries()) {
      if (!slot.isEmpty) {
        itemSlotMap.set(slot.itemId, slotIndex);
      }
    }

    // 排序物品
    items.sort((a, b) => {
      let comparison = 0;

      switch (sortType) {
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "rarity":
          const rarityOrder = [
            "common",
            "uncommon",
            "rare",
            "epic",
            "legendary",
          ];
          comparison =
            rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
          break;
        case "level":
          comparison = a.level - b.level;
          break;
        case "value":
          comparison = a.value - b.value;
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }

      return order === "desc" ? -comparison : comparison;
    });

    // 清空所有插槽
    for (const slot of this.slots.values()) {
      slot.removeItem();
    }

    // 重新分配物品到插槽
    items.forEach((item, index) => {
      if (index < this.capacity) {
        const slot = this.slots.get(index);
        slot.setItem(item.id);
      }
    });

    this.emit("inventory_sorted", { sortType, order });
    this.emit("inventory_changed", this.getState());
    this.scheduleAutoSave();
  }

  // 获取物品列表
  getItems() {
    return Array.from(this.items.values()).map((item) => item.toJSON());
  }

  // 根据ID获取物品
  getItemById(itemId) {
    const item = this.items.get(itemId);
    return item ? item.toJSON() : null;
  }

  // 根据插槽获取物品
  getItemBySlot(slotIndex) {
    const slot = this.slots.get(slotIndex);
    if (!slot || slot.isEmpty) return null;

    const item = this.items.get(slot.itemId);
    return item ? item.toJSON() : null;
  }

  // 搜索物品
  searchItems(query, filters = {}) {
    const items = Array.from(this.items.values());

    return items
      .filter((item) => {
        // 文本搜索
        if (query && !item.name.toLowerCase().includes(query.toLowerCase())) {
          return false;
        }

        // 过滤器
        for (const [key, value] of Object.entries(filters)) {
          if (item[key] !== value) {
            return false;
          }
        }

        return true;
      })
      .map((item) => item.toJSON());
  }

  // 自动保存设置
  setupAutoSave() {
    this.saveTimeout = null;
  }

  scheduleAutoSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveToElectronStore();
    }, 1000); // 1秒后保存
  }

  // 保存到Electron Store
  async saveToElectronStore() {
    if (window.electronAPI?.store) {
      try {
        const stateToSave = this.serializeForStorage();
        await window.electronAPI.store.set("inventoryState", stateToSave);
        this.emit("state_saved");
      } catch (error) {
        console.error("保存背包状态失败:", error);
        this.emit("error", { type: "save_failed", message: error.message });
      }
    }
  }

  // 从Electron Store加载
  async loadFromElectronStore() {
    if (window.electronAPI?.store) {
      try {
        const savedState = await window.electronAPI.store.get("inventoryState");
        if (savedState) {
          this.deserializeFromStorage(savedState);
          this.emit("state_loaded", this.getState());
          console.log("[InventoryManager] 加载已保存的背包状态");
        } else {
          // 没有保存数据，初始化默认物品
          this.initializeDefaultItems();
          console.log("[InventoryManager] 没有保存数据，初始化默认物品");
        }
      } catch (error) {
        console.error("加载背包状态失败:", error);
        this.emit("error", { type: "load_failed", message: error.message });
        // 如果加载失败，也初始化默认物品
        this.initializeDefaultItems();
      }
    } else {
      // 没有electron store，初始化默认物品
      this.initializeDefaultItems();
      console.log("[InventoryManager] 没有Electron Store，初始化默认物品");
    }
  }

  // 序列化存储
  serializeForStorage() {
    return {
      slots: Array.from(this.slots.entries()).map(([index, slot]) => [
        index,
        slot.toJSON(),
      ]),
      items: Array.from(this.items.entries()).map(([id, item]) => [
        id,
        item.toJSON(),
      ]),
      capacity: this.capacity,
      gold: this.gold,
      timestamp: Date.now(),
    };
  }

  // 反序列化
  deserializeFromStorage(savedState) {
    // 重置状态
    this.slots.clear();
    this.items.clear();

    // 恢复基本属性
    this.capacity = savedState.capacity || 100;
    this.gold = savedState.gold || 0;

    // 恢复插槽
    if (savedState.slots) {
      savedState.slots.forEach(([index, slotData]) => {
        const slot = new InventorySlot(index, slotData.itemId);
        this.slots.set(index, slot);
      });
    }

    // 恢复物品
    if (savedState.items) {
      savedState.items.forEach(([id, itemData]) => {
        const item = new GameItem(itemData);
        this.items.set(id, item);
      });
    }

    // 确保有足够的插槽
    for (let i = this.slots.size; i < this.capacity; i++) {
      this.slots.set(i, new InventorySlot(i));
    }
  }

  // 清理资源
  destroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.removeAllListeners();
  }

  // 装备物品到召唤兽
  async equipItemToSummon(slotIndex, summonId, options = {}) {
    try {
      const item = this.getItemBySlot(slotIndex);
      if (!item) {
        throw new Error("该位置没有物品");
      }

      if (!item.isEquipment) {
        throw new Error("该物品不是装备");
      }

      // 动态导入Redux store和actions
      const [store, { manageEquipItemThunk }] = await Promise.all([
        import("./index.js").then((m) => m.default),
        import("./thunks/equipmentThunks.js"),
      ]);

      // 检查召唤兽是否存在
      const summon = store.getState().summons.allSummons[summonId];
      if (!summon) {
        throw new Error("找不到指定的召唤兽");
      }

      // 执行装备操作
      const result = await store.dispatch(
        manageEquipItemThunk({
          summonId,
          itemIdToEquip: item.id,
          slotType: item.slotType,
        })
      );

      if (result.meta.requestStatus === "fulfilled") {
        // 从背包中移除物品
        this.removeItem(slotIndex);

        this.emit("item_equipped_to_summon", {
          item,
          summonId,
          slotType: item.slotType,
          timestamp: Date.now(),
        });

        return {
          success: true,
          equippedItem: item,
          summonId,
          message: `成功将 ${item.name} 装备给召唤兽`,
        };
      } else {
        throw new Error(result.payload || "装备失败");
      }
    } catch (error) {
      console.error("装备物品到召唤兽失败:", error);
      this.emit("error", {
        type: "equip_error",
        message: error.message,
        timestamp: Date.now(),
      });
      return { success: false, error: error.message };
    }
  }

  // 从召唤兽卸下装备到背包
  async unequipItemFromSummon(summonId, slotType, targetSlot = null) {
    try {
      // 动态导入Redux store和actions
      const [store, { manageUnequipItemThunk }] = await Promise.all([
        import("./index.js").then((m) => m.default),
        import("./thunks/equipmentThunks.js"),
      ]);

      // 检查召唤兽是否存在且有装备
      const summon = store.getState().summons.allSummons[summonId];
      if (!summon) {
        throw new Error("找不到指定的召唤兽");
      }

      const equippedItemId = summon.equippedItemIds?.[slotType];
      if (!equippedItemId) {
        throw new Error("该部位没有装备");
      }

      // 获取装备物品数据
      const itemData = store.getState().items.allItems[equippedItemId];
      if (!itemData) {
        throw new Error("找不到装备物品数据");
      }

      // 检查背包空间
      if (this.isFull() && !targetSlot) {
        throw new Error("背包已满，无法放入装备");
      }

      // 执行卸下装备操作
      const result = await store.dispatch(
        manageUnequipItemThunk({
          summonId,
          slotType,
        })
      );

      if (result.meta.requestStatus === "fulfilled") {
        // 将物品转换为背包格式
        const inventoryItemData = {
          id: itemData.id,
          name: itemData.name,
          type: itemData.itemType || itemData.type,
          subType: itemData.subType || "",
          rarity: this.mapQualityToRarity(itemData.quality),
          quality: itemData.quality || "normal",
          quantity: itemData.quantity || 1,
          maxStack: 1, // 装备不能堆叠
          stackable: false,
          description: itemData.description || "",
          level: itemData.level || 1,
          value: itemData.value || 0,
          isEquipment: true,
          slotType: itemData.slotType,
          effects: itemData.finalEffects || itemData.effects || {},
          requirements: itemData.requirements || {},
          isConsumable: false,
          createdAt: itemData.addedTimestamp || Date.now(),
          updatedAt: Date.now(),
        };

        // 添加到背包
        const addResult = this.addItem(inventoryItemData, targetSlot);
        if (addResult) {
          this.emit("item_unequipped_from_summon", {
            item: inventoryItemData,
            summonId,
            slotType,
            timestamp: Date.now(),
          });

          return {
            success: true,
            unequippedItem: inventoryItemData,
            summonId,
            slotType,
            message: `成功将 ${inventoryItemData.name} 卸下到背包`,
          };
        } else {
          throw new Error("无法将装备放入背包");
        }
      } else {
        throw new Error(result.payload || "卸下装备失败");
      }
    } catch (error) {
      console.error("从召唤兽卸下装备失败:", error);
      this.emit("error", {
        type: "unequip_error",
        message: error.message,
        timestamp: Date.now(),
      });
      return { success: false, error: error.message };
    }
  }

  // 获取可装备给召唤兽的物品列表
  getEquippableItems(slotType = null) {
    const items = [];
    this.slots.forEach((slot) => {
      if (!slot.isEmpty) {
        const item = this.items.get(slot.itemId);
        if (item && item.isEquipment) {
          if (!slotType || item.slotType === slotType) {
            items.push({
              ...item,
              slotIndex: slot.index,
            });
          }
        }
      }
    });
    return items;
  }

  // 检查物品是否能装备给指定召唤兽
  async canEquipToSummon(slotIndex, summonId) {
    try {
      const item = this.getItemBySlot(slotIndex);
      if (!item || !item.isEquipment) {
        return { canEquip: false, reason: "不是装备物品" };
      }

      // 动态导入store获取召唤兽信息
      const store = await import("./index.js").then((m) => m.default);
      const summon = store.getState().summons.allSummons[summonId];
      if (!summon) {
        return { canEquip: false, reason: "找不到召唤兽" };
      }

      // 检查等级要求
      if (item.requirements?.level && summon.level < item.requirements.level) {
        return {
          canEquip: false,
          reason: `需要等级 ${item.requirements.level}，当前等级 ${summon.level}`,
        };
      }

      // 检查职业/种族要求
      if (item.requirements?.race && item.requirements.race !== summon.race) {
        return {
          canEquip: false,
          reason: `种族要求: ${item.requirements.race}`,
        };
      }

      return { canEquip: true };
    } catch (error) {
      return { canEquip: false, reason: error.message };
    }
  }

  // 品质映射函数
  mapQualityToRarity(quality) {
    const qualityMap = {
      普通: "common",
      优秀: "uncommon",
      精良: "rare",
      稀有: "epic",
      史诗: "legendary",
      传说: "legendary",
      common: "common",
      uncommon: "uncommon",
      rare: "rare",
      epic: "epic",
      legendary: "legendary",
    };
    return qualityMap[quality] || "common";
  }
}

// 导出单例实例
export const inventoryManager = new InventoryManager();
export default inventoryManager;
export { InventoryManager, GameItem, InventorySlot };
