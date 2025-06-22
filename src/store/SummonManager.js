/**
 * 面向对象召唤兽管理系统 - 简化版
 * 核心设计原则：封装、单一职责
 */
import { EventEmitter } from "events";
import playerManagerInstance from "./managers/PlayerManager"; // 修正路径

import {
  
  createCreatureFromTemplate,
} from "@/utils/summonUtils";

import Summon, { SummonFactory } from './Summon';

// ===========================================
// 召唤兽管理器 - 管理所有召唤兽实例
// ===========================================
class SummonManager extends EventEmitter {
  constructor() {
    super();
    this.summons = {};
    this.currentSummonId = null;
    this.maxSummons = 5; // 提供一个临时的默认值
    this.playerManager = null;
  }

  /**
   * 初始化管理器并注入依赖
   * @param {object} playerManager 
   */
  initialize(playerManager) {
    this.playerManager = playerManager;
    // 从PlayerManager获取真实初始值
    this.maxSummons = this.playerManager.getState().maxSummons;
    
    // 监听玩家等级变化导致的上限变化
    this.handleMaxSummonsChange = this.handleMaxSummonsChange.bind(this);
    this.playerManager.on('max_summons_changed', this.handleMaxSummonsChange);
    console.log('[SummonManager] Initialized with PlayerManager.');
  }

  handleMaxSummonsChange(newMax) {
    console.log(`[SummonManager] Received max_summons_changed event. New max: ${newMax}`);
    this.maxSummons = newMax;
    this.emit("state_changed", this.getState());
    // 别忘了移除对外部管理器的监听
    if (this.playerManager) {
      this.playerManager.off('max_summons_changed', this.handleMaxSummonsChange);
    }
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
   * This method ensures that the captured creature's unique derivedAttributes are preserved.
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

    // After creation, immediately recalculate derivedAttributes to apply level/growth effects.
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

  /**
   * 重置管理器状态以开始新游戏
   */
  reset() {
    this.summons = {};
    this.currentSummonId = null;
    this.emit("state_changed", this.getState());
    console.log('[SummonManager] 状态已重置。');
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

  // ===========================================
  // 存档/读档接口
  // ===========================================

  /**
   * 获取用于存档的召唤兽数据
   * @returns {object}
   */
  getSaveData() {
    // 直接复用已有的getState逻辑
    return this.getState();
  }

  /**
   * 从存档数据中加载召唤兽状态
   * @param {object} data - 包含allSummons, currentSummonId等数据的对象
   */
  loadSaveData(data) {
    console.log('[SummonManager] 正在从存档恢复状态:', data);
    if (!data || !data.allSummons) {
      console.warn('[SummonManager] 存档中无有效的召唤兽数据，将重置状态。');
      this.reset();
      return;
    }

    // 1. 清空当前状态
    this.summons = {};
    
    // 2. 从数据恢复召唤兽实例
    Object.values(data.allSummons).forEach(summonJson => {
      const summon = SummonFactory.fromJSON(summonJson);
      summon.setManager(this); // 重新关联管理器
      this.summons[summon.id] = summon;
    });

    // 3. 恢复当前选中的召唤兽ID
    this.currentSummonId = data.currentSummonId || null;
    
    // 4. 通知UI状态已彻底改变
    this.emit("state_changed", this.getState());
    console.log('[SummonManager] 状态恢复成功。');
  }

  destroy() {
    this.removeAllListeners();
    // 别忘了移除对外部管理器的监听
    if (this.playerManager) {
      this.playerManager.off('max_summons_changed', this.handleMaxSummonsChange);
    }
  }

  emitChange() {
    this.emit('change', this.getState());
  }
}

export default SummonManager;
