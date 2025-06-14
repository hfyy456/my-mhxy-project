/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-15 05:39:50
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-15 05:44:12
 */
// src/features/battle/v3/logic/skillConfig.js

export const skills = {
  // A basic attack is also treated as a skill for consistency.
  'basic_attack': {
    name: '普通攻击',
    targetType: 'enemy_single',
    animationScriptTemplate: [
      { type: 'ENTITY_ANIMATION', target: 'source', animationName: 'attack_lunge', delay: 0 },
      { type: 'ENTITY_ANIMATION', target: 'primaryTarget', animationName: 'take_hit_shake', delay: 300 },
      { type: 'SHOW_FLOATING_TEXT', target: 'primaryTarget', text: '{{damage}}', color: '#ff4d4d', delay: 400 },
      { type: 'ENTITY_ANIMATION', target: 'source', animationName: 'return_to_idle', delay: 600 }
    ],
    effects: [
      { type: 'DAMAGE', value: '1.0 * pAtk', element: 'physical' },
    ]
  },
  'fire_slash': {
    name: '火焰斩',
    targetType: 'enemy_single',
    animationScriptTemplate: [
      { type: 'ENTITY_ANIMATION', target: 'source', animationName: 'attack_lunge', delay: 0 },
      { type: 'SHOW_VFX', target: 'source', vfxName: 'fire_aura_start', delay: 100 },
      { type: 'ENTITY_ANIMATION', target: 'primaryTarget', animationName: 'take_hit_shake', delay: 300 },
      { type: 'SHOW_VFX', target: 'primaryTarget', vfxName: 'fire_slash_impact', delay: 300 },
      { type: 'SHOW_FLOATING_TEXT', target: 'primaryTarget', text: '{{damage}}', color: '#ff9933', delay: 400 },
      { type: 'ENTITY_ANIMATION', target: 'source', animationName: 'return_to_idle', delay: 600 }
    ],
    effects: [
      { type: 'DAMAGE', value: '1.5 * pAtk', element: 'fire' },
    ]
  },
  'self_heal': {
    name: '自我治疗',
    targetType: 'self',
    animationScriptTemplate: [
        { type: 'SHOW_VFX', target: 'source', vfxName: 'heal_aura', delay: 100 },
        { type: 'SHOW_FLOATING_TEXT', target: 'source', text: '+{{healAmount}}', color: '#33cc33', delay: 300 },
    ],
    effects: [
        { type: 'HEAL', value: '0.5 * mAtk' }
    ]
  }
}; 