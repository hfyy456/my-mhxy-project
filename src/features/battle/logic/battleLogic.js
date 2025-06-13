/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-22 19:27:30
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-13 13:11:41
 */
import { EQUIPMENT_EFFECT_TYPES } from '@/config/enumConfig';



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