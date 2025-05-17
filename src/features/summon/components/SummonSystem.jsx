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
  recalculateSummonStats
} from "../../../store/slices/summonSlice";
import { addItems, selectAllItemsArray } from "../../../store/slices/itemSlice";
import { uiText } from "@/config/uiTextConfig";

const SummonSystem = ({ onBackToMain, toasts, setToasts }) => {
  const dispatch = useDispatch();
  const currentSummon = useSelector(selectCurrentSummonFullData);
  const summonsListObject = useSelector(selectAllSummons);
  const allItems = useSelector(selectAllItemsArray);
  
  const summonsList = useMemo(() => Object.values(summonsListObject || {}), [summonsListObject]);
  
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
  const [isSummonListOpen, setIsSummonListOpen] = useState(false);

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

  const handleRefineMonster = useCallback(async () => {
    const { refineMonster } = await import('../../../gameLogic');
    
    try {
      const result = refineMonster();
      
      if (result.newSummonPayload && result.newlyCreatedItems && result.historyItem) {
        dispatch(addItems(result.newlyCreatedItems));
        dispatch(addSummon(result.newSummonPayload));
        dispatch(setCurrentSummon(result.newSummonPayload.id));
        dispatch(addRefinementHistoryItem(result.historyItem));

      setToasts(prev => [...prev, {
        id: Date.now(),
          message: result.message || "炼妖成功！获得了新的召唤兽和初始装备！",
        type: 'success'
      }]);
      } else {
        throw new Error(result.message || "炼妖失败，未能返回完整的召唤兽、物品或历史数据");
      }
    } catch (error) {
      console.error("[SummonSystem] 炼妖失败:", error);
      setToasts(prev => [...prev, {
        id: Date.now(),
        message: `炼妖失败: ${error.message}`,
        type: 'error'
      }]);
    }
  }, [dispatch, setToasts]);

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
    return () => {
      console.log("[SummonSystem] Component will unmount");
    };
  }, [summonsList, currentSummon, dispatch]);

  const handleConfirmEquipItem = (itemId) => {
    if (currentSummon && selectedSlotForEquipping && itemId) {
      const summonIdToUpdate = currentSummon.id;
      dispatch(equipItemToSummon({ summonId: summonIdToUpdate, itemId, slotType: selectedSlotForEquipping }));
      if (summonIdToUpdate) {
        dispatch(recalculateSummonStats({ summonId: summonIdToUpdate }));
      }
      setToasts(prev => [...prev, { id: Date.now(), message: `物品已装备到 ${selectedSlotForEquipping}`, type: 'success' }]);
    }
    setIsEquipmentSelectorOpen(false);
    setSelectedSlotForEquipping(null);
  };

  const handleUnequipItem = () => {
    if (currentSummon && selectedSlotForEquipping) {
      const summonIdToUpdate = currentSummon.id;
      dispatch(unequipItemFromSummon({ summonId: summonIdToUpdate, slotType: selectedSlotForEquipping }));
      if (summonIdToUpdate) {
        dispatch(recalculateSummonStats({ summonId: summonIdToUpdate }));
      }
      setToasts(prev => [...prev, { id: Date.now(), message: `${selectedSlotForEquipping} 上的物品已卸下`, type: 'success' }]);
    }
    setIsEquipmentSelectorOpen(false);
    setSelectedSlotForEquipping(null);
  };

  const handleConfirmSkillChange = (skillNameToLearnOrReplace) => {
    if (currentSummon && selectedSkillSlotIndex !== null) {
      if (currentSkillForSlot) {
        dispatch(replaceSkill({ summonId: currentSummon.id, newSkillName: skillNameToLearnOrReplace, slotIndexToReplace: selectedSkillSlotIndex }));
        setToasts(prev => [...prev, { id: Date.now(), message: `技能 ${currentSkillForSlot}已被替换为 ${skillNameToLearnOrReplace}`, type: 'success' }]);
      } else {
        dispatch(learnSkill({ summonId: currentSummon.id, skillName: skillNameToLearnOrReplace, slotIndex: selectedSkillSlotIndex }));
        setToasts(prev => [...prev, { id: Date.now(), message: `已学习技能 ${skillNameToLearnOrReplace}`, type: 'success' }]);
      }
    }
    setIsSkillEditorOpen(false);
    setSelectedSkillSlotIndex(null);
    setCurrentSkillForSlot(null);
  };

  return (
    <div className="game-viewport bg-slate-900 min-h-screen">
      <main className="game-panel rounded-xl shadow-2xl shadow-purple-500/20 relative">
        <div className="bg-gradient-to-br from-slate-800 via-purple-900/50 to-slate-800 rounded-xl p-3 shadow-lg flex-grow flex flex-col">
          <div className="flex-grow overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={onBackToMain}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-lg text-sm transition-colors duration-200 flex items-center"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                返回主菜单
              </button>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsSummonListOpen(true)} 
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg text-sm transition-all duration-300 flex items-center shadow-lg hover:shadow-blue-500/30 border border-blue-400/30"
                >
                  <i className="fa-solid fa-list mr-2 text-blue-200"></i>
                  <span>选择召唤兽</span>
                </button>
                <button 
                  onClick={() => setIsPetCatalogModalOpen(true)} 
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg text-sm transition-all duration-300 flex items-center shadow-lg hover:shadow-purple-500/30 border border-purple-400/30"
                >
                  <i className="fa-solid fa-paw mr-2 text-purple-200"></i>
                  <span>{uiText.buttons.petCatalog || "召唤兽图鉴"}</span>
                </button>
                <button 
                  onClick={() => setIsHistoryModalOpen(true)} 
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-sm transition-all duration-300 flex items-center shadow-lg hover:shadow-amber-500/30 border border-amber-400/30"
                >
                  <i className="fa-solid fa-scroll mr-2 text-amber-200"></i>
                  <span>{uiText.buttons.refineHistory || "炼妖历史"}</span>
                </button>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
              <i className="fa-solid fa-dragon text-amber-400 mr-2" />
              <span>召唤兽系统</span>
            </h2>

            {!currentSummon ? (
              <div className="text-center text-white p-10">
                <p>{uiText.notifications.noSummonData || "当前没有召唤兽数据，请先创建或选择一个召唤兽"}</p>
                <button 
                  onClick={handleRefineMonster}
                  className="mt-4 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors"
                >
                  <i className="fa-solid fa-flask mr-2"></i> {uiText.buttons.refineToGetSummon || "炼妖获取召唤兽"}
                </button>
              </div>
            ) : (
            <SummonInfo
                onOpenEquipmentSelectorForSlot={handleOpenEquipmentSelector}
                onOpenSkillEditorForSlot={handleOpenSkillEditor}
            />
            )}
            
            <div className="flex justify-center mt-4 mb-4 gap-4">
              <button
                id="refineBtn"
                className="px-6 py-3 bg-slate-700 hover:bg-amber-600 text-gray-100 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500/50 flex items-center border-2 border-slate-600 hover:border-amber-500"
                onClick={handleRefineMonster}
              >
                <i className="fa-solid fa-flask mr-2"></i> {uiText.buttons.refine || "炼妖"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {isHistoryModalOpen && (
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
          history={historyList}
      />
      )}
      {isPetCatalogModalOpen && (
      <PetCatalog
        isOpen={isPetCatalogModalOpen}
        onClose={() => setIsPetCatalogModalOpen(false)}
      />
      )}
      {isSummonListOpen && (
        <SummonList
          isOpen={isSummonListOpen}
          onClose={() => setIsSummonListOpen(false)}
        />
      )}
    </div>
  );
};

export default SummonSystem; 