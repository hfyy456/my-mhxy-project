/**
 * 游戏状态管理器 - 替代Redux的面向对象方案
 * 特点：数据与逻辑分离，更适合Electron环境
 */
import { EventEmitter } from 'events';

class GameStateManager extends EventEmitter {
  constructor() {
    super();
    this.state = {
      player: null,
      summons: new Map(),
      inventory: {
        items: new Map(),
        gold: 0,
        capacity: 100,
        slots: new Array(100).fill(null)
      },
      game: {
        scene: 'main',
        isLoading: false,
        settings: {}
      }
    };
    
    // 初始化时从Electron Store加载状态
    this.loadStateFromElectronStore();
    
    // 绑定自动保存
    this.setupAutoSave();
  }

  // 获取状态的只读副本（确保数据不可变性）
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  // 召唤兽管理
  addSummon(summonData) {
    const summon = new Summon(summonData);
    this.state.summons.set(summon.id, summon);
    this.emit('summons:changed', this.getSummons());
    this.scheduleStateSave();
    return summon;
  }

  getSummons() {
    return Array.from(this.state.summons.values()).map(s => s.toJSON());
  }

  getSummonById(id) {
    const summon = this.state.summons.get(id);
    return summon ? summon.toJSON() : null;
  }

  updateSummon(id, updates) {
    const summon = this.state.summons.get(id);
    if (summon) {
      summon.update(updates);
      this.emit('summons:changed', this.getSummons());
      this.emit(`summon:${id}:changed`, summon.toJSON());
      this.scheduleStateSave();
    }
  }

  // 物品管理
  addItem(itemData, quantity = 1) {
    const item = new GameItem(itemData);
    const existingItem = this.state.inventory.items.get(item.id);
    
    if (existingItem && existingItem.stackable) {
      existingItem.quantity += quantity;
    } else {
      item.quantity = quantity;
      this.state.inventory.items.set(item.id, item);
    }
    
    this.emit('inventory:changed', this.getInventory());
    this.scheduleStateSave();
    return item;
  }

  getInventory() {
    return {
      items: Array.from(this.state.inventory.items.values()).map(i => i.toJSON()),
      gold: this.state.inventory.gold,
      capacity: this.state.inventory.capacity,
      slots: [...this.state.inventory.slots]
    };
  }

  updateGold(amount) {
    this.state.inventory.gold = Math.max(0, this.state.inventory.gold + amount);
    this.emit('inventory:gold:changed', this.state.inventory.gold);
    this.scheduleStateSave();
  }

  // 游戏场景管理
  setScene(sceneName, data = {}) {
    const previousScene = this.state.game.scene;
    this.state.game.scene = sceneName;
    this.emit('scene:changed', { from: previousScene, to: sceneName, data });
    this.scheduleStateSave();
  }

  getScene() {
    return this.state.game.scene;
  }

  // Electron Store集成
  async loadStateFromElectronStore() {
    if (window.electronAPI?.store) {
      try {
        const savedState = await window.electronAPI.store.get('gameState');
        if (savedState) {
          this.mergeState(savedState);
          this.emit('state:loaded', this.getState());
        }
      } catch (error) {
        console.error('加载游戏状态失败:', error);
      }
    }
  }

  async saveStateToElectronStore() {
    if (window.electronAPI?.store) {
      try {
        const stateToSave = this.serializeForStorage();
        await window.electronAPI.store.set('gameState', stateToSave);
        this.emit('state:saved');
      } catch (error) {
        console.error('保存游戏状态失败:', error);
      }
    }
  }

  // 自动保存机制
  setupAutoSave() {
    this.saveTimeout = null;
  }

  scheduleStateSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveStateToElectronStore();
    }, 1000); // 1秒后保存
  }

  // 状态序列化
  serializeForStorage() {
    console.log("[GameStateManager serializeForStorage] Serializing summons:", this.state.summons);
    return {
      summons: Array.from(this.state.summons.entries()).map(([id, summon]) => [id, summon.toJSON()]),
      inventory: {
        items: Array.from(this.state.inventory.items.entries()).map(([id, item]) => [id, item.toJSON()]),
        gold: this.state.inventory.gold,
        capacity: this.state.inventory.capacity,
        slots: this.state.inventory.slots
      },
      game: this.state.game
    };
  }

  mergeState(savedState) {
    // 重建召唤兽
    if (savedState.summons) {
      savedState.summons.forEach(([id, summonData]) => {
        this.state.summons.set(id, new Summon(summonData));
      });
    }

    // 重建物品
    if (savedState.inventory?.items) {
      savedState.inventory.items.forEach(([id, itemData]) => {
        this.state.inventory.items.set(id, new GameItem(itemData));
      });
    }

    // 更新其他状态
    if (savedState.inventory) {
      Object.assign(this.state.inventory, {
        gold: savedState.inventory.gold || 0,
        capacity: savedState.inventory.capacity || 100,
        slots: savedState.inventory.slots || new Array(100).fill(null)
      });
    }

    if (savedState.game) {
      Object.assign(this.state.game, savedState.game);
    }
  }

  // 清理资源
  destroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.removeAllListeners();
  }
}

// 召唤兽类
class Summon {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.level = data.level || 1;
    this.attributes = data.attributes || {
      hp: 100,
      mp: 50,
      physicalAttack: 10,
      magicalAttack: 10,
      physicalDefense: 10,
      magicalDefense: 10,
      speed: 10
    };
    this.skills = data.skills || [];
    this.equipment = data.equipment || {};
  }

  update(updates) {
    Object.assign(this, updates);
  }

  levelUp() {
    this.level++;
    // 自动增加属性逻辑
    Object.keys(this.attributes).forEach(attr => {
      this.attributes[attr] += Math.floor(Math.random() * 5) + 1;
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      level: this.level,
      attributes: { ...this.attributes },
      skills: [...this.skills],
      equipment: { ...this.equipment }
    };
  }

  generateId() {
    return `summon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 游戏物品类
class GameItem {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.type = data.type || 'misc';
    this.rarity = data.rarity || 'common';
    this.quantity = data.quantity || 1;
    this.stackable = data.stackable !== false;
    this.attributes = data.attributes || {};
    this.description = data.description || '';
  }

  update(updates) {
    Object.assign(this, updates);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      rarity: this.rarity,
      quantity: this.quantity,
      stackable: this.stackable,
      attributes: { ...this.attributes },
      description: this.description
    };
  }

  generateId() {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 导出单例实例
export const gameStateManager = new GameStateManager();
export default gameStateManager; 