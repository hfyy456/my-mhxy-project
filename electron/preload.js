/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-31 04:52:37
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-03 04:24:47
 */
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

    // Electron Store API - 用于游戏状态持久化
    store: {
        get: (key, defaultValue) => ipcRenderer.invoke('store-get', key, defaultValue),
        set: (key, value) => ipcRenderer.invoke('store-set', key, value),
        delete: (key) => ipcRenderer.invoke('store-delete', key),
        clear: () => ipcRenderer.invoke('store-clear'),
        has: (key) => ipcRenderer.invoke('store-has', key),
        size: () => ipcRenderer.invoke('store-size'),
        path: () => ipcRenderer.invoke('store-path')
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
