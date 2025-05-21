import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

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
import GameMap from "@/features/game-map/components/GameMap"; // 引入新的地图组件 // Temporarily commented out for testing
import SummonSystem from "@/features/summon/components/SummonSystem";
import { useToast } from "@/hooks/useToast";
// import { useModalState } from "@/hooks/useModalState"; // No longer needed if we manage modals directly
import { useAutoSave } from "@/features/save/hooks/useAutoSave";
import ToastContainer from "@/features/ui/components/ToastContainer";
import InventoryPanel from "@/features/inventory/components/InventoryPanel";
import { Incubator } from "@/features/incubator/components/Incubator";
import { PlayerInfo } from "@/features/player/components/PlayerInfo";
import SettingsPanel from "@/features/settings/components/SettingsPanel";
import QuestLogPanel from "@/features/quests/components/QuestLogPanel"; // 导入任务日志面板
import MinimapPanel from '@/features/minimap/components/MinimapPanel'; // Import MinimapPanel
// import TileInfoPanel from '@/features/tile-info/components/TileInfoPanel'; // REMOVE THIS LINE
import DialoguePanel from "@/features/ui/components/DialoguePanel"; // <--- 添加导入
import NpcPanel from "@/features/npc/components/NpcPanel"; // 导入NPC面板
import { generateInitialEquipment } from "@/gameLogic";
import {
  initializeReduxIntegration,
  useCurrentSummon,
  useSummons,
} from "@/store/reduxSetup";
import { setCurrentSummon } from "@/store/slices/summonSlice";
import { initializePlayerQuests } from "@/store/slices/questSlice"; // 初始化任务
import { selectIsWorldMapOpen } from "@/store/slices/mapSlice"; // 世界地图状态
// import { addItem } from "@/store/slices/itemSlice"; // Not used directly in App.jsx
// import { addToInventory } from "@/store/slices/inventorySlice"; // Not used directly in App.jsx

import CommonModal from "@/features/ui/components/CommonModal"; // 导入统一的模态框组件
import LoadingScreen from "@/features/ui/components/LoadingScreen"; // 导入加载页面组件

const App = () => {
  const dispatch = useDispatch();
  const [showHomePage, setShowHomePage] = useState(true); // New state for home page
  const [toasts, setToasts] = useState([]);
  const { showResult } = useToast(toasts, setToasts);
  
  // Modal states
  const [isSummonModalOpen, setIsSummonModalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isIncubatorOpen, setIsIncubatorOpen] = useState(false);
  const [isPlayerInfoOpen, setIsPlayerInfoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuestLogModalOpen, setQuestLogModalOpen] = useState(false);
  const [isMinimapModalOpen, setMinimapModalOpen] = useState(false); // State for Minimap Modal
  const [isNpcPanelOpen, setIsNpcPanelOpen] = useState(false); // NPC面板状态
  const [selectedNpcId, setSelectedNpcId] = useState(null); // 选中的NPC ID
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("正在加载游戏资源...");

  const summons = useSummons();
  const summon = useCurrentSummon();

  const isWorldMapOpen = useSelector(selectIsWorldMapOpen); // 获取世界地图打开状态

  useAutoSave();

  useEffect(() => {
    const cleanup = initializeReduxIntegration();
    dispatch(initializePlayerQuests()); // 初始化玩家任务数据
    console.log("[App.jsx] Redux集成已初始化, 任务已初始化");
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
      loader.style.display = 'none';
    }
    return cleanup;
  }, [dispatch]); // Added dispatch to dependency array

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
      await new Promise(resolve => setTimeout(resolve, 300));
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
  
  // Specific open handlers for modals to manage Redux state if needed
  const openSummonModal = () => {
    if (summons.length > 0) {
      if (!summon) {
        dispatch(setCurrentSummon(summons[0].id));
      }
    } else {
      if (summon) {
        dispatch(setCurrentSummon(null));
      }
    }
    setIsSummonModalOpen(true);
  };

  const handleOpenQuestLog = () => setQuestLogModalOpen(true);
  const handleCloseQuestLog = () => setQuestLogModalOpen(false);

  const handleOpenMinimap = () => setMinimapModalOpen(true); // Handler to open Minimap
  const handleCloseMinimap = () => setMinimapModalOpen(false); // Handler to close Minimap

  const openNpcPanel = (npcId) => {
    setSelectedNpcId(npcId);
    setIsNpcPanelOpen(true);
  };

  const closeNpcPanel = () => {
    setIsNpcPanelOpen(false);
    setSelectedNpcId(null);
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "#0f172a", // Background for the whole app
      }}
    >
      {showHomePage ? (
        <HomePage
          onStartGame={handleStartGame}
          onOpenSettings={() => setIsSettingsOpen(true)}
          // toasts and setToasts are not typically passed to HomePage
          // but if it uses them, they can be added back.
        />
      ) : (
        <>
          <GameMap 
            showToast={showResult}
            onOpenSummonSystem={openSummonModal} // Use specific handler
            onOpenIncubator={() => setIsIncubatorOpen(true)}
            onOpenPlayerInfo={() => setIsPlayerInfoOpen(true)}
            onOpenInventory={() => setIsInventoryOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenQuestLog={handleOpenQuestLog} // 将打开任务日志的函数传递给 GameMap
            onOpenMinimap={handleOpenMinimap} // Pass handler for Minimap
            onOpenNpcPanel={openNpcPanel} // 将打开NPC面板的函数传递给 GameMap
          />
          {/* <TileInfoPanel /> */}
          <DialoguePanel /> {/* <--- 添加 DialoguePanel */}
        </>
      )}

      {/* 加载页面 */}
      {isLoading && (
        <LoadingScreen 
          progress={loadingProgress}
          message={loadingMessage}
        />
      )}

      {/* 仅在世界地图未打开时显示这些模态框 */}
      {!isWorldMapOpen && (
        <>
          <CommonModal 
            isOpen={isSummonModalOpen} 
            onClose={() => setIsSummonModalOpen(false)} 
            title="召唤兽" 
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
            onClose={() => setIsInventoryOpen(false)}
            showToast={showResult}
          />

          <CommonModal 
            isOpen={isPlayerInfoOpen} 
            onClose={() => setIsPlayerInfoOpen(false)} 
            title="角色信息" 
            maxWidthClass="max-w-2xl"
            centerContent={true}
          >
            <PlayerInfo />
          </CommonModal>

          <CommonModal 
            isOpen={isIncubatorOpen} 
            onClose={() => setIsIncubatorOpen(false)} 
            title="孵化器" 
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
            onClose={() => setIsSettingsOpen(false)} 
            title="设置" 
            maxWidthClass="max-w-3xl"
            centerContent={true}
          >
            <SettingsPanel 
              toasts={toasts}
              setToasts={setToasts}
            />
          </CommonModal>

          {/* 任务日志面板 */}
          <QuestLogPanel 
            isOpen={isQuestLogModalOpen} 
            onClose={handleCloseQuestLog} 
          />

          {/* NPC 面板 */}
          <CommonModal
            isOpen={isNpcPanelOpen}
            onClose={closeNpcPanel}
            title="NPC 信息"
            maxWidthClass="max-w-lg" // 可以根据NPC面板内容调整
            centerContent={false} // 通常NPC信息面板不需要内容居中
          >
            {selectedNpcId && <NpcPanel npcId={selectedNpcId} onClose={closeNpcPanel} />}
          </CommonModal>

          {/* Render MinimapPanel */}
          <MinimapPanel 
            isOpen={isMinimapModalOpen} 
            onClose={handleCloseMinimap} 
          />
        </>
      )}

      <ToastContainer toasts={toasts} setToasts={setToasts} />
    </div>
  );
};

export default App;
