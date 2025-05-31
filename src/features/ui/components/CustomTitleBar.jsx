import React, { useState, useEffect } from 'react';

/**
 * 自定义标题栏组件
 * 符合游戏UI风格的Electron窗口标题栏
 */
const CustomTitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  // 窗口控制功能
  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.window.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.window.maximize();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.window.close();
    }
  };

  // 检查窗口是否最大化
  useEffect(() => {
    const checkMaximized = () => {
      if (window.electronAPI) {
        // 这里我们通过窗口大小与屏幕大小的比较来估计是否最大化
        const isMax = window.innerWidth === window.screen.availWidth && 
                      window.innerHeight === window.screen.availHeight;
        setIsMaximized(isMax);
      }
    };

    checkMaximized();
    window.addEventListener('resize', checkMaximized);
    return () => window.removeEventListener('resize', checkMaximized);
  }, []);

  return (
    <div 
      className="custom-title-bar" 
      style={{
        position: 'relative',
        height: '32px',
        width: '100%',
        flexShrink: 0,
        backgroundColor: '#4a2c2a',
        background: 'linear-gradient(to bottom, #6a3c3a, #4a2c2a)', // 梦幻西游风格的深红色渐变
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px',
        zIndex: 9999,
        WebkitAppRegion: 'drag', // 允许拖动窗口
        borderBottom: '1px solid #8a5c5a',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        margin: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* 左侧: 游戏标题 */}
      <div className="title-section" style={{ display: 'flex', alignItems: 'center' }}>
        {/* 使用文字图标替代图片 */}
        <span style={{
          fontSize: '18px',
          marginRight: '8px',
          color: '#ffcc99',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
        }}>
          🏮
        </span>
        <span style={{ 
          color: '#ffcc99', 
          fontSize: '14px', 
          fontWeight: 'bold',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
        }}>
          【梦幻西游】单机版
        </span>
      </div>

      {/* 右侧: 窗口控制按钮 */}
      <div 
        className="window-controls" 
        style={{ 
          display: 'flex', 
          WebkitAppRegion: 'no-drag' // 按钮区域不可拖动
        }}
      >
        {/* 最小化按钮 */}
        <button
          onClick={handleMinimize}
          className="window-control-btn"
          style={{
            width: '30px',
            height: '26px',
            border: 'none',
            background: 'none',
            color: '#ffcc99',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 2px',
            borderRadius: '3px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 215, 180, 0.15)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#ffcc99';
          }}
        >
          <span style={{ transform: 'translateY(-2px)', fontSize: '16px' }}>—</span>
        </button>

        {/* 最大化/还原按钮 */}
        <button
          onClick={handleMaximize}
          className="window-control-btn"
          style={{
            width: '30px',
            height: '26px',
            border: 'none',
            background: 'none',
            color: '#ffcc99',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 2px',
            borderRadius: '3px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 215, 180, 0.15)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#ffcc99';
          }}
        >
          {isMaximized ? '❐' : '□'}
        </button>

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="window-control-btn"
          style={{
            width: '30px',
            height: '26px',
            border: 'none',
            background: 'none',
            color: '#ffcc99',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 2px',
            borderRadius: '3px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(200, 40, 40, 0.9)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#ffcc99';
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default CustomTitleBar;
