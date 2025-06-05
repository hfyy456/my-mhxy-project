const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const Store = require('electron-store');
const isDev = process.env.NODE_ENV !== 'production';

// 初始化Electron Store
const store = new Store({
    name: 'game-data',
    defaults: {
        gameState: null,
        settings: {
            language: 'zh-CN',
            soundEnabled: true,
            musicVolume: 0.8,
            effectVolume: 0.8
        }
    }
});

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

// Electron Store IPC 处理程序
ipcMain.handle('store-get', (event, key, defaultValue) => {
    try {
        return store.get(key, defaultValue);
    } catch (error) {
        console.error('Store get error:', error);
        return defaultValue;
    }
});

ipcMain.handle('store-set', (event, key, value) => {
    try {
        store.set(key, value);
        return true;
    } catch (error) {
        console.error('Store set error:', error);
        return false;
    }
});

ipcMain.handle('store-delete', (event, key) => {
    try {
        store.delete(key);
        return true;
    } catch (error) {
        console.error('Store delete error:', error);
        return false;
    }
});

ipcMain.handle('store-clear', (event) => {
    try {
        store.clear();
        return true;
    } catch (error) {
        console.error('Store clear error:', error);
        return false;
    }
});

ipcMain.handle('store-has', (event, key) => {
    try {
        return store.has(key);
    } catch (error) {
        console.error('Store has error:', error);
        return false;
    }
});

ipcMain.handle('store-size', (event) => {
    try {
        return store.size;
    } catch (error) {
        console.error('Store size error:', error);
        return 0;
    }
});

ipcMain.handle('store-path', (event) => {
    try {
        return store.path;
    } catch (error) {
        console.error('Store path error:', error);
        return '';
    }
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

// 配置文件管理IPC处理程序
ipcMain.handle('save-config-file', async (event, { fileName, data, configType }) => {
    try {
        // 获取项目根目录
        const projectRoot = isDev 
            ? path.join(__dirname, '..')  // 开发模式：electron文件夹的上级目录
            : path.dirname(app.getPath('exe')); // 生产模式：exe文件所在目录
        
        // 确定配置文件路径
        let configPath;
        if (configType === 'items') {
            configPath = path.join(projectRoot, 'src', 'config', 'item', fileName);
        } else if (configType === 'summons') {
            configPath = path.join(projectRoot, 'src', 'config', 'summon', fileName);
        } else {
            throw new Error(`不支持的配置类型: ${configType}`);
        }

        // 确保目录存在
        const configDir = path.dirname(configPath);
        await fs.mkdir(configDir, { recursive: true });

        // 写入JSON文件
        await fs.writeFile(configPath, JSON.stringify(data, null, 2), 'utf8');

        console.log(`配置文件已保存: ${configPath}`);
        return { 
            success: true, 
            path: configPath,
            message: `配置文件 ${fileName} 保存成功`
        };
    } catch (error) {
        console.error('保存配置文件失败:', error);
        return { 
            success: false, 
            error: error.message,
            message: `保存配置文件失败: ${error.message}`
        };
    }
});

// 读取配置文件
ipcMain.handle('load-config-file', async (event, { fileName, configType }) => {
    try {
        const projectRoot = isDev 
            ? path.join(__dirname, '..')
            : path.dirname(app.getPath('exe'));
        
        let configPath;
        if (configType === 'items') {
            configPath = path.join(projectRoot, 'src', 'config', 'item', fileName);
        } else if (configType === 'summons') {
            configPath = path.join(projectRoot, 'src', 'config', 'summon', fileName);
        } else {
            throw new Error(`不支持的配置类型: ${configType}`);
        }

        const data = await fs.readFile(configPath, 'utf8');
        const parsedData = JSON.parse(data);

        return { 
            success: true, 
            data: parsedData,
            path: configPath
        };
    } catch (error) {
        console.error('读取配置文件失败:', error);
        return { 
            success: false, 
            error: error.message,
            message: `读取配置文件失败: ${error.message}`
        };
    }
});

// 创建备份文件
ipcMain.handle('backup-config-file', async (event, { fileName, configType }) => {
    try {
        const projectRoot = isDev 
            ? path.join(__dirname, '..')
            : path.dirname(app.getPath('exe'));
        
        let configPath;
        if (configType === 'items') {
            configPath = path.join(projectRoot, 'src', 'config', 'item', fileName);
        } else if (configType === 'summons') {
            configPath = path.join(projectRoot, 'src', 'config', 'summon', fileName);
        } else {
            throw new Error(`不支持的配置类型: ${configType}`);
        }

        // 创建备份文件名（添加时间戳）
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = fileName.replace('.json', `_backup_${timestamp}.json`);
        const backupPath = path.join(path.dirname(configPath), 'backups', backupFileName);

        // 确保备份目录存在
        await fs.mkdir(path.dirname(backupPath), { recursive: true });

        // 复制原文件到备份位置
        await fs.copyFile(configPath, backupPath);

        return { 
            success: true, 
            backupPath: backupPath,
            message: `备份文件创建成功: ${backupFileName}`
        };
    } catch (error) {
        console.error('创建备份文件失败:', error);
        return { 
            success: false, 
            error: error.message,
            message: `创建备份失败: ${error.message}`
        };
    }
});
