import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import dataClearManager from '@/store/DataClearManager';

const DataClearPanel = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [dataStatus, setDataStatus] = useState(null);
  const [clearHistory, setClearHistory] = useState([]);
  const [availableBackups, setAvailableBackups] = useState([]);
  const [activeTab, setActiveTab] = useState('status');

  // 加载数据状态
  const loadDataStatus = async () => {
    try {
      const status = await dataClearManager.checkDataStatus();
      setDataStatus(status);
    } catch (error) {
      console.error('加载数据状态失败:', error);
    }
  };

  // 加载清理历史
  const loadClearHistory = () => {
    const history = dataClearManager.getClearHistory();
    setClearHistory(history);
  };

  // 加载备份列表
  const loadAvailableBackups = async () => {
    try {
      const result = await dataClearManager.getAvailableBackups();
      if (result.success) {
        setAvailableBackups(result.backups);
      }
    } catch (error) {
      console.error('加载备份列表失败:', error);
    }
  };

  useEffect(() => {
    loadDataStatus();
    loadClearHistory();
    loadAvailableBackups();
  }, []);

  // 执行清理操作
  const executeOperation = async (operation, options = {}) => {
    setIsLoading(true);
    setResults(null);
    
    try {
      let result;
      
      switch (operation) {
        case 'clearAll':
          result = await dataClearManager.clearAllData(dispatch);
          break;
        case 'clearSelected':
          result = await dataClearManager.clearSelectedData(options, dispatch);
          break;
        case 'quickFix':
          result = await dataClearManager.quickFix();
          break;
        case 'validate':
          result = await dataClearManager.validateAndRepairData();
          break;
        case 'optimize':
          result = await dataClearManager.optimizeData();
          break;
        case 'createBackup':
          result = await dataClearManager.createDataBackup();
          break;
        case 'restoreBackup':
          result = await dataClearManager.restoreDataBackup(options.backupId);
          break;
        default:
          throw new Error(`未知操作: ${operation}`);
      }
      
      setResults(result);
      
      // 刷新状态和历史
      await loadDataStatus();
      loadClearHistory();
      if (operation === 'createBackup' || operation === 'restoreBackup') {
        await loadAvailableBackups();
      }
      
    } catch (error) {
      console.error('执行操作失败:', error);
      setResults({
        success: false,
        message: `操作失败: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 渲染数据状态面板
  const renderStatusPanel = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">系统数据状态</h3>
      
      {dataStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OOP召唤兽系统状态 */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-md font-medium text-blue-300 mb-2">OOP召唤兽系统</h4>
            <div className="space-y-1 text-sm">
              <p className="text-gray-300">召唤兽数量: <span className="text-white">{dataStatus.oopSummons.count}</span></p>
              <p className="text-gray-300">当前召唤兽: <span className="text-white">{dataStatus.oopSummons.currentSummonId || '无'}</span></p>
              <p className="text-gray-300">最大数量: <span className="text-white">{dataStatus.oopSummons.maxSummons}</span></p>
            </div>
          </div>

          {/* 背包系统状态 */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-md font-medium text-green-300 mb-2">背包系统</h4>
            <div className="space-y-1 text-sm">
              <p className="text-gray-300">物品数量: <span className="text-white">{dataStatus.inventory.itemCount}</span></p>
              <p className="text-gray-300">已用槽位: <span className="text-white">{dataStatus.inventory.usedSlots}</span></p>
              <p className="text-gray-300">金币: <span className="text-yellow-400">{dataStatus.inventory.gold}</span></p>
            </div>
          </div>

          {/* 存储状态 */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-md font-medium text-purple-300 mb-2">持久化存储</h4>
            <div className="space-y-1 text-sm">
              {dataStatus.electronStore ? (
                <>
                  <p className="text-gray-300">背包数据: <span className={dataStatus.electronStore.hasInventoryData ? "text-green-400" : "text-red-400"}>{dataStatus.electronStore.hasInventoryData ? "存在" : "不存在"}</span></p>
                  <p className="text-gray-300">召唤兽数据: <span className={dataStatus.electronStore.hasSummonData ? "text-green-400" : "text-red-400"}>{dataStatus.electronStore.hasSummonData ? "存在" : "不存在"}</span></p>
                </>
              ) : (
                <p className="text-red-400">Electron Store 不可用</p>
              )}
            </div>
          </div>

          {/* 数据一致性 */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-md font-medium text-orange-300 mb-2">数据一致性</h4>
            <div className="space-y-1 text-sm">
              <p className="text-gray-300">装备问题: <span className={dataStatus.dataConsistency.equipmentIssues.length === 0 ? "text-green-400" : "text-red-400"}>{dataStatus.dataConsistency.equipmentIssues.length} 个</span></p>
              <p className="text-gray-300">需要验证: <span className={dataStatus.dataConsistency.validationNeeded ? "text-yellow-400" : "text-green-400"}>{dataStatus.dataConsistency.validationNeeded ? "是" : "否"}</span></p>
              <p className="text-gray-300">浏览器存储: <span className="text-white">{dataStatus.browserStorage.localStorageKeys + dataStatus.browserStorage.sessionStorageKeys} 个键</span></p>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={loadDataStatus}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
          disabled={isLoading}
        >
          刷新状态
        </button>
        
        {dataStatus?.dataConsistency?.validationNeeded && (
          <button
            onClick={() => executeOperation('quickFix')}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm"
            disabled={isLoading}
          >
            快速修复
          </button>
        )}
      </div>
    </div>
  );

  // 渲染清理操作面板
  const renderOperationsPanel = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">数据清理操作</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 快速操作 */}
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="text-md font-medium text-blue-300 mb-3">快速操作</h4>
          <div className="space-y-2">
            <button
              onClick={() => executeOperation('quickFix')}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
              disabled={isLoading}
            >
              快速修复
            </button>
            <button
              onClick={() => executeOperation('validate')}
              className="w-full px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm"
              disabled={isLoading}
            >
              验证数据
            </button>
            <button
              onClick={() => executeOperation('optimize')}
              className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm"
              disabled={isLoading}
            >
              优化数据
            </button>
          </div>
        </div>

        {/* 选择性清理 */}
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="text-md font-medium text-yellow-300 mb-3">选择性清理</h4>
          <div className="space-y-2">
            {[
              { key: 'oopSummons', label: 'OOP召唤兽数据' },
              { key: 'inventory', label: '背包数据' },
              { key: 'redux', label: 'Redux状态' },
              { key: 'electronStore', label: '持久化存储' },
              { key: 'browserStorage', label: '浏览器存储' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => executeOperation('clearSelected', { [item.key]: true })}
                className="w-full px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs"
                disabled={isLoading}
              >
                清理{item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 危险操作 */}
        <div className="bg-slate-700 rounded-lg p-4 border border-red-500">
          <h4 className="text-md font-medium text-red-300 mb-3">危险操作</h4>
          <div className="space-y-2">
            <button
              onClick={() => {
                if (confirm('确定要清理所有数据吗？此操作不可撤销！')) {
                  executeOperation('clearAll');
                }
              }}
              className="w-full px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
              disabled={isLoading}
            >
              清理所有数据
            </button>
            <p className="text-xs text-red-300 mt-2">
              ⚠️ 此操作将清理所有游戏数据，请谨慎使用
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染备份管理面板
  const renderBackupPanel = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">数据备份管理</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 创建备份 */}
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="text-md font-medium text-green-300 mb-3">创建备份</h4>
          <button
            onClick={() => executeOperation('createBackup')}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded"
            disabled={isLoading}
          >
            创建新备份
          </button>
          <p className="text-xs text-gray-400 mt-2">
            备份当前所有游戏数据，包括召唤兽、背包等
          </p>
        </div>

        {/* 备份列表 */}
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="text-md font-medium text-blue-300 mb-3">可用备份</h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {availableBackups.length === 0 ? (
              <p className="text-gray-400 text-sm">暂无可用备份</p>
            ) : (
              availableBackups.map(backup => (
                <div key={backup.id} className="bg-slate-600 rounded p-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-white text-sm">{new Date(backup.date).toLocaleString('zh-CN')}</p>
                      <p className="text-gray-400 text-xs">大小: {(backup.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`确定要恢复备份 ${new Date(backup.date).toLocaleString('zh-CN')} 吗？当前数据将被覆盖！`)) {
                          executeOperation('restoreBackup', { backupId: backup.id });
                        }
                      }}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs"
                      disabled={isLoading}
                    >
                      恢复
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={loadAvailableBackups}
            className="w-full mt-2 px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm"
            disabled={isLoading}
          >
            刷新列表
          </button>
        </div>
      </div>
    </div>
  );

  // 渲染清理历史面板
  const renderHistoryPanel = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">清理历史</h3>
        <div className="space-x-2">
          <button
            onClick={loadClearHistory}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
            disabled={isLoading}
          >
            刷新
          </button>
          <button
            onClick={() => {
              if (confirm('确定要清空清理历史吗？')) {
                dataClearManager.clearClearHistory();
                loadClearHistory();
              }
            }}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
            disabled={isLoading}
          >
            清空历史
          </button>
        </div>
      </div>
      
      <div className="bg-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto">
        {clearHistory.length === 0 ? (
          <p className="text-gray-400 text-center">暂无清理历史</p>
        ) : (
          <div className="space-y-2">
            {clearHistory.map((record, index) => (
              <div key={index} className="bg-slate-600 rounded p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{record.message}</p>
                    <p className="text-gray-400 text-xs">类型: {record.type}</p>
                  </div>
                  <span className="text-gray-400 text-xs">{record.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // 渲染结果面板
  const renderResultsPanel = () => {
    if (!results) return null;

    return (
      <div className="mt-4 p-4 bg-slate-700 rounded-lg">
        <h4 className="text-md font-medium text-white mb-2">操作结果</h4>
        <div className={`p-3 rounded ${results.success ? 'bg-green-800 border-green-600' : 'bg-red-800 border-red-600'} border`}>
          <p className="text-white text-sm">{results.message}</p>
          
          {results.issues && results.issues.length > 0 && (
            <div className="mt-2">
              <p className="text-red-300 text-xs font-medium">发现的问题:</p>
              <ul className="list-disc list-inside text-xs text-red-200 ml-2">
                {results.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          
          {results.repairs && results.repairs.length > 0 && (
            <div className="mt-2">
              <p className="text-green-300 text-xs font-medium">执行的修复:</p>
              <ul className="list-disc list-inside text-xs text-green-200 ml-2">
                {results.repairs.map((repair, index) => (
                  <li key={index}>{repair}</li>
                ))}
              </ul>
            </div>
          )}
          
          {results.optimizations && results.optimizations.length > 0 && (
            <div className="mt-2">
              <p className="text-blue-300 text-xs font-medium">执行的优化:</p>
              <ul className="list-disc list-inside text-xs text-blue-200 ml-2">
                {results.optimizations.map((optimization, index) => (
                  <li key={index}>{optimization}</li>
                ))}
              </ul>
            </div>
          )}
          
          {results.summary && (
            <div className="mt-2 text-xs text-gray-300">
              <p>总操作: {results.summary.totalOperations}, 成功: {results.summary.successfulOperations}, 失败: {results.summary.failedOperations}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">数据清理管理系统</h2>
      
      {/* 加载状态 */}
      {isLoading && (
        <div className="mb-4 p-3 bg-blue-700 rounded-lg">
          <p className="text-white text-sm">正在执行操作，请稍候...</p>
        </div>
      )}
      
      {/* 选项卡导航 */}
      <div className="flex space-x-1 mb-6 bg-slate-700 rounded-lg p-1">
        {[
          { key: 'status', label: '系统状态' },
          { key: 'operations', label: '清理操作' },
          { key: 'backup', label: '备份管理' },
          { key: 'history', label: '清理历史' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* 内容面板 */}
      <div className="min-h-96">
        {activeTab === 'status' && renderStatusPanel()}
        {activeTab === 'operations' && renderOperationsPanel()}
        {activeTab === 'backup' && renderBackupPanel()}
        {activeTab === 'history' && renderHistoryPanel()}
      </div>
      
      {/* 操作结果 */}
      {renderResultsPanel()}
    </div>
  );
};

export default DataClearPanel;