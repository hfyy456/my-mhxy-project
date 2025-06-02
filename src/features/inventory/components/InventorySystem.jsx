/**
 * 梦幻西游背包系统
 * 基于面向对象设计的主要背包管理系统
 */
import React, { useState, useEffect } from 'react';
import {
  useInventoryManager,
  useInventoryActions,
  useInventorySlots,
  useGold,
  useInventoryCapacity,
  useInventorySearch,
  useInventoryDragDrop,
  useInventoryStats
} from '../../../hooks/useInventoryManager';
import { useDataClear } from '../../../hooks/useDataClear';
import inventoryManager from '../../../store/InventoryManager';

// 背包格子组件
function InventorySlot({ slotIndex, item, onSlotClick, onDragStart, onDragEnd, isDragTarget }) {
  const isEmpty = !item;
  
  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 'legendary': return 'border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100';
      case 'epic': return 'border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100';
      case 'rare': return 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100';
      case 'uncommon': return 'border-green-400 bg-gradient-to-br from-green-50 to-green-100';
      default: return 'border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100';
    }
  };
  
  return (
    <div
      className={`
        w-16 h-16 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200
        ${isEmpty ? 'border-slate-300 bg-slate-100 hover:border-slate-400' : getRarityColor(item.rarity)}
        ${isDragTarget ? 'border-emerald-500 bg-emerald-200 shadow-lg scale-105' : ''}
        hover:shadow-md active:scale-95 relative
      `}
      onClick={() => onSlotClick(slotIndex)}
      onDragStart={(e) => onDragStart(e, slotIndex)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDragEnd(e, slotIndex)}
      draggable={!isEmpty}
    >
      {item && (
        <>
          <div className="text-center p-1">
            <div className="text-xs font-semibold text-slate-800 truncate w-full leading-tight">
              {item.name}
            </div>
          </div>
          {item.quantity > 1 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-4 flex items-center justify-center px-1">
              {item.quantity}
            </div>
          )}
          {item.isEquipment && (
            <div className="absolute -bottom-1 -left-1 bg-blue-600 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center">
              ⚔
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 物品详情组件
function ItemDetails({ item, onUse, onEquip, onSplit }) {
  if (!item) {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 h-64 flex items-center justify-center">
        <p className="text-slate-500 text-center">
          点击物品查看详情
        </p>
      </div>
    );
  }

  const getRarityStyle = (rarity) => {
    switch(rarity) {
      case 'legendary': return 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300';
      case 'epic': return 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300';
      case 'rare': return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300';
      case 'uncommon': return 'bg-gradient-to-br from-green-50 to-green-100 border-green-300';
      default: return 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300';
    }
  };

  return (
    <div className={`border-2 rounded-xl p-4 shadow-sm ${getRarityStyle(item.rarity)}`}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-lg font-bold text-slate-800">{item.name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.rarity === 'legendary' ? 'bg-amber-200 text-amber-800' :
          item.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
          item.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
          item.rarity === 'uncommon' ? 'bg-green-200 text-green-800' :
          'bg-slate-200 text-slate-800'
        }`}>
          {item.rarity}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-slate-700 mb-4">
        <div className="flex justify-between">
          <span className="font-medium">类型:</span>
          <span>{item.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">数量:</span>
          <span className="font-semibold">{item.quantity}</span>
        </div>
        {item.value > 0 && (
          <div className="flex justify-between">
            <span className="font-medium">价值:</span>
            <span className="text-amber-600 font-semibold">{item.value.toLocaleString()} 金</span>
          </div>
        )}
        {item.description && (
          <div className="mt-3 p-2 bg-white bg-opacity-50 rounded-lg">
            <p className="text-xs text-slate-600">{item.description}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {item.isConsumable && (
          <button
            onClick={() => onUse(item)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
          >
            使用
          </button>
        )}
        
        {item.isEquipment && (
          <button
            onClick={() => onEquip(item)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
          >
            装备
          </button>
        )}
        
        {item.stackable && item.quantity > 1 && (
          <button
            onClick={() => onSplit(item)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
          >
            分割
          </button>
        )}
      </div>
    </div>
  );
}

// 背包网格组件
function InventoryGrid() {
  const slots = useInventorySlots();
  const actions = useInventoryActions();
  const { startDrag, endDrag, isDragging, draggedItem } = useInventoryDragDrop();
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const handleSlotClick = (slotIndex) => {
    const item = actions.getItemBySlot(slotIndex);
    setSelectedItem(item);
    setSelectedSlot(slotIndex);
  };

  const handleDragStart = (e, slotIndex) => {
    startDrag(slotIndex);
  };

  const handleDragEnd = (e, targetSlot) => {
    endDrag(targetSlot);
  };

  const handleUse = (item) => {
    if (selectedSlot !== null) {
      actions.useItem(selectedSlot);
      setSelectedItem(null);
    }
  };

  const handleEquip = (item) => {
    // 这里集成召唤兽装备系统
    console.log('装备物品到召唤兽:', item);
  };

  const handleSplit = (item) => {
    // 这里实现物品分割功能
    console.log('分割物品:', item);
  };

  return (
    <div className="flex gap-6">
      {/* 背包网格 */}
      <div className="flex-1">
        <div className="bg-slate-700 text-white px-4 py-2 rounded-t-xl font-semibold">
          物品背包
        </div>
        <div className="bg-white border border-slate-200 rounded-b-xl p-4">
          <div className="grid grid-cols-10 gap-2">
            {slots.map(slot => (
              <InventorySlot
                key={slot.index}
                slotIndex={slot.index}
                item={slot.isEmpty ? null : actions.getItemBySlot(slot.index)}
                onSlotClick={handleSlotClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isDragTarget={isDragging && selectedSlot !== slot.index}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 物品详情 */}
      <div className="w-80">
        <div className="bg-slate-700 text-white px-4 py-2 rounded-t-xl font-semibold">
          物品详情
        </div>
        <div className="bg-white border border-slate-200 rounded-b-xl p-4">
          <ItemDetails
            item={selectedItem}
            onUse={handleUse}
            onEquip={handleEquip}
            onSplit={handleSplit}
          />
        </div>
      </div>
    </div>
  );
}

// 金币显示组件
function GoldDisplay() {
  const { gold, addGold, removeGold } = useGold();

  return (
    <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <div>
            <h3 className="text-lg font-bold text-amber-800">金币</h3>
            <p className="text-sm text-amber-700">当前余额</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-amber-600">{gold.toLocaleString()}</p>
          <p className="text-xs text-amber-700">金币</p>
        </div>
      </div>
    </div>
  );
}

// 容量信息组件
function CapacityInfo() {
  const capacityInfo = useInventoryCapacity();
  const actions = useInventoryActions();

  const usagePercentage = (capacityInfo.usedSlots / capacityInfo.capacity) * 100;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-blue-800">背包容量</h3>
        <span className="text-sm text-blue-600">
          {capacityInfo.usedSlots}/{capacityInfo.capacity}
        </span>
      </div>
      
      <div className="mb-3">
        <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              usagePercentage > 90 ? 'bg-gradient-to-r from-red-400 to-red-500' : 
              usagePercentage > 70 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 
              'bg-gradient-to-r from-green-400 to-emerald-500'
            }`}
            style={{ width: `${usagePercentage}%` }}
          ></div>
        </div>
        <div className="text-xs text-blue-600 mt-1">
          {usagePercentage.toFixed(1)}% 已使用
        </div>
      </div>
      
      {capacityInfo.isFull && (
        <div className="bg-red-100 text-red-700 p-2 rounded-lg mb-3 text-sm">
          ⚠️ 背包已满！请整理或扩展容量
        </div>
      )}
      
      <button
        onClick={() => actions.expandCapacity(20)}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        扩展容量 (+20)
      </button>
    </div>
  );
}

// 搜索组件
function InventorySearch() {
  const { searchQuery, searchResults, updateSearch, clearSearch } = useInventorySearch();
  const [filterType, setFilterType] = useState('all');

  const handleSearch = (query) => {
    const filters = filterType !== 'all' ? { type: filterType } : {};
    updateSearch(query, filters);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <h3 className="text-lg font-bold text-slate-800 mb-3">搜索物品</h3>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="输入物品名称..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              handleSearch(searchQuery);
            }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">全部</option>
            <option value="equipment">装备</option>
            <option value="consumable">消耗品</option>
            <option value="material">材料</option>
          </select>
          <button
            onClick={clearSearch}
            className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
          >
            清除
          </button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-slate-600 mb-2">找到 {searchResults.length} 个物品</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {searchResults.map(item => (
                <div key={item.id} className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                  <span className="font-medium text-slate-800">{item.name}</span>
                  <span className="text-slate-500 text-sm">×{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 整理功能组件
function InventoryOrganization() {
  const actions = useInventoryActions();

  const handleSort = (sortType) => {
    actions.sortInventory(sortType, 'asc');
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
      <h3 className="text-lg font-bold text-purple-800 mb-3">背包整理</h3>
      
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleSort('type')}
          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          按类型排序
        </button>
        <button
          onClick={() => handleSort('rarity')}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          按品质排序
        </button>
        <button
          onClick={() => handleSort('value')}
          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          按价值排序
        </button>
        <button
          onClick={() => handleSort('name')}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          按名称排序
        </button>
      </div>
    </div>
  );
}

// 统计信息组件
function InventoryStats() {
  const stats = useInventoryStats();

  const statItems = [
    { label: '物品种类', value: stats.totalItems, icon: '📦' },
    { label: '物品总数', value: stats.totalQuantity, icon: '🔢' },
    { label: '总价值', value: `${stats.totalValue.toLocaleString()} 金`, icon: '💰' },
    { label: '装备数量', value: stats.equipmentCount, icon: '⚔️' },
    { label: '消耗品数量', value: stats.consumableCount, icon: '🧪' },
  ];

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
      <h3 className="text-lg font-bold text-emerald-800 mb-3">背包统计</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {statItems.map((item, index) => (
          <div key={index} className="bg-white rounded-lg p-3 border border-emerald-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">{item.icon}</span>
              <div>
                <p className="text-xs text-emerald-600">{item.label}</p>
                <p className="font-bold text-emerald-800">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 数据清理组件
function DataClear() {
  const {
    isClearing,
    lastClearResult,
    dataStatus,
    clearAllData,
    clearSelectedData,
    clearInventoryOnly,
    clearReduxOnly,
    clearStorageOnly,
    clearBrowserStorageOnly,
    checkDataStatus,
    getClearHistory
  } = useDataClear();

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({
    inventory: true,
    redux: false,
    electronStore: false,
    browserStorage: false
  });
  const [showHistory, setShowHistory] = useState(false);

  // 在组件加载时检查数据状态
  useEffect(() => {
    checkDataStatus();
  }, [checkDataStatus]);

  const handleClearAction = (action, actionName) => {
    setPendingAction({ action, actionName });
    setShowConfirm(true);
  };

  const confirmClear = async () => {
    if (pendingAction) {
      await pendingAction.action();
      setShowConfirm(false);
      setPendingAction(null);
      // 清理后重新检查状态
      setTimeout(() => checkDataStatus(), 500);
    }
  };

  const handleSelectiveClear = () => {
    const action = () => clearSelectedData(selectedOptions);
    const selectedItems = Object.entries(selectedOptions)
      .filter(([key, value]) => value)
      .map(([key]) => {
        switch(key) {
          case 'inventory': return '背包数据';
          case 'redux': return 'Redux状态';
          case 'electronStore': return '持久化存储';
          case 'browserStorage': return '浏览器存储';
          default: return key;
        }
      });
    
    if (selectedItems.length === 0) {
      alert('请至少选择一项要清理的数据');
      return;
    }

    handleClearAction(action, `选择性清理 (${selectedItems.join(', ')})`);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getResultColor = (result) => {
    if (!result) return 'text-gray-600';
    return result.success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* 状态概览 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-blue-800">数据状态概览</h3>
          <button
            onClick={checkDataStatus}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
            disabled={isClearing}
          >
            🔄 刷新状态
          </button>
        </div>
        
        {dataStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 背包数据状态 */}
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🎒</span>
                <h4 className="font-semibold text-blue-800">背包数据</h4>
              </div>
              <div className="text-sm space-y-1">
                <div>物品数量: <span className="font-medium">{dataStatus.inventory.itemCount}</span></div>
                <div>已用插槽: <span className="font-medium">{dataStatus.inventory.usedSlots}</span></div>
                <div>金币: <span className="font-medium text-amber-600">{dataStatus.inventory.gold.toLocaleString()}</span></div>
              </div>
            </div>

            {/* 持久化存储状态 */}
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💾</span>
                <h4 className="font-semibold text-blue-800">持久化存储</h4>
              </div>
              <div className="text-sm space-y-1">
                {dataStatus.electronStore?.available !== false ? (
                  <>
                    <div>背包数据: <span className="font-medium">{dataStatus.electronStore?.hasInventoryData ? '有' : '无'}</span></div>
                    {dataStatus.electronStore?.inventoryDataSize > 0 && (
                      <div>数据大小: <span className="font-medium">{formatFileSize(dataStatus.electronStore.inventoryDataSize)}</span></div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500">不可用</div>
                )}
              </div>
            </div>

            {/* 浏览器存储状态 */}
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🌐</span>
                <h4 className="font-semibold text-blue-800">浏览器存储</h4>
              </div>
              <div className="text-sm space-y-1">
                <div>localStorage: <span className="font-medium">{dataStatus.browserStorage.localStorageKeys} 个键</span></div>
                <div>sessionStorage: <span className="font-medium">{dataStatus.browserStorage.sessionStorageKeys} 个键</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 快速清理按钮 */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <h3 className="text-lg font-bold text-orange-800 mb-4">快速清理</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleClearAction(clearInventoryOnly, '清理背包数据')}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            disabled={isClearing}
          >
            🎒 清理背包
          </button>
          <button
            onClick={() => handleClearAction(clearReduxOnly, '清理Redux状态')}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            disabled={isClearing}
          >
            ⚛️ 清理状态
          </button>
          <button
            onClick={() => handleClearAction(clearStorageOnly, '清理持久化存储')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            disabled={isClearing}
          >
            💾 清理存储
          </button>
          <button
            onClick={() => handleClearAction(clearBrowserStorageOnly, '清理浏览器存储')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            disabled={isClearing}
          >
            🌐 清理缓存
          </button>
        </div>
      </div>

      {/* 选择性清理 */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <h3 className="text-lg font-bold text-purple-800 mb-4">选择性清理</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(selectedOptions).map(([key, checked]) => (
              <label key={key} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setSelectedOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-purple-700">
                  {key === 'inventory' && '🎒 背包数据'}
                  {key === 'redux' && '⚛️ Redux状态'}
                  {key === 'electronStore' && '💾 持久化存储'}
                  {key === 'browserStorage' && '🌐 浏览器存储'}
                </span>
              </label>
            ))}
          </div>
          <button
            onClick={handleSelectiveClear}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            disabled={isClearing}
          >
            执行选择性清理
          </button>
        </div>
      </div>

      {/* 全面清理 */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <h3 className="text-lg font-bold text-red-800 mb-4">⚠️ 全面清理</h3>
        <p className="text-sm text-red-700 mb-4">
          这将清理所有游戏数据，包括背包、召唤兽、任务进度等。此操作不可撤销！
        </p>
        <button
          onClick={() => handleClearAction(clearAllData, '全面清理所有数据')}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          disabled={isClearing}
        >
          🧹 全面清理所有数据
        </button>
      </div>

      {/* 操作结果 */}
      {lastClearResult && (
        <div className={`border rounded-xl p-4 ${
          lastClearResult.success !== false ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <h3 className={`text-lg font-bold mb-3 ${
            lastClearResult.success !== false ? 'text-green-800' : 'text-red-800'
          }`}>
            操作结果
          </h3>
          <div className="space-y-2 text-sm">
            {lastClearResult.summary ? (
              <>
                <div>
                  成功操作: <span className="font-medium text-green-600">{lastClearResult.summary.successfulOperations}</span> / 
                  总操作: <span className="font-medium">{lastClearResult.summary.totalOperations}</span>
                </div>
                {lastClearResult.summary.errors.length > 0 && (
                  <div className="text-red-600">
                    错误: {lastClearResult.summary.errors.join(', ')}
                  </div>
                )}
              </>
            ) : (
              <div className={getResultColor(lastClearResult)}>
                {lastClearResult.message || '操作完成'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 清理历史 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">清理历史</h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
          >
            {showHistory ? '隐藏' : '显示'}
          </button>
        </div>
        
        {showHistory && (
          <div className="max-h-40 overflow-y-auto space-y-2">
            {getClearHistory().length > 0 ? (
              getClearHistory().slice(-10).reverse().map((record, index) => (
                <div key={record.timestamp} className="bg-white p-2 rounded-lg border border-gray-200 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{record.message}</span>
                    <span className="text-gray-500 text-xs">{record.date}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">暂无清理历史</p>
            )}
          </div>
        )}
      </div>

      {/* 确认对话框 */}
      {showConfirm && pendingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">确认操作</h3>
            <p className="text-gray-600 mb-6">
              您确定要执行 <span className="font-medium text-red-600">{pendingAction.actionName}</span> 吗？
              {pendingAction.actionName.includes('全面清理') && (
                <span className="block mt-2 text-red-500 font-medium">
                  ⚠️ 此操作将删除所有游戏数据且不可撤销！
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setPendingAction(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                disabled={isClearing}
              >
                取消
              </button>
              <button
                onClick={confirmClear}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                disabled={isClearing}
              >
                {isClearing ? '清理中...' : '确认清理'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 清理进行中的覆盖层 */}
      {isClearing && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">正在清理数据，请稍候...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// 主背包系统组件
export default function InventorySystem() {
  const inventoryState = useInventoryManager();
  const actions = useInventoryActions();
  const [activeTab, setActiveTab] = useState('inventory');
  const [recentlyAdded, setRecentlyAdded] = useState([]);

  // 监听物品添加事件，显示最近添加的物品
  useEffect(() => {
    const handleItemAdded = (data) => {
      console.log('[InventorySystem] 监听到物品添加:', data);
      setRecentlyAdded(prev => [{
        ...data.item,
        addedAt: Date.now()
      }, ...prev.slice(0, 4)]); // 保留最近5个物品
      
      // 5秒后移除
      setTimeout(() => {
        setRecentlyAdded(prev => prev.filter(item => Date.now() - item.addedAt < 5000));
      }, 5000);
    };

    inventoryManager.on('item_added', handleItemAdded);
    
    return () => {
      inventoryManager.off('item_added', handleItemAdded);
    };
  }, []);

  // 添加测试函数
  const testAddItem = () => {
    const testItem = {
      name: `测试物品${Date.now()}`,
      type: 'consumable',
      rarity: 'common',
      quantity: 1,
      description: '用于测试的物品',
      value: 10
    };
    console.log('[InventorySystem] 测试添加物品:', testItem);
    const success = actions.addItem(testItem);
    console.log('[InventorySystem] 添加结果:', success);
  };

  const forceRefresh = () => {
    console.log('[InventorySystem] 强制刷新背包状态');
    // 重新获取状态
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100">
      {/* 调试信息栏 */}
      <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 m-4 text-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <span>状态: {inventoryState.isLoading ? '加载中' : '已加载'}</span>
          <span>金币: {inventoryState.gold}</span>
          <span>已用插槽: {inventoryState.usedSlots}</span>
          <span>总容量: {inventoryState.capacity}</span>
          <button 
            onClick={testAddItem}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium"
          >
            测试添加物品
          </button>
          <button 
            onClick={forceRefresh}
            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs font-medium"
          >
            强制刷新
          </button>
        </div>
        
        {/* 最近添加的物品 */}
        {recentlyAdded.length > 0 && (
          <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded">
            <div className="text-green-800 font-semibold mb-1">🆕 最近添加的物品：</div>
            <div className="flex flex-wrap gap-2">
              {recentlyAdded.map(item => (
                <span 
                  key={`${item.id}-${item.addedAt}`}
                  className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-medium"
                >
                  {item.name} {item.quantity > 1 && `x${item.quantity}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 标签栏 */}
      <div className="flex border-b border-slate-200 px-6 bg-white">
        {[
          { id: 'inventory', label: '物品背包', icon: '🎒' },
          { id: 'search', label: '搜索筛选', icon: '🔍' },
          { id: 'organize', label: '整理排序', icon: '📋' },
          { id: 'stats', label: '统计信息', icon: '📊' },
          { id: 'clear', label: '数据清理', icon: '🧹' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'inventory' && <InventoryGrid />}
        {activeTab === 'search' && <InventorySearch />}
        {activeTab === 'organize' && <InventoryOrganization />}
        {activeTab === 'stats' && <InventoryStats />}
        {activeTab === 'clear' && <DataClear />}
      </div>
    </div>
  );
} 