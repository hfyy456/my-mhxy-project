/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-26 04:04:47
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-05 03:56:12
 */
// import { raceConfig } from "./raceConfig"; // Removed raceConfig import
import { skillConfig } from "../skill/skillConfig";
import {
  PET_TYPES,
  // RACE_TYPES, // Removed RACE_TYPES import
  GROWTH_RATE_TIERS,
  COLOR_TYPES,
  ATTRIBUTE_TYPES,
  FIVE_ELEMENTS,
  QUALITY_TYPES, // Added QUALITY_TYPES import
} from "../enumConfig";

// 攻击距离说明：
// 最小攻击距离为2，表示从左到右，第3排可以打到第5排，第2排可以打到第4排
// 攻击距离为5时，第1排可以打到第6排

// 宠物配置
export const summonConfig = {
  ghost: {
    id: "ghost",
    name: "幽灵",
    fiveElement: FIVE_ELEMENTS.METAL,
    quality: QUALITY_TYPES.RARE, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.038,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.042,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.MAGICAL,
    color: COLOR_TYPES.BLUE,
    // race: RACE_TYPES.NETHER, // Removed race
    attackRange: 3, // 攻击距离为3，可以从第2排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [100, 200],
      [ATTRIBUTE_TYPES.STRENGTH]: [80, 180],
      [ATTRIBUTE_TYPES.AGILITY]: [120, 220],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [150, 250],
      [ATTRIBUTE_TYPES.LUCK]: [50, 150],
    },
    guaranteedInitialSkills: ["magic_heart"],
    initialSkillPool: ["magic_critical", "agility_boost", "perception", "another_magic_skill_example"],
    initialSkillCountMean: 1,
    initialSkillCountStdDev: 1,
    background:
      "来自幽冥世界的神秘生灵，掌握着强大的法术力量。它们生前多为修炼者，因执念不散而化为幽灵，擅长使用各种神秘法术攻击敌人。",
  },
  heavenGuard: {
    id: "heavenGuard",
    name: "持国巡守",
    fiveElement: FIVE_ELEMENTS.EARTH,
    quality: QUALITY_TYPES.EPIC, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.038,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.045,
      [ATTRIBUTE_TYPES.AGILITY]: 0.025,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.025,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.PHYSICAL,
    color: COLOR_TYPES.AMBER,
    // race: RACE_TYPES.WARRIOR, // Removed race
    attackRange: 2, // 攻击距离为2，可以从第3排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [130, 230],
      [ATTRIBUTE_TYPES.STRENGTH]: [180, 280],
      [ATTRIBUTE_TYPES.AGILITY]: [80, 180],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [70, 170],
      [ATTRIBUTE_TYPES.LUCK]: [50, 150],
    },
    guaranteedInitialSkills: ["critical_strike"],
    initialSkillPool: ["defense_boost", "strength_boost", "another_physical_skill_example"],
    initialSkillCountMean: 0.5,
    initialSkillCountStdDev: 0.5,
    background:
      "天庭四大天王之一的部下，是守护天庭的精锐力量。作为天兵中的佼佼者，他们身负神威，手持天界神兵，是维护天界秩序的中坚力量。在战斗中表现出色的武艺和无畏的战斗意志，是天庭军队中的重要战力。",
  },
  thunderBird: {
    id: "thunderBird",
    name: "雷鸟人",
    fiveElement: FIVE_ELEMENTS.WOOD,
    quality: QUALITY_TYPES.EPIC, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.03,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.04,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.03,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.SPEED,
    color: COLOR_TYPES.YELLOW,
    // race: RACE_TYPES.SPIRIT, // Removed race
    attackRange: 4, // 攻击距离为4，可以从第1排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [80, 180],
      [ATTRIBUTE_TYPES.STRENGTH]: [60, 160],
      [ATTRIBUTE_TYPES.AGILITY]: [200, 300],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [80, 180],
      [ATTRIBUTE_TYPES.LUCK]: [60, 160],
    },
    guaranteedInitialSkills: ["agility_boost"],
    initialSkillPool: ["perception", "night_combat"],
    initialSkillCountMean: 2,
    initialSkillCountStdDev: 1,
    background:
      "居住在雷泽中的神兽，身体轻盈如燕，速度快如闪电。它们能够操纵雷电之力，在战斗中常常出其不意地攻击敌人，让对手防不胜防。",
  },
  vampire: {
    id: "vampire",
    name: "吸血鬼",
    fiveElement: FIVE_ELEMENTS.WATER,
    quality: QUALITY_TYPES.RARE, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.045,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.02,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.02,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.DEFENSE,
    color: COLOR_TYPES.GREEN,
    // race: RACE_TYPES.NETHER, // Removed race
    attackRange: 2, // 攻击距离为2，可以从第3排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [200, 300],
      [ATTRIBUTE_TYPES.STRENGTH]: [100, 200],
      [ATTRIBUTE_TYPES.AGILITY]: [60, 160],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [80, 180],
      [ATTRIBUTE_TYPES.LUCK]: [80, 180],
    },
    guaranteedInitialSkills: ["divine_protection"],
    initialSkillPool: ["stealth", "counter", "defense_boost"],
    initialSkillCountMean: 3,
    initialSkillCountStdDev: 1,
    background:
      "来自异域的神秘生物，以吸食鲜血为生。它们拥有强大的生命力和恢复能力，能够在战斗中不断地补充自己的体力，是战场上的不死之身。",
  },
  mechanicalBird: {
    id: "mechanicalBird",
    name: "机关鸟",
    fiveElement: FIVE_ELEMENTS.FIRE,
    quality: QUALITY_TYPES.RARE, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.038,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.042,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.MAGICAL,
    color: "orange-500",
    // race: RACE_TYPES.MACHINE, // Removed race
    attackRange: 5, // 攻击距离为5，可以从第1排攻击到第6排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [100, 200],
      [ATTRIBUTE_TYPES.STRENGTH]: [80, 180],
      [ATTRIBUTE_TYPES.AGILITY]: [150, 250],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [180, 280],
      [ATTRIBUTE_TYPES.LUCK]: [60, 160],
    },
    guaranteedInitialSkills: ["magic_chain"],
    initialSkillPool: ["magic_heart", "agility_boost"],
    initialSkillCountMean: 2,
    initialSkillCountStdDev: 1,
    background:
      "由古代工匠精心打造的机关生物，体内蕴含着强大的法术能量。它们能够发射各种元素法术，攻击范围广泛，是团队战斗中的重要火力支援。",
  },
  catSpirit: {
    id: "catSpirit",
    name: "猫灵",
    fiveElement: FIVE_ELEMENTS.METAL,
    quality: QUALITY_TYPES.RARE, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.045,
      [ATTRIBUTE_TYPES.AGILITY]: 0.025,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.02,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.PHYSICAL,
    color: "pink-500",
    // race: RACE_TYPES.SPIRIT, // Removed race
    attackRange: 3, // 攻击距离为3，可以从第2排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [120, 220],
      [ATTRIBUTE_TYPES.STRENGTH]: [200, 300],
      [ATTRIBUTE_TYPES.AGILITY]: [120, 220],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [60, 160],
      [ATTRIBUTE_TYPES.LUCK]: [80, 180],
    },
    guaranteedInitialSkills: ["critical_strike"],
    initialSkillPool: ["stealth", "night_combat"],
    initialSkillCountMean: 2,
    initialSkillCountStdDev: 1,
    background:
      "修炼成精的猫妖，身姿婀娜，行动敏捷。它们擅长在夜间行动，凭借着敏锐的感官和强大的爆发力，常常在瞬间给予敌人致命一击。",
  },
  wildLeopard: {
    id: "wildLeopard",
    name: "狂豹",
    fiveElement: FIVE_ELEMENTS.EARTH,
    quality: QUALITY_TYPES.NORMAL, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.043,
      [ATTRIBUTE_TYPES.AGILITY]: 0.025,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.02,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.PHYSICAL,
    color: "brown-500",
    // race: RACE_TYPES.BEAST, // Removed race
    attackRange: 4, // 攻击距离为4，可以从第1排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [110, 210],
      [ATTRIBUTE_TYPES.STRENGTH]: [190, 290],
      [ATTRIBUTE_TYPES.AGILITY]: [100, 200],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [50, 150],
      [ATTRIBUTE_TYPES.LUCK]: [70, 170],
    },
    guaranteedInitialSkills: ["power_strike"],
    initialSkillPool: ["stealth", "combo_attack"],
    initialSkillCountMean: 2,
    initialSkillCountStdDev: 1,
    background:
      "生活在深山老林中的猛兽，性格暴躁，攻击力极强。它们拥有锋利的爪子和牙齿，能够轻易地撕裂敌人的防御，是战场上的恐怖杀手。",
  },
  yaksha: {
    id: "yaksha",
    name: "夜叉",
    fiveElement: FIVE_ELEMENTS.WATER,
    quality: QUALITY_TYPES.RARE, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.038,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.045,
      [ATTRIBUTE_TYPES.AGILITY]: 0.025,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.02,
      [ATTRIBUTE_TYPES.LUCK]: 0.022,
    },
    type: PET_TYPES.PHYSICAL,
    color: "cyan-500",
    // race: RACE_TYPES.NETHER, // Removed race
    attackRange: 2, // 攻击距离为2，可以从第3排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [130, 230],
      [ATTRIBUTE_TYPES.STRENGTH]: [200, 300],
      [ATTRIBUTE_TYPES.AGILITY]: [110, 210],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [60, 160],
      [ATTRIBUTE_TYPES.LUCK]: [80, 180],
    },
    guaranteedInitialSkills: ["critical_strike"],
    initialSkillPool: ["stealth", "night_combat"],
    initialSkillCountMean: 2,
    initialSkillCountStdDev: 1,
    background:
      "来自幽冥界的战士，身体强壮，战斗力惊人。它们擅长使用各种武器，在战斗中勇往直前，不畏强敌，是战场上的无畏先锋。",
  },
  dragonSnake: {
    id: "dragonSnake",
    name: "蛟龙",
    fiveElement: FIVE_ELEMENTS.WOOD,
    quality: QUALITY_TYPES.EPIC, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.038,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.042,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.MAGICAL,
    color: "teal-500",
    // race: RACE_TYPES.BEAST, // Removed race
    attackRange: 5, // 攻击距离为5，可以从第1排攻击到第6排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [100, 200],
      [ATTRIBUTE_TYPES.STRENGTH]: [80, 180],
      [ATTRIBUTE_TYPES.AGILITY]: [140, 240],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [190, 290],
      [ATTRIBUTE_TYPES.LUCK]: [70, 170],
    },
    guaranteedInitialSkills: ["magic_chain"],
    initialSkillPool: ["magic_heart", "water_mountain"],
    initialSkillCountMean: 2,
    initialSkillCountStdDev: 1,
    background:
      "生活在江河湖海中的龙族后裔，拥有操控水流的能力。它们能够施展出强大的水系法术，攻击范围广泛，并且可以在水中自由穿梭，是战场上的多面手。",
  },
  phoenix: {
    id: "phoenix",
    name: "凤凰",
    fiveElement: FIVE_ELEMENTS.FIRE,
    quality: QUALITY_TYPES.LEGENDARY, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.04,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.042,
      [ATTRIBUTE_TYPES.LUCK]: 0.023,
    },
    type: PET_TYPES.MAGICAL,
    color: "orange-600",
    // race: RACE_TYPES.CELESTIAL, // Removed race
    attackRange: 5, // 攻击距离为5，可以从第1排攻击到第6排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [110, 210],
      [ATTRIBUTE_TYPES.STRENGTH]: [90, 190],
      [ATTRIBUTE_TYPES.AGILITY]: [150, 250],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [200, 300],
      [ATTRIBUTE_TYPES.LUCK]: [80, 180],
    },
    guaranteedInitialSkills: ["magic_critical"],
    initialSkillPool: ["magic_heart", "fire_spell"],
    initialSkillCountMean: 2,
    initialSkillCountStdDev: 1,
    background:
      "传说中的神鸟，象征着重生和希望。它们拥有操控火焰的能力，能够施展出毁灭性的火系法术，将敌人烧成灰烬。同时，凤凰还拥有复活的能力，能够在关键时刻挽救队友的生命。",
  },
  mistFairy: {
    id: "mistFairy",
    name: "雾中仙",
    fiveElement: FIVE_ELEMENTS.WATER,
    quality: QUALITY_TYPES.EPIC, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.025,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.035,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.SUPPORT,
    color: "purple-600",
    // race: RACE_TYPES.CELESTIAL, // Removed race
    attackRange: 5, // 攻击距离为5，可以从第1排攻击到第6排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [150, 250],
      [ATTRIBUTE_TYPES.STRENGTH]: [80, 180],
      [ATTRIBUTE_TYPES.AGILITY]: [100, 200],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [120, 220],
      [ATTRIBUTE_TYPES.LUCK]: [100, 200],
    },
    guaranteedInitialSkills: ["magic_defense"],
    initialSkillPool: ["luck_boost", "counter"],
    initialSkillCountMean: 2,
    initialSkillCountStdDev: 1,
    background:
      "居住在迷雾森林中的神秘仙子，掌握着治愈和防御的魔法。它们能够为队友施加各种增益状态，提高团队的生存能力，同时也能够使用强大的防御法术，保护队友免受敌人的攻击。",
  },
  spiritCrane: {
    id: "spiritCrane",
    name: "灵鹤",
    fiveElement: FIVE_ELEMENTS.METAL,
    quality: QUALITY_TYPES.EPIC, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.04,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.043,
      [ATTRIBUTE_TYPES.LUCK]: 0.022,
    },
    type: PET_TYPES.MAGICAL,
    color: "blue-600",
    // race: RACE_TYPES.CELESTIAL, // Removed race
    attackRange: 3, // 攻击距离为3，可以从第2排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [120, 220],
      [ATTRIBUTE_TYPES.STRENGTH]: [90, 190],
      [ATTRIBUTE_TYPES.AGILITY]: [160, 260],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [210, 310],
      [ATTRIBUTE_TYPES.LUCK]: [90, 190],
    },
    guaranteedInitialSkills: ["magic_critical"],
    initialSkillPool: ["magic_heart"],
    initialSkillCountMean: 1,
    initialSkillCountStdDev: 1,
    background:
      "栖息在高山之上的灵禽，拥有超凡的智慧和强大的法术能力。它们能够施展出各种元素法术，攻击敌人的同时还能够为队友提供支援，是团队中不可或缺的重要成员。",
  },
  starFairy: {
    id: "starFairy",
    name: "星灵仙子",
    fiveElement: FIVE_ELEMENTS.WOOD,
    quality: QUALITY_TYPES.EPIC, // Added quality
    type: PET_TYPES.MAGICAL,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.042,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.045,
      [ATTRIBUTE_TYPES.LUCK]: 0.023,
    },
    color: "pink-600",
    // race: RACE_TYPES.CELESTIAL, // Removed race
    attackRange: 4, // 攻击距离为3，可以从第2排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [130, 230],
      [ATTRIBUTE_TYPES.STRENGTH]: [100, 200],
      [ATTRIBUTE_TYPES.AGILITY]: [170, 270],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [220, 320],
      [ATTRIBUTE_TYPES.LUCK]: [100, 200],
    },
    guaranteedInitialSkills: ["magic_chain"],
    initialSkillPool: ["magic_heart", "thunder_spell"],
    initialSkillCountMean: 2,
    initialSkillCountStdDev: 1,
    background:
      "来自星空的神秘仙子，身体中蕴含着星辰之力。它们能够操纵雷电之力，施展出强大的雷系法术，攻击范围广泛，并且可以在战斗中提高自己的速度和命中率，让敌人难以捉摸。",
  },
  mountainKing: {
    id: "mountainKing",
    name: "山君",
    fiveElement: FIVE_ELEMENTS.EARTH,
    quality: QUALITY_TYPES.EPIC, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.038,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.047,
      [ATTRIBUTE_TYPES.AGILITY]: 0.037,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.02,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.PHYSICAL,
    color: "orange-500",
    // race: RACE_TYPES.BEAST, // Removed race
    attackRange: 2,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [140, 240],
      [ATTRIBUTE_TYPES.STRENGTH]: [210, 310],
      [ATTRIBUTE_TYPES.AGILITY]: [150, 250],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [60, 160],
      [ATTRIBUTE_TYPES.LUCK]: [60, 160],
    },
    guaranteedInitialSkills: ["tiger_roar"],
    initialSkillPool: ["power_strike", "combo_attack", "night_combat"],
    initialSkillCountMean: 3,
    initialSkillCountStdDev: 1,
    background:
      "深山中百兽之王，威严霸气，身躯强健。古称'山君'，是山林的主宰者。百年修行使其获得了通灵的能力，能够发出震慑心魄的虎啸，让敌人胆寒畏惧，在战斗中展现无穷的力量。",
  },
  blackTortoise: {
    id: "blackTortoise",
    name: "玄武",
    fiveElement: FIVE_ELEMENTS.WATER,
    quality: QUALITY_TYPES.LEGENDARY, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.05,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.03,
      [ATTRIBUTE_TYPES.AGILITY]: 0.02,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.04,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.DEFENSE,
    color: "blue-900",
    // race: RACE_TYPES.BEAST, // Removed race
    attackRange: 2,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [220, 320],
      [ATTRIBUTE_TYPES.STRENGTH]: [120, 220],
      [ATTRIBUTE_TYPES.AGILITY]: [60, 160],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [150, 250],
      [ATTRIBUTE_TYPES.LUCK]: [70, 170],
    },
    guaranteedInitialSkills: ["turtle_shell"],
    initialSkillPool: ["water_escape", "defense_boost", "counter"],
    initialSkillCountMean: 3,
    initialSkillCountStdDev: 1,
    background:
      "四灵之一，龟蛇合体的神兽，象征北方和水，寿命悠长。其龟甲坚不可摧，能防御多数攻击。在战斗中以坚固的防御和水系法术著称，能为队友提供可靠的保护。",
  },
  judge: {
    id: "judge",
    name: "判官",
    fiveElement: FIVE_ELEMENTS.METAL,
    quality: QUALITY_TYPES.EPIC, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.036,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.03,
      [ATTRIBUTE_TYPES.AGILITY]: 0.03,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.045,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.MAGICAL,
    color: "purple-800",
    // race: RACE_TYPES.NETHER, // Removed race
    attackRange: 2,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [130, 230],
      [ATTRIBUTE_TYPES.STRENGTH]: [100, 200],
      [ATTRIBUTE_TYPES.AGILITY]: [100, 200],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [200, 300],
      [ATTRIBUTE_TYPES.LUCK]: [80, 180],
    },
    guaranteedInitialSkills: ["life_death_book"],
    initialSkillPool: ["ghost_fire", "yin_yang_switch", "nether_portal"],
    initialSkillCountMean: 3,
    initialSkillCountStdDev: 1,
    background:
      "地府中的生死簿掌管者，手持生死簿和朱笔，能够判断生死。在战斗中使用阴间法术，能够攻击敌人的灵魂，甚至可以短暂地将敌人传送到冥界中受苦。",
  },
  thief: {
    id: "thief",
    name: "盗贼",
    fiveElement: FIVE_ELEMENTS.METAL,
    quality: QUALITY_TYPES.NORMAL, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.03,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.035,
      [ATTRIBUTE_TYPES.AGILITY]: 0.04,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.02,
      [ATTRIBUTE_TYPES.LUCK]: 0.025,
    },
    type: PET_TYPES.PHYSICAL,
    color: COLOR_TYPES.GREEN,
    // race: RACE_TYPES.SPIRIT, // Removed race
    attackRange: 2,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [90, 190],
      [ATTRIBUTE_TYPES.STRENGTH]: [100, 200],
      [ATTRIBUTE_TYPES.AGILITY]: [120, 220],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [50, 150],
      [ATTRIBUTE_TYPES.LUCK]: [70, 170],
    },
    guaranteedInitialSkills: ["stealth"],
    initialSkillPool: ["power_strike", "critical_strike", "agility_boost"],
    initialSkillCountMean: 1,
    initialSkillCountStdDev: 1,
    background:
      "游荡在城市阴影中的机会主义者，擅长隐匿和快速攻击。",
  },
  ruffian: {
    id: "ruffian",
    name: "恶霸",
    fiveElement: FIVE_ELEMENTS.EARTH,
    quality: QUALITY_TYPES.NORMAL, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.04,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.042,
      [ATTRIBUTE_TYPES.AGILITY]: 0.025,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.018,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.PHYSICAL,
    color: COLOR_TYPES.BROWN,
    // race: RACE_TYPES.WARRIOR, // Removed race
    attackRange: 2,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [120, 220],
      [ATTRIBUTE_TYPES.STRENGTH]: [130, 230],
      [ATTRIBUTE_TYPES.AGILITY]: [70, 170],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [40, 140],
      [ATTRIBUTE_TYPES.LUCK]: [60, 160],
    },
    guaranteedInitialSkills: ["power_strike"],
    initialSkillPool: ["critical_strike", "defense_boost", "counter"],
    initialSkillCountMean: 1,
    initialSkillCountStdDev: 1,
    background:
      "横行街头的地痞流氓，依仗蛮力欺压弱小。",
  },
  seaTurtle: {
    id: "seaTurtle",
    name: "大海龟",
    fiveElement: FIVE_ELEMENTS.WATER,
    quality: QUALITY_TYPES.EPIC, // Added quality
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.055,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.015,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.035,
      [ATTRIBUTE_TYPES.LUCK]: 0.025,
    },
    type: PET_TYPES.DEFENSE,
    color: "teal-600",
    // race: RACE_TYPES.BEAST, // Removed race
    attackRange: 2,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [180, 280],
      [ATTRIBUTE_TYPES.STRENGTH]: [80, 180],
      [ATTRIBUTE_TYPES.AGILITY]: [40, 140],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [120, 220],
      [ATTRIBUTE_TYPES.LUCK]: [90, 190],
    },
    guaranteedInitialSkills: ["turtle_shell"],
    initialSkillPool: ["water_escape", "defense_boost", "divine_protection", "water_healing"],
    initialSkillCountMean: 2,
    initialSkillCountStdDev: 1,
    background:
      "游弋在深海中的古老生灵，经历了千百年的岁月洗礼。它的龟壳坚如磐石，承载着海洋的智慧与力量。虽然行动缓慢，但拥有极强的防御能力和水系法术，是战场上的守护者。在合成失败的混沌中，它会神秘地出现，为主人带来意外的惊喜。",
  }
};

/**
 * 根据召唤兽类型获取调整后的成长率
 * @param {string} summonSourceId - 召唤兽ID
 * @param {string} natureType - 召唤兽类型 (wild/baby/mutant)
 * @returns {Object} 调整后的成长率对象
 */
export const getAdjustedGrowthRates = (summonSourceId, natureType = 'wild') => {
  const summonData = summonConfig[summonSourceId];
  if (!summonData || !summonData.growthRates) {
    return {};
  }

  // 动态导入召唤兽类型配置
  import('../enumConfig').then(({ SUMMON_NATURE_TYPES, SUMMON_NATURE_CONFIG }) => {
    const currentNatureType = natureType || SUMMON_NATURE_TYPES.WILD;
    const natureConfig = SUMMON_NATURE_CONFIG[currentNatureType] || SUMMON_NATURE_CONFIG[SUMMON_NATURE_TYPES.WILD];
    
    const adjustedGrowthRates = {};
    Object.keys(summonData.growthRates).forEach(attr => {
      adjustedGrowthRates[attr] = summonData.growthRates[attr] * natureConfig.growthRateMultiplier;
    });
    
    return adjustedGrowthRates;
  });

  // 临时返回原成长率，实际使用时需要异步处理
  return summonData.growthRates;
};

/**
 * 同步版本：根据召唤兽类型获取调整后的成长率
 * @param {string} summonSourceId - 召唤兽ID
 * @param {string} natureType - 召唤兽类型 (wild/baby/mutant)
 * @param {Object} natureConfig - 召唤兽类型配置对象
 * @returns {Object} 调整后的成长率对象
 */
export const getAdjustedGrowthRatesSync = (summonSourceId, natureType = 'wild', natureConfig) => {
  const summonData = summonConfig[summonSourceId];
  if (!summonData || !summonData.growthRates) {
    return {};
  }

  if (!natureConfig) {
    // 如果没有传入配置，返回原成长率
    return summonData.growthRates;
  }

  const adjustedGrowthRates = {};
  Object.keys(summonData.growthRates).forEach(attr => {
    adjustedGrowthRates[attr] = summonData.growthRates[attr] * natureConfig.growthRateMultiplier;
  });
  
  return adjustedGrowthRates;
};