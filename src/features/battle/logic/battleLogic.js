/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-22 19:27:30
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-08 06:00:09
 */
import { generateUniqueId } from '@/utils/idUtils';
import { BATTLE_UNIT_TYPES, BATTLE_PHASES, UNIQUE_ID_PREFIXES, EQUIPMENT_EFFECT_TYPES } from '@/config/enumConfig';
import { DAMAGE_CONSTANTS, COMBAT_CONSTANTS } from '@/config/system/combatConfig';
// import { skillConfig } from '@/config/config'; // 稍后用于技能效果处理
import { summonConfig } from '@/config/summon/summonConfig'; // 用于获取召唤兽基础信息

/**
 * @typedef {Object} BattleUnitStat
 * @property {number} currentHp
 * @property {number} maxHp
 * @property {number} currentMp
 * @property {number} maxMp
 * @property {number} attack
 * @property {number} defense
 * @property {number} speed
 * @property {number} magicAttack // (如果需要)
 * @property {number} magicDefense // (如果需要)
 * @property {number} hitRate
 * @property {number} dodgeRate
 * @property {number} critRate
 * @property {number} critDamageMultiplier
 */

/**
 * @typedef {Object} BattleUnitPosition
 * @property {'player' | 'enemy'} team
 * @property {number} row - 0 to 2
 * @property {number} col - 0 to 2
 */

/**
 * @typedef {Object} StatusEffect
 * @property {string} effectId - e.g., 'poison', 'stun', 'buff_attack'
 * @property {string} name - Display name
 * @property {number} duration - Turns remaining, or -1 for permanent until cleansed
 * @property {Object} effectData - Specific data for the effect (e.g., damage per turn for poison)
 * @property {string} sourceUnitId - Unit that applied the effect
 */

/**
 * @typedef {Object} BattleUnit
 * @property {string} id - Unique ID for this battle instance (e.g., 'battleunit_xxxx')
 * @property {string} sourceId - Original summon ID (for players) or enemy template ID (for enemies)
 * @property {boolean} isPlayerUnit - True if it's a player's summon, false for enemy
 * @property {string} name
 * @property {number} level
 * @property {BattleUnitStat} stats - Current and max stats for battle
 * @property {string[]} skillSet - Array of skill IDs this unit has access to
 * @property {StatusEffect[]} statusEffects - Array of active status effects
 * @property {BattleUnitPosition} gridPosition - Position in the 3x3 grid
 * @property {string} spriteAssetKey - Key to find the visual asset (e.g., summonSourceId for summons)
 * @property {boolean} isDefeated - True if currentHp <= 0
 * @property {number} actionPoints - (可选) 如果使用行动点系统而非纯速度排序
 */

/**
 * Creates a battle unit from player's summon data.
 * @param {Object} summonData - The summon object from OOP SummonManager.
 * @param {BattleUnitPosition} position - Position in the player's battle formation.
 * @returns {Object} A plain JavaScript object representing the battle unit.
 */
export const createPlayerBattleUnit = (summonData, position) => {
  if (!summonData || !summonData.id) {
    console.error("Invalid summonData provided to createPlayerBattleUnit", summonData);
    return null;
  }
  const baseSummonInfo = summonConfig[summonData.summonSourceId] || {};
  const { HP, MP, PHYSICAL_ATTACK, MAGICAL_ATTACK, PHYSICAL_DEFENSE, MAGICAL_DEFENSE, SPEED, CRIT_RATE, CRIT_DAMAGE, DODGE_RATE } = EQUIPMENT_EFFECT_TYPES;

  return {
    id: generateUniqueId(UNIQUE_ID_PREFIXES.BATTLE_UNIT),
    sourceId: summonData.id,
    isPlayerUnit: true,
    name: summonData.nickname || baseSummonInfo.name || '召唤兽',
    level: summonData.level,
    stats: {
      currentHp: summonData.derivedAttributes?.[HP] || 100,
      maxHp: summonData.derivedAttributes?.[HP] || 100,
      currentMp: summonData.derivedAttributes?.[MP] || 50,
      maxMp: summonData.derivedAttributes?.[MP] || 50,
      [PHYSICAL_ATTACK]: summonData.derivedAttributes?.[PHYSICAL_ATTACK] || 10,
      [MAGICAL_ATTACK]: summonData.derivedAttributes?.[MAGICAL_ATTACK] || 10,
      [PHYSICAL_DEFENSE]: summonData.derivedAttributes?.[PHYSICAL_DEFENSE] || 5,
      [MAGICAL_DEFENSE]: summonData.derivedAttributes?.[MAGICAL_DEFENSE] || 5,
      [SPEED]: summonData.derivedAttributes?.[SPEED] || 10,
      [CRIT_RATE]: summonData.derivedAttributes?.[CRIT_RATE] || 0.05,
      [CRIT_DAMAGE]: summonData.derivedAttributes?.[CRIT_DAMAGE] || 1.5,
      [DODGE_RATE]: summonData.derivedAttributes?.[DODGE_RATE] || 0.05,
      hitRate: 1.0,
      fixedDamageReduction: summonData.derivedAttributes?.fixedDamageReduction || 0,
      percentDamageReduction: summonData.derivedAttributes?.percentDamageReduction || 0,
    },
    skillSet: [...(summonData.skillSet || [])],
    statusEffects: [],
    gridPosition: position,
    spriteAssetKey: summonData.summonSourceId,
    isDefeated: false,
  };
};

/**
 * Creates a battle unit from an enemy template.
 * @param {Object} enemyTemplate - The enemy template object from enemyConfig.js.
 * @param {BattleUnitPosition} position - Position in the enemy's battle formation.
 * @returns {Object} A plain JavaScript object representing the battle unit.
 */
export const createEnemyBattleUnit = (enemyTemplate, position) => {
  if (!enemyTemplate || !enemyTemplate.id) {
    console.error("Invalid enemyTemplate provided to createEnemyBattleUnit", enemyTemplate);
    return null;
  }
  const { HP, MP, PHYSICAL_ATTACK, MAGICAL_ATTACK, PHYSICAL_DEFENSE, MAGICAL_DEFENSE, SPEED, CRIT_RATE, CRIT_DAMAGE, DODGE_RATE } = EQUIPMENT_EFFECT_TYPES;

  return {
    id: generateUniqueId(UNIQUE_ID_PREFIXES.BATTLE_UNIT),
    sourceId: enemyTemplate.id,
    isPlayerUnit: false,
    name: enemyTemplate.name || '敌人',
    level: enemyTemplate.level || 1,
    stats: {
        currentHp: enemyTemplate.stats?.[HP] || 50,
        maxHp: enemyTemplate.stats?.[HP] || 50,
        currentMp: enemyTemplate.stats?.[MP] || 20,
        maxMp: enemyTemplate.stats?.[MP] || 20,
        [PHYSICAL_ATTACK]: enemyTemplate.stats?.[PHYSICAL_ATTACK] || 8,
        [MAGICAL_ATTACK]: enemyTemplate.stats?.[MAGICAL_ATTACK] || 8,
        [PHYSICAL_DEFENSE]: enemyTemplate.stats?.[PHYSICAL_DEFENSE] || 3,
        [MAGICAL_DEFENSE]: enemyTemplate.stats?.[MAGICAL_DEFENSE] || 3,
        [SPEED]: enemyTemplate.stats?.[SPEED] || 8,
        [CRIT_RATE]: enemyTemplate.stats?.[CRIT_RATE] || 0.05,
        [CRIT_DAMAGE]: enemyTemplate.stats?.[CRIT_DAMAGE] || 1.5,
        [DODGE_RATE]: enemyTemplate.stats?.[DODGE_RATE] || 0.05,
        hitRate: 1.0,
        fixedDamageReduction: enemyTemplate.stats?.fixedDamageReduction || 0,
        percentDamageReduction: enemyTemplate.stats?.percentDamageReduction || 0,
    },
    skillSet: [...(enemyTemplate.skillSet || [])],
    statusEffects: [],
    gridPosition: position,
    spriteAssetKey: enemyTemplate.spriteAssetKey || enemyTemplate.id,
    isDefeated: false,
  };
};

/**
 * Determines the initial turn order for the battle.
 * Typically based on speed, but can include randomness or initiative rolls.
 * @param {BattleUnit[]} allUnits - Array of all BattleUnit objects participating.
 * @returns {string[]} - Array of battleUnit IDs in turn order.
 */
export const determineInitialTurnOrder = (allUnits) => {
  if (!allUnits || allUnits.length === 0) return [];
  // Simple sort by speed (descending). Add tie-breaking if needed.
  return [...allUnits]
    .sort((a, b) => b.stats.speed - a.stats.speed)
    .map(unit => unit.id);
};

/**
 * Prepares all data needed for the setupBattle action payload.
 * @param {string} battleId - A unique ID for this battle session.
 * @param {Object} playerSummonsData - Object keyed by summonId, values are summon objects from OOP SummonManager.
 * @param {string[][]} playerInitialFormationGrid - 3x3 grid with player summonIds or null.
 * @param {Object[]} enemyTemplates - Array of enemy template objects from enemyConfig.js.
 * @param {string[][]} enemyInitialFormationGrid - 3x3 grid with enemy templateIds or null.
 * @param {Object} globalSummonConfig - The summonConfig object.
 * @param {Object} globalEnemyConfig - The enemyConfig object (used to fetch templates by ID).
 * @returns {Object} Payload for the setupBattle action in battleSlice.
 */
export const prepareBattleSetupData = (
    battleId, 
    playerSummonsData, 
    playerInitialFormationGrid, 
    enemyTemplatesOnGrid, // Array of { template, position } for enemies on grid
    globalSummonConfig,
    // globalEnemyConfig // No longer needed if enemyTemplatesOnGrid contains full templates
  ) => {
  const battleUnitsMap = {};
  const playerBattleFormation = JSON.parse(JSON.stringify(playerInitialFormationGrid)); // Deep copy
  const enemyBattleFormation = Array(3).fill(null).map(() => Array(3).fill(null)); // Initialize empty

  // Create player battle units and populate player formation with battleUnit IDs
  playerInitialFormationGrid.forEach((row, rIndex) => {
    row.forEach((summonId, cIndex) => {
      if (summonId && playerSummonsData[summonId]) {
        const summon = playerSummonsData[summonId];
        const position = { team: 'player', row: rIndex, col: cIndex };
        const battleUnit = createPlayerBattleUnit(summon, position);
        if (battleUnit) {
          battleUnitsMap[battleUnit.id] = battleUnit;
          playerBattleFormation[rIndex][cIndex] = battleUnit.id; // Store battleUnit.id in formation
        }
      } else {
        playerBattleFormation[rIndex][cIndex] = null; // Ensure empty slots are null
      }
    });
  });

  // Create enemy battle units and populate enemy formation with battleUnit IDs
  enemyTemplatesOnGrid.forEach(({ template, position }) => {
    if (template) {
        const battleUnit = createEnemyBattleUnit(template, position);
        if (battleUnit) {
            battleUnitsMap[battleUnit.id] = battleUnit;
            // position already contains { team: 'enemy', row, col }
            if (position.row >= 0 && position.row < 3 && position.col >= 0 && position.col < 3) {
                 enemyBattleFormation[position.row][position.col] = battleUnit.id;
            } else {
                console.warn("Enemy position out of bounds:", position);
            }
        }
    }
  });

  const allUnitsArray = Object.values(battleUnitsMap);
  const turnOrder = determineInitialTurnOrder(allUnitsArray);

  return {
    battleId,
    battleUnits: battleUnitsMap,
    playerFormation: playerBattleFormation,
    enemyFormation: enemyBattleFormation,
    turnOrder,
  };
};

/**
 * 导入从独立文件中提取的函数，以保持API兼容性
 */
// canUnitAttackTarget 函数已移至 skillSystem.js

// getValidTargetsForUnit 函数已移至 skillSystem.js

// 导入从独立文件中提取的函数，以保持API兼容性
import {
  calculatePhysicalDamage,
  calculateMagicalDamage,
  calculateBattleDamage,
  applyDamageToTarget,
  calculateHealing,
  applyHealingToTarget,
  simulateBattleDamage
} from './damageCalculation';

import {
  getValidTargetsForUnit,
  getValidTargetsForSkill,
  getSkillAffectedArea,
  canUnitAttackTarget,
  getUnitAttackRangeProperties,
  calculateBattleDistance,
  getUnitAbsoluteColumn,
  hasValidTargets,
  executeSkillEffect,
  processBuffEffects
} from './skillSystem';

// 重新导出这些函数，以保持API兼容性
export {
  calculatePhysicalDamage,
  calculateMagicalDamage,
  calculateBattleDamage,
  applyDamageToTarget,
  calculateHealing,
  applyHealingToTarget,
  simulateBattleDamage,
  getValidTargetsForUnit,
  getValidTargetsForSkill,
  getSkillAffectedArea,
  canUnitAttackTarget,
  getUnitAttackRangeProperties,
  calculateBattleDistance,
  getUnitAbsoluteColumn,
  hasValidTargets,
  executeSkillEffect,
  processBuffEffects
};

/**
 * 获取战斗单位的属性详情，用于调试和显示
 * @param {Object} unit - 战斗单位
 * @returns {Object} - 格式化后的属性详情
 */
export const getUnitStatsDetails = (unit) => {
  if (!unit || !unit.stats) {
    return { error: '无效的战斗单位' };
  }
  
  const { stats } = unit;
  
  // 使用 enumConfig.js 中定义的核心属性名
  const { PHYSICAL_ATTACK, MAGICAL_ATTACK, PHYSICAL_DEFENSE, MAGICAL_DEFENSE, SPEED, CRIT_RATE, CRIT_DAMAGE, DODGE_RATE } = EQUIPMENT_EFFECT_TYPES;
  
  // 优先使用标准属性名，如果不存在则使用兼容名称
  const getStatValue = (standardName, compatibleName) => {
    return stats[standardName] !== undefined ? stats[standardName] : stats[compatibleName];
  };
  
  // 获取物理和法术攻击值
  const pAttack = getStatValue(PHYSICAL_ATTACK, 'physicalAttack');
  const mAttack = getStatValue(MAGICAL_ATTACK, 'magicalAttack');
  
  return {
    name: unit.name,
    level: unit.level,
    isPlayerUnit: unit.isPlayerUnit,
    // 生命和法力
    hp: `${stats.currentHp}/${stats.maxHp}`,
    mp: `${stats.currentMp}/${stats.maxMp}`,
    // 攻击属性
    physicalAttack: pAttack,
    magicalAttack: mAttack,
    // 防御属性
    physicalDefense: getStatValue(PHYSICAL_DEFENSE, 'physicalDefense'),
    magicalDefense: getStatValue(MAGICAL_DEFENSE, 'magicalDefense'),
    // 战斗相关属性
    speed: getStatValue(SPEED, 'speed'),
    hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
    dodgeRate: `${(getStatValue(DODGE_RATE, 'dodgeRate') * 100).toFixed(1)}%`,
    critRate: `${(getStatValue(CRIT_RATE, 'critRate') * 100).toFixed(1)}%`,
    critDamage: `${(getStatValue(CRIT_DAMAGE, 'critDamage') * 100).toFixed(1)}%`,
    // 减伤属性
    fixedDamageReduction: stats.fixedDamageReduction,
    percentDamageReduction: `${(stats.percentDamageReduction * 100).toFixed(1)}%`,
    // 技能和状态
    skillSet: unit.skillSet,
    statusEffects: unit.statusEffects && Array.isArray(unit.statusEffects) ? unit.statusEffects.map(effect => effect.type) : [],
    // 位置信息
    position: unit.gridPosition ? `${unit.gridPosition.row},${unit.gridPosition.col || unit.gridPosition.column}` : 'unknown',
    // 判断使用物理还是法术攻击
    preferredAttackType: pAttack >= mAttack ? 'physical' : 'magical'
  };
};

// TODO:
// - AI logic for enemy turns
// - Battle flow control
// - Turn management
// - Victory/Defeat condition checking