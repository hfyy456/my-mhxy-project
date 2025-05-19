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

  // 衍生属性
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