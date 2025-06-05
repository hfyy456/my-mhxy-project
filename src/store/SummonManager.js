/**
 * 面向对象召唤兽管理系统 - 简化版
 * 核心设计原则：封装、单一职责
 */
import { EventEmitter } from "events";
import { generateUniqueId } from "@/utils/idUtils";
import {
  summonConfig,
  qualityConfig,
  derivedAttributeConfig,
  STANDARD_EQUIPMENT_SLOTS,
  levelExperienceRequirements,
  MAX_LEVEL,
  POINTS_PER_LEVEL,
  MAX_SKILLS,
  ACTIVE_SKILL_LIMIT,
} from "@/config/config";
import {
  calculateDerivedAttributes,
  getExperienceForLevel,
} from "@/utils/summonUtils";
import { EQUIPMENT_SLOT_TYPES } from "@/config/enumConfig";
import equipmentRelationshipManagerInstance from "./EquipmentRelationshipManager";
import inventoryManagerInstance from "./InventoryManager";

// ===========================================
// 召唤兽类 - 基础召唤兽实现
// ===========================================

/**
 * 召唤兽类 - 统一的召唤兽实现
 */
class Summon {
  constructor(data) {
    // 基础属性
    this.id = data.id || this.generateId();
    this.summonSourceId = data.summonSourceId || "";
    this.nickname = data.nickname || "";
    this.level = data.level || 1;
    this.experience = data.experience || 0;
    this.quality = data.quality || "normal";
    
    // 五行属性：优先使用传入的data.fiveElement，否则从配置中获取
    this.fiveElement = data.fiveElement || 
      (data.summonSourceId && summonConfig[data.summonSourceId]?.fiveElement) || 
      "metal"; // 默认金属性而不是"none"
    
    this.natureType = data.natureType || "wild";
    this.personalityId = data.personalityId || "neutral";

    // DEBUG: Log removed equippedItemIds reference
    // console.log(
    //   `[Summon constructor] ID: ${this.id}, Nickname: ${
    //     this.nickname || "N/A"
    //   }, received data.equippedItemIds:`,
    //   JSON.parse(JSON.stringify(data.equippedItemIds || {}))
    // );

    // 基础属性 (五维)
    this.basicAttributes = {
      constitution: data.basicAttributes?.constitution || 0,
      strength: data.basicAttributes?.strength || 0,
      agility: data.basicAttributes?.agility || 0,
      intelligence: data.basicAttributes?.intelligence || 0,
      luck: data.basicAttributes?.luck || 0,
      ...data.basicAttributes,
    };

    // 分配的潜力点
    this.allocatedPoints = {
      constitution: 0,
      strength: 0,
      agility: 0,
      intelligence: 0,
      luck: 0,
      ...data.allocatedPoints,
    };

    // 潜力点数
    this.potentialPoints =
      data.potentialPoints !== undefined
        ? data.potentialPoints
        : (this.level - 1) * POINTS_PER_LEVEL;

    // 计算属性 (由基础属性计算得出)
    this.derivedAttributes = {};
    this.equipmentContributions = {};
    this.equipmentBonusesToBasic = {};
    this.power = 0;

    // 技能系统
    this.skillSet = data.skillSet || [];
    this.skillLevels = data.skillLevels || {};

    // 装备系统 - equippedItemIds 已移除
    // this.equippedItemIds = {};
    // STANDARD_EQUIPMENT_SLOTS.forEach((slot) => {
    //   this.equippedItemIds[slot] = data.equippedItemIds?.[slot] || null;
    // });

    // 状态和元数据
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
    this.manager = null; // 管理器引用

    // 自动计算初始属性
    this.recalculateAllAttributes();
  }

  // 获取召唤兽配置
  getConfig() {
    return summonConfig[this.summonSourceId] || {};
  }

  // 获取品质配置
  getQualityConfig() {
    const qualityIndex = qualityConfig.names.indexOf(this.quality);
    return {
      index: qualityIndex,
      multiplier: qualityConfig.attributeMultipliers[qualityIndex] || 1.0,
      color: qualityConfig.colors[this.quality] || qualityConfig.colors.normal,
    };
  }

  // 计算有效基础属性 (基础属性 + 分配点数 + 装备加成)
  getEffectiveBasicAttributes() {
    const effective = {};
    Object.keys(this.basicAttributes).forEach((attr) => {
      effective[attr] =
        (this.basicAttributes[attr] || 0) +
        (this.allocatedPoints[attr] || 0) +
        (this.equipmentBonusesToBasic[attr] || 0);
    });
    return effective;
  }

  // 重新计算所有属性
  async recalculateAllAttributes() {
    try {
      // 获取装备数据
      const equippedItems = await this.getEquippedItems();

      // 计算有效基础属性
      const effectiveBasic = this.getEffectiveBasicAttributes();

      // 计算衍生属性
      const result = calculateDerivedAttributes(
        effectiveBasic,
        equippedItems,
        this.level
      );

      this.derivedAttributes = result.derivedAttributes;
      this.equipmentContributions = result.equipmentContributions;
      this.equipmentBonusesToBasic = result.equipmentBonusesToBasic;
      this.power = result.power;

      this.updatedAt = Date.now();
      this.notifyChange("attributes_updated");

      console.log(
        `[Summon] ${this.nickname || this.id} 属性重新计算完成，战力: ${
          this.power
        }`
      );
    } catch (error) {
      console.error(`[Summon] ${this.id} 属性计算失败:`, error);
    }
  }

  // 获取装备物品数据
  async getEquippedItems() {
    const items = {};

    // DEBUG: Log removed equippedItemIds reference
    // console.log(
    //   `[Summon getEquippedItems] ID: ${this.id}, Nickname: ${
    //     this.nickname || "N/A"
    //   }, current this.equippedItemIds:`,
    //   JSON.parse(JSON.stringify(this.equippedItemIds || {}))
    // );

    try {
      // 从 EquipmentRelationshipManager 获取装备信息
      const equippedSlotMap =
        equipmentRelationshipManagerInstance.getSummonEquipment(this.id); // { slotType: itemId }

      for (const [slotType, itemId] of Object.entries(equippedSlotMap)) {
        if (itemId) {
          const item = inventoryManagerInstance.getItemById(itemId);
          items[slotType] = item;
        } else {
          items[slotType] = null; // Should not happen if manager is clean
        }
      }
      // Ensure all standard slots are present in the returned object, even if null
      STANDARD_EQUIPMENT_SLOTS.forEach((slot) => {
        if (!items.hasOwnProperty(slot)) {
          items[slot] = null;
        }
      });

      console.log(
        `[Summon] ${this.nickname || this.id} 装备数据 (from ERM):`,
        items
      );
      return items;
    } catch (error) {
      console.warn(`[Summon] 获取装备数据失败 (from ERM):`, error);
      // 返回基础结构
      const defaultItems = {};
      STANDARD_EQUIPMENT_SLOTS.forEach((slot) => {
        defaultItems[slot] = null;
      });
      return defaultItems;
    }
  }

  // 升级
  gainExperience(amount) {
    if (this.level >= MAX_LEVEL) {
      console.log(`[Summon] ${this.nickname || this.id} 已达到最大等级`);
      return false;
    }

    this.experience += amount;
    let levelsGained = 0;

    // 检查是否升级
    while (
      this.level < MAX_LEVEL &&
      this.experience >= this.getExperienceToNextLevel()
    ) {
      this.experience -= this.getExperienceToNextLevel();
      this.levelUp();
      levelsGained++;
    }

    if (levelsGained > 0) {
      this.updatedAt = Date.now();
      this.notifyChange("level_up", { levelsGained, newLevel: this.level });
      console.log(
        `[Summon] ${this.nickname || this.id} 升级了! 新等级: ${this.level}`
      );
    }

    return levelsGained > 0;
  }

  // 升级逻辑
  levelUp() {
    this.level++;
    this.potentialPoints += POINTS_PER_LEVEL;
  }

  // 获取升级所需经验
  getExperienceToNextLevel() {
    if (this.level >= MAX_LEVEL) return Infinity;
    return getExperienceForLevel(this.level + 1);
  }

  // 分配潜力点
  allocatePoints(attributeName, amount) {
    if (amount <= 0 || this.potentialPoints < amount) {
      return false;
    }

    if (!this.allocatedPoints.hasOwnProperty(attributeName)) {
      return false;
    }

    this.allocatedPoints[attributeName] += amount;
    this.potentialPoints -= amount;
    this.updatedAt = Date.now();

    // 重新计算属性
    this.recalculateAllAttributes();
    this.notifyChange("points_allocated", { attributeName, amount });

    return true;
  }

  // 重置潜力点分配
  resetAllocatedPoints() {
    const totalAllocated = Object.values(this.allocatedPoints).reduce(
      (sum, val) => sum + val,
      0
    );

    Object.keys(this.allocatedPoints).forEach((attr) => {
      this.allocatedPoints[attr] = 0;
    });

    this.potentialPoints += totalAllocated;
    this.updatedAt = Date.now();

    // 重新计算属性
    this.recalculateAllAttributes();
    this.notifyChange("points_reset");

    console.log(`[Summon] ${this.nickname || this.id} 重置了潜力点分配`);
    return true;
  }

  // 学习技能
  learnSkill(skillId, replaceIndex = -1) {
    if (this.skillSet.includes(skillId)) {
      console.log(`[Summon] 已经学会技能: ${skillId}`);
      return false;
    }

    if (this.skillSet.length >= MAX_SKILLS && replaceIndex === -1) {
      console.log(`[Summon] 技能栏已满`);
      return false;
    }

    if (replaceIndex >= 0 && replaceIndex < this.skillSet.length) {
      // 替换现有技能
      const oldSkill = this.skillSet[replaceIndex];
      this.skillSet[replaceIndex] = skillId;
      this.skillLevels[skillId] = 1;
      delete this.skillLevels[oldSkill];

      this.updatedAt = Date.now();
      this.notifyChange("skill_replaced", {
        oldSkill,
        newSkill: skillId,
        index: replaceIndex,
      });

      console.log(
        `[Summon] ${
          this.nickname || this.id
        } 替换技能: ${oldSkill} -> ${skillId}`
      );
    } else {
      // 学习新技能
      this.skillSet.push(skillId);
      this.skillLevels[skillId] = 1;

      this.updatedAt = Date.now();
      this.notifyChange("skill_learned", { skillId });

      console.log(
        `[Summon] ${this.nickname || this.id} 学会新技能: ${skillId}`
      );
    }

    return true;
  }

  // 忘记技能
  forgetSkill(skillId) {
    const index = this.skillSet.indexOf(skillId);
    if (index === -1) return false;

    this.skillSet.splice(index, 1);
    delete this.skillLevels[skillId];

    this.updatedAt = Date.now();
    this.notifyChange("skill_forgotten", { skillId });

    console.log(`[Summon] ${this.nickname || this.id} 忘记了技能: ${skillId}`);
    return true;
  }

  // 装备物品 - 此方法已废弃，装备操作由 EquipmentRelationshipManager 处理
  // async equipItem(itemId, slotType) {
  //   console.warn(`[Summon] equipItem() is deprecated for Summon ID: ${this.id}, Item ID: ${itemId}. Use EquipmentRelationshipManager.`);
  //   return false; // Deprecated functionality
  // }

  // 卸下装备 - 此方法已废弃，卸载操作由 EquipmentRelationshipManager 处理
  // async unequipItem(slotType) {
  //   console.warn(`[Summon] unequipItem() is deprecated for Summon ID: ${this.id}, Slot: ${slotType}. Use EquipmentRelationshipManager.`);
  //   return false; // Deprecated functionality
  // }

  // 设置昵称
  setNickname(nickname) {
    const oldNickname = this.nickname;
    this.nickname = nickname;
    this.updatedAt = Date.now();
    this.notifyChange("nickname_changed", {
      oldNickname,
      newNickname: nickname,
    });

    console.log(`[Summon] ${this.id} 昵称变更: ${oldNickname} -> ${nickname}`);
  }

  // 设置管理器引用
  setManager(manager) {
    this.manager = manager;
  }

  // 通知变化
  notifyChange(eventType, data = {}) {
    if (this.manager) {
      this.manager.emit(`summon_${eventType}`, {
        summon: this,
        summonId: this.id,
        timestamp: Date.now(),
        ...data,
      });
    }
  }

  // 获取完整数据
  getFullData() {
    return {
      ...this.toJSON(),
      effectiveBasicAttributes: this.getEffectiveBasicAttributes(),
      config: this.getConfig(),
      qualityConfig: this.getQualityConfig(),
      experienceToNextLevel: this.getExperienceToNextLevel(),
    };
  }

  // 序列化
  toJSON() {
    // const currentEquippedIds = { ...this.equippedItemIds };
    // RE-ADD DEBUG Log: Log removed equippedItemIds reference
    // console.log(
    //   `[Summon toJSON] ID: ${this.id}, Nickname: ${
    //     this.nickname || "N/A"
    //   }, current this.equippedItemIds for serialization:`,
    //   JSON.parse(JSON.stringify(currentEquippedIds))
    // );

    return {
      id: this.id,
      summonSourceId: this.summonSourceId,
      nickname: this.nickname,
      level: this.level,
      experience: this.experience,
      quality: this.quality,
      fiveElement: this.fiveElement,
      natureType: this.natureType,
      personalityId: this.personalityId,
      basicAttributes: { ...this.basicAttributes },
      allocatedPoints: { ...this.allocatedPoints },
      potentialPoints: this.potentialPoints,
      derivedAttributes: { ...this.derivedAttributes },
      equipmentContributions: { ...this.equipmentContributions },
      equipmentBonusesToBasic: { ...this.equipmentBonusesToBasic },
      power: this.power,
      skillSet: [...this.skillSet],
      skillLevels: { ...this.skillLevels },
      // equippedItemIds: currentEquippedIds, // 已移除
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  generateId() {
    return generateUniqueId("summon");
  }
}

/**
 * 召唤兽工厂 - 简化版，只创建基础召唤兽
 */
class SummonFactory {
  static createSummon(data) {
    return new Summon(data);
  }

  static fromJSON(jsonData) {
    return this.createSummon(jsonData);
  }
}

// ===========================================
// 召唤兽管理器 - 管理所有召唤兽实例
// ===========================================
class SummonManager extends EventEmitter {
  constructor(maxSummons = 6) {
    super();

    this.summons = new Map();
    this.currentSummonId = null;
    this.maxSummons = maxSummons;

    // 自动保存机制
    this.setupAutoSave();

    console.log("[SummonManager] 召唤兽管理器初始化完成");
  }

  // 获取状态
  getState() {
    const summonsArray = Array.from(this.summons.values()).map((summon) =>
      summon.toJSON()
    );
    const currentSummonFullData = this.currentSummonId
      ? this.summons.get(this.currentSummonId)?.getFullData() || null
      : null;

    return {
      allSummons: Object.fromEntries(
        Array.from(this.summons.entries()).map(([id, summon]) => [
          id,
          summon.toJSON(),
        ])
      ),
      currentSummonId: this.currentSummonId,
      currentSummonFullData,
      maxSummons: this.maxSummons,
      summonCount: this.summons.size,
      availableSlots: this.maxSummons - this.summons.size,
    };
  }

  // 添加召唤兽
  addSummon(summonData) {
    try {
      if (this.summons.size >= this.maxSummons) {
        this.emit("error", {
          type: "summons_full",
          message: "召唤兽数量已达上限",
        });
        return null;
      }

      const summon = SummonFactory.createSummon(summonData);
      summon.setManager(this);
      this.summons.set(summon.id, summon);

      this.emit("summon_added", { summon: summon.toJSON() });
      this.emit("state_changed", this.getState());
      this.scheduleAutoSave();

      console.log(
        `[SummonManager] 添加召唤兽: ${summon.nickname || summon.id}`
      );
      return summon;
    } catch (error) {
      this.emit("error", { type: "add_summon_failed", message: error.message });
      return null;
    }
  }

  // 移除召唤兽
  removeSummon(summonId) {
    const summon = this.summons.get(summonId);
    if (!summon) {
      console.warn(`[SummonManager] 找不到召唤兽ID: ${summonId}`);
      return false;
    }

    // 如果是当前选中的召唤兽，清除选中状态
    if (this.currentSummonId === summonId) {
      this.setCurrentSummon(null);
    }

    summon.setManager(null);
    this.summons.delete(summonId);

    this.emit("summon_removed", { summonId, summon: summon.toJSON() });
    this.emit("state_changed", this.getState());
    this.scheduleAutoSave();

    console.log(`[SummonManager] 移除召唤兽: ${summon.nickname || summonId}`);
    return true;
  }

  // 设置当前召唤兽
  setCurrentSummon(summonId) {
    if (summonId && !this.summons.has(summonId)) {
      console.warn(`[SummonManager] 找不到召唤兽ID: ${summonId}`);
      return false;
    }

    this.currentSummonId = summonId;

    this.emit("current_summon_changed", {
      currentSummonId: summonId,
      currentSummonFullData: summonId
        ? this.summons.get(summonId)?.getFullData()
        : null,
    });
    this.emit("state_changed", this.getState());

    console.log(`[SummonManager] 切换当前召唤兽: ${summonId}`);
    return true;
  }

  // 获取召唤兽
  getSummonById(summonId) {
    return this.summons.get(summonId) || null;
  }

  // 获取当前召唤兽
  getCurrentSummon() {
    return this.currentSummonId ? this.summons.get(this.currentSummonId) : null;
  }

  // 获取所有召唤兽
  getAllSummons() {
    return Array.from(this.summons.values());
  }

  // 释放召唤兽 (特殊的移除操作)
  releaseSummon(summonId) {
    const summon = this.getSummonById(summonId);
    if (!summon) return false;

    // 触发释放事件，可以在这里添加释放奖励等逻辑
    this.emit("summon_released", {
      summon: summon.toJSON(),
      rewards: this.calculateReleaseRewards(summon),
    });

    return this.removeSummon(summonId);
  }

  // 计算释放奖励
  calculateReleaseRewards(summon) {
    const baseReward = summon.level * 100;
    const qualityBonus = summon.getQualityConfig().multiplier;

    return {
      experience: Math.floor(baseReward * qualityBonus),
      gold: Math.floor(baseReward * 0.5),
      items: [], // 可能获得的物品
    };
  }

  // 获取召唤兽装备状态 - 此方法已废弃，使用 EquipmentRelationshipManager 的 useSummonEquipmentStatus
  async getSummonEquipmentStatus(summonId) {
    console.warn(
      `[SummonManager] getSummonEquipmentStatus() is deprecated for Summon ID: ${summonId}. Use useSummonEquipmentStatus hook.`
    );
    return {}; // Deprecated functionality
  }

  // 重新计算召唤兽属性
  async recalculateSummonStats(summonId) {
    const summon = this.getSummonById(summonId);
    if (!summon) {
      console.warn(`[SummonManager] 找不到召唤兽ID: ${summonId}`);
      return false;
    }

    await summon.recalculateAllAttributes();

    // 如果是当前召唤兽，更新完整数据
    if (this.currentSummonId === summonId) {
      this.emit("current_summon_changed", {
        currentSummonId: summonId,
        currentSummonFullData: summon.getFullData(),
      });
    }

    this.emit("state_changed", this.getState());
    return true;
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

        // DEBUG: Log the state object just before it's written to Electron Store
        // console.log(
        //   "[SummonManager saveToElectronStore] State being saved to Electron Store:",
        //   JSON.parse(JSON.stringify(stateToSave))
        // );
        // Specifically log equippedItemIds for the first summon, if any
        // if (
        //   stateToSave.summons &&
        //   stateToSave.summons.length > 0 &&
        //   stateToSave.summons[0][1]
        // ) {
        //   console.log(
        //     "[SummonManager saveToElectronStore] First summon's equippedItemIds in stateToSave:",
        //     JSON.parse(
        //       JSON.stringify(stateToSave.summons[0][1].equippedItemIds || {})
        //     )
        //   );
        // }

        await window.electronAPI.store.set("summonState", stateToSave);
        this.emit("state_saved");
      } catch (error) {
        console.error("保存召唤兽状态失败:", error);
        this.emit("error", { type: "save_failed", message: error.message });
      }
    }
  }

  // 从Electron Store加载
  async loadFromElectronStore() {
    if (window.electronAPI?.store) {
      try {
        const savedState = await window.electronAPI.store.get("summonState");

        // DEBUG: Log the raw savedState loaded from Electron Store
        // if (savedState && savedState.summons && savedState.summons.length > 0) {
        //   console.log("[SummonManager loadFromElectronStore] Raw savedState from Electron Store:", JSON.parse(JSON.stringify(savedState)));
        //   const firstSummonEntry = savedState.summons[0];
        //   if (firstSummonEntry && firstSummonEntry[1]) {
        //     console.log("[SummonManager loadFromElectronStore] First summonData from savedState (equippedItemIds check):", JSON.parse(JSON.stringify(firstSummonEntry[1].equippedItemIds || {})));
        //   }
        // } else if (savedState) {
        //   console.log("[SummonManager loadFromElectronStore] savedState from Electron Store (no summons or empty):", JSON.parse(JSON.stringify(savedState)));
        // } else {
        //   console.log("[SummonManager loadFromElectronStore] No savedState found in Electron Store.");
        // }

        if (savedState) {
          this.deserializeFromStorage(savedState);
          this.emit("state_loaded", this.getState());
          console.log("[SummonManager] 加载已保存的召唤兽状态");
        } else {
          console.log("[SummonManager] 没有保存数据");
        }
      } catch (error) {
        console.error("加载召唤兽状态失败:", error);
        this.emit("error", { type: "load_failed", message: error.message });
      }
    } else {
      console.log("[SummonManager] 没有Electron Store");
    }
  }

  // 序列化存储
  serializeForStorage() {
    let summons = Array.from(this.summons.entries()).map(([id, summon]) => [
      id,
      summon.toJSON(),
    ]);
    console.log(
      "[SummonManager serializeForStorage] Serializing summons:",
      summons
    );
    return {
      summons: summons,
      currentSummonId: this.currentSummonId,
      maxSummons: this.maxSummons,
      timestamp: Date.now(),
    };
  }

  // 反序列化
  deserializeFromStorage(savedState) {
    this.summons.clear();

    this.currentSummonId = savedState.currentSummonId || null;
    this.maxSummons = savedState.maxSummons || 6;

    if (savedState.summons) {
      savedState.summons.forEach(([id, summonData]) => {
        // DEBUG: Log removed equippedItemIds reference
        // console.log(
        //   `[SummonManager deserializeFromStorage] Processing summonId: ${id}. summonData.equippedItemIds before createSummon:`,
        //   JSON.parse(JSON.stringify(summonData.equippedItemIds || {}))
        // );

        const summon = SummonFactory.createSummon(summonData);
        summon.setManager(this);
        this.summons.set(id, summon);
      });
    }

    console.log("[SummonManager] 反序列化完成");
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
export const summonManager = new SummonManager();
export default summonManager;

// 导出所有类供外部使用
export { SummonManager, Summon, SummonFactory };
