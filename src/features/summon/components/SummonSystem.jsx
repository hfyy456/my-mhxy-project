/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:06:55
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-20 05:39:01
 */
import React, { useEffect, useCallback, useState, useMemo, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import SummonInfo from "./SummonInfo";
import SummonCatalog from "./SummonCatalog";
import HistoryModal from "../../history/components/HistoryModal";
import EquippableItemsModal from "./EquippableItemsModal";
import CrossSummonEquipConfirmModal from "./CrossSummonEquipConfirmModal";
import NicknameModal from "./NicknameModal";
import { useSummonSystem } from "../hooks/useSummonSystem";
// 引入OOP召唤兽管理系统
import {
  useSummonManager
} from "@/hooks/useSummonManager";

import { useInventoryActions } from "../../../hooks/useInventoryManager";
import { uiText } from "@/config/ui/uiTextConfig";
import { summonConfig } from "@/config/config";
import { playerBaseConfig } from "@/config/character/playerConfig";
import { generateUniqueId } from "@/utils/idUtils";
import inventoryManager from "@/store/InventoryManager";
import { generateNewSummon } from "@/utils/summonUtils";
import { SUMMON_SOURCES } from "@/config/enumConfig";
import { useEquipmentRelationship } from '../../../hooks/useEquipmentRelationship';

const SummonSystem = ({ toasts, setToasts }) => {
  const dispatch = useDispatch();
  // 使用Redux系统获取玩家等级
  const playerLevel = useSelector(state => state.player?.level || 1);
  const maxSummons = playerBaseConfig.getMaxSummonsByLevel(playerLevel);

  // 使用OOP召唤兽管理系统替代Redux
  const {
    allSummons,
    currentSummonId,
    currentSummonFullData,
    isLoading,
    error,
    levelUpSummon,
    allocatePoints,
    resetPoints,
    learnSkill: oopLearnSkill,
    forgetSkill,
    changeSummonNickname,
    createSummon,
    deleteSummon,
    cloneSummon,
    clearError,
    registerSummon,
    manager,
  } = useSummonManager();

  // 使用装备关系管理器
  const {
    equipItem,
    unequipItem,
    unequipFromSlot,
    getSummonEquipment,
    isItemEquipped,
    error: equipmentError,
    clearError: clearEquipmentError
  } = useEquipmentRelationship();

  // 获取当前召唤兽和召唤兽列表（使用OOP系统的数据）
  const currentSummon = currentSummonFullData;
  const summonsList = useMemo(() => Object.values(allSummons || {}), [allSummons]);
  
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

  const inventoryActions = useInventoryActions();

  const [equipmentSelectorSlotType, setEquipmentSelectorSlotType] = useState(null);
  const [equipmentSelectorSummonId, setEquipmentSelectorSummonId] = useState(null);

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
        // 使用OOP系统创建召唤兽
        const result = createSummon({
          ...tempSummonData.summonPayload,
          nickname
        });
        if (result) {
          // 同步到Redux历史记录
       //   dispatch(addRefinementHistoryItem(tempSummonData.historyItem));
          // 设置为当前召唤兽
          manager.setCurrentSummon(result.id);
        }
        setTempSummonData(null);
      } else {
        // 使用OOP系统更新昵称
        changeSummonNickname(selectedSummonForNickname.id, nickname);
      }
      setToasts(prev => [...prev, {
        id: generateUniqueId('toast'),
        type: "success",
        message: `成功为${selectedSummonForNickname.name}设置昵称：${nickname}`,
      }]);
    }
    setSelectedSummonForNickname(null);
    setIsNicknameModalOpen(false);
  }, [selectedSummonForNickname, tempSummonData, createSummon, changeSummonNickname, manager, dispatch, setToasts]);

  const handleConfirmCrossEquip = async () => {
    if (!crossEquipDetails) return;

    const {
      sourceSummonId,
      targetSummonId,
      item,
      sourceSlot,
      targetSlot
    } = crossEquipDetails;

    try {
      // 1. 从源召唤兽卸下物品
      if (sourceSummonId && sourceSlot) {
        await unequipFromSlot(sourceSummonId, sourceSlot);
      }
      
      // 2. 将物品装备到目标召唤兽
      await equipItem(targetSummonId, item.id, targetSlot);

      setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: '装备更换成功！', type: 'success' }]);
    } catch (err) {
      setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: `操作失败: ${err.message}`, type: 'error' }]);
    } finally {
      setShowCrossEquipConfirm(false);
      setCrossEquipDetails(null);
    }
  };


  const handleConfirmSkillChange = (skillNameToLearnOrReplace) => {
    if (currentSummon && selectedSkillSlotIndex !== null) {
      const result = oopLearnSkill(currentSummon.id, skillNameToLearnOrReplace, selectedSkillSlotIndex);
      if (result.success) {
        setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: result.message, type: 'success' }]);
      } else {
        setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: result.message, type: 'error' }]);
      }
    }
    setIsSkillEditorOpen(false);
    setSelectedSkillSlotIndex(null);
    setCurrentSkillForSlot(null);
  };

  const handleEquipItem = async (item) => {
    if (!currentSummon) {
      setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: '请先选择一个召唤兽', type: 'error' }]);
      return;
    }

    try {
      const result = await equipItem(item.id, currentSummon.id);
      
      if (result.success) {
        setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: '装备成功', type: 'success' }]);
        setIsEquipmentSelectorOpen(false);
      } else if (result.requiresCrossEquipConfirmation) {
        setCrossEquipDetails(result.details);
        setShowCrossEquipConfirm(true);
        setIsEquipmentSelectorOpen(false);
      } else {
        throw new Error(result.message || '未知错误');
      }
    } catch (err) {
      setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: `装备失败: ${err.message}`, type: 'error' }]);
      // 不关闭选择器，让用户可以重新选择
    }
  };


  const handleUnequipItem = (slotType) => {
    if (!currentSummon) {
      setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: '请先选择一个召唤兽', type: 'error' }]);
      return;
    }
    unequipFromSlot(currentSummon.id, slotType);
    setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: '卸下装备成功', type: 'success' }]);
  };


  if (isLoading) {
    return <div>Loading summon data...</div>;
  }

  if (error) {
    return <div>Error: {error} <button onClick={clearError}>Clear</button></div>;
  }


  return (
    <div className="flex h-full bg-gray-800 text-white">
      <div className="w-1/4 p-4 overflow-y-auto bg-gray-900">
        <h2 className="text-xl font-bold mb-4">{uiText.summonSystem.mySummons} ({summonsList.length}/{maxSummons})</h2>
        <div className="space-y-2">
          {/* Summon List Items */}
          {summonsList.length > 0 ? (
            summonsList.map(summon => (
              <div
                key={summon.id}
                onClick={() => manager.setCurrentSummon(summon.id)}
                className={`p-2 rounded cursor-pointer ${currentSummonId === summon.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                {summon.nickname || summonConfig[summon.summonSourceId]?.name || '未知召唤兽'} - Lv: {summon.level}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-4">
              <p>暂无召唤兽</p>
            </div>
          )}
        </div>
        <div className="mt-4 space-y-2">
          <button
            onClick={() => setIsSummonCatalogModalOpen(true)}
            className="w-full bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
          >
            召唤兽图鉴
          </button>
        </div>
      </div>

      <div className="w-3/4 p-4 flex flex-col">
        {summonsList.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-14l-3 3m5 0l-3-3m3 3l3 3m-5-5l-3 3M12 21a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">你还没有召唤兽伙伴</h3>
            <p className="max-w-md">
              快去广阔的世界中探索，或通过家园的"召唤兽之家"进行炼妖，获得你强大的新伙伴吧！
            </p>
          </div>
        ) : currentSummon ? (
          <Suspense fallback={<div>Loading...</div>}>
            <SummonInfo
              summon={currentSummon}
              onLevelUp={levelUpSummon}
              onAllocatePoints={allocatePoints}
              onResetPoints={resetPoints}
              onLearnSkill={handleOpenSkillEditor}
              onForgetSkill={forgetSkill}
              onOpenEquipmentSelectorForSlot={handleOpenEquipmentSelector}
              onUnequip={handleUnequipItem}
              onNickname={handleOpenNicknameModal}
              onDelete={deleteSummon}
              onClone={cloneSummon}
              isItemEquipped={isItemEquipped}
            />
          </Suspense>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <p>{uiText.summonSystem.selectSummonPrompt}</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {isSummonCatalogModalOpen && (
        <SummonCatalog
          onClose={() => setIsSummonCatalogModalOpen(false)}
          allSummons={Object.values(summonConfig)}
          ownedSummonIds={summonsList.map(s => s.summonSourceId)}
          onSummonSelected={(summonId) => console.log('Summon selected:', summonId)}
        />
      )}

      {isEquipmentSelectorOpen && (
        <EquippableItemsModal
          isOpen={isEquipmentSelectorOpen}
          onClose={() => setIsEquipmentSelectorOpen(false)}
          onItemSelected={handleEquipItem}
          slotType={selectedSlotForEquipping}
          currentSummonId={currentSummon.id}
        />
      )}

      {showCrossEquipConfirm && (
        <CrossSummonEquipConfirmModal
          isOpen={showCrossEquipConfirm}
          onClose={() => setShowCrossEquipConfirm(false)}
          onConfirm={handleConfirmCrossEquip}
          details={crossEquipDetails}
        />
      )}

      {isNicknameModalOpen && (
        <NicknameModal
          isOpen={isNicknameModalOpen}
          onClose={() => setIsNicknameModalOpen(false)}
          onConfirm={handleNicknameConfirm}
          initialNickname={selectedSummonForNickname?.nickname || ''}
          summonName={selectedSummonForNickname?.name}
        />
      )}

    </div>
  );
};

export default SummonSystem; 