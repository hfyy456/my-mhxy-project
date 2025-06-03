/**
 * 简化版背包管理器 - 直接基于物品ID操作
 * 核心设计原则：简单直接、单一职责、易于维护
 */
import { EventEmitter } from "events";
import { generateUniqueId } from "@/utils/idUtils";
import { EQUIPMENT_SLOT_TYPES } from "@/config/enumConfig";

// ===========================================
// 物品类继承体系 - 实现继承与多态
// ===========================================

/**
 * 物品基类 - 定义共同接口和基础行为
 */
class Item {
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
      rarity: this.rarity,
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
      stackable: false, // 装备不可堆叠
      maxStack: 1
    });
    
    // 装备特有属性 - 使用config中定义的槽位类型
    this.slotType = data.slotType || EQUIPMENT_SLOT_TYPES.ACCESSORY; // 装备槽位类型，默认为饰品
    this.effects = data.effects || {}; // 装备效果/属性加成
    this.requirements = data.requirements || {}; // 装备需求
    this.durability = data.durability || 100; // 耐久度
    this.maxDurability = data.maxDurability || 100;
    
    // 装备状态
    this.isEquipped = data.isEquipped || false;
    this.equippedBy = data.equippedBy || null; // 装备者ID（召唤兽ID）
    this.equippedSlot = data.equippedSlot || null; // 具体装备的槽位
  }

  // 重写use方法 - 装备逻辑
  use(target = null) {
    if (!target || this.isEquipped) {
      console.log(`${this.name}无法使用：${!target ? '需要目标召唤兽' : '已装备'}`);
      return false;
    }

    // 装备到目标召唤兽
    const success = this.equipTo(target);
    if (success) {
      console.log(`${this.name}已装备到${target.name || target}`);
      this.notifyInventoryChange();
    }
    return success;
  }

  getIcon() {
    const icons = {
      [EQUIPMENT_SLOT_TYPES.ACCESSORY]: "💍",    // 饰品
      [EQUIPMENT_SLOT_TYPES.RELIC]: "🏺",        // 遗物
      [EQUIPMENT_SLOT_TYPES.BLOODLINE]: "🧬",    // 血脉
      [EQUIPMENT_SLOT_TYPES.RUNE]: "🔮"          // 符文
    };
    return icons[this.slotType] || "🎽";
  }

  // 装备到召唤兽
  equipTo(summonId, slotType = null) {
    if (this.isEquipped) return false;

    // 使用传入的slotType或者装备自身的slotType
    const targetSlotType = slotType || this.slotType;
    
    this.isEquipped = true;
    this.equippedBy = summonId;
    this.equippedSlot = targetSlotType;
    this.updatedAt = Date.now();
    
    // 触发装备效果
    this.applyEffects(summonId);
    return true;
  }

  // 卸下装备
  unequip() {
    if (!this.isEquipped) return false;
    
    const equippedBy = this.equippedBy;
    const equippedSlot = this.equippedSlot;
    
    this.isEquipped = false;
    this.equippedBy = null;
    this.equippedSlot = null;
    this.updatedAt = Date.now();
    
    // 移除装备效果
    this.removeEffects(equippedBy, equippedSlot);
    return true;
  }

  // 应用装备效果
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

  // 移除装备效果
  removeEffects(summonId, slotType) {
    console.log(`[${this.name}] 从召唤兽${summonId}移除装备效果:`, this.effects);
    if (this.inventory) {
      this.inventory.emit('equipment_removed', {
        equipment: this,
        summonId,
        effects: this.effects,
        slotType
      });
    }
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
      isEquipped: this.isEquipped,
      equippedBy: this.equippedBy,
      equippedSlot: this.equippedSlot
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
      isEquipped: this.isEquipped,
      equippedBy: this.equippedBy,
      equippedSlot: this.equippedSlot,
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
      type: "consumable",
      stackable: true, // 消耗品可堆叠
      maxStack: data.maxStack || 99
    });
    
    // 消耗品特有属性
    this.useEffect = data.useEffect || {}; // 使用效果
    this.cooldown = data.cooldown || 0; // 使用冷却时间
    this.lastUsed = data.lastUsed || 0; // 上次使用时间
  }

  // 重写use方法 - 消耗品逻辑
  use(target = null) {
    if (this.quantity <= 0) {
      console.log(`${this.name}数量不足`);
      return false;
    }

    // 检查冷却时间
    const now = Date.now();
    if (now - this.lastUsed < this.cooldown) {
      console.log(`${this.name}冷却中，剩余${this.cooldown - (now - this.lastUsed)}ms`);
      return false;
    }

    // 消耗一个物品
    this.removeQuantity(1);
    this.lastUsed = now;

    // 执行使用效果
    this.applyUseEffect(target);
    
    console.log(`使用了${this.name}，剩余数量：${this.quantity}`);
    
    // 如果用完了，从背包中移除
    if (this.quantity <= 0) {
      this.removeFromInventory();
    }
    
    return true;
  }

  getIcon() {
    const icons = {
      potion: "🧪",
      food: "🍖",
      scroll: "📜",
      medicine: "💊"
    };
    return icons[this.subType] || "🎁";
  }

  // 应用使用效果
  applyUseEffect(target) {
    console.log(`[${this.name}] 对目标${target?.name || target || '无'}应用效果:`, this.useEffect);
    
    // 触发效果事件
    if (this.inventory) {
      this.inventory.emit('consumable_used', {
        consumable: this,
        target,
        effects: this.useEffect
      });
    }

    // 执行具体效果逻辑
    if (this.useEffect.heal && target) {
      console.log(`${target.name || target}回复${this.useEffect.heal}生命值`);
    }
    if (this.useEffect.mana && target) {
      console.log(`${target.name || target}回复${this.useEffect.mana}魔法值`);
    }
  }

  // 获取消耗品详细信息
  getDetailedInfo() {
    return {
      ...super.getDetailedInfo(),
      useEffect: { ...this.useEffect },
      cooldown: this.cooldown,
      lastUsed: this.lastUsed
    };
  }

  toJSON() {
    return {
      ...super.toJSON(),
      useEffect: { ...this.useEffect },
      cooldown: this.cooldown,
      lastUsed: this.lastUsed,
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
      stackable: true,
      maxStack: data.maxStack || 999
    });
    
    // 材料特有属性
    this.craftingTypes = data.craftingTypes || []; // 可用于的合成类型
    this.rarity = data.rarity || "common";
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
      stackable: false,
      maxStack: 1,
      value: 0 // 任务道具通常没有商店价值
    });
    
    // 任务道具特有属性
    this.questId = data.questId || "";
    this.isKeyItem = data.isKeyItem || false;
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
      isKeyItem: this.isKeyItem,
    };
  }
}

// ===========================================
// 物品工厂 - 根据类型创建对应的物品实例
// ===========================================
class ItemFactory {
  static createItem(data) {
    switch (data.type) {
      case "equipment":
        return new Equipment(data);
      case "consumable":
        return new Consumable(data);
      case "material":
        return new Material(data);
      case "quest":
        return new QuestItem(data);
      default:
        return new Item(data);
    }
  }

  static fromJSON(jsonData) {
    return this.createItem(jsonData);
  }
}

// ===========================================
// 简化版背包管理器 - 直接基于物品ID操作
// ===========================================
class InventoryManager extends EventEmitter {
  constructor(initialCapacity = 100) {
    super();

    this.items = new Map(); // 只需要一个物品映射
    this.capacity = initialCapacity;
    this.gold = 0;

    // 自动保存机制
    this.setupAutoSave();

    console.log('[InventoryManager] 简化版背包管理器初始化完成');
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
      gold: this.gold,
      usedSlots: this.items.size,
      availableSlots: this.capacity - this.items.size,
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
          this.scheduleAutoSave();
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
      this.scheduleAutoSave();

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
    this.scheduleAutoSave();

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
        this.scheduleAutoSave();
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
      // 首先尝试从OOP召唤兽管理系统获取
      const { summonManagerInstance } = await import("../hooks/useSummonManager.js").catch(() => {
        // 如果导入失败，直接返回null，回退到Redux系统
        return { summonManagerInstance: null };
      });

      if (summonManagerInstance && summonManagerInstance.getSummonById) {
        const summon = summonManagerInstance.getSummonById(summonId);
        if (summon) {
          console.log("[InventoryManager] 从OOP系统获取召唤兽数据:", summonId);
          return summon;
        }
      }

      // 回退到Redux系统
      const store = await import("./index.js").then((m) => m.default);
      const summon = store.getState().summons.allSummons[summonId];
      if (summon) {
        console.log("[InventoryManager] 从Redux系统获取召唤兽数据:", summonId);
        return summon;
      }

      return null;
    } catch (error) {
      console.error("[InventoryManager] 获取召唤兽数据失败:", error);
      return null;
    }
  }

  // 装备物品到召唤兽 - 简化版
  async equipItem(itemId, summonId) {
    try {
      const item = this.items.get(itemId);
      if (!item) {
        throw new Error("找不到指定物品");
      }

      if (item.type !== "equipment") {
        throw new Error("该物品不是装备");
      }

      if (!Object.values(EQUIPMENT_SLOT_TYPES).includes(item.slotType)) {
        throw new Error(`无效的装备槽位类型: ${item.slotType}`);
      }

      // 检查装备是否已经装备给其他召唤兽
      if (item.isEquipped && item.equippedBy !== summonId) {
        throw new Error(`该装备已装备给其他召唤兽`);
      }

      // 使用新的帮助方法获取召唤兽信息
      const summon = await this.getSummonData(summonId);
      if (!summon) {
        throw new Error("找不到指定的召唤兽");
      }

      // 检查装备等级要求
      if (item.requirements?.level && summon.level < item.requirements.level) {
        throw new Error(`装备需要等级 ${item.requirements.level}，当前等级 ${summon.level}`);
      }

      // 处理当前装备槽位的已装备物品
      const currentEquippedId = summon.equippedItemIds?.[item.slotType];
      if (currentEquippedId && currentEquippedId !== item.id) {
        const unequipResult = await this.unequipItem(summonId, item.slotType);
        if (!unequipResult.success) {
          throw new Error(`无法卸下当前装备: ${unequipResult.error}`);
        }
      }

      // 装备新物品 - 只改变状态，不从背包移除
      item.equipTo(summonId, item.slotType);

      // 触发装备事件
      this.emit("item_equipped_to_summon", {
        item: item.toJSON(),
        summonId,
        slotType: item.slotType,
        timestamp: Date.now(),
      });

      // 通知背包状态变化（装备状态改变）
      this.emit("inventory_changed", this.getState());
      this.scheduleAutoSave();

      console.log(`[InventoryManager] 装备成功: ${item.name} -> ${summonId}`);

      return {
        success: true,
        equippedItem: item.toJSON(),
        summonId,
        slotType: item.slotType,
        message: `成功将 ${item.name} 装备到 ${this.getSlotTypeDisplayName(item.slotType)}`,
      };

    } catch (error) {
      console.error("[InventoryManager] 装备物品失败:", error);
      this.emit("error", {
        type: "equip_error",
        message: error.message,
        timestamp: Date.now(),
      });
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // 从召唤兽卸下装备到背包 - 简化版
  async unequipItem(summonId, slotType) {
    try {
      // 使用新的帮助方法获取召唤兽信息
      const summon = await this.getSummonData(summonId);
      if (!summon) {
        throw new Error("找不到指定的召唤兽");
      }

      const equippedItemId = summon.equippedItemIds?.[slotType];
      if (!equippedItemId) {
        throw new Error("该部位没有装备");
      }

      // 从背包中查找装备物品
      let equippedItem = this.items.get(equippedItemId);
      
      if (!equippedItem) {
        // 如果背包中找不到装备，可能是数据不一致，创建一个临时的装备对象
        console.warn(`[InventoryManager] 背包中找不到装备ID: ${equippedItemId}，可能存在数据不一致`);
        
        const inventoryItemData = {
          id: equippedItemId,
          name: `${this.getSlotTypeDisplayName(slotType)}装备`,
          type: 'equipment',
          subType: slotType,
          rarity: 'common',
          quality: 'normal',
          quantity: 1,
          maxStack: 1,
          stackable: false,
          description: `从召唤兽卸下的${this.getSlotTypeDisplayName(slotType)}装备`,
          level: 1,
          value: 100,
          slotType: slotType,
          effects: {},
          requirements: {},
          isEquipped: true,
          equippedBy: summonId,
          equippedSlot: slotType,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        equippedItem = ItemFactory.createItem(inventoryItemData);
        equippedItem.setInventory(this);
        this.items.set(equippedItemId, equippedItem);
        
        console.log(`[InventoryManager] 已创建缺失的装备物品: ${equippedItem.name}`);
      }

      // 卸下装备 - 只改变状态，装备仍在背包中
      equippedItem.unequip();

      // 触发卸装事件
      this.emit("item_unequipped_from_summon", {
        item: equippedItem.toJSON(),
        summonId,
        slotType,
        timestamp: Date.now(),
      });

      // 通知背包状态变化（装备状态改变）
      this.emit("inventory_changed", this.getState());
      this.scheduleAutoSave();

      console.log(`[InventoryManager] 卸装成功: ${equippedItem.name} <- ${summonId}`);

      return {
        success: true,
        unequippedItem: equippedItem.toJSON(),
        summonId,
        slotType,
        message: `成功将${this.getSlotTypeDisplayName(slotType)}装备卸下`,
      };
      
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

  // 获取召唤兽的装备状态
  async getSummonEquipmentStatus(summonId) {
    try {
      // 使用新的帮助方法获取召唤兽信息
      const summon = await this.getSummonData(summonId);
      
      if (!summon) {
        return { success: false, error: "找不到召唤兽" };
      }

      const equipmentStatus = {};
      
      Object.values(EQUIPMENT_SLOT_TYPES).forEach(slotType => {
        const equippedItemId = summon.equippedItemIds?.[slotType];
        
        if (equippedItemId) {
          const equippedItem = this.items.get(equippedItemId);
          equipmentStatus[slotType] = {
            itemId: equippedItemId,
            item: equippedItem ? equippedItem.toJSON() : null,
            isEmpty: false
          };
        } else {
          equipmentStatus[slotType] = {
            itemId: null,
            item: null,
            isEmpty: true
          };
        }
      });

      return {
        success: true,
        summonId,
        equipmentStatus,
        totalSlots: Object.keys(EQUIPMENT_SLOT_TYPES).length,
        equippedCount: Object.values(equipmentStatus).filter(slot => !slot.isEmpty).length
      };
    } catch (error) {
      console.error("获取召唤兽装备状态失败:", error);
      return { success: false, error: error.message };
    }
  }

  // 获取可装备物品列表
  getEquippableItems(slotType = null, includeEquipped = false) {
    const items = [];
    this.items.forEach(item => {
      if (item.type === 'equipment') {
        // 如果指定了slotType，只返回匹配的装备
        if (slotType && item.slotType !== slotType) {
          return;
        }
        
        // 根据includeEquipped参数决定是否包含已装备的物品
        if (!includeEquipped && item.isEquipped) {
          return;
        }
        
        items.push({
          ...item.toJSON(),
          source: 'inventory',
          // 添加装备状态信息
          equipmentStatus: {
            isEquipped: item.isEquipped,
            equippedBy: item.equippedBy,
            equippedSlot: item.equippedSlot,
            canEquip: !item.isEquipped || item.equippedBy === null
          }
        });
      }
    });
    return items;
  }

  // 通过ID获取物品
  getItemById(itemId) {
    return this.items.get(itemId) || null;
  }

  // 获取所有物品列表
  getItems() {
    return Array.from(this.items.values());
  }

  // 添加金币
  addGold(amount) {
    if (amount > 0) {
      this.gold += amount;
      this.emit('gold_changed', this.gold);
      this.emit('inventory_changed', this.getState());
      this.scheduleAutoSave();
      console.log(`[InventoryManager] 添加金币: ${amount}，当前金币: ${this.gold}`);
    }
  }

  // 移除金币
  removeGold(amount) {
    if (amount > 0 && this.gold >= amount) {
      this.gold -= amount;
      this.emit('gold_changed', this.gold);
      this.emit('inventory_changed', this.getState());
      this.scheduleAutoSave();
      console.log(`[InventoryManager] 移除金币: ${amount}，剩余金币: ${this.gold}`);
      return true;
    }
    return false;
  }

  // 扩展背包容量
  expandCapacity(additionalSlots) {
    const oldCapacity = this.capacity;
    this.capacity += additionalSlots;
    
    this.emit('capacity_expanded', { oldCapacity, newCapacity: this.capacity });
    this.emit('inventory_changed', this.getState());
    this.scheduleAutoSave();
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
      
      if (filters.rarity && item.rarity !== filters.rarity) {
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

  // 检查物品是否能装备给指定召唤兽
  async canEquipToSummon(itemId, summonId) {
    try {
      const item = this.items.get(itemId);
      if (!item || item.type !== 'equipment') {
        return { canEquip: false, reason: "不是装备物品" };
      }

      // 使用新的帮助方法获取召唤兽信息
      const summon = await this.getSummonData(summonId);
      if (!summon) {
        return { canEquip: false, reason: "找不到召唤兽" };
      }

      if (item.requirements?.level && summon.level < item.requirements.level) {
        return {
          canEquip: false,
          reason: `需要等级 ${item.requirements.level}，当前等级 ${summon.level}`,
        };
      }

      return { canEquip: true };
    } catch (error) {
      return { canEquip: false, reason: error.message };
    }
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
    }, 1000);
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
          console.log("[InventoryManager] 没有保存数据");
        }
      } catch (error) {
        console.error("加载背包状态失败:", error);
        this.emit("error", { type: "load_failed", message: error.message });
      }
    } else {
      console.log("[InventoryManager] 没有Electron Store");
    }
  }

  // 序列化存储
  serializeForStorage() {
    return {
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
    this.items.clear();

    this.capacity = savedState.capacity || 100;
    this.gold = savedState.gold || 0;

    if (savedState.items) {
      savedState.items.forEach(([id, itemData]) => {
        const item = ItemFactory.createItem(itemData);
        item.setInventory(this);
        this.items.set(id, item);
      });
    }

    console.log('[InventoryManager] 反序列化完成');
  }

  // 清理资源
  destroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.removeAllListeners();
  }
}

// 导出单例实例和所有类
export const inventoryManager = new InventoryManager();
export default inventoryManager;

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
