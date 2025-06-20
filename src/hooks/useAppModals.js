import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// 引入OOP召唤兽管理系统
import { useSummonManager } from "@/hooks/useSummonManager";
import { checkAndResetDailyData } from "@/store/slices/towerSlice";

export const useAppModals = () => {
  const dispatch = useDispatch();
  // 使用OOP召唤兽管理系统
  const { allSummons, currentSummonFullData, manager } = useSummonManager();
  const summons = Object.values(allSummons || {}); // 将OOP系统的召唤兽转换为数组
  const currentSummon = currentSummonFullData;

  const [isSummonModalOpen, setIsSummonModalOpen] = useState(false);
  const [isInventoryOOPOpen, setIsInventoryOOPOpen] = useState(false);
  const [isIncubatorOpen, setIsIncubatorOpen] = useState(false);
  const [isPlayerInfoOpen, setIsPlayerInfoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuestLogModalOpen, setQuestLogModalOpen] = useState(false);
  const [isMinimapModalOpen, setMinimapModalOpen] = useState(false);
  const [isNpcPanelOpen, setIsNpcPanelOpen] = useState(false);
  const [selectedNpcId, setSelectedNpcId] = useState(null);
  const [isFormationModalOpen, setIsFormationModalOpen] = useState(false);
  const [isTowerModalOpen, setIsTowerModalOpen] = useState(false);
  const [isHomesteadModalOpen, setIsHomesteadModalOpen] = useState(false);
  const [isSummonEquipmentOpen, setIsSummonEquipmentOpen] = useState(false);
  const [isSummonOOPDemoOpen, setIsSummonOOPDemoOpen] = useState(false);
  const [isFusionModalOpen, setIsFusionModalOpen] = useState(false);
  const [isSummonHomePanelOpen, setIsSummonHomePanelOpen] = useState(false);

  const openSummonModal = useCallback(() => {
    if (summons.length > 0) {
      if (!currentSummon) {
        // 使用OOP系统设置当前召唤兽
        manager.setCurrentSummon(summons[0].id);
      }
    } else {
      if (currentSummon) {
        manager.setCurrentSummon(null);
      }
    }
    setIsSummonModalOpen(true);
  }, [manager, summons, currentSummon]);

  const closeSummonModal = useCallback(() => setIsSummonModalOpen(false), []);
  
  const openInventoryOOPModal = useCallback(() => setIsInventoryOOPOpen(true), []);
  const closeInventoryOOPModal = useCallback(() => setIsInventoryOOPOpen(false), []);

  const openIncubatorModal = useCallback(() => setIsIncubatorOpen(true), []);
  const closeIncubatorModal = useCallback(() => setIsIncubatorOpen(false), []);

  const openPlayerInfoModal = useCallback(() => setIsPlayerInfoOpen(true), []);
  const closePlayerInfoModal = useCallback(() => setIsPlayerInfoOpen(false), []);

  const openSettingsModal = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettingsModal = useCallback(() => setIsSettingsOpen(false), []);

  const openQuestLogModal = useCallback(() => setQuestLogModalOpen(true), []);
  const closeQuestLogModal = useCallback(() => setQuestLogModalOpen(false), []);

  const openMinimapModal = useCallback(() => setMinimapModalOpen(true), []);
  const closeMinimapModal = useCallback(() => setMinimapModalOpen(false), []);

  const openNpcPanelModal = useCallback((npcId) => {
    setSelectedNpcId(npcId);
    setIsNpcPanelOpen(true);
  }, []);
  const closeNpcPanelModal = useCallback(() => {
    setIsNpcPanelOpen(false);
    setSelectedNpcId(null);
  }, []);

  const openFormationModal = useCallback(() => setIsFormationModalOpen(true), []);
  const closeFormationModal = useCallback(() => setIsFormationModalOpen(false), []);

  const openTowerModal = useCallback(() => {
    // 检查并重置每日数据
    dispatch(checkAndResetDailyData());
    setIsTowerModalOpen(true);
  }, [dispatch]);
  const closeTowerModal = useCallback(() => setIsTowerModalOpen(false), []);

  const openHomesteadModal = useCallback(() => {
    
    setIsHomesteadModalOpen(true);
  }, []);
  const closeHomesteadModal = useCallback(() => setIsHomesteadModalOpen(false), []);

  // 召唤兽装备管理（集成背包系统的召唤兽界面）
  const openSummonEquipmentModal = useCallback(() => {
    if (summons.length > 0) {
      if (!currentSummon) {
        // 使用OOP系统设置当前召唤兽
        manager.setCurrentSummon(summons[0].id);
      }
    } else {
      if (currentSummon) {
        manager.setCurrentSummon(null);
      }
    }
    setIsSummonEquipmentOpen(true);
  }, [manager, summons, currentSummon]);

  const closeSummonEquipmentModal = useCallback(() => setIsSummonEquipmentOpen(false), []);

  // OOP召唤兽演示系统
  const openSummonOOPDemoModal = useCallback(() => {
    setIsSummonOOPDemoOpen(true);
  }, []);

  const closeSummonOOPDemoModal = useCallback(() => setIsSummonOOPDemoOpen(false), []);

  const openFusionModal = useCallback(() => setIsFusionModalOpen(true), []);
  const closeFusionModal = useCallback(() => setIsFusionModalOpen(false), []);

  const openSummonHomePanel = useCallback(() => setIsSummonHomePanelOpen(true), []);
  const closeSummonHomePanel = useCallback(() => setIsSummonHomePanelOpen(false), []);

  return {
    isSummonModalOpen,
    openSummonModal,
    closeSummonModal,
    isInventoryOOPOpen,
    openInventoryOOPModal,
    closeInventoryOOPModal,
    isIncubatorOpen,
    openIncubatorModal,
    closeIncubatorModal,
    isPlayerInfoOpen,
    openPlayerInfoModal,
    closePlayerInfoModal,
    isSettingsOpen,
    openSettingsModal,
    closeSettingsModal,
    isQuestLogModalOpen,
    openQuestLogModal,
    closeQuestLogModal,
    isMinimapModalOpen,
    openMinimapModal,
    closeMinimapModal,
    isNpcPanelOpen,
    selectedNpcId,
    openNpcPanelModal,
    closeNpcPanelModal,
    isFormationModalOpen,
    openFormationModal,
    closeFormationModal,
    isTowerModalOpen,
    openTowerModal,
    closeTowerModal,
    isHomesteadModalOpen,
    openHomesteadModal,
    closeHomesteadModal,
    isSummonEquipmentOpen,
    setIsSummonEquipmentOpen,
    openSummonEquipmentModal,
    closeSummonEquipmentModal,
    isSummonOOPDemoOpen,
    openSummonOOPDemoModal,
    closeSummonOOPDemoModal,
    isFusionModalOpen,
    openFusionModal,
    closeFusionModal,
    isSummonHomePanelOpen,
    openSummonHomePanel,
    closeSummonHomePanel,
  };
}; 