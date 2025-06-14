/*
 * @Author: Claude
 * @Date: 2025-06-15
 * @Description: 战斗中的捕捉逻辑
 */

/**
 * 计算并返回捕捉成功率的数值
 * @param {object} targetUnit - 目标单位
 * @param {number} baseCaptureRate - 基础捕捉率 (来自 allSummons.json)
 * @returns {number} 捕捉成功率 (0 到 1 之间的数字)
 */
export const getCaptureChance = (targetUnit, baseCaptureRate) => {
  if (!targetUnit || !targetUnit.derivedAttributes || typeof baseCaptureRate !== 'number') {
    console.error("计算捕捉成功率失败：无效的参数", { targetUnit, baseCaptureRate });
    return 0;
  }

  const { currentHp, maxHp } = targetUnit.derivedAttributes;
  if (currentHp <= 0 || maxHp <= 0) {
    return 0; // 不能捕捉已死亡或无效的单位
  }

  // HP越低，捕捉率越高。当HP为1时，修正系数达到最大值 (接近2)。
  // 当HP为满血时，修正系数为1。
  const hpFactor = 2 - (currentHp / maxHp);

  // 最终成功率 = 基础捕捉率 * 血量修正系数
  const finalCaptureChance = baseCaptureRate * hpFactor;

  // 确保成功率在合理范围内 [0, 1]
  const clampedChance = Math.max(0, Math.min(finalCaptureChance, 1));
  
  return clampedChance;
};

/**
 * 尝试执行捕捉操作
 * @param {object} targetUnit - 目标单位
 * @param {number} baseCaptureRate - 基础捕捉率 (来自 allSummons.json)
 * @returns {boolean} 是否捕捉成功
 */
export const attemptCapture = (targetUnit, baseCaptureRate) => {
  const chance = getCaptureChance(targetUnit, baseCaptureRate);
  const roll = Math.random();

  console.log(`[CaptureLogic] 尝试捕捉 ${targetUnit.name}: 最终成功率=${chance.toFixed(2)}, 投掷结果=${roll.toFixed(2)}`);

  return roll < chance;
};

// 保留旧函数以实现向后兼容，但标记为已弃用
/**
 * @deprecated Use attemptCapture instead.
 */
export const calculateCaptureSuccess = attemptCapture; 