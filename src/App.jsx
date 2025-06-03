import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import store from "./store/index.js"; // 导入store以便获取用户阵型数据

// 导入自定义样式
import "./styles/customScrollbar.css";

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
// 移除旧的Redux背包系统
// import InventoryPanel from "@/features/inventory/components/InventoryPanel";
import InventoryModal from "@/features/inventory/components/InventoryModal"; // 主背包系统
import { useInventoryManager } from "@/hooks/useInventoryManager"; // 添加背包管理器导入
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
import { selectIsBattleActive } from "@/store/slices/battleSlice";
// import { addItem } from "@/store/slices/itemSlice"; // Not used directly in App.jsx
// import { addToInventory } from "@/store/slices/inventorySlice"; // Not used directly in App.jsx

import CommonModal from "@/features/ui/components/CommonModal";
import LoadingScreen from "@/features/ui/components/LoadingScreen";
import { useAppModals } from "@/hooks/useAppModals";
import { uiText } from "@/config/ui/uiTextConfig";
import { LOADER_WRAPPER_ID } from "@/config/config";
import FormationSetup from "@/features/formation/components/FormationSetup";
import BattleScreen from "@/features/battle/components/BattleScreen";
import CustomTitleBar from "@/features/ui/components/CustomTitleBar";
import TowerSystem from "@/features/tower/components/TowerSystem";
import TowerEntry from "@/features/tower/components/TowerEntry";
import HomesteadView from '@/features/homestead/components/HomesteadView'; // 导入家园视图
import SummonManagerDemo from '@/components/SummonManagerDemo'; // 导入OOP召唤兽演示组件
import DataClearPanel from '@/components/DataClearPanel'; // 导入数据清理面板
import { useSummonManager } from '@/hooks/useSummonManager'; // 导入OOP召唤兽系统hook

const App = () => {
  const dispatch = useDispatch();
  const [showHomePage, setShowHomePage] = useState(true);
  const [toasts, setToasts] = useState([]);
  const { showResult } = useToast(toasts, setToasts);
  
  // 初始化背包系统 - 确保游戏启动时就加载背包数据
  const inventoryState = useInventoryManager();
  
  // 使用OOP召唤兽系统
  const { allSummons } = useSummonManager();

  const {
    isSummonModalOpen,
    openSummonModal,
    closeSummonModal,
    // 移除旧的Redux背包状态管理
    // isInventoryOpen,
    // openInventoryModal,
    // closeInventoryModal,
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
    openSummonEquipmentModal,
    closeSummonEquipmentModal,
    isSummonOOPDemoOpen,
    openSummonOOPDemoModal,
    closeSummonOOPDemoModal,
  } = useAppModals();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("正在加载游戏资源...");

  const isWorldMapOpen = useSelector(selectIsWorldMapOpen);
  const isBattleActive = useSelector(selectIsBattleActive);

  // 添加数据清理面板的状态管理
  const [isDataClearPanelOpen, setIsDataClearPanelOpen] = useState(false);
  const openDataClearPanel = () => setIsDataClearPanelOpen(true);
  const closeDataClearPanel = () => setIsDataClearPanelOpen(false);

  useAutoSave();

  useEffect(() => {
    const cleanup = initializeReduxIntegration();
    dispatch(initializePlayerQuests());
    console.log("[App.jsx] Redux集成已初始化, 任务已初始化");
    console.log("[App.jsx] 背包初始化状态:", {
      isLoading: inventoryState.isLoading,
      error: inventoryState.error,
      gold: inventoryState.gold,
      usedSlots: inventoryState.usedSlots,
      capacity: inventoryState.capacity
    });
    const loader = document.getElementById(LOADER_WRAPPER_ID);
    if (loader) {
      loader.style.display = 'none';
    }
    return cleanup;
  }, [dispatch, inventoryState.isLoading]);

  // 监听背包初始化完成
  useEffect(() => {
    if (!inventoryState.isLoading && !inventoryState.error) {
      console.log("[App.jsx] 背包系统初始化完成:", {
        金币: inventoryState.gold,
        已用插槽: inventoryState.usedSlots,
        总容量: inventoryState.capacity,
        物品数量: inventoryState.items?.length || 0
      });
      
      // 如果有初始物品，显示一个提示
      if (inventoryState.usedSlots > 0) {
        showResult("背包系统加载完成，发现已有物品", "success");
      } else {
        showResult("背包系统初始化完成，已添加新手物品", "info");
      }
    }
    
    if (inventoryState.error) {
      console.error("[App.jsx] 背包系统初始化失败:", inventoryState.error);
      showResult(`背包加载失败: ${inventoryState.error}`, "error");
    }
  }, [inventoryState.isLoading, inventoryState.error, inventoryState.usedSlots, showResult]);

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
  
  // 更新操作栏，移除旧背包按钮，保留面向对象背包按钮并重命名
  const GameActionBar = () => {
    return (
    <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '5px' }}>
      <button onClick={openFormationModal} style={{ padding: '8px 12px', color: 'white', backgroundColor: '#555', border: 'none', borderRadius: '3px' }}>阵型</button>
      <button onClick={openTowerModal} style={{ padding: '8px 12px', color: 'white', backgroundColor: '#6b46c1', border: 'none', borderRadius: '3px' }}>封妖塔</button>
      <button onClick={() => { openHomesteadModal(); }} style={{ padding: '8px 12px', color: 'white', backgroundColor: '#069545', border: 'none', borderRadius: '3px' }}>家园</button>
      {/* 重命名面向对象背包按钮为主背包 */}
      <button onClick={openInventoryOOPModal} style={{ padding: '8px 12px', color: 'white', backgroundColor: '#f59e0b', border: 'none', borderRadius: '3px', fontWeight: 'bold' }}>
        背包
      </button>
      {/* 召唤兽装备管理按钮 */}
      <button onClick={openSummonEquipmentModal} style={{ padding: '8px 12px', color: 'white', backgroundColor: '#8b5cf6', border: 'none', borderRadius: '3px', fontWeight: 'bold' }}>
        召唤兽装备
      </button>
      {/* OOP召唤兽演示按钮 */}
      <button onClick={openSummonOOPDemoModal} style={{ padding: '8px 12px', color: 'white', backgroundColor: '#dc2626', border: 'none', borderRadius: '3px', fontWeight: 'bold' }}>
        OOP召唤兽
      </button>
      {/* 数据清理管理按钮 */}
      <button onClick={openDataClearPanel} style={{ padding: '8px 12px', color: 'white', backgroundColor: '#ef4444', border: 'none', borderRadius: '3px', fontWeight: 'bold' }}>
        数据清理
      </button>
    </div>
  ); };

    console.log('[App.jsx] App component rendering. isHomesteadModalOpen:', isHomesteadModalOpen);
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
              onOpenInventory={openInventoryOOPModal} // 替换为面向对象背包系统
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
                        import('@/config/summon/summonConfig').then(({ summonConfig }) => {
                          // 获取玩家的召唤兽和阵型
                          const playerSummons = Object.values(allSummons || {}).reduce((acc, summon) => {
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
                            summonConfig
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

          {/* 新增：集成背包系统的召唤兽装备管理 */}
          <CommonModal 
            isOpen={isSummonEquipmentOpen} 
            onClose={closeSummonEquipmentModal}
            title="召唤兽装备管理 (集成背包系统)"
            maxWidthClass="max-w-5xl"
            centerContent={false}
          >
            <SummonSystem
              toasts={toasts}
              setToasts={setToasts}
            />
          </CommonModal>

          {/* 面向对象背包系统 - 现在是主背包系统 */}
          <InventoryModal
            isOpen={isInventoryOOPOpen}
            onClose={closeInventoryOOPModal}
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

          {/* 家园系统模态框 */}
          
            <CommonModal isOpen={isHomesteadModalOpen} title={uiText.homestead?.title || "我的家园"} onClose={closeHomesteadModal}>
              <HomesteadView uiText={uiText} toasts={toasts} setToasts={setToasts} />
            </CommonModal>

          {/* OOP召唤兽演示系统模态框 */}
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

          {/* 数据清理管理系统模态框 */}
          <CommonModal
            isOpen={isDataClearPanelOpen}
            onClose={closeDataClearPanel}
            title="数据清理管理系统"
            maxWidthClass="max-w-6xl"
            centerContent={false}
            fullScreen={false}
          >
            <DataClearPanel />
          </CommonModal>
          
        </>
      )}

      <ToastContainer toasts={toasts} setToasts={setToasts} />
      </div>
    </div>
  );
};

export default App;
