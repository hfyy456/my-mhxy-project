/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-18 04:59:50
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-13 04:55:27
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 使用CSS变量作为颜色值，这样可以随主题变化
        quality: {
          normal: 'var(--color-quality-normal)',     // 普通品质
          rare: 'var(--color-quality-rare)',         // 稀有品质
          epic: 'var(--color-quality-epic)',         // 史诗品质
          legendary: 'var(--color-quality-legendary)', // 传说品质
          mythic: 'var(--color-quality-mythic)'      // 神话品质
        },
        // 基本颜色也使用CSS变量
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        neutral: 'var(--color-neutral)',
        dark: 'var(--color-dark)',
        light: 'var(--color-light)',
        // 低调梦幻紫主题颜色
        dreamyPurple: {
          100: '#fff0fc', // 浅粉紫色
          200: '#a28fb1', // 淡紫色
          300: '#735c88', // 中紫色
          400: '#563e68', // 深紫色
          500: '#d9c8b2', // 米色
        }
      },
    },
  },
  plugins: [],
  safelist: [
    // 品质相关的所有可能的类名组合
    {
      pattern: /(text|border|bg)-(quality)-(normal|rare|epic|legendary|mythic)/,
    },
    {
      pattern: /quality-(text|border|bg|normal|rare|epic|legendary|mythic)/,
    },
    // 确保透明度类也被包含
    {
      pattern: /bg-opacity-\d+/,
    },
    // 主题颜色类
    {
      pattern: /(text|bg|border)-(primary|secondary|neutral|dark|light)/,
    },
    // 低调梦幻紫主题颜色
    {
      pattern: /(text|bg|border)-(dreamyPurple)-(100|200|300|400|500)/,
    }
  ]
} 