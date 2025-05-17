import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import MainMenu from "@/features/main-menu/components/MainMenu";
import SummonSystem from "@/features/summon/components/SummonSystem";
import { useToast } from "@/hooks/useToast";
import { useModalState } from "@/hooks/useModalState";
import ToastContainer from "@/features/ui/components/ToastContainer";
import InventoryPanel from "@/features/inventory/components/InventoryPanel";
// import Inventory from "@/entities/Inventory"; // Removed
import { generateInitialEquipment } from "@/gameLogic";
// 引入Redux集成和选择器
import { initializeReduxIntegration, useCurrentSummon, useSummons } from "@/store/reduxSetup";
import { setCurrentSummon } from "@/store/slices/summonSlice";
import { addItem } from "@/store/slices/itemSlice";
import { addToInventory } from "@/store/slices/inventorySlice";

const App = () => {
  const dispatch = useDispatch();
  const [currentSystem, setCurrentSystem] = useState("main");
  const [toasts, setToasts] = useState([]);
  const { showResult } = useToast(toasts, setToasts);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  // const [inventory] = useState(new Inventory()); // Removed
  
  // 从Redux获取召唤兽数据
  const summons = useSummons();
  const summon = useCurrentSummon();

  // 初始化背包及设置物品
  useEffect(() => {
    // 生成5件随机装备并添加到Redux
    const initialEquipment = generateInitialEquipment(5);
    initialEquipment.forEach((equipment) => {
      // 添加物品到Redux
      dispatch(addItem({
        ...equipment,
        id: equipment.id,
        type: "equipment",
      }));
      
      // 添加物品到背包 - 使用自动分配的空槽位
      dispatch(addToInventory({
        itemId: equipment.id
      }));
    });
    
    showResult("初始装备已添加到背包");
    // 只在组件第一次渲染时执行一次
  }, []);

  // 初始化Redux集成
  useEffect(() => {
    // 将现有系统与Redux集成
    const cleanup = initializeReduxIntegration(); // Removed inventory instance argument
    console.log("[App.jsx] Redux集成已初始化");
    
    // 组件卸载时清理
    return cleanup;
  }, []); // Removed inventory from dependency array

  const {
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isResultRecordModalOpen,
    setIsResultRecordModalOpen,
    isSkillCatalogModalOpen,
    setIsSkillCatalogModalOpen,
    isPetCatalogModalOpen,
    setIsPetCatalogModalOpen,
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    isMoreFeaturesOpen,
    setIsMoreFeaturesOpen,
  } = useModalState();

  const handleSystemChange = (system) => {
    if (system === "summon") {
      if (summons.length > 0) {
        // 如果当前没有选中召唤兽，则选择第一个
        if (!summon) {
          dispatch(setCurrentSummon(summons[0].id));
          console.log("[App.jsx] Switched to Summon System, selected first summon:", summons[0]);
        }
      } else {
        // 如果没有召唤兽，确保当前选中为null
        if (summon) {
          dispatch(setCurrentSummon(null));
          console.log("[App.jsx] Switched to Summon System, no summons available");
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

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "#0f172a",
      }}
    >
      {currentSystem === "main" ? (
        <MainMenu onOpenSummonSystem={() => handleSystemChange("summon")} />
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

      {/* 添加背包按钮 */}
      <button
        onClick={() => setIsInventoryOpen(true)}
        className="fixed bottom-6 right-6 bg-slate-800/90 hover:bg-slate-700/90 
          text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2.5 
          transition-all duration-200 border border-slate-600/30 group"
      >
        <i className="fas fa-backpack text-lg text-purple-400"></i>
        <span className="font-medium">背包</span>
      </button>

      {/* 背包面板 */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${
          isInventoryOpen ? "" : "hidden"
        }`}
      >
        <InventoryPanel
          isOpen={isInventoryOpen}
          onClose={() => setIsInventoryOpen(false)}
        />
      </div>
    </div>
  );
};

export default App;
