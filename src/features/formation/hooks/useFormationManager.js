/**
 * useFormationManager - OOP FormationManager 与 React 的桥接 Hook
 * 提供响应式的阵型管理功能
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { formationManager } from '../managers/FormationManager.js';
import { useSummonManager } from '@/hooks/useSummonManager';
import cloneDeep from 'lodash.clonedeep';

export const useFormationManager = () => {
  // 强制重新渲染的状态
  const [updateCounter, setUpdateCounter] = useState(0);
  
  // 获取召唤兽数据用于阵型分析
  const { state: summonManagerState, allSummons: allSummonsFromOOP } = useSummonManager();
  const allSummons = useMemo(() => {
    console.log('[useFormationManager] summonManagerState:', summonManagerState);
    console.log('[useFormationManager] allSummonsFromOOP:', allSummonsFromOOP);
    
    // 优先使用直接获取的 allSummons
    if (allSummonsFromOOP && Object.keys(allSummonsFromOOP).length > 0) {
      const summonsArray = Object.values(allSummonsFromOOP);
      console.log('[useFormationManager] 使用 allSummonsFromOOP，数组:', summonsArray);
      return summonsArray;
    }
    
    // 备用方案：使用 summonsData
    if (!summonManagerState?.summonsData) {
      console.log('[useFormationManager] 无召唤兽数据');
      return [];
    }
    const summonsArray = Object.values(summonManagerState.summonsData);
    console.log('[useFormationManager] 使用 summonsData，数组:', summonsArray);
    return summonsArray;
  }, [summonManagerState?.summonsData, allSummonsFromOOP]);

  // 强制更新函数
  const forceUpdate = useCallback(() => {
    setUpdateCounter(prev => prev + 1);
  }, []);

  // 监听 FormationManager 的变化（通过定期检查）
  useEffect(() => {
    const interval = setInterval(() => {
      // 这里可以添加更复杂的变化检测逻辑
      // 暂时使用简单的定期更新
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 获取所有阵型摘要
  const formationSummaries = useMemo(() => {
    return formationManager.getFormationSummaries();
  }, [updateCounter]);

  // 获取当前阵型
  const currentFormation = useMemo(() => {
    // 使用深拷贝来强制触发更新
    return cloneDeep(formationManager.getCurrentFormation());
  }, [updateCounter]);

  // 获取当前阵型分析
  const currentFormationAnalysis = useMemo(() => {
    return formationManager.getCurrentFormationAnalysis(allSummons);
  }, [updateCounter, allSummons]);

  // 获取当前阵型网格（用于UI显示）
  const currentFormationGrid = useMemo(() => {
    return formationManager.getCurrentFormationGrid();
  }, [updateCounter]);

  // 阵型操作方法（包装以触发重新渲染）
  const createFormation = useCallback((name, options = {}) => {
    const result = formationManager.createFormation(name, options);
    forceUpdate();
    return result;
  }, [forceUpdate]);

  const deleteFormation = useCallback((formationId) => {
    const result = formationManager.deleteFormation(formationId);
    if (result) {
      forceUpdate();
    }
    return result;
  }, [forceUpdate]);

  const renameFormation = useCallback((formationId, newName) => {
    const result = formationManager.renameFormation(formationId, newName);
    if (result) {
      forceUpdate();
    }
    return result;
  }, [forceUpdate]);

  const duplicateFormation = useCallback((formationId, newName = null) => {
    const result = formationManager.duplicateFormation(formationId, newName);
    if (result) {
      forceUpdate();
    }
    return result;
  }, [forceUpdate]);

  const setCurrentFormation = useCallback((formationId) => {
    const result = formationManager.setCurrentFormation(formationId);
    if (result) {
      forceUpdate();
    }
    return result;
  }, [forceUpdate]);

  const setSummonInCurrentFormation = useCallback((row, col, summonId) => {
    const result = formationManager.setCurrentSummon(row, col, summonId);
    if (result) {
      forceUpdate();
    }
    return result;
  }, [forceUpdate]);

  const clearFormation = useCallback((formationId) => {
    const result = formationManager.clearFormation(formationId);
    if (result) {
      forceUpdate();
    }
    return result;
  }, [forceUpdate]);

  const exportFormation = useCallback((formationId) => {
    return formationManager.exportFormation(formationId);
  }, []);

  const importFormation = useCallback((formationData) => {
    const result = formationManager.importFormation(formationData);
    if (result) {
      forceUpdate();
    }
    return result;
  }, [forceUpdate]);

  // 阵型验证方法
  const validateCurrentFormation = useCallback(() => {
    const formation = formationManager.getCurrentFormation();
    return formation ? formation.validate() : { isValid: false, errors: ['没有当前阵型'] };
  }, [updateCounter]);

  const isCurrentFormationValid = useMemo(() => {
    return formationManager.isCurrentFormationValid();
  }, [updateCounter]);

  const isCurrentFormationEmpty = useMemo(() => {
    const formation = currentFormation;
    return formation ? formation.isEmpty() : true;
  }, [currentFormation]);

  // 阵型分析工具方法
  const getSummonDisplayInfo = useCallback((summonId) => {
    console.log('[getSummonDisplayInfo] 查找召唤兽:', summonId, 'allSummons:', allSummons);
    
    if (!summonId || !allSummons.length) {
      console.log('[getSummonDisplayInfo] 返回空信息，原因：无summonId或无召唤兽数据');
      return { 
        name: '空', 
        id: null, 
        level: null, 
        power: 0,
        quality: null,
        derivedAttributes: null
      };
    }
    
    const summonInstance = allSummons.find(s => s.id === summonId);
    console.log('[getSummonDisplayInfo] 找到的召唤兽实例:', summonInstance);
    
    if (!summonInstance) {
      console.log('[getSummonDisplayInfo] 未找到召唤兽，summonId:', summonId);
      return { 
        name: '未知召唤兽', 
        id: summonId, 
        level: 'N/A', 
        power: 0,
        quality: null,
        derivedAttributes: null
      };
    }
    
    const basePetInfo = summonInstance.getConfig ? summonInstance.getConfig() : null;
    console.log('[getSummonDisplayInfo] basePetInfo:', basePetInfo);
    
    const result = {
      id: summonInstance.id,
      name: summonInstance.nickname || basePetInfo?.name || summonInstance.name || '召唤兽',
      level: summonInstance.level,
      power: summonInstance.power || 0,
      quality: summonInstance.quality,
      derivedAttributes: summonInstance.derivedAttributes,
      instance: summonInstance
    };
    
    console.log('[getSummonDisplayInfo] 返回结果:', result);
    return result;
  }, [allSummons]);

  // 获取阵型位置样式（从原有的FormationDataManager移植）
  const getPositionStyle = useCallback((colIndex) => {
    const styles = {
      frontRowCell: {
        backgroundColor: '#4a5568',
        borderColor: '#a0aec0',
      },
      midRowCell: {
        backgroundColor: '#38a169',
        borderColor: '#9ae6b4',
      },
      backRowCell: {
        backgroundColor: '#3182ce',
        borderColor: '#90cdf4',
      }
    };

    if (colIndex === 2) return styles.frontRowCell; // 前排
    if (colIndex === 1) return styles.midRowCell;   // 中排
    if (colIndex === 0) return styles.backRowCell;  // 后排
    return {};
  }, []);

  // 检查召唤兽是否在当前阵型中
  const isSummonInCurrentFormation = useCallback((summonId) => {
    const formation = currentFormation;
    return formation ? formation.hasSummon(summonId) : false;
  }, [currentFormation]);

  // 获取召唤兽在当前阵型中的位置
  const getSummonPositionInCurrentFormation = useCallback((summonId) => {
    const formation = currentFormation;
    return formation ? formation.getSummonPosition(summonId) : null;
  }, [currentFormation]);

  // 统计信息
  const stats = useMemo(() => {
    return formationManager.getStats();
  }, [updateCounter]);

  // 工具方法：验证召唤兽放置
  const validateSummonPlacement = useCallback((summonId, targetRow, targetCol, sourceType = 'list') => {
    const formation = currentFormation;
    if (!formation) {
      return { canPlace: false, reason: '没有当前阵型' };
    }

    // 检查位置是否有效
    if (targetRow < 0 || targetRow >= 3 || targetCol < 0 || targetCol >= 3) {
      return { canPlace: false, reason: '位置无效' };
    }

    const currentTotal = formation.getSummonCount();
    const isAlreadyInGrid = formation.hasSummon(summonId);
    const targetSlotOccupied = formation.getSummonAt(targetRow, targetCol) !== null;

    // 如果从列表拖拽，且召唤兽不在网格中，且目标位置为空，检查是否超出最大数量
    if (sourceType === 'list' && !isAlreadyInGrid && !targetSlotOccupied) {
      if (currentTotal >= 5) {
        return { canPlace: false, reason: '阵型已满，无法添加更多召唤兽' };
      }
    }

    return { canPlace: true };
  }, [currentFormation]);

  return {
    // 状态数据
    formationSummaries,
    currentFormation,
    currentFormationAnalysis,
    currentFormationGrid,
    currentFormationId: formationManager.currentFormationId,
    stats,
    
    // 状态标识
    isCurrentFormationValid,
    isCurrentFormationEmpty,
    
    // 阵型操作
    createFormation,
    deleteFormation,
    renameFormation,
    duplicateFormation,
    setCurrentFormation,
    clearFormation,
    exportFormation,
    importFormation,
    
    // 召唤兽操作
    setSummonInCurrentFormation,
    isSummonInCurrentFormation,
    getSummonPositionInCurrentFormation,
    
    // 验证方法
    validateCurrentFormation,
    validateSummonPlacement,
    
    // 工具方法
    getSummonDisplayInfo,
    getPositionStyle,
    
    // 底层管理器访问（谨慎使用）
    formationManager,
    
    // 强制更新方法
    forceUpdate
  };
}; 