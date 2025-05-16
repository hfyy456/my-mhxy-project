import { useCallback } from 'react';

export const useGameActions = (gameManager, showResult, setSummon) => {
  const handleRefineMonster = useCallback(() => {
    console.log('[useGameActions] handleRefineMonster called');
    const result = gameManager.refineMonster();
    console.log('[useGameActions] refineMonster result:', result);
    if (result && result.message) {
      showResult(result.message, result.type);
      setSummon(gameManager.getCurrentSummon());
    }
  }, [gameManager, showResult, setSummon]);

  const handleBookSkill = useCallback(() => {
    console.log('[useGameActions] handleBookSkill called');
    const result = gameManager.bookSkill();
    console.log('[useGameActions] bookSkill result:', result);
    if (result.needConfirm) {
      return;
    }
    if (result && result.message) {
      showResult(result.message, result.type);
      setSummon(gameManager.getCurrentSummon());
    }
  }, [gameManager, showResult, setSummon]);

  const handleConfirmReplaceSkill = useCallback((confirm) => {
    console.log('[useGameActions] handleConfirmReplaceSkill called:', confirm);
    const result = gameManager.confirmReplaceSkill(confirm);
    console.log('[useGameActions] confirmReplaceSkill result:', result);
    if (result && result.message) {
      showResult(result.message, result.type);
      setSummon(gameManager.getCurrentSummon());
    }
  }, [gameManager, showResult, setSummon]);

  const handleLevelUp = useCallback(() => {
    console.log('[useGameActions] handleLevelUp called');
    const result = gameManager.addExperience(100);
    console.log('[useGameActions] addExperience result:', result);
    if (result && result.message) {
      showResult(result.message, result.type);
      setSummon(gameManager.getCurrentSummon());
    }
  }, [gameManager, showResult, setSummon]);

  const handleEquipItem = useCallback((itemData, slotType) => {
    console.log('[useGameActions] handleEquipItem called:', { itemData, slotType });
    if (!itemData || !slotType) {
      console.error("[useGameActions] handleEquipItem: Missing itemData or slotType");
      return;
    }

    const result = gameManager.equipItem(itemData, slotType);
    console.log('[useGameActions] equipItem result:', result);
    if (result && result.message) {
      showResult(result.message, result.type);
      setSummon(gameManager.getCurrentSummon());
    }
  }, [gameManager, showResult, setSummon]);

  const handleAllocatePoint = useCallback((attributeName, amount) => {
    console.log('[useGameActions] handleAllocatePoint called:', { attributeName, amount });
    const result = gameManager.allocatePotentialPoint(attributeName, amount);
    console.log('[useGameActions] allocatePotentialPoint result:', result);
    if (result && result.message) {
      showResult(result.message, result.type);
      setSummon(gameManager.getCurrentSummon());
    }
  }, [gameManager, showResult, setSummon]);

  const handleResetPoints = useCallback(() => {
    console.log('[useGameActions] handleResetPoints called');
    const result = gameManager.resetPotentialPoints();
    console.log('[useGameActions] resetPotentialPoints result:', result);
    if (result && result.message) {
      showResult(result.message, result.type);
      setSummon(gameManager.getCurrentSummon());
    }
  }, [gameManager, showResult, setSummon]);

  return {
    handleRefineMonster,
    handleBookSkill,
    handleConfirmReplaceSkill,
    handleLevelUp,
    handleEquipItem,
    handleAllocatePoint,
    handleResetPoints
  };
}; 