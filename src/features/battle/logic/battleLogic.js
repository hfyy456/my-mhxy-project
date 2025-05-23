/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-22 19:27:30
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-24 05:17:32
 */
import { generateUniqueId } from '@/utils/idUtils';
import { BATTLE_UNIT_TYPES, BATTLE_PHASES, UNIQUE_ID_PREFIXES, EQUIPMENT_EFFECT_TYPES } from '@/config/enumConfig';
import { DAMAGE_CONSTANTS, COMBAT_CONSTANTS } from '@/config/combatConfig';
// import { skillConfig } from '@/config/config'; // 稍后用于技能效果处理
import { petConfig } from '@/config/petConfig'; // 用于获取召唤兽基础信息

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

  // 使用 enumConfig.js 中定义的核心属性名
  const { HP, MP, PHYSICAL_ATTACK, MAGICAL_ATTACK, PHYSICAL_DEFENSE, MAGICAL_DEFENSE, SPEED, CRIT_RATE, CRIT_DAMAGE, DODGE_RATE } = EQUIPMENT_EFFECT_TYPES;
  
  return {
    id: generateUniqueId(UNIQUE_ID_PREFIXES.BATTLE_UNIT),
    sourceId: summonData.id, // Original summon ID
    isPlayerUnit: true,
    name: summonData.nickname || basePetInfo.name || '召唤兽',
    level: summonData.level,
    stats: {
      // 生命和法力
      currentHp: summonData.derivedAttributes?.[HP] || 100,
      maxHp: summonData.derivedAttributes?.[HP] || 100,
      currentMp: summonData.derivedAttributes?.[MP] || 50,
      maxMp: summonData.derivedAttributes?.[MP] || 50,
      
      // 使用标准属性名称
      [PHYSICAL_ATTACK]: summonData.derivedAttributes?.[PHYSICAL_ATTACK] || 10,
      [MAGICAL_ATTACK]: summonData.derivedAttributes?.[MAGICAL_ATTACK] || 10,
      [PHYSICAL_DEFENSE]: summonData.derivedAttributes?.[PHYSICAL_DEFENSE] || 5,
      [MAGICAL_DEFENSE]: summonData.derivedAttributes?.[MAGICAL_DEFENSE] || 5,
      [SPEED]: summonData.derivedAttributes?.[SPEED] || 10,
      [CRIT_RATE]: summonData.derivedAttributes?.[CRIT_RATE] || 0.05,
      [CRIT_DAMAGE]: summonData.derivedAttributes?.[CRIT_DAMAGE] || 1.5,
      [DODGE_RATE]: summonData.derivedAttributes?.[DODGE_RATE] || 0.05,
      
      // 兼容旧属性名称（为了兼容现有代码）
      physicalAttack: summonData.derivedAttributes?.[PHYSICAL_ATTACK] || 10,
      magicalAttack: summonData.derivedAttributes?.[MAGICAL_ATTACK] || 10,
      physicalDefense: summonData.derivedAttributes?.[PHYSICAL_DEFENSE] || 5,
      magicalDefense: summonData.derivedAttributes?.[MAGICAL_DEFENSE] || 5,
      speed: summonData.derivedAttributes?.[SPEED] || 10,
      critRate: summonData.derivedAttributes?.[CRIT_RATE] || 0.05,
      critDamage: summonData.derivedAttributes?.[CRIT_DAMAGE] || 1.5,
      dodgeRate: summonData.derivedAttributes?.[DODGE_RATE] || 0.05,
      
      // 更旧的属性名称（为了兼容非常旧的代码）
      attack: summonData.derivedAttributes?.[PHYSICAL_ATTACK] || 10,
      defense: summonData.derivedAttributes?.[PHYSICAL_DEFENSE] || 5,
      
      // 其他属性
      hitRate: 1.0, // 命中率，默认100%
      
      // 伤害减免属性
      fixedDamageReduction: summonData.derivedAttributes?.fixedDamageReduction || 0,
      percentDamageReduction: summonData.derivedAttributes?.percentDamageReduction || 0,
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
  
  // 使用 enumConfig.js 中定义的核心属性名
  const { HP, MP, PHYSICAL_ATTACK, MAGICAL_ATTACK, PHYSICAL_DEFENSE, MAGICAL_DEFENSE, SPEED, CRIT_RATE, CRIT_DAMAGE, DODGE_RATE } = EQUIPMENT_EFFECT_TYPES;
  
  return {
    id: generateUniqueId(UNIQUE_ID_PREFIXES.BATTLE_UNIT),
    sourceId: enemyTemplate.id, // Original enemy template ID
    isPlayerUnit: false,
    name: enemyTemplate.name || '敌人',
    level: enemyTemplate.level || 1,
    stats: {
      // 生命和法力
      currentHp: enemyTemplate.stats?.[HP] || 50,
      maxHp: enemyTemplate.stats?.[HP] || 50,
      currentMp: enemyTemplate.stats?.[MP] || 20,
      maxMp: enemyTemplate.stats?.[MP] || 20,
      
      // 使用标准属性名称
      [PHYSICAL_ATTACK]: enemyTemplate.stats?.[PHYSICAL_ATTACK] || 8,
      [MAGICAL_ATTACK]: enemyTemplate.stats?.[MAGICAL_ATTACK] || 8,
      [PHYSICAL_DEFENSE]: enemyTemplate.stats?.[PHYSICAL_DEFENSE] || 3,
      [MAGICAL_DEFENSE]: enemyTemplate.stats?.[MAGICAL_DEFENSE] || 3,
      [SPEED]: enemyTemplate.stats?.[SPEED] || 8,
      [CRIT_RATE]: enemyTemplate.stats?.[CRIT_RATE] || 0.05,
      [CRIT_DAMAGE]: enemyTemplate.stats?.[CRIT_DAMAGE] || 1.5,
      [DODGE_RATE]: enemyTemplate.stats?.[DODGE_RATE] || 0.05,
      
      // 兼容旧属性名称（为了兼容现有代码）
      physicalAttack: enemyTemplate.stats?.[PHYSICAL_ATTACK] || 8,
      magicalAttack: enemyTemplate.stats?.[MAGICAL_ATTACK] || 8,
      physicalDefense: enemyTemplate.stats?.[PHYSICAL_DEFENSE] || 3,
      magicalDefense: enemyTemplate.stats?.[MAGICAL_DEFENSE] || 3,
      speed: enemyTemplate.stats?.[SPEED] || 8,
      critRate: enemyTemplate.stats?.[CRIT_RATE] || 0.05,
      critDamage: enemyTemplate.stats?.[CRIT_DAMAGE] || 1.5,
      dodgeRate: enemyTemplate.stats?.[DODGE_RATE] || 0.05,
      
      // 更旧的属性名称（为了兼容非常旧的代码）
      attack: enemyTemplate.stats?.[PHYSICAL_ATTACK] || 8,
      defense: enemyTemplate.stats?.[PHYSICAL_DEFENSE] || 3,
      
      // 其他属性
      hitRate: 1.0, // 命中率，默认100%
      
      // 伤害减免属性
      fixedDamageReduction: enemyTemplate.stats?.fixedDamageReduction || 0,
      percentDamageReduction: enemyTemplate.stats?.percentDamageReduction || 0,
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

/**
 * 计算两个战斗单位之间的距离
 * @param {BattleUnitPosition} sourcePosition - 源单位的位置
 * @param {BattleUnitPosition} targetPosition - 目标单位的位置
 * @param {string} distanceType - 距离计算类型: 'manhattan'(曼哈顿距离), 'euclidean'(欧几里得距离), 'column'(仅列距离)
 * @returns {number} - 两个单位之间的距离（格子数）
 */
export const calculateBattleDistance = (sourcePosition, targetPosition, distanceType = 'column') => {
  // 在3x3 vs 3x3的战场上
  // 玩家阵营在左侧，敌方阵营在右侧
  
  // 确定源单位和目标单位的实际列位置（考虑阵营）
  // 玩家阵营：列0,1,2分别对应位置1,2,3
  // 敌方阵营：列0,1,2分别对应位置4,5,6
  const sourceAbsoluteCol = sourcePosition.team === 'player' ? sourcePosition.col + 1 : sourcePosition.col + 4;
  const targetAbsoluteCol = targetPosition.team === 'player' ? targetPosition.col + 1 : targetPosition.col + 4;
  
  // 根据不同的距离计算类型返回距离值
  switch (distanceType) {
    case 'manhattan': // 曼哈顿距离（行距离+列距离）
      return Math.abs(targetAbsoluteCol - sourceAbsoluteCol) + Math.abs(targetPosition.row - sourcePosition.row);
    
    case 'euclidean': // 欧几里得距离（直线距离）
      return Math.sqrt(
        Math.pow(targetAbsoluteCol - sourceAbsoluteCol, 2) + 
        Math.pow(targetPosition.row - sourcePosition.row, 2)
      );
    
    case 'column': // 默认，仅计算列距离
    default:
      return Math.abs(targetAbsoluteCol - sourceAbsoluteCol);
  }
};

/**
 * 获取单位的实际列位置
 * @param {BattleUnitPosition} position - 单位的位置
 * @returns {number} - 单位的实际列位置（1-6）
 */
export const getUnitAbsoluteColumn = (position) => {
  if (!position || typeof position.team !== 'string' || typeof position.col !== 'number') {
    return 0;
  }
  return position.team === 'player' ? position.col + 1 : position.col + 4;
};

/**
 * 获取单位的攻击距离属性
 * @param {BattleUnit} unit - 单位
 * @param {Object} globalPetConfig - 全局宠物配置对象
 * @param {string} attackType - 攻击类型，默认为'normal'，可以是'skill'等
 * @returns {Object} - 攻击距离属性对象 { min: 最小距离, max: 最大距离, type: 距离计算类型 }
 */
export const getUnitAttackRangeProperties = (unit, globalPetConfig, attackType = 'normal') => {
  // 默认攻击距离属性
  const defaultRange = {
    min: 1, // 最小攻击距离
    max: 2, // 最大攻击距离
    type: 'column' // 距离计算类型
  };
  
  if (!unit) return defaultRange;
  
  // 检查单位是否有自定义的攻击距离属性
  if (unit.attackRangeProperties && unit.attackRangeProperties[attackType]) {
    return { ...defaultRange, ...unit.attackRangeProperties[attackType] };
  }
  
  // 检查单位的状态效果是否修改了攻击距离
  let rangeModifier = 0;
  let minRangeModifier = 0;
  
  if (unit.statusEffects && unit.statusEffects.length > 0) {
    unit.statusEffects.forEach(effect => {
      // 检查状态效果是否影响攻击距离
      if (effect.effectData && effect.effectData.attackRangeModifier) {
        rangeModifier += effect.effectData.attackRangeModifier;
      }
      if (effect.effectData && effect.effectData.minAttackRangeModifier) {
        minRangeModifier += effect.effectData.minAttackRangeModifier;
      }
    });
  }
  
  // 根据单位类型获取基础攻击距离
  let baseRange = defaultRange.max;
  let baseMinRange = defaultRange.min;
  let distanceType = defaultRange.type;
  
  if (unit.isPlayerUnit) {
    // 如果是玩家单位，从petConfig中获取攻击距离
    const petId = unit.spriteAssetKey; // 使用spriteAssetKey作为petId
    const petInfo = globalPetConfig[petId];
    
    if (petInfo) {
      // 获取最大攻击距离
      if (typeof petInfo.attackRange === 'number') {
        baseRange = petInfo.attackRange;
      }
      
      // 获取最小攻击距离（如果有定义）
      if (typeof petInfo.minAttackRange === 'number') {
        baseMinRange = petInfo.minAttackRange;
      } else {
        // 根据注释中的说明，如果攻击距离为2，则应该是从第3排开始可以攻击
        // 这意味着最小攻击距离应该是根据单位所在列来计算
        // 玩家单位在第1排时，最小距离为3，在第2排时最小距离为2，在第3排时最小距离为1
        const unitColumn = getUnitAbsoluteColumn(unit.gridPosition);
        if (unitColumn >= 1 && unitColumn <= 3) { // 玩家单位
          baseMinRange = 4 - unitColumn; // 根据列位置计算最小距离
        }
      }
      
      // 获取距离计算类型（如果有定义）
      if (petInfo.attackDistanceType) {
        distanceType = petInfo.attackDistanceType;
      }
    }
  } else {
    // 如果是敌方单位，从单位属性中获取攻击距离
    if (unit.stats) {
      if (typeof unit.stats.attackRange === 'number') {
        baseRange = unit.stats.attackRange;
      }
      if (typeof unit.stats.minAttackRange === 'number') {
        baseMinRange = unit.stats.minAttackRange;
      } else {
        // 同样处理敌方单位的最小攻击距离
        const unitColumn = getUnitAbsoluteColumn(unit.gridPosition);
        if (unitColumn >= 4 && unitColumn <= 6) { // 敌方单位
          baseMinRange = unitColumn - 3; // 根据列位置计算最小距离
        }
      }
      if (unit.stats.attackDistanceType) {
        distanceType = unit.stats.attackDistanceType;
      }
    }
  }
  
  // 应用状态效果的修饰
  return {
    min: Math.max(0, baseMinRange + minRangeModifier), // 最小值不能小于0
    max: Math.max(1, baseRange + rangeModifier), // 最大值不能小于1
    type: distanceType
  };
};

/**
 * 判断一个单位是否能够攻击到另一个单位，基于攻击距离
 * @param {BattleUnit} sourceUnit - 发起攻击的单位
 * @param {BattleUnit} targetUnit - 攻击目标单位
 * @param {Object} globalPetConfig - 全局宠物配置对象
 * @param {string} attackType - 攻击类型，默认为'normal'，可以是'skill'等
 * @returns {boolean} - 如果可以攻击返回true，否则返回false
 */
export const canUnitAttackTarget = (sourceUnit, targetUnit, globalPetConfig, attackType = 'normal') => {
  if (!sourceUnit || !targetUnit) return false;
  if (sourceUnit.isDefeated || targetUnit.isDefeated) return false;
  
  // 获取源单位的攻击距离属性
  const rangeProps = getUnitAttackRangeProperties(sourceUnit, globalPetConfig, attackType);
  
  // 计算两个单位之间的距离，使用指定的距离计算类型
  const distance = calculateBattleDistance(
    sourceUnit.gridPosition, 
    targetUnit.gridPosition, 
    rangeProps.type
  );
  
  // 判断是否在攻击范围内（距离需要在最小和最大攻击距离之间）
  return distance >= rangeProps.min && distance <= rangeProps.max;
};

/**
 * 获取一个单位可以攻击的所有目标单位
 * @param {BattleUnit} sourceUnit - 发起攻击的单位
 * @param {BattleUnit[]} allUnits - 战场上的所有单位
 * @param {Object} globalPetConfig - 全局宠物配置对象
 * @param {string} attackType - 攻击类型，默认为'normal'，可以是'skill'等
 * @param {Object} options - 额外选项
 * @param {boolean} options.includeAllies - 是否包含友方单位作为可能目标
 * @param {boolean} options.includeSelf - 是否包含自己作为可能目标
 * @returns {BattleUnit[]} - 可攻击的目标单位数组
 */
export const getValidTargetsForUnit = (sourceUnit, allUnits, globalPetConfig, attackType = 'normal', options = {}) => {
  if (!sourceUnit || !allUnits || allUnits.length === 0) return [];
  
  const { includeAllies = false, includeSelf = false } = options;
  
  // 确定可能的目标单位
  let possibleTargets = [];
  
  if (includeAllies && includeSelf) {
    // 包含所有单位
    possibleTargets = allUnits.filter(unit => !unit.isDefeated);
  } else if (includeAllies) {
    // 包含友方单位，但不包含自己
    possibleTargets = allUnits.filter(unit => 
      !unit.isDefeated && unit.id !== sourceUnit.id
    );
  } else if (includeSelf) {
    // 包含敌方单位和自己
    const opposingTeam = sourceUnit.isPlayerUnit ? 'enemy' : 'player';
    possibleTargets = allUnits.filter(unit => 
      !unit.isDefeated && (unit.gridPosition.team === opposingTeam || unit.id === sourceUnit.id)
    );
  } else {
    // 默认只包含敌方单位
    const opposingTeam = sourceUnit.isPlayerUnit ? 'enemy' : 'player';
    possibleTargets = allUnits.filter(unit => 
      unit.gridPosition.team === opposingTeam && !unit.isDefeated
    );
  }
  
  // 筛选出在攻击范围内的单位
  return possibleTargets.filter(targetUnit => 
    canUnitAttackTarget(sourceUnit, targetUnit, globalPetConfig, attackType)
  );
};

/**
 * 获取一个技能可以攻击的所有目标单位
 * @param {BattleUnit} sourceUnit - 发起攻击的单位
 * @param {string} skillId - 技能ID
 * @param {BattleUnit[]} allUnits - 战场上的所有单位
 * @param {Object} globalPetConfig - 全局宠物配置对象
 * @param {Object} skillConfig - 技能配置对象
 * @returns {BattleUnit[]} - 可攻击的目标单位数组
 */
export const getValidTargetsForSkill = (sourceUnit, skillId, allUnits, globalPetConfig, skillConfig) => {
  if (!sourceUnit || !skillId || !allUnits || allUnits.length === 0 || !skillConfig) return [];
  
  // 获取技能配置
  const skill = skillConfig[skillId];
  if (!skill) return [];
  
  // 获取技能的目标选择选项
  const targetOptions = {
    includeAllies: skill.targetAllies || false,
    includeSelf: skill.targetSelf || false
  };
  
  // 使用技能的攻击类型获取有效目标
  return getValidTargetsForUnit(sourceUnit, allUnits, globalPetConfig, 'skill', targetOptions);
};

/**
 * 检查单位是否有可攻击的目标
 * @param {BattleUnit} sourceUnit - 发起攻击的单位
 * @param {BattleUnit[]} allUnits - 战场上的所有单位
 * @param {Object} globalPetConfig - 全局宠物配置对象
 * @param {string} attackType - 攻击类型，默认为'normal'
 * @returns {boolean} - 如果有可攻击的目标返回true，否则返回false
 */
export const hasValidTargets = (sourceUnit, allUnits, globalPetConfig, attackType = 'normal') => {
  const targets = getValidTargetsForUnit(sourceUnit, allUnits, globalPetConfig, attackType);
  return targets.length > 0;
};

/**
 * 计算物理伤害
 * @param {number} attackerPAtk - 攻击者的物理攻击力
 * @param {number} defenderPDef - 防御者的物理防御力
 * @param {number} critRate - 攻击者的暴击率（0-1之间的小数）
 * @param {number} critDamage - 攻击者的暴击伤害系数（如1.435表示143.5%暴击伤害）
 * @param {number} skillBonus - 技能伤害加成系数（默认为1，表示无加成）
 * @param {number} fixedReduction - 固定值硬减伤（默认为0）
 * @param {number} percentReduction - 百分比硬减伤（0-1之间的小数，默认为0）
 * @returns {Object} - 返回包含伤害计算结果和详情的对象
 */
export const calculatePhysicalDamage = (
  attackerPAtk,
  defenderPDef,
  critRate,
  critDamage,
  skillBonus = DAMAGE_CONSTANTS.COMMON.DEFAULT_SKILL_BONUS,
  fixedReduction = DAMAGE_CONSTANTS.COMMON.DEFAULT_FIXED_REDUCTION,
  percentReduction = DAMAGE_CONSTANTS.COMMON.DEFAULT_PERCENT_REDUCTION
) => {
  // 从配置中获取平衡常数
  const k = DAMAGE_CONSTANTS.PHYSICAL.BALANCE_CONSTANT;
  
  // 计算基础物理伤害
  const damageReductionRatio = defenderPDef / (defenderPDef + k);
  const basePhysicalDamage = attackerPAtk * (1 - damageReductionRatio);
  
  // 判断是否暴击
  const isCritical = Math.random() < critRate;
  const criticalDamage = isCritical ? basePhysicalDamage * critDamage : basePhysicalDamage;
  
  // 应用技能加成
  const skillDamage = criticalDamage * skillBonus;
  
  // 应用固定值硬减伤
  const fixedReducedDamage = Math.max(0, skillDamage - fixedReduction);
  
  // 应用百分比硬减伤
  const percentReducedDamage = fixedReducedDamage * (1 - percentReduction);
  
  // 应用伤害浮动
  const variation = DAMAGE_CONSTANTS.PHYSICAL.DAMAGE_VARIATION;
  const damageVariation = -variation + Math.random() * (variation * 2); // -variation 到 +variation 之间的随机数
  const finalDamage = Math.round(percentReducedDamage * (1 + damageVariation));
  
  // 返回详细的伤害计算过程和结果
  return {
    finalDamage,
    details: {
      basePhysicalDamage: Math.round(basePhysicalDamage),
      isCritical,
      criticalDamage: Math.round(criticalDamage),
      skillDamage: Math.round(skillDamage),
      fixedReducedDamage: Math.round(fixedReducedDamage),
      percentReducedDamage: Math.round(percentReducedDamage),
      damageVariation
    }
  };
};

/**
 * 计算法术伤害
 * @param {number} attackerMAtk - 攻击者的法术攻击力
 * @param {number} defenderMDef - 防御者的法术防御力
 * @param {number} critRate - 攻击者的暴击率（0-1之间的小数）
 * @param {number} critDamage - 攻击者的暴击伤害系数（如1.435表示143.5%暴击伤害）
 * @param {number} skillBonus - 技能伤害加成系数（默认为1，表示无加成）
 * @param {number} fixedReduction - 固定值硬减伤（默认为0）
 * @param {number} percentReduction - 百分比硬减伤（0-1之间的小数，默认为0）
 * @returns {Object} - 返回包含伤害计算结果和详情的对象
 */
export const calculateMagicalDamage = (
  attackerMAtk,
  defenderMDef,
  critRate,
  critDamage,
  skillBonus = DAMAGE_CONSTANTS.COMMON.DEFAULT_SKILL_BONUS,
  fixedReduction = DAMAGE_CONSTANTS.COMMON.DEFAULT_FIXED_REDUCTION,
  percentReduction = DAMAGE_CONSTANTS.COMMON.DEFAULT_PERCENT_REDUCTION
) => {
  // 从配置中获取平衡常数
  const k = DAMAGE_CONSTANTS.MAGICAL.BALANCE_CONSTANT;
  
  // 计算基础法术伤害
  const damageReductionRatio = defenderMDef / (defenderMDef + k);
  const baseMagicalDamage = attackerMAtk * (1 - damageReductionRatio);
  
  // 判断是否暴击
  const isCritical = Math.random() < critRate;
  const criticalDamage = isCritical ? baseMagicalDamage * critDamage : baseMagicalDamage;
  
  // 应用技能加成
  const skillDamage = criticalDamage * skillBonus;
  
  // 应用固定值硬减伤
  const fixedReducedDamage = Math.max(0, skillDamage - fixedReduction);
  
  // 应用百分比硬减伤
  const percentReducedDamage = fixedReducedDamage * (1 - percentReduction);
  
  // 应用伤害浮动
  const variation = DAMAGE_CONSTANTS.MAGICAL.DAMAGE_VARIATION;
  const damageVariation = -variation + Math.random() * (variation * 2); // -variation 到 +variation 之间的随机数
  const finalDamage = Math.round(percentReducedDamage * (1 + damageVariation));
  
  // 返回详细的伤害计算过程和结果
  return {
    finalDamage,
    details: {
      baseMagicalDamage: Math.round(baseMagicalDamage),
      isCritical,
      criticalDamage: Math.round(criticalDamage),
      skillDamage: Math.round(skillDamage),
      fixedReducedDamage: Math.round(fixedReducedDamage),
      percentReducedDamage: Math.round(percentReducedDamage),
      damageVariation
    }
  };
};

/**
 * 计算战斗单位对目标造成的伤害
 * @param {Object} attacker - 攻击者单位
 * @param {Object} defender - 防御者单位
 * @param {string} damageType - 伤害类型 ('physical', 'magical' 或 'auto')
 * @param {number} skillBonus - 技能伤害加成系数
 * @param {Object} options - 额外选项
 * @returns {Object} - 返回包含伤害计算结果和详情的对象
 */
export const calculateBattleDamage = (attacker, defender, damageType = 'auto', skillBonus = DAMAGE_CONSTANTS.COMMON.DEFAULT_SKILL_BONUS, options = {}) => {
  // 获取攻击者和防御者的属性
  const { stats: attackerStats } = attacker;
  const { stats: defenderStats } = defender;
  
  // 获取暴击率和暴击伤害
  const critRate = attackerStats.critRate || DAMAGE_CONSTANTS.PHYSICAL.DEFAULT_CRIT_RATE;
  const critDamage = attackerStats.critDamage || DAMAGE_CONSTANTS.PHYSICAL.DEFAULT_CRIT_DAMAGE;
  
  // 获取减伤属性
  const fixedReduction = defenderStats.fixedDamageReduction || DAMAGE_CONSTANTS.COMMON.DEFAULT_FIXED_REDUCTION;
  const percentReduction = defenderStats.percentDamageReduction || DAMAGE_CONSTANTS.COMMON.DEFAULT_PERCENT_REDUCTION;
  
  // 如果伤害类型为'auto'，根据物理攻击和法术攻击的高低自动判断
  let actualDamageType = damageType;
  if (damageType === 'auto') {
    // 获取物理攻击和法术攻击值
    const physicalAttack = attackerStats.physicalAttack || 0;
    const magicalAttack = attackerStats.magicalAttack || 0;
    
    // 比较物理攻击和法术攻击，选择较高的作为实际攻击类型
    actualDamageType = physicalAttack >= magicalAttack ? 'physical' : 'magical';
  }
  
  // 根据实际伤害类型调用相应的伤害计算函数
  if (actualDamageType === 'physical') {
    const result = calculatePhysicalDamage(
      attackerStats.physicalAttack,
      defenderStats.physicalDefense,
      critRate,
      critDamage,
      skillBonus,
      fixedReduction,
      percentReduction
    );
    
    // 添加实际使用的伤害类型到返回结果中
    return {
      ...result,
      damageType: actualDamageType,
      details: {
        ...result.details,
        damageType: actualDamageType
      }
    };
  } else if (actualDamageType === 'magical') {
    const result = calculateMagicalDamage(
      attackerStats.magicalAttack,
      defenderStats.magicalDefense,
      critRate,
      critDamage,
      skillBonus,
      fixedReduction,
      percentReduction
    );
    
    // 添加实际使用的伤害类型到返回结果中
    return {
      ...result,
      damageType: actualDamageType,
      details: {
        ...result.details,
        damageType: actualDamageType
      }
    };
  }
  
  // 默认返回0伤害
  return { finalDamage: 0, details: { error: 'Invalid damage type' } };
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
    skillIds: unit.skillIds,
    statusEffects: unit.statusEffects && Array.isArray(unit.statusEffects) ? unit.statusEffects.map(effect => effect.type) : [],
    // 位置信息
    position: unit.gridPosition ? `${unit.gridPosition.row},${unit.gridPosition.col || unit.gridPosition.column}` : 'unknown',
    // 判断使用物理还是法术攻击
    preferredAttackType: pAttack >= mAttack ? 'physical' : 'magical'
  };
};

/**
 * 模拟战斗伤害计算并返回详细信息，用于调试
 * @param {Object} attacker - 攻击者单位
 * @param {Object} defender - 防御者单位
 * @returns {Object} - 伤害计算结果和详情
 */
export const simulateBattleDamage = (attacker, defender) => {
  // 获取单位属性详情
  const attackerDetails = getUnitStatsDetails(attacker);
  const defenderDetails = getUnitStatsDetails(defender);
  
  // 计算物理伤害
  const physicalDamageResult = calculateBattleDamage(attacker, defender, 'physical');
  
  // 计算法术伤害
  const magicalDamageResult = calculateBattleDamage(attacker, defender, 'magical');
  
  // 计算自动选择的伤害
  const autoDamageResult = calculateBattleDamage(attacker, defender, 'auto');
  
  return {
    attacker: attackerDetails,
    defender: defenderDetails,
    damageResults: {
      physical: {
        finalDamage: physicalDamageResult.finalDamage,
        details: physicalDamageResult.details
      },
      magical: {
        finalDamage: magicalDamageResult.finalDamage,
        details: magicalDamageResult.details
      },
      auto: {
        finalDamage: autoDamageResult.finalDamage,
        damageType: autoDamageResult.damageType,
        details: autoDamageResult.details
      }
    }
  };
};

// TODO:
// - Skill effect resolution logic
// - Status effect application/removal
// - AI logic for enemy turns
// - Victory/Defeat condition checking