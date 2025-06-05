// src/features/battle/logic/battleRewards.js

import rewardManager from '@/store/RewardManager';

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

  // 增强的物品掉落逻辑
  const items = [];
  
  // 基础掉落（消耗品）
  if (Math.random() < 0.3) { // 30% 几率掉落生命药水
    items.push({
      name: '生命药水',
      type: 'consumable',
      rarity: 'common',
      quantity: Math.floor(Math.random() * 3) + 1,
      description: '恢复100点生命值',
      value: 50
    });
  }

  if (Math.random() < 0.25) { // 25% 几率掉落法力药水
    items.push({
      name: '法力药水',
      type: 'consumable',
      rarity: 'common',
      quantity: Math.floor(Math.random() * 2) + 1,
      description: '恢复100点法力值',
      value: 60
    });
  }

  // 装备掉落（基于敌人等级）
  const avgEnemyLevel = totalEnemyLevel / Math.max(enemyCount, 1);
  
  if (Math.random() < 0.15) { // 15% 几率掉落装备
    const equipmentTypes = [
      {
        name: '铁剑',
        type: 'equipment',
        subType: 'weapon',
        slotType: 'weapon',
        rarity: avgEnemyLevel > 5 ? 'uncommon' : 'common',
        description: '锋利的铁制武器',
        value: 150,
        effects: { 
          physicalAttack: { 
            type: 'flat', 
            value: 15 + Math.floor(avgEnemyLevel * 2) 
          } 
        },
        level: Math.max(1, Math.floor(avgEnemyLevel))
      },
      {
        name: '皮甲',
        type: 'equipment',
        subType: 'armor',
        slotType: 'armor',
        rarity: avgEnemyLevel > 5 ? 'uncommon' : 'common',
        description: '坚韧的皮制护甲',
        value: 120,
        effects: { 
          physicalDefense: { 
            type: 'flat', 
            value: 12 + Math.floor(avgEnemyLevel * 1.5) 
          } 
        },
        level: Math.max(1, Math.floor(avgEnemyLevel))
      },
      {
        name: '法师帽',
        type: 'equipment',
        subType: 'hat',
        slotType: 'hat',
        rarity: avgEnemyLevel > 3 ? 'uncommon' : 'common',
        description: '提升法力的帽子',
        value: 100,
        effects: { 
          magicalAttack: { 
            type: 'flat', 
            value: 10 + Math.floor(avgEnemyLevel * 1.2) 
          } 
        },
        level: Math.max(1, Math.floor(avgEnemyLevel))
      }
    ];

    const randomEquipment = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
    items.push(randomEquipment);
  }

  // 稀有掉落
  if (Math.random() < 0.05) { // 5% 几率掉落稀有物品
    items.push({
      name: '强化石',
      type: 'material',
      rarity: 'rare',
      quantity: 1,
      description: '可用于强化装备的稀有材料',
      value: 500
    });
  }

  console.log(`[battleRewards] Calculated rewards - Exp: ${baseExperience}, Gold: ${baseGold}, Items:`, items);

  return {
    experience: baseExperience,
    gold: baseGold,
    items: items,
    message: `战斗胜利！获得 ${baseExperience} 经验，${baseGold} 金币${items.length > 0 ? '，以及一些战利品' : ''}。`
  };
};

/**
 * 处理战斗奖励的分发
 * @param {object} rewards - 奖励对象
 * @returns {Promise<object>} 奖励处理结果
 */
export const distributeRewards = async (rewards) => {
  return await rewardManager.giveRewards(rewards, 'battle');
};

// 未来可以添加更多与奖励计算相关的辅助函数
