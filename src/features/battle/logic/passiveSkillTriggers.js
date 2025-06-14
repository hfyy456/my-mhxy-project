/*
 * @Author: Cascade AI
 * @Date: 2025-05-29
 * @LastEditors: Cascade AI
 * @LastEditTime: 2025-05-29
 * @Description: 战斗系统被动技能触发器
 */
import { PASSIVE_SKILL_TIMING } from '@/config/enumConfig';

/**
 * 被动技能触发器配置
 * 定义了各种战斗事件对应的被动技能触发时机
 */
export const PASSIVE_TRIGGERS = {
  // 回合相关触发器
  TURN_START: {
    timing: PASSIVE_SKILL_TIMING.TURN_START,
    description: '回合开始时触发'
  },
  TURN_END: {
    timing: PASSIVE_SKILL_TIMING.TURN_END,
    description: '回合结束时触发'
  },
  
  // 攻击相关触发器
  BEFORE_ATTACK: {
    timing: PASSIVE_SKILL_TIMING.BEFORE_ANY_ATTACK,
    description: '任何攻击前触发'
  },
  AFTER_ATTACK: {
    timing: PASSIVE_SKILL_TIMING.AFTER_ANY_ATTACK,
    description: '任何攻击后触发'
  },
  BEFORE_NORMAL_ATTACK: {
    timing: PASSIVE_SKILL_TIMING.BEFORE_NORMAL_ATTACK,
    description: '普通攻击前触发'
  },
  AFTER_NORMAL_ATTACK: {
    timing: PASSIVE_SKILL_TIMING.AFTER_NORMAL_ATTACK,
    description: '普通攻击后触发'
  },
  BEFORE_SKILL_ATTACK: {
    timing: PASSIVE_SKILL_TIMING.BEFORE_MAGIC_SKILL,
    description: '技能攻击前触发'
  },
  AFTER_SKILL_ATTACK: {
    timing: PASSIVE_SKILL_TIMING.AFTER_MAGIC_SKILL,
    description: '技能攻击后触发'
  },
  
  // 伤害相关触发器
  ON_DAMAGE: {
    timing: PASSIVE_SKILL_TIMING.ON_ANY_DAMAGE,
    description: '受到任何伤害时触发'
  },
  ON_PHYSICAL_DAMAGE: {
    timing: PASSIVE_SKILL_TIMING.ON_PHYSICAL_DAMAGE,
    description: '受到物理伤害时触发'
  },
  ON_MAGICAL_DAMAGE: {
    timing: PASSIVE_SKILL_TIMING.ON_MAGICAL_DAMAGE,
    description: '受到法术伤害时触发'
  },
  AFTER_DAMAGE: {
    timing: PASSIVE_SKILL_TIMING.AFTER_DAMAGE,
    description: '受到伤害后触发'
  },
  
  // 状态相关触发器
  ON_DODGE: {
    timing: PASSIVE_SKILL_TIMING.ON_DODGE,
    description: '闪避成功时触发'
  },
  ON_CRIT: {
    timing: PASSIVE_SKILL_TIMING.ON_CRIT,
    description: '暴击成功时触发'
  },
  ON_KILL: {
    timing: PASSIVE_SKILL_TIMING.ON_KILL,
    description: '击杀目标时触发'
  },
  ON_DEATH: {
    timing: PASSIVE_SKILL_TIMING.ON_DEATH,
    description: '死亡时触发'
  },
  
  // 战斗相关触发器
  BATTLE_START: {
    timing: PASSIVE_SKILL_TIMING.BATTLE_START,
    description: '战斗开始时触发'
  },
  BATTLE_END: {
    timing: PASSIVE_SKILL_TIMING.BATTLE_END,
    description: '战斗结束时触发'
  }
};

/**
 * 创建被动技能触发上下文
 * @param {Object} unit - 触发被动技能的单位
 * @param {Object} options - 触发选项
 * @returns {Object} - 触发上下文
 */
export const createTriggerContext = (unit, options = {}) => {
  return {
    unit,
    sourceUnit: options.sourceUnit || null,
    targetUnit: options.targetUnit || null,
    damage: options.damage || 0,
    healing: options.healing || 0,
    isCritical: options.isCritical || false,
    isSkill: options.isSkill || false,
    skillId: options.skillId || null,
    actionType: options.actionType || null,
    additionalData: options.additionalData || {}
  };
};

/**
 * 创建被动技能触发事件
 * @param {string} triggerType - 触发类型
 * @param {string} unitId - 单位ID
 * @param {Object} context - 触发上下文
 * @returns {Object} - 触发事件
 */
export const createTriggerEvent = (triggerType, unitId, context = {}) => {
  const trigger = Object.values(PASSIVE_TRIGGERS).find(t => t.timing === triggerType);
  
  if (!trigger) {
    console.warn(`未知的被动技能触发类型: ${triggerType}`);
    return null;
  }
  
  return {
    type: 'triggerPassiveSkills',
    payload: {
      unitId,
      triggerType,
      sourceUnitId: context.sourceUnit ? context.sourceUnit.id : null,
      targetUnitId: context.targetUnit ? context.targetUnit.id : null,
      damageAmount: context.damage || 0,
      healAmount: context.healing || 0,
      isCritical: context.isCritical || false,
      isSkill: context.isSkill || false,
      skillId: context.skillId || null,
      actionType: context.actionType || null,
      additionalData: context.additionalData || {}
    }
  };
};

/**
 * 距离计算函数 - 只考虑列之间的距离
 * 注意：根据项目要求，距离计算只考虑列之间的距离，不使用曼哈顿距离或欧几里得距离
 * @param {Object} unit1Position - 单位1的位置 {row, col}
 * @param {Object} unit2Position - 单位2的位置 {row, col}
 * @returns {number} - 两个单位之间的距离
 */
export const calculateDistance = (unit1Position, unit2Position) => {
  // 只考虑列之间的距离
  return Math.abs(unit1Position.col - unit2Position.col);
};

/**
 * 检查被动技能是否可以触发
 * @param {Object} skill - 被动技能配置
 * @param {Object} context - 触发上下文
 * @returns {boolean} - 是否可以触发
 */
export const canTriggerPassiveSkill = (skill, context) => {
  // 检查几率
  if (skill.probability && Math.random() > skill.probability) {
    return false;
  }
  
  // 检查距离限制（如果有）
  if (skill.range && context.unit && context.targetUnit) {
    const distance = calculateDistance(
      context.unit.gridPosition,
      context.targetUnit.gridPosition
    );
    
    if (distance > skill.range) {
      return false;
    }
  }
  
  // 检查特定条件
  if (skill.conditions) {
    // HP百分比条件
    if (skill.conditions.hpPercentBelow && context.unit) {
      const hpPercent = (context.unit.derivedAttributes.currentHp / context.unit.derivedAttributes.maxHp) * 100;
      if (hpPercent > skill.conditions.hpPercentBelow) {
        return false;
      }
    }
    
    // MP百分比条件
    if (skill.conditions.mpPercentAbove && context.unit) {
      const mpPercent = (context.unit.derivedAttributes.currentMp / context.unit.derivedAttributes.maxMp) * 100;
      if (mpPercent < skill.conditions.mpPercentAbove) {
        return false;
      }
    }
    
    // 目标类型条件
    if (skill.conditions.targetType && context.targetUnit) {
      if (skill.conditions.targetType === 'player' && !context.targetUnit.isPlayerUnit) {
        return false;
      }
      if (skill.conditions.targetType === 'enemy' && context.targetUnit.isPlayerUnit) {
        return false;
      }
    }
    
    // 伤害类型条件
    if (skill.conditions.damageType && context.actionType) {
      if (skill.conditions.damageType !== context.actionType) {
        return false;
      }
    }
  }
  
  return true;
};
