/**
 * 装备效果计算工具函数
 * 支持数值和百分比两种加成方式
 */

/**
 * 计算装备效果的实际数值
 * @param {Object} effect - 效果对象或数字
 * @param {number} baseValue - 基础属性值（用于百分比计算）
 * @param {string} effectKey - 效果键名（用于判断是否是百分比属性）
 * @returns {number} - 计算后的效果值
 */
export const calculateEffectValue = (effect, baseValue = 0, effectKey = '') => {
  // 处理旧格式（直接数字）
  if (typeof effect === 'number') {
    return effect;
  }
  
  // 处理新格式（对象）
  if (effect && typeof effect === 'object') {
    const { type, value } = effect;
    
    if (type === 'percent') {
      // 百分比加成：基础值 * (百分比 / 100)
      return Math.round(baseValue * (value / 100));
    } else {
      // 数值加成：直接返回数值
      return value || 0;
    }
  }
  
  return 0;
};

/**
 * 计算装备对召唤兽属性的总加成
 * @param {Array} equippedItems - 已装备的物品数组
 * @param {Object} baseAttributes - 召唤兽基础属性
 * @returns {Object} - 各属性的加成值
 */
export const calculateTotalEquipmentBonus = (equippedItems, baseAttributes = {}) => {
  const bonuses = {};
  
  if (!equippedItems || !Array.isArray(equippedItems)) {
    return bonuses;
  }
  
  // 遍历所有装备
  equippedItems.forEach(item => {
    if (item && item.effects) {
      // 遍历装备的所有效果
      Object.entries(item.effects).forEach(([effectKey, effect]) => {
        const baseValue = baseAttributes[effectKey] || 0;
        const effectValue = calculateEffectValue(effect, baseValue, effectKey);
        
        bonuses[effectKey] = (bonuses[effectKey] || 0) + effectValue;
      });
    }
  });
  
  return bonuses;
};

/**
 * 格式化效果值用于显示
 * @param {string} effectKey - 效果键名
 * @param {Object|number} effect - 效果值
 * @returns {string} - 格式化后的显示文本
 */
export const formatEffectDisplay = (effectKey, effect) => {
  // 百分比属性列表
  const percentageAttributes = [
    'critRate', 'critDamage', 'dodgeRate',
    'fireResistance', 'waterResistance', 'thunderResistance',
    'poisonResistance', 'controlResistance'
  ];
  
  if (typeof effect === 'number') {
    // 兼容旧格式
    if (percentageAttributes.includes(effectKey)) {
      return `${(effect * 100).toFixed(1)}%`;
    }
    return `+${effect}`;
  } else if (effect && typeof effect === 'object') {
    // 新格式
    const { type, value } = effect;
    if (type === 'percent') {
      return `+${value}%`;
    } else {
      return `+${value}`;
    }
  }
  return '';
};

/**
 * 获取属性的中文显示名称
 * @param {string} attributeKey - 属性键名
 * @returns {string} - 中文名称
 */
export const getAttributeDisplayName = (attributeKey) => {
  const attributeNames = {
    // 基础属性
    constitution: '体质',
    strength: '力量',
    agility: '敏捷',
    intelligence: '智力',
    luck: '运气',
    
    // 衍生属性
    hp: '生命值',
    mp: '法力值',
    physicalAttack: '物理攻击',
    magicalAttack: '法术攻击',
    physicalDefense: '物理防御',
    magicalDefense: '法术防御',
    speed: '速度',
    
    // 特殊属性
    critRate: '暴击率',
    critDamage: '暴击伤害',
    dodgeRate: '闪避率',
    hpRecovery: '生命恢复',
    mpRecovery: '法力恢复',
    
    // 抗性属性
    fireResistance: '火焰抗性',
    waterResistance: '水系抗性',
    thunderResistance: '雷电抗性',
    poisonResistance: '毒素抗性',
    controlResistance: '控制抗性',
    
    // 移除旧的兼容性属性名
  };
  
  return attributeNames[attributeKey] || attributeKey;
};

/**
 * 验证效果配置是否有效
 * @param {Object} effects - 效果配置对象
 * @returns {Object} - 验证结果 { isValid: boolean, errors: string[] }
 */
export const validateEffectConfig = (effects) => {
  const errors = [];
  
  if (!effects || typeof effects !== 'object') {
    return { isValid: true, errors: [] };
  }
  
  Object.entries(effects).forEach(([key, effect]) => {
    if (typeof effect === 'object') {
      const { type, value } = effect;
      
      // 检查类型是否有效
      if (!['flat', 'percent'].includes(type)) {
        errors.push(`${key}: 无效的效果类型 '${type}'`);
      }
      
      // 检查数值是否有效
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push(`${key}: 无效的效果数值 '${value}'`);
      }
      
      // 检查百分比值的合理范围
      if (type === 'percent' && (value < 0 || value > 1000)) {
        errors.push(`${key}: 百分比值应该在0-1000之间`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 迁移旧格式的装备效果到新格式
 * @param {Object} oldEffects - 旧格式的效果对象
 * @returns {Object} - 新格式的效果对象
 */
export const migrateEffectFormat = (oldEffects) => {
  if (!oldEffects || typeof oldEffects !== 'object') {
    return {};
  }
  
  const newEffects = {};
  const percentageAttributes = [
    'critRate', 'critDamage', 'dodgeRate',
    'fireResistance', 'waterResistance', 'thunderResistance',
    'poisonResistance', 'controlResistance'
  ];
  
  Object.entries(oldEffects).forEach(([key, value]) => {
    if (typeof value === 'number') {
      // 如果是百分比属性，保持原有格式
      if (percentageAttributes.includes(key)) {
        newEffects[key] = value;
      } else {
        // 其他属性转换为新格式的数值加成
        newEffects[key] = {
          type: 'flat',
          value: value
        };
      }
    } else {
      // 已经是新格式或其他格式，直接保留
      newEffects[key] = value;
    }
  });
  
  return newEffects;
}; 