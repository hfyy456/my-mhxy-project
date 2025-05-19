import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { INVENTORY_CONFIG } from "@/config/inventoryConfig";
import { useInventory, useCurrentSummon, useItems } from "@/store/reduxSetup";
import {
  moveInInventory,
  addToInventory,
  removeFromInventory,
  sortInventory,
} from "@/store/slices/inventorySlice";
import { setItemStatus, selectAllItemsArray, selectItemWithSummonInfo, selectEquippedItemsWithSummonInfo } from "@/store/slices/itemSlice";
import {
  equipItemToSummon,
  recalculateSummonStats,
  unequipItemFromSummon,
} from "@/store/slices/summonSlice";
import { STANDARD_EQUIPMENT_SLOTS } from "@/config/config";
import { uiText, getQualityDisplayName, getAttributeDisplayName } from "@/config/uiTextConfig";

// 新的 Tooltip 组件
const ItemTooltip = ({ item, position }) => {
  // 获取包含召唤兽信息的完整物品数据
  const itemWithSummonInfo = useSelector(state => selectItemWithSummonInfo(state, item.id));

  const rarityColor =
    INVENTORY_CONFIG.QUALITY_COLORS[item.quality] || "text-gray-300";

  const qualityColorName = `text-quality-${INVENTORY_CONFIG.QUALITY_COLORS[item.quality]?.split('-')[1] || 'normal'}`;

  // 获取物品类型的中文显示
  const getItemTypeDisplay = (type) => {
    const typeMap = {
      equipment: "装备",
      consumable: "消耗品",
      material: "材料",
      quest: "任务物品"
    };
    return typeMap[type] || type;
  };

  // 获取属性的中文显示和格式化值
  const formatAttributeValue = (stat, value) => {
    // 处理百分比属性
    const percentageStats = ['critRate', 'critDamage', 'dodgeRate', 'fireResistance', 'waterResistance', 'thunderResistance', 'windResistance', 'earthResistance'];
    if (percentageStats.includes(stat)) {
      return `${(value * 100).toFixed(1)}%`;
    }
    // 处理整数属性
    return Math.floor(value);
  };

  return (
    <div
      className="fixed bg-slate-900 border border-slate-700 rounded-md shadow-2xl p-3 text-sm text-white z-[100] pointer-events-none transition-opacity duration-150 opacity-100 max-w-xs"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className={`font-medium ${qualityColorName}`}>{item.name}</span>
        <span className={`text-sm ${qualityColorName}`}>({getQualityDisplayName(item.quality)})</span>
      </div>
      <p className="text-xs text-slate-400 mb-2 capitalize">
        {getQualityDisplayName(item.quality)} {item.itemType === "equipment" ? uiText.equipmentSlots[item.slotType] : getItemTypeDisplay(item.itemType)}
      </p>

      {item.description && (
        <p className="text-slate-300 mb-2 text-xs italic">{item.description}</p>
      )}

      {item.itemType === "equipment" && item.finalEffects && (
        <div className="my-2 border-t border-slate-700 pt-2">
          <p className="text-slate-200 font-semibold mb-1 text-xs">属性:</p>
          {Object.entries(item.finalEffects).map(([stat, value]) => {
            // 处理百分比属性
            const percentageStats = ['critRate', 'critDamage', 'dodgeRate', 'fireResistance', 'waterResistance', 'thunderResistance', 'windResistance', 'earthResistance'];
            const displayValue = percentageStats.includes(stat)
              ? `${(value * 100).toFixed(1)}%`
              : Math.floor(value);

            return (
              <p key={stat} className="text-slate-400 text-xs ml-2">
                {getAttributeDisplayName(stat)}: <span className="text-green-400">+{displayValue}</span>
              </p>
            );
          })}
        </div>
      )}
      {/* 如果物品有等级，显示等级 */}
      {item.level && (
        <p className="text-xs text-slate-400 mt-1">等级: {item.level}</p>
      )}

      {/* 如果物品已装备，显示装备者 */}
      {itemWithSummonInfo.isEquipped && itemWithSummonInfo.equippedBy && (
        <p className="text-xs text-blue-400 mt-2 pt-2 border-t border-slate-700">
          装备于: {itemWithSummonInfo.equippedBySummonName}
        </p>
      )}
    </div>
  );
};

const InventoryPanel = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { slots, capacity } = useInventory();
  const currentSummon = useCurrentSummon();
  const items = useItems();
  const allSummonsMap = useSelector((state) => state.summons.allSummons);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitAmount, setSplitAmount] = useState(1);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showEquipmentMenu, setShowEquipmentMenu] = useState(false);
  const [sortConfig, setSortConfig] = useState({ type: "type", order: "asc" });

  // Tooltip State
  const [tooltipItem, setTooltipItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  let tooltipTimeoutRef = React.useRef(null); // Using ref for timeout

  // 获取背包物品数据
  const inventoryItems = useMemo(() => {
    const result = [];
    Object.entries(slots).forEach(([slotId, itemId]) => {
      if (itemId) {
        const item = items.find((item) => item.id === itemId);
        if (item) {
          result[parseInt(slotId)] = item;
        }
      }
    });
    return result;
  }, [slots, items]);

  // 过滤物品
  const filteredSlots = useMemo(() => {
    if (activeFilter === "all") {
      return inventoryItems;
    }
    return inventoryItems.map((item) =>
      item && item.itemType === activeFilter ? item : null
    );
  }, [inventoryItems, activeFilter]);

  // 获取物品类型统计
  const itemTypeStats = useMemo(() => {
    const stats = {
      all: inventoryItems.filter((item) => item !== null && item !== undefined)
        .length,
      equipment: inventoryItems.filter((item) => item?.itemType === "equipment")
        .length,
      consumable: inventoryItems.filter((item) => item?.itemType === "consumable")
        .length,
      material: inventoryItems.filter((item) => item?.itemType === "material")
        .length,
      quest: inventoryItems.filter((item) => item?.itemType === "quest").length,
    };
    return stats;
  }, [inventoryItems]);

  // 处理物品点击
  const handleItemClick = (slotIndex) => {
    const clickedItem = inventoryItems[slotIndex]; // Item in the slot that was just clicked
    clearTimeout(tooltipTimeoutRef.current); // Clear any pending tooltip on click
    setTooltipVisible(false);

    if (selectedSlot === slotIndex) {
      // Clicking the same slot again (deselects it)
      setSelectedSlot(null);
    } else {
      // Clicking a new, different slot
      if (clickedItem) {
        // The new slot has an item, so select this new slot
        setSelectedSlot(slotIndex);
      } else {
        // The new slot is empty.
        // If something was selected previously, deselect it. If nothing was selected, this keeps selectedSlot as null.
        setSelectedSlot(null);
      }
    }
  };

  // 处理物品右键点击
  const handleItemRightClick = (e, slotIndex) => {
    e.preventDefault();
    e.stopPropagation();

    const item = inventoryItems[slotIndex];
    if (!item) return;

    setSelectedSlot(slotIndex);

    if (item.itemType === "equipment") {
      setShowEquipmentMenu(true);
    } else if (item.itemType === "consumable") {
      handleUseItem(slotIndex);
    }
  };

  // 处理物品拖拽开始
  const handleDragStart = (e, slotIndex) => {
    const item = inventoryItems[slotIndex];
    if (!item) return;

    setDragItem({ slotIndex, item });
    e.dataTransfer.setData("text/plain", slotIndex.toString());
  };

  // 处理物品拖拽结束
  const handleDragEnd = () => {
    setDragItem(null);
  };

  // 处理物品拖拽放置
  const handleDrop = (e, targetSlot) => {
    e.preventDefault();
    if (dragItem) {
      dispatch(
        moveInInventory({
          fromSlot: dragItem.slotIndex,
          toSlot: targetSlot,
        })
      );
    }
  };

  // 处理装备物品
  const handleEquipItem = (slotIndexToEquip) => {
    if (!currentSummon) {
      alert("请先选择一个召唤兽");
      return;
    }

    const itemToEquip = inventoryItems[slotIndexToEquip];
    if (!itemToEquip || itemToEquip.itemType !== "equipment") {
      alert("选择的物品不是装备或无效。");
      console.warn("Invalid item:", itemToEquip);
      return;
    }

    const summonIdToUpdate = currentSummon.id;

    // 添加调试日志
    console.log("装备信息:", {
      item: itemToEquip,
      slotType: itemToEquip.slotType,
      category: itemToEquip.category,
      type: itemToEquip.type,
      itemType: itemToEquip.itemType,
      availableSlots: STANDARD_EQUIPMENT_SLOTS,
    });

    // 确保装备有正确的槽位类型
    const slotType = itemToEquip.slotType || itemToEquip.category;
    if (!slotType) {
      alert("该装备没有指定槽位类型");
      console.warn("Missing slot type for item:", itemToEquip);
      return;
    }

    if (!STANDARD_EQUIPMENT_SLOTS.includes(slotType)) {
      alert(
        `该装备的槽位类型无效: ${slotType}\n可用槽位: ${STANDARD_EQUIPMENT_SLOTS.join(
          ", "
        )}`
      );
      console.warn(
        "Invalid slot type:",
        slotType,
        "Available slots:",
        STANDARD_EQUIPMENT_SLOTS
      );
      return;
    }

    // 检查是否有已装备的同类型装备
    const currentEquippedItems = currentSummon.equippedItemIds || {};
    const currentEquippedItemId = currentEquippedItems[slotType];

    if (currentEquippedItemId) {
      // 先取消旧装备的装备状态
      dispatch(
        setItemStatus({
          id: currentEquippedItemId,
          isEquipped: false,
          equippedBy: null,
        })
      );
    }

    // 装备新物品
    dispatch(
      equipItemToSummon({
        summonId: summonIdToUpdate,
        itemId: itemToEquip.id,
        slotType: slotType,
      })
    );

    // 标记新物品为已装备状态
    dispatch(
      setItemStatus({
        id: itemToEquip.id,
        isEquipped: true,
        equippedBy: summonIdToUpdate,
        equippedBySummonName: currentSummon.name
      })
    );

    // 重新计算召唤兽属性
    dispatch(recalculateSummonStats({ summonId: summonIdToUpdate }));

    setSelectedSlot(null);
    setShowEquipmentMenu(false);
  };

  // 处理卸下装备
  const handleUnequipItem = (itemToUnequip) => {
    if (!itemToUnequip || !itemToUnequip.isEquipped || !itemToUnequip.equippedBy) {
      console.error("handleUnequipItem: 无效的物品或物品未装备:", itemToUnequip);
      alert("无法卸下该物品。");
      return;
    }

    const summonId = itemToUnequip.equippedBy;
    if (!allSummonsMap[summonId]) {
      alert("未找到装备该物品的召唤兽信息。");
      return;
    }

    // 1. 更新物品状态 (isEquipped: false, equippedBy: null)
    dispatch(setItemStatus({
      id: itemToUnequip.id,
      isEquipped: false,
      equippedBy: null
    }));

    // 2. 从召唤兽身上移除装备记录
    dispatch(unequipItemFromSummon({
      summonId,
      itemId: itemToUnequip.id,
      slotType: itemToUnequip.slotType,
    }));

    // 3. 重新计算召唤兽属性
    dispatch(recalculateSummonStats({ summonId }));

    alert(`"${itemToUnequip.name}" 已成功卸下。`);
    setSelectedSlot(null);
  };

  // 处理物品使用
  const handleUseItem = (slotIndex) => {
    if (!currentSummon) {
      alert("请先选择一个召唤兽");
      return;
    }

    const item = inventoryItems[slotIndex];
    if (!item) return;

    if (item.itemType === "equipment") {
      handleEquipItem(slotIndex);
    } else if (item.itemType === "consumable") {
      // 这里应该添加消耗品使用的逻辑
      // 为简单起见，这里只移除物品
      dispatch(removeFromInventory(slotIndex));
      alert(`使用了 ${item.name}`);
    }
  };

  // 处理物品分割
  const handleSplitItem = () => {
    if (selectedSlot === null) return;

    const item = inventoryItems[selectedSlot];
    if (!item || !item.stackable || !item.amount || item.amount <= 1) {
      alert("该物品不可分割或数量不足");
      return;
    }

    if (splitAmount >= item.amount) {
      alert("分割数量不能大于等于物品总数");
      return;
    }

    // 找一个空格子
    let emptySlot = null;
    for (let i = 0; i < capacity; i++) {
      if (!inventoryItems[i]) {
        emptySlot = i;
        break;
      }
    }

    if (emptySlot === null) {
      alert("背包已满，无法分割物品");
      return;
    }

    // 更新原物品数量
    dispatch(removeFromInventory(selectedSlot));

    // 添加两个新物品：原数量减去分割数量，和分割出来的数量
    const originalItem = { ...item, amount: item.amount - splitAmount };
    const splitItem = {
      ...item,
      amount: splitAmount,
      id: item.id + "-split-" + Date.now(),
    };

    dispatch(
      addToInventory({
        slotId: selectedSlot,
        itemId: originalItem.id,
      })
    );

    dispatch(
      addToInventory({
        slotId: emptySlot,
        itemId: splitItem.id,
      })
    );

    setShowSplitModal(false);
    setSelectedSlot(null);
    setSplitAmount(1);
  };

  // 处理排序
  const handleSort = (sortType) => {
    const newOrder =
      sortConfig.type === sortType && sortConfig.order === "asc"
        ? "desc"
        : "asc";
    setSortConfig({ type: sortType, order: newOrder });

    const sortedItems = [...inventoryItems.filter(Boolean)];

    switch (sortType) {
      case "type":
        sortedItems.sort((a, b) => {
          const typeOrder = {
            equipment: 1,
            consumable: 2,
            material: 3,
            quest: 4,
          };
          const orderA = typeOrder[a.itemType] || 999;
          const orderB = typeOrder[b.itemType] || 999;
          return newOrder === "asc" ? orderA - orderB : orderB - orderA;
        });
        break;
      case "quality":
        sortedItems.sort((a, b) => {
          const qualityOrder = {
            legendary: 1,
            epic: 2,
            rare: 3,
            fine: 4,
            normal: 5,
          };
          const orderA = qualityOrder[a.quality] || 999;
          const orderB = qualityOrder[b.quality] || 999;
          return newOrder === "asc" ? orderA - orderB : orderB - orderA;
        });
        break;
      case "name":
        sortedItems.sort((a, b) => {
          return newOrder === "asc"
            ? a.name.localeCompare(b.name, "zh-CN")
            : b.name.localeCompare(a.name, "zh-CN");
        });
        break;
    }

    // 将排序后的物品ID数组传递给Redux
    const sortedIds = sortedItems.map((item) => item.id);
    dispatch(
      sortInventory({
        sortType,
        sortOrder: newOrder,
        itemIds: sortedIds,
      })
    );
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${
        isOpen ? "opacity-100 z-50" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => { // 点击背景关闭
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-slate-800 rounded-lg p-6 w-[800px] h-[600px] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl text-white font-bold">背包</h2>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => handleSort("type")}
                className={`px-3 py-1 rounded ${
                  sortConfig.type === "type"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
              >
                按类型
                {sortConfig.type === "type" && (
                  <i
                    className={`ml-1 fas fa-sort-${
                      sortConfig.order === "asc" ? "up" : "down"
                    }`}
                  ></i>
                )}
              </button>
              <button
                onClick={() => handleSort("quality")}
                className={`px-3 py-1 rounded ${
                  sortConfig.type === "quality"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
              >
                按品质
                {sortConfig.type === "quality" && (
                  <i
                    className={`ml-1 fas fa-sort-${
                      sortConfig.order === "asc" ? "up" : "down"
                    }`}
                  ></i>
                )}
              </button>
              <button
                onClick={() => handleSort("name")}
                className={`px-3 py-1 rounded ${
                  sortConfig.type === "name"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
              >
                按名称
                {sortConfig.type === "name" && (
                  <i
                    className={`ml-1 fas fa-sort-${
                      sortConfig.order === "asc" ? "up" : "down"
                    }`}
                  ></i>
                )}
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <div className="flex space-x-4 mb-4 flex-shrink-0">
          <button
            onClick={() => {
              setActiveFilter("all");
              setSelectedSlot(null);
              setShowEquipmentMenu(false);
            }}
            className={`flex items-center justify-center space-x-2 px-3 py-2 rounded transition-all duration-150 ${
              activeFilter === "all"
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white"
            }`}
          >
            <i className="fas fa-asterisk"></i>
            <span>全部 ({itemTypeStats.all})</span>
          </button>
          <button
            onClick={() => {
              setActiveFilter("equipment");
              setSelectedSlot(null);
              setShowEquipmentMenu(false);
            }}
            className={`flex items-center justify-center space-x-2 px-3 py-2 rounded transition-all duration-150 ${
              activeFilter === "equipment"
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white"
            }`}
          >
            <i className="fas fa-shield-alt"></i>
            <span>装备 ({itemTypeStats.equipment})</span>
          </button>
          <button
            onClick={() => {
              setActiveFilter("consumable");
              setSelectedSlot(null);
              setShowEquipmentMenu(false);
            }}
            className={`flex items-center justify-center space-x-2 px-3 py-2 rounded transition-all duration-150 ${
              activeFilter === "consumable"
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white"
            }`}
          >
            <i className="fas fa-pills"></i>
            <span>消耗品 ({itemTypeStats.consumable})</span>
          </button>
          <button
            onClick={() => {
              setActiveFilter("material");
              setSelectedSlot(null);
              setShowEquipmentMenu(false);
            }}
            className={`flex items-center justify-center space-x-2 px-3 py-2 rounded transition-all duration-150 ${
              activeFilter === "material"
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white"
            }`}
          >
            <i className="fas fa-gem"></i>
            <span>材料 ({itemTypeStats.material})</span>
          </button>
          <button
            onClick={() => {
              setActiveFilter("quest");
              setSelectedSlot(null);
              setShowEquipmentMenu(false);
            }}
            className={`flex items-center justify-center space-x-2 px-3 py-2 rounded transition-all duration-150 ${
              activeFilter === "quest"
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white"
            }`}
          >
            <i className="fas fa-scroll"></i>
            <span>任务 ({itemTypeStats.quest})</span>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-10 gap-1 sm:gap-1.5 p-1 sm:p-2">
            {Array.from({ length: capacity }).map((_, index) => {
              const item = filteredSlots[index];
              const itemQuality = item?.quality || 'normal';
              const qualityConfig = {
                normal: 'border-gray-600 hover:border-gray-500',
                rare: 'border-blue-600/50 hover:border-blue-500/70',
                epic: 'border-purple-600/50 hover:border-purple-500/70',
                legendary: 'border-orange-600/50 hover:border-orange-500/70',
                mythic: 'border-pink-600/50 hover:border-pink-500/70'
              };
              const qualityBorderClass = qualityConfig[itemQuality];
              
              return (
                <div
                  key={index}
                  className={`relative aspect-square rounded transition-all duration-200 cursor-pointer
                    ${item ? 'bg-slate-700/80' : 'bg-slate-800/50'} 
                    ${selectedSlot === index
                      ? 'ring-2 ring-yellow-400/70 shadow-lg shadow-yellow-400/20 scale-105 z-10'
                      : hoveredSlot === index
                      ? 'ring-1 ring-purple-400/50 shadow-md scale-102'
                      : 'hover:shadow-md hover:scale-102'
                    }
                    border ${item ? qualityBorderClass : 'border-slate-700/50'}
                  `}
                  onClick={() => handleItemClick(index)}
                  onContextMenu={(e) => handleItemRightClick(e, index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, index)}
                  onMouseEnter={(e) => {
                    setHoveredSlot(index);
                    if (item) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const screenWidth = window.innerWidth;
                      
                      // 计算tooltip的预估宽度（可以根据实际情况调整）
                      const tooltipWidth = 280; 
                      
                      // 如果右侧空间不足，则显示在左侧
                      const x = rect.left + rect.width + tooltipWidth > screenWidth 
                        ? rect.left - tooltipWidth - 10 
                        : rect.left + rect.width + 10;
                      
                      // 确保tooltip不会超出屏幕顶部或底部
                      const screenHeight = window.innerHeight;
                      const tooltipHeight = 200; // 预估的tooltip高度
                      let y = rect.top;
                      
                      if (rect.top + tooltipHeight > screenHeight) {
                        y = screenHeight - tooltipHeight - 10;
                      }
                      
                      setTooltipPosition({ x, y });
                      setTooltipItem(item);
                      tooltipTimeoutRef.current = setTimeout(() => {
                        setTooltipVisible(true);
                      }, 300);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredSlot(null);
                    clearTimeout(tooltipTimeoutRef.current);
                    setTooltipVisible(false);
                  }}
                  draggable={!!item}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  {/* 物品图标和数量 */}
                  {item && (
                    <>
                      <div className={`absolute inset-0 flex items-center justify-center
                        ${selectedSlot === index ? 'opacity-90' : 'opacity-80'}
                        transition-opacity duration-200`}
                      >
                        <i className={`fas ${item.icon || 'fa-question'} text-xl
                          ${item.quality === 'legendary' ? 'text-orange-400' :
                            item.quality === 'epic' ? 'text-purple-400' :
                            item.quality === 'rare' ? 'text-blue-400' :
                            item.quality === 'mythic' ? 'text-pink-400' :
                            'text-gray-300'}`}
                        ></i>
                      </div>
                      {/* 物品数量 */}
                      {item.amount > 1 && (
                        <div className="absolute bottom-0 right-0.5 text-xs font-medium text-gray-300 bg-slate-900/80 px-0.5 rounded-sm">
                          {item.amount}
                        </div>
                      )}
                      {/* 装备标记 */}
                      {item.isEquipped && (
                        <div className="absolute top-0 right-0">
                          <i className="fas fa-check-circle text-green-400 text-xs"></i>
                        </div>
                      )}
                    </>
                  )}
                  {/* 空格子提示 */}
                  {!item && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <i className="fas fa-plus text-sm text-gray-400"></i>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedSlot !== null && inventoryItems[selectedSlot] && (
            <div className="bg-slate-700 p-4 rounded mb-4">
              <h3 className="text-lg font-bold text-white mb-2">
                {inventoryItems[selectedSlot].name}
              </h3>
              <p className="text-gray-300 mb-2">
                {inventoryItems[selectedSlot].description}
              </p>

              {inventoryItems[selectedSlot].itemType === "equipment" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(inventoryItems[selectedSlot].finalEffects || {}).map(
                    ([stat, value]) => {
                      // 处理百分比属性
                      const percentageStats = ['critRate', 'critDamage', 'dodgeRate', 'fireResistance', 'waterResistance', 'thunderResistance', 'windResistance', 'earthResistance'];
                      const displayValue = percentageStats.includes(stat)
                        ? `${(value * 100).toFixed(1)}%`
                        : Math.floor(value);
                      
                      return (
                        <div key={stat} className="text-sm">
                          <span className="text-gray-400">{getAttributeDisplayName(stat)}: </span>
                          <span className="text-green-400">+{displayValue}</span>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              <div className="flex space-x-2 mt-4">
                {inventoryItems[selectedSlot].itemType === "equipment" && (
                  <>
                    {!inventoryItems[selectedSlot].isEquipped ? (
                      <button
                        onClick={() => handleEquipItem(selectedSlot)}
                        className={`px-4 py-2 ${!currentSummon ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500'} text-white rounded transition-colors duration-200 flex items-center space-x-2`}
                        disabled={!currentSummon}
                        title={!currentSummon ? "请先选择召唤兽" : "装备到当前召唤兽"}
                      >
                        <i className="fas fa-shield-alt"></i>
                        <span>装备{!currentSummon && "（请先选择召唤兽）"}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnequipItem(inventoryItems[selectedSlot])}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors duration-200 flex items-center space-x-2"
                        title="从召唤兽身上卸下装备"
                      >
                        <i className="fas fa-times"></i>
                        <span>卸下</span>
                      </button>
                    )}
                  </>
                )}

                {inventoryItems[selectedSlot].itemType === "consumable" && (
                  <button
                    onClick={() => handleUseItem(selectedSlot)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
                    disabled={!currentSummon}
                  >
                    使用
                  </button>
                )}

                {inventoryItems[selectedSlot].stackable &&
                  inventoryItems[selectedSlot].amount > 1 && (
                    <button
                      onClick={() => setShowSplitModal(true)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
                    >
                      分割
                    </button>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Tooltip Display */}
        {tooltipVisible && tooltipItem && (
          <ItemTooltip 
            item={tooltipItem} 
            position={tooltipPosition}
          />
        )}

        {showSplitModal &&
          selectedSlot !== null &&
          inventoryItems[selectedSlot] && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-slate-800 p-6 rounded-lg w-80">
                <h3 className="text-lg font-bold text-white mb-4">分割物品</h3>

                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">数量</label>
                  <input
                    type="number"
                    min="1"
                    max={inventoryItems[selectedSlot].amount - 1}
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(parseInt(e.target.value))}
                    className="w-full bg-slate-700 text-white p-2 rounded"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleSplitItem}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded"
                  >
                    确认
                  </button>
                  <button
                    onClick={() => setShowSplitModal(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
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
