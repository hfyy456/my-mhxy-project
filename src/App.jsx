import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import HomePage from "@/features/home/components/HomePage";
// import MainMenu from "@/features/main-menu/components/MainMenu"; // 正确注释掉 MainMenu
import GameMap from "@/features/game-map/components/GameMap"; // 引入新的地图组件
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
import TileInfoPanel from '@/features/tile-info/components/TileInfoPanel'; // Import TileInfoPanel
import Modal from "@/components/Modal"; // Import the generic Modal component
import { generateInitialEquipment } from "@/gameLogic";
import {
  initializeReduxIntegration,
  useCurrentSummon,
  useSummons,
} from "@/store/reduxSetup";
import { setCurrentSummon } from "@/store/slices/summonSlice";
import { initializePlayerQuests } from "@/store/slices/questSlice"; // 初始化任务
// import { addItem } from "@/store/slices/itemSlice"; // Not used directly in App.jsx
// import { addToInventory } from "@/store/slices/inventorySlice"; // Not used directly in App.jsx

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

  const summons = useSummons();
  const summon = useCurrentSummon();

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

  const handleStartGame = () => {
    setShowHomePage(false); 
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
          />
          <TileInfoPanel />
        </>
      )}

      <Modal isOpen={isSummonModalOpen} onClose={() => setIsSummonModalOpen(false)} title="召唤兽" maxWidthClass="max-w-5xl">
        <SummonSystem
          // onBackToMain is no longer needed as it's a modal
          toasts={toasts} // Pass if SummonSystem uses toasts directly
          setToasts={setToasts} // Pass if SummonSystem uses toasts directly
        />
      </Modal>

      <Modal isOpen={isInventoryOpen} onClose={() => setIsInventoryOpen(false)} title="背包" maxWidthClass="max-w-5xl">
        <InventoryPanel 
          isOpen={isInventoryOpen} // Pass isOpen to InventoryPanel
          onClose={() => setIsInventoryOpen(false)} // Pass onClose to InventoryPanel
          showToast={showResult} // Pass showResult as showToast
        />
      </Modal>

      <Modal isOpen={isPlayerInfoOpen} onClose={() => setIsPlayerInfoOpen(false)} title="角色信息" maxWidthClass="max-w-2xl">
        <PlayerInfo 
           // isOpen and onClose are handled by Modal component
        />
      </Modal>

      <Modal isOpen={isIncubatorOpen} onClose={() => setIsIncubatorOpen(false)} title="孵化器" maxWidthClass="max-w-4xl">
        <Incubator 
          toasts={toasts} // Pass if Incubator uses toasts directly
          setToasts={setToasts} // Pass if Incubator uses toasts directly
        />
      </Modal>
      
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="设置" maxWidthClass="max-w-3xl">
        <SettingsPanel 
           // isOpen and onClose are handled by Modal component and removed from SettingsPanel props
           toasts={toasts} // Pass if SettingsPanel uses toasts directly
           setToasts={setToasts} // Pass if SettingsPanel uses toasts directly
        />
      </Modal>

      {/* 任务日志面板 */}
      {isQuestLogModalOpen && (
        <QuestLogPanel 
          isOpen={isQuestLogModalOpen} 
          onClose={handleCloseQuestLog} 
        />
      )}

      {/* Render MinimapPanel */}
      {isMinimapModalOpen && (
        <MinimapPanel 
          isOpen={isMinimapModalOpen} 
          onClose={handleCloseMinimap} 
        />
      )}

      <ToastContainer toasts={toasts} setToasts={setToasts} />
    </div>
  );
};

export default App;
