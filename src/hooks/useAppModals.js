import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentSummon } from "@/store/slices/summonSlice";
import { useCurrentSummon, useSummons } from "@/store/reduxSetup";
import { checkAndResetDailyData } from "@/store/slices/towerSlice";

export const useAppModals = () => {
  const dispatch = useDispatch();
  const summons = useSummons();
  const currentSummon = useCurrentSummon();

  const [isSummonModalOpen, setIsSummonModalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isIncubatorOpen, setIsIncubatorOpen] = useState(false);
  const [isPlayerInfoOpen, setIsPlayerInfoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuestLogModalOpen, setQuestLogModalOpen] = useState(false);
  const [isMinimapModalOpen, setMinimapModalOpen] = useState(false);
  const [isNpcPanelOpen, setIsNpcPanelOpen] = useState(false);
  const [selectedNpcId, setSelectedNpcId] = useState(null);
  const [isFormationModalOpen, setIsFormationModalOpen] = useState(false);
  const [isTowerModalOpen, setIsTowerModalOpen] = useState(false);

  const openSummonModal = useCallback(() => {
    if (summons.length > 0) {
      if (!currentSummon) {
        dispatch(setCurrentSummon(summons[0].id));
      }
    } else {
      if (currentSummon) {
        dispatch(setCurrentSummon(null));
      }
    }
    setIsSummonModalOpen(true);
  }, [dispatch, summons, currentSummon]);

  const closeSummonModal = useCallback(() => setIsSummonModalOpen(false), []);
  
  const openInventoryModal = useCallback(() => setIsInventoryOpen(true), []);
  const closeInventoryModal = useCallback(() => setIsInventoryOpen(false), []);

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

  return {
    isSummonModalOpen,
    openSummonModal,
    closeSummonModal,
    isInventoryOpen,
    openInventoryModal,
    closeInventoryModal,
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
  };
}; 