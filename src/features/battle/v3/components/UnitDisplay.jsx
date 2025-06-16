import React, { memo } from 'react';
import { useAnimation } from './AnimationPlayer';

const images = import.meta.glob('/src/assets/summons/*.png', { eager: true });

export const unitDisplayStyles = {
  unitBox: {
    padding: '10px',
    backgroundColor: 'transparent',
    transition: 'all 0.3s ease-in-out',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
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
  unitBoxHitting: {
    animation: 'shake 0.3s',
  },
  hpBarContainer: {
    backgroundColor: '#e0e0e0',
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
  floatingDamage: {
    position: 'absolute',
    top: '-20px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#dc3545',
    animation: 'floatUp 1s ease-out forwards',
    textShadow: '1px 1px #fff, -1px -1px #fff, 1px -1px #fff, -1px 1px #fff',
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
};

const getSpriteSrc = (summonSourceId) => {
  const path = `/src/assets/summons/${summonSourceId}.png`;
  return images[path]?.default || images['/src/assets/summons/default.png']?.default;
};

export const UnitDisplay = memo(({ unit, isPlayerUnit, hasActionSet }) => {
  if (!unit) return null;
  
  const hpPercentage = (unit.derivedAttributes.currentHp / unit.derivedAttributes.maxHp) * 100;
  const { animationState } = useAnimation();
  const { floatingTexts, unitCssClasses } = animationState;
  
  const getHpColor = (percentage) => {
    if (percentage > 50) return '#4caf50';
    if (percentage > 20) return '#ff9800';
    return '#f44336';
  };
  
  const isDefeated = unit.derivedAttributes.currentHp <= 0;
  const currentAnimClass = unitCssClasses[unit.id];

  const isDefending = unit.statusEffects?.some(effect => effect.id === 'defending');

  const unitStyle = {
    ...unitDisplayStyles.unitBox,
    ...(currentAnimClass ? unitDisplayStyles[currentAnimClass] : {}),
    opacity: isDefeated ? 0.5 : 1,
  };

  const spriteStyle = {
    ...unitDisplayStyles.unitSprite,
    transform: isPlayerUnit ? 'scaleX(-1)' : 'none',
  };

  return (
    <div style={unitStyle}>
      {hasActionSet && <div style={unitDisplayStyles.actionSetIndicator}>✔</div>}
      
      <div style={unitDisplayStyles.statusEffectContainer}>
        {isDefending && (
          <div style={unitDisplayStyles.statusEffectIcon} title="防御中">🛡️</div>
        )}
      </div>

      {floatingTexts[unit.id]?.map((ft, index) => (
        <div key={index} style={{...unitDisplayStyles.floatingDamage, color: ft.color}}>{ft.text}</div>
      ))}
      <img 
        src={getSpriteSrc(unit.summonSourceId)}
        alt={unit.name}
        style={spriteStyle}
      />
      {!isDefeated && (
        <div style={unitDisplayStyles.hpBarContainer}>
          <div style={{ ...unitDisplayStyles.hpBar, width: `${hpPercentage}%`, backgroundColor: getHpColor(hpPercentage) }} />
        </div>
      )}
    </div>
  );
}); 