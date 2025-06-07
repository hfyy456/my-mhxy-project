// 节点交互处理系统
import { NODE_INTERACTION_TYPES } from '@/config/map/worldMapConfig';

export class NodeInteractionHandler {
  constructor(dispatch, showToast) {
    this.dispatch = dispatch;
    this.showToast = showToast;
  }

  // 处理节点交互
  async handleInteraction({ regionId, nodeId, interaction }) {
    const { type, name, description } = interaction;
    
    this.showToast(`开始执行: ${name}`, 'info');
    
    try {
      switch (type) {
        case NODE_INTERACTION_TYPES.NPC.id:
          return await this.handleNpcInteraction(interaction);
        
        case NODE_INTERACTION_TYPES.EVENT.id:
          return await this.handleEventInteraction(interaction);
        
        case NODE_INTERACTION_TYPES.BATTLE.id:
          return await this.handleBattleInteraction(interaction);
        
        case NODE_INTERACTION_TYPES.DUNGEON.id:
          return await this.handleDungeonInteraction(interaction);
        
        case NODE_INTERACTION_TYPES.QUEST.id:
          return await this.handleQuestInteraction(interaction);
        
        case NODE_INTERACTION_TYPES.SHOP.id:
          return await this.handleShopInteraction(interaction);
        
        case NODE_INTERACTION_TYPES.TELEPORT.id:
          return await this.handleTeleportInteraction(interaction);
        
        default:
          throw new Error(`未知的交互类型: ${type}`);
      }
    } catch (error) {
      this.showToast(`交互失败: ${error.message}`, 'error');
      console.error('节点交互处理失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 处理NPC对话
  async handleNpcInteraction(interaction) {
    const { npcId, name, description, rewards } = interaction;
    
    // 模拟NPC对话处理
    await this.simulateDelay(1000);
    
    // 这里可以触发NPC对话界面
    // this.dispatch(openNpcDialogAction({ npcId, interaction }));
    
    // 给予奖励
    if (rewards && rewards.length > 0) {
      this.giveRewards(rewards);
    }
    
    this.showToast(`与 ${name} 对话完成`, 'success');
    
    return {
      success: true,
      type: 'npc_dialogue',
      message: `成功与 ${name} 进行了对话`,
      rewards
    };
  }

  // 处理事件触发
  async handleEventInteraction(interaction) {
    const { eventId, name, description, rewards } = interaction;
    
    // 模拟事件处理
    await this.simulateDelay(1500);
    
    // 随机事件结果
    const success = Math.random() > 0.3; // 70% 成功率
    
    if (success) {
      // 给予奖励
      if (rewards && rewards.length > 0) {
        this.giveRewards(rewards);
      }
      
      this.showToast(`事件 "${name}" 成功完成`, 'success');
      
      return {
        success: true,
        type: 'event',
        message: `成功触发事件: ${name}`,
        rewards
      };
    } else {
      this.showToast(`事件 "${name}" 失败了`, 'warning');
      
      return {
        success: false,
        type: 'event',
        message: `事件失败: ${name}`
      };
    }
  }

  // 处理战斗
  async handleBattleInteraction(interaction) {
    const { battleId, name, enemyTeam, levelRange, difficulty } = interaction;
    
    this.showToast(`准备战斗: ${name}`, 'info');
    
    // 这里应该启动战斗系统
    // this.dispatch(initiateBattleAction({
    //   battleId,
    //   enemyTeam,
    //   difficulty,
    //   source: 'world_map_node'
    // }));
    
    // 模拟战斗结果
    await this.simulateDelay(2000);
    
    const victory = Math.random() > 0.2; // 80% 胜利率
    
    if (victory) {
      // 战斗胜利奖励
      const battleRewards = [
        { type: 'exp', amount: Math.floor(Math.random() * 200) + 100 },
        { type: 'gold', amount: Math.floor(Math.random() * 100) + 50 }
      ];
      
      this.giveRewards(battleRewards);
      this.showToast(`战斗胜利!`, 'success');
      
      return {
        success: true,
        type: 'battle',
        message: `战斗胜利: ${name}`,
        rewards: battleRewards
      };
    } else {
      this.showToast(`战斗失败...`, 'error');
      
      return {
        success: false,
        type: 'battle',
        message: `战斗失败: ${name}`
      };
    }
  }

  // 处理副本
  async handleDungeonInteraction(interaction) {
    const { dungeonId, name, difficulty, levelRequirement, rewards } = interaction;
    
    this.showToast(`进入副本: ${name}`, 'info');
    
    // 这里应该启动副本系统
    // this.dispatch(enterDungeonAction({
    //   dungeonId,
    //   difficulty,
    //   source: 'world_map_node'
    // }));
    
    // 模拟副本完成
    await this.simulateDelay(3000);
    
    const completion = Math.random();
    let result;
    
    if (completion > 0.7) {
      // 完美通关
      const dungeonRewards = [
        ...rewards,
        { type: 'exp', amount: Math.floor(Math.random() * 500) + 300 },
        { type: 'rare_item', id: 'dungeon_treasure', amount: 1 }
      ];
      
      this.giveRewards(dungeonRewards);
      this.showToast(`副本完美通关!`, 'success');
      
      result = {
        success: true,
        type: 'dungeon',
        completion: 'perfect',
        message: `完美通关副本: ${name}`,
        rewards: dungeonRewards
      };
    } else if (completion > 0.4) {
      // 普通通关
      this.giveRewards(rewards);
      this.showToast(`副本通关`, 'success');
      
      result = {
        success: true,
        type: 'dungeon',
        completion: 'normal',
        message: `通关副本: ${name}`,
        rewards
      };
    } else {
      // 失败
      this.showToast(`副本挑战失败`, 'error');
      
      result = {
        success: false,
        type: 'dungeon',
        completion: 'failed',
        message: `副本挑战失败: ${name}`
      };
    }
    
    return result;
  }

  // 处理任务
  async handleQuestInteraction(interaction) {
    const { questId, name, description } = interaction;
    
    // 这里应该启动任务系统
    // this.dispatch(acceptQuestAction({ questId, source: 'world_map_node' }));
    
    this.showToast(`接受任务: ${name}`, 'info');
    
    return {
      success: true,
      type: 'quest',
      message: `已接受任务: ${name}`,
      questId
    };
  }

  // 处理商店
  async handleShopInteraction(interaction) {
    const { shopId, name } = interaction;
    
    // 这里应该打开商店界面
    // this.dispatch(openShopAction({ shopId, source: 'world_map_node' }));
    
    this.showToast(`打开商店: ${name}`, 'info');
    
    return {
      success: true,
      type: 'shop',
      message: `已打开商店: ${name}`,
      shopId
    };
  }

  // 处理传送
  async handleTeleportInteraction(interaction) {
    const { teleportTargets, name } = interaction;
    
    // 这里应该打开传送选择界面
    // this.dispatch(openTeleportMenuAction({ 
    //   targets: teleportTargets, 
    //   source: 'world_map_node' 
    // }));
    
    this.showToast(`打开传送菜单`, 'info');
    
    return {
      success: true,
      type: 'teleport',
      message: `已打开传送菜单`,
      teleportTargets
    };
  }

  // 给予奖励
  giveRewards(rewards) {
    if (!rewards || rewards.length === 0) return;
    
    rewards.forEach(reward => {
      switch (reward.type) {
        case 'exp':
          // this.dispatch(gainExperienceAction(reward.amount));
          this.showToast(`获得经验 +${reward.amount}`, 'success');
          break;
        
        case 'gold':
          // this.dispatch(gainGoldAction(reward.amount));
          this.showToast(`获得金币 +${reward.amount}`, 'success');
          break;
        
        case 'item':
          // this.dispatch(addItemAction({ id: reward.id, amount: reward.amount }));
          this.showToast(`获得道具: ${reward.id} x${reward.amount}`, 'success');
          break;
        
        case 'rare_item':
          // this.dispatch(addItemAction({ id: reward.id, amount: reward.amount }));
          this.showToast(`获得稀有道具: ${reward.id} x${reward.amount}`, 'epic');
          break;
        
        default:
          this.showToast(`获得奖励: ${reward.type}`, 'info');
      }
    });
  }

  // 模拟延迟
  simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 创建交互处理器实例的工厂函数
export const createNodeInteractionHandler = (dispatch, showToast) => {
  return new NodeInteractionHandler(dispatch, showToast);
};

// 交互结果类型定义
export const INTERACTION_RESULT_TYPES = {
  NPC_DIALOGUE: 'npc_dialogue',
  EVENT: 'event',
  BATTLE: 'battle',
  DUNGEON: 'dungeon',
  QUEST: 'quest',
  SHOP: 'shop',
  TELEPORT: 'teleport'
};

// 交互状态定义
export const INTERACTION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
}; 