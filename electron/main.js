const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

/**
 * 创建主窗口
 */
function createWindow() {
    // 创建浏览器窗口 - 设置为无边框模式
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: '梦幻西游单机版',
        frame: false, // 无边框模式
        transparent: false, // 不透明
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // 预加载脚本
            contextIsolation: true, // 增强安全性
            nodeIntegration: false, // 关闭Node集成，在preload中暴露特定API
        },
    });

    // 根据环境加载不同URL
    if (isDev) {
        // 开发模式下加载Vite开发服务器的URL
        mainWindow.loadURL('http://localhost:5173');
        // 打开开发者工具
        mainWindow.webContents.openDevTools();
    } else {
        // 生产模式下加载打包后的index.html
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // 窗口最大化
    mainWindow.maximize();
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
    createWindow();

    // 在macOS上，当点击dock图标且没有其他窗口打开时，
    // 通常会重新创建一个窗口
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 关闭所有窗口时退出应用（在macOS上除外）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 可以在这里添加IPC通信处理逻辑
// 例如：保存游戏、读取游戏等功能
ipcMain.on('save-game', (event, data) => {
    console.log('保存游戏数据', data);
    // 这里可以实现保存游戏数据到本地文件的逻辑
    event.reply('save-game-reply', { success: true });
});

ipcMain.on('load-game', (event) => {
    console.log('加载游戏数据');
    // 这里可以实现从本地文件加载游戏数据的逻辑
    event.reply('load-game-reply', { success: true, data: {} });
});

// 窗口控制功能
ipcMain.on('window-minimize', (event) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
});

ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
});
