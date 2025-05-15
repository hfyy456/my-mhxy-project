/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 01:35:04
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-16 02:50:59
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import commonjs from "vite-plugin-commonjs";

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
      include: "**/*.{js,jsx,ts,tsx}", // 明确包含 .js 文件
    }),
    tailwindcss(),
    commonjs(),
  ],
  resolve: {
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json", ".cjs"],
  },
});
