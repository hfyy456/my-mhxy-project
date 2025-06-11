/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-06 07:15:05
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-06 07:20:11
 */
/*
 * @Author: Cascade
 * @Date: 2025-05-26 12:00:00
 * @LastEditors: Cascade  
 * @LastEditTime: 2025-05-26 12:00:00
 */

import buffsConfig from './buffs.json';
import { ELEMENT_TYPES } from '../enumConfig';
import { generateUniqueId } from '@/utils/idUtils';

// BUFF类型枚举
export const BUFF_TYPES = {
  POSITIVE: 'positive',    // 正面效果
  NEGATIVE: 'negative',    // 负面效果
  NEUTRAL: 'neutral'       // 中性效果
};

// BUFF作用目标
export const BUFF_TARGET_TYPES = {
  SELF: 'self',            // 自身
  ALLY: 'ally',            // 友方
  ENEMY: 'enemy',          // 敌方
  ALL: 'all'               // 所有单位
};

// BUFF效果类型
export const BUFF_EFFECT_TYPES = {
  // 属性修改
  STAT_MODIFIER: 'stat_modifier',      // 修改属性值
  STAT_MULTIPLIER: 'stat_multiplier',  // 属性倍率修改

  // 控制效果
  STUN: 'stun',                // 眩晕，无法行动
  FREEZE: 'freeze',            // 冻结，无法行动且受到更多伤害
  SILENCE: 'silence',          // 沉默，无法使用技能
  ROOT: 'root',                // 定身，无法移动
  STEALTH: 'stealth',          // 隐身，无法被普通攻击
  FEAR: 'fear',                // 恐惧，可能无法行动

  // 持续伤害/恢复
  DOT: 'damage_over_time',     // 持续伤害
  HOT: 'heal_over_time',       // 持续治疗
  
  // 护盾效果
  SHIELD: 'shield',            // 护盾，吸收伤害
  
  // 特殊效果
  REFLECT: 'reflect',          // 反弹伤害
  IMMUNITY: 'immunity',        // 免疫特定效果
  CLEANSE: 'cleanse',          // 清除特定效果
  SPECIAL: 'special'           // 特殊效果
};

// BUFF应用方式
export const BUFF_APPLY_TYPES = {
  STACK: 'stack',              // 可叠加，效果累加
  REFRESH: 'refresh',          // 刷新持续时间
  REPLACE: 'replace',          // 替换现有效果
  HIGHEST: 'highest'           // 保留最高效果
};

// 枚举值映射表
const ENUM_MAPPINGS = {
  // BUFF类型映射
  'positive': BUFF_TYPES.POSITIVE,
  'negative': BUFF_TYPES.NEGATIVE,
  'neutral': BUFF_TYPES.NEUTRAL,

  // BUFF效果类型映射
  'stat_modifier': BUFF_EFFECT_TYPES.STAT_MODIFIER,
  'stat_multiplier': BUFF_EFFECT_TYPES.STAT_MULTIPLIER,
  'stun': BUFF_EFFECT_TYPES.STUN,
  'freeze': BUFF_EFFECT_TYPES.FREEZE,
  'silence': BUFF_EFFECT_TYPES.SILENCE,
  'root': BUFF_EFFECT_TYPES.ROOT,
  'stealth': BUFF_EFFECT_TYPES.STEALTH,
  'fear': BUFF_EFFECT_TYPES.FEAR,
  'damage_over_time': BUFF_EFFECT_TYPES.DOT,
  'heal_over_time': BUFF_EFFECT_TYPES.HOT,
  'shield': BUFF_EFFECT_TYPES.SHIELD,
  'reflect': BUFF_EFFECT_TYPES.REFLECT,
  'immunity': BUFF_EFFECT_TYPES.IMMUNITY,
  'cleanse': BUFF_EFFECT_TYPES.CLEANSE,
  'special': BUFF_EFFECT_TYPES.SPECIAL,

  // BUFF应用方式映射
  'stack': BUFF_APPLY_TYPES.STACK,
  'refresh': BUFF_APPLY_TYPES.REFRESH,
  'replace': BUFF_APPLY_TYPES.REPLACE,
  'highest': BUFF_APPLY_TYPES.HIGHEST,

  // 元素类型映射
  'fire': ELEMENT_TYPES.FIRE,
  'water': ELEMENT_TYPES.WATER,
  'thunder': ELEMENT_TYPES.THUNDER,
  'earth': ELEMENT_TYPES.EARTH,
  'wind': ELEMENT_TYPES.WIND,
  'poison': ELEMENT_TYPES.POISON
};

/**
 * 将字符串值转换为对应的枚举常量
 * @param {string} value - 字符串值
 * @returns {*} - 对应的枚举常量，如果没有映射则返回原值
 */
const convertToEnum = (value) => {
  return ENUM_MAPPINGS[value] || value;
};

/**
 * 递归转换对象中的枚举值
 * @param {*} obj - 要转换的对象
 * @returns {*} - 转换后的对象
 */
const convertObjectEnums = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(convertObjectEnums);
  }
  
  if (obj && typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertObjectEnums(value);
    }
    return converted;
  }
  
  if (typeof obj === 'string') {
    return convertToEnum(obj);
  }
  
  return obj;
};

// 转换buff配置中的枚举值
const processedBuffsConfig = buffsConfig.map(buff => convertObjectEnums(buff));

/**
 * 获取所有buff配置
 * @returns {Array} - buff配置数组
 */
export const getAllBuffs = () => {
  return [...processedBuffsConfig];
};

/**
 * 根据ID获取buff配置
 * @param {string} id - buff ID
 * @returns {Object|null} - buff配置对象，如果未找到则返回null
 */
export const getBuffById = (id) => {
  return processedBuffsConfig.find(buff => buff.id === id) || null;
};

/**
 * 根据类型获取buff列表
 * @param {string} type - buff类型 ('positive', 'negative', 'neutral')
 * @returns {Array} - 指定类型的buff配置数组
 */
export const getBuffsByType = (type) => {
  const enumType = convertToEnum(type);
  return processedBuffsConfig.filter(buff => buff.type === enumType);
};

/**
 * 根据效果类型获取buff列表
 * @param {string} effectType - buff效果类型
 * @returns {Array} - 指定效果类型的buff配置数组
 */
export const getBuffsByEffectType = (effectType) => {
  const enumEffectType = convertToEnum(effectType);
  return processedBuffsConfig.filter(buff => buff.effectType === enumEffectType);
};

/**
 * 根据元素类型获取buff列表
 * @param {string} elementType - 元素类型
 * @returns {Array} - 指定元素类型的buff配置数组
 */
export const getBuffsByElement = (elementType) => {
  const enumElementType = convertToEnum(elementType);
  return processedBuffsConfig.filter(buff => 
    buff.elementType === enumElementType || 
    buff.damageElement === enumElementType
  );
};

/**
 * 检查buff是否为永久效果
 * @param {string} buffId - buff ID
 * @returns {boolean} - 是否为永久效果
 */
export const isBuffPermanent = (buffId) => {
  const buff = getBuffById(buffId);
  return buff && buff.durationRounds === -1;
};

/**
 * 检查buff是否可叠加
 * @param {string} buffId - buff ID
 * @returns {boolean} - 是否可叠加
 */
export const isBuffStackable = (buffId) => {
  const buff = getBuffById(buffId);
  return buff && buff.applyType === BUFF_APPLY_TYPES.STACK && buff.maxStacks > 1;
};

/**
 * 创建buff实例
 * @param {string} buffId - buff ID
 * @param {string} sourceUnitId - 施加buff的单位ID
 * @param {number} level - buff等级
 * @returns {Object|null} - buff实例，如果buff不存在则返回null
 */
export const createBuffInstance = (buffId, sourceUnitId, level = 1) => {
  const buffConfig = getBuffById(buffId);
  if (!buffConfig) return null;

  const instance = {
    instanceId: generateUniqueId('buff'), // 引入真正唯一的实例ID
    id: buffConfig.id,                     // 保留原始的配置ID
    buffId,                                // 兼容旧代码，buffId就是配置ID
    name: buffConfig.name,
    description: buffConfig.description,
    icon: buffConfig.icon,
    type: buffConfig.type,
    effectType: buffConfig.effectType,
    sourceUnitId,
    level,
    stacks: 1,
    remainingRounds: buffConfig.durationRounds,
    ...Object.fromEntries(
      Object.entries(buffConfig).filter(([key]) => 
        !['id', 'name', 'description', 'icon', 'type', 'effectType', 'maxStacks', 'durationRounds'].includes(key)
      )
    )
  };
  
  // 移除旧的不稳定的id生成方式
  delete instance.id;
  instance.id = buffConfig.id;

  return instance;
};

// 导出buff配置数组（向后兼容）
export const buffConfig = processedBuffsConfig;

// 默认导出
export default {
  getAllBuffs,
  getBuffById,
  getBuffsByType,
  getBuffsByEffectType,
  getBuffsByElement,
  isBuffPermanent,
  isBuffStackable,
  createBuffInstance,
  buffConfig: processedBuffsConfig,
  BUFF_TYPES,
  BUFF_TARGET_TYPES,
  BUFF_EFFECT_TYPES,
  BUFF_APPLY_TYPES
}; 