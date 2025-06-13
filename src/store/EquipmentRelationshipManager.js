/**
 * 装备关系管理器 - 中间层
 * 统一管理装备与召唤兽之间的关系，确保数据一致性
 */
import { EventEmitter } from 'events';
// 引入 InventoryManager 和 SummonManager 实例
import inventoryManagerInstance from './InventoryManager';
import summonManagerInstance from './SummonManager';

class EquipmentRelationshipManager extends EventEmitter {
  constructor() {
    super();
    
    // 装备关系表：itemId -> { summonId, slotType, equippedAt }
    this.equipmentRelations = new Map();
    
    // 反向索引：summonId -> { slotType: itemId }
    this.summonEquipmentIndex = new Map();
    
    // 装备状态缓存
    this.equipmentStatusCache = new Map();
    
    console.log('[EquipmentRelationshipManager] 装备关系管理器已初始化（无持久化）');
  }

  /**
   * 装备物品到召唤兽 (标准方法)
   * @param {string} itemId - 物品ID
   * @param {string} summonId - 召唤兽ID
   * @returns {boolean} 是否成功
   */
  async equip(itemId, summonId) {
    try {
      const item = inventoryManagerInstance.getItemById(itemId);
      if (!item || item.type !== 'equipment') {
        console.warn(`[ERM] equip: 物品 ${itemId} 不是装备或不存在。`);
        return false;
      }
      const slotType = item.slotType;
      if (!slotType) {
        console.warn(`[ERM] equip: 物品 ${itemId} 没有 slotType。`);
        return false;
      }

      const summon = summonManagerInstance.getSummonById(summonId);
      if (!summon) {
        console.warn(`[ERM] equip: 召唤兽 ${summonId} 不存在。`);
        return false;
      }

      console.log(`[ERM] equip: 尝试装备物品 ${itemId} (${slotType}) 到召唤兽 ${summonId}`);

      // 1. 检查物品是否已被其他召唤兽装备 (或者就是当前召唤兽的这个槽位之外的其他槽位，如果一个装备能占多个槽)
      const existingRelation = this.equipmentRelations.get(itemId);
      if (existingRelation) {
        if (existingRelation.summonId === summonId && existingRelation.slotType === slotType) {
          console.log(`[ERM] equip: 物品 ${itemId} 已装备在召唤兽 ${summonId} 的 ${slotType} 槽位，无需重复操作。`);
          return true; // 已经是装备状态
        }
        console.warn(`[ERM] equip: 物品 ${itemId} 已被召唤兽 ${existingRelation.summonId} 装备在 ${existingRelation.slotType}。先卸下旧的。`);
        await this.unequip(itemId, existingRelation.summonId); // 使用新的标准卸载
      }

      // 2. 检查召唤兽目标槽位是否已有其他装备
      const summonEquipment = this.summonEquipmentIndex.get(summonId) || {};
      const existingItemInTargetSlot = summonEquipment[slotType];
      if (existingItemInTargetSlot && existingItemInTargetSlot !== itemId) {
        console.log(`[ERM] equip: 召唤兽 ${summonId} 的 ${slotType} 槽位已有装备 ${existingItemInTargetSlot}，先卸下。`);
        await this.unequip(existingItemInTargetSlot, summonId); // 使用新的标准卸载
      }

      // 3. 建立新的装备关系 (只在ERM内部)
      const newRelation = {
        summonId,
        slotType,
        equippedAt: Date.now()
      };
      this.equipmentRelations.set(itemId, newRelation);

      if (!this.summonEquipmentIndex.has(summonId)) {
        this.summonEquipmentIndex.set(summonId, {});
      }
      this.summonEquipmentIndex.get(summonId)[slotType] = itemId;

      // 4. 更新召唤兽属性 (Summon类内部的getEquippedItems会从ERM取数据)
      await summon.recalculateStats();

      this.clearCache(itemId, summonId); // 清除ERM内部缓存
      this.emit('item_equipped', { itemId, summonId, slotType, relation: newRelation });
      console.log(`[ERM] equip: 装备成功: ${itemId} (${slotType}) -> ${summonId}`);
      return true;

    } catch (error) {
      console.error('[ERM] equip: 装备失败:', error);
      return false;
    }
  }

  /**
   * 从召唤兽卸下装备 (标准方法)
   * @param {string} itemId - 物品ID
   * @param {string} summonId - 召唤兽ID
   * @returns {boolean} 是否成功
   */
  async unequip(itemId, summonId) {
    try {
      const relation = this.equipmentRelations.get(itemId);
      if (!relation) {
        console.warn(`[ERM] unequip: 物品 ${itemId} 未在 ERM 中记录为已装备。`);
        return false;
      }

      if (relation.summonId !== summonId) {
        console.warn(`[ERM] unequip: 物品 ${itemId} 装备在 ${relation.summonId} 而不是指定的 ${summonId}。`);
        return false; // 或选择强制从 relation.summonId 卸载？当前严格按参数执行
      }
      
      const slotType = relation.slotType;
      console.log(`[ERM] unequip: 尝试卸下物品 ${itemId} 从召唤兽 ${summonId} 的 ${slotType} 槽位`);

      const summon = summonManagerInstance.getSummonById(summonId);
      if (!summon) {
        console.warn(`[ERM] unequip: 召唤兽 ${summonId} 不存在。`);
        // 即使召唤兽不存在，如果ERM有记录，也应该清理ERM的状态
      }

      // 1. 移除装备关系 (只在ERM内部)
      this.equipmentRelations.delete(itemId);
      const summonEquipmentMap = this.summonEquipmentIndex.get(summonId);
      if (summonEquipmentMap) {
        delete summonEquipmentMap[slotType];
        if (Object.keys(summonEquipmentMap).length === 0) {
          this.summonEquipmentIndex.delete(summonId);
        }
      }

      // 2. 更新召唤兽属性 (如果召唤兽实例存在)
      if (summon) {
        await summon.recalculateStats();
      }

      this.clearCache(itemId, summonId); // 清除ERM内部缓存
      this.emit('item_unequipped', { itemId, summonId, slotType: relation.slotType });
      console.log(`[ERM] unequip: 卸载成功: ${itemId} from ${summonId}`);
      return true;

    } catch (error) {
      console.error('[ERM] unequip: 卸载失败:', error);
      return false;
    }
  }
  
  /**
   * 旧的 equipItem，标记为内部或废弃，推荐使用 equip(itemId, summonId)
   * @param {string} itemId - 物品ID
   * @param {string} summonId - 召唤兽ID
   * @param {string} slotType - 装备槽位类型
   * @returns {boolean} 是否成功
   * @deprecated Prefer equip(itemId, summonId)
   */
  equipItem(itemId, summonId, slotType) {
    console.warn(`[ERM] equipItem(itemId, summonId, slotType) is deprecated. Use equip(itemId, summonId). Redirecting...`);
    // 简单的重定向，但不推荐直接使用此方法，因为它可能不会进行完整的检查或异步操作
    // 实际场景中，调用方应自行获取 slotType 并传入，或直接用新的 equip
    // 为了演示，这里假设可以同步执行，但实际可能需要异步
    const item = inventoryManagerInstance.getItemById(itemId);
    if (!item || item.type !== 'equipment' || item.slotType !== slotType) {
        console.error(`[ERM] equipItem (deprecated): Item ${itemId} is not valid equipment for slot ${slotType}.`);
        return false;
    }
    // This is a simplified call, the new equip method handles more logic like unquipping existing items.
    // This deprecated version will just update the maps directly, which might lead to inconsistencies
    // if not used carefully. The new `equip` method is safer.
    const relation = {
        summonId,
        slotType,
        equippedAt: Date.now()
      };
    this.equipmentRelations.set(itemId, relation);
    if (!this.summonEquipmentIndex.has(summonId)) {
        this.summonEquipmentIndex.set(summonId, {});
    }
    this.summonEquipmentIndex.get(summonId)[slotType] = itemId;
    this.clearCache(itemId, summonId);
    this.emit('item_equipped', { itemId, summonId, slotType, relation });
    // Note: Does not call summon.recalculateAllAttributes() which is a key difference to the new 'equip' method.
    console.log(`[ERM] equipItem (deprecated) executed for: ${itemId} -> ${summonId}:${slotType}`);
    return true;
  }

  /**
   * 旧的 unequipItem，只通过itemId卸载，标记为内部或废弃。推荐使用 unequip(itemId, summonId)
   * @param {string} itemId - 物品ID
   * @returns {boolean} 是否成功
   * @deprecated Prefer unequip(itemId, summonId)
   */
  unequipItem(itemId) {
    const relation = this.equipmentRelations.get(itemId);
    if (!relation) {
      console.warn(`[ERM] unequipItem (deprecated): 物品 ${itemId} 未装备`);
      return false;
    }
    console.warn(`[ERM] unequipItem(itemId) is deprecated. Use unequip(itemId, relation.summonId). Redirecting to unequip(itemId, relation.summonId)...`);
    return this.unequip(itemId, relation.summonId); // 调用新的标准卸载
  }

  /**
   * 从召唤兽的特定槽位卸下装备，标记为内部或废弃。推荐使用 unequip(itemId, summonId)
   * @param {string} summonId - 召唤兽ID
   * @param {string} slotType - 槽位类型
   * @returns {boolean} 是否成功
   * @deprecated Prefer unequip(itemId, summonId) where itemId is known, or query ERM first.
   */
  unequipFromSlot(summonId, slotType) {
    const summonEquipment = this.summonEquipmentIndex.get(summonId);
    if (!summonEquipment || !summonEquipment[slotType]) {
      console.warn(`[ERM] unequipFromSlot (deprecated): 召唤兽 ${summonId} 的 ${slotType} 槽位没有装备`);
      return false;
    }
    const itemId = summonEquipment[slotType];
    console.warn(`[ERM] unequipFromSlot(summonId, slotType) is deprecated. Use unequip(itemId, summonId). Redirecting to unequip(itemId, summonId)...`);
    return this.unequip(itemId, summonId); // 调用新的标准卸载
  }

  /**
   * 获取物品的装备状态
   * @param {string} itemId - 物品ID
   * @returns {Object|null} 装备关系信息
   */
  getItemEquipmentStatus(itemId) {
    return this.equipmentRelations.get(itemId) || null;
  }

  /**
   * 获取召唤兽的所有装备
   * @param {string} summonId - 召唤兽ID
   * @returns {Object} 槽位 -> 物品ID 的映射
   */
  getSummonEquipment(summonId) {
    return { ...(this.summonEquipmentIndex.get(summonId) || {}) };
  }

  /**
   * 检查物品是否被装备
   * @param {string} itemId - 物品ID
   * @returns {boolean} 是否被装备
   */
  isItemEquipped(itemId) {
    return this.equipmentRelations.has(itemId);
  }

  /**
   * 检查召唤兽的槽位是否有装备
   * @param {string} summonId - 召唤兽ID
   * @param {string} slotType - 槽位类型
   * @returns {boolean} 是否有装备
   */
  isSlotEquipped(summonId, slotType) {
    const summonEquipment = this.summonEquipmentIndex.get(summonId);
    return summonEquipment && summonEquipment[slotType] !== undefined;
  }

  /**
   * 获取所有装备关系
   * @returns {Array} 装备关系列表
   */
  getAllEquipmentRelations() {
    const relations = [];
    for (const [itemId, relation] of this.equipmentRelations) {
      relations.push({
        itemId,
        ...relation
      });
    }
    return relations;
  }

  /**
   * 获取指定召唤兽装备的所有物品ID
   * @param {string} summonId - 召唤兽ID
   * @returns {Array} 物品ID列表
   */
  getSummonEquippedItems(summonId) {
    const equipment = this.summonEquipmentIndex.get(summonId);
    return equipment ? Object.values(equipment) : [];
  }

  /**
   * 移除召唤兽的所有装备
   * @param {string} summonId - 召唤兽ID
   * @returns {Array} 被移除的物品ID列表
   */
  removeAllSummonEquipment(summonId) {
    const equippedItems = this.getSummonEquippedItems(summonId);
    const removedItems = [];

    for (const itemId of equippedItems) {
      if (this.unequip(itemId, summonId)) {
        removedItems.push(itemId);
      }
    }

    console.log(`[EquipmentRelationshipManager] 移除召唤兽 ${summonId} 的所有装备:`, removedItems);
    return removedItems;
  }

  /**
   * 交换两个召唤兽的装备
   * @param {string} summonId1 - 召唤兽1 ID
   * @param {string} summonId2 - 召唤兽2 ID
   * @param {string} slotType - 槽位类型
   * @returns {boolean} 是否成功
   */
  swapEquipment(summonId1, summonId2, slotType) {
    try {
      const summon1Equipment = this.summonEquipmentIndex.get(summonId1);
      const summon2Equipment = this.summonEquipmentIndex.get(summonId2);

      const item1 = summon1Equipment?.[slotType];
      const item2 = summon2Equipment?.[slotType];

      // 先卸下所有相关装备
      if (item1) this.unequip(item1, summonId1);
      if (item2) this.unequip(item2, summonId2);

      // 交换装备
      if (item1) this.equip(item1, summonId2);
      if (item2) this.equip(item2, summonId1);

      console.log(`[EquipmentRelationshipManager] 交换装备成功: ${summonId1}:${slotType} <-> ${summonId2}:${slotType}`);
      return true;

    } catch (error) {
      console.error('[EquipmentRelationshipManager] 交换装备失败:', error);
      return false;
    }
  }

  /**
   * 清除缓存
   * @param {string} itemId - 物品ID
   * @param {string} summonId - 召唤兽ID
   */
  clearCache(itemId, summonId) {
    if (itemId) {
      this.equipmentStatusCache.delete(itemId);
    }
    if (summonId) {
      this.equipmentStatusCache.delete(`summon_${summonId}`);
    }
  }

  /**
   * 验证数据一致性
   * @returns {Object} 验证结果
   */
  validateConsistency() {
    const issues = [];
    
    // 检查双向索引一致性
    for (const [itemId, relation] of this.equipmentRelations) {
      const { summonId, slotType } = relation;
      const summonEquipment = this.summonEquipmentIndex.get(summonId);
      
      if (!summonEquipment || summonEquipment[slotType] !== itemId) {
        issues.push({
          type: 'index_mismatch',
          itemId,
          summonId,
          slotType,
          message: '双向索引不匹配'
        });
      }
    }

    // 检查反向索引
    for (const [summonId, equipment] of this.summonEquipmentIndex) {
      for (const [slotType, itemId] of Object.entries(equipment)) {
        const relation = this.equipmentRelations.get(itemId);
        
        if (!relation || relation.summonId !== summonId || relation.slotType !== slotType) {
          issues.push({
            type: 'reverse_index_mismatch',
            itemId,
            summonId,
            slotType,
            message: '反向索引不匹配'
          });
        }
      }
    }

    return {
      isConsistent: issues.length === 0,
      issues,
      totalRelations: this.equipmentRelations.size,
      totalSummons: this.summonEquipmentIndex.size
    };
  }

  /**
   * 修复数据不一致性
   * @returns {Object} 修复结果
   */
  repairConsistency() {
    const validation = this.validateConsistency();
    const repairs = [];

    for (const issue of validation.issues) {
      try {
        if (issue.type === 'index_mismatch') {
          // 以equipmentRelations为准，修复summonEquipmentIndex
          const relation = this.equipmentRelations.get(issue.itemId);
          if (relation) {
            if (!this.summonEquipmentIndex.has(relation.summonId)) {
              this.summonEquipmentIndex.set(relation.summonId, {});
            }
            this.summonEquipmentIndex.get(relation.summonId)[relation.slotType] = issue.itemId;
            repairs.push(`修复召唤兽索引: ${issue.itemId} -> ${relation.summonId}:${relation.slotType}`);
          }
        } else if (issue.type === 'reverse_index_mismatch') {
          // 以summonEquipmentIndex为准，修复equipmentRelations
          const summonEquipment = this.summonEquipmentIndex.get(issue.summonId);
          if (summonEquipment && summonEquipment[issue.slotType] === issue.itemId) {
            this.equipmentRelations.set(issue.itemId, {
              summonId: issue.summonId,
              slotType: issue.slotType,
              equippedAt: Date.now()
            });
            repairs.push(`修复装备关系: ${issue.itemId} -> ${issue.summonId}:${issue.slotType}`);
          }
        }
      } catch (error) {
        console.error(`[EquipmentRelationshipManager] 修复失败:`, issue, error);
      }
    }

    console.log(`[EquipmentRelationshipManager] 数据一致性修复完成，修复了 ${repairs.length} 个问题`);
    return {
      repaired: repairs.length,
      repairs,
      finalValidation: this.validateConsistency()
    };
  }

  /**
   * 导出数据
   * @returns {Object} 序列化的数据
   */
  exportData() {
    return {
      equipmentRelations: Array.from(this.equipmentRelations.entries()),
      summonEquipmentIndex: Array.from(this.summonEquipmentIndex.entries()),
      exportedAt: Date.now()
    };
  }

  /**
   * 导入数据
   * @param {Object} data - 序列化的数据
   */
  importData(data) {
    try {
      this.equipmentRelations.clear();
      this.summonEquipmentIndex.clear();
      this.equipmentStatusCache.clear();

      if (data.equipmentRelations) {
        this.equipmentRelations = new Map(data.equipmentRelations);
      }

      if (data.summonEquipmentIndex) {
        this.summonEquipmentIndex = new Map(data.summonEquipmentIndex);
      }

      // 验证导入的数据
      const validation = this.validateConsistency();
      if (!validation.isConsistent) {
        console.warn('[EquipmentRelationshipManager] 导入的数据不一致，正在修复...');
        this.repairConsistency();
      }

      console.log('[EquipmentRelationshipManager] 数据导入完成');
      this.emit('data_imported', { validation });

    } catch (error) {
      console.error('[EquipmentRelationshipManager] 数据导入失败:', error);
      throw error;
    }
  }

  /**
   * 清空所有数据
   */
  clear() {
    this.equipmentRelations.clear();
    this.summonEquipmentIndex.clear();
    this.equipmentStatusCache.clear();
    
    this.emit('data_cleared');
    console.log('[EquipmentRelationshipManager] 所有数据已清空');
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const relations = this.getAllEquipmentRelations();
    const summonCount = this.summonEquipmentIndex.size;
    const itemCount = this.equipmentRelations.size;

    // 按槽位类型统计
    const slotTypeStats = {};
    for (const relation of relations) {
      slotTypeStats[relation.slotType] = (slotTypeStats[relation.slotType] || 0) + 1;
    }

    // 按召唤兽统计装备数量
    const summonEquipmentCounts = {};
    for (const [summonId, equipment] of this.summonEquipmentIndex) {
      summonEquipmentCounts[summonId] = Object.keys(equipment).length;
    }

    return {
      totalRelations: itemCount,
      totalSummons: summonCount,
      averageEquipmentPerSummon: summonCount > 0 ? itemCount / summonCount : 0,
      slotTypeDistribution: slotTypeStats,
      summonEquipmentCounts,
      lastUpdate: Date.now()
    };
  }
}

// 创建单例实例
const equipmentRelationshipManager = new EquipmentRelationshipManager();

export default equipmentRelationshipManager; 