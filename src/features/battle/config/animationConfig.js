/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-10 07:38:57
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-10 09:48:00
 */
/**
 * 战斗动画配置
 * 统一管理所有动画时长和参数
 */

export const ANIMATION_DURATIONS = {
  // 攻击相关动画
  ATTACK_MOVE: 1000,          // 攻击移动动画时长 (ms)
  HIT_REACTION: 800,         // 受击反应动画时长 (ms)
  DEATH_ANIMATION: 800,       // 死亡动画时长 (ms)
  
  // 技能相关动画
  SKILL_CAST: 1200,           // 技能释放动画时长 (ms)
  SKILL_EFFECT: 800,          // 技能效果动画时长 (ms)
  
  // 特效动画
  PROJECTILE_FLIGHT: 400,     // 抛射物飞行时长 (ms)
  DAMAGE_NUMBER: 1800,        // 伤害数字显示时长 (ms)
  DEFEND_EFFECT: 800,         // 防御特效时长 (ms)
  DEFEND: 600,                // 防御动画时长 (ms)
  
  // 组合动画时长
  TOTAL_ATTACK_SEQUENCE: 2200, // 完整攻击序列 (攻击+受击)
  KNOCKBACK_TRIGGER_TIME: 400, // 受击动画触发时机 (攻击动画的40%)
};

export const ANIMATION_EVENTS = {
  // 动画开始事件
  START_ATTACK: 'start_attack_animation',
  START_HIT: 'start_hit_animation', 
  START_DEATH: 'start_death_animation',
  
  // 动画完成事件
  ATTACK_COMPLETE: 'attack_animation_complete',
  HIT_COMPLETE: 'hit_animation_complete',
  DEATH_COMPLETE: 'death_animation_complete',
  
  // 序列完成事件
  ACTION_SEQUENCE_COMPLETE: 'action_sequence_complete',
};

export const ANIMATION_CONFIG = {
  // 动画缓动函数
  EASING: {
    ATTACK: 'ease-in-out',
    HIT: 'ease-out',
    DEATH: 'ease-in',
  },
  
  // 动画强度
  INTENSITY: {
    KNOCKBACK_DISTANCE: 30,      // 受击后退距离 (px)
    ATTACK_DISTANCE_RATIO: 0.97, // 攻击冲刺距离比例
    SCALE_MULTIPLIER: 1.2,       // 动画缩放倍数
  },
}; 