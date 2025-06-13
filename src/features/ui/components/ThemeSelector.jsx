/*
 * @Author: Claude
 * @Date: 2025-06-15
 * @Description: 主题选择器组件
 */
import React, { useState, useEffect } from 'react';
import { getThemeList, getTheme, applyTheme } from '@/config/themes';

/**
 * 主题选择器组件
 * @param {Object} props - 组件属性
 * @returns {JSX.Element} 主题选择器组件
 */
const ThemeSelector = ({ className = '' }) => {
  const [themes, setThemes] = useState([]);
  const [currentThemeId, setCurrentThemeId] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // 初始化主题列表和当前主题
  useEffect(() => {
    const themeList = getThemeList();
    setThemes(themeList);
    
    // 从localStorage获取当前主题
    const savedTheme = localStorage.getItem('mhxy-theme') || 'default';
    setCurrentThemeId(savedTheme);
  }, []);

  // 切换主题
  const handleThemeChange = (themeId) => {
    applyTheme(themeId);
    setCurrentThemeId(themeId);
    setIsOpen(false);
  };

  // 获取当前主题名称
  const getCurrentThemeName = () => {
    const currentTheme = themes.find(theme => theme.id === currentThemeId);
    return currentTheme ? currentTheme.name : '默认主题';
  };

  return (
    <div className={`relative ${className}`}>
      <button
        className="flex items-center px-3 py-1.5 rounded-md bg-neutral-700 bg-opacity-50 hover:bg-opacity-70 text-white text-sm transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="mr-2">主题</span>
        <span className="font-medium">{getCurrentThemeName()}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg z-50 py-1 animate-fadeInScaleUp">
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${
                theme.id === currentThemeId ? 'bg-neutral-200 dark:bg-neutral-700 font-medium' : ''
              }`}
              onClick={() => handleThemeChange(theme.id)}
            >
              {theme.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSelector; 