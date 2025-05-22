/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-22 19:27:30
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-22 19:40:40
 */
import { generateUniqueId } from '@/utils/idUtils';
import { UNIQUE_ID_PREFIXES } from '@/config/enumConfig';
// import { skillConfig } from '@/config/config'; // 稍后用于技能效果处理
// import { petConfig } from '@/config/petConfig'; // 用于获取召唤兽基础信息

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
 * @property {string[]} skillIds - Array of skill IDs this unit has access to
 * @property {StatusEffect[]} statusEffects - Array of active status effects
 * @property {BattleUnitPosition} gridPosition - Position in the 3x3 grid
 * @property {string} spriteAssetKey - Key to find the visual asset (e.g., petId for summons)
 * @property {boolean} isDefeated - True if currentHp <= 0
 * @property {number} actionPoints - (可选) 如果使用行动点系统而非纯速度排序
 */

/**
 * Creates a battle unit from player's summon data.
 * @param {Object} summonData - The summon object from summonSlice (should have id, petId, nickname, level, derivedAttributes, skillSet, etc.)
 * @param {BattleUnitPosition} position - Position in the player's battle formation.
 * @param {Object} petConfig - Global pet configuration object.
 * @returns {BattleUnit}
 */
export const createPlayerBattleUnit = (summonData, position, petConfig) => {
  if (!summonData || !summonData.id) {
    console.error("Invalid summonData provided to createPlayerBattleUnit", summonData);
    return null;
  }
  const basePetInfo = petConfig[summonData.petId] || {};

  return {
    id: generateUniqueId(UNIQUE_ID_PREFIXES.BATTLE_UNIT),
    sourceId: summonData.id, // Original summon ID
    isPlayerUnit: true,
    name: summonData.nickname || basePetInfo.name || '召唤兽',
    level: summonData.level,
    stats: {
      currentHp: summonData.derivedAttributes?.maxHp || 100, // Fallback if derivedAttributes is incomplete
      maxHp: summonData.derivedAttributes?.maxHp || 100,
      currentMp: summonData.derivedAttributes?.maxMp || 50,
      maxMp: summonData.derivedAttributes?.maxMp || 50,
      attack: summonData.derivedAttributes?.attack || 10,
      defense: summonData.derivedAttributes?.defense || 5,
      speed: summonData.derivedAttributes?.speed || 10,
      // Initialize other stats as needed, potentially from derivedAttributes or defaults
      magicAttack: summonData.derivedAttributes?.magicAttack || 0,
      magicDefense: summonData.derivedAttributes?.magicDefense || 0,
      hitRate: summonData.derivedAttributes?.hitRate || 1.0, // Assuming 1.0 is 100%
      dodgeRate: summonData.derivedAttributes?.dodgeRate || 0.05, // Assuming 0.05 is 5%
      critRate: summonData.derivedAttributes?.critRate || 0.05,
      critDamageMultiplier: summonData.derivedAttributes?.critDamageMultiplier || 1.5,
    },
    skillIds: [...(summonData.skillSet || [])], // Ensure it's an array
    statusEffects: [],
    gridPosition: position, 
    spriteAssetKey: summonData.petId, // Use petId for sprite lookup, or a more specific asset key if available
    isDefeated: false,
    actionPoints: 0, // Initialize if using AP system
  };
};

/**
 * Creates a battle unit from an enemy template.
 * @param {Object} enemyTemplate - The enemy template object from enemyConfig.js.
 * @param {BattleUnitPosition} position - Position in the enemy's battle formation.
 * @returns {BattleUnit}
 */
export const createEnemyBattleUnit = (enemyTemplate, position) => {
  if (!enemyTemplate || !enemyTemplate.id) {
    console.error("Invalid enemyTemplate provided to createEnemyBattleUnit", enemyTemplate);
    return null;
  }
  return {
    id: generateUniqueId(UNIQUE_ID_PREFIXES.BATTLE_UNIT),
    sourceId: enemyTemplate.id, // Original enemy template ID
    isPlayerUnit: false,
    name: enemyTemplate.name || '敌人',
    level: enemyTemplate.level || 1,
    stats: {
      currentHp: enemyTemplate.stats?.maxHp || 50,
      maxHp: enemyTemplate.stats?.maxHp || 50,
      currentMp: enemyTemplate.stats?.maxMp || 20,
      maxMp: enemyTemplate.stats?.maxMp || 20,
      attack: enemyTemplate.stats?.attack || 8,
      defense: enemyTemplate.stats?.defense || 3,
      speed: enemyTemplate.stats?.speed || 8,
      magicAttack: enemyTemplate.stats?.magicAttack || 0,
      magicDefense: enemyTemplate.stats?.magicDefense || 0,
      hitRate: enemyTemplate.stats?.hitRate || 1.0,
      dodgeRate: enemyTemplate.stats?.dodgeRate || 0.05,
      critRate: enemyTemplate.stats?.critRate || 0.05,
      critDamageMultiplier: enemyTemplate.stats?.critDamageMultiplier || 1.5,
    },
    skillIds: [...(enemyTemplate.skills || [])], // Skills the enemy can use
    statusEffects: [],
    gridPosition: position,
    spriteAssetKey: enemyTemplate.spriteAssetKey || enemyTemplate.id, // Key for visual asset
    isDefeated: false,
    actionPoints: 0,
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
 * @param {Object} playerSummonsData - Object keyed by summonId, values are summon objects from summonSlice.
 * @param {string[][]} playerInitialFormationGrid - 3x3 grid with player summonIds or null.
 * @param {Object[]} enemyTemplates - Array of enemy template objects from enemyConfig.
 * @param {string[][]} enemyInitialFormationGrid - 3x3 grid with enemy templateIds or null.
 * @param {Object} globalPetConfig - The petConfig object.
 * @param {Object} globalEnemyConfig - The enemyConfig object (used to fetch templates by ID).
 * @returns {Object} Payload for the setupBattle action in battleSlice.
 */
export const prepareBattleSetupData = (
    battleId, 
    playerSummonsData, 
    playerInitialFormationGrid, 
    enemyTemplatesOnGrid, // Array of { template, position } for enemies on grid
    globalPetConfig,
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
        const battleUnit = createPlayerBattleUnit(summon, position, globalPetConfig);
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

// TODO:
// - Skill effect resolution logic
// - Damage calculation formulas
// - Status effect application/removal
// - AI logic for enemy turns
// - Victory/Defeat condition checking
 