/*
 * @Author: Claude
 * @Date: 2025-01-27
 * @LastEditors: Claude
 * @LastEditTime: 2025-01-27
 * @Description: 简化版战斗Redux Slice - 仅保留基本状态管理，战斗逻辑交由独立引擎处理
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { generateUniqueId } from '@/utils/idUtils';
import { selectFormationGrid } from '@/store/slices/formationSlice';
import { summonConfig } from '@/config/config';
import { WORLD_REGIONS, selectEncounterForRegion } from '@/config/map/worldMapConfig.js';
import { calculateSummonStats } from '@/features/battle/logic/summonUtils';

const BATTLE_GRID_ROWS = 3;
const BATTLE_GRID_COLS = 3;

const createEmptyGrid = () => Array(BATTLE_GRID_ROWS).fill(null).map(() => Array(BATTLE_GRID_COLS).fill(null));

// 初始状态 - 简化版
const initialState = {
  // 基本战斗状态
  isActive: false,
  currentPhase: 'idle', // idle, preparation, execution, resolution, battle_over, victory, defeat
  currentRound: 0,
  battleResult: null,
  
  // 战斗单位和阵型
  battleUnits: {},
  playerFormation: createEmptyGrid(),
  enemyFormation: createEmptyGrid(),
  
  // 回合和行动
  turnOrder: [],
  currentTurnUnitId: null,
  unitActions: {},
  
  // 战斗记录和奖励
  battleLog: [],
  rewards: null,
  
  // 控制状态 - 新增
  controlMode: 'redux', // 'redux' | 'engine'
  engineData: null, // 引擎传回的数据
  
  // 错误处理
  error: null,
  isLoading: false
};

// 异步Thunk - 从地图触发战斗（简化版）
export const initiateMapBattleAction = createAsyncThunk(
  'battle/initiateMapBattle',
  async ({ areaId, playerLevel, playerPosition }, { getState, dispatch }) => {
    console.log('[battleSliceSimplified] initiateMapBattleAction called with:', { areaId, playerLevel, playerPosition });

    if (!areaId || playerLevel === undefined) {
      throw new Error('areaId and playerLevel are required to initiate map battle.');
    }

    const state = getState();
    const formationGrid = selectFormationGrid(state);
    
    // 获取玩家召唤兽数据
    const playerSummonsData = [];
    if (formationGrid) {
      for (let r = 0; r < formationGrid.length; r++) {
        for (let c = 0; c < formationGrid[r].length; c++) {
          const summonId = formationGrid[r][c];
          if (summonId) {
            const summonDetails = summonConfig[summonId];
            if (summonDetails) {
              playerSummonsData.push({
                id: summonDetails.id,
                sourceId: summonDetails.summonSourceId,
                name: summonDetails.nickname || summonDetails.name,
                level: summonDetails.level,
                stats: {
                  currentHp: summonDetails.derivedAttributes?.hp || 1,
                  maxHp: summonDetails.derivedAttributes?.hp || 1,
                  currentMp: summonDetails.derivedAttributes?.mp || 0,
                  maxMp: summonDetails.derivedAttributes?.mp || 0,
                  physicalAttack: summonDetails.derivedAttributes?.physicalAttack || 0,
                  magicalAttack: summonDetails.derivedAttributes?.magicalAttack || 0,
                  physicalDefense: summonDetails.derivedAttributes?.physicalDefense || 0,
                  magicalDefense: summonDetails.derivedAttributes?.magicalDefense || 0,
                  speed: summonDetails.derivedAttributes?.speed || 0,
                  critRate: summonDetails.derivedAttributes?.critRate || 0,
                  critDamage: summonDetails.derivedAttributes?.critDamage || 1.5,
                  hitRate: summonDetails.derivedAttributes?.hitRate || 1,
                  dodgeRate: summonDetails.derivedAttributes?.dodgeRate || 0,
                },
                skillSet: summonDetails.skillSet || [],
                isPlayerUnit: true,
                type: 'player_summon',
                spriteAssetKey: summonDetails.spriteAssetKey || summonConfig[summonDetails.summonSourceId]?.sprite,
              });
            }
          }
        }
      }
    }

    if (playerSummonsData.length === 0) {
      throw new Error('No player summons in formation. Cannot initiate battle.');
    }

    // 获取敌方单位数据
    const currentRegion = WORLD_REGIONS[areaId];
    if (!currentRegion) {
      throw new Error(`Region configuration not found for area ${areaId}.`);
    }

    const encounter = selectEncounterForRegion(areaId, playerLevel);
    if (!encounter || !encounter.team || encounter.team.length === 0) {
      throw new Error(`No suitable encounter found for area ${areaId} at level ${playerLevel}.`);
    }

    const enemyUnitsData = [];
    encounter.team.forEach((summonSourceId, index) => {
      const summonTemplate = summonConfig[summonSourceId];
      if (!summonTemplate) {
        console.warn(`Summon template with sourceId ${summonSourceId} not found. Skipping.`);
        return;
      }

      let currentLevel = summonTemplate.defaultLevel || 1;
      if (encounter.summonLevelFixed) {
        currentLevel = encounter.summonLevelFixed;
      } else if (encounter.summonLevelOffset) {
        currentLevel = (summonTemplate.defaultLevel || 1) + encounter.summonLevelOffset;
      }
      currentLevel = Math.max(1, currentLevel);

      const calculatedStats = calculateSummonStats(summonTemplate, currentLevel);
      const enemySummonId = `enemy_summon_${summonSourceId}_${Date.now()}_${index}`;
      
      enemyUnitsData.push({
        id: enemySummonId,
        sourceId: summonSourceId,
        name: summonTemplate.name,
        level: currentLevel,
        stats: calculatedStats,
        skillSet: summonTemplate.skills || [],
        isPlayerUnit: false,
        type: summonTemplate.type || 'unknown_type',
        spriteAssetKey: summonTemplate.sprite,
      });
    });

    if (enemyUnitsData.length === 0) {
      throw new Error('Failed to load any valid enemies from encounter.');
    }

    return {
      playerUnits: playerSummonsData,
      enemyUnits: enemyUnitsData,
      battleConfig: {
        areaId,
        playerLevel,
        playerPosition,
        encounter
      }
    };
  }
);

// 简化版战斗Slice
const battleSlice = createSlice({
  name: 'battle',
  initialState,
  reducers: {
    // 基本状态控制
    setBattleActive: (state, action) => {
      state.isActive = action.payload;
      if (!action.payload) {
        // 重置战斗状态
        state.currentPhase = 'idle';
        state.currentRound = 0;
        state.battleResult = null;
        state.turnOrder = [];
        state.currentTurnUnitId = null;
        state.unitActions = {};
        state.battleLog = [];
        state.controlMode = 'redux';
        state.engineData = null;
      }
    },
    
    setCurrentPhase: (state, action) => {
      state.currentPhase = action.payload;
    },
    
    setCurrentRound: (state, action) => {
      state.currentRound = action.payload;
    },
    
    setBattleResult: (state, action) => {
      state.battleResult = action.payload;
    },
    
    // 单位和阵型管理
    setBattleUnits: (state, action) => {
      state.battleUnits = action.payload;
    },
    
    updateBattleUnit: (state, action) => {
      const { unitId, updates } = action.payload;
      if (state.battleUnits[unitId]) {
        state.battleUnits[unitId] = { ...state.battleUnits[unitId], ...updates };
      }
    },
    
    setPlayerFormation: (state, action) => {
      state.playerFormation = action.payload;
    },
    
    setEnemyFormation: (state, action) => {
      state.enemyFormation = action.payload;
    },
    
    // 回合和行动管理
    setTurnOrder: (state, action) => {
      state.turnOrder = action.payload;
    },
    
    setCurrentTurnUnitId: (state, action) => {
      state.currentTurnUnitId = action.payload;
    },
    
    setUnitAction: (state, action) => {
      const { unitId, action: unitAction } = action.payload;
      state.unitActions[unitId] = unitAction;
    },
    
    clearUnitActions: (state) => {
      state.unitActions = {};
    },
    
    // 战斗日志
    addBattleLog: (state, action) => {
      state.battleLog.push({
        id: generateUniqueId(),
        timestamp: Date.now(),
        ...action.payload
      });
    },
    
    clearBattleLog: (state) => {
      state.battleLog = [];
    },
    
    // 奖励管理
    setRewards: (state, action) => {
      state.rewards = action.payload;
    },
    
    // 控制模式管理 - 新增
    setControlMode: (state, action) => {
      state.controlMode = action.payload;
    },
    
    // 处理引擎控制权转移 - 新增
    transferControlToEngine: (state, action) => {
      const { battleId, timestamp } = action.payload;
      
      state.controlMode = 'engine';
      state.isActive = true; // 激活战斗界面
      state.error = null;
      
      // 重要：不同步战斗数据！UI将直接从引擎获取数据
      // Redux只负责标记战斗状态为活跃，具体数据由引擎独立管理
      
      // 清空Redux中的战斗数据，强制UI从引擎获取
      state.battleUnits = {};
      state.playerFormation = createEmptyGrid();
      state.enemyFormation = createEmptyGrid();
      state.turnOrder = [];
      state.currentTurnUnitId = null;
      state.unitActions = {};
      state.currentPhase = 'engine_controlled'; // 特殊阶段标识
      state.currentRound = 0;
      
      // 添加日志记录控制权转移
      state.battleLog.push({
        id: generateUniqueId(),
        timestamp,
        type: 'system',
        message: `控制权已转移给战斗引擎 (${battleId})，战斗数据由引擎独立管理`
      });
    },
    
    // 引擎数据同步 - 新增
    syncFromEngine: (state, action) => {
      const engineState = action.payload;
      if (engineState && state.controlMode === 'engine') {
        // 从引擎同步关键状态
        state.currentPhase = engineState.currentPhase;
        state.currentRound = engineState.currentRound;
        state.battleResult = engineState.result;
        state.turnOrder = engineState.turnOrder || [];
        state.currentTurnUnitId = engineState.currentTurnUnitId;
        state.battleLog = engineState.battleLog || [];
        
        // 同步单位状态
        if (engineState.battleUnits) {
          Object.keys(engineState.battleUnits).forEach(unitId => {
            if (state.battleUnits[unitId]) {
              state.battleUnits[unitId] = {
                ...state.battleUnits[unitId],
                ...engineState.battleUnits[unitId]
              };
            }
          });
        }
        
        state.engineData = engineState;
      }
    },
    
    // 从引擎接收最终结果 - 新增
    receiveEngineResults: (state, action) => {
      const { battleResult, rewards, finalState } = action.payload;
      
      state.battleResult = battleResult;
      state.rewards = rewards;
      state.currentPhase = battleResult.result === 'victory' ? 'victory' : 'defeat';
      state.isActive = false;
      state.controlMode = 'redux';
      
      // 保存最终状态用于后续处理
      if (finalState) {
        state.engineData = finalState;
      }
    },
    
    // 接收战斗结果（别名）- 新增
    receiveBattleResult: (state, action) => {
      // 直接调用 receiveEngineResults 的逻辑
      const { result, rewards, finalState } = action.payload;
      
      state.battleResult = { result };
      state.rewards = rewards;
      state.currentPhase = result === 'victory' ? 'victory' : 'defeat';
      state.isActive = false;
      state.controlMode = 'redux';
      
      if (finalState) {
        state.engineData = finalState;
      }
      
      // 添加战斗结束日志
      state.battleLog.push({
        id: generateUniqueId(),
        timestamp: Date.now(),
        type: 'system',
        message: `战斗结束: ${result === 'victory' ? '胜利' : '失败'}`
      });
    },
    
    // 错误处理
    setBattleError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    
    clearBattleError: (state) => {
      state.error = null;
    },
    
    // 加载状态
    setBattleLoading: (state, action) => {
      state.isLoading = action.payload;
    }
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(initiateMapBattleAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initiateMapBattleAction.fulfilled, (state, action) => {
        state.isLoading = false;
        
        const { playerUnits, enemyUnits, battleConfig } = action.payload;
        
        // 设置战斗单位
        const battleUnits = {};
        const playerFormation = createEmptyGrid();
        const enemyFormation = createEmptyGrid();
        
        // 放置玩家单位
        playerUnits.forEach((unit, index) => {
          battleUnits[unit.id] = unit;
          const row = Math.floor(index / BATTLE_GRID_COLS);
          const col = index % BATTLE_GRID_COLS;
          if (row < BATTLE_GRID_ROWS) {
            playerFormation[row][col] = unit.id;
          }
        });
        
        // 放置敌方单位
        enemyUnits.forEach((unit, index) => {
          battleUnits[unit.id] = unit;
          const row = Math.floor(index / BATTLE_GRID_COLS);
          const col = index % BATTLE_GRID_COLS;
          if (row < BATTLE_GRID_ROWS) {
            enemyFormation[row][col] = unit.id;
          }
        });
        
        state.battleUnits = battleUnits;
        state.playerFormation = playerFormation;
        state.enemyFormation = enemyFormation;
        state.isActive = true;
        state.currentPhase = 'preparation';
        state.currentRound = 1;
        
        // 添加战斗开始日志
        state.battleLog.push({
          id: generateUniqueId(),
          message: `战斗开始！区域：${battleConfig.areaId}`,
          timestamp: Date.now(),
          type: 'system'
        });
      })
      .addCase(initiateMapBattleAction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        console.error('[battleSliceSimplified] Battle initiation failed:', action.error);
      });
  }
});

// 导出actions
export const {
  setBattleActive,
  setCurrentPhase,
  setCurrentRound,
  setBattleResult,
  setBattleUnits,
  updateBattleUnit,
  setPlayerFormation,
  setEnemyFormation,
  setTurnOrder,
  setCurrentTurnUnitId,
  setUnitAction,
  clearUnitActions,
  addBattleLog,
  clearBattleLog,
  setRewards,
  setControlMode,
  syncFromEngine,
  receiveEngineResults,
  setBattleError,
  clearBattleError,
  setBattleLoading
} = battleSlice.actions;

// 选择器 - 保持与原版兼容
export const selectIsBattleActive = (state) => state.battle.isActive;
export const selectBattleUnits = (state) => state.battle.battleUnits;
export const selectPlayerFormation = (state) => state.battle.playerFormation;
export const selectEnemyFormation = (state) => state.battle.enemyFormation;
export const selectTurnOrder = (state) => state.battle.turnOrder;
export const selectCurrentTurnUnitId = (state) => state.battle.currentTurnUnitId;
export const selectCurrentPhase = (state) => state.battle.currentPhase;
export const selectBattleLog = (state) => state.battle.battleLog;
export const selectRewards = (state) => state.battle.rewards;
export const selectBattleResult = (state) => state.battle.battleResult;
export const selectBattleUnitById = (state, unitId) => state.battle.battleUnits[unitId];
export const selectCurrentRound = (state) => state.battle.currentRound;
export const selectUnitActions = (state) => state.battle.unitActions;
export const selectUnitActionById = (state, unitId) => state.battle.unitActions[unitId];
export const selectAllUnitsHaveActions = (state) => {
  const { battleUnits, unitActions } = state.battle;
  const activeUnits = Object.values(battleUnits).filter(unit => !unit.isDefeated);
  return activeUnits.length > 0 && activeUnits.every(unit => unitActions[unit.id]);
};

// 新增选择器 - 控制模式相关
export const selectControlMode = (state) => state.battle.controlMode;
export const selectEngineData = (state) => state.battle.engineData;
export const selectBattleError = (state) => state.battle.error;
export const selectBattleLoading = (state) => state.battle.isLoading;

export default battleSlice.reducer; 