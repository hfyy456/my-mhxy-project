/**
 * Finds the row and column index of a unit on a grid.
 * @param {string} unitId - The ID of the unit to find.
 * @param {Array<Array<string>>} grid - The 2D array representing the grid.
 * @returns {{row: number, col: number}|null} - The coordinates or null if not found.
 */
const findUnitCoordinates = (unitId, grid) => {
  if (!grid || !unitId) return null;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] === unitId) {
        return { row, col };
      }
    }
  }
  return null;
};

/**
 * Calculates the coordinates of all cells affected by an area-of-effect skill.
 * @param {object} skill - The skill object, containing areaType.
 * @param {{row: number, col: number}} centerCoords - The coordinates of the center of the AOE.
 * @returns {Array<{row: number, col: number}>} - An array of affected cell coordinates.
 */
export const getAffectedCellCoords = (skill, centerCoords) => {
  if (!skill.areaType || !centerCoords) return [];

  const { row: r, col: c } = centerCoords;
  let affectedCoords = [];

  switch (skill.areaType) {
    case 'cross':
      affectedCoords = [{row: r, col: c}, {row: r - 1, col: c}, {row: r + 1, col: c}, {row: r, col: c - 1}, {row: r, col: c + 1}];
      break;
    case 'square':
      for (let i = r - 1; i <= r + 1; i++) {
        for (let j = c - 1; j <= c + 1; j++) {
          affectedCoords.push({ row: i, col: j });
        }
      }
      break;
    default:
      affectedCoords = [{row: r, col: c}];
      break;
  }
  return affectedCoords;
}

/**
 * Gets all affected targets based on skill type and area type.
 * @param {object} skill - The skill object from config.
 * @param {string} sourceUnitId - The ID of the unit using the skill.
 * @param {string} primaryTargetId - The ID of the primary target selected by the user/AI.
 * @param {object} context - The battle machine's context.
 * @returns {Array<string>} - An array of unit IDs that are affected.
 */
export const getSkillTargets = (skill, sourceUnitId, primaryTargetId, context) => {
  const { allUnits, playerGrid, enemyGrid } = context;
  const sourceUnit = allUnits[sourceUnitId];
  if (!sourceUnit) return [];

  // 1. Determine the base target pool based on targetType
  let targetPool = {};
  let targetGrid = null;
  
  switch(skill.targetType) {
    case 'self':
      return [sourceUnitId];
    case 'ally':
      targetPool = context.playerTeam;
      targetGrid = playerGrid;
      break;
    case 'enemy':
    case 'group': // 'group' also targets enemies
    case 'area':  // 'area' also targets enemies
    default:
      targetPool = context.enemyTeam;
      targetGrid = enemyGrid;
      break;
  }

  const livingTargetsInPool = Object.values(targetPool)
    .filter(u => allUnits[u.id]?.derivedAttributes.currentHp > 0);

  // 2. Filter the pool based on areaType
  const areaType = skill.areaType || 'single'; // Default to single if not specified

  switch (areaType) {
    case 'single':
      return primaryTargetId ? [primaryTargetId] : [];
    case 'group': // 'group' areaType means all targets in the pool
      return livingTargetsInPool.map(u => u.id);
    case 'cross':
    case 'square':
    case 'circle': { // Added circle for future use
      const primaryTargetCoords = findUnitCoordinates(primaryTargetId, targetGrid);
      if (!primaryTargetCoords) return [];
      
      const affectedCoords = getAffectedCellCoords(skill, primaryTargetCoords);
      
      const affectedTargets = affectedCoords
        .map(coords => targetGrid[coords.r]?.[coords.c])
        .filter(unitId => unitId && allUnits[unitId]?.derivedAttributes.currentHp > 0);
      
      return [...new Set(affectedTargets)];
    }
    default:
      return primaryTargetId ? [primaryTargetId] : [];
  }
}; 