import { generateUniqueId } from "@/utils/idUtils";
import {
  summonConfig,
  qualityConfig,
  levelExperienceRequirements,
  MAX_LEVEL,
  POINTS_PER_LEVEL,
  MAX_SKILLS,
  STANDARD_EQUIPMENT_SLOTS
} from "@/config/config";
import {
  updateSummonStats,
  getExperienceForLevel,
  determineCombatRole,
} from "@/utils/summonUtils";
import equipmentRelationshipManagerInstance from "./EquipmentRelationshipManager";
import inventoryManagerInstance from "./InventoryManager";

class Summon {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.summonSourceId = data.summonSourceId || "";
    this.sourceId = data.sourceId || "";
    this.nickname = data.nickname || "";
    this.level = data.level || 1;
    this.experience = data.experience || 0;
    this.quality = data.quality || "normal";
    this.creatureType = data.creatureType || "summon";
    this.isCapturable = data.isCapturable || true;
    this.fiveElement = data.fiveElement || (data.summonSourceId && summonConfig[data.summonSourceId]?.fiveElement) || "metal";
    this.natureType = data.natureType || "wild";
    this.personalityId = data.personalityId || "neutral";
    this.innateAttributes = data.innateAttributes || {};
    this.growthRates = data.growthRates || {};
    this.basicAttributes = {
      constitution: data.basicAttributes?.constitution || 0,
      strength: data.basicAttributes?.strength || 0,
      agility: data.basicAttributes?.agility || 0,
      intelligence: data.basicAttributes?.intelligence || 0,
      luck: data.basicAttributes?.luck || 0,
      ...data.basicAttributes,
    };
    this.allocatedPoints = {
      constitution: 0,
      strength: 0,
      agility: 0,
      intelligence: 0,
      luck: 0,
      ...data.allocatedPoints,
    };
    this.potentialPoints = data.potentialPoints !== undefined ? data.potentialPoints : (this.level - 1) * POINTS_PER_LEVEL;
    this.derivedAttributes = {};
    this.equipmentContributions = {};
    this.equipmentBonusesToBasic = {};
    this.power = 0;
    this.skillSet = data.skillSet || [];
    this.skillLevels = data.skillLevels || {};
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
    this.manager = null;
    this.recalculateStats();
  }

  get combatRole() {
    return determineCombatRole(this.getEffectiveBasicAttributes());
  }

  getConfig() {
    return summonConfig[this.summonSourceId] || {};
  }

  getQualityConfig() {
    const qualityIndex = qualityConfig.names.indexOf(this.quality);
    return {
      index: qualityIndex,
      multiplier: qualityConfig.attributeMultipliers[qualityIndex] || 1.0,
      color: qualityConfig.colors[this.quality] || qualityConfig.colors.normal,
    };
  }

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

  async recalculateStats() {
    try {
      const allNewStats = await updateSummonStats(this);
      this.basicAttributes = allNewStats.basicAttributes;
      this.derivedAttributes = allNewStats.derivedAttributes;
      this.power = allNewStats.combatPower;
      this.equipmentContributions = allNewStats.equipmentContributions;
      this.equipmentBonusesToBasic = {};

      this.updatedAt = Date.now();
      this.notifyChange("attributes_updated");
    } catch (error) {
      console.error(`[Summon] ${this.id} 属性计算失败:`, error);
    }
  }

  async setLevel(newLevel) {
    this.level = Math.max(1, newLevel);
    this.experience = 0;
    this.potentialPoints = (this.level - 1) * POINTS_PER_LEVEL;
    await this.recalculateStats();
    this.notifyChange("level_changed");
  }

  async getEquippedItems() {
    const items = {};
    try {
      const equippedSlotMap = equipmentRelationshipManagerInstance.getSummonEquipment(this.id);
      for (const [slotType, itemId] of Object.entries(equippedSlotMap)) {
        if (itemId) {
          const item = inventoryManagerInstance.getItemById(itemId);
          items[slotType] = item;
        } else {
          items[slotType] = null;
        }
      }
      STANDARD_EQUIPMENT_SLOTS.forEach((slot) => {
        if (!items.hasOwnProperty(slot)) {
          items[slot] = null;
        }
      });
      return items;
    } catch (error) {
      const defaultItems = {};
      STANDARD_EQUIPMENT_SLOTS.forEach((slot) => {
        defaultItems[slot] = null;
      });
      return defaultItems;
    }
  }

  gainExperience(amount) {
    if (this.level >= MAX_LEVEL) return false;
    this.experience += amount;
    let levelsGained = 0;
    while (this.level < MAX_LEVEL && this.experience >= this.getExperienceToNextLevel()) {
      this.experience -= this.getExperienceToNextLevel();
      this.levelUp();
      levelsGained++;
    }
    if (levelsGained > 0) {
      this.updatedAt = Date.now();
      this.notifyChange("level_up", { levelsGained, newLevel: this.level });
      this.recalculateStats();
    }
    return levelsGained > 0;
  }

  levelUp() {
    this.level++;
    this.potentialPoints += POINTS_PER_LEVEL;
    this.recalculateStats();

  }

  getExperienceToNextLevel() {
    if (this.level >= MAX_LEVEL) return Infinity;
    return getExperienceForLevel(this.level + 1);
  }

  allocatePoints(attributeName, amount) {
    if (amount <= 0 || this.potentialPoints < amount || !this.allocatedPoints.hasOwnProperty(attributeName)) {
      return false;
    }
    this.allocatedPoints[attributeName] += amount;
    this.potentialPoints -= amount;
    this.updatedAt = Date.now();
    this.recalculateStats();
    this.notifyChange("points_allocated", { attributeName, amount });
    return true;
  }

  resetAllocatedPoints() {
    const totalAllocated = Object.values(this.allocatedPoints).reduce((sum, val) => sum + val, 0);
    Object.keys(this.allocatedPoints).forEach((attr) => {
      this.allocatedPoints[attr] = 0;
    });
    this.potentialPoints += totalAllocated;
    this.updatedAt = Date.now();
    this.recalculateStats();
    this.notifyChange("points_reset");
    return true;
  }

  learnSkill(skillId, replaceIndex = -1) {
    if (this.skillSet.includes(skillId)) return false;
    if (this.skillSet.length >= MAX_SKILLS && replaceIndex === -1) return false;
    if (replaceIndex >= 0 && replaceIndex < this.skillSet.length) {
      const oldSkill = this.skillSet[replaceIndex];
      this.skillSet[replaceIndex] = skillId;
      this.skillLevels[skillId] = 1;
      delete this.skillLevels[oldSkill];
      this.updatedAt = Date.now();
      this.notifyChange("skill_replaced", { oldSkill, newSkill: skillId, index: replaceIndex });
    } else {
      this.skillSet.push(skillId);
      this.skillLevels[skillId] = 1;
      this.updatedAt = Date.now();
      this.notifyChange("skill_learned", { skillId });
    }
    return true;
  }

  forgetSkill(skillId) {
    const index = this.skillSet.indexOf(skillId);
    if (index === -1) return false;
    this.skillSet.splice(index, 1);
    delete this.skillLevels[skillId];
    this.updatedAt = Date.now();
    this.notifyChange("skill_forgotten", { skillId });
    return true;
  }

  setNickname(nickname) {
    const oldNickname = this.nickname;
    this.nickname = nickname;
    this.updatedAt = Date.now();
    this.notifyChange("nickname_changed", { oldNickname, newNickname: nickname });
  }

  setManager(manager) {
    this.manager = manager;
  }

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

  getFullData() {
    return {
      ...this.toJSON(),
      effectiveBasicAttributes: this.getEffectiveBasicAttributes(),
      config: this.getConfig(),
      qualityConfig: this.getQualityConfig(),
      experienceToNextLevel: this.getExperienceToNextLevel(),
    };
  }

  toJSON() {
    return {
      id: this.id,
      summonSourceId: this.summonSourceId,
      sourceId: this.sourceId,
      nickname: this.nickname,
      level: this.level,
      experience: this.experience,
      quality: this.quality,
      creatureType: this.creatureType,
      isCapturable: this.isCapturable,
      fiveElement: this.fiveElement,
      natureType: this.natureType,
      personalityId: this.personalityId,
      innateAttributes: { ...this.innateAttributes },
      growthRates: { ...this.growthRates },
      basicAttributes: { ...this.basicAttributes },
      allocatedPoints: { ...this.allocatedPoints },
      potentialPoints: this.potentialPoints,
      skillSet: [...this.skillSet],
      skillLevels: { ...this.skillLevels },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      derivedAttributes: { ...this.derivedAttributes },
      equipmentContributions: { ...this.equipmentContributions },
      equipmentBonusesToBasic: { ...this.equipmentBonusesToBasic },
      power: this.power, 
    };
  }

  toBattleJSON() {
    const config = this.getConfig();
    return {
      id: this.id,
      name: this.nickname || config.name,
      level: this.level,
      isPlayerUnit: true, // 默认是玩家单位，可在适配器中修改
      isCapturable: this.isCapturable,
      
      // 战斗核心统计数据
      stats: {
        ...this.derivedAttributes,
        // 确保战斗开始时currentHp和currentMp是满的
        currentHp: this.derivedAttributes.hp, 
        currentMp: this.derivedAttributes.mp,
        maxHp: this.derivedAttributes.hp, 
        maxMp: this.derivedAttributes.mp
      },
      
      // 其他战斗相关数据
      skillSet: [...this.skillSet],
      skillLevels: { ...this.skillLevels },
      fiveElement: this.fiveElement,
      
      // 原始数据，用于调试或非战斗场景
      _source: {
        summonSourceId: this.summonSourceId,
        sourceId: this.sourceId,
        quality: this.quality,
        natureType: this.natureType,
        basicAttributes: { ...this.basicAttributes },
        allocatedPoints: { ...this.allocatedPoints },
        derivedAttributes: { ...this.derivedAttributes },
        power: this.power,
        innateAttributes: { ...this.innateAttributes },
        growthRates: { ...this.growthRates }
    }
  }
  }

  generateId() {
    return generateUniqueId("summon");
  }
}

class SummonFactory {
  static createSummon(data) {
    return new Summon(data);
  }

  static fromJSON(jsonData) {
    return this.createSummon(jsonData);
  }
}

export { Summon, SummonFactory };
export default Summon; 