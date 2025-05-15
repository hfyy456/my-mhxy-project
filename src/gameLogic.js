// gameLogic.js
import {
  petConfig,
  skillConfig,
  qualityConfig,
  probabilityConfig,
} from "./config";

export const getRandomPet = () => {
  const pets = Object.values(petConfig);
  return pets[Math.floor(Math.random() * pets.length)];
};

export const getRandomQuality = () => {
  return qualityConfig.qualities[
    Math.floor(Math.random() * qualityConfig.qualities.length)
  ];
};

export const getRandomAttribute = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const getRandomSkill = () => {
  return skillConfig[Math.floor(Math.random() * skillConfig.length)].name;
};

// 衍生属性计算逻辑
import { derivedAttributeConfig } from "./config";

export const calculateDerivedAttributes = (basicAttributes, petName, level) => {
  console.log(
    "Calculating derived attributes for:",
    petName,
    "at level",
    level
  );

  const derived = {};
  for (const [attribute, config] of Object.entries(derivedAttributeConfig)) {
    let value = 0;
    for (const attr of config.attributes) {
      value += Number(basicAttributes[attr] * config.multiplier);
    }
    if (["critRate", "critDamage", "dodgeRate"].includes(attribute)) {
      value = parseFloat((value * 100).toFixed(1)) + "%";
    } else {
      value = Math.floor(value);
    }
    derived[attribute] = value;
  }
  return derived;
};

// 修改refineMonster函数
export const refineMonster = () => {
  const pet = getRandomPet();
  console.log(pet);
  const quality = getRandomQuality();
  const qualityIndex = qualityConfig.qualities.indexOf(quality);
  const multiplier = qualityConfig.attributeMultipliers[qualityIndex];

  const basicAttributes = {
    constitution: Math.floor(
      getRandomAttribute(...pet.basicAttributeRanges.constitution) * multiplier
    ),
    strength: Math.floor(
      getRandomAttribute(...pet.basicAttributeRanges.strength) * multiplier
    ),
    agility: Math.floor(
      getRandomAttribute(...pet.basicAttributeRanges.agility) * multiplier
    ),
    intelligence: Math.floor(
      getRandomAttribute(...pet.basicAttributeRanges.intelligence) * multiplier
    ),
    luck: Math.floor(
      getRandomAttribute(...pet.basicAttributeRanges.luck) * multiplier
    ),
  };
  const level = 100; // 初始等级为1

  const derivedAttributes = calculateDerivedAttributes(
    basicAttributes,
    Object.keys(petConfig).find((key) => petConfig[key] === pet),
    level
  );

  const newSummon = {
    name: Object.keys(petConfig).find((key) => petConfig[key] === pet),
    level: level, // 初始等级为1
    quality,
    basicAttributes,
    derivedAttributes,
    skillSet: [],
  };

  const initialSkillCount = getRandomAttribute(
    probabilityConfig.initialSkillCount.min,
    probabilityConfig.initialSkillCount.max
  );
  const shuffledSkills = [...pet.initialSkills].sort(() => 0.5 - Math.random());
  newSummon.skillSet = shuffledSkills.slice(0, initialSkillCount);

  return {
    newSummon,
    historyItem: {
      name: newSummon.name,
      quality: newSummon.quality,
      basicAttributes: newSummon.basicAttributes,
      derivedAttributes: newSummon.derivedAttributes,
      skills: [...newSummon.skillSet],
    },
    message: `炼妖成功！召唤兽 ${newSummon.name} (${newSummon.quality}) 生成完毕。`,
  };
};

export const bookSkill = (summon) => {
  const skill = getRandomSkill();
  const success = Math.random() < probabilityConfig.bookSuccessRate;

  if (!success) {
    return {
      success: false,
      message: "打书失败，技能未添加",
    };
  }

  const skillInfo = skillConfig.find((s) => s.name === skill);
  const activeSkills = summon.skillSet.filter((skillName) => {
    const skill = skillConfig.find((s) => s.name === skillName);
    return skill?.mode === "主动";
  }).length;

  if (skillInfo.mode === "主动" && activeSkills >= 2) {
    return {
      success: false,
      message: "打书失败：最多只能拥有2个主动技能。",
    };
  }

  if (summon.skillSet.includes(skill)) {
    return {
      success: true,
      newSummon: summon,
      message: `打书成功！但是技能“${skill}”已存在，无需添加。`,
    };
  } else if (summon.skillSet.length >= 12) {
    return {
      success: true,
      needConfirm: true,
      pendingSkill: skill,
    };
  } else {
    return {
      success: true,
      newSummon: {
        ...summon,
        skillSet: [...summon.skillSet, skill],
      },
      message: `打书成功！获得技能：${skill} (${skillInfo.description})`,
    };
  }
};

export const confirmReplaceSkill = (summon, pendingSkill) => {
  const index = Math.floor(Math.random() * summon.skillSet.length);
  const replaced = summon.skillSet[index];
  const newSkillSet = [...summon.skillSet];
  newSkillSet[index] = pendingSkill;

  const newSummon = {
    ...summon,
    skillSet: newSkillSet,
  };

  const skillInfo = skillConfig.find((s) => s.name === pendingSkill);
  return {
    newSummon,
    message: `打书成功！技能“${replaced}”被“${pendingSkill}”覆盖。 (${skillInfo.description})`,
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
  const pet = petConfig[petName];
  if (!pet) {
    throw new Error("未找到该宠物的配置信息");
  }

  let attributes = { ...currentAttributes };
  for (let i = 1; i < level; i++) {
    for (const attr in attributes) {
      if (
        attributes.hasOwnProperty(attr) &&
        pet.growthRates[attr] !== undefined
      ) {
        attributes[attr] = Math.floor(
          attributes[attr] + attributes[attr] * (pet.growthRates[attr] * 0.04)
        );
      }
    }
  }

  return attributes;
};
