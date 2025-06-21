/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-11 05:54:32
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-16 05:22:37
 */
import { createCreatureFromTemplate } from '@/utils/summonUtils';
import { SUMMON_NATURE_TYPES, SUMMON_SOURCES, EQUIPMENT_EFFECT_TYPES } from '@/config/enumConfig';
import { arrangeFormationIntelligently } from '@/features/formation/formationLogic';
import { difficultySettings, CURRENT_DIFFICULTY } from '@/config/config';

/**
 * 将生成的敌人随机放置到3x3阵型中
 * @param {Array<object>} enemies - 敌人实例数组
 * @returns {object} - 阵型对象
 */
const createEnemyFormation = (enemies) => {
  const grid = Array(3).fill(null).map(() => Array(3).fill(null));
  const availablePositions = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      availablePositions.push({ row: i, col: j });
    }
  }

  // 打乱可用位置
  for (let i = availablePositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
  }

  // 放置敌人
  enemies.forEach((enemy, index) => {
    if (index < availablePositions.length) {
      const pos = availablePositions[index];
      grid[pos.row][pos.col] = enemy.id;
    }
  });
  
  return {
    id: `enemy_formation_${Date.now()}`,
    name: '敌方阵型',
    grid,
  };
};

// 定义不同 natureType 的出现概率
const NATURE_TYPE_DISTRIBUTION = {
  [SUMMON_NATURE_TYPES.WILD]: 0.85,  // 85% 普通野生
  [SUMMON_NATURE_TYPES.BABY]: 0.10,  // 10% 宝宝 (精英)
  [SUMMON_NATURE_TYPES.MUTANT]: 0.05, // 5% 变异 (稀有/头目)
};

const determineNatureType = () => {
  const rand = Math.random();
  let cumulativeProb = 0;
  for (const type in NATURE_TYPE_DISTRIBUTION) {
    cumulativeProb += NATURE_TYPE_DISTRIBUTION[type];
    if (rand < cumulativeProb) {
      return type;
    }
  }
  return SUMMON_NATURE_TYPES.WILD; // 默认
};

/**
 * 生成敌人组合
 * @param {object} options - 生成选项
 * @param {Array<string>} options.enemyPool - 可用敌人模板ID池
 * @param {number} options.level - 平均等级
 * @param {number} options.count - 敌人数量 (1-5)
 * @returns {{enemies: Array<object>, enemyFormation: object}|null}
 */
export const generateEnemyGroup = async ({ enemyPool, level, count }) => {
  const finalCount = Math.max(1, Math.min(5, count));
  
  if (!enemyPool || enemyPool.length === 0) {
    console.error(`敌人池为空`);
    return null;
  }

  const selectedEnemies = [];
  for (let i = 0; i < finalCount; i++) {
    const randomTemplateId = enemyPool[Math.floor(Math.random() * enemyPool.length)];
    const natureType = determineNatureType(); // 决定本次生成的 natureType

    const levelVariance = Math.floor(Math.random() * 5) - 2;
    const finalLevel = Math.max(1, level + levelVariance);

    // 1. 使用工厂函数创建 Summon 类的实例
    const enemyInstance = await createCreatureFromTemplate({
      templateId: randomTemplateId,
      level: 1, // Start at level 1
      natureType: natureType,

    });

    if (!enemyInstance) continue;

    // 2. 直接在实例上设置等级并重算属性
    await enemyInstance.setLevel(finalLevel);
    
    // 3. 应用难度系数
    const difficultyConfig = difficultySettings[CURRENT_DIFFICULTY];
    if (difficultyConfig) {
      const { modifier, specificStatModifiers } = difficultyConfig;
      const { HP, MP, PHYSICAL_ATTACK, MAGICAL_ATTACK, PHYSICAL_DEFENSE, MAGICAL_DEFENSE, SPEED } = EQUIPMENT_EFFECT_TYPES;
      
      const statsToModify = [HP, MP, PHYSICAL_ATTACK, MAGICAL_ATTACK, PHYSICAL_DEFENSE, MAGICAL_DEFENSE, SPEED];

      statsToModify.forEach(stat => {
        if (enemyInstance.derivedAttributes[stat]) {
          enemyInstance.derivedAttributes[stat] = Math.floor(enemyInstance.derivedAttributes[stat] * modifier);
        }
      });
      
      // 应用特定属性的额外加成
      if (specificStatModifiers) {
        for (const stat in specificStatModifiers) {
          if (enemyInstance.derivedAttributes[stat]) {
            enemyInstance.derivedAttributes[stat] = Math.floor(enemyInstance.derivedAttributes[stat] * specificStatModifiers[stat]);
          }
        }
      }
      

    }
    enemyInstance.isPlayerUnit=false

    // 4. 将保持着"实例"身份的敌人添加到数组中
    selectedEnemies.push(enemyInstance);
  }

  // 使用智能布阵算法为敌人生成阵型
  const enemyFormationGrid = arrangeFormationIntelligently(selectedEnemies, 'enemy');
  const enemyFormation = {
    id: `enemy_formation_${Date.now()}`,
    name: '敌方阵型',
    grid: enemyFormationGrid,
  };
  
  const totalPower = selectedEnemies.reduce((sum, enemy) => sum + (enemy.power || 0), 0);

  return {
    name: "遭遇战",
    description: `一支由${selectedEnemies.length}个单位组成的敌方小队。`,
    enemies: selectedEnemies,
    enemyFormation,
    totalPower,
  };
}; 