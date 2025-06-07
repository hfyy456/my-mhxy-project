/*
 * @Author: Gemini
 * @Date: 2025-06-10
 * @Description: 战斗单位类，封装战斗中单位的状态和行为
 */

import { generateUniqueId } from '@/utils/idUtils';
import { UNIQUE_ID_PREFIXES, EQUIPMENT_EFFECT_TYPES } from '@/config/enumConfig';
import { applyDamageToTarget, applyHealingToTarget } from '../logic/damageCalculation';
import { applyBuff, removeBuff } from '../logic/buffManager';

/**
 * @class BattleUnit
 * @description Represents a single unit in a battle.
 */
export class BattleUnit {
  id; // Unique ID for this battle instance
  sourceId; // Original summon ID or enemy template ID
  isPlayerUnit;
  name;
  level;
  stats; // BattleUnitStat
  skillSet; // string[]
  statusEffects; // StatusEffect[]
  gridPosition; // BattleUnitPosition
  spriteAssetKey;
  isDefeated;
  
  /**
   * @param {Object} unitData - Data from summon or enemy template.
   * @param {boolean} isPlayerUnit - Whether this unit is on the player's team.
   * @param {BattleUnitPosition} position - The unit's position on the grid.
   * @param {Object} baseConfig - The base configuration for the summon or enemy.
   */
  constructor(unitData, isPlayerUnit, position, baseConfig = {}) {
    this.id = generateUniqueId(UNIQUE_ID_PREFIXES.BATTLE_UNIT);
    this.sourceId = unitData.id;
    this.isPlayerUnit = isPlayerUnit;
    this.name = unitData.nickname || baseConfig.name || (isPlayerUnit ? '召唤兽' : '敌人');
    this.level = unitData.level || 1;
    this.isDefeated = false;
    this.gridPosition = position;
    this.spriteAssetKey = unitData.summonSourceId || unitData.id;
    this.skillSet = [...(unitData.skillSet || [])];
    this.statusEffects = []; // Initialized as empty

    this._initializeStats(unitData, isPlayerUnit);
  }

  /**
   * Initializes the stats for the battle unit based on its source data.
   * @private
   * @param {Object} unitData 
   * @param {boolean} isPlayerUnit
   */
  _initializeStats(unitData, isPlayerUnit) {
    const { HP, MP, PHYSICAL_ATTACK, MAGICAL_ATTACK, PHYSICAL_DEFENSE, MAGICAL_DEFENSE, SPEED, CRIT_RATE, CRIT_DAMAGE, DODGE_RATE } = EQUIPMENT_EFFECT_TYPES;

    const attributes = isPlayerUnit ? unitData.derivedAttributes : (unitData.stats || {});
    const defaults = isPlayerUnit 
      ? { [HP]: 100, [MP]: 50, [PHYSICAL_ATTACK]: 10, [MAGICAL_ATTACK]: 10, [PHYSICAL_DEFENSE]: 5, [MAGICAL_DEFENSE]: 5, [SPEED]: 10, [CRIT_RATE]: 0.05, [CRIT_DAMAGE]: 1.5, [DODGE_RATE]: 0.05 }
      : { [HP]: 50, [MP]: 20, [PHYSICAL_ATTACK]: 8, [MAGICAL_ATTACK]: 8, [PHYSICAL_DEFENSE]: 3, [MAGICAL_DEFENSE]: 3, [SPEED]: 8, [CRIT_RATE]: 0.05, [CRIT_DAMAGE]: 1.5, [DODGE_RATE]: 0.05 };

    this.stats = {
      currentHp: attributes[HP] || defaults[HP],
      maxHp: attributes[HP] || defaults[HP],
      currentMp: attributes[MP] || defaults[MP],
      maxMp: attributes[MP] || defaults[MP],
      
      [PHYSICAL_ATTACK]: attributes[PHYSICAL_ATTACK] || defaults[PHYSICAL_ATTACK],
      [MAGICAL_ATTACK]: attributes[MAGICAL_ATTACK] || defaults[MAGICAL_ATTACK],
      [PHYSICAL_DEFENSE]: attributes[PHYSICAL_DEFENSE] || defaults[PHYSICAL_DEFENSE],
      [MAGICAL_DEFENSE]: attributes[MAGICAL_DEFENSE] || defaults[MAGICAL_DEFENSE],
      [SPEED]: attributes[SPEED] || defaults[SPEED],
      [CRIT_RATE]: attributes[CRIT_RATE] || defaults[CRIT_RATE],
      [CRIT_DAMAGE]: attributes[CRIT_DAMAGE] || defaults[CRIT_DAMAGE],
      [DODGE_RATE]: attributes[DODGE_RATE] || defaults[DODGE_RATE],
      
      hitRate: 1.0,
      fixedDamageReduction: attributes.fixedDamageReduction || 0,
      percentDamageReduction: attributes.percentDamageReduction || 0,
    };
  }

  /**
   * Applies damage to the unit.
   * This method mutates the unit's state.
   * It uses a pure function `applyDamageToTarget` for the logic.
   * @param {number} damage 
   * @param {BattleUnit} source 
   * @returns {Object} The result of the damage application.
   */
  takeDamage(damage, source = null) {
    const result = applyDamageToTarget(this, damage, source);
    if (result.finalDamage > 0) {
        this.stats.currentHp = Math.max(0, this.stats.currentHp - result.finalDamage);
    }
    if (this.stats.currentHp === 0) {
        this.isDefeated = true;
    }
    return result;
  }

  /**
   * Applies healing to the unit.
   * This method mutates the unit's state.
   * @param {number} healing 
   * @returns {Object} The result of the healing application.
   */
  applyHealing(healing) {
    const result = applyHealingToTarget(this, healing);
    this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + result.actualHeal);
    return result;
  }

  /**
   * Applies a buff to the unit.
   * This method mutates the unit's state.
   * @param {string} buffId 
   * @param {string} sourceUnitId 
   * @returns {Object} The result of applying the buff.
   */
  applyBuff(buffId, sourceUnitId) {
    return applyBuff(this, buffId, sourceUnitId);
  }

  /**
   * Removes a buff from the unit.
   * This method mutates the unit's state.
   * @param {string} buffId 
   * @returns {Object} The result of removing the buff.
   */
  removeBuff(buffId) {
    return removeBuff(this, buffId);
  }

  /**
   * Checks if the unit can currently perform actions.
   * @returns {boolean}
   */
  canAct() {
    // Example: check for stun effects
    return !this.statusEffects.some(effect => effect.id === 'stun' && effect.isActive);
  }
} 