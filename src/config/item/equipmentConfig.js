/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-06 04:30:00
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-06 04:35:39
 */
import { qualityConfig } from '@/config/config';
import { QUALITY_TYPES } from '../enumConfig';
import { calculateEffectValue } from '@/utils/equipmentEffectUtils';

/**
 * 装备品质配置
 * - names: 品质名称数组
 * - colors: 品质对应的颜色
 * - effectMultiplier: 属性效果倍率
 * - weights: 随机生成权重
 * - valueMultiplier: 价值倍率
 * - levelBonus: 等级加成
 */
export const equipmentQualityConfig = {
  names: Object.values(QUALITY_TYPES),
  colors: qualityConfig.colors,
  effectMultiplier: qualityConfig.attributeMultipliers,
  weights: {
    [QUALITY_TYPES.NORMAL]: 50,
    [QUALITY_TYPES.RARE]: 25,
    [QUALITY_TYPES.EPIC]: 15,
    [QUALITY_TYPES.LEGENDARY]: 8,
    [QUALITY_TYPES.MYTHIC]: 2,
  },
  valueMultiplier: {
    [QUALITY_TYPES.NORMAL]: 1,
    [QUALITY_TYPES.RARE]: 2.5,
    [QUALITY_TYPES.EPIC]: 5,
    [QUALITY_TYPES.LEGENDARY]: 10,
    [QUALITY_TYPES.MYTHIC]: 20,
  },
  levelBonus: {
    [QUALITY_TYPES.NORMAL]: 0,
    [QUALITY_TYPES.RARE]: 5,
    [QUALITY_TYPES.EPIC]: 10,
    [QUALITY_TYPES.LEGENDARY]: 15,
    [QUALITY_TYPES.MYTHIC]: 20,
  }
};

/**
 * 根据权重随机生成一个品质
 * @returns {string} 品质名称 (e.g., 'rare')
 */
export function generateRandomQuality() {
  const totalWeight = Object.values(equipmentQualityConfig.weights).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const quality in equipmentQualityConfig.weights) {
    if (random < equipmentQualityConfig.weights[quality]) {
      return quality;
    }
    random -= equipmentQualityConfig.weights[quality];
  }
  return QUALITY_TYPES.NORMAL;
}

/**
 * 将品质应用到基础装备上，生成最终的装备实例
 * @param {object} baseEquipment - 基础装备模板
 * @param {string} quality - 目标品质
 * @returns {object} - 带有品质和动态属性的最终装备对象
 */
export function applyQualityToEquipment(baseEquipment, quality) {
  if (!baseEquipment || !quality) {
    return baseEquipment;
  }
  
  const qualityIndex = equipmentQualityConfig.names.indexOf(quality);
  if (qualityIndex === -1) {
    return { ...baseEquipment, quality: QUALITY_TYPES.NORMAL };
  }

  const effectMultiplier = equipmentQualityConfig.effectMultiplier[qualityIndex] || 1;
  const valueMultiplier = equipmentQualityConfig.valueMultiplier[quality] || 1;
  const levelBonus = equipmentQualityConfig.levelBonus[quality] || 0;

  // 计算新的效果
  const newEffects = {};
  if(baseEquipment.effects) {
    for (const key in baseEquipment.effects) {
      const baseEffect = baseEquipment.effects[key];
      
      // 处理新格式的效果
      if (typeof baseEffect === 'object' && baseEffect.type && baseEffect.value !== undefined) {
        newEffects[key] = {
          type: baseEffect.type,
          value: baseEffect.type === 'percent' 
            ? parseFloat((baseEffect.value * effectMultiplier).toFixed(4))
            : Math.round(baseEffect.value * effectMultiplier)
        };
      } 
      // 处理旧格式的效果（数字）
      else if (typeof baseEffect === 'number') {
        // 对非百分比类的效果进行缩放
        if (baseEffect > -1 && baseEffect < 1) { // 假设百分比类属性值在-1到1之间
          newEffects[key] = parseFloat((baseEffect * effectMultiplier).toFixed(4));
        } else {
          newEffects[key] = Math.round(baseEffect * effectMultiplier);
        }
      } 
      // 其他情况直接保留
      else {
        newEffects[key] = baseEffect;
      }
    }
  }

  // 计算新的等级和价值
  const baseLevel = baseEquipment.requirements?.level || 1;
  const finalLevel = baseLevel + levelBonus;
  
  const baseValue = baseEquipment.value || 10;
  const finalValue = Math.round(baseValue * valueMultiplier);

  return { 
    ...baseEquipment,
    quality,
    effects: newEffects,
    level: finalLevel,
    value: finalValue,
    requirements: {
      ...baseEquipment.requirements,
      level: finalLevel
    }
  };
} 