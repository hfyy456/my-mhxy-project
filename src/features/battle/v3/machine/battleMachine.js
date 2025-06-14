import { createMachine, assign, fromPromise } from 'xstate';
import { determineActionOrder } from '../logic/turnOrder';
import { calculateBattleDamage } from '../logic/damageCalculation';
import { setEnemyUnitsActions } from '../logic/battleAI';
import { skills as skillConfig } from '../logic/skillConfig';

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
  if (!primaryTarget || primaryTarget.stats.currentHp <= 0) {
    console.log(`[TARGET] Original target ${targetId} for ${source.id} is invalid. Finding new target...`);
    
    // Find the opposing team
    const opponentTeamIds = Object.keys(allUnits).filter(id => allUnits[id].isPlayerUnit !== source.isPlayerUnit);
    const livingOpponents = opponentTeamIds.filter(id => allUnits[id].stats.currentHp > 0).map(id => allUnits[id]);

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
        const pAtk = source.stats.physicalAttack || 0;
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
    allUnits: {},
    currentRound: 0,
    unitActions: {},
    sortedActionQueue: [],
    currentActionExecution: null, // This will now store { animationScript, logicalResult }
    battleResult: null,
    error: null,
    logs: [],
    skillOverrides: null, // To hold temporary skill data for preview
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
        assign({ currentRound: ({ context }) => context.currentRound + 1 }),
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
      invoke: {
        id: 'generateAIActions',
        src: 'generateAIActionsService',
        input: ({ context }) => context,
        onDone: {
          actions: assign({
            unitActions: ({ context, event }) => ({
              ...context.unitActions,
              ...event.output,
            }),
          }),
        },
        onError: { target: 'error', actions: 'logAndAssignError' },
      },
      always: [
        {
          target: 'execution',
          guard: 'areAllActionsSubmitted',
        }
      ],
      on: {
        SUBMIT_ACTION: {
          actions: 'storeUnitAction',
        },
        FORCE_EXECUTION: {
          target: 'execution',
        }
      },
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
            { target: 'processingQueue', guard: ({ context }) => context.allUnits[context.sortedActionQueue[0].unitId]?.stats.currentHp <= 0, actions: 'skipDeadUnitAction' },
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
          const livingPlayers = Object.values(context.playerTeam).filter(u => context.allUnits[u.id]?.stats.currentHp > 0).length;
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
      return {
        allUnits: event.output.allUnits,
        playerTeam: event.output.playerTeam,
        enemyTeam: event.output.enemyTeam,
        turnOrder: event.output.turnOrder,
        currentTurn: 0,
        round: 1,
        playerUnits_initial: undefined,
        enemyUnits_initial: undefined,
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
    calculateAndPrepareAnimation: assign(({ context }) => {
      const { sortedActionQueue, allUnits, logs, skillOverrides } = context;
      const actionToExecute = sortedActionQueue[0];
      
      const { animationScript, logicalResult } = generateScriptAndResult(actionToExecute, allUnits, skillOverrides);

      const newLogs = [...logs, `[SCRIPT] Generated script for action:`, actionToExecute];

      return {
        sortedActionQueue: context.sortedActionQueue.slice(1),
        currentActionExecution: { animationScript, logicalResult },
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
        if (target) {
          const newHp = Math.max(0, target.stats.currentHp + change);
          newLogs.push(`[APPLY] Applying ${change} HP to ${target.name}. New HP: ${newHp}`);
          target.stats.currentHp = newHp;
        }
      });
      
      return {
        allUnits: updatedUnits,
        logs: newLogs,
        currentActionExecution: null,
      };
    }),
    skipDeadUnitAction: assign({
      logs: ({ context }) => [...context.logs, `[SKIP] Skipping action for defeated unit ${context.sortedActionQueue[0].unitId}`],
      sortedActionQueue: ({ context }) => context.sortedActionQueue.slice(1),
    })
  },
  guards: {
    isBattleOver: ({ context }) => {
      const playerUnitIds = Object.keys(context.playerTeam);
      const enemyUnitIds = Object.keys(context.enemyTeam);
      const livingPlayers = playerUnitIds.filter(id => context.allUnits[id]?.stats.currentHp > 0).length;
      const livingEnemies = enemyUnitIds.filter(id => context.allUnits[id]?.stats.currentHp > 0).length;
      return livingPlayers === 0 || livingEnemies === 0;
    },
    areAllActionsSubmitted: ({ context }) => {
      const activeUnits = Object.values(context.allUnits).filter(u => u.stats.currentHp > 0);
      return activeUnits.every(unit => context.unitActions[unit.id]);
    },
    // This guard is no longer used by a transition, but we'll keep it for potential debugging.
    isActionQueueEmpty: ({ context }) => {
      return context.sortedActionQueue.length === 0;
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
          unit.stats = unit.stats || {};
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
    generateAIActionsService: fromPromise(async ({ input: context }) => {
      console.log("Actor: Generating AI Actions...");
      const { allUnits } = context;

      // 这里的阵型信息暂时用空数组，未来可以从 context 中获取
      const playerFormation = [];
      const enemyFormation = [];
      
      const enemyActions = setEnemyUnitsActions(allUnits, playerFormation, enemyFormation, {}, {});
      
      console.log("Generated AI actions:", enemyActions);
      return enemyActions;
    }),
  },
});
 