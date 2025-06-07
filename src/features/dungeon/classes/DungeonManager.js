import { DungeonTree } from './DungeonTree.js';
import { BattleEvent, TreasureEvent, RestEvent, MerchantEvent, EVENT_TYPES, EVENT_RARITIES } from './DungeonEvent.js';

/**
 * 玩家状态类
 */
export class PlayerState {
  constructor(initialState = {}) {
    this.playerId = initialState.playerId || 'player_1';
    this.level = initialState.level || 1;
    this.health = initialState.health || 100;
    this.maxHealth = initialState.maxHealth || 100;
    this.attack = initialState.attack || 20;
    this.defense = initialState.defense || 10;
    this.gold = initialState.gold || 100;
    this.experience = initialState.experience || 0;
    this.inventory = initialState.inventory || [];
    this.skills = initialState.skills || [];
    this.buffs = initialState.buffs || [];
    this.debuffs = initialState.debuffs || [];
  }

  /**
   * 创建玩家状态快照
   */
  createSnapshot() {
    return {
      playerId: this.playerId,
      level: this.level,
      health: this.health,
      maxHealth: this.maxHealth,
      attack: this.attack,
      defense: this.defense,
      gold: this.gold,
      experience: this.experience,
      inventory: [...this.inventory],
      skills: [...this.skills],
      buffs: [...this.buffs],
      debuffs: [...this.debuffs]
    };
  }

  /**
   * 从快照恢复玩家状态
   */
  restoreFromSnapshot(snapshot) {
    Object.assign(this, snapshot);
    this.inventory = [...snapshot.inventory];
    this.skills = [...snapshot.skills];
    this.buffs = [...snapshot.buffs];
    this.debuffs = [...snapshot.debuffs];
  }

  /**
   * 检查玩家是否存活
   */
  isAlive() {
    return this.health > 0;
  }

  /**
   * 治疗玩家
   */
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    return this.health;
  }

  /**
   * 造成伤害
   */
  takeDamage(amount) {
    const actualDamage = Math.max(0, amount - this.defense);
    this.health = Math.max(0, this.health - actualDamage);
    return actualDamage;
  }

  /**
   * 获得经验值
   */
  gainExperience(amount) {
    this.experience += amount;
    const expForNextLevel = this.level * 100;
    
    if (this.experience >= expForNextLevel) {
      this.levelUp();
    }
  }

  /**
   * 升级
   */
  levelUp() {
    this.level++;
    this.maxHealth += 20;
    this.health = this.maxHealth; // 升级时恢复满血
    this.attack += 5;
    this.defense += 3;
    
    return {
      newLevel: this.level,
      healthIncrease: 20,
      attackIncrease: 5,
      defenseIncrease: 3
    };
  }
}

/**
 * 副本管理器
 */
export class DungeonManager {
  constructor() {
    this.dungeons = new Map(); // 存储所有副本实例
    this.activeDungeons = new Map(); // 存储玩家当前进行的副本
    this.playerStates = new Map(); // 存储玩家状态
    this.dungeonTemplates = new Map(); // 存储副本模板
    
    this.initializeDefaultTemplates();
  }

  /**
   * 初始化默认副本模板
   */
  initializeDefaultTemplates() {
    // 新手副本
    this.registerDungeonTemplate('beginner_dungeon', {
      id: 'beginner_dungeon',
      name: '新手试炼',
      description: '专为新手冒险者设计的入门副本',
      difficulty: 1,
      maxDepth: 5,
      levelRequirement: 1,
      eventPool: this.createBeginnerEventPool(),
      bossEvent: new BattleEvent({
        id: 'beginner_boss',
        name: '试炼守护者',
        description: '守护试炼之地的强大存在',
        difficulty: 2,
        enemies: ['试炼守护者'],
        consequences: {
          victory: {
            message: '成功击败了试炼守护者！',
            gold: 200,
            rewards: [{
              id: 'beginner_sword',
              name: '试炼之剑',
              type: 'weapon',
              attack: 10
            }]
          },
          defeat: {
            message: '被试炼守护者击败了...',
            health: -50
          }
        }
      })
    });

    // 中级副本
    this.registerDungeonTemplate('intermediate_dungeon', {
      id: 'intermediate_dungeon',
      name: '暗影密林',
      description: '充满危险的神秘森林',
      difficulty: 3,
      maxDepth: 8,
      levelRequirement: 5,
      eventPool: this.createIntermediateEventPool(),
      bossEvent: new BattleEvent({
        id: 'shadow_lord',
        name: '暗影领主',
        description: '操控黑暗力量的邪恶存在',
        difficulty: 5,
        enemies: ['暗影领主'],
        consequences: {
          victory: {
            message: '成功净化了暗影密林！',
            gold: 500,
            experience: 200,
            rewards: [{
              id: 'shadow_cloak',
              name: '暗影斗篷',
              type: 'armor',
              defense: 15
            }]
          },
          defeat: {
            message: '被暗影力量吞噬了...',
            health: -80
          }
        }
      })
    });

    // 高级副本
    this.registerDungeonTemplate('advanced_dungeon', {
      id: 'advanced_dungeon',
      name: '龙族巢穴',
      description: '传说中的巨龙栖息之地',
      difficulty: 5,
      maxDepth: 12,
      levelRequirement: 10,
      eventPool: this.createAdvancedEventPool(),
      bossEvent: new BattleEvent({
        id: 'ancient_dragon',
        name: '远古巨龙',
        description: '拥有无穷力量的传说巨龙',
        difficulty: 10,
        enemies: ['远古巨龙'],
        consequences: {
          victory: {
            message: '击败了传说中的远古巨龙！',
            gold: 1000,
            experience: 500,
            rewards: [{
              id: 'dragon_scale_armor',
              name: '龙鳞战甲',
              type: 'armor',
              defense: 30
            }, {
              id: 'dragon_heart',
              name: '龙之心',
              type: 'consumable',
              effect: 'permanent_health_bonus',
              value: 100
            }]
          },
          defeat: {
            message: '被龙炎焚烧殆尽...',
            health: -150
          }
        }
      })
    });
  }

  /**
   * 创建新手事件池
   */
  createBeginnerEventPool() {
    return [
      {
        id: 'small_battle',
        name: '史莱姆遭遇',
        description: '一只可爱但有些危险的史莱姆',
        type: EVENT_TYPES.BATTLE,
        rarity: EVENT_RARITIES.COMMON,
        difficulty: 1,
        consequences: {
          victory: { gold: 20, experience: 10, message: '击败了史莱姆！' },
          defeat: { health: -10, message: '被史莱姆黏住了...' }
        }
      },
      {
        id: 'healing_spring',
        name: '治疗之泉',
        description: '一汪清澈的泉水散发着治疗的光芒',
        type: EVENT_TYPES.REST,
        rarity: EVENT_RARITIES.COMMON,
        consequences: {
          message: '泉水恢复了你的体力',
          health: 30
        }
      },
      {
        id: 'small_treasure',
        name: '小宝箱',
        description: '一个小巧的木制宝箱',
        type: EVENT_TYPES.TREASURE,
        rarity: EVENT_RARITIES.COMMON,
        consequences: {
          message: '发现了一些金币',
          gold: 50
        }
      }
    ];
  }

  /**
   * 创建中级事件池
   */
  createIntermediateEventPool() {
    return [
      {
        id: 'shadow_wolf',
        name: '暗影狼',
        description: '潜伏在阴影中的狡猾野兽',
        type: EVENT_TYPES.BATTLE,
        rarity: EVENT_RARITIES.COMMON,
        difficulty: 3,
        consequences: {
          victory: { gold: 80, experience: 30, message: '击败了暗影狼！' },
          defeat: { health: -30, message: '被暗影狼撕咬...' }
        }
      },
      {
        id: 'mysterious_merchant',
        name: '神秘商人',
        description: '一个戴着兜帽的神秘商人',
        type: EVENT_TYPES.MERCHANT,
        rarity: EVENT_RARITIES.UNCOMMON,
        shop: [
          { id: 'health_potion', name: '生命药水', price: 50, effect: 'heal', value: 50 },
          { id: 'strength_elixir', name: '力量药剂', price: 100, effect: 'attack_boost', value: 10 }
        ]
      },
      {
        id: 'enchanted_chest',
        name: '魔法宝箱',
        description: '散发着魔法光芒的精美宝箱',
        type: EVENT_TYPES.TREASURE,
        rarity: EVENT_RARITIES.RARE,
        consequences: {
          message: '获得了魔法装备',
          rewards: [{
            id: 'magic_ring',
            name: '魔法戒指',
            type: 'accessory',
            defense: 5
          }]
        }
      }
    ];
  }

  /**
   * 创建高级事件池
   */
  createAdvancedEventPool() {
    return [
      {
        id: 'dragon_spawn',
        name: '幼龙',
        description: '一只年幼但依然危险的龙族后裔',
        type: EVENT_TYPES.ELITE,
        rarity: EVENT_RARITIES.UNCOMMON,
        difficulty: 6,
        consequences: {
          victory: { gold: 200, experience: 100, message: '击败了幼龙！' },
          defeat: { health: -60, message: '被龙息烧伤...' }
        }
      },
      {
        id: 'dragon_hoard',
        name: '龙族宝库',
        description: '堆满宝藏的巨龙收藏室',
        type: EVENT_TYPES.TREASURE,
        rarity: EVENT_RARITIES.LEGENDARY,
        consequences: {
          message: '发现了传说级宝藏',
          gold: 500,
          rewards: [{
            id: 'legendary_weapon',
            name: '传说武器',
            type: 'weapon',
            attack: 25
          }]
        }
      },
      {
        id: 'ancient_altar',
        name: '远古祭坛',
        description: '散发着神秘力量的古老祭坛',
        type: EVENT_TYPES.MYSTERY,
        rarity: EVENT_RARITIES.RARE,
        consequences: {
          blessing: {
            message: '获得了远古祝福',
            maxHealth: 50,
            attack: 10
          },
          curse: {
            message: '受到了远古诅咒',
            maxHealth: -20,
            attack: -5
          }
        }
      }
    ];
  }

  /**
   * 注册副本模板
   */
  registerDungeonTemplate(templateId, template) {
    this.dungeonTemplates.set(templateId, template);
  }

  /**
   * 获取副本模板
   */
  getDungeonTemplate(templateId) {
    return this.dungeonTemplates.get(templateId);
  }

  /**
   * 获取所有可用副本模板
   */
  getAvailableTemplates(playerLevel = 1) {
    const availableTemplates = [];
    
    this.dungeonTemplates.forEach((template, id) => {
      if (playerLevel >= (template.levelRequirement || 1)) {
        availableTemplates.push({
          id,
          name: template.name,
          description: template.description,
          difficulty: template.difficulty,
          levelRequirement: template.levelRequirement || 1,
          maxDepth: template.maxDepth
        });
      }
    });
    
    return availableTemplates;
  }

  /**
   * 创建新副本实例
   */
  createDungeon(templateId, playerId) {
    const template = this.getDungeonTemplate(templateId);
    if (!template) {
      throw new Error(`未找到副本模板: ${templateId}`);
    }

    const dungeonId = `${templateId}_${playerId}_${Date.now()}`;
    const dungeon = new DungeonTree({
      ...template,
      id: dungeonId
    });

    this.dungeons.set(dungeonId, dungeon);
    this.activeDungeons.set(playerId, dungeonId);

    return { dungeonId, dungeon };
  }

  /**
   * 获取玩家当前副本
   */
  getPlayerDungeon(playerId) {
    const dungeonId = this.activeDungeons.get(playerId);
    if (!dungeonId) return null;
    
    return this.dungeons.get(dungeonId);
  }

  /**
   * 获取或创建玩家状态
   */
  getPlayerState(playerId) {
    if (!this.playerStates.has(playerId)) {
      this.playerStates.set(playerId, new PlayerState({ playerId }));
    }
    return this.playerStates.get(playerId);
  }

  /**
   * 开始副本
   */
  startDungeon(templateId, playerId) {
    const playerState = this.getPlayerState(playerId);
    const template = this.getDungeonTemplate(templateId);
    
    if (!template) {
      throw new Error(`未找到副本模板: ${templateId}`);
    }

    if (playerState.level < (template.levelRequirement || 1)) {
      throw new Error(`等级不足，需要等级 ${template.levelRequirement}`);
    }

    // 如果玩家已经在进行副本，先结束当前副本
    if (this.activeDungeons.has(playerId)) {
      this.abandonDungeon(playerId);
    }

    const { dungeonId, dungeon } = this.createDungeon(templateId, playerId);
    
    return {
      dungeonId,
      dungeonState: dungeon.getDungeonState(),
      playerState: playerState.createSnapshot()
    };
  }

  /**
   * 在副本中做出选择
   */
  makeChoice(playerId, choice) {
    const dungeon = this.getPlayerDungeon(playerId);
    const playerState = this.getPlayerState(playerId);
    
    if (!dungeon) {
      throw new Error('玩家当前没有进行副本');
    }

    // 执行当前事件
    const currentEvent = dungeon.currentNode.event;
    let eventResult = null;
    
    if (currentEvent) {
      try {
        eventResult = currentEvent.execute(playerState, choice);
      } catch (error) {
        eventResult = {
          success: false,
          message: error.message,
          changes: {},
          rewards: []
        };
      }
    }

    // 移动到下一个节点
    const moveResult = dungeon.makeChoice(choice);
    
    // 检查玩家是否死亡
    if (!playerState.isAlive()) {
      this.abandonDungeon(playerId);
      return {
        eventResult,
        moveResult,
        dungeonState: dungeon.getDungeonState(),
        playerState: playerState.createSnapshot(),
        gameOver: true,
        message: '你在副本中死亡了...'
      };
    }

    return {
      eventResult,
      moveResult,
      dungeonState: dungeon.getDungeonState(),
      playerState: playerState.createSnapshot(),
      gameOver: false
    };
  }

  /**
   * 放弃副本
   */
  abandonDungeon(playerId) {
    const dungeonId = this.activeDungeons.get(playerId);
    if (dungeonId) {
      this.dungeons.delete(dungeonId);
      this.activeDungeons.delete(playerId);
      return true;
    }
    return false;
  }

  /**
   * 完成副本
   */
  completeDungeon(playerId) {
    const dungeon = this.getPlayerDungeon(playerId);
    const playerState = this.getPlayerState(playerId);
    
    if (!dungeon || !dungeon.isCompleted()) {
      return null;
    }

    const completionRewards = {
      experience: dungeon.difficulty * 50,
      gold: dungeon.difficulty * 100,
      items: []
    };

    // 给予完成奖励
    playerState.gainExperience(completionRewards.experience);
    playerState.gold += completionRewards.gold;

    // 清理副本
    this.abandonDungeon(playerId);

    return {
      rewards: completionRewards,
      playerState: playerState.createSnapshot(),
      message: `成功完成副本：${dungeon.name}！`
    };
  }

  /**
   * 获取副本统计信息
   */
  getDungeonStats() {
    return {
      totalDungeons: this.dungeons.size,
      activeDungeons: this.activeDungeons.size,
      registeredTemplates: this.dungeonTemplates.size,
      activePlayers: this.playerStates.size
    };
  }
} 