/**
 * @file turnOrder.js
 * @description Contains logic for determining action order in battle.
 */

/**
 * Determines the order of actions for the current turn based on unit speed and selected actions.
 * @param {Object[]} allUnits - Array of all plain BattleUnit data objects.
 * @param {Object[]} actions - Array of action objects selected for the turn.
 * @returns {Object[]} - Array of action objects sorted by execution order.
 */
export const determineActionOrder = (allUnits, actions) => {
    // Create a map for quick unit lookup
    const unitMap = allUnits.reduce((map, unit) => {
        map[unit.id] = unit;
        return map;
    }, {});

    // Filter actions for units that still exist and are not defeated
    const validActions = actions.filter(action => {
        const unit = unitMap[action.unitId];
        return unit && !unit.isDefeated;
    });

    // Sort actions based on the speed of the acting unit
    return validActions.sort((a, b) => {
        const unitA = unitMap[a.unitId];
        const unitB = unitMap[b.unitId];

        const speedA = unitA?.derivedAttributes?.speed || 0;
        const speedB = unitB?.derivedAttributes?.speed || 0;

        // Higher speed goes first
        const speedDiff = speedB - speedA;
        if (speedDiff !== 0) {
            return speedDiff;
        }
        // Tie-breaker (can be random or based on another stat)
        return Math.random() - 0.5;
    });
};

/**
 * Determines the initial turn order for the battle.
 * @param {Object[]} allUnits - Array of all BattleUnit plain data objects participating.
 * @returns {string[]} - Array of battleUnit IDs in turn order.
 */
export const determineInitialTurnOrder = (allUnits) => {
  if (!allUnits || allUnits.length === 0) return [];
  // Simple sort by speed (descending). Add tie-breaking if needed.
  return [...allUnits]
    .sort((a, b) => b.derivedAttributes.speed - a.derivedAttributes.speed)
    .map(unit => unit.id);
}; 