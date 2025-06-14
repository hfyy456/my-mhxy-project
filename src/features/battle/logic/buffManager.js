/*
 * @Author: Cascade
 * @Date: 2025-05-24 02:46:07
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-13 03:56:19
 */
import { 
  getBuffById, 
  createBuffInstance, 
  BUFF_TYPES, 
  BUFF_EFFECT_TYPES,
  BUFF_APPLY_TYPES
} from '@/config/skill/buffConfig';

/**
 * 应用BUFF到目标单位
 * @param {Object} targetUnit - 目标战斗单位
 * @param {string} buffId - BUFF ID
 * @param {string} sourceUnitId - 施加BUFF的单位ID
 * @param {number} level - BUFF等级，影响效果强度
 * @param {boolean} isActive - BUFF是否生效，默认为true
 * @returns {Object} - 包含应用结果的对象 { success, message, appliedBuff }
 */
export const applyBuff = (targetUnit, buffId, sourceUnitId, level = 1, isActive = true) => {
  if (!targetUnit) {
    return { success: false, message: '目标单位不存在' };
  }

  const buffConfig = getBuffById(buffId);
  if (!buffConfig) {
    return { success: false, message: `BUFF ${buffId} 不存在` };
  }

  // 检查目标是否已经有相同的BUFF
  const existingBuffIndex = targetUnit.statusEffects.findIndex(
    effect => effect.buffId === buffId
  );

  let appliedBuff;
  let message;

  if (existingBuffIndex >= 0) {
    const existingBuff = targetUnit.statusEffects[existingBuffIndex];
    
    // 根据BUFF应用类型处理
    switch (buffConfig.applyType) {
      case BUFF_APPLY_TYPES.STACK:
        // 可叠加，增加层数
        if (existingBuff.stacks < buffConfig.maxStacks) {
          existingBuff.stacks += 1;
          message = `${targetUnit.name} 的 ${buffConfig.name} 效果叠加到 ${existingBuff.stacks} 层`;
        } else {
          message = `${targetUnit.name} 的 ${buffConfig.name} 已达到最大层数 ${buffConfig.maxStacks}`;
        }
        appliedBuff = existingBuff;
        break;
        
      case BUFF_APPLY_TYPES.REFRESH:
        // 刷新持续时间
        existingBuff.remainingRounds = buffConfig.durationRounds;
        message = `${targetUnit.name} 的 ${buffConfig.name} 效果持续时间已刷新`;
        appliedBuff = existingBuff;
        break;
        
      case BUFF_APPLY_TYPES.REPLACE:
        // 替换现有效果
        const newBuff = createBuffInstance(buffId, sourceUnitId, level);
        targetUnit.statusEffects[existingBuffIndex] = newBuff;
        message = `${targetUnit.name} 的 ${buffConfig.name} 效果已被替换`;
        appliedBuff = newBuff;
        break;
        
      case BUFF_APPLY_TYPES.HIGHEST:
        // 保留最高效果
        const newBuffInstance = createBuffInstance(buffId, sourceUnitId, level);
        // 比较效果值（针对不同类型的BUFF，比较逻辑可能不同）
        let keepExisting = false;
        
        if (buffConfig.effectType === BUFF_EFFECT_TYPES.STAT_MODIFIER) {
          // 对于属性修改，比较固定值
          keepExisting = Math.abs(existingBuff.value) >= Math.abs(newBuffInstance.value);
        } else if (buffConfig.effectType === BUFF_EFFECT_TYPES.STAT_MULTIPLIER) {
          // 对于属性倍率，比较倍率值
          keepExisting = Math.abs(existingBuff.valueMultiplier) >= Math.abs(newBuffInstance.valueMultiplier);
        } else {
          // 其他类型，默认保留已有效果
          keepExisting = true;
        }
        
        if (!keepExisting) {
          targetUnit.statusEffects[existingBuffIndex] = newBuffInstance;
          message = `${targetUnit.name} 的 ${buffConfig.name} 效果已被更强效果替换`;
          appliedBuff = newBuffInstance;
        } else {
          message = `${targetUnit.name} 已有更强的 ${buffConfig.name} 效果，保持不变`;
          appliedBuff = existingBuff;
        }
        break;
        
      default:
        // 默认刷新持续时间
        existingBuff.remainingRounds = buffConfig.durationRounds;
        message = `${targetUnit.name} 的 ${buffConfig.name} 效果持续时间已刷新`;
        appliedBuff = existingBuff;
    }
  } else {
    // 目标没有该BUFF，直接添加
    const newBuff = createBuffInstance(buffId, sourceUnitId, level);
    // 设置BUFF是否生效
    newBuff.isActive = isActive;
    targetUnit.statusEffects.push(newBuff);
    message = `${targetUnit.name} 获得了 ${buffConfig.name} 效果${isActive ? '' : '（未生效）'}`;
    appliedBuff = newBuff;
  }

  return { success: true, message, appliedBuff };
};

/**
 * 移除目标单位的指定BUFF
 * @param {Object} targetUnit - 目标战斗单位
 * @param {string} buffId - 要移除的BUFF ID
 * @returns {Object} - 包含移除结果的对象 { success, message, removedBuff }
 */
export const removeBuff = (targetUnit, buffId) => {
  if (!targetUnit) {
    return { success: false, message: '目标单位不存在' };
  }

  const buffIndex = targetUnit.statusEffects.findIndex(
    effect => effect.buffId === buffId
  );

  if (buffIndex >= 0) {
    const removedBuff = targetUnit.statusEffects[buffIndex];
    targetUnit.statusEffects.splice(buffIndex, 1);
    return { 
      success: true, 
      message: `${targetUnit.name} 的 ${removedBuff.name} 效果已移除`,
      removedBuff 
    };
  }

  return { success: false, message: `${targetUnit.name} 没有 ${buffId} 效果` };
};

/**
 * 清除目标单位的所有BUFF
 * @param {Object} targetUnit - 目标战斗单位
 * @param {string} buffType - 可选，指定要清除的BUFF类型
 * @returns {Object} - 包含清除结果的对象 { success, message, removedBuffs }
 */
export const clearAllBuffs = (targetUnit, buffType = null) => {
  if (!targetUnit) {
    return { success: false, message: '目标单位不存在' };
  }

  const removedBuffs = [];
  
  if (buffType) {
    // 清除指定类型的BUFF
    const remainingBuffs = targetUnit.statusEffects.filter(effect => {
      const isTargetType = effect.type === buffType;
      if (isTargetType) {
        removedBuffs.push(effect);
        return false;
      }
      return true;
    });
    
    targetUnit.statusEffects = remainingBuffs;
    
    return { 
      success: true, 
      message: `${targetUnit.name} 的 ${removedBuffs.length} 个${buffType}效果已清除`,
      removedBuffs 
    };
  } else {
    // 清除所有BUFF
    removedBuffs.push(...targetUnit.statusEffects);
    targetUnit.statusEffects = [];
    
    return { 
      success: true, 
      message: `${targetUnit.name} 的所有效果已清除`,
      removedBuffs 
    };
  }
};

/**
 * 处理回合开始时的BUFF效果
 * @param {Object} targetUnit - 目标战斗单位
 * @returns {Array} - 包含BUFF效果处理结果的数组
 */
export const processBuffsOnTurnStart = (targetUnit) => {
  if (!targetUnit || targetUnit.isDefeated) {
    return [];
  }

  // 确保 statusEffects 是一个数组
  if (!Array.isArray(targetUnit.statusEffects)) {
    return [];
  }

  const results = [];

  // 处理每个BUFF的效果
  targetUnit.statusEffects.forEach(buff => {
    const buffConfig = getBuffById(buff.buffId);
    if (!buffConfig) return;

    // 根据BUFF类型处理效果
    switch (buff.effectType) {
      case BUFF_EFFECT_TYPES.HOT:
        // 持续治疗效果
        const healAmount = buff.healPerRound * buff.stacks;
        targetUnit.derivedAttributes.currentHp = Math.min(
          targetUnit.derivedAttributes.currentHp + healAmount,
          targetUnit.derivedAttributes.maxHp
        );
        results.push({
          type: 'heal',
          amount: healAmount,
          message: `${targetUnit.name} 因 ${buff.name} 效果恢复了 ${healAmount} 点生命值`
        });
        break;
        
      // 其他回合开始时触发的效果...
    }
  });

  return results;
};

/**
 * 处理回合结束时的BUFF效果
 * @param {Object} targetUnit - 目标战斗单位
 * @returns {Array} - 包含BUFF效果处理结果的数组
 */
export const processBuffsOnTurnEnd = (targetUnit) => {
  if (!targetUnit || targetUnit.isDefeated) {
    return [];
  }

  const results = [];
  const expiredBuffs = [];

  // 处理每个BUFF的效果
  targetUnit.statusEffects.forEach(buff => {
    const buffConfig = getBuffById(buff.buffId);
    if (!buffConfig) return;

    // 根据BUFF类型处理效果
    switch (buff.effectType) {
      case BUFF_EFFECT_TYPES.DOT:
        // 持续伤害效果
        const damageAmount = buff.damagePerRound * buff.stacks;
        targetUnit.derivedAttributes.currentHp = Math.max(
          targetUnit.derivedAttributes.currentHp - damageAmount,
          0
        );
        results.push({
          type: 'damage',
          amount: damageAmount,
          element: buff.damageElement,
          message: `${targetUnit.name} 受到 ${buff.name} 效果造成的 ${damageAmount} 点伤害`
        });
        
        // 检查单位是否被击败
        if (targetUnit.derivedAttributes.currentHp <= 0) {
          targetUnit.isDefeated = true;
          results.push({
            type: 'defeat',
            message: `${targetUnit.name} 被 ${buff.name} 效果击败了`
          });
        }
        break;
        
      // 其他回合结束时触发的效果...
    }

    // 减少BUFF持续时间
    buff.remainingRounds--;
    
    // 检查BUFF是否已过期
    if (buff.remainingRounds <= 0) {
      expiredBuffs.push(buff);
      results.push({
        type: 'expire',
        buffId: buff.buffId,
        message: `${targetUnit.name} 的 ${buff.name} 效果已结束`
      });
    }
  });

  // 移除过期的BUFF
  targetUnit.statusEffects = targetUnit.statusEffects.filter(
    buff => !expiredBuffs.some(expiredBuff => expiredBuff.instanceId === buff.instanceId)
  );

  return results;
};

/**
 * 检查BUFF是否生效
 * @param {Object} targetUnit - 目标战斗单位
 * @param {string} buffId - BUFF ID
 * @returns {boolean} - 如果BUFF生效返回true，否则返回false
 */
export const isBuffActive = (targetUnit, buffId) => {
  if (!targetUnit || !targetUnit.statusEffects) {
    return false;
  }

  const buff = targetUnit.statusEffects.find(effect => effect.buffId === buffId);
  if (!buff) {
    return false;
  }

  // 如果isActive属性未定义或为true，则认为是生效的
  return buff.isActive !== false;
};

/**
 * 设置BUFF的生效状态
 * @param {Object} targetUnit - 目标战斗单位
 * @param {string} buffId - BUFF ID
 * @param {boolean} isActive - 是否生效
 * @returns {Object} - 包含设置结果的对象 { success, message }
 */
export const setBuffActiveState = (targetUnit, buffId, isActive) => {
  if (!targetUnit) {
    return { success: false, message: '目标单位不存在' };
  }

  const buffIndex = targetUnit.statusEffects.findIndex(
    effect => effect.buffId === buffId
  );

  if (buffIndex >= 0) {
    const buff = targetUnit.statusEffects[buffIndex];
    const oldState = buff.isActive !== false;
    buff.isActive = isActive;
    
    const buffConfig = getBuffById(buffId);
    const buffName = buffConfig ? buffConfig.name : buffId;
    
    return { 
      success: true, 
      message: `${targetUnit.name} 的 ${buffName} 效果已${isActive ? '生效' : '失效'}`,
      oldState,
      newState: isActive
    };
  }

  return { success: false, message: `${targetUnit.name} 没有 ${buffId} 效果` };
};

/**
 * 检查单位是否受到特定控制效果的影响
 * @param {Object} targetUnit - 目标战斗单位
 * @param {string} effectType - 效果类型
 * @returns {boolean} - 如果受到影响返回true，否则返回false
 */
export const isUnitAffectedByEffect = (targetUnit, effectType) => {
  if (!targetUnit || !targetUnit.statusEffects) {
    return false;
  }

  // 只考虑已生效的BUFF
  return targetUnit.statusEffects.some(effect => 
    effect.effectType === effectType && effect.isActive !== false
  );
};

/**
 * 检查单位是否可以行动（不受眩晕、冻结等控制效果影响）
 * @param {Object} targetUnit - 目标战斗单位
 * @returns {Object} - 包含结果的对象 { canAct, reason }
 */
export const canUnitAct = (targetUnit) => {
  if (!targetUnit) {
    return { canAct: false, reason: '单位不存在' };
  }

  if (targetUnit.isDefeated) {
    return { canAct: false, reason: '单位已被击败' };
  }

  // 检查眩晕效果
  if (isUnitAffectedByEffect(targetUnit, 'stun')) {
    return { canAct: false, reason: '单位被眩晕' };
  }

  // 检查冻结效果
  if (isUnitAffectedByEffect(targetUnit, 'freeze')) {
    return { canAct: false, reason: '单位被冻结' };
  }

  // 检查睡眠效果
  if (isUnitAffectedByEffect(targetUnit, 'sleep')) {
    return { canAct: false, reason: '单位处于睡眠状态' };
  }

  return { canAct: true, reason: '' };
};

/**
 * 检查单位是否可以使用技能（不受沉默等效果影响）
 * @param {Object} targetUnit - 目标战斗单位
 * @returns {Object} - 包含结果的对象 { canUseSkill, reason }
 */
export const canUnitUseSkill = (targetUnit) => {
  const actCheck = canUnitAct(targetUnit);
  if (!actCheck.canAct) {
    return { canUseSkill: false, reason: actCheck.reason };
  }

  // 检查沉默效果
  if (isUnitAffectedByEffect(targetUnit, 'silence')) {
    return { canUseSkill: false, reason: '单位被沉默' };
  }

  // 检查法术封印效果
  if (isUnitAffectedByEffect(targetUnit, 'spell_lock')) {
    return { canUseSkill: false, reason: '单位被法术封印' };
  }

  return { canUseSkill: true, reason: '' };
};

/**
 * 检查单位是否可以被目标（考虑隐身等效果）
 * @param {Object} targetUnit - 目标战斗单位
 * @param {Object} sourceUnit - 源战斗单位
 * @returns {Object} - 包含结果的对象 { canBeTargeted, reason }
 */
export const canUnitBeTargeted = (targetUnit, sourceUnit) => {
  if (!targetUnit) {
    return { canBeTargeted: false, reason: '目标单位不存在' };
  }

  if (targetUnit.isDefeated) {
    return { canBeTargeted: false, reason: '目标单位已被击败' };
  }

  // 检查是否有隐身效果
  if (isUnitAffectedByEffect(targetUnit, 'invisible')) {
    // 检查源单位是否有真视效果
    const hasTrueSight = sourceUnit && isUnitAffectedByEffect(sourceUnit, 'true_sight');
    if (!hasTrueSight) {
      return { canBeTargeted: false, reason: `${targetUnit.name} 处于隐身状态，无法被选中` };
    }
  }

  // 检查是否有强制目标效果
  const hasForcedTarget = sourceUnit && isUnitAffectedByEffect(sourceUnit, 'forced_target');
  if (hasForcedTarget) {
    // 获取强制目标的ID
    const forcedTargetBuff = sourceUnit.statusEffects.find(buff => 
      buff.effectType === 'forced_target' && buff.isActive !== false
    );
    if (forcedTargetBuff && forcedTargetBuff.targetId !== targetUnit.id) {
      return { canBeTargeted: false, reason: `${sourceUnit.name} 被强制选择其他目标` };
    }
  }

  // 检查是否有无法被选中效果
  if (isUnitAffectedByEffect(targetUnit, 'untargetable')) {
    return { canBeTargeted: false, reason: `${targetUnit.name} 无法被选中` };
  }

  return { canBeTargeted: true, reason: '' };
};

/**
 * 获取BUFF对单位属性的修饰值
 * @param {Object} targetUnit - 目标战斗单位
 * @param {string} attributeName - 属性名称
 * @returns {Object} - 包含固定值修改和倍率修改的对象 { flatModifier, percentModifier }
 */
export const getBuffModifiersForAttribute = (targetUnit, attributeName) => {
  if (!targetUnit || !targetUnit.statusEffects) {
    return { flatModifier: 0, percentModifier: 0 };
  }

  let flatModifier = 0;
  let percentModifier = 0;

  // 遍历所有状态效果
  targetUnit.statusEffects.forEach(buff => {
    // 只考虑已生效的BUFF
    if (buff.isActive === false) {
      return;
    }
    
    // 固定值修改
    if (buff.effectType === BUFF_EFFECT_TYPES.STAT_MODIFIER && buff.targetStat === attributeName) {
      flatModifier += buff.value * (buff.stacks || 1);
    }
    
    // 百分比修改
    if (buff.effectType === BUFF_EFFECT_TYPES.STAT_MULTIPLIER && buff.targetStat === attributeName) {
      percentModifier += buff.valueMultiplier * (buff.stacks || 1);
    }
  });

  return { flatModifier, percentModifier };
};

/**
 * 计算受BUFF影响后的属性值
 * @param {Object} targetUnit - 目标战斗单位
 * @param {string} attributeName - 属性名称
 * @returns {number} - 计算后的属性值
 */
export const calculateModifiedAttribute = (targetUnit, attributeName) => {
  if (!targetUnit || !targetUnit.derivedAttributes || targetUnit.derivedAttributes[attributeName] === undefined) {
    return 0;
  }

  const baseValue = targetUnit.derivedAttributes[attributeName];
  const { flatModifier, percentModifier } = getBuffModifiersForAttribute(targetUnit, attributeName);

  // 先应用固定值修改，再应用倍率修改
  const modifiedValue = (baseValue + flatModifier) * (1 + percentModifier);
  
  // 确保属性值不会小于0
  return Math.max(modifiedValue, 0);
};

/**
 * 计算伤害修正（考虑BUFF效果）
 * @param {Object} sourceUnit - 源战斗单位
 * @param {Object} targetUnit - 目标战斗单位
 * @param {number} baseDamage - 基础伤害值
 * @param {string} damageElement - 伤害元素类型
 * @returns {number} - 返回修正后的伤害值
 */
export const calculateDamageModifiers = (sourceUnit, targetUnit, baseDamage, damageElement) => {
  let modifiedDamage = baseDamage;

  const sourceBuffs = Array.isArray(sourceUnit?.statusEffects) ? sourceUnit.statusEffects : [];
  const targetBuffs = Array.isArray(targetUnit?.statusEffects) ? targetUnit.statusEffects : [];

  // 攻击方伤害加成
  sourceBuffs
    .filter(buff => buff.effectType === BUFF_EFFECT_TYPES.DAMAGE_BOOST && buff.isActive !== false)
    .forEach(buff => {
      modifiedDamage *= (buff.valueMultiplier || 1.0);
    });

  // 防御方易伤效果
  targetBuffs
    .filter(buff => buff.effectType === BUFF_EFFECT_TYPES.VULNERABILITY && buff.isActive !== false)
    .forEach(buff => {
      modifiedDamage *= (buff.valueMultiplier || 1.0);
    });

  // 防御方伤害减免
  targetBuffs
    .filter(buff => buff.effectType === BUFF_EFFECT_TYPES.DAMAGE_REDUCTION && buff.isActive !== false)
    .forEach(buff => {
      modifiedDamage *= (1 - (buff.value || 0));
    });
  
  // 检查目标是否被冻结（受到更多伤害）
  const freezeEffect = targetBuffs.find(
    buff => buff.effectType === BUFF_EFFECT_TYPES.FREEZE
  );
  if (freezeEffect) {
    modifiedDamage *= (freezeEffect.valueMultiplier || 1.5); // 默认增加50%伤害
  }

  // 其他伤害修正逻辑...

  return Math.max(modifiedDamage, 0);
};

/**
 * 处理伤害反弹效果
 * @param {Object} sourceUnit - 源战斗单位
 * @param {Object} targetUnit - 目标战斗单位
 * @param {number} damage - 造成的伤害值
 * @returns {Object} - 包含反弹结果的对象 { reflectedDamage, message }
 */
export const processReflectDamage = (sourceUnit, targetUnit, damage) => {
  if (!sourceUnit || !targetUnit) {
    return { reflectedDamage: 0 };
  }

  // 检查目标是否有反弹效果
  const reflectEffect = targetUnit.statusEffects.find(
    buff => buff.effectType === BUFF_EFFECT_TYPES.REFLECT && buff.isActive !== false
  );
  
  if (!reflectEffect) {
    return { reflectedDamage: 0 };
  }

  const reflectedDamage = Math.round(damage * reflectEffect.reflectPercentage);
  
  if (reflectedDamage > 0) {
    // 对源单位造成反弹伤害
    sourceUnit.derivedAttributes.currentHp = Math.max(sourceUnit.derivedAttributes.currentHp - reflectedDamage, 0);
    
    // 检查源单位是否被击败
    if (sourceUnit.derivedAttributes.currentHp <= 0) {
      sourceUnit.isDefeated = true;
      return { 
        reflectedDamage, 
        message: `${sourceUnit.name} 受到 ${reflectedDamage} 点反弹伤害并被击败了` 
      };
    }
    
    return { 
      reflectedDamage, 
      message: `${sourceUnit.name} 受到 ${reflectedDamage} 点反弹伤害` 
    };
  }

  return { reflectedDamage: 0 };
};

/**
 * 处理护盾吸收伤害
 * @param {Object} targetUnit - 目标战斗单位
 * @param {number} damage - 即将造成的伤害值
 * @returns {Object} - 包含护盾吸收结果的对象 { absorbedDamage, remainingDamage, message }
 */
export const processShieldAbsorption = (targetUnit, damage) => {
  if (!targetUnit) {
    return { absorbedDamage: 0, remainingDamage: damage };
  }

  let remainingDamage = damage;
  let totalAbsorbed = 0;
  const shieldMessages = [];

  // 获取所有护盾效果
  const shieldEffects = targetUnit.statusEffects.filter(
    buff => buff.effectType === BUFF_EFFECT_TYPES.SHIELD && buff.isActive !== false && buff.shieldValue > 0
  );

  // 按护盾值从小到大排序，优先消耗小护盾
  shieldEffects.sort((a, b) => a.shieldValue - b.shieldValue);

  // 依次使用护盾吸收伤害
  for (const shield of shieldEffects) {
    if (remainingDamage <= 0) break;

    const absorbed = Math.min(shield.shieldValue, remainingDamage);
    shield.shieldValue -= absorbed;
    remainingDamage -= absorbed;
    totalAbsorbed += absorbed;

    shieldMessages.push(`${shield.name} 吸收了 ${absorbed} 点伤害`);

    // 如果护盾值为0，标记为过期
    if (shield.shieldValue <= 0) {
      shield.remainingRounds = 0;
    }
  }

  // 移除值为0的护盾
  targetUnit.statusEffects = targetUnit.statusEffects.filter(
    buff => !(buff.effectType === BUFF_EFFECT_TYPES.SHIELD && buff.shieldValue <= 0)
  );

  return {
    absorbedDamage: totalAbsorbed,
    remainingDamage,
    message: totalAbsorbed > 0 ? `${targetUnit.name} 的护盾吸收了 ${totalAbsorbed} 点伤害` : '',
    shieldMessages
  };
};
