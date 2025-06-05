import { SKILL_TYPES, SKILL_MODES, SKILL_TARGET_TYPES, SKILL_AREA_TYPES, ELEMENT_TYPES, PASSIVE_SKILL_TIMING } from '@/config/enumConfig';

// 导入JSON配置文件
import activeSkillsJson from './activeSkills.json';
import passiveSkillsJson from './passiveSkills.json';

/**
 * 枚举值映射表 - 将字符串转换为对应的枚举值
 */
const ENUM_MAPPINGS = {
  skillTypes: {
    'physical': SKILL_TYPES.PHYSICAL,
    'magical': SKILL_TYPES.MAGICAL,
    'defensive': SKILL_TYPES.DEFENSIVE,
    'support': SKILL_TYPES.SUPPORT,
    'survival': SKILL_TYPES.SURVIVAL,
    'speed': SKILL_TYPES.SPEED,
    'attack': SKILL_TYPES.ATTACK,
    'healing': SKILL_TYPES.HEALING,
    'passive': SKILL_TYPES.PASSIVE
  },
  skillModes: {
    'active': SKILL_MODES.ACTIVE,
    'passive': SKILL_MODES.PASSIVE
  },
  targetTypes: {
    'self': SKILL_TARGET_TYPES.SELF,
    'ally': SKILL_TARGET_TYPES.ALLY,
    'enemy': SKILL_TARGET_TYPES.ENEMY,
    'single': SKILL_TARGET_TYPES.SINGLE,
    'group': SKILL_TARGET_TYPES.GROUP,
    'area': SKILL_TARGET_TYPES.AREA,
    'none': SKILL_TARGET_TYPES.NONE
  },
  areaTypes: {
    'single': SKILL_AREA_TYPES.SINGLE,
    'cross': SKILL_AREA_TYPES.CROSS,
    'square': SKILL_AREA_TYPES.SQUARE,
    'circle': SKILL_AREA_TYPES.CIRCLE,
    'line': SKILL_AREA_TYPES.LINE
  },
  elements: {
    'fire': ELEMENT_TYPES.FIRE,
    'water': ELEMENT_TYPES.WATER,
    'earth': ELEMENT_TYPES.EARTH,
    'wind': ELEMENT_TYPES.WIND,
    'thunder': ELEMENT_TYPES.THUNDER,
    'poison': ELEMENT_TYPES.POISON,
    'light': ELEMENT_TYPES.LIGHT,
    'dark': ELEMENT_TYPES.DARK,
    'nether': ELEMENT_TYPES.NETHER,
    'none': ELEMENT_TYPES.NONE
  },
  passiveTimings: {
    'always': PASSIVE_SKILL_TIMING.ALWAYS,
    'battle_start': PASSIVE_SKILL_TIMING.BATTLE_START,
    'battle_end': PASSIVE_SKILL_TIMING.BATTLE_END,
    'turn_start': PASSIVE_SKILL_TIMING.TURN_START,
    'turn_end': PASSIVE_SKILL_TIMING.TURN_END,
    'before_normal_attack': PASSIVE_SKILL_TIMING.BEFORE_NORMAL_ATTACK,
    'after_normal_attack': PASSIVE_SKILL_TIMING.AFTER_NORMAL_ATTACK,
    'before_magic_skill': PASSIVE_SKILL_TIMING.BEFORE_MAGIC_SKILL,
    'after_magic_skill': PASSIVE_SKILL_TIMING.AFTER_MAGIC_SKILL,
    'before_physical_skill': PASSIVE_SKILL_TIMING.BEFORE_PHYSICAL_SKILL,
    'after_physical_skill': PASSIVE_SKILL_TIMING.AFTER_PHYSICAL_SKILL,
    'before_any_attack': PASSIVE_SKILL_TIMING.BEFORE_ANY_ATTACK,
    'after_any_attack': PASSIVE_SKILL_TIMING.AFTER_ANY_ATTACK,
    'on_physical_damage': PASSIVE_SKILL_TIMING.ON_PHYSICAL_DAMAGE,
    'on_magical_damage': PASSIVE_SKILL_TIMING.ON_MAGICAL_DAMAGE,
    'on_any_damage': PASSIVE_SKILL_TIMING.ON_ANY_DAMAGE,
    'after_damage': PASSIVE_SKILL_TIMING.AFTER_DAMAGE,
    'on_dodge': PASSIVE_SKILL_TIMING.ON_DODGE,
    'on_crit': PASSIVE_SKILL_TIMING.ON_CRIT,
    'on_kill': PASSIVE_SKILL_TIMING.ON_KILL,
    'on_death': PASSIVE_SKILL_TIMING.ON_DEATH,
    'ally_defeated': PASSIVE_SKILL_TIMING.ALLY_DEFEATED,
    'on_buff_applied': PASSIVE_SKILL_TIMING.ON_BUFF_APPLIED,
    'on_debuff_applied': PASSIVE_SKILL_TIMING.ON_DEBUFF_APPLIED,
    'on_action': PASSIVE_SKILL_TIMING.ON_ACTION,
    'before_action': PASSIVE_SKILL_TIMING.BEFORE_ACTION,
    'after_action': PASSIVE_SKILL_TIMING.AFTER_ACTION
  }
};

/**
 * 转换单个技能配置，将字符串枚举值转换为实际枚举值
 * @param {Object} skill - 技能配置对象
 * @returns {Object} - 转换后的技能配置
 */
function transformSkillConfig(skill) {
  const transformed = { ...skill };

  // 转换枚举字段
  if (transformed.type && ENUM_MAPPINGS.skillTypes[transformed.type]) {
    transformed.type = ENUM_MAPPINGS.skillTypes[transformed.type];
  }

  if (transformed.mode && ENUM_MAPPINGS.skillModes[transformed.mode]) {
    transformed.mode = ENUM_MAPPINGS.skillModes[transformed.mode];
  }

  if (transformed.targetType && ENUM_MAPPINGS.targetTypes[transformed.targetType]) {
    transformed.targetType = ENUM_MAPPINGS.targetTypes[transformed.targetType];
  }

  if (transformed.areaType && ENUM_MAPPINGS.areaTypes[transformed.areaType]) {
    transformed.areaType = ENUM_MAPPINGS.areaTypes[transformed.areaType];
  }

  if (transformed.element && ENUM_MAPPINGS.elements[transformed.element]) {
    transformed.element = ENUM_MAPPINGS.elements[transformed.element];
  }

  if (transformed.elementType && ENUM_MAPPINGS.elements[transformed.elementType]) {
    transformed.elementType = ENUM_MAPPINGS.elements[transformed.elementType];
  }

  if (transformed.timing && ENUM_MAPPINGS.passiveTimings[transformed.timing]) {
    transformed.timing = ENUM_MAPPINGS.passiveTimings[transformed.timing];
  }

  return transformed;
}

/**
 * 加载并转换主动技能配置
 */
export const activeSkillConfig = activeSkillsJson.skills.map(transformSkillConfig);

/**
 * 加载并转换被动技能配置
 */
export const passiveSkillConfig = passiveSkillsJson.skills.map(transformSkillConfig);

/**
 * 合并的技能配置
 */
export const skillConfig = [...activeSkillConfig, ...passiveSkillConfig];

/**
 * 根据ID获取主动技能
 * @param {string} id - 技能ID
 * @returns {Object|null} - 技能配置或null
 */
export const getActiveSkillById = (id) => {
  return activeSkillConfig.find(skill => skill.id === id) || null;
};

/**
 * 根据ID获取被动技能
 * @param {string} id - 技能ID
 * @returns {Object|null} - 技能配置或null
 */
export const getPassiveSkillById = (id) => {
  return passiveSkillConfig.find(skill => skill.id === id) || null;
};

/**
 * 根据ID获取技能配置
 * @param {string} id - 技能ID
 * @returns {Object|null} - 技能配置或null
 */
export const getSkillById = (id) => {
  return skillConfig.find(skill => skill.id === id) || null;
};

/**
 * 根据类型获取技能列表
 * @param {string} type - 技能类型
 * @returns {Array} - 技能配置数组
 */
export const getSkillsByType = (type) => {
  return skillConfig.filter(skill => skill.type === type);
};

/**
 * 根据模式获取技能列表
 * @param {string} mode - 技能模式 (active/passive)
 * @returns {Array} - 技能配置数组
 */
export const getSkillsByMode = (mode) => {
  const modeEnum = ENUM_MAPPINGS.skillModes[mode];
  return skillConfig.filter(skill => skill.mode === modeEnum);
};

/**
 * 获取指定触发时机的被动技能
 * @param {string} timing - 触发时机
 * @returns {Array} - 被动技能数组
 */
export const getPassiveSkillsByTiming = (timing) => {
  const timingEnum = ENUM_MAPPINGS.passiveTimings[timing];
  return passiveSkillConfig.filter(skill => skill.timing === timingEnum);
};

/**
 * 将技能配置转换回JSON格式（用于保存）
 * @param {Object} skill - 技能配置对象
 * @returns {Object} - JSON格式的技能配置
 */
export function transformSkillToJson(skill) {
  const jsonSkill = { ...skill };

  // 反向转换枚举值为字符串
  for (const [category, mappings] of Object.entries(ENUM_MAPPINGS)) {
    for (const [key, value] of Object.entries(mappings)) {
      if (jsonSkill.type === value) jsonSkill.type = key;
      if (jsonSkill.mode === value) jsonSkill.mode = key;
      if (jsonSkill.targetType === value) jsonSkill.targetType = key;
      if (jsonSkill.areaType === value) jsonSkill.areaType = key;
      if (jsonSkill.element === value) jsonSkill.element = key;
      if (jsonSkill.elementType === value) jsonSkill.elementType = key;
      if (jsonSkill.timing === value) jsonSkill.timing = key;
    }
  }

  return jsonSkill;
}

/**
 * 获取原始JSON配置（用于配置管理器）
 */
export const getRawActiveSkillsJson = () => activeSkillsJson;
export const getRawPassiveSkillsJson = () => passiveSkillsJson;

// 导出枚举映射表供其他模块使用
export { ENUM_MAPPINGS }; 