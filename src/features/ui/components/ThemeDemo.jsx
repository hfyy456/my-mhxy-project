import React from 'react';
import { getThemeList, getTheme, applyTheme } from '@/config/themes';

/**
 * 主题演示组件
 * 展示当前主题的所有颜色和可用的工具类
 */
const ThemeDemo = () => {
  const themeList = getThemeList();
  const currentThemeId = localStorage.getItem('mhxy-theme') || 'default';
  const currentTheme = getTheme(currentThemeId);
  
  const handleThemeChange = (themeId) => {
    applyTheme(themeId);
  };
  
  return (
    <div className="p-4 card-dreamy">
      <h2 className="text-xl font-bold mb-4 text-theme-primary">主题演示</h2>
      
      {/* 主题选择器 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2 text-theme-secondary">选择主题</h3>
        <div className="flex gap-2">
          {themeList.map(theme => (
            <button
              key={theme.id}
              className={`px-3 py-1.5 rounded transition-colors ${
                theme.id === currentThemeId
                  ? 'bg-theme-primary text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
              onClick={() => handleThemeChange(theme.id)}
            >
              {theme.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* 颜色展示 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2 text-theme-secondary">主题颜色</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ColorSwatch name="主色" colorClass="bg-theme-primary" colorValue={currentTheme.colors.primary} />
          <ColorSwatch name="次要色" colorClass="bg-theme-secondary" colorValue={currentTheme.colors.secondary} />
          <ColorSwatch name="中性色" colorClass="bg-theme-neutral" colorValue={currentTheme.colors.neutral} />
          <ColorSwatch name="深色" colorClass="bg-theme-dark" colorValue={currentTheme.colors.dark} />
          <ColorSwatch name="浅色" colorClass="bg-theme-light" colorValue={currentTheme.colors.light} />
        </div>
      </div>
      
      {/* 品质颜色展示 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2 text-theme-secondary">品质颜色</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ColorSwatch name="普通" colorClass="quality-bg-normal" colorValue={currentTheme.colors.quality.normal} />
          <ColorSwatch name="稀有" colorClass="quality-bg-rare" colorValue={currentTheme.colors.quality.rare} />
          <ColorSwatch name="史诗" colorClass="quality-bg-epic" colorValue={currentTheme.colors.quality.epic} />
          <ColorSwatch name="传说" colorClass="quality-bg-legendary" colorValue={currentTheme.colors.quality.legendary} />
          <ColorSwatch name="神话" colorClass="quality-bg-mythic" colorValue={currentTheme.colors.quality.mythic} />
        </div>
      </div>
      
      {/* 工具类演示 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2 text-theme-secondary">工具类演示</h3>
        
        <div className="space-y-4">
          {/* 背景颜色 */}
          <div>
            <h4 className="font-medium mb-1">背景颜色</h4>
            <div className="flex flex-wrap gap-2">
              <div className="bg-theme-primary text-white px-3 py-1 rounded">bg-theme-primary</div>
              <div className="bg-theme-secondary text-white px-3 py-1 rounded">bg-theme-secondary</div>
              <div className="bg-theme-dark text-white px-3 py-1 rounded">bg-theme-dark</div>
              <div className="bg-theme-neutral text-theme-dark px-3 py-1 rounded">bg-theme-neutral</div>
              <div className="bg-theme-light text-theme-dark px-3 py-1 rounded border">bg-theme-light</div>
            </div>
          </div>
          
          {/* 文本颜色 */}
          <div>
            <h4 className="font-medium mb-1">文本颜色</h4>
            <div className="flex flex-wrap gap-4">
              <div className="text-theme-primary">text-theme-primary</div>
              <div className="text-theme-secondary">text-theme-secondary</div>
              <div className="text-theme-dark">text-theme-dark</div>
              <div className="text-theme-neutral bg-gray-800 px-2">text-theme-neutral</div>
              <div className="text-theme-light bg-gray-800 px-2">text-theme-light</div>
            </div>
          </div>
          
          {/* 边框颜色 */}
          <div>
            <h4 className="font-medium mb-1">边框颜色</h4>
            <div className="flex flex-wrap gap-2">
              <div className="border-2 border-theme-primary px-3 py-1 rounded">border-theme-primary</div>
              <div className="border-2 border-theme-secondary px-3 py-1 rounded">border-theme-secondary</div>
              <div className="border-2 border-theme-dark px-3 py-1 rounded">border-theme-dark</div>
              <div className="border-2 border-theme-neutral px-3 py-1 rounded">border-theme-neutral</div>
              <div className="border-2 border-theme-light px-3 py-1 rounded bg-gray-800 text-white">border-theme-light</div>
            </div>
          </div>
          
          {/* 渐变背景 */}
          <div>
            <h4 className="font-medium mb-1">渐变背景</h4>
            <div className="flex flex-wrap gap-2">
              <div className="bg-gradient-theme text-white px-3 py-1 rounded">bg-gradient-theme</div>
              <div className="bg-gradient-dreamy text-white px-3 py-1 rounded">bg-gradient-dreamy</div>
            </div>
          </div>
          
          {/* 低调梦幻紫专用类 */}
          <div>
            <h4 className="font-medium mb-1">低调梦幻紫专用类</h4>
            <div className="flex flex-wrap gap-2">
              <button className="btn-dreamy">btn-dreamy</button>
              <div className="card-dreamy inline-block">card-dreamy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 颜色色块组件
const ColorSwatch = ({ name, colorClass, colorValue }) => {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-16 h-16 rounded-lg shadow-md ${colorClass}`}></div>
      <div className="mt-1 text-sm font-medium">{name}</div>
      <div className="text-xs text-gray-500">{colorValue}</div>
    </div>
  );
};

export default ThemeDemo; 