import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import HomePage from "@/features/home/components/HomePage";
import MainMenu from "@/features/main-menu/components/MainMenu";
import SummonSystem from "@/features/summon/components/SummonSystem";
import { useToast } from "@/hooks/useToast";
import { useModalState } from "@/hooks/useModalState";
import { useAutoSave } from "@/features/save/hooks/useAutoSave";
import ToastContainer from "@/features/ui/components/ToastContainer";
import InventoryPanel from "@/features/inventory/components/InventoryPanel";
import { Incubator } from "@/features/incubator/components/Incubator";
import { PlayerInfo } from "@/features/player/components/PlayerInfo";
import SettingsPanel from "@/features/settings/components/SettingsPanel";
import { generateInitialEquipment } from "@/gameLogic";
import {
  initializeReduxIntegration,
  useCurrentSummon,
  useSummons,
} from "@/store/reduxSetup";
import { setCurrentSummon } from "@/store/slices/summonSlice";
import { addItem } from "@/store/slices/itemSlice";
import { addToInventory } from "@/store/slices/inventorySlice";

const App = () => {
  const dispatch = useDispatch();
  const [currentSystem, setCurrentSystem] = useState("home");
  const [toasts, setToasts] = useState([]);
  const { showResult } = useToast(toasts, setToasts);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isIncubatorOpen, setIsIncubatorOpen] = useState(false);
  const [isPlayerInfoOpen, setIsPlayerInfoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 从Redux获取召唤兽数据
  const summons = useSummons();
  const summon = useCurrentSummon();

  // 使用自动存档 hook
  useAutoSave();

  // 初始化Redux集成
  useEffect(() => {
    const cleanup = initializeReduxIntegration();
    console.log("[App.jsx] Redux集成已初始化");

    // 移除加载动画
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
      loader.style.display = 'none';
    }

    return cleanup;
  }, []);

  const handleSystemChange = (system) => {
    if (system === "summon") {
      if (summons.length > 0) {
        if (!summon) {
          dispatch(setCurrentSummon(summons[0].id));
          console.log(
            "[App.jsx] Switched to Summon System, selected first summon:",
            summons[0]
          );
        }
      } else {
        if (summon) {
          dispatch(setCurrentSummon(null));
          console.log(
            "[App.jsx] Switched to Summon System, no summons available"
          );
        }
      }
    }
    setCurrentSystem(system);
  };

  // 禁用右键菜单
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
    setCurrentSystem("main");
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "#0f172a",
      }}
    >
      {currentSystem === "home" ? (
        <HomePage
          onStartGame={handleStartGame}
          toasts={toasts}
          setToasts={setToasts}
        />
      ) : currentSystem === "main" ? (
        <MainMenu
          onOpenSummonSystem={() => handleSystemChange("summon")}
          onOpenIncubator={() => setIsIncubatorOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          toasts={toasts}
          setToasts={setToasts}
        />
      ) : (
        <SummonSystem
          onBackToMain={() => handleSystemChange("main")}
          toasts={toasts}
          setToasts={setToasts}
        />
      )}

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          zIndex: 99999,
        }}
      >
        <ToastContainer toasts={toasts} setToasts={setToasts} />
      </div>

      {currentSystem !== "home" && (
        <div className="fixed bottom-4 left-4 flex gap-2 z-40">
          {/* 玩家信息按钮 */}
          <button
            onClick={() => setIsPlayerInfoOpen(true)}
            className="bg-slate-900/70 hover:bg-slate-800/90 
              text-white p-2.5 rounded-md shadow-md flex items-center gap-1.5 
              transition-all duration-200 border border-slate-700/50 group"
          >
            <i className="fas fa-user text-base text-blue-400"></i>
            <span className="text-xs font-normal">玩家信息</span>
          </button>

          {/* 背包按钮 */}
          <button
            onClick={() => setIsInventoryOpen(true)}
            className="bg-slate-900/70 hover:bg-slate-800/90 
              text-white p-2.5 rounded-md shadow-md flex items-center gap-1.5 
              transition-all duration-200 border border-slate-700/50 group"
          >
            <i className="fas fa-briefcase text-base text-amber-400"></i>
            <span className="text-xs font-normal">背包</span>
          </button>

          {/* 设置按钮 */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="bg-slate-900/70 hover:bg-slate-800/90 
              text-white p-2.5 rounded-md shadow-md flex items-center gap-1.5 
              transition-all duration-200 border border-slate-700/50 group"
          >
            <i className="fas fa-cog text-base text-purple-400"></i>
            <span className="text-xs font-normal">设置</span>
          </button>
        </div>
      )}

      {/* 背包面板 */}
      {currentSystem !== "home" && (
        <>
          <InventoryPanel
            isOpen={isInventoryOpen}
            onClose={() => setIsInventoryOpen(false)}
            toasts={toasts}
            setToasts={setToasts}
          />

          {/* 玩家信息面板 */}
          <div
            className={`fixed inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${
              isPlayerInfoOpen
                ? "opacity-100 z-50"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="bg-slate-900 rounded-lg shadow-xl w-[90%] max-w-4xl max-h-[90vh] overflow-auto relative">
              <button
                onClick={() => setIsPlayerInfoOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
              <PlayerInfo
                isOpen={isPlayerInfoOpen}
                onClose={() => setIsPlayerInfoOpen(false)}
              />
            </div>
          </div>

          {/* 孵化器面板 */}
          <div
            className={`fixed inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${
              isIncubatorOpen
                ? "opacity-100 z-50"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="bg-slate-900 rounded-lg shadow-xl w-[90%] max-w-6xl h-[90vh] overflow-auto relative">
              <button
                onClick={() => setIsIncubatorOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
              <Incubator toasts={toasts} setToasts={setToasts} />
            </div>
          </div>
        </>
      )}

      {/* 设置面板 */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        toasts={toasts}
        setToasts={setToasts}
      />
    </div>
  );
};

export default App;
