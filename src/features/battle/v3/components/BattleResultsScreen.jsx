import React from 'react';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  resultBox: {
    padding: '40px 60px',
    borderRadius: '15px',
    backgroundColor: '#2c3e50',
    color: 'white',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    border: '2px solid #34495e',
  },
  resultText: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '30px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    textShadow: '0 0 10px rgba(255,255,255,0.3)',
  },
  confirmButton: {
    padding: '15px 30px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#3498db',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    textTransform: 'uppercase',
  },
};

export const BattleResultsScreen = ({ result, onConfirm }) => {
  const resultText = result === 'won' ? '战斗胜利' : '战斗失败';
  const resultColor = result === 'won' ? '#2ecc71' : '#e74c3c';

  return (
    <div style={styles.overlay}>
      <div style={styles.resultBox}>
        <h1 style={{ ...styles.resultText, color: resultColor }}>
          {resultText}
        </h1>
        <button 
          style={styles.confirmButton}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
          onClick={onConfirm}
        >
          结束战斗
        </button>
      </div>
    </div>
  );
}; 