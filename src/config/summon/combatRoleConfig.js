/**
 * 战斗角色配置文件
 */

export const COMBAT_ROLES = {
  TANK: 'TANK',
  PHYSICAL_DPS: 'PHYSICAL_DPS',
  MAGICAL_DPS: 'MAGICAL_DPS',
  SPEEDSTER: 'SPEEDSTER',
  BALANCED: 'BALANCED',
};

export const combatRoleConfig = {
  [COMBAT_ROLES.TANK]: {
    name: '坦克',
    description: '高生命值和防御，负责吸收伤害。',
    weights: {
      hp: 0.4,
      physicalDefense: 0.3,
      magicalDefense: 0.3,
    },
  },
  [COMBAT_ROLES.PHYSICAL_DPS]: {
    name: '物理输出',
    description: '拥有强大的物理攻击力。',
    weights: {
      physicalAttack: 0.6,
      critRate: 0.2,
      critDamage: 0.2,
    },
  },
  [COMBAT_ROLES.MAGICAL_DPS]: {
    name: '法术输出',
    description: '拥有强大的法术攻击力。',
    weights: {
      magicalAttack: 0.7,
      mp: 0.1,
      critRate: 0.2,
    },
  },
  [COMBAT_ROLES.SPEEDSTER]: {
    name: '速度型',
    description: '先发制人，拥有极高的速度。',
    weights: {
      speed: 0.7,
      dodgeRate: 0.3,
    },
  },
  [COMBAT_ROLES.BALANCED]: {
    name: '平衡型',
    description: '各项属性较为均衡。',
    weights: {
      hp: 0.15,
      mp: 0.1,
      physicalAttack: 0.2,
      magicalAttack: 0.2,
      physicalDefense: 0.15,
      magicalDefense: 0.15,
      speed: 0.15,
    },
  },
};
