/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-07 03:15:00
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-11 08:33:01
 */
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BattleSystemProvider } from "@/features/battle/providers/BattleSystemProvider";


import BeautifulHomesteadView from "@/features/homestead/components/BeautifulHomesteadView";
import HomesteadActionBar from "@/features/homestead/components/HomesteadActionBar";
import SummonSystem from "@/features/summon/components/SummonSystem";
import InventoryModal from "@/features/inventory/components/InventoryModal";
import { Incubator } from "@/features/incubator/components/Incubator";
import { PlayerInfo } from "@/features/player/components/PlayerInfo";
import SettingsPanel from "@/features/settings/components/SettingsPanel";
import QuestLogPanel from "@/features/quests/components/QuestLogPanel";
import MinimapPanel from "@/features/minimap/components/MinimapPanel";
import DialoguePanel from "@/features/ui/components/DialoguePanel";
import NpcPanel from "@/features/npc/components/NpcPanel";
import FormationSystemModal from "@/features/formation/components/FormationSystemModal";
import BattleScreen from "@/features/battle/components/BattleScreen";
import CustomTitleBar from "@/features/ui/components/CustomTitleBar";
import TowerSystem from "@/features/tower/components/TowerSystem";
import TowerEntry from "@/features/tower/components/TowerEntry";
import HomesteadView from "@/features/homestead/components/HomesteadView";
import SummonManagerDemo from "@/components/SummonManagerDemo";
import ConfigManager from "../components/ConfigManager";
import ElectronStoreNotification from "../components/ElectronStoreNotification";
import WorldMapModal from "@/features/world-map/components/WorldMapModal";
import NpcOOPDemo from "@/features/npc/components/NpcOOPDemo";
import BattlePreparationModal from "@/features/formation/components/BattlePreparationModal";

import { useAppModals } from "@/hooks/useAppModals";
import { useInventoryManager } from "@/hooks/useInventoryManager";

import { useSummonManager } from "@/hooks/useSummonManager";
import { uiText } from "@/config/ui/uiTextConfig";
import { selectIsWorldMapOpen } from "@/store/slices/mapSlice";
import { selectIsBattleActive } from "@/store/slices/battleSlice";
import { useEquipmentRelationship } from "@/hooks/useEquipmentRelationship";
import { useBattleStateMachine } from "@/features/battle/hooks/useBattleStateMachine";
import { generateEnemyGroup } from '@/features/battle/utils/enemyGenerator';
import worldMapConfig from '@/config/map/worldMapConfig.json';

import CommonModal from "@/features/ui/components/CommonModal";



const GamePageContent = ({
  showToast,
  toasts,
  setToasts,
  gameInitialized,
  onStartDungeonDemo,
}) => {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.player);
  const { isFighting } = useSelector((state) => state.battle);
  const { startBattle, transferControlToEngine } = useBattleStateMachine();

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
  const { allSummons } = gameInitialized
    ? useSummonManager()
    : { allSummons: {} };

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
    closeSummonEquipmentModal,
    isSummonOOPDemoOpen,
    closeSummonOOPDemoModal,
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

  // 添加新的阵型系统状态管理
  const [isFormationSystemModalOpen, setIsFormationSystemModalOpen] = useState(false);
  const openFormationSystemModal = () => setIsFormationSystemModalOpen(true);
  const closeFormationSystemModal = () => setIsFormationSystemModalOpen(false);

  // 添加战备弹窗状态
  const [showBattlePrep, setShowBattlePrep] = useState(false);
  const [enemyGroup, setEnemyGroup] = useState(null);

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

  // 游戏操作栏组件 - 恢复被误删的组件
  const GameActionBar = () => {
    return (
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "10px",
          padding: "10px",
          backgroundColor: "rgba(0,0,0,0.7)",
          borderRadius: "5px",
        }}
      >
        <button
          onClick={openFormationModal}
          style={{
            padding: "8px 12px",
            color: "white",
            backgroundColor: "#555",
            border: "none",
            borderRadius: "3px",
          }}
        >
          阵型
        </button>
        <button
          onClick={openTowerModal}
          style={{
            padding: "8px 12px",
            color: "white",
            backgroundColor: "#6b46c1",
            border: "none",
            borderRadius: "3px",
          }}
        >
          封妖塔
        </button>
        <button
          onClick={onStartDungeonDemo}
          style={{
            padding: "8px 12px",
            color: "white",
            backgroundColor: "#c026d3",
            border: "none",
            borderRadius: "3px",
          }}
        >
          副本
        </button>
        <button
          onClick={() => {
            openHomesteadModal();
          }}
          style={{
            padding: "8px 12px",
            color: "white",
            backgroundColor: "#069545",
            border: "none",
            borderRadius: "3px",
          }}
        >
          家园
        </button>
        <button
          onClick={openInventoryOOPModal}
          style={{
            padding: "8px 12px",
            color: "white",
            backgroundColor: "#8B4513",
            border: "none",
            borderRadius: "3px",
          }}
        >
          背包OOP
        </button>
        <button
          onClick={openConfigManager}
          style={{
            padding: "8px 12px",
            color: "white",
            backgroundColor: "#10b981",
            border: "none",
            borderRadius: "3px",
          }}
        >
          配置管理
        </button>
        {/* 我们需要一个按钮来打开召唤兽界面，这里暂时添加到旧的操作栏中 */}
        <button
          onClick={openSummonModal}
          style={{
            padding: "8px 12px",
            color: "white",
            backgroundColor: "#A020F0",
            border: "none",
            borderRadius: "3px",
          }}
        >
          召唤兽
        </button>
      </div>
    );
  };

  const handleStartBattle = (payload) => {
    console.log("开始启动战斗:", payload);

    // 初始化战斗
    const initResult = startBattle(payload);
    console.log("战斗初始化结果:", initResult);

    // 如果初始化成功，转移控制权给引擎
    if (initResult && initResult.success) {
      console.log("战斗初始化成功，转移控制权给引擎");
      transferControlToEngine();
    } else {
      console.error("战斗初始化失败:", initResult);
    }
  };

  // 测试战斗
  const handleTestBattle = async () => {
    const regionId = 'dongsheng_region';
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
    console.log('战斗确认:', data);
    
    const battlePayload = {
      playerFormation: data.playerFormation,
      enemyGroup: enemyGroup,
    };
    
    handleStartBattle(battlePayload);

    setShowBattlePrep(false);
    setEnemyGroup(null);
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
    <div className="relative w-full h-screen overflow-hidden bg-gray-900 flex flex-col">
      <CustomTitleBar />
      <div className="flex-1 relative overflow-hidden">
        {!isBattleActive && (
          <>
            <BeautifulHomesteadView showToast={showToast} />
            <DialoguePanel />
            <GameActionBar /> {/* 渲染恢复的操作栏 */}
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
                player={player}
              />
            )}
            {/* 测试战斗按钮 */}
            {!isWorldMapOpen && !isBattleActive && (
              <div className="absolute bottom-4 left-4 z-20 flex space-x-2">
                <button
                  onClick={openNpcOOPDemo}
                  className="px-3 py-2 text-white bg-red-700 rounded"
                >
                  NPC系统
                </button>
                <button
                  onClick={handleTestBattle}
                  className="bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-md shadow-lg"
                >
                  测试战斗
                </button>

                <div onClick={openTowerModal}>
                  <TowerEntry onOpenTower={openTowerModal} />
                </div>
              </div>
            )}
            {/* Minimap */}
            {isMinimapModalOpen && (
              <MinimapPanel
                onClose={closeMinimapModal}
                onStartBattle={handleStartBattle}
              />
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

          <MinimapPanel
            isOpen={isMinimapModalOpen}
            onClose={closeMinimapModal}
          />

   

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
            isOpen={isHomesteadModalOpen}
            title={uiText.homestead?.title || "我的家园"}
            onClose={closeHomesteadModal}
          >
            <HomesteadView
              uiText={uiText}
              toasts={toasts}
              setToasts={setToasts}
            />
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
        </>
        <ElectronStoreNotification
          isOpen={showElectronStoreNotification}
          onClose={() => setShowElectronStoreNotification(false)}
          message="数据已同步到本地"
          type="success"
        />

        {isConfigManagerOpen && (
          <CommonModal
            isOpen={isConfigManagerOpen}
            onClose={closeConfigManager}
            title="配置管理器"
          >
            <ConfigManager />
          </CommonModal>
        )}

        {isNpcOOPDemoOpen && (
          <CommonModal
            isOpen={isNpcOOPDemoOpen}
            onClose={closeNpcOOPDemo}
            title={uiText.summonManagement}
          >
            <NpcOOPDemo />
          </CommonModal>
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

const GamePage = (props) => {
  return (
    <BattleSystemProvider>
      <GamePageContent {...props} />
    </BattleSystemProvider>
  );
};

export default GamePage;
