/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-22 19:39:40
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-23 04:00:50
 * @FilePath: \my-mhxy-project\src\config\enemyConfig.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * @file enemyConfig.js
 * @description Configuration for enemy templates in the game.
 */

export const enemyConfig = {
  goblin_grunt: {
    id: "goblin_grunt",
    name: "哥布林小卒",
    level: 1,
    spriteAssetKey: "goblin_grunt_sprite", // Placeholder, needs actual asset key or path
    stats: {
      maxHp: 20,
      maxMp: 0,
      attack: 8,
      defense: 3,
      speed: 7,
      hitRate: 0.9,
      dodgeRate: 0.05,
      critRate: 0.03,
      critDamageMultiplier: 1.5,
    },
    skills: ["basic_attack"], // Placeholder, needs actual skill ID from skillConfig
    rewards: {
      experience: 10,
      gold: 5,
      items: [{ itemId: "potion_small_hp", dropChance: 0.1, quantity: 1 }], // Placeholder
    },
  },
  forest_wolf: {
    id: "forest_wolf",
    name: "森林狼",
    level: 2,
    spriteAssetKey: "wolf_sprite", // Placeholder
    stats: {
      maxHp: 45,
      maxMp: 10,
      attack: 12,
      defense: 5,
      speed: 10,
      hitRate: 0.95,
      dodgeRate: 0.1,
      critRate: 0.05,
      critDamageMultiplier: 1.6,
    },
    skills: ["basic_attack", "howl"], // Placeholder, "howl" could be a self-buff or debuff
    rewards: {
      experience: 15,
      gold: 8,
      items: [
        { itemId: "wolf_pelt", dropChance: 0.2, quantity: 1 }, // Placeholder
        { itemId: "potion_small_mp", dropChance: 0.05, quantity: 1 }, // Placeholder
      ],
    },
  },
  orc_warrior: {
    id: "orc_warrior",
    name: "兽人战士",
    level: 5,
    spriteAssetKey: "orc_warrior_sprite", // Placeholder
    stats: {
      maxHp: 120,
      maxMp: 20,
      attack: 25,
      defense: 15,
      speed: 6,
      hitRate: 0.9,
      dodgeRate: 0.03,
      critRate: 0.07,
      critDamageMultiplier: 1.7,
    },
    skills: ["basic_attack", "power_strike", "war_cry"], // Placeholders
    rewards: {
      experience: 50,
      gold: 25,
      items: [
        { itemId: "orcish_axe_fragment", dropChance: 0.1, quantity: 1 }, // Placeholder
        { itemId: "potion_medium_hp", dropChance: 0.15, quantity: 1 }, // Placeholder
      ],
    },
  },
  // 测试用敌人，有很高的血量但不会攻击
  test_dummy: {
    id: "test_dummy",
    name: "测试木桩",
    level: 1,
    spriteAssetKey: "goblin_grunt_sprite", // 使用哥布林的精灵图
    stats: {
      maxHp: 500,
      maxMp: 0,
      attack: 0,
      defense: 0,
      speed: 1, // 非常慢，确保它总是最后行动
      hitRate: 0,
      dodgeRate: 0,
      critRate: 0,
      critDamageMultiplier: 1.0,
    },
    skills: ["basic_attack"], // 只有基础攻击
    rewards: {
      experience: 0,
      gold: 0,
      items: [], // 不掉落物品
    },
  },
  // Add more enemy templates here
};

// It might be useful to have a function to get an enemy by ID
export const getEnemyTemplateById = (id) => {
  return enemyConfig[id] || null;
};