/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-07 03:15:00
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-22 05:51:38
 */
import React, { useState, useEffect } from "react";
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
import saveLoadManager from "@/store/managers/SaveLoadManager";

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
  const player = useSelector((state) => state.player);
  const { isFighting } = useSelector((state) => state.battle);

  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

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

  // 存档模态框状态
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // 监听背包初始化完成 - 只在游戏初始化后
  useEffect(() => {
    if (!gameInitialized) return;

    if (!inventoryState.isLoading && !inventoryState.error) {
      console.log("[GamePage] 背包系统初始化完成:", {
        金币: inventoryState.gold,
        已用插槽: inventoryState.usedSlots,
        总容量: inventoryState.capacity,
        物品数量: inventoryState.items?.length || 0,
      });

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

  // 游戏操作栏组件 - GameActionBar 已被移除

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
      count: 5, // 生成5个敌人
    });

    if (generatedGroup) {
      setEnemyGroup(generatedGroup);
      setShowBattlePrep(true);
    }
  };

  // 确认进入战斗
  const handleConfirmBattle = (data) => {
    console.log("战斗确认，已处理数据:", data);

    // 来自Modal的数据已经是battle-ready的纯JSON
    const enemyUnitsJSON = enemyGroup.enemies.map((unit) => {
      return unit.toBattleJSON();
    });
    for (const item of data.units) {
      item.derivedAttributes = {
        ...item.derivedAttributes,
        currentHp: item.derivedAttributes.hp,
        currentMp: item.derivedAttributes.mp,
        maxHp: item.derivedAttributes.hp,
        maxMp: item.derivedAttributes.mp,
      };
      item.name = item.nickname;
      item.isPlayerUnit = true;
    }

    const battlePayload = {
      playerUnits: data.units,
      playerGrid: data.grid,
      enemyUnits: enemyUnitsJSON,
      enemyGrid: enemyGroup.enemyFormation.grid,
    };

    onStartV3Battle(battlePayload);

    setShowBattlePrep(false);
    setEnemyGroup(null);
  };

  const handleSelectSummon = (summonId) => {
    selectSummon(summonId);
    showToast(`已选择召唤兽: ${summonId}`, "info");
  };

  // 如果游戏未初始化，显示加载提示
  if (!gameInitialized) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-gray-900 flex flex-col items-center justify-center">
        <CustomTitleBar />
        <div className="text-white text-lg">游戏正在初始化，请稍候...</div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-gray-900 text-white overflow-hidden">
      <CustomTitleBar />
      <div className="flex-1 relative overflow-hidden">
        {!isBattleActive && (
          <>
            <BeautifulHomesteadView
              showToast={showToast}
              onOpenSummonHome={openSummonHomePanel}
              onOpenConfigManager={() => setIsConfigManagerOpen(true)}
            />
            <DialoguePanel />
            {/* Action Bar */}
            {!isWorldMapOpen && (
              <HomesteadActionBar
                onOpenSummonSystem={openSummonModal}
                onOpenInventory={openInventoryOOPModal}
                onOpenPlayerInfo={openPlayerInfoModal}
                onOpenSettings={openSettingsModal}
                onOpenWorldMap={() =>
                  dispatch({ type: "map/setWorldMapOpenAction", payload: true })
                }
                onOpenQuestLog={openQuestLogModal}
                onOpenMinimap={openMinimapModal}
                onOpenNpcPanel={openNpcPanelModal}
                onStartDungeonDemo={onStartDungeonDemo}
                onOpenFormationSystem={openFormationSystemModal}
                onOpenSaveModal={() => setIsSaveModalOpen(true)}
                player={player}
              />
            )}
            {/* 测试战斗按钮 */}
            {!isWorldMapOpen && !isBattleActive && (
              <div className="absolute bottom-4 left-4 z-20 flex space-x-2">
                <button
                  onClick={openNpcOOPDemo}
                  className="px-3 py-2 text-white bg-theme-primary rounded"
                >
                  NPC系统
                </button>
                <button
                  onClick={handleTestBattle}
                  className="px-3 py-2 text-white bg-theme-secondary hover:bg-theme-secondary/80 rounded shadow-lg"
                >
                  测试战斗
                </button>

                <div onClick={openTowerModal}>
                  <TowerEntry onOpenTower={openTowerModal} />
                </div>

                {/* 添加主题演示按钮 */}
                <button
                  onClick={() => setIsThemeDemoOpen(true)}
                  className="px-3 py-2 text-white bg-dreamyPurple-300 hover:bg-dreamyPurple-300/80 transition-colors rounded"
                >
                  主题演示
                </button>
              </div>
            )}
            {/* Npc Panel */}
            {isNpcPanelOpen && (
              <NpcPanel npcId={selectedNpcId} onClose={closeNpcPanelModal} />
            )}
          </>
        )}

        {/* 战斗界面现在通过CommonModal渲染，不需要这个重复的实例 */}

        {/* 全局模态框和面板 */}

        {/* 所有的模态框组件 */}
        <>
          <CommonModal
            isOpen={isSummonModalOpen}
            onClose={closeSummonModal}
            title={uiText.titles.summonModal}
            maxWidthClass="max-w-5xl"
            centerContent={false}
          >
            <SummonSystem toasts={toasts} setToasts={setToasts} />
          </CommonModal>

          <CommonModal
            isOpen={isSummonEquipmentOpen}
            onClose={closeSummonEquipmentModal}
            title="召唤兽装备管理 (集成背包系统)"
            maxWidthClass="max-w-7xl"
            centerContent={false}
          >
            <SummonSystem toasts={toasts} setToasts={setToasts} />
          </CommonModal>

          <InventoryModal
            isOpen={isInventoryOOPOpen}
            onClose={closeInventoryOOPModal}
            showToast={showToast}
          />

          <CommonModal
            isOpen={isPlayerInfoOpen}
            onClose={closePlayerInfoModal}
            title={uiText.titles.playerInfoModal}
            maxWidthClass="max-w-2xl"
            centerContent={true}
          >
            <PlayerInfo />
          </CommonModal>

          <CommonModal
            isOpen={isIncubatorOpen}
            onClose={closeIncubatorModal}
            title={uiText.titles.incubatorModal}
            maxWidthClass="max-w-4xl"
            centerContent={false}
          >
            <Incubator toasts={toasts} setToasts={setToasts} />
          </CommonModal>

          <CommonModal
            isOpen={isSettingsOpen}
            onClose={closeSettingsModal}
            title={uiText.titles.settingsModal}
            maxWidthClass="max-w-3xl"
            centerContent={true}
          >
            <SettingsPanel />
          </CommonModal>

          <CommonModal
            isOpen={isQuestLogModalOpen}
            onClose={closeQuestLogModal}
            title={uiText.titles.questLogModal}
            maxWidthClass="max-w-3xl"
            centerContent={true}
          >
            <QuestLogPanel />
          </CommonModal>

          <CommonModal
            isOpen={isNpcPanelOpen}
            onClose={closeNpcPanelModal}
            title={uiText.titles.npcPanelModal}
            maxWidthClass="max-w-lg"
            centerContent={false}
          >
            {selectedNpcId && (
              <NpcPanel npcId={selectedNpcId} onClose={closeNpcPanelModal} />
            )}
          </CommonModal>

          {isBattleActive && (
            <CommonModal
              isOpen={isBattleActive}
              onClose={() => dispatch({ type: "battle/endBattle" })}
              title={uiText.titles.battleModal || ""}
              maxWidthClass="max-w-none"
              centerContent={false}
              hideCloseButton={true}
              fullScreen={true}
              padding="px-4 py-2"
            >
              <BattleScreen />
            </CommonModal>
          )}
          <CommonModal
            isOpen={isTowerModalOpen}
            onClose={closeTowerModal}
            title={uiText.titles.towerModal || "封妖塔"}
            maxWidthClass="max-w-5xl"
            centerContent={false}
            fullScreen={false}
          >
            <TowerSystem showToast={showToast} />
          </CommonModal>

          <CommonModal
            isOpen={isSummonOOPDemoOpen}
            onClose={closeSummonOOPDemoModal}
            title={uiText.titles.summonOOPDemoModal}
            maxWidthClass="max-w-7xl"
            centerContent={false}
            fullScreen={false}
          >
            <SummonManagerDemo />
          </CommonModal>

          <CommonModal
            isOpen={isNpcOOPDemoOpen}
            onClose={closeNpcOOPDemo}
            title="NPC面向对象配置系统"
            maxWidthClass="max-w-7xl"
            centerContent={false}
            fullScreen={true}
          >
            <NpcOOPDemo />
          </CommonModal>

          <CommonModal
            isOpen={isConfigManagerOpen}
            onClose={closeConfigManager}
            title="游戏配置管理器"
            maxWidthClass="max-w-7xl"
            centerContent={false}
            fullScreen={true}
          >
            <ConfigManager />
          </CommonModal>

          {/* 新的阵型系统模态框 */}
          <FormationSystemModal
            isOpen={isFormationSystemModalOpen}
            onClose={closeFormationSystemModal}
          />

          {/* 世界地图模态框 */}
          <WorldMapModal
            isOpen={isWorldMapOpen}
            onClose={() =>
              dispatch({ type: "map/setWorldMapOpenAction", payload: false })
            }
            showToast={showToast}
          />

          {/* 主题预览（可以通过按钮或设置面板打开） */}
          <CommonModal
            title="主题预览"
            isOpen={isSettingsOpen}
            onClose={closeSettingsModal}
          >
            <ThemePreview />
          </CommonModal>

          {/* 主题演示模态框 */}
          <CommonModal
            isOpen={isThemeDemoOpen}
            onClose={() => setIsThemeDemoOpen(false)}
            title="主题系统演示"
            maxWidthClass="max-w-4xl"
          >
            <ThemeDemo />
          </CommonModal>

     
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

          {isRightSidebarOpen && currentSummonFullData && (
            <div className="absolute right-0 top-0 h-full w-full md:w-1/3 bg-gray-900/90 backdrop-blur-sm z-50 shadow-2xl overflow-y-auto">
               <button 
                onClick={() => setIsRightSidebarOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl z-10"
              >
                <i className="fas fa-times"></i>
              </button>
              <div className="p-6 pt-12">
                <SummonInfo summon={currentSummonFullData} />
              </div>
            </div>
          )}
        </>
        <ElectronStoreNotification
          isOpen={showElectronStoreNotification}
          onClose={() => setShowElectronStoreNotification(false)}
          message="数据已同步到本地"
          type="success"
        />

        {/* 存档模态框 */}
        {isSaveModalOpen && (
          <SaveGameModal
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            showToast={showToast}
          />
        )}

        {/* 战备弹窗 */}
        <BattlePreparationModal
          show={showBattlePrep}
          onCancel={() => setShowBattlePrep(false)}
          onConfirm={handleConfirmBattle}
          enemyGroup={enemyGroup}
        />
      </div>
    </div>
  );
};

// 存档模态框组件
const SaveGameModal = ({ isOpen, onClose, showToast }) => {
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    if (isOpen) {
      saveLoadManager.getSaveSlots().then(setSlots);
    }
  }, [isOpen]);

  const handleSave = async (index) => {
    const result = await saveLoadManager.saveGame(index);
    if (result.success) {
      showToast("游戏已保存！", "success");
      onClose();
    } else {
      showToast(`保存失败: ${result.message}`, "error");
    }
    // 重新加载槽位信息
    saveLoadManager.getSaveSlots().then(setSlots);
  };

  const formatDate = (isoString) => {
    if (!isoString) return "空";
    return new Date(isoString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title="保存游戏"
    >
      <div className="p-4 space-y-2">
        {slots.map((slot, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
          >
            <div className="text-white">
              <p className="font-bold">存档 {index + 1}</p>
              {slot ? (
                <p className="text-sm text-gray-400">
                  {slot.playerName} - 等级 {slot.level} - {formatDate(slot.saveTime)}
                </p>
              ) : (
                <p className="text-sm text-gray-500">空槽位</p>
              )}
            </div>
            <button
              onClick={() => handleSave(index)}
              className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
            >
              保存
            </button>
          </div>
        ))}
      </div>
    </CommonModal>
  );
};

const GamePage = (props) => {
  return (
      <GamePageContent {...props} />
  );
};

export default GamePage;
