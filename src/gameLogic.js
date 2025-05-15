// gameLogic.js
import { petConfig, skillConfig, qualityConfig, probabilityConfig } from "./config";

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

export const refineMonster = () => {
  const pet = getRandomPet();
  const quality = getRandomQuality();
  const qualityIndex = qualityConfig.qualities.indexOf(quality);
  const multiplier = qualityConfig.attributeMultipliers[qualityIndex];

  const newSummon = {
    name: Object.keys(petConfig).find((key) => petConfig[key] === pet),
    quality,
    attack: Math.floor(
      getRandomAttribute(...pet.attributeRanges.attack) * multiplier
    ),
    defense: Math.floor(
      getRandomAttribute(...pet.attributeRanges.defense) * multiplier
    ),
    speed: Math.floor(
      getRandomAttribute(...pet.attributeRanges.speed) * multiplier
    ),
    hp: Math.floor(
      getRandomAttribute(...pet.attributeRanges.hp) * multiplier
    ),
    skillSet: [],
  };

  const initialSkillCount = getRandomAttribute(
    probabilityConfig.initialSkillCount.min,
    probabilityConfig.initialSkillCount.max
  );
  const shuffledSkills = [...pet.initialSkills].sort(
    () => 0.5 - Math.random()
  );
  newSummon.skillSet = shuffledSkills.slice(0, initialSkillCount);

  return {
    newSummon,
    historyItem: {
      name: newSummon.name,
      quality: newSummon.quality,
      attack: newSummon.attack,
      defense: newSummon.defense,
      speed: newSummon.speed,
      hp: newSummon.hp,
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