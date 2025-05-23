import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setEnemyUnitsActions } from '@/features/battle/logic/battleAI';

const BATTLE_GRID_ROWS = 3;
const BATTLE_GRID_COLS = 3;

const createEmptyGrid = () => Array(BATTLE_GRID_ROWS).fill(null).map(() => Array(BATTLE_GRID_COLS).fill(null));

// 创建设置敌方AI行动的异步thunk
export const setEnemyAIActions = createAsyncThunk(
  'battle/setEnemyAIActions',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const { battleUnits, playerFormation, enemyFormation } = state.battle;
    
    // 使用AI逻辑设置敌方单位行动
    const enemyActions = setEnemyUnitsActions(battleUnits, playerFormation, enemyFormation);
    
    // 为每个敌方单位设置行动
    Object.entries(enemyActions).forEach(([unitId, action]) => {
      dispatch(setUnitAction({ unitId, action }));
      
      // 添加战斗日志
      dispatch(addBattleLog({
        message: `${battleUnits[unitId].name} 准备了 ${action.actionType === 'attack' ? '攻击' : action.actionType === 'defend' ? '防御' : '技能'} 行动`,
        timestamp: Date.now(),
        unitId: unitId
      }));
    });
    
    return enemyActions;
  }
);

const initialState = {
  isActive: false, // 战斗是否正在进行
  battleId: null, // 当前战斗的唯一ID
  
  // 参与者信息
  // playerId: null, // 可选，如果需要关联特定玩家
  // enemyEncounterId: null, // 可选，用于标识预设的敌人遭遇配置

  // 战斗单元存储 (key: battleUnitId, value: BattleUnit object)
  // BattleUnit 对象将包含: id, sourceId (原始召唤兽ID或敌人模板ID), isPlayerUnit, name, level,
  // currentHp, maxHp, currentMp, maxMp, stats (atk, def, spd, etc.), skills, statusEffects,
  // gridPosition ({ team: 'player'|'enemy', row, col }), spriteAssetKey, isDefeated
  battleUnits: {}, 

  // 阵型 (存储 battleUnitId)
  playerFormation: createEmptyGrid(), // 玩家方3x3网格
  enemyFormation: createEmptyGrid(),  // 敌对方3x3网格

  // 回合和行动逻辑
  turnOrder: [], // battleUnitId 数组，表示行动顺序
  currentTurnUnitId: null, // 当前行动的单位ID
  currentPhase: 'idle', // 战斗阶段: 'idle', 'preparation', 'execution', 'awaiting_final_animation', 'battle_over', 'victory', 'defeat'
  currentRound: 1, // 当前回合数
  
  // 单位行动指令
  unitActions: {}, // 格式: { unitId: { actionType: 'attack'|'defend'|'skill', targetIds: [], skillId: null } }
  
  // 玩家输入和行动
  selectedSkillId: null,
  selectedTargetIds: [], // 可能是单个ID或多个ID

  // 战斗日志和结果
  battleLog: [], // { turn: number, unitId: string, action: string, result: string, timestamp: number }
  rewards: null, // { experience: number, items: [{ itemId: string, quantity: number }], currency: number }
  battleResult: null, // 'victory' 或 'defeat'

  // UI 相关的状态 (可选，也可以在组件内部管理)
  // showSkillMenu: false,
  // showTargetSelector: false,
};

const battleSlice = createSlice({
  name: 'battle',
  initialState,
  reducers: {
    // 初始化战斗
    setupBattle: (state, action) => {
      // payload: { battleId, playerTeam: [summonId1, ...], enemyTeam: [enemyTemplateId1, ...], playerInitialFormation, enemyInitialFormation }
      // 1. 设置 isActive = true, battleId
      // 2. 根据 playerTeam 和 enemyTeam 创建 BattleUnit 对象，存入 battleUnits
      //    - 玩家召唤兽: 从 summonSlice 获取数据，转换成 BattleUnit 结构
      //    - 敌人单位: 从 enemyConfig (需要创建) 获取数据，生成 BattleUnit 结构
      // 3. 初始化 playerFormation 和 enemyFormation，填入 battleUnitId
      // 4. 计算初始 turnOrder (通常基于速度)
      state.isActive = true;
      state.battleId = action.payload.battleId;
      state.battleUnits = action.payload.battleUnits; // 假设外部逻辑已准备好 battleUnits
      state.playerFormation = action.payload.playerFormation;
      state.enemyFormation = action.payload.enemyFormation;
      state.turnOrder = action.payload.turnOrder;
      state.currentRound = 1; // 设置初始回合为1
      state.unitActions = {}; // 初始化空的行动对象
      state.currentPhase = 'preparation'; // 进入准备阶段
      state.battleLog = [{ 
        message: '战斗开始！', 
        timestamp: Date.now() 
      }, { 
        message: `回合 ${state.currentRound} - 准备阶段开始！请为所有单位分配行动指令。`, 
        timestamp: Date.now() + 1,
        round: state.currentRound,
        phase: 'preparation'
      }];
      state.rewards = null;
    },

    // 单位行动 (例如，使用技能)
    unitPerformAction: (state, action) => {
      // payload: { unitId: string, actionType: 'skill'|'item', skillId?: string, itemId?: string, targetIds: string[] }
      // 1. 验证行动是否合法 (轮到该单位行动? MP足够? etc.)
      // 2. 根据 actionType, skillId/itemId, targetIds 计算伤害/效果
      // 3. 更新目标单位的 HP, statusEffects 等 (在 battleUnits 中)
      // 4. 添加战斗日志
      // 5. 检查战斗是否结束 (一方全部defeated)
      // 6. 如果未结束，进入下一个回合或阶段 (e.g., 'action_resolution' 后到 'next_turn_calculation')
      const { unitId, actionType, skillId, targetIds } = action.payload;
      // ... (此处应有详细的行动处理逻辑)
      state.battleLog.push({ message: `${unitId} 对 ${targetIds.join(', ')} 使用了 ${skillId || actionType}` });
      // 假设行动后进入下一回合的准备阶段
      state.currentPhase = 'action_resolution'; 
    },
    
    // 结束行动，计算下一个行动者
    resolveActionAndProceed: (state) => {
        // 1. 检查是否有单位死亡，更新 isDefeated
        // 2. 检查胜利/失败条件
        //    - 如果胜利，currentPhase = 'victory', 计算 rewards
        //    - 如果失败，currentPhase = 'defeat'
        // 3. 如果战斗继续，确定下一个行动者
        //    - 从 turnOrder 中找到下一个未被击败的单位
        //    - 更新 currentTurnUnitId
        //    - 设置 currentPhase 为 'player_input' (如果是我方) 或 'enemy_turn' (如果是敌方)
        // Example:
        // const currentIdx = state.turnOrder.findIndex(id => id === state.currentTurnUnitId);
        // let nextIdx = (currentIdx + 1) % state.turnOrder.length;
        // while (state.battleUnits[state.turnOrder[nextIdx]].isDefeated) {
        //   nextIdx = (nextIdx + 1) % state.turnOrder.length;
        //   // Add check to prevent infinite loop if all defeated
        // }
        // state.currentTurnUnitId = state.turnOrder[nextIdx];
        // state.currentPhase = state.battleUnits[state.currentTurnUnitId].isPlayerUnit ? 'player_input' : 'enemy_turn';
    },

    // 玩家选择技能
    playerSelectSkill: (state, action) => {
      // payload: { skillId: string }
      state.selectedSkillId = action.payload.skillId;
      state.selectedTargetIds = []; // 清空目标，等待选择
      state.currentPhase = 'player_target_selection';
    },

    // 玩家选择目标
    playerSelectTargets: (state, action) => {
      // payload: { targetIds: string[] }
      state.selectedTargetIds = action.payload.targetIds;
      // 可以在这里直接触发 unitPerformAction，或者让UI组件在确认后再dispatch
      state.currentPhase = 'player_action_confirm'; // 等待玩家确认行动
    },
    
    // 清理战斗状态
    endBattle: (state) => {
      return initialState; // 重置为初始状态
    },
    
    // 更新单位状态 (例如，HP变化，状态效果)
    updateBattleUnit: (state, action) => {
      // payload: { unitId: string, changes: Partial<BattleUnit> }
      const { unitId, changes } = action.payload;
      if (state.battleUnits[unitId]) {
        state.battleUnits[unitId] = { ...state.battleUnits[unitId], ...changes };
        if (changes.currentHp <= 0) {
            state.battleUnits[unitId].currentHp = 0;
            state.battleUnits[unitId].isDefeated = true;
            state.battleLog.push({ 
              message: `${state.battleUnits[unitId].name} 被击败了！`,
              timestamp: Date.now() 
            });
            
            // 检查战斗是否结束
            const playerUnits = Object.values(state.battleUnits).filter(unit => unit.isPlayerUnit);
            const enemyUnits = Object.values(state.battleUnits).filter(unit => !unit.isPlayerUnit);
            
            const allPlayerDefeated = playerUnits.every(unit => unit.isDefeated);
            const allEnemyDefeated = enemyUnits.every(unit => unit.isDefeated);
            
            if (allPlayerDefeated || allEnemyDefeated) {
              state.currentPhase = 'awaiting_final_animation';
              // Actual resolution will happen in finalizeBattleResolution
            }
        }
      }
    },
    
    addBattleLog: (state, action) => {
        // payload: string (message) or object with more details
        if (typeof action.payload === 'string') {
            state.battleLog.push({ message: action.payload, timestamp: Date.now() });
        } else {
            state.battleLog.push({ ...action.payload, timestamp: Date.now() });
        }
    },
    
    // 设置单位行动
    setUnitAction: (state, action) => {
      // payload: { unitId, action: { actionType, targetIds, skillId } }
      const { unitId, action: unitAction } = action.payload;
      state.unitActions[unitId] = unitAction;
      
      // 检查是否所有非出局单位都有行动
      const allUnitsHaveActions = Object.keys(state.battleUnits)
        .filter(id => !state.battleUnits[id].isDefeated)
        .every(id => state.unitActions[id]);
      
      if (allUnitsHaveActions) {
        state.battleLog.push({ message: '所有单位已准备就绪，即将进入执行阶段！', timestamp: Date.now() });
      }
    },
    
    // 开始准备阶段
    startPreparationPhase: (state) => {
      state.currentPhase = 'preparation';
      state.unitActions = {}; // 清空上一回合的行动
      
      // 注意：敌方AI行动设置已移动到setEnemyAIActions异步thunk中
      // 这里只添加战斗日志
      state.battleLog.push({ 
        message: `【回合 ${state.currentRound}】准备阶段开始！请为所有玩家单位分配行动指令。`, 
        timestamp: Date.now(),
        round: state.currentRound,
        phase: 'preparation'
      });
    },
    
    // 开始执行阶段
    startExecutionPhase: (state) => {
      state.currentPhase = 'execution';
      
      // 根据速度排序行动顺序
      state.turnOrder = Object.keys(state.unitActions)
        .filter(id => !state.battleUnits[id].isDefeated)
        .sort((a, b) => state.battleUnits[b].stats.speed - state.battleUnits[a].stats.speed);
      
      state.currentTurnUnitId = state.turnOrder[0] || null;
      
      state.battleLog.push({ 
        message: `【回合 ${state.currentRound}】执行阶段开始！单位将按速度依次执行行动。`, 
        timestamp: Date.now(),
        round: state.currentRound,
        phase: 'execution'
      });
    },
    
    // 执行当前单位的行动
    executeAction: (state) => {
      const unitId = state.currentTurnUnitId;
      if (!unitId || !state.unitActions[unitId]) return;
      
      const unit = state.battleUnits[unitId];
      const action = state.unitActions[unitId];
      
      if (unit.isDefeated) {
        // 如果单位已经被击败，跳过其行动
        state.battleLog.push({
          message: `${unit.name} 已经被击败，无法行动。`,
          timestamp: Date.now(),
          unitId
        });
        return;
      }
      
      // 根据行动类型执行不同的逻辑
      switch (action.actionType) {
        case 'attack': {
          if (!action.targetIds || action.targetIds.length === 0) break;
          
          let targetId = action.targetIds[0];
          let target = state.battleUnits[targetId];
          
          // 如果目标已经死亡，尝试自动选择新目标
          if (!target || target.isDefeated) {
            // 确定目标队伍（玩家或敌人）
            const isTargetingPlayer = state.playerFormation.flat().filter(id => id).includes(targetId);
            const targetFormation = isTargetingPlayer ? state.playerFormation : state.enemyFormation;
            
            // 尝试找到一个活着的目标
            const aliveTargets = targetFormation.flat()
              .filter(id => id && state.battleUnits[id] && !state.battleUnits[id].isDefeated);
            
            if (aliveTargets.length > 0) {
              // 随机选择一个新目标
              targetId = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
              target = state.battleUnits[targetId];
              
              state.battleLog.push({
                message: `${unit.name} 的原目标已经被击败，自动切换攻击目标为 ${target.name}。`,
                timestamp: Date.now(),
                unitId
              });
            } else {
              state.battleLog.push({
                message: `${unit.name} 的目标已经被击败，且找不到新目标，攻击无效。`,
                timestamp: Date.now(),
                unitId
              });
              break;
            }
          }
          
          // 计算伤害
          const baseDamage = unit.stats.attack - target.stats.defense * 0.5;
          const damage = Math.max(Math.floor(baseDamage * (0.9 + Math.random() * 0.2)), 1);
          
          // 应用伤害
          target.stats.currentHp = Math.max(target.stats.currentHp - damage, 0);
          
          // 检查目标是否被击败
          if (target.stats.currentHp <= 0) {
            target.isDefeated = true;
            state.battleLog.push({
              message: `${unit.name} 攻击了 ${target.name}，造成 ${damage} 点伤害，${target.name} 被击败！`,
              timestamp: Date.now(),
              unitId,
              targetId
            });
          } else {
            state.battleLog.push({
              message: `${unit.name} 攻击了 ${target.name}，造成 ${damage} 点伤害。`,
              timestamp: Date.now(),
              unitId,
              targetId
            });
          }
          break;
        }
        
        case 'defend': {
          // 增加防御状态效果
          const defenseBonus = Math.floor(unit.stats.defense * 0.3);
          unit.stats.defense += defenseBonus;
          
          // 添加状态效果，在回合结束时移除
          unit.statusEffects.push({
            id: `defend-${Date.now()}`,
            name: '防御姿态',
            type: 'buff',
            stat: 'defense',
            value: defenseBonus,
            duration: 1, // 持续1回合
            description: `防御力提高 ${defenseBonus} 点`
          });
          
          state.battleLog.push({
            message: `${unit.name} 进入防御姿态，防御力临时提高 ${defenseBonus} 点。`,
            timestamp: Date.now(),
            unitId
          });
          break;
        }
        
        case 'skill': {
          if (!action.targetIds || action.targetIds.length === 0 || !action.skillId) break;
          
          let targetId = action.targetIds[0];
          let target = state.battleUnits[targetId];
          
          // 如果目标已经死亡，尝试自动选择新目标
          if (!target || target.isDefeated) {
            // 确定目标队伍（玩家或敌人）
            const isTargetingPlayer = state.playerFormation.flat().filter(id => id).includes(targetId);
            const targetFormation = isTargetingPlayer ? state.playerFormation : state.enemyFormation;
            
            // 尝试找到一个活着的目标
            const aliveTargets = targetFormation.flat()
              .filter(id => id && state.battleUnits[id] && !state.battleUnits[id].isDefeated);
            
            if (aliveTargets.length > 0) {
              // 随机选择一个新目标
              targetId = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
              target = state.battleUnits[targetId];
              
              state.battleLog.push({
                message: `${unit.name} 的原目标已经被击败，自动切换技能目标为 ${target.name}。`,
                timestamp: Date.now(),
                unitId
              });
            } else {
              state.battleLog.push({
                message: `${unit.name} 的目标已经被击败，且找不到新目标，技能使用无效。`,
                timestamp: Date.now(),
                unitId
              });
              break;
            }
          }
          
          // 简单技能逻辑 - 消耗MP并造成更高伤害
          const mpCost = 10;
          if (unit.stats.currentMp < mpCost) {
            state.battleLog.push({
              message: `${unit.name} 法力不足，无法使用技能。`,
              timestamp: Date.now(),
              unitId
            });
            break;
          }
          
          // 消耗MP
          unit.stats.currentMp -= mpCost;
          
          // 计算技能伤害
          const baseDamage = (unit.stats.attack * 1.5) - (target.stats.defense * 0.3);
          const damage = Math.max(Math.floor(baseDamage * (0.9 + Math.random() * 0.2)), 1);
          
          // 应用伤害
          target.stats.currentHp = Math.max(target.stats.currentHp - damage, 0);
          
          // 检查目标是否被击败
          if (target.stats.currentHp <= 0) {
            target.isDefeated = true;
            state.battleLog.push({
              message: `${unit.name} 对 ${target.name} 使用了技能，消耗 ${mpCost} 点法力，造成 ${damage} 点伤害，${target.name} 被击败！`,
              timestamp: Date.now(),
              unitId,
              targetId
            });
          } else {
            state.battleLog.push({
              message: `${unit.name} 对 ${target.name} 使用了技能，消耗 ${mpCost} 点法力，造成 ${damage} 点伤害。`,
              timestamp: Date.now(),
              unitId,
              targetId
            });
          }
          break;
        }
        
        default:
          state.battleLog.push({
            message: `${unit.name} 执行了未知行动 ${action.actionType}。`,
            timestamp: Date.now(),
            unitId
          });
      }
      
      // 战斗结算逻辑已移至endRound函数，确保攻击动画有足够时间播放完成
    },
    
    // 进入下一个单位的回合
    nextTurn: (state) => {
      // 从turnOrder中移除当前单位
      const currentIndex = state.turnOrder.indexOf(state.currentTurnUnitId);
      if (currentIndex !== -1) {
        state.turnOrder.splice(currentIndex, 1);
      }
      
      // 如果还有单位等待行动
      if (state.turnOrder.length > 0) {
        state.currentTurnUnitId = state.turnOrder[0];
        state.battleLog.push({
          message: `轮到 ${state.battleUnits[state.currentTurnUnitId].name} 行动。`,
          timestamp: Date.now(),
          unitId: state.currentTurnUnitId
        });
      } else {
        // 所有单位都行动完毕，调用endRound函数结束回合
        // 这样可以确保战斗结算逻辑在回合结束时触发
        battleSlice.caseReducers.endRound(state);
      }
    },
    
    // 结束当前回合
    endRound: (state) => {
      // 处理状态效果
      Object.values(state.battleUnits).forEach(unit => {
        // 减少状态效果持续时间并移除过期效果
        if (unit.statusEffects && unit.statusEffects.length > 0) {
          const expiredEffects = [];
          
          unit.statusEffects = unit.statusEffects.filter(effect => {
            if (effect.duration <= 1) {
              expiredEffects.push(effect);
              return false;
            }
            effect.duration -= 1;
            return true;
          });
          
          // 移除过期效果的影响
          expiredEffects.forEach(effect => {
            if (effect.stat && effect.value) {
              unit.stats[effect.stat] -= effect.value;
              state.battleLog.push({
                message: `${unit.name} 的 ${effect.name} 效果已消失。`,
                timestamp: Date.now(),
                unitId: unit.id
              });
            }
          });
        }
      });
      
      // 检查战斗是否结束
      const allPlayerUnitsDefeated = state.playerFormation.flat()
        .filter(id => id)
        .every(id => state.battleUnits[id].isDefeated);
      
      const allEnemyUnitsDefeated = state.enemyFormation.flat()
        .filter(id => id)
        .every(id => state.battleUnits[id].isDefeated);
      
      if (allPlayerUnitsDefeated) {
        state.battleResult = 'defeat';
        state.currentPhase = 'battle_end';
        state.battleLog.push({
          message: `战斗结束！你的队伍被击败了。`,
          timestamp: Date.now(),
          phase: 'battle_end'
        });
      } else if (allEnemyUnitsDefeated) {
        state.battleResult = 'victory';
        state.currentPhase = 'battle_end';
        state.battleLog.push({
          message: `战斗结束！你的队伍获得了胜利！`,
          timestamp: Date.now(),
          phase: 'battle_end'
        });
      } else {
        // 战斗未结束，当前回合的执行阶段结束，进入下一回合
        state.battleLog.push({ 
          message: `【回合 ${state.currentRound}】执行阶段结束！`, 
          timestamp: Date.now(),
          round: state.currentRound,
          phase: 'end'
        });
        
        // 增加回合数，进入下一回合
        state.currentRound += 1;
        state.unitActions = {}; // 清空行动
        
        // 自动进入下一回合的准备阶段
        state.currentPhase = 'preparation';
        state.battleLog.push({ 
          message: `【回合 ${state.currentRound}】准备阶段开始！请为所有玩家单位分配行动指令。`, 
          timestamp: Date.now(),
          round: state.currentRound,
          phase: 'preparation'
        });
      }
    }
  },
});

export const {
  setupBattle,
  unitPerformAction,
  resolveActionAndProceed,
  playerSelectSkill,
  playerSelectTargets,
  endBattle,
  updateBattleUnit,
  addBattleLog,
  setUnitAction,
  startPreparationPhase,
  startExecutionPhase,
  executeAction,
  finalizeBattleResolution,
  nextTurn,
  endRound,
} = battleSlice.actions;

// Selectors
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

// 新增回合相关的selector
export const selectCurrentRound = (state) => state.battle.currentRound;
export const selectUnitActions = (state) => state.battle.unitActions;
export const selectUnitActionById = (state, unitId) => state.battle.unitActions[unitId];
export const selectAllUnitsHaveActions = (state) => {
  const { battleUnits, unitActions, playerFormation } = state.battle;
  
  // 只检查玩家单位是否都有行动
  const playerUnitIds = playerFormation.flat().filter(id => id);
  
  return playerUnitIds
    .filter(id => !battleUnits[id].isDefeated) // 排除已击败的单位
    .every(id => unitActions[id]); // 检查每个单位是否都有行动
};

export default battleSlice.reducer;