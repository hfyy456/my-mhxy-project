/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-01 05:38:08
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-11 07:18:23
 * @FilePath: \my-mhxy-project\src\config\system\towerConfig.js
 * @Description: 封妖塔系统配置文件
 */

import { ELEMENT_TYPES, FIVE_ELEMENTS } from '@/config/enumConfig';

// 封妖塔总层数
export const TOWER_MAX_FLOOR = 60;

// 封妖塔每层的基本配置
export const towerFloorConfig = {
  // 第一层
  1: {
    name: '初入修行',
    description: '封妖塔第一层，适合初学者练习。这里封印着一些低级妖怪。',
    background: 'tower_floor_1_bg',
    floorEffects: [], // 无特殊效果
    enemies: [
      { 
        enemyId: 'goblin_grunt',
        level: 1,
        position: { row: 1, col: 1 },
        dropRate: 1.2 // 掉落倍率
      }
    ],
    rewards: {
      exp: 50,
      gold: 100,
      guaranteedItems: [], // 固定掉落物品
      randomItems: [
        { itemId: 'potion_small_hp', chance: 0.5, quantity: 1 }
      ]
    },
    unlockRequirement: { playerLevel: 1 }
  },
  
  // 第二层
  2: {
    name: '妖风初起',
    description: '封妖塔第二层，这里的妖怪开始展现出一些能力。',
    background: 'tower_floor_2_bg',
    floorEffects: [], // 无特殊效果
    enemies: [
      { 
        enemyId: 'goblin_grunt',
        level: 2,
        position: { row: 1, col: 1 },
        dropRate: 1.0
      },
      { 
        enemyId: 'wildLeopard',
        level: 2,
        position: { row: 0, col: 0 },
        dropRate: 1.0
      }
    ],
    rewards: {
      exp: 80,
      gold: 150,
      guaranteedItems: [], // 固定掉落物品
      randomItems: [
        { itemId: 'potion_small_hp', chance: 0.6, quantity: 1 },
        { itemId: 'potion_small_mp', chance: 0.3, quantity: 1 }
      ]
    },
    unlockRequirement: { towerFloor: 1 } // 需要通过第一层
  },
  
  // 第三层
  3: {
    name: '妖气渐浓',
    description: '封妖塔第三层，妖气开始变得浓郁，战斗难度提升。',
    background: 'tower_floor_3_bg',
    floorEffects: [
      { 
        type: 'stat_modifier',
        target: 'all', // 影响所有单位
        stat: 'speed',
        value: -0.1, // 降低10%速度
        description: '妖气浓郁，所有单位速度降低10%'
      }
    ],
    enemies: [
      { 
        enemyId: 'wildLeopard',
        level: 3,
        position: { row: 1, col: 1 },
        dropRate: 1.0
      },
      { 
        enemyId: 'wildLeopard',
        level: 3,
        position: { row: 0, col: 0 },
        dropRate: 1.0
      },
      { 
        enemyId: 'wildLeopard',
        level: 3,
        position: { row: 2, col: 2 },
        dropRate: 1.0
      }
    ],
    rewards: {
      exp: 120,
      gold: 200,
      guaranteedItems: [], // 固定掉落物品
      randomItems: [
        { itemId: 'potion_medium_hp', chance: 0.4, quantity: 1 },
        { itemId: 'wolf_pelt', chance: 0.5, quantity: 1 }
      ]
    },
    unlockRequirement: { towerFloor: 2 } // 需要通过第二层
  },
  
  // 第五层 - 第一个小BOSS层
  5: {
    name: '妖将现身',
    description: '封妖塔第五层，一位妖将镇守此处，实力不容小觑。',
    background: 'tower_floor_boss_bg',
    isBossFloor: true,
    floorEffects: [
      { 
        type: 'element_boost',
        element: ELEMENT_TYPES.FIRE,
        value: 0.2, // 火属性伤害提升20%
        description: '妖将火焰之力影响此层，火属性伤害提升20%'
      }
    ],
    enemies: [
      { 
        enemyId: 'yaksha', // 作为小BOSS
        level: 5,
        position: { row: 1, col: 1 },
        dropRate: 1.5,
        isElite: true // 精英单位
      },
      { 
        enemyId: 'goblin_grunt',
        level: 4,
        position: { row: 0, col: 0 },
        dropRate: 1.0
      },
      { 
        enemyId: 'goblin_grunt',
        level: 4,
        position: { row: 2, col: 2 },
        dropRate: 1.0
      }
    ],
    rewards: {
      exp: 250,
      gold: 500,
      guaranteedItems: [
        { itemId: 'tower_token_1', quantity: 1 } // 封妖塔令牌，可用于兑换特殊物品
      ],
      randomItems: [
        { itemId: 'potion_medium_hp', chance: 0.7, quantity: 2 },
        { itemId: 'orcish_axe_fragment', chance: 0.6, quantity: 1 }
      ]
    },
    unlockRequirement: { towerFloor: 4 } // 需要通过第四层
  },
  
  // 第十层 - 第一个区域BOSS层
  10: {
    name: '妖王之殿',
    description: '封妖塔第十层，强大的妖王守护着通往更高层的道路。',
    background: 'tower_floor_boss_bg',
    isBossFloor: true,
    floorEffects: [
      { 
        type: 'five_element_restriction',
        element: FIVE_ELEMENTS.WATER, // 水属性受限
        value: -0.3, // 水属性伤害降低30%
        description: '妖王压制水之力，水属性伤害降低30%'
      },
      {
        type: 'five_element_boost',
        element: FIVE_ELEMENTS.FIRE, // 火属性增强
        value: 0.2, // 火属性伤害提升20%
        description: '妖王火焰之力增强，火属性伤害提升20%'
      }
    ],
    enemies: [
      { 
        enemyId: 'fire_demon_lord', // 需要在enemyConfig中添加此敌人
        level: 10,
        position: { row: 1, col: 1 },
        dropRate: 2.0,
        isBoss: true // BOSS单位
      }
    ],
    rewards: {
      exp: 500,
      gold: 1000,
      guaranteedItems: [
        { itemId: 'tower_token_2', quantity: 1 }, // 高级封妖塔令牌
        { itemId: 'fire_essence', quantity: 3 } // 火元素精华
      ],
      randomItems: [
        { itemId: 'equipment_fire_ring', chance: 0.3, quantity: 1 },
        { itemId: 'fire_demon_core', chance: 0.5, quantity: 1 }
      ]
    },
    unlockRequirement: { towerFloor: 9 } // 需要通过第九层
  },
  
  // 可以继续添加更多层的配置...
  // 20层、30层、40层、50层和60层应该是主要的BOSS层
};

// 封妖塔挑战记录结构
export const towerProgressTemplate = {
  highestFloor: 0, // 已通关的最高层数
  currentFloor: 1, // 当前可挑战的层数
  dailyAttempts: 3, // 每日挑战次数
  attemptsUsed: 0, // 已使用的挑战次数
  floorRecords: {}, // 每层的挑战记录，包括通关时间、使用的阵容等
  rewards: {
    claimed: [], // 已领取的奖励层数
    available: [] // 可领取的奖励层数
  },
  lastResetTime: null // 上次重置时间（每日挑战次数重置）
};

// 封妖塔特殊效果处理器
export const towerEffectHandlers = {
  // 属性修改效果
  stat_modifier: (battleState, effect) => {
    const { target, stat, value } = effect;
    const units = target === 'player' 
      ? battleState.playerUnits 
      : target === 'enemy' 
        ? battleState.enemyUnits 
        : [...battleState.playerUnits, ...battleState.enemyUnits];
    
    units.forEach(unit => {
      // 应用属性修改
      if (unit.derivedAttributes[stat]) {
        const originalValue = unit.derivedAttributes[stat];
        unit.derivedAttributes[stat] = originalValue * (1 + value);
      }
    });
    
    return battleState;
  },
  
  // 元素增强效果
  element_boost: (battleState, effect) => {
    // 在战斗状态中记录元素增强效果，供伤害计算时使用
    battleState.elementBoosts = battleState.elementBoosts || {};
    battleState.elementBoosts[effect.element] = (battleState.elementBoosts[effect.element] || 0) + effect.value;
    
    return battleState;
  },
  
  // 五行限制效果
  five_element_restriction: (battleState, effect) => {
    // 在战斗状态中记录五行限制效果，供伤害计算时使用
    battleState.fiveElementRestrictions = battleState.fiveElementRestrictions || {};
    battleState.fiveElementRestrictions[effect.element] = (battleState.fiveElementRestrictions[effect.element] || 0) + effect.value;
    
    return battleState;
  },
  
  // 五行增强效果
  five_element_boost: (battleState, effect) => {
    // 在战斗状态中记录五行增强效果，供伤害计算时使用
    battleState.fiveElementBoosts = battleState.fiveElementBoosts || {};
    battleState.fiveElementBoosts[effect.element] = (battleState.fiveElementBoosts[effect.element] || 0) + effect.value;
    
    return battleState;
  }
};

// 获取指定层的配置
export const getTowerFloorConfig = (floor) => {
  return towerFloorConfig[floor] || null;
};

// 检查玩家是否满足挑战某层的条件
export const checkFloorUnlockRequirement = (floor, playerState) => {
  const floorConfig = getTowerFloorConfig(floor);
  if (!floorConfig) return false;
  
  const { unlockRequirement } = floorConfig;
  
  // 检查玩家等级要求
  if (unlockRequirement.playerLevel && playerState.level < unlockRequirement.playerLevel) {
    return false;
  }
  
  // 检查前置层数要求
  if (unlockRequirement.towerFloor && playerState.towerProgress.highestFloor < unlockRequirement.towerFloor) {
    return false;
  }
  
  return true;
};

// 准备封妖塔战斗数据
export const prepareTowerBattleData = (floor, playerSummonsData, playerFormation) => {
  const floorConfig = getTowerFloorConfig(floor);
  if (!floorConfig) return null;
  
  // 准备敌人模板
  const enemyTemplates = floorConfig.enemies.map(enemy => ({
    template: {
      ...getEnemyTemplateById(enemy.enemyId),
      level: enemy.level, // 使用配置中指定的等级
      isElite: enemy.isElite || false,
      isBoss: enemy.isBoss || false,
      dropRate: enemy.dropRate || 1.0
    },
    position: {
      team: 'enemy',
      row: enemy.position.row,
      col: enemy.position.col
    }
  }));
  
  // 战斗ID格式: tower_floor_{floor}_{timestamp}
  const battleId = `tower_floor_${floor}_${Date.now()}`;
  
  // 准备战斗数据
  const battleData = {
    battleId,
    playerSummonsData,
    playerFormation,
    enemyTemplates,
    floorEffects: floorConfig.floorEffects || [],
    isTowerBattle: true,
    towerFloor: floor,
    rewards: floorConfig.rewards
  };
  
  return battleData;
};

// 已在文件头部导入getEnemyTemplateById
// export { getEnemyTemplateById } from '@/config/character/enemyConfig';
