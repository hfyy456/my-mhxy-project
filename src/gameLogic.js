// gameLogic.js
import {
  petConfig,
  skillConfig,
  qualityConfig,
  probabilityConfig,
  STANDARD_EQUIPMENT_SLOTS,
  // levelExperienceRequirements // Not directly used here, summonSlice will handle
} from "@/config/config";
import { equipmentConfig } from "@/config/equipmentConfig";
import { SKILL_MODES } from './config/enumConfig';
import { 
  uiText, 
  getRaceTypeDisplayName,
  getQualityDisplayName
} from "@/config/uiTextConfig";
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
  const equipmentCategories = Object.keys(equipmentConfig);
  const randomCategory = equipmentCategories[Math.floor(Math.random() * equipmentCategories.length)];
  
  // 从选中的类型中随机选择一件装备配置
  const equipmentList = equipmentConfig[randomCategory];
  const randomEquipmentConfig = equipmentList[Math.floor(Math.random() * equipmentList.length)];
  
  // 随机选择一个品质
  const randomQuality = getRandomQuality();
  
  // 返回给背包或召唤兽的初始装备数据结构 (纯数据对象)
  // 注意：这个对象现在是纯数据，用于后续 dispatch(addItem(newEquipmentData))。
  // finalEffects 将由 itemSlice.addItem reducer 计算。
  const newEquipmentData = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7), // 生成唯一ID
    name: randomEquipmentConfig.name, // 必须与 equipmentConfig.js 中的 name 匹配
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

// 生成初始装备
export const generateInitialEquipment = (count = 5) => {
  const equipmentDataArray = [];
  for (let i = 0; i < count; i++) {
    equipmentDataArray.push(getRandomEquipment()); // getRandomEquipment() 现在返回纯数据对象
  }
  return equipmentDataArray; // 返回纯数据对象数组
};

// 修改refineMonster函数
export const refineMonster = () => {
  const petDetails = getRandomPet(); // petDetails is the config object for the pet
  const petName = Object.keys(petConfig).find(key => petConfig[key] === petDetails);
  if (!petName) {
    throw new Error("Failed to find pet name from pet details.");
  }
  const basePetConfig = petConfig[petName]; // Get the base config using the found name

  const quality = getRandomQuality();
  const level = 1;

  // 生成初始装备 (纯数据对象数组) - 这些物品将被添加到背包
  const initialEquipmentData = generateInitialEquipment(3); // 生成3件到背包，可以调整数量

  // Prepare initial skills
  const initialSkillCount = getRandomAttribute(
    probabilityConfig.initialSkillCount.min,
    probabilityConfig.initialSkillCount.max
  );
  const shuffledSkills = [...basePetConfig.initialSkills].sort(() => 0.5 - Math.random());
  const initialSkills = shuffledSkills.slice(0, initialSkillCount);

  // --- Construct newSummonPayload for Redux ---
  const summonId = `${petName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Calculate initial basicAttributes (logic from Summon constructor)
  const qualityIndex = qualityConfig.names.indexOf(quality);
  const qualityMultiplier = qualityConfig.attributeMultipliers[qualityIndex] || 1;
  
  const initialBasicAttributes = {
    constitution: Math.floor(getRandomAttribute(...basePetConfig.basicAttributeRanges.constitution) * qualityMultiplier),
    strength: Math.floor(getRandomAttribute(...basePetConfig.basicAttributeRanges.strength) * qualityMultiplier),
    agility: Math.floor(getRandomAttribute(...basePetConfig.basicAttributeRanges.agility) * qualityMultiplier),
    intelligence: Math.floor(getRandomAttribute(...basePetConfig.basicAttributeRanges.intelligence) * qualityMultiplier),
    luck: Math.floor(getRandomAttribute(...basePetConfig.basicAttributeRanges.luck) * qualityMultiplier),
  };

  // 初始化 equippedItemIds 为全 null, 新召唤兽初始不装备任何物品
  const equippedItemIds = {};
  STANDARD_EQUIPMENT_SLOTS.forEach(slot => {
    equippedItemIds[slot] = null;
  });

  const newSummonPayload = {
    id: summonId,
    name: petName,
    nickname: basePetConfig.name, // 将昵称默认设置为召唤兽的中文名称
    level: level,
    quality: quality,
    experience: 0,
    potentialPoints: 0,
    allocatedPoints: { constitution: 0, strength: 0, agility: 0, intelligence: 0, luck: 0 },
    basicAttributes: initialBasicAttributes,
    skillSet: initialSkills,
    equippedItemIds: equippedItemIds,
    race: basePetConfig.race,
  };

  // 为历史记录准备可序列化的装备信息 (将显示无装备)
  const serializableEquippedItemsForHistory = {};
  STANDARD_EQUIPMENT_SLOTS.forEach(slot => {
    serializableEquippedItemsForHistory[slot] = null;
  });
  
  const historyItem = {
    id: newSummonPayload.id,
    name: newSummonPayload.name,
    quality: newSummonPayload.quality,
    level: newSummonPayload.level,
    basicAttributes: { ...newSummonPayload.basicAttributes },
    derivedAttributes: {}, // Will be populated from Redux state by UI
    skills: [...newSummonPayload.skillSet],
    equipment: serializableEquippedItemsForHistory, // 历史记录显示无装备
    race: newSummonPayload.race, // 在历史记录中添加种族信息
  };

  return {
    newSummonPayload: newSummonPayload,
    newlyCreatedItems: initialEquipmentData,
    historyItem: historyItem,
    requireNickname: false, // 不再需要设置昵称
    message: `炼妖成功！召唤兽 ${basePetConfig.name} (${getQualityDisplayName(newSummonPayload.quality)}) 生成完毕，种族: ${getRaceTypeDisplayName(newSummonPayload.race)}，并获得 ${initialEquipmentData.length} 件随机装备到您的背包中。`,
  };
};

export const bookSkill = (summonId, currentSkillSet) => {
  const skillId = getRandomSkill();
  const successProbability = Math.random();

  if (successProbability >= probabilityConfig.bookSuccessRate) {
    return {
      outcome: 'FAILURE_NO_SKILL_CHANGE',
      message: "打书失败，技能未添加",
      skillAttempted: skillId
    };
  }

  const skillInfo = skillConfig.find((s) => s.id === skillId);
  if (!skillInfo) {
    return { 
      outcome: 'FAILURE_CONFIG_NOT_FOUND', 
      message: `打书失败：技能 ${skillId} 配置未找到。`, 
      skillAttempted: skillId 
    };
  }

  const activeSkillsCount = currentSkillSet.filter((skillId) => {
    const sk = skillConfig.find((s) => s.id === skillId);
    return sk?.mode === SKILL_MODES.ACTIVE;
  }).length;

  if (skillInfo.mode === SKILL_MODES.ACTIVE && activeSkillsCount >= 2) {
    return {
      outcome: 'FAILURE_ACTIVE_SKILL_LIMIT',
      message: "打书失败：最多只能拥有2个主动技能。",
      skillAttempted: skillId,
      currentActiveSkills: activeSkillsCount
    };
  }

  if (currentSkillSet.includes(skillId)) {
    return {
      outcome: 'SUCCESS_SKILL_ALREADY_PRESENT',
      skill: skillId,
      message: `打书成功！但是技能 "${skillInfo.name}" 已存在，无需添加。`,
    };
  } else if (currentSkillSet.length >= 12) {
    return {
      outcome: 'SUCCESS_REPLACEMENT_NEEDED',
      pendingSkill: skillId,
      message: "打书成功！但技能列表已满 (12/12)，需要替换一个旧技能。",
    };
  } else {
    return {
      outcome: 'SUCCESS_ADD_SKILL',
      skillToAdd: skillId,
      skillInfo: skillInfo,
      message: `打书成功！获得技能：${skillInfo.name} (${skillInfo.description})`,
    };
  }
};

export const confirmReplaceSkill = (summonId, currentSkillSet, pendingSkillId) => {
  if (!pendingSkillId || !currentSkillSet || currentSkillSet.length === 0) {
    return { 
      outcome: 'INVALID_OPERATION',
      message: "操作无效，没有待定技能或召唤兽没有技能可替换。"
    };
  }
  
  const indexToReplace = Math.floor(Math.random() * currentSkillSet.length);
  const replacedSkillId = currentSkillSet[indexToReplace];
  
  const newSkillInfo = skillConfig.find((s) => s.id === pendingSkillId);
  const replacedSkillInfo = skillConfig.find((s) => s.id === replacedSkillId);

  return {
    outcome: 'SKILL_REPLACED',
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
