import { useState, useCallback, useEffect } from 'react';
import { useSummonManager } from '../../../hooks/useSummonManager';
// import { useGameActions } from '../../../hooks/useGameActions'; // Game actions are now mostly in components
import { useToast } from '../../../hooks/useToast';

export const useSummonSystem = (toasts, setToasts) => {
  // 使用现有的 OOP 召唤兽管理器
  const { state: summonState, currentSummon, operations } = useSummonManager();
  
  // 使用useRef跟踪初始化状态，避免在每次渲染时都执行副作用
  const [initialized, setInitialized] = useState(false);
  
  // 安全地更新toast，使用useCallback来避免不必要的函数重新创建
  const safeSetToasts = useCallback((toastUpdater) => {
    // 确保在渲染完成后执行状态更新
    setTimeout(() => {
      setToasts(toastUpdater);
    }, 0);
  }, [setToasts]);

  // gameManager is no longer passed to useToast
  const { showResult } = useToast(toasts, safeSetToasts);
  
  // useGameActions is likely no longer needed here, or returns very few generic actions if any.
  // For now, assuming its returned actions are not used by SummonSystem.jsx directly anymore.
  // const {
    // handleRefineMonster, // Handled in SummonSystem.jsx
    // handleBookSkill,     // Handled via onOpenSkillEditor in SummonSystem.jsx
    // ... other actions
  // } = useGameActions(showResult); 

  // 使用useState为所有模态框状态创建状态变量
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSummonCatalogModalOpen, setIsSummonCatalogModalOpen] = useState(false);
  // Removing other modal states if they were tied to old gameManager actions
  // const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  // const [isSkillCatalogModalOpen, setIsSkillCatalogModalOpen] = useState(false);

  // 组件初始化逻辑放在useEffect中，确保不会在渲染期间执行
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      // 任何需要在组件挂载时执行一次的初始化逻辑
      console.log("[useSummonSystem] 初始化完成，使用OOP召唤兽管理器");
    }
  }, [initialized]);

  return {
    summon: currentSummon,
    summonState,
    operations,
    showResult,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isSummonCatalogModalOpen,
    setIsSummonCatalogModalOpen,
    // Actions like handleRefineMonster, etc., are now part of SummonSystem.jsx component logic
  };
}; 