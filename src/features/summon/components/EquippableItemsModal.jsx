import React from 'react';
import { useSelector } from 'react-redux';
import { selectAllItemsWithSummonInfo } from '@/store/slices/itemSlice';
import { selectAllSummons } from '@/store/slices/summonSlice';
import { summonEquipmentConfig, equipmentQualityConfig } from '@/config/item/summonEquipmentConfig';
import { uiText, getQualityDisplayName, getAttributeDisplayName } from '@/config/ui/uiTextConfig';
import { useInventoryManager } from '@/hooks/useInventoryManager';

// Helper to format attribute values (similar to ItemTooltip)
const formatAttributeValue = (stat, value) => {
  const percentageStats = ['critRate', 'critDamage', 'dodgeRate', 'fireResistance', 'waterResistance', 'thunderResistance', 'windResistance', 'earthResistance'];
  if (percentageStats.includes(stat)) {
    return `${(value * 100).toFixed(1)}%`;
  }
  return Math.floor(value);
};

const EquippableItemsModal = ({
  isOpen,
  onClose,
  slotType,
  currentSummonId,
  onItemSelected,
}) => {
  const allItemsWithSummonInfo = useSelector(selectAllItemsWithSummonInfo);
  const summonsMap = useSelector(selectAllSummons);
  const inventoryState = useInventoryManager();

  // -------- START DEBUG LOGS --------
  if (isOpen && slotType) {
    console.log('[EquippableItemsModal] Props:', { isOpen, slotType, currentSummonId });
    console.log('[EquippableItemsModal] All items with summon info (after useSelector):', JSON.parse(JSON.stringify(allItemsWithSummonInfo)));
    console.log('[EquippableItemsModal] Inventory OOP state:', inventoryState);
    const itemsForThisSlotType = allItemsWithSummonInfo.filter(item => item.slotType === slotType);
    console.log(`[EquippableItemsModal] Items matching slotType "${slotType}" (with summon info):`, JSON.parse(JSON.stringify(itemsForThisSlotType)));
  }
  // -------- END DEBUG LOGS --------

  if (!isOpen || !slotType) return null;

  // Redux装备物品
  const reduxEquippableItems = allItemsWithSummonInfo.filter(item => {
    if (item.slotType !== slotType) return false;
    return true;
  });

  // 修正：从插槽数据中获取背包系统的装备物品
  const inventoryEquippableItems = inventoryState.slots
    .filter(slot => !slot.isEmpty) // 过滤非空插槽
    .map(slot => {
      // 从items中找到对应的物品数据
      const item = inventoryState.items.find(item => item.id === slot.itemId);
      if (item && item.isEquipment && item.slotType === slotType) {
        return {
          ...item,
          source: 'inventory', // 标记来源为背包系统
          slotIndex: slot.index, // 添加插槽索引
          // 适配显示格式
          finalEffects: item.effects || {},
          quality: item.quality || 'normal'
        };
      }
      return null;
    })
    .filter(Boolean); // 移除null值

  // 合并两个系统的装备物品
  const allEquippableItems = [
    ...reduxEquippableItems.map(item => ({ ...item, source: 'redux' })),
    ...inventoryEquippableItems
  ];

  const getSummonName = (summonId) => {
    const summon = summonsMap[summonId];
    return summon ? (summon.nickname || summon.name) : '未知召唤兽';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg shadow-xl w-full max-w-2xl text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sky-400">
            为 {uiText.equipmentSlots[slotType] || slotType} 选择装备
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {allEquippableItems.length === 0 ? (
          <div className="text-slate-400 text-center py-4">
            <p>没有适合该槽位的可用装备。</p>
            <p className="text-xs mt-2 text-slate-500">
              试试在背包中添加一些装备，或从商店购买装备物品。
            </p>
          </div>
        ) : (
          <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {allEquippableItems.map(item => {
              const itemQualityColorName = item.quality ? equipmentQualityConfig.colors[item.quality] || 'normal' : 'normal';
              
              const isEquippedByOther = item.isEquipped && item.equippedBy && item.equippedBy !== currentSummonId;
              const equippedBySummonName = isEquippedByOther ? getSummonName(item.equippedBy) : null;

              return (
                <li
                  key={`${item.source}-${item.id}`}
                  onClick={() => onItemSelected(item)}
                  className={`p-3 bg-slate-700 hover:bg-slate-600 rounded-md cursor-pointer transition-all duration-150 border-l-4 border-${itemQualityColorName} relative`}
                >
                  <div className="absolute top-2 right-2">
                    {item.source === 'inventory' ? (
                      <span className="bg-amber-600 text-white text-xs px-2 py-1 rounded-full" title="来自面向对象背包系统">
                        OOP
                      </span>
                    ) : (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full" title="来自Redux系统">
                        Redux
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center pr-12">
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
                  
                  {item.finalEffects && Object.keys(item.finalEffects).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-600">
                      <p className="text-slate-300 font-semibold text-xs mb-1">属性加成:</p>
                      {Object.entries(item.finalEffects).map(([stat, value]) => (
                        <div key={stat} className="text-xs flex justify-between">
                          <span className="text-gray-400">{getAttributeDisplayName(stat)}:</span>
                          <span className="text-green-400">+{formatAttributeValue(stat, value)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.source === 'inventory' && (
                    <>
                      {item.isEquipped && item.equippedBy && (
                        <p className="text-xs text-yellow-400 mt-2">
                          (已装备于: {item.equippedBy})
                        </p>
                      )}
                      {item.slotIndex !== undefined && (
                        <p className="text-xs text-slate-400 mt-1">
                          背包位置: 第{item.slotIndex + 1}格
                        </p>
                      )}
                    </>
                  )}

                  {item.source === 'redux' && (
                    <>
                      {isEquippedByOther && (
                        <p className="text-xs text-yellow-400 mt-2">
                          (已装备于: {equippedBySummonName || getSummonName(item.equippedBy) || '未知召唤兽'})
                        </p>
                      )}
                      {item.isEquipped && item.equippedBy === currentSummonId && (
                        <p className="text-xs text-green-400 mt-2">
                          (已装备于当前召唤兽{item.equippedOnSlot ? `的${uiText.equipmentSlots[item.equippedOnSlot] || item.equippedOnSlot}槽位` : ''})
                        </p>
                      )}
                    </>
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