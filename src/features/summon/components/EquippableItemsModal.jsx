import React from 'react';
import { useSelector } from 'react-redux';
import { selectAllItemsWithSummonInfo } from '../../../store/slices/itemSlice';
import { selectAllSummons } from '../../../store/slices/summonSlice';
import { petEquipmentConfig, equipmentQualityConfig } from '@/config/petEquipmentConfig';
import { uiText, getQualityDisplayName, getAttributeDisplayName } from '@/config/uiTextConfig';

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

  // -------- START DEBUG LOGS --------
  if (isOpen && slotType) {
    console.log('[EquippableItemsModal] Props:', { isOpen, slotType, currentSummonId });
    console.log('[EquippableItemsModal] All items with summon info (after useSelector):', JSON.parse(JSON.stringify(allItemsWithSummonInfo)));
    const itemsForThisSlotType = allItemsWithSummonInfo.filter(item => item.slotType === slotType);
    console.log(`[EquippableItemsModal] Items matching slotType "${slotType}" (with summon info):`, JSON.parse(JSON.stringify(itemsForThisSlotType)));
  }
  // -------- END DEBUG LOGS --------

  if (!isOpen || !slotType) return null;

  const equippableItems = allItemsWithSummonInfo.filter(item => {
    if (item.slotType !== slotType) return false;
    // Further logic to exclude items already equipped by the current summon in *this* slot could be added
    // For now, we show all items matching the slot type.
    // The parent component (SummonSystem) handles logic for items equipped by *other* summons.
    return true;
  });

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

        {equippableItems.length === 0 ? (
          <p className="text-slate-400 text-center py-4">没有适合该槽位的可用装备。</p>
        ) : (
          <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {equippableItems.map(item => {
              const itemQualityColorName = item.quality ? equipmentQualityConfig.colors[item.quality] || 'normal' : 'normal';
              
              const isEquippedByOther = item.isEquipped && item.equippedBy && item.equippedBy !== currentSummonId;
              const equippedBySummonName = isEquippedByOther ? getSummonName(item.equippedBy) : null;

              return (
                <li
                  key={item.id}
                  onClick={() => onItemSelected(item)}
                  className={`p-3 bg-slate-700 hover:bg-slate-600 rounded-md cursor-pointer transition-all duration-150 border-l-4 border-${itemQualityColorName}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className={`font-semibold text-${itemQualityColorName} mr-2`}>{item.name}</span>
                      <span className="text-xs text-slate-400">({getQualityDisplayName(item.quality)})</span>
                    </div>
                    {item.icon && <i className={`fas ${item.icon} text-lg text-${itemQualityColorName}`}></i>}
                  </div>
                  {item.description && <p className="text-xs text-slate-300 mt-1 mb-2">{item.description}</p>}
                  
                  {/* Display Final Effects */}
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