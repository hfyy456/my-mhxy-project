// 种族类型
export const RACE_TYPES = {
  CELESTIAL: "celestial",    // 仙灵：修炼成仙的生物
  NETHER: "nether",       // 冥灵：来自幽冥的生物
  BEAST: "beast",        // 瑞兽：祥瑞神兽
  SPIRIT: "spirit",       // 精怪：天地精灵
  MACHINE: "machine",      // 机关：人造生物
  WARRIOR: "warrior",       // 神兵：天庭战士
  ANCIENT_BEAST: "ancient_beast" // 上古神兽
};

// 宠物类型
export const PET_TYPES = {
  PHYSICAL: "physical",     // 物理攻击型
  MAGICAL: "magical",      // 法术攻击型
  DEFENSE: "defense",      // 生命防御型
  SPEED: "speed",        // 速度敏捷型
  SUPPORT: "support"       // 辅助支援型
};

// 元素类型
export const ELEMENT_TYPES = {
  PHYSICAL: "physical",
  FIRE: "fire",
  WATER: "water",
  THUNDER: "thunder",
  WIND: "wind",
  EARTH: "earth",
  LIGHT: "light",
  DARK: "dark",
  POISON: "poison",
  NATURE: "nature"
};

// 五行类型
export const FIVE_ELEMENTS = {
  METAL: "metal",  // 金
  WOOD: "wood",    // 木
  WATER: "water",  // 水
  FIRE: "fire",    // 火
  EARTH: "earth"   // 土
};

// 技能类型
export const SKILL_TYPES = {
  PHYSICAL: "physical",
  MAGICAL: "magical",
  DEFENSIVE: "defensive",
  SUPPORT: "support",
  SURVIVAL: "survival",
  SPEED: "speed"
};

// 技能模式
export const SKILL_MODES = {
  PASSIVE: "passive",
  ACTIVE: "active"
};

// 技能目标类型
export const SKILL_TARGET_TYPES = {
  SINGLE: "single",      // 单体技能
  GROUP: "group",       // 群体技能
  NONE: "none"          // 无目标技能（如自身增益）
};

// 技能影响范围类型
export const SKILL_AREA_TYPES = {
  CROSS: "cross",       // 十字范围
  ROW: "row",          // 一行
  COLUMN: "column",     // 一列
  SQUARE: "square"      // 全体范围(3x3)
};

// 种族特性类型
export const RACE_TRAIT_TYPES = {
  COMBAT: "combat",
  MAGIC: "magic",
  DEFENSE: "defense",
  UTILITY: "utility",
  PASSIVE: "passive"
};

// 成长率评级
export const GROWTH_RATE_TIERS = {
  S: { min: 0.04, label: "S" },
  A: { min: 0.035, label: "A" },
  B: { min: 0.03, label: "B" },
  C: { min: 0.025, label: "C" },
  D: { min: 0.02, label: "D" }
};

// 品质等级
export const QUALITY_TYPES = {
  NORMAL: "normal",
  RARE: "rare",
  EPIC: "epic",
  LEGENDARY: "legendary",
  MYTHIC: "mythic"
};

// 装备槽位类型
export const EQUIPMENT_SLOT_TYPES = {
  ACCESSORY: "accessory",    // 装饰性物品，提供额外属性
  RELIC: "relic",        // 古老的遗物，具有特殊效果
  BLOODLINE: "bloodline",    // 血脉之力，提供种族特性
  RUNE: "rune"          // 符文之力，增强基础属性
};

// 装备效果类型
export const EQUIPMENT_EFFECT_TYPES = {
  // 基础属性
  CONSTITUTION: "constitution",    // 体质
  STRENGTH: "strength",           // 力量
  AGILITY: "agility",            // 敏捷
  INTELLIGENCE: "intelligence",   // 智力
  LUCK: "luck",                  // 幸运

  // 核心属性
  HP: "hp",                      // 生命值
  MP: "mp",                      // 法力值
  PHYSICAL_ATTACK: "physicalAttack",    // 物理攻击
  MAGICAL_ATTACK: "magicalAttack",      // 法术攻击
  PHYSICAL_DEFENSE: "physicalDefense",  // 物理防御
  MAGICAL_DEFENSE: "magicalDefense",    // 法术防御
  SPEED: "speed",                       // 速度
  CRIT_RATE: "critRate",               // 暴击率
  CRIT_DAMAGE: "critDamage",           // 暴击伤害
  DODGE_RATE: "dodgeRate",             // 闪避率

  // 特殊效果
  HP_RECOVERY: "hpRecovery",           // 生命恢复
  MP_RECOVERY: "mpRecovery",           // 法力恢复
  FIRE_RESISTANCE: "fireResistance",   // 火焰抗性
  WATER_RESISTANCE: "waterResistance", // 水系抗性
  THUNDER_RESISTANCE: "thunderResistance", // 雷电抗性
  POISON_RESISTANCE: "poisonResistance",   // 毒素抗性
  CONTROL_RESISTANCE: "controlResistance"  // 控制抗性
};

// 物品类型
export const ITEM_TYPES = {
  EQUIPMENT: "equipment",    // 装备
  CONSUMABLE: "consumable",  // 消耗品
  MATERIAL: "material",      // 材料
  QUEST: "quest",           // 任务物品
};

// 基础属性类型
export const ATTRIBUTE_TYPES = {
  CONSTITUTION: "constitution",    // 体质
  STRENGTH: "strength",           // 力量
  AGILITY: "agility",            // 敏捷
  INTELLIGENCE: "intelligence",   // 智力
  LUCK: "luck"                   // 幸运
};

// 颜色类型（基于Tailwind）
export const COLOR_TYPES = {
  BLUE: "blue-500",
  AMBER: "amber-500",
  YELLOW: "yellow-500",
  GREEN: "green-500",
  ORANGE: "orange-500",
  PINK: "pink-500",
  BROWN: "brown-500",
  INDIGO: "indigo-500"
};

// 五行颜色
export const FIVE_ELEMENT_COLORS = {
  [FIVE_ELEMENTS.METAL]: "bg-yellow-400 text-yellow-900",   // 金 (金色)
  [FIVE_ELEMENTS.WOOD]: "bg-green-500 text-green-100",  // 木 (绿色)
  [FIVE_ELEMENTS.WATER]: "bg-blue-500 text-blue-100",   // 水 (蓝色)
  [FIVE_ELEMENTS.FIRE]: "bg-red-500 text-red-100",     // 火 (红色)
  [FIVE_ELEMENTS.EARTH]: "bg-yellow-700 text-yellow-100" // 土 (褐色) - 使用深黄色代表土褐色
};

// 技能效果类型
export const SKILL_EFFECTS = {
  CRIT: "crit",                    // 暴击
  SPEED_BOOST: "speedBoost",       // 速度提升
  PERCEPTION: "perception",        // 感知
  MAGIC_HEART: "magicHeart",      // 魔之心
  DIVINE_PROTECTION: "divineProtection", // 神佑
  STEALTH: "stealth",             // 隐身
  COUNTER: "counter",             // 反震
  DEFENSE_BOOST: "defenseBoost",  // 防御提升
  MAGIC_CHAIN: "magicChain",      // 法术连击
  NIGHT_COMBAT: "nightCombat",    // 夜战
  POWER_STRIKE: "powerStrike",    // 强力
  COMBO: "combo",                 // 连击
  MAGIC_SURGE: "magicSurge"       // 法术波动
};

// 被动技能触发时机
export const PASSIVE_SKILL_TIMING = {
  // 回合相关
  TURN_START: "turn_start",          // 回合开始时
  TURN_END: "turn_end",             // 回合结束时
  
  // 普通攻击相关
  BEFORE_NORMAL_ATTACK: "before_normal_attack",   // 普通攻击前
  AFTER_NORMAL_ATTACK: "after_normal_attack",    // 普通攻击后
  
  // 法术技能相关
  BEFORE_MAGIC_SKILL: "before_magic_skill",     // 法术技能攻击前
  AFTER_MAGIC_SKILL: "after_magic_skill",      // 法术技能攻击后
  
  // 物理技能相关
  BEFORE_PHYSICAL_SKILL: "before_physical_skill", // 物理技能攻击前
  AFTER_PHYSICAL_SKILL: "after_physical_skill",  // 物理技能攻击后
  
  // 任何攻击相关
  BEFORE_ANY_ATTACK: "before_any_attack",      // 任何攻击前
  AFTER_ANY_ATTACK: "after_any_attack",       // 任何攻击后
  
  // 伤害相关
  ON_PHYSICAL_DAMAGE: "on_physical_damage",    // 受到物理伤害时
  ON_MAGICAL_DAMAGE: "on_magical_damage",     // 受到法术伤害时
  ON_ANY_DAMAGE: "on_any_damage",           // 受到任何伤害时
  AFTER_DAMAGE: "after_damage",             // 受到伤害后
  
  // 战斗状态相关
  ON_DODGE: "on_dodge",                    // 闪避成功时
  ON_CRIT: "on_crit",                     // 暴击成功时
  ON_KILL: "on_kill",                     // 击杀目标时
  ON_DEATH: "on_death",                   // 死亡时
  
  // 战斗开始结束
  BATTLE_START: "battle_start",             // 战斗开始时
  BATTLE_END: "battle_end",                // 战斗结束时
  
  // 其他
  ALWAYS: "always"                         // 始终生效
};

// Unique ID Prefixes
export const UNIQUE_ID_PREFIXES = {
  ITEM: "item",
  SUMMON: "summon",
  TOAST: "toast",
  BATTLE_UNIT: "battle_unit", // 战斗单位 ID 前缀
  DEFAULT: "id",
  // Add other prefixes as needed
};

// Refinement Sources
export const REFINEMENT_SOURCES = {
  REFINEMENT: "refinement",
  // Add other sources as needed
};

// 战斗阶段
export const BATTLE_PHASES = {
  PREPARATION: "preparation",           // 准备阶段 - 玩家选择行动
  PLAYER_TARGET_SELECTION: "player_target_selection", // 玩家选择目标阶段
  EXECUTION: "execution",              // 执行阶段 - 按速度顺序执行行动
  AWAITING_FINAL_ANIMATION: "awaiting_final_animation", // 等待最终动画完成
  BATTLE_OVER: "battle_over",          // 战斗结束
  BATTLE_END: "battle_end"             // 战斗完全结束，准备退出
};

// 战斗单位类型
export const BATTLE_UNIT_TYPES = {
  PLAYER: "player",                    // 玩家单位
  ENEMY: "enemy",                     // 敌方单位
  NEUTRAL: "neutral",                  // 中立单位
  ENVIRONMENT: "environment"           // 环境单位（如障碍物）
};

// Skill Operation Outcomes
export const SKILL_OPERATION_OUTCOMES = {
  FAILURE_LEVEL_RESTRICTION: "FAILURE_LEVEL_RESTRICTION",
  FAILURE_NO_SKILL_CHANGE: "FAILURE_NO_SKILL_CHANGE",
  FAILURE_CONFIG_NOT_FOUND: "FAILURE_CONFIG_NOT_FOUND",
  FAILURE_ACTIVE_SKILL_LIMIT: "FAILURE_ACTIVE_SKILL_LIMIT",
  SUCCESS_SKILL_ALREADY_PRESENT: "SUCCESS_SKILL_ALREADY_PRESENT",
  SUCCESS_REPLACEMENT_NEEDED: "SUCCESS_REPLACEMENT_NEEDED",
  SUCCESS_ADD_SKILL: "SUCCESS_ADD_SKILL",
  INVALID_OPERATION: "INVALID_OPERATION",
  SKILL_REPLACED: "SKILL_REPLACED",
  // Add other outcomes as needed
};

// Toast Types
export const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
};

// ID Generation Constants
export const ID_GENERATION_CONSTANTS = {
  FALLBACK_INDICATOR: "fb",
};

// Summon Sources
export const SUMMON_SOURCES = {
  INCUBATION: "incubation",
  REFINEMENT: "refinement", // Matches REFINEMENT_SOURCES.REFINEMENT
  CAPTURE: "capture",
  GIFT: "gift",
  // Add other sources as needed
};

// Sort Orders
export const SORT_ORDERS = {
  ASC: "asc",
  DESC: "desc",
}; 