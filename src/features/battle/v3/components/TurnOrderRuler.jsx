import React, { useState } from 'react';

const styles = {
  turnOrderContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px 10px',
    marginBottom: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    flexWrap: 'wrap',
    position: 'relative',
    height: '60px',
    border: '1px solid #dee2e6',
  },
  turnOrderTrack: {
    position: 'absolute',
    height: '4px',
    width: 'calc(100% - 20px)',
    backgroundColor: '#ced4da',
    top: '50%',
    left: '10px',
    transform: 'translateY(-50%)',
    zIndex: 1,
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
    height: '12px',
    width: '2px',
    backgroundColor: '#adb5bd',
  },
  rulerMarkLabel: {
    fontSize: '10px',
    color: '#6c757d',
    marginTop: '4px',
  },
  turnOrderMarker: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    zIndex: 2,
    cursor: 'pointer',
    border: '2px solid white',
    transition: 'background-color 0.3s ease, filter 0.3s ease',
  },
  markerActive: {
    animation: 'breathing 1.5s infinite ease-in-out',
    boxShadow: '0 0 8px 3px rgba(255, 255, 100, 0.9)',
  },
  markerCompleted: {
    backgroundColor: '#6c757d',
    filter: 'saturate(0)',
  },
  turnOrderMarkerLabel: {
    position: 'absolute',
    bottom: '140%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '5px 10px',
    borderRadius: '5px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    zIndex: 3,
  },
  playerUnitTurn: {
    backgroundColor: '#007bff',
  },
  enemyUnitTurn: {
    backgroundColor: '#dc3545',
  },
};

export const TurnOrderRuler = ({ order, units, currentlyActingUnitId, completedUnitIds }) => {
  const [hoveredUnitId, setHoveredUnitId] = useState(null);

  if (!order || order.length === 0) {
    return null;
  }

  const orderedUnits = order.map(id => units[id]).filter(Boolean);

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
        const isActing = unit.id === currentlyActingUnitId;
        const isCompleted = completedUnitIds?.includes(unit.id);

        let markerStyle = isPlayer ? styles.playerUnitTurn : styles.enemyUnitTurn;
        if (isCompleted) {
          markerStyle = { ...markerStyle, ...styles.markerCompleted };
        }
        if (isActing) {
          markerStyle = { ...markerStyle, ...styles.markerActive };
        }

        return (
          <div
            key={unit.id}
            style={{
              ...styles.turnOrderMarker,
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