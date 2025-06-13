/*
 * @Author: Claude
 * @Date: 2025-06-15
 * @Description: 战斗中的捕捉逻辑
 */

/**
 * 计算捕捉成功率
 * @param {object} targetUnit - 目标单位
 * @param {number} baseCaptureRate - 基础捕捉率 (来自 allSummons.json)
 * @returns {boolean} 是否捕捉成功
 */
export const calculateCaptureSuccess = (targetUnit, baseCaptureRate) => {
  if (!targetUnit || !targetUnit.stats || typeof baseCaptureRate !== 'number') {
    console.error("计算捕捉成功率失败：无效的参数", { targetUnit, baseCaptureRate });
    return false;
  }

  const { currentHp, maxHp } = targetUnit.stats;
  if (currentHp <= 0 || maxHp <= 0) {
    return false; // 不能捕捉已死亡或无效的单位
  }

  // HP越低，捕捉率越高。当HP为1时，修正系数达到最大值 (接近2)。
  // 当HP为满血时，修正系数为1。
  const hpFactor = 2 - (currentHp / maxHp);

  // 最终成功率 = 基础捕捉率 * 血量修正系数
  const finalCaptureChance = baseCaptureRate * hpFactor;

  // 确保成功率在合理范围内 [0, 1]
  const clampedChance = Math.max(0, Math.min(finalCaptureChance, 1));

  // 掷骰子
  const roll = Math.random();

  console.log(`[CaptureLogic] 尝试捕捉 ${targetUnit.name}: 基础率=${baseCaptureRate}, HP=${currentHp}/${maxHp}, HP修正=${hpFactor.toFixed(2)}, 最终成功率=${clampedChance.toFixed(2)}, 投掷结果=${roll.toFixed(2)}`);

  return roll < clampedChance;
}; 