/*
 * @Author: Claude
 * @Date: 2025-01-27
 * @Description: 战斗UI交互Hook - 封装所有UI交互逻辑
 */

import { useState, useEffect, useCallback } from 'react';
import { useBattleAdapter } from '../context/BattleAdapterContext.jsx';

/**
 * 战斗UI交互Hook
 * 提供简化的UI交互接口，封装所有业务逻辑
 */
export const useBattleUI = () => {
  const adapter = useBattleAdapter();
  const [uiState, setUIState] = useState(null);
  const [interactionData, setInteractionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 订阅适配器的UI状态变化
  useEffect(() => {
    if (!adapter) return;

    const unsubscribe = adapter.subscribeToUIStateChanges((newUIState) => {
      setUIState(newUIState);
      
      // 当选中单位变化时，获取交互数据
      if (newUIState.selectedUnitId) {
        const data = adapter.getUnitInteractionData(newUIState.selectedUnitId);
        setInteractionData(data);
      } else {
        setInteractionData(null);
      }
    });

    // 初始化UI状态
    const initialState = adapter.getUIState();
    setUIState(initialState);

    return unsubscribe;
  }, [adapter]);

  // 选择单位
  const selectUnit = useCallback((unitId) => {
    if (!adapter) return;
    
    try {
      setError(null);
      adapter.selectUnit(unitId);
    } catch (err) {
      setError(`选择单位失败: ${err.message}`);
    }
  }, [adapter]);

  // 选择行动类型
  const selectAction = useCallback((actionType) => {
    if (!adapter) return;
    
    try {
      setError(null);
      adapter.selectAction(actionType);
    } catch (err) {
      setError(`选择行动类型失败: ${err.message}`);
    }
  }, [adapter]);

  // 选择技能
  const selectSkill = useCallback((skillId) => {
    if (!adapter) return;
    
    try {
      setError(null);
      adapter.selectSkill(skillId);
    } catch (err) {
      setError(`选择技能失败: ${err.message}`);
    }
  }, [adapter]);

  // 选择目标
  const selectTarget = useCallback((targetId) => {
    if (!adapter) return;
    
    try {
      setError(null);
      adapter.selectTarget(targetId);
    } catch (err) {
      setError(`选择目标失败: ${err.message}`);
    }
  }, [adapter]);

  // 确认行动
  const confirmAction = useCallback(async () => {
    if (!adapter) return { success: false, error: '适配器不可用' };
    
    try {
      setLoading(true);
      setError(null);
      
      const result = adapter.confirmAction();
      
      if (!result.success) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      const errorMsg = `确认行动失败: ${err.message}`;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [adapter]);

  // 重置选择状态
  const resetSelection = useCallback(() => {
    if (!adapter) return;
    
    try {
      setError(null);
      adapter.selectAction('attack');
      adapter.selectSkill(null);
      adapter.selectTarget(null);
    } catch (err) {
      setError(`重置选择失败: ${err.message}`);
    }
  }, [adapter]);

  // 获取当前选择的有效性
  const getSelectionValidation = useCallback(() => {
    if (!uiState) return { valid: false, reason: 'UI状态未初始化' };
    
    const { selectedUnitId, selectedAction, selectedSkill, selectedTarget } = uiState;
    
    if (!selectedUnitId) {
      return { valid: false, reason: '未选择单位' };
    }
    
    if (selectedAction === 'defend') {
      return { valid: true, reason: '防御行动有效' };
    }
    
    if (selectedAction === 'attack' && !selectedTarget) {
      return { valid: false, reason: '攻击需要选择目标' };
    }
    
    if (selectedAction === 'skill') {
      if (!selectedSkill) {
        return { valid: false, reason: '技能行动需要选择技能' };
      }
      if (!selectedTarget) {
        return { valid: false, reason: '技能行动需要选择目标' };
      }
    }
    
    return { valid: true, reason: '选择有效' };
  }, [uiState]);

  // 如果没有适配器，返回空实现
  if (!adapter) {
    return {
      // UI状态
      selectedUnitId: null,
      selectedAction: 'attack',
      selectedSkill: null,
      selectedTarget: null,
      
      // 交互数据
      activeSkills: [],
      validTargets: [],
      capturableTargets: [],
      actionDescription: '无',
      skillAffectedArea: [],
      availableActionTypes: [],
      
      // 交互方法
      selectUnit: () => {},
      selectAction: () => {},
      selectSkill: () => {},
      selectTarget: () => {},
      confirmAction: () => Promise.resolve({ success: false, error: '适配器不可用' }),
      resetSelection: () => {},
      
      // 状态信息
      loading: false,
      error: '战斗适配器不可用',
      isValid: false,
      validationReason: '适配器不可用'
    };
  }

  return {
    // UI状态
    selectedUnitId: uiState?.selectedUnitId || null,
    selectedAction: uiState?.selectedAction || 'attack',
    selectedSkill: uiState?.selectedSkill || null,
    selectedTarget: uiState?.selectedTarget || null,
    
    // 交互数据
    activeSkills: interactionData?.activeSkills || [],
    validTargets: interactionData?.validTargets || [],
    capturableTargets: interactionData?.capturableTargets || [],
    actionDescription: interactionData?.actionDescription || '无',
    skillAffectedArea: interactionData?.skillAffectedArea || [],
    availableActionTypes: interactionData?.availableActionTypes || ['attack', 'defend'],
    
    // 交互方法
    selectUnit,
    selectAction,
    selectSkill,
    selectTarget,
    confirmAction,
    resetSelection,
    
    // 状态信息
    loading,
    error,
    isValid: getSelectionValidation().valid,
    validationReason: getSelectionValidation().reason
  };
};

/**
 * 战斗组件数据Hook
 * 为各个子组件提供数据
 */
export const useBattleComponentData = () => {
  const adapter = useBattleAdapter();
  const battleUI = useBattleUI();
  const [skillStep, setSkillStep] = useState(1);
  
  // 重置步骤状态
  useEffect(() => {
    if (battleUI.selectedAction !== 'skill') {
      setSkillStep(1);
    }
  }, [battleUI.selectedAction]);
  
  if (!adapter) {
    return {
      actionTypeData: null,
      actionContentData: null,
      gridData: null,
      timelineData: null,
      logData: null,
      statsData: null
    };
  }

  // 获取数据查询接口
  const queryInterface = adapter.getDataQueryInterface();
  
  // ActionContentSelector的回调函数
  const handleSkillSelect = useCallback((skillId) => {
    battleUI.selectSkill(skillId);
  }, [battleUI]);
  
  const handleTargetSelect = useCallback((targetId) => {
    battleUI.selectTarget(targetId);
  }, [battleUI]);
  
  const handleConfirmAction = useCallback(async () => {
    const result = await battleUI.confirmAction();
    return result;
  }, [battleUI]);
  
  const handleResetAction = useCallback(() => {
    // 通过适配器重置单位行动
    try {
      if (!battleUI.selectedUnitId) {
        console.error('没有选中的单位');
        return;
      }

      // 重置引擎中的单位行动
      if (adapter.battleEngine) {
        const result = adapter.battleEngine.resetUnitAction(battleUI.selectedUnitId);
        if (result.success) {
          console.log('单位行动重置成功:', result);
        } else {
          console.error('单位行动重置失败:', result.error);
        }
      }

      // 重置UI选择状态
      battleUI.selectAction('attack');
      battleUI.selectSkill(null);
      battleUI.selectTarget(null);
      
      // 重置技能步骤
      setSkillStep(1);
      
    } catch (err) {
      console.error('重置行动失败:', err);
    }
  }, [adapter, battleUI, setSkillStep]);
  
  const handleEscapeBattle = useCallback(() => {
    // 通过适配器逃跑
    try {
      adapter.escapeBattle?.();
    } catch (err) {
      console.error('逃跑失败:', err);
    }
  }, [adapter]);
  
  const handleNextStep = useCallback(() => {
    if (skillStep === 1 && battleUI.selectedSkill) {
      setSkillStep(2);
    }
  }, [skillStep, battleUI.selectedSkill]);
  
  const handlePrevStep = useCallback(() => {
    if (skillStep === 2) {
      setSkillStep(1);
      battleUI.selectTarget(null); // 清除目标选择
    }
  }, [skillStep, battleUI]);
  
  // 获取单位是否已有行动
  const getUnitHasAction = useCallback((unitId) => {
    try {
      if (!unitId || !adapter) return false;
      
      // 使用引擎的方法检查单位是否有行动
      if (adapter.battleEngine) {
        return adapter.battleEngine.unitActions.has(unitId);
      }
      
      // 回退到引擎状态检查
      const engineState = adapter.getEngineState();
      if (!engineState) return false;
      
      // 如果引擎有unitActions数据，使用它
      if (engineState.unitActions) {
        return engineState.unitActions[unitId] != null;
      }
      
      return false;
    } catch (err) {
      console.error('获取单位行动状态失败:', err);
      return false;
    }
  }, [adapter]);
  
  return {
    // 行动类型选择器数据
    actionTypeData: {
      availableActions: battleUI.availableActionTypes,
      selectedAction: battleUI.selectedAction,
      onActionSelect: battleUI.selectAction,
      disabled: battleUI.loading
    },
    
    // 行动内容选择器数据
    actionContentData: {
      // 基础数据
      selectedAction: battleUI.selectedAction,
      selectedSkill: battleUI.selectedSkill,
      selectedTarget: battleUI.selectedTarget,
      hasAction: battleUI.selectedUnitId ? getUnitHasAction(battleUI.selectedUnitId) : false,
      
      // 数据列表
      activeSkills: battleUI.activeSkills,
      validTargets: battleUI.validTargets,
      capturableTargets: battleUI.capturableTargets,
      
      // 状态信息
      actionDescription: battleUI.actionDescription,
      skillStep: skillStep,
      loading: battleUI.loading,
      error: battleUI.error,
      
      // 回调函数
      onSkillSelect: handleSkillSelect,
      onTargetSelect: handleTargetSelect,
      onConfirmAction: handleConfirmAction,
      onResetAction: handleResetAction,
      onEscapeBattle: handleEscapeBattle,
      onNextStep: handleNextStep,
      onPrevStep: handlePrevStep,
      
      // 配置
      showStepIndicator: true,
      disabled: battleUI.loading
    },
    
    // 网格渲染器数据
    gridData: {
      // 基础数据
      selectedUnitId: battleUI.selectedUnitId,
      selectedAction: battleUI.selectedAction,
      selectedSkill: battleUI.selectedSkill,
      selectedTarget: battleUI.selectedTarget,
      
      // 战斗状态数据
      playerFormation: (() => {
        try {
          const engineState = adapter.getEngineState();
          return engineState?.playerFormation || [];
        } catch (err) {
          console.error('获取玩家阵型失败:', err);
          return [];
        }
      })(),
      enemyFormation: (() => {
        try {
          const engineState = adapter.getEngineState();
          return engineState?.enemyFormation || [];
        } catch (err) {
          console.error('获取敌方阵型失败:', err);
          return [];
        }
      })(),
      battleUnits: (() => {
        try {
          const engineState = adapter.getEngineState();
          return engineState?.battleUnits || {};
        } catch (err) {
          console.error('获取战斗单位失败:', err);
          return {};
        }
      })(),
      currentPhase: (() => {
        try {
          const engineState = adapter.getEngineState();
          return engineState?.currentPhase || 'preparation';
        } catch (err) {
          console.error('获取当前阶段失败:', err);
          return 'preparation';
        }
      })(),
      currentRound: (() => {
        try {
          const engineState = adapter.getEngineState();
          return engineState?.currentRound || 1;
        } catch (err) {
          console.error('获取当前回合失败:', err);
          return 1;
        }
      })(),
      battleLog: (() => {
        try {
          const engineState = adapter.getEngineState();
          return engineState?.battleLog || [];
        } catch (err) {
          console.error('获取战斗日志失败:', err);
          return [];
        }
      })(),
      unitActions: (() => {
        try {
          const engineState = adapter.getEngineState();
          return engineState?.unitActions || {};
        } catch (err) {
          console.error('获取单位行动失败:', err);
          return {};
        }
      })(),
      
      // 预计算的UI数据
      attackableGridPositions: (() => {
        try {
          const engineState = adapter.getEngineState();
          if (!engineState || !battleUI.selectedUnitId) return [];
          
          return adapter.battleEngine?.getAttackableGridPositions?.(battleUI.selectedUnitId) || [];
        } catch (err) {
          console.error('获取攻击范围失败:', err);
          return [];
        }
      })(),
      skillAffectedArea: battleUI.skillAffectedArea,
      allUnitsHaveActions: (() => {
        try {
          const engineState = adapter.getEngineState();
          return engineState ? adapter.battleEngine?.isAllUnitsReady?.() || false : false;
        } catch (err) {
          console.error('检查单位准备状态失败:', err);
          return false;
        }
      })(),
      
      // 按钮状态数据
      executionButtonText: (() => {
        try {
          const engineState = adapter.getEngineState();
          if (!engineState) return '等待中...';
          
          const currentPhase = engineState.currentPhase;
          const allReady = adapter.battleEngine?.isAllUnitsReady?.() || false;
          
          if (currentPhase === 'execution') {
            return '执行中...';
          } else if (currentPhase === 'preparation' && !allReady) {
            return '等待指令...';
          } else if (currentPhase === 'preparation' && allReady) {
            return '开始执行';
          } else if (currentPhase === 'battle_end') {
            return '战斗结束';
          } else {
            return '等待中...';
          }
        } catch (err) {
          console.error('获取按钮文本失败:', err);
          return '等待中...';
        }
      })(),
      executionButtonEnabled: (() => {
        try {
          const engineState = adapter.getEngineState();
          if (!engineState) return false;
          
          const currentPhase = engineState.currentPhase;
          const allReady = adapter.battleEngine?.isAllUnitsReady?.() || false;
          
          return currentPhase === 'preparation' && allReady;
        } catch (err) {
          console.error('检查按钮状态失败:', err);
          return false;
        }
      })(),
      
      // 回调函数
      onUnitClick: (unitId) => {
        // 智能单位点击处理
        try {
          const engineState = adapter.getEngineState();
          if (!engineState) return;
          
          const unit = engineState.battleUnits[unitId];
          if (!unit) return;
          
          if (unit.isPlayerUnit) {
            battleUI.selectUnit(unitId);
          } else if (engineState.currentPhase === 'preparation') {
            battleUI.selectTarget(unitId);
          }
        } catch (err) {
          console.error('单位点击处理失败:', err);
        }
      },
      onStartExecution: () => {
        try {
          const engineState = adapter.getEngineState();
          if (!engineState) return;
          
          if (engineState.currentPhase === 'preparation') {
            // 直接调用适配器的推进方法
            const result = adapter.advanceBattle();
            console.log('手动推进到执行阶段', result);
          }
        } catch (err) {
          console.error('开始执行失败:', err);
        }
      },
      
      // 配置选项
      disabled: battleUI.loading,
      showPhaseInfo: true,
      showExecutionButton: true
    },
    
    // 时间轴数据
    timelineData: {
      // 基础单位数据 - ActionOrderTimeline组件需要
      units: (() => {
        try {
          const engineState = adapter.getEngineState();
          console.log('TimelineData获取引擎状态:', {
            hasEngineState: !!engineState,
            battleUnits: engineState?.battleUnits ? Object.keys(engineState.battleUnits) : [],
            unitCount: engineState?.battleUnits ? Object.keys(engineState.battleUnits).length : 0
          });
          
          if (!engineState) return [];
          
          const units = Object.values(engineState.battleUnits).filter(unit => !unit.isDefeated);
          console.log('TimelineData处理后的单位:', {
            totalUnits: units.length,
            unitNames: units.map(u => u.name),
            unitIds: units.map(u => u.id)
          });
          
          return units;
        } catch (err) {
          console.error('获取单位数据失败:', err);
          return [];
        }
      })(),
      
      // 当前回合的单位ID
      currentTurnUnitId: (() => {
        try {
          const engineState = adapter.getEngineState();
          return engineState?.currentTurnUnitId || null;
        } catch (err) {
          console.error('获取当前回合单位失败:', err);
          return null;
        }
      })(),
      
      // 单位排序和位置计算
      sortedUnits: (() => {
        try {
          const engineState = adapter.getEngineState();
          if (!engineState) return [];
          
          const allUnits = Object.values(engineState.battleUnits).filter(unit => !unit.isDefeated);
          
          // 按速度排序单位，速度高的先行动
          const sorted = [...allUnits].sort((a, b) => b.derivedAttributes.speed - a.derivedAttributes.speed);
          
          // 计算位置和增强数据
          const speeds = sorted.map(unit => unit.derivedAttributes.speed);
          const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 100;
          const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0;
          const speedRange = Math.max(1, maxSpeed - minSpeed);
          
          return sorted.map((unit, index) => {
            // 计算时间轴位置
            const speedPercent = speedRange > 0 
              ? ((unit.derivedAttributes.speed - minSpeed) / speedRange) * 100 
              : 50;
            const position = `calc(10% + ${speedPercent * 0.8}%)`;
            
            return {
              ...unit,
              timelinePosition: position,
              displayIndex: index + 1,
              tooltipText: `${unit.name} (速度: ${unit.derivedAttributes.speed})`
            };
          });
        } catch (err) {
          console.error('获取单位排序失败:', err);
          return [];
        }
      })(),
      
      // 速度刻度数据
      speedTicks: (() => {
        try {
          const engineState = adapter.getEngineState();
          if (!engineState) return [];
          
          const allUnits = Object.values(engineState.battleUnits).filter(unit => !unit.isDefeated);
          if (allUnits.length === 0) return [];
          
          const speeds = allUnits.map(unit => unit.derivedAttributes.speed);
          const maxSpeed = Math.max(...speeds);
          const minSpeed = Math.min(...speeds);
          const speedRange = Math.max(1, maxSpeed - minSpeed);
          const tickInterval = speedRange / 4;
          
          return Array.from({ length: 5 }).map((_, i) => {
            const speedValue = minSpeed + (i * tickInterval);
            const position = `${i * 25}%`;
            return {
              value: Math.round(speedValue),
              position: position
            };
          });
        } catch (err) {
          console.error('获取速度刻度失败:', err);
          return [];
        }
      })(),
      
      // 回调函数
      onUnitClick: (unit) => {
        try {
          // 点击时间轴上的单位，如果是玩家单位则选中它
          if (unit.isPlayerUnit) {
            battleUI.selectUnit(unit.id);
          }
        } catch (err) {
          console.error('时间轴单位点击处理失败:', err);
        }
      },
      onUnitHover: (unit, isHovering) => {
        try {
          // 鼠标悬停时可以显示额外信息
          // 这里暂时不做特殊处理
        } catch (err) {
          console.error('时间轴单位悬停处理失败:', err);
        }
      },
      
      // 配置选项
      showLegend: true,
      showSpeedTicks: true,
      disabled: battleUI.loading
    },
    
    // 日志数据
    logData: {
      // 预处理的日志数据
      processedLogs: (() => {
        try {
          const engineState = adapter.getEngineState();
          if (!engineState || !engineState.battleLog) return [];
          
          return engineState.battleLog.map((log, index) => {
            // 格式化时间戳
            const formatTimestamp = (timestamp) => {
              const date = new Date(timestamp);
              return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
            };
            
            // 根据日志类型返回不同的样式
            const getLogStyle = (log) => {
              if (log.phase === 'preparation') {
                return 'text-blue-300';
              } else if (log.phase === 'execution') {
                return 'text-amber-300';
              } else if (log.phase === 'battle_end') {
                return 'text-green-300 font-bold';
              } else if (log.phase === 'end') {
                return 'text-purple-300';
              } else if (log.unitId) {
                return 'text-gray-300';
              } else {
                return 'text-white';
              }
            };
            
            // 增强日志数据
            return {
              ...log,
              id: log.id || `log_${index}`,
              formattedTimestamp: log.timestamp ? formatTimestamp(log.timestamp) : null,
              styleClass: getLogStyle(log),
              displayMessage: log.message,
              tooltip: log.tooltip || `${log.phase || '未知阶段'} - ${log.message}`,
              highlighted: log.important || false,
              badge: log.type === 'critical' ? {
                text: '重要',
                className: 'bg-red-600/80 text-white'
              } : log.type === 'success' ? {
                text: '成功',
                className: 'bg-green-600/80 text-white'
              } : null
            };
          });
        } catch (err) {
          console.error('获取战斗日志失败:', err);
          return [];
        }
      })(),
      
      // 回调函数
      onLogClick: (log, index) => {
        try {
          // 点击日志时可以显示详细信息或跳转到相关单位
          console.log('点击日志:', log);
          
          // 如果日志包含单位信息，可以选中该单位
          if (log.unitId) {
            const engineState = adapter.getEngineState();
            if (engineState && engineState.battleUnits[log.unitId]) {
              const unit = engineState.battleUnits[log.unitId];
              if (unit.isPlayerUnit) {
                battleUI.selectUnit(log.unitId);
              }
            }
          }
        } catch (err) {
          console.error('日志点击处理失败:', err);
        }
      },
      onLogHover: (log, index, isHovering) => {
        try {
          // 鼠标悬停时可以显示额外信息
          if (isHovering && log.unitId) {
            // 可以在这里触发单位高亮等效果
          }
        } catch (err) {
          console.error('日志悬停处理失败:', err);
        }
      },
      
      // 配置选项
      autoScroll: true,
      showTimestamp: true,
      showRecordCount: true,
      maxHeight: '160px',
      emptyStateIcon: '📝',
      emptyStateText: '战斗尚未开始...',
      disabled: battleUI.loading
    },
    
    // 统计数据
    statsData: {
      allUnitsReady: queryInterface.isAllUnitsReady(),
      // 其他统计数据
    }
  };
};

export default useBattleUI; 