import { DungeonEvent } from './DungeonEvent.js';

/**
 * 副本树节点类
 */
export class DungeonNode {
  constructor(event, depth = 0) {
    this.id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.event = event;
    this.depth = depth;
    this.leftChild = null;   // 左选择分支
    this.rightChild = null;  // 右选择分支
    this.parent = null;
    this.isVisited = false;
    this.isCurrentNode = false;
    
    // 选择信息
    this.leftChoice = null;
    this.rightChoice = null;
  }

  /**
   * 设置左子节点
   */
  setLeftChild(node, choiceInfo = null) {
    this.leftChild = node;
    this.leftChoice = choiceInfo;
    if (node) {
      node.parent = this;
    }
    return this;
  }

  /**
   * 设置右子节点
   */
  setRightChild(node, choiceInfo = null) {
    this.rightChild = node;
    this.rightChoice = choiceInfo;
    if (node) {
      node.parent = this;
    }
    return this;
  }

  /**
   * 检查是否是叶子节点
   */
  isLeaf() {
    return !this.leftChild && !this.rightChild;
  }

  /**
   * 检查是否是根节点
   */
  isRoot() {
    return !this.parent;
  }

  /**
   * 获取节点路径
   */
  getPath() {
    const path = [];
    let current = this;
    while (current.parent) {
      const isLeft = current.parent.leftChild === current;
      path.unshift(isLeft ? 'left' : 'right');
      current = current.parent;
    }
    return path;
  }

  /**
   * 获取节点信息
   */
  getNodeInfo() {
    return {
      id: this.id,
      depth: this.depth,
      isVisited: this.isVisited,
      isCurrentNode: this.isCurrentNode,
      isLeaf: this.isLeaf(),
      isRoot: this.isRoot(),
      event: this.event ? this.event.getDisplayInfo() : null,
      leftChoice: this.leftChoice,
      rightChoice: this.rightChoice,
      hasChildren: !!(this.leftChild || this.rightChild)
    };
  }
}

/**
 * 副本树管理器
 */
export class DungeonTree {
  constructor(dungeonConfig) {
    this.id = dungeonConfig.id;
    this.name = dungeonConfig.name;
    this.description = dungeonConfig.description;
    this.difficulty = dungeonConfig.difficulty || 1;
    this.maxDepth = dungeonConfig.maxDepth || 10;
    this.root = null;
    this.currentNode = null;
    this.completedNodes = new Set();
    this.totalNodes = 0;
    
    // 事件生成配置
    this.eventPool = dungeonConfig.eventPool || [];
    this.bossEvent = dungeonConfig.bossEvent || null;
    
    this.generateTree();
  }

  /**
   * 生成副本树
   */
  generateTree() {
    // 创建起始事件
    const startEvent = this.createStartEvent();
    this.root = new DungeonNode(startEvent, 0);
    this.currentNode = this.root;
    this.currentNode.isCurrentNode = true;
    
    // 递归生成树结构
    this.generateBranches(this.root);
    this.totalNodes = this.countNodes();
  }

  /**
   * 创建起始事件
   */
  createStartEvent() {
    return new DungeonEvent({
      id: 'dungeon_start',
      name: '副本入口',
      description: '你站在副本的入口处，前方有两条道路...',
      type: 'start',
      icon: '🚪',
      consequences: {
        message: '开始探索副本！'
      }
    });
  }

  /**
   * 递归生成分支
   */
  generateBranches(node, depth = 0) {
    if (depth >= this.maxDepth) {
      // 达到最大深度，创建Boss节点
      if (this.bossEvent) {
        const bossNode = new DungeonNode(this.bossEvent, depth + 1);
        node.setLeftChild(bossNode, { 
          name: '挑战Boss', 
          description: '直面最终挑战！',
          icon: '👑' 
        });
        node.setRightChild(bossNode, { 
          name: '挑战Boss', 
          description: '直面最终挑战！',
          icon: '👑' 
        });
      }
      return;
    }

    // 生成左右两个事件
    const leftEvent = this.generateRandomEvent(depth + 1);
    const rightEvent = this.generateRandomEvent(depth + 1);

    const leftNode = new DungeonNode(leftEvent, depth + 1);
    const rightNode = new DungeonNode(rightEvent, depth + 1);

    // 设置选择信息
    const leftChoice = this.generateChoiceInfo(leftEvent, 'left');
    const rightChoice = this.generateChoiceInfo(rightEvent, 'right');

    node.setLeftChild(leftNode, leftChoice);
    node.setRightChild(rightNode, rightChoice);

    // 递归生成子分支
    this.generateBranches(leftNode, depth + 1);
    this.generateBranches(rightNode, depth + 1);
  }

  /**
   * 生成随机事件
   */
  generateRandomEvent(depth) {
    if (this.eventPool.length === 0) {
      return this.createDefaultEvent(depth);
    }

    // 根据深度调整事件概率
    let filteredEvents = this.eventPool.filter(event => {
      if (depth <= 3) return event.rarity !== 'legendary';
      if (depth <= 6) return event.rarity !== 'common';
      return true;
    });

    // 如果过滤后事件池为空，则使用原始事件池
    if (filteredEvents.length === 0) {
      filteredEvents = this.eventPool;
    }

    const eventTemplate = filteredEvents[Math.floor(Math.random() * filteredEvents.length)];
    return this.createEventFromTemplate(eventTemplate, depth);
  }

  /**
   * 从模板创建事件
   */
  createEventFromTemplate(template, depth) {
    const difficultyMultiplier = 1 + (depth * 0.2);
    
    return new DungeonEvent({
      ...template,
      id: `${template.id}_${depth}_${Math.random().toString(36).substr(2, 6)}`,
      difficulty: (template.difficulty || 1) * difficultyMultiplier
    });
  }

  /**
   * 创建默认事件
   */
  createDefaultEvent(depth) {
    const events = [
      {
        name: '神秘遭遇',
        description: '你遇到了意想不到的情况...',
        type: 'random',
        icon: '❓'
      },
      {
        name: '小怪战斗',
        description: '一群小怪阻挡了你的去路',
        type: 'battle',
        icon: '⚔️'
      },
      {
        name: '宝箱',
        description: '你发现了一个闪闪发光的宝箱',
        type: 'treasure',
        icon: '💰'
      }
    ];

    const template = events[Math.floor(Math.random() * events.length)];
    return new DungeonEvent({
      ...template,
      id: `default_${depth}_${Math.random().toString(36).substr(2, 6)}`
    });
  }

  /**
   * 生成选择信息
   */
  generateChoiceInfo(event, side) {
    const choices = {
      battle: {
        left: { name: '正面迎战', description: '勇敢地冲向敌人', icon: '⚔️' },
        right: { name: '谨慎应对', description: '小心地观察敌人', icon: '🛡️' }
      },
      treasure: {
        left: { name: '直接打开', description: '立即打开宝箱', icon: '💰' },
        right: { name: '检查陷阱', description: '先检查是否有陷阱', icon: '🔍' }
      },
      rest: {
        left: { name: '短暂休息', description: '快速恢复体力', icon: '😴' },
        right: { name: '深度休息', description: '完全恢复健康', icon: '🛌' }
      },
      merchant: {
        left: { name: '查看商品', description: '看看有什么好东西', icon: '🛒' },
        right: { name: '讨价还价', description: '尝试获得更好的价格', icon: '💰' }
      }
    };

    const typeChoices = choices[event.type] || {
      left: { name: '左路', description: '选择左边的道路', icon: '⬅️' },
      right: { name: '右路', description: '选择右边的道路', icon: '➡️' }
    };

    return typeChoices[side] || typeChoices.left;
  }

  /**
   * 做出选择，移动到下一个节点
   */
  makeChoice(choice) {
    if (!this.currentNode || this.isCompleted()) {
      throw new Error('当前没有可选择的节点');
    }

    let nextNode = null;
    let selectedChoice = null;

    if (choice === 'left' && this.currentNode.leftChild) {
      nextNode = this.currentNode.leftChild;
      selectedChoice = this.currentNode.leftChoice;
    } else if (choice === 'right' && this.currentNode.rightChild) {
      nextNode = this.currentNode.rightChild;
      selectedChoice = this.currentNode.rightChoice;
    } else {
      throw new Error('无效的选择');
    }

    // 标记当前节点为已访问
    this.currentNode.isVisited = true;
    this.currentNode.isCurrentNode = false;
    this.completedNodes.add(this.currentNode.id);

    // 移动到下一个节点
    this.currentNode = nextNode;
    this.currentNode.isCurrentNode = true;

    return {
      previousNode: this.currentNode.parent,
      currentNode: this.currentNode,
      choice: selectedChoice,
      isCompleted: this.isCompleted()
    };
  }

  /**
   * 检查副本是否完成
   */
  isCompleted() {
    return this.currentNode && this.currentNode.isLeaf();
  }

  /**
   * 获取当前选择
   */
  getCurrentChoices() {
    if (!this.currentNode) return null;

    return {
      left: this.currentNode.leftChoice,
      right: this.currentNode.rightChoice,
      canChooseLeft: !!this.currentNode.leftChild,
      canChooseRight: !!this.currentNode.rightChild
    };
  }

  /**
   * 计算总节点数
   */
  countNodes(node = this.root) {
    if (!node) return 0;
    return 1 + this.countNodes(node.leftChild) + this.countNodes(node.rightChild);
  }

  /**
   * 获取副本进度
   */
  getProgress() {
    return {
      completedNodes: this.completedNodes.size,
      totalNodes: this.totalNodes,
      currentDepth: this.currentNode ? this.currentNode.depth : 0,
      maxDepth: this.maxDepth,
      progressPercentage: (this.completedNodes.size / this.totalNodes) * 100
    };
  }

  /**
   * 获取副本状态
   */
  getDungeonState() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      difficulty: this.difficulty,
      currentNode: this.currentNode ? this.currentNode.getNodeInfo() : null,
      choices: this.getCurrentChoices(),
      progress: this.getProgress(),
      isCompleted: this.isCompleted()
    };
  }

  /**
   * 获取路径历史
   */
  getPathHistory() {
    if (!this.currentNode) return [];
    
    const history = [];
    let node = this.currentNode;
    
    while (node.parent) {
      const isLeft = node.parent.leftChild === node;
      history.unshift({
        choice: isLeft ? 'left' : 'right',
        choiceInfo: isLeft ? node.parent.leftChoice : node.parent.rightChoice,
        event: node.event ? node.event.getDisplayInfo() : null
      });
      node = node.parent;
    }
    
    return history;
  }
} 