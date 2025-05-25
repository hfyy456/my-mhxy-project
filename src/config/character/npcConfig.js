/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-21 23:55:57
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-21 23:57:55
 */
// src/config/npcConfig.js
export const npcs = {
  npc_001: {
    id: 'npc_001',
    name: '老村长',
    sprite: 'elder.png', // Placeholder sprite
    dialogueKey: 'elder_welcome', // Key for uiTextConfig or other dialogue system
    questsToStart: ['quest_001'],
  },
  npc_002: { id: 'npc_002', name: '铁匠铺老板', sprite: 'blacksmith.png', dialogueKey: 'blacksmith_services' },
}; 