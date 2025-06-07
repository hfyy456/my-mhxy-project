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
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#0f172a",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* 自定义标题栏 */}
      <CustomTitleBar />
      
      {/* 开始菜单内容区 */}
      <div 
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden"
        }}
      >
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