import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// 1. Create the context
const AnimationContext = createContext(null);

// 2. Create a provider component
export const AnimationProvider = ({ children }) => {
  const [animationState, setAnimationState] = useState({
    floatingTexts: {},
    unitCssClasses: {},
    vfx: [],
    unitPositions: {},
  });
  const unitRefs = useRef({});

  const value = { animationState, setAnimationState, unitRefs };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

// 3. Create a hook for easy consumption
export const useAnimation = () => useContext(AnimationContext);

// 4. The AnimationPlayer component
export const AnimationPlayer = ({ script, onComplete }) => {
  const { animationState, setAnimationState, unitRefs } = useAnimation();
  const vfxCleanupRaf = useRef({});

  // NEW: Helper function to get VFX duration
  const getVfxDuration = (vfxName) => {
    const durations = {
      'heal_aura': 1000, // e.g., Heal aura lasts for 1 second
      'hit_spark': 400,
      'defend_aura': 1500,
      'bleed_effect': 600,
      'defend_burst': 500,
      'support_cast': 800,
      'fire_storm_aoe': 1200, // New: Duration for the fire storm effect
      // Add other VFX durations here
    };
    return durations[vfxName] || 400; // Default duration
  };

  useEffect(() => {
    const timers = [];

    // Reset state at the beginning of a new script
    setAnimationState(prevState => ({ ...prevState, floatingTexts: {}, unitCssClasses: {}, vfx: [], unitPositions: {} }));
    
    script.forEach(step => {
      const timer = setTimeout(() => {
        // --- NEW: Handle the PAUSE type ---
        // A pause step doesn't update state, it just creates a delay.
        // We can just return early for this type.
        if (step.type === 'PAUSE') {
          return;
        }
        // --- END: Handle PAUSE ---

        setAnimationState(prevState => {
          const newState = { ...prevState };
          let newUnitCssClasses = { ...newState.unitCssClasses };

          if (step.type === 'MOVE_TO_TARGET') {
              const sourceNode = unitRefs.current[step.unitId];
              const targetNode = unitRefs.current[step.targetId];
            const moveSourceNode = step.previousTargetId ? unitRefs.current[step.previousTargetId] : sourceNode;

            if (sourceNode && targetNode && moveSourceNode) {
              const sourceRect = moveSourceNode.getBoundingClientRect();
                const targetRect = targetNode.getBoundingClientRect();
                
              const prevPosition = prevState.unitPositions[step.unitId] || { x: 0, y: 0 };
              let newX = prevPosition.x;
              let newY = prevPosition.y;

              if (step.previousTargetId) {
                // It's a chained move (e.g., from A to B).
                // The delta is from the previous target to the new target.
                const moveDeltaX = targetRect.left - sourceRect.left;
                const moveDeltaY = targetRect.top - sourceRect.top;
                newX += moveDeltaX;
                newY += moveDeltaY;
              } else {
                // It's the first move (e.g., from Home to A).
                const targetWidth = targetRect.width;
                const baseOffsetX = sourceRect.left < targetRect.left 
                  ? - (targetWidth / 2 + 40)
                  : (targetWidth / 2 + 40);
                const offsetX = step.options?.offsetX ?? baseOffsetX;
                const offsetY = step.options?.offsetY ?? 0;
                
                const moveDeltaX = targetRect.left - sourceRect.left + offsetX;
                const moveDeltaY = targetRect.top - sourceRect.top + offsetY;
                newX = moveDeltaX; // Not accumulating, this is the first transform
                newY = moveDeltaY;
              }

                const newUnitPositions = { ...newState.unitPositions };
              newUnitPositions[step.unitId] = { 
                x: newX, 
                y: newY,
                transitionDuration: step.options?.duration || 400
              };
                newState.unitPositions = newUnitPositions;
              
              newUnitCssClasses[step.unitId] = (newUnitCssClasses[step.unitId] || '') + ' is-acting';
            }
          }

          if (step.type === 'RETURN_TO_POSITION') {
            const newUnitPositions = { ...newState.unitPositions };
            delete newUnitPositions[step.unitId];
            newState.unitPositions = newUnitPositions;
            
            // Revert z-index when returning
            if (newUnitCssClasses[step.unitId]) {
              newUnitCssClasses[step.unitId] = newUnitCssClasses[step.unitId].replace(' is-acting', '').trim();
              if (newUnitCssClasses[step.unitId] === '') {
                delete newUnitCssClasses[step.unitId];
              }
            }
          }

          if (step.type === 'SHOW_FLOATING_TEXT') {
            const newFloatingTexts = { ...newState.floatingTexts };
            step.targetIds.forEach(targetId => {
              if (!newFloatingTexts[targetId]) newFloatingTexts[targetId] = [];
              newFloatingTexts[targetId].push({
                text: step.text,
                color: step.color,
                isCrit: step.isCrit,
                isHeal: step.isHeal,
                id: `${targetId}-${Date.now()}-${Math.random()}`
              });
            });
            newState.floatingTexts = newFloatingTexts;
          }
          
          if (step.type === 'ENTITY_ANIMATION') {
            step.targetIds.forEach(targetId => {
              // Append animation class, don't overwrite the acting class
              const existingClasses = newUnitCssClasses[targetId] || '';
              const newClasses = existingClasses.includes(step.animationName) 
                ? existingClasses 
                : `${existingClasses} ${step.animationName}`.trim();
              newUnitCssClasses[targetId] = newClasses;
            });
          }
          
          if (step.type === 'CLEAR_ENTITY_ANIMATION') {
            step.targetIds.forEach(targetId => {
              if (newUnitCssClasses[targetId]) {
                newUnitCssClasses[targetId] = newUnitCssClasses[targetId]
                  .replace('take_hit_knockback', '')
                  .replace('take_hit_shake','')
                  .trim();
                if (newUnitCssClasses[targetId] === 'is-acting') {
                  // Don't remove the class if it's just the acting class
                } else if (newUnitCssClasses[targetId] === '') {
                  delete newUnitCssClasses[targetId];
                }
              }
            });
          }
          
          if (step.type === 'SHOW_VFX') {
            const vfxToAdd = [];
            step.targetIds.forEach(targetId => {
              const vfxId = `${targetId}-${step.vfxName}-${Date.now()}-${Math.random()}`;
              vfxToAdd.push({ vfxName: step.vfxName, targetId: targetId, id: vfxId });

              const duration = getVfxDuration(step.vfxName);
              let startTime = null;

              const cleanupAnimation = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;

                if (elapsed < duration) {
                  vfxCleanupRaf.current[vfxId] = requestAnimationFrame(cleanupAnimation);
                } else {
                  setAnimationState(p => ({
                    ...p,
                    vfx: p.vfx ? p.vfx.filter(v => v.id !== vfxId) : [],
                  }));
                  delete vfxCleanupRaf.current[vfxId];
                }
              };
              vfxCleanupRaf.current[vfxId] = requestAnimationFrame(cleanupAnimation);
            });
            
            newState.vfx = [...(prevState.vfx || []), ...vfxToAdd];
          }

          newState.unitCssClasses = newUnitCssClasses;
          return newState;
        });
      }, step.delay);
      timers.push(timer);
    });

    const totalDuration = Math.max(0, ...script.map(s => (s.delay || 0) + (s.duration || 0))) + 1000; // Add buffer for animation to finish
    const completionTimer = setTimeout(onComplete, totalDuration);
    timers.push(completionTimer);

    return () => {
      timers.forEach(clearTimeout);
      Object.values(vfxCleanupRaf.current).forEach(cancelAnimationFrame);
      vfxCleanupRaf.current = {};
    };
  }, [script, onComplete, setAnimationState, unitRefs]);

  return null; // This component does not render anything itself
}; 