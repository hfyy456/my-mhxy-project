/*
 * @Author: Cascade
 * @Date: 2025-05-24 02:46:07
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-26 04:31:02
 */
import { ELEMENT_TYPES } from '../enumConfig';

// BUFF类型
export const BUFF_TYPES = {
  POSITIVE: 'positive',    // 正面效果
  NEGATIVE: 'negative',    // 负面效果
  NEUTRAL: 'neutral'       // 中性效果
};

// BUFF作用目标
export const BUFF_TARGET_TYPES = {
  SELF: 'self',            // 自身
  ALLY: 'ally',            // 友方
  ENEMY: 'enemy',          // 敌方
  ALL: 'all'               // 所有单位
};

// BUFF效果类型
export const BUFF_EFFECT_TYPES = {
  // 属性修改
  STAT_MODIFIER: 'stat_modifier',      // 修改属性值
  STAT_MULTIPLIER: 'stat_multiplier',  // 属性倍率修改

  // 控制效果
  STUN: 'stun',                // 眩晕，无法行动
  FREEZE: 'freeze',            // 冻结，无法行动且受到更多伤害
  SILENCE: 'silence',          // 沉默，无法使用技能
  ROOT: 'root',                // 定身，无法移动
  STEALTH: 'stealth',          // 隐身，无法被普通攻击

  // 持续伤害/恢复
  DOT: 'damage_over_time',     // 持续伤害
  HOT: 'heal_over_time',       // 持续治疗
  
  // 护盾效果
  SHIELD: 'shield',            // 护盾，吸收伤害
  
  // 特殊效果
  REFLECT: 'reflect',          // 反弹伤害
  IMMUNITY: 'immunity',        // 免疫特定效果
  CLEANSE: 'cleanse'           // 清除特定效果
};

// BUFF应用方式
export const BUFF_APPLY_TYPES = {
  STACK: 'stack',              // 可叠加，效果累加
  REFRESH: 'refresh',          // 刷新持续时间
  REPLACE: 'replace',          // 替换现有效果
  HIGHEST: 'highest'           // 保留最高效果
};

// BUFF配置
export const buffConfig = [
  // 正面BUFF
  {
    id: 'attack_up',
    name: '攻击提升',
    description: '提高攻击力',
    icon: 'fa-arrow-up',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.STAT_MODIFIER,
    applyType: BUFF_APPLY_TYPES.HIGHEST,
    targetAttribute: 'attack',
    value: 10,                 // 固定值增加
    valueMultiplier: 0,        // 百分比增加
    maxStacks: 1,
    durationRounds: 3
  },
  {
    id: 'defense_up',
    name: '防御提升',
    description: '提高防御力',
    icon: 'fa-shield-halved',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.STAT_MODIFIER,
    applyType: BUFF_APPLY_TYPES.HIGHEST,
    targetAttribute: 'defense',
    value: 5,
    valueMultiplier: 0,
    maxStacks: 1,
    durationRounds: 3
  },
  {
    id: 'speed_up',
    name: '速度提升',
    description: '提高速度',
    icon: 'fa-wind',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.STAT_MULTIPLIER,
    applyType: BUFF_APPLY_TYPES.HIGHEST,
    targetAttribute: 'speed',
    value: 0,
    valueMultiplier: 0.2,      // 增加20%速度
    maxStacks: 1,
    durationRounds: 3
  },
  {
    id: 'shield',
    name: '护盾',
    description: '提供一个吸收伤害的护盾',
    icon: 'fa-shield',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.SHIELD,
    applyType: BUFF_APPLY_TYPES.STACK,
    shieldValue: 50,           // 护盾值
    maxStacks: 1,
    durationRounds: 2
  },
  {
    id: 'regeneration',
    name: '生命恢复',
    description: '每回合恢复生命值',
    icon: 'fa-heart',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.HOT,
    applyType: BUFF_APPLY_TYPES.REFRESH,
    healPerRound: 20,          // 每回合恢复量
    maxStacks: 1,
    durationRounds: 3
  },
  {
    id: 'stealth',
    name: '隐身',
    description: '进入隐身状态，无法被普通攻击',
    icon: 'fa-eye-slash',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.STEALTH,
    applyType: BUFF_APPLY_TYPES.REFRESH,
    maxStacks: 1,
    durationRounds: 2
  },
  {
    id: 'reflect',
    name: '反弹',
    description: '反弹部分受到的伤害',
    icon: 'fa-rotate',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.REFLECT,
    applyType: BUFF_APPLY_TYPES.REFRESH,
    reflectPercentage: 0.3,    // 反弹30%伤害
    maxStacks: 1,
    durationRounds: 2
  },
  
  // 负面BUFF
  {
    id: 'attack_down',
    name: '攻击降低',
    description: '降低攻击力',
    icon: 'fa-arrow-down',
    type: BUFF_TYPES.NEGATIVE,
    effectType: BUFF_EFFECT_TYPES.STAT_MODIFIER,
    applyType: BUFF_APPLY_TYPES.HIGHEST,
    targetAttribute: 'attack',
    value: -10,                // 固定值减少
    valueMultiplier: 0,
    maxStacks: 1,
    durationRounds: 2
  },
  {
    id: 'defense_down',
    name: '防御降低',
    description: '降低防御力',
    icon: 'fa-shield-slash',
    type: BUFF_TYPES.NEGATIVE,
    effectType: BUFF_EFFECT_TYPES.STAT_MODIFIER,
    applyType: BUFF_APPLY_TYPES.HIGHEST,
    targetAttribute: 'defense',
    value: -5,
    valueMultiplier: 0,
    maxStacks: 1,
    durationRounds: 2
  },
  {
    id: 'speed_down',
    name: '速度降低',
    description: '降低速度',
    icon: 'fa-person-walking-arrow-loop-left',
    type: BUFF_TYPES.NEGATIVE,
    effectType: BUFF_EFFECT_TYPES.STAT_MULTIPLIER,
    applyType: BUFF_APPLY_TYPES.HIGHEST,
    targetAttribute: 'speed',
    value: 0,
    valueMultiplier: -0.2,     // 减少20%速度
    maxStacks: 1,
    durationRounds: 2
  },
  {
    id: 'stun',
    name: '眩晕',
    description: '无法行动',
    icon: 'fa-bolt',
    type: BUFF_TYPES.NEGATIVE,
    effectType: BUFF_EFFECT_TYPES.STUN,
    applyType: BUFF_APPLY_TYPES.REFRESH,
    maxStacks: 1,
    durationRounds: 1
  },
  {
    id: 'freeze',
    name: '冻结',
    description: '无法行动且受到更多伤害',
    icon: 'fa-snowflake',
    type: BUFF_TYPES.NEGATIVE,
    effectType: BUFF_EFFECT_TYPES.FREEZE,
    applyType: BUFF_APPLY_TYPES.REFRESH,
    damageTakenMultiplier: 1.5, // 受到伤害增加50%
    maxStacks: 1,
    durationRounds: 1
  },
  {
    id: 'silence',
    name: '沉默',
    description: '无法使用技能',
    icon: 'fa-volume-xmark',
    type: BUFF_TYPES.NEGATIVE,
    effectType: BUFF_EFFECT_TYPES.SILENCE,
    applyType: BUFF_APPLY_TYPES.REFRESH,
    maxStacks: 1,
    durationRounds: 2
  },
  {
    id: 'poison',
    name: '中毒',
    description: '每回合受到毒素伤害',
    icon: 'fa-skull-crossbones',
    type: BUFF_TYPES.NEGATIVE,
    effectType: BUFF_EFFECT_TYPES.DOT,
    applyType: BUFF_APPLY_TYPES.STACK,
    damagePerRound: 15,        // 每回合伤害
    damageElement: ELEMENT_TYPES.POISON,
    maxStacks: 3,              // 最多叠加3层
    durationRounds: 3
  },
  {
    id: 'burn',
    name: '灼烧',
    description: '每回合受到火焰伤害',
    icon: 'fa-fire',
    type: BUFF_TYPES.NEGATIVE,
    effectType: BUFF_EFFECT_TYPES.DOT,
    applyType: BUFF_APPLY_TYPES.REFRESH,
    damagePerRound: 20,
    damageElement: ELEMENT_TYPES.FIRE,
    maxStacks: 1,
    durationRounds: 2
  },
  {
    id: 'fire_power',
    name: '火系掌握',
    description: '增加火系技能伤害，减少受到的火系伤害',
    icon: 'fa-fire',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.STAT_MULTIPLIER,
    applyType: BUFF_APPLY_TYPES.HIGHEST,
    elementType: 'fire',
    elementDamageBonus: 0.2,   // 增加20%火系伤害
    elementResistance: 0.15,   // 减少15%受到的火系伤害
    maxStacks: 1,
    durationRounds: -1         // 永久效果
  },
  {
    id: 'water_power',
    name: '水系掌握',
    description: '增加水系技能伤害，减少受到的水系伤害',
    icon: 'fa-water',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.STAT_MULTIPLIER,
    applyType: BUFF_APPLY_TYPES.HIGHEST,
    elementType: 'water',
    elementDamageBonus: 0.2,
    elementResistance: 0.15,
    maxStacks: 1,
    durationRounds: -1
  },
  {
    id: 'thunder_power',
    name: '雷系掌握',
    description: '增加雷系技能伤害，减少受到的雷系伤害',
    icon: 'fa-bolt',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.STAT_MULTIPLIER,
    applyType: BUFF_APPLY_TYPES.HIGHEST,
    elementType: 'thunder',
    elementDamageBonus: 0.2,
    elementResistance: 0.15,
    maxStacks: 1,
    durationRounds: -1
  },
  {
    id: 'last_stand',
    name: '背水一战',
    description: '生命值低时，攻击和防御大幅提升',
    icon: 'fa-skull',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.STAT_MULTIPLIER,
    applyType: BUFF_APPLY_TYPES.REFRESH,
    statModifiers: {
      attack: 0.3,       // 攻击力提升30%
      defense: 0.3       // 防御力提升30%
    },
    maxStacks: 1,
    durationRounds: 3
  },
  {
    id: 'life_link',
    name: '生命链接',
    description: '与队友建立生命链接，共享伤害',
    icon: 'fa-link',
    type: BUFF_TYPES.NEUTRAL,
    effectType: BUFF_EFFECT_TYPES.SPECIAL,
    applyType: BUFF_APPLY_TYPES.REFRESH,
    damageSharing: 0.3,   // 分担30%伤害
    maxStacks: 1,
    durationRounds: -1    // 持续整场战斗
  },
  {
    id: 'mana_shield',
    name: '法力护盾',
    description: '消耗MP抵消部分伤害',
    icon: 'fa-shield-alt',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.SPECIAL,
    applyType: BUFF_APPLY_TYPES.REFRESH,
    mpToHpRatio: 2,       // 每1点MP可以抵消2点伤害
    maxStacks: 1,
    durationRounds: 1
  },
  {
    id: 'thorns',
    name: '荆棘',
    description: '反弹部分物理伤害',
    icon: 'fa-cactus',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.REFLECT,
    applyType: BUFF_APPLY_TYPES.REFRESH,
    reflectDamage: 5,      // 固定反弹5点伤害
    reflectPercentage: 0.1, // 额外反弹10%伤害
    maxStacks: 1,
    durationRounds: -1     // 永久效果
  },
  {
    id: 'vampiric_aura',
    name: '吸血光环',
    description: '攻击时吸取目标生命值',
    icon: 'fa-droplet',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.SPECIAL,
    applyType: BUFF_APPLY_TYPES.REFRESH,
    lifeStealPercent: 0.2, // 吸取造成伤害的20%
    maxStacks: 1,
    durationRounds: 1
  },
  {
    id: 'meditation',
    name: '冥想',
    description: '回合结束时恢复MP',
    icon: 'fa-brain',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.SPECIAL,
    applyType: BUFF_APPLY_TYPES.REFRESH,
    mpRecovery: 5,        // 每回合恢复5点MP
    maxStacks: 1,
    durationRounds: -1    // 永久效果
  },
  {
    id: 'elemental_harmony',
    name: '元素和谐',
    description: '下一个不同元素的技能威力提升',
    icon: 'fa-yin-yang',
    type: BUFF_TYPES.POSITIVE,
    effectType: BUFF_EFFECT_TYPES.SPECIAL,
    applyType: BUFF_APPLY_TYPES.REFRESH,
    elementalBonus: 0.25, // 提升25%伤害
    maxStacks: 1,
    durationRounds: 2
  }
];

// 获取BUFF配置
export const getBuffById = (id) => buffConfig.find(buff => buff.id === id);

// 创建BUFF实例
export const createBuffInstance = (buffId, sourceUnitId, level = 1) => {
  const buffConfig = getBuffById(buffId);
  if (!buffConfig) return null;

  return {
    id: `${buffId}_${Date.now()}`,  // 创建唯一ID
    buffId,                         // 原始BUFF ID
    name: buffConfig.name,
    description: buffConfig.description,
    icon: buffConfig.icon,
    type: buffConfig.type,
    effectType: buffConfig.effectType,
    sourceUnitId,                   // 施加BUFF的单位ID
    level,                          // BUFF等级，可用于计算效果强度
    stacks: 1,                      // 当前层数
    remainingRounds: buffConfig.durationRounds,
    // 复制其他相关属性
    ...Object.fromEntries(
      Object.entries(buffConfig).filter(([key]) => 
        !['id', 'name', 'description', 'icon', 'type', 'effectType', 'maxStacks', 'durationRounds'].includes(key)
      )
    )
  };
};
