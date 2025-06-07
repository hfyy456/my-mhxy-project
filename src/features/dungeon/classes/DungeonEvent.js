export const EVENT_TYPES = {
  BATTLE: 'battle',           // 战斗事件
  TREASURE: 'treasure',       // 宝藏事件
  MERCHANT: 'merchant',       // 商人事件
  REST: 'rest',              // 休息事件
  RANDOM: 'random',          // 随机事件
  BOSS: 'boss',              // Boss战
  MYSTERY: 'mystery',        // 神秘事件
  ELITE: 'elite'             // 精英怪
};

export const EVENT_RARITIES = {
  COMMON: 'common',
  UNCOMMON: 'uncommon', 
  RARE: 'rare',
  LEGENDARY: 'legendary'
};

/**
 * 副本事件基类
 */
export class DungeonEvent {
  constructor({
    id,
    name,
    description,
    type,
    rarity = EVENT_RARITIES.COMMON,
    icon = '❓',
    rewards = [],
    requirements = [],
    consequences = {}
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.type = type;
    this.rarity = rarity;
    this.icon = icon;
    this.rewards = rewards;
    this.requirements = requirements;
    this.consequences = consequences;
    this.isCompleted = false;
  }

  /**
   * 检查事件是否可以触发
   */
  canTrigger(playerState) {
    return this.requirements.every(req => this.checkRequirement(req, playerState));
  }

  /**
   * 检查单个要求
   */
  checkRequirement(requirement, playerState) {
    switch (requirement.type) {
      case 'level':
        return playerState.level >= requirement.value;
      case 'health':
        return playerState.health >= requirement.value;
      case 'item':
        return playerState.inventory.some(item => 
          item.id === requirement.itemId && item.quantity >= requirement.amount
        );
      default:
        return true;
    }
  }

  /**
   * 执行事件
   */
  execute(playerState, choice = null) {
    if (!this.canTrigger(playerState)) {
      throw new Error(`无法触发事件: ${this.name}`);
    }

    this.isCompleted = true;
    return this.applyConsequences(playerState, choice);
  }

  /**
   * 应用事件后果
   */
  applyConsequences(playerState, choice) {
    const consequences = choice ? this.consequences[choice] : this.consequences;
    const results = {
      success: true,
      message: '',
      changes: {},
      rewards: []
    };

    if (consequences) {
      // 应用属性变化
      if (consequences.health) {
        playerState.health = Math.max(0, Math.min(
          playerState.maxHealth, 
          playerState.health + consequences.health
        ));
        results.changes.health = consequences.health;
      }

      if (consequences.gold) {
        playerState.gold += consequences.gold;
        results.changes.gold = consequences.gold;
      }

      // 应用奖励
      if (consequences.rewards) {
        results.rewards = consequences.rewards;
      }

      results.message = consequences.message || `完成了${this.name}`;
    }

    return results;
  }

  /**
   * 获取事件的显示信息
   */
  getDisplayInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      rarity: this.rarity,
      icon: this.icon,
      isCompleted: this.isCompleted
    };
  }
}

/**
 * 战斗事件类
 */
export class BattleEvent extends DungeonEvent {
  constructor(config) {
    super({
      ...config,
      type: EVENT_TYPES.BATTLE,
      icon: config.icon || '⚔️'
    });
    
    this.enemies = config.enemies || [];
    this.difficulty = config.difficulty || 1;
  }

  execute(playerState, choice = null) {
    // 战斗逻辑
    const battleResult = this.simulateBattle(playerState);
    
    if (battleResult.victory) {
      return super.execute(playerState, 'victory');
    } else {
      return super.execute(playerState, 'defeat');
    }
  }

  simulateBattle(playerState) {
    // 简化的战斗模拟
    const playerPower = playerState.attack + playerState.level * 2;
    const enemyPower = this.difficulty * 10;
    
    const victory = playerPower > enemyPower * 0.8; // 80%胜率阈值
    
    return {
      victory,
      damage: victory ? Math.floor(Math.random() * 20) : Math.floor(Math.random() * 40),
      experience: victory ? this.difficulty * 10 : 0
    };
  }
}

/**
 * 宝藏事件类
 */
export class TreasureEvent extends DungeonEvent {
  constructor(config) {
    super({
      ...config,
      type: EVENT_TYPES.TREASURE,
      icon: config.icon || '💰'
    });
    
    this.treasures = config.treasures || [];
  }

  execute(playerState, choice = null) {
    const selectedTreasure = choice ? this.treasures[choice] : this.treasures[0];
    
    if (selectedTreasure) {
      playerState.inventory.push(selectedTreasure);
    }

    return super.execute(playerState, choice);
  }
}

/**
 * 休息事件类
 */
export class RestEvent extends DungeonEvent {
  constructor(config) {
    super({
      ...config,
      type: EVENT_TYPES.REST,
      icon: config.icon || '🛌'
    });
    
    this.healAmount = config.healAmount || 30;
  }

  execute(playerState, choice = null) {
    const healAmount = choice === 'fullRest' ? this.healAmount * 2 : this.healAmount;
    
    playerState.health = Math.min(
      playerState.maxHealth,
      playerState.health + healAmount
    );

    return {
      success: true,
      message: `休息恢复了 ${healAmount} 点生命值`,
      changes: { health: healAmount },
      rewards: []
    };
  }
}

/**
 * 商人事件类
 */
export class MerchantEvent extends DungeonEvent {
  constructor(config) {
    super({
      ...config,
      type: EVENT_TYPES.MERCHANT,
      icon: config.icon || '🛒'
    });
    
    this.shop = config.shop || [];
  }

  execute(playerState, choice = null) {
    if (choice && choice.action === 'buy') {
      const item = this.shop.find(item => item.id === choice.itemId);
      if (item && playerState.gold >= item.price) {
        playerState.gold -= item.price;
        playerState.inventory.push(item);
        
        return {
          success: true,
          message: `购买了 ${item.name}`,
          changes: { gold: -item.price },
          rewards: [item]
        };
      }
    }

    return super.execute(playerState, choice);
  }
} 