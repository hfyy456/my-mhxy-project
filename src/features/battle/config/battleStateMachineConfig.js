/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-01-27
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-01-27
 * @Description: 战斗状态机配置 - 定义状态转换规则和时间设置
 */

// 状态机时间配置
export const STATE_MACHINE_TIMING = {
  // 阶段转换延迟（毫秒）
  INITIALIZATION_DELAY: 100,          // 初始化延迟
  ROUND_START_DELAY: 500,             // 回合开始延迟
  PREPARATION_AUTO_ADVANCE: 2000,     // 准备阶段自动推进延迟
  EXECUTION_ACTION_DELAY: 1000,       // 执行阶段行动间隔
  RESOLUTION_DELAY: 1500,             // 结算阶段延迟
  BUFF_PROCESS_DELAY: 300,            // BUFF处理延迟
  ANIMATION_WAIT: 800,                // 动画等待时间
  
  // 自动战斗时间
  AUTO_BATTLE_PREPARATION: 1000,      // 自动战斗准备阶段等待
  AUTO_BATTLE_EXECUTION: 3000,        // 自动战斗执行阶段等待
  
  // 超时设置
  PREPARATION_TIMEOUT: 30000,         // 准备阶段超时（30秒）
  EXECUTION_TIMEOUT: 60000,           // 执行阶段超时（60秒）
  RESOLUTION_TIMEOUT: 10000           // 结算阶段超时（10秒）
};

// 状态机行为配置
export const STATE_MACHINE_BEHAVIOR = {
  // 自动推进设置
  AUTO_ADVANCE_PREPARATION: false,    // 是否自动推进准备阶段
  AUTO_ADVANCE_EXECUTION: true,       // 是否自动推进执行阶段
  AUTO_ADVANCE_RESOLUTION: true,      // 是否自动推进结算阶段
  
  // 错误处理
  ERROR_RECOVERY_ENABLED: true,       // 是否启用错误恢复
  ERROR_RECOVERY_DELAY: 1000,         // 错误恢复延迟
  MAX_ERROR_RETRIES: 3,               // 最大错误重试次数
  
  // 日志设置
  ENABLE_STATE_LOGGING: true,         // 是否启用状态日志
  ENABLE_TRANSITION_LOGGING: true,    // 是否启用转换日志
  ENABLE_ACTION_LOGGING: true,        // 是否启用行动日志
  
  // 调试模式
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  PAUSE_ON_ERROR: false,              // 是否在错误时暂停
  SHOW_STATE_HISTORY: true            // 是否显示状态历史
};

// 状态转换规则
export const STATE_TRANSITION_RULES = {
  // 允许的状态转换
  ALLOWED_TRANSITIONS: {
    idle: ['initialization'],
    initialization: ['active'],
    active: ['end'],
    end: ['idle']
  },
  
  // 子状态转换规则
  SUB_STATE_TRANSITIONS: {
    active: {
      round_start: ['preparation'],
      preparation: ['execution'],
      execution: ['resolution'],
      resolution: ['round_start', 'end']
    }
  },
  
  // 强制转换条件
  FORCE_TRANSITION_CONDITIONS: {
    // 超时强制转换
    timeout: {
      preparation: 'execution',
      execution: 'resolution',
      resolution: 'round_start'
    },
    
    // 错误状态强制转换
    error: {
      any: 'end'
    }
  }
};

// 状态验证规则
export const STATE_VALIDATION_RULES = {
  // 状态前置条件
  PRECONDITIONS: {
    initialization: () => true,
    preparation: (state) => state.battleUnits && Object.keys(state.battleUnits).length > 0,
    execution: (state) => state.unitActions && Object.keys(state.unitActions).length > 0,
    resolution: (state) => true,
    end: (state) => true
  },
  
  // 状态后置条件
  POSTCONDITIONS: {
    initialization: (state) => state.isActive,
    preparation: (state) => Object.keys(state.unitActions).length > 0,
    execution: (state) => true,
    resolution: (state) => true,
    end: (state) => !state.isActive
  }
};

// 事件优先级配置
export const EVENT_PRIORITY = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  
  // 事件优先级映射
  PRIORITIES: {
    START_BATTLE: 1,
    BATTLE_END: 1,
    RESET_BATTLE: 1,
    INITIALIZATION_COMPLETE: 2,
    PREPARATION_COMPLETE: 2,
    EXECUTION_COMPLETE: 2,
    RESOLUTION_COMPLETE: 2,
    ROUND_START: 2,
    BUFFS_PROCESSED: 3,
    ACTIONS_SELECTED: 3,
    ACTION_EXECUTED: 3
  }
};

// 状态机工厂配置
export const STATE_MACHINE_FACTORY_CONFIG = {
  // 默认配置
  DEFAULT_CONFIG: {
    enableLogging: STATE_MACHINE_BEHAVIOR.ENABLE_STATE_LOGGING,
    enableErrorRecovery: STATE_MACHINE_BEHAVIOR.ERROR_RECOVERY_ENABLED,
    enableAutoAdvance: true,
    debugMode: STATE_MACHINE_BEHAVIOR.DEBUG_MODE
  },
  
  // 测试模式配置
  TEST_CONFIG: {
    enableLogging: false,
    enableErrorRecovery: false,
    enableAutoAdvance: true,
    debugMode: false,
    acceleratedTiming: true
  },
  
  // 生产模式配置
  PRODUCTION_CONFIG: {
    enableLogging: false,
    enableErrorRecovery: true,
    enableAutoAdvance: true,
    debugMode: false
  }
};

// 状态机中间件配置
export const STATE_MACHINE_MIDDLEWARE = {
  // 中间件类型
  TYPES: {
    LOGGER: 'logger',
    VALIDATOR: 'validator',
    TIMER: 'timer',
    ERROR_HANDLER: 'error_handler',
    ANALYTICS: 'analytics'
  },
  
  // 中间件配置
  CONFIGS: {
    logger: {
      enabled: STATE_MACHINE_BEHAVIOR.ENABLE_STATE_LOGGING,
      level: 'info',
      format: 'detailed'
    },
    
    validator: {
      enabled: true,
      strictMode: false,
      validatePreconditions: true,
      validatePostconditions: false
    },
    
    timer: {
      enabled: true,
      trackTransitionTime: true,
      trackStateTime: true,
      reportSlowTransitions: true,
      slowTransitionThreshold: 1000
    },
    
    errorHandler: {
      enabled: STATE_MACHINE_BEHAVIOR.ERROR_RECOVERY_ENABLED,
      maxRetries: STATE_MACHINE_BEHAVIOR.MAX_ERROR_RETRIES,
      retryDelay: STATE_MACHINE_BEHAVIOR.ERROR_RECOVERY_DELAY,
      fallbackState: 'end'
    },
    
    analytics: {
      enabled: false,
      collectMetrics: false,
      reportErrors: true
    }
  }
};

// 导出完整配置
export const BATTLE_STATE_MACHINE_CONFIG = {
  timing: STATE_MACHINE_TIMING,
  behavior: STATE_MACHINE_BEHAVIOR,
  transitions: STATE_TRANSITION_RULES,
  validation: STATE_VALIDATION_RULES,
  events: EVENT_PRIORITY,
  factory: STATE_MACHINE_FACTORY_CONFIG,
  middleware: STATE_MACHINE_MIDDLEWARE
};

export default BATTLE_STATE_MACHINE_CONFIG; 