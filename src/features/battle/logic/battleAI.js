/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-23 01:54:30
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-23 01:54:30
 * @FilePath: \my-mhxy-project\src\features\battle\logic\battleAI.js
 * @Description: 战斗AI逻辑系统
 */

import { getValidTargetsForUnit, getValidTargetsForSkill, hasValidTargets } from './battleLogic';

/**
 * 决定敌方单位的行动
 * @param {Object} unit - 当前行动的敌方单位
 * @param {Object} battleUnits - 所有战斗单位
 * @param {Array} playerUnits - 玩家单位数组
 * @param {Array} enemyUnits - 敌方单位数组
 * @param {Object} globalPetConfig - 全局宠物配置对象
 * @param {Object} skillConfig - 技能配置对象
 * @returns {Object} 行动对象 { actionType, targetIds, skillId }
 */
export const decideEnemyAction = (unit, battleUnits, playerUnits, enemyUnits, globalPetConfig, skillConfig) => {
  // 如果单位已经被击败，不执行任何行动
  if (unit.isDefeated) {
    return null;
  }

  // 将单位数组转换为全部单位数组，用于计算攻击距离
  const allUnits = [...playerUnits, ...enemyUnits];

  // 如果HP低于30%，有50%的概率选择防御
  const hpPercent = (unit.stats.currentHp / unit.stats.maxHp) * 100;
  if (hpPercent < 30 && Math.random() < 0.5) {
    return {
      actionType: 'defend',
      targetIds: [],
      skillId: null
    };
  }

  // 如果有技能且MP足够，有30%的概率使用技能
  if (unit.skillIds && unit.skillIds.length > 0 && unit.stats.currentMp >= 10 && Math.random() < 0.3) {
    // 随机选择一个技能
    const skillId = unit.skillIds[Math.floor(Math.random() * unit.skillIds.length)];
    
    // 获取技能可以攻击的目标
    const validTargets = skillConfig ? 
      getValidTargetsForSkill(unit, skillId, allUnits, globalPetConfig, skillConfig) :
      getValidTargetsForUnit(unit, allUnits, globalPetConfig, 'skill');
    
    if (validTargets.length === 0) {
      // 如果没有有效目标，尝试普通攻击
      console.log(`敌方单位 ${unit.name} 没有有效的技能目标，尝试普通攻击`);
    } else {
      // 按HP百分比排序，优先选择HP最低的单位
      validTargets.sort((a, b) => 
        (a.stats.currentHp / a.stats.maxHp) - (b.stats.currentHp / b.stats.maxHp)
      );
      
      return {
        actionType: 'skill',
        targetIds: [validTargets[0].id],
        skillId
      };
    }
  }

  // 获取可以普通攻击的目标
  const validAttackTargets = getValidTargetsForUnit(unit, allUnits, globalPetConfig, 'normal');
  
  // 如果没有可攻击的目标，选择防御
  if (validAttackTargets.length === 0) {
    console.log(`敌方单位 ${unit.name} 没有有效的攻击目标，选择防御`);
    return {
      actionType: 'defend',
      targetIds: [],
      skillId: null
    };
  }
  
  // 选择目标，有70%的概率选择HP较低的单位
  let targetUnit;
  if (Math.random() < 0.7) {
    // 按HP百分比排序，选择HP最低的单位
    validAttackTargets.sort((a, b) => 
      (a.stats.currentHp / a.stats.maxHp) - (b.stats.currentHp / b.stats.maxHp)
    );
    targetUnit = validAttackTargets[0];
  } else {
    // 随机选择
    targetUnit = validAttackTargets[Math.floor(Math.random() * validAttackTargets.length)];
  }
  
  return {
    actionType: 'attack',
    targetIds: [targetUnit.id],
    skillId: null
  };
};

/**
 * 为所有敌方单位设置AI行动
 * @param {Object} battleUnits - 所有战斗单位
 * @param {Array} playerFormation - 玩家阵型
 * @param {Array} enemyFormation - 敌方阵型
 * @param {Object} globalPetConfig - 全局宠物配置对象
 * @param {Object} skillConfig - 技能配置对象
 * @returns {Object} 敌方单位行动映射 { unitId: action }
 */
export const setEnemyUnitsActions = (battleUnits, playerFormation, enemyFormation, globalPetConfig, skillConfig) => {
  const enemyActions = {};
  
  // 调试信息
  console.log('setEnemyUnitsActions 被调用，设置敌方AI行动');
  console.log('battleUnits:', Object.keys(battleUnits).length);
  
  // 获取所有玩家单位和敌方单位
  const playerUnits = [];
  const enemyUnits = [];
  
  Object.values(battleUnits).forEach(unit => {
    if (unit.isPlayerUnit) {
      playerUnits.push(unit);
    } else {
      enemyUnits.push(unit);
    }
  });
  
  console.log('敌方单位数量:', enemyUnits.length);
  console.log('玩家单位数量:', playerUnits.length);
  
  // 为每个敌方单位设置行动
  enemyUnits.forEach(unit => {
    if (!unit.isDefeated) {
      const action = decideEnemyAction(unit, battleUnits, playerUnits, enemyUnits, globalPetConfig, skillConfig);
      if (action) {
        enemyActions[unit.id] = action;
        console.log(`为敌方单位 ${unit.name} 设置行动:`, action.actionType);
      }
    }
  });
  
  console.log('返回的敌方行动数量:', Object.keys(enemyActions).length);
  return enemyActions;
};
