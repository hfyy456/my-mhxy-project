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

          if (step.type === 'MOVE_TO_TARGET') {
            if (unitRefs?.current) {
              const sourceNode = unitRefs.current[step.unitId];
              const targetNode = unitRefs.current[step.targetId];
              if (sourceNode && targetNode) {
                const sourceRect = sourceNode.getBoundingClientRect();
                const targetRect = targetNode.getBoundingClientRect();
                
                const baseOffsetX = sourceRect.left < targetRect.left ? -80 : 80;
                const offsetX = step.options?.offsetX ?? baseOffsetX;
                const offsetY = step.options?.offsetY ?? 0;

                const deltaX = targetRect.left - sourceRect.left + offsetX;
                const deltaY = targetRect.top - sourceRect.top;

                const newUnitPositions = { ...newState.unitPositions };
                newUnitPositions[step.unitId] = { 
                  x: deltaX, 
                  y: deltaY,
                  transitionDuration: step.options?.duration || 400
                };
                newState.unitPositions = newUnitPositions;
              }
            }
          }

          if (step.type === 'RETURN_TO_POSITION') {
            const newUnitPositions = { ...newState.unitPositions };
            delete newUnitPositions[step.unitId];
            newState.unitPositions = newUnitPositions;
          }

          if (step.type === 'SHOW_FLOATING_TEXT') {
            const newFloatingTexts = { ...newState.floatingTexts };
            step.targetIds.forEach(targetId => {
              if (!newFloatingTexts[targetId]) newFloatingTexts[targetId] = [];
              newFloatingTexts[targetId].push({ text: step.text, color: step.color });
            });
            newState.floatingTexts = newFloatingTexts;
          }
          
          if (step.type === 'ENTITY_ANIMATION') {
            const newUnitCssClasses = { ...newState.unitCssClasses };
            step.targetIds.forEach(targetId => {
              newUnitCssClasses[targetId] = step.animationName;
            });
            newState.unitCssClasses = newUnitCssClasses;
          }
          
          if (step.type === 'CLEAR_ENTITY_ANIMATION') {
            const newUnitCssClasses = { ...newState.unitCssClasses };
            step.targetIds.forEach(targetId => {
              delete newUnitCssClasses[targetId];
            });
            newState.unitCssClasses = newUnitCssClasses;
          }
          
          if (step.type === 'SHOW_VFX') {
            const vfxId = Date.now() + Math.random();
            // Fallback for missing VFX
            const vfxName = step.vfxName === 'hit_spark_red' ? 'hit_spark' : step.vfxName;
            const newVfx = { vfxName: vfxName, targetId: step.targetIds[0], id: vfxId };
            
            newState.vfx = [...(prevState.vfx || []), newVfx];

            const duration = 400; // ms, should match CSS animation
            let startTime = null;

            const cleanupAnimation = (timestamp) => {
              if (!startTime) startTime = timestamp;
              const elapsed = timestamp - startTime;

              if (elapsed < duration) {
                vfxCleanupRaf.current[vfxId] = requestAnimationFrame(cleanupAnimation);
              } else {
                setAnimationState(p => ({
                  ...p,
                  vfx: p.vfx.filter(v => v.id !== vfxId),
                }));
                delete vfxCleanupRaf.current[vfxId];
              }
            };
            vfxCleanupRaf.current[vfxId] = requestAnimationFrame(cleanupAnimation);
          }

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