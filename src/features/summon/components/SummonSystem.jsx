/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:06:55
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-17 06:18:10
 */
import React, { useEffect, useCallback, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import SummonInfo from "./SummonInfo";
import PetCatalog from "./PetCatalog";
import SummonList from "./SummonList";
import HistoryModal from "../../history/components/HistoryModal";
import EquippableItemsModal from "./EquippableItemsModal";
import CrossSummonEquipConfirmModal from "./CrossSummonEquipConfirmModal";
import { useSummonSystem } from "../hooks/useSummonSystem";
import { 
  setCurrentSummon,
  addSummon,
  equipItemToSummon,
  unequipItemFromSummon,
  learnSkill,
  replaceSkill,
  addRefinementHistoryItem,
  selectCurrentSummonFullData,
  selectAllSummons,
  recalculateSummonStats,
  updateSummonNickname
} from "../../../store/slices/summonSlice";
import { addItems, selectAllItemsArray, setItemStatus } from "../../../store/slices/itemSlice";
import { addToInventory } from "../../../store/slices/inventorySlice";
import { uiText } from "@/config/uiTextConfig";
import { petConfig } from "@/config/config";
import { playerBaseConfig } from "@/config/playerConfig";
import NicknameModal from "./NicknameModal";
import { generateUniqueId } from "@/utils/idUtils";

const SummonSystem = ({ toasts, setToasts }) => {
  const dispatch = useDispatch();
  const currentSummon = useSelector(selectCurrentSummonFullData);
  const summonsListObject = useSelector(selectAllSummons);
  const allItems = useSelector(selectAllItemsArray);
  const playerLevel = useSelector(state => state.player?.level || 1);
  
  const summonsList = useMemo(() => Object.values(summonsListObject || {}), [summonsListObject]);
  const maxSummons = playerBaseConfig.getMaxSummonsByLevel(playerLevel);
  
  const {
    historyList,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isPetCatalogModalOpen,
    setIsPetCatalogModalOpen,
  } = useSummonSystem(toasts, setToasts);

  const [isEquipmentSelectorOpen, setIsEquipmentSelectorOpen] = useState(false);
  const [selectedSlotForEquipping, setSelectedSlotForEquipping] = useState(null);
  const [isSkillEditorOpen, setIsSkillEditorOpen] = useState(false);
  const [selectedSkillSlotIndex, setSelectedSkillSlotIndex] = useState(null);
  const [currentSkillForSlot, setCurrentSkillForSlot] = useState(null);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [selectedPetForNickname, setSelectedPetForNickname] = useState(null);
  const [tempSummonData, setTempSummonData] = useState(null);

  // State for cross-summon equip confirmation
  const [showCrossEquipConfirm, setShowCrossEquipConfirm] = useState(false);
  const [crossEquipDetails, setCrossEquipDetails] = useState(null); // { itemToEquip, originalSummon, targetSummon }

  const handleOpenEquipmentSelector = useCallback((slotType) => {
    if (!currentSummon) {
      alert(uiText.notifications.selectSummonFirst || "请先选择一个召唤兽");
      return;
    }
    setSelectedSlotForEquipping(slotType);
    setIsEquipmentSelectorOpen(true);
    console.log(`[SummonSystem] Opening equipment selector for slot: ${slotType}`);
  }, [currentSummon]);

  const handleOpenSkillEditor = useCallback((skillIndex, existingSkillName) => {
    if (!currentSummon) {
      alert(uiText.notifications.selectSummonFirst || "请先选择一个召唤兽");
      return;
    }
    setSelectedSkillSlotIndex(skillIndex);
    setCurrentSkillForSlot(existingSkillName);
    setIsSkillEditorOpen(true);
    console.log(`[SummonSystem] Opening skill editor for slot index: ${skillIndex}, current skill: ${existingSkillName}`);
  }, [currentSummon]);

  const handleOpenNicknameModal = useCallback((pet) => {
    setSelectedPetForNickname(pet);
    setIsNicknameModalOpen(true);
  }, []);

  const handleNicknameConfirm = useCallback((nickname) => {
    if (selectedPetForNickname) {
      if (tempSummonData) {
        // 处理新召唤兽的昵称设置
        const updatedSummonPayload = {
          ...tempSummonData.summonPayload,
          nickname
        };
        dispatch(addSummon(updatedSummonPayload));
        dispatch(setCurrentSummon(updatedSummonPayload.id));
        dispatch(addRefinementHistoryItem(tempSummonData.historyItem));
        setTempSummonData(null);
      } else {
        // 直接更新昵称即可，不需要更新装备显示
        dispatch(updateSummonNickname({ 
          id: selectedPetForNickname.id, 
          nickname 
        }));
      }
      
      setToasts(prev => [...prev, {
        id: generateUniqueId('toast'),
        type: "success",
        message: `成功为${selectedPetForNickname.name}设置昵称：${nickname}`,
      }]);
    }
    setSelectedPetForNickname(null);
    setIsNicknameModalOpen(false);
  }, [selectedPetForNickname, tempSummonData, dispatch, setToasts]);

  const handleRefineMonster = useCallback(async () => {
    const { refineMonster } = await import('../../../gameLogic');
    
    try {
      // 检查召唤兽数量限制
      if (summonsList.length >= maxSummons) {
        setToasts(prev => [...prev, {
          id: generateUniqueId('toast'),
          message: `当前等级(${playerLevel})最多可拥有${maxSummons}个召唤兽，请提升等级或释放一些召唤兽`,
          type: 'error'
        }]);
        return;
      }

      const result = refineMonster(playerLevel);
      
      if (result.newSummonPayload && result.newlyCreatedItems && result.historyItem) {
        // 先添加装备到 itemSlice
        dispatch(addItems(result.newlyCreatedItems));
        
        // 将装备添加到背包中
        result.newlyCreatedItems.forEach(item => {
          dispatch(addToInventory({ itemId: item.id }));
        });
        
        if (result.requireNickname) {
          setSelectedPetForNickname({
            ...result.newSummonPayload,
            name: petConfig[result.newSummonPayload.name]?.name || result.newSummonPayload.name
          });
          setIsNicknameModalOpen(true);
          
          setTempSummonData({
            summonPayload: result.newSummonPayload,
            historyItem: result.historyItem
          });
        } else {
          dispatch(addSummon(result.newSummonPayload));
          dispatch(setCurrentSummon(result.newSummonPayload.id));
          dispatch(addRefinementHistoryItem(result.historyItem));
        }

        setToasts(prev => [...prev, {
          id: generateUniqueId('toast'),
          message: result.message || "炼妖成功！获得了新的召唤兽和初始装备！",
          type: 'success'
        }]);
      } else {
        throw new Error(result.message || "炼妖失败，未能返回完整的召唤兽、物品或历史数据");
      }
    } catch (error) {
      console.error("[SummonSystem] 炼妖失败:", error);
      setToasts(prev => [...prev, {
        id: generateUniqueId('toast'),
        message: `炼妖失败: ${error.message}`,
        type: 'error'
      }]);
    }
  }, [dispatch, setToasts, summonsList.length, maxSummons, playerLevel]);

  useEffect(() => {
    console.log("[SummonSystem] Component mounted/updated");
    if (summonsList && summonsList.length > 0) {
      if (!currentSummon && summonsList[0]?.id) {
        console.log("[SummonSystem] Auto-selecting first summon:", summonsList[0]);
        dispatch(setCurrentSummon(summonsList[0].id));
      }
    } else {
      if (currentSummon) {
         dispatch(setCurrentSummon(null));
      }
      console.log("[SummonSystem] No summons available or list is empty.");
    }
  }, [summonsList, currentSummon, dispatch]);

  // New handler for when an item is selected from EquippableItemsModal
  const handleItemSelectedForEquip = (itemToEquip) => {
    if (!currentSummon || !selectedSlotForEquipping) {
      console.error("Cannot equip item: current summon or slot type is missing.");
      setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: "装备失败：缺少召唤兽或槽位信息", type: 'error' }]);
      setIsEquipmentSelectorOpen(false); // Close the selector modal
      return;
    }

    if (itemToEquip.isEquipped && itemToEquip.equippedBy && itemToEquip.equippedBy !== currentSummon.id) {
      // Item is equipped by another summon, need confirmation
      const originalSummon = summonsListObject[itemToEquip.equippedBy];
      if (originalSummon) {
        setCrossEquipDetails({
          itemToEquip: itemToEquip,
          originalSummon: originalSummon,
          targetSummon: currentSummon, // currentSummon is the one we want to equip to
          slotType: selectedSlotForEquipping
        });
        setShowCrossEquipConfirm(true);
        setIsEquipmentSelectorOpen(false); // Close item selector, open confirm modal
      } else {
        // Should not happen if data is consistent, but as a fallback, treat as unequipped
        console.warn(`Item ${itemToEquip.name} reported as equipped by ${itemToEquip.equippedBy}, but summon not found. Proceeding to equip directly.`);
        processDirectEquip(itemToEquip, currentSummon.id, selectedSlotForEquipping);
        setIsEquipmentSelectorOpen(false);
      }
    } else if (itemToEquip.equippedBy === currentSummon.id) {
      // Item already equipped by the current summon (likely in a different slot if UI allows, or same slot)
      setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: `${itemToEquip.name} 已装备于当前召唤兽。`, type: 'info' }]);
      setIsEquipmentSelectorOpen(false); // Close the selector modal
    } else {
      // Item is not equipped or equipped by current (which is handled above), proceed to equip directly
      processDirectEquip(itemToEquip, currentSummon.id, selectedSlotForEquipping);
      setIsEquipmentSelectorOpen(false); // Close the selector modal
    }
  };

  // Helper function for direct equip logic (item is available or confirmed for taking)
  const processDirectEquip = (itemToEquip, summonId, slotType) => {
    const targetSummon = summonsListObject[summonId];
    if (!targetSummon) {
      console.error(`[SummonSystem] Target summon ${summonId} not found for equipping.`);
      setToasts(prev => [...prev, { 
        id: generateUniqueId('toast'),
        message: `装备失败：未找到目标召唤兽 ${summonId}`,
        type: 'error' 
      }]);
      return;
    }

    const oldItemIdInSlot = targetSummon.equippedItemIds?.[slotType];

    if (oldItemIdInSlot && oldItemIdInSlot !== itemToEquip.id) {
      // Dispatch setItemStatus for the old item to mark it as unequipped
      dispatch(setItemStatus({
        id: oldItemIdInSlot,
        isEquipped: false,
        equippedBy: null,
        equippedBySummonName: null 
      }));
      // Note: The summon's equippedItemIds will be updated by the subsequent equipItemToSummon call.
      // We might also need to recalculate stats for the summon *after* this old item is virtually unequipped
      // and *before* the new one is equipped, if interim state matters. For now, one recalc at the end.
    }

    // Update item status for the new item
    dispatch(setItemStatus({
      id: itemToEquip.id,
      isEquipped: true,
      equippedBy: summonId,
      equippedBySummonName: targetSummon.nickname || targetSummon.name || '召唤兽'
    }));
    
    // Equip to summon (this will overwrite summon.equippedItemIds[slotType])
    dispatch(equipItemToSummon({ 
      summonId: summonId, 
      itemId: itemToEquip.id, 
      slotType: slotType 
    }));
    
    // Recalculate stats for the summon with the new item
    dispatch(recalculateSummonStats({ summonId: summonId }));
    
    setToasts(prev => [...prev, { 
      id: generateUniqueId('toast'),
      message: `${itemToEquip.name} 已成功装备到 ${slotType}`, 
      type: 'success' 
    }]);
    // Reset states
    setSelectedSlotForEquipping(null);
  };

  // Handler for confirming cross-summon equip
  const handleConfirmCrossEquip = () => {
    if (!crossEquipDetails) return;
    const { itemToEquip, originalSummon, targetSummon, slotType } = crossEquipDetails;

    // 1. Unequip from original summon
    dispatch(setItemStatus({ 
      id: itemToEquip.id, 
      isEquipped: false, // This will be set to true again for the new summon
      equippedBy: null, 
      equippedBySummonName: null 
    }));
    dispatch(unequipItemFromSummon({ 
      summonId: originalSummon.id, 
      itemId: itemToEquip.id, 
      slotType: itemToEquip.slotType || itemToEquip.category // Use item's own slotType for unequip
    }));
    dispatch(recalculateSummonStats({ summonId: originalSummon.id }));

    // 2. Equip to target summon (using the helper)
    processDirectEquip(itemToEquip, targetSummon.id, slotType);

    setToasts(prev => [...prev, { 
      id: generateUniqueId('toast'),
      message: `${itemToEquip.name} 已从 ${originalSummon.name} 卸下并装备给 ${targetSummon.name}`, 
      type: 'success' 
    }]);

    setShowCrossEquipConfirm(false);
    setCrossEquipDetails(null);
  };

  const handleUnequipItem = () => {
    if (currentSummon && selectedSlotForEquipping) {
      const summonIdToUpdate = currentSummon.id;
      const equippedItemId = currentSummon.equippedItemIds[selectedSlotForEquipping];
      
      if (equippedItemId) {
        // 清除物品的装备状态，只需要清除ID关联
        dispatch(setItemStatus({
          id: equippedItemId,
          isEquipped: false,
          equippedBy: null
        }));
        
        // 从召唤兽身上卸下装备
        dispatch(unequipItemFromSummon({ 
          summonId: summonIdToUpdate, 
          slotType: selectedSlotForEquipping 
        }));
        
        // 重新计算属性
        dispatch(recalculateSummonStats({ summonId: summonIdToUpdate }));
      }
      
      setToasts(prev => [...prev, { 
        id: generateUniqueId('toast'),
        message: `${selectedSlotForEquipping} 上的物品已卸下`, 
        type: 'success' 
      }]);
    }
    setIsEquipmentSelectorOpen(false);
    setSelectedSlotForEquipping(null);
  };

  const handleConfirmSkillChange = (skillNameToLearnOrReplace) => {
    if (currentSummon && selectedSkillSlotIndex !== null) {
      if (currentSkillForSlot) {
        dispatch(replaceSkill({ summonId: currentSummon.id, newSkillName: skillNameToLearnOrReplace, slotIndexToReplace: selectedSkillSlotIndex }));
        setToasts(prev => [...prev, { 
          id: generateUniqueId('toast'),
          message: `技能 ${currentSkillForSlot}已被替换为 ${skillNameToLearnOrReplace}`, 
          type: 'success' 
        }]);
      } else {
        dispatch(learnSkill({ summonId: currentSummon.id, skillName: skillNameToLearnOrReplace, slotIndex: selectedSkillSlotIndex }));
        setToasts(prev => [...prev, { 
          id: generateUniqueId('toast'),
          message: `已学习技能 ${skillNameToLearnOrReplace}`, 
          type: 'success' 
        }]);
      }
    }
    setIsSkillEditorOpen(false);
    setSelectedSkillSlotIndex(null);
    setCurrentSkillForSlot(null);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-grow grid grid-cols-1 md:grid-cols-6 gap-4 p-4 overflow-y-auto">
        <div className="md:col-span-1 flex flex-col gap-2">
          <button 
            onClick={handleRefineMonster} 
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-lg shadow-md transition duration-150 ease-in-out text-sm"
          >
            炼妖 (洗宠)
          </button>
          
          {currentSummon && (
            <button 
              onClick={() => setIsHistoryModalOpen(true)} 
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-3 rounded-lg shadow-md transition duration-150 ease-in-out text-sm"
            >
              培养历史
            </button>
          )}
          <button 
            onClick={() => setIsPetCatalogModalOpen(true)} 
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-3 rounded-lg shadow-md transition duration-150 ease-in-out text-sm"
          >
            召唤兽图鉴
          </button>

          <div className="bg-slate-800/70 p-2 rounded-lg shadow mt-2 flex-grow flex flex-col min-h-0">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 px-1 flex-shrink-0">
              我的召唤兽 ({summonsList.length}/{maxSummons})
            </h3>
            <div className="overflow-y-auto space-y-1 pr-1 flex-grow min-h-0">
              {summonsList.length > 0 ? (
                summonsList.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => dispatch(setCurrentSummon(pet.id))}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors duration-150 
                                ${currentSummon?.id === pet.id 
                                  ? 'bg-blue-600 text-white font-medium shadow-md' 
                                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-slate-100'}`}
                    title={pet.name}
                  >
                    {pet.nickname || pet.name}
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-400 px-1 py-2">暂无召唤兽</p>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-5 bg-slate-700/50 p-4 rounded-lg shadow-inner overflow-y-auto min-h-[450px]">
          {currentSummon ? (
            <SummonInfo
              summon={currentSummon}
              onOpenEquipmentSelectorForSlot={handleOpenEquipmentSelector}
              onLearnSkill={handleOpenSkillEditor}
              onOpenNicknameModal={() => handleOpenNicknameModal(currentSummon)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-10">
              <i className="fas fa-dragon text-4xl mb-4 text-slate-500"></i>
              <p>请先选择或召唤一只召唤兽。</p>
              <p className="text-xs mt-2">您可以从左侧列表选择，或点击"炼妖"获取新的召唤兽。</p>
            </div>
          )}
        </div>
      </div>

      {isHistoryModalOpen && currentSummon && (
        <HistoryModal 
          isOpen={isHistoryModalOpen} 
          onClose={() => setIsHistoryModalOpen(false)} 
          history={historyList[currentSummon.id] || []} 
          summonName={currentSummon.name} 
        />
      )}

      {isPetCatalogModalOpen && (
        <PetCatalog 
          isOpen={isPetCatalogModalOpen} 
          onClose={() => setIsPetCatalogModalOpen(false)} 
        />
      )}
      
      {isNicknameModalOpen && (
        <NicknameModal 
          isOpen={isNicknameModalOpen} 
          onClose={() => {
            setIsNicknameModalOpen(false);
            setSelectedPetForNickname(null);
            setTempSummonData(null);
          }}
          onConfirm={handleNicknameConfirm} 
          initialNickname={selectedPetForNickname?.nickname || ''}
          petName={selectedPetForNickname?.name || ''}
        />
      )}

      {/* Equipment Selector Modal */}
      {currentSummon && (
        <EquippableItemsModal
          isOpen={isEquipmentSelectorOpen}
          onClose={() => {
            setIsEquipmentSelectorOpen(false);
            setSelectedSlotForEquipping(null);
          }}
          slotType={selectedSlotForEquipping}
          currentSummonId={currentSummon.id}
          onItemSelected={handleItemSelectedForEquip}
        />
      )}

      {/* Cross-Summon Equip Confirmation Modal */}
      <CrossSummonEquipConfirmModal
        isOpen={showCrossEquipConfirm}
        details={crossEquipDetails}
        onConfirm={handleConfirmCrossEquip}
        onCancel={() => {
          setShowCrossEquipConfirm(false);
          setCrossEquipDetails(null);
          // Optionally, re-open item selector or reset further state if needed
          setSelectedSlotForEquipping(null); // Clear selected slot as the action was cancelled
          setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: "已取消为其他召唤兽装备物品。", type: 'info' }]);
        }}
      />
    </div>
  );
};

export default SummonSystem; 