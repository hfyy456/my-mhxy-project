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

  // --- NEW: Handle Bloodthirsty Pursuit (Chain Attack Version) ---
  if (skillId === 'bloodthirsty_pursuit') {
    let runningAnimationTime = 0;
    
    // The primary target is the first one available.
    const primaryTargetId = livingTargetIds[0];
    if (!primaryTargetId) {
      return { 
        animationScript: [{ type: 'SHOW_FLOATING_TEXT', targetIds: [unitId], text: '无效目标', color: '#ffcc00', delay: 100 }],
        logicalResult 
      };
    }

    // Find up to two additional random targets.
    const enemyTeamName = source.team === 'player' ? 'enemyTeam' : 'playerTeam';
    const potentialFollowUp = Object.values(context[enemyTeamName])
      .map(u => allUnits[u.id])
      .filter(u => u && u.id !== primaryTargetId && u.derivedAttributes.currentHp > 0);
    
    const shuffledFollowUp = potentialFollowUp.sort(() => 0.5 - Math.random());
    const attackQueue = [primaryTargetId, ...shuffledFollowUp.slice(0, 2).map(t => t.id)];

    // Generate animation and logic for each attack in the queue.
    attackQueue.forEach((targetId, index) => {
      const damageEffect = skill.effects[index];
      if (!damageEffect) return;

      const targetUnit = allUnits[targetId];
      if (!targetUnit) return;
      
      const damageResult = calculateDamage(source, damageEffect.value);
      logicalResult.hpChanges.push({ targetId, change: -damageResult.damage, isCrit: damageResult.isCrit });
      updatePrdCounterForResult(logicalResult, source, damageResult.isCrit);

      const isPrimary = index === 0;
      const vfx = 'bleed_effect';
      const moveDuration = isPrimary ? 300 : 200; // Faster subsequent dashes
      const hitDelay = runningAnimationTime + moveDuration;
      const sequenceDuration = moveDuration + 250; // Total time for one hit sequence before next starts

      // For subsequent moves, we need to know the previous target to calculate the correct vector
      const previousTargetId = index > 0 ? attackQueue[index - 1] : null;

      // Generate the animation sequence for a single hit
      animationScript.push({ type: 'MOVE_TO_TARGET', unitId, targetId, previousTargetId, options: { duration: moveDuration }, delay: runningAnimationTime });
      animationScript.push({ type: 'SHOW_VFX', targetIds: [targetId], vfxName: vfx, delay: hitDelay });
      animationScript.push({ type: 'PAUSE', duration: 100, delay: hitDelay + 5 });
      animationScript.push({ type: 'ENTITY_ANIMATION', targetIds: [targetId], animationName: 'take_hit_knockback', delay: hitDelay + 50 });
      animationScript.push({ type: 'SHOW_FLOATING_TEXT', targetIds: [targetId], text: `${damageResult.damage}`, isCrit: damageResult.isCrit, delay: hitDelay + 100 });
      
      // DO NOT return to position here. The next MOVE_TO_TARGET will override the transform.
      runningAnimationTime += sequenceDuration;
    });
    
    // After all attacks, add a final return to home base.
    animationScript.push({ type: 'RETURN_TO_POSITION', unitId, delay: runningAnimationTime + 200 });

    return { animationScript, logicalResult };
  }
  // --- END: Handle Bloodthirsty Pursuit ---

  // --- NEW: Handle Healing Skill ---
  if (skill.type === 'HEAL') {
    // Healing skills target living allies. `primaryTargetId` is correctly passed in the action.
    const targetId = primaryTargetId; 
    const targetUnit = allUnits[targetId];

    if (targetUnit) {
      const healEffect = skill.effects.find(e => e.type === 'HEAL');
      if (healEffect) {
        const mAtk = source.derivedAttributes.magicAttack || 0;
        // Simple formula parsing for now, assumes "X * mAtk"
        const multiplier = parseFloat(healEffect.value.split('*')[0]);
        const healAmount = Math.round(mAtk * multiplier);
        
        const finalHeal = Math.min(healAmount, targetUnit.derivedAttributes.maxHp - targetUnit.derivedAttributes.currentHp);

        // Always show the casting animation to indicate the skill was used.
        animationScript.push({ type: 'SHOW_VFX', targetIds: [unitId], vfxName: 'support_cast', delay: 0 });
        
        if (finalHeal > 0) {
          // If actual healing occurs, add to logical result and show healing VFX.
          logicalResult.hpChanges.push({ targetId, change: finalHeal });
          animationScript.push({ type: 'SHOW_VFX', targetIds: [targetId], vfxName: 'heal_aura', delay: 200 });
          animationScript.push({ type: 'SHOW_FLOATING_TEXT', targetIds: [targetId], text: `${finalHeal}`, isHeal: true, delay: 300 });
        } else {
          // If target is at full health, show an informational message instead.
          animationScript.push({ type: 'SHOW_FLOATING_TEXT', targetIds: [targetId], text: '生命已满', isHeal: false, delay: 200 });
        }
      }
    }
    return { animationScript, logicalResult };
  }
  // --- END: Handle Healing Skill ---

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