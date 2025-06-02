/**
 * 数据清理Hook
 * 提供数据清理功能和状态监控
 */
import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import dataClearManager from '../store/DataClearManager';

export function useDataClear() {
  const dispatch = useDispatch();
  const [isClearing, setIsClearing] = useState(false);
  const [lastClearResult, setLastClearResult] = useState(null);
  const [dataStatus, setDataStatus] = useState(null);

  // 全面清理所有数据
  const clearAllData = useCallback(async () => {
    setIsClearing(true);
    try {
      const result = await dataClearManager.clearAllData(dispatch);
      setLastClearResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        message: `清理失败: ${error.message}`,
        error
      };
      setLastClearResult(errorResult);
      return errorResult;
    } finally {
      setIsClearing(false);
    }
  }, [dispatch]);

  // 选择性清理数据
  const clearSelectedData = useCallback(async (options) => {
    setIsClearing(true);
    try {
      const result = await dataClearManager.clearSelectedData(options, dispatch);
      setLastClearResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        message: `清理失败: ${error.message}`,
        error
      };
      setLastClearResult(errorResult);
      return errorResult;
    } finally {
      setIsClearing(false);
    }
  }, [dispatch]);

  // 只清理背包数据
  const clearInventoryOnly = useCallback(async () => {
    setIsClearing(true);
    try {
      const result = await dataClearManager.clearInventoryData();
      setLastClearResult({ inventory: result });
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        message: `清理背包失败: ${error.message}`,
        error
      };
      setLastClearResult(errorResult);
      return errorResult;
    } finally {
      setIsClearing(false);
    }
  }, []);

  // 只清理Redux状态
  const clearReduxOnly = useCallback(async () => {
    setIsClearing(true);
    try {
      const result = await dataClearManager.clearReduxData(dispatch);
      setLastClearResult({ redux: result });
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        message: `清理Redux状态失败: ${error.message}`,
        error
      };
      setLastClearResult(errorResult);
      return errorResult;
    } finally {
      setIsClearing(false);
    }
  }, [dispatch]);

  // 只清理持久化存储
  const clearStorageOnly = useCallback(async () => {
    setIsClearing(true);
    try {
      const result = await dataClearManager.clearElectronStore();
      setLastClearResult({ electronStore: result });
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        message: `清理存储失败: ${error.message}`,
        error
      };
      setLastClearResult(errorResult);
      return errorResult;
    } finally {
      setIsClearing(false);
    }
  }, []);

  // 只清理浏览器存储
  const clearBrowserStorageOnly = useCallback(async () => {
    setIsClearing(true);
    try {
      const result = await dataClearManager.clearBrowserStorage();
      setLastClearResult({ browserStorage: result });
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        message: `清理浏览器存储失败: ${error.message}`,
        error
      };
      setLastClearResult(errorResult);
      return errorResult;
    } finally {
      setIsClearing(false);
    }
  }, []);

  // 检查数据状态
  const checkDataStatus = useCallback(async () => {
    try {
      const status = await dataClearManager.checkDataStatus();
      setDataStatus(status);
      return status;
    } catch (error) {
      console.error('[useDataClear] 检查数据状态失败:', error);
      return null;
    }
  }, []);

  // 获取清理历史
  const getClearHistory = useCallback(() => {
    return dataClearManager.getClearHistory();
  }, []);

  // 清空清理历史
  const clearClearHistory = useCallback(() => {
    dataClearManager.clearClearHistory();
  }, []);

  return {
    isClearing,
    lastClearResult,
    dataStatus,
    
    // 清理方法
    clearAllData,
    clearSelectedData,
    clearInventoryOnly,
    clearReduxOnly,
    clearStorageOnly,
    clearBrowserStorageOnly,
    
    // 工具方法
    checkDataStatus,
    getClearHistory,
    clearClearHistory
  };
} 