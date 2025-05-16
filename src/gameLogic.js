// gameLogic.js
import {
  petConfig,
  skillConfig,
  qualityConfig,
  probabilityConfig,
  STANDARD_EQUIPMENT_SLOTS,
} from "./config/config";
import { equipmentConfig } from "./config/equipmentConfig";
import Summon from "./entities/Summon";
import EquipmentEntity from "./entities/EquipmentEntity";
import EquipmentManager from "./managers/EquipmentManager";
import summonManagerInstance from "./managers/SummonManager";

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
  return skillConfig[Math.floor(Math.random() * skillConfig.length)].name;
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
  
  // 创建EquipmentEntity实例
  const equipmentInstance = new EquipmentEntity(randomEquipmentConfig.name, randomQuality); // level 默认为 1

  // 将实例注册到EquipmentManager
  try {
    EquipmentManager.registerEquipment(equipmentInstance);
    // 立即验证注册是否成功
    const registeredEntity = EquipmentManager.getEquipmentById(equipmentInstance.id);
    if (!registeredEntity || registeredEntity !== equipmentInstance) {
      console.error(`[gameLogic] CRITICAL: Equipment registration validation failed for ID ${equipmentInstance.id}. Manager returned:`, registeredEntity);
      // 根据游戏的健壮性需求，这里可能需要抛出错误或返回一个表示失败的状态
      throw new Error(`Failed to validate equipment registration for ${equipmentInstance.name} (ID: ${equipmentInstance.id})`);
    }
  } catch (error) {
    console.error(`[gameLogic] CRITICAL: Failed to register equipment ${equipmentInstance.name} (ID: ${equipmentInstance.id}) with EquipmentManager.`, error);
    // 抛出错误，阻止后续创建无效的 InventoryItem
    throw error;
  }
  
  // 返回给背包或召唤兽的初始装备数据结构
  return {
    id: equipmentInstance.id, // 这是 EquipmentEntity 的唯一 ID
    name: equipmentInstance.name,
    quality: equipmentInstance.quality,
    description: randomEquipmentConfig.description, // 从原始配置获取
    icon: randomEquipmentConfig.icon,             // 从原始配置获取
    itemType: 'equipment', // 用于 InventoryItem 区分物品大类 (equipment, consumable, etc.)
    slotType: randomCategory,   // 装备槽类型 (饰品, 遗物, etc.)
    // 注意：这里不再包含 ...equipmentInstance 或其 effects。效果将通过 ID 从 Manager 获取。
    level: equipmentInstance.level // 包含等级信息
  };
};

// 生成初始装备
export const generateInitialEquipment = (count = 5) => {
  const equipment = [];
  for (let i = 0; i < count; i++) {
    equipment.push(getRandomEquipment());
  }
  return equipment;
};

// 修改refineMonster函数
export const refineMonster = () => {
  const petDetails = getRandomPet();
  const petName = Object.keys(petConfig).find(key => petConfig[key] === petDetails);
  if (!petName) {
    throw new Error("Failed to find pet name from pet details.");
  }

  const quality = getRandomQuality();
  const level = 1;

  // 生成初始装备
  const initialEquipmentData = generateInitialEquipment(5); // 这返回的是描述性对象
  const initialEquipmentEntities = initialEquipmentData.map(data => {
    // 需要从 EquipmentManager 获取或确认 EquipmentEntity 实例
    // 如果 getRandomEquipment 已经注册并返回了ID，那么应该通过ID去Manager获取
    const entity = EquipmentManager.getEquipmentById(data.id);
    if (!entity) {
        // 如果实体在 getRandomEquipment 中创建但未在此处找到，则可能存在问题
        // 或者，如果 Summon 构造函数期望的是 EquipmentEntity 实例，则需要确保传递的是这些实例
        console.error(`[refineMonster] Could not find equipment entity with ID: ${data.id} in EquipmentManager. This should not happen if getRandomEquipment registers it.`);
        // 为了演示，如果找不到，尝试基于data重新构建一个（但这可能导致重复或不一致）
        // 更好的做法是确保 getRandomEquipment 总是正确注册并返回可用的ID，然后用这些ID获取实体
        // 假设 Summon 构造函数可以处理 null 或 undefined 的装备项
        return null; 
    }
    return entity;
  }).filter(entity => entity !== null); // 过滤掉任何未找到的实体

  // Prepare initial skills
  const initialSkillCount = getRandomAttribute(
    probabilityConfig.initialSkillCount.min,
    probabilityConfig.initialSkillCount.max
  );
  const shuffledSkills = [...petDetails.initialSkills].sort(() => 0.5 - Math.random());
  const initialSkills = shuffledSkills.slice(0, initialSkillCount);

  // Create a new Summon instance
  const newSummonInstance = new Summon(petName, quality, level, initialEquipmentEntities, initialSkills);

  // 将新的召唤兽实例添加到 SummonManager
  summonManagerInstance.addSummon(newSummonInstance);

  // 为历史记录准备可序列化的装备信息
  const serializableEquippedItems = {};
  if (newSummonInstance.equippedItems) { // 确保 equippedItems 存在
    for (const slot in newSummonInstance.equippedItems) {
      const entity = newSummonInstance.equippedItems[slot];
      if (entity && typeof entity === 'object') { // 确保 entity 是一个对象
        serializableEquippedItems[slot] = {
          id: entity.id,
          name: entity.name,
          quality: entity.quality,
          level: entity.level,
          slotType: entity.slotType
        };
      } else {
        serializableEquippedItems[slot] = null;
      }
    }
  }

  return {
    newSummon: newSummonInstance,
    historyItem: {
      id: newSummonInstance.id,
      name: newSummonInstance.name,
      quality: newSummonInstance.quality,
      level: newSummonInstance.level,
      basicAttributes: { ...newSummonInstance.basicAttributes },
      derivedAttributes: { ...newSummonInstance.derivedAttributes },
      skills: [...newSummonInstance.skillSet],
      // 使用处理后的 serializableEquippedItems，避免直接序列化 EquipmentEntity 实例
      equipment: serializableEquippedItems 
    },
    message: `炼妖成功！召唤兽 ${newSummonInstance.name} (${newSummonInstance.quality}) 生成完毕，并获得5件随机装备。`,
  };
};

export const bookSkill = (summonInstance) => {
  const skillToAdd = getRandomSkill();
  const success = Math.random() < probabilityConfig.bookSuccessRate;

  if (!success) {
    return {
      success: false,
      message: "打书失败，技能未添加",
      newSummon: summonInstance,
    };
  }

  const skillInfo = skillConfig.find((s) => s.name === skillToAdd);
  if (!skillInfo) {
    return { 
        success: false, 
        message: `打书失败：技能 ${skillToAdd} 配置未找到。`, 
        newSummon: summonInstance 
    };
  }

  const activeSkillsCount = summonInstance.skillSet.filter((skillName) => {
    const sk = skillConfig.find((s) => s.name === skillName);
    return sk?.mode === "主动";
  }).length;

  if (skillInfo.mode === "主动" && activeSkillsCount >= 2) {
    return {
      success: false,
      message: "打书失败：最多只能拥有2个主动技能。",
      newSummon: summonInstance,
    };
  }

  if (summonInstance.skillSet.includes(skillToAdd)) {
    return {
      success: true,
      newSummon: summonInstance,
      message: `打书成功！但是技能 "${skillToAdd}" 已存在，无需添加。`,
    };
  } else if (summonInstance.skillSet.length >= 12) {
    return {
      success: true,
      needConfirm: true,
      pendingSkill: skillToAdd,
      newSummon: summonInstance,
    };
  } else {
    summonInstance.skillSet.push(skillToAdd);
    return {
      success: true,
      newSummon: summonInstance,
      message: `打书成功！获得技能：${skillToAdd} (${skillInfo.description})`,
    };
  }
};

export const confirmReplaceSkill = (summonInstance, pendingSkill) => {
  if (!pendingSkill || summonInstance.skillSet.length === 0) {
    return { 
        newSummon: summonInstance, 
        message: "操作无效，没有待定技能或召唤兽没有技能可替换。"
    };
  }
  const indexToReplace = Math.floor(Math.random() * summonInstance.skillSet.length);
  const replacedSkill = summonInstance.skillSet[indexToReplace];
  
  summonInstance.skillSet[indexToReplace] = pendingSkill;

  const newSkillInfo = skillConfig.find((s) => s.name === pendingSkill);
  return {
    newSummon: summonInstance,
    message: `打书成功！技能 "${replacedSkill}" 被 "${pendingSkill}" 覆盖。 (${newSkillInfo ? newSkillInfo.description : ''})`,
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
