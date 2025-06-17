import React, { useState, useEffect, useContext, memo, useRef, useCallback } from 'react';
import { useBattleV3 } from '../hooks/useBattleV3';
import { AnimationProvider, useAnimation, AnimationPlayer } from './AnimationPlayer';
import { BattleLifecycleContext } from '../context/BattleLifecycleContext';
import { TurnOrderRuler } from './TurnOrderRuler.jsx';
import { UnitDisplay, unitDisplayStyles } from './UnitDisplay.jsx';
import { ActionSelector } from './ActionSelector.jsx';
import { BattleResultsScreen } from './BattleResultsScreen.jsx';
import { skills as allSkills } from '../logic/skillConfig';
import { getAffectedCellCoords } from '../logic/targetLogic.js';
import { PhaseAnnouncer } from './PhaseAnnouncer.jsx';

const GlobalStyles = () => (
  <style>{`
    @keyframes lunge {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(30px, -10px) scale(1.05); }
      100% { transform: translate(0, 0) scale(1); }
    }

    @keyframes returnLunge {
      from { transform: translate(30px, -10px) scale(1.05); }
      to { transform: translate(0, 0) scale(1); }
    }
    
    @keyframes knockback-anim {
      0% { transform: translateX(0); }
      50% { transform: translateX(var(--knockback-direction, 40px)); }
      100% { transform: translateX(0); }
    }

    @keyframes vfx-impact-anim {
      0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
    }

    @keyframes bleed-anim {
      0% {
        transform: translate(-50%, -50%) rotate(-20deg) scaleX(0);
        opacity: 0.8;
      }
      30% {
        transform: translate(-50%, -50%) rotate(-20deg) scaleX(1.2);
        opacity: 0.9;
      }
      100% {
        transform: translate(-50%, -50%) rotate(-20deg) scaleX(1.2);
        opacity: 0;
      }
    }

    @keyframes defend-burst-anim {
      0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
      50% { opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
    }

    @keyframes floatUpAndScale {
      0% { transform: translate(-50%, 0) scale(0.8); opacity: 1; }
      70% { opacity: 1; }
      100% { transform: translate(-50%, -100px) scale(1.5); opacity: 0; }
    }
    
    @keyframes floatUpAndScaleCrit {
      0% { transform: translate(-50%, 0) scale(1); opacity: 1; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 3px 3px 6px rgba(0,0,0,0.7); }
      70% { opacity: 1; }
      100% { transform: translate(-50%, -120px) scale(2.2); opacity: 0; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 10px 10px 15px rgba(0,0,0,0.3); }
    }

    .unit-box.is-acting {
      z-index: 10;
    }
    .unit-box.take_hit_knockback {
      animation: knockback-anim 0.5s ease-out forwards;
    }
    
  `}</style>
);

const calculateCaptureChance = (targetUnit) => {
  if (!targetUnit || targetUnit.isCapturable === false) return 0;
  const { maxHp, currentHp } = targetUnit.derivedAttributes;
  if (maxHp <= 0) return 0;
  const chance = 0.3 + 0.7 * (1 - currentHp / maxHp); // Using your updated base chance
  return Math.round(chance * 100);
};

const styles = {
  container: { 
    position: 'relative',
    padding: '20px', 
    fontFamily: 'Arial, sans-serif', 
    maxWidth: '1800px', 
    margin: 'auto',
    backgroundColor: '#0a0f14',
    backgroundImage: 'radial-gradient(circle at top, #1a2430, #0a0f14 70%)',
    minHeight: '100vh',
  },
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  teamContainer: {
    width: '750px',
    border: '1px solid #2c3e50',
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: '#1f2b38',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridTemplateRows: 'repeat(3, 1fr)',
    gap: '20px',
  },
  gridCell: {
    border: '1px solid transparent',
    borderRadius: '12px',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    backgroundColor: '#0a192f',
    // Hexagon pattern background
    backgroundImage: 'radial-gradient(circle at center, rgba(13, 37, 69, 0.8) 20%, transparent 70%), linear-gradient(315deg, transparent 48%, rgba(20, 40, 70, 0.7) 49%, rgba(20, 40, 70, 0.7) 51%, transparent 52%), linear-gradient(45deg, transparent 48%, rgba(20, 40, 70, 0.7) 49%, rgba(20, 40, 70, 0.7) 51%, transparent 52%)',
    backgroundSize: '100% 100%, 30px 30px, 30px 30px',
    position: 'relative',
    boxShadow: '0 0 8px rgba(0, 191, 255, 0.2), inset 0 0 4px rgba(0, 191, 255, 0.1)',
    animation: 'cell-breathing 8s infinite ease-in-out',
  },
  unitBox: {
    border: '1px solid #ccc',
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease-in-out',
    position: 'relative',
    width: '100%', // Ensure unitBox fills the cell
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
  '@keyframes knockback': {
    '0%': { transform: 'translateX(0)' },
    '50%': { transform: 'translateX(var(--knockback-direction, 15px)) scale(1.02)' },
    '100%': { transform: 'translateX(0)' },
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
  '@keyframes cell-breathing': {
    '0%': { boxShadow: '0 0 8px rgba(0, 191, 255, 0.2), inset 0 0 4px rgba(0, 191, 255, 0.1)' },
    '50%': { boxShadow: '0 0 16px rgba(0, 191, 255, 0.4), inset 0 0 8px rgba(0, 191, 255, 0.3)' },
    '100%': { boxShadow: '0 0 8px rgba(0, 191, 255, 0.2), inset 0 0 4px rgba(0, 191, 255, 0.1)' },
  },
  '@keyframes cell-breathing-hover': {
    '0%': { outline: '3px solid rgba(220, 53, 69, 0.8)' },
    '50%': { outline: '5px solid rgba(220, 53, 69, 1)' },
    '100%': { outline: '3px solid rgba(220, 53, 69, 0.8)' },
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
  targetableUnit: {
    borderColor: 'transparent',
    outline: '3px solid rgba(255, 193, 7, 0.7)',
    outlineOffset: '2px',
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
  },
  targetableUnitHover: {
    borderColor: 'transparent',
    outlineColor: 'rgba(220, 53, 69, 1)',
    animation: 'cell-breathing-hover 2s infinite ease-in-out',
  },
  aoeHighlight: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    boxShadow: 'inset 0 0 10px rgba(255, 193, 7, 0.5)',
  },
  infoPanel: {
    width: '220px',
    backgroundColor: 'rgba(20, 30, 40, 0.85)',
    border: '1px solid rgba(135, 206, 235, 0.3)',
    borderRadius: '12px',
    padding: '25px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    alignSelf: 'stretch',
  },
  infoPanelGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  infoText: {
    fontSize: '16px',
    margin: 0,
    color: '#e0e0e0',
    textAlign: 'center',
  },
  roundText: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0,
    color: '#a0c8e0',
  },
  vsText: {
    fontFamily: '"Impact", "Arial Black", sans-serif',
    fontSize: '48px',
    fontWeight: 'bold',
    margin: 0,
    background: 'linear-gradient(180deg, #ff8c00, #ff4500)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 5px rgba(255,140,0,0.5), 0 0 15px rgba(255,69,0,0.5)',
    letterSpacing: '-2px',
  },
  statusText: {
    fontStyle: 'italic',
    color: '#8cb0c4',
    margin: 0,
  },
  logPanel: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '450px',
    height: '250px',
    backgroundColor: 'rgba(20, 30, 40, 0.85)',
    border: '1px solid rgba(135, 206, 235, 0.3)',
    borderRadius: '12px',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    color: 'white',
    zIndex: 100,
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    fontSize: '13px',
    transition: 'height 0.3s ease-in-out',
  },
  logPanelTitle: {
    margin: '0 0 10px 0',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(135, 206, 235, 0.2)',
    fontSize: '16px',
    fontWeight: 'bold',
    textAlign: 'center',
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },
  logToggleButton: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 10px',
  },
  logEntriesContainer: {
    flexGrow: 1,
    overflowY: 'auto',
    paddingRight: '10px',
    fontFamily: 'monospace',
  },
  logEntry: {
    color: '#c0c0c0',
    marginBottom: '5px',
    paddingBottom: '5px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
  },
  logEntry_action: { color: '#87ceeb' },
  logEntry_damage: { color: '#ff7f7f', fontWeight: 'bold' },
  logEntry_heal: { color: '#90ee90' },
  logEntry_death: { color: '#ff4500', fontStyle: 'italic', fontWeight: 'bold' },
  logEntry_info: { color: '#aaaaaa', fontStyle: 'italic' },
  ...unitDisplayStyles,
  captureChanceTooltip: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(20, 30, 40, 0.85)',
    borderRadius: '5px',
    padding: '5px 10px',
    color: 'white',
    fontSize: '12px',
    zIndex: 100,
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
  @keyframes knockback { ${keyframesToString(styles['@keyframes knockback'])} }
  @keyframes cell-breathing { ${keyframesToString(styles['@keyframes cell-breathing'])} }
  @keyframes cell-breathing-hover { ${keyframesToString(styles['@keyframes cell-breathing-hover'])} }
`;
document.head.appendChild(styleSheet);

const TeamGrid = memo(({ teamId, grid, allUnits, onUnitClick, isPlayerTeam, selectionState, playerActions, hoveredCell, setHoveredCell, onUnitHover, gridCellRefs }) => {
  const { selectedUnitId, skillForTargeting } = selectionState;
  const [hoveredTargetId, setHoveredTargetId] = useState(null);

  if (!grid) {
    return <div>Loading grid...</div>;
  }

  // --- AOE Preview Logic ---
  const skillForPreview = skillForTargeting ? allSkills[skillForTargeting.skillId] : null;

  const isCellHighlighted = (rowIndex, colIndex) => {
    if (!skillForPreview || isPlayerTeam) {
      return false;
    }
    const areaType = skillForPreview.areaType || 'single';

    // For 'group', all cells on the target grid are highlighted.
    if (areaType === 'group') {
      return true;
    }

    // For area-based skills, highlight based on hovered cell coordinates.
    if (areaType === 'cross' || areaType === 'square') {
      if (hoveredCell) {
        const affectedCoords = getAffectedCellCoords(skillForPreview, hoveredCell);
        return affectedCoords.some(coord => coord.row === rowIndex && coord.col === colIndex);
      }
      return false;
    }

    // For single-target skills, highlight the cell if it has a living unit.
    if (areaType === 'single') {
        const unitId = grid[rowIndex][colIndex];
        return unitId && allUnits[unitId]?.derivedAttributes.currentHp > 0;
    }
    
    return false;
  };
  // --- End AOE Preview Logic ---

  // Create a flat list of cells with their row/col for rendering
  const cells = grid.flatMap((row, rowIndex) => 
    row.map((unitId, colIndex) => ({
      unitId,
      rowIndex,
      colIndex,
      key: `${rowIndex}-${colIndex}`
    }))
  );

  return (
    <div style={styles.teamContainer}>
      {cells.map(cell => {
        const { unitId, rowIndex, colIndex } = cell;
        const unit = unitId ? allUnits[unitId] : null;

        const finalStyle = {
          ...styles.gridCell,
          gridColumn: isPlayerTeam ? colIndex + 1 :  colIndex + 1,
          gridRow: rowIndex + 1,
        };

        const isSelected = unit && unit.id === selectedUnitId;
        if (isSelected) {
          finalStyle.borderWidth = '0px';
          finalStyle.borderColor = '#007bff';
          finalStyle.boxShadow = '0 0 12px rgba(0, 123, 255, 0.8)';
          finalStyle.backgroundColor = 'rgba(0, 123, 255, 0.15)';
        }
        
        let canBeTargeted = unit && skillForTargeting && !isPlayerTeam && unit.derivedAttributes.currentHp > 0;
        let isUncapturable = false;

        if (canBeTargeted && skillForTargeting.skillId === 'capture') {
          if (unit.isCapturable === false) {
            canBeTargeted = false;
            isUncapturable = true;
          }
        }
        
        if (isUncapturable) {
          finalStyle.cursor = 'not-allowed';
          finalStyle.opacity = 0.5;
        }

        if (canBeTargeted) {
          finalStyle.cursor = 'crosshair';
          Object.assign(finalStyle, styles.targetableUnit);
        }

        if (isCellHighlighted(rowIndex, colIndex)) {
            Object.assign(finalStyle, styles.aoeHighlight);
        }

        const canBeSelected = unit && isPlayerTeam && !skillForTargeting;
        if (canBeSelected) {
          finalStyle.cursor = 'pointer';
        }

        const cellKey = `${teamId}-${rowIndex}-${colIndex}`;

        return (
          <div 
            key={cell.key} 
            ref={el => gridCellRefs.current[cellKey] = el}
            style={finalStyle} 
            onClick={() => {
              if (!skillForTargeting) {
                  if (unit && onUnitClick) onUnitClick(unit.id);
                  return;
              }

              if (!onUnitClick) return;
              if (!canBeTargeted) return;
              
              const skill = allSkills[skillForTargeting.skillId];
              if (!skill) return;
              const areaType = skill.areaType || 'single';

              if (areaType === 'single') {
                  if (unit) onUnitClick(unit.id);
              } else if (areaType === 'group') {
                  const nominalTarget = Object.values(allUnits).find(u => !u.isPlayerUnit && u.derivedAttributes.currentHp > 0);
                  if (nominalTarget) onUnitClick(nominalTarget.id);
              } else if (areaType === 'cross' || areaType === 'square') {
                  if (hoveredCell) {
                      const centerUnitId = grid[hoveredCell.row]?.[hoveredCell.col];
                      if (centerUnitId && allUnits[centerUnitId]?.derivedAttributes.currentHp > 0) {
                          onUnitClick(centerUnitId);
                          return;
                      }

                      const affectedCoords = getAffectedCellCoords(skill, hoveredCell);
                      const firstValidTarget = affectedCoords
                          .map(coords => grid[coords.row]?.[coords.col])
                          .find(targetUnitId => targetUnitId && allUnits[targetUnitId]?.derivedAttributes.currentHp > 0);
                      
                      if (firstValidTarget) {
                          onUnitClick(firstValidTarget);
                      }
                  }
              }
            }}
            onMouseEnter={() => {
              if (canBeTargeted) {
                setHoveredTargetId(unit?.id);
                onUnitHover(unit);
              }
              if (!isPlayerTeam) setHoveredCell({ row: rowIndex, col: colIndex });
            }}
            onMouseLeave={() => {
                if (canBeTargeted) {
                  setHoveredTargetId(null);
                  onUnitHover(null);
                }
                if (!isPlayerTeam) setHoveredCell(null);
            }}
          >
            {unit && hoveredTargetId === unit.id && selectionState.hoveredUnitCaptureChance > 0 && (
              <div style={styles.captureChanceTooltip}>
                捕捉概率: {selectionState.hoveredUnitCaptureChance}%
              </div>
            )}
            {unit && allUnits[unit.id].derivedAttributes.currentHp <= 0 && (
                <UnitDisplay unit={unit} isPlayerUnit={isPlayerTeam} hasActionSet={false} />
            )}
          </div>
        );
      })}
    </div>
  );
});

const BattleSceneV3Internal = ({ initialData, onComplete }) => {
  const [state, send] = useBattleV3();
  const { restartBattle } = useContext(BattleLifecycleContext);
  const logContainerRef = useRef(null);
  const { unitRefs } = useAnimation(); // Get refs from context
  const [isLogPanelExpanded, setIsLogPanelExpanded] = useState(true);

  // --- REFACTOR: Refs and State for Decoupled Rendering ---
  const gridContainerRef = useRef(null); // Ref for the main battle area
  const gridCellRefs = useRef({}); // Refs for each individual grid cell
  const [unitInitialPositions, setUnitInitialPositions] = useState({}); // Store calculated {top, left} for each unit
  
  // --- REFACTOR: Calculate initial positions of units ---
  useEffect(() => {
    const SPRITE_WIDTH = 150; // Define standard sprite dimensions
    const SPRITE_HEIGHT = 150;

    const containerRect = gridContainerRef.current?.getBoundingClientRect();
    if (!containerRect || Object.keys(gridCellRefs.current).length === 0) return;

    const newPositions = {};
    const allUnits = state.context.allUnits;

    const locateUnit = (unitId) => {
      for (const team of ['playerGrid', 'enemyGrid']) {
        const grid = state.context[team];
        for (let r = 0; r < grid.length; r++) {
          for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c] === unitId) {
              return { teamId: team === 'playerGrid' ? 'playerTeam' : 'enemyTeam', row: r, col: c };
            }
          }
        }
      }
      return null;
    }

    for (const unitId in allUnits) {
      const location = locateUnit(unitId);
      if (location) {
        const cellKey = `${location.teamId}-${location.row}-${location.col}`;
        const cellNode = gridCellRefs.current[cellKey];
        if (cellNode) {
          const cellRect = cellNode.getBoundingClientRect();
          // Calculate top/left for the sprite container to be bottom-centered in the cell
          newPositions[unitId] = {
            top: (cellRect.top - containerRect.top) + cellRect.height - (SPRITE_HEIGHT /2) - 20, // -20 for bottom padding
            left: (cellRect.left - containerRect.left) + (cellRect.width / 2)- 60,
          };
        }
      }
    }
    setUnitInitialPositions(newPositions);

  }, [state.context.allUnits, state.context.playerGrid, state.context.enemyGrid]); // Recalculate if layout changes


  // --- NEW: State for announcements ---
  const [announcement, setAnnouncement] = useState({ text: '', trigger: 0 });

  // --- NEW: State for player turn interaction ---
  const [playerActions, setPlayerActions] = useState({}); // Stores actions for player units, e.g., { 'unit-1': { type: 'attack', target: 'enemy-1' } }
  const [selectedUnitId, setSelectedUnitId] = useState(null); // Which player unit is currently selected for action
  const [skillForTargeting, setSkillForTargeting] = useState(null); // Stores the skill that is waiting for a target, e.g., { skillId: 'fire_slash' }
  const [hoveredCell, setHoveredCell] = useState(null); // { row, col } of the hovered grid cell
  const [hoveredUnitCaptureChance, setHoveredUnitCaptureChance] = useState(0);

  useEffect(() => {
    if (initialData && state.matches('idle')) {
      send({ type: 'INITIALIZE_BATTLE', payload: initialData });
    }
  }, [initialData, state, send]);
  
  // Auto-scroll for log panel
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [state.context.logs]);
  
  const isBattleFinished = state.matches('battleEnded');

  // Effect for announcements
  const prevRoundRef = useRef(state.context.currentRound);
  const prevStateValueRef = useRef(state.value);

  useEffect(() => {
    let newText = '';
    const prevValue = prevStateValueRef.current;
    
    // Announce new round first, as it's the most significant change.
    if (state.context.currentRound !== prevRoundRef.current && state.context.currentRound > 0) {
        newText = `第 ${state.context.currentRound} 回合`;
    } 
    // If no round change, check for phase change. A simple stringify is a reliable way to check for value changes.
    else if (JSON.stringify(state.value) !== JSON.stringify(prevValue)) {
        // Announce "Action Phase" when moving from preparation to execution.
        if (state.matches('execution') && prevValue === 'preparation') {
            newText = '行动阶段';
        } 
        // Announce result when battle is completed.
        else if (state.matches('completed')) {
            if (state.context.battleResult === 'victory') newText = '战斗胜利';
            else if (state.context.battleResult === 'defeat') newText = '战斗失败';
            else if (state.context.battleResult === 'escaped') newText = '成功逃跑';
        }
    }

    if (newText) {
      setAnnouncement(a => ({ text: newText, trigger: a.trigger + 1 }));
    }
    
    // Update refs for the next render
    prevRoundRef.current = state.context.currentRound;
    prevStateValueRef.current = state.value;

  }, [state]); // Depend on the whole state object for accurate change detection

  useEffect(() => {
    if (isBattleFinished && onComplete) {
      onComplete(state.data);
    }
  }, [isBattleFinished, onComplete, state.data]);
  
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

  const handleAnimationComplete = useCallback(() => {
    send({ type: 'ANIMATION_COMPLETE' });
  }, [send]);

  // Reset local state when a new preparation phase begins
  useEffect(() => {
    if (isPreparation) {
      setPlayerActions({});
      setSelectedUnitId(null);
      setSkillForTargeting(null);
      setHoveredCell(null);
      setHoveredUnitCaptureChance(0);
    }
  }, [isPreparation]);

  const handlePlayerUnitClick = (unitId) => {
    if (!isPreparation) return;
    const unit = state.context.allUnits[unitId];
    if (unit.derivedAttributes.currentHp <= 0) return;

    // If we click the already selected unit, or another unit, close the selector and reset.
    if (selectedUnitId === unitId || selectedUnitId) {
        setSelectedUnitId(null);
    }
    
    // Select the new unit
    setSelectedUnitId(unitId);
    setSkillForTargeting(null); // Ensure we are not in targeting mode
  };
  
  const handleSkillSelect = (skillId) => {
    if (!selectedUnitId) return;
    
    const skill = allSkills[skillId];
    if (!skill) return;

    // Self-targeted skills are confirmed immediately.
    if (skill.targetType === 'self') {
      setPlayerActions(prev => ({
        ...prev,
        [selectedUnitId]: { type: skillId, target: selectedUnitId, unitId: selectedUnitId }
      }));
      setSelectedUnitId(null);
      setSkillForTargeting(null);
    } 
    // ALL other skills that require a target will enter targeting mode.
    else {
      setSkillForTargeting({ skillId });
    }
  };

  const handleEnemyUnitClick = (targetId) => {
    if (!isPreparation || !skillForTargeting || !selectedUnitId) return;
    const targetUnit = state.context.allUnits[targetId];
    if (targetUnit.derivedAttributes.currentHp <= 0) return;

    setPlayerActions(prev => ({
      ...prev,
      [selectedUnitId]: { type: skillForTargeting.skillId, target: targetId, unitId: selectedUnitId }
    }));

    // Reset selection state after action is set
    setSelectedUnitId(null);
    setSkillForTargeting(null);
  };

  const handleUnitHover = (unit) => {
    if (skillForTargeting?.skillId === 'capture' && unit) {
      const chance = calculateCaptureChance(unit);
      setHoveredUnitCaptureChance(chance);
    } else {
      setHoveredUnitCaptureChance(0);
    }
  };

  const handleCancel = () => {
    // If we are in targeting mode, cancel that first, returning to skill selection.
    if (skillForTargeting) {
      setSkillForTargeting(null);
      return;
    }
    // If a unit is selected, cancel the selection entirely.
    if (selectedUnitId) {
      setSelectedUnitId(null);
    }
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    handleCancel();
  };

  const handleSubmitTurn = () => {
    if (!isPreparation) return;
    console.log('[UI] Submitting turn with actions:', playerActions);
    send({ type: 'SUBMIT_PLAYER_ACTIONS', payload: { actions: playerActions } });
  };

  const handleFlee = () => {
    if (!isPreparation) return;
    send({ type: 'FLEE' });
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
    <BattleLifecycleContext.Provider value={state.context}>
      <GlobalStyles />
      <div style={styles.container} onContextMenu={handleContextMenu}>
        <PhaseAnnouncer text={announcement.text} trigger={announcement.trigger} />
        <TurnOrderRuler
          order={state.context.displayTurnOrder}
          allUnits={state.context.allUnits}
          currentUnitId={state.context.currentActionExecution?.unitId}
          completedUnitIds={state.context.completedUnitIdsThisRound}
        />
        
        {selectedUnitId && !skillForTargeting && (
          <ActionSelector
            unit={state.context.allUnits[selectedUnitId]}
            skills={allSkills}
            onSkillSelect={handleSkillSelect}
            onClose={handleCancel}
          />
        )}

        {isAnimating && script && <AnimationPlayer script={script} onComplete={handleAnimationComplete} />}

        {state.matches('results') && (
          <BattleResultsScreen 
            result={state.context.battleResult}
            onConfirm={() => send({ type: 'CONFIRM_RESULTS' })}
          />
        )}

        <div style={styles.battlefield} ref={gridContainerRef}>
          <TeamGrid
            teamId="playerTeam"
            grid={state.context.playerGrid}
            allUnits={state.context.allUnits}
            onUnitClick={handlePlayerUnitClick}
            isPlayerTeam={true}
            selectionState={{ selectedUnitId, skillForTargeting, hoveredUnitCaptureChance }}
            playerActions={playerActions}
            hoveredCell={hoveredCell}
            setHoveredCell={setHoveredCell}
            onUnitHover={handleUnitHover}
            gridCellRefs={gridCellRefs}
          />
          <div style={styles.infoPanel}>
            <div style={styles.infoPanelGroup}>
              <p style={styles.roundText}>第 {state.context.currentRound} 回合</p>
              <p style={styles.statusText}>{isPreparation ? '准备阶段' : isAnimating ? '行动中' : '等待中...'}</p>
            </div>
            <p style={styles.vsText}>VS</p>
            <p style={styles.infoText}>
              {isPreparation
                ? (selectedUnitId && !skillForTargeting
                  ? `选择技能`
                  : skillForTargeting
                  ? `选择目标`
                  : '选择单位')
                : '正在执行行动...'}
            </p>
            <div style={styles.infoPanelGroup}>
              <button
                style={(isPreparation && allPlayerUnitsHaveAction) ? styles.button : { ...styles.button, ...styles.buttonDisabled }}
                onClick={handleSubmitTurn}
                disabled={!isPreparation || !allPlayerUnitsHaveAction}
              >
                执行回合
              </button>
              <button
                style={isPreparation ? styles.button : { ...styles.button, ...styles.buttonDisabled }}
                onClick={handleFlee}
                disabled={!isPreparation}
              >
                逃跑
              </button>
            </div>
          </div>
          <TeamGrid
            teamId="enemyTeam"
            grid={state.context.enemyGrid}
            allUnits={state.context.allUnits}
            onUnitClick={handleEnemyUnitClick}
            isPlayerTeam={false}
            selectionState={{ selectedUnitId, skillForTargeting, hoveredUnitCaptureChance }}
            playerActions={playerActions}
            hoveredCell={hoveredCell}
            setHoveredCell={setHoveredCell}
            onUnitHover={handleUnitHover}
            gridCellRefs={gridCellRefs}
          />

          {/* --- REFACTOR: Decoupled Unit Rendering Layer --- */}
          <div className="unit-sprite-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {Object.values(state.context.allUnits).map(unit => {
              const initialPos = unitInitialPositions[unit.id];
              if (!unit || !initialPos) return null;
              
              const isDefeated = unit.derivedAttributes.currentHp <= 0;
              if (isDefeated) return null;

              return (
                <UnitDisplay
                  key={unit.id}
                  ref={el => unitRefs.current[unit.id] = el}
                  unit={unit}
                  isPlayerUnit={unit.team === 'player'}
                  hasActionSet={!!playerActions?.[unit.id]}
                  initialPosition={initialPos}
                />
              );
            })}
          </div>
        </div>

        <div style={{...styles.logPanel, height: isLogPanelExpanded ? '220px' : '58px'}}>
          <div style={styles.logPanelTitle} onClick={() => setIsLogPanelExpanded(!isLogPanelExpanded)}>
            <span>战斗日志</span>
            <button style={styles.logToggleButton}>{isLogPanelExpanded ? '−' : '+'}</button>
          </div>
          {isLogPanelExpanded && (
            <div style={styles.logEntriesContainer} ref={logContainerRef}>
              {state.context.logs.map((log, index) => (
                <p key={index} style={{...styles.logEntry, ...styles[`logEntry_${log.type}`]}}>{log.message}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </BattleLifecycleContext.Provider>
  );
}

export const BattleSceneV3 = ({ initialData, onComplete }) => (
  <AnimationProvider>
    <BattleSceneV3Internal initialData={initialData} onComplete={onComplete} />
  </AnimationProvider>
); 