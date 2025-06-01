/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:06:55
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-01 04:41:39
 */
import React, { useEffect, useCallback, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import SummonInfo from "./SummonInfo";
import SummonCatalog from "./SummonCatalog";
import SummonList from "./SummonList";
import HistoryModal from "../../history/components/HistoryModal";
import EquippableItemsModal from "./EquippableItemsModal";
import CrossSummonEquipConfirmModal from "./CrossSummonEquipConfirmModal";
import SummonFusionModal from "./SummonFusionModal";
import { useSummonSystem } from "../hooks/useSummonSystem";
import { 
  setCurrentSummon,
  addSummon,
  learnSkill,
  replaceSkill,
  addRefinementHistoryItem,
  selectCurrentSummonFullData,
  selectAllSummons,
  updateSummonNickname,
  fuseSummons
} from "../../../store/slices/summonSlice";
import { addItems, selectAllItemsArray, selectItemEquipInfo } from "../../../store/slices/itemSlice";
import { addToInventory } from "../../../store/slices/inventorySlice";
import { uiText } from "@/config/ui/uiTextConfig";
import { summonConfig } from "@/config/config";
import { playerBaseConfig } from "@/config/character/playerConfig";
import NicknameModal from "./NicknameModal";
import { generateUniqueId } from "@/utils/idUtils";
import { manageEquipItemThunk, manageUnequipItemThunk } from "../../../store/thunks/equipmentThunks";
import store from "@/store"; // Import the store instance

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
    isSummonCatalogModalOpen,
    setIsSummonCatalogModalOpen,
  } = useSummonSystem(toasts, setToasts);

  const [isEquipmentSelectorOpen, setIsEquipmentSelectorOpen] = useState(false);
  const [selectedSlotForEquipping, setSelectedSlotForEquipping] = useState(null);
  const [isSkillEditorOpen, setIsSkillEditorOpen] = useState(false);
  const [selectedSkillSlotIndex, setSelectedSkillSlotIndex] = useState(null);
  const [currentSkillForSlot, setCurrentSkillForSlot] = useState(null);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [selectedSummonForNickname, setSelectedSummonForNickname] = useState(null);
  const [tempSummonData, setTempSummonData] = useState(null);

  const [showCrossEquipConfirm, setShowCrossEquipConfirm] = useState(false);
  const [crossEquipDetails, setCrossEquipDetails] = useState(null);
  const [isFusionModalOpen, setIsFusionModalOpen] = useState(false);

  const handleOpenEquipmentSelector = useCallback((slotType) => {
    if (!currentSummon) {
      setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: uiText.notifications.selectSummonFirst || "请先选择一个召唤兽", type: 'warning' }]);
      return;
    }
    setSelectedSlotForEquipping(slotType);
    setIsEquipmentSelectorOpen(true);
  }, [currentSummon, setToasts]);

  const handleOpenSkillEditor = useCallback((skillIndex, existingSkillName) => {
    if (!currentSummon) {
      setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: uiText.notifications.selectSummonFirst || "请先选择一个召唤兽", type: 'warning' }]);
      return;
    }
    setSelectedSkillSlotIndex(skillIndex);
    setCurrentSkillForSlot(existingSkillName);
    setIsSkillEditorOpen(true);
  }, [currentSummon, setToasts]);

  const handleOpenNicknameModal = useCallback((summon) => {
    setSelectedSummonForNickname(summon);
    setIsNicknameModalOpen(true);
  }, []);

  const handleNicknameConfirm = useCallback((nickname) => {
    if (selectedSummonForNickname) {
      if (tempSummonData) {
        const updatedSummonPayload = {
          ...tempSummonData.summonPayload,
          nickname
        };
        dispatch(addSummon(updatedSummonPayload));
        dispatch(setCurrentSummon(updatedSummonPayload.id));
        dispatch(addRefinementHistoryItem(tempSummonData.historyItem));
        setTempSummonData(null);
      } else {
        dispatch(updateSummonNickname({ 
          id: selectedSummonForNickname.id, 
          nickname 
        }));
      }
      setToasts(prev => [...prev, {
        id: generateUniqueId('toast'),
        type: "success",
        message: `成功为${selectedSummonForNickname.name}设置昵称：${nickname}`,
      }]);
    }
    setSelectedSummonForNickname(null);
    setIsNicknameModalOpen(false);
  }, [selectedSummonForNickname, tempSummonData, dispatch, setToasts]);

  const handleRefineMonster = useCallback(async () => {
    const { refineMonster } = await import('../../../gameLogic');
    try {
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
        dispatch(addItems(result.newlyCreatedItems));
        result.newlyCreatedItems.forEach(item => {
          dispatch(addToInventory({ itemId: item.id }));
        });
        if (result.requireNickname) {
          setSelectedSummonForNickname({
            ...result.newSummonPayload,
            name: summonConfig[result.newSummonPayload.summonSourceId]?.name || result.newSummonPayload.name
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
  
  const handleFusion = useCallback((newSummon, summonId1, summonId2) => {
    try {
      // 执行召唤兽合成
      dispatch(fuseSummons({
        newSummon,
        summonId1,
        summonId2
      }));
      
      // 设置当前选中的召唤兽为新合成的召唤兽
      dispatch(setCurrentSummon(newSummon.id));
      
      // 显示成功提示
      setToasts(prev => [...prev, {
        id: generateUniqueId('toast'),
        message: `合成成功！获得了新的召唤兽「${summonConfig[newSummon.summonSourceId]?.name || '未知召唤兽'}」`,
        type: 'success'
      }]);
    } catch (error) {
      console.error("[SummonSystem] 合成失败:", error);
      setToasts(prev => [...prev, {
        id: generateUniqueId('toast'),
        message: `合成失败: ${error.message || '未知错误'}`,
        type: 'error'
      }]);
    }
  }, [dispatch, setToasts]);

  useEffect(() => {
    if (summonsList && summonsList.length > 0) {
      if (!currentSummon && summonsList[0]?.id) {
        dispatch(setCurrentSummon(summonsList[0].id));
      }
    } else {
      if (currentSummon) {
         dispatch(setCurrentSummon(null));
      }
    }
  }, [summonsList, currentSummon, dispatch]);

  const handleItemSelectedForEquip = useCallback(async (itemToEquip) => {
    if (!currentSummon || !selectedSlotForEquipping) {
      console.error("Cannot equip item: current summon or slot type is missing.");
      setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: "装备失败：缺少召唤兽或槽位信息", type: 'error' }]);
      setIsEquipmentSelectorOpen(false);
      return;
    }

    const itemId = itemToEquip.id;
    const currentState = store.getState(); // Get current state from the store
    const equipInfo = selectItemEquipInfo(currentState, itemId); // Use current state

    // Use fresh equipInfo for decisions
    if (equipInfo.isEquipped && equipInfo.equippedBySummonId && equipInfo.equippedBySummonId !== currentSummon.id) {
      const originalSummon = summonsListObject[equipInfo.equippedBySummonId]; // Use ID from fresh equipInfo
      if (originalSummon) {
        setCrossEquipDetails({
          itemToEquip: itemToEquip, // itemToEquip is still the object we intend to move
          originalSummon: originalSummon,
          targetSummon: currentSummon,
          slotType: selectedSlotForEquipping
        });
        setShowCrossEquipConfirm(true);
      } else {
        // Original summon not found, but item is marked as equipped by someone else. 
        // This indicates a potential data inconsistency. For safety, attempt direct equip to current.
        console.warn(`Item ${itemToEquip.name} (ID: ${itemId}) equipInfo indicates it is equipped by summon ${equipInfo.equippedBySummonId}, but that summon was not found. Attempting to equip directly to ${currentSummon.id}.`);
        await dispatch(manageEquipItemThunk({ summonId: currentSummon.id, itemIdToEquip: itemId, slotType: selectedSlotForEquipping }));
        setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: `${itemToEquip.name} 已装备。`, type: 'success' }]);
      }
    } else if (equipInfo.isEquipped && equipInfo.equippedBySummonId === currentSummon.id) {
      // Item is already equipped to the current summon. 
      // Check if it's in the same slot; if so, it's a no-op. If different, it's a move (currently not handled, treated as no-op).
      if (equipInfo.equippedOnSlot === selectedSlotForEquipping) {
        setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: `${itemToEquip.name} 已装备于当前召唤兽的此槽位。`, type: 'info' }]);
      } else {
        // Potentially a move from another slot on the same summon. For now, inform user.
        // A more advanced system might handle this as a slot-to-slot move.
        setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: `${itemToEquip.name} 已装备于当前召唤兽的其他槽位。如需更换槽位，请先卸下。`, type: 'info' }]);
      }
    } else { // Item is not equipped, or some inconsistent state not caught above.
      await dispatch(manageEquipItemThunk({ summonId: currentSummon.id, itemIdToEquip: itemId, slotType: selectedSlotForEquipping }));
      setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: `${itemToEquip.name} 已成功装备到 ${selectedSlotForEquipping}`, type: 'success' }]);
    }
    setIsEquipmentSelectorOpen(false);
    setSelectedSlotForEquipping(null);
  }, [currentSummon, selectedSlotForEquipping, dispatch, setToasts, summonsListObject]);

  const handleConfirmCrossEquip = async () => {
    if (!crossEquipDetails) return;
    const { itemToEquip, originalSummon, targetSummon, slotType } = crossEquipDetails;

    try {
      await dispatch(manageUnequipItemThunk({ summonId: originalSummon.id, slotType: itemToEquip.slotType }));
      await dispatch(manageEquipItemThunk({ summonId: targetSummon.id, itemIdToEquip: itemToEquip.id, slotType: slotType }));

      setToasts(prev => [...prev, {
        id: generateUniqueId('toast'),
        message: `${itemToEquip.name} 已从 ${originalSummon.name} 卸下并装备给 ${targetSummon.name}`,
        type: 'success'
      }]);
    } catch (error) {
      setToasts(prev => [...prev, {
        id: generateUniqueId('toast'),
        message: `跨召唤兽装备失败: ${error.message || '未知错误'}`,
        type: 'error'
      }]);
    }

    setShowCrossEquipConfirm(false);
    setCrossEquipDetails(null);
  };

  const handleUnequipItem = async () => {
    if (currentSummon && selectedSlotForEquipping) {
      const summonIdToUpdate = currentSummon.id;

      try {
        const result = await dispatch(manageUnequipItemThunk({ summonId: summonIdToUpdate, slotType: selectedSlotForEquipping })).unwrap();
        setToasts(prev => [...prev, {
          id: generateUniqueId('toast'),
          message: `${result.unequippedItem ? allItems.find(i=>i.id === result.unequippedItem)?.name : selectedSlotForEquipping} 上的物品已卸下`,
          type: 'success'
        }]);
      } catch (error) {
         setToasts(prev => [...prev, {
          id: generateUniqueId('toast'),
          message: `卸下物品失败: ${error.payload || error.message || '未知错误'}`,
          type: 'error'
        }]);
      }
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
    <div className="w-full h-full flex flex-col summon-system-compact relative">
      {/* 装饰性角落元素 */}
      <div className="decorative-corner top-left"></div>
      <div className="decorative-corner top-right"></div>
      <div className="decorative-corner bottom-left"></div>
      <div className="decorative-corner bottom-right"></div>
      <div className="flex-grow grid grid-cols-1 md:grid-cols-6 gap-3 p-3 overflow-y-auto hidden-scrollbar">
        <div className="md:col-span-1 flex flex-col gap-1.5">
          <button 
            onClick={handleRefineMonster} 
            className="w-full bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-2 px-3 rounded-lg shadow-md transition duration-150 ease-in-out text-sm border border-amber-500/30"
            style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
          >
            <i className="fas fa-magic mr-1.5"></i>炼妖 (洗宠)
          </button>
          
          <button 
            onClick={() => setIsFusionModalOpen(true)}
            className="w-full bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-2 px-3 rounded-lg shadow-md transition duration-150 ease-in-out text-sm border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={summonsList.length < 2}
            title={summonsList.length < 2 ? "需要至少两个召唤兽才能合成" : "合成两个召唤兽"}
            style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
          >
            <i className="fas fa-mortar-pestle mr-1.5"></i>合成
          </button>
          
          {currentSummon && (
            <button 
              onClick={() => setIsHistoryModalOpen(true)} 
              className="w-full bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-2 px-3 rounded-lg shadow-md transition duration-150 ease-in-out text-sm border border-amber-500/30"
              style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
            >
              <i className="fas fa-history mr-1.5"></i>培养历史
            </button>
          )}
          <button 
            onClick={() => setIsSummonCatalogModalOpen(true)} 
            className="w-full bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-2 px-3 rounded-lg shadow-md transition duration-150 ease-in-out text-sm border border-amber-500/30"
            style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
          >
            <i className="fas fa-book mr-1.5"></i>召唤兽图鉴
          </button>

          <div className="bg-gradient-to-b from-slate-800/90 to-slate-700/90 p-1.5 rounded-lg shadow-md mt-2 flex-grow flex flex-col min-h-0 border border-amber-700/30">
            <h3 className="text-sm font-semibold text-amber-300 mb-1.5 px-1 flex-shrink-0 border-b border-amber-700/30 pb-1 flex items-center" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
              <i className="fas fa-dragon text-amber-400 mr-1.5 text-xs"></i>
              召唤兽 <span className="ml-1 text-amber-200">({summonsList.length}/{maxSummons})</span>
            </h3>
            <div className="overflow-y-auto space-y-1 pr-1 flex-grow min-h-0 hidden-scrollbar">
              {summonsList.length > 0 ? (
                summonsList.map(summon => (
                  <button
                    key={summon.id}
                    onClick={() => dispatch(setCurrentSummon(summon.id))}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-all duration-150 flex items-center 
                                ${currentSummon?.id === summon.id 
                                  ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white font-medium shadow-md border border-amber-500/50' 
                                  : 'bg-slate-700/80 hover:bg-slate-600/90 text-slate-300 hover:text-amber-200 border border-slate-600/50 hover:border-amber-700/30'}`}
                    title={summon.name}
                  >
                    <i className="fas fa-paw text-amber-400/80 mr-1.5 text-[10px]"></i>
                    <span className="truncate">{summon.nickname || summon.name}</span>
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-400 px-1 py-2">暂无召唤兽</p>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-5 bg-gradient-to-b from-slate-800/90 to-slate-700/90 p-3 rounded-lg shadow-inner overflow-y-auto min-h-[450px] hidden-scrollbar border border-amber-700/30" style={{ boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.3)' }}>
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

      {isSummonCatalogModalOpen && (
        <SummonCatalog 
          isOpen={isSummonCatalogModalOpen} 
          onClose={() => setIsSummonCatalogModalOpen(false)} 
        />
      )}
      
      {isNicknameModalOpen && (
        <NicknameModal 
          isOpen={isNicknameModalOpen} 
          onClose={() => {
            setIsNicknameModalOpen(false);
            setSelectedSummonForNickname(null);
            setTempSummonData(null);
          }}
          onConfirm={handleNicknameConfirm} 
          initialNickname={selectedSummonForNickname?.nickname || ''}
          summonName={selectedSummonForNickname?.name || ''}
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
          setSelectedSlotForEquipping(null); 
          setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: "已取消为其他召唤兽装备物品。", type: 'info' }]);
        }}
      />
      
      {/* 召唤兽合成模态框 */}
      <SummonFusionModal
        isOpen={isFusionModalOpen}
        onClose={() => setIsFusionModalOpen(false)}
        onFusion={handleFusion}
      />
    </div>
  );
};

export default SummonSystem; 