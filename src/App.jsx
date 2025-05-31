import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import store from "@/store"; // 导入store以便获取用户阵型数据

// 导入自定义样式
import "@/styles/customScrollbar.css";

// REMOVING global PixiJS and @pixi/react imports for extend
// import { extend } from '@pixi/react';
// import { Container as PixiContainer, Sprite as PixiSprite, Graphics as PixiGraphicsOriginal } from 'pixi.js'; 

// REMOVING global extend call
// extend({
//   AppRegisteredContainer: PixiContainer, 
//   Sprite: PixiSprite,                   
//   Graphics: PixiGraphicsOriginal        
// });

import HomePage from "@/features/home/components/HomePage";
// import MainMenu from "@/features/main-menu/components/MainMenu"; // 正确注释掉 MainMenu
import GameMap from "@/features/game-map/components/GameMap";
import SummonSystem from "@/features/summon/components/SummonSystem";
import { useToast } from "@/hooks/useToast";
// import { useModalState } from "@/hooks/useModalState"; // No longer needed if we manage modals directly
import { useAutoSave } from "@/features/save/hooks/useAutoSave";
import ToastContainer from "@/features/ui/components/ToastContainer";
import InventoryPanel from "@/features/inventory/components/InventoryPanel";
import { Incubator } from "@/features/incubator/components/Incubator";
import { PlayerInfo } from "@/features/player/components/PlayerInfo";
import SettingsPanel from "@/features/settings/components/SettingsPanel";
import QuestLogPanel from "@/features/quests/components/QuestLogPanel";
import MinimapPanel from '@/features/minimap/components/MinimapPanel';
// import TileInfoPanel from '@/features/tile-info/components/TileInfoPanel'; // REMOVE THIS LINE
import DialoguePanel from "@/features/ui/components/DialoguePanel";
import NpcPanel from "@/features/npc/components/NpcPanel";
import { generateInitialEquipment } from "@/gameLogic";
import {
  initializeReduxIntegration,
  // useCurrentSummon, // Now used within useAppModals
  // useSummons, // Now used within useAppModals
} from "@/store/reduxSetup";
// import { setCurrentSummon } from "@/store/slices/summonSlice"; // Now used within useAppModals
import { initializePlayerQuests } from "@/store/slices/questSlice";
import { selectIsWorldMapOpen } from "@/store/slices/mapSlice";
// import { addItem } from "@/store/slices/itemSlice"; // Not used directly in App.jsx
// import { addToInventory } from "@/store/slices/inventorySlice"; // Not used directly in App.jsx

import CommonModal from "@/features/ui/components/CommonModal";
import LoadingScreen from "@/features/ui/components/LoadingScreen";
import { useAppModals } from "@/hooks/useAppModals";
import { uiText } from "@/config/ui/uiTextConfig";
import { LOADER_WRAPPER_ID } from "@/config/config";
import FormationSetup from "@/features/formation/components/FormationSetup";
import BattleScreen from "@/features/battle/components/BattleScreen";
import { selectIsBattleActive } from "@/store/slices/battleSlice";
import { selectAllSummons } from "@/store/slices/summonSlice";
import CustomTitleBar from "@/features/ui/components/CustomTitleBar";
import TowerSystem from "@/features/tower/components/TowerSystem";
import TowerEntry from "@/features/tower/components/TowerEntry";

const App = () => {
  const dispatch = useDispatch();
  const [showHomePage, setShowHomePage] = useState(true);
  const [toasts, setToasts] = useState([]);
  const { showResult } = useToast(toasts, setToasts);
  
  const {
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
  } = useAppModals();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("正在加载游戏资源...");

  const isWorldMapOpen = useSelector(selectIsWorldMapOpen);
  const isBattleActive = useSelector(selectIsBattleActive);
  const summonsListObject = useSelector(selectAllSummons);

  useAutoSave();

  useEffect(() => {
    const cleanup = initializeReduxIntegration();
    dispatch(initializePlayerQuests());
    console.log("[App.jsx] Redux集成已初始化, 任务已初始化");
    const loader = document.getElementById(LOADER_WRAPPER_ID);
    if (loader) {
      loader.style.display = 'none';
    }
    return cleanup;
  }, [dispatch]);

  // No more handleSystemChange

  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  // 模拟资源加载进度
  const simulateLoading = async () => {
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingMessage("正在初始化游戏引擎...");

    // 模拟不同阶段的加载
    const stages = [
      { progress: 15, message: "正在加载世界地图数据..." },
      { progress: 30, message: "正在生成区域地图..." },
      { progress: 45, message: "正在加载角色模型..." },
      { progress: 60, message: "正在加载游戏数据..." },
      { progress: 75, message: "正在初始化游戏世界..." },
      { progress: 90, message: "正在准备传送门..." },
      { progress: 100, message: "准备进入长安城..." }
    ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setLoadingProgress(stage.progress);
      setLoadingMessage(stage.message);
    }

    await new Promise(resolve => setTimeout(resolve, 200));
    setIsLoading(false);
    setShowHomePage(false);
  };

  const handleStartGame = () => {
    simulateLoading();
  };
  
  // Dummy button bar for now, can be integrated into GameMap or other UI element
  const GameActionBar = () => (
    <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '5px' }}>
      <button onClick={openFormationModal} style={{ padding: '8px 12px', color: 'white', backgroundColor: '#555', border: 'none', borderRadius: '3px' }}>阵型</button>
      <button onClick={openTowerModal} style={{ padding: '8px 12px', color: 'white', backgroundColor: '#6b46c1', border: 'none', borderRadius: '3px' }}>封妖塔</button>
      {/* Add other action buttons here */}
    </div>
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh", // 限制高度为视口高度
        overflow: "hidden", // 防止滚动条出现
        backgroundColor: "#0f172a", // Background for the whole app
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* 自定义标题栏 */}
      <CustomTitleBar />
      
      {/* 游戏内容区 */}
      <div 
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden"
        }}
      >
      {isLoading && (
        <LoadingScreen 
          progress={loadingProgress}
          message={loadingMessage}
        />
      )}

      {!isLoading && showHomePage && (
        <HomePage
          onStartGame={handleStartGame}
          onOpenSettings={openSettingsModal}
        />
      )}

      {!isLoading && !showHomePage && !isBattleActive && (
          <>
            <GameMap 
              showToast={showResult}
              onOpenSummonSystem={openSummonModal}
              onOpenIncubator={openIncubatorModal}
              onOpenPlayerInfo={openPlayerInfoModal}
              onOpenInventory={openInventoryModal}
              onOpenSettings={openSettingsModal}
              onOpenQuestLog={openQuestLogModal}
              onOpenMinimap={openMinimapModal}
              onOpenNpcPanel={openNpcPanelModal}
            />
            <DialoguePanel />
            {!isWorldMapOpen && <GameActionBar />}
            
            {/* 测试战斗按钮 */}
            {!isWorldMapOpen && !isBattleActive && (
              <div className="absolute bottom-4 left-4 z-20 flex space-x-2">
                <button
                  onClick={() => {
                    // 导入并准备战斗数据
                    import('@/features/battle/logic/battleLogic').then(({ prepareBattleSetupData }) => {
                      import('@/config/character/enemyConfig').then(({ getEnemyTemplateById }) => {
                        import('@/config/pet/petConfig').then(({ petConfig }) => {
                          // 获取玩家的召唤兽和阵型
                          const playerSummons = Object.values(summonsListObject || {}).reduce((acc, summon) => {
                            acc[summon.id] = summon;
                            return acc;
                          }, {});
                          
                          // 从 Redux store 中获取玩家设置的阵型
                          const userFormation = store.getState().formation.grid;
                          
                          // 如果用户没有设置阵型或阵型中没有召唤兽，创建一个默认阵型
                          let playerFormation;
                          
                          // 检查用户阵型是否有效
                          const hasValidFormation = userFormation && 
                            userFormation.some(row => row.some(summonId => summonId && playerSummons[summonId]));
                          
                          if (hasValidFormation) {
                            // 使用用户设置的阵型
                            playerFormation = JSON.parse(JSON.stringify(userFormation));
                          } else {
                            // 创建默认阵型，将第一个召唤兽放在中间
                            playerFormation = [
                              [null, null, null],
                              [null, Object.keys(playerSummons)[0] || null, null],
                              [null, null, null]
                            ];
                          }
                          
                          // 创建敌人模板
                          const enemyTemplates = [
                            { template: getEnemyTemplateById('goblin_grunt'), position: { team: 'enemy', row: 1, col: 1 } },
                            { template: getEnemyTemplateById('test_dummy'), position: { team: 'enemy', row: 0, col: 0 } },
                          ];
                          
                          // 准备战斗数据
                          const payload = prepareBattleSetupData(
                            `battle_${Date.now()}`,
                            playerSummons,
                            playerFormation,
                            enemyTemplates,
                            petConfig
                          );
                          
                          // 触发战斗
                          dispatch({ type: 'battle/setupBattle', payload });
                        });
                      });
                    });
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-md shadow-lg transition-all duration-150 text-sm flex items-center gap-2"
                >
                  <i className="fas fa-swords"></i> 测试战斗
                </button>
                
                <div onClick={openTowerModal}>
                  <TowerEntry onOpenTower={openTowerModal} />
                </div>
              </div>
            )}
          </>
        )
      }

      {/* 模态框组件 */}
      {!isWorldMapOpen && (
        <>
          <CommonModal 
            isOpen={isSummonModalOpen} 
            onClose={closeSummonModal}
            title={uiText.titles.summonModal}
            maxWidthClass="max-w-5xl"
            centerContent={false}
          >
            <SummonSystem
              toasts={toasts}
              setToasts={setToasts}
            />
          </CommonModal>

          {/* 背包面板 */}
          <InventoryPanel 
            isOpen={isInventoryOpen}
            onClose={closeInventoryModal}
            showToast={showResult}
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
            <Incubator 
              toasts={toasts}
              setToasts={setToasts}
            />
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

          {/* 任务日志面板 */}
          <CommonModal
            isOpen={isQuestLogModalOpen} 
            onClose={closeQuestLogModal}
            title={uiText.titles.questLogModal}
            maxWidthClass="max-w-3xl"
            centerContent={true}
          >
            <QuestLogPanel />
          </CommonModal>

          {/* NPC 面板 */}
          <CommonModal
            isOpen={isNpcPanelOpen}
            onClose={closeNpcPanelModal}
            title={uiText.titles.npcPanelModal}
            maxWidthClass="max-w-lg"
            centerContent={false}
          >
            {selectedNpcId && <NpcPanel npcId={selectedNpcId} onClose={closeNpcPanelModal} />}
          </CommonModal>

          {/* Render MinimapPanel */}
          <MinimapPanel 
            isOpen={isMinimapModalOpen} 
            onClose={closeMinimapModal}
          />

          {/* Formation Setup Modal */}
          <CommonModal
            isOpen={isFormationModalOpen}
            onClose={closeFormationModal}
            title={uiText.titles.formationModal}
            maxWidthClass="max-w-4xl"
            centerContent={false}
          >
            <FormationSetup showToast={showResult} />
          </CommonModal>
          
          {/* Battle Modal */}
          <CommonModal
            isOpen={isBattleActive}
            onClose={() => dispatch({ type: 'battle/endBattle' })}
            title={uiText.titles.battleModal || ""}
            maxWidthClass="max-w-none"
            centerContent={false}
            hideCloseButton={true} // 战斗中不允许直接关闭
            fullScreen={true}
            padding="px-4 py-2"
          >
            <BattleScreen />
          </CommonModal>
          
          {/* 封妖塔模态框 */}
          <CommonModal
            isOpen={isTowerModalOpen}
            onClose={closeTowerModal}
            title={uiText.titles.towerModal || "封妖塔"}
            maxWidthClass="max-w-5xl"
            centerContent={false}
            fullScreen={false}
          >
            <TowerSystem showToast={showResult} />
          </CommonModal>
        </>
      )}

      <ToastContainer toasts={toasts} setToasts={setToasts} />
      </div>
    </div>
  );
};

export default App;
