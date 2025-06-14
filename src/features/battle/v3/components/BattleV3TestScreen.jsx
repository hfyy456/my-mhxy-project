import React, { useState, useEffect, useContext } from 'react';
import { useBattleV3 } from '../hooks/useBattleV3';
import { AnimationProvider, useAnimation, AnimationPlayer } from './AnimationPlayer';
import { BattleLifecycleContext } from '../context/BattleLifecycleContext';

const mockBattleData = {
  battleId: 'test-battle-001',
  playerUnits: {
    'player-1': {
      id: 'player-1',
      name: '玩家1',
      hp: 100,
      isPlayerUnit: true,
      stats: { maxHp: 100, currentHp: 100, speed: 50, physicalAttack: 30, physicalDefense: 10, magicalAttack: 5, magicalDefense: 5, critRate: 0.1, critDamage: 1.5 },
    },
    'player-2': {
      id: 'player-2',
      name: '宠物A',
      hp: 150,
      isPlayerUnit: true,
      stats: {maxHp: 150,currentHp: 150, speed: 40, physicalAttack: 45, physicalDefense: 20, magicalAttack: 10, magicalDefense: 10, critRate: 0.15, critDamage: 1.6 },
    },
  },
  enemyUnits: {
    'enemy-1': {
      id: 'enemy-1',
      name: '怪物A',
      hp: 80,
      isPlayerUnit: false,
      stats: { maxHp: 80, currentHp: 80, speed: 30, physicalAttack: 25, physicalDefense: 5, magicalAttack: 0, magicalDefense: 0, critRate: 0.05, critDamage: 1.5 },
    },
    'enemy-2': {
      id: 'enemy-2',
      name: '怪物B',
      hp: 80,
      isPlayerUnit: false,
      stats: { maxHp: 80, currentHp: 80, speed: 35, physicalAttack: 25, physicalDefense: 5, magicalAttack: 0, magicalDefense: 0, critRate: 0.05, critDamage: 1.5 },
    },
  },
};

const styles = {
  container: { padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: 'auto' },
  state: { color: 'blue', fontWeight: 'bold', marginBottom: '10px' },
  context: {
    backgroundColor: '#f0f0f0',
    padding: '10px',
    borderRadius: '5px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    marginBottom: '20px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  button: {
    margin: '5px',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '16px',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
  },
  section: {
    border: '1px solid #ccc',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '15px',
  },
  battlefield: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '20px',
  },
  teamContainer: {
    width: '45%',
    border: '1px solid #ddd',
    padding: '10px',
    borderRadius: '5px',
    backgroundColor: '#fafafa'
  },
  unitBox: {
    border: '1px solid #ccc',
    padding: '10px',
    margin: '10px 0',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease-in-out',
    position: 'relative',
  },
  unitBoxAttacking: {
    transform: 'scale(1.08)',
    borderColor: '#ffc107',
  },
  unitBoxHitting: {
    animation: 'shake 0.3s',
    borderColor: '#dc3545',
  },
  hpBarContainer: {
    backgroundColor: '#e0e0e0',
    borderRadius: '5px',
    height: '20px',
    width: '100%',
    marginTop: '5px',
  },
  hpBar: {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 0.5s ease-in-out, background-color 0.5s ease-in-out',
  },
  '@keyframes lunge': {
    '0%': { transform: 'translate(0, 0) scale(1)' },
    '50%': { transform: 'translate(30px, -10px) scale(1.05)' },
    '100%': { transform: 'translate(0, 0) scale(1)' },
  },
  '@keyframes returnLunge': {
    'from': { transform: 'translate(30px, -10px) scale(1.05)' },
    'to': { transform: 'translate(0, 0) scale(1)' },
  },
  '@keyframes shake': {
    '0%, 100%': { transform: 'translateX(0)' },
    '25%': { transform: 'translateX(-8px)' },
    '50%': { transform: 'translateX(8px)' },
    '75%': { transform: 'translateX(-8px)' },
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
  '@keyframes floatUp': {
    '0%': { opacity: 1, top: '0px' },
    '100%': { opacity: 0, top: '-50px' },
  },
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
    zIndex: 100,
  },
  resultBox: {
    padding: '40px',
    borderRadius: '10px',
    backgroundColor: 'white',
    textAlign: 'center',
  },
  resultText: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  'attack_lunge': {
    animation: 'lunge 0.5s ease-in-out',
  },
  'take_hit_shake': {
    animation: 'shake 0.4s',
  },
  'return_to_idle': {
    animation: 'returnLunge 0.3s ease-in-out',
  },
};

// --- NEW HELPER FUNCTION ---
// This function converts a JSS-style keyframe object to a CSS string
const keyframesToString = (kfObj) => {
  return Object.entries(kfObj).map(([key, value]) => {
    const props = Object.entries(value).map(([prop, val]) => {
      // A simple camelCase to kebab-case converter
      const kebabProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${kebabProp}: ${val};`;
    }).join(' ');
    return `${key} { ${props} }`;
  }).join(' ');
};

// Inject keyframes into a style tag for animations
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
// --- MODIFIED to use the new helper function ---
styleSheet.innerText = `
  @keyframes shake { ${keyframesToString(styles['@keyframes shake'])} }
  @keyframes floatUp { ${keyframesToString(styles['@keyframes floatUp'])} }
  @keyframes lunge { ${keyframesToString(styles['@keyframes lunge'])} }
  @keyframes returnLunge { ${keyframesToString(styles['@keyframes returnLunge'])} }
`;
document.head.appendChild(styleSheet);

const FloatingDamage = ({ damage }) => {
  return <div style={styles.floatingDamage}>{damage}</div>;
};

const UnitDisplay = ({ unit }) => {
  const { name, stats } = unit;
  const hpPercentage = (stats.currentHp / stats.maxHp) * 100;
  const { animationState } = useAnimation();
  const { floatingTexts, unitCssClasses } = animationState;
  
  const getHpColor = (percentage) => {
    if (percentage > 50) return '#4caf50';
    if (percentage > 20) return '#ff9800';
    return '#f44336';
  };
  
  const isDefeated = stats.currentHp <= 0;
  
  const currentAnimClass = unitCssClasses[unit.id];
  const unitStyle = {
    ...styles.unitBox,
    ...(currentAnimClass ? styles[currentAnimClass] : {}),
    opacity: isDefeated ? 0.5 : 1,
  };

  return (
    <div style={unitStyle}>
      {floatingTexts[unit.id]?.map((ft, index) => (
        <div key={index} style={{...styles.floatingDamage, color: ft.color}}>{ft.text}</div>
      ))}
      <h4>{name} {isDefeated && '(已阵亡)'}</h4>
      <p>HP: {stats.currentHp} / {stats.maxHp}</p>
      <div style={styles.hpBarContainer}>
        <div style={{ ...styles.hpBar, width: `${hpPercentage}%`, backgroundColor: getHpColor(hpPercentage) }} />
      </div>
    </div>
  );
};

const BattleV3TestScreenInternal = () => {
  const [state, send] = useBattleV3();
  const { restartBattle } = useContext(BattleLifecycleContext);

  const handleInitialize = () => {
    send({ type: 'INITIALIZE_BATTLE', payload: mockBattleData });
  };
  
  const handleSubmitAction = (unitId) => {
    const livingEnemies = Object.values(state.context.enemyTeam).filter(u => state.context.allUnits[u.id]?.stats.currentHp > 0);
    if (livingEnemies.length === 0) {
      console.warn("No living enemies to target!");
      return;
    }
    const targetId = livingEnemies[Math.floor(Math.random() * livingEnemies.length)].id;
    
    send({ type: 'SUBMIT_ACTION', payload: { unitId, action: { type: 'attack', target: targetId } } });
  };

  const handleForceExecution = () => {
    send({ type: 'FORCE_EXECUTION' });
  };
  
  const isIdle = state.matches('idle');
  const isPreparation = state.matches('preparation');
  const isAnimating = state.matches('execution.animating');
  const isCompleted = state.matches('completed');
  
  const script = state.context.currentActionExecution?.animationScript;

  return (
    <div style={styles.container}>
      {isAnimating && script && (
        <AnimationPlayer
          script={script}
          onComplete={() => send({ type: 'ANIMATION_COMPLETE' })}
        />
      )}

      {isCompleted && (
        <div style={styles.overlay}>
          <div style={styles.resultBox}>
            <p style={styles.resultText}>{state.context.battleResult}</p>
            <button style={styles.button} onClick={restartBattle}>重新开始</button>
          </div>
        </div>
      )}

      <h1>Battle V3 Test Screen</h1>
      <p>当前状态: <span style={styles.state}>{typeof state.value === 'object' ? JSON.stringify(state.value) : state.value}</span></p>
      
      {!isIdle && (
        <div style={styles.battlefield}>
          <div style={styles.teamContainer}>
            <h3>玩家队伍</h3>
            {Object.values(state.context.playerTeam).map(unit => (
              <div key={unit.id}>
                <UnitDisplay unit={state.context.allUnits[unit.id]} />
                <button
                  style={{ ...styles.button, ...(!isPreparation || state.context.unitActions[unit.id] ? styles.buttonDisabled : {}) }}
                  onClick={() => handleSubmitAction(unit.id)}
                  disabled={!isPreparation || !!state.context.unitActions[unit.id] || state.context.allUnits[unit.id]?.stats.currentHp <= 0}
                >
                  {state.context.allUnits[unit.id].name} 攻击 {state.context.unitActions[unit.id] && '(已提交)'}
                </button>
              </div>
            ))}
          </div>
          <div style={styles.teamContainer}>
            <h3>敌方队伍</h3>
            {Object.values(state.context.enemyTeam).map(unit => (
              <UnitDisplay key={unit.id} unit={state.context.allUnits[unit.id]} />
            ))}
          </div>
        </div>
      )}
      
      <div style={styles.section}>
        <h2>操作</h2>
        <button 
          style={{...styles.button, ...(!isIdle ? styles.buttonDisabled : {}) }} 
          onClick={handleInitialize} 
          disabled={!isIdle}
        >
          初始化战斗
        </button>
        {isPreparation && (
          <button style={styles.button} onClick={handleForceExecution}>
            强制执行回合
          </button>
        )}
      </div>

      <details>
        <summary>查看状态机上下文</summary>
        <pre style={styles.context}>
          {JSON.stringify(state.context, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export const BattleV3TestScreen = () => (
  <AnimationProvider>
    <BattleV3TestScreenInternal />
  </AnimationProvider>
); 