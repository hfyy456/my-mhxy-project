/**
 * @file actionPlayer.js
 * @description A service for playing back battle actions asynchronously.
 * This decouples the core battle logic from the UI's animation system.
 */

// Placeholder for animation system, can be replaced with a real implementation.
const animationSystem = {
  play: (unitId, animationName) => {
    console.log(`[AnimationSystem] Unit ${unitId} playing animation: ${animationName}`);
    // In a real implementation, this would return a Promise that resolves when the animation is complete.
    return new Promise(resolve => setTimeout(resolve, 500)); // Simulate 500ms animation
  },
  flyProjectile: (startPos, endPos, projectileGfx) => {
    console.log(`[AnimationSystem] Projectile ${projectileGfx} flying from ${JSON.stringify(startPos)} to ${JSON.stringify(endPos)}`);
    return new Promise(resolve => setTimeout(resolve, 400)); // Simulate 400ms projectile flight
  },
};

// Placeholder for a UI system to show damage numbers, etc.
const uiSystem = {
  showDamageNumber: (unitId, damage) => {
    console.log(`[UISystem] Unit ${unitId} shows damage number: ${damage}`);
    return new Promise(resolve => setTimeout(resolve, 300)); // Simulate number animation
  },
};

/**
 * Plays a complete action sequence, including animations and effects.
 * This is the core of the asynchronous battle handling.
 * @param {object} action - The action object containing all necessary details.
 *   - {string} casterId - The ID of the unit performing the action.
 *   - {string} targetId - The ID of the target unit.
 *   - {object} skill - The skill being used.
 *   - {number} damage - The calculated damage.
 * @param {function} dispatch - The Redux dispatch function.
 * @returns {Promise<void>} A promise that resolves when the entire action sequence is complete.
 */
export const playAction = async (action, dispatch) => {
  const { casterId, targetId, skill, damage } = action;

  // 1. Play the caster's attack/skill animation
  await animationSystem.play(casterId, skill.animation || 'attack');

  // 2. (Optional) Play projectile animation if it exists
  if (skill.projectile) {
    // These positions would need to be fetched from the state
    const startPos = { x: 0, y: 0 }; 
    const endPos = { x: 1, y: 1 };
    await animationSystem.flyProjectile(startPos, endPos, skill.projectile.gfx);
  }

  // 3. Apply damage/effects and play target's reaction animations simultaneously
  await Promise.all([
    // Here we would dispatch the actual state change to apply damage
    // For now, we just log it. In the final version, this would be a dispatch call.
    // e.g., dispatch(applyDamage({ targetId, damage }))
    new Promise(resolve => {
      console.log(`[ActionPlayer] Applying ${damage} damage to ${targetId}`);
      resolve();
    }),
    animationSystem.play(targetId, 'hitReaction'),
    uiSystem.showDamageNumber(targetId, damage)
  ]);

  console.log(`[ActionPlayer] Action sequence for ${casterId} -> ${targetId} complete.`);
}; 