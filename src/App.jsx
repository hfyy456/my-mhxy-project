import React, { useState, useEffect } from "react";
import MainMenu from "./components/MainMenu";
import SummonSystem from "./features/summon/components/SummonSystem";
import { useGameState } from "./hooks/useGameState";
import { useToast } from "./hooks/useToast";
import { useModalState } from "./hooks/useModalState";
import { useGameActions } from "./hooks/useGameActions";
import ToastContainer from "./components/ToastContainer";
import InventoryPanel from "./components/InventoryPanel";
import Inventory from "./entities/Inventory";
import { generateInitialEquipment } from "./gameLogic";

const App = () => {
  const [currentSystem, setCurrentSystem] = useState("main");
  const [toasts, setToasts] = useState([]);
  const { gameManager, summon, setSummon, historyList, resultRecordList } =
    useGameState();
  const { showResult } = useToast(toasts, setToasts, gameManager);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [inventory] = useState(new Inventory());
  // 添加状态以持有背包数据的快照，用于触发UI更新
  const [inventoryState, setInventoryState] = useState(inventory.getState());

  // 初始化背包及设置onChange回调
  useEffect(() => {
    // 生成5件随机装备并添加到背包
    const initialEquipment = generateInitialEquipment(5);
    initialEquipment.forEach((equipment) => {
      const result = inventory.addItem({
        ...equipment,
        type: "equipment",
      });
      if (result.success) {
        showResult(`获得装备：${equipment.name} (${equipment.quality})`);
      }
    });

    // 设置 inventory 的 onChange 回调以更新UI
    const handleInventoryChange = (newState) => {
      setInventoryState(newState);
      console.log("[App.jsx] Inventory changed, UI state updated.");
    };
    inventory.setOnChange(handleInventoryChange);

    // 组件卸载时清理回调
    return () => {
      inventory.setOnChange(null);
    };
    // 注意：这里的依赖项。如果 showResult 或 inventory 实例本身会变，需要加入。
    // 但 inventory 是 useState(new Inventory()) 创建的，通常不会变。
    // showResult 来自 useToast，如果其依赖会变，也可能需要考虑。为简化，暂时只放 inventory。
  }, [inventory]); // 依赖 inventory 实例，确保仅在 inventory 初始化后设置回调

  // 添加调试日志
  useEffect(() => {
    console.log("[App] toasts updated:", toasts);
  }, [toasts]);

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

  const {
    handleRefineMonster,
    handleBookSkill,
    handleConfirmReplaceSkill,
    handleLevelUp,
    handleEquipItem: handleEquipItemFromActions,
    handleAllocatePoint,
    handleResetPoints,
    handleOpenSummonSystem,
    handleBackToMain,
  } = useGameActions(gameManager, showResult, setSummon);

  const handleSystemChange = (system) => {
    setCurrentSystem(system);
  };

  // 处理装备物品
  const handleEquipItem = (inventoryItem) => {
    if (!summon) {
      showResult("请先选择一个召唤兽", "error");
      return { success: false, message: "请先选择一个召唤兽" };
    }

    if (!inventoryItem || inventoryItem.itemType !== "equipment") {
      showResult("无效的装备物品", "error");
      return { success: false, message: "无效的装备物品" };
    }

    const equipmentEntity = inventoryItem.getEquipmentEntity();

    if (!equipmentEntity) {
      showResult("无法获取装备的详细信息", "error");
      console.error(
        "[App.jsx] Failed to get EquipmentEntity for InventoryItem:",
        inventoryItem
      );
      return { success: false, message: "无法获取装备的详细信息" };
    }

    //  slotType 现在应该直接从 equipmentEntity 获取，因为它是装备本身的属性
    const slotTypeToUse = equipmentEntity.slotType;
    //  或者，如果 EquipmentEntity 实例没有直接存储 slotType （它应该从 baseConfig 获取），
    //  我们也可以从 inventoryItem.slotType 获取（如果 InventoryItem 存储了它）
    //  EquipmentEntity 从 baseConfig 中可以获取 category (即 slotType)
    //  const slotTypeToUse = equipmentEntity.category; // EquipmentEntity 内部有 this.category (即 slotType)
    //  确保 EquipmentEntity 有一个可访问的 slotType 或 category 属性。
    //  当前 EquipmentEntity.js (line 15) sets this.category = category;

    if (!slotTypeToUse) {
      showResult("装备缺少类型信息", "error");
      console.error(
        "[App.jsx] EquipmentEntity is missing slotType/category:",
        equipmentEntity
      );
      return { success: false, message: "装备缺少类型信息" };
    }

    try {
      // gameManager (src/game/GameManager.js) equipItem(itemData, slotType)
      // itemData is used to find itemIndex in summon's equipment list.
      // We should pass the equipmentEntity itself, and GameManager will use its ID.
      const result = gameManager.equipItem(equipmentEntity, slotTypeToUse);

      if (result.success) {
        showResult(result.message || "装备成功", "success");
        // setSummon(result.updatedSummon); // GameManager不再返回updatedSummon，Summon实例是直接修改并通过事件更新

        // 更新刚被装备上的物品在背包中的状态
        inventoryItem.setEquipped(true, summon);
        console.log(
          `[App.jsx] InventoryItem for equipped entity ${equipmentEntity.id} (${inventoryItem.name}) marked as equipped.`
        );

        // 如果有旧物品被替换下来，更新其在背包中的状态
        if (result.unequippedItemEntityId) {
          const unequippedInventoryItem = inventory.findItemByEntityId(
            result.unequippedItemEntityId
          );
          if (unequippedInventoryItem) {
            unequippedInventoryItem.setEquipped(false, null);
            console.log(
              `[App.jsx] InventoryItem for unequipped entity ${result.unequippedItemEntityId} (${unequippedInventoryItem.name}) marked as unequipped.`
            );
          } else {
            console.warn(
              `[App.jsx] Failed to find InventoryItem in global inventory for UNequipped entity ID: ${result.unequippedItemEntityId}. This item might not be managed by the main inventory, or was an initial equipment not added to global inventory.`
            );
          }
        }
        // inventory.notifyChange(); // 移除：现在通过 setOnChange 自动处理UI更新

        return {
          success: true,
          message: result.message,
          equippedItemEntityId: result.equippedItemEntityId, // 与GameManager的返回保持一致
          unequippedItemEntityId: result.unequippedItemEntityId,
        };
      } else {
        showResult(result.message || "装备失败", "error");
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("装备物品失败 (App.jsx):", error);
      showResult("装备物品时发生意外错误", "error");
      return { success: false, message: "装备物品时发生意外错误" };
    }
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
          summon={summon}
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
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-xl shadow-lg 
          flex items-center gap-3 transition-all duration-200 hover:scale-105 hover:shadow-xl
          border border-purple-500/30"
      >
        <i className="fas fa-backpack text-xl"></i>
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
          currentSummon={summon}
          onEquipItem={handleEquipItem}
          inventory={inventory}
        />
      </div>
    </div>
  );
};

export default App;
