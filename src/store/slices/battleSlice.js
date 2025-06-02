import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setEnemyUnitsActions } from '@/features/battle/logic/battleAI';
import { 
  removeBuff, 
  clearAllBuffs, 
  processBuffsOnTurnStart, 
  processBuffsOnTurnEnd,
  canUnitAct,
  canUnitUseSkill,
  canUnitBeTargeted,
  calculateModifiedAttribute,
  processReflectDamage
} from '@/features/battle/logic/buffManager';
import { DAMAGE_CONSTANTS } from '@/config/system/combatConfig';
import { passiveSkillConfig } from '@/config/skill/passiveSkillConfig';
import { activeSkillConfig } from '@/config/skill/activeSkillConfig';
import { buffConfig } from '@/config/skill/buffConfig';
import * as buffManager from '@/features/battle/logic/buffManager';
import { calculateBattleDamage } from '@/features/battle/logic/damageCalculation';
import { 
  triggerPassiveSkillEffects, 
  applyPermanentPassiveBuffs, 
  applyPassiveSkillDamageModifiers,
  processPassiveSkillDodge,
  initializePassiveSkills
} from '@/features/battle/logic/passiveSkillSystem';
import { summonConfig } from '@/config/config'; // 导入召唤兽配置
import { WORLD_REGIONS, selectEncounterForRegion } from '@/config/map/worldMapConfig.js'; // 导入世界区域和遭遇选择配置
import { calculateSummonStats } from '@/features/battle/logic/summonUtils'; // 导入召唤兽属性计算函数
import { generateUniqueId } from '@/utils/idUtils'; // 导入标准ID生成函数
import { calculateRewards } from '@/features/battle/logic/battleRewards'; // 导入奖励计算函数
import rewardManager from '@/store/RewardManager'; // 导入奖励管理器
import { selectFormationGrid } from '@/store/slices/formationSlice'; // 导入阵型选择器
import { selectSummonById } from '@/store/slices/summonSlice'; // 导入召唤兽选择器

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

// 新的异步 Thunk，用于从地图触发战斗
export const initiateMapBattleAction = createAsyncThunk(
  'battle/initiateMapBattle',
  async ({ areaId, playerLevel, playerPosition }, { getState, dispatch }) => {
    console.log('[battleSlice] initiateMapBattleAction called with:', { areaId, playerLevel, playerPosition });

    if (!areaId || playerLevel === undefined) {
      console.error('[battleSlice] initiateMapBattleAction requires areaId and playerLevel.');
      throw new Error('areaId and playerLevel are required to initiate map battle.');
    }

    const state = getState();
    const formationGrid = selectFormationGrid(state);
    const playerSummonsData = [];

    if (formationGrid) {
      for (let r = 0; r < formationGrid.length; r++) {
        for (let c = 0; c < formationGrid[r].length; c++) {
          const summonId = formationGrid[r][c];
          if (summonId) {
            const summonDetails = selectSummonById(state, summonId);
            if (summonDetails) {
              // 将 summonDetails 转换为 BattleUnit 结构
              // 注意: 这里的属性映射需要根据 summonDetails 和 BattleUnit 的实际结构进行调整
              playerSummonsData.push({
                id: summonDetails.id, // battleUnitId 通常与 summonId 相同
                sourceId: summonDetails.summonSourceId, // 原始模板ID
                name: summonDetails.nickname || summonDetails.name, // 优先使用昵称
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
                skillSet: summonDetails.skillSet || [], // 确保技能列表存在
                isPlayerUnit: true,
                type: summonDetails.race || 'player_summon', // 使用召唤兽的种族或通用类型
                spriteAssetKey: summonDetails.spriteAssetKey || summonConfig[summonDetails.summonSourceId]?.sprite, // 战斗单位的精灵图
                // 确保 gridPosition 在后续步骤中正确设置
              });
            }
          }
        }
      }
    }

    if (playerSummonsData.length === 0) {
      const errorMsg = '[battleSlice] Critical: Attempted to initiate map battle with no player summons in formation. Aborting battle setup.';
      console.error(errorMsg);
      // Optionally, dispatch an action to show a more user-facing error, though UI should prevent this.
      // For example: dispatch(showGlobalErrorNotificationAction(errorMsg));
      return; // Abort battle setup
    }
    const playerParty = playerSummonsData; // 使用从 store 获取的数据

    let enemyUnitsData = [];
    const currentRegion = WORLD_REGIONS[areaId];

    if (!currentRegion) {
      console.error(`[battleSlice] Region with areaId: ${areaId} not found in WORLD_REGIONS.`);
      throw new Error(`Region configuration not found for area ${areaId}.`);
    }

    const regionEncounterConfig = currentRegion.encounterConfig;
    const encounter = selectEncounterForRegion(regionEncounterConfig, playerLevel);

    if (!encounter || !encounter.team || encounter.team.length === 0) {
      console.warn(`[battleSlice] No suitable encounter found for areaId: ${areaId} and playerLevel: ${playerLevel}. Aborting battle setup.`);
      // TODO: Decide how to handle no encounters: throw error, or skip battle, or use a default placeholder enemy.
      // For now, let's throw an error to make it clear during development.
      throw new Error(`No suitable encounter found for area ${areaId} at level ${playerLevel}.`);
    }

    console.log('[battleSlice] Selected encounter:', encounter);

    encounter.team.forEach((summonSourceId, index) => {
      const summonTemplate = summonConfig[summonSourceId];
      if (!summonTemplate) {
        console.warn(`[battleSlice] Summon template with sourceId ${summonSourceId} not found in summonConfig. Skipping this enemy.`);
        return; // Skip this summon if template not found
      }

      let currentLevel = summonTemplate.defaultLevel || 1;
      if (encounter.summonLevelFixed) {
        currentLevel = encounter.summonLevelFixed;
      } else if (encounter.summonLevelOffset) {
        currentLevel = (summonTemplate.defaultLevel || 1) + encounter.summonLevelOffset;
      } else if (encounter.summonLevelOverride && encounter.summonLevelOverride.min && encounter.summonLevelOverride.max) {
        currentLevel = Math.floor(Math.random() * (encounter.summonLevelOverride.max - encounter.summonLevelOverride.min + 1)) + encounter.summonLevelOverride.min;
      }
      currentLevel = Math.max(1, currentLevel); // Ensure level is at least 1

      const calculatedStats = calculateSummonStats(summonTemplate, currentLevel);

      const enemySummonId = `enemy_summon_${summonSourceId}_${Date.now()}_${index}`; // Ensure more unique ID
      enemyUnitsData.push({
        id: enemySummonId,
        sourceId: summonSourceId,
        name: summonTemplate.name,
        level: currentLevel,
        stats: calculatedStats, // Use dynamically calculated stats
        skillSet: summonTemplate.skills || [],
        isPlayerUnit: false,
        type: summonTemplate.type || 'unknown_type', // Use PET_TYPES from summonConfig
        spriteAssetKey: summonTemplate.sprite,
      });
    });

    if (enemyUnitsData.length === 0) {
      console.error(`[battleSlice] Failed to load any valid enemies from encounter for areaId: ${areaId}. Check areaEncounterConfig and summonConfig.`);
      throw new Error('Failed to load any valid enemies from encounter.');
    }

    // 创建 battleUnits 对象
    const battleUnits = {};
    playerParty.forEach((unit, index) => {
      const unitId = unit.id; // unit.id 应该已经是唯一的 summonId
      battleUnits[unitId] = {
        ...unit, // unit 已经是转换后的 BattleUnit 结构
        // gridPosition 将在下面的 playerFormation/enemyFormation 循环中正确设置
        statusEffects: [], // 初始化状态效果
        isDefeated: false,
      };
    });
    enemyUnitsData.forEach((unit, index) => {
      const unitId = unit.id || `enemy_${index}`;
      battleUnits[unitId] = {
        ...unit,
        id: unitId, // 确保有ID
        gridPosition: { team: 'enemy', row: Math.floor(index / BATTLE_GRID_COLS), col: index % BATTLE_GRID_COLS }, // 简易阵型
        statusEffects: [], // 初始化状态效果
        isDefeated: false,
      };
    });

    // 阵型 (简单占位)
    const playerFormation = createEmptyGrid(); // 使用 slice 内的函数
    const enemyFormation = createEmptyGrid();

    // 根据 formationGrid 填充 playerFormation
    if (formationGrid) {
      for (let r = 0; r < formationGrid.length; r++) {
        for (let c = 0; c < formationGrid[r].length; c++) {
          const summonIdInFormation = formationGrid[r][c];
          if (summonIdInFormation && battleUnits[summonIdInFormation]) {
            playerFormation[r][c] = summonIdInFormation;
            // 更新 battleUnits 中对应单位的 gridPosition
            battleUnits[summonIdInFormation].gridPosition = { team: 'player', row: r, col: c };
          } else {
            playerFormation[r][c] = null;
          }
        }
      }
    } else {
      // 如果 formationGrid 不存在，则按顺序填充（作为后备）
      playerParty.forEach((unit, index) => {
          const unitId = unit.id;
          const row = Math.floor(index / BATTLE_GRID_COLS);
          const col = index % BATTLE_GRID_COLS;
          if (row < BATTLE_GRID_ROWS && col < BATTLE_GRID_COLS) {
              playerFormation[row][col] = unitId;
              if (battleUnits[unitId]) {
                battleUnits[unitId].gridPosition = { team: 'player', row, col };
              }
          }
      });
    }
    enemyUnitsData.forEach((unit, index) => {
        const unitId = unit.id || `enemy_${index}`;
        const row = Math.floor(index / BATTLE_GRID_COLS);
        const col = index % BATTLE_GRID_COLS;
        if (row < BATTLE_GRID_ROWS && col < BATTLE_GRID_COLS) {
            enemyFormation[row][col] = unitId;
        }
    });


    // TODO: 计算初始 turnOrder (基于速度)
    const turnOrder = Object.values(battleUnits)
      .sort((a, b) => b.stats.speed - a.stats.speed)
      .map(unit => unit.id);

    const battleId = generateUniqueId('battle'); // 使用项目标准ID生成函数

    const setupPayload = {
      battleId,
      battleUnits,
      playerFormation,
      enemyFormation,
      turnOrder,
      // enemyEncounterId: monsterId, // 可以考虑用 monsterId 作为遭遇ID
    };

    console.log('[battleSlice] Dispatching setupBattle with payload:', setupPayload);
    dispatch(battleSlice.actions.setupBattle(setupPayload)); // 注意：直接使用 battleSlice.actions

    return setupPayload; // thunk 成功时返回的数据
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
  // stats (包含 currentHp, maxHp, currentMp, maxMp, attack, defense, speed 等), 
  // skillSet, statusEffects (存储BUFF实例),
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
      }];
      
      // 添加技能导入日志
      Object.values(state.battleUnits).forEach(unit => {
        // 记录基本单位信息
        state.battleLog.push({
          message: `单位信息 - ID: ${unit.id}, 名称: ${unit.name}, 类型: ${unit.type}`,
          timestamp: Date.now(),
          isDebugLog: true,
          unitId: unit.id
        });
        
        // 记录技能列表
        state.battleLog.push({
          message: `单位 ${unit.name} 的技能列表 (skillSet): ${JSON.stringify(unit.skillSet || [])}`,
          timestamp: Date.now() + 1,
          isDebugLog: true,
          unitId: unit.id
        });
        
        // 记录技能导入信息（如果存在）
        if (unit._debug_skillImport) {
          state.battleLog.push({
            message: `技能导入信息: ${JSON.stringify(unit._debug_skillImport)}`,
            timestamp: Date.now() + 2,
            isDebugLog: true,
            unitId: unit.id
          });
        }
        
        // 记录单位属性信息
        state.battleLog.push({
          message: `单位属性 - HP: ${unit.stats.currentHp}/${unit.stats.maxHp}, MP: ${unit.stats.currentMp}/${unit.stats.maxMp}, 攻击: ${unit.stats.attack}, 防御: ${unit.stats.defense}`,
          timestamp: Date.now() + 3,
          isDebugLog: true,
          unitId: unit.id
        });
      });
      state.rewards = null;
      
      // 使用新的被动技能系统初始化所有单位的被动技能
      const passiveInitResults = initializePassiveSkills(state.battleUnits);
      
      // 记录被动技能初始化结果
      passiveInitResults.forEach(result => {
        // 记录永久BUFF应用
        result.buffResults.forEach(buffResult => {
          state.battleLog.push({ 
            message: `${result.unitName} 获得了被动技能 ${buffResult.skillName} 的永久效果`, 
            timestamp: Date.now(),
            unitId: result.unitId,
            skillId: buffResult.skillId,
            buffId: buffResult.buffId,
            isPassiveInit: true
          });
        });
        
        // 记录战斗开始时触发的被动技能
        result.battleStartResults.forEach(startResult => {
          state.battleLog.push({ 
            message: `${result.unitName} 的被动技能 ${startResult.skillName} 在战斗开始时触发！`, 
            timestamp: Date.now(),
            unitId: result.unitId,
            skillId: startResult.skillId,
            isPassiveSkill: true
          });
          
          // 处理效果
          startResult.effects.forEach(effect => {
            state.battleLog.push({ 
              message: effect.message || `被动效果触发`, 
              timestamp: Date.now(),
              unitId: result.unitId,
              effectType: effect.type,
              isPassiveEffect: true
            });
          });
        });
      });
      
      // 添加回合开始日志
      state.battleLog.push({ 
        message: `回合 ${state.currentRound} - 准备阶段开始！请为所有单位分配行动指令。`, 
        timestamp: Date.now() + 1,
        round: state.currentRound,
        phase: 'preparation'
      });
    },

    // 单位行动 (例如，使用技能)
    unitPerformAction: (state, action) => {
      // payload: { unitId: string, actionType: 'skill'|'item', skillId?: string, itemId?: string, targetIds: string[] }
      const { unitId, actionType, skillId, targetIds } = action.payload;
      const sourceUnit = state.battleUnits[unitId];
      
      if (!sourceUnit || sourceUnit.isDefeated) {
        state.battleLog.push({ 
          message: `行动失败：单位 ${unitId} 不存在或已被击败`, 
          timestamp: Date.now() 
        });
        return;
      }
      
      // 检查单位是否可以行动（不受眩晕、冻结等控制效果影响）
      const actCheck = canUnitAct(sourceUnit);
      if (!actCheck.canAct) {
        state.battleLog.push({ 
          message: `${sourceUnit.name} 无法行动：${actCheck.reason}`, 
          timestamp: Date.now(),
          unitId: unitId
        });
        return;
      }
      
      // 如果是技能，检查单位是否可以使用技能（不受沉默等效果影响）
      if (actionType === 'skill' && skillId) {
        const skillCheck = canUnitUseSkill(sourceUnit);
        if (!skillCheck.canUseSkill) {
          state.battleLog.push({ 
            message: `${sourceUnit.name} 无法使用技能：${skillCheck.reason}`, 
            timestamp: Date.now(),
            unitId: unitId
          });
          return;
        }
        
        // 这里可以添加MP消耗等逻辑
      }
      
      // 处理目标单位
      const validTargets = targetIds.filter(targetId => {
        const targetUnit = state.battleUnits[targetId];
        if (!targetUnit || targetUnit.isDefeated) return false;
        
        // 检查目标是否可以被选中（考虑隐身等效果）
        const targetCheck = canUnitBeTargeted(targetUnit, sourceUnit);
        return targetCheck.canBeTargeted;
      });
      
      if (validTargets.length === 0) {
        state.battleLog.push({ 
          message: `${sourceUnit.name} 的行动没有有效目标`, 
          timestamp: Date.now(),
          unitId: unitId
        });
        return;
      }
      
      // 根据行动类型执行不同逻辑
      switch (actionType) {
        case 'attack':
          // 普通攻击逻辑
          validTargets.forEach(targetId => {
            const targetUnit = state.battleUnits[targetId];
            // 计算攻击伤害（考虑BUFF加成）
            const attackValue = calculateModifiedAttribute(sourceUnit, 'attack');
            const defenseValue = calculateModifiedAttribute(targetUnit, 'defense');
            
            // 简单的伤害计算公式
            // 基础伤害
            let baseDamage = Math.max(1, Math.round(attackValue - defenseValue * 0.5));
            
            // 防御现在默认抗挕15%的所有伤害
            let damageReduction = 0.15;
            
            // 检查是否处于防御状态
            if (targetUnit.isDefending) {
              // 如果在防御状态，再减兆15%伤害
              damageReduction += 0.15;
              state.battleLog.push({ 
                message: `${targetUnit.name} 的防御姿态减少了额外的15%伤害`, 
                timestamp: Date.now(),
                unitId: targetId,
                effect: {
                  type: 'shield',
                  icon: 'fa-shield-alt',
                  color: '#3498db',
                  size: 'large',
                  duration: 1000  // 特效持续1秒
                }
              });
            }
            
            let damage = Math.max(1, Math.round(baseDamage * (1 - damageReduction)));
            
            // 处理护盾吸收
            const shieldResult = processShieldAbsorption(targetUnit, damage);
            if (shieldResult.absorbedDamage > 0) {
              damage = shieldResult.remainingDamage;
              state.battleLog.push({ 
                message: shieldResult.message, 
                timestamp: Date.now(),
                unitId: targetId
              });
            }
            
            // 应用最终伤害
            targetUnit.stats.currentHp = Math.max(0, targetUnit.stats.currentHp - damage);
            
            state.battleLog.push({ 
              message: `${sourceUnit.name} 对 ${targetUnit.name} 造成 ${damage} 点伤害`, 
              timestamp: Date.now(),
              unitId: unitId,
              targetId: targetId,
              damage: damage
            });
            
            // 触发目标的被动技能 - 受到物理伤害时
            battleSlice.caseReducers.triggerPassiveSkills(state, {
              payload: {
                unitId: targetId,
                triggerType: 'ON_PHYSICAL_DAMAGE',
                sourceUnitId: unitId,
                damageAmount: damage
              }
            });
            
            // 处理反弹伤害
            const reflectResult = processReflectDamage(sourceUnit, targetUnit, damage);
            if (reflectResult.reflectedDamage > 0) {
              state.battleLog.push({ 
                message: reflectResult.message, 
                timestamp: Date.now(),
                unitId: targetId,
                targetId: unitId,
                damage: reflectResult.reflectedDamage
              });
            }
            
            // 检查目标是否被击败
            if (targetUnit.stats.currentHp <= 0) {
              targetUnit.isDefeated = true;
              state.battleLog.push({ 
                message: `${targetUnit.name} 被击败了！`, 
                timestamp: Date.now(),
                unitId: targetId
              });
            }
          });
          break;
          
        case 'skill':
          // 获取技能配置
          const skill = activeSkillConfig.find(s => s.id === skillId);
          
          if (!skill) {
            state.battleLog.push({ 
              message: `技能 ${skillId} 不存在`, 
              timestamp: Date.now(),
              unitId: unitId
            });
            break;
          }
          
          // 记录技能使用
          console.log(`技能使用 - 单位: ${sourceUnit.name}, 技能: ${skill.name}, ID: ${skillId}`);
          console.log(`技能详情 - 类型: ${skill.type}, MP消耗: ${skill.mpCost}, 目标数量: ${validTargets.length}`);
          
          // 消耗MP
          sourceUnit.stats.currentMp = Math.max(0, sourceUnit.stats.currentMp - (skill.mpCost || 0));
          
          // 设置技能冷却
          if (skill.cooldown) {
            if (!sourceUnit.skillCooldowns) sourceUnit.skillCooldowns = {};
            sourceUnit.skillCooldowns[skillId] = skill.cooldown;
            console.log(`设置技能冷却 - 技能: ${skill.name}, 冷却回合: ${skill.cooldown}`);
          }
          
          state.battleLog.push({ 
            message: `${sourceUnit.name} 使用了技能 ${skill.name} [消耗MP: ${skill.mpCost || 0}]`, 
            timestamp: Date.now(),
            unitId: unitId,
            skillId: skillId,
            details: {
              skillType: skill.type,
              mpCost: skill.mpCost || 0,
              cooldown: skill.cooldown || 0,
              targets: validTargets.map(id => state.battleUnits[id]?.name || id),
              element: skill.element || '无',
              damage: skill.damage || 0,
              heal: skill.healAmount || 0
            }
          });
          
          // 处理技能伤害
          if (skill.damage) {
            validTargets.forEach(targetId => {
              const targetUnit = state.battleUnits[targetId];
              
              // 计算基础伤害
              let baseDamage;
              let attackStat;
              let defenseStat;
              
              if (skill.type === 'magical') {
                attackStat = sourceUnit.stats.magicAttack;
                defenseStat = targetUnit.stats.magicDefense || targetUnit.stats.defense;
                baseDamage = attackStat * skill.damage;
                console.log(`魔法伤害计算 - 魔法攻击: ${attackStat}, 技能系数: ${skill.damage}, 基础伤害: ${baseDamage}`);
              } else {
                attackStat = sourceUnit.stats.attack;
                defenseStat = targetUnit.stats.defense;
                baseDamage = attackStat * skill.damage;
                console.log(`物理伤害计算 - 物理攻击: ${attackStat}, 技能系数: ${skill.damage}, 基础伤害: ${baseDamage}`);
              }
              
              // 记录伤害计算过程
              console.log(`伤害计算 - 单位: ${sourceUnit.name}, 目标: ${targetUnit.name}, 技能: ${skill.name}`);
              console.log(`属性详情 - 攻击方: ${attackStat}, 防御方: ${defenseStat}`);
              console.log(`基础伤害: ${baseDamage}`);
              
              
              // 获取目标的防御值
              const defenseValue = calculateModifiedAttribute(targetUnit, 'defense');
              
              // 应用防御减免，防御现在默认抗挕15%的所有伤害
              let damageReduction = 0.15;
              
              // 检查是否处于防御状态
              if (targetUnit.isDefending) {
                // 如果在防御状态，再减兆15%伤害
                damageReduction += 0.15;
                state.battleLog.push({ 
                  message: `${targetUnit.name} 的防御姿态减少了额外的15%伤害`, 
                  timestamp: Date.now(),
                  unitId: targetId,
                  effect: {
                    type: 'shield',
                    icon: 'fa-shield-alt',
                    color: '#3498db',
                    size: 'large',
                    duration: 1000  // 特效持续1秒
                  }
                });
              }
              
              let finalDamage = Math.max(1, Math.round(baseDamage * (1 - damageReduction)));
              
              // 处理护盾吸收
              const shieldResult = processShieldAbsorption(targetUnit, finalDamage);
              if (shieldResult.absorbedDamage > 0) {
                finalDamage = shieldResult.remainingDamage;
                state.battleLog.push({ 
                  message: shieldResult.message, 
                  timestamp: Date.now(),
                  unitId: targetId
                });
              }
              
              // 应用最终伤害
              targetUnit.stats.currentHp = Math.max(0, targetUnit.stats.currentHp - finalDamage);
              
              state.battleLog.push({ 
                message: `${sourceUnit.name} 对 ${targetUnit.name} 造成 ${finalDamage} 点${skill.element ? skill.element : ''}伤害`, 
                timestamp: Date.now(),
                unitId: unitId,
                targetId: targetId,
                damage: finalDamage
              });
              
              // 触发目标的被动技能 - 受到伤害时
              battleSlice.caseReducers.triggerPassiveSkills(state, {
                payload: {
                  unitId: targetId,
                  triggerType: 'ON_MAGICAL_DAMAGE',
                  sourceUnitId: unitId,
                  damageAmount: finalDamage
                }
              });
              
              // 检查目标是否被击败
              if (targetUnit.stats.currentHp <= 0) {
                targetUnit.isDefeated = true;
                state.battleLog.push({ 
                  message: `${targetUnit.name} 被击败了！`, 
                  timestamp: Date.now(),
                  unitId: targetId
                });
              }
            });
          }
          
          // 处理治疗效果
          if (skill.healAmount) {
            validTargets.forEach(targetId => {
              const targetUnit = state.battleUnits[targetId];
              
              // 计算治疗量
              const healAmount = Math.round(sourceUnit.stats.magicAttack * skill.healAmount);
              
              // 应用治疗
              const oldHp = targetUnit.stats.currentHp;
              targetUnit.stats.currentHp = Math.min(
                targetUnit.stats.currentHp + healAmount,
                targetUnit.stats.maxHp
              );
              
              const actualHeal = targetUnit.stats.currentHp - oldHp;
              
              state.battleLog.push({ 
                message: `${sourceUnit.name} 为 ${targetUnit.name} 恢复了 ${actualHeal} 点生命值`, 
                timestamp: Date.now(),
                unitId: unitId,
                targetId: targetId,
                heal: actualHeal
              });
            });
          }
          
          // 应用技能BUFF效果
          if (skill.applyBuffs && skill.applyBuffs.length > 0) {
            validTargets.forEach(targetId => {
              const targetUnit = state.battleUnits[targetId];
              
              skill.applyBuffs.forEach(buffConfig => {
                // 检查几率
                if (buffConfig.chance && Math.random() > buffConfig.chance) {
                  return; // 几率未触发，跳过
                }
                
                // 应用BUFF
                const result = applyBuffFunc(targetUnit, buffConfig.buffId, unitId, buffConfig.level || 1);
                
                if (result.success) {
                  state.battleLog.push({ 
                    message: result.message, 
                    timestamp: Date.now(),
                    unitId: unitId,
                    targetId: targetId,
                    buffId: buffConfig.buffId
                  });
                }
              });
            });
          }
          break;
          
        case 'item':
          // 道具使用逻辑
          state.battleLog.push({ 
            message: `${sourceUnit.name} 使用了道具`, 
            timestamp: Date.now(),
            unitId: unitId
          });
          break;
          
        default:
          state.battleLog.push({ 
            message: `未知行动类型: ${actionType}`, 
            timestamp: Date.now() 
          });
      }
      
      // 行动完成后进入下一阶段
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
              state.currentPhase = 'battle_over'; // 标记战斗正式结束
              state.battleResult = allEnemyDefeated ? 'victory' : 'defeat';

              // 计算奖励
              const rewards = calculateRewards(
                Object.values(state.battleUnits).filter(u => u.isPlayerUnit),
                Object.values(state.battleUnits).filter(u => !u.isPlayerUnit),
                state.battleResult
              );
              state.rewards = rewards;

              // 自动分发奖励到背包系统
              if (state.battleResult === 'victory' && rewards) {
                // 使用 setTimeout 异步执行奖励分发，避免在reducer中进行异步操作
                setTimeout(async () => {
                  try {
                    const rewardResults = await rewardManager.giveRewards(rewards, 'battle');
                    console.log('[Battle] 奖励已分发到背包系统:', rewardResults);
                  } catch (error) {
                    console.error('[Battle] 奖励分发失败:', error);
                  }
                }, 100);
              }

              // 添加战斗结束日志
              state.battleLog.push({
                id: generateUniqueId(),
                type: 'BATTLE_END',
                message: state.battleResult === 'victory' ? '战斗胜利！' : '战斗失败。',
                timestamp: Date.now(),
                result: state.battleResult,
                rewards: rewards
              });

              if (rewards && rewards.message) {
                state.battleLog.push({
                  id: generateUniqueId(),
                  type: 'REWARD_INFO',
                  message: rewards.message,
                  timestamp: Date.now()
                });
              }
              // 后续可以在此触发其他战斗结束后的逻辑，例如返回地图、显示奖励界面等
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
      
      // 处理回合开始时的BUFF效果
      Object.values(state.battleUnits).forEach(unit => {
        if (unit.isDefeated) return;
        
        // 处理回合开始时的BUFF效果
        processBuffsAtRoundStart(unit, state);
        
        // 触发回合开始时的被动技能
        battleSlice.caseReducers.triggerPassiveSkills(state, {
          payload: {
            unitId: unit.id,
            triggerType: 'ON_ROUND_START'
          }
        });
      });
      
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
      
      // 在执行阶段开始时立即应用防御效果
      Object.keys(state.unitActions).forEach(unitId => {
        const unit = state.battleUnits[unitId];
        const action = state.unitActions[unitId];
        
        if (!unit || unit.isDefeated) return;
        
        // 如果单位选择了防御动作
        if (action.actionType === 'defend') {
          unit.isDefending = true;
          state.battleLog.push({
            message: `${unit.name} 进入防御姿态，减少15%的所有伤害。`,
            timestamp: Date.now(),
            unitId,
            actionType: 'defend'
          });
        }
      });
      
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
        // 调用 nextTurn 函数进入下一个单位的回合
        battleSlice.caseReducers.nextTurn(state);
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
          
          // 检查被动技能闪避效果
          const dodgeResult = processPassiveSkillDodge(target, unit);
          // TODO: Math.random() > 0.95 应该是一个临时或错误的闪避逻辑，后续应移除或改为由实际闪避率决定
          const dodged = dodgeResult.dodged; // || Math.random() > 0.95; 

          if (dodgeResult.dodged && dodgeResult.message) {
            state.battleLog.push({
              message: dodgeResult.message,
              timestamp: Date.now(),
              unitId: target.id,
              isPassiveEffect: true
            });
          }

          if (dodged) {
            state.battleLog.push({
              id: generateUniqueId(),
              type: 'ATTACK_DODGED',
              message: `${unit.name} 的攻击被 ${target.name} 闪避了！`,
              timestamp: Date.now(),
              unitId,
              targetId,
              isDodged: true
            });
            // 触发闪避相关的被动技能
            battleSlice.caseReducers.triggerPassiveSkills(state, {
              payload: {
                unitId: targetId,
                triggerType: 'ON_DODGE',
                sourceUnitId: unitId
              }
            });
            break; // 攻击被闪避，结束处理
          }

          // 使用 calculateBattleDamage 函数计算详细伤害
          const damageResult = calculateBattleDamage(
            unit, 
            target, 
            'auto', // damageType, 'auto' 会自动判断物理或法术
            DAMAGE_CONSTANTS.COMMON.DEFAULT_SKILL_BONUS, // skillBonus for basic attack
            {} // options for basic attack
          );

          let finalDamage = damageResult.finalDamage;
          const isCrit = damageResult.isCritical;

          // 检查是否处于防御状态 (calculateBattleDamage 内部可能已处理，但这里可以额外记录日志或调整)
          if (target.isDefending) {
            // 防御状态的效果应该在 calculateBattleDamage 内部通过 fixedReduction 或 percentReduction 体现
            // 如果 calculateBattleDamage 未处理防御状态，则需要在这里调整 finalDamage
            // 例如: finalDamage = Math.round(finalDamage * 0.5); // 防御减伤50%
            // 确保防御日志只记录一次，或者由 calculateBattleDamage 返回防御信息
            // 为了避免重复，暂时注释掉这里的防御日志，假设 calculateBattleDamage 会处理
            /* state.battleLog.push({ 
              message: `${target.name} 处于防御状态，受到的伤害减少了。`, 
              timestamp: Date.now(),
              unitId: targetId
            }); */
          }

          // 处理护盾吸收
          const shieldResult = processShieldAbsorption(target, finalDamage);
          if (shieldResult.absorbedDamage > 0) {
            finalDamage = shieldResult.remainingDamage;
            state.battleLog.push({ 
              id: generateUniqueId(),
              type: 'SHIELD_ABSORB',
              message: shieldResult.message, 
              timestamp: Date.now(),
              unitId: targetId,
              absorbedAmount: shieldResult.absorbedDamage,
              remainingDamage: finalDamage
            });
          }
          
          // 应用保底伤害：如果计算出的伤害大于0，则至少为1；如果是治疗(小于0)，则按原样或特定保底治疗
          if (finalDamage > 0) {
            finalDamage = Math.max(1, finalDamage);
          } else if (finalDamage < 0) {
            // 对于治疗，可以设定最小治疗量，例如 Math.min(-1, finalDamage)
            // 目前伤害计算函数不直接产生负数伤害（治疗），所以此分支可能用不到
          }

          // 应用最终伤害
          target.stats.currentHp = Math.max(0, target.stats.currentHp - finalDamage);
          
          const damageLogMessage = `${unit.name} 攻击了 ${target.name}，造成 ${finalDamage} 点伤害。${isCrit ? ' 暴击！' : ''}`;
          state.battleLog.push({
            id: generateUniqueId(),
            type: 'ATTACK_DAMAGE',
            message: damageLogMessage,
            timestamp: Date.now(),
            unitId,
            targetId,
            damageAmount: finalDamage,
            isCritical: isCrit,
            isDodged: false // 已经处理过闪避
          });
          
          // 触发目标的被动技能 - 受到物理伤害时
          battleSlice.caseReducers.triggerPassiveSkills(state, {
            payload: {
              unitId: targetId,
              triggerType: 'ON_PHYSICAL_DAMAGE',
              sourceUnitId: unitId,
              damageAmount: finalDamage
            }
          });
          
          // 检查目标是否被击败
          if (target.stats.currentHp <= 0) {
            target.isDefeated = true;
            state.battleLog.push({
              message: `${target.name} 被击败了！`,
              timestamp: Date.now(),
              unitId: targetId
            });
          }
          break;
        }
        
        case 'defend': {
          // 防御状态已在执行阶段开始时应用
          // 这里只需要记录单位完成了防御动作
          state.battleLog.push({
            message: `${unit.name} 维持防御姿态。`,
            timestamp: Date.now(),
            unitId,
            actionType: 'defend'
          });
          break;
        }
        
        case 'skill': {
          if (!action.targetIds || action.targetIds.length === 0 || !action.skillId) break;
          
          // 获取技能信息
          const skillId = action.skillId;
          const skillInfo = activeSkillConfig.find(skill => skill.id === skillId);
          
          if (!skillInfo) {
            state.battleLog.push({
              message: `${unit.name} 尝试使用未知技能 ${skillId}。`,
              timestamp: Date.now(),
              unitId
            });
            break;
          }
          
          // 检查技能冷却
          if (unit.skillCooldowns && unit.skillCooldowns[skillId] > 0) {
            state.battleLog.push({
              message: `${unit.name} 的技能 ${skillInfo.name} 还在冷却中（剩余 ${unit.skillCooldowns[skillId]} 回合）。`,
              timestamp: Date.now(),
              unitId
            });
            break;
          }
          
          // 检查MP消耗
          const mpCost = skillInfo.mpCost || 10; // 默认消耗10点MP
          if (unit.stats.currentMp < mpCost) {
            state.battleLog.push({
              message: `${unit.name} 法力不足，无法使用技能 ${skillInfo.name}（需要 ${mpCost} 点法力）。`,
              timestamp: Date.now(),
              unitId
            });
            break;
          }
          
          // 消耗MP
          unit.stats.currentMp -= mpCost;
          
          // 初始化技能冷却
          if (!unit.skillCooldowns) unit.skillCooldowns = {};
          if (skillInfo.cooldownRounds) {
            unit.skillCooldowns[skillId] = skillInfo.cooldownRounds;
          }
          
          // 根据技能类型处理不同效果
          switch (skillInfo.type) {
            case 'ATTACK': // 攻击型技能
            case 'MAGICAL': // 魔法攻击技能
              // 处理多目标或单目标
              const targets = action.targetIds.map(id => state.battleUnits[id]).filter(t => t && !t.isDefeated);
              
              if (targets.length === 0) {
                state.battleLog.push({
                  message: `${unit.name} 使用了 ${skillInfo.name}，但没有有效目标。`,
                  timestamp: Date.now(),
                  unitId
                });
                break;
              }
              
              state.battleLog.push({
                message: `${unit.name} 使用了 ${skillInfo.name}，消耗 ${mpCost} 点法力。`,
                timestamp: Date.now(),
                unitId,
                effect: {
                  type: 'skill',
                  icon: skillInfo.icon || 'fa-magic',
                  color: skillInfo.element === 'FIRE' ? '#ff4500' : 
                         skillInfo.element === 'WATER' ? '#1e90ff' : 
                         skillInfo.element === 'EARTH' ? '#8b4513' : 
                         skillInfo.element === 'WIND' ? '#7fffd4' : 
                         skillInfo.element === 'THUNDER' ? '#ffd700' : '#ffffff',
                  size: 'large',
                  duration: 1500
                }
              });
              
              // 处理每个目标
              targets.forEach(target => {
                // 计算技能伤害
                const damageOptions = {
                  percentReduction: target.isDefending ? 0.3 : 0.15, // 防御姿态减伤30%，否则15%
                  isDefending: target.isDefending,
                  showDetailedLog: true // 启用详细日志
                };
                
                // 使用技能伤害倍率
                const skillBonus = skillInfo.damage || 1.5; // 默认1.5倍伤害
                
                // 根据技能类型选择伤害类型
                const damageType = skillInfo.type === 'MAGICAL' ? 'magical' : 'physical';
                
                // 计算伤害
                const damageResult = calculateBattleDamage(unit, target, damageType, skillBonus, damageOptions);
                const damage = damageResult.finalDamage;
                
                // 记录详细的伤害计算日志
                if (damageResult.details) {
                  const details = damageResult.details;
                  const damageTypeDisplay = details.damageType === 'physical' ? '物理' : '魔法';
                  
                  // 记录详细的伤害计算过程
                  state.battleLog.push({
                    type: 'CALCULATION_DETAIL',
                    message: `${skillInfo.name} 伤害计算详情 (类型: ${damageTypeDisplay}):`,
                    timestamp: Date.now(),
                    unitId: unit.id,
                    targetId: target.id
                  });
                  
                  // 基础伤害
                  if (details.basePhysicalDamage !== undefined) {
                    state.battleLog.push({
                      type: 'CALCULATION_DETAIL',
                      message: `基础物理伤害: ${details.basePhysicalDamage} (攻击力: ${unit.stats.physicalAttack}, 防御力: ${target.stats.physicalDefense})`,
                      timestamp: Date.now(),
                      unitId: unit.id,
                      targetId: target.id
                    });
                  } else if (details.baseMagicalDamage !== undefined) {
                    state.battleLog.push({
                      type: 'CALCULATION_DETAIL',
                      message: `基础魔法伤害: ${details.baseMagicalDamage} (魔法攻击: ${unit.stats.magicalAttack}, 魔法防御: ${target.stats.magicalDefense})`,
                      timestamp: Date.now(),
                      unitId: unit.id,
                      targetId: target.id
                    });
                  }
                  
                  // 技能加成
                  state.battleLog.push({
                    type: 'CALCULATION_DETAIL',
                    message: `技能加成: ${skillBonus}倍 (${skillInfo.name})`,
                    timestamp: Date.now(),
                    unitId: unit.id,
                    targetId: target.id
                  });
                  
                  // 暴击
                  state.battleLog.push({
                    type: 'CALCULATION_DETAIL',
                    message: `暴击检定: ${details.isCritical ? '触发暴击!' : '未暴击'} (暴击率: ${(unit.stats.critRate * 100).toFixed(1)}%)`,
                    timestamp: Date.now(),
                    unitId: unit.id,
                    targetId: target.id
                  });
                  
                  if (details.isCritical) {
                    state.battleLog.push({
                      type: 'CALCULATION_DETAIL',
                      message: `暴击伤害: ${details.criticalDamage} (暴击倍率: ${(unit.stats.critDamage * 100).toFixed(1)}%)`,
                      timestamp: Date.now(),
                      unitId: unit.id,
                      targetId: target.id
                    });
                  }
                  
                  // 减伤
                  if (target.isDefending) {
                    state.battleLog.push({
                      message: `防御姿态减伤: ${Math.round(details.percentReducedDamage * 0.15)} (额外减免15%)`,
                      timestamp: Date.now(),
                      isDetailLog: true
                    });
                  }
                  
                  // 伤害浮动
                  const variationPercent = (details.damageVariation * 100).toFixed(1);
                  const variationSign = details.damageVariation >= 0 ? '+' : '';
                  state.battleLog.push({
                    message: `伤害浮动: ${variationSign}${variationPercent}%`,
                    timestamp: Date.now(),
                    isDetailLog: true
                  });
                  
                  // 最终伤害
                  state.battleLog.push({
                    message: `最终伤害: ${damage}`,
                    timestamp: Date.now(),
                    isDetailLog: true
                  });
                }
                
                // 应用伤害
                target.stats.currentHp = Math.max(target.stats.currentHp - damage, 0);
                
                // 检查目标是否被击败
                if (target.stats.currentHp <= 0) {
                  target.isDefeated = true;
                  state.battleLog.push({
                    message: `${unit.name} 的 ${skillInfo.name} 对 ${target.name} 造成 ${damage} 点伤害，${target.name} 被击败！`,
                    timestamp: Date.now(),
                    unitId,
                    targetId: target.id
                  });
                } else {
                  state.battleLog.push({
                    message: `${unit.name} 的 ${skillInfo.name} 对 ${target.name} 造成 ${damage} 点伤害。`,
                    timestamp: Date.now(),
                    unitId,
                    targetId: target.id
                  });
                }
                
                // 应用技能附带的BUFF效果
                if (skillInfo.applyBuffs && skillInfo.applyBuffs.length > 0) {
                  skillInfo.applyBuffs.forEach(buffInfo => {
                    // 确定BUFF目标
                    let buffTarget = target;
                    if (buffInfo.targetType === 'self') {
                      buffTarget = unit;
                    }
                    
                    // 应用BUFF
                    if (!buffTarget.buffs) buffTarget.buffs = [];
                    
                    // 查找BUFF定义
                    const buffDef = buffConfig.find(b => b.id === buffInfo.buffId);
                    if (!buffDef) return;
                    
                    // 创建BUFF实例
                    const newBuff = {
                      id: buffInfo.buffId,
                      level: buffInfo.level || 1,
                      duration: buffDef.duration || 3, // 默认持续3回合
                      sourceUnitId: unit.id
                    };
                    
                    // 添加到目标的BUFF列表
                    buffTarget.buffs.push(newBuff);
                    
                    state.battleLog.push({
                      message: `${buffTarget.name} 获得了 ${buffDef.name} 效果，持续 ${newBuff.duration} 回合。`,
                      timestamp: Date.now(),
                      unitId: buffTarget.id,
                      buffId: buffInfo.buffId
                    });
                  });
                }
              });
              break;
              
            case 'SUPPORT': // 辅助型技能
              // 处理辅助技能逻辑
              state.battleLog.push({
                message: `${unit.name} 使用了辅助技能 ${skillInfo.name}，消耗 ${mpCost} 点法力。`,
                timestamp: Date.now(),
                unitId,
                effect: {
                  type: 'buff',
                  icon: skillInfo.icon || 'fa-shield-alt',
                  color: '#32cd32',
                  size: 'large',
                  duration: 1500
                }
              });
              
              // 应用BUFF效果
              if (skillInfo.applyBuffs && skillInfo.applyBuffs.length > 0) {
                // 确定目标
                let targets = [];
                if (skillInfo.targetType === SKILL_TARGET_TYPES.SELF) {
                  targets = [unit];
                } else if (skillInfo.targetType === SKILL_TARGET_TYPES.ALLY) {
                  // 获取友方单位
                  const formation = unit.isPlayerUnit ? state.playerFormation : state.enemyFormation;
                  targets = formation.flat()
                    .filter(id => id && state.battleUnits[id] && !state.battleUnits[id].isDefeated)
                    .map(id => state.battleUnits[id]);
                } else if (skillInfo.targetType === SKILL_TARGET_TYPES.ENEMY) {
                  // 获取敌方单位
                  const formation = unit.isPlayerUnit ? state.enemyFormation : state.playerFormation;
                  targets = formation.flat()
                    .filter(id => id && state.battleUnits[id] && !state.battleUnits[id].isDefeated)
                    .map(id => state.battleUnits[id]);
                } else {
                  // 使用指定的目标
                  targets = action.targetIds
                    .map(id => state.battleUnits[id])
                    .filter(t => t && !t.isDefeated);
                }
                
                // 应用BUFF到每个目标
                targets.forEach(target => {
                  skillInfo.applyBuffs.forEach(buffInfo => {
                    // 应用BUFF
                    if (!target.buffs) target.buffs = [];
                    
                    // 查找BUFF定义
                    const buffDef = buffConfig.find(b => b.id === buffInfo.buffId);
                    if (!buffDef) return;
                    
                    // 创建BUFF实例
                    const newBuff = {
                      id: buffInfo.buffId,
                      level: buffInfo.level || 1,
                      duration: buffDef.duration || 3, // 默认持续3回合
                      sourceUnitId: unit.id
                    };
                    
                    // 添加到目标的BUFF列表
                    target.buffs.push(newBuff);
                    
                    state.battleLog.push({
                      message: `${target.name} 获得了 ${buffDef.name} 效果，持续 ${newBuff.duration} 回合。`,
                      timestamp: Date.now(),
                      unitId: target.id,
                      buffId: buffInfo.buffId
                    });
                  });
                });
              }
              break;
              
            case 'HEALING': // 治疗型技能
              // 处理治疗技能逻辑
              const healTargets = action.targetIds
                .map(id => state.battleUnits[id])
                .filter(t => t && !t.isDefeated);
              
              if (healTargets.length === 0) {
                state.battleLog.push({
                  message: `${unit.name} 使用了 ${skillInfo.name}，但没有有效目标。`,
                  timestamp: Date.now(),
                  unitId
                });
                break;
              }
              
              state.battleLog.push({
                message: `${unit.name} 使用了治疗技能 ${skillInfo.name}，消耗 ${mpCost} 点法力。`,
                timestamp: Date.now(),
                unitId,
                effect: {
                  type: 'heal',
                  icon: skillInfo.icon || 'fa-heart',
                  color: '#ff69b4',
                  size: 'large',
                  duration: 1500
                }
              });
              
              // 计算治疗量
              const baseHealAmount = skillInfo.healAmount || (unit.stats.magicalAttack * 0.8);
              
              // 处理每个目标
              healTargets.forEach(target => {
                // 计算实际治疗量（加入随机浮动）
                const healVariation = -0.1 + Math.random() * 0.2; // -10% 到 +10% 的随机浮动
                const healAmount = Math.floor(baseHealAmount * (1 + healVariation));
                
                // 应用治疗
                const oldHp = target.stats.currentHp;
                target.stats.currentHp = Math.min(target.stats.currentHp + healAmount, target.stats.maxHp);
                const actualHeal = target.stats.currentHp - oldHp;
                
                state.battleLog.push({
                  message: `${unit.name} 的 ${skillInfo.name} 为 ${target.name} 恢复了 ${actualHeal} 点生命值。`,
                  timestamp: Date.now(),
                  unitId,
                  targetId: target.id,
                  heal: actualHeal
                });
              });
              break;
              
            default:
              state.battleLog.push({
                message: `${unit.name} 使用了未知类型的技能 ${skillInfo.name}。`,
                timestamp: Date.now(),
                unitId
              });
              break;
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
        battleSlice.caseReducers.endRound(state);
      }
    },
    
    // 开始新回合
    startNewRound: (state) => {
      state.currentRound += 1;
      state.currentPhase = 'preparation';
      state.unitActions = {}; // 重置单位行动
      
      // 处理回合开始时的BUFF效果
      Object.values(state.battleUnits).forEach(unit => {
        if (unit.isDefeated) return;
        
        // 处理回合开始时的BUFF效果
        processBuffsAtRoundStart(unit, state);
        
        // 触发回合开始时的被动技能
        battleSlice.caseReducers.triggerPassiveSkills(state, {
          payload: {
            unitId: unit.id,
            triggerType: 'ON_ROUND_START'
          }
        });
      });
      
      state.battleLog.push({ 
        message: `回合 ${state.currentRound} - 准备阶段开始！请为所有单位分配行动指令。`, 
        timestamp: Date.now(),
        round: state.currentRound,
        phase: 'preparation'
      });
    },
    
    // 结束当前回合
    endRound: (state) => {
      // 处理回合结束时的效果
      state.battleLog.push({ 
        message: `回合 ${state.currentRound} 结束`, 
        timestamp: Date.now(),
        round: state.currentRound
      });
      
      // 处理所有单位的回合结束效果
      Object.values(state.battleUnits).forEach(unit => {
        if (unit.isDefeated) return;
        
        // 处理回合结束时的BUFF效果
        processBuffsAtRoundEnd(unit, state);
        
        // 触发回合结束时的被动技能
        battleSlice.caseReducers.triggerPassiveSkills(state, {
          payload: {
            unitId: unit.id,
            triggerType: 'ON_ROUND_END'
          }
        });
        
        // 重置防御状态
        if (unit.isDefending) {
          unit.isDefending = false;
          state.battleLog.push({
            message: `${unit.name} 的防御姿态结束了`,
            timestamp: Date.now(),
            unitId: unit.id
          });
        }
      });
      
      // 检查战斗是否结束
      const allPlayerUnitsDefeated = Object.values(state.battleUnits)
        .filter(unit => unit.isPlayerUnit)
        .every(unit => unit.isDefeated);
      
      const allEnemyUnitsDefeated = Object.values(state.battleUnits)
        .filter(unit => !unit.isPlayerUnit)
        .every(unit => unit.isDefeated);
      
      if (allPlayerUnitsDefeated || allEnemyUnitsDefeated) {
        // 战斗结束
        state.isActive = false;
        state.battleResult = allPlayerUnitsDefeated ? 'defeat' : 'victory';
        
        // 计算奖励
        if (state.battleResult === 'victory') {
          state.rewards = calculateRewards(state.battleUnits);
        }
        
        state.battleLog.push({ 
          message: `战斗${state.battleResult === 'victory' ? '胜利' : '失败'}！`, 
          timestamp: Date.now(),
          result: state.battleResult
        });
      } else {
        // 开始新回合
        state.currentRound += 1;
        state.currentPhase = 'preparation';
        state.unitActions = {}; // 重置单位行动
        
        // 处理回合开始时的BUFF效果
        Object.values(state.battleUnits).forEach(unit => {
          if (unit.isDefeated) return;
          
          // 处理回合开始时的BUFF效果
          processBuffsAtRoundStart(unit, state);
          
          // 触发回合开始时的被动技能
          battleSlice.caseReducers.triggerPassiveSkills(state, {
            payload: {
              unitId: unit.id,
              triggerType: 'ON_ROUND_START'
            }
          });
        });
        
        state.battleLog.push({ 
          message: `回合 ${state.currentRound} - 准备阶段开始！请为所有单位分配行动指令。`, 
          timestamp: Date.now(),
          round: state.currentRound,
          phase: 'preparation'
        });
      }
    },

    // 触发被动技能
    triggerPassiveSkills: (state, action) => {
      // payload: { unitId, triggerType, sourceUnitId, targetUnitId, damageAmount, healAmount, skillId, isCritical, isSkill }
      const { unitId, triggerType } = action.payload;
      const unit = state.battleUnits[unitId];
      
      if (!unit || unit.isDefeated) {
        return;
      }
      
      // 构建触发上下文
      const context = {
        sourceUnit: action.payload.sourceUnitId ? state.battleUnits[action.payload.sourceUnitId] : null,
        targetUnit: action.payload.targetUnitId ? state.battleUnits[action.payload.targetUnitId] : null,
        damage: action.payload.damageAmount,
        healing: action.payload.healAmount,
        isCritical: action.payload.isCritical,
        isSkill: action.payload.isSkill,
        skillId: action.payload.skillId
      };
      
      // 使用新的被动技能系统触发效果
      const results = triggerPassiveSkillEffects(unit, triggerType, context);
      
      // 记录触发结果
      results.forEach(result => {
        // 记录被动技能触发
        state.battleLog.push({ 
          message: `${unit.name} 的被动技能 ${result.skillName} 触发！`, 
          timestamp: Date.now(),
          unitId: unitId,
          skillId: result.skillId,
          isPassiveSkill: true
        });
        
        // 处理各种效果
        result.effects.forEach(effect => {
          switch (effect.type) {
            case 'buff':
              // BUFF效果已经在passiveSkillSystem中应用，这里只记录日志
              state.battleLog.push({ 
                message: effect.message, 
                timestamp: Date.now(),
                unitId: unitId,
                targetId: effect.targetId,
                buffId: effect.buffId,
                isPassiveEffect: true
              });
              break;
              
            case 'damage':
              // 应用伤害
              if (effect.targetId && effect.damage) {
                const targetUnit = state.battleUnits[effect.targetId];
                if (targetUnit && !targetUnit.isDefeated) {
                  targetUnit.stats.currentHp = Math.max(0, targetUnit.stats.currentHp - effect.damage);
                  
                  state.battleLog.push({ 
                    message: effect.message, 
                    timestamp: Date.now(),
                    unitId: unitId,
                    targetId: effect.targetId,
                    damage: effect.damage,
                    isPassiveEffect: true
                  });
                  
                  // 检查目标是否被击败
                  if (targetUnit.stats.currentHp <= 0) {
                    targetUnit.isDefeated = true;
                    state.battleLog.push({ 
                      message: `${targetUnit.name} 被击败了！`, 
                      timestamp: Date.now(),
                      unitId: effect.targetId
                    });
                  }
                }
              }
              break;
              
            case 'revive':
              // 复活效果
              if (effect.hp && unit.isDefeated) {
                unit.isDefeated = false;
                unit.stats.currentHp = effect.hp;
                
                state.battleLog.push({ 
                  message: effect.message, 
                  timestamp: Date.now(),
                  unitId: unitId,
                  healing: effect.hp,
                  isPassiveEffect: true
                });
              }
              break;
              
            case 'extra_attack':
            case 'extra_skill':
              // 额外攻击或技能效果在executeAction中处理
              state.battleLog.push({ 
                message: effect.message, 
                timestamp: Date.now(),
                unitId: unitId,
                extraHits: effect.hits,
                skillId: effect.skillId,
                isPassiveEffect: true
              });
              break;
              
            default:
              // 记录其他效果
              state.battleLog.push({ 
                message: effect.message || `${unit.name} 的被动效果触发`, 
                timestamp: Date.now(),
                unitId: unitId,
                effectType: effect.type,
                isPassiveEffect: true
              });
          }
        });
      });
    },
    
    // BUFF相关的reducers
    
    // 应用BUFF到单位
    applyBuffToUnit: (state, action) => {
      // payload: { targetUnitId, buffId, sourceUnitId, level }
      const { targetUnitId, buffId, sourceUnitId, level = 1 } = action.payload;
      const targetUnit = state.battleUnits[targetUnitId];
      
      if (!targetUnit) {
        state.battleLog.push({ 
          message: `应用BUFF失败：目标单位 ${targetUnitId} 不存在`, 
          timestamp: Date.now() 
        });
        return;
      }
      
      const result = applyBuffFunc(targetUnit, buffId, sourceUnitId, level);
      
      state.battleLog.push({ 
        message: result.message, 
        timestamp: Date.now(),
        unitId: targetUnitId,
        buffId: buffId,
        success: result.success
      });
    },

    // 从单位移除BUFF
    removeBuffFromUnit: (state, action) => {
      // payload: { targetUnitId, buffId }
      const { targetUnitId, buffId } = action.payload;
      const targetUnit = state.battleUnits[targetUnitId];
      
      if (!targetUnit) {
        state.battleLog.push({ 
          message: `移除BUFF失败：目标单位 ${targetUnitId} 不存在`, 
          timestamp: Date.now() 
        });
        return;
      }
      
      const result = removeBuff(targetUnit, buffId);
      
      state.battleLog.push({ 
        message: result.message, 
        timestamp: Date.now(),
        unitId: targetUnitId,
        buffId: buffId,
        success: result.success
      });
    },

    // 清除单位的所有BUFF
    clearAllBuffsFromUnit: (state, action) => {
      // payload: { targetUnitId, buffType }
      const { targetUnitId, buffType } = action.payload;
      const targetUnit = state.battleUnits[targetUnitId];
      
      if (!targetUnit) {
        state.battleLog.push({ 
          message: `清除BUFF失败：目标单位 ${targetUnitId} 不存在`, 
          timestamp: Date.now() 
        });
        return;
      }
      
      const result = clearAllBuffs(targetUnit, buffType);
      
      state.battleLog.push({ 
        message: result.message, 
        timestamp: Date.now(),
        unitId: targetUnitId,
        success: result.success
      });
    }
  },
});

// 辅助函数

// 应用BUFF到单位的辅助函数
function applyBuffFunc(unit, buffId, sourceUnitId, level = 1) {
  // 使用已导入的模块
  
  // 获取BUFF定义
  const buffDef = buffConfig.find(b => b.id === buffId);
  if (!buffDef) {
    return { success: false, message: `BUFF ${buffId} 不存在` };
  }
  
  // 检查是否已经有相同的BUFF
  if (!unit.buffs) {
    unit.buffs = [];
  }
  
  const existingBuff = unit.buffs.find(b => b.id === buffId);
  
  if (existingBuff) {
    // 如果已存在，更新等级和持续时间
    if (buffDef.stackable) {
      // 如果可叠加，增加层数
      existingBuff.stacks = Math.min((existingBuff.stacks || 1) + 1, buffDef.maxStacks || 5);
      existingBuff.level = Math.max(existingBuff.level, level); // 使用更高的等级
      
      // 刷新持续时间
      if (buffDef.duration > 0) {
        existingBuff.duration = buffDef.duration;
      }
      
      return { 
        success: true, 
        message: `${unit.name} 的 ${buffDef.name} 效果叠加至 ${existingBuff.stacks} 层` 
      };
    } else {
      // 如果不可叠加，仅更新等级和持续时间
      existingBuff.level = Math.max(existingBuff.level, level);
      
      // 刷新持续时间
      if (buffDef.duration > 0) {
        existingBuff.duration = buffDef.duration;
      }
      
      return { 
        success: true, 
        message: `${unit.name} 的 ${buffDef.name} 效果已刷新` 
      };
    }
  } else {
    // 创建新的BUFF
    const newBuff = {
      id: buffId,
      level: level,
      sourceUnitId: sourceUnitId,
      stacks: 1,
      duration: buffDef.duration || -1 // -1表示永久
    };
    
    // 添加BUFF
    unit.buffs.push(newBuff);
    
    // 应用BUFF的立即效果
    // 注意：buffManager模块中没有applyBuffEffect函数
    // 这里我们直接返回成功结果
    
    return { 
      success: true, 
      message: `${unit.name} 获得了 ${buffDef.name} 效果` 
    };
  }
}

// 处理回合开始时的BUFF效果
function processBuffsAtRoundStart(unit, state) {
  if (!unit.buffs || unit.buffs.length === 0) return;
  
  // 使用已导入的模块
  
  // 处理每个BUFF
  for (let i = unit.buffs.length - 1; i >= 0; i--) {
    const buff = unit.buffs[i];
    const buffDef = buffConfig.find(b => b.id === buff.id);
    
    if (!buffDef) continue;
    
    // 如果是回合开始时生效的BUFF
    if (buffDef.timing === 'START_OF_ROUND') {
      // 应用BUFF效果
      // 注意：buffManager模块中没有applyBuffEffect函数
      // 这里我们使用直接处理效果的方式
      const result = { message: `${unit.name} 的 ${buffDef.name} 效果生效` };
      
      if (result.message) {
        state.battleLog.push({
          message: result.message,
          timestamp: Date.now(),
          unitId: unit.id,
          buffId: buff.id
        });
      }
      
      // 如果有伤害或治疗效果
      if (result.damage && result.targetId) {
        const targetUnit = state.battleUnits[result.targetId];
        if (targetUnit) {
          state.battleLog.push({
            message: `${unit.name} 的 ${buffDef.name} 对 ${targetUnit.name} 造成 ${result.damage} 点伤害`,
            timestamp: Date.now(),
            unitId: unit.id,
            targetId: result.targetId,
            damage: result.damage,
            buffId: buff.id
          });
          
          // 检查目标是否被击败
          if (targetUnit.stats.currentHp <= 0) {
            targetUnit.isDefeated = true;
            state.battleLog.push({ 
              message: `${targetUnit.name} 被击败了！`, 
              timestamp: Date.now(),
              unitId: result.targetId
            });
          }
        }
      } else if (result.heal && result.targetId) {
        const targetUnit = state.battleUnits[result.targetId];
        if (targetUnit) {
          state.battleLog.push({
            message: `${unit.name} 的 ${buffDef.name} 为 ${targetUnit.name} 恢复了 ${result.heal} 点生命值`,
            timestamp: Date.now(),
            unitId: unit.id,
            targetId: result.targetId,
            heal: result.heal,
            buffId: buff.id
          });
        }
      }
    }
    
    // 减少BUFF持续回合
    if (buff.duration > 0) {
      buff.duration -= 1;
      
      // 如果BUFF到期了，移除它
      if (buff.duration <= 0) {
        // 移除BUFF效果
        // 使用buffManager的removeBuff函数
        const removeResult = buffManager.removeBuff(unit, buff.id);
        
        // 从列表中移除
        unit.buffs.splice(i, 1);
        
        state.battleLog.push({
          message: `${unit.name} 的 ${buffDef.name} 效果已结束`,
          timestamp: Date.now(),
          unitId: unit.id,
          buffId: buff.id
        });
      }
    }
  }
}

// 处理回合结束时的BUFF效果
function processBuffsAtRoundEnd(unit, state) {
  if (!unit.buffs || unit.buffs.length === 0) return;
  
  // 使用已导入的模块
  
  // 处理每个BUFF
  for (let i = unit.buffs.length - 1; i >= 0; i--) {
    const buff = unit.buffs[i];
    const buffDef = buffConfig.find(b => b.id === buff.id);
    
    if (!buffDef) continue;
    
    // 如果是回合结束时生效的BUFF
    if (buffDef.timing === 'END_OF_ROUND') {
      // 应用BUFF效果
      // 注意：buffManager模块中没有applyBuffEffect函数
      // 这里我们使用直接处理效果的方式
      const result = { message: `${unit.name} 的 ${buffDef.name} 效果生效` };
      
      if (result.message) {
        state.battleLog.push({
          message: result.message,
          timestamp: Date.now(),
          unitId: unit.id,
          buffId: buff.id
        });
      }
      
      // 如果有伤害或治疗效果
      if (result.damage && result.targetId) {
        const targetUnit = state.battleUnits[result.targetId];
        if (targetUnit) {
          state.battleLog.push({
            message: `${unit.name} 的 ${buffDef.name} 对 ${targetUnit.name} 造成 ${result.damage} 点伤害`,
            timestamp: Date.now(),
            unitId: unit.id,
            targetId: result.targetId,
            damage: result.damage,
            buffId: buff.id
          });
          
          // 检查目标是否被击败
          if (targetUnit.stats.currentHp <= 0) {
            targetUnit.isDefeated = true;
            state.battleLog.push({ 
              message: `${targetUnit.name} 被击败了！`, 
              timestamp: Date.now(),
              unitId: result.targetId
            });
          }
        }
      } else if (result.heal && result.targetId) {
        const targetUnit = state.battleUnits[result.targetId];
        if (targetUnit) {
          state.battleLog.push({
            message: `${unit.name} 的 ${buffDef.name} 为 ${targetUnit.name} 恢复了 ${result.heal} 点生命值`,
            timestamp: Date.now(),
            unitId: unit.id,
            targetId: result.targetId,
            heal: result.heal,
            buffId: buff.id
          });
        }
      }
    }
  }
}

// 处理护盾吸收伤害
// 返回: { remainingDamage, absorbedDamage, message }
function processShieldAbsorption(unit, damage) {
  if (!unit.buffs || unit.buffs.length === 0) {
    return { remainingDamage: damage, absorbedDamage: 0, message: '' };
  }
  
  // 使用已导入的模块
  let remainingDamage = damage;
  let totalAbsorbedDamage = 0;
  let shieldMessages = [];
  
  // 遍历单位的所有护盾类型BUFF
  unit.buffs.forEach(buff => {
    if (remainingDamage <= 0) return; // 如果伤害已完全被吸收，跳过
    
    const buffDef = buffConfig.find(b => b.id === buff.id);
    if (!buffDef || buffDef.type !== 'SHIELD') return; // 只处理护盾类型BUFF
    
    // 计算护盾吸收量
    let shieldAmount = 0;
    if (buffDef.shieldAmount) {
      shieldAmount = buffDef.shieldAmount * buff.level;
    } else if (buffDef.shieldPercentage) {
      shieldAmount = Math.floor(unit.stats.maxHp * buffDef.shieldPercentage * buff.level);
    }
    
    // 如果护盾已有剩余值字段
    if (buff.remainingShield !== undefined) {
      shieldAmount = buff.remainingShield;
    }
    
    if (shieldAmount <= 0) return; // 护盾已耗尽
    
    // 计算实际吸收量
    const absorbedDamage = Math.min(remainingDamage, shieldAmount);
    remainingDamage -= absorbedDamage;
    totalAbsorbedDamage += absorbedDamage;
    
    // 更新护盾剩余值
    buff.remainingShield = shieldAmount - absorbedDamage;
    
    // 如果护盾耗尽，标记为到期
    if (buff.remainingShield <= 0) {
      buff.duration = 0;
    }
    
    // 添加消息
    shieldMessages.push(`${buffDef.name} 吸收了 ${absorbedDamage} 点伤害`);
  });
  
  return {
    remainingDamage,
    absorbedDamage: totalAbsorbedDamage,
    message: shieldMessages.length > 0 ? shieldMessages.join('\n') : ''
  };
}

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
  // 被动技能相关的action
  triggerPassiveSkills,
  // BUFF相关的action
  applyBuffToUnit,
  removeBuffFromUnit,
  clearAllBuffsFromUnit
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

// 选择器函数已在上方定义

export default battleSlice.reducer;