/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-19 05:26:54
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-12 07:39:53
 */
import allSummons from '../config/summon/allSummons.json';
import { qualityConfig, derivedAttributeConfig, levelExperienceRequirements } from '../config/config';
import { generateUniqueId } from './idUtils';
import { UNIQUE_ID_PREFIXES, SUMMON_NATURE_TYPES, SUMMON_NATURE_CONFIG, EQUIPMENT_EFFECT_TYPES } from "../config/enumConfig";
import { personalityConfig, getRandomPersonalityId, PERSONALITY_EFFECT_MODIFIER, PERSONALITY_TYPES,EXTREME_POSITIVE_MODIFIER } from '../config/summon/personalityConfig';
import { calculateEffectValue } from './equipmentEffectUtils';
import { combatRoleConfig, COMBAT_ROLES } from '../config/summon/combatRoleConfig';
import { derivedAttributeConfig as baseDerivedAttributeConfig } from '../config/config';
import Summon from '../store/Summon';
import {summonConfig} from '../config/summon/summonConfig';
/**
 * 预计算元权重
 * 基于"基础属性->派生属性"的转换关系，以及"派生属性对各角色的价值"，
 * 计算出每个基础属性对每个角色的最终价值贡献。
 */
const calculateMetaWeights = () => {
  const metaWeights = {};

  // 初始化元权重对象
  for (const role in combatRoleConfig) {
    metaWeights[role] = {
      constitution: 0, strength: 0, agility: 0, intelligence: 0, luck: 0,
    };
  }

  // 遍历每个派生属性 (如 hp, physicalAttack)
  for (const [derivedAttr, conversionConfig] of Object.entries(derivedAttributeConfig)) {
    const { attributes: baseAttrs, multiplier } = conversionConfig;

    // 遍历每个角色 (如 TANK, PHYSICAL_DPS)
    for (const [role, roleConfig] of Object.entries(combatRoleConfig)) {
      const derivedAttrValueForRole = roleConfig.weights[derivedAttr] || 0;

      // 如果此角色关心这个派生属性
      if (derivedAttrValueForRole > 0) {
        // 找到是哪些基础属性贡献了它
        for (const baseAttr of baseAttrs) {
          // 将这个贡献值累加到元权重上
          const valueContribution = multiplier * derivedAttrValueForRole;
          if (metaWeights[role][baseAttr] !== undefined) {
            metaWeights[role][baseAttr] += valueContribution;
          }
        }
      }
    }
  }
  return metaWeights;
};

// 在模块加载时，一次性计算好元权重
const META_WEIGHTS = calculateMetaWeights();
console.log('[summonUtils] Pre-calculated Meta Weights:', META_WEIGHTS);

/**
 * The standard factory function for creating any creature instance from a template.
 * @param {object} params - Creation parameters.
 * @param {string} params.templateId - The ID of the creature in allSummons.json.
 * @param {number} params.level - The desired level of the creature.
 * @param {string} params.natureType - The nature of the creature (wild, baby, etc.).
 * @returns {Summon|null} A new instance of the Summon class, or null if template not found.
 */
export const createCreatureFromTemplate = ({ templateId, level = 1, natureType = SUMMON_NATURE_TYPES.WILD }) => {
    console.log(templateId,"templateId");
  const template = allSummons[templateId];
    if (!template) {
        console.error(`Creature template not found for ID: ${templateId}`);
        return null;
    }

    // 1. Generate Basic Attributes
    const basicAttributes = {};
    for (const [attr, range] of Object.entries(template.basicAttributeRanges)) {
        const [min, max] = range;
        basicAttributes[attr] = Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 2. Determine Skills
    let finalSkillSet = [...(template.guaranteedInitialSkills || [])];
    const skillPool = template.initialSkillPool?.filter(skill => !finalSkillSet.includes(skill)) || [];
    if (skillPool.length > 0) {
        // For simplicity, let's add one random skill from the pool if available
        const randomSkill = skillPool[Math.floor(Math.random() * skillPool.length)];
        finalSkillSet.push(randomSkill);
    }

    // 3. Construct the data object for the Summon class
    const creatureData = {
        id: generateUniqueId(UNIQUE_ID_PREFIXES.SUMMON),
        summonSourceId: templateId,
        sourceId: templateId,
        nickname: template.name,
        level: level,
        experience: 0,
        quality: template.quality,
        creatureType: template.creatureType,
        isCapturable: template.isCapturable,
        fiveElement: template.fiveElement,
        natureType: natureType,
        personalityId: getRandomPersonalityId(),
        basicAttributes: basicAttributes,
        allocatedPoints: {},
        potentialPoints: (level - 1) * 5, // Assuming 5 points per level
        skillSet: finalSkillSet,
        skillLevels: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
        equippedItemIds: {},
    };

    // 4. Create and return the Summon instance
    // This assumes Summon class is correctly imported and can be instantiated.
    // We might need to adjust the import from '../store/SummonManager' if it's not a direct export.
    return new Summon(creatureData);
};

/**
 * 根据有效基础属性动态决定召唤兽的战斗角色
 * @param {object} effectiveBasicAttributes - 召唤兽的有效基础属性对象
 * @returns {string} - 战斗角色 (e.g., 'TANK', 'PHYSICAL_DPS')
 */
export const determineCombatRole = (effectiveBasicAttributes) => {
  if (!effectiveBasicAttributes) {
    return COMBAT_ROLES.BALANCED;
  }
  
  let maxScore = -1;
  let bestRole = COMBAT_ROLES.BALANCED;

  // 使用预计算好的元权重进行判断
  for (const role in META_WEIGHTS) {
    const roleWeights = META_WEIGHTS[role];
    let currentScore = 0;

    for (const baseAttr in roleWeights) {
      currentScore += (effectiveBasicAttributes[baseAttr] || 0) * roleWeights[baseAttr];
    }
    
    if (currentScore > maxScore) {
      maxScore = currentScore;
      bestRole = role;
    }
  }
  
  return bestRole;
};

/**
 * 计算召唤兽的派生属性
 * @param {Object} basicAttributesWithPoints - 基础属性加点后的值
 * @param {Object} equippedItemsDataMap - 装备数据映射
 * @param {number} currentLevel - 当前等级
 * @returns {Object} 派生属性计算结果
 */
export const calculateDerivedAttributes = (basicAttributesWithPoints, equippedItemsDataMap, currentLevel) => {
  const derived = {};
  const equipmentContributions = {}; // 装备提供的所有加成
  const equipmentBonusesToBasic = {}; // 装备对基础属性的加成

  const finalBasicAttributes = { ...basicAttributesWithPoints };

  // 1. 第一阶段：处理对基础属性的装备效果
  const basicAttributeEffects = {};  // 基础属性的装备效果
  const derivedAttributeEffects = {}; // 派生属性的装备效果（待第二阶段处理）
  
  if (equippedItemsDataMap) {
    for (const slot in equippedItemsDataMap) {
      const item = equippedItemsDataMap[slot];
      if (item && item.effects) {
        for (const effectKey in item.effects) {
          const effect = item.effects[effectKey];
          
          // 判断是基础属性还是派生属性
          if (finalBasicAttributes.hasOwnProperty(effectKey)) {
            // 基础属性：立即计算并应用
            const baseValue = finalBasicAttributes[effectKey] || 0;
            const effectValue = calculateEffectValue(effect, baseValue, effectKey);
            
            finalBasicAttributes[effectKey] = (finalBasicAttributes[effectKey] || 0) + effectValue;
            equipmentBonusesToBasic[effectKey] = (equipmentBonusesToBasic[effectKey] || 0) + effectValue;
            equipmentContributions[effectKey] = (equipmentContributions[effectKey] || 0) + effectValue;
          } else {
            // 派生属性：存储效果配置，待第二阶段处理
            if (!derivedAttributeEffects[effectKey]) {
              derivedAttributeEffects[effectKey] = [];
            }
            derivedAttributeEffects[effectKey].push(effect);
          }
        }
      }
    }
  }

  // 2. 第二阶段：基于最终基础属性计算派生属性，并应用装备的派生属性效果
  for (const [attrKey, config] of Object.entries(derivedAttributeConfig)) {
    // 首先基于基础属性计算派生属性的基础值
    let baseValue = 0;
    for (const baseAttr of config.attributes) {
      baseValue += (finalBasicAttributes[baseAttr] || 0) * config.multiplier;
    }

    // 应用装备对该派生属性的效果
    let finalValue = baseValue;
    if (derivedAttributeEffects[attrKey]) {
      for (const effect of derivedAttributeEffects[attrKey]) {
        const effectValue = calculateEffectValue(effect, baseValue, attrKey);
        finalValue += effectValue;
                 // 更新装备贡献为实际生效值
         equipmentContributions[attrKey] = (equipmentContributions[attrKey] || 0) + effectValue;
      }
    }
    
    // 格式化最终值
    const criticalAttributeKeys = [
      EQUIPMENT_EFFECT_TYPES.CRIT_RATE,
      EQUIPMENT_EFFECT_TYPES.CRIT_DAMAGE,
      EQUIPMENT_EFFECT_TYPES.DODGE_RATE
    ];

    if (criticalAttributeKeys.includes(attrKey)) {
      derived[attrKey] = parseFloat(finalValue.toFixed(5));
    } else {
      derived[attrKey] = Math.floor(finalValue);
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
 * @deprecated 此函数逻辑复杂且数据源已旧，请考虑使用 createCreatureFromTemplate 作为基础进行重构。
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
  const summonData = summonConfig[summonSourceId];
  if (!summonData) {
    throw new Error(`找不到召唤兽配置：${summonSourceId}`);
  }
  
  // 记录到图鉴
  if (dispatch) {
    dispatch(unlockSummon({
      summonSourceId,
      quality: summonData.quality
    }));
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
  const basicAttributes = {};
  for (const [key, range] of Object.entries(summonData.basicAttributeRanges)) {
    basicAttributes[key] = getRandomAttribute(range[0], range[1]);
  }

  // ---- START: Apply Personality Modifiers ----
  const personalityId = getRandomPersonalityId();
  const selectedPersonality = personalityConfig[personalityId];

  if (selectedPersonality && selectedPersonality.id !== PERSONALITY_TYPES.NEUTRAL) {
    if (selectedPersonality.isExtreme) {
      const { extremeStat, decreasedStat1, decreasedStat2 } = selectedPersonality;
      if (extremeStat && basicAttributes.hasOwnProperty(extremeStat)) {
        basicAttributes[extremeStat] = Math.floor(basicAttributes[extremeStat] * (1 + EXTREME_POSITIVE_MODIFIER));
      }
      if (decreasedStat1 && basicAttributes.hasOwnProperty(decreasedStat1)) {
        basicAttributes[decreasedStat1] = Math.floor(basicAttributes[decreasedStat1] * (1 - PERSONALITY_EFFECT_MODIFIER)); // Using normal negative for decreased
      }
      if (decreasedStat2 && basicAttributes.hasOwnProperty(decreasedStat2)) {
        basicAttributes[decreasedStat2] = Math.floor(basicAttributes[decreasedStat2] * (1 - PERSONALITY_EFFECT_MODIFIER)); // Using normal negative for decreased
      }
    } else {
      const { increasedStat, decreasedStat } = selectedPersonality;
      if (increasedStat && basicAttributes.hasOwnProperty(increasedStat)) {
        basicAttributes[increasedStat] = Math.floor(basicAttributes[increasedStat] * (1 + PERSONALITY_EFFECT_MODIFIER));
      }
      if (decreasedStat && basicAttributes.hasOwnProperty(decreasedStat)) {
        basicAttributes[decreasedStat] = Math.floor(basicAttributes[decreasedStat] * (1 - PERSONALITY_EFFECT_MODIFIER));
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
    sourceId: summonSourceId,
    nickname: summonData.name,
    isCaptured: summonData.isCaptured,
    createdAt: new Date().toISOString(),
    creatureType: summonData.creatureType,
    isCapturable: summonData.isCapturable,
    name: summonData.name,
    level: initialLevel,
    experience: 0,
    experienceToNextLevel: getExperienceForLevel(initialLevel),
    quality: summonData.quality,
    fiveElement: summonData.fiveElement,
    growthRates: summonData.growthRates,
    natureType: currentNatureType,
    personalityId: personalityId,
    potentialPoints: basePotentialPoints,
    allocatedPoints: {
      constitution: 0,
      strength: 0,
      agility: 0,
      intelligence: 0,
      luck: 0
    },
    basicAttributes,
    skillSet: finalSkillSet,
    equippedItemIds: {},
    source: source,
    obtainedAt: new Date().toISOString(),
  };

  return newSummon;
};
