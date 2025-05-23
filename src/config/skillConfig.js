import { activeSkillConfig } from "./activeSkillConfig";
import { passiveSkillConfig } from "./passiveSkillConfig";

// 技能配置 (合并主动和被动技能)
export const skillConfig = [...activeSkillConfig, ...passiveSkillConfig];

// Helper function (optional, can be in summon calculations instead)
export const getSkillById = (id) => {
  // 先在主动技能中查找
  const activeSkill = activeSkillConfig.find((skill) => skill.id === id);
  if (activeSkill) return activeSkill;

  // 如果没找到，再在被动技能中查找
  const passiveSkill = passiveSkillConfig.find((skill) => skill.id === id);
  if (passiveSkill) return passiveSkill;

  // 如果都没找到，返回 undefined
  return undefined;
};
