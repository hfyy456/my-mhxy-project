import React, { memo, forwardRef } from 'react';
import { useAnimation } from './AnimationPlayer';

const images = import.meta.glob('/src/assets/summons/*.png', { eager: true });

export const unitDisplayStyles = {
  unitBox: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    pointerEvents: 'none',
  },
  spriteContainer: {
    position: 'relative',
    width: '150px',
    height: '150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pedestal: {
    position: 'absolute',
    bottom: '5px',
    width: '100px',
    height: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: '50%',
    filter: 'blur(5px)',
    zIndex: -1,
  },
  unitSprite: {
    width: '150px',
    height: '150px',
    objectFit: 'contain',
    filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))',
  },
  unitBoxAttacking: {
    transform: 'scale(1.08)',
  },
  'attack_lunge': {
    animation: 'lunge 0.5s ease-in-out',
  },
  'take_hit_knockback': {
    animation: 'knockback-anim 0.5s ease-out forwards',
  },
  'return_to_idle': {
    animation: 'returnLunge 0.3s ease-in-out',
  },
  'is-acting': {
    zIndex: 10,
  },
  unitBoxHitting: {
    animation: 'shake 0.3s',
  },
  nameplate: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '120px',
    marginTop: '5px',
  },
  unitName: {
    color: '#f1f1f1',
    fontWeight: 'bold',
    fontSize: '16px',
    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
    marginBottom: '4px',
  },
  hpBarContainer: {
    backgroundColor: '#333',
    borderRadius: '5px',
    height: '12px',
    width: '90%',
    marginTop: '10px',
    border: '1px solid rgba(0,0,0,0.2)',
  },
  hpBar: {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 0.5s ease-in-out, background-color 0.5s ease-in-out',
  },
  damageNumberBase: {
    position: 'absolute',
    top: '-30px',
    left: '50%',
    fontFamily: "Impact, 'Arial Black', sans-serif",
    fontSize: '32px',
    fontWeight: '900',
    animation: 'floatUpAndScale 1.2s ease-out forwards',
    textShadow: 
      '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, ' + // White outline
      '2px 2px 4px rgba(0,0,0,0.5)', // Softer Black shadow
    zIndex: 30,
    transform: 'translateX(-50%)',
  },
  nonCritDamage: {
    color: '#ffc700', // Brighter, more saturated yellow
  },
  critDamage: {
    color: '#ef4a5a', // Red core
  },
  healText: {
    color: '#28a745', // Green for healing
  },
  actionSetIndicator: {
    position: 'absolute',
    top: '0px',
    right: '0px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'rgba(30, 200, 30, 0.9)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    boxShadow: '0 0 8px rgba(30, 200, 30, 0.7)',
    zIndex: 5,
  },
  statusEffectContainer: {
    position: 'absolute',
    top: '0px',
    left: '0px',
    display: 'flex',
    gap: '4px',
    zIndex: 5,
  },
  statusEffectIcon: {
    width: '24px',
    height: '24px',
    backgroundColor: 'rgba(0, 123, 255, 0.8)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    boxShadow: '0 0 6px rgba(0, 123, 255, 0.6)',
  },
  vfxHitSpark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '150px',
    height: '150px',
    background: 'radial-gradient(circle, white, rgba(200, 200, 200, 0.6) 40%, transparent 80%)',
    borderRadius: '50%',
    animation: 'vfx-impact-anim 0.3s ease-out forwards',
    zIndex: 20,
    transform: 'translate(-50%, -50%)',
  },
  vfxDefendBurst: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '120px',
    height: '120px',
    border: '3px solid #87ceeb',
    borderRadius: '50%',
    boxShadow: '0 0 20px #87ceeb, inset 0 0 15px #87ceeb',
    animation: 'defend-burst-anim 0.4s ease-out forwards',
    zIndex: 15,
    transform: 'translate(-50%, -50%)',
  },
  vfxBleed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '120px',
    height: '15px',
    background: 'rgba(220, 20, 60, 0.7)',
    boxShadow: '0 0 15px 5px rgba(255, 0, 0, 0.5)',
    borderRadius: '50%',
    animation: 'bleed-anim 0.5s ease-out forwards',
    zIndex: 20,
    transform: 'translate(-50%, -50%) rotate(-20deg)',
  },
  vfxHealAura: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    boxShadow: '0 0 25px 10px rgba(76, 175, 80, 0.7)',
    animation: 'heal-aura-anim 1s ease-out forwards',
    zIndex: 5,
    transform: 'translate(-50%, -50%)',
  },
  vfxFireAuraStart: {
    position: 'absolute',
    bottom: '5px',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'radial-gradient(ellipse at center, rgba(255,100,0,0.5) 0%, rgba(255,40,0,0) 70%)',
    animation: 'fire-aura-pulse-anim 0.8s ease-out forwards',
    zIndex: 0,
  },
  vfxFireSlashImpactContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '180px',
    height: '180px',
    transform: 'translate(-50%, -50%)',
    animation: 'fire-slash-fade-in 0.4s ease-out forwards',
    zIndex: 25,
  },
  fireSlashLine: {
    position: 'absolute',
    top: '50%',
    left: '10%',
    width: '80%',
    height: '12px',
    background: 'linear-gradient(90deg, transparent, #ffdd00, #ff8800, #ff4400, #ff8800, #ffdd00, transparent)',
    boxShadow: '0 0 10px 2px #ff8c00',
    borderRadius: '6px',
    transformOrigin: 'center',
  },
};

const getSpriteSrc = (summonSourceId) => {
  const path = `/src/assets/summons/${summonSourceId}.png`;
  return images[path]?.default || images['/src/assets/summons/default.png']?.default;
};

export const UnitDisplay = memo(forwardRef(({ unit, isPlayerUnit, hasActionSet, initialPosition }, ref) => {
  if (!unit) return null;
  
  const hpPercentage = (unit.derivedAttributes.currentHp / unit.derivedAttributes.maxHp) * 100;
  const { animationState } = useAnimation();
  const { floatingTexts, unitCssClasses, unitPositions, vfx } = animationState;
  
  const getHpColor = (percentage) => {
    if (percentage > 50) return 'linear-gradient(to right, #4caf50, #81c784)';
    if (percentage > 20) return 'linear-gradient(to right, #ff9800, #ffb74d)';
    return 'linear-gradient(to right, #f44336, #e57373)';
  };
  
  const isDefeated = unit.derivedAttributes.currentHp <= 0;
  const currentAnimClass = unitCssClasses[unit.id];
  const customPosition = unitPositions && unitPositions[unit.id];
  const activeVfx = vfx?.find(v => v.targetId === unit.id);

  const isDefending = unit.statusEffects?.some(effect => effect.id === 'defending');

  const unitStyleClasses = ['unit-box'];
  if (isDefeated) unitStyleClasses.push('defeated');
  if (currentAnimClass) unitStyleClasses.push(...currentAnimClass.split(' '));

  const unitStyle = {
    opacity: isDefeated ? 0.5 : 1,
    filter: isDefeated ? 'grayscale(100%)' : 'none',
    zIndex: 1,
    ...initialPosition,
    '--knockback-direction': isPlayerUnit ? '20px' : '-20px',
    '--cast-direction': isPlayerUnit ? '15px' : '-15px',
  };

  if (initialPosition) {
    unitStyle.position = 'absolute';
    unitStyle.top = `${initialPosition.top}px`;
    unitStyle.left = `${initialPosition.left}px`;
    
    unitStyle.width = '150px';
    unitStyle.height = '150px';
    
    unitStyle.pointerEvents = 'none';
  }
  
  if (currentAnimClass && currentAnimClass.includes('take_hit_knockback')) {
    unitStyle['--knockback-direction'] = isPlayerUnit ? '-40px' : '40px';
  }

  const animationTransform = customPosition 
    ? `translate(${customPosition.x}px, ${customPosition.y}px)` 
    : '';

  unitStyle.transform = animationTransform;

  if (customPosition) {
    unitStyle.transition = `transform ${customPosition.transitionDuration || 400}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  }

  const spriteStyle = {
    ...unitDisplayStyles.unitSprite,
    transform: isPlayerUnit ? 'scaleX(-1)' : 'none',
  };

  const nameplateStyle = {
    ...unitDisplayStyles.nameplate,
    position: 'absolute',
    bottom: '-45px',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: 0,
  };

  return (
    <div style={unitStyle} className={unitStyleClasses.join(' ')} ref={ref}>
      {activeVfx && activeVfx.vfxName === 'hit_spark' && 
        <div style={unitDisplayStyles.vfxHitSpark}></div>
      }
      {activeVfx && activeVfx.vfxName === 'defend_burst' && 
        <div style={unitDisplayStyles.vfxDefendBurst}></div>
      }
      {activeVfx && activeVfx.vfxName === 'bleed_effect' &&
        <div style={unitDisplayStyles.vfxBleed}></div>
      }
      {activeVfx && activeVfx.vfxName === 'heal_aura' &&
        <div style={unitDisplayStyles.vfxHealAura}></div>
      }
      {activeVfx && activeVfx.vfxName === 'fire_aura_start' &&
        <div style={unitDisplayStyles.vfxFireAuraStart}></div>
      }
      {activeVfx && activeVfx.vfxName === 'fire_slash_impact' &&
        <div style={unitDisplayStyles.vfxFireSlashImpactContainer}>
          <div style={{...unitDisplayStyles.fireSlashLine, transform: 'translateY(-50%) rotate(45deg)'}}></div>
          <div style={{...unitDisplayStyles.fireSlashLine, transform: 'translateY(-50%) rotate(-45deg)'}}></div>
        </div>
      }

      {hasActionSet && <div style={unitDisplayStyles.actionSetIndicator}>✔</div>}
      
      <div style={unitDisplayStyles.statusEffectContainer}>
        {isDefending && (
          <div style={unitDisplayStyles.statusEffectIcon} title="防御中">🛡️</div>
        )}
      </div>

      <div style={unitDisplayStyles.spriteContainer} className={unitStyleClasses.join(' ')}>
        <div style={unitDisplayStyles.pedestal} />
        <img style={spriteStyle} src={getSpriteSrc(unit.sourceId)} alt={unit.name} />

        {/* Floating Damage/Heal Numbers */}
        {floatingTexts?.[unit.id] && floatingTexts[unit.id].map((ft) => {
          let numberStyle = { ...unitDisplayStyles.damageNumberBase };
          let displayText = ft.text;

          if (ft.isHeal) {
            Object.assign(numberStyle, unitDisplayStyles.healText);
            displayText = `+${ft.text}`;
          } else if (ft.isCrit) {
            Object.assign(numberStyle, unitDisplayStyles.critDamage);
            numberStyle.animationName = 'floatUpAndScaleCrit';
          } else {
            // For non-crit damage or other info text, use provided color
            if (ft.color) {
              numberStyle.color = ft.color;
            } else {
              // Fallback to default damage color if no color is provided
              Object.assign(numberStyle, unitDisplayStyles.nonCritDamage);
            }
          }
          
          // Stagger multiple numbers slightly
          numberStyle.animationDelay = `${(ft.id?.slice(-4) % 10) * 0.05}s`;

          return (
            <div key={ft.id} style={numberStyle}>
              {displayText}
            </div>
          );
        })}
        
        {isDefending && (
          <div style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 123, 255, 0.8)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 0 6px rgba(0, 123, 255, 0.6)',
            zIndex: 5,
          }} title="防御中">🛡️</div>
        )}
      </div>

      {!isDefeated && (
        <div style={nameplateStyle}>
          <div style={unitDisplayStyles.unitName}>{unit.name}</div>
        <div style={unitDisplayStyles.hpBarContainer}>
            <div style={{ ...unitDisplayStyles.hpBar, width: `${hpPercentage}%`, background: getHpColor(hpPercentage) }} />
          </div>
        </div>
      )}
    </div>
  );
}));

const styleSheet = document.getElementById('dynamic-keyframes') || document.createElement('style');
styleSheet.id = 'dynamic-keyframes';
styleSheet.innerText = `
  @keyframes vfx-impact-anim {
    0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
    80% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.5; }
    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
  }
  @keyframes defend-burst-anim {
    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; border-width: 5px; }
    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; border-width: 0px; }
  }
  @keyframes floatUpAndScale {
    0% { opacity: 1; transform: translate(-50%, 0) scale(0.8); }
    20% { opacity: 1; transform: translate(-50%, -40px) scale(1.3); }
    100% { opacity: 0; transform: translate(-50%, -130px) scale(0.9); }
  }
  @keyframes floatUpAndScaleCrit {
    0% { opacity: 1; transform: translate(-50%, 0) scale(1.2); }
    20% { opacity: 1; transform: translate(-50%, -60px) scale(1.8); }
    100% { opacity: 0; transform: translate(-50%, -160px) scale(1.2); }
  }
  @keyframes knockback-anim {
    0% { transform: translateX(0); }
    30% { transform: translateX(var(--knockback-direction)); }
    100% { transform: translateX(0); }
  }
  @keyframes heal-aura-anim {
    0% { opacity: 0; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.2); }
  }
  @keyframes fire-aura-pulse-anim {
    0% { opacity: 0.8; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.1); }
    100% { opacity: 0; transform: scale(1.5); }
  }
  @keyframes fire-slash-fade-in {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
`;
if (!document.getElementById('dynamic-keyframes')) {
  document.head.appendChild(styleSheet);
}