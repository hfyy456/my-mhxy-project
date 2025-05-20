import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { INVENTORY_CONFIG } from "@/config/inventoryConfig";
import { useInventory /* useItems is no longer directly needed here as items are derived with full info */ } from "@/store/reduxSetup";
import {
  moveInInventory,
  addToInventory,
  removeFromInventory,
  sortInventory,
} from "@/store/slices/inventorySlice";
import { selectAllItemsArray, selectItemWithSummonInfo, selectEquippedItemsWithSummonInfo } from "@/store/slices/itemSlice";
import { manageEquipItemThunk, manageUnequipItemThunk } from "@/store/thunks/equipmentThunks";
import { STANDARD_EQUIPMENT_SLOTS } from "@/config/config";
import { uiText, getQualityDisplayName, getAttributeDisplayName } from "@/config/uiTextConfig";

// 新的 Tooltip 组件
const ItemTooltip = ({ item, position }) => {
  if (!item) return null; // Guard if item is somehow null

  const qualityColorName = `text-quality-${INVENTORY_CONFIG.QUALITY_COLORS[item.quality]?.split('-')[1] || 'normal'}`;

  const getItemTypeDisplay = (type) => {
    const typeMap = {
      equipment: "装备",
      consumable: "消耗品",
      material: "材料",
      quest: "任务物品"
    };
    return typeMap[type] || type;
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
      {item.level && (
        <p className="text-xs text-slate-400 mt-1">等级: {item.level}</p>
      )}

      {/* Use item properties directly assuming it has full summon info */}
      {item.isEquipped && item.equippedBy && (
        <p className="text-xs text-blue-400 mt-2 pt-2 border-t border-slate-700">
          装备于: {item.equippedBySummonName || '信息缺失'} {/* Added fallback for safety */}
        </p>
      )}
    </div>
  );
};

// 新增：召唤兽选择模态框组件
const SummonSelectModal = ({ summons, onItemEquip, onCancel, itemToEquipName }) => {
  if (!summons || summons.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl text-center">
          <h3 className="text-xl font-semibold text-white mb-4">没有可选择的召唤兽</h3>
          <p className="text-slate-300 mb-6">你目前没有任何召唤兽可以装备此物品。</p>
          <button
            onClick={onCancel}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-150"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-semibold text-white mb-4 text-center">为 {itemToEquipName} 选择装备对象</h3>
        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
          {summons.map((summon) => (
            <button
              key={summon.id}
              onClick={() => onItemEquip(summon.id)}
              className="w-full flex items-center justify-between bg-slate-700 hover:bg-slate-600 p-3 rounded-md transition-colors duration-150"
            >
              <span className="text-white">{summon.name} (等级 {summon.level})</span>
              <span className="text-xs text-slate-400">点击选择</span>
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onCancel}
            className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-150"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

// 新增：替换确认模态框组件
const ReplaceConfirmModal = ({ isOpen, onConfirm, onCancel, details }) => {
  if (!isOpen || !details) return null;

  const { summonToUpdate, oldItem, newItem } = details;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-semibold text-white mb-4 text-center">替换装备确认</h3>
        <p className="text-slate-300 mb-2 text-center">
          召唤兽 <span className="font-semibold text-purple-400">{summonToUpdate.name || summonToUpdate.nickname}</span> 的 <span className="font-semibold text-yellow-400">{uiText.equipmentSlots[newItem.slotType] || newItem.slotType}</span> 槽位
        </p>
        <p className="text-slate-300 mb-2 text-center">
          当前已装备: <span className="font-semibold text-orange-400">{oldItem.name}</span> (等级 {oldItem.level || 'N/A'})
        </p>
        <p className="text-slate-300 mb-6 text-center">
          是否替换为: <span className="font-semibold text-green-400">{newItem.name}</span> (等级 {newItem.level || 'N/A'})?
        </p>
        <div className="flex justify-around mt-6">
          <button
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-150"
          >
            替换
          </button>
          <button
            onClick={onCancel}
            className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-150"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

const InventoryPanel = ({ isOpen, onClose, showToast }) => {
  const dispatch = useDispatch();
  const { slots, capacity } = useInventory();
  const allSummonsMap = useSelector((state) => state.summons.allSummons);
  const currentState = useSelector(state => state); // Get the whole state for useMemo

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

  // Summon Selection Modal state
  const [showSummonSelectModal, setShowSummonSelectModal] = useState(false);
  const [itemToEquipDetails, setItemToEquipDetails] = useState(null);

  // Replace Confirm Modal State
  const [showReplaceConfirmModal, setShowReplaceConfirmModal] = useState(false);
  const [replaceDetails, setReplaceDetails] = useState(null); // { summonToUpdate, oldItem, newItem }

  // 获取背包物品数据 - NOW WITH SUMMON INFO
  const inventoryItemsWithSummonInfo = useMemo(() => {
    const result = [];
    Object.entries(slots).forEach(([slotId, itemId]) => {
      if (itemId) {
        const itemData = selectItemWithSummonInfo(currentState, itemId);
        if (itemData) {
          result[parseInt(slotId)] = itemData; // Store the fully processed item
        }
      }
    });
    return result;
  }, [slots, currentState]); // Rerun when slots or relevant parts of currentState change

  // 过滤物品 - USES inventoryItemsWithSummonInfo
  const filteredSlots = useMemo(() => {
    if (activeFilter === "all") {
      return inventoryItemsWithSummonInfo;
    }
    return inventoryItemsWithSummonInfo.map((item) =>
      item && item.itemType === activeFilter ? item : null
    );
  }, [inventoryItemsWithSummonInfo, activeFilter]);

  // 获取物品类型统计 - USES inventoryItemsWithSummonInfo
  const itemTypeStats = useMemo(() => {
    const stats = {
      all: inventoryItemsWithSummonInfo.filter((item) => item !== null && item !== undefined)
        .length,
      equipment: inventoryItemsWithSummonInfo.filter((item) => item?.itemType === "equipment")
        .length,
      consumable: inventoryItemsWithSummonInfo.filter((item) => item?.itemType === "consumable")
        .length,
      material: inventoryItemsWithSummonInfo.filter((item) => item?.itemType === "material")
        .length,
      quest: inventoryItemsWithSummonInfo.filter((item) => item?.itemType === "quest").length,
    };
    return stats;
  }, [inventoryItemsWithSummonInfo]);

  // 处理物品点击
  const handleItemClick = (slotIndex) => {
    const clickedItem = filteredSlots[slotIndex]; // Item in the slot that was just clicked
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

  // 处理物品拖拽开始
  const handleDragStart = (e, slotIndex) => {
    const item = filteredSlots[slotIndex];
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

  // 处理物品使用
  const handleUseItem = (slotIndex) => {
    const item = filteredSlots[slotIndex];
    if (!item) return;

    if (item.itemType === "equipment") {
      // 这里应该添加装备逻辑
      // 为简单起见，这里只移除物品
      dispatch(removeFromInventory(slotIndex));
      showToast(`使用了 ${item.name}`, "info");
    } else if (item.itemType === "consumable") {
      // 这里应该添加消耗品使用的逻辑
      // 为简单起见，这里只移除物品
      dispatch(removeFromInventory(slotIndex));
      showToast(`使用了 ${item.name}`, "info");
    }
  };

  // 处理物品分割
  const handleSplitItem = () => {
    if (selectedSlot === null) return;

    const item = filteredSlots[selectedSlot];
    if (!item || !item.stackable || !item.amount || item.amount <= 1) {
      showToast("该物品不可分割或数量不足", "warning");
      return;
    }

    if (splitAmount >= item.amount) {
      showToast("分割数量不能大于等于物品总数", "warning");
      return;
    }

    // 找一个空格子
    let emptySlot = null;
    for (let i = 0; i < capacity; i++) {
      if (!filteredSlots[i]) {
        emptySlot = i;
        break;
      }
    }

    if (emptySlot === null) {
      showToast("背包已满，无法分割物品", "error");
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

    const sortedItems = [...filteredSlots.filter(Boolean)];

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

  const initiateEquipSequence = (detailsToEquip) => {
    if (!detailsToEquip || !detailsToEquip.itemId) {
      console.error("No item selected or item details are missing for equip sequence.");
      return;
    }
    // Check if player has any summons
    const summonsArray = Object.values(allSummonsMap || {});
    if (summonsArray.length === 0) {
      console.info("No summons available to equip the item.");
      setShowSummonSelectModal(true); // Still show modal, it will display "no summons" message
      return;
    }
    setShowSummonSelectModal(true);
  };

  const handleConfirmEquipToSummon = async (targetSummonId) => {
    console.log("Attempting to equip. Target Summon ID:", targetSummonId);
    console.log("Item Details:", itemToEquipDetails);

    if (!itemToEquipDetails || !itemToEquipDetails.itemId || !targetSummonId) {
      console.error("Missing item details or target summon ID for equip sequence.");
      setShowSummonSelectModal(false); 
      setItemToEquipDetails(null);
      showToast("装备失败：缺少物品或目标信息", "error");
      return;
    }

    const itemToEquip = inventoryItemsWithSummonInfo.find(i => i?.id === itemToEquipDetails.itemId);
    const summonToUpdate = allSummonsMap ? allSummonsMap[targetSummonId] : null;

    if (!itemToEquip || !summonToUpdate) {
      console.error("Item to equip or summon details not found for confirmation.");
      showToast("装备失败：物品或召唤兽数据错误", "error");
      setShowSummonSelectModal(false);
      setItemToEquipDetails(null);
      return;
    }

    const slotTypeToEquip = itemToEquipDetails.slotType;
    if (!slotTypeToEquip) {
        console.error("Item slot type is missing for equip sequence.", itemToEquipDetails);
        setShowSummonSelectModal(false); 
        setItemToEquipDetails(null);
        showToast("装备失败：物品槽位类型缺失", "error");
        return;
    }

    const existingItemIdInSlot = summonToUpdate.equippedItemIds ? summonToUpdate.equippedItemIds[slotTypeToEquip] : null;

    if (existingItemIdInSlot && existingItemIdInSlot !== itemToEquip.id) {
      const oldItem = selectItemWithSummonInfo(currentState, existingItemIdInSlot);
      if (oldItem) {
        setReplaceDetails({
          summonToUpdate: summonToUpdate,
          oldItem: oldItem,
          newItem: itemToEquip,
        });
        setShowReplaceConfirmModal(true);
        return; 
      } else {
        showToast(`警告：无法找到原装备信息，将直接装备 ${itemToEquip.name}`, "warning");
      }
    }

    try {
      await dispatch(manageEquipItemThunk({
        summonId: targetSummonId,
        itemIdToEquip: itemToEquip.id,
        slotType: slotTypeToEquip,
      })).unwrap(); // Use unwrap to catch potential errors from the thunk
      showToast(`${itemToEquip.name} 已装备到 ${summonToUpdate ? summonToUpdate.name : '召唤兽'}`, "success");
    } catch (error) {
      console.error("Equip item thunk failed:", error);
      showToast(`装备失败: ${error.message || '未知错误'}`, "error");
    }

    setShowSummonSelectModal(false);
    setItemToEquipDetails(null); 
  };

  const handleConfirmReplacement = async () => {
    if (!replaceDetails) return;
    const { summonToUpdate, oldItem, newItem } = replaceDetails;

    try {
      // 1. Unequip old item
      await dispatch(manageUnequipItemThunk({
        summonId: summonToUpdate.id,
        itemIdToUnequip: oldItem.id, // Pass itemIdToUnequip
        slotType: oldItem.slotType || oldItem.category 
      })).unwrap();

      // 2. Equip new item
      await dispatch(manageEquipItemThunk({
        summonId: summonToUpdate.id,
        itemIdToEquip: newItem.id,
        slotType: newItem.slotType || newItem.category 
      })).unwrap();

      showToast(`${newItem.name} 已替换 ${oldItem.name} 并装备到 ${summonToUpdate.name || summonToUpdate.nickname}`, "success");
    } catch (error) {
      console.error("Replacement thunk failed:", error);
      showToast(`替换装备失败: ${error.message || '未知错误'}`, "error");
    }

    setShowReplaceConfirmModal(false);
    setReplaceDetails(null);
    setShowSummonSelectModal(false); 
    setItemToEquipDetails(null); 
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
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, index)}
                  onMouseEnter={(e) => {
                    setHoveredSlot(index);
                    if (item) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const screenWidth = window.innerWidth;
                      
                      const tooltipWidth = 280; 
                      
                      const x = rect.left + rect.width + tooltipWidth > screenWidth 
                        ? rect.left - tooltipWidth - 10 
                        : rect.left + rect.width + 10;
                      
                      const screenHeight = window.innerHeight;
                      const tooltipHeight = 200; 
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

          {selectedSlot !== null && filteredSlots[selectedSlot] && (
            <div className="bg-slate-700 p-4 rounded mb-4">
              <h3 className="text-lg font-bold text-white mb-2">
                {filteredSlots[selectedSlot].name}
              </h3>
              <p className="text-gray-300 mb-2">
                {filteredSlots[selectedSlot].description}
              </p>

              {filteredSlots[selectedSlot].itemType === "equipment" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(filteredSlots[selectedSlot].finalEffects || {}).map(
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
                {filteredSlots[selectedSlot].itemType === "equipment" && (
                  <>
                    {!filteredSlots[selectedSlot].isEquipped ? (
                      <button
                        onClick={() => {
                          const itemToEquip = filteredSlots[selectedSlot];
                          const currentItemDetails = {
                            itemId: itemToEquip.id,
                            slotType: itemToEquip.slotType || itemToEquip.category,
                            slotIndex: selectedSlot
                          };
                          setItemToEquipDetails(currentItemDetails); // Set state for other parts of the flow
                          initiateEquipSequence(currentItemDetails); // Pass details directly
                        }}
                        className={`px-4 py-2 ${Object.keys(allSummonsMap || {}).length === 0 ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500'} text-white rounded transition-colors duration-200 flex items-center space-x-2`}
                        disabled={Object.keys(allSummonsMap || {}).length === 0}
                        title={Object.keys(allSummonsMap || {}).length === 0 ? "没有可装备的召唤兽" : "选择召唤兽进行装备"}
                      >
                        <i className="fas fa-shield-alt"></i>
                        <span>装备</span>
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          const itemToUnequip = filteredSlots[selectedSlot];
                          if (!itemToUnequip || !itemToUnequip.equippedBy) {
                            showToast("物品信息错误，无法卸下。", "error");
                            return;
                          }
                          try {
                            await dispatch(manageUnequipItemThunk({
                              summonId: itemToUnequip.equippedBy,
                              itemIdToUnequip: itemToUnequip.id, // Pass itemIdToUnequip
                              slotType: itemToUnequip.slotType,
                            })).unwrap();
                            showToast(`\"${itemToUnequip.name}\" 已成功卸下。`, "info");
                            setSelectedSlot(null);
                          } catch (error) {
                            console.error("Unequip item thunk failed:", error);
                            showToast(`卸下失败: ${error.message || '未知错误'}`, "error");
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors duration-200 flex items-center space-x-2"
                        title="从召唤兽身上卸下装备"
                      >
                        <i className="fas fa-times"></i>
                        <span>卸下</span>
                      </button>
                    )}
                  </>
                )}

                {filteredSlots[selectedSlot].itemType === "consumable" && (
                  <button
                    onClick={() => handleUseItem(selectedSlot)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
                  >
                    使用
                  </button>
                )}

                {filteredSlots[selectedSlot].stackable &&
                  filteredSlots[selectedSlot].amount > 1 && (
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

        {/* Summon Selection Modal */}
        {showSummonSelectModal && itemToEquipDetails && (
          <SummonSelectModal
            summons={Object.values(allSummonsMap || {})}
            itemToEquipName={inventoryItemsWithSummonInfo.find(i => i?.id === itemToEquipDetails.itemId)?.name || '物品'}
            onItemEquip={(summonId) => {
              handleConfirmEquipToSummon(summonId);
            }}
            onCancel={() => {
              setShowSummonSelectModal(false);
              setItemToEquipDetails(null); // Clear details if cancelled
            }}
          />
        )}

        {/* Replace Confirmation Modal */}
        <ReplaceConfirmModal
          isOpen={showReplaceConfirmModal}
          details={replaceDetails}
          onConfirm={handleConfirmReplacement}
          onCancel={() => {
            setShowReplaceConfirmModal(false);
            setReplaceDetails(null);
            setShowSummonSelectModal(false); // Also close summon select if replacement is cancelled
            setItemToEquipDetails(null);
            showToast("装备替换已取消", "info");
          }}
        />

        {/* Footer */}
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryPanel;
