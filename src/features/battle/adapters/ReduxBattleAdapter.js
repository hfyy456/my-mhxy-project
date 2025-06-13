/*
 * @Author: Claude
 * @Date: 2025-01-27
 * @Description: Redux战斗适配器 - 处理Redux与战斗引擎的数据交换
 */

import { BattleEngineAdapter } from './BattleEngineAdapter';
import summonManagerInstance from '@/store/SummonManager';

/**
 * Redux战斗适配器类
 * 负责Redux状态与战斗引擎之间的数据转换和交换
 */
export class ReduxBattleAdapter {
  constructor(dispatch, getState, summonManager, options = {}) {
    this.dispatch = dispatch;
    this.getState = getState;
    this.summonManager = summonManager || summonManagerInstance;
    
    // 创建战斗引擎适配器
    this.engineAdapter = new BattleEngineAdapter(options);
    
    // 控制权状态
    this.isEngineControlled = false;
    this.lastBattleId = null;
    
    // UI状态管理
    this.uiState = {
      selectedUnitId: null,
      selectedAction: 'attack',
      selectedSkill: null,
      selectedTarget: null
    };
    this.uiStateListeners = new Set();
    
    // 绑定方法
    this.initializeBattleFromRedux = this.initializeBattleFromRedux.bind(this);
    this.transferControlToEngine = this.transferControlToEngine.bind(this);
    this.transferResultsToRedux = this.transferResultsToRedux.bind(this);
    this.getEngineState = this.getEngineState.bind(this);
    this.subscribeToEngineChanges = this.subscribeToEngineChanges.bind(this);
    this.submitPlayerAction = this.submitPlayerAction.bind(this);
    this.advanceBattle = this.advanceBattle.bind(this);
    this.getSelectorsProxy = this.getSelectorsProxy.bind(this);
    this.getControlStatus = this.getControlStatus.bind(this);
    this.forceReset = this.forceReset.bind(this);

    this._subscribeToEngineEvents(); // 订阅引擎事件
    this._log('Redux战斗适配器创建完成');
  }

  /**
   * 从Redux状态初始化战斗
   * @param {Object} initPayload - 战斗初始化数据
   * @returns {Object} 初始化结果
   */
  initializeBattleFromRedux(initPayload) {
    try {
      this._log('开始从Redux初始化战斗', { payload: initPayload });

      // 首先重置引擎适配器，确保从干净状态开始
      this.engineAdapter.reset();
      this._log('引擎适配器已重置');

      // 获取当前Redux状态
      const reduxState = this.getState();
      
      // 转换Redux数据为战斗引擎格式
      const battleConfig = this._convertReduxToBattleConfig(initPayload, reduxState);
      
      // 使用引擎适配器初始化战斗
      const result = this.engineAdapter.initializeBattle(battleConfig);
      
      if (result.success) {
        this.lastBattleId = result.battleId;
        this._log('战斗引擎初始化成功', { battleId: result.battleId });
      } else {
        this._log('战斗引擎初始化失败', { error: result.error });
      }
      
      return result;
    } catch (error) {
      this._log('从Redux初始化战斗失败', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 将控制权转移给战斗引擎
   * @returns {Object} 转移结果
   */
  transferControlToEngine() {
    if (this.isEngineControlled) {
      return {
        success: false,
        error: '战斗引擎已经拥有控制权'
      };
    }

    try {
      this.isEngineControlled = true;
      
      // 派发Redux action表示控制权转移（仅通知状态变更，不传递数据）
      this.dispatch({
        type: 'battle/transferControlToEngine',
        payload: {
          battleId: this.lastBattleId,
          timestamp: Date.now()
        }
      });

      this._log('控制权已转移给战斗引擎', { battleId: this.lastBattleId });
      
      return {
        success: true,
        battleId: this.lastBattleId,
        controlledBy: 'engine'
      };
    } catch (error) {
      this.isEngineControlled = false;
      this._log('控制权转移失败', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 将战斗结果转移回Redux
   * @returns {Object} 转移结果
   */
  transferResultsToRedux() {
    if (!this.isEngineControlled) {
      return {
        success: false,
        error: '战斗引擎没有控制权'
      };
    }

    try {
      // 获取战斗结果
      const battleResult = this.engineAdapter.getBattleResult();
      const engineState = this.engineAdapter.getBattleState();

      if (!battleResult) {
        return {
          success: false,
          error: '战斗尚未结束，无法转移结果'
        };
      }

      // 转换结果为Redux格式
      const reduxResult = this._convertEngineResultToRedux(battleResult, engineState);

      // 派发结果到Redux
      this.dispatch({
        type: 'battle/receiveBattleResult',
        payload: reduxResult
      });

      // 重置控制权
      this.isEngineControlled = false;
      this.lastBattleId = null;

      // 重置引擎适配器
      this.engineAdapter.reset();

      this._log('战斗结果已转移回Redux', { result: reduxResult });

      return {
        success: true,
        result: reduxResult,
        controlledBy: 'redux'
      };
    } catch (error) {
      this._log('结果转移失败', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取引擎状态（用于UI组件）
   * @returns {Object} 引擎状态
   */
  getEngineState() {
    if (!this.isEngineControlled) {
      // 如果引擎没有控制权，返回Redux状态
      return this._getReduxBattleState();
    }

    return this.engineAdapter.getBattleState();
  }

  /**
   * 订阅引擎状态变化
   * @param {Function} callback - 状态变化回调
   * @returns {Function} 取消订阅函数
   */
  subscribeToEngineChanges(callback) {
    if (!this.isEngineControlled) {
      // 如果引擎没有控制权，立即调用回调并返回空函数
      callback(this._getReduxBattleState());
      return () => {};
    }

    return this.engineAdapter.subscribeToStateChanges(callback);
  }

  /**
   * 提交玩家行动（转发到引擎）
   * @param {string} unitId - 单位ID
   * @param {Object} action - 行动数据
   * @returns {Object} 提交结果
   */
  submitPlayerAction(unitId, action) {
    if (!this.isEngineControlled) {
      // 如果引擎没有控制权，转发到Redux
      this.dispatch({
        type: 'battle/setUnitAction',
        payload: { unitId, action }
      });
      
      return { success: true, via: 'redux' };
    }

    // 转换行动数据格式：actionType -> type
    const convertedAction = this._convertActionFormat(action);
    
    return this.engineAdapter.submitPlayerAction(unitId, convertedAction);
  }

  /**
   * 推进战斗流程（转发到引擎）
   * @returns {Object} 推进结果
   */
  advanceBattle() {
    if (!this.isEngineControlled) {
      // 如果引擎没有控制权，转发到Redux
      this.dispatch({
        type: 'battle/executeAction'
      });
      
      return { success: true, via: 'redux' };
    }

    return this.engineAdapter.advanceBattle();
  }

  /**
   * 获取兼容的选择器代理
   * @returns {Object} 选择器代理
   */
  getSelectorsProxy() {
    if (!this.isEngineControlled) {
      // 如果引擎没有控制权，返回Redux选择器
      return this._getReduxSelectorsProxy();
    }

    return this.engineAdapter.getSelectorsProxy();
  }

  /**
   * 检查当前控制权状态
   * @returns {Object} 控制权信息
   */
  getControlStatus() {
    return {
      isEngineControlled: this.isEngineControlled,
      currentBattleId: this.lastBattleId,
      controlledBy: this.isEngineControlled ? 'engine' : 'redux'
    };
  }

  /**
   * 获取战斗引擎实例（用于UI层直接访问）
   * @returns {Object|null} 战斗引擎实例
   */
  get battleEngine() {
    if (!this.isEngineControlled || !this.engineAdapter) {
      return null;
    }
    return this.engineAdapter.engine;
  }

  /**
   * 获取事件总线（用于组件订阅事件）
   * @returns {BattleEventBus|null}
   */
  get eventBus() {
    if (!this.engineAdapter) {
      return null;
    }
    return this.engineAdapter.eventBus;
  }

  /**
   * 强制重置适配器状态
   */
  forceReset() {
    try {
      // 重置控制权状态
      this.isEngineControlled = false;
      this.lastBattleId = null;
      
      // 重置UI状态
      this.uiState = {
        selectedUnitId: null,
        selectedAction: 'attack',
        selectedSkill: null,
        selectedTarget: null
      };
      
      // 清空UI监听器
      this.uiStateListeners.clear();
      
      // 重置引擎适配器
      this.engineAdapter.reset();

      this._log('适配器已强制重置');
      
      return { success: true };
    } catch (error) {
      this._log('强制重置失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 订阅关键的战斗引擎事件
   * @private
   */
  _subscribeToEngineEvents() {
    if (!this.eventBus) {
      this._log('事件总线不可用，无法订阅事件');
      return;
    }

    this.eventBus.subscribe('BATTLE_ENDED', this._handleBattleEnded.bind(this));
    this.eventBus.subscribe('DAMAGE_DEALT', this._handleDamageDealt.bind(this));
    // 在这里可以订阅更多事件...
    
    this._log('已成功订阅战斗引擎事件');
  }

  /**
   * 处理战斗结束事件
   * @private
   */
  _handleBattleEnded(event) {
    this._log('接收到战斗结束事件，延迟1.5秒后将结果转移回Redux', event.data);
    
    setTimeout(() => {
      this.transferResultsToRedux();
    }, 1500); // 延迟1.5秒，等待动画播放
  }

  /**
   * 处理伤害事件
   * @private
   */
  _handleDamageDealt(event) {
    const { targetId, newHp, isDefeated } = event.data;
    this._log('接收到伤害事件，准备派发到Redux', event.data);

    this.dispatch({
      type: 'battle/applyDamage',
      payload: {
        unitId: targetId,
        newHp,
        isDefeated
      }
    });
  }

  /**
   * 转换Redux数据为战斗引擎配置
   * @private
   */
  _convertReduxToBattleConfig(initPayload, reduxState) {
    this._log('转换战斗配置数据', { initPayload });
    
    const { battleUnits, playerTeam, enemyTeam, playerFormation, enemyGroup } = initPayload;
    
    let playerUnits = {};
    let enemyUnits = {};

    // 优先处理新格式：battleUnits 对象
    if (battleUnits && typeof battleUnits === 'object') {
      Object.entries(battleUnits).forEach(([unitId, unit]) => {
        const unitWithPosition = {
          ...unit,
          gridPosition: this._getUnitGridPosition(unitId, 
            unit.isPlayerUnit ? playerFormation : enemyGroup?.formation, 
            0)
        };
        
        if (unit.isPlayerUnit) {
          playerUnits[unitId] = unitWithPosition;
        } else {
          enemyUnits[unitId] = unitWithPosition;
        }
      });
    } else {
      // 处理玩家单位 (向后兼容或新格式)
     if (playerFormation) {
        playerFormation.flat().forEach(summonId => {
          if (summonId) {
            const summonInstance = this.summonManager.getSummonById(summonId);
            if (summonInstance) {
              const unitData = summonInstance.toBattleJSON();
              playerUnits[unitData.id] = {
                ...unitData,
                isPlayerUnit: true,
                isDefeated: false,
                isDefending: false,
                gridPosition: this._getUnitGridPosition(unitData.id, playerFormation, 0)
              };
            }
          }
        });
      }

      // 处理敌人单位
       if (enemyGroup?.enemies && Array.isArray(enemyGroup.enemies)) { // 新增的正确逻辑
        const enemyFormationGrid = enemyGroup.enemyFormation?.grid;
        enemyGroup.enemies.forEach((summonInstance, index) => {
          const unit = summonInstance.toBattleJSON(); // 转换为普通对象
          enemyUnits[unit.id] = {
            ...unit,
            isPlayerUnit: false,
            isDefeated: false,
            isDefending: false,
            gridPosition: this._getUnitGridPosition(unit.id, enemyFormationGrid, index)
          };
        });
      }
    }

    this._log('数据转换完成', { 
      playerUnitsCount: Object.keys(playerUnits).length,
      playerUnits,
      enemyUnitsCount: Object.keys(enemyUnits).length ,
      enemyUnits
    });

    return {
      battleId: initPayload.battleId,
      playerUnits,
      enemyUnits,
      playerFormation: playerFormation || this._createEmptyFormation(),
      // 修正阵型路径
      enemyFormation: enemyGroup?.enemyFormation?.grid || enemyGroup?.formation || initPayload.enemyFormation || this._createEmptyFormation()
    };
  }

  /**
   * 转换引擎结果为Redux格式
   * @private
   */
  _convertEngineResultToRedux(battleResult, engineState) {
    return {
      battleId: battleResult.battleId,
      result: battleResult.type, // 'victory', 'defeat', 'draw'
      reason: battleResult.reason,
      rounds: battleResult.rounds,
      timestamp: battleResult.timestamp,
      capturedSummons: engineState.capturedUnits || [],
      rewards: this._calculateRewards(battleResult, engineState),
      statistics: this._generateBattleStatistics(engineState),
      finalState: {
        playerUnits: this._extractPlayerUnits(engineState),
        enemyUnits: this._extractEnemyUnits(engineState)
      }
    };
  }

  /**
   * 获取Redux战斗状态
   * @private
   */
  _getReduxBattleState() {
    const state = this.getState();
    return state.battle || {};
  }

  /**
   * 获取Redux选择器代理
   * @private
   */
  _getReduxSelectorsProxy() {
    const state = this.getState();
    const battleState = state.battle || {};

    return {
      selectIsBattleActive: () => battleState.isActive || false,
      selectCurrentPhase: () => battleState.currentPhase || 'idle',
      selectCurrentRound: () => battleState.currentRound || 0,
      selectBattleResult: () => battleState.battleResult,
      selectBattleUnits: () => battleState.battleUnits || {},
      selectPlayerFormation: () => battleState.playerFormation || [],
      selectEnemyFormation: () => battleState.enemyFormation || [],
      selectTurnOrder: () => battleState.turnOrder || [],
      selectCurrentTurnUnitId: () => battleState.currentTurnUnitId,
      selectUnitActions: () => battleState.unitActions || {},
      selectBattleLog: () => battleState.battleLog || [],
      selectRewards: () => battleState.rewards,
      selectBattleUnitById: (unitId) => battleState.battleUnits?.[unitId] || null,
      selectUnitActionById: (unitId) => battleState.unitActions?.[unitId] || null,
      selectAllUnitsHaveActions: () => {
        const units = battleState.battleUnits || {};
        const actions = battleState.unitActions || {};
        const activeUnits = Object.values(units).filter(unit => !unit.isDefeated);
        return activeUnits.length > 0 && activeUnits.every(unit => actions[unit.id]);
      }
    };
  }

  /**
   * 获取单位网格位置
   * @private
   */
  _getUnitGridPosition(unitId, formation, fallbackIndex) {
    if (formation && Array.isArray(formation)) {
      for (let row = 0; row < formation.length; row++) {
        for (let col = 0; col < formation[row].length; col++) {
          if (formation[row][col] === unitId) {
            return { row, col };
          }
        }
      }
    }
    
    // 如果没有找到，使用回退位置
    return {
      row: Math.floor(fallbackIndex / 3),
      col: fallbackIndex % 3
    };
  }

  /**
   * 创建空阵型
   * @private
   */
  _createEmptyFormation() {
    return Array(3).fill(null).map(() => Array(3).fill(null));
  }

  /**
   * 计算战斗奖励
   * @private
   */
  _calculateRewards(battleResult, engineState) {
    if (battleResult.type !== 'victory') {
      return null;
    }

    // 基础奖励计算
    const baseExp = 100;
    const roundMultiplier = Math.max(0.5, 1 - (battleResult.rounds - 1) * 0.1);
    
    return {
      experience: Math.floor(baseExp * roundMultiplier),
      items: [],
      currency: Math.floor(50 * roundMultiplier),
      message: `获得 ${Math.floor(baseExp * roundMultiplier)} 经验值和 ${Math.floor(50 * roundMultiplier)} 金币！`
    };
  }

  /**
   * 生成战斗统计
   * @private
   */
  _generateBattleStatistics(engineState) {
    return {
      totalRounds: engineState.currentRound,
      totalActions: engineState.battleLog?.length || 0,
      playerUnitsRemaining: this._countActiveUnits(engineState, true),
      enemyUnitsRemaining: this._countActiveUnits(engineState, false)
    };
  }

  /**
   * 统计活跃单位数量
   * @private
   */
  _countActiveUnits(engineState, isPlayerUnit) {
    const units = engineState.battleUnits || {};
    return Object.values(units)
      .filter(unit => unit.isPlayerUnit === isPlayerUnit && !unit.isDefeated)
      .length;
  }

  /**
   * 提取玩家单位
   * @private
   */
  _extractPlayerUnits(engineState) {
    const units = engineState.battleUnits || {};
    const playerUnits = {};
    
    for (const [unitId, unit] of Object.entries(units)) {
      if (unit.isPlayerUnit) {
        playerUnits[unitId] = unit;
      }
    }
    
    return playerUnits;
  }

  /**
   * 提取敌方单位
   * @private
   */
  _extractEnemyUnits(engineState) {
    const units = engineState.battleUnits || {};
    const enemyUnits = {};
    
    for (const [unitId, unit] of Object.entries(units)) {
      if (!unit.isPlayerUnit) {
        enemyUnits[unitId] = unit;
      }
    }
    
    return enemyUnits;
  }

  /**
   * 转换行动数据格式（UI格式 -> 引擎格式）
   * @private
   */
  _convertActionFormat(action) {
    // 复制原始行动数据
    const convertedAction = { ...action };
    
    // 转换 actionType -> type
    if (action.actionType && !action.type) {
      convertedAction.type = action.actionType;
      delete convertedAction.actionType;
    }
    
    // 转换 targetIds -> targets (如果需要)
    if (action.targetIds && !action.targets) {
      convertedAction.targets = action.targetIds;
    }
    
    this._log('行动数据格式转换', { 
      original: action, 
      converted: convertedAction 
    });
    
    return convertedAction;
  }

  /**
   * 日志记录
   * @private
   */
  _log(message, data = {}) {
    // console.log(`[ReduxBattleAdapter] ${message}`, data);
  }

  /**
   * UI交互方法 - 选择单位
   * @param {string} unitId - 单位ID
   */
  selectUnit(unitId) {
    this.uiState.selectedUnitId = unitId;
    this.uiState.selectedTarget = null; // 重置目标选择
    this._notifyUIStateChange();
    this._log('选择单位', { unitId });
  }

  /**
   * UI交互方法 - 选择行动类型
   * @param {string} actionType - 行动类型
   */
  selectAction(actionType) {
    this.uiState.selectedAction = actionType;
    this.uiState.selectedSkill = null;
    this.uiState.selectedTarget = null;
    this._notifyUIStateChange();
    this._log('选择行动类型', { actionType });
  }

  /**
   * UI交互方法 - 选择技能
   * @param {string} skillId - 技能ID
   */
  selectSkill(skillId) {
    this.uiState.selectedSkill = skillId;
    this.uiState.selectedTarget = null;
    this._notifyUIStateChange();
    this._log('选择技能', { skillId });
  }

  /**
   * UI交互方法 - 选择目标
   * @param {string} targetId - 目标单位ID
   */
  selectTarget(targetId) {
    this.uiState.selectedTarget = targetId;
    this._notifyUIStateChange();
    this._log('选择目标', { targetId });
  }

  /**
   * UI交互方法 - 确认行动
   * @returns {Object} 确认结果
   */
  confirmAction() {
    const { selectedUnitId, selectedAction, selectedSkill, selectedTarget } = this.uiState;
    
    if (!selectedUnitId) {
      return { success: false, error: '未选择单位' };
    }
    
    const actionData = {
      actionType: selectedAction,
      skillId: selectedAction === 'skill' ? selectedSkill : null,
      targetIds: selectedTarget ? [selectedTarget] : []
    };
    
    // 验证行动数据
    const validationResult = this._validateActionData(actionData);
    if (!validationResult.valid) {
      return { success: false, error: validationResult.error };
    }
    
    // 提交行动
    const result = this.submitPlayerAction(selectedUnitId, actionData);
    
    if (result.success) {
      // 重置UI状态
      this._resetActionSelection();
      this._log('行动确认成功', { unitId: selectedUnitId, action: actionData });
    }
    
    return result;
  }

  /**
   * 获取UI状态
   * @returns {Object} UI状态
   */
  getUIState() {
    return { ...this.uiState };
  }

  /**
   * 获取单位交互数据
   * @param {string} unitId - 单位ID
   * @returns {Object} 交互数据
   */
  getUnitInteractionData(unitId) {
    if (!unitId) return null;
    
    if (this.isEngineControlled && this.engineAdapter) {
      const engine = this.engineAdapter.engine;
      if (!engine) return null;
      let result = {
        unit: engine.getUnit(unitId),
        activeSkills: engine.getUnitActiveSkills(unitId),
        validTargets: engine.getValidTargets(
          unitId, 
          this.uiState.selectedAction, 
          this.uiState.selectedSkill
        ),
        capturableTargets: engine.getCapturableTargets(),
        actionDescription: engine.getActionDescription(unitId),
        skillAffectedArea: this.uiState.selectedSkill && this.uiState.selectedTarget
          ? engine.getSkillAffectedArea(this.uiState.selectedSkill, this.uiState.selectedTarget)
          : [],
        availableActionTypes: engine.getAvailableActionTypes(unitId)
      };
      console.log(result,"result123");
      return result
    }
    
    // 回退到Redux数据
    return this._getReduxUnitInteractionData(unitId);
  }

  /**
   * 订阅UI状态变化
   * @param {Function} callback - 状态变化回调
   * @returns {Function} 取消订阅函数
   */
  subscribeToUIStateChanges(callback) {
    this.uiStateListeners.add(callback);
    
    // 立即调用一次回调
    callback(this.uiState);
    
    return () => {
      this.uiStateListeners.delete(callback);
    };
  }

  /**
   * 获取数据查询接口
   * @returns {Object} 查询接口
   */
  getDataQueryInterface() {
    return {
      getActiveSkills: (unitId) => {
        if (this.isEngineControlled && this.engineAdapter) {
          return this.engineAdapter.engine.getUnitActiveSkills(unitId);
        }
        return this._getReduxActiveSkills(unitId);
      },
      
      getValidTargets: (unitId, actionType, skillId) => {
        if (this.isEngineControlled && this.engineAdapter) {
          return this.engineAdapter.engine.getValidTargets(unitId, actionType, skillId);
        }
        return this._getReduxValidTargets(unitId, actionType, skillId);
      },
      
      getSkillAffectedArea: (skillId, targetId) => {
        if (this.isEngineControlled && this.engineAdapter) {
          return this.engineAdapter.engine.getSkillAffectedArea(skillId, targetId);
        }
        return this._getReduxSkillAffectedArea(skillId, targetId);
      },
      
      getActionDescription: (unitId) => {
        if (this.isEngineControlled && this.engineAdapter) {
          return this.engineAdapter.engine.getActionDescription(unitId);
        }
        return this._getReduxActionDescription(unitId);
      },
      
      isAllUnitsReady: () => {
        if (this.isEngineControlled && this.engineAdapter) {
          return this.engineAdapter.engine.isAllUnitsReady();
        }
        return this._getReduxAllUnitsReady();
      }
    };
  }

  /**
   * 通知UI状态变化
   * @private
   */
  _notifyUIStateChange() {
    this.uiStateListeners.forEach(listener => {
      try {
        listener(this.uiState);
      } catch (error) {
        this._log('UI状态监听器错误', { error: error.message });
      }
    });
  }

  /**
   * 验证行动数据
   * @private
   */
  _validateActionData(actionData) {
    if (!actionData.actionType) {
      return { valid: false, error: '未指定行动类型' };
    }
    
    if (actionData.actionType === 'skill' && !actionData.skillId) {
      return { valid: false, error: '技能行动必须指定技能ID' };
    }
    
    if (['attack', 'skill'].includes(actionData.actionType) && 
        (!actionData.targetIds || actionData.targetIds.length === 0)) {
      return { valid: false, error: '攻击和技能行动必须指定目标' };
    }
    
    return { valid: true };
  }

  /**
   * 重置行动选择状态
   * @private
   */
  _resetActionSelection() {
    this.uiState.selectedAction = 'attack';
    this.uiState.selectedSkill = null;
    this.uiState.selectedTarget = null;
    this._notifyUIStateChange();
  }

  /**
   * 获取Redux单位交互数据（回退方案）
   * @private
   */
  _getReduxUnitInteractionData(unitId) {
    const reduxState = this.getState().battle;
    const unit = reduxState.battleUnits[unitId];
    
    if (!unit) return null;
    
    return {
      unit,
      activeSkills: this._getReduxActiveSkills(unitId),
      validTargets: this._getReduxValidTargets(unitId, this.uiState.selectedAction, this.uiState.selectedSkill),
      actionDescription: this._getReduxActionDescription(unitId),
      skillAffectedArea: [],
      availableActionTypes: ['attack', 'defend', 'skill']
    };
  }

  /**
   * 获取Redux主动技能（回退方案）
   * @private
   */
  _getReduxActiveSkills(unitId) {
    const reduxState = this.getState().battle;
    const unit = reduxState.battleUnits[unitId];
    
    if (!unit || !unit.skillSet) return [];
    
    // 这里需要实现Redux版本的技能获取逻辑
    // 暂时返回空数组
    return [];
  }

  /**
   * 获取Redux有效目标（回退方案）
   * @private
   */
  _getReduxValidTargets(unitId, actionType, skillId) {
    // 这里需要实现Redux版本的目标选择逻辑
    // 暂时返回空数组
    return [];
  }

  /**
   * 获取Redux技能影响区域（回退方案）
   * @private
   */
  _getReduxSkillAffectedArea(skillId, targetId) {
    // 这里需要实现Redux版本的影响区域计算
    // 暂时返回空数组
    return [];
  }

  /**
   * 获取Redux行动描述（回退方案）
   * @private
   */
  _getReduxActionDescription(unitId) {
    const reduxState = this.getState().battle;
    const action = reduxState.unitActions[unitId];
    
    if (!action) return '无';
    
    return action.actionType || '未知行动';
  }

  /**
   * 获取Redux所有单位准备状态（回退方案）
   * @private
   */
  _getReduxAllUnitsReady() {
    const reduxState = this.getState().battle;
    const activeUnits = Object.values(reduxState.battleUnits).filter(unit => !unit.isDefeated);
    const unitsWithActions = Object.keys(reduxState.unitActions).length;
    
    return activeUnits.length > 0 && unitsWithActions >= activeUnits.length;
  }
}

// /**
//  * 创建Redux战斗适配器实例
//  * @param {Function} dispatch - Redux dispatch函数
//  * @param {Function} getState - Redux getState函数
//  * @param {Object} options - 配置选项
//  * @returns {ReduxBattleAdapter} 
//  */
export const createReduxBattleAdapter = (dispatch, getState, options = {}) => {
  return new ReduxBattleAdapter(dispatch, getState, options);
};

export default ReduxBattleAdapter; 