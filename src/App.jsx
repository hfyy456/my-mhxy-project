/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-02 01:59:49
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-07 03:19:40
 */
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

// 导入页面组件
import StartMenuPage from "./pages/StartMenuPage";
import GamePage from "./pages/GamePage";
import DungeonDemo from "./features/dungeon/DungeonDemo";

// 导入全局组件和工具
import LoadingScreen from "@/features/ui/components/LoadingScreen";
import ToastContainer from "@/features/ui/components/ToastContainer";
import { useToast } from "@/hooks/useToast";
import {
  initializeReduxIntegration,
} from "@/store/reduxSetup";
import { initializePlayerQuests } from "@/store/slices/questSlice";

// 导入自定义样式
import "./styles/customScrollbar.css";

const App = () => {
  const dispatch = useDispatch();
  
  // 页面状态管理
  const [showHomePage, setShowHomePage] = useState(true);
  const [showDungeonDemo, setShowDungeonDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("正在加载游戏资源...");
  const [mapGenerationState, setMapGenerationState] = useState({
    isGenerating: false,
    currentRegion: '',
    currentRegionName: '',
    totalRegions: 0,
    completedRegions: 0,
    progress: 0
  });

  // Toast系统
  const [toasts, setToasts] = useState([]);
  const { showResult } = useToast(toasts, setToasts);
  
  // 游戏状态管理 - 只在游戏开始后初始化
  const [gameInitialized, setGameInitialized] = useState(false);

  // 组件挂载时的基础检查
  useEffect(() => {
    console.log("[App.jsx] 应用组件已挂载，等待用户启动游戏");
  }, []);

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

  // 游戏资源加载逻辑
  const loadGameResources = async () => {
    setIsLoading(true);
    
    try {
      // 导入加载管理器
      const { default: loadingManager } = await import('@/utils/loadingManager');
      
      // 设置加载管理器的回调函数
      loadingManager.setProgressCallback(setLoadingProgress);
      loadingManager.setMessageCallback(setLoadingMessage);
      loadingManager.setMapGenerationCallback(setMapGenerationState);

      // 执行完整的加载流程
      const result = await loadingManager.execute();
      
      if (result.success) {
        // Redux集成初始化
        const cleanup = initializeReduxIntegration();
        dispatch(initializePlayerQuests());
        
        console.log('[App] 游戏资源加载成功');
        console.log('[App] 加载报告:', result.report);
        
        // 标记游戏已初始化
        setGameInitialized(true);
        
        // 完成加载
        setIsLoading(false);
        setShowHomePage(false);
        
        return cleanup;
      } else {
        console.warn('[App] 游戏资源加载部分失败，但仍允许启动');
        console.error('[App] 加载错误:', result.error);
        
        // 即使部分失败也尝试启动游戏
        const cleanup = initializeReduxIntegration();
        dispatch(initializePlayerQuests());
        
        // 标记游戏已初始化
        setGameInitialized(true);
        
        setIsLoading(false);
        setShowHomePage(false);
        
        return cleanup;
      }
      
    } catch (error) {
      console.error('[App] 加载管理器执行失败:', error);
      
      // 回退到简单的启动逻辑
      setLoadingProgress(100);
      setLoadingMessage("正在以简化模式启动游戏...");

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const cleanup = initializeReduxIntegration();
      dispatch(initializePlayerQuests());
      
      // 标记游戏已初始化
      setGameInitialized(true);
      
      setIsLoading(false);
      setShowHomePage(false);
      
      return cleanup;
    }
  };

  // 开始新游戏
  const handleStartGame = async () => {
    await loadGameResources();
  };

  const handleStartDungeonDemo = () => {
    setShowDungeonDemo(true);
  };

  const handleExitDungeonDemo = () => {
    setShowDungeonDemo(false);
  }

  // 渲染页面
  const renderCurrentPage = () => {
    if (isLoading) {
      return (
        <LoadingScreen 
          progress={loadingProgress}
          message={loadingMessage}
          mapGenerationState={mapGenerationState}
        />
      );
    }

    if (showDungeonDemo) {
      return <DungeonDemo onExit={handleExitDungeonDemo}/>
    }

    if (showHomePage) {
      return (
        <StartMenuPage 
          onStartGame={handleStartGame}
          showToast={showResult}
        />
      );
    }

    return (
      <GamePage 
        showToast={showResult}
        toasts={toasts}
        setToasts={setToasts}
        gameInitialized={gameInitialized} // 传递游戏初始化状态
        onStartDungeonDemo={handleStartDungeonDemo}
        onExitDungeonDemo={handleExitDungeonDemo}
      />
    );
  };

  return (
    <>
      {renderCurrentPage()}
      
      {/* 全局Toast容器 */}
      <ToastContainer toasts={toasts} setToasts={setToasts} />
    </>
  );
};

export default App;
