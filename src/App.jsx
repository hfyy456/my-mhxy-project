/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-02 01:59:49
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-15 06:08:26
 */
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { BattleProviderV3 } from './features/battle/v3/providers/BattleProviderV3';
import { BattleSceneV3 } from './features/battle/v3/components/BattleSceneV3';
import { SkillEditor } from './features/skill-editor/components/SkillEditor';
import { BattleLifecycleContext } from './features/battle/v3/context/BattleLifecycleContext';

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

// 导入主题系统
import { initTheme } from "@/config/themes";

// 导入自定义样式
import "./styles/customScrollbar.css";

const App = () => {
  const dispatch = useDispatch();
  
  // 页面状态管理
  const [showHomePage, setShowHomePage] = useState(true);
  const [showDungeonDemo, setShowDungeonDemo] = useState(false);
  const [showV3Test, setShowV3Test] = useState(false);
  const [showSkillEditor, setShowSkillEditor] = useState(false);
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

  // 新增：用于重置战斗测试状态机的 key
  const [battleTestKey, setBattleTestKey] = useState(0);

  // 新增：V3战斗初始化数据和结果处理
  const [battleInitData, setBattleInitData] = useState(null);

  // Toast系统
  const [toasts, setToasts] = useState([]);
  const { showResult } = useToast(toasts, setToasts);
  
  // 游戏状态管理
  const [gameInitialized, setGameInitialized] = useState(false);

  // 组件挂载时的基础检查
  useEffect(() => {
    console.log("[App.jsx] 应用组件已挂载，等待用户启动游戏");
    
    // 初始化主题系统
    initTheme();
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

  // 新增切换函数
  const handleToggleV3Test = (show) => {
    setShowV3Test(show);
  };

  // Function to toggle between battle test and skill editor
  const handleToggleEditor = () => {
    setShowSkillEditor(prev => !prev);
  };

  // 新增：重置战斗测试状态机的函数
  const restartBattleTest = () => {
    setBattleTestKey(prevKey => prevKey + 1);
  };

  // 新增：将单位数组转换为V3引擎所需的对象格式
  const formatUnitsForV3 = (unitsArray) => {
    if (!Array.isArray(unitsArray)) {
      console.warn("formatUnitsForV3: input is not an array, returning it as is.", unitsArray);
      return unitsArray; // 如果已经是对象格式，则直接返回
    }
    return unitsArray.reduce((acc, unit) => {
      acc[unit.id] = unit;
      return acc;
    }, {});
  };

  // 新增：启动V3战斗的函数
  const startV3Battle = (initData) => {
    console.log('[App.jsx] 接收到战斗启动请求，原始数据:', initData);
    
    const formattedData = {
      ...initData,
      playerUnits: formatUnitsForV3(initData.playerUnits),
      enemyUnits: formatUnitsForV3(initData.enemyUnits),
    };
    
    console.log('[App.jsx] 格式化后，准备传递给战斗引擎的数据:', formattedData);
    setBattleInitData(formattedData);
    setShowV3Test(true);
  };

  // 新增：处理V3战斗结束的函数
  const handleV3BattleComplete = (result) => {
    console.log('[App.jsx] 战斗结束，结果:', result);
    // 在这里可以根据 result 更新主游戏状态，例如分发 redux action
    setShowV3Test(false);
    setBattleInitData(null);
  };

  // For simplicity, let's focus on the Battle/Editor part
  if (showV3Test) {
    return (
      <BattleLifecycleContext.Provider value={{ restartBattle: restartBattleTest }}>
        <BattleProviderV3 key={battleTestKey}>
          <div style={{ padding: '10px' }}>
            <button onClick={handleToggleEditor} style={{ marginBottom: '10px', padding: '10px' }}>
              {showSkillEditor ? '切换到战斗测试' : '切换到技能编辑器'}
            </button>
          </div>
          {showSkillEditor ? <SkillEditor /> : <BattleSceneV3 initialData={battleInitData} onComplete={handleV3BattleComplete} />}
        </BattleProviderV3>
      </BattleLifecycleContext.Provider>
    );
  }

  // The rest of the original return logic for the main game
  return (
    <BattleProviderV3>
      {isLoading && (
        <LoadingScreen 
          progress={loadingProgress}
          message={loadingMessage}
          mapGenerationState={mapGenerationState}
        />
      )}

      {!isLoading && !showV3Test && showDungeonDemo && <DungeonDemo onExit={handleExitDungeonDemo}/>}

      {!isLoading && !showV3Test && !showDungeonDemo && showHomePage && (
        <StartMenuPage 
          onStartGame={handleStartGame}
          showToast={showResult}
        />
      )}
      
      {!isLoading && !showV3Test && !showDungeonDemo && !showHomePage && (
        <GamePage 
          showToast={showResult}
          toasts={toasts}
          setToasts={setToasts}
          gameInitialized={gameInitialized}
          onStartDungeonDemo={handleStartDungeonDemo}
          onExitDungeonDemo={handleExitDungeonDemo}
          onStartV3Battle={startV3Battle}
        />
      )}
      
      {/* 全局Toast容器 */}
      <ToastContainer toasts={toasts} setToasts={setToasts} />
    </BattleProviderV3>
  );
};

export default App;
