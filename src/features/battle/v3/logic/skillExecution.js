import { skills as skillConfig } from './skillConfig';
import { getSkillTargets } from './targetLogic';

// This function is moved from battleMachine.js to separate skill execution logic.
export const generateSkillResult = (action, allUnits, context) => {
  const { type, unitId, target: primaryTargetId } = action;

  const skillId = type === 'attack' ? 'basic_attack' : type;
  const skill = skillConfig[skillId];
  
  if (!skill) {
    console.error(`Skill "${skillId}" not found.`);
    return { animationScript: [], logicalResult: { hpChanges: [], buffChanges: [], captures: [], stateUpdates: [] } };
  }
  
  const source = allUnits[unitId];
  let animationScript = [];
  let logicalResult = { hpChanges: [], buffChanges: [], captures: [], stateUpdates: [] };

  // --- Start of refined target handling ---

  // For 'defend', no target is needed.
  if (skillId === 'defend') {
    animationScript.push({ type: 'SHOW_VFX', targetIds: [unitId], vfxName: 'defend_aura', delay: 100 });
    animationScript.push({ type: 'SHOW_FLOATING_TEXT', targetIds: [unitId], text: '防御', color: '#87ceeb', delay: 200 });
    logicalResult.buffChanges.push({ targetId: unitId, buff: { id: 'defending', duration: 1 }});
    return { animationScript, logicalResult };
  }

  // For 'capture', the specific target must be alive. No retargeting.
  if (skillId === 'capture') {
    const target = allUnits[primaryTargetId];
    animationScript.push({ type: 'SHOW_VFX', targetIds: [unitId], vfxName: 'support_cast', delay: 100 });
    
    if (!target || target.derivedAttributes.currentHp <= 0) {
        animationScript.push({ type: 'SHOW_FLOATING_TEXT', targetIds: [unitId], text: '目标已阵亡', color: '#ffcc00', delay: 200 });
        return { animationScript, logicalResult };
    }
    
    if (target.isCapturable === false) {
        animationScript.push({ type: 'SHOW_FLOATING_TEXT', targetIds: [target.id], text: '不可捕捉', color: '#ffcc00', delay: 200 });
    } else {
        const { maxHp, currentHp } = target.derivedAttributes;
        const captureChance = 0.3 + 0.7 * (1 - currentHp / maxHp);
        const isSuccess = Math.random() < captureChance;

        if (isSuccess) {
            animationScript.push({ type: 'SHOW_FLOATING_TEXT', targetIds: [target.id], text: '捕捉成功!', color: '#90ee90', delay: 200 });
            logicalResult.captures.push({ ...target });
        } else {
            animationScript.push({ type: 'SHOW_FLOATING_TEXT', targetIds: [target.id], text: '捕捉失败!', color: '#ff7f7f', delay: 200 });
        }
    }
    return { animationScript, logicalResult };
  }

  // For all other skills (attacks included), find a valid target if the primary is dead.
  let currentTargetId = primaryTargetId;
  const originalTargetUnit = allUnits[currentTargetId];
  if (!originalTargetUnit || originalTargetUnit.derivedAttributes.currentHp <= 0) {
      const sourceTeam = source.team;
      let teamToSearch;

      // NEW: Check skill's targetType to determine which team to find a new target from.
      if (skill.targetType === 'enemy') {
          const opposingTeamName = sourceTeam === 'player' ? 'enemyTeam' : 'playerTeam';
          teamToSearch = context[opposingTeamName];
      } else { // 'self' or 'ally'
          const friendlyTeamName = sourceTeam === 'player' ? 'playerTeam' : 'enemyTeam';
          teamToSearch = context[friendlyTeamName];
      }

      const livingUnitsInTeam = Object.values(teamToSearch)
          .map(u => allUnits[u.id])
          .filter(u => u && u.derivedAttributes.currentHp > 0);
      
      if (livingUnitsInTeam.length > 0) {
          // Simple retarget to the first living unit in the correct team.
          currentTargetId = livingUnitsInTeam[0].id; 
      } else {
          // No living units in the target team, stop the action.
          return { 
              animationScript: [{ type: 'SHOW_FLOATING_TEXT', targetIds: [unitId], text: '无有效目标', color: '#ffcc00', delay: 100 }],
              logicalResult: { hpChanges: [], buffChanges: [], captures: [], stateUpdates: [] }
          };
      }
  }

  // Now, get all targets based on the (potentially new) primary target ID, and filter for living ones.
  const allFinalTargets = getSkillTargets(skill, unitId, currentTargetId, context);
  const livingTargetIds = allFinalTargets.filter(id => allUnits[id] && allUnits[id].derivedAttributes.currentHp > 0);

  // If after all that, there are no living targets for a damaging/effect skill, abort.
  if (livingTargetIds.length === 0) {
    return { 
        animationScript: [{ type: 'SHOW_FLOATING_TEXT', targetIds: [unitId], text: '无效目标', color: '#ffcc00', delay: 100 }],
        logicalResult: { hpChanges: [], buffChanges: [], captures: [], stateUpdates: [] }
    };
  }
  // --- End of refined target handling ---

  // --- NEW: Handle Double Strike Skill ---
  if (skillId === 'double_strike') {
    const targetId = livingTargetIds[0];
    const targetUnit = allUnits[targetId];

    if (targetUnit) {
      const baseOffsetX = source.team === 'player' ? -80 : 80;

      // --- First Hit ---
      const damage1Result = calculateDamage(source, skill.effects[0].value);
      logicalResult.hpChanges.push({ targetId, change: -damage1Result.damage, isCrit: damage1Result.isCrit });
      updatePrdCounterForResult(logicalResult, source, damage1Result.isCrit);
      
      animationScript.push({ type: 'MOVE_TO_TARGET', unitId, targetId, delay: 0 });
      animationScript.push({ type: 'SHOW_VFX', targetIds: [targetId], vfxName: 'hit_spark', delay: 100 });
      animationScript.push({ type: 'PAUSE', duration: 100, delay: 105 });
      animationScript.push({ type: 'ENTITY_ANIMATION', targetIds: [targetId], animationName: 'take_hit_knockback', delay: 200 });
      animationScript.push({ type: 'SHOW_FLOATING_TEXT', targetIds: [targetId], text: `${damage1Result.damage}`, isCrit: damage1Result.isCrit, delay: 250 });
      
      // NEW: Clear the first animation state to allow the second to play
      animationScript.push({ type: 'CLEAR_ENTITY_ANIMATION', targetIds: [targetId], delay: 700 }); // 200ms start + 500ms duration

      // --- Recoil for Second Strike (THE KEY CHANGE) ---
      animationScript.push({ type: 'MOVE_TO_TARGET', unitId, targetId, options: { offsetX: baseOffsetX * 0.6, offsetY: -15, duration: 150 }, delay: 400 });

      // --- Second Hit ---
      const damage2Result = calculateDamage(source, skill.effects[1].value);
      logicalResult.hpChanges.push({ targetId, change: -damage2Result.damage, isCrit: damage2Result.isCrit });
      updatePrdCounterForResult(logicalResult, source, damage2Result.isCrit);

      // Slower, more deliberate second attack
      animationScript.push({ type: 'MOVE_TO_TARGET', unitId, targetId, options: { offsetX: baseOffsetX, duration: 200 }, delay: 700 });
      animationScript.push({ type: 'SHOW_VFX', targetIds: [targetId], vfxName: 'hit_spark', delay: 900 });
      animationScript.push({ type: 'PAUSE', duration: 100, delay: 905 });
      animationScript.push({ type: 'ENTITY_ANIMATION', targetIds: [targetId], animationName: 'take_hit_knockback', delay: 1000 });
      animationScript.push({ type: 'SHOW_FLOATING_TEXT', targetIds: [targetId], text: `${damage2Result.damage}`, isCrit: damage2Result.isCrit, delay: 1050 });

      // --- Return Home ---
      animationScript.push({ type: 'RETURN_TO_POSITION', unitId, delay: 1400 });
    }
    
    return { animationScript, logicalResult };
  }
  // --- END: Handle Double Strike ---

  // --- NEW: Handle Bloodthirsty Pursuit ---
  if (skillId === 'bloodthirsty_pursuit') {
    const primaryTargetId = livingTargetIds[0];
    const primaryTargetUnit = allUnits[primaryTargetId];
    let attackDelay = 0;

    if (!primaryTargetUnit) {
      // Should have been handled already, but as a safeguard.
      return { 
        animationScript: [{ type: 'SHOW_FLOATING_TEXT', targetIds: [unitId], text: '无效目标', color: '#ffcc00', delay: 100 }],
        logicalResult 
      };
    }
    
    const createAttackSequence = (targetId, damageEffect, delay, isFollowUp = false) => {
      const targetUnit = allUnits[targetId];
      if (!targetUnit) return;

      const damageResult = calculateDamage(source, damageEffect.value);
      logicalResult.hpChanges.push({ targetId, change: -damageResult.damage, isCrit: damageResult.isCrit });
      updatePrdCounterForResult(logicalResult, source, damageResult.isCrit);
      
      const vfx = isFollowUp ? 'hit_spark_red' : 'hit_spark';

      animationScript.push({ type: 'MOVE_TO_TARGET', unitId, targetId, delay: delay });
      animationScript.push({ type: 'SHOW_VFX', targetIds: [targetId], vfxName: vfx, delay: delay + 100 });
      animationScript.push({ type: 'PAUSE', duration: 100, delay: delay + 105 });
      animationScript.push({ type: 'ENTITY_ANIMATION', targetIds: [targetId], animationName: 'take_hit_knockback', delay: delay + 200 });
      animationScript.push({ type: 'SHOW_FLOATING_TEXT', targetIds: [targetId], text: `${damageResult.damage}`, isCrit: damageResult.isCrit, delay: delay + 250 });
      animationScript.push({ type: 'CLEAR_ENTITY_ANIMATION', targetIds: [targetId], delay: delay + 700 });
    };

    // 1. Attack primary target
    createAttackSequence(primaryTargetId, skill.effects[0], attackDelay);
    attackDelay += 800; // Delay for the next attack

    // 2. Find and attack random secondary targets
    const enemyTeamName = source.team === 'player' ? 'enemyTeam' : 'playerTeam';
    const potentialTargets = Object.values(context[enemyTeamName])
      .map(u => allUnits[u.id])
      .filter(u => u && u.id !== primaryTargetId && u.derivedAttributes.currentHp > 0);
    
    // Shuffle and pick up to 2 targets
    const shuffledTargets = potentialTargets.sort(() => 0.5 - Math.random());
    const followUpTargets = shuffledTargets.slice(0, 2);

    // 3. Create attack sequences for follow-up targets
    followUpTargets.forEach((target, index) => {
      // skill.effects[1] for the first random, skill.effects[2] for the second
      const damageEffect = skill.effects[index + 1];
      createAttackSequence(target.id, damageEffect, attackDelay, true);
      attackDelay += 800; // Increment delay for the next one
    });
    
    // N. Return home after all attacks
    animationScript.push({ type: 'RETURN_TO_POSITION', unitId, delay: attackDelay });

    return { animationScript, logicalResult };
  }
  // --- END: Handle Bloodthirsty Pursuit ---

  // NEW: Handle Basic Attack with different animation types
  if (skillId === 'basic_attack') {
    const attackType = source.attackType || 'direct'; // Default to direct attack
    const targetId = livingTargetIds[0]; // Use the first living target
    const targetUnit = allUnits[targetId];

    if (targetUnit && attackType === 'direct') {
      let totalDamage = 0;
      const pAtk = source.derivedAttributes.physicalAttack || 0;
      totalDamage = Math.round(pAtk * (skill.damage || 1.0));

      // --- NEW PRD CRIT LOGIC ---
      const critChance = source.derivedAttributes.critChance || 0;
      const critDamage = source.derivedAttributes.critDamage || 1.5;
      const prdCounter = source.prdCritCounter || 1;
      const effectiveCritChance = critChance * prdCounter;
      const isCrit = Math.random() < effectiveCritChance;

      logicalResult.stateUpdates = [];
      if (isCrit) {
        totalDamage = Math.round(totalDamage * critDamage);
        logicalResult.stateUpdates.push({ unitId: source.id, changes: { prdCritCounter: 1 } }); // Reset counter
      } else {
        logicalResult.stateUpdates.push({ unitId: source.id, changes: { prdCritCounter: prdCounter + 1 } }); // Increment counter
      }
      // --- END PRD CRIT LOGIC ---

      const targetHasDefendBuff = targetUnit.statusEffects?.some(buff => buff.id === 'defending');
      if (targetHasDefendBuff) {
        totalDamage = Math.round(totalDamage * 0.85);
      }
      
      if (totalDamage > 0) {
        logicalResult.hpChanges.push({ targetId, change: -totalDamage, isCrit });
      }

      animationScript.push({ type: 'MOVE_TO_TARGET', unitId, targetId, delay: 0 });
      
      // Add VFX based on whether the target is defending
      const vfxName = targetHasDefendBuff ? 'defend_burst' : 'hit_spark';
      animationScript.push({ type: 'SHOW_VFX', targetIds: [targetId], vfxName, delay: 100 });

      // --- NEW: Add a "Hit Stop" or "Keyframe Pause" for impact ---
      animationScript.push({ type: 'PAUSE', duration: 100, delay: 105 });
      // --- END: Hit Stop ---

      animationScript.push({ type: 'ENTITY_ANIMATION', targetIds: [targetId], animationName: 'take_hit_knockback', delay: 200 });
      animationScript.push({ type: 'SHOW_FLOATING_TEXT', targetIds: [targetId], text: `${totalDamage}`, isCrit, delay: 250 });
      animationScript.push({ type: 'RETURN_TO_POSITION', unitId, delay: 600 });

      return { animationScript, logicalResult };
    }
    // Future: Add 'projectile' attackType handler here
  }

  // This block handles other (non-basic attack) skills
  if (livingTargetIds.length > 0) {
    // Base animation for the attacker
    animationScript.push({ type: 'ENTITY_ANIMATION', targetIds: [unitId], animationName: 'attack_lunge', delay: 0 });

    livingTargetIds.forEach((targetId, index) => {
      const targetUnit = allUnits[targetId];
      if (!targetUnit) return;

      let totalDamage = 0;
      skill.effects?.forEach(effect => {
        if (effect.type === 'DAMAGE') {
          const pAtk = source.derivedAttributes.physicalAttack || 0;
          let damage = Math.round(pAtk * (skill.damage || 1.0));

          // --- NEW PRD CRIT LOGIC ---
          const critChance = source.derivedAttributes.critChance || 0;
          const critDamage = source.derivedAttributes.critDamage || 1.5;
          const prdCounter = source.prdCritCounter || 1;
          const effectiveCritChance = critChance * prdCounter;
          const isCrit = Math.random() < effectiveCritChance;

          if (!logicalResult.stateUpdates) logicalResult.stateUpdates = [];
          if (isCrit) {
            damage = Math.round(damage * critDamage);
            // Only add the reset instruction once per unit per action
            if (!logicalResult.stateUpdates.some(u => u.unitId === source.id)) {
              logicalResult.stateUpdates.push({ unitId: source.id, changes: { prdCritCounter: 1 } });
            }
          } else {
            // Only add the increment instruction once per unit per action
            if (!logicalResult.stateUpdates.some(u => u.unitId === source.id)) {
              logicalResult.stateUpdates.push({ unitId: source.id, changes: { prdCritCounter: prdCounter + 1 } });
            }
          }
          // --- END PRD CRIT LOGIC ---

          const targetHasDefendBuff = targetUnit.statusEffects?.some(buff => buff.id === 'defending');
          if (targetHasDefendBuff) {
            damage = Math.round(damage * 0.85);
          }
          
          totalDamage += damage;
          
          if (damage > 0) {
            logicalResult.hpChanges.push({ targetId, change: -damage, isCrit });
          }
        }
      });
      
      const delay = 300 + (index * 150);
      animationScript.push({ type: 'ENTITY_ANIMATION', targetIds: [targetId], animationName: 'take_hit_shake', delay });
      animationScript.push({ type: 'SHOW_FLOATING_TEXT', targetIds: [targetId], text: `${totalDamage}`, isCrit: logicalResult.hpChanges.some(c => c.targetId === targetId && c.isCrit), delay: delay + 100 });
    });

    // Return-to-idle animation for the attacker
    animationScript.push({ type: 'ENTITY_ANIMATION', targetIds: [unitId], animationName: 'return_to_idle', delay: 600 + (livingTargetIds.length * 150) });
  }
  
  return { animationScript, logicalResult };
};

// Helper functions for PRD logic to keep skill execution cleaner
function calculateDamage(source, multiplier) {
  let damage = Math.round((source.derivedAttributes.physicalAttack || 0) * multiplier);
  const critChance = source.derivedAttributes.critChance || 0;
  const critDamage = source.derivedAttributes.critDamage || 1.5;
  const prdCounter = source.prdCritCounter || 1;
  const effectiveCritChance = critChance * prdCounter;
  const isCrit = Math.random() < effectiveCritChance;

  if (isCrit) {
    damage = Math.round(damage * critDamage);
  }
  return { damage, isCrit };
}

function updatePrdCounterForResult(logicalResult, source, isCrit) {
  const prdCounter = source.prdCritCounter || 1;
  if (!logicalResult.stateUpdates.some(u => u.unitId === source.id)) {
    if (isCrit) {
      logicalResult.stateUpdates.push({ unitId: source.id, changes: { prdCritCounter: 1 } });
    } else {
      logicalResult.stateUpdates.push({ unitId: source.id, changes: { prdCritCounter: prdCounter + 1 } });
    }
  }
} 