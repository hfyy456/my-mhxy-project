import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 1. Create the context
const AnimationContext = createContext(null);

// 2. Create a provider component
export const AnimationProvider = ({ children }) => {
  const [animationState, setAnimationState] = useState({
    floatingTexts: {},
    unitCssClasses: {},
    vfx: [],
  });

  const value = { animationState, setAnimationState };

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
  const { setAnimationState } = useAnimation();

  useEffect(() => {
    const timers = [];

    // Reset state at the beginning of a new script
    setAnimationState({ floatingTexts: {}, unitCssClasses: {}, vfx: [] });
    
    script.forEach(step => {
      const timer = setTimeout(() => {
        setAnimationState(prevState => {
          const newState = { ...prevState };

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
          
          if (step.type === 'SHOW_VFX') {
            // This part might need more info, like which unit to attach the VFX to.
            // Assuming targetIds contains one unit for VFX for now.
            const newVfx = [...newState.vfx, { vfxName: step.vfxName, targetId: step.targetIds[0] }];
            newState.vfx = newVfx;
          }

          return newState;
        });
      }, step.delay);
      timers.push(timer);
    });

    const totalDuration = Math.max(...script.map(s => s.delay)) + 1000; // Add buffer for animation to finish
    const completionTimer = setTimeout(onComplete, totalDuration);
    timers.push(completionTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [script, onComplete, setAnimationState]);

  return null; // This component does not render anything itself
}; 