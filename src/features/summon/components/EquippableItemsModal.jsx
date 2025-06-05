import React, { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { equipmentQualityConfig } from '@/config/item/equipmentConfig';
import { uiText, getQualityDisplayName, getAttributeDisplayName } from '@/config/ui/uiTextConfig';
import { useInventoryManager, useEquipmentSlotConfig } from '@/hooks/useInventoryManager';
import inventoryManager from '@/store/InventoryManager';
import { useSummonManager } from '@/hooks/useSummonManager'; // 使用OOP召唤兽系统
import { formatEffectDisplay } from '@/utils/equipmentEffectUtils';

// 已移除 formatAttributeValue 函数，现在使用统一的 formatEffectDisplay

const EquippableItemsModal = ({
  isOpen,
  onClose,
  slotType,
  currentSummonId,
  onItemSelected,
}) => {
  // 所有hooks必须在条件返回之前调用
  // const summonsMap = useSelector(selectAllSummons); // 已移除Redux召唤兽系统
  const { allSummons } = useSummonManager(); // 使用OOP召唤兽系统
  const inventoryState = useInventoryManager();
  const { getSlotDisplayName } = useEquipmentSlotConfig();

  // -------- START DEBUG LOGS --------
  if (isOpen && slotType) {
    console.log('[EquippableItemsModal] Props:', { isOpen, slotType, currentSummonId });
    console.log('[EquippableItemsModal] Inventory OOP state:', inventoryState);
    
    // 打印所有装备的详细信息
    const allEquipmentItems = inventoryState.items.filter(item => item.type === 'equipment');
    console.log('[EquippableItemsModal] All equipment items:', allEquipmentItems.map(item => ({
      id: item.id,
      name: item.name,
      slotType: item.slotType,
      type: item.type,
      isEquipped: item.isEquipped,
      equippedBy: item.equippedBy
    })));
    
    const itemsForThisSlotType = inventoryState.items.filter(item => item.slotType === slotType);
    console.log(`[EquippableItemsModal] Items matching slotType "${slotType}" (with summon info):`, JSON.parse(JSON.stringify(itemsForThisSlotType)));
  }
  // -------- END DEBUG LOGS --------

  // InventoryManager装备物品（主要系统）
  const inventoryEquippableItems = useMemo(() => {
    if (!isOpen || !slotType) return [];
    console.log(`[EquippableItemsModal] 正在获取slotType为 "${slotType}" 的装备`);
    
    // 使用直接导入的inventoryManager实例
    const items = inventoryManager.getEquippableItems(slotType, true);
    
    console.log(`[EquippableItemsModal] Found ${items.length} equippable items for slotType: ${slotType}`);
    console.log('[EquippableItemsModal] Items with equipment status:', items.map(item => ({
      id: item.id,
      name: item.name,
      isEquipped: item.equipmentStatus?.isEquipped,
      equippedBy: item.equipmentStatus?.equippedBy,
      canEquip: item.equipmentStatus?.canEquip
    })));
    
    return items;
  }, [inventoryState, slotType, isOpen]);

  const getSummonName = (summonId) => {
    const summon = allSummons[summonId]; // 使用OOP召唤兽数据
    return summon ? (summon.nickname || summon.name) : '未知召唤兽';
  };

  // 获取当前已装备的物品
  const currentEquippedItem = useMemo(() => {
    return inventoryEquippableItems.find(
      item => item.equipmentStatus?.isEquipped && item.equipmentStatus?.equippedBy === currentSummonId
    );
  }, [inventoryEquippableItems, currentSummonId]);

  // 现在在所有hooks调用之后进行条件渲染
  if (!isOpen || !slotType) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg shadow-xl w-full max-w-2xl text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sky-400">
            为 {getSlotDisplayName(slotType)} 选择装备
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* 当前装备状态显示 */}
        {currentEquippedItem && (
          <div className="mb-4 p-3 bg-slate-700 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center mb-2">
              <i className="fas fa-check-circle text-green-400 mr-2"></i>
              <span className="text-green-400 font-semibold">当前装备</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`font-semibold text-${equipmentQualityConfig.colors[currentEquippedItem.quality] || 'normal'}`}>
                {currentEquippedItem.name}
              </span>
              {currentEquippedItem.level && (
                <span className="text-xs text-yellow-400">Lv.{currentEquippedItem.level}</span>
              )}
            </div>
          </div>
        )}

        {inventoryEquippableItems.length === 0 ? (
          <div className="text-slate-400 text-center py-4">
            <p>没有适合该槽位的可用装备。</p>
            <p className="text-xs mt-2 text-slate-500">
              试试在背包中添加一些{getSlotDisplayName(slotType)}装备，或从商店购买装备物品。
            </p>
          </div>
        ) : (
          <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {inventoryEquippableItems
              .sort((a, b) => {
                // 排序：当前装备在前，然后按品质和等级排序
                if (a.equipmentStatus?.isEquipped && a.equipmentStatus?.equippedBy === currentSummonId) return -1;
                if (b.equipmentStatus?.isEquipped && b.equipmentStatus?.equippedBy === currentSummonId) return 1;
                
                // 按品质排序
                const qualityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1, normal: 0 };
                const aQuality = qualityOrder[a.quality] || 0;
                const bQuality = qualityOrder[b.quality] || 0;
                if (aQuality !== bQuality) return bQuality - aQuality;
                
                // 按等级排序
                return (b.level || 0) - (a.level || 0);
              })
              .map(item => {
              const itemQualityColorName = item.quality ? equipmentQualityConfig.colors[item.quality] || 'normal' : 'normal';
              
              const isEquippedByOther = item.equipmentStatus?.isEquipped && item.equipmentStatus?.equippedBy && item.equipmentStatus?.equippedBy !== currentSummonId;
              const isEquippedByCurrent = item.equipmentStatus?.isEquipped && item.equipmentStatus?.equippedBy === currentSummonId;
              const equippedBySummonName = isEquippedByOther ? getSummonName(item.equipmentStatus.equippedBy) : null;

              return (
                <li
                  key={item.id}
                  onClick={() => onItemSelected(item.id)}
                  className={`p-3 ${isEquippedByCurrent ? 'bg-green-800/50' : 'bg-slate-700'} hover:bg-slate-600 rounded-md cursor-pointer transition-all duration-150 border-l-4 border-${itemQualityColorName} relative`}
                >
                  <div className="absolute top-2 right-2 flex gap-1">
                    {/* 当前装备标记 */}
                    {isEquippedByCurrent && (
                      <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full" title="当前装备">
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center pr-16">
                    <div>
                      <span className={`font-semibold text-${itemQualityColorName} mr-2`}>{item.name}</span>
                      <span className="text-xs text-slate-400">({getQualityDisplayName(item.quality)})</span>
                      {item.level && (
                        <span className="text-xs text-yellow-400 ml-2">Lv.{item.level}</span>
                      )}
                    </div>
                    {item.icon && <i className={`fas ${item.icon} text-lg text-${itemQualityColorName}`}></i>}
                  </div>
                  {item.description && <p className="text-xs text-slate-300 mt-1 mb-2">{item.description}</p>}
                  
                  {item.effects && Object.keys(item.effects).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-600">
                      <p className="text-slate-300 font-semibold text-xs mb-1">属性加成:</p>
                      {Object.entries(item.effects).map(([stat, effect]) => (
                        <div key={stat} className="text-xs flex justify-between">
                          <span className="text-gray-400">{getAttributeDisplayName(stat)}:</span>
                          <span className="text-green-400">{formatEffectDisplay(stat, effect)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 装备状态信息 */}
                  {item.equipmentStatus?.isEquipped && item.equipmentStatus?.equippedBy && (
                    <p className="text-xs text-yellow-400 mt-2">
                      {isEquippedByCurrent 
                        ? '(当前召唤兽装备中)' 
                        : `(已装备于: ${equippedBySummonName})`
                      }
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-150"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquippableItemsModal; 