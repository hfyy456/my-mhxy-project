import React, { useState, useEffect } from 'react';

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
        className="custom-title-bar web-version"
        style={{
          position: 'relative',
          height: '40px',
          width: '100%',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
          borderBottom: '1px solid #334155',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <i className="fas fa-dragon text-white text-sm"></i>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            梦幻西游单机版
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="custom-title-bar electron-version"
      style={{
        position: 'relative',
        height: '40px',
        width: '100%',
        flexShrink: 0,
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 9999,
        WebkitAppRegion: 'drag',
        borderBottom: '1px solid #334155',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        userSelect: 'none',
      }}
    >
      {/* 左侧: 游戏标题和状态 */}
      <div className="title-section" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <i className="fas fa-dragon text-white text-sm"></i>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            梦幻西游单机版
        </span>
        </div>
        
        {/* 连接状态指示器 */}
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-700/50 rounded-full border border-slate-600">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-300 font-medium">本地模式</span>
        </div>
      </div>

      {/* 右侧: 窗口控制按钮 */}
      <div 
        className="window-controls" 
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '4px',
          WebkitAppRegion: 'no-drag'
        }}
      >
        {/* 全屏切换按钮 */}
        <button
          onClick={handleFullscreen}
          className="window-control-btn"
          style={{
            width: '32px',
            height: '32px',
            border: 'none',
            background: 'none',
            color: '#94a3b8',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
            e.currentTarget.style.color = '#e2e8f0';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="切换全屏"
        >
          <i className="fas fa-expand"></i>
        </button>

        {/* 最小化按钮 */}
        <button
          onClick={handleMinimize}
          className="window-control-btn"
          style={{
            width: '32px',
            height: '32px',
            border: 'none',
            background: 'none',
            color: '#94a3b8',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
            e.currentTarget.style.color = '#e2e8f0';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="最小化"
        >
          <i className="fas fa-minus"></i>
        </button>

        {/* 最大化/还原按钮 */}
        <button
          onClick={handleMaximize}
          className="window-control-btn"
          style={{
            width: '32px',
            height: '32px',
            border: 'none',
            background: 'none',
            color: '#94a3b8',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
            e.currentTarget.style.color = '#e2e8f0';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={isMaximized ? "还原窗口" : "最大化"}
        >
          <i className={`fas ${isMaximized ? 'fa-window-restore' : 'fa-window-maximize'}`}></i>
        </button>

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="window-control-btn close-btn"
          style={{
            width: '32px',
            height: '32px',
            border: 'none',
            background: 'none',
            color: '#94a3b8',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="关闭"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      {/* 装饰性边框 */}
      <div 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%)'
        }}
      />
    </div>
  );
};

export default CustomTitleBar;
