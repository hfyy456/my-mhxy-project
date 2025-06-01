// src/features/battle/logic/battleRewards.js

/**
 * 计算战斗胜利后的奖励。
 * @param {object} playerUnits 玩家单位列表或对象
 * @param {object} enemyUnits 敌方单位列表或对象
 * @param {object} battleResult 战斗结果 (例如 'victory', 'defeat')
 * @returns {object} 包含经验值、金钱、物品等奖励的对象
 */
export const calculateRewards = (playerUnits, enemyUnits, battleResult) => {
  console.log('[battleRewards] Calculating rewards for battle result:', battleResult);
  if (battleResult !== 'victory') {
    return {
      experience: 0,
      gold: 0,
      items: [],
      message: '战斗失败，没有奖励。'
    };
  }

  // 示例奖励逻辑：
  // 根据敌人等级和数量计算基础经验和金钱
  let totalEnemyLevel = 0;
  let enemyCount = 0;
  Object.values(enemyUnits).forEach(unit => {
    if (!unit.isPlayerUnit) {
      totalEnemyLevel += unit.level || 1;
      enemyCount++;
    }
  });

  const baseExperience = totalEnemyLevel * 10 + enemyCount * 5;
  const baseGold = totalEnemyLevel * 5 + enemyCount * 2;

  // TODO: 实现更复杂的物品掉落逻辑
  const items = [];
  if (Math.random() < 0.1) { // 10% 几率掉落一个示例物品
    items.push({ id: 'sample_item_001', name: '小回复药水', quantity: 1 });
  }

  console.log(`[battleRewards] Calculated rewards - Exp: ${baseExperience}, Gold: ${baseGold}, Items:`, items);

  return {
    experience: baseExperience,
    gold: baseGold,
    items: items,
    message: `战斗胜利！获得 ${baseExperience} 经验，${baseGold} 金币。`
  };
};

// 未来可以添加更多与奖励计算相关的辅助函数
