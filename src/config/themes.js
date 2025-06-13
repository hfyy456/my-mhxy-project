/*
 * @Author: Claude
 * @Date: 2025-06-15
 * @Description: 游戏主题配置
 */

/**
 * 主题配置
 * 每个主题包含一组颜色定义
 */
export const THEMES = {
  // 默认主题 - 从现有配置中提取
  default: {
    id: 'default',
    name: '默认主题',
    colors: {
      primary: '#8a2be2',       // 主要颜色
      secondary: '#ffa500',     // 次要颜色
      neutral: '#f0f8ff',       // 中性色
      dark: '#1a202c',          // 深色
      light: '#ffffff',         // 浅色
      quality: {
        normal: '#808080',      // 普通品质
        rare: '#3b82f6',        // 稀有品质
        epic: '#a855f7',        // 史诗品质
        legendary: '#ff8000',   // 传说品质
        mythic: '#ff1493'       // 神话品质
      }
    }
  },
  
  // 低调梦幻紫主题 - 根据提供的颜色板
  dreamyPurple: {
    id: 'dreamyPurple',
    name: '低调梦幻紫',
    colors: {
      primary: '#735c88',       // 中紫色作为主色
      secondary: '#d9c8b2',     // 米色作为次要色
      neutral: '#fff0fc',       // 浅粉紫色作为中性色
      dark: '#563e68',          // 深紫色作为深色
      light: '#fff0fc',         // 浅粉紫色作为浅色
      quality: {
        normal: '#a28fb1',      // 淡紫色作为普通品质
        rare: '#3b82f6',        // 保持原有的稀有品质颜色
        epic: '#735c88',        // 中紫色作为史诗品质
        legendary: '#563e68',   // 深紫色作为传说品质
        mythic: '#d9c8b2'       // 米色作为神话品质
      }
    }
  }
};

// 默认主题ID
export const DEFAULT_THEME_ID = 'default';

/**
 * 获取主题列表
 * @returns {Array} 主题列表
 */
export const getThemeList = () => {
  return Object.values(THEMES).map(theme => ({
    id: theme.id,
    name: theme.name
  }));
};

/**
 * 获取主题配置
 * @param {string} themeId - 主题ID
 * @returns {Object} 主题配置
 */
export const getTheme = (themeId) => {
  return THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
};

/**
 * 应用主题到文档
 * @param {string} themeId - 主题ID
 */
export const applyTheme = (themeId) => {
  const theme = getTheme(themeId);
  const root = document.documentElement;
  
  // 设置基础颜色CSS变量
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-neutral', theme.colors.neutral);
  root.style.setProperty('--color-dark', theme.colors.dark);
  root.style.setProperty('--color-light', theme.colors.light);
  
  // 设置品质颜色CSS变量
  root.style.setProperty('--color-quality-normal', theme.colors.quality.normal);
  root.style.setProperty('--color-quality-rare', theme.colors.quality.rare);
  root.style.setProperty('--color-quality-epic', theme.colors.quality.epic);
  root.style.setProperty('--color-quality-legendary', theme.colors.quality.legendary);
  root.style.setProperty('--color-quality-mythic', theme.colors.quality.mythic);
  
  // 更新低调梦幻紫特定颜色（如果是该主题）
  if (themeId === 'dreamyPurple') {
    document.body.classList.add('theme-dreamy-purple');
  } else {
    document.body.classList.remove('theme-dreamy-purple');
  }
  
  // 保存当前主题到localStorage
  localStorage.setItem('mhxy-theme', themeId);
  
  // 触发主题变更事件，让组件可以响应主题变化
  window.dispatchEvent(new CustomEvent('theme-changed', { 
    detail: { themeId, theme }
  }));
  
  console.log(`[Theme] 应用主题: ${theme.name}`);
};

/**
 * 初始化主题
 * 从localStorage加载上次使用的主题，如果没有则使用默认主题
 */
export const initTheme = () => {
  const savedTheme = localStorage.getItem('mhxy-theme');
  applyTheme(savedTheme || DEFAULT_THEME_ID);
  
  // 添加主题切换快捷键（可选）
  document.addEventListener('keydown', (e) => {
    // Alt+T 切换主题
    if (e.altKey && e.key === 't') {
      const themeList = getThemeList();
      const currentTheme = localStorage.getItem('mhxy-theme') || DEFAULT_THEME_ID;
      const currentIndex = themeList.findIndex(t => t.id === currentTheme);
      const nextIndex = (currentIndex + 1) % themeList.length;
      applyTheme(themeList[nextIndex].id);
    }
  });
}; 