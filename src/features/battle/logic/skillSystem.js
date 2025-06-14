/*
 * @Author: Cascade AI
 * @Date: 2025-05-25
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-13 19:58:43
 * @Description: 战斗系统技能系统逻辑
 */
import { SKILL_TYPES, SKILL_TARGET_TYPES, SKILL_AREA_TYPES } from '@/config/enumConfig';
import { activeSkillConfig } from '@/config/skill/activeSkillConfig';
import { calculateBattleDamage, applyDamageToTarget, calculateHealing, applyHealingToTarget } from './damageCalculation';
import { 
  applyBuff, 
  removeBuff, 
  canUnitUseSkill, 
  canUnitBeTargeted, 
  canUnitAct,
  processBuffsOnTurnStart,
  processBuffsOnTurnEnd
} from './buffManager';

/**
 * 获取一个技能可以攻击的所有目标单位
 * @param {BattleUnit} sourceUnit - 发起攻击的单位
 * @param {BattleUnit[]} allUnits - 战场上的所有单位
 * @param {Object} globalSummonConfig - 全局宠物配置对象
 * @param {string} attackType - 攻击类型，默认为'normal'，可以是'skill'等
 * @param {Object} options - 额外选项
 * @param {boolean} options.includeAllies - 是否包含友方单位作为可能目标
 * @param {boolean} options.includeSelf - 是否包含自己作为可能目标
 * @returns {BattleUnit[]} - 可攻击的目标单位数组
 */
export const getValidTargetsForUnit = (sourceUnit, allUnits, attackType = 'normal', options = {}) => {
  if (!sourceUnit || !allUnits || allUnits.length === 0) {
    return [];
  }
  console.log(sourceUnit,"sourceUnit");
  console.log(allUnits,"allUnits");
  console.log(attackType,"attackType");
  const { includeAllies = false, includeSelf = false } = options;
  
  return allUnits.filter(targetUnit => {
    // 目标必须是有效且存活的单位
    if (!targetUnit || targetUnit.derivedAttributes.currentHp <= 0) {
      return false;
    }

    const isSelf = targetUnit.id === sourceUnit.id;
    const isAlly = targetUnit.isPlayerUnit === sourceUnit.isPlayerUnit;

    // 处理普通攻击的目标选择
    if (attackType === 'normal') {
      // 普通攻击只能选择非自身的敌方单位
      return !isSelf && !isAlly;
    }

    // 处理技能等其他动作的目标选择
    // 1. 处理自身
    if (isSelf) {
      return includeSelf;
    }

    // 2. 处理友方
    if (isAlly) {
      return includeAllies;
    }
    
    // 3. 默认情况下，目标是敌人，总是有效的，除非该技能明确设定为只对友方生效
    //    （在这种情况下，调用者应将 includeAllies 设为 true，此时敌方单位会因为 isAlly 为 false 而通过）
    //    这个逻辑保留了原有的灵活性：默认允许攻击敌人。
    return true;
  });
};

/**
 * 获取一个技能可以攻击的所有目标单位
 * @param {BattleUnit} sourceUnit - 发起攻击的单位
 * @param {string} skillId - 技能ID
 * @param {BattleUnit[]} allUnits - 战场上的所有单位
 * @param {Object} globalSummonConfig - 全局宠物配置对象
 * @returns {BattleUnit[]} - 可攻击的目标单位数组
 */
export const getValidTargetsForSkill = (sourceUnit, skillId, allUnits, globalSummonConfig) => {
  if (!sourceUnit || !skillId || !allUnits || allUnits.length === 0) return [];
  
  // 获取技能配置
  const skill = getSkillById(skillId);
  if (!skill) return [];
  
  // 获取技能的目标选择选项
  const targetOptions = {
    includeAllies: skill.targetAllies || false,
    includeSelf: skill.targetSelf || false
  };
  
  // 使用技能的攻击类型获取有效目标
  return getValidTargetsForUnit(sourceUnit, allUnits, globalSummonConfig, 'skill', targetOptions);
};

/**
 * 获取技能影响范围内的格子位置
 * @param {string} skillId - 技能ID
 * @param {string} targetId - 目标单位ID
 * @param {Object} [battleUnits] - 战场上的所有单位，如果不提供则使用全局状态
 * @param {Object} [selectedUnit] - 施法单位，如果不提供则使用全局状态
 * @returns {Array} - 影响范围内的格子位置数组
 */
export const getSkillAffectedArea = (skillId, targetId, battleUnits, selectedUnit) => {
  // 兼容性处理：如果没有提供 battleUnits 和 selectedUnit，尝试从全局状态获取
  // 这里假设全局状态中存在 window.store 或者其他方式获取状态
  // 实际应用中需要根据具体状态管理方式调整
  if (!battleUnits || !selectedUnit) {
    // 这里只是一个占位符，实际应用中需要实现正确的状态获取
    console.warn('调用 getSkillAffectedArea 时没有提供 battleUnits 或 selectedUnit，这可能导致计算错误');
    return [];
  }
  
  if (!skillId || !targetId) return [];
  
  const skill = getSkillById(skillId);
  if (!skill) return [];
  
  // 获取目标单位
  const targetUnit = battleUnits[targetId];
  if (!targetUnit) return [];
  
  // 目标位置
  const targetPos = targetUnit.gridPosition;
  const targetTeam = targetPos.team;
  
  // 存储受影响的格子位置
  const affectedPositions = [];
  
  // 根据技能的 targetType 和 areaType 属性确定影响范围
  const targetType = skill.targetType;
  const areaType = skill.areaType;
  
  // 单体技能 - 兼容字符串和枚举常量
  if (targetType === SKILL_TARGET_TYPES.SINGLE || targetType === 'single' || !targetType) {
    // 添加目标格子
    affectedPositions.push({
      team: targetTeam,
      row: targetPos.row,
      col: targetPos.col
    });
  }
  // 群体技能 - 兼容字符串和枚举常量
  else if (targetType === SKILL_TARGET_TYPES.GROUP || targetType === 'group') {
    // 添加目标格子
    affectedPositions.push({
      team: targetTeam,
      row: targetPos.row,
      col: targetPos.col
    });
    
    // 根据不同的范围类型计算影响的格子 - 兼容字符串和枚举常量
    if (areaType === SKILL_AREA_TYPES.CROSS || areaType === 'cross') { // 十字范围
      // 定义上下左右四个相邻格子
      const crossPositions = [
        { row: targetPos.row - 1, col: targetPos.col }, // 上
        { row: targetPos.row + 1, col: targetPos.col }, // 下
        { row: targetPos.row, col: targetPos.col - 1 }, // 左
        { row: targetPos.row, col: targetPos.col + 1 }  // 右
      ];
      
      // 过滤掉超出范围的格子
      crossPositions.forEach(pos => {
        if (pos.row >= 0 && pos.row < 3 && pos.col >= 0 && pos.col < 3) {
          affectedPositions.push({
            team: targetTeam,
            row: pos.row,
            col: pos.col
          });
        }
      });
    }
    else if (areaType === SKILL_AREA_TYPES.ROW || areaType === 'row') { // 整行范围
      // 添加同一行的所有格子
      for (let col = 0; col < 3; col++) {
        affectedPositions.push({
          team: targetTeam,
          row: targetPos.row,
          col: col
        });
      }
    }
    else if (areaType === SKILL_AREA_TYPES.COLUMN || areaType === 'column') { // 整列范围
      // 添加同一列的所有格子
      for (let row = 0; row < 3; row++) {
        affectedPositions.push({
          team: targetTeam,
          row: row,
          col: targetPos.col
        });
      }
    }
    else if (areaType === SKILL_AREA_TYPES.SQUARE || areaType === 'square') { // 方形范围
      // 添加 3x3 方形范围内的所有格子
      for (let row = Math.max(0, targetPos.row - 1); row <= Math.min(2, targetPos.row + 1); row++) {
        for (let col = Math.max(0, targetPos.col - 1); col <= Math.min(2, targetPos.col + 1); col++) {
          affectedPositions.push({
            team: targetTeam,
            row: row,
            col: col
          });
        }
      }
    }
    else { // 默认情况，目标及其相邻格子
      // 上下左右四个相邻格子
      const adjacentPositions = [
        { row: targetPos.row - 1, col: targetPos.col }, // 上
        { row: targetPos.row + 1, col: targetPos.col }, // 下
        { row: targetPos.row, col: targetPos.col - 1 }, // 左
        { row: targetPos.row, col: targetPos.col + 1 }  // 右
      ];
      
      // 过滤掉超出范围的格子
      adjacentPositions.forEach(pos => {
        if (pos.row >= 0 && pos.row < 3 && pos.col >= 0 && pos.col < 3) {
          affectedPositions.push({
            team: targetTeam,
            row: pos.row,
            col: pos.col
          });
        }
      });
    }
  }
  // 无目标技能（如自身增益） - 兼容字符串和枚举常量
  else if (targetType === SKILL_TARGET_TYPES.NONE || targetType === 'none') {
    // 添加施法者格子
    const casterPos = selectedUnit.gridPosition;
    affectedPositions.push({
      team: casterPos.team,
      row: casterPos.row,
      col: casterPos.col
    });
  }
  
  // 去除重复格子
  const uniquePositions = [];
  const positionMap = new Map();
  
  affectedPositions.forEach(pos => {
    const key = `${pos.team}-${pos.row}-${pos.col}`;
    if (!positionMap.has(key)) {
      positionMap.set(key, true);
      uniquePositions.push(pos);
    }
  });
  
  return uniquePositions;
};

/**
 * 判断一个单位是否能够攻击到另一个单位
 * 注意：攻击距离限制已移除，现在任何位置都可以攻击任何位置
 * @param {BattleUnit} sourceUnit - 发起攻击的单位
 * @param {BattleUnit} targetUnit - 攻击目标单位
 * @param {Object} globalSummonConfig - 全局宠物配置对象
 * @param {string} attackType - 攻击类型，默认为'normal'，可以是'skill'等
 * @returns {boolean} - 如果可以攻击返回true，否则返回false
 */
export const canUnitAttackTarget = (sourceUnit, targetUnit, globalSummonConfig, attackType = 'normal') => {
  // 基本参数验证
  if (!sourceUnit || !targetUnit) {
    console.log('攻击验证失败: 缺少源单位或目标单位');
    return false;
  }
  
  // 不能攻击已死亡的单位
  if (targetUnit.derivedAttributes && targetUnit.derivedAttributes.currentHp <= 0) {
    console.log(`攻击验证失败: 目标单位 ${targetUnit.name || targetUnit.id} 已死亡`);
    return false;
  }
  
  // 攻击距离限制已移除 - 现在任何位置都可以攻击任何位置
  console.log(`攻击距离检查已移除: 单位 ${sourceUnit.name || sourceUnit.id} 可以攻击 ${targetUnit.name || targetUnit.id}`);
  
  return true;
};

/**
 * 获取单位的攻击距离属性
 * @param {BattleUnit} unit - 单位
 * @param {Object} globalSummonConfig - 全局宠物配置对象
 * @param {string} attackType - 攻击类型，默认为'normal'，可以是'skill'等
 * @returns {Object} - 攻击距离属性对象 { min: 最小距离, max: 最大距离, type: 距离计算类型 }
 */
export const getUnitAttackRangeProperties = (unit, globalSummonConfig, attackType = 'normal') => {
  // 默认攻击距离属性
  const defaultRangeProps = {
    min: 1,
    max: 5,
    type: 'column'
  };
  
  // 打印全局宠物配置对象类型
  console.log(`globalSummonConfig 类型: ${typeof globalSummonConfig}`);
  console.log(`globalSummonConfig 是数组吗: ${Array.isArray(globalSummonConfig)}`);
  
  // 如果没有单位或配置，返回默认值
  if (!unit || !globalSummonConfig) {
    console.log('没有单位或宠物配置，返回默认值');
    return defaultRangeProps;
  }
  
  // 获取单位的基础属性
  let summonSourceId = unit.sourceId;
  console.log(`原始单位源ID: ${summonSourceId}`);
  
  // 处理召唤ID的情况
  if (summonSourceId && summonSourceId.startsWith('summon-')) {
    // 从单位中获取真正的宠物ID
    summonSourceId = unit.summonSourceId || unit.type || unit.summonType;
    console.log(`检测到召唤ID，尝试使用单位的summonSourceId/type/summonType: ${summonSourceId}`);
  }
  
  // 如果还是找不到宠物ID，使用单位名称或其他属性匹配
  if (!summonSourceId || summonSourceId.includes('-')) {
    // 如果单位有名称，尝试根据名称匹配
    const unitName = unit.name;
    console.log(`尝试根据单位名称匹配: ${unitName}`);
    
    // 确保 globalSummonConfig 是对象
    if (typeof globalSummonConfig === 'object') {
      // 遍历所有宠物配置
      for (const key in globalSummonConfig) {
        const summon = globalSummonConfig[key];
        // 如果宠物名称与单位名称匹配
        if (summon && summon.name === unitName) {
          summonSourceId = summon.id;
          console.log(`根据名称匹配到宠物ID: ${summonSourceId}`);
          break;
        }
      }
    }
  }
  
  console.log(`最终使用的宠物ID: ${summonSourceId}`);
  
  // 尝试直接从 summonConfig 中获取宠物数据
  let summonData = null;
  
  // 如果 globalSummonConfig 是对象且不是数组，直接使用键值访问
  if (typeof globalSummonConfig === 'object' && !Array.isArray(globalSummonConfig)) {
    summonData = globalSummonConfig[summonSourceId];
    console.log(`使用对象方式获取宠物数据: ${summonData ? '成功' : '失败'}`);
  } 
  // 如果 globalSummonConfig 是数组，使用 find 方法
  else if (Array.isArray(globalSummonConfig)) {
    summonData = globalSummonConfig.find(summon => summon.id === summonSourceId);
    console.log(`使用数组方式获取宠物数据: ${summonData ? '成功' : '失败'}`);
  }
  
  // 如果找不到对应的宠物配置，尝试根据单位名称设置默认攻击距离
  if (!summonData) {
    console.log(`找不到宠物配置，尝试根据单位名称设置默认攻击距离`);
    
    // 确保单位有名称
    const unitName = unit.name || '';
    
    // 根据单位名称设置默认攻击距离
    let defaultAttackRange = 1;
    
    // 确保常见宠物的攻击距离正确
    if (unitName.includes('蟹')) {
      defaultAttackRange = 1; // 蟹类宠物通常是近战
    } else if (unitName.includes('龙') || unitName.includes('蜥')) {
      defaultAttackRange = 5; // 龙类宠物通常有较远的攻击距离
    } else if (unitName.includes('凤凰') || unitName.includes('鸟')) {
      defaultAttackRange = 4; // 鸟类宠物通常有中远程攻击距离
    } else if (unitName.includes('灵')) {
      defaultAttackRange = 3; // 灵类宠物通常有中程攻击距离
    } else {
      // 其他宠物默认为2
      defaultAttackRange = 2;
    }
    
    console.log(`根据单位名称 ${unitName} 设置默认攻击距离: ${defaultAttackRange}`);
    
    // 返回默认攻击距离属性
    return {
      min: 1,
      max: defaultAttackRange,
      type: 'column'
    };
  }
  
  console.log(`找到宠物配置:`, summonData);
  
  // 根据攻击类型获取不同的攻击距离属性
  if (attackType === 'skill') {
    // 技能攻击距离，可以从单位的技能配置中获取
    // 这里简化处理，使用默认值
    const result = {
      min: 1,
      max: 2, // 技能通常有更远的攻击距离
      type: 'column'
    };
    console.log(`技能攻击范围: min=${result.min}, max=${result.max}, type=${result.type}`);
    return result;
  } else {
    // 普通攻击距离，从宠物配置中获取
    // 注意：summonConfig 中的 attackRange 是一个单一数值，表示最大攻击距离
    
    // 直接访问并打印宠物的attackRange属性
    console.log(`宠物 ${summonData.name || summonSourceId} 的attackRange属性:`, summonData.attackRange);
    
    // 确保使用正确的攻击距离
    const attackRange = summonData.attackRange || defaultRangeProps.max;
    
    // 打印调试信息
    console.log(`单位 ${unit.name || unit.id} 的攻击距离属性:`);
    console.log(`宠物ID: ${summonSourceId}, 配置中的攻击距离: ${attackRange}`);
    
    // 确保最大攻击距离是数字
    const maxRange = Number(attackRange) || defaultRangeProps.max;
    
    const result = {
      min: 1, // 最小攻击距离固定为1
      max: maxRange,
      type: 'column' // 根据项目要求，只考虑列距离
    };
    
    console.log(`返回的攻击范围: min=${result.min}, max=${result.max}, type=${result.type}`);
    return result;
  }
};

/**
 * 计算两个战斗单位之间的距离
 * @param {BattleUnitPosition} sourcePosition - 源单位的位置
 * @param {BattleUnitPosition} targetPosition - 目标单位的位置
 * @param {string} distanceType - 距离计算类型（注意：当前系统只使用列距离）
 * @returns {number} - 两个单位之间的距离（格子数）
 */
export const calculateBattleDistance = (sourcePosition, targetPosition, distanceType = 'column') => {
  // 重要备注：根据项目要求，我们只计算列之间的距离！
  // 不考虑曼哈顿距离或欧几里得距离
  
  // 如果两个单位在同一阵营，直接计算列差
  if (sourcePosition.team === targetPosition.team) {
    return Math.abs(sourcePosition.col - targetPosition.col);
  }
  
  // 如果两个单位在不同阵营，需要考虑战场布局
  // 获取两个单位的绝对列位置
  const sourceCol = getUnitAbsoluteColumn(sourcePosition);
  const targetCol = getUnitAbsoluteColumn(targetPosition);
  console.log('sourceCol', sourceCol);
  console.log('targetCol', targetCol);
  // 计算列距离
  return Math.abs(sourceCol - targetCol);
};

/**
 * 获取单位的实际列位置
 * @param {BattleUnitPosition} position - 单位的位置
 * @returns {number} - 单位的实际列位置（1-6）
 */
export const getUnitAbsoluteColumn = (position) => {
  // 重要备注：根据项目要求，我们需要正确计算列位置
  // 玩家阵营的单位在左侧（列1-3）
  if (position.team === 'player') {
    // 玩家的列从0开始，所以加1得到实际列位置
    return position.col + 1; // 玩家第0列 -> 绝对列位置1，第1列 -> 绝对列位置2，第2列 -> 绝对列位置3
  }
  
  // 敌方阵营的单位在右侧（列4-6）
  // 敌方的列从0开始，加4得到实际列位置
  return position.col + 4; // 敌方第0列 -> 绝对列位置4，第1列 -> 绝对列位置5，第2列 -> 绝对列位置6
};

/**
 * 检查单位是否有可攻击的目标
 * @param {BattleUnit} sourceUnit - 发起攻击的单位
 * @param {BattleUnit[]} allUnits - 战场上的所有单位
 * @param {Object} globalSummonConfig - 全局宠物配置对象
 * @param {string} attackType - 攻击类型，默认为'normal'
 * @returns {boolean} - 如果有可攻击的目标返回true，否则返回false
 */
export const hasValidTargets = (sourceUnit, allUnits, globalSummonConfig, attackType = 'normal') => {
  const targets = getValidTargetsForUnit(sourceUnit, allUnits, globalSummonConfig, attackType);
  return targets.length > 0;
};

/**
 * 根据ID获取技能信息
 * @param {string} skillId - 技能ID
 * @returns {Object|null} - 技能信息对象，如果找不到则返回null
 */
export const getSkillById = (skillId) => {
  if (!skillId) return null;
  return activeSkillConfig.find(skill => skill.id === skillId) || null;
};

/**
 * 执行技能效果
 * @param {Object} caster - 施法单位
 * @param {Object} target - 目标单位
 * @param {string} skillId - 技能ID
 * @param {Object} battleState - 战斗状态
 * @returns {Object} - 技能执行结果
 */
export const executeSkillEffect = (caster, target, skillId, battleState) => {
  // 获取技能信息
  const skill = getSkillById(skillId);
  if (!skill) {
    return {
      success: false,
      error: `找不到技能: ${skillId}`
    };
  }
  
  // 检查施法者是否可以使用技能（例如是否被沉默）
  const canUseSkillResult = canUnitUseSkill(caster);
  if (!canUseSkillResult.canUseSkill) {
    return {
      success: false,
      error: canUseSkillResult.reason
    };
  }
  
  // 检查目标是否可以被选中（例如是否处于隐身状态）
  const canBeTargetedResult = canUnitBeTargeted(target, caster);
  if (!canBeTargetedResult.canBeTargeted) {
    return {
      success: false,
      error: canBeTargetedResult.reason
    };
  }
  
  // 检查MP消耗
  if (skill.mpCost && caster.derivedAttributes.currentMp < skill.mpCost) {
    return {
      success: false,
      error: '魔法值不足'
    };
  }
  
  // 消耗MP
  const updatedCaster = {
    ...caster,
    derivedAttributes: {
      ...caster.derivedAttributes,
      currentMp: caster.derivedAttributes.currentMp - (skill.mpCost || 0)
    }
  };
  
  // 根据技能类型执行不同的效果
  let result = {
    success: true,
    caster: updatedCaster,
    target,
    skill,
    effects: []
  };
  
  // 处理伤害型技能
  if (skill.damage) {
    const damageType = skill.element ? 'magical' : 'physical';
    const damageOptions = { element: skill.element || 'normal' };
    
    const damageResult = calculateBattleDamage(caster, target, damageType, skill.damage, damageOptions);
    const damageApplied = applyDamageToTarget(target, damageResult.finalDamage, caster, damageOptions);
    
    // 更新目标和施法者（可能受到反弹伤害影响）
    result.target = damageApplied.updatedTarget;
    if (damageApplied.updatedSource) {
      result.caster = damageApplied.updatedSource;
    }
    
    result.effects.push({
      type: 'damage',
      value: damageApplied.damageApplied,
      details: {
        ...damageResult,
        shieldAbsorbed: damageApplied.shieldAbsorbed,
        reflectDamage: damageApplied.reflectDamage
      }
    });
  }
  
  // 处理治疗型技能
  if (skill.healing) {
    const healPower = caster.derivedAttributes.mAtk * skill.healing;
    const healingResult = calculateHealing(healPower);
    const healingApplied = applyHealingToTarget(target, healingResult.finalHealing);
    
    result.target = healingApplied.updatedTarget;
    result.effects.push({
      type: 'healing',
      value: healingApplied.healingApplied,
      details: healingResult
    });
  }
  
  // 处理buff/debuff效果
  if (skill.applyBuffs && skill.applyBuffs.length > 0) {
    const buffResults = [];
    
    skill.applyBuffs.forEach(buffInfo => {
      // 检查是否触发buff（根据几率）
      const shouldApply = !buffInfo.chance || Math.random() < buffInfo.chance;
      
      if (shouldApply) {
        // 应用buff
        const buffResult = applyBuff(target, buffInfo.buffId, caster.id, buffInfo.level || 1);
        buffResults.push(buffResult);
        
        // 更新目标单位
        if (buffResult.success) {
          result.target = buffResult.updatedTarget || result.target;
        }
      }
    });
    
    result.effects.push({
      type: 'buffs',
      buffs: buffResults
    });
  }
  
  // 处理移除buff效果
  if (skill.removeBuffs && skill.removeBuffs.length > 0) {
    const removeResults = [];
    
    skill.removeBuffs.forEach(buffInfo => {
      // 检查是否触发buff移除（根据几率）
      const shouldRemove = !buffInfo.chance || Math.random() < buffInfo.chance;
      
      if (shouldRemove) {
        // 移除buff
        const removeResult = removeBuff(target, buffInfo.buffId);
        removeResults.push(removeResult);
        
        // 更新目标单位
        if (removeResult.success) {
          result.target = removeResult.updatedTarget || result.target;
        }
      }
    });
    
    result.effects.push({
      type: 'removeBuffs',
      removedBuffs: removeResults
    });
  }
  
  return result;
};

// 应用buff到目标单位的函数已移至 buffManager.js

/**
 * 处理buff效果
 * @param {Object} unit - 单位
 * @param {string} phase - 处理阶段 ('start', 'end')
 * @returns {Object} - 处理结果
 */
export const processBuffEffects = (unit, phase = 'start') => {
  if (!unit.statusEffects || unit.statusEffects.length === 0) {
    return {
      unit,
      effects: []
    };
  }
  
  let updatedUnit = { ...unit };
  const effects = [];
  
  // 处理每个状态效果
  const updatedStatusEffects = [];
  
  unit.statusEffects.forEach(effect => {
    // 检查是否应该在当前阶段处理
    const shouldProcess = effect.processPhase === phase || !effect.processPhase;
    
    if (shouldProcess) {
      // 处理效果
      const processResult = processBuffEffect(updatedUnit, effect);
      updatedUnit = processResult.unit;
      effects.push(processResult.effect);
    }
    
    // 减少持续时间
    if (phase === 'end' && effect.duration > 0) {
      const updatedEffect = {
        ...effect,
        duration: effect.duration - 1
      };
      
      // 只保留持续时间大于0的效果
      if (updatedEffect.duration > 0) {
        updatedStatusEffects.push(updatedEffect);
      }
    } else {
      updatedStatusEffects.push(effect);
    }
  });
  
  // 更新单位的状态效果
  updatedUnit.statusEffects = updatedStatusEffects;
  
  return {
    unit: updatedUnit,
    effects
  };
};

/**
 * 处理单个buff效果
 * @param {Object} unit - 单位
 * @param {Object} effect - 状态效果
 * @returns {Object} - 处理结果
 */
export const processBuffEffect = (unit, effect) => {
  // 根据效果类型处理不同的效果
  switch (effect.buffId) {
    case 'poison':
      // 处理中毒效果
      const poisonDamage = Math.round(unit.derivedAttributes.maxHp * (effect.effectData.damagePercent || 0.05));
      const poisonResult = applyDamageToTarget(unit, poisonDamage);
      
      return {
        unit: poisonResult.updatedTarget,
        effect: {
          type: 'poison',
          damage: poisonResult.damageApplied
        }
      };
      
    case 'regeneration':
      // 处理生命恢复效果
      const regenAmount = Math.round(unit.derivedAttributes.maxHp * (effect.effectData.healPercent || 0.05));
      const regenResult = applyHealingToTarget(unit, regenAmount);
      
      return {
        unit: regenResult.updatedTarget,
        effect: {
          type: 'regeneration',
          healing: regenResult.healingApplied
        }
      };
      
    // 可以添加更多效果类型的处理
      
    default:
      // 默认不做任何处理
      return {
        unit,
        effect: {
          type: 'unknown',
          buffId: effect.buffId
        }
      };
  }
};
