/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 01:35:04
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-03 04:32:26
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
      include: "**/*.{js,jsx,ts,tsx}", // 明确包含 .js 文件
    }),
  ],
  base: "./", // 确保相对路径正确，这对Electron应用很重要
  resolve: {
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json", ".cjs"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173, // 使用5173端口，与Electron配置一致
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    sourcemap: true,
  },
  assetsInclude: ["**/*.png", "**/*.gif"],
});