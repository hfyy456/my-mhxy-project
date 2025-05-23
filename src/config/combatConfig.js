/**
 * 战斗系统配置参数
 * 包含伤害计算、战斗机制等相关常量
 */

// 伤害计算相关常量
export const DAMAGE_CONSTANTS = {
  // 物理伤害相关常量
  PHYSICAL: {
    BALANCE_CONSTANT: 1000,       // 物理伤害平衡常数 k = 1000
    DEFAULT_CRIT_RATE: 0.05,      // 默认暴击率 5%
    DEFAULT_CRIT_DAMAGE: 1.5,     // 默认暴击伤害 150%
    DAMAGE_VARIATION: 0.05,       // 伤害浮动范围 ±5%
  },
  
  // 法术伤害相关常量
  MAGICAL: {
    BALANCE_CONSTANT: 800,        // 法术伤害平衡常数 k' = 800
    DEFAULT_CRIT_RATE: 0.05,      // 默认暴击率 5%
    DEFAULT_CRIT_DAMAGE: 1.5,     // 默认暴击伤害 150%
    DAMAGE_VARIATION: 0.05,       // 伤害浮动范围 ±5%
  },
  
  // 通用伤害常量
  COMMON: {
    DEFAULT_SKILL_BONUS: 1,       // 默认技能加成系数
    DEFAULT_FIXED_REDUCTION: 0,   // 默认固定减伤值
    DEFAULT_PERCENT_REDUCTION: 0, // 默认百分比减伤
  }
};

// 战斗系统其他常量
export const COMBAT_CONSTANTS = {
  // 战斗回合相关
  MAX_TURNS: 30,                  // 最大回合数
  TURN_TIMEOUT: 30000,            // 回合超时时间（毫秒）
  
  // 战斗状态相关
  STATUS_EFFECT_DURATION: {
    SHORT: 2,                     // 短效状态持续回合数
    MEDIUM: 3,                    // 中效状态持续回合数
    LONG: 5                       // 长效状态持续回合数
  },
  
  // 战斗AI相关
  AI_AGGRESSION_LEVELS: {
    LOW: 0.3,                     // 低攻击性
    MEDIUM: 0.6,                  // 中等攻击性
    HIGH: 0.9                     // 高攻击性
  }
};

export default {
  DAMAGE_CONSTANTS,
  COMBAT_CONSTANTS
};
