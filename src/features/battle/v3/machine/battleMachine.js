import { createMachine, assign, fromPromise } from 'xstate';
import { determineActionOrder } from '../logic/turnOrder';
import { calculateBattleDamage } from '../logic/damageCalculation';
import { setEnemyUnitsActions } from '../logic/battleAI';
import { skills as skillConfig } from '../logic/skillConfig';

const calculateDisplayTurnOrder = (allUnits) => {
  if (!allUnits || Object.keys(allUnits).length === 0) return [];
  return Object.values(allUnits)
      .filter(u => u && u.derivedAttributes && u.derivedAttributes.currentHp > 0)
      .sort((a, b) => a.derivedAttributes.speed - b.derivedAttributes.speed)
      .map(u => u.id);
};

const initializeBattleContext = assign({
  allUnits: ({ event }) => {
    console.log('[DEBUG] initializeBattleContext received event:', event);
    return { ...event.payload.playerUnits, ...event.payload.enemyUnits };
  },
  playerTeam: ({ event }) => event.payload.playerUnits,
  enemyTeam: ({ event }) => event.payload.enemyUnits,
  turnOrder: ({ event }) => [], // Turn order will be calculated later
  currentTurn: 0,
  round: 1,
  sortedActionQueue: [],
  currentActionExecution: null, // This will now store { animationScript, logicalResult }
  battleResult: null,
  error: null,
  logs: [],
  skillOverrides: null, // To hold temporary skill data for preview
  aiActionsReady: false,
  playerActionsReady: false,
  displayTurnOrder: [],
  completedUnitIdsThisRound: [],
});

// --- New Helper Function: Script & Result Generator ---
const generateScriptAndResult = (action, allUnits, skillOverrides) => {
  const { type, unitId } = action;
  let { target: targetId } = action; // Use let since it might change

  const skillId = type === 'attack' ? 'basic_attack' : type;
  const skill = skillOverrides?.[skillId] ?? skillConfig[skillId];
  
  if (!skill) {
    console.error(`Skill "${skillId}" not found.`);
    return { animationScript: [], logicalResult: { hpChanges: [], buffChanges: [] } };
  }
  
  const source = allUnits[unitId];
  let primaryTarget = allUnits[targetId];

  // --- Restored & Enhanced Smart Target Redirection ---
  if (!primaryTarget || primaryTarget.derivedAttributes.currentHp <= 0) {
    console.log(`[TARGET] Original target ${targetId} for ${source.id} is invalid. Finding new target...`);
    
    // Find the opposing team
    const livingOpponents = Object.values(allUnits).filter(u => u.isPlayerUnit !== source.isPlayerUnit && u.derivedAttributes.currentHp > 0);

    if (livingOpponents.length > 0) {
      const newTarget = livingOpponents[Math.floor(Math.random() * livingOpponents.length)];
      targetId = newTarget.id; // Update targetId
      primaryTarget = newTarget; // Update the full target object
      console.log(`[TARGET] New target for ${source.name}: ${primaryTarget.name}`);
    } else {
      console.log(`[TARGET] No valid new targets found for ${source.name}.`);
      primaryTarget = null; // Action will be effectively skipped
    }
  }
  // --- End of Smart Target Redirection ---
  
  let animationScript = [];
  let logicalResult = { hpChanges: [], buffChanges: [] };

  if (primaryTarget) { // Only proceed if we have a valid target
    let totalDamage = 0;
    animationScript = JSON.parse(JSON.stringify(skill.animationScriptTemplate));
  
    skill.effects.forEach(effect => {
      if (effect.type === 'DAMAGE') {
        const pAtk = source.derivedAttributes.physicalAttack || 0;
        totalDamage = Math.round(pAtk * parseFloat(effect.value));
      }
    });
    
    animationScript.forEach(step => {
      if (step.text) step.text = step.text.replace('{{damage}}', totalDamage);
      if (step.target === 'source') step.targetIds = [unitId];
      if (step.target === 'primaryTarget') step.targetIds = [targetId];
    });
    
    logicalResult.hpChanges.push({ targetId, change: -totalDamage });
  }
  
  return { animationScript, logicalResult };
};

export const battleMachine = createMachine({
  id: 'battleV3',
  initial: 'idle',
  context: {
    battleId: null,
    playerUnits: {},
    enemyUnits: {},
    playerGrid: null,
    enemyGrid: null,
    allUnits: {},
    currentRound: 0,
    unitActions: {},
    sortedActionQueue: [],
    currentActionExecution: null, // This will now store { animationScript, logicalResult }
    battleResult: null,
    error: null,
    logs: [],
    skillOverrides: null, // To hold temporary skill data for preview
    aiActionsReady: false,
    playerActionsReady: false,
    displayTurnOrder: [],
    completedUnitIdsThisRound: [],
  },
  states: {
    idle: {
      on: {
        INITIALIZE_BATTLE: {
          target: 'initializing',
          actions: assign({
            battleId: ({ event }) => event.payload.battleId,
            playerUnits_initial: ({ event }) => event.payload.playerUnits,
            enemyUnits_initial: ({ event }) => event.payload.enemyUnits,
            playerGrid: ({ event }) => event.payload.playerGrid,
            enemyGrid: ({ event }) => event.payload.enemyGrid,
          })
        },
        INITIALIZE_BATTLE_FOR_PREVIEW: {
          target: 'execution',
          actions: assign({
            playerUnits: ({ event }) => event.payload.playerUnits,
            enemyUnits: ({ event }) => event.payload.enemyUnits,
            playerTeam: ({ event }) => event.payload.playerUnits,
            enemyTeam: ({ event }) => event.payload.enemyUnits,
            allUnits: ({ event }) => ({ ...event.payload.playerUnits, ...event.payload.enemyUnits }),
            skillOverrides: ({ event }) => event.payload.skillToPreview,
            // Pre-populate the action queue for immediate execution
            sortedActionQueue: ({ event }) => {
              const skill = event.payload.skillToPreview;
              const action = {
                type: Object.keys(skill)[0], // The skill id
                unitId: 'player-1',
                target: 'enemy-1' // Mock target
              };
              return [action];
            }
          })
        }
      },
    },
    initializing: {
      invoke: {
        id: 'initializeBattle',
        src: 'initializeBattle',
        input: ({ context }) => ({
          playerUnits: context.playerUnits_initial,
          enemyUnits: context.enemyUnits_initial,
        }),
        onDone: {
          target: 'roundStart',
          actions: 'initializeBattleContext',
        },
        onError: {
          target: 'error',
          actions: 'logAndAssignError',
        },
      },
    },
    roundStart: {
      entry: [
        assign({
          currentRound: ({ context }) => context.currentRound + 1,
          displayTurnOrder: ({ context }) => calculateDisplayTurnOrder(context.allUnits),
          completedUnitIdsThisRound: [],
          // Reset readiness flags for the new round
          aiActionsReady: false,
          playerActionsReady: false,
        }),
        () => console.log('[DEBUG] Entering roundStart state')
      ],
      invoke: {
        id: 'processRoundStartEffects',
        src: 'processRoundStartEffectsService',
        onDone: { target: 'preparation' },
        onError: { target: 'error', actions: 'logAndAssignError' },
      },
    },
    preparation: {
      entry: [
        () => console.log('[DEBUG] Entering preparation state')
      ],
      invoke: {
        id: 'generateAIActions',
        src: 'generateAIActionsService',
        input: ({ context }) => context,
        onDone: {
          // AI actions are ready. Store them and set the flag.
          actions: assign({
            unitActions: ({ context, event }) => ({ ...context.unitActions, ...event.output }),
            aiActionsReady: true
          }),
        },
        onError: { target: 'error', actions: 'logAndAssignError' },
      },
      on: {
        SUBMIT_PLAYER_ACTIONS: {
          // Player actions submitted. Store them, set the flag. No immediate transition.
          actions: 'storeAllPlayerActionsAndSetFlag',
        },
      },
      // This transition will fire automatically once both AI and Player actions are ready.
      always: {
        target: 'execution',
        guard: 'areAllActionsReady',
      }
    },
    execution: {
      initial: 'calculatingQueue',
      states: {
        calculatingQueue: {
          entry: assign({
            sortedActionQueue: ({ context }) => {
              const unitsArray = Object.values(context.allUnits);
              const actionsArray = Object.values(context.unitActions);
              const queue = determineActionOrder(unitsArray, actionsArray);
              console.log('[DEBUG] Calculated action queue:', queue);
              return queue;
            }
          }),
          always: { target: 'processingQueue' }
        },
        processingQueue: {
          always: [
            { target: 'executionComplete', guard: ({ context }) => context.sortedActionQueue.length === 0 },
            { target: 'processingQueue', guard: ({ context }) => context.allUnits[context.sortedActionQueue[0].unitId]?.derivedAttributes.currentHp <= 0, actions: 'skipDeadUnitAction' },
            { target: 'animating', actions: 'calculateAndPrepareAnimation' }
          ]
        },
        animating: {
          on: {
            ANIMATION_COMPLETE: [
              { target: '#battleV3.completed', actions: 'applyActionResult', guard: 'isBattleOver' },
              { target: 'processingQueue', actions: 'applyActionResult' }
            ]
          }
        },
        executionComplete: { type: 'final' }
      },
      onDone: {
        target: 'roundEnd',
        actions: assign({
          unitActions: {},
          sortedActionQueue: [],
        })
      },
    },
    roundEnd: {
      invoke: {
        id: 'processRoundEndEffects',
        src: 'processRoundEndEffectsService',
        onDone: { target: 'checkingBattleOver' },
        onError: { target: 'error', actions: 'logAndAssignError' },
      },
    },
    checkingBattleOver: {
      always: [
        { target: 'completed', guard: 'isBattleOver' },
        { target: 'roundStart' },
      ],
    },
    completed: {
      type: 'final',
      entry: assign({
        battleResult: ({ context }) => {
          const livingPlayers = Object.values(context.playerTeam).filter(u => context.allUnits[u.id]?.derivedAttributes.currentHp > 0).length;
          return livingPlayers > 0 ? 'VICTORY' : 'DEFEAT';
        }
      })
    },
    error: {
      on: {
        RESET: 'idle',
      },
    },
  },
}, {
  actions: {
    logAndAssignError: assign({
      error: ({ event }) => {
        console.error("XState Actor Error:", event.data);
        return event.data;
      },
    }),
    initializeBattleContext: assign(({ event }) => {
      if (!event.output) {
        console.error(
          'CRITICAL: `initializeBattleContext` was called without `event.output`. This should not happen after a successful actor invocation.',
          'Event:',
          event
        );
        return {}; // Return empty object to prevent crash
      }
      const allUnits = event.output.allUnits;
      return {
        allUnits,
        playerTeam: event.output.playerTeam,
        enemyTeam: event.output.enemyTeam,
        turnOrder: event.output.turnOrder,
        currentTurn: 0,
        round: 1,
        playerUnits_initial: undefined,
        enemyUnits_initial: undefined,
        unitActions: {}, // Reset actions at the start of battle
        sortedActionQueue: [],
        logs: [],
        aiActionsReady: false,
        playerActionsReady: false,
        displayTurnOrder: calculateDisplayTurnOrder(allUnits),
        completedUnitIdsThisRound: [],
      };
    }),
    storeUnitAction: assign({
      unitActions: ({ context, event }) => ({
        ...context.unitActions,
        [event.payload.unitId]: {
          ...event.payload.action,
          unitId: event.payload.unitId,
        }
      }),
    }),
    storeAllPlayerActionsAndSetFlag: assign({
      unitActions: ({ context, event }) => {
        console.log('[ACTION] Storing all player actions:', event.payload.actions);
        return {
          ...context.unitActions,
          ...event.payload.actions
        };
      },
      playerActionsReady: true
    }),
    calculateAndPrepareAnimation: assign(({ context }) => {
      const { sortedActionQueue, allUnits, logs, skillOverrides } = context;
      const actionToExecute = sortedActionQueue[0];
      const sourceUnit = allUnits[actionToExecute.unitId];
      const targetUnit = allUnits[actionToExecute.target];

      const { animationScript, logicalResult } = generateScriptAndResult(actionToExecute, allUnits, skillOverrides);

      const newLogs = [...logs, { 
        type: 'action', 
        message: `${sourceUnit?.name} 对 ${targetUnit?.name} 施放了技能 【${skillConfig[actionToExecute.type]?.name}】。`
      }];

      return {
        sortedActionQueue: context.sortedActionQueue.slice(1),
        currentActionExecution: { animationScript, logicalResult, unitId: actionToExecute.unitId },
        logs: newLogs,
      };
    }),
    applyActionResult: assign(({ context }) => {
      const { currentActionExecution, allUnits, logs } = context;
      if (!currentActionExecution) return {};

      const { hpChanges } = currentActionExecution.logicalResult;
      let updatedUnits = JSON.parse(JSON.stringify(allUnits)); // Deep copy for safety
      let newLogs = [...logs];
      
      hpChanges.forEach(({ targetId, change }) => {
        const target = updatedUnits[targetId];
        if (target && target.derivedAttributes) {
          const oldHp = target.derivedAttributes.currentHp;
          const newHp = Math.max(0, oldHp + change);
          
          if (change < 0) {
            newLogs.push({ type: 'damage', message: `${target.name} 受到了 ${-change} 点伤害。`});
          } else if (change > 0) {
            newLogs.push({ type: 'heal', message: `${target.name} 恢复了 ${change} 点生命。`});
          }

          if (oldHp > 0 && newHp === 0) {
            newLogs.push({ type: 'death', message: `${target.name} 已被击败！`});
          }
          
          target.derivedAttributes.currentHp = newHp;
        }
      });
      
      return {
        allUnits: updatedUnits,
        logs: newLogs,
        currentActionExecution: null,
        completedUnitIdsThisRound: [...context.completedUnitIdsThisRound, currentActionExecution.unitId],
      };
    }),
    skipDeadUnitAction: assign({
      logs: ({ context }) => {
        const unitName = context.allUnits[context.sortedActionQueue[0].unitId]?.name || '未知单位';
        return [...context.logs, { type: 'info', message: `${unitName} 已经阵亡，跳过其行动。` }];
      },
      sortedActionQueue: ({ context }) => context.sortedActionQueue.slice(1),
    })
  },
  guards: {
    isBattleOver: ({ context }) => {
      const livingPlayers = Object.values(context.playerTeam).filter(u => context.allUnits[u.id]?.derivedAttributes.currentHp > 0).length;
      const livingEnemies = Object.values(context.enemyTeam).filter(u => context.allUnits[u.id]?.derivedAttributes.currentHp > 0).length;
      
      if (livingPlayers === 0 || livingEnemies === 0) {
        // 在这里添加战斗结束的日志
        const result = livingPlayers > 0 ? '胜利' : '失败';
        // This is tricky because we can't modify context directly in a guard.
        // A better place would be in the 'completed' state's entry action.
      }
      return livingPlayers === 0 || livingEnemies === 0;
    },
    areAllActionsSubmitted: ({ context }) => {
      // 只有玩家控制的、且存活的单位需要提交动作
      const playerUnits = Object.values(context.playerTeam).map(u => context.allUnits[u.id]);
      const activePlayerUnits = playerUnits.filter(u => u && u.derivedAttributes.currentHp > 0);
      
      // 如果没有存活的玩家单位，也认为所有动作都已提交
      if (activePlayerUnits.length === 0) {
        return true;
      }

      return activePlayerUnits.every(unit => context.unitActions[unit.id]);
    },
    // This guard is no longer used by a transition, but we'll keep it for potential debugging.
    isActionQueueEmpty: ({ context }) => {
      return context.sortedActionQueue.length === 0;
    },
    areAllActionsReady: ({ context }) => {
      const ready = context.aiActionsReady && context.playerActionsReady;
      if (ready) {
        console.log('[GUARD] All actions are ready. Proceeding to execution.');
      }
      return ready;
    },
  },
  actors: {
    initializeBattle: fromPromise(async ({ input }) => {
      console.log("Actor: Initializing Battle with input:", input);
      const { playerUnits, enemyUnits } = input;
      const allUnits = { ...playerUnits, ...enemyUnits };

      // Add team and other properties to each unit
      Object.values(allUnits).forEach(unit => {
          unit.team = unit.isPlayerUnit ? 'player' : 'enemy';
          unit.derivedAttributes = unit.derivedAttributes || {};
      });

      const initialBattleState = {
        allUnits,
        playerTeam: playerUnits,
        enemyTeam: enemyUnits,
        turnOrder: Object.keys(allUnits), // Simple turn order for now
      };
      console.log("Battle Initialized, returning state:", initialBattleState);
      return initialBattleState;
    }),
    processRoundStartEffectsService: fromPromise(async () => { console.log("Actor: Processing Round START Effects..."); return {}; }),
    processRoundEndEffectsService: fromPromise(async () => { console.log("Actor: Processing Round END Effects..."); return {}; }),
    generateAIActionsService: fromPromise(async ({ input }) => {
      const { allUnits, playerTeam, enemyTeam } = input;
      
      // 调用重构后的AI动作生成函数
      const enemyActions = setEnemyUnitsActions(enemyTeam, playerTeam, allUnits, {}, {});
      
      console.log("Generated AI actions:", enemyActions);
      return enemyActions;
    }),
  },
});
 