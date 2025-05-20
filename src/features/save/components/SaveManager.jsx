import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAllSaves, selectAutoSaveEnabled, setAutoSaveEnabled } from '@/store/slices/saveSlice';
import { createNewSave, loadSave, deleteSave, loadSavesFromStorage } from '@/utils/saveManager';
import { useToast } from '@/hooks/useToast';

const SaveManager = ({ toasts, setToasts, onLoadSuccess }) => {
  const dispatch = useDispatch();
  const { showResult } = useToast(toasts, setToasts);
  const saves = useSelector(selectAllSaves);
  const autoSaveEnabled = useSelector(selectAutoSaveEnabled);
  const [saveDescription, setSaveDescription] = useState('');
  const [localSaves, setLocalSaves] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadingSlot, setLoadingSlot] = useState(null);
  const [deletingSlot, setDeletingSlot] = useState(null);

  useEffect(() => {
    // 从 localStorage 加载存档
    const loadSaves = async () => {
      setIsLoading(true);
      try {
        const savedGames = loadSavesFromStorage();
        setLocalSaves(savedGames);
      } finally {
        setIsLoading(false);
      }
    };
    loadSaves();
  }, []);

  const handleCreateSave = async () => {
    setIsLoading(true);
    try {
      const success = createNewSave(saveDescription);
      if (success) {
        showResult('存档创建成功！', 'success');
        setSaveDescription('');
        // 刷新本地存档列表
        setLocalSaves(loadSavesFromStorage());
      } else {
        showResult('存档创建失败', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSave = async (saveId) => {
    setLoadingSlot(saveId);
    try {
      const success = loadSave(saveId);
      if (success) {
        showResult('存档加载成功！', 'success');
        if (onLoadSuccess) {
          onLoadSuccess();
        }
      } else {
        showResult('存档加载失败', 'error');
      }
    } finally {
      setLoadingSlot(null);
    }
  };

  const handleDeleteSave = async (saveId) => {
    setDeletingSlot(saveId);
    try {
      const success = deleteSave(saveId);
      if (success) {
        showResult('存档删除成功！', 'success');
        // 刷新本地存档列表
        setLocalSaves(loadSavesFromStorage());
      } else {
        showResult('存档删除失败', 'error');
      }
    } finally {
      setDeletingSlot(null);
    }
  };

  const toggleAutoSave = () => {
    dispatch(setAutoSaveEnabled(!autoSaveEnabled));
    showResult(`自动存档已${!autoSaveEnabled ? '开启' : '关闭'}`, 'info');
  };

  return (
    <div className="p-4 bg-slate-800 rounded-lg shadow-lg transition-all duration-300">
      <h2 className="text-xl font-bold mb-6 text-white flex items-center">
        <i className="fas fa-save mr-3 text-blue-400"></i>
        存档管理
      </h2>
      
      {/* 创建新存档 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={saveDescription}
          onChange={(e) => setSaveDescription(e.target.value)}
          placeholder="输入存档描述"
          className="flex-1 bg-slate-700 text-white border-slate-600 border p-2.5 rounded-lg 
            placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
            transition-all duration-300"
        />
        <button
          onClick={handleCreateSave}
          disabled={isLoading}
          className="bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 
            disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300
            flex items-center justify-center min-w-[120px]"
        >
          {isLoading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <>
              <i className="fas fa-plus mr-2"></i>
              创建存档
            </>
          )}
        </button>
      </div>

      {/* 自动存档开关 */}
      <div className="mb-6">
        <label className="flex items-center text-white cursor-pointer group">
          <div className={`w-12 h-6 rounded-full p-1 transition-all duration-300 
            ${autoSaveEnabled ? 'bg-blue-500' : 'bg-slate-600'}`}>
            <div className={`bg-white w-4 h-4 rounded-full transform transition-transform duration-300 
              ${autoSaveEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </div>
          <span className="ml-3 group-hover:text-blue-400 transition-colors duration-300">
            启用自动存档
          </span>
        </label>
      </div>

      {/* 存档列表 */}
      <div className="space-y-3 max-h-[calc(70vh-200px)] overflow-y-auto p-1">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : Object.entries(localSaves).length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <i className="fas fa-folder-open text-4xl mb-3"></i>
            <p>暂无存档</p>
          </div>
        ) : (
          Object.entries(localSaves).map(([saveId, save]) => (
            <div 
              key={saveId} 
              className="bg-slate-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center 
                justify-between gap-4 transform hover:scale-[1.02] transition-all duration-300
                hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div>
                <div className="font-semibold text-white mb-1">
                  {save.description || '未命名存档'}
                </div>
                <div className="text-sm text-slate-400">
                  {new Date(save.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleLoadSave(saveId)}
                  disabled={loadingSlot === saveId}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300
                    flex items-center min-w-[90px] justify-center"
                >
                  {loadingSlot === saveId ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <>
                      <i className="fas fa-play mr-2"></i>
                      加载
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDeleteSave(saveId)}
                  disabled={deletingSlot === saveId}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300
                    flex items-center min-w-[90px] justify-center"
                >
                  {deletingSlot === saveId ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <>
                      <i className="fas fa-trash-alt mr-2"></i>
                      删除
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SaveManager; 