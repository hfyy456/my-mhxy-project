/**
 * 面向对象召唤兽管理系统 - 简化版
 * 核心设计原则：封装、单一职责
 */
import { EventEmitter } from "events";

import {
  
  createCreatureFromTemplate,
} from "@/utils/summonUtils";

import Summon, { SummonFactory } from './Summon';

// ===========================================
// 召唤兽管理器 - 管理所有召唤兽实例
// ===========================================
class SummonManager extends EventEmitter {
  constructor(maxSummons = 6) {
    super();
    this.summons = {};
    this.currentSummonId = null;
    this.maxSummons = maxSummons;
  }

  getState() {
    return {
      allSummons: Object.fromEntries(
        Object.entries(this.summons).map(([id, summon]) => [id, summon.toJSON()])
      ),
      currentSummonId: this.currentSummonId,
      maxSummons: this.maxSummons,
    };
  }

  addSummon(summonData) {
    if (Object.keys(this.summons).length >= this.maxSummons) {
      this.emit("error", { message: "召唤兽数量已达上限" });
      return null;
    }

    // 增加兼容性，既能处理 templateId 也能处理 summonSourceId
    const templateId = summonData.templateId || summonData.summonSourceId;
    if (!templateId) {
      console.error("[SummonManager] addSummon 失败: 传入的数据中缺少 templateId 或 summonSourceId。", summonData);
      return null;
    }

    const summon = createCreatureFromTemplate({ templateId: templateId, level: summonData.level || 1 });
    if (!summon) return null;

    summon.setManager(this);
    this.summons[summon.id] = summon;
    this.emit("state_changed", this.getState());
    return summon;
  }

  /**
   * Adds a new summon from captured battle data.
   * This method ensures that the captured creature's unique stats are preserved.
   * @param {object} capturedData - The data snapshot from BattleEngine.
   * @returns {Summon|null} The newly created Summon instance, or null on failure.
   */
  addSummonFromCapture(capturedData) {
    if (Object.keys(this.summons).length >= this.maxSummons) {
      this.emit("error", { message: "召唤兽数量已达上限" });
      return null;
    }

    if (!capturedData || !capturedData.templateId || !capturedData.innateProfile) {
      this.emit("error", { message: "无效的捕捉数据" });
      return null;
    }
    
    // Create the base creature instance from the profile.
    // This correctly sets up the "genes" (innateAttributes, growthRates).
    const summon = SummonFactory.createSummon({
      summonSourceId: capturedData.templateId,
      level: capturedData.level,
      innateAttributes: capturedData.innateProfile.innateAttributes,
      growthRates: capturedData.innateProfile.growthRates,
      personalityId: capturedData.innateProfile.personalityId,
    });

    if (!summon) return null;

    // After creation, immediately recalculate stats to apply level/growth effects.
    // The constructor's recalculate might not be sufficient if level > 1.
    summon.recalculateStats();

    this.registerSummon(summon);
    return summon;
  }

  /**
   * Registers an already created summon instance.
   * @param {Summon} summonInstance - The summon instance to register.
   * @returns {Summon|null} The registered instance or null on failure.
   */
  registerSummon(summonInstance) {
    if (Object.keys(this.summons).length >= this.maxSummons) {
      this.emit("error", { message: "召唤兽数量已达上限" });
      return null;
    }
    if (!(summonInstance instanceof Summon)) {
      this.emit("error", { message: "registerSummon需要一个有效的Summon实例" });
      return null;
    }

    summonInstance.setManager(this);
    this.summons[summonInstance.id] = summonInstance;
    this.emit("state_changed", this.getState());
    return summonInstance;
  }

  removeSummon(summonId) {
    if (!this.summons[summonId]) {
      this.emit("error", { message: "找不到要移除的召唤兽" });
      return false;
    }
    delete this.summons[summonId];
    if (this.currentSummonId === summonId) {
      this.currentSummonId = null;
    }
    this.emit("state_changed", this.getState());
    return true;
  }

  setCurrentSummon(summonId) {
    if (summonId && !this.summons[summonId]) {
      this.emit("error", { message: "找不到要设置为当前的召唤兽" });
      return;
    }
    this.currentSummonId = summonId;
    this.emit("state_changed", this.getState());
  }

  getSummonById(summonId) {
    return this.summons[summonId] || null;
  }

  getCurrentSummon() {
    return this.currentSummonId ? this.summons[this.currentSummonId] : null;
  }

  getAllSummons() {
    return this.summons;
  }

  releaseSummon(summonId) {
    const summon = this.getSummonById(summonId);
    if (!summon) {
      return { success: false, message: "召唤兽不存在" };
    }
    const rewards = this.calculateReleaseRewards(summon);
    this.removeSummon(summonId);
    return { success: true, rewards };
  }

  calculateReleaseRewards(summon) {
    return {
      experience: summon.level * 100,
      gold: summon.level * 50,
    };
  }

  async getSummonEquipmentStatus(summonId) {
    const summon = this.getSummonById(summonId);
    if (!summon) return null;
    return await summon.getEquippedItems();
  }

   recalculateSummonStats(summonId) {
    const summon = this.getSummonById(summonId);
    if (summon) {
     summon.recalculateStats();
      this.emit("state_changed", this.getState());
    }
  }

  destroy() {
    this.removeAllListeners();
  }
}

const summonManagerInstance = new SummonManager();
export default summonManagerInstance;
