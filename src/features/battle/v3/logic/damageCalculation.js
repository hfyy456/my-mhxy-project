/*
 * @Author: Cascade AI
 * @Date: 2025-05-25
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-15 04:49:31
 * @Description: 战斗系统伤害结算逻辑
 */
import {
  DAMAGE_CONSTANTS,
  COMBAT_CONSTANTS,
} from "@/config/system/combatConfig";
import {
  calculateDamageModifiers,
  processShieldAbsorption,
  processReflectDamage,
} from "./buffManager";
import cloneDeep from "lodash/cloneDeep";

/**
 * 计算物理伤害
 * @param {number} attackerPAtk - 攻击者的物理攻击力
 * @param {number} defenderPDef - 防御者的物理防御力
 * @param {number} critRate - 攻击者的暴击率（0-1之间的小数）
 * @param {number} critDamage - 攻击者的暴击伤害系数（如1.435表示143.5%暴击伤害）
 * @param {number} skillBonus - 技能伤害加成系数（默认为1，表示无加成）
 * @param {number} fixedReduction - 固定值硬减伤（默认为0）
 * @param {number} percentReduction - 百分比硬减伤（0-1之间的小数，默认为0）
 * @returns {Object} - 返回包含伤害计算结果和详情的对象
 */
export const calculatePhysicalDamage = (
  attackerPAtk,
  defenderPDef,
  critRate,
  critDamage,
  skillBonus = DAMAGE_CONSTANTS.COMMON.DEFAULT_SKILL_BONUS,
  fixedReduction = DAMAGE_CONSTANTS.COMMON.DEFAULT_FIXED_REDUCTION,
  percentReduction = DAMAGE_CONSTANTS.COMMON.DEFAULT_PERCENT_REDUCTION
) => {
  // 从配置中获取平衡常数
  const k = DAMAGE_CONSTANTS.PHYSICAL.BALANCE_CONSTANT;
  // console.log(
  //   `[calcPhysDmg] AttackerPAtk: ${attackerPAtk}, DefenderPDef: ${defenderPDef}, CritRate: ${critRate}, CritDmg: ${critDamage}, SkillBonus: ${skillBonus}, FixedRed: ${fixedReduction}, PctRed: ${percentReduction}, k: ${k}`
  // );

  // 计算基础物理伤害
  const damageReductionRatio = defenderPDef / (defenderPDef + k);
  const basePhysicalDamage = attackerPAtk * (1 - damageReductionRatio);
  // console.log(
  //   `[calcPhysDmg] DamageReductionRatio: ${damageReductionRatio}, BasePhysicalDamage: ${basePhysicalDamage}`
  // );

  // 判断是否暴击
  const isCritical = Math.random() < critRate;
  const criticalDamage = isCritical
    ? basePhysicalDamage * critDamage
    : basePhysicalDamage;

  // 应用技能加成
  const skillDamage = criticalDamage * skillBonus;

  // 应用固定值硬减伤
  const fixedReducedDamage = Math.max(0, skillDamage - fixedReduction);

  // 应用百分比硬减伤
  const percentReducedDamage = fixedReducedDamage * (1 - percentReduction);

  // 应用伤害浮动
  const variation = DAMAGE_CONSTANTS.PHYSICAL.DAMAGE_VARIATION;
  const damageVariation = -variation + Math.random() * (variation * 2); // -variation 到 +variation 之间的随机数
  const finalDamage = Math.round(percentReducedDamage * (1 + damageVariation));

  // 返回详细的伤害计算过程和结果
  return {
    finalDamage,
    details: {
      basePhysicalDamage: Math.round(basePhysicalDamage),
      isCritical,
      criticalDamage: Math.round(criticalDamage),
      skillDamage: Math.round(skillDamage),
      fixedReducedDamage: Math.round(fixedReducedDamage),
      percentReducedDamage: Math.round(percentReducedDamage),
      damageVariation,
    },
  };
};

/**
 * 计算法术伤害
 * @param {number} attackerMAtk - 攻击者的法术攻击力
 * @param {number} defenderMDef - 防御者的法术防御力
 * @param {number} critRate - 攻击者的暴击率（0-1之间的小数）
 * @param {number} critDamage - 攻击者的暴击伤害系数（如1.435表示143.5%暴击伤害）
 * @param {number} skillBonus - 技能伤害加成系数（默认为1，表示无加成）
 * @param {number} fixedReduction - 固定值硬减伤（默认为0）
 * @param {number} percentReduction - 百分比硬减伤（0-1之间的小数，默认为0）
 * @returns {Object} - 返回包含伤害计算结果和详情的对象
 */
export const calculateMagicalDamage = (
  attackerMAtk,
  defenderMDef,
  critRate,
  critDamage,
  skillBonus = DAMAGE_CONSTANTS.COMMON.DEFAULT_SKILL_BONUS,
  fixedReduction = DAMAGE_CONSTANTS.COMMON.DEFAULT_FIXED_REDUCTION,
  percentReduction = DAMAGE_CONSTANTS.COMMON.DEFAULT_PERCENT_REDUCTION
) => {
  // 从配置中获取平衡常数
  const k = DAMAGE_CONSTANTS.MAGICAL.BALANCE_CONSTANT;
  // console.log(
  //   `[calcMagDmg] AttackerMAtk: ${attackerMAtk}, DefenderMDef: ${defenderMDef}, CritRate: ${critRate}, CritDmg: ${critDamage}, SkillBonus: ${skillBonus}, FixedRed: ${fixedReduction}, PctRed: ${percentReduction}, k: ${k}`
  // );
  // console.log(`法术平衡常数: ${k}`);
  // console.log(`法术攻击力: ${attackerMAtk}`);
  // console.log(`法术防御力: ${defenderMDef}`);
  // 计算基础法术伤害
  // 防止除数为0或者计算结果为NaN
  if (!attackerMAtk || attackerMAtk <= 0) {
    // console.log(`警告: 法术攻击力无效 (${attackerMAtk})`);
    return {
      finalDamage: 0,
      details: {
        baseMagicalDamage: 0,
        isCritical: false,
        criticalDamage: 0,
        skillDamage: 0,
        fixedReducedDamage: 0,
        percentReducedDamage: 0,
        damageVariation: 0,
      },
    };
  }

  // 确保防御值有效
  const validDefenderMDef = defenderMDef > 0 ? defenderMDef : 1;

  // 计算减伤比例
  const damageReductionRatio = validDefenderMDef / (validDefenderMDef + k);
  // console.log(
  //   `法术减伤比例: ${damageReductionRatio.toFixed(
  //     4
  //   )} (法术防御: ${validDefenderMDef}, k: ${k})`
  // );

  // 计算基础伤害
  const baseMagicalDamage = attackerMAtk * (1 - damageReductionRatio);
  // console.log(
  //   `[calcMagDmg] DamageReductionRatio: ${damageReductionRatio}, BaseMagicalDamage: ${baseMagicalDamage}`
  // );
  // console.log(
  //   `基础法术伤害: ${baseMagicalDamage.toFixed(
  //     2
  //   )} (法术攻击: ${attackerMAtk}, 法术防御: ${validDefenderMDef})`
  // );

  // 判断是否暴击
  const isCritical = Math.random() < critRate;
  const criticalDamage = isCritical
    ? baseMagicalDamage * critDamage
    : baseMagicalDamage;

  // 应用技能加成
  const skillDamage = criticalDamage * skillBonus;

  // 应用固定值硬减伤
  const fixedReducedDamage = Math.max(0, skillDamage - fixedReduction);

  // 应用百分比硬减伤
  const percentReducedDamage = fixedReducedDamage * (1 - percentReduction);

  // 应用伤害浮动
  const variation = DAMAGE_CONSTANTS.MAGICAL.DAMAGE_VARIATION;
  const damageVariation = -variation + Math.random() * (variation * 2); // -variation 到 +variation 之间的随机数
  const finalDamage = Math.round(percentReducedDamage * (1 + damageVariation));

  // 返回详细的伤害计算过程和结果
  return {
    finalDamage,
    details: {
      baseMagicalDamage: Math.round(baseMagicalDamage),
      isCritical,
      criticalDamage: Math.round(criticalDamage),
      skillDamage: Math.round(skillDamage),
      fixedReducedDamage: Math.round(fixedReducedDamage),
      percentReducedDamage: Math.round(percentReducedDamage),
      damageVariation,
    },
  };
};

/**
 * 计算战斗单位对目标造成的伤害
 * @param {Object} attacker - 攻击者单位
 * @param {Object} defender - 防御者单位
 * @param {string} damageType - 伤害类型 ('physical', 'magical' 或 'auto')
 * @param {number} skillBonus - 技能伤害加成系数
 * @param {Object} options - 额外选项
 * @returns {Object} - 返回包含伤害计算结果和详情的对象
 */
export const calculateBattleDamage = (
  attacker,
  defender,
  damageType = "auto",
  skillBonus = DAMAGE_CONSTANTS.COMMON.DEFAULT_SKILL_BONUS,
  options = {}
) => {
  // console.log(
  //   "[calcBattleDmg] Attacker:",
  //   JSON.stringify(attacker.derivedAttributes),
  //   "Defender:",
  //   JSON.stringify(defender.derivedAttributes),
  //   "DamageType:",
  //   damageType,
  //   "SkillBonus:",
  //   skillBonus,
  //   "Options:",
  //   JSON.stringify(options),
  //   "Defender.isDefending:",
  //   defender.isDefending
  // );
  // 如果自动选择伤害类型，根据攻击者的物理攻击和法术攻击值决定
  if (damageType === "auto") {
    // 获取物理攻击和法术攻击值，支持简写和完整属性名
    const physicalAttack =
      attacker.derivedAttributes.physicalAttack || attacker.derivedAttributes.pAtk || 0;
    const magicalAttack =
      attacker.derivedAttributes.magicalAttack || attacker.derivedAttributes.mAtk || 0; // 假设法术攻击仍然按原方式获取，或者如果也合并到了 attack，则需要相应调整

    const determinedDamageType =
      physicalAttack >= magicalAttack ? "physical" : "magical"; // Prefer physical if equal
    // console.log(
    //   `[calcBattleDmg] Auto-determining damage type. pAtk: ${physicalAttack}, mAtk: ${magicalAttack}. Determined type: ${determinedDamageType}`
    // );
    damageType = determinedDamageType;
    console.log(
      `自动选择伤害类型: ${damageType} (物理攻击: ${physicalAttack}, 法术攻击: ${magicalAttack})`
    );
  }

  // 获取攻击者和防御者的相关属性
  const attackerStats = attacker.derivedAttributes;
  const defenderStats = defender.derivedAttributes;

  // 获取攻击者的暴击率和暴击伤害
  const critRate = attackerStats.critRate || COMBAT_CONSTANTS.DEFAULT_CRIT_RATE;
  const critDamage =
    attackerStats.critDamage || COMBAT_CONSTANTS.DEFAULT_CRIT_DAMAGE;

  // 获取防御者的减伤属性
  const fixedReduction = defenderStats.fixedReduction || 0;
  const percentReduction = defenderStats.percentReduction || 0;

  // 根据伤害类型调用相应的计算函数
  if (damageType === "physical") {
    const physicalAttack = attackerStats.physicalAttack || attackerStats.pAtk || 0;
    const physicalDefense = defenderStats.physicalDefense || defenderStats.pDef || 0;
    return calculatePhysicalDamage(
      physicalAttack,
      physicalDefense,
      critRate,
      critDamage,
      skillBonus,
      fixedReduction,
      percentReduction
    );
  } else { // magical
    const magicalAttack = attackerStats.magicalAttack || attackerStats.mAtk || 0;
    const magicalDefense = defenderStats.magicalDefense || defenderStats.mDef || 0;
    return calculateMagicalDamage(
      magicalAttack,
      magicalDefense,
      critRate,
      critDamage,
      skillBonus,
      fixedReduction,
      percentReduction
    );
  }
};

/**
 * 模拟战斗伤害计算并返回详细信息，用于调试
 * @param {Object} attacker - 攻击者单位
 * @param {Object} defender - 防御者单位
 * @returns {Object} - 伤害计算结果和详情
 */
export const simulateBattleDamage = (attacker, defender) => {
  // 计算物理伤害
  const physicalDamage = calculateBattleDamage(attacker, defender, "physical");

  // 计算法术伤害
  const magicalDamage = calculateBattleDamage(attacker, defender, "magical");

  // 计算自动选择的伤害
  const autoDamage = calculateBattleDamage(attacker, defender, "auto");

  // 获取攻击者和防御者的详细属性
  const attackerStats = attacker.derivedAttributes;
  const defenderStats = defender.derivedAttributes;

  // 统一属性名，支持简写和完整属性名
  const physicalAttack =
    attackerStats.physicalAttack || attackerStats.pAtk || 0;
  const magicalAttack = attackerStats.magicalAttack || attackerStats.mAtk || 0;
  const physicalDefense =
    defenderStats.physicalDefense || defenderStats.pDef || 0;
  const magicalDefense =
    defenderStats.magicalDefense || defenderStats.mDef || 0;

  // 返回详细的模拟结果
  return {
    attacker: {
      id: attacker.id,
      name: attacker.name,
      derivedAttributes: {
        // 使用统一的属性名
        physicalAttack,
        magicalAttack,
        pAtk: attackerStats.pAtk,
        mAtk: attackerStats.mAtk,
        critRate: attackerStats.critRate || COMBAT_CONSTANTS.DEFAULT_CRIT_RATE,
        critDamage:
          attackerStats.critDamage || COMBAT_CONSTANTS.DEFAULT_CRIT_DAMAGE,
      },
    },
    defender: {
      id: defender.id,
      name: defender.name,
      derivedAttributes: {
        // 使用统一的属性名
        physicalDefense,
        magicalDefense,
        pDef: defenderStats.pDef,
        mDef: defenderStats.mDef,
        fixedReduction: defenderStats.fixedReduction || 0,
        percentReduction: defenderStats.percentReduction || 0,
      },
    },
    damageResults: {
      physical: physicalDamage,
      magical: magicalDamage,
      auto: autoDamage,
    },
  };
};

/**
 * 应用伤害到目标单位
 * @param {Object} target - 目标单位
 * @param {number} damage - 伤害值
 * @param {Object} source - 伤害来源单位
 * @param {Object} options - 额外选项
 * @returns {Object} - 更新后的目标单位和伤害应用结果
 */
export const applyDamageToTarget = (
  target,
  damage,
  source = null,
  options = {}
) => {
  const updatedTarget = cloneDeep(target);
  let updatedSource = source ? cloneDeep(source) : null;

  // 确保伤害值为整数
  let finalDamage = Math.round(damage);
  let reflectDamage = 0;
  let shieldAbsorbed = 0;
  let reflectResult = null;
  let shieldResult = null;

  // 处理护盾吸收伤害
  if (updatedTarget.statusEffects && updatedTarget.statusEffects.length > 0) {
    shieldResult = processShieldAbsorption(updatedTarget, finalDamage);
    if (shieldResult && shieldResult.absorbedDamage > 0) {
      shieldAbsorbed = shieldResult.absorbedDamage;
      finalDamage = shieldResult.remainingDamage;
    }
  }

  // 处理伤害反弹
  if (
    updatedSource &&
    updatedTarget.statusEffects &&
    updatedTarget.statusEffects.length > 0
  ) {
    reflectResult = processReflectDamage(
      updatedSource,
      updatedTarget,
      finalDamage
    );
    if (reflectResult && reflectResult.reflectedDamage > 0) {
      reflectDamage = reflectResult.reflectedDamage;

      // 应用反弹伤害到源单位
      const sourceCurrentHp = updatedSource.derivedAttributes.currentHp;
      const sourceNewHp = Math.max(0, sourceCurrentHp - reflectDamage);
      const sourceisDefeated = sourceNewHp <= 0;

      // 更新源单位的生命值
      updatedSource.derivedAttributes.currentHp = sourceNewHp;
      updatedSource.isDefeated = sourceisDefeated;
    }
  }

  // 计算目标剩余生命值
  const currentHp = updatedTarget.derivedAttributes.currentHp;
  const newHp = Math.max(0, currentHp - finalDamage);

  // 检查目标是否死亡
  const isDefeated = newHp <= 0;

  // 更新目标单位的生命值
  updatedTarget.derivedAttributes.currentHp = newHp;
  updatedTarget.isDefeated = isDefeated;

  // 返回更新结果
  return {
    updatedTarget,
    updatedSource, // 可能被反弹伤害影响的源单位
    damageApplied: finalDamage,
    previousHp: currentHp,
    newHp,
    isDefeated,
    shieldAbsorbed,
    reflectDamage,
    shieldResult,
    reflectResult,
  };
};

/**
 * 计算治疗量
 * @param {number} healPower - 治疗能力值
 * @param {number} healBonus - 治疗加成系数
 * @returns {Object} - 返回包含治疗计算结果和详情的对象
 */
export const calculateHealing = (healPower, healBonus = 1.0) => {
  // 应用治疗加成
  const baseHealing = healPower * healBonus;

  // 应用治疗浮动
  const variation = DAMAGE_CONSTANTS.HEALING.HEALING_VARIATION || 0.1;
  const healingVariation = -variation + Math.random() * (variation * 2);
  const finalHealing = Math.round(baseHealing * (1 + healingVariation));

  // 返回详细的治疗计算过程和结果
  return {
    finalHealing,
    details: {
      baseHealing: Math.round(baseHealing),
      healingVariation,
    },
  };
};

/**
 * 应用治疗到目标单位
 * @param {Object} target - 目标单位
 * @param {number} healing - 治疗值
 * @param {Object} options - 额外选项
 * @returns {Object} - 更新后的目标单位和治疗应用结果
 */
export const applyHealingToTarget = (target, healing, options = {}) => {
  // 确保治疗值为整数
  const finalHealing = Math.round(healing);

  // 计算目标新的生命值，不超过最大生命值
  const currentHp = target.derivedAttributes.currentHp;
  const maxHp = target.derivedAttributes.maxHp;
  const newHp = Math.min(maxHp, currentHp + finalHealing);

  // 计算实际恢复的生命值
  const actualHealing = newHp - currentHp;

  // 更新目标单位的生命值
  const updatedTarget = {
    ...target,
    derivedAttributes: {
      ...target.derivedAttributes,
      currentHp: newHp,
    },
  };

  // 返回更新结果
  return {
    updatedTarget,
    healingApplied: actualHealing,
    previousHp: currentHp,
    newHp,
    isFullHp: newHp >= maxHp,
  };
};
