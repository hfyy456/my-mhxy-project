const { contextBridge, ipcRenderer } = require('electron');

/**
 * 预加载脚本
 * 用于安全地暴露特定的Node.js和Electron API给渲染进程
 */
contextBridge.exposeInMainWorld('electronAPI', {
    // 游戏存档相关功能
    saveGame: (data) => ipcRenderer.send('save-game', data),
    onSaveGameReply: (callback) => {
        const listener = (_, result) => callback(result);
        ipcRenderer.on('save-game-reply', listener);
        return () => ipcRenderer.removeListener('save-game-reply', listener);
    },
    
    // 加载游戏存档
    loadGame: () => ipcRenderer.send('load-game'),
    onLoadGameReply: (callback) => {
        const listener = (_, result) => callback(result);
        ipcRenderer.on('load-game-reply', listener);
        return () => ipcRenderer.removeListener('load-game-reply', listener);
    },
    
    // 获取应用信息
    getAppInfo: () => ({
        version: process.env.npm_package_version,
        platform: process.platform,
        isElectron: true
    }),
    
    // 系统信息
    systemInfo: {
        platform: process.platform,
        versions: {
            node: process.versions.node,
            chrome: process.versions.chrome,
            electron: process.versions.electron
        }
    },
    
    // 窗口控制功能
    window: {
        minimize: () => ipcRenderer.send('window-minimize'),
        maximize: () => ipcRenderer.send('window-maximize'),
        close: () => ipcRenderer.send('window-close')
    }
});

console.log('预加载脚本已加载完成');
