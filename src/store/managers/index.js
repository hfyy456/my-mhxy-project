/**
 * 管理器中心 (Manager Hub)
 * 
 * 职责:
 * 1. 实例化所有单例管理器。
 * 2. 处理管理器之间的依赖注入。
 * 3. 作为项目中所有管理器的唯一入口点。
 */

import PlayerManager from './PlayerManager';
import HomesteadManager from './HomesteadManager';
import SummonManager from '../SummonManager';
import InventoryManager from '../InventoryManager';
import SaveLoadManager from './SaveLoadManager';
import chronographInstance from '@/utils/Chronograph';

// 1. 实例化没有依赖或作为依赖源的管理器
const playerManagerInstance = new PlayerManager();
const summonManagerInstance = new SummonManager();
const inventoryManagerInstance = new InventoryManager();
const homesteadManagerInstance = new HomesteadManager();
const saveLoadManagerInstance = new SaveLoadManager();

// 2. 执行依赖注入和初始化
// 注意顺序：被依赖的要先初始化
playerManagerInstance.initialize?.(); // 如果有
summonManagerInstance.initialize(playerManagerInstance);
homesteadManagerInstance.initialize(playerManagerInstance);

// 启动全局计时器
chronographInstance.start();

// 最后初始化 SaveLoadManager，因为它依赖最多的管理器
saveLoadManagerInstance.initialize({
  playerManager: playerManagerInstance,
  summonManager: summonManagerInstance,
  inventoryManager: inventoryManagerInstance,
  homesteadManager: homesteadManagerInstance,
});

// 将 saveLoadManager 也纳入统一导出
const managers = {
  playerManager: playerManagerInstance,
  homesteadManager: homesteadManagerInstance,
  summonManager: summonManagerInstance,
  inventoryManager: inventoryManagerInstance,
  saveLoadManager: saveLoadManagerInstance,
};

// 导出所有管理器的单例
export {
  playerManagerInstance,
  homesteadManagerInstance,
  summonManagerInstance,
  inventoryManagerInstance,
  saveLoadManagerInstance,
};

export default managers; 