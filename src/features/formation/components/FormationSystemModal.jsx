/**
 * FormationSystemModal - 阵型系统主界面
 * 整合阵型编辑、管理和召唤兽选择功能
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import FormationGrid from './FormationGrid';
import FormationList from './FormationList';
import VerticalSummonSelector from './VerticalSummonSelector';
import { useFormationManager } from '../hooks/useFormationManager';
import { useSummonManager } from '@/hooks/useSummonManager';

const FormationSystemModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedCell, setSelectedCell] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFormationName, setNewFormationName] = useState('');
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  const [placementOrder, setPlacementOrder] = useState([]);

  const {
    formations,
    currentFormation,
    setCurrentFormation,
    createFormation,
    deleteFormation,
    duplicateFormation,
    updateFormationName,
    setSummonInCurrentFormation,
    clearFormation,
    validateCurrentFormation,
    currentFormationAnalysis
  } = useFormationManager();

  const { allSummons } = useSummonManager();

  // 初始化默认阵型
  useEffect(() => {
    if (!currentFormation && formations.length === 0) {
      createFormation('默认阵型');
    }
  }, [currentFormation, formations, createFormation]);

  // 将OOP召唤兽数据转换为数组格式
  const availableSummons = useMemo(() => {
    if (!allSummons) return [];
    return Object.values(allSummons).map(summon => ({
      id: summon.id,
      name: summon.nickname || summon.id,
      type: summon.type || '未知',
      level: summon.level || 1,
      power: summon.power || 0,
      quality: summon.quality || 'normal',
      description: summon.description || '无描述'
    }));
  }, [allSummons]);

  const forceUpdate = () => setForceUpdateKey(prev => prev + 1);

  const getSummonDisplayInfo = (summonId) => {
    if (!summonId) return null;
    const fromAvailable = availableSummons.find(s => s.id === summonId);
    if (fromAvailable) return fromAvailable;
    if (allSummons && allSummons[summonId]) {
      const summon = allSummons[summonId];
      return {
        id: summon.id,
        name: summon.nickname || summon.id,
        type: summon.type || '未知',
        level: summon.level || 1,
        power: summon.power || 0,
        quality: summon.quality || 'normal'
      };
    }
    return null;
  };

  // 自动清理已删除的召唤兽
  const cleanupDeletedSummons = useCallback(() => {
    if (!currentFormation) return;
    let hasDeleted = false;
    currentFormation.grid.forEach((row, rowIndex) => {
      row.forEach((summonId, colIndex) => {
        if (summonId && !allSummons?.[summonId]) {
          hasDeleted = true;
          setSummonInCurrentFormation(rowIndex, colIndex, null);
        }
      });
    });
    if (hasDeleted) {
      console.log('Auto cleaned deleted summons from formation');
      forceUpdate();
    }
  }, [currentFormation, allSummons, setSummonInCurrentFormation, forceUpdate]);

  // 在召唤兽数据变化时自动清理
  useEffect(() => {
    cleanupDeletedSummons();
  }, [cleanupDeletedSummons]);

  // 获取当前阵型中的召唤兽ID列表，排除已删除的
  const getFormationSummonIds = () => {
    if (!currentFormation) return [];
    return currentFormation.grid.flat().filter(id => id && allSummons?.[id]);
  };

  const handleTabChange = (tab) => setActiveTab(tab);

  const handleCreateFormation = () => setShowCreateDialog(true);

  const handleConfirmCreate = () => {
    if (newFormationName.trim()) {
      createFormation(newFormationName.trim());
      setNewFormationName('');
      setShowCreateDialog(false);
      forceUpdate();
    }
  };

  const handleClearFormation = () => {
    if (currentFormation && window.confirm('确定要清空当前阵型吗？')) {
      clearFormation();
      setPlacementOrder([]);
      forceUpdate();
    }
  };

  const handleCellClick = (row, col) => {
    if (!currentFormation) return;
    const currentSummonId = currentFormation.grid[row][col];
    if (currentSummonId) {
      setSummonInCurrentFormation(row, col, null);
      setPlacementOrder(prev => prev.filter(pos => !(pos.row === row && pos.col === col)));
      forceUpdate();
    } else {
      setSelectedCell({ row, col });
    }
  };

  // 获取所有位置的数组（按顺序）
  const getAllPositions = () => {
    const positions = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        positions.push({ row, col });
      }
    }
    return positions;
  };

  // 获取当前阵型中的有效召唤兽位置
  const getOccupiedPositions = () => {
    if (!currentFormation) return [];
    const positions = [];
    for (let row = 0; row < currentFormation.grid.length; row++) {
      for (let col = 0; col < currentFormation.grid[row].length; col++) {
        if (currentFormation.grid[row][col]) {
          positions.push({ row, col, summonId: currentFormation.grid[row][col] });
        }
      }
    }
    return positions;
  };

  // 获取下一个可用位置（限制最多5个召唤兽）
  const getNextAvailablePosition = () => {
    if (!currentFormation) return null;
    const occupiedPositions = getOccupiedPositions();
    if (occupiedPositions.length < 5) {
      for (let row = 0; row < currentFormation.grid.length; row++) {
        for (let col = 0; col < currentFormation.grid[row].length; col++) {
          if (!currentFormation.grid[row][col]) {
            return { row, col, isReplacing: false };
          }
        }
      }
    }
    if (placementOrder.length > 0) return { ...placementOrder[0], isReplacing: true };
    if (occupiedPositions.length > 0) return { ...occupiedPositions[0], isReplacing: true };
    return { row: 0, col: 0, isReplacing: false };
  };

  // 智能放置召唤兽（限制5个）
  const smartPlaceSummon = (targetRow, targetCol, summonId) => {
    if (!currentFormation) return;
    setPlacementOrder(prev => {
      let newOrder = prev.filter(pos => !(pos.row === targetRow && pos.col === targetCol));
      newOrder.push({ row: targetRow, col: targetCol });
      if (newOrder.length > 5) newOrder = newOrder.slice(-5);
      return newOrder;
    });
    setSummonInCurrentFormation(targetRow, targetCol, summonId);
  };

  const handleSummonSelect = (summon) => {
    if (!summon) return;
    if (selectedCell) {
      smartPlaceSummon(selectedCell.row, selectedCell.col, summon.id);
      setSelectedCell(null);
    } else {
      const nextPos = getNextAvailablePosition();
      if (nextPos) {
        smartPlaceSummon(nextPos.row, nextPos.col, summon.id);
      }
    }
    forceUpdate();
  };

  // 处理从拖拽数据中获取召唤兽并放置
  const handleGridDrop = (row, col, dragData) => {
    try {
      if (dragData) {
        const summon = JSON.parse(dragData);
        if (summon && summon.id) {
          smartPlaceSummon(row, col, summon.id);
          forceUpdate();
        }
      }
    } catch (error) { console.error('Failed to parse drag data:', error); }
  };

  // 获取阵型验证信息
  const validationInfo = useMemo(() => {
    if (!currentFormation) return null;
    try { return validateCurrentFormation(); } catch (error) { return null; }
  }, [currentFormation, validateCurrentFormation]);

  // 计算阵型统计信息
  const formationStats = useMemo(() => {
    const summonIds = getFormationSummonIds();
    const summonCount = summonIds.length;
    const totalPower = currentFormationAnalysis?.totalPower || 0;
    const averagePower = summonCount > 0 ? Math.round(totalPower / summonCount) : 0;
    const isValid = validationInfo?.isValid || false;
    return { summonCount, totalPower, averagePower, isValid };
  }, [currentFormation, currentFormationAnalysis, validationInfo]);

  return (
    <div className="h-[700px] flex flex-col">
      {/* 标签导航 */}
      <div className="flex border-b border-slate-700 mb-4">
        <button
          onClick={() => handleTabChange('editor')}
          className={`px-6 py-3 font-medium transition-all duration-200 ${activeTab === 'editor' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5' : 'text-slate-400 hover:text-slate-200'}`}
        >
          阵型编辑
        </button>
        <button
          onClick={() => handleTabChange('manager')}
          className={`px-6 py-3 font-medium transition-all duration-200 ${activeTab === 'manager' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5' : 'text-slate-400 hover:text-slate-200'}`}
        >
          阵型管理
        </button>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden p-3">
        {activeTab === 'editor' ? (
          <div className="h-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={currentFormation?.name || '默认阵型'}
                onChange={(e) => updateFormationName(e.target.value)}
                className="text-lg font-semibold bg-transparent text-white border-b border-slate-600 focus:border-blue-400 outline-none px-2 py-1"
              />
              <div className="flex gap-2">
                <button onClick={handleCreateFormation} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors">新建阵型</button>
                <button onClick={handleClearFormation} disabled={!currentFormation} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors">清空阵型</button>
              </div>
            </div>
            <div className="flex gap-6 flex-1">
              <div className="flex-1 flex flex-col mt-[-60px] items-center justify-center">
                <div className="mb-4 text-center items-center">
                  <h4 className="text-lg font-semibold text-white mb-3">战斗阵型</h4>
                  <div className="bg-slate-900/50 rounded-lg p-3 mb-4 max-w-md">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-300">召唤兽数量：</span><span className={formationStats.summonCount >= 3 ? 'text-green-400' : 'text-yellow-400'}>{formationStats.summonCount}/5</span></div>
                      <div className="flex justify-between"><span className="text-slate-300">总战力：</span><span className="text-orange-400">{formationStats.totalPower}</span></div>
                      <div className="flex justify-between"><span className="text-slate-300">平均战力：</span><span className="text-blue-400">{formationStats.averagePower}</span></div>
                      <div className="flex justify-between"><span className="text-slate-300">阵型状态：</span><span className={formationStats.isValid ? 'text-green-400' : 'text-red-400'}>{formationStats.isValid ? '有效' : '无效'}</span></div>
                    </div>
                  </div>
                </div>
                <FormationGrid grid={currentFormation?.grid} getSummonDisplayInfo={getSummonDisplayInfo} onSlotClick={handleCellClick} onDrop={handleGridDrop} />
                <div className="mt-4 text-sm text-slate-400 text-center">
                  <span>💡 点击空格子选择位置，双击召唤兽智能放置，点击已有召唤兽移除</span>
                </div>
              </div>
              <div className="w-96 flex flex-col gap-4">
                <h4 className="text-md font-medium text-white">选择召唤兽</h4>
                <VerticalSummonSelector summons={availableSummons} onSummonSelect={handleSummonSelect} selectedCell={selectedCell} formationSummons={getFormationSummonIds()} />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">阵型管理</h3>
              <button onClick={() => setShowCreateDialog(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">新建阵型</button>
            </div>
            <FormationList formations={formations} currentFormation={currentFormation} onSelectFormation={setCurrentFormation} onDeleteFormation={deleteFormation} onDuplicateFormation={duplicateFormation} onUpdateFormationName={updateFormationName} getSummonDisplayInfo={getSummonDisplayInfo} />
          </div>
        )}
      </div>
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">创建新阵型</h3>
            <input
              type="text"
              value={newFormationName}
              onChange={(e) => setNewFormationName(e.target.value)}
              placeholder="请输入阵型名称"
              className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-400 outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreateDialog(false)} className="px-4 py-2 text-slider-400 hover:text-white transition-colors">取消</button>
              <button onClick={handleConfirmCreate} disabled={!newFormationName.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded transition-colors">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormationSystemModal; 