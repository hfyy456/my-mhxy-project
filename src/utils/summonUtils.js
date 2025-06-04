/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-19 05:26:54
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-05 06:31:53
 */
import { summonConfig } from '../config/summon/summonConfig';
import { qualityConfig, derivedAttributeConfig, levelExperienceRequirements } from '../config/config';
import { unlockSummon } from '../store/slices/summonCatalogSlice';
import { generateUniqueId } from './idUtils';
import { UNIQUE_ID_PREFIXES, SUMMON_SOURCES, EQUIPMENT_EFFECT_TYPES, ATTRIBUTE_TYPES } from "../config/enumConfig";
import { SUMMON_NATURE_TYPES, SUMMON_NATURE_CONFIG } from '../config/enumConfig';
import { personalityConfig, getRandomPersonalityId, PERSONALITY_EFFECT_MODIFIER, PERSONALITY_TYPES,EXTREME_POSITIVE_MODIFIER } from '../config/summon/personalityConfig';

/**
 * 计算召唤兽的派生属性
 * @param {Object} basicAttributesWithPoints - 基础属性加点后的值
 * @param {Object} equippedItemsDataMap - 装备数据映射
 * @param {number} currentLevel - 当前等级
 * @returns {Object} 派生属性计算结果
 */
export const calculateDerivedAttributes = (basicAttributesWithPoints, equippedItemsDataMap, currentLevel) => {
  console.log('[calculateDerivedAttributes] 输入参数:');
  console.log('  basicAttributesWithPoints:', basicAttributesWithPoints);
  console.log('  equippedItemsDataMap:', equippedItemsDataMap);
  console.log('  currentLevel:', currentLevel);

  const derived = {};
  const equipmentContributions = {}; // 装备提供的所有加成
  const equipmentBonusesToBasic = {}; // 装备对基础属性的加成

  const finalBasicAttributes = { ...basicAttributesWithPoints };

  // 1. 累加装备对基础属性的直接加成
  if (equippedItemsDataMap) {
    for (const slot in equippedItemsDataMap) {
      const item = equippedItemsDataMap[slot];
      console.log(`  [装备槽 ${slot}] 装备:`, item);
      console.log(`  [装备槽 ${slot}] 装备完整结构:`, JSON.stringify(item, null, 2));
      if (item && item.effects) {
        console.log(`  [装备槽 ${slot}] effects:`, item.effects);
        console.log(`  [装备槽 ${slot}] effects类型:`, typeof item.effects);
        console.log(`  [装备槽 ${slot}] effects键:`, Object.keys(item.effects));
        for (const effectKey in item.effects) {
          const value = item.effects[effectKey];
          console.log(`    处理效果 ${effectKey}: ${value} (类型: ${typeof value})`);
          if (finalBasicAttributes.hasOwnProperty(effectKey)) {
            finalBasicAttributes[effectKey] = (finalBasicAttributes[effectKey] || 0) + value;
            equipmentBonusesToBasic[effectKey] = (equipmentBonusesToBasic[effectKey] || 0) + value;
            console.log(`      -> 添加到基础属性 ${effectKey}: ${value}`);
          }
          // 记录所有装备效果
          equipmentContributions[effectKey] = (equipmentContributions[effectKey] || 0) + value;
          console.log(`      -> 添加到装备贡献 ${effectKey}: ${value}`);
        }
      } else {
        console.log(`  [装备槽 ${slot}] 无装备或无效果`);
        if (item) {
          console.log(`  [装备槽 ${slot}] 装备存在但effects为:`, item.effects);
          console.log(`  [装备槽 ${slot}] 装备的所有属性:`, Object.keys(item));
        }
      }
    }
  }

  console.log('[calculateDerivedAttributes] 计算结果:');
  console.log('  equipmentContributions:', equipmentContributions);
  console.log('  equipmentBonusesToBasic:', equipmentBonusesToBasic);
  console.log('  finalBasicAttributes:', finalBasicAttributes);
  
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

  // === 战力值计算 ===
  // 以主要衍生属性为基础，加入等级和品质加成
  // 你可以根据实际需要调整权重
  const hp = derived.hp || 0;
  const mp = derived.mp || 0;
  const patk = derived.physicalAttack || 0;
  const matk = derived.magicalAttack || 0;
  const pdef = derived.physicalDefense || 0;
  const mdef = derived.magicalDefense || 0;
  const speed = derived.speed || 0;
  const level = currentLevel || 1;
  // let qualityMultiplier = 1; // qualityMultiplier logic removed
  // if (basicAttributesWithPoints.quality) {
  //   // 如果传入了quality字段
  //   const idx = qualityConfig.names.indexOf(basicAttributesWithPoints.quality);
  //   qualityMultiplier = qualityConfig.attributeMultipliers[idx] || 1;
  // }
  // 简单加权公式，可根据实际调整
  const power = Math.floor(
    hp * 0.2 + mp * 0.1 + patk * 1.2 + matk * 1.2 + pdef * 0.8 + mdef * 0.8 + speed * 1.0 + level * 10 // qualityMultiplier removed from calculation
  );

  return {
    derivedAttributes: derived,
    equipmentContributions,
    equipmentBonusesToBasic,
    power, // 新增战力值
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
 * @param {string} params.summonSourceId - 召唤兽的ID
 * @param {string} params.quality - 召唤兽的品质
 * @param {string} params.natureType - 召唤兽类型 (wild/baby/mutant)，默认为野生
 * @param {SUMMON_SOURCES[keyof SUMMON_SOURCES]} params.source - 召唤兽的来源 (using enum values)
 * @param {Function} params.dispatch - Redux dispatch 函数
 * @returns {Object} 新的召唤兽数据
 */
export const generateNewSummon = ({ summonSourceId, quality, natureType = 'wild', source, dispatch }) => {
  // 记录到图鉴
  if (dispatch) {
    dispatch(unlockSummon({
      summonSourceId,
      quality: summonData.quality
    }));
  }

  const summonData = summonConfig[summonSourceId];
  if (!summonData) {
    throw new Error(`找不到召唤兽配置：${summonSourceId}`);
  }

  // 获取召唤兽类型配置，默认为野生
  const currentNatureType = natureType || SUMMON_NATURE_TYPES.WILD;
  const natureConfig = SUMMON_NATURE_CONFIG[currentNatureType] || SUMMON_NATURE_CONFIG[SUMMON_NATURE_TYPES.WILD];

  const summonId = generateUniqueId(UNIQUE_ID_PREFIXES.SUMMON);

  let finalSkillSet = [];

  // 1. 添加必带技能
  if (summonData.guaranteedInitialSkills && Array.isArray(summonData.guaranteedInitialSkills)) {
    finalSkillSet = [...summonData.guaranteedInitialSkills];
  }

  // 2. 从技能池中按正态分布选择额外技能
  if (summonData.initialSkillPool && Array.isArray(summonData.initialSkillPool) && summonData.initialSkillPool.length > 0) {
    const mean = typeof summonData.initialSkillCountMean === 'number' ? summonData.initialSkillCountMean : 1;
    const stdDev = typeof summonData.initialSkillCountStdDev === 'number' ? summonData.initialSkillCountStdDev : 0.5;
    
    // 创建一个候选技能池，排除已在 finalSkillSet 中的技能 (必带技能)
    const candidateSkillPool = summonData.initialSkillPool.filter(skill => !finalSkillSet.includes(skill));

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
  } else if (!summonData.guaranteedInitialSkills && summonData.initialSkills && Array.isArray(summonData.initialSkills)) {
    // 回退逻辑: 如果没有任何必带技能或新技能池配置，但有旧的 initialSkills 配置
    finalSkillSet = summonData.initialSkills;
  }
  // 确保最终技能列表中的技能是唯一的 (尽管上面的逻辑试图避免重复)
  finalSkillSet = [...new Set(finalSkillSet)];

  // 根据召唤兽类型确定初始等级
  const [minLevel, maxLevel] = natureConfig.initialLevelRange;
  const initialLevel = minLevel === maxLevel ? minLevel : Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;

  // 计算基础属性（应用类型倍数）
  const baseAttributes = {};
  if (summonData.basicAttributeRanges) {
    Object.keys(summonData.basicAttributeRanges).forEach(attr => {
      const [min, max] = summonData.basicAttributeRanges[attr];
      const baseValue = getRandomAttribute(min, max);
      // 应用召唤兽类型的属性倍数
      baseAttributes[attr] = Math.floor(baseValue * natureConfig.baseAttributeMultiplier);
    });
  }

  // ---- START: Apply Personality Modifiers ----
  const personalityId = getRandomPersonalityId();
  const selectedPersonality = personalityConfig[personalityId];

  if (selectedPersonality && selectedPersonality.id !== PERSONALITY_TYPES.NEUTRAL) {
    if (selectedPersonality.isExtreme) {
      const { extremeStat, decreasedStat1, decreasedStat2 } = selectedPersonality;
      if (extremeStat && baseAttributes.hasOwnProperty(extremeStat)) {
        baseAttributes[extremeStat] = Math.floor(baseAttributes[extremeStat] * (1 + EXTREME_POSITIVE_MODIFIER));
      }
      if (decreasedStat1 && baseAttributes.hasOwnProperty(decreasedStat1)) {
        baseAttributes[decreasedStat1] = Math.floor(baseAttributes[decreasedStat1] * (1 - PERSONALITY_EFFECT_MODIFIER)); // Using normal negative for decreased
      }
      if (decreasedStat2 && baseAttributes.hasOwnProperty(decreasedStat2)) {
        baseAttributes[decreasedStat2] = Math.floor(baseAttributes[decreasedStat2] * (1 - PERSONALITY_EFFECT_MODIFIER)); // Using normal negative for decreased
      }
    } else {
      const { increasedStat, decreasedStat } = selectedPersonality;
      if (increasedStat && baseAttributes.hasOwnProperty(increasedStat)) {
        baseAttributes[increasedStat] = Math.floor(baseAttributes[increasedStat] * (1 + PERSONALITY_EFFECT_MODIFIER));
      }
      if (decreasedStat && baseAttributes.hasOwnProperty(decreasedStat)) {
        baseAttributes[decreasedStat] = Math.floor(baseAttributes[decreasedStat] * (1 - PERSONALITY_EFFECT_MODIFIER));
      }
    }
  }
  // ---- END: Apply Personality Modifiers ----

  // 计算初始潜力点（宝宝和变异从0级开始，获得更多潜力点）
  const basePotentialPoints = initialLevel > 0 ? 0 : natureConfig.potentialPointsBonus;

  // 基础数据结构
  const newSummon = {
    id: summonId,
    summonSourceId: summonSourceId,
    nickname: summonData.name,
    level: initialLevel,
    quality: summonData.quality,
    natureType: currentNatureType, // 新增：召唤兽类型
    personalityId: personalityId, // 新增：召唤兽性格ID
    experience: 0,
    potentialPoints: basePotentialPoints,
    allocatedPoints: {
      constitution: 0,
      strength: 0,
      agility: 0,
      intelligence: 0,
      luck: 0
    },
    basicAttributes: baseAttributes,
    skillSet: finalSkillSet, // 使用新生成的技能列表
    equippedItemIds: {},
    source: source,
    obtainedAt: new Date().toISOString(),
  };

  return newSummon;
};

