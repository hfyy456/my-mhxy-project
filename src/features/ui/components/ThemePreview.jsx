/*
 * @Author: Claude
 * @Date: 2025-06-15
 * @Description: 主题预览组件
 */
import React, { useState, useEffect } from 'react';
import { getTheme } from '@/config/themes';

/**
 * 主题预览组件
 * 展示当前主题的所有颜色
 */
const ThemePreview = () => {
  const [currentTheme, setCurrentTheme] = useState(null);
  
  // 监听主题变化
  useEffect(() => {
    const updateTheme = (e) => {
      if (e.detail && e.detail.theme) {
        setCurrentTheme(e.detail.theme);
      } else {
        const themeId = localStorage.getItem('mhxy-theme') || 'default';
        setCurrentTheme(getTheme(themeId));
      }
    };
    
    // 初始化
    updateTheme();
    
    // 监听主题变化事件
    window.addEventListener('theme-changed', updateTheme);
    
    return () => {
      window.removeEventListener('theme-changed', updateTheme);
    };
  }, []);
  
  if (!currentTheme) return null;
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4 text-theme-dark">当前主题: {currentTheme.name}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 基础颜色 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">基础颜色</h4>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-theme-primary"></div>
            <span>主要颜色 (primary)</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {currentTheme.colors.primary}
            </code>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-theme-secondary"></div>
            <span>次要颜色 (secondary)</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {currentTheme.colors.secondary}
            </code>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-theme-neutral"></div>
            <span>中性色 (neutral)</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {currentTheme.colors.neutral}
            </code>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-theme-dark"></div>
            <span className="text-white">深色 (dark)</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {currentTheme.colors.dark}
            </code>
          </div>
          
          <div className="flex items-center space-x-2 border border-gray-200 dark:border-gray-700 p-1 rounded">
            <div className="w-8 h-8 rounded bg-theme-light"></div>
            <span>浅色 (light)</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {currentTheme.colors.light}
            </code>
          </div>
        </div>
        
        {/* 品质颜色 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">品质颜色</h4>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded quality-bg-normal"></div>
            <span className="quality-normal">普通品质 (normal)</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {currentTheme.colors.quality.normal}
            </code>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded quality-bg-rare"></div>
            <span className="quality-rare">稀有品质 (rare)</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {currentTheme.colors.quality.rare}
            </code>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded quality-bg-epic"></div>
            <span className="quality-epic">史诗品质 (epic)</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {currentTheme.colors.quality.epic}
            </code>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded quality-bg-legendary"></div>
            <span className="quality-legendary">传说品质 (legendary)</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {currentTheme.colors.quality.legendary}
            </code>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded quality-bg-mythic"></div>
            <span className="quality-mythic">神话品质 (mythic)</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {currentTheme.colors.quality.mythic}
            </code>
          </div>
        </div>
      </div>
      
      {/* 渐变和特殊效果 */}
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">渐变和特殊效果</h4>
        
        <div className="h-12 rounded bg-gradient-theme flex items-center justify-center text-white font-medium">
          主题渐变背景 (bg-gradient-theme)
        </div>
        
        <div className="flex space-x-4">
          <div className="h-12 w-1/3 rounded bg-theme-primary-50 flex items-center justify-center">
            半透明主色 (bg-theme-primary-50)
          </div>
          <div className="h-12 w-1/3 rounded bg-theme-secondary-50 flex items-center justify-center">
            半透明次色 (bg-theme-secondary-50)
          </div>
          <div className="h-12 w-1/3 rounded bg-theme-dark-50 flex items-center justify-center text-white">
            半透明深色 (bg-theme-dark-50)
          </div>
        </div>
      </div>
      
      {/* 使用指南 */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium mb-2">使用指南</h4>
        <ul className="text-xs space-y-1 list-disc pl-4">
          <li>使用 <code>bg-theme-primary</code> 替代硬编码的背景颜色</li>
          <li>使用 <code>text-theme-primary</code> 替代硬编码的文本颜色</li>
          <li>使用 <code>border-theme-primary</code> 替代硬编码的边框颜色</li>
          <li>品质颜色使用 <code>quality-normal</code>, <code>quality-rare</code> 等类</li>
          <li>使用 <code>bg-gradient-theme</code> 获得主题渐变效果</li>
        </ul>
      </div>
    </div>
  );
};

export default ThemePreview; 