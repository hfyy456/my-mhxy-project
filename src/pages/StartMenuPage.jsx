/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-07 03:12:26
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-07 04:02:14
 */
/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-07 03:15:00
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-07 03:15:00
 */
import React, { useState } from "react";
import HomePage from "@/features/home/components/HomePage";
import SettingsPanel from "@/features/settings/components/SettingsPanel";
import CommonModal from "@/features/ui/components/CommonModal";
import CustomTitleBar from "@/features/ui/components/CustomTitleBar";
import { uiText } from "@/config/ui/uiTextConfig";

const StartMenuPage = ({ onStartGame, showToast }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openSettingsModal = () => setIsSettingsOpen(true);
  const closeSettingsModal = () => setIsSettingsOpen(false);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900 flex flex-col">
      {/* 自定义标题栏 */}
      <CustomTitleBar />
      
      {/* 开始菜单内容区 */}
      <div className="flex-1 relative overflow-hidden">
        <HomePage
          onStartGame={onStartGame}
          onOpenSettings={openSettingsModal}
          showToast={showToast}
        />

        {/* 设置模态框 */}
        <CommonModal 
          isOpen={isSettingsOpen} 
          onClose={closeSettingsModal}
          title={uiText.titles.settingsModal}
          maxWidthClass="max-w-3xl"
          centerContent={true}
        >
          <SettingsPanel />
        </CommonModal>
      </div>
    </div>
  );
};

export default StartMenuPage; 