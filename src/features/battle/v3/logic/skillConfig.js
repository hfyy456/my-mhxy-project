/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-15 05:39:50
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-19 05:51:42
 */
// src/features/battle/v3/logic/skillConfig.js

export const skills = {
  // A basic attack is also treated as a skill for consistency.
  'basic_attack': {
    name: '普通攻击',
    targetType: 'enemy',
    areaType: 'single',
    animationScriptTemplate: [
      { type: 'ENTITY_ANIMATION', target: 'source', animationName: 'attack_lunge', delay: 0 },
      { type: 'ENTITY_ANIMATION', target: 'primaryTarget', animationName: 'take_hit_shake', delay: 300 },
      { type: 'SHOW_FLOATING_TEXT', target: 'primaryTarget', text: '{{damage}}', color: '#ff4d4d', delay: 400 },
      { type: 'ENTITY_ANIMATION', target: 'source', animationName: 'return_to_idle', delay: 600 }
    ],
    damage: 1.0,
    effects: [
      { type: 'DAMAGE', value: '1.0 * pAtk', element: 'physical' },
    ]
  },
  'fire_slash': {
    name: '火焰十字斩',
    targetType: 'enemy',
    areaType: 'cross',
    animationScriptTemplate: [
      { type: 'ENTITY_ANIMATION', target: 'source', animationName: 'attack_lunge', delay: 0 },
      { type: 'SHOW_VFX', target: 'source', vfxName: 'fire_aura_start', delay: 100 },
      { type: 'ENTITY_ANIMATION', target: 'primaryTarget', animationName: 'take_hit_shake', delay: 300 },
      { type: 'SHOW_VFX', target: 'primaryTarget', vfxName: 'fire_slash_impact', delay: 300 },
      { type: 'SHOW_FLOATING_TEXT', target: 'primaryTarget', text: '{{damage}}', color: '#ff9933', delay: 400 },
      { type: 'ENTITY_ANIMATION', target: 'source', animationName: 'return_to_idle', delay: 600 }
    ],
    damage: 1.2,
    effects: [
      { type: 'DAMAGE', value: '1.2 * pAtk', element: 'fire' },
    ]
  },
  'fire_storm': {
    name: '火焰风暴',
    targetType: 'enemy',
    areaType: 'group', // 全体
    damage: 0.8,
    effects: [
      { type: 'DAMAGE', value: '0.8 * pAtk', element: 'fire' },
    ]
  },
  'self_heal': {
    name: '治疗',
    targetType: 'ally',
    areaType: 'single', // 对自身施法也是'single'
    animationScriptTemplate: [
        { type: 'SHOW_VFX', target: 'source', vfxName: 'heal_aura', delay: 100 },
        { type: 'SHOW_FLOATING_TEXT', target: 'source', text: '+{{healAmount}}', color: '#33cc33', delay: 300 },
    ],
    effects: [
        { type: 'HEAL', value: '0.5 * mAtk' }
    ]
  },
  'capture': {
    id: 'capture',
    name: '捕捉',
    description: '尝试捕捉一个敌方单位。目标生命值越低，成功率越高。',
    targetType: 'enemy',
    areaType: 'single',
    animation: 'support_cast',
  },
  'defend': {
    id: 'defend',
    name: '防御',
    targetType: 'self',
    areaType: 'single',
    description: '摆好防御架势，在本回合受到的伤害降低15%。',
    animationScriptTemplate: [
      { type: 'SHOW_VFX', target: 'source', vfxName: 'defend_aura', delay: 100 },
      { type: 'SHOW_FLOATING_TEXT', target: 'source', text: '防御', color: '#87ceeb', delay: 200 },
    ],
  },
  'double_strike': {
    id: 'double_strike',
    name: '二连击',
    description: '快速连续攻击目标两次。',
    targetType: 'enemy',
    effects: [
      { type: 'DAMAGE', value: 1.0 }, // First hit at 100% damage
      { type: 'DAMAGE', value: 0.7 }  // Second hit at 70% damage
    ]
  },
  'bloodthirsty_pursuit': {
    id: 'bloodthirsty_pursuit',
    name: '嗜血追击',
    description: '攻击目标后，再随机追击两个其他敌人。',
    targetType: 'enemy',
    effects: [
      { type: 'DAMAGE', value: 1.0 }, // 主目标 100% 伤害
      { type: 'DAMAGE', value: 0.6 }, // 随机目标1 60% 伤害
      { type: 'DAMAGE', value: 0.6 }  // 随机目标2 60% 伤害
    ]
  },
  // --- NEW HEALING SKILL ---
  'single_heal': {
    name: '治愈术',
    description: '对单个友方目标进行治疗，恢复少量生命值。',
    type: 'HEAL',
    targetType: 'ally',
    areaType: 'single',
    mpCost: 15,
    effects: [{ type: 'HEAL', value: '1.2 * mAtk' }],
  },
  // --- END NEW HEALING SKILL ---
}; 