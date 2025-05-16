import { useState } from 'react';
import { useGameState } from '../../../hooks/useGameState';
import { useGameActions } from '../../../hooks/useGameActions';
import { useToast } from '../../../hooks/useToast';

export const useSummonSystem = (toasts, setToasts) => {
  const { gameManager, summon, setSummon, historyList } = useGameState();
  const { showResult } = useToast(toasts, setToasts, gameManager);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPetCatalogModalOpen, setIsPetCatalogModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSkillCatalogModalOpen, setIsSkillCatalogModalOpen] = useState(false);

  const {
    handleRefineMonster,
    handleBookSkill,
    handleConfirmReplaceSkill,
    handleLevelUp,
    handleEquipItem,
    handleAllocatePoint,
    handleResetPoints
  } = useGameActions(gameManager, showResult, setSummon);

  const updateSummonInfo = (updatedSummon) => {
    setSummon(updatedSummon);
  };

  return {
    historyList,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isPetCatalogModalOpen,
    setIsPetCatalogModalOpen,
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    isSkillCatalogModalOpen,
    setIsSkillCatalogModalOpen,
    handleRefineMonster,
    handleBookSkill,
    handleConfirmReplaceSkill,
    handleLevelUp,
    handleEquipItem,
    handleAllocatePoint,
    handleResetPoints
  };
}; 