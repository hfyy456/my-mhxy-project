import { COMBAT_ROLES } from "@/config/summon/combatRoleConfig";

/**
 * 定义战斗角色到阵型列的映射
 * 0: 前列
 * 1: 中列
 * 2: 后列
 */
export const roleToColMap = {
  [COMBAT_ROLES.TANK]: 0,         // 坦克在前列
  [COMBAT_ROLES.PHYSICAL_DPS]: 1, // 物理输出在中列
  [COMBAT_ROLES.MAGICAL_DPS]: 2,  // 法术输出在后列
  [COMBAT_ROLES.SPEEDSTER]: 1,    // 速度型在中列
  [COMBAT_ROLES.BALANCED]: 1,     // 平衡型在中列
};

/**
 * 根据智能规则排列召唤兽
 * @param {Array<Object>} summons - 玩家的所有召唤兽实例
 * @returns {Array<Array<string|null>>} - 新的 3x3 阵型网格
 */
export const arrangeFormationIntelligently = (summons, perspective = 'player') => {
  const MAX_FORMATION_SIZE = 5;
  console.log(`[formationLogic] 智能布阵开始 (视角: ${perspective})，接收到所有召唤兽:`, summons);
  
  // 1. 按战力排序，选出最强的N个
  let unplacedSummons = [...summons]
    .sort((a, b) => (b.power || 0) - (a.power || 0))
    .slice(0, MAX_FORMATION_SIZE);

  console.log(`[formationLogic] 已选择战力最高的 ${unplacedSummons.length} 个召唤兽:`, unplacedSummons);

  const newGrid = Array(3).fill(null).map(() => Array(3).fill(null));
  let placedCount = 0;

  // 2. 根据视角动态定义规则
  const isPlayerView = perspective === 'player';
  const frontCol = isPlayerView ? 2 : 0;
  const middleCol = 1;
  const backCol = isPlayerView ? 0 : 2;

  const roleToColMap = {
    [COMBAT_ROLES.TANK]: frontCol,
    [COMBAT_ROLES.PHYSICAL_DPS]: middleCol,
    [COMBAT_ROLES.MAGICAL_DPS]: backCol,
    [COMBAT_ROLES.SPEEDSTER]: middleCol,
    [COMBAT_ROLES.BALANCED]: middleCol,
  };

  // 定义位置优先级
  const placementPriority = [
    // 优先前列, 然后中列, 最后后列
    { row: 1, col: frontCol }, { row: 0, col: frontCol }, { row: 2, col: frontCol },
    { row: 1, col: middleCol }, { row: 0, col: middleCol }, { row: 2, col: middleCol },
    { row: 1, col: backCol }, { row: 0, col: backCol }, { row: 2, col: backCol },
  ];

  // 3. 阶段一: 理想位置放置
  console.log('[formationLogic] 开始第一阶段: 理想位置放置...');
  for (const { row, col } of placementPriority) {
    if (placedCount >= MAX_FORMATION_SIZE) break;

    // 寻找角色匹配的召唤兽
    const idealRolesForThisCol = Object.keys(roleToColMap).filter(role => roleToColMap[role] === col);
    const summonIndex = unplacedSummons.findIndex(s => idealRolesForThisCol.includes(s.combatRole));

    if (summonIndex !== -1) {
      const [summonToPlace] = unplacedSummons.splice(summonIndex, 1);
      newGrid[row][col] = summonToPlace.id;
      placedCount++;
    }
  }
  console.log(`[formationLogic] 第一阶段完成, 已放置 ${placedCount} 个. 剩余待放置:`, unplacedSummons.map(s=>s.nickname));


  // 4. 阶段二: 补位放置
  console.log('[formationLogic] 开始第二阶段: 补位放置...');
  if (unplacedSummons.length > 0) {
    for (const { row, col } of placementPriority) {
      if (placedCount >= MAX_FORMATION_SIZE) break;
      if (unplacedSummons.length === 0) break;

      if (!newGrid[row][col]) {
        const [summonToPlace] = unplacedSummons.splice(0, 1);
        newGrid[row][col] = summonToPlace.id;
        placedCount++;
      }
    }
  }
  console.log(`[formationLogic] 第二阶段完成, 最终放置 ${placedCount} 个.`);
  
  console.log('[formationLogic] 生成的最终阵型:', newGrid);
  return newGrid;
}; 