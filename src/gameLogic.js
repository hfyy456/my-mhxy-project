/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 03:01:24
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-20 01:10:04
 */
// gameLogic.js
import {
  petConfig,
  skillConfig,
  qualityConfig,
  probabilityConfig,
  STANDARD_EQUIPMENT_SLOTS,
  // levelExperienceRequirements // Not directly used here, summonSlice will handle
} from "@/config/config";
import { petEquipmentConfig } from "@/config/petEquipmentConfig";
import { 
  SKILL_MODES,
  UNIQUE_ID_PREFIXES,
  REFINEMENT_SOURCES,
  SKILL_OPERATION_OUTCOMES,
  QUALITY_TYPES
} from './config/enumConfig';
import { 
  uiText, 
  getRaceTypeDisplayName,
  getQualityDisplayName
} from "@/config/uiTextConfig";
import { generateNewSummon } from '@/utils/summonUtils';
import { experienceConfig, playerBaseConfig } from '@/config/playerConfig';
import { generateUniqueId } from '@/utils/idUtils';
import { ITEM_BASE_CONFIG } from '@/config/inventoryConfig';
// import Summon from "@/entities/Summon"; // Removed
// import EquipmentEntity from "@/entities/EquipmentEntity"; // Removed
// import EquipmentManager from "@/managers/EquipmentManager"; // Removed
// import summonManagerInstance from "@/managers/SummonManager"; // Removed

export const getRandomPet = () => {
  const pets = Object.values(petConfig);
  return pets[Math.floor(Math.random() * pets.length)];
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
  // 随机选择一个装备类型 (category/slotType)
  const equipmentCategories = Object.keys(petEquipmentConfig);
  const randomCategory = equipmentCategories[Math.floor(Math.random() * equipmentCategories.length)];
  
  // 从选中的类型中随机选择一件装备配置
  const equipmentList = petEquipmentConfig[randomCategory];
  const randomEquipmentConfig = equipmentList[Math.floor(Math.random() * equipmentList.length)];
  
  // 随机选择一个品质
  const randomQuality = getRandomQuality();
  
  // 返回给背包或召唤兽的初始装备数据结构 (纯数据对象)
  // 注意：这个对象现在是纯数据，用于后续 dispatch(addItem(newEquipmentData))。
  // finalEffects 将由 itemSlice.addItem reducer 计算。
  const newEquipmentData = {
    id: generateUniqueId(UNIQUE_ID_PREFIXES.ITEM),
    name: randomEquipmentConfig.name, // 必须与 petEquipmentConfig.js 中的 name 匹配
    quality: randomQuality,
    level: 1, // 初始等级为1
    itemType: 'equipment',
    // slotType, icon, description 将由 itemSlice.addItem 根据 name 从 baseConfig 填充
    // 因此这里不需要显式提供，除非希望覆盖
    slotType: randomCategory, // 也可以让 addItem 填充，但这里已知，可以提供
    icon: randomEquipmentConfig.icon, // 提供基础信息，addItem 也可以从 baseConfig 获取
    description: randomEquipmentConfig.description // 提供基础信息，addItem 也可以从 baseConfig 获取
  };

  return newEquipmentData;
};

// 生成随机魔兽要诀
export const getRandomMonsterManual = () => {
  // 魔兽要诀类型数组
  const monsterManualTypes = [
    'monsterManualFire',
    'monsterManualWater',
    'monsterManualThunder',
    'monsterManualSupport',
    'monsterManualPassive'
  ];
  
  // 随机选择一种魔兽要诀类型
  const randomType = monsterManualTypes[Math.floor(Math.random() * monsterManualTypes.length)];
  
  // 获取选中类型的魔兽要诀配置
  const manualConfig = ITEM_BASE_CONFIG.consumables[randomType];
  
  // 创建魔兽要诀数据对象
  const monsterManualData = {
    id: generateUniqueId(UNIQUE_ID_PREFIXES.ITEM),
    name: manualConfig.name,
    quality: manualConfig.quality,
    itemType: 'consumable',
    type: manualConfig.type,
    description: manualConfig.description,
    icon: manualConfig.icon,
    effect: manualConfig.effect,
    stackable: true,
    amount: 1
  };
  
  return monsterManualData;
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
export const refineMonster = (playerLevel) => {
  // 获取当前等级可炼妖的品质列表
  const availableQualities = playerBaseConfig.getAvailableRefinementQualities(playerLevel);
  
  // 随机选择一个宠物ID和其配置
  const petEntries = Object.entries(petConfig);
  const [selectedPetId, petDetails] = petEntries[Math.floor(Math.random() * petEntries.length)];

  // 从可用品质中随机选择一个
  const quality = availableQualities[Math.floor(Math.random() * availableQualities.length)];

  // 生成初始装备 (纯数据对象数组)
  const initialEquipmentData = generateInitialEquipment(3);

  // 使用公共函数生成新的召唤兽
  const newSummon = generateNewSummon({
    petId: selectedPetId,
    quality: quality,
    source: REFINEMENT_SOURCES.REFINEMENT
  });

  // 准备历史记录
  const historyItem = {
    id: newSummon.id,
    petId: selectedPetId,
    quality: newSummon.quality,
    level: newSummon.level,
    basicAttributes: { ...newSummon.basicAttributes },
    derivedAttributes: {},
    skillSet: [...newSummon.skillSet],
    equipment: newSummon.equippedItemIds,
    race: petDetails.race,
  };

  // 从配置中获取经验值
  const qualityMap = {
    [getQualityDisplayName(QUALITY_TYPES.NORMAL)]: QUALITY_TYPES.NORMAL,
    [getQualityDisplayName(QUALITY_TYPES.RARE)]: QUALITY_TYPES.RARE,
    [getQualityDisplayName(QUALITY_TYPES.EPIC)]: QUALITY_TYPES.EPIC,
    [getQualityDisplayName(QUALITY_TYPES.LEGENDARY)]: QUALITY_TYPES.LEGENDARY,
    [getQualityDisplayName(QUALITY_TYPES.MYTHIC)]: QUALITY_TYPES.MYTHIC
  };
  const experienceGained = experienceConfig.refinement[qualityMap[getQualityDisplayName(quality)]] || experienceConfig.refinement.normal;

  return {
    newSummonPayload: newSummon,
    newlyCreatedItems: initialEquipmentData,
    historyItem: historyItem,
    requireNickname: false,
    message: `炼妖成功！召唤兽 ${petDetails.name} (${getQualityDisplayName(quality)}) 生成完毕，种族: ${getRaceTypeDisplayName(petDetails.race)}，并获得 ${initialEquipmentData.length} 件随机装备到您的背包中。`,
    experienceGained: experienceGained
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
 * @param {string} petName - 宠物名称
 * @param {number} level - 目标等级
 * @param {object} currentAttributes - 当前等级的基础属性
 * @returns {object} - 指定等级的基础属性
 */
export const calculateAttributesByLevel = (
  petName,
  level,
  currentAttributes
) => {
  const petData = petConfig[petName];
  if (!petData) {
    throw new Error("未找到该宠物的配置信息");
  }

  let attributes = { ...currentAttributes };
  for (let i = 1; i < level; i++) {
    for (const attr in attributes) {
      if (
        attributes.hasOwnProperty(attr) &&
        petData.growthRates &&
        petData.growthRates[attr] !== undefined
      ) {
        attributes[attr] = Math.floor(
          attributes[attr] * (1 + petData.growthRates[attr] * 0.04)
        );
      }
    }
  }

  return attributes;
};
