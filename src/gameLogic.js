/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 03:01:24
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-12 06:28:20
 */
// gameLogic.js
import {
  summonConfig,
  skillConfig,
  qualityConfig,
  probabilityConfig,
  STANDARD_EQUIPMENT_SLOTS,
  // levelExperienceRequirements // Not directly used here, OOP SummonManager will handle
} from "@/config/config";
import { applyQualityToEquipment, generateRandomQuality } from "@/config/item/equipmentConfig";
import { 
  SKILL_MODES,
  UNIQUE_ID_PREFIXES,
  REFINEMENT_SOURCES,
  SKILL_OPERATION_OUTCOMES,
  QUALITY_TYPES,
  SUMMON_SOURCES
} from '@/config/enumConfig';
import { 
  uiText, 
  getQualityDisplayName,
  getAttributeDisplayName,
  getFiveElementDisplayName,
} from "@/config/ui/uiTextConfig";
import { createCreatureFromTemplate } from '@/utils/summonUtils';
import { experienceConfig, playerBaseConfig } from '@/config/character/playerConfig';
import { generateUniqueId } from '@/utils/idUtils';
import { ITEM_BASE_CONFIG } from '@/config/item/inventoryConfig';
import { gachaPoolConfig, gachaCost, gachaPityRules } from '@/config/gachaConfig';
// import Summon from "@/entities/Summon"; // Removed
// import EquipmentEntity from "@/entities/EquipmentEntity"; // Removed
// import EquipmentManager from "@/managers/EquipmentManager"; // Removed
// import summonManagerInstance from "@/managers/SummonManager"; // Removed

export const getRandomSummon = () => {
  const summons = Object.values(summonConfig);
  return summons[Math.floor(Math.random() * summons.length)];
};

export const getRandomQuality = () => {
  return qualityConfig.names[
    Math.floor(Math.random() * qualityConfig.names.length)
  ];
};

export const getRandomAttribute = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const getRandomSkill = () => {
  const skill = skillConfig[Math.floor(Math.random() * skillConfig.length)];
  return skill.id;
};

// 获取随机装备
export const getRandomEquipment = () => {
  const equipmentTemplates = Object.values(ITEM_BASE_CONFIG.equipments);
  if (equipmentTemplates.length === 0) return null;

  const baseEquipment = equipmentTemplates[Math.floor(Math.random() * equipmentTemplates.length)];
  const randomQuality = generateRandomQuality();

  // 正确的做法：只返回基础ID和动态生成的属性
  // ItemFactory 将负责组合基础数据和这些动态数据
  return {
    sourceId: baseEquipment.id,
    id: generateUniqueId(UNIQUE_ID_PREFIXES.ITEM),
    quality: randomQuality,
    type: 'equipment', // 确保类型正确，帮助 ItemFactory 识别
  };
};

// 生成随机魔兽要诀
export const getRandomMonsterManual = () => {
  const monsterManualTemplates = Object.values(ITEM_BASE_CONFIG.consumables).filter(
    item => item.subType === 'monsterManual'
  );
   if (monsterManualTemplates.length === 0) return null;
  
  const baseManual = monsterManualTemplates[Math.floor(Math.random() * monsterManualTemplates.length)];

  // 正确的做法：只返回基础ID和唯一ID，不返回完整对象
  return {
    sourceId: baseManual.id,
    id: generateUniqueId(UNIQUE_ID_PREFIXES.ITEM),
    type: 'consumable', // 帮助 ItemFactory
    quantity: 1
  };
};

// 生成初始装备
export const generateInitialEquipment = (count = 5) => {
  const equipmentDataArray = [];
  for (let i = 0; i < count; i++) {
    equipmentDataArray.push(getRandomEquipment()); // getRandomEquipment() 现在返回纯数据对象
  }
  
  // 添加一个随机魔兽要诀
  equipmentDataArray.push(getRandomMonsterManual());
  
  return equipmentDataArray; // 返回纯数据对象数组
};

// 修改refineMonster函数
export const  refineMonster =async () => {  
  // 随机选择一个宠物ID和其配置
  const summonEntries = Object.entries(summonConfig);
  const [selectedSummonId, summonDetails] = summonEntries[Math.floor(Math.random() * summonEntries.length)];

  console.log(selectedSummonId);
  // 使用新的标准方法创建召唤兽实例
  const newSummonInstance = await createCreatureFromTemplate({
    templateId: selectedSummonId,
    level: 1 
  });

  if (!newSummonInstance) {
    return {
      error: true,
      message: "炼妖失败，无法创建新的召唤兽实例。"
    };
  }
  
  // 生成初始装备 (纯数据对象数组) - 这已是最终数据
  const initialEquipmentData = generateInitialEquipment(3);

  console.log(newSummonInstance,"newSummonInstance");
  // 准备历史记录
  const historyItem = {
    id: newSummonInstance.id,
    summonSourceId: selectedSummonId,
    level: newSummonInstance.level,
    basicAttributes: { ...newSummonInstance.basicAttributes },
    derivedAttributes: {},
    skillSet: [...newSummonInstance.skillSet],
    equipment: [],
  };


  return {
    newSummonInstance: newSummonInstance,
    newlyCreatedItems: initialEquipmentData,
    historyItem: historyItem,
    requireNickname: false,
    message: `炼妖成功！召唤兽 ${newSummonInstance.nickname} 生成完毕，并获得 ${initialEquipmentData.length} 件随机装备到您的背包中。`,
  };
};

export const bookSkill = (summonId, currentSkillSet, playerLevel) => {
  // 获取当前等级可打书的最高等级
  const maxSkillBookLevel = playerBaseConfig.getMaxSkillBookLevel(playerLevel);
  
  // 获取符合等级限制的技能
  const availableSkills = skillConfig.filter(skill => skill.level <= maxSkillBookLevel);
  if (availableSkills.length === 0) {
    return {
      outcome: SKILL_OPERATION_OUTCOMES.FAILURE_LEVEL_RESTRICTION,
      message: `当前等级(${playerLevel})无法使用任何技能书，需要提升等级。`,
      experienceGained: 0
    };
  }

  const skillId = availableSkills[Math.floor(Math.random() * availableSkills.length)].id;
  const successProbability = Math.random();

  if (successProbability >= probabilityConfig.bookSuccessRate) {
    return {
      outcome: SKILL_OPERATION_OUTCOMES.FAILURE_NO_SKILL_CHANGE,
      message: "打书失败，技能未添加",
      skillAttempted: skillId,
      experienceGained: experienceConfig.skillBook.failure
    };
  }

  const skillInfo = skillConfig.find((s) => s.id === skillId);
  if (!skillInfo) {
    return { 
      outcome: SKILL_OPERATION_OUTCOMES.FAILURE_CONFIG_NOT_FOUND, 
      message: `打书失败：技能 ${skillId} 配置未找到。`, 
      skillAttempted: skillId,
      experienceGained: experienceConfig.skillBook.failure
    };
  }

  const activeSkillsCount = currentSkillSet.filter((skillId) => {
    const sk = skillConfig.find((s) => s.id === skillId);
    return sk?.mode === SKILL_MODES.ACTIVE;
  }).length;

  if (skillInfo.mode === SKILL_MODES.ACTIVE && activeSkillsCount >= 2) {
    return {
      outcome: SKILL_OPERATION_OUTCOMES.FAILURE_ACTIVE_SKILL_LIMIT,
      message: "打书失败：最多只能拥有2个主动技能。",
      skillAttempted: skillId,
      currentActiveSkills: activeSkillsCount,
      experienceGained: experienceConfig.skillBook.failure
    };
  }

  if (currentSkillSet.includes(skillId)) {
    return {
      outcome: SKILL_OPERATION_OUTCOMES.SUCCESS_SKILL_ALREADY_PRESENT,
      skill: skillId,
      message: `打书成功！但是技能 "${skillInfo.name}" 已存在，无需添加。`,
      experienceGained: experienceConfig.skillBook.success
    };
  } else if (currentSkillSet.length >= 12) {
    return {
      outcome: SKILL_OPERATION_OUTCOMES.SUCCESS_REPLACEMENT_NEEDED,
      pendingSkill: skillId,
      message: "打书成功！但技能列表已满 (12/12)，需要替换一个旧技能。",
      experienceGained: experienceConfig.skillBook.success
    };
  } else {
    return {
      outcome: SKILL_OPERATION_OUTCOMES.SUCCESS_ADD_SKILL,
      skillToAdd: skillId,
      skillInfo: skillInfo,
      message: `打书成功！获得技能：${skillInfo.name} (${skillInfo.description})`,
      experienceGained: experienceConfig.skillBook.success
    };
  }
};

export const confirmReplaceSkill = (summonId, currentSkillSet, pendingSkillId) => {
  if (!pendingSkillId || !currentSkillSet || currentSkillSet.length === 0) {
    return { 
      outcome: SKILL_OPERATION_OUTCOMES.INVALID_OPERATION,
      message: "操作无效，没有待定技能或召唤兽没有技能可替换。"
    };
  }
  
  const indexToReplace = Math.floor(Math.random() * currentSkillSet.length);
  const replacedSkillId = currentSkillSet[indexToReplace];
  
  const newSkillInfo = skillConfig.find((s) => s.id === pendingSkillId);
  const replacedSkillInfo = skillConfig.find((s) => s.id === replacedSkillId);

  return {
    outcome: SKILL_OPERATION_OUTCOMES.SKILL_REPLACED,
    summonId: summonId,
    skillAdded: pendingSkillId,
    skillRemoved: replacedSkillId,
    newSkillDescription: newSkillInfo ? newSkillInfo.description : '',
    message: `打书成功！技能 "${replacedSkillInfo?.name || replacedSkillId}" 被 "${newSkillInfo?.name || pendingSkillId}" 覆盖。 (${newSkillInfo ? newSkillInfo.description : ''})`,
  };
};

/**
 * 计算指定等级的基础属性
 * @param {string} summonName - 宠物名称
 * @param {number} level - 目标等级
 * @param {object} currentAttributes - 当前等级的基础属性
 * @returns {object} - 指定等级的基础属性
 */
export const calculateAttributesByLevel = (
  summonName,
  level,
  currentAttributes
) => {
  const summonData = summonConfig[summonName];
  if (!summonData) {
    throw new Error("未找到该宠物的配置信息");
  }

  let attributes = { ...currentAttributes };
  for (let i = 1; i < level; i++) {
    for (const attr in attributes) {
      if (
        attributes.hasOwnProperty(attr) &&
        summonData.growthRates &&
        summonData.growthRates[attr] !== undefined
      ) {
        attributes[attr] = Math.floor(
          attributes[attr] * (1 + summonData.growthRates[attr] * 0.04)
        );
      }
    }
  }

  return attributes;
};

// New Gacha Draw Function
export const drawSummon = (playerGachaState, dispatch) => {
  const updatedPlayerGachaState = JSON.parse(JSON.stringify(playerGachaState));

  let determinedQuality = null;
  let pityTriggered = false;

  const legendaryOrMythicPityRule = gachaPityRules.guaranteedLegendaryOrMythic;
  if (updatedPlayerGachaState.pityCounts.guaranteedLegendaryOrMythic >= legendaryOrMythicPityRule.count - 1) {
    const possibleQualities = legendaryOrMythicPityRule.qualities;
    determinedQuality = possibleQualities[Math.floor(Math.random() * possibleQualities.length)];
    if (legendaryOrMythicPityRule.resetOnTrigger) {
      updatedPlayerGachaState.pityCounts.guaranteedLegendaryOrMythic = 0;
    }
    pityTriggered = true;
    console.log(`PITY TRIGGERED (Legendary/Mythic): ${determinedQuality}`);
  }

  if (!pityTriggered) {
    const rareOrAbovePityRule = gachaPityRules.guaranteedRareOrAbove;
    if (updatedPlayerGachaState.pityCounts.guaranteedRareOrAbove >= rareOrAbovePityRule.count - 1) {
      const possibleQualities = rareOrAbovePityRule.qualities;
      const availablePityQualities = Object.keys(gachaPoolConfig).filter(q => possibleQualities.includes(q));
      if (availablePityQualities.length > 0) {
        determinedQuality = availablePityQualities[Math.floor(Math.random() * availablePityQualities.length)];
        if (rareOrAbovePityRule.resetOnTrigger) {
          updatedPlayerGachaState.pityCounts.guaranteedRareOrAbove = 0;
        }
        pityTriggered = true;
        console.log(`PITY TRIGGERED (Rare+): ${determinedQuality}`);
      }
    }
  }

  if (!pityTriggered) {
    const rand = Math.random();
    let cumulativeProbability = 0;
    const qualityKeys = Object.keys(gachaPoolConfig); // Ensure consistent order for probability calculation
    for (const quality of qualityKeys) {
      cumulativeProbability += gachaPoolConfig[quality].probability;
      if (rand <= cumulativeProbability) {
        determinedQuality = quality;
        break;
      }
    }
  }

  if (!determinedQuality) {
    console.warn("Could not determine quality based on probability. Defaulting to NORMAL.");
    determinedQuality = QUALITY_TYPES.NORMAL;
  }

  const poolForQuality = gachaPoolConfig[determinedQuality]?.summons;
  if (!poolForQuality || poolForQuality.length === 0) {
    console.error(`No summons defined for quality ${determinedQuality} in gachaConfig. Attempting fallback or throwing error.`);
    // Fallback: try NORMAL pool, or first available summon, or throw error
    const normalPool = gachaPoolConfig[QUALITY_TYPES.NORMAL]?.summons;
    if (normalPool && normalPool.length > 0) {
        console.warn(`Falling back to a summon from NORMAL pool.`);
        determinedQuality = QUALITY_TYPES.NORMAL; // Explicitly set quality to normal for clarity
        const selectedSummonId = normalPool[Math.floor(Math.random() * normalPool.length)];
         const newSummon = createCreatureFromTemplate({
            templateId: selectedSummonId,
            level: 1
        });
        // Update pity counts even on fallback if a draw happens
        updatedPlayerGachaState.totalDraws += 1;
        // ... (pity count updates for legendaryOrMythicPityRule and rareOrAbovePityRule as below)
        if (legendaryOrMythicPityRule.resetOnTrigger && legendaryOrMythicPityRule.qualities.includes(determinedQuality)) {
            updatedPlayerGachaState.pityCounts.guaranteedLegendaryOrMythic = 0;
        } else {
            updatedPlayerGachaState.pityCounts.guaranteedLegendaryOrMythic += 1;
        }
        if (rareOrAbovePityRule.resetOnTrigger && rareOrAbovePityRule.qualities.includes(determinedQuality)) {
            updatedPlayerGachaState.pityCounts.guaranteedRareOrAbove = 0;
        } else {
            updatedPlayerGachaState.pityCounts.guaranteedRareOrAbove += 1;
        }
        return {
            drawnSummon: newSummon,
            updatedPlayerGachaState: updatedPlayerGachaState,
            cost: gachaCost
        };
    } else {
        throw new Error(`Configuration error: No summons available for quality ${determinedQuality} and no fallback summons in NORMAL pool.`);
    }
  }
  
  const selectedSummonId = poolForQuality[Math.floor(Math.random() * poolForQuality.length)];

  updatedPlayerGachaState.totalDraws += 1;

  // Update pity for Legendary/Mythic
  const legendaryOrMythicPityRuleToUpdate = gachaPityRules.guaranteedLegendaryOrMythic;
  if (legendaryOrMythicPityRuleToUpdate.resetOnTrigger && legendaryOrMythicPityRuleToUpdate.qualities.includes(determinedQuality)) {
    updatedPlayerGachaState.pityCounts.guaranteedLegendaryOrMythic = 0;
  } else {
    // Only increment if this specific pity was not the one triggered and reset
    // Or if it was triggered but doesn't reset (though our current config does reset)
    if (!pityTriggered || !legendaryOrMythicPityRuleToUpdate.qualities.includes(determinedQuality) || !legendaryOrMythicPityRuleToUpdate.resetOnTrigger) {
        updatedPlayerGachaState.pityCounts.guaranteedLegendaryOrMythic += 1;
    }
  }

  // Update pity for Rare+
  const rareOrAbovePityRuleToUpdate = gachaPityRules.guaranteedRareOrAbove;
  if (rareOrAbovePityRuleToUpdate.resetOnTrigger && rareOrAbovePityRuleToUpdate.qualities.includes(determinedQuality)) {
    updatedPlayerGachaState.pityCounts.guaranteedRareOrAbove = 0;
  } else {
    // Similar logic for this pity counter
    if (!pityTriggered || !rareOrAbovePityRuleToUpdate.qualities.includes(determinedQuality) || !rareOrAbovePityRuleToUpdate.resetOnTrigger) {
        updatedPlayerGachaState.pityCounts.guaranteedRareOrAbove += 1;
    }
  }

  const newSummon = createCreatureFromTemplate({
    templateId: selectedSummonId,
    level: 1
  });

  return {
    drawnSummon: newSummon,
    updatedPlayerGachaState: updatedPlayerGachaState,
    cost: gachaCost
  };
};
