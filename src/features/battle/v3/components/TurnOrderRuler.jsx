import React, { useState } from 'react';

const styles = {
  turnOrderContainer: {
    padding: '10px 20px',
    marginBottom: '15px',
    backgroundColor: 'rgba(20, 30, 40, 0.75)',
    border: '1px solid rgba(135, 206, 235, 0.2)',
    borderRadius: '12px',
    position: 'relative',
    height: '80px',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  turnOrderTrack: {
    position: 'absolute',
    height: '2px',
    width: 'calc(100% - 40px)',
    backgroundColor: 'rgba(135, 206, 235, 0.3)',
    top: '50%',
    left: '20px',
    transform: 'translateY(-50%)',
    zIndex: 1,
    boxShadow: '0 0 4px rgba(135, 206, 235, 0.5)',
  },
  rulerMarkContainer: {
    position: 'absolute',
    height: '100%',
    top: 0,
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  rulerMark: {
    height: '8px',
    width: '1px',
    backgroundColor: 'rgba(135, 206, 235, 0.4)',
  },
  rulerMarkLabel: {
    fontSize: '10px',
    color: '#8cb0c4',
    marginTop: '6px',
  },
  turnOrderMarker: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    zIndex: 2,
    cursor: 'pointer',
    border: '2px solid rgba(255, 255, 255, 0.5)',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  playerUnitTurn: {
    backgroundColor: '#007bff',
  },
  enemyUnitTurn: {
    backgroundColor: '#dc3545',
  },
  markerActive: {
    borderColor: 'rgba(255, 255, 100, 0.9)',
    animation: 'breathing 1.5s infinite ease-in-out',
    boxShadow: '0 0 12px 4px rgba(255, 255, 100, 0.7)',
    transform: 'translate(-50%, -50%) scale(1.2)',
  },
  markerCompleted: {
    filter: 'saturate(0.5) brightness(0.6)',
    borderColor: 'rgba(120, 120, 120, 0.5)',
  },
  turnOrderMarkerLabel: {
    position: 'absolute',
    bottom: '120%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(10, 20, 30, 0.9)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    whiteSpace: 'nowrap',
    zIndex: 3,
    border: '1px solid rgba(135, 206, 235, 0.3)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
};

export const TurnOrderRuler = ({ order, allUnits, currentUnitId, completedUnitIds }) => {
  const [hoveredUnitId, setHoveredUnitId] = useState(null);

  if (!order || order.length === 0) {
    return null;
  }

  const orderedUnits = order.map(id => allUnits[id]).filter(Boolean);

  if (orderedUnits.length === 0) {
    return null;
  }

  const speeds = orderedUnits.map(u => u.derivedAttributes.speed);
  let minSpeed = Math.min(...speeds);
  let maxSpeed = Math.max(...speeds);

  if (minSpeed === maxSpeed) {
    minSpeed = 0;
    maxSpeed = maxSpeed * 1.5 > 0 ? maxSpeed * 1.5 : 100;
  }
  const speedRange = maxSpeed - minSpeed;

  const rulerMarks = Array.from({ length: 11 }, (_, i) => {
    const speedValue = Math.round(minSpeed + (speedRange * i) / 10);
    return (
      <div key={`mark-${i}`} style={{ ...styles.rulerMarkContainer, left: `${i * 10}%` }}>
        <div style={styles.rulerMark} />
        <div style={styles.rulerMarkLabel}>{speedValue}</div>
      </div>
    );
  });

  return (
    <div style={styles.turnOrderContainer}>
      <div style={styles.turnOrderTrack} />
      {rulerMarks}
      {orderedUnits.map((unit) => {
        if (!unit) return null;

        const speed = unit.derivedAttributes.speed;
        const positionPercent = speedRange === 0 ? 50 : (((speed - minSpeed) / speedRange) * 90) + 5;

        const isPlayer = unit.isPlayerUnit;
        const isActing = unit.id === currentUnitId;
        const isCompleted = completedUnitIds?.includes(unit.id);

        let markerStyle = { 
          ...styles.turnOrderMarker,
          ...(isPlayer ? styles.playerUnitTurn : styles.enemyUnitTurn)
        };
        
        if (isCompleted) {
          Object.assign(markerStyle, styles.markerCompleted);
        }
        if (isActing) {
          Object.assign(markerStyle, styles.markerActive);
        }

        return (
          <div
            key={unit.id}
            style={{
              ...markerStyle,
              left: `${positionPercent}%`
            }}
            onMouseEnter={() => setHoveredUnitId(unit.id)}
            onMouseLeave={() => setHoveredUnitId(null)}
          >
            {hoveredUnitId === unit.id && (
              <div style={styles.turnOrderMarkerLabel}>
                {`${unit.name} (速度: ${speed})`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}; 