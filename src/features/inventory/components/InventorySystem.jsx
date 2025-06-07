/**
 * 御灵录背包系统 - 优化版
 * 基于面向对象设计的主要背包管理系统
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useInventoryManager,
  useInventoryActions,
  useInventorySlots,
  useGold,
  useInventoryCapacity,
  useInventoryDragDrop,
  useEquipmentSlotConfig
} from '../../../hooks/useInventoryManager';
import { useSummonManager } from '../../../hooks/useSummonManager';
import inventoryManager from '../../../store/InventoryManager';
import { EQUIPMENT_SLOT_TYPES } from '@/config/enumConfig';
import { uiText, getAttributeDisplayName, getQualityDisplayName } from '@/config/ui/uiTextConfig';
import { useEquipmentRelationship, useItemEquipmentStatus, useSummonEquipmentStatus } from '../../../hooks/useEquipmentRelationship';
import { formatEffectDisplay } from '@/utils/equipmentEffectUtils';

// 背包格子组件
function InventorySlot({ slotIndex, item, onSlotClick, onDragStart, onDragEnd, isDragTarget, isSelected }) {
  const isEmpty = !item;
  
  const getQualityColor = (quality) => {
    switch(quality) {
      case 'legendary': return 'border-yellow-500 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 shadow-lg shadow-yellow-500/30';
      case 'epic': return 'border-purple-600 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 shadow-lg shadow-purple-500/30';
      case 'rare': return 'border-emerald-500 bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-500 shadow-lg shadow-emerald-500/30';
      case 'uncommon': return 'border-amber-600 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-lg shadow-amber-500/30';
      default: return 'border-gray-500 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-md shadow-gray-500/20';
    }
  };
  
  return (
    <div
      className={`
        w-16 h-16 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors duration-200
        ${isEmpty ? 'border-neutral-600 bg-neutral-700 hover:border-neutral-500' : getQualityColor(item.quality)}
        ${isDragTarget ? 'border-sky-400 bg-sky-300 ring-4 ring-sky-400 ring-opacity-50 shadow-xl' : ''}
        ${isSelected ? ' ring-yellow-400 ring-inset shadow-md shadow-yellow-400/50' : ''}
        hover:shadow-xl relative group
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
            <div className="text-xs font-semibold text-neutral-50 truncate w-full leading-tight group-hover:text-yellow-300">
              {item.name}
            </div>
          </div>
          {item.quantity > 1 && (
            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-md">
              {item.quantity}
            </div>
          )}
          {item.type === 'equipment' && (
            <div className="absolute -bottom-1 -left-1 bg-sky-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
              ⚔
            </div>
          )}
          {item.isEquipped && (
            <div className="absolute -top-1 -left-1 bg-green-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center shadow-sm" title="已装备">
              ✓
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 召唤兽选择器组件
function SummonSelector({ item, onSelect, onCancel, getSummonExistingEquipment }) {
  const { allSummons } = useSummonManager();
  const summons = Object.values(allSummons || {});

  const getEquippableSummons = () => {
    return summons.filter(summon => {
      if (!summon.id) return false;
      if (item.requirements?.level && summon.level < item.requirements.level) {
        return false;
      }
      return true;
    });
  };

  const equippableSummons = getEquippableSummons();

  return (
    <div className="absolute inset-0 bg-black bg-opacity-95 rounded-xl z-20 flex flex-col">
      <div className="p-4 border-b border-neutral-600 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">选择装备对象</h3>
        <button
          onClick={onCancel}
          className="text-neutral-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-700 transition-colors"
        >
          ×
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-4 text-center">
          <div className="text-sm text-neutral-300 mb-2">准备装备：</div>
          <div className="bg-neutral-800 rounded-lg p-3 border border-neutral-600">
            <div className="font-semibold text-white">{item.name}</div>
            <div className="text-xs text-neutral-400">
              {item.slotType && `槽位类型：${item.slotType}`}
              {item.requirements?.level && ` | 需要等级：${item.requirements.level}`}
            </div>
          </div>
        </div>
        
        {equippableSummons.length > 0 ? (
          <div className="space-y-2">
            {equippableSummons.map(summon => {
              const summonExistingEquipment = getSummonExistingEquipment ? getSummonExistingEquipment(summon.id) : {};
              const isTargetSlotOccupied = summonExistingEquipment && item.slotType && summonExistingEquipment[item.slotType];
              
              return (
                <button
                  key={summon.id}
                  onClick={() => onSelect(summon.id)}
                  className="w-full p-3 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-left transition-colors border border-neutral-600 hover:border-neutral-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {summon.nickname || summon.name || `召唤兽#${summon.id}`}
                      </div>
                      <div className="text-sm text-neutral-300">
                        等级 {summon.level} | 品质 {summon.quality}
                      </div>
                      {isTargetSlotOccupied && (
                        <div className="text-xs text-yellow-400 mt-1">
                          ⚠ 该部位已有装备 (ID: {summonExistingEquipment[item.slotType]})，将被替换
                        </div>
                      )}
                    </div>
                    <div className="text-neutral-400 ml-4">
                      →
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-neutral-400 py-8">
            <div className="text-lg mb-2">😔</div>
            <div>暂无可装备的召唤兽</div>
            {item.requirements?.level && (
              <div className="text-sm mt-2">
                此装备需要等级 {item.requirements.level}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 物品详情组件
function ItemDetails({ item, onUse, onEquip, onSplit, onUnequip, getSummonExistingEquipmentForItemDetails }) {
  const { getSlotDisplayName } = useEquipmentSlotConfig();
  const { getSummonById } = useSummonManager();
  const [showSummonSelector, setShowSummonSelector] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { 
    isEquipped, 
    summonId: equippedToSummonId, 
    slotType: equippedInSlotType,
  } = useItemEquipmentStatus(item?.id);

  if (!item) {
    return (
      <div className="bg-neutral-700 border-2 border-neutral-600 rounded-xl p-6 h-full flex flex-col items-center justify-center text-neutral-400 min-h-[300px]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 opacity-30" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
        </svg>
        <p className="text-center">
          点击物品查看详情
        </p>
      </div>
    );
  }

  const getQualityStyle = (quality) => {
    switch(quality) {
      case 'legendary': return 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 border-yellow-500 shadow-xl shadow-yellow-500/30';
      case 'epic': return 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 border-purple-600 shadow-xl shadow-purple-500/30';
      case 'rare': return 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 border-emerald-500 shadow-xl shadow-emerald-500/30';
      case 'uncommon': return 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 border-amber-600 shadow-xl shadow-amber-500/30';
      default: return 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 border-gray-500 shadow-lg shadow-gray-500/20';
    }
  };

  const getTypeText = (type) => {
    switch(type) {
      case 'equipment': return '装备';
      case 'consumable': return '消耗品';
      case 'material': return '材料';
      case 'quest': return '任务道具';
      default: return type;
    }
  };

  const getEquippedSummonName = (targetSummonId) => {
    if (!targetSummonId) return '未知召唤兽';
    const summon = getSummonById(targetSummonId);
    if (summon && (summon.nickname || summon.name)) {
      return summon.nickname || summon.name;
    }
    return `召唤兽#${targetSummonId}`;
  };

  const handleEquipToSummon = async (targetSummonId) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setShowSummonSelector(false);
    try {
      const success = await onEquip(item, targetSummonId);
      if (success) {
        console.log(`[ItemDetails] 装备成功回调: ${item.name} -> 召唤兽 ${targetSummonId}`);
      }
    } catch (error) {
      console.error(`[ItemDetails] 装备失败回调:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`border-2 rounded-xl p-4 shadow-lg ${getQualityStyle(item.quality)} text-neutral-50 min-h-[300px] flex flex-col relative`}>
      {showSummonSelector && (
        <SummonSelector
          item={item}
          onSelect={handleEquipToSummon}
          onCancel={() => setShowSummonSelector(false)}
          getSummonExistingEquipment={getSummonExistingEquipmentForItemDetails}
        />
      )}

      {isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl z-10 flex items-center justify-center">
          <div className="text-white text-sm">处理中...</div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-xl font-bold text-white drop-shadow-sm">{item.name}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
          item.quality === 'legendary' ? 'bg-yellow-500 text-yellow-50' :
          item.quality === 'epic' ? 'bg-purple-600 text-purple-50' :
          item.quality === 'rare' ? 'bg-emerald-500 text-emerald-50' :
          item.quality === 'uncommon' ? 'bg-amber-600 text-amber-50' :
          'bg-gray-500 text-gray-50'
        }`}>
          {getQualityDisplayName(item.quality)}
        </span>
        {isEquipped && (
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
            已装备
          </span>
        )}
      </div>
      
      <div className="space-y-2 text-sm mb-4 flex-grow">
        <div className="flex justify-between">
          <span className="font-medium text-neutral-300">{uiText.labels.type}</span>
          <span className="text-neutral-100">{getTypeText(item.type)}</span>
        </div>
        {item.type === 'equipment' && item.slotType && (
          <div className="flex justify-between">
            <span className="font-medium text-neutral-300">装备槽位:</span>
            <span className="text-sky-300 font-medium">{getSlotDisplayName(item.slotType)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-medium text-neutral-300">数量:</span>
          <span className="font-semibold text-neutral-100">{item.quantity}</span>
        </div>
        {item.value > 0 && (
          <div className="flex justify-between">
            <span className="font-medium text-neutral-300">价值:</span>
            <span className="text-yellow-400 font-semibold">{item.value.toLocaleString()} 金</span>
          </div>
        )}
        {isEquipped && equippedToSummonId && (
          <div className="flex justify-between">
            <span className="font-medium text-neutral-300">装备于:</span>
            <span className="text-green-400 font-semibold">{getEquippedSummonName(equippedToSummonId)}</span>
          </div>
        )}
        {item.level && (
          <div className="flex justify-between">
            <span className="font-medium text-neutral-300">{uiText.labels.level}</span>
            <span className="text-orange-400 font-semibold">Lv.{item.level}</span>
          </div>
        )}
        {item.requirements?.level && (
          <div className="flex justify-between">
            <span className="font-medium text-neutral-300">等级需求:</span>
            <span className="text-orange-400 font-semibold">Lv.{item.requirements.level}</span>
          </div>
        )}
        {item.type === 'equipment' && item.effects && Object.keys(item.effects).length > 0 && (
          <div className="mt-3">
            <h4 className="font-medium text-neutral-200 mb-2">属性加成:</h4>
            <div className="bg-black bg-opacity-20 rounded-lg p-2 space-y-1">
              {Object.entries(item.effects).map(([stat, effect]) => (
                <div key={stat} className="flex justify-between text-xs">
                  <span className="text-neutral-300">{getAttributeDisplayName(stat)}:</span>
                  <span className="text-green-400 font-semibold">{formatEffectDisplay(stat, effect)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {item.description && (
          <div className="mt-3 p-3 bg-black bg-opacity-20 rounded-lg">
            <p className="text-xs text-neutral-300 italic">{item.description}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mt-auto pt-3 border-t border-white border-opacity-10">
        {item.type === 'consumable' && (
          <button
            onClick={() => onUse(item)}
            disabled={isProcessing}
            className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg focus:outline-none  focus:ring-teal-500 focus:ring-opacity-75 transition-all"
          >
            使用
          </button>
        )}
        
        {item.type === 'equipment' && !isEquipped && (
          <button
            onClick={() => setShowSummonSelector(true)}
            disabled={isProcessing}
            className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg focus:outline-none  focus:ring-sky-500 focus:ring-opacity-75 transition-all"
          >
            {uiText.buttons.equipItem}
          </button>
        )}
        
        {isEquipped && (
          <button
            onClick={() => {
              if (isProcessing) return;
              setIsProcessing(true);
              onUnequip(item).finally(() => setIsProcessing(false));
            }}
            disabled={isProcessing}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg focus:outline-none  focus:ring-red-500 focus:ring-opacity-75 transition-all"
          >
            {uiText.buttons.unequipItem}
          </button>
        )}
        
        {item.quantity > 1 && (
          <button
            onClick={() => onSplit(item)}
            disabled={isProcessing}
            className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg focus:outline-none focus:ring-amber-500 focus:ring-opacity-75 transition-all"
          >
            拆分
          </button>
        )}
      </div>
    </div>
  );
}

// 金币显示组件
function GoldDisplay() {
  const { gold } = useGold();

  return (
    <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-lg shadow-lg p-3">
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl">💰</span>
        <span className="text-xl font-bold text-yellow-50">{gold.toLocaleString()}</span>
        <span className="text-yellow-100 font-medium">金币</span>
      </div>
    </div>
  );
}

// 容量信息组件
function CapacityInfo() {
  const { capacity, filledSlots } = useInventoryCapacity();
  const percentage = capacity > 0 ? (filledSlots / capacity) * 100 : 0;

  let barColor = 'bg-green-500';
  if (percentage > 90) {
    barColor = 'bg-red-500';
  } else if (percentage > 70) {
    barColor = 'bg-yellow-500';
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-neutral-300">{filledSlots}/{capacity}</span>
      <div className="w-20 bg-neutral-600 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

// 背包网格组件
function InventoryGrid() {
  const slots = useInventorySlots();
  const actions = useInventoryActions();
  const { startDrag, endDrag, isDragging, draggedItem } = useInventoryDragDrop();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const { equipItem, unequipItem, getSummonEquipment } = useEquipmentRelationship();

  const handleSlotClick = (slotIndex) => {
    setSelectedSlot(slotIndex);
    const slot = slots[slotIndex];
    const item = slot?.itemId ? actions.getItemById(slot.itemId) : null;
    setSelectedItem(item);
  };

  const handleDragStart = (e, slotIndex) => {
    const slot = slots[slotIndex];
    const item = slot?.itemId ? actions.getItemById(slot.itemId) : null;
    if (item) startDrag(item);
  };

  const handleDragEnd = (e, targetSlot) => {
    if (isDragging && draggedItem && targetSlot !== selectedSlot) {
      actions.moveItem(selectedSlot, targetSlot);
    }
    endDrag();
  };

  const handleUse = async (item) => {
    console.log(`[InventorySystem] 使用物品: ${item.name}`);
    try {
      const result = await actions.useItem(item.id);
      if (result.success) {
        setSelectedItem(actions.getItemById(item.id));
      }
      return result.success;
    } catch (error) {
      console.error(`[InventorySystem] 使用物品失败:`, error);
      return false;
    }
  };

  const handleEquip = async (itemToEquip, targetSummonId) => {
    console.log(`[InventoryGrid] 准备装备: ${itemToEquip.name} -> 召唤兽 ${targetSummonId}`);
    
    if (itemToEquip.type !== 'equipment' || !itemToEquip.slotType) {
      console.error(`[InventoryGrid] 物品 ${itemToEquip.name} 不是装备或缺少槽位类型`);
      return false;
    }

    try {
      const success = await equipItem(itemToEquip.id, targetSummonId, itemToEquip.slotType);
      
      if (success) {
        console.log(`[InventoryGrid] 新系统装备成功: ${itemToEquip.name} -> 召唤兽 ${targetSummonId}`);
        return true;
      } else {
        console.error(`[InventoryGrid] 新系统装备失败: ${itemToEquip.name}`);
        return false;
      }
    } catch (error) {
      console.error(`[InventoryGrid] 新系统装备时发生错误:`, error);
      return false;
    }
  };

  const handleSplit = (item) => {
    console.log(`拆分物品: ${item.name}, 数量: ${item.quantity}`);
    alert('物品拆分功能开发中...');
  };

  const handleUnequip = async (itemToUnequip) => {
    console.log(`[InventoryGrid] 准备卸载: ${itemToUnequip.name}`);
    
    try {
      const success = await unequipItem(itemToUnequip.id);
      
      if (success) {
        console.log(`[InventoryGrid] 新系统卸载成功: ${itemToUnequip.name}`);
        return true;
      } else {
        console.error(`[InventoryGrid] 新系统卸载失败: ${itemToUnequip.name}`);
        return false;
      }
    } catch (error) {
      console.error(`[InventoryGrid] 新系统卸载时发生错误:`, error);
      return false;
    }
  };

  const { sortItems } = useInventoryActions();
  const handleSort = (sortType) => {
    sortItems(sortType);
  };

  return (
    <div className="flex gap-6 p-4">
      <div className="flex-1 space-y-4">
        <GoldDisplay />
        
        <div>
          <div className="bg-neutral-700 text-neutral-100 px-4 py-3 rounded-t-lg font-semibold text-lg shadow-md flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>🎒 物品背包</span>
              <CapacityInfo />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleSort('name')}
                className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded text-sm font-medium shadow transition-all duration-150"
                title="按名称排序"
              >
                名称
              </button>
              <button 
                onClick={() => handleSort('type')}
                className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded text-sm font-medium shadow transition-all duration-150"
                title="按类型排序"
              >
                类型
              </button>
              <button 
                onClick={() => handleSort('value')}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded text-sm font-medium shadow transition-all duration-150"
                title="按价值排序"
              >
                价值
              </button>
            </div>
          </div>
          <div className="bg-neutral-800 border border-neutral-700 rounded-b-lg p-4 shadow-inner">
            <div className="grid grid-cols-10 gap-2.5">
              {slots.map(slot => {
                const item = slot?.itemId ? actions.getItemById(slot.itemId) : null;
                return (
                  <InventorySlot
                    key={slot.index}
                    slotIndex={slot.index}
                    item={item}
                    onSlotClick={handleSlotClick}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragTarget={isDragging && selectedSlot !== slot.index}
                    isSelected={selectedSlot === slot.index}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="w-80 space-y-4">
        <div>
          <div className="bg-neutral-700 text-neutral-100 px-4 py-3 rounded-t-lg font-semibold text-lg shadow-md">
            💎 物品详情
          </div>
          <div className="bg-neutral-800 border border-neutral-700 rounded-b-lg p-0 shadow-inner">
            <ItemDetails
              item={selectedItem}
              onUse={handleUse}
              onEquip={handleEquip}
              onSplit={handleSplit}
              onUnequip={handleUnequip}
              getSummonExistingEquipmentForItemDetails={getSummonEquipment}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 主背包系统组件
export default function InventorySystem() {
  const { initializeInventory, isLoading, error } = useInventoryManager();
  const [recentlyAdded, setRecentlyAdded] = useState([]);

  useEffect(() => {
    const handleItemAdded = (data) => {
      console.log('[InventorySystem] 监听到物品添加:', data);
      setRecentlyAdded(prev => [{
        ...data.item,
        addedAt: Date.now()
      }, ...prev.slice(0, 4)]);
      
      setTimeout(() => {
        setRecentlyAdded(prev => prev.filter(item => Date.now() - item.addedAt < 5000));
      }, 5000);
    };

    if (inventoryManager && typeof inventoryManager.on === 'function') {
      inventoryManager.on('item_added', handleItemAdded);
    } else {
      console.warn('[InventorySystem] inventoryManager is not available for event listening.');
    }
    
    return () => {
      if (inventoryManager && typeof inventoryManager.off === 'function') {
        inventoryManager.off('item_added', handleItemAdded);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-200">
      {recentlyAdded.length > 0 && (
        <div className="bg-emerald-800 border-b border-emerald-700 shadow-sm p-3 m-0">
          <div className="container mx-auto">
            <div className="text-emerald-300 font-semibold mb-1 text-sm">🆕 最近获得：</div>
            <div className="flex flex-wrap gap-2">
              {recentlyAdded.map(item => (
                <span 
                  key={`${item.id}-${item.addedAt}`}
                  className="bg-emerald-700 text-emerald-100 px-3 py-1 rounded-full text-sm font-medium border border-emerald-600 shadow-sm"
                >
                  {item.name} {item.quantity > 1 && `x${item.quantity}`}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-neutral-850 pretty-scrollbar">
        <div className="container mx-auto">
          <InventoryGrid />
        </div>
      </div>
    </div>
  );
} 