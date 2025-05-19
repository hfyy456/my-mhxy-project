/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-19 05:26:54
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-19 05:32:21
 */
import { petConfig } from '@/config/petConfig';
import { qualityConfig, derivedAttributeConfig, levelExperienceRequirements } from '@/config/config';
import { getRaceBonus } from '@/config/raceConfig';
import { unlockPet } from '@/store/slices/petCatalogSlice';
import { generateUniqueId } from '@/utils/idUtils';

/**
 * 计算召唤兽的派生属性
 * @param {Object} basicAttributesWithPoints - 基础属性加点后的值
 * @param {Object} equippedItemsDataMap - 装备数据映射
 * @param {number} currentLevel - 当前等级
 * @param {string} race - 种族
 * @returns {Object} 派生属性计算结果
 */
export const calculateDerivedAttributes = (basicAttributesWithPoints, equippedItemsDataMap, currentLevel, race) => {
  const derived = {};
  const equipmentContributions = {}; // 装备提供的所有加成
  const equipmentBonusesToBasic = {}; // 装备对基础属性的加成

  const finalBasicAttributes = { ...basicAttributesWithPoints };

  // 1. 累加装备对基础属性的直接加成
  if (equippedItemsDataMap) {
    for (const slot in equippedItemsDataMap) {
      const item = equippedItemsDataMap[slot];
      if (item && item.finalEffects) {
        for (const effectKey in item.finalEffects) {
          const value = item.finalEffects[effectKey];
          if (finalBasicAttributes.hasOwnProperty(effectKey)) {
            finalBasicAttributes[effectKey] = (finalBasicAttributes[effectKey] || 0) + value;
            equipmentBonusesToBasic[effectKey] = (equipmentBonusesToBasic[effectKey] || 0) + value;
          }
          // 记录所有装备效果
          equipmentContributions[effectKey] = (equipmentContributions[effectKey] || 0) + value;
        }
      }
    }
  }
  
  // 应用种族加成
  if (race) {
    for (const attrKey in finalBasicAttributes) {
      const raceBonus = getRaceBonus(race, attrKey);
      finalBasicAttributes[attrKey] = Math.floor(finalBasicAttributes[attrKey] * raceBonus);
    }
  }

  // 2. 基于最终基础属性计算派生属性
  for (const [attrKey, config] of Object.entries(derivedAttributeConfig)) {
    let value = 0;
    for (const baseAttr of config.attributes) {
      value += (finalBasicAttributes[baseAttr] || 0) * config.multiplier;
    }

    // 检查装备是否直接增加这个派生属性
    if (equipmentContributions.hasOwnProperty(attrKey) && !basicAttributesWithPoints.hasOwnProperty(attrKey)) {
      value += equipmentContributions[attrKey];
    }
    
    if (["critRate", "critDamage", "dodgeRate"].includes(attrKey)) {
      derived[attrKey] = parseFloat(value.toFixed(5));
    } else {
      derived[attrKey] = Math.floor(value);
    }
  }

  return {
    derivedAttributes: derived,
    equipmentContributions,
    equipmentBonusesToBasic,
  };
};

/**
 * 获取指定等级所需的经验值
 * @param {number} level - 等级
 * @returns {number} 所需经验值
 */
export const getExperienceForLevel = (level) => {
  if (level >= 0 && level < levelExperienceRequirements.length && levelExperienceRequirements[level] !== null) {
    return levelExperienceRequirements[level];
  }
  return Infinity;
};

/**
 * 生成新的召唤兽数据
 * @param {Object} params - 生成召唤兽所需的参数
 * @param {string} params.petId - 召唤兽的ID
 * @param {string} params.quality - 召唤兽的品质
 * @param {'incubation' | 'refinement' | 'capture' | 'gift'} params.source - 召唤兽的来源
 * @param {Function} params.dispatch - Redux dispatch 函数
 * @returns {Object} 新的召唤兽数据
 */
export const generateNewSummon = ({ petId, quality, source, dispatch }) => {
  // 记录到图鉴
  if (dispatch) {
    dispatch(unlockPet({
      petId,
      quality
    }));
  }

  const petData = petConfig[petId];
  if (!petData) {
    throw new Error(`找不到召唤兽配置：${petId}`);
  }

  // 生成唯一ID
  const summonId = generateUniqueId('summon');

  // 基础数据结构
  const newSummon = {
    id: summonId,
    petId: petId,
    nickname: petData.name,
    level: 1,
    quality: quality,
    experience: 0,
    potentialPoints: 0,
    allocatedPoints: {
      constitution: 0,
      strength: 0,
      agility: 0,
      intelligence: 0,
      luck: 0
    },
    basicAttributes: petData.basicAttributeRanges ? {
      constitution: getRandomAttribute(...petData.basicAttributeRanges.constitution),
      strength: getRandomAttribute(...petData.basicAttributeRanges.strength),
      agility: getRandomAttribute(...petData.basicAttributeRanges.agility),
      intelligence: getRandomAttribute(...petData.basicAttributeRanges.intelligence),
      luck: getRandomAttribute(...petData.basicAttributeRanges.luck)
    } : {},
    skillSet: petData.initialSkills || [],
    equippedItemIds: {},
    race: petData.race,
    source: source, // 记录召唤兽的来源
    obtainedAt: new Date().toISOString(), // 获得时间
  };

  // 根据品质调整属性
  if (quality) {
    const qualityIndex = qualityConfig.names.indexOf(quality);
    const qualityMultiplier = qualityConfig.attributeMultipliers[qualityIndex] || 1;
    Object.keys(newSummon.basicAttributes).forEach(attr => {
      newSummon.basicAttributes[attr] = Math.floor(newSummon.basicAttributes[attr] * qualityMultiplier);
    });
  }

  return newSummon;
};

/**
 * 获取随机属性值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机属性值
 */
const getRandomAttribute = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

