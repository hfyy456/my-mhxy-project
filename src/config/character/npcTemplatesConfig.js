/**
 * NPC模板配置文件 - 面向对象配置化系统
 * 核心特性：无位置概念，可动态分配到不同场景
 * 
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-07
 */

import { NPC_TYPES, NPC_STATES } from "@/config/enumConfig";

// ===========================================
// 基础NPC模板
// ===========================================

export const npcTemplates = {
  // 村长模板
  village_elder: {
    templateId: "village_elder",
    name: "老村长",
    displayName: "老村长",
    description: "经验丰富的村庄领导者，掌握着村庄的历史和秘密。",
    sprite: "elder.png",
    avatar: "elder_avatar.png",
    type: NPC_TYPES.QUEST_GIVER,
    level: 10,
    faction: "village",
    
    // 对话系统
    dialogueKey: "elder_welcome",
    
    // 功能配置
    functions: {
      canGiveQuests: true,
      canTrade: false,
      canTeach: false,
      canUpgrade: false,
      canHeal: false
    },
    
    // 关联数据
    questIds: ["village_intro", "village_defense"],
    services: ["quest_giver", "information"],
    
    // 动态属性
    attributes: {
      friendliness: 80,
      reputation: 100,
      trust: 90
    },
    
    // 条件和限制
    conditions: {
      levelRequirement: 1,
      questRequirements: [],
      itemRequirements: [],
      timeRequirements: null
    },
    
    // 行为配置
    behavior: {
      greeting: "village_elder_greeting",
      farewell: "village_elder_farewell",
      idle: ["walking_around", "sitting_and_thinking"],
      special: {
        reaction_to_player_level: {
          low: "encouraging",
          high: "respectful"
        }
      }
    }
  },

  // 铁匠模板
  blacksmith: {
    templateId: "blacksmith",
    name: "铁匠老王",
    displayName: "铁匠老王",
    description: "技艺精湛的铁匠，能够锻造和升级装备。",
    sprite: "blacksmith.png",
    avatar: "blacksmith_avatar.png",
    type: NPC_TYPES.MERCHANT,
    level: 15,
    faction: "craftsmen",
    
    dialogueKey: "blacksmith_services",
    
    functions: {
      canGiveQuests: false,
      canTrade: true,
      canTeach: false,
      canUpgrade: true,
      canHeal: false
    },
    
    shopId: "blacksmith_shop",
    services: ["equipment_upgrade", "equipment_repair", "trade"],
    
    attributes: {
      friendliness: 60,
      reputation: 70,
      trust: 50
    },
    
    conditions: {
      levelRequirement: 5,
      questRequirements: [],
      itemRequirements: [],
      timeRequirements: null
    },
    
    behavior: {
      greeting: "blacksmith_greeting",
      farewell: "blacksmith_farewell",
      idle: ["hammering", "examining_equipment"],
      special: {
        equipment_quality_reaction: {
          low: "dismissive",
          high: "interested"
        }
      }
    }
  },

  // 药师模板
  alchemist: {
    templateId: "alchemist",
    name: "药师小李",
    displayName: "药师小李",
    description: "精通草药和炼丹术的药师，可以治疗和提供药品。",
    sprite: "alchemist.png",
    avatar: "alchemist_avatar.png",
    type: NPC_TYPES.MERCHANT,
    level: 12,
    faction: "healers",
    
    dialogueKey: "alchemist_services",
    
    functions: {
      canGiveQuests: true,
      canTrade: true,
      canTeach: false,
      canUpgrade: false,
      canHeal: true
    },
    
    shopId: "alchemist_shop",
    questIds: ["herb_collection", "rare_ingredients"],
    services: ["healing", "potion_trade", "alchemy_lessons"],
    
    attributes: {
      friendliness: 75,
      reputation: 80,
      trust: 85
    },
    
    conditions: {
      levelRequirement: 3,
      questRequirements: [],
      itemRequirements: [],
      timeRequirements: null
    },
    
    behavior: {
      greeting: "alchemist_greeting",
      farewell: "alchemist_farewell",
      idle: ["mixing_potions", "studying_herbs"],
      special: {
        health_concern: "caring",
        poison_reaction: "alarmed"
      }
    }
  },

  // 师父模板
  martial_master: {
    templateId: "martial_master",
    name: "武学大师",
    displayName: "武学大师",
    description: "德高望重的武学宗师，可以传授强大的技能。",
    sprite: "master.png",
    avatar: "master_avatar.png",
    type: NPC_TYPES.TEACHER,
    level: 30,
    faction: "masters",
    
    dialogueKey: "master_teachings",
    
    functions: {
      canGiveQuests: true,
      canTrade: false,
      canTeach: true,
      canUpgrade: false,
      canHeal: false
    },
    
    questIds: ["master_trial", "skill_mastery"],
    teachableSkills: ["advanced_combat", "meditation", "inner_strength"],
    services: ["skill_teaching", "wisdom_sharing"],
    
    attributes: {
      friendliness: 50,
      reputation: 100,
      trust: 30
    },
    
    conditions: {
      levelRequirement: 20,
      questRequirements: ["basic_training"],
      itemRequirements: [],
      timeRequirements: null
    },
    
    behavior: {
      greeting: "master_greeting",
      farewell: "master_farewell",
      idle: ["meditating", "practicing_forms"],
      special: {
        respect_level: "earned_through_trials",
        teaching_style: "strict_but_fair"
      }
    }
  },

  // 商人模板
  traveling_merchant: {
    templateId: "traveling_merchant",
    name: "行商老张",
    displayName: "行商老张",
    description: "四处游历的商人，贩卖各种稀有物品。",
    sprite: "merchant.png",
    avatar: "merchant_avatar.png",
    type: NPC_TYPES.MERCHANT,
    level: 8,
    faction: "merchants",
    
    dialogueKey: "merchant_trade",
    
    functions: {
      canGiveQuests: false,
      canTrade: true,
      canTeach: false,
      canUpgrade: false,
      canHeal: false
    },
    
    shopId: "traveling_shop",
    services: ["rare_items_trade", "information_broker"],
    
    attributes: {
      friendliness: 90,
      reputation: 60,
      trust: 40
    },
    
    conditions: {
      levelRequirement: 1,
      questRequirements: [],
      itemRequirements: [],
      timeRequirements: null
    },
    
    behavior: {
      greeting: "merchant_greeting",
      farewell: "merchant_farewell",
      idle: ["counting_coins", "examining_goods"],
      special: {
        bargaining: "always_ready",
        stories: "many_travels"
      }
    }
  },

  // 守卫模板
  city_guard: {
    templateId: "city_guard",
    name: "城卫兵",
    displayName: "城卫兵",
    description: "负责维护城镇治安的守卫。",
    sprite: "guard.png",
    avatar: "guard_avatar.png",
    type: NPC_TYPES.GUARD,
    level: 18,
    faction: "city_watch",
    
    dialogueKey: "guard_patrol",
    
    functions: {
      canGiveQuests: true,
      canTrade: false,
      canTeach: false,
      canUpgrade: false,
      canHeal: false
    },
    
    questIds: ["patrol_duty", "criminal_investigation"],
    services: ["law_enforcement", "city_information"],
    
    attributes: {
      friendliness: 40,
      reputation: 70,
      trust: 80
    },
    
    conditions: {
      levelRequirement: 1,
      questRequirements: [],
      itemRequirements: [],
      timeRequirements: null
    },
    
    behavior: {
      greeting: "guard_greeting",
      farewell: "guard_farewell",
      idle: ["patrolling", "standing_watch"],
      special: {
        law_enforcement: "strict",
        criminal_response: "immediate"
      }
    }
  },

  // 神秘老人模板
  mysterious_elder: {
    templateId: "mysterious_elder",
    name: "神秘老人",
    displayName: "???",
    description: "身份神秘的老者，似乎知晓许多秘密。",
    sprite: "mysterious.png",
    avatar: "mysterious_avatar.png",
    type: NPC_TYPES.SPECIAL,
    level: 99,
    faction: "unknown",
    
    dialogueKey: "mysterious_riddles",
    
    functions: {
      canGiveQuests: true,
      canTrade: false,
      canTeach: true,
      canUpgrade: false,
      canHeal: false
    },
    
    questIds: ["ancient_mystery", "hidden_treasure"],
    teachableSkills: ["ancient_wisdom", "secret_arts"],
    services: ["prophecy", "hidden_knowledge"],
    
    attributes: {
      friendliness: 30,
      reputation: 50,
      trust: 10
    },
    
    conditions: {
      levelRequirement: 25,
      questRequirements: ["prove_worthiness"],
      itemRequirements: ["ancient_token"],
      timeRequirements: "full_moon"
    },
    
    behavior: {
      greeting: "mysterious_greeting",
      farewell: "mysterious_farewell",
      idle: ["star_gazing", "deep_thought"],
      special: {
        speech_style: "cryptic_riddles",
        appearance: "unpredictable"
      }
    }
  },

  // 宠物训练师模板
  pet_trainer: {
    templateId: "pet_trainer",
    name: "宠物训练师",
    displayName: "宠物训练师小美",
    description: "专精召唤兽训练的专家，可以提升宠物能力。",
    sprite: "trainer.png",
    avatar: "trainer_avatar.png",
    type: NPC_TYPES.TEACHER,
    level: 20,
    faction: "trainers",
    
    dialogueKey: "trainer_services",
    
    functions: {
      canGiveQuests: true,
      canTrade: true,
      canTeach: true,
      canUpgrade: false,
      canHeal: false
    },
    
    shopId: "pet_supplies_shop",
    questIds: ["pet_training_basics", "advanced_bonding"],
    teachableSkills: ["pet_communication", "training_techniques"],
    services: ["pet_training", "bonding_advice", "pet_supplies"],
    
    attributes: {
      friendliness: 95,
      reputation: 85,
      trust: 90
    },
    
    conditions: {
      levelRequirement: 10,
      questRequirements: [],
      itemRequirements: [],
      timeRequirements: null
    },
    
    behavior: {
      greeting: "trainer_greeting",
      farewell: "trainer_farewell", 
      idle: ["playing_with_pets", "training_demonstration"],
      special: {
        pet_love: "unconditional",
        training_philosophy: "positive_reinforcement"
      }
    }
  }
};

// ===========================================
// 场景专用NPC模板
// ===========================================

// 副本专用NPC模板
export const dungeonNpcTemplates = {
  // 副本向导
  dungeon_guide: {
    templateId: "dungeon_guide",
    name: "副本向导",
    displayName: "副本向导",
    description: "为冒险者提供副本信息和指导的向导。",
    sprite: "guide.png",
    type: NPC_TYPES.COMMON,
    level: 25,
    
    dialogueKey: "dungeon_guide_info",
    
    functions: {
      canGiveQuests: true,
      canTrade: false,
      canTeach: false,
      canUpgrade: false,
      canHeal: false
    },
    
    questIds: ["dungeon_exploration", "treasure_hunt"],
    services: ["dungeon_information", "safety_tips"],
    
    attributes: {
      friendliness: 70,
      reputation: 60,
      trust: 75
    },
    
    conditions: {
      levelRequirement: 15,
      questRequirements: [],
      itemRequirements: [],
      timeRequirements: null
    }
  },

  // 副本商人
  dungeon_merchant: {
    templateId: "dungeon_merchant",
    name: "地下商人",
    displayName: "地下商人",
    description: "在危险地下世界中营业的勇敢商人。",
    sprite: "dungeon_merchant.png",
    type: NPC_TYPES.MERCHANT,
    level: 20,
    
    dialogueKey: "dungeon_merchant_trade",
    
    functions: {
      canGiveQuests: false,
      canTrade: true,
      canTeach: false,
      canUpgrade: true,
      canHeal: true
    },
    
    shopId: "dungeon_shop",
    services: ["emergency_supplies", "equipment_repair", "healing"],
    
    attributes: {
      friendliness: 80,
      reputation: 50,
      trust: 60
    },
    
    conditions: {
      levelRequirement: 1,
      questRequirements: [],
      itemRequirements: [],
      timeRequirements: null
    }
  }
};

// 家园专用NPC模板
export const homesteadNpcTemplates = {
  // 管家
  house_keeper: {
    templateId: "house_keeper",
    name: "管家",
    displayName: "忠诚的管家",
    description: "负责管理家园日常事务的管家。",
    sprite: "housekeeper.png",
    type: NPC_TYPES.COMMON,
    level: 5,
    
    dialogueKey: "housekeeper_services",
    
    functions: {
      canGiveQuests: true,
      canTrade: false,
      canTeach: false,
      canUpgrade: false,
      canHeal: false
    },
    
    questIds: ["house_maintenance", "garden_care"],
    services: ["house_management", "daily_reports"],
    
    attributes: {
      friendliness: 85,
      reputation: 90,
      trust: 95
    },
    
    conditions: {
      levelRequirement: 1,
      questRequirements: [],
      itemRequirements: [],
      timeRequirements: null
    }
  },

  // 园丁
  gardener: {
    templateId: "gardener",
    name: "园丁",
    displayName: "勤劳的园丁",
    description: "专门负责家园花园和植物的园丁。",
    sprite: "gardener.png",
    type: NPC_TYPES.COMMON,
    level: 8,
    
    dialogueKey: "gardener_talk",
    
    functions: {
      canGiveQuests: true,
      canTrade: true,
      canTeach: false,
      canUpgrade: false,
      canHeal: false
    },
    
    questIds: ["plant_care", "harvest_time"],
    shopId: "garden_supplies",
    services: ["gardening", "plant_care", "seed_trading"],
    
    attributes: {
      friendliness: 75,
      reputation: 70,
      trust: 80
    },
    
    conditions: {
      levelRequirement: 1,
      questRequirements: [],
      itemRequirements: [],
      timeRequirements: null
    }
  }
};

// ===========================================
// 合并所有模板
// ===========================================

export const allNpcTemplates = {
  ...npcTemplates,
  ...dungeonNpcTemplates,
  ...homesteadNpcTemplates
};

// ===========================================
// 快速访问方法
// ===========================================

/**
 * 根据类型获取NPC模板
 */
export function getNpcTemplatesByType(type) {
  return Object.values(allNpcTemplates).filter(template => template.type === type);
}

/**
 * 根据功能获取NPC模板  
 */
export function getNpcTemplatesByFunction(functionName) {
  return Object.values(allNpcTemplates).filter(template => 
    template.functions && template.functions[functionName]
  );
}

/**
 * 获取可用于特定场景的NPC模板
 */
export function getNpcTemplatesForScene(sceneType) {
  switch (sceneType) {
    case "dungeon":
      return { ...npcTemplates, ...dungeonNpcTemplates };
    case "homestead":
      return { ...npcTemplates, ...homesteadNpcTemplates };
    case "village":
    case "city":
      return npcTemplates;
    default:
      return allNpcTemplates;
  }
}

export default allNpcTemplates; 