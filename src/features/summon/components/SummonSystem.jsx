/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:06:55
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-17 06:18:10
 */
import React from "react";
import SummonInfo from "./SummonInfo";
import PetCatalog from "./PetCatalog";
import HistoryModal from "./HistoryModal";
import { useSummonSystem } from "../hooks/useSummonSystem";

const SummonSystem = ({ summon: summonFromProps, onBackToMain, toasts, setToasts }) => {
  const {
    // summon, // Already commented out or removed implicitly by not using it
    historyList,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isPetCatalogModalOpen,
    setIsPetCatalogModalOpen,
    handleEquipItem,
    handleAllocatePoint,
    handleResetPoints,
    handleLevelUp,
    handleRefineMonster,
    handleBookSkill
  } = useSummonSystem(toasts, setToasts);

  return (
    <div className="game-viewport bg-slate-900 min-h-screen">
      <main className="game-panel rounded-xl shadow-2xl shadow-purple-500/20 relative">
        <div className="bg-gradient-to-br from-slate-800 via-purple-900/50 to-slate-800 rounded-xl p-3 shadow-lg flex-grow flex flex-col">
          <div className="flex-grow overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={onBackToMain}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-lg text-sm transition-colors duration-200 flex items-center"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                返回主菜单
              </button>
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
              <i className="fa-solid fa-dragon text-amber-400 mr-2" />
              <span>召唤兽系统</span>
            </h2>
            <SummonInfo
              summon={summonFromProps}
              onEquipItem={handleEquipItem}
              onAllocatePoint={handleAllocatePoint}
              onResetPoints={handleResetPoints}
              onLevelUp={handleLevelUp}
            />
            <div className="flex justify-center mt-4 mb-4 gap-4">
              <button
                id="refineBtn"
                className="px-6 py-3 bg-slate-700 hover:bg-amber-600 text-gray-100 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500/50 flex items-center border-2 border-slate-600 hover:border-amber-500"
                onClick={handleRefineMonster}
              >
                <i className="fa-solid fa-flask mr-2"></i> 炼妖
              </button>
              <button
                id="bookBtn"
                className="px-6 py-3 bg-purple-700 text-gray-100 rounded-lg border-2 border-purple-500 shadow-lg hover:bg-purple-600 hover:shadow-purple-400/40 hover:scale-105 transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-purple-400 flex items-center"
                onClick={handleBookSkill}
              >
                <i className="fa-solid fa-book mr-2"></i> 打书
              </button>
              <button
                id="levelUpBtn"
                className="px-6 py-3 bg-blue-700 text-gray-100 rounded-lg border-2 border-blue-500 shadow-lg hover:bg-blue-600 hover:shadow-blue-400/40 hover:scale-105 transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center"
                onClick={handleLevelUp}
              >
                <i className="fa-solid fa-arrow-up mr-2"></i> 升级
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 历史记录模态框 */}
      <HistoryModal
        historyList={historyList}
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* 召唤兽图鉴模态框 */}
      <PetCatalog
        isOpen={isPetCatalogModalOpen}
        onClose={() => setIsPetCatalogModalOpen(false)}
      />
    </div>
  );
};

export default SummonSystem; 