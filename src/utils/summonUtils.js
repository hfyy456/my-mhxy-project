/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-19 05:26:54
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-19 05:32:21
 */
import { petConfig } from '@/config/pet/petConfig';
import { qualityConfig, derivedAttributeConfig, levelExperienceRequirements } from '@/config/config';
import { getRaceBonus } from '@/config/pet/raceConfig';
import { unlockPet } from '@/store/slices/petCatalogSlice';
import { generateUniqueId } from '@/utils/idUtils';
import { UNIQUE_ID_PREFIXES, SUMMON_SOURCES, EQUIPMENT_EFFECT_TYPES } from "@/config/enumConfig";

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

    if (equipmentContributions.hasOwnProperty(attrKey) && !basicAttributesWithPoints.hasOwnProperty(attrKey)) {
      value += equipmentContributions[attrKey];
    }
    
    // Corrected: Use EQUIPMENT_EFFECT_TYPES and ensure values are compared consistently (e.g., all lowercase)
    // Assuming attrKey from derivedAttributeConfig is 'critRate', 'critDamage', 'dodgeRate'
    // and EQUIPMENT_EFFECT_TYPES values are also these exact strings.
    const criticalAttributeKeys = [
      EQUIPMENT_EFFECT_TYPES.CRIT_RATE,
      EQUIPMENT_EFFECT_TYPES.CRIT_DAMAGE,
      EQUIPMENT_EFFECT_TYPES.DODGE_RATE
    ];

    if (criticalAttributeKeys.includes(attrKey)) {
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
 * 获取随机属性值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机属性值
 */
const getRandomAttribute = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 从正态分布中采样一个值
 * 使用 Box-Muller transform
 * @param {number} mean - 均值
 * @param {number} stdDev - 标准差
 * @returns {number} 采样值
 */
const sampleNormal = (mean, stdDev) => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // z is N(0,1). Scale and shift to N(mean, stdDev^2)
  return z * stdDev + mean;
};

// Function to shuffle an array (Fisher-Yates shuffle)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * 生成新的召唤兽数据
 * @param {Object} params - 生成召唤兽所需的参数
 * @param {string} params.petId - 召唤兽的ID
 * @param {string} params.quality - 召唤兽的品质
 * @param {SUMMON_SOURCES[keyof SUMMON_SOURCES]} params.source - 召唤兽的来源 (using enum values)
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

  const summonId = generateUniqueId(UNIQUE_ID_PREFIXES.SUMMON);

  let finalSkillSet = [];

  // 1. 添加必带技能
  if (petData.guaranteedInitialSkills && Array.isArray(petData.guaranteedInitialSkills)) {
    finalSkillSet = [...petData.guaranteedInitialSkills];
  }

  // 2. 从技能池中按正态分布选择额外技能
  if (petData.initialSkillPool && Array.isArray(petData.initialSkillPool) && petData.initialSkillPool.length > 0) {
    const mean = typeof petData.initialSkillCountMean === 'number' ? petData.initialSkillCountMean : 1;
    const stdDev = typeof petData.initialSkillCountStdDev === 'number' ? petData.initialSkillCountStdDev : 0.5;
    
    // 创建一个候选技能池，排除已在 finalSkillSet 中的技能 (必带技能)
    const candidateSkillPool = petData.initialSkillPool.filter(skill => !finalSkillSet.includes(skill));

    if (candidateSkillPool.length > 0) {
      let numSkillsToAssign = Math.round(sampleNormal(mean, stdDev));
      numSkillsToAssign = Math.max(0, numSkillsToAssign); // 确保非负
      // 确保不超过候选技能池大小
      numSkillsToAssign = Math.min(numSkillsToAssign, candidateSkillPool.length); 

      if (numSkillsToAssign > 0) {
        const shuffledPool = shuffleArray(candidateSkillPool); // 打乱候选技能池
        const newSkills = shuffledPool.slice(0, numSkillsToAssign);
        finalSkillSet = [...finalSkillSet, ...newSkills];
      }
    }
  } else if (!petData.guaranteedInitialSkills && petData.initialSkills && Array.isArray(petData.initialSkills)) {
    // 回退逻辑: 如果没有任何必带技能或新技能池配置，但有旧的 initialSkills 配置
    finalSkillSet = petData.initialSkills;
  }
  // 确保最终技能列表中的技能是唯一的 (尽管上面的逻辑试图避免重复)
  finalSkillSet = [...new Set(finalSkillSet)];

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
    skillSet: finalSkillSet, // 使用新生成的技能列表
    equippedItemIds: {},
    race: petData.race,
    source: source,
    obtainedAt: new Date().toISOString(),
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

