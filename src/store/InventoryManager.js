/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-03 04:42:45
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-07 03:46:42
 */
/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-03 04:42:45
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-06 03:38:29
 */
/**
 * 简化版背包管理器 - 直接基于物品ID操作
 * 核心设计原则：简单直接、单一职责、易于维护
 */
import { EventEmitter } from "events";
import { generateUniqueId } from "@/utils/idUtils";
import { EQUIPMENT_SLOT_TYPES, QUALITY_TYPES, ITEM_TYPES } from "@/config/enumConfig";
import summonManager from './SummonManager'; // 直接导入SummonManager单例
import allItems from "@/config/item/allItems.json";
import { applyQualityToEquipment, generateRandomQuality } from "@/config/item/equipmentConfig";

// ===========================================
// 辅助函数和常量
// ===========================================
// 兼容当前 allItems.json 结构的展平逻辑
const FLATTENED_ITEM_CONFIG = Object.values(allItems)
  .flatMap(category => typeof category === 'object' ? Object.values(category) : [])
  .reduce((acc, item) => {
    if (item && item.id) {
      acc[item.id] = item;
    }
    return acc;
  }, {});

// ===========================================
// 物品类继承体系 - 实现继承与多态
// ===========================================

/**
 * 物品基类 - 定义共同接口和基础行为
 */
class Item {
  constructor(data) {
    this.id = data.id || generateUniqueId("item");
    this.sourceId = data.sourceId || data.id; // 新增：用于查找配置模板的ID
    this.name = data.name || "";
    this.type = data.type || "misc";
    this.subType = data.subType || "";
    this.quality = data.quality || data.rarity || "common"; // 统一使用quality，向后兼容rarity
    this.quantity = data.quantity || 1;
    this.maxStack = data.maxStack || 1;
    this.stackable = data.stackable !== false && this.maxStack > 1;
    this.description = data.description || "";
    this.level = data.level || 1;
    this.value = data.value || 0;
    
    // 简化：只保留背包引用，不需要slotIndex
    this.inventory = null;
    
    // 时间戳
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  // 虚方法 - 子类必须重写实现多态
  use(target = null) {
    throw new Error(`${this.constructor.name}必须实现use方法`);
  }

  // 获取物品显示图标
  getIcon() {
    return "📦"; // 默认图标
  }

  // 获取物品描述信息
  getDetailedInfo() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      quality: this.quality,
      quantity: this.quantity,
      description: this.description,
      value: this.value
    };
  }

  // 是否可以与另一个物品堆叠
  canStackWith(otherItem) {
    return (
      this.stackable &&
      otherItem.constructor === this.constructor &&
      otherItem.name === this.name &&
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
      this.notifyInventoryChange();
      return true;
    }
    return false;
  }

  // 减少数量
  removeQuantity(amount) {
    if (amount >= this.quantity) {
      const removedQuantity = this.quantity;
      this.quantity = 0;
      this.updatedAt = Date.now();
      this.notifyInventoryChange();
      return removedQuantity;
    } else {
      this.quantity -= amount;
      this.updatedAt = Date.now();
      this.notifyInventoryChange();
      return amount;
    }
  }

  // 分割物品
  split(amount) {
    if (!this.stackable || amount >= this.quantity) return null;

    const splitItem = new this.constructor({
      ...this.toJSON(),
      id: this.generateId(),
      quantity: amount,
    });

    this.quantity -= amount;
    this.updatedAt = Date.now();
    this.notifyInventoryChange();

    return splitItem;
  }

  // 简化：只设置背包引用
  setInventory(inventory) {
    this.inventory = inventory;
  }

  // 通知背包状态变化
  notifyInventoryChange() {
    if (this.inventory) {
      this.inventory.emit('item_changed', { item: this });
    }
  }

  // 从背包中移除自己
  removeFromInventory() {
    if (this.inventory) {
      return this.inventory.removeItem(this.id);
    }
    return false;
  }

  toJSON() {
    return {
      id: this.id,
      sourceId: this.sourceId, // 新增
      name: this.name,
      type: this.type,
      subType: this.subType,
      quality: this.quality,
      quantity: this.quantity,
      maxStack: this.maxStack,
      stackable: this.stackable,
      description: this.description,
      level: this.level,
      value: this.value,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  generateId() {
    return generateUniqueId("item");
  }
}

/**
 * 装备类 - 继承Item，实现装备特有逻辑
 */
class Equipment extends Item {
  constructor(data) {
    super({
      ...data,
      type: "equipment",
      category: ITEM_TYPES.EQUIPMENT, // 确保类别正确
      stackable: false, // 装备不可堆叠
      maxStack: 1
    });
    
    // 装备特有属性 - 使用config中定义的槽位类型
    this.slotType = data.slotType || EQUIPMENT_SLOT_TYPES.ACCESSORY; // 装备槽位类型，默认为饰品
    this.effects = data.effects || {}; // 装备效果/属性加成
    this.requirements = data.requirements || {}; // 装备需求
    this.durability = data.durability || 100; // 耐久度
    this.maxDurability = data.maxDurability || 100;
    
    // 装备状态 - 这些属性已移除，由 EquipmentRelationshipManager 管理
    // this.isEquipped = data.isEquipped || false;
    // this.equippedBy = data.equippedBy || null; // 装备者ID（召唤兽ID）
    // this.equippedSlot = data.equippedSlot || null; // 具体装备的槽位
  }

  // 重写use方法 - 装备逻辑
  use(target = null) {
    console.warn(`[InventoryManager/Equipment] Equipment.use() for equipping is deprecated. Item ID: ${this.id}. Equipping is handled by EquipmentRelationshipManager.`);
    return false; // Deprecated functionality
  }

  getIcon() {
    const icons = {
      [EQUIPMENT_SLOT_TYPES.ACCESSORY]: "💍",    // 饰品
      [EQUIPMENT_SLOT_TYPES.RELIC]: "🏺",        // 遗物
      [EQUIPMENT_SLOT_TYPES.BLOODLINE]: "🧬",    // 血脉
      [EQUIPMENT_SLOT_TYPES.RUNE]: "🔮"          // 符文
    };
    return icons[this.slotType] || "��";
  }

  // equipTo - 此方法已废弃，装备操作由 EquipmentRelationshipManager 处理
  // equipTo(summonId, slotType = null) {
  //   console.warn(`[InventoryManager/Equipment] equipTo() is deprecated for Item ID: ${this.id}. Use EquipmentRelationshipManager.`);
  //   return { success: false, error: "Deprecated method" };
  // }

  // unequip - 此方法已废弃，卸载操作由 EquipmentRelationshipManager 处理
  // unequip() {
  //   console.warn(`[InventoryManager/Equipment] unequip() is deprecated for Item ID: ${this.id}. Use EquipmentRelationshipManager.`);
  //   return { success: false, error: "Deprecated method" };
  // }

  applyEffects(summonId) {
    console.log(`[${this.name}] 对召唤兽${summonId}应用装备效果:`, this.effects);
    // 这里集成召唤兽属性系统
    if (this.inventory) {
      this.inventory.emit('equipment_applied', {
        equipment: this,
        summonId,
        effects: this.effects
      });
    }
  }

  // 移除装备效果 - 检查此逻辑是否仍需要或由新系统处理
  removeEffects(summonId, slotType) {
    console.warn(`[InventoryManager/Equipment] Equipment.removeEffects() may be deprecated or partially handled by EquipmentRelationshipManager. Item ID: ${this.id}, Summon ID: ${summonId}`);
    // 旧逻辑:
    // const summon = summonManager.getSummonById(summonId);
    // if (summon) {
    //   summon.removeEquipmentEffects(this.id, slotType || this.slotType);
    // }
  }

  // 获取装备详细信息
  getDetailedInfo() {
    return {
      ...super.getDetailedInfo(),
      slotType: this.slotType,
      effects: { ...this.effects },
      requirements: { ...this.requirements },
      durability: this.durability,
      maxDurability: this.maxDurability,
      // isEquipped, equippedBy, equippedSlot 均已移除
    };
  }

  toJSON() {
    return {
      ...super.toJSON(),
      slotType: this.slotType,
      effects: { ...this.effects },
      requirements: { ...this.requirements },
      durability: this.durability,
      maxDurability: this.maxDurability,
      // isEquipped, equippedBy, equippedSlot 均已移除
    };
  }
}

/**
 * 消耗品类 - 继承Item，实现消耗品特有逻辑
 */
class Consumable extends Item {
  constructor(data) {
    super({
      ...data,
      type: "consumable", // 兼容旧的type字段
      category: ITEM_TYPES.CONSUMABLE,
      stackable: data.maxStack > 1,
    });
    this.effects = data.effects || []; // 保存效果配置
  }

  // 重写use方法 - 消耗品逻辑
  use(target = null) {
    console.log(`[InventoryManager/Consumable] Using item: ${this.name}`);
    if (!target) {
      console.warn("No target specified for consumable.");
      // 如果没有目标，默认是玩家自己？这部分逻辑需要和PlayerManager结合
      // target = playerManager.getPlayer();
    }
    
    const success = this.applyUseEffect(target);
    
    if (success) {
      console.log(`Effect of ${this.name} applied successfully.`);
      this.removeQuantity(1); // 消耗一个
      // 如果数量为0，会自动从背包中移除
      if (this.quantity <= 0) {
        this.removeFromInventory();
      }
      return true;
    } else {
      console.error(`Failed to apply effect of ${this.name}.`);
      return false;
    }
  }

  getIcon() {
    const icons = {
      potion: "🧪",
      food: "🍔",
      scroll: "📜",
    };
    return icons[this.subType] || "💊";
  }

  // 应用使用效果
  applyUseEffect(target) {
    // 这里是效果处理核心，后续需要与PlayerManager/SummonManager集成
    if (this.effects.length === 0) {
      console.warn(`Item ${this.name} has no effects to apply.`);
      return false; // 没有效果也算是一种"失败"
    }

    console.log(`Applying effects of ${this.name} to target:`, target);
    this.effects.forEach(effect => {
      switch (effect.type) {
        case 'HEAL_HP':
          console.log(`Healing HP by ${effect.amount} for target.`);
          // target.attributes.hp += effect.amount;
          break;
        case 'HEAL_MP':
          console.log(`Restoring MP by ${effect.amount} for target.`);
          // target.attributes.mp += effect.amount;
          break;
        case 'GRANT_BUFF':
          console.log(`Granting buff ${effect.buffId} to target.`);
          // buffManager.addBuff(target, effect.buffId);
          break;
        default:
          console.warn(`Unknown effect type: ${effect.type}`);
      }
    });

    return true; // 假设效果总是成功应用
  }

  // 获取消耗品详细信息
  getDetailedInfo() {
    return {
      ...super.getDetailedInfo(),
      effects: { ...this.effects },
    };
  }

  toJSON() {
    return {
      ...super.toJSON(),
      effects: { ...this.effects },
    };
  }
}

/**
 * 材料类 - 继承Item，实现材料特有逻辑
 */
class Material extends Item {
  constructor(data) {
    super({
      ...data,
      type: "material",
      category: ITEM_TYPES.MATERIAL,
      stackable: data.maxStack > 1,
    });
    
    // 材料特有属性
    this.craftingTypes = data.craftingTypes || []; // 可用于的合成类型
    this.quality = data.quality || "common";
  }

  // 重写use方法 - 材料逻辑（通常不能直接使用）
  use(target = null) {
    console.log(`${this.name}是制作材料，不能直接使用`);
    return false;
  }

  getIcon() {
    const icons = {
      ore: "⛏️",
      herb: "🌿",
      gem: "💎",
      leather: "🧳",
      cloth: "🧵"
    };
    return icons[this.subType] || "📦";
  }

  // 检查是否可用于特定合成
  canCraftWith(craftingType) {
    return this.craftingTypes.includes(craftingType) || this.craftingTypes.includes('all');
  }

  toJSON() {
    return {
      ...super.toJSON(),
      craftingTypes: [...this.craftingTypes],
    };
  }
}

/**
 * 任务道具类 - 继承Item，实现任务道具特有逻辑
 */
class QuestItem extends Item {
  constructor(data) {
    super({
      ...data,
      type: "quest",
      category: ITEM_TYPES.QUEST,
      stackable: false,
      maxStack: 1,
    });
    this.questId = data.questId || null; // 关联的任务ID
  }

  // 重写use方法 - 任务道具逻辑
  use(target = null) {
    console.log(`${this.name}是任务道具，无法直接使用`);
    if (this.inventory) {
      this.inventory.emit('quest_item_activated', {
        questItem: this,
        questId: this.questId
      });
    }
    return false;
  }

  getIcon() {
    return this.isKeyItem ? "🗝️" : "📋";
  }

  toJSON() {
    return {
      ...super.toJSON(),
      questId: this.questId,
    };
  }
}

// ===========================================
// 物品工厂 - 根据类型创建对应的物品实例
// ===========================================
class ItemFactory {
  static createItem(data) {
    const config = FLATTENED_ITEM_CONFIG[data.sourceId || data.id] || {};
    const itemData = { ...config, ...data };
    
    // 使用 category 字段来决定创建哪个类的实例
    switch (itemData.category) {
      case ITEM_TYPES.EQUIPMENT:
        return new Equipment(itemData);
      case ITEM_TYPES.CONSUMABLE:
        return new Consumable(itemData);
      case ITEM_TYPES.MATERIAL:
        return new Material(itemData);
      case ITEM_TYPES.QUEST:
        return new QuestItem(itemData);
      default:
        console.warn(`[ItemFactory] Unknown item category: "${itemData.category}" for item ID "${itemData.id}". Falling back to base Item.`);
        return new Item(itemData); // 默认为基础物品
    }
  }

  static fromJSON(jsonData) {
    // fromJSON 应该直接使用jsonData创建，因为它已经是完整的物品数据
    switch (jsonData.type) {
      case "equipment":
        return new Equipment(jsonData);
      case "consumable":
        return new Consumable(jsonData);
      case "material":
        return new Material(jsonData);
      case "quest":
        return new QuestItem(jsonData);
      default:
        return new Item(jsonData);
    }
  }
}

// ===========================================
// 简化版背包管理器 - 直接基于物品ID操作
// ===========================================
class InventoryManager extends EventEmitter {
  constructor(initialCapacity = 100) {
    super();
    this.items = new Map(); // 存储所有物品实例，以物品ID为键
    this.slots = new Array(initialCapacity).fill(null);
    this.capacity = initialCapacity; // 背包容量
    this.isLoading = false;
    this.error = null;
    this.autoSaveTimeout = null;

    this.initializeSlots();

    console.log('[InventoryManager] 背包管理器初始化完成（无持久化）');
  }

  // 获取状态快照 - 为了兼容性，仍然模拟slots结构
  getState() {
    const itemsArray = Array.from(this.items.values()).map(item => item.toJSON());
    
    // 模拟slots结构用于UI显示
    const slots = [];
    for (let i = 0; i < this.capacity; i++) {
      if (i < itemsArray.length) {
        slots.push({
          index: i,
          itemId: itemsArray[i].id,
          isEmpty: false
        });
      } else {
        slots.push({
          index: i,
          itemId: null,
          isEmpty: true
        });
      }
    }

    return {
      slots,
      items: itemsArray,
      capacity: this.capacity,
      usedSlots: this.getUsedSlotsCount(),
      availableSlots: this.capacity - this.getUsedSlotsCount(),
      isLoading: this.isLoading,
    };
  }

  // 获取已使用数量
  getUsedSlotsCount() {
    return this.items.size;
  }

  // 获取可用数量
  getAvailableSlotsCount() {
    return this.capacity - this.items.size;
  }

  // 检查背包是否已满
  isFull() {
    return this.items.size >= this.capacity;
  }

  // 添加物品到背包
  addItem(itemData) {
    try {
      const item = itemData instanceof Item ? itemData : ItemFactory.createItem(itemData);

      // 尝试堆叠
      if (item.stackable) {
        const stackableItem = this.findStackableItem(item);
        if (stackableItem && stackableItem.addQuantity(item.quantity)) {
          console.log(`[InventoryManager] 物品${item.name}已堆叠，数量：${stackableItem.quantity}`);
          this.emit("item_stacked", { item: stackableItem.toJSON() });
          this.emit("inventory_changed", this.getState());
          return true;
        }
      }

      // 检查容量
      if (this.isFull()) {
        this.emit("error", { type: "inventory_full", message: "背包已满" });
        return false;
      }

      // 添加新物品
      item.setInventory(this);
      this.items.set(item.id, item);

      this.emit("item_added", { item: item.toJSON() });
      this.emit("inventory_changed", this.getState());

      console.log(`[InventoryManager] 物品${item.name}(${item.id})已添加到背包`);
      return true;

    } catch (error) {
      this.emit("error", { type: "add_item_failed", message: error.message });
      return false;
    }
  }

  // 寻找可堆叠的物品
  findStackableItem(newItem) {
    if (!newItem.stackable) return null;

    for (const item of this.items.values()) {
      if (item.canStackWith(newItem)) {
        return item;
      }
    }
    return null;
  }

  // 通过ID移除物品
  removeItem(itemId, quantity = null) {
    const item = this.items.get(itemId);
    if (!item) {
      console.warn(`[InventoryManager] 找不到物品ID: ${itemId}`);
      return null;
    }

    let removedItem;

    if (quantity === null || quantity >= item.quantity) {
      // 移除整个物品
      removedItem = { ...item.toJSON() };
      item.setInventory(null);
      this.items.delete(itemId);
      
      console.log(`[InventoryManager] 完全移除物品${item.name}(${itemId})`);
    } else {
      // 部分移除
      item.removeQuantity(quantity);
      removedItem = {
        ...item.toJSON(),
        quantity: quantity
      };
      
      console.log(`[InventoryManager] 从物品${item.name}移除${quantity}个，剩余${item.quantity}`);
    }

    this.emit("item_removed", {
      item: removedItem,
      removedQuantity: quantity || removedItem.quantity
    });
    this.emit("inventory_changed", this.getState());

    return removedItem;
  }

  // 使用物品 - 利用多态
  useItem(itemId, target = null) {
    const item = this.items.get(itemId);
    if (!item) {
      console.warn(`[InventoryManager] 找不到物品ID: ${itemId}`);
      return false;
    }

    console.log(`[InventoryManager] 尝试使用物品${item.name}，类型：${item.constructor.name}`);

    try {
      const success = item.use(target);
      
      if (success) {
        console.log(`[InventoryManager] 成功使用物品${item.name}`);
        
        // 如果物品用完了，从背包中移除
        if (item.quantity <= 0 && item.constructor !== Equipment) {
          this.removeItem(itemId);
        }
        
        this.emit("item_used", {
          item: item.toJSON(),
          target,
          success: true
        });
        this.emit("inventory_changed", this.getState());
      } else {
        console.log(`[InventoryManager] 使用物品${item.name}失败`);
        this.emit("item_used", {
          item: item.toJSON(),
          target,
          success: false
        });
      }
      
      return success;
    } catch (error) {
      console.error(`[InventoryManager] 使用物品${item.name}时出错:`, error);
      this.emit("error", {
        type: "item_use_failed",
        message: error.message,
        item: item.toJSON()
      });
      return false;
    }
  }

  // 获取召唤兽数据的帮助方法，优先从OOP系统获取
  async getSummonData(summonId) {
    try {
      // 直接使用导入的summonManager实例
      if (summonManager && summonManager.getSummonById) {
        const summon = summonManager.getSummonById(summonId);
        if (summon) {
          console.log("[InventoryManager] 从OOP系统获取召唤兽数据:", summonId);
          return summon;
        }
      }

      // 如果OOP系统中没有找到，回退到Redux系统
      try {
        const store = await import("./index.js").then((m) => m.default);
        const summon = store.getState().summons.allSummons[summonId];
        if (summon) {
          console.log("[InventoryManager] 从Redux系统获取召唤兽数据:", summonId);
          return summon;
        }
      } catch (storeError) {
        console.warn("[InventoryManager] Redux系统获取召唤兽失败:", storeError);
      }

      console.warn(`[InventoryManager] 无法找到召唤兽ID: ${summonId}`);
      return null;
    } catch (error) {
      console.error("[InventoryManager] 获取召唤兽数据失败:", error);
      return null;
    }
  }

  // async equipItem(itemId, summonId) {
  //   console.warn("[InventoryManager] equipItem() is deprecated. Use EquipmentRelationshipManager.");
  //   return { success: false, error: "Deprecated method" };
  // }

  // async unequipItem(summonId, slotType) {
  //   console.warn("[InventoryManager] unequipItem() is deprecated. Use EquipmentRelationshipManager.");
  //   return { success: false, error: "Deprecated method" };
  // }

  // 获取装备槽位类型的显示名称
  getSlotTypeDisplayName(slotType) {
    const displayNames = {
      [EQUIPMENT_SLOT_TYPES.ACCESSORY]: "饰品",
      [EQUIPMENT_SLOT_TYPES.RELIC]: "遗物",
      [EQUIPMENT_SLOT_TYPES.BLOODLINE]: "血脉",
      [EQUIPMENT_SLOT_TYPES.RUNE]: "符文"
    };
    return displayNames[slotType] || slotType;
  }

  // async getSummonEquipmentStatus(summonId) {
  //   console.warn("[InventoryManager] getSummonEquipmentStatus() is deprecated. Use EquipmentRelationshipManager.");
  //   return { success: false, error: "Deprecated method", equippedItems: {} };
  // }

  getEquippableItems(slotType = null /*, includeEquipped = false (parameter removed as items no longer know their status) */) {
    // includeEquipped is removed as items no longer self-track equipped status.
    // This manager also no longer directly knows about equipped status,
    // that is now the responsibility of EquipmentRelationshipManager.
    // This method now simply returns all equipment items, optionally filtered by slotType.
    const equippable = [];
    for (const item of this.items.values()) {
      if (item.type === "equipment") {
        if (slotType) {
          if (item.slotType === slotType) {
            equippable.push(item.toJSON()); // Or return the instance: item
          }
        } else {
          equippable.push(item.toJSON()); // Or return the instance: item
        }
      }
    }
    console.log(`[InventoryManager] getEquippableItems for slotType '${slotType}':`, equippable.length);
    return equippable;
  }

  getItemById(itemId) {
    return this.items.get(itemId) || null;
  }

  // 获取所有物品列表
  getItems() {
    return Array.from(this.items.values());
  }

  // 扩展背包容量
  expandCapacity(additionalSlots) {
    if (typeof additionalSlots !== 'number' || additionalSlots <= 0) return;
    const oldCapacity = this.capacity;
    this.capacity += additionalSlots;
    
    this.emit('capacity_expanded', { oldCapacity, newCapacity: this.capacity });
    this.emit('inventory_changed', this.getState());
    console.log(`[InventoryManager] 背包容量扩展: ${oldCapacity} -> ${this.capacity}`);
  }

  // 搜索物品
  searchItems(query, filters = {}) {
    const results = [];
    
    this.items.forEach(item => {
      let matches = true;
      
      if (query && !item.name.toLowerCase().includes(query.toLowerCase())) {
        matches = false;
      }
      
      if (filters.type && item.type !== filters.type) {
        matches = false;
      }
      
      if (filters.quality && item.quality !== filters.quality) {
        matches = false;
      }
      
      if (filters.minLevel && (item.level || 1) < filters.minLevel) {
        matches = false;
      }
      if (filters.maxLevel && (item.level || 1) > filters.maxLevel) {
        matches = false;
      }
      
      if (matches) {
        results.push({
          ...item,
          inInventory: true
        });
      }
    });
    
    return results;
  }

  // async canEquipToSummon(itemId, summonId) {
  //   console.warn("[InventoryManager] canEquipToSummon() is deprecated. Use EquipmentRelationshipManager.");
  //   return { success: false, error: "Deprecated method", canEquip: false };
  // }

  // 清理资源
  destroy() {
    this.removeAllListeners();
  }

  // 初始化背包插槽和新手物品
  initializeSlots() {
    // 只在背包为空时添加新手物品
    if (this.items.size === 0) {
      console.log('[InventoryManager] 首次初始化，添加新手物品');
      this.forceInitializeStarterItems();
    } else {
      console.log('[InventoryManager] 背包已有物品，跳过新手物品初始化');
    }
  }

  // 强制初始化新手物品（用于新游戏）
  forceInitializeStarterItems() {
    console.log('[InventoryManager] 强制初始化新手物品');
    
    // 修正：使用 sourceId 来匹配新的 ItemFactory 逻辑
    const starterItemDefs = [
      { sourceId: 'smallHpPotion', quantity: 5 },
      { sourceId: 'smallMpPotion', quantity: 5 },
      { sourceId: 'fineIronSword', quantity: 1 },
      { sourceId: 'guiyuanDan', quantity: 3 },
      { sourceId: 'wangyouCao', quantity: 3 }
    ];

    starterItemDefs.forEach(itemDef => {
      // 直接传递定义给 addItem，工厂会在内部处理
      this.addItem(itemDef);
    });

    console.log('[InventoryManager] 新手物品添加完成');
  }

  // ===========================================
  // 存档/读档接口
  // ===========================================
  
  /**
   * 获取用于存档的背包数据
   * @returns {object}
   */
  getSaveData() {
    console.log('[InventoryManager] getSaveData called (placeholder)');
    // 后续实现：
    // const items = Array.from(this.items.values()).map(item => item.toJSON());
    // return { items, gold: this.gold, capacity: this.capacity };
    return { status: 'unimplemented' }; // 占位符
  }
  
  /**
   * 从存档数据中加载背包状态
   * @param {object} data - 包含items, gold, capacity的存档数据
   */
  loadSaveData(data) {
    console.log('[InventoryManager] loadSaveData called with:', data);
    // 后续实现：
    // this.items.clear();
    // data.items.forEach(itemData => {
    //   const item = ItemFactory.fromJSON(itemData);
    //   this.items.set(item.id, item);
    // });
    // this.gold = data.gold || 0;
    // this.capacity = data.capacity || 100;
    // this.emit("state_loaded", this.getState());
  }
}

export default InventoryManager;

// 导出所有类供外部使用
export { 
  InventoryManager, 
  Item, 
  Equipment, 
  Consumable, 
  Material, 
  QuestItem, 
  ItemFactory
};