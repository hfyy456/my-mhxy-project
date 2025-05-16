import React, { useState, useEffect, useMemo } from 'react';
import { INVENTORY_CONFIG } from '../config/inventoryConfig';
import Inventory from '../entities/Inventory';

const InventoryPanel = ({ isOpen, onClose, currentSummon, onEquipItem, inventory: externalInventory }) => {
  const [inventory, setInventory] = useState(externalInventory || new Inventory());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitAmount, setSplitAmount] = useState(1);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showEquipmentMenu, setShowEquipmentMenu] = useState(false);

  // 初始化背包
  useEffect(() => {
    if (externalInventory) {
      setInventory(externalInventory);
    } else {
      const newInventory = new Inventory();
      newInventory.setOnChange((state) => {
        setInventory(newInventory);
      });
      setInventory(newInventory);
    }
  }, [externalInventory]);

  // 过滤物品
  const filteredSlots = useMemo(() => {
    if (activeFilter === 'all') {
      return inventory.slots;
    }
    return inventory.slots.map(slot => 
      slot && slot.type === activeFilter ? slot : null
    );
  }, [inventory.slots, activeFilter]);

  // 获取物品类型统计
  const itemTypeStats = useMemo(() => {
    const stats = {
      all: inventory.slots.filter(slot => slot !== null).length,
      equipment: inventory.slots.filter(slot => slot?.type === 'equipment').length,
      consumable: inventory.slots.filter(slot => slot?.type === 'consumable').length,
      material: inventory.slots.filter(slot => slot?.type === 'material').length,
      quest: inventory.slots.filter(slot => slot?.type === 'quest').length,
    };
    return stats;
  }, [inventory.slots]);

  // 处理物品点击
  const handleItemClick = (slotIndex) => {
    const item = inventory.slots[slotIndex];
    if (!item) return;

    if (selectedSlot === slotIndex) {
      // 如果点击已选中的物品，取消选中
      setSelectedSlot(null);
    } else if (selectedSlot !== null) {
      // 如果已经选中了一个物品，尝试移动或堆叠
      const result = inventory.moveItem(selectedSlot, slotIndex);
      setSelectedSlot(null);
    } else {
      // 选中新物品
      setSelectedSlot(slotIndex);
    }
  };

  // 处理物品右键点击
  const handleItemRightClick = (e, slotIndex) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    const item = inventory.slots[slotIndex];
    if (!item) return;

    setSelectedSlot(slotIndex);
    
    if (item.itemType === 'equipment') {
      setShowEquipmentMenu(true);
    } else if (item.itemType === 'consumable') {
      handleUseItem(slotIndex);
    } else {
      // For other types, or if no specific right-click action, can default to split or info
      // For now, let's assume split is a general option if not equipment/consumable.
      // setShowSplitModal(true); // Or do nothing, or show an info dialog.
    }
  };

  // 处理物品拖拽开始
  const handleDragStart = (e, slotIndex) => {
    const item = inventory.slots[slotIndex];
    if (!item) return;

    setDragItem({ slotIndex, item });
    e.dataTransfer.setData('text/plain', slotIndex.toString());
  };

  // 处理物品拖拽结束
  const handleDragEnd = () => {
    setDragItem(null);
  };

  // 处理物品拖拽放置
  const handleDrop = (e, targetSlot) => {
    e.preventDefault();
    if (dragItem) {
      inventory.moveItem(dragItem.slotIndex, targetSlot);
    }
  };

  // 处理装备物品
  const handleEquipItem = (slotIndexToEquip) => {
    if (!currentSummon) {
      alert('请先选择一个召唤兽');
      return;
    }

    const itemToEquip = inventory.slots[slotIndexToEquip];
    if (!itemToEquip || itemToEquip.itemType !== 'equipment') {
      alert('选择的物品不是装备或无效。');
      return;
    }

    const result = onEquipItem(itemToEquip);

    if (result && result.success) {
      // App.jsx's handleEquipItem already updates the InventoryItem's equipped state via its reference.
      // itemToEquip.setEquipped(true, currentSummon); // This should already be done by App.jsx if it modified the passed inventoryItem
      // However, App.jsx passes inventoryItem to gameManager, which returns a result.
      // App.jsx then updates its own state. The passed inventoryItem to App.jsx's handleEquipItem *is* `itemToEquip`.
      // So, if App.jsx's handleEquipItem directly mutates inventoryItem.isEquipped, it will reflect here.
      // Let's confirm what App.jsx does: It calls inventoryItem.setEquipped(true, summon);
      // So the state of itemToEquip should be updated.

      // Handle unequipped item state in inventory
      if (result.unequippedItemEntityId) {
        const unequippedInventoryItem = inventory.findItemByEntityId(result.unequippedItemEntityId);
        if (unequippedInventoryItem) {
            unequippedInventoryItem.setEquipped(false, null);
        }
      }
      
      // Force a re-render or ensure inventory state propagation if not automatic
      // This might be needed if `inventory` object state changes don't trigger re-render of slots.
      // A common pattern is to make inventory operations return a new inventory state or use a state management library.
      // For now, assuming local changes to item objects within inventory.slots + App.jsx state changes are enough.
      // If using externalInventory, App.jsx should be the source of truth and re-pass inventory.
      // inventory._notifyChange(); // If inventory has its own notification system that InventoryPanel listens to.

      setSelectedSlot(null);
      setShowEquipmentMenu(false);

    } else if (result) {
      alert(result.message || '装备失败，请稍后再试。');
    } else {
      alert('装备操作未返回明确结果。');
    }
  };

  // 处理物品使用
  const handleUseItem = (slotIndex) => {
    if (!currentSummon) {
      alert('请先选择一个召唤兽');
      return;
    }

    const item = inventory.slots[slotIndex];
    if (!item) return;

    if (item.itemType === 'equipment') {
      handleEquipItem(slotIndex);
    } else {
      const result = inventory.useItem(slotIndex, currentSummon);
      if (result.success) {
        alert(result.message);
      } else {
        alert(result.message);
      }
    }
  };

  // 处理物品分割
  const handleSplitItem = () => {
    if (selectedSlot === null) return;

    const result = inventory.splitItem(selectedSlot, splitAmount);
    if (result.success) {
      setShowSplitModal(false);
      setSelectedSlot(null);
      setSplitAmount(1);
    } else {
      alert(result.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-[800px] max-h-[600px] overflow-y-auto"
        onContextMenu={(e) => e.preventDefault()} // 阻止整个面板的右键菜单
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">背包</h2>
            <span className="text-gray-400">
              {inventory.getState().usedSlots}/{INVENTORY_CONFIG.MAX_SLOTS} 格
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* 分类标签 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap
              ${activeFilter === 'all' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
          >
            <i className="fas fa-box"></i>
            <span>全部</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full">
              {itemTypeStats.all}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter('equipment')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap
              ${activeFilter === 'equipment' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
          >
            <i className="fas fa-helmet-battle"></i>
            <span>装备</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full">
              {itemTypeStats.equipment}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter('consumable')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap
              ${activeFilter === 'consumable' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
          >
            <i className="fas fa-pills"></i>
            <span>消耗品</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full">
              {itemTypeStats.consumable}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter('material')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap
              ${activeFilter === 'material' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
          >
            <i className="fas fa-gem"></i>
            <span>材料</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full">
              {itemTypeStats.material}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter('quest')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap
              ${activeFilter === 'quest' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
          >
            <i className="fas fa-scroll"></i>
            <span>任务</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full">
              {itemTypeStats.quest}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-10 gap-3">
          {filteredSlots.map((item, index) => (
            <div
              key={index}
              className={`relative w-16 h-16 bg-slate-700 rounded-lg border-2 cursor-pointer
                transition-all duration-200 transform hover:scale-105
                ${selectedSlot === index ? 'border-purple-500 ring-2 ring-purple-500' : 'border-slate-600'}
                ${dragItem?.slotIndex === index ? 'opacity-50' : ''}
                ${hoveredSlot === index ? 'shadow-lg' : ''}
                ${!item ? 'opacity-50' : ''}
                ${item?.isEquipped ? 'border-green-500' : ''}`}
              onClick={() => handleItemClick(index)}
              onContextMenu={(e) => handleItemRightClick(e, index)}
              draggable={!!item}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, index)}
              onMouseEnter={() => setHoveredSlot(index)}
              onMouseLeave={() => setHoveredSlot(null)}
            >
              {item && (
                <>
                  <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center p-1">
                    <i className={`fas ${item.icon} text-${item.getQualityColor()} text-2xl`}></i>
                    {item.quantity > 1 && (
                      <span className="absolute bottom-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {item.quantity}
                      </span>
                    )}
                    {item.isEquipped && (
                      <span className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        已装备
                      </span>
                    )}
                  </div>
                  <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-slate-900 text-white text-xs rounded-lg py-2 px-3 
                    ${hoveredSlot === index ? 'opacity-100' : 'opacity-0'} 
                    transition-opacity duration-200 z-20 shadow-xl border border-slate-700`}>
                    <p className={`font-bold text-${item.getQualityColor()} mb-1`}>
                      {item.name}
                    </p>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      {item.description}
                    </p>
                    {item.isEquipped && (
                      <p className="text-green-400 text-xs mt-1">
                        {item.getEquippedStatus()}
                      </p>
                    )}
                    {item.itemType === 'consumable' && !item.isEquipped && (
                      <p className="text-green-400 text-xs mt-1">
                        右键点击使用
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* 物品操作按钮 */}
        {selectedSlot !== null && inventory.slots[selectedSlot] && (
          <div className="mt-6 flex gap-3">
            {inventory.slots[selectedSlot].itemType === 'equipment' ? (
              <button
                onClick={() => handleEquipItem(selectedSlot)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 
                  transition-colors duration-200 flex items-center gap-2"
              >
                <i className="fas fa-helmet-battle"></i>
                <span>装备</span>
              </button>
            ) : (
              <button
                onClick={() => handleUseItem(selectedSlot)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 
                  transition-colors duration-200 flex items-center gap-2"
              >
                <i className="fas fa-hand-pointer"></i>
                <span>使用</span>
              </button>
            )}
            {inventory.slots[selectedSlot].itemType !== 'equipment' && (
              <button
                onClick={() => setShowSplitModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 
                  transition-colors duration-200 flex items-center gap-2"
              >
                <i className="fas fa-cut"></i>
                <span>分割</span>
              </button>
            )}
          </div>
        )}

        {/* 分割物品弹窗 */}
        {showSplitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-96">
              <h3 className="text-xl font-bold text-white mb-4">分割物品</h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <label className="text-gray-300">数量：</label>
                  <input
                    type="number"
                    min="1"
                    max={inventory.slots[selectedSlot]?.quantity - 1}
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowSplitModal(false);
                      setSplitAmount(1);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 
                      transition-colors duration-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSplitItem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 
                      transition-colors duration-200"
                  >
                    确认
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 装备菜单 */}
        {showEquipmentMenu && selectedSlot !== null && inventory.slots[selectedSlot]?.itemType === 'equipment' && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-96">
              <h3 className="text-xl font-bold text-white mb-4">装备操作</h3>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    handleEquipItem(selectedSlot);
                    setShowEquipmentMenu(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 
                    transition-colors duration-200 flex items-center gap-2"
                >
                  <i className="fas fa-helmet-battle"></i>
                  <span>装备</span>
                </button>
                <button
                  onClick={() => {
                    setShowEquipmentMenu(false);
                    setSelectedSlot(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 
                    transition-colors duration-200"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPanel; 