import { refineMonster, bookSkill, confirmReplaceSkill } from '../gameLogic';
import EventEmitter from './EventEmitter';
import EquipmentManager from '../managers/EquipmentManager';
import EquipmentEntity from '../entities/EquipmentEntity';

class GameManager extends EventEmitter {
  constructor() {
    super();
    this.initialize();
  }

  initialize() {
    // 初始化游戏状态
    const initialRefineResult = refineMonster();
    this.currentSummon = initialRefineResult.newSummon;
    this.historyList = initialRefineResult.historyItem ? [initialRefineResult.historyItem] : [];
    this.resultRecordList = [];
    this.pendingSkill = null;
  }

  // 炼妖
  refineMonster() {
    const { newSummon, historyItem, message } = refineMonster();
    this.historyList.push(historyItem);
    this.currentSummon = newSummon;
    this.emit('summonUpdated', this.currentSummon);
    this.emit('historyUpdated', this.historyList);
    return { message, type: 'success' };
  }

  // 打书
  bookSkill() {
    const result = bookSkill(this.currentSummon);
    if (!result.success) {
      return { message: result.message, type: 'error' };
    }

    if (result.needConfirm) {
      this.pendingSkill = result.pendingSkill;
      this.emit('skillReplacementNeeded', this.pendingSkill);
      return { needConfirm: true };
    }

    this.currentSummon = result.newSummon;
    this.emit('summonUpdated', this.currentSummon);
    return { message: result.message, type: 'success' };
  }

  // 确认替换技能
  confirmReplaceSkill(confirm) {
    if (!confirm || !this.pendingSkill) {
      this.pendingSkill = null;
      return { message: '操作取消，未替换任何技能。', type: 'info' };
    }

    const result = confirmReplaceSkill(this.currentSummon, this.pendingSkill);
    this.currentSummon = result.newSummon;
    this.pendingSkill = null;
    this.emit('summonUpdated', this.currentSummon);
    return { message: result.message, type: 'success' };
  }

  // 增加经验
  addExperience(amount) {
    if (!this.currentSummon) {
      return { message: '没有当前召唤兽', type: 'error' };
    }

    const result = this.currentSummon.addExperience(amount);
    this.emit('summonUpdated', this.currentSummon);
    return { message: result.message, type: result.leveledUp ? 'success' : 'info' };
  }

  // 装备物品
  equipItem(equipmentEntity, slotType) {
    if (!this.currentSummon) {
      return { success: false, message: '没有当前召唤兽', type: 'error' };
    }

    if (!equipmentEntity || !(equipmentEntity instanceof EquipmentEntity) || !equipmentEntity.id) {
        return { success: false, message: '无效的装备实体数据提供给GameManager', type: 'error' };
    }

    // 直接调用 Summon 的 equipItem，它现在会处理卸下旧物品的逻辑
    const equipResult = this.currentSummon.equipItem(equipmentEntity, slotType);

    if (!equipResult.success) {
      // Summon.equipItem 内部失败，直接返回其提供的消息
      console.error(`[GameManager] Failed to equip item via Summon: ${equipResult.message}`);
      return { success: false, message: equipResult.message, type: 'error' };
    }

    // 装备成功
    this.emit('summonUpdated', this.currentSummon); // 属性已在Summon内部重新计算并更新
    console.log(`[GameManager] equipItem successful for ${equipmentEntity.name} into ${slotType}. Summon updated.`);
    
    return {
      success: true,
      message: equipResult.message, // 使用 Summon 返回的更详细的消息
      equippedItemEntityId: equipmentEntity.id,
      unequippedItemEntityId: equipResult.unequippedItemEntityId, // 从 Summon 获取被卸下物品的ID
      // GameManager 现在不需要自己管理 updatedSummon，因为 Summon 实例是直接修改的
    };
  }

  // 分配潜力点
  allocatePotentialPoint(attribute, amount = 1) {
    if (!this.currentSummon) {
      return { message: '没有当前召唤兽', type: 'error' };
    }

    if (this.currentSummon.potentialPoints < amount) {
      return { message: '没有足够的潜力点', type: 'error' };
    }

    if (!this.currentSummon.allocatedPoints.hasOwnProperty(attribute)) {
      return { message: '无效的属性类型', type: 'error' };
    }

    const success = this.currentSummon.allocatePoint(attribute, amount);
    if (!success) {
      return { message: '分配潜力点失败', type: 'error' };
    }

    this.emit('summonUpdated', this.currentSummon);
    return { message: `成功分配${amount}点潜力点到${attribute}`, type: 'success' };
  }

  // 重置潜力点
  resetPotentialPoints() {
    if (!this.currentSummon) {
      return { message: '没有当前召唤兽', type: 'error' };
    }

    const totalPoints = Object.values(this.currentSummon.allocatedPoints).reduce((a, b) => a + b, 0);
    this.currentSummon.potentialPoints += totalPoints;
    this.currentSummon.allocatedPoints = {
      constitution: 0,
      strength: 0,
      agility: 0,
      intelligence: 0,
      luck: 0,
    };
    this.currentSummon.recalculateStats();
    this.emit('summonUpdated', this.currentSummon);
    return { message: '成功重置所有潜力点', type: 'success' };
  }

  // 获取当前召唤兽
  getCurrentSummon() {
    return this.currentSummon;
  }

  // 获取历史记录
  getHistoryList() {
    return this.historyList;
  }

  // 获取结果记录
  getResultRecordList() {
    return this.resultRecordList;
  }

  // 添加结果记录
  addResultRecord(message) {
    this.resultRecordList.push(message);
    this.emit('resultRecordUpdated', this.resultRecordList);
  }

  // 从指定槽位卸下装备
  unequipItem(slotType) {
    if (!this.currentSummon) {
      return { success: false, message: '没有当前召唤兽可卸下装备', type: 'error' };
    }

    const unequipResult = this.currentSummon.unequipItem(slotType);

    if (!unequipResult.success) {
      console.error(`[GameManager] Failed to unequip item from slot ${slotType} via Summon: ${unequipResult.message}`);
      return { success: false, message: unequipResult.message, type: 'error' };
    }

    // 卸装成功
    this.emit('summonUpdated', this.currentSummon); // 属性已在Summon内部重新计算并更新
    console.log(`[GameManager] unequipItem successful from slot ${slotType}. Summon updated.`);

    return {
      success: true,
      message: unequipResult.message, // 使用 Summon 返回的消息
      unequippedItemEntityId: unequipResult.unequippedItemEntityId, // 从 Summon 获取被卸下物品的ID
    };
  }
}

export default GameManager; 