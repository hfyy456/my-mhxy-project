/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-02 20:54:52
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-07 05:52:50
 */
// src/config/homestead/homesteadConfig.js
export const HOMESTEAD_GENERAL_CONFIG = {
  INITIAL_PLOTS: 9, // 初始地块数量 (例如 3x3 网格)
  MAX_PLOTS: 25,    // 最大可扩展地块数量
  PLOT_EXPANSION_COST_BASE: 1000, // 扩展地块基础成本
  PLOT_EXPANSION_COST_MULTIPLIER: 1.5, // 每次扩展成本乘数
  HOMESTEAD_MAX_LEVEL: 10, // 家园本身的最大等级
  // 家园系统内使用的资源
  HOMESTEAD_RESOURCES: {
    WOOD: { id: 'wood', name: '木材', icon: 'path/to/wood_icon.png' },
    STONE: { id: 'stone', name: '石料', icon: 'path/to/stone_icon.png' },
    HERB: { id: 'herb', name: '草药', icon: 'path/to/herb_icon.png' },
    ORE: { id: 'ore', name: '矿石', icon: 'path/to/ore_icon.png' },
    ESSENCE: { id: 'essence', name: '精粹', icon: 'path/to/essence_icon.png' }, // 用于炼金/打造
    GOLD: { id: 'gold', name: '金币', icon: 'path/to/gold_icon.png' }, // 通用货币
  },
};

// 可选：地块类型定义，如果某些建筑只能建在特定类型的地块上
export const PLOT_TYPES = {
  GENERAL: { id: 'general', name: '通用地块', allows: ['all'] },
  FARMING: { id: 'farming', name: '农用地块', allows: ['farm', 'pasture'] },
  INDUSTRIAL: { id: 'industrial', name: '工业地块', allows: ['workshop', 'mine_enhancement'] },
};
