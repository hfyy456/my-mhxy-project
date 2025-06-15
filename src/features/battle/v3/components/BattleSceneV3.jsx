import React, { useState, useEffect, useContext } from 'react';
import { useBattleV3 } from '../hooks/useBattleV3';
import { AnimationProvider, useAnimation, AnimationPlayer } from './AnimationPlayer';
import { BattleLifecycleContext } from '../context/BattleLifecycleContext';
import { TurnOrderRuler } from './TurnOrderRuler.jsx';

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
  '@keyframes breathing': {
    '0%': { transform: 'translate(-50%, -50%) scale(1)', boxShadow: '0 0 4px 1px rgba(255, 255, 100, 0.7)' },
    '50%': { transform: 'translate(-50%, -50%) scale(1.15)', boxShadow: '0 0 12px 5px rgba(255, 255, 100, 0.9)' },
    '100%': { transform: 'translate(-50%, -50%) scale(1)', boxShadow: '0 0 4px 1px rgba(255, 255, 100, 0.7)' },
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
  },
  turnOrderMarkerLabel: {
    position: 'absolute',
    bottom: '140%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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

const keyframesToString = (kfObj) => {
  return Object.entries(kfObj).map(([key, value]) => {
    const props = Object.entries(value).map(([prop, val]) => {
      const kebabProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${kebabProp}: ${val};`;
    }).join(' ');
    return `${key} { ${props} }`;
  }).join(' ');
};

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes shake { ${keyframesToString(styles['@keyframes shake'])} }
  @keyframes floatUp { ${keyframesToString(styles['@keyframes floatUp'])} }
  @keyframes lunge { ${keyframesToString(styles['@keyframes lunge'])} }
  @keyframes returnLunge { ${keyframesToString(styles['@keyframes returnLunge'])} }
  @keyframes breathing { ${keyframesToString(styles['@keyframes breathing'])} }
`;
document.head.appendChild(styleSheet);

const UnitDisplay = ({ unit }) => {
  if (!unit) return null; // 如果单位不存在，则不渲染
  const { name, derivedAttributes } = unit;
  const hpPercentage = (derivedAttributes.currentHp / derivedAttributes.maxHp) * 100;
  const { animationState } = useAnimation();
  const { floatingTexts, unitCssClasses } = animationState;
  
  const getHpColor = (percentage) => {
    if (percentage > 50) return '#4caf50';
    if (percentage > 20) return '#ff9800';
    return '#f44336';
  };
  
  const isDefeated = derivedAttributes.currentHp <= 0;
  
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
      <p>HP: {derivedAttributes.currentHp} / {derivedAttributes.maxHp}</p>
      <div style={styles.hpBarContainer}>
        <div style={{ ...styles.hpBar, width: `${hpPercentage}%`, backgroundColor: getHpColor(hpPercentage) }} />
      </div>
    </div>
  );
};

const BattleSceneV3Internal = ({ initialData, onComplete }) => {
  const [state, send] = useBattleV3();
  const { restartBattle } = useContext(BattleLifecycleContext);

  // --- NEW: State for player turn interaction ---
  const [playerActions, setPlayerActions] = useState({}); // Stores actions for player units, e.g., { 'unit-1': { type: 'attack', target: 'enemy-1' } }
  const [selectedUnitId, setSelectedUnitId] = useState(null); // Which player unit is currently selected for action
  const [targetingSkill, setTargetingSkill] = useState(null); // Are we currently selecting a target for a skill? { skillId: 'attack' }

  useEffect(() => {
    if (initialData && state.matches('idle')) {
      send({ type: 'INITIALIZE_BATTLE', payload: initialData });
    }
  }, [initialData, state, send]);
  
  const isCompleted = state.matches('completed');

  useEffect(() => {
    if (isCompleted && onComplete) {
      onComplete(state.context.battleResult);
    }
  }, [isCompleted, onComplete, state.context.battleResult]);
  
  const handleSubmitAction = (unitId) => {
    const livingEnemies = Object.values(state.context.enemyTeam).filter(u => state.context.allUnits[u.id]?.derivedAttributes.currentHp > 0);
    if (livingEnemies.length === 0) {
      console.warn("No living enemies to target!");
      return;
    }
    const targetId = livingEnemies[Math.floor(Math.random() * livingEnemies.length)].id;
    
    send({ type: 'SUBMIT_ACTION', payload: { unitId, action: { type: 'attack', target: targetId } } });
  };

  const isPreparation = state.matches('preparation');
  const isAnimating = state.matches('execution.animating');
  
  const script = state.context.currentActionExecution?.animationScript;

  // Reset local state when a new preparation phase begins
  useEffect(() => {
    if (isPreparation) {
      setPlayerActions({});
      setSelectedUnitId(null);
      setTargetingSkill(null);
    }
  }, [isPreparation]);

  const handlePlayerUnitClick = (unitId) => {
    if (!isPreparation) return;
    const unit = state.context.allUnits[unitId];
    if (unit.derivedAttributes.currentHp <= 0) return; // Cannot select defeated units

    setSelectedUnitId(unitId);
    setTargetingSkill({ skillId: 'basic_attack' }); // Default to basic attack for now
    console.log(`[UI] Selected unit ${unit.name}. Ready to target.`);
  };

  const handleEnemyUnitClick = (targetId) => {
    if (!isPreparation || !targetingSkill || !selectedUnitId) return;
    const targetUnit = state.context.allUnits[targetId];
    if (targetUnit.derivedAttributes.currentHp <= 0) return; // Cannot target defeated units

    console.log(`[UI] Player unit ${selectedUnitId} will target ${targetId} with ${targetingSkill.skillId}`);

    setPlayerActions(prev => ({
      ...prev,
      [selectedUnitId]: { type: targetingSkill.skillId, target: targetId, unitId: selectedUnitId }
    }));

    // Reset selection state after action is set
    setSelectedUnitId(null);
    setTargetingSkill(null);
  };

  const handleSubmitTurn = () => {
    if (!isPreparation) return;
    console.log('[UI] Submitting turn with actions:', playerActions);
    send({ type: 'SUBMIT_PLAYER_ACTIONS', payload: { actions: playerActions } });
  };

  // 如果没有初始化数据，或者状态机还未开始或正在初始化，显示加载中...
  if (!initialData || state.matches('idle') || state.matches('initializing')) {
    return <div>初始化战斗中...</div>;
  }

  const playerUnits = Object.values(state.context.playerTeam);
  const enemyUnits = Object.values(state.context.enemyTeam);

  const livingPlayerUnits = playerUnits.filter(u => state.context.allUnits[u.id]?.derivedAttributes.currentHp > 0);
  const allPlayerUnitsHaveAction = livingPlayerUnits.every(u => playerActions[u.id]);

  return (
    <div style={styles.container}>
      <TurnOrderRuler
        order={state.context.displayTurnOrder}
        units={state.context.allUnits}
        currentlyActingUnitId={state.context.currentActionExecution?.unitId}
        completedUnitIds={state.context.completedUnitIdsThisRound}
      />
      
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
            {/* The restart button here would trigger a full component remount via App.jsx key */}
            <button style={styles.button} onClick={restartBattle}>再战一场</button>
            {/* This button just closes the battle screen */}
            <button style={styles.button} onClick={() => onComplete(state.context.battleResult)}>返回主界面</button>
          </div>
        </div>
      )}

      <h1>战斗开始</h1>
      <div style={styles.section}>
        <h2>战斗信息</h2>
        <p>状态机状态: <span style={styles.state}>{typeof state.value === 'string' ? state.value : JSON.stringify(state.value)}</span></p>
        <p>回合: {state.context.currentRound}</p>
        {isPreparation && (
          <div>
            <h3>玩家回合</h3>
            <p>{targetingSkill ? `为 ${state.context.allUnits[selectedUnitId]?.name} 选择一个目标` : '请选择一个单位下达指令'}</p>
            <button 
              style={allPlayerUnitsHaveAction ? styles.button : { ...styles.button, ...styles.buttonDisabled }}
              onClick={handleSubmitTurn}
              disabled={!allPlayerUnitsHaveAction}
            >
              执行回合
            </button>
          </div>
        )}
      </div>

        <div style={styles.battlefield}>
          <div style={styles.teamContainer}>
          <h3>我方队伍</h3>
          {playerUnits.map(unit => {
            const unitWithState = state.context.allUnits[unit.id];
            const action = playerActions[unit.id];
            const isSelected = selectedUnitId === unit.id;
            return (
              <div key={unit.id} onClick={() => handlePlayerUnitClick(unit.id)} style={{ cursor: isPreparation ? 'pointer' : 'default', border: isSelected ? '2px solid blue' : 'none' }}>
                <UnitDisplay unit={unitWithState} />
                {isPreparation && (
                  <p>
                    {action ? `行动: 攻击 ${state.context.allUnits[action.target]?.name}` : '等待指令...'}
                  </p>
                )}
              </div>
            );
          })}
          </div>
          <div style={styles.teamContainer}>
            <h3>敌方队伍</h3>
          {enemyUnits.map(unit => {
            const unitWithState = state.context.allUnits[unit.id];
            return (
              <div key={unit.id} onClick={() => handleEnemyUnitClick(unit.id)} style={{ cursor: targetingSkill ? 'crosshair' : 'default' }}>
                <UnitDisplay unit={unitWithState} />
          </div>
            );
          })}
        </div>
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

export const BattleSceneV3 = ({ initialData, onComplete }) => (
  <AnimationProvider>
    <BattleSceneV3Internal initialData={initialData} onComplete={onComplete} />
  </AnimationProvider>
); 