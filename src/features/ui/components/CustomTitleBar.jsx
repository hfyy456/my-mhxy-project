import React, { useState, useEffect } from 'react';
import ThemeSelector from './ThemeSelector';

/**
 * 全屏模式提示组件
 */
const FullScreenHint = ({ isVisible, onHide }) => {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowHint(true);
      // 5秒后自动隐藏
      const timer = setTimeout(() => {
        setShowHint(false);
        onHide && onHide();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  if (!showHint) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '0 0 12px 12px',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        animation: 'slideDown 0.3s ease-out',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <i className="fas fa-info-circle text-blue-400"></i>
      <span>全屏模式 - 按 F11 或 ESC 退出全屏</span>
      <button
        onClick={() => setShowHint(false)}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '4px',
          marginLeft: '8px',
          fontSize: '12px',
        }}
      >
        <i className="fas fa-times"></i>
      </button>
      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * 自定义标题栏组件
 * 符合游戏UI风格的Electron窗口标题栏，兼容全屏模式
 */
const CustomTitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [showFullscreenHint, setShowFullscreenHint] = useState(false);

  // 检测是否为Electron环境
  useEffect(() => {
    setIsElectron(!!window.electronAPI);
  }, []);

  // 窗口控制功能
  const handleMinimize = () => {
    if (window.electronAPI?.window) {
      window.electronAPI.window.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI?.window) {
      if (isMaximized) {
        window.electronAPI.window.unmaximize();
      } else {
      window.electronAPI.window.maximize();
      }
    }
  };

  const handleClose = () => {
    if (window.electronAPI?.window) {
      window.electronAPI.window.close();
    }
  };

  const handleFullscreen = () => {
    if (window.electronAPI?.window) {
      window.electronAPI.window.setFullScreen(!isFullscreen);
    }
  };

  // 监听窗口状态变化
  useEffect(() => {
    if (!window.electronAPI?.window) return;

    // 初始状态检查
    const initWindowState = async () => {
      const maximized = await window.electronAPI.window.isMaximized();
      const fullscreen = await window.electronAPI.window.isFullScreen();
      setIsMaximized(maximized);
      setIsFullscreen(fullscreen);
    };

    // 设置事件监听器
    const removeMaximizeListener = window.electronAPI.window.onMaximize(() => {
      setIsMaximized(true);
    });

    const removeUnmaximizeListener = window.electronAPI.window.onUnmaximize(() => {
      setIsMaximized(false);
    });

    const removeEnterFullScreenListener = window.electronAPI.window.onEnterFullScreen(() => {
      setIsFullscreen(true);
      setShowFullscreenHint(true);
    });

    const removeLeaveFullScreenListener = window.electronAPI.window.onLeaveFullScreen(() => {
      setIsFullscreen(false);
      setShowFullscreenHint(false);
    });

    // 初始化状态
    initWindowState();

    // 清理函数
    return () => {
      removeMaximizeListener && removeMaximizeListener();
      removeUnmaximizeListener && removeUnmaximizeListener();
      removeEnterFullScreenListener && removeEnterFullScreenListener();
      removeLeaveFullScreenListener && removeLeaveFullScreenListener();
    };
  }, []);

  // 快捷键支持
  useEffect(() => {
    if (!isElectron) return;

    const handleKeyDown = (event) => {
      // F11 切换全屏
      if (event.key === 'F11') {
        event.preventDefault();
        handleFullscreen();
      }
      // ESC 退出全屏
      else if (event.key === 'Escape' && isFullscreen) {
        event.preventDefault();
        handleFullscreen();
      }
      // Alt + F4 关闭窗口
      else if (event.altKey && event.key === 'F4') {
        event.preventDefault();
        handleClose();
      }
      // Win + Up 最大化
      else if ((event.metaKey || event.key === 'Meta') && event.key === 'ArrowUp') {
        event.preventDefault();
        if (!isMaximized) handleMaximize();
      }
      // Win + Down 还原/最小化
      else if ((event.metaKey || event.key === 'Meta') && event.key === 'ArrowDown') {
        event.preventDefault();
        if (isMaximized) {
          handleMaximize(); // 还原
        } else {
          handleMinimize(); // 最小化
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isElectron, isMaximized, isFullscreen]);

  // 在全屏模式下隐藏标题栏，但显示提示
  if (isFullscreen) {
    return (
      <FullScreenHint 
        isVisible={showFullscreenHint} 
        onHide={() => setShowFullscreenHint(false)}
      />
    );
  }

  // 在非Electron环境下的简化显示
  if (!isElectron) {
    return (
      <div 
        className="custom-title-bar web-version bg-gradient-theme shadow-md"
        style={{
          position: 'relative',
          height: '40px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid var(--color-primary)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-dreamyPurple-300 to-dreamyPurple-400 rounded-lg flex items-center justify-center shadow-lg">
            <i className="fas fa-dragon text-theme-light text-sm"></i>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-dreamyPurple-200 to-dreamyPurple-100 bg-clip-text text-transparent">
            御灵录单机版
          </span>
        </div>
        
        {/* 主题选择器 */}
        <ThemeSelector />
      </div>
    );
  }

  return (
    <div 
      className="custom-title-bar electron-version bg-gradient-theme shadow-md"
      style={{
        position: 'relative',
        height: '40px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid var(--color-primary)',
        WebkitAppRegion: 'drag',
      }}
    >
      {/* 左侧标题 */}
        <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-dreamyPurple-300 to-dreamyPurple-400 rounded-lg flex items-center justify-center shadow-lg">
          <i className="fas fa-dragon text-theme-light text-sm"></i>
          </div>
        <span className="text-lg font-bold bg-gradient-to-r from-dreamyPurple-200 to-dreamyPurple-100 bg-clip-text text-transparent">
            御灵录单机版
        </span>
        </div>
        
      {/* 中间区域 - 可拖动 */}
      <div className="flex-grow"></div>
      
      {/* 右侧控件 */}
      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' }}>
        {/* 主题选择器 */}
        <ThemeSelector className="mr-4" />
        
        {/* 窗口控制按钮 */}
        <div className="flex">
        <button
          onClick={handleFullscreen}
            className="window-control-button text-theme-light w-10 h-10 flex justify-center items-center opacity-70 hover:opacity-100 transition-opacity bg-transparent border-none"
            title={isFullscreen ? "退出全屏" : "全屏"}
        >
            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
        </button>
        <button
          onClick={handleMinimize}
            className="window-control-button text-theme-light w-10 h-10 flex justify-center items-center opacity-70 hover:opacity-100 transition-opacity bg-transparent border-none"
          title="最小化"
        >
            <i className="fas fa-window-minimize"></i>
        </button>
        <button
          onClick={handleMaximize}
            className="window-control-button text-theme-light w-10 h-10 flex justify-center items-center opacity-70 hover:opacity-100 transition-opacity bg-transparent border-none"
            title={isMaximized ? "还原" : "最大化"}
        >
          <i className={`fas ${isMaximized ? 'fa-window-restore' : 'fa-window-maximize'}`}></i>
        </button>
        <button
          onClick={handleClose}
            className="window-control-button close text-theme-light w-10 h-10 flex justify-center items-center opacity-70 hover:opacity-100 hover:bg-red-500 transition-all bg-transparent border-none"
          title="关闭"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      </div>
    </div>
  );
};

export default CustomTitleBar;
