/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-18 04:59:50
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-21 02:21:37
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
        quality: {
          normal: '#9ca3af',     // 普通 - 灰色
          rare: '#3b82f6',      // 稀有 - 蓝色
          epic: '#a855f7',      // 史诗 - 紫色
          legendary: '#ff8000',  // 传说 - 橙色
          mythic: '#ff1493'     // 神话 - 粉色
        },
        primary: '#BA68C8',
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
    }
  ]
} 