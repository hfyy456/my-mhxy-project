/*
 * @Author: Cascade AI
 * @Date: 2025-05-29
 * @LastEditors: Cascade AI
 * @LastEditTime: 2025-05-29
 * @Description: 战斗系统被动技能处理逻辑
 */
import { passiveSkillConfig } from '@/config/skill/passiveSkillConfig';
import { PASSIVE_SKILL_TIMING } from '@/config/enumConfig';
import { applyBuff } from './buffManager';

/**
 * 检查单位是否拥有指定类型的被动技能
 * @param {Object} unit - 战斗单位
 * @param {string} timingType - 触发时机类型
 * @returns {Array} - 符合条件的被动技能数组
 */
export const getUnitPassiveSkillsByTiming = (unit, timingType) => {
  if (!unit || !unit.skillSet || unit.skillSet.length === 0) {
    return [];
  }
  
  return unit.skillSet
    .map(skillId => passiveSkillConfig.find(s => s.id === skillId && s.mode === 'passive'))
    .filter(skill => skill && skill.timing === timingType);
};

/**
 * 检查单位是否拥有指定ID的被动技能
 * @param {Object} unit - 战斗单位
 * @param {string} skillId - 技能ID
 * @returns {Object|null} - 被动技能配置或null
 */
export const hasPassiveSkill = (unit, skillId) => {
  if (!unit || !unit.skillSet || unit.skillSet.length === 0) {
    return null;
  }
  
  if (!unit.skillSet.includes(skillId)) {
    return null;
  }
  
  return passiveSkillConfig.find(s => s.id === skillId && s.mode === 'passive');
};

/**
 * 应用被动技能的永久BUFF
 * @param {Object} unit - 战斗单位
 * @returns {Array} - 应用结果数组
 */
export const applyPermanentPassiveBuffs = (unit) => {
  if (!unit || !unit.skillSet || unit.skillSet.length === 0) {
    return [];
  }
  
  const results = [];
  
  // 遍历单位的所有技能
  unit.skillSet.forEach(skillId => {
    // 获取被动技能配置
    const passiveSkill = passiveSkillConfig.find(s => s.id === skillId && s.mode === 'passive');
    if (!passiveSkill) return;
    
    // 应用永久BUFF
    if (passiveSkill.permanentBuffs && passiveSkill.permanentBuffs.length > 0) {
      passiveSkill.permanentBuffs.forEach(buffConfig => {
        // 确定目标（对于永久BUFF，通常是自身）
        if (buffConfig.target === 'self' || !buffConfig.target) {
          const result = applyBuff(unit, buffConfig.buffId, unit.id, buffConfig.level || 1);
          results.push({
            skillId,
            skillName: passiveSkill.name,
            buffId: buffConfig.buffId,
            success: result.success,
            message: result.message
          });
        }
      });
    }
  });
  
  return results;
};

/**
 * 触发被动技能效果
 * @param {Object} unit - 触发技能的单位
 * @param {string} triggerType - 触发类型
 * @param {Object} context - 触发上下文
 * @returns {Array} - 触发结果数组
 */
export const triggerPassiveSkillEffects = (unit, triggerType, context = {}) => {
  if (!unit || unit.isDefeated || !unit.skillSet || unit.skillSet.length === 0) {
    return [];
  }
  
  const results = [];
  const { sourceUnit, targetUnit, damage, isCritical, isSkill, skillId } = context;
  
  // 获取符合触发时机的被动技能
  const passiveSkills = getUnitPassiveSkillsByTiming(unit, triggerType);
  
  // 遍历所有符合条件的被动技能
  passiveSkills.forEach(passiveSkill => {
    // 检查触发几率
    if (passiveSkill.probability && Math.random() > passiveSkill.probability) {
      return; // 几率未触发
    }
    
    // 记录被动技能触发
    const triggerResult = {
      skillId: passiveSkill.id,
      skillName: passiveSkill.name,
      triggerType,
      effects: []
    };
    
    // 应用触发BUFF
    if (passiveSkill.triggerBuffs && passiveSkill.triggerBuffs.length > 0) {
      passiveSkill.triggerBuffs.forEach(buffConfig => {
        // 检查几率
        if (buffConfig.chance && Math.random() > buffConfig.chance) {
          return; // 几率未触发
        }
        
        let targetForBuff = null;
        
        // 确定目标
        switch (buffConfig.target) {
          case 'self':
            targetForBuff = unit;
            break;
          case 'source':
          case 'attacker':
            targetForBuff = sourceUnit;
            break;
          case 'target':
            targetForBuff = targetUnit;
            break;
          // 其他目标类型可以在这里扩展
        }
        
        if (targetForBuff) {
          // 应用BUFF
          const buffResult = applyBuff(targetForBuff, buffConfig.buffId, unit.id, buffConfig.level || 1);
          
          triggerResult.effects.push({
            type: 'buff',
            buffId: buffConfig.buffId,
            targetId: targetForBuff.id,
            success: buffResult.success,
            message: buffResult.message
          });
        }
      });
    }
    
    // 处理特殊被动效果
    switch (passiveSkill.id) {
      case 'counter':
        // 反震效果
        if (sourceUnit && damage) {
          const reflectDamage = Math.round(damage * passiveSkill.reflectPercentage);
          
          triggerResult.effects.push({
            type: 'damage',
            targetId: sourceUnit.id,
            damage: reflectDamage,
            message: `${unit.name} 的反震效果对 ${sourceUnit.name} 造成 ${reflectDamage} 点伤害`
          });
        }
        break;
        
      case 'combo_attack':
        // 连击效果
        if (triggerType === PASSIVE_SKILL_TIMING.AFTER_NORMAL_ATTACK) {
          triggerResult.effects.push({
            type: 'extra_attack',
            hits: passiveSkill.hits || 1,
            message: `${unit.name} 的连击效果触发了额外攻击`
          });
        }
        break;
        
      case 'magic_chain':
        // 法术连击效果
        if (triggerType === PASSIVE_SKILL_TIMING.AFTER_MAGIC_SKILL && isSkill) {
          triggerResult.effects.push({
            type: 'extra_skill',
            skillId: skillId,
            hits: passiveSkill.hits || 1,
            message: `${unit.name} 的法术连击效果触发了额外技能`
          });
        }
        break;
        
      case 'critical_strike':
      case 'magic_critical':
        // 暴击效果
        if ((passiveSkill.id === 'critical_strike' && triggerType === PASSIVE_SKILL_TIMING.BEFORE_NORMAL_ATTACK) ||
            (passiveSkill.id === 'magic_critical' && triggerType === PASSIVE_SKILL_TIMING.BEFORE_MAGIC_SKILL)) {
          
          triggerResult.effects.push({
            type: 'critical_modifier',
            multiplier: passiveSkill.multiplier || 2.0,
            message: `${unit.name} 的${passiveSkill.name}效果增加了暴击伤害`
          });
        }
        break;
        
      case 'divine_protection':
        // 神佑复生效果
        if (triggerType === PASSIVE_SKILL_TIMING.ON_DEATH) {
          const reviveHp = Math.round(unit.stats.maxHp * passiveSkill.reviveHealthPercentage);
          
          triggerResult.effects.push({
            type: 'revive',
            hp: reviveHp,
            message: `${unit.name} 的神佑复生效果触发，恢复 ${reviveHp} 点生命值`
          });
        }
        break;
        
      // 可以添加更多特殊被动效果的处理
    }
    
    // 只有当有效果时才添加结果
    if (triggerResult.effects.length > 0) {
      results.push(triggerResult);
    }
  });
  
  return results;
};

/**
 * 处理被动技能的伤害修正
 * @param {Object} unit - 战斗单位
 * @param {number} damage - 原始伤害值
 * @param {string} damageType - 伤害类型 ('physical' 或 'magical')
 * @returns {number} - 修正后的伤害值
 */
export const applyPassiveSkillDamageModifiers = (unit, damage, damageType) => {
  if (!unit || !unit.skillSet || unit.skillSet.length === 0) {
    return damage;
  }
  
  let modifiedDamage = damage;
  
  // 遍历单位的所有技能
  unit.skillSet.forEach(skillId => {
    // 获取被动技能配置
    const passiveSkill = passiveSkillConfig.find(s => s.id === skillId && s.mode === 'passive');
    if (!passiveSkill) return;
    
    // 应用物理伤害加成
    if (damageType === 'physical' && passiveSkill.physicalDamageBonus) {
      modifiedDamage *= (1 + passiveSkill.physicalDamageBonus);
    }
    
    // 应用法术伤害加成
    if (damageType === 'magical' && passiveSkill.magicalDamageBonus) {
      modifiedDamage *= (1 + passiveSkill.magicalDamageBonus);
    }
    
    // 应用伤害波动
    if (passiveSkill.damageVariation) {
      const { min, max } = passiveSkill.damageVariation;
      const variation = min + Math.random() * (max - min);
      modifiedDamage *= variation;
    }
    
    // 应用夜间战斗加成
    if (passiveSkill.id === 'night_combat' && passiveSkill.nightBonusDamage) {
      // 这里可以添加判断是否是夜间的逻辑
      const isNight = new Date().getHours() >= 18 || new Date().getHours() < 6;
      if (isNight) {
        modifiedDamage *= (1 + passiveSkill.nightBonusDamage);
      }
    }
  });
  
  return Math.round(modifiedDamage);
};

/**
 * 处理被动技能的闪避效果
 * @param {Object} unit - 战斗单位
 * @param {Object} attacker - 攻击者单位
 * @returns {Object} - 闪避结果 { dodged, message }
 */
export const processPassiveSkillDodge = (unit, attacker) => {
  if (!unit || !unit.skillSet || unit.skillSet.length === 0) {
    return { dodged: false };
  }
  
  // 检查是否有闪避技能
  const dodgeSkill = passiveSkillConfig.find(s => 
    s.id === 'dodge' && 
    unit.skillSet.includes(s.id) && 
    s.mode === 'passive'
  );
  
  if (dodgeSkill && Math.random() < dodgeSkill.probability) {
    return {
      dodged: true,
      message: `${unit.name} 的闪避技能触发，完全避开了攻击！`
    };
  }
  
  return { dodged: false };
};

/**
 * 在战斗开始时初始化所有单位的被动技能
 * @param {Object} battleUnits - 所有战斗单位
 * @returns {Array} - 初始化结果数组
 */
export const initializePassiveSkills = (battleUnits) => {
  const results = [];
  
  Object.values(battleUnits).forEach(unit => {
    if (!unit.isDefeated) {
      // 应用永久BUFF
      const buffResults = applyPermanentPassiveBuffs(unit);
      
      // 触发战斗开始时的被动技能
      const battleStartResults = triggerPassiveSkillEffects(unit, PASSIVE_SKILL_TIMING.BATTLE_START);
      
      results.push({
        unitId: unit.id,
        unitName: unit.name,
        buffResults,
        battleStartResults
      });
    }
  });
  
  return results;
};
