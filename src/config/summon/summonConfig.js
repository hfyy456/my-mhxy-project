/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-26 04:04:47
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-05 03:56:12
 */
// import { raceConfig } from "./raceConfig"; // Removed raceConfig import
import { skillConfig } from "../skill/skillConfig";
import {
  PET_TYPES,
  // RACE_TYPES, // Removed RACE_TYPES import
  GROWTH_RATE_TIERS,
  COLOR_TYPES,
  ATTRIBUTE_TYPES,
  FIVE_ELEMENTS,
  QUALITY_TYPES, // Added QUALITY_TYPES import
} from "../enumConfig";
import summonConfigData from './allSummons.json';

// 攻击距离说明：
// 最小攻击距离为2，表示从左到右，第3排可以打到第5排，第2排可以打到第4排
// 攻击距离为5时，第1排可以打到第6排

// 处理枚举类型转换的辅助函数
const convertSummonEnumTypes = (config) => {
  const converted = JSON.parse(JSON.stringify(config)); // 深拷贝
  
  Object.keys(converted).forEach(key => {
    const summon = converted[key];
    
    // 转换五行属性
    switch(summon.fiveElement) {
      case 'metal':
        summon.fiveElement = FIVE_ELEMENTS.METAL;
        break;
      case 'wood':
        summon.fiveElement = FIVE_ELEMENTS.WOOD;
        break;
      case 'water':
        summon.fiveElement = FIVE_ELEMENTS.WATER;
        break;
      case 'fire':
        summon.fiveElement = FIVE_ELEMENTS.FIRE;
        break;
      case 'earth':
        summon.fiveElement = FIVE_ELEMENTS.EARTH;
        break;
    }
    
    // 转换品质类型
    switch(summon.quality) {
      case 'normal':
        summon.quality = QUALITY_TYPES.NORMAL;
        break;
      case 'rare':
        summon.quality = QUALITY_TYPES.RARE;
        break;
      case 'epic':
        summon.quality = QUALITY_TYPES.EPIC;
        break;
      case 'legendary':
        summon.quality = QUALITY_TYPES.LEGENDARY;
        break;
      case 'mythic':
        summon.quality = QUALITY_TYPES.MYTHIC;
        break;
    }
    
    // 转换宠物类型
    switch(summon.type) {
      case 'physical':
        summon.type = PET_TYPES.PHYSICAL;
        break;
      case 'magical':
        summon.type = PET_TYPES.MAGICAL;
        break;
      case 'defense':
        summon.type = PET_TYPES.DEFENSE;
        break;
      case 'speed':
        summon.type = PET_TYPES.SPEED;
        break;
      case 'support':
        summon.type = PET_TYPES.SUPPORT;
        break;
    }
    
    // 转换颜色类型（对于预定义的颜色）
    switch(summon.color) {
      case 'blue':
        summon.color = COLOR_TYPES.BLUE;
        break;
      case 'amber':
        summon.color = COLOR_TYPES.AMBER;
        break;
      case 'yellow':
        summon.color = COLOR_TYPES.YELLOW;
        break;
      case 'green':
        summon.color = COLOR_TYPES.GREEN;
        break;
      case 'brown':
        summon.color = COLOR_TYPES.BROWN;
        break;
      // 对于其他颜色保持原样（如 orange-500, pink-500 等）
    }
    
    // 转换成长率对象的键
    if (summon.growthRates) {
      const newGrowthRates = {};
      Object.keys(summon.growthRates).forEach(attr => {
        switch(attr) {
          case 'constitution':
            newGrowthRates[ATTRIBUTE_TYPES.CONSTITUTION] = summon.growthRates[attr];
            break;
          case 'strength':
            newGrowthRates[ATTRIBUTE_TYPES.STRENGTH] = summon.growthRates[attr];
            break;
          case 'agility':
            newGrowthRates[ATTRIBUTE_TYPES.AGILITY] = summon.growthRates[attr];
            break;
          case 'intelligence':
            newGrowthRates[ATTRIBUTE_TYPES.INTELLIGENCE] = summon.growthRates[attr];
            break;
          case 'luck':
            newGrowthRates[ATTRIBUTE_TYPES.LUCK] = summon.growthRates[attr];
            break;
        }
      });
      summon.growthRates = newGrowthRates;
    }
    
    // 转换属性范围对象的键
    if (summon.basicAttributeRanges) {
      const newAttributeRanges = {};
      Object.keys(summon.basicAttributeRanges).forEach(attr => {
        switch(attr) {
          case 'constitution':
            newAttributeRanges[ATTRIBUTE_TYPES.CONSTITUTION] = summon.basicAttributeRanges[attr];
            break;
          case 'strength':
            newAttributeRanges[ATTRIBUTE_TYPES.STRENGTH] = summon.basicAttributeRanges[attr];
            break;
          case 'agility':
            newAttributeRanges[ATTRIBUTE_TYPES.AGILITY] = summon.basicAttributeRanges[attr];
            break;
          case 'intelligence':
            newAttributeRanges[ATTRIBUTE_TYPES.INTELLIGENCE] = summon.basicAttributeRanges[attr];
            break;
          case 'luck':
            newAttributeRanges[ATTRIBUTE_TYPES.LUCK] = summon.basicAttributeRanges[attr];
            break;
        }
      });
      summon.basicAttributeRanges = newAttributeRanges;
    }
  });
  
  return converted;
};

// 宠物配置
export const summonConfig = convertSummonEnumTypes(summonConfigData);

/**
 * 根据召唤兽类型获取调整后的成长率
 * @param {string} summonSourceId - 召唤兽ID
 * @param {string} natureType - 召唤兽类型 (wild/baby/mutant)
 * @returns {Object} 调整后的成长率对象
 */
export const getAdjustedGrowthRates = (summonSourceId, natureType = 'wild') => {
  const summonData = summonConfig[summonSourceId];
  if (!summonData || !summonData.growthRates) {
    return {};
  }

  // 动态导入召唤兽类型配置
  import('../enumConfig').then(({ SUMMON_NATURE_TYPES, SUMMON_NATURE_CONFIG }) => {
    const currentNatureType = natureType || SUMMON_NATURE_TYPES.WILD;
    const natureConfig = SUMMON_NATURE_CONFIG[currentNatureType] || SUMMON_NATURE_CONFIG[SUMMON_NATURE_TYPES.WILD];
    
    const adjustedGrowthRates = {};
    Object.keys(summonData.growthRates).forEach(attr => {
      adjustedGrowthRates[attr] = summonData.growthRates[attr] * natureConfig.growthRateMultiplier;
    });
    
    return adjustedGrowthRates;
  });

  // 临时返回原成长率，实际使用时需要异步处理
  return summonData.growthRates;
};

/**
 * 同步版本：根据召唤兽类型获取调整后的成长率
 * @param {string} summonSourceId - 召唤兽ID
 * @param {string} natureType - 召唤兽类型 (wild/baby/mutant)
 * @param {Object} natureConfig - 召唤兽类型配置对象
 * @returns {Object} 调整后的成长率对象
 */
export const getAdjustedGrowthRatesSync = (summonSourceId, natureType = 'wild', natureConfig) => {
  const summonData = summonConfig[summonSourceId];
  if (!summonData || !summonData.growthRates) {
    return {};
  }

  if (!natureConfig) {
    // 如果没有传入配置，返回原成长率
    return summonData.growthRates;
  }

  const adjustedGrowthRates = {};
  Object.keys(summonData.growthRates).forEach(attr => {
    adjustedGrowthRates[attr] = summonData.growthRates[attr] * natureConfig.growthRateMultiplier;
  });
  
  return adjustedGrowthRates;
};