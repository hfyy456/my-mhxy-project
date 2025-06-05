/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:06:55
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-06 06:40:59
 */
import React, { useEffect, useCallback, useState, useMemo, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import SummonInfo from "./SummonInfo";
import SummonCatalog from "./SummonCatalog";
import HistoryModal from "../../history/components/HistoryModal";
import EquippableItemsModal from "./EquippableItemsModal";
import CrossSummonEquipConfirmModal from "./CrossSummonEquipConfirmModal";
import SummonFusionModal from "./SummonFusionModal";
import EnhancedSummonFusionModal from "./EnhancedSummonFusionModal";
import FusionHistoryModal from "./FusionHistoryModal";
import { useSummonSystem } from "../hooks/useSummonSystem";
// 引入OOP召唤兽管理系统
import {
  useSummonManager,
  useCurrentSummon,
  useSummonList,
  useSummonStats,
  useSummonOperations
} from "@/hooks/useSummonManager";

import { useInventoryActions } from "../../../hooks/useInventoryManager";
import { uiText } from "@/config/ui/uiTextConfig";
import { summonConfig } from "@/config/config";
import { playerBaseConfig } from "@/config/character/playerConfig";
import NicknameModal from "./NicknameModal";
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
  const [isFusionModalOpen, setIsFusionModalOpen] = useState(false);
  const [isFusionHistoryModalOpen, setIsFusionHistoryModalOpen] = useState(false);
  const [isEnhancedFusionOpen, setIsEnhancedFusionOpen] = useState(false);

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
        // 改进物品添加逻辑 - 使用异步并行处理
        // 关键修复：过滤掉可能的null值，防止后续代码出错
        const validItems = result.newlyCreatedItems.filter(item => item !== null);
        
        const itemAddPromises = validItems.map(async (item) => {
          try {
            // 直接使用 gameLogic 返回的完整物品对象
            // 它已经包含了 sourceId 和所有必要信息
            console.log('[SummonSystem] 准备添加物品到背包:', item);
            const success = inventoryActions.addItem(item);
            
            if (success) {
              console.log('[SummonSystem] 成功添加物品:', item.name);
              return { success: true, item }; // 直接返回item
            } else {
              console.warn('[SummonSystem] 背包已满，无法添加物品:', item.name);
              return { success: false, item, reason: 'inventory_full' }; // 直接返回item
            }
          } catch (error) {
            console.error('[SummonSystem] 添加物品到背包失败:', error, item);
            return { success: false, item, reason: error.message };
          }
        });

        // 等待所有物品添加完成
        const addResults = await Promise.all(itemAddPromises);
        
        // 强制触发背包状态更新
        setTimeout(() => {
          inventoryManager.emit('inventory_changed', inventoryManager.getState());
          console.log('[SummonSystem] 炼妖完成，强制触发背包状态更新');
        }, 50);

        // 处理添加结果
        const successItems = addResults.filter(r => r.success);
        const failedItems = addResults.filter(r => !r.success);

        if (failedItems.length > 0) {
          failedItems.forEach(({ item, reason }) => {
            setToasts(prev => [...prev, {
              id: generateUniqueId('toast'),
              message: `无法添加物品：${item.name} (${reason === 'inventory_full' ? '背包已满' : reason})`,
              type: 'warning'
            }]);
        });
        }

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
          // 直接使用OOP系统创建召唤兽
          const oopResult = createSummon(result.newSummonPayload);
          if (oopResult) {
            // dispatch(addRefinementHistoryItem(result.historyItem));
            manager.setCurrentSummon(oopResult.id);
          }
        }

        setToasts(prev => [...prev, { 
          id: generateUniqueId('toast'), 
          message: `炼妖成功！${result.requireNickname ? '请为新召唤兽设置昵称。' : ''}`, 
          type: 'success'
        }]);
      }
    } catch (error) {
      console.error("[SummonSystem] 炼妖失败:", error);
      setToasts(prev => [...prev, {
        id: generateUniqueId('toast'),
        message: `炼妖失败: ${error.message || '未知错误'}`,
        type: 'error'
      }]);
    }
  }, [summonsList.length, maxSummons, playerLevel, inventoryActions, setToasts, createSummon, dispatch, manager]);

  const handleFusion = useCallback(async (newSummon, summon1Id, summon2Id) => {
    try {
      // 使用OOP系统创建合成后的召唤兽
      const oopResult = createSummon(newSummon);
      if (oopResult) {
        // 删除原有的两个召唤兽
        deleteSummon(summon1Id);
        deleteSummon(summon2Id);
        // 设置为当前召唤兽
        manager.setCurrentSummon(oopResult.id);
      }

      setIsEnhancedFusionOpen(false);
      setIsFusionModalOpen(false);
      setToasts(prev => [...prev, {
        id: generateUniqueId('toast'),
        message: `合成成功！获得了新的召唤兽「${newSummon.name}」`,
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
  }, [createSummon, deleteSummon, manager, setToasts]);

  // 当召唤兽列表变化时，设置当前召唤兽
  useEffect(() => {
    if (summonsList && summonsList.length > 0) {
      if (!currentSummon && summonsList[0]?.id) {
        manager.setCurrentSummon(summonsList[0].id);
      }
    } else {
      if (currentSummon) {
        manager.setCurrentSummon(null);
      }
    }
  }, [summonsList, currentSummon, manager]);

  const handleEquipItem = useCallback(async (itemId) => {
    try {
      const success = await equipItem(itemId, equipmentSelectorSummonId);
      
      if (success) {
        console.log(`[SummonSystem] 装备成功: ${itemId} -> ${equipmentSelectorSummonId}`);
        setIsEquipmentSelectorOpen(false);
        setEquipmentSelectorSlotType(null);
        setEquipmentSelectorSummonId(null);
      } else {
        console.error('[SummonSystem] 装备失败');
      }
    } catch (error) {
      console.error('[SummonSystem] 装备操作出错:', error);
    }
  }, [equipItem, equipmentSelectorSummonId]);

  const handleUnequipItem = useCallback(async (summonId, slotType) => {
    try {
      const success = await unequipFromSlot(summonId, slotType);
      
      if (success) {
        console.log(`[SummonSystem] 卸装成功: ${summonId}:${slotType}`);
      } else {
        console.error('[SummonSystem] 卸装失败');
      }
    } catch (error) {
      console.error('[SummonSystem] 卸装操作出错:', error);
    }
  }, [unequipFromSlot]);

  const handleConfirmCrossEquip = async () => {
    if (!crossEquipDetails) return;
    const { itemToEquip, originalSummon, targetSummon } = crossEquipDetails;

    if (typeof equipItem !== 'function') {
      console.error("[SummonSystem handleConfirmCrossEquip] FATAL: equipItem is not a function! Value:", equipItem);
      setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: "装备系统错误", type: 'error' }]);
      setShowCrossEquipConfirm(false);
      setCrossEquipDetails(null);
      return;
    }

    try {
      const result = await equipItem(itemToEquip.id, targetSummon.id);
      if (result) {
        setToasts(prev => [...prev, {
          id: generateUniqueId('toast'),
          message: `${itemToEquip.name} 已从 ${originalSummon.name} 转装给 ${targetSummon.name}`,
          type: 'success'
        }]);
      } else {
        setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: "跨召唤兽装备失败。", type: 'error' }]);
      }
    } catch (error) {
      console.error("[SummonSystem] 跨召唤兽装备失败:", error);
      setToasts(prev => [...prev, {
        id: generateUniqueId('toast'),
        message: `跨召唤兽装备失败: ${error.message || '未知错误'}`,
        type: 'error'
      }]);
    }

    setShowCrossEquipConfirm(false);
    setCrossEquipDetails(null);
  };

  const handleConfirmSkillChange = (skillNameToLearnOrReplace) => {
    if (currentSummon && selectedSkillSlotIndex !== null) {
      if (currentSkillForSlot) {
        // 先遗忘旧技能，再学习新技能
        forgetSkill(currentSummon.id, currentSkillForSlot);
        oopLearnSkill(currentSummon.id, skillNameToLearnOrReplace);
        setToasts(prev => [...prev, { 
          id: generateUniqueId('toast'),
          message: `技能 ${currentSkillForSlot}已被替换为 ${skillNameToLearnOrReplace}`, 
          type: 'success' 
        }]);
      } else {
        // 直接学习新技能
        oopLearnSkill(currentSummon.id, skillNameToLearnOrReplace);
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

  // 打开装备选择器
  const onOpenEquipmentSelectorForSlot = useCallback((summonId, slotType) => {
    console.log(`[SummonSystem] 打开装备选择器: ${summonId}:${slotType}`);
    setEquipmentSelectorSummonId(summonId);
    setEquipmentSelectorSlotType(slotType);
    setIsEquipmentSelectorOpen(true);
  }, []);

  // 关闭装备选择器
  const onCloseEquipmentSelector = useCallback(() => {
    setIsEquipmentSelectorOpen(false);
    setEquipmentSelectorSlotType(null);
    setEquipmentSelectorSummonId(null);
  }, []);

  // 获取召唤兽的装备信息
  const getSummonEquipmentInfo = useCallback((summonId) => {
    return getSummonEquipment(summonId);
  }, [getSummonEquipment]);

  // 清除装备错误
  useEffect(() => {
    if (equipmentError) {
      console.error('[SummonSystem] 装备系统错误:', equipmentError);
      // 可以在这里显示错误提示
      setTimeout(() => {
        clearEquipmentError();
      }, 5000);
    }
  }, [equipmentError, clearEquipmentError]);

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
            onClick={() => setIsEnhancedFusionOpen(true)}
            className="w-full bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-2 px-3 rounded-lg shadow-md transition duration-150 ease-in-out text-sm border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={summonsList.length < 2}
            title={summonsList.length < 2 ? "需要至少两个召唤兽才能合成" : "合成两个召唤兽"}
            style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
          >
            <i className="fas fa-mortar-pestle mr-1.5"></i>高级合成
          </button>

          <button 
            onClick={() => setIsFusionHistoryModalOpen(true)}
            className="w-full bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold py-2 px-3 rounded-lg shadow-md transition duration-150 ease-in-out text-sm border border-purple-500/30"
            style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
          >
            <i className="fas fa-history mr-1.5"></i>合成历史
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
                    onClick={() => manager.setCurrentSummon(summon.id)}
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
              onOpenEquipmentSelectorForSlot={onOpenEquipmentSelectorForSlot}
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
          onClose={onCloseEquipmentSelector}
          slotType={equipmentSelectorSlotType}
          currentSummonId={equipmentSelectorSummonId}
          onItemSelected={handleEquipItem}
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
          onCloseEquipmentSelector();
          setToasts(prev => [...prev, { id: generateUniqueId('toast'), message: "已取消为其他召唤兽装备物品。", type: 'info' }]);
        }}
      />
      
      {/* 增强版召唤兽合成模态框 */}
      <EnhancedSummonFusionModal
        isOpen={isEnhancedFusionOpen}
        onClose={() => setIsEnhancedFusionOpen(false)}
        onFusion={handleFusion}
      />

      {/* 合成历史模态框 */}
      <FusionHistoryModal
        isOpen={isFusionHistoryModalOpen}
        onClose={() => setIsFusionHistoryModalOpen(false)}
      />
      
      {/* 原有的召唤兽合成模态框（保留兼容性） */}
      <SummonFusionModal
        isOpen={isFusionModalOpen}
        onClose={() => setIsFusionModalOpen(false)}
        onFusion={handleFusion}
      />
    </div>
  );
};

export default SummonSystem; 