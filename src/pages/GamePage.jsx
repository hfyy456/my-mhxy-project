/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-07 03:15:00
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-23 08:59:02
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import BeautifulHomesteadView from "@/features/homestead/components/BeautifulHomesteadView";
import HomesteadActionBar from "@/features/homestead/components/HomesteadActionBar";
import SummonSystem from "@/features/summon/components/SummonSystem";
import InventoryModal from "@/features/inventory/components/InventoryModal";
import { Incubator } from "@/features/incubator/components/Incubator";
import { PlayerInfo } from "@/features/player/components/PlayerInfo";
import SettingsPanel from "@/features/settings/components/SettingsPanel";
import QuestLogPanel from "@/features/quests/components/QuestLogPanel";
import DialoguePanel from "@/features/ui/components/DialoguePanel";
import NpcPanel from "@/features/npc/components/NpcPanel";
import FormationSystemModal from "@/features/formation/components/FormationSystemModal";
import CustomTitleBar from "@/features/ui/components/CustomTitleBar";
import TowerSystem from "@/features/tower/components/TowerSystem";
import TowerEntry from "@/features/tower/components/TowerEntry";
import SummonManagerDemo from "@/components/SummonManagerDemo";
import ConfigManager from "../components/ConfigManager";
import ElectronStoreNotification from "../components/ElectronStoreNotification";
import WorldMapModal from "@/features/world-map/components/WorldMapModal";
import NpcOOPDemo from "@/features/npc/components/NpcOOPDemo";
import BattlePreparationModal from "@/features/formation/components/BattlePreparationModal";
import ThemePreview from "@/features/ui/components/ThemePreview";
import ThemeDemo from "@/features/ui/components/ThemeDemo";
import SummonHomePanel from "@/features/summon/components/SummonHomePanel";
import ResourceProductionOverview from "@/features/homestead/components/ResourceProductionOverview";

import { useAppModals } from "@/hooks/useAppModals";
import { useInventoryManager } from "@/hooks/useInventoryManager";

import { useSummonManager, useSummonOperations } from "@/hooks/useSummonManager";
import { uiText } from "@/config/ui/uiTextConfig";
import { selectIsWorldMapOpen } from "@/store/slices/mapSlice";
import { selectIsBattleActive } from "@/store/slices/battleSliceSimplified";
import { useEquipmentRelationship } from "@/hooks/useEquipmentRelationship";
import { generateEnemyGroup } from "@/utils/enemyGenerator";
import worldMapConfig from "@/config/map/worldMapConfig.json";

import CommonModal from "@/features/ui/components/CommonModal";
import SummonInfo from "@/features/summon/components/SummonInfo";

// 导入存档管理器
import { saveLoadManagerInstance as saveLoadManager } from "@/store/managers";

const GamePageContent = ({
  showToast,
  toasts,
  setToasts,
  gameInitialized,
  onStartDungeonDemo,
  onExitDungeonDemo,
  onStartV3Battle,
}) => {
  const dispatch = useDispatch();
  const { isFighting } = useSelector((state) => state.battle);

  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true); // Default to open

  // 只在游戏初始化后才启用这些Hook
  const inventoryState = gameInitialized
    ? useInventoryManager()
    : {
        items: [],
        gold: 0,
        usedSlots: 0,
        capacity: 100,
        isLoading: false,
        error: null,
      };

  // 只在游戏初始化后启用自动保存
  useEffect(() => {
    if (gameInitialized) {
      console.log("[GamePage] 游戏已初始化，启用背包系统和自动保存");
    }
  }, [gameInitialized]);

  // 使用OOP召唤兽系统 - 只在游戏初始化后
  const { createSummon, currentSummonFullData } = gameInitialized
    ? useSummonManager()
    : {
        createSummon: () => console.log("Game not initialized"),
        currentSummonFullData: null,
      };
      
  const { selectSummon } = useSummonOperations();

  const {
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
    isFormationSystemModalOpen,
    openFormationSystemModal,
    closeFormationSystemModal,
    isTowerModalOpen,
    openTowerModal,
    closeTowerModal,
    isHomesteadModalOpen,
    openHomesteadModal,
    closeHomesteadModal,
    isSummonEquipmentOpen,
    closeSummonEquipmentModal,
    isSummonOOPDemoOpen,
    closeSummonOOPDemoModal,
    isFusionModalOpen,
    openFusionModal,
    closeFusionModal,
    isSummonHomePanelOpen,
    openSummonHomePanel,
    closeSummonHomePanel,
    isSaveModalOpen,
    openSaveModal,
    closeSaveModal,
  } = useAppModals();

  const isWorldMapOpen = useSelector(selectIsWorldMapOpen);
  const isBattleActive = useSelector(selectIsBattleActive);

  const [isEquipmentRelationDemoOpen, setIsEquipmentRelationDemoOpen] =
    useState(false);

  // 添加配置管理器的状态管理
  const [isConfigManagerOpen, setIsConfigManagerOpen] = useState(false);
  const openConfigManager = () => setIsConfigManagerOpen(true);
  const closeConfigManager = () => setIsConfigManagerOpen(false);

  // 添加Electron Store通知的状态管理
  const [showElectronStoreNotification, setShowElectronStoreNotification] =
    useState(false);

  // 添加NPC系统的状态管理
  const [isNpcOOPDemoOpen, setIsNpcOOPDemoOpen] = useState(false);
  const openNpcOOPDemo = () => setIsNpcOOPDemoOpen(true);
  const closeNpcOOPDemo = () => setIsNpcOOPDemoOpen(false);

  // 添加战备弹窗状态
  const [showBattlePrep, setShowBattlePrep] = useState(false);
  const [enemyGroup, setEnemyGroup] = useState(null);

  // 主题演示模态框
  const [isThemeDemoOpen, setIsThemeDemoOpen] = useState(false);


  // 监听背包初始化完成 - 只在游戏初始化后
  useEffect(() => {
    if (!gameInitialized) return;

    if (!inventoryState.isLoading && !inventoryState.error) {
      if (inventoryState.usedSlots > 0) {
        showToast("背包系统加载完成，发现已有物品", "success");
      } else {
        showToast("背包系统初始化完成，已添加新手物品", "info");
      }
    }

    if (inventoryState.error) {
      console.error("[GamePage] 背包系统初始化失败:", inventoryState.error);
      showToast(`背包加载失败: ${inventoryState.error}`, "error");
    }
  }, [
    gameInitialized,
    inventoryState.isLoading,
    inventoryState.error,
    inventoryState.usedSlots,
    showToast,
  ]);

  // 监听来自BeautifulHomesteadView的配置管理器打开事件
  useEffect(() => {
    const handleOpenConfigManager = () => {
      openConfigManager();
    };

    window.addEventListener("openConfigManager", handleOpenConfigManager);
    return () => {
      window.removeEventListener("openConfigManager", handleOpenConfigManager);
    };
  }, []);

  // 装备关系管理
  useEquipmentRelationship();

  const handleTestBattle = async () => {
    const regionId = "dongsheng_region";
    const regionConfig = worldMapConfig[regionId];
    if (!regionConfig || !regionConfig.randomEncounters) {
      console.error(`区域 '${regionId}' 没有有效的随机遭遇配置`);
      return;
    }

    const { averageLevel, enemyPool } = regionConfig.randomEncounters;
    const generatedGroup = await generateEnemyGroup({
      enemyPool: enemyPool,
      level: averageLevel,
      count: 5, 
    });

    if (generatedGroup) {
      setEnemyGroup(generatedGroup);
      setShowBattlePrep(true);
    }
  };

  const handleConfirmBattle = (data) => {
    console.log("战斗确认，已处理数据:", data);
    const enemyUnitsJSON = enemyGroup.enemies.map((unit) => {
      return unit.toBattleJSON();
    });
    for (const item of data.units) {
      item.derivedAttributes = {
        ...item.attributes,
        ...item.tempAttributes,
      };
    }
    onStartV3Battle({
      playerUnits: data.units,
      enemyUnits: enemyUnitsJSON,
      rewards: enemyGroup.rewards,
    });
    setShowBattlePrep(false);
  };

  const handleSelectSummon = (summonId) => {
    selectSummon(summonId);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-800 text-white font-sans">

      <div className="flex-grow overflow-hidden flex">
        {/* 主要游戏内容区域 */}
        <main className="flex-grow flex flex-col">
          {!isBattleActive && (
            <>
              <BeautifulHomesteadView 
                showToast={showToast}
                onOpenSummonHome={openSummonHomePanel}
              />
              <div className="absolute top-20 left-4 z-20">
                 <ResourceProductionOverview showToast={showToast} />
              </div>
              <DialoguePanel />
              {!isWorldMapOpen && (
                <HomesteadActionBar
                  onOpenSummonSystem={openSummonModal}
                  onOpenInventory={openInventoryOOPModal}
                  onOpenIncubatorModal={openIncubatorModal}
                  onOpenPlayerInfo={openPlayerInfoModal}
                  onOpenSettings={openSettingsModal}
                  onOpenQuestLogModal={openQuestLogModal}
                  onOpenFormationSystem={openFormationSystemModal}
                  onOpenTowerModal={openTowerModal}
                  onOpenHomesteadModal={openHomesteadModal}
                  onOpenBattleTest={handleTestBattle}
                  onOpenThemeDemo={() => setIsThemeDemoOpen(true)}
                  onOpenConfigManager={openConfigManager}
                  onOpenSaveModal={openSaveModal}
                />
              )}
              
              {!isWorldMapOpen && !isBattleActive && (
                <div className="absolute bottom-4 left-4 z-20 flex space-x-2">
                  <button
                    onClick={openNpcOOPDemo}
                    className="px-3 py-2 text-white bg-theme-primary rounded"
                  >
                    NPC系统
                  </button>
                  <button
                    onClick={() => setIsThemeDemoOpen(true)}
                    className="px-3 py-2 text-white bg-dreamyPurple-300 hover:bg-dreamyPurple-300/80 transition-colors rounded"
                  >
                    主题演示
                  </button>
                </div>
              )}
              {isNpcPanelOpen && (
                <NpcPanel npcId={selectedNpcId} onClose={closeNpcPanelModal} />
              )}
            </>
          )}
        </main>
      </div>

    
        
  {/* 召唤兽之家功能面板 */}
  {isSummonHomePanelOpen && (
            <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center">
                <SummonHomePanel
                  isOpen={isSummonHomePanelOpen}
                  onClose={closeSummonHomePanel}
                  onFusionSuccess={(newSummon) => {
                    showToast(`成功融合出新的召唤兽: ${newSummon.name || '未知'}!`, "success");
                  }}
                  onSelectSummon={handleSelectSummon}
                  showToast={showToast}
                />
            </div>
          )}
      {isInventoryOOPOpen && (
        <InventoryModal
          isOpen={isInventoryOOPOpen}
          onClose={closeInventoryOOPModal}
          showToast={showToast}
        />
      )}
      
      {isIncubatorOpen && <Incubator onClose={closeIncubatorModal} />}

      <CommonModal
        isOpen={isPlayerInfoOpen}
        onClose={closePlayerInfoModal}
        title="角色信息"
      >
        <PlayerInfo />
      </CommonModal>
      
      <CommonModal
        isOpen={isSettingsOpen}
        onClose={closeSettingsModal}
        title="游戏设置"
      >
        <SettingsPanel />
      </CommonModal>

      <CommonModal
        isOpen={isQuestLogModalOpen}
        onClose={closeQuestLogModal}
        title="任务日志"
      >
        <QuestLogPanel />
      </CommonModal>

      <CommonModal
        isOpen={isFormationSystemModalOpen}
        onClose={closeFormationSystemModal}
        title="队伍编成"
        containerClassName="max-w-7xl"
      >
        <FormationSystemModal onClose={closeFormationSystemModal} />
      </CommonModal>

      <CommonModal
        isOpen={isTowerModalOpen}
        onClose={closeTowerModal}
        title="试炼之塔"
        containerClassName="max-w-4xl"
      >
        <TowerSystem onClose={closeTowerModal} />
      </CommonModal>

      <WorldMapModal />

      <CommonModal
        isOpen={isNpcOOPDemoOpen}
        onClose={closeNpcOOPDemo}
        title="NPC 管理器"
      >
        <NpcOOPDemo />
      </CommonModal>

      {showBattlePrep && (
        <BattlePreparationModal
          isOpen={showBattlePrep}
          onClose={() => setShowBattlePrep(false)}
          onConfirm={handleConfirmBattle}
          enemyGroup={enemyGroup}
        />
      )}

         {/* 存档模态框 */}
         {isSaveModalOpen && (
          <SaveGameModal
            isOpen={isSaveModalOpen}
            onClose={closeSaveModal}
            showToast={showToast}
          />
        )}

      <CommonModal
        isOpen={isThemeDemoOpen}
        onClose={() => setIsThemeDemoOpen(false)}
        title="主题演示"
        containerClassName="max-w-6xl"
      >
        <ThemeDemo />
      </CommonModal>

      {/* For legacy or specific modals if any */}
      <CommonModal 
        isOpen={isSummonModalOpen} 
        onClose={closeSummonModal}
        title="召唤兽系统"
        containerClassName="max-w-7xl h-full"
      >
        <SummonSystem />
      </CommonModal>

   
    </div>
  );
};

const SaveGameModal = ({ isOpen, onClose, showToast }) => {
  const [saveSlots, setSaveSlots] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchMetadata = async () => {
        const slots = await saveLoadManager.getSaveSlots();
        setSaveSlots(slots);
      };
      fetchMetadata();
    }
  }, [isOpen]);

  const handleSave = async (index) => {
    const result = await saveLoadManager.saveGame(index);
    if (result.success) {
      showToast('存档成功！', 'success');
      // 重新加载存档信息
      const slots = await saveLoadManager.getSaveSlots();
      setSaveSlots(slots);
    } else {
      showToast(`存档失败: ${result.message}`, 'error');
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "空存档";
    return new Date(isoString).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} title="保存游戏">
      <div className="p-4">
        <div className="space-y-4">
          {saveSlots.map((slot, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
            >
              <div>
                <h3 className="font-bold">存档 {index + 1}</h3>
                <p className="text-sm text-gray-400">{formatDate(slot?.saveDate)}</p>
                <p className="text-xs text-gray-500">
                  {slot ? `玩家等级: ${slot.playerLevel}` : ""}
                </p>
              </div>
              <button
                onClick={() => handleSave(index)}
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          ))}
        </div>
      </div>
    </CommonModal>
  );
};

const GamePage = (props) => {
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const showToast = useCallback((message, type = "info") => {
    const id = toastId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <GamePageContent
      {...props}
      showToast={showToast}
      toasts={toasts}
      setToasts={setToasts}
    />
  );
};

export default GamePage;
