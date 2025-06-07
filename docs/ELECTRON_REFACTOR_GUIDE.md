# 使用 Electron 重构项目指南

## 1. 引言

### 1.1. 为什么选择 Electron？
本文档旨在指导如何将现有的 Web 项目（基于 Vite/React）重构为一个跨平台的桌面应用程序。Electron 允许我们使用 Web 技术（HTML, CSS, JavaScript）构建桌面应用，并能访问操作系统级别的功能。

### 1.2. 本项目使用 Electron 的优势
*   **跨平台兼容性**：一套代码库，可打包成 Windows, macOS, 和 Linux 应用。
*   **利用现有 Web 技术栈**：复用大部分现有的前端代码。
*   **访问本地资源**：如果需要，应用可以更方便地读写本地文件或与硬件交互。
*   **离线能力**：应用可以在没有网络连接的情况下运行（如果核心功能不依赖实时在线数据）。
*   **更好的用户体验**：作为独立应用，可以提供更集成的桌面体验，如系统通知、自定义菜单等。

## 2. 准备工作

### 2.1. 环境要求
*   Node.js (建议 LTS 版本)
*   npm 或 yarn 包管理器

### 2.2. 现有项目结构概览
假设我们现有的项目是一个标准的 Vite + React 项目，其目录结构可能如下：
```
my-mhxy-project/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── features/
│   ├── store/
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## 3. Electron 集成步骤

### 3.1. 安装 Electron 相关依赖
在项目根目录下执行：
```bash
npm install --save-dev electron electron-builder concurrently wait-on cross-env
# 或者
yarn add --dev electron electron-builder concurrently wait-on cross-env
```
*   `electron`: Electron 核心库。
*   `electron-builder`: 用于打包和构建 Electron 应用。
*   `concurrently`: 同时运行多个命令（例如，Vite 开发服务器和 Electron）。
*   `wait-on`: 等待某个端口或资源可用后再执行命令。
*   `cross-env`: 设置跨平台的环境变量。

### 3.2. 创建 Electron 主进程文件
在项目根目录创建一个 `electron/main.js` 文件 (或者 `main.js` 如果不与 `src/main.jsx` 冲突，但建议放在 `electron/` 目录下以区分)。

**`electron/main.js` 内容示例：**
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
// const isDev = require('electron-is-dev'); // electron-is-dev 可能需要额外安装，或者自己判断
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // 预加载脚本
            contextIsolation: true, // 推荐开启，增强安全性
            nodeIntegration: false, // 推荐关闭，在 preload.js 中暴露特定 Node API
        },
    });

    if (isDev) {
        // 开发模式下加载 Vite 开发服务器的 URL
        // 需要确保 Vite 开发服务器先启动
        mainWindow.loadURL('http://localhost:5173'); // 假设 Vite 运行在 5173 端口
        mainWindow.webContents.openDevTools(); // 打开开发者工具
    } else {
        // 生产模式下加载打包后的 index.html
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // 处理窗口关闭
    // mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 可以在这里添加 IPC 通信处理逻辑
// ipcMain.on('some-event', (event, arg) => {
//   // ...
// });
```

### 3.3. 创建预加载脚本 (Preload Script)
在 `electron/` 目录下创建一个 `preload.js` 文件。这是连接 Electron 主进程和渲染进程（你的 Web 应用）的桥梁，可以在这里安全地暴露 Node.js API 给渲染进程。

**`electron/preload.js` 内容示例：**
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 示例：暴露一个发送消息到主进程的函数
    sendMessage: (channel, data) => ipcRenderer.send(channel, data),
    // 示例：暴露一个接收主进程消息的函数
    receiveMessage: (channel, func) => {
        // 确保只添加一次监听器，或者提供移除监听器的方法
        const safeFunc = (...args) => func(...args);
        ipcRenderer.on(channel, safeFunc);
        // 返回一个清理函数，以便组件卸载时移除监听
        return () => ipcRenderer.removeListener(channel, safeFunc);
    },
    // 你可以在这里暴露更多 Node.js 或 Electron 的 API
    // 例如：
    //   versions: {
    //     node: () => process.versions.node,
    //     chrome: () => process.versions.chrome,
    //     electron: () => process.versions.electron
    //   },
    //   invokeExample: (args) => ipcRenderer.invoke('handle-example', args)
});

console.log('Preload script loaded.');
```

### 3.4. 修改 `package.json`
添加或修改 `scripts` 和 `main` 字段，并添加 `build` 配置供 `electron-builder` 使用：
```json
{
  "name": "my-mhxy-electron-app",
  "version": "0.1.0",
  "private": true,
  "main": "electron/main.js", 
  "homepage": "./", 
  "scripts": {
    "dev:vite": "vite",
    "build:vite": "vite build",
    "dev:electron": "wait-on http://localhost:5173 && cross-env NODE_ENV=development electron .",
    "dev": "concurrently \"npm:dev:vite\" \"npm:dev:electron\"",
    "build:electron": "npm run build:vite && cross-env NODE_ENV=production electron-builder",
    "start": "cross-env NODE_ENV=production electron ."
  },
  "build": {
    "appId": "com.example.my-mhxy-app",
    "productName": "御灵录单机版",
    "directories": {
      "output": "release",
      "buildResources": "assets" 
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "extends": null, // 避免继承外部配置，如果不需要的话
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico" 
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns" 
    },
    "linux": {
      "target": "AppImage",
      "icon": "assets/icon.png" 
    }
  }
}
```
**注意：**
*   确保 `assets/icon.ico`, `assets/icon.icns`, `assets/icon.png` 存在于项目根目录下的 `assets` 文件夹中，或者修改为实际的图标路径。如果暂时没有，可以先移除 `icon` 配置或使用默认图标。
*   `electron-builder` 的配置可以非常复杂，以上仅为基础示例。
*   `cross-env NODE_ENV=development` 和 `cross-env NODE_ENV=production` 用于在 `electron/main.js` 中正确判断开发或生产环境。

### 3.5. 调整 Vite 配置 (`vite.config.js`)
为了确保生产构建时路径正确，需要调整 `vite.config.js` 中的 `base` 选项：
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // 非常重要，确保相对路径正确
  build: {
    outDir: 'dist' // 确保输出目录与 electron/main.js 和 package.json 中配置一致
  }
});
```

## 4. 核心概念

### 4.1. 主进程 (Main Process)
*   每个 Electron 应用有且只有一个主进程。
*   主进程是应用的入口点，负责创建和管理应用的窗口 (BrowserWindow 实例) 和处理系统事件。
*   主进程可以访问 Node.js API 和操作系统原生功能。
*   `electron/main.js` 就是主进程脚本。

### 4.2. 渲染进程 (Renderer Process)
*   每个 BrowserWindow 实例都在其自己的渲染进程中运行网页内容。
*   渲染进程负责展示用户界面 (HTML, CSS, JS)。
*   出于安全考虑，渲染进程默认不能直接访问 Node.js API。需要通过 `preload.js` 脚本选择性地暴露。
*   你的 React 应用就运行在渲染进程中。

### 4.3. 进程间通信 (IPC)
*   主进程和渲染进程是隔离的，需要通过 IPC (Inter-Process Communication) 机制进行通信。
*   **`ipcMain`** (在主进程中使用) 和 **`ipcRenderer`** (在渲染进程或预加载脚本中使用) 是 Electron提供的 IPC 模块。
    *   `ipcRenderer.send(channel, ...args)`: 从渲染进程向主进程发送异步消息。
    *   `ipcMain.on(channel, (event, ...args) => {})`: 在主进程中监听来自渲染进程的消息。
    *   `ipcRenderer.invoke(channel, ...args)`: 从渲染进程向主进程发送消息并等待响应 (Promise-based)。
    *   `ipcMain.handle(channel, async (event, ...args) => {})`: 在主进程中处理 `invoke` 请求并返回结果。
    *   `event.reply(channel, ...args)`: 从主进程向发送消息的渲染进程回复消息 (用于 `ipcMain.on` 的 `event` 对象)。

## 5. 开发与构建

### 5.1. 开发模式
1.  打开一个终端，运行 `npm run dev` (或 `yarn dev`)。
    *   `concurrently` 会同时启动 Vite 开发服务器 (`npm run dev:vite`) 和 Electron 应用 (`npm run dev:electron`)。
    *   `wait-on` 会确保 Vite 服务器启动并监听指定端口后，Electron 才启动并加载页面。

修改 `src/` 目录下的前端代码，Vite 会热更新。修改 `electron/` 目录下的代码 (如 `main.js`, `preload.js`)，通常需要重启 Electron 应用 (在 Electron 窗口中按 `Ctrl+R` 或 `Cmd+R` 可刷新渲染进程，但主进程更改需完全重启 `npm run dev`)。

### 5.2. 构建生产包
运行 `npm run build:electron` (或 `yarn build:electron`)。
此命令会：
1.  先执行 `npm run build:vite` (或 `yarn build:vite`)，将 React 应用打包到 `dist/` 目录。
2.  然后 `electron-builder` 会根据 `package.json` 中的 `build` 配置，将 Electron 应用、`dist/` 目录内容及其他必要文件打包成可执行文件，存放在 `release/` 目录 (或 `build.directories.output` 指定的目录)。

## 6. 注意事项与进阶

### 6.1. 安全性
*   **`contextIsolation: true` (默认)** 和 **`nodeIntegration: false` (默认)** 是推荐的安全设置。
*   通过 `preload.js` 脚本谨慎暴露必要的 Node.js/Electron API 给渲染进程。
*   警惕 XSS 攻击，因为 Electron 应用本质上是浏览器。
*   定期更新 Electron 版本以获取最新的安全补丁。

### 6.2. 路由
*   如果你的 React 应用使用 `BrowserRouter`，在 Electron 中直接加载 `index.html` 文件时可能会遇到问题，因为它依赖服务器配置来处理任意路径。
*   可以考虑切换到 `HashRouter` (`<HashRouter>`)，它使用 URL hash (`#`) 来管理路由，在文件系统中加载时工作良好。
*   或者，在 Electron 主进程中配置，使得所有导航请求都加载 `index.html`，让 React Router 在客户端处理路由。

### 6.3. 访问本地文件
*   可以使用 Electron 的 `dialog` 模块让用户选择文件/文件夹。
*   通过 IPC 将文件操作请求从渲染进程发送到主进程，由主进程使用 Node.js 的 `fs` 模块进行实际的读写操作。

### 6.4. 自定义菜单、系统托盘、通知等
*   Electron 提供了 `Menu`, `Tray`, `Notification` 等模块来实现这些原生功能，可以在主进程中进行配置。

### 6.5. 自动更新
*   `electron-updater` (通常与 `electron-builder` 配合使用) 可以帮助实现应用的自动更新功能。这需要配置更新服务器。

## 7. 后续步骤
1.  在项目中创建 `electron` 文件夹，并加入 `main.js` 和 `preload.js`。
2.  安装必要的依赖包。
3.  更新 `package.json` 和 `vite.config.js`。
4.  准备应用图标文件，并放置在 `assets` 目录（如果尚不存在，请创建）。
5.  尝试运行 `npm run dev`，看是否能成功启动开发环境。
6.  逐步测试各项功能，并根据项目需求，实现特定的原生功能 (如文件操作、自定义菜单等)。
7.  完善 `electron-builder` 的配置，包括代码签名等，以准备正式发布。

---

本文档提供了将现有 Web 项目重构为 Electron 应用的基础指南。具体实现中可能需要根据项目特性进行调整和深入研究。祝您重构顺利！
