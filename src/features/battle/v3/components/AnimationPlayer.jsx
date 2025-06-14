import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Create the context
const AnimationContext = createContext(null);

// 2. Create a provider component
export const AnimationProvider = ({ children }) => {
  const [animationState, setAnimationState] = useState({
    unitCssClasses: {}, // e.g., { 'player-1': 'attack-lunge', 'enemy-1': 'take-hit-shake' }
    floatingTexts: {},
    vfx: {},
  });

  const value = { animationState, setAnimationState };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

// 3. Create a hook for easy consumption
export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};

// 4. The AnimationPlayer component
export const AnimationPlayer = ({ script, onComplete }) => {
  const { setAnimationState } = useAnimation();

  useEffect(() => {
    if (!script || script.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    console.log('[AnimationPlayer] Received script:', script);

    const timeouts = [];
    let maxDelay = 0;

    // Reset animation state at the beginning of a new script
    setAnimationState({ unitCssClasses: {}, floatingTexts: {}, vfx: {} });
    
    script.forEach(step => {
      const timeoutId = setTimeout(() => {
        console.log(`[AnimationPlayer] Executing step at ${step.delay}ms:`, step);
        setAnimationState(currentState => {
          const newState = { ...currentState };
          
          if (step.type === 'ENTITY_ANIMATION') {
            const newClasses = { ...newState.unitCssClasses };
            step.targetIds.forEach(id => {
              newClasses[id] = step.animationName;
            });
            newState.unitCssClasses = newClasses;
          }
          
          if (step.type === 'SHOW_FLOATING_TEXT') {
            const newTexts = { ...newState.floatingTexts };
            step.targetIds.forEach(id => {
              newTexts[id] = [...(newTexts[id] || []), { text: step.text, color: step.color }];
            });
            newState.floatingTexts = newTexts;
          }

          // You would add VFX handling here as well
          // if (step.type === 'SHOW_VFX') { ... }

          return newState;
        });
      }, step.delay);

      timeouts.push(timeoutId);

      if (step.delay > maxDelay) {
        maxDelay = step.delay;
      }
    });

    // A final timeout to signal completion
    const completionTimeout = setTimeout(() => {
      console.log('[AnimationPlayer] Script finished.');
      setAnimationState({ unitCssClasses: {}, floatingTexts: {}, vfx: {} }); // Clear animations
      if (onComplete) {
        onComplete();
      }
    }, maxDelay + 1000); // Add a buffer (e.g., 1s) for animations to visually finish

    timeouts.push(completionTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [script, onComplete, setAnimationState]);

  return null; // This component does not render anything itself
}; 