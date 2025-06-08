/*
 * @Author: Claude
 * @Date: 2025-01-27
 * @Description: 战斗状态容器 - 管理战斗中的所有单位和状态数据
 */

import { generateUniqueId } from '@/utils/idUtils';
import { UNIQUE_ID_PREFIXES } from '@/config/enumConfig';

/**
 * 战斗单位类
 * 封装单个战斗单位的所有状态和行为
 */
export class BattleUnit {
  constructor(unitData, isPlayerUnit = true) {
    this.id = unitData.id || generateUniqueId('battle_unit');
    this.name = unitData.name;
    this.isPlayerUnit = isPlayerUnit;
    this.isDefeated = false;
    this.stats = {
      currentHp: unitData.stats?.currentHp || 100,
      maxHp: unitData.stats?.maxHp || 100,
      attack: unitData.stats?.attack || 20,
      defense: unitData.stats?.defense || 15,
      speed: unitData.stats?.speed || 10
    };
  }

  /**
   * 受到伤害
   * @param {number} damage - 伤害值
   * @returns {Object} 伤害结果
   */
  takeDamage(damage) {
    const actualDamage = Math.max(0, Math.min(damage, this.stats.currentHp));
    this.stats.currentHp -= actualDamage;
    
    if (this.stats.currentHp <= 0) {
      this.stats.currentHp = 0;
      this.isDefeated = true;
    }
    
    return {
      damage: actualDamage,
      remainingHp: this.stats.currentHp,
      isDefeated: this.isDefeated
    };
  }

  /**
   * 恢复生命值
   * @param {number} healing - 治疗值
   * @returns {Object} 治疗结果
   */
  heal(healing) {
    const actualHealing = Math.max(0, Math.min(healing, this.stats.maxHp - this.stats.currentHp));
    this.stats.currentHp += actualHealing;
    
    return {
      healing: actualHealing,
      currentHp: this.stats.currentHp,
      isFullHealth: this.stats.currentHp >= this.stats.maxHp
    };
  }

  /**
   * 消耗法力值
   * @param {number} cost - 消耗值
   * @returns {boolean} 是否成功消耗
   */
  consumeMp(cost) {
    if (this.stats.currentMp >= cost) {
      this.stats.currentMp -= cost;
      return true;
    }
    return false;
  }

  /**
   * 恢复法力值
   * @param {number} recovery - 恢复值
   * @returns {Object} 恢复结果
   */
  recoverMp(recovery) {
    const actualRecovery = Math.max(0, Math.min(recovery, this.stats.maxMp - this.stats.currentMp));
    this.stats.currentMp += actualRecovery;
    
    return {
      recovery: actualRecovery,
      currentMp: this.stats.currentMp,
      isFullMp: this.stats.currentMp >= this.stats.maxMp
    };
  }

  /**
   * 添加状态效果
   * @param {Object} effect - 状态效果
   */
  addStatusEffect(effect) {
    this.statusEffects.set(effect.id, {
      ...effect,
      appliedAt: Date.now(),
      remainingTurns: effect.duration
    });
  }

  /**
   * 移除状态效果
   * @param {string} effectId - 效果ID
   * @returns {boolean} 是否成功移除
   */
  removeStatusEffect(effectId) {
    return this.statusEffects.delete(effectId);
  }

  /**
   * 获取有效的状态效果
   * @returns {Array} 状态效果列表
   */
  getActiveStatusEffects() {
    return Array.from(this.statusEffects.values())
      .filter(effect => effect.remainingTurns > 0 || effect.duration === -1);
  }

  /**
   * 处理回合开始时的状态效果
   */
  processTurnStartEffects() {
    const effects = [];
    
    for (const [effectId, effect] of this.statusEffects) {
      if (effect.remainingTurns > 0) {
        // 应用效果
        const result = this._applyStatusEffect(effect);
        effects.push(result);
        
        // 减少持续时间
        effect.remainingTurns--;
        
        // 移除已过期的效果
        if (effect.remainingTurns <= 0) {
          this.statusEffects.delete(effectId);
        }
      }
    }
    
    return effects;
  }

  /**
   * 获取修改后的属性值
   * @param {string} attributeName - 属性名
   * @returns {number} 修改后的属性值
   */
  getModifiedAttribute(attributeName) {
    let baseValue = this.stats[attributeName] || 0;
    let modifier = 0;
    
    // 计算状态效果的修改
    for (const effect of this.statusEffects.values()) {
      if (effect.attributeModifiers && effect.attributeModifiers[attributeName]) {
        const mod = effect.attributeModifiers[attributeName];
        if (mod.type === 'percentage') {
          modifier += baseValue * (mod.value / 100);
        } else {
          modifier += mod.value;
        }
      }
    }
    
    return Math.max(0, baseValue + modifier);
  }

  /**
   * 序列化为简单对象
   * @returns {Object} 序列化数据
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      isPlayerUnit: this.isPlayerUnit,
      isDefeated: this.isDefeated,
      stats: { ...this.stats }
    };
  }

  /**
   * 从序列化数据恢复
   * @param {Object} data - 序列化数据
   * @returns {BattleUnit} 恢复的单位实例
   */
  static fromJSON(data) {
    const unit = new BattleUnit(data, data.isPlayerUnit);
    
    // 恢复状态效果
    if (data.statusEffects) {
      unit.statusEffects = new Map(Object.entries(data.statusEffects));
    }
    
    return unit;
  }

  /**
   * 应用状态效果
   * @private
   */
  _applyStatusEffect(effect) {
    const result = {
      effectId: effect.id,
      unitId: this.id,
      type: effect.type,
      applied: false,
      value: 0
    };

    switch (effect.type) {
      case 'poison':
        const poisonDamage = effect.value || 10;
        result.value = this.takeDamage(poisonDamage).damage;
        result.applied = true;
        break;
        
      case 'regeneration':
        const healValue = effect.value || 10;
        result.value = this.heal(healValue).healing;
        result.applied = true;
        break;
        
      case 'stun':
        this.canAct = false;
        result.applied = true;
        break;
        
      default:
        // 其他效果类型的处理
        break;
    }
    
    return result;
  }
}

/**
 * 战斗状态容器类
 * 管理整个战斗的状态数据
 */
export class BattleState {
  constructor(config) {
    this.battleId = config.battleId;
    this.units = new Map();
    this.currentRound = 1;
    this.isActive = false;
  }

  /**
   * 添加战斗单位
   * @param {Object} unitData - 单位数据
   * @param {boolean} isPlayerUnit - 是否为玩家单位
   * @returns {BattleUnit} 创建的战斗单位
   */
  addUnit(unitData, isPlayerUnit = true) {
    const unit = new BattleUnit(unitData, isPlayerUnit);
    this.units.set(unit.id, unit);
    
    // 更新阵型
    if (unitData.gridPosition) {
      const formation = isPlayerUnit ? this.playerFormation : this.enemyFormation;
      const { row, col } = unitData.gridPosition;
      if (row >= 0 && row < 3 && col >= 0 && col < 3) {
        formation[row][col] = unit.id;
      }
    }
    
    return unit;
  }

  /**
   * 获取战斗单位
   * @param {string} unitId - 单位ID
   * @returns {BattleUnit|null} 战斗单位
   */
  getUnit(unitId) {
    return this.units.get(unitId) || null;
  }

  /**
   * 获取所有活跃单位
   * @returns {Array<BattleUnit>} 活跃单位列表
   */
  getActiveUnits() {
    return Array.from(this.units.values()).filter(unit => !unit.isDefeated);
  }

  /**
   * 获取玩家单位
   * @returns {Array<BattleUnit>} 玩家单位列表
   */
  getPlayerUnits() {
    return Array.from(this.units.values()).filter(unit => unit.isPlayerUnit);
  }

  /**
   * 获取敌方单位
   * @returns {Array<BattleUnit>} 敌方单位列表
   */
  getEnemyUnits() {
    return Array.from(this.units.values()).filter(unit => !unit.isPlayerUnit);
  }

  /**
   * 计算行动顺序
   */
  calculateTurnOrder() {
    const activeUnits = this.getActiveUnits();
    
    // 按照速度和随机因子排序
    this.turnOrder = activeUnits
      .map(unit => ({
        unitId: unit.id,
        priority: unit.getModifiedAttribute('speed') + Math.random() * 10
      }))
      .sort((a, b) => b.priority - a.priority)
      .map(item => item.unitId);
    
    this.currentTurnIndex = 0;
  }

  /**
   * 获取当前行动单位
   * @returns {BattleUnit|null} 当前行动单位
   */
  getCurrentTurnUnit() {
    if (this.turnOrder.length === 0 || this.currentTurnIndex >= this.turnOrder.length) {
      return null;
    }
    
    const unitId = this.turnOrder[this.currentTurnIndex];
    return this.getUnit(unitId);
  }

  /**
   * 推进到下一个行动单位
   * @returns {BattleUnit|null} 下一个行动单位
   */
  nextTurn() {
    this.currentTurnIndex++;
    
    // 如果所有单位都行动完毕，进入下一回合
    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.nextRound();
      return null;
    }
    
    return this.getCurrentTurnUnit();
  }

  /**
   * 进入下一回合
   */
  nextRound() {
    this.currentRound++;
    this.currentTurnIndex = 0;
    this.actionQueue = [];
    
    // 处理回合开始效果
    this.processRoundStartEffects();
    
    // 重新计算行动顺序
    this.calculateTurnOrder();
    
    this.addLogEntry({
      type: 'round_start',
      round: this.currentRound,
      message: `第 ${this.currentRound} 回合开始`
    });
  }

  /**
   * 处理回合开始效果
   */
  processRoundStartEffects() {
    const effects = [];
    
    for (const unit of this.units.values()) {
      if (!unit.isDefeated) {
        const unitEffects = unit.processTurnStartEffects();
        effects.push(...unitEffects);
      }
    }
    
    return effects;
  }

  /**
   * 添加日志条目
   * @param {Object} logEntry - 日志条目
   */
  addLogEntry(logEntry) {
    this.battleLog.push({
      id: generateUniqueId('log'),
      timestamp: Date.now(),
      round: this.currentRound,
      ...logEntry
    });
  }

  /**
   * 检查战斗结束条件
   * @returns {Object} 检查结果
   */
  checkBattleEndConditions() {
    const playerUnitsAlive = this.getPlayerUnits().some(unit => !unit.isDefeated);
    const enemyUnitsAlive = this.getEnemyUnits().some(unit => !unit.isDefeated);
    
    if (!playerUnitsAlive) {
      return { isEnded: true, result: 'defeat', reason: 'all_player_units_defeated' };
    }
    
    if (!enemyUnitsAlive) {
      return { isEnded: true, result: 'victory', reason: 'all_enemy_units_defeated' };
    }
    
    // 检查最大回合数
    if (this.currentRound > 50) { // 可配置
      return { isEnded: true, result: 'draw', reason: 'max_rounds_reached' };
    }
    
    return { isEnded: false };
  }

  /**
   * 序列化战斗状态
   * @returns {Object} 序列化数据
   */
  toJSON() {
    return {
      battleId: this.battleId,
      isActive: this.isActive,
      currentRound: this.currentRound,
      currentPhase: this.currentPhase,
      units: Object.fromEntries(
        Array.from(this.units.entries()).map(([id, unit]) => [id, unit.toJSON()])
      ),
      turnOrder: [...this.turnOrder],
      currentTurnIndex: this.currentTurnIndex,
      playerFormation: this.playerFormation.map(row => [...row]),
      enemyFormation: this.enemyFormation.map(row => [...row]),
      actionQueue: [...this.actionQueue],
      actionHistory: [...this.actionHistory],
      battleLog: [...this.battleLog],
      result: this.result,
      globalEffects: Object.fromEntries(this.globalEffects)
    };
  }

  /**
   * 从序列化数据恢复
   * @param {Object} data - 序列化数据
   * @returns {BattleState} 恢复的状态实例
   */
  static fromJSON(data) {
    const state = new BattleState({ battleId: data.battleId });
    
    // 恢复基本属性
    Object.assign(state, {
      isActive: data.isActive,
      currentRound: data.currentRound,
      currentPhase: data.currentPhase,
      turnOrder: [...(data.turnOrder || [])],
      currentTurnIndex: data.currentTurnIndex || 0,
      playerFormation: data.playerFormation?.map(row => [...row]) || state._createEmptyFormation(),
      enemyFormation: data.enemyFormation?.map(row => [...row]) || state._createEmptyFormation(),
      actionQueue: [...(data.actionQueue || [])],
      actionHistory: [...(data.actionHistory || [])],
      battleLog: [...(data.battleLog || [])],
      result: data.result
    });
    
    // 恢复单位
    if (data.units) {
      state.units = new Map();
      for (const [unitId, unitData] of Object.entries(data.units)) {
        const unit = BattleUnit.fromJSON(unitData);
        state.units.set(unitId, unit);
      }
    }
    
    // 恢复全局效果
    if (data.globalEffects) {
      state.globalEffects = new Map(Object.entries(data.globalEffects));
    }
    
    return state;
  }

  /**
   * 创建空阵型
   * @private
   */
  _createEmptyFormation() {
    return Array(3).fill(null).map(() => Array(3).fill(null));
  }

  /**
   * 从配置初始化
   * @private
   */
  _initializeFromConfig(config) {
    if (config.playerUnits) {
      Object.values(config.playerUnits).forEach(unitData => {
        this.addUnit(unitData, true);
      });
    }
    
    if (config.enemyUnits) {
      Object.values(config.enemyUnits).forEach(unitData => {
        this.addUnit(unitData, false);
      });
    }
    
    // 设置阵型
    if (config.playerFormation) {
      this.playerFormation = config.playerFormation;
    }
    
    if (config.enemyFormation) {
      this.enemyFormation = config.enemyFormation;
    }
    
    // 计算初始行动顺序
    this.calculateTurnOrder();
  }
}

export default BattleState; 