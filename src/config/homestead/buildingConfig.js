// src/config/homestead/buildingConfig.js
import { HOMESTEAD_GENERAL_CONFIG } from './homesteadConfig';
const { HOMESTEAD_RESOURCES } = HOMESTEAD_GENERAL_CONFIG; // 假设在同一目录下

export const BUILDING_CATEGORIES = {
  RESOURCE_PRODUCTION: 'resource_production', // 资源生产
  CRAFTING: 'crafting',                 // 制作/加工
  TRAINING: 'training',                 // 训练/提升
  UTILITY: 'utility',                   // 功能性/辅助
};

export const BUILDINGS = {
  // 资源生产建筑
  lumber_mill_1: {
    id: 'lumber_mill_1',
    name: '伐木场 I',
    category: BUILDING_CATEGORIES.RESOURCE_PRODUCTION,
    description: '基础伐木场，周期性生产木材。',
    plotTypes: ['GENERAL', 'INDUSTRIAL'], // 可建造的地块类型
    size: { width: 1, height: 1 }, // 占据地块大小
    texture: 'path/to/lumber_mill_1.png',
    maxLevel: 5,
    levels: [
      { level: 1, buildCost: [{ resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 100 }, { resource: HOMESTEAD_RESOURCES.STONE.id, amount: 50 }], buildTimeSeconds: 60, production: [{ resource: HOMESTEAD_RESOURCES.WOOD.id, amountPerCycle: 10, cycleTimeSeconds: 300 }], unlocks: [] },
      { level: 2, buildCost: [{ resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 200 }, { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 100 }], buildTimeSeconds: 120, production: [{ resource: HOMESTEAD_RESOURCES.WOOD.id, amountPerCycle: 15, cycleTimeSeconds: 280 }], unlocks: [] },
    ],
  },
  quarry_1: {
    id: 'quarry_1',
    name: '采石场 I',
    category: BUILDING_CATEGORIES.RESOURCE_PRODUCTION,
    description: '基础采石场，周期性生产石料。',
    plotTypes: ['GENERAL', 'INDUSTRIAL'],
    size: { width: 1, height: 1 },
    texture: 'path/to/quarry_1.png',
    maxLevel: 5,
    levels: [
      { level: 1, buildCost: [{ resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 100 }, { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 50 }], buildTimeSeconds: 60, production: [{ resource: HOMESTEAD_RESOURCES.STONE.id, amountPerCycle: 10, cycleTimeSeconds: 300 }], unlocks: [] },
    ],
  },
  // 制作建筑
  blacksmith_1: {
    id: 'blacksmith_1',
    name: '铁匠铺 I',
    category: BUILDING_CATEGORIES.CRAFTING,
    description: '可以锻造基础武器和工具。',
    plotTypes: ['GENERAL', 'INDUSTRIAL'],
    size: { width: 2, height: 2 },
    texture: 'path/to/blacksmith_1.png',
    maxLevel: 3,
    levels: [
      { level: 1, buildCost: [{ resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 500 }, { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 200 }, { resource: HOMESTEAD_RESOURCES.STONE.id, amount: 200 }], buildTimeSeconds: 300, unlocks: ['craft_iron_sword', 'craft_basic_pickaxe'] },
    ],
  },
  alchemist_lab_1: {
    id: 'alchemist_lab_1',
    name: '炼丹炉 I',
    category: BUILDING_CATEGORIES.CRAFTING,
    description: '可以炼制初级丹药。',
    plotTypes: ['GENERAL'],
    size: { width: 1, height: 2 },
    texture: 'path/to/alchemist_lab_1.png',
    maxLevel: 3,
    levels: [
      { level: 1, buildCost: [{ resource: HOMESTEAD_RESOURCES.GOLD.id, amount: 400 }, { resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 150 }, { resource: HOMESTEAD_RESOURCES.HERB.id, amount: 100 }], buildTimeSeconds: 240, unlocks: ['craft_minor_healing_potion', 'craft_minor_mana_potion'] },
    ],
  },
  // 功能性建筑
  storage_shed_1: {
    id: 'storage_shed_1',
    name: '仓库 I',
    category: BUILDING_CATEGORIES.UTILITY,
    description: '增加家园资源存储上限。',
    plotTypes: ['GENERAL'],
    size: { width: 1, height: 1 },
    texture: 'path/to/storage_shed_1.png',
    maxLevel: 5,
    levels: [
      { level: 1, buildCost: [{ resource: HOMESTEAD_RESOURCES.WOOD.id, amount: 100 }], buildTimeSeconds: 30, effect: { type: 'increase_storage', resourceCategory: 'all', amount: 500 }, unlocks:[] },
    ],
  }
};
