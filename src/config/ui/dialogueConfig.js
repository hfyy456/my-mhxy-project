/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-22 00:00:38
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-22 00:07:15
 */
export const dialogues = {
  // 老村长 (npc_001)
  elder_welcome: {
    initial: 'npc_elder_dialogue_1', // 初始对话节点ID
    nodes: {
      npc_elder_dialogue_1: {
        text: "你好，年轻的旅者。欢迎来到我们的村庄。最近村子附近有些不太平，你愿意帮忙调查一下吗？",
        options: [
          { text: "非常乐意，村长请讲。", nextNode: 'npc_elder_dialogue_accept_quest', action: { type: 'START_QUEST', questId: 'quest_001' } },
          { text: "我只是路过，暂时不了。", nextNode: 'npc_elder_dialogue_goodbye' },
        ],
      },
      npc_elder_dialogue_accept_quest: {
        text: "太好了！请去村外的森林边缘看看，据说那里有野狼出没。这是给你的信物，如果遇到麻烦，或许能用上。",
        options: [
          { text: "我明白了，这就出发。", nextNode: null, action: { type: 'END_INTERACTION' } }, // null nextNode 结束对话
        ],
        rewards: [ { type: 'ITEM', itemId: 'item_village_token', quantity: 1 } ] // 示例奖励
      },
      npc_elder_dialogue_goodbye: {
        text: "好吧，旅途顺利。如果你改变主意，随时可以来找我。",
        options: [
          { text: "再见，村长。", nextNode: null, action: { type: 'END_INTERACTION' } },
        ],
      },
    },
    // 可以为特定任务状态定义不同的入口对话
    // quest_001_active: 'npc_elder_dialogue_quest_active_reminder',
    // npc_elder_dialogue_quest_active_reminder: {
    //   text: "森林边缘的调查怎么样了？有什么发现吗？",
    //   options: [ { text: "正在调查。", nextNode: null, action: { type: 'END_INTERACTION' } } ]
    // },
  },

  // 铁匠铺老板 (npc_002)
  blacksmith_services: {
    initial: 'npc_blacksmith_dialogue_1',
    nodes: {
      npc_blacksmith_dialogue_1: {
        text: "需要锻造些什么吗？还是想看看我这里有什么好货？",
        options: [
          { text: "我想看看商品。", nextNode: 'npc_blacksmith_dialogue_shop', action: { type: 'OPEN_SHOP', shopId: 'blacksmith_shop'} },
          { text: "只是随便看看。", nextNode: 'npc_blacksmith_dialogue_goodbye' },
        ],
      },
      npc_blacksmith_dialogue_shop: {
        text: "随便挑，都是些耐用的家伙。", // 实际商店UI会在这里打开
        options: [
          { text: "多谢。", nextNode: null, action: { type: 'END_INTERACTION' } },
        ],
      },
      npc_blacksmith_dialogue_goodbye: {
        text: "慢走，需要什么再来！",
        options: [
          { text: "告辞。", nextNode: null, action: { type: 'END_INTERACTION' } },
        ],
      },
    },
  },
  
  default_greeting: {
    initial: 'default_greeting_node',
    nodes: {
        default_greeting_node: {
            text: "你好。",
            options: [
                { text: "再见。", nextNode: null, action: { type: 'END_INTERACTION' } }
            ]
        }
    }
  }
}; 