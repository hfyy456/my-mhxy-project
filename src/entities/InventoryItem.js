import { INVENTORY_CONFIG } from '../config/inventoryConfig';
import EquipmentManager from '../managers/EquipmentManager';
import EquipmentEntity from './EquipmentEntity'; // 需要 EquipmentEntity 用于 instanceof 检查 (如果适用) 和类型提示


class InventoryItem {
  constructor(itemData, quantity = 1) { // Renamed itemConfig to itemData for clarity
    if (!itemData) {
      throw new Error('Item data is required for InventoryItem');
    }

    this.inventoryId = `${itemData.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`; // Unique ID for this inventory stack/item
    this.name = itemData.name;
    this.itemType = itemData.itemType; // e.g., 'equipment', 'consumable'
    this.quality = itemData.quality;
    this.description = itemData.description;
    this.icon = itemData.icon;
    this.isEquipped = false; // For equipment type
    this.equippedBy = null;  // For equipment type

    if (this.itemType === 'equipment') {
      if (!itemData.id) {
        console.error("Equipment data for InventoryItem is missing entity ID (itemData.id):", itemData);
        throw new Error('Equipment entity ID is required for equipment items.');
      }
      this.equipmentEntityId = itemData.id; // Store the ID of the EquipmentEntity
      this.slotType = itemData.slotType;   // Store slotType for equipment
      this.level = itemData.level || 1; // Store level for equipment
      // Effects are not stored directly, fetched via getEquipmentEntity().getEffects()
    } else if (this.itemType === 'consumable') {
      this.effect = itemData.effect; // Consumables have direct effects
    }
    // Other types might have different specific properties

    const maxStack = INVENTORY_CONFIG.STACK_RULES[this.itemType] || 1;
    this.quantity = Math.min(quantity, maxStack);
  }

  getEquipmentEntity() {
    if (this.itemType !== 'equipment' || !this.equipmentEntityId) {
      console.warn("[InventoryItem] Attempted to get EquipmentEntity for a non-equipment item or item with no entity ID.", this);
      return null;
    }
    const entity = EquipmentManager.getEquipmentById(this.equipmentEntityId);
    if (!entity) {
      console.error(`[InventoryItem] Failed to retrieve EquipmentEntity with ID ${this.equipmentEntityId} from EquipmentManager. This might indicate a data inconsistency.`, this);
      // TODO: How to handle this? Maybe attempt to reconstruct from InventoryItem's own data if sufficient?
      // For now, returning null as the entity is not in the manager.
    }
    return entity;
  }

  // 检查是否可以堆叠
  canStackWith(otherItem) {
    if (!otherItem || !(otherItem instanceof InventoryItem)) {
      return false;
    }
    if (this.name !== otherItem.name || this.itemType !== otherItem.itemType || this.quality !== otherItem.quality) {
      return false;
    }
    // For equipment, non-stackable if they are unique instances (which they are by ID)
    // So, equipment items (type 'equipment') should not stack unless they point to the *exact same* entity ID, which is unlikely for separate stacks.
    // The current STACK_RULES for equipment is 1, so this is handled by quantity check.
    if (this.itemType === 'equipment') {
        return false; // Unique equipment instances generally don't stack, even if STACK_RULES.equipment > 1 (which it isn't currently)
    }

    const maxStack = INVENTORY_CONFIG.STACK_RULES[this.itemType] || 1;
    return this.quantity < maxStack && otherItem.quantity < maxStack; // Simpler check for non-equipment
  }

  // 尝试堆叠物品
  stackWith(otherItem) {
    if (this.itemType === 'equipment') return false; // Should not stack equipment

    if (this.name !== otherItem.name || this.itemType !== otherItem.itemType || this.quality !== otherItem.quality) {
        return false; // Cannot stack different items
    }

    const maxStack = INVENTORY_CONFIG.STACK_RULES[this.itemType] || 1;
    const canAdd = maxStack - this.quantity;

    if (canAdd <= 0) return false; // This stack is full

    const amountToMove = Math.min(otherItem.quantity, canAdd);
    this.quantity += amountToMove;
    otherItem.quantity -= amountToMove;
    return amountToMove > 0;
  }

  // 分割物品
  split(amount) {
    if (amount <= 0 || amount >= this.quantity) {
      return null;
    }

    const newItemData = {
      name: this.name,
      itemType: this.itemType,
      quality: this.quality,
      description: this.description,
      icon: this.icon,
    };

    if (this.itemType === 'equipment') {
      // When splitting an equipment stack (if ever allowed and quantity > 1, which is not current default),
      // it should ideally create a new InventoryItem pointing to the SAME equipmentEntityId.
      // However, current STACK_RULES.equipment is 1, so splitting equipment is not a typical scenario.
      // If it were, we'd need to ensure the new item refers to the same underlying equipment instance.
      newItemData.id = this.equipmentEntityId; 
      newItemData.slotType = this.slotType;
      newItemData.level = this.level;
    } else if (this.itemType === 'consumable') {
      newItemData.effect = this.effect;
    }

    const newItem = new InventoryItem(newItemData, amount);
    this.quantity -= amount;
    return newItem;
  }

  // 使用物品
  use(target) {
    if (this.itemType === 'equipment') {
      // Equipment is typically "used" by equipping it.
      // This might trigger an equip action if `target` is the Game Manager or Summon.
      // For now, let's say direct use of equipment from inventory does nothing here,
      // as equipping is handled by InventoryPanel -> App -> GameManager.
      return { success: false, message: '装备物品请通过装备操作' }; 
    }
    if (this.itemType !== 'consumable' || !this.effect) {
      return { success: false, message: '该物品无法使用' };
    }

    if (this.quantity <= 0) {
      return { success: false, message: '物品数量不足' };
    }

    // 根据效果类型执行不同的操作
    switch (this.effect.type) {
      case 'experience':
        if (target && typeof target.addExperience === 'function') {
          const result = target.addExperience(this.effect.value);
          if (result.leveledUp) {
            this.quantity--;
            return { 
              success: true, 
              message: result.message,
              remainingQuantity: this.quantity
            };
          }
          return { success: false, message: result.message };
        }
        return { success: false, message: '无法对目标使用该物品' };
      
      default:
        return { success: false, message: '未知的物品效果类型' };
    }
  }

  // 获取物品品质颜色
  getQualityColor() {
    return INVENTORY_CONFIG.QUALITY_COLORS[this.quality] || 'gray-500';
  }

  // 设置装备状态
  setEquipped(equipped, summon = null) {
    if (this.itemType !== 'equipment') return; // Only for equipment
    this.isEquipped = equipped;
    this.equippedBy = equipped ? summon : null; 
    // Note: We might want to update the EquipmentEntity instance itself if it tracks equipped state,
    // but for now, InventoryItem tracks its own stack's equipped status.
  }

  // 获取装备状态描述
  getEquippedStatus() {
    if (this.itemType !== 'equipment' || !this.isEquipped || !this.equippedBy) return null;
    // Ensure equippedBy has a name property, common for Summon instances.
    const equippedByName = this.equippedBy?.name || '未知召唤兽';
    return `已装备于 ${equippedByName}`;
  }
}

export default InventoryItem; 