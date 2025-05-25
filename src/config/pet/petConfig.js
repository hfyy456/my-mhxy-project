import { raceConfig } from "./raceConfig";
import { skillConfig } from "../skill/skillConfig";
import {
  PET_TYPES,
  RACE_TYPES,
  GROWTH_RATE_TIERS,
  COLOR_TYPES,
  ATTRIBUTE_TYPES,
  FIVE_ELEMENTS,
} from "../enumConfig";

// 攻击距离说明：
// 最小攻击距离为2，表示从左到右，第3排可以打到第5排，第2排可以打到第4排
// 攻击距离为5时，第1排可以打到第6排

// 宠物配置
export const petConfig = {
  ghost: {
    id: "ghost",
    name: "幽灵",
    fiveElement: FIVE_ELEMENTS.METAL,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.038,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.042,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.MAGICAL,
    color: COLOR_TYPES.BLUE,
    race: RACE_TYPES.NETHER,
    attackRange: 3, // 攻击距离为3，可以从第2排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [100, 200],
      [ATTRIBUTE_TYPES.STRENGTH]: [80, 180],
      [ATTRIBUTE_TYPES.AGILITY]: [120, 220],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [150, 250],
      [ATTRIBUTE_TYPES.LUCK]: [50, 150],
    },
    initialSkills: [
      "magic_critical",
      "agility_boost",
      "perception",
      "magic_heart",
    ],
    background:
      "来自幽冥世界的神秘生灵，掌握着强大的法术力量。它们生前多为修炼者，因执念不散而化为幽灵，擅长使用各种神秘法术攻击敌人。",
  },
  heavenGuard: {
    id: "heavenGuard",
    name: "持国巡守",
    fiveElement: FIVE_ELEMENTS.EARTH,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.038,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.045,
      [ATTRIBUTE_TYPES.AGILITY]: 0.025,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.025,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.PHYSICAL,
    color: COLOR_TYPES.AMBER,
    race: RACE_TYPES.WARRIOR,
    attackRange: 2, // 攻击距离为2，可以从第3排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [130, 230],
      [ATTRIBUTE_TYPES.STRENGTH]: [180, 280],
      [ATTRIBUTE_TYPES.AGILITY]: [80, 180],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [70, 170],
      [ATTRIBUTE_TYPES.LUCK]: [50, 150],
    },
    initialSkills: ["critical_strike", "defense_boost"],
    background:
      "天庭四大天王之一的部下，是守护天庭的精锐力量。作为天兵中的佼佼者，他们身负神威，手持天界神兵，是维护天界秩序的中坚力量。在战斗中表现出色的武艺和无畏的战斗意志，是天庭军队中的重要战力。",
  },
  thunderBird: {
    id: "thunderBird",
    name: "雷鸟人",
    fiveElement: FIVE_ELEMENTS.WOOD,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.03,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.04,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.03,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.SPEED,
    color: COLOR_TYPES.YELLOW,
    race: RACE_TYPES.SPIRIT,
    attackRange: 4, // 攻击距离为4，可以从第1排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [80, 180],
      [ATTRIBUTE_TYPES.STRENGTH]: [60, 160],
      [ATTRIBUTE_TYPES.AGILITY]: [200, 300],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [80, 180],
      [ATTRIBUTE_TYPES.LUCK]: [60, 160],
    },
    initialSkills: ["agility_boost", "perception", "night_combat"],
    background:
      "居住在雷泽中的神兽，身体轻盈如燕，速度快如闪电。它们能够操纵雷电之力，在战斗中常常出其不意地攻击敌人，让对手防不胜防。",
  },
  vampire: {
    id: "vampire",
    name: "吸血鬼",
    fiveElement: FIVE_ELEMENTS.WATER,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.045,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.02,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.02,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.DEFENSE,
    color: COLOR_TYPES.GREEN,
    race: RACE_TYPES.NETHER,
    attackRange: 2, // 攻击距离为2，可以从第3排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [200, 300],
      [ATTRIBUTE_TYPES.STRENGTH]: [100, 200],
      [ATTRIBUTE_TYPES.AGILITY]: [60, 160],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [80, 180],
      [ATTRIBUTE_TYPES.LUCK]: [80, 180],
    },
    initialSkills: ["divine_protection", "stealth", "counter", "defense_boost"],
    background:
      "来自异域的神秘生物，以吸食鲜血为生。它们拥有强大的生命力和恢复能力，能够在战斗中不断地补充自己的体力，是战场上的不死之身。",
  },
  mechanicalBird: {
    id: "mechanicalBird",
    name: "机关鸟",
    fiveElement: FIVE_ELEMENTS.FIRE,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.038,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.042,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.MAGICAL,
    color: "orange-500",
    race: RACE_TYPES.MACHINE,
    attackRange: 5, // 攻击距离为5，可以从第1排攻击到第6排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [100, 200],
      [ATTRIBUTE_TYPES.STRENGTH]: [80, 180],
      [ATTRIBUTE_TYPES.AGILITY]: [150, 250],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [180, 280],
      [ATTRIBUTE_TYPES.LUCK]: [60, 160],
    },
    initialSkills: ["magic_chain", "magic_heart", "agility_boost"],
    background:
      "由古代工匠精心打造的机关生物，体内蕴含着强大的法术能量。它们能够发射各种元素法术，攻击范围广泛，是团队战斗中的重要火力支援。",
  },
  catSpirit: {
    id: "catSpirit",
    name: "猫灵",
    fiveElement: FIVE_ELEMENTS.METAL,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.045,
      [ATTRIBUTE_TYPES.AGILITY]: 0.025,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.02,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.PHYSICAL,
    color: "pink-500",
    race: RACE_TYPES.SPIRIT,
    attackRange: 3, // 攻击距离为3，可以从第2排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [120, 220],
      [ATTRIBUTE_TYPES.STRENGTH]: [200, 300],
      [ATTRIBUTE_TYPES.AGILITY]: [120, 220],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [60, 160],
      [ATTRIBUTE_TYPES.LUCK]: [80, 180],
    },
    initialSkills: ["critical_strike", "stealth", "night_combat"],
    background:
      "修炼成精的猫妖，身姿婀娜，行动敏捷。它们擅长在夜间行动，凭借着敏锐的感官和强大的爆发力，常常在瞬间给予敌人致命一击。",
  },
  wildLeopard: {
    id: "wildLeopard",
    name: "狂豹",
    fiveElement: FIVE_ELEMENTS.EARTH,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.043,
      [ATTRIBUTE_TYPES.AGILITY]: 0.025,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.02,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.PHYSICAL,
    color: "brown-500",
    race: RACE_TYPES.BEAST,
    attackRange: 4, // 攻击距离为4，可以从第1排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [110, 210],
      [ATTRIBUTE_TYPES.STRENGTH]: [190, 290],
      [ATTRIBUTE_TYPES.AGILITY]: [100, 200],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [50, 150],
      [ATTRIBUTE_TYPES.LUCK]: [70, 170],
    },
    initialSkills: ["power_strike", "stealth", "combo_attack"],
    background:
      "生活在深山老林中的猛兽，性格暴躁，攻击力极强。它们拥有锋利的爪子和牙齿，能够轻易地撕裂敌人的防御，是战场上的恐怖杀手。",
  },
  yaksha: {
    id: "yaksha",
    name: "夜叉",
    fiveElement: FIVE_ELEMENTS.WATER,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.038,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.045,
      [ATTRIBUTE_TYPES.AGILITY]: 0.025,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.02,
      [ATTRIBUTE_TYPES.LUCK]: 0.022,
    },
    type: PET_TYPES.PHYSICAL,
    color: "cyan-500",
    race: RACE_TYPES.NETHER,
    attackRange: 2, // 攻击距离为2，可以从第3排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [130, 230],
      [ATTRIBUTE_TYPES.STRENGTH]: [200, 300],
      [ATTRIBUTE_TYPES.AGILITY]: [110, 210],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [60, 160],
      [ATTRIBUTE_TYPES.LUCK]: [80, 180],
    },
    initialSkills: ["critical_strike", "stealth", "night_combat"],
    background:
      "来自幽冥界的战士，身体强壮，战斗力惊人。它们擅长使用各种武器，在战斗中勇往直前，不畏强敌，是战场上的无畏先锋。",
  },
  dragonSnake: {
    id: "dragonSnake",
    name: "蛟龙",
    fiveElement: FIVE_ELEMENTS.WOOD,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.038,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.042,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.MAGICAL,
    color: "teal-500",
    race: RACE_TYPES.BEAST,
    attackRange: 5, // 攻击距离为5，可以从第1排攻击到第6排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [100, 200],
      [ATTRIBUTE_TYPES.STRENGTH]: [80, 180],
      [ATTRIBUTE_TYPES.AGILITY]: [140, 240],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [190, 290],
      [ATTRIBUTE_TYPES.LUCK]: [70, 170],
    },
    initialSkills: ["magic_chain", "magic_heart", "water_mountain"],
    background:
      "生活在江河湖海中的龙族后裔，拥有操控水流的能力。它们能够施展出强大的水系法术，攻击范围广泛，并且可以在水中自由穿梭，是战场上的多面手。",
  },
  phoenix: {
    id: "phoenix",
    name: "凤凰",
    fiveElement: FIVE_ELEMENTS.FIRE,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.04,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.042,
      [ATTRIBUTE_TYPES.LUCK]: 0.023,
    },
    type: PET_TYPES.MAGICAL,
    color: "orange-600",
    race: RACE_TYPES.CELESTIAL,
    attackRange: 5, // 攻击距离为5，可以从第1排攻击到第6排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [110, 210],
      [ATTRIBUTE_TYPES.STRENGTH]: [90, 190],
      [ATTRIBUTE_TYPES.AGILITY]: [150, 250],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [200, 300],
      [ATTRIBUTE_TYPES.LUCK]: [80, 180],
    },
    initialSkills: ["magic_critical", "magic_heart", "fire_spell"],
    background:
      "传说中的神鸟，象征着重生和希望。它们拥有操控火焰的能力，能够施展出毁灭性的火系法术，将敌人烧成灰烬。同时，凤凰还拥有复活的能力，能够在关键时刻挽救队友的生命。",
  },
  mistFairy: {
    id: "mistFairy",
    name: "雾中仙",
    fiveElement: FIVE_ELEMENTS.WATER,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.025,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.035,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.SUPPORT,
    color: "purple-600",
    race: RACE_TYPES.CELESTIAL,
    attackRange: 5, // 攻击距离为5，可以从第1排攻击到第6排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [150, 250],
      [ATTRIBUTE_TYPES.STRENGTH]: [80, 180],
      [ATTRIBUTE_TYPES.AGILITY]: [100, 200],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [120, 220],
      [ATTRIBUTE_TYPES.LUCK]: [100, 200],
    },
    initialSkills: ["magic_defense", "luck_boost", "counter"],
    background:
      "居住在迷雾森林中的神秘仙子，掌握着治愈和防御的魔法。它们能够为队友施加各种增益状态，提高团队的生存能力，同时也能够使用强大的防御法术，保护队友免受敌人的攻击。",
  },
  spiritCrane: {
    id: "spiritCrane",
    name: "灵鹤",
    fiveElement: FIVE_ELEMENTS.METAL,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.04,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.043,
      [ATTRIBUTE_TYPES.LUCK]: 0.022,
    },
    type: PET_TYPES.MAGICAL,
    color: "blue-600",
    race: RACE_TYPES.CELESTIAL,
    attackRange: 3, // 攻击距离为3，可以从第2排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [120, 220],
      [ATTRIBUTE_TYPES.STRENGTH]: [90, 190],
      [ATTRIBUTE_TYPES.AGILITY]: [160, 260],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [210, 310],
      [ATTRIBUTE_TYPES.LUCK]: [90, 190],
    },
    initialSkills: ["magic_critical", "magic_heart"],
    background:
      "栖息在高山之上的灵禽，拥有超凡的智慧和强大的法术能力。它们能够施展出各种元素法术，攻击敌人的同时还能够为队友提供支援，是团队中不可或缺的重要成员。",
  },
  starFairy: {
    id: "starFairy",
    name: "星灵仙子",
    fiveElement: FIVE_ELEMENTS.WOOD,
    type: PET_TYPES.MAGICAL,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.035,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.025,
      [ATTRIBUTE_TYPES.AGILITY]: 0.042,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.045,
      [ATTRIBUTE_TYPES.LUCK]: 0.023,
    },
    color: "pink-600",
    race: RACE_TYPES.CELESTIAL,
    attackRange: 4, // 攻击距离为3，可以从第2排攻击到第5排
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [130, 230],
      [ATTRIBUTE_TYPES.STRENGTH]: [100, 200],
      [ATTRIBUTE_TYPES.AGILITY]: [170, 270],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [220, 320],
      [ATTRIBUTE_TYPES.LUCK]: [100, 200],
    },
    initialSkills: ["magic_chain", "magic_heart", "thunder_spell"],
    background:
      "来自星空的神秘仙子，身体中蕴含着星辰之力。它们能够操纵雷电之力，施展出强大的雷系法术，攻击范围广泛，并且可以在战斗中提高自己的速度和命中率，让敌人难以捉摸。",
  },
  mountainKing: {
    id: "mountainKing",
    name: "山君",
    fiveElement: FIVE_ELEMENTS.EARTH,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.038,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.047,
      [ATTRIBUTE_TYPES.AGILITY]: 0.037,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.02,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.PHYSICAL,
    color: "orange-500",
    race: RACE_TYPES.BEAST,
    attackRange: 2,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [140, 240],
      [ATTRIBUTE_TYPES.STRENGTH]: [210, 310],
      [ATTRIBUTE_TYPES.AGILITY]: [150, 250],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [60, 160],
      [ATTRIBUTE_TYPES.LUCK]: [60, 160],
    },
    initialSkills: [
      "tiger_roar",
      "power_strike",
      "combo_attack",
      "night_combat",
    ],
    background:
      "深山中百兽之王，威严霸气，身躯强健。古称'山君'，是山林的主宰者。百年修行使其获得了通灵的能力，能够发出震慑心魄的虎啸，让敌人胆寒畏惧，在战斗中展现无穷的力量。",
  },
  blackTortoise: {
    id: "blackTortoise",
    name: "玄武",
    fiveElement: FIVE_ELEMENTS.WATER,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.05,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.03,
      [ATTRIBUTE_TYPES.AGILITY]: 0.02,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.04,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.DEFENSE,
    color: "blue-900",
    race: RACE_TYPES.BEAST,
    attackRange: 2,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [220, 320],
      [ATTRIBUTE_TYPES.STRENGTH]: [120, 220],
      [ATTRIBUTE_TYPES.AGILITY]: [60, 160],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [150, 250],
      [ATTRIBUTE_TYPES.LUCK]: [70, 170],
    },
    initialSkills: ["turtle_shell", "water_escape", "defense_boost", "counter"],
    background:
      "四灵之一，龟蛇合体的神兽，象征北方和水，寿命悠长。其龟甲坚不可摧，能防御多数攻击。在战斗中以坚固的防御和水系法术著称，能为队友提供可靠的保护。",
  },
  judge: {
    id: "judge",
    name: "判官",
    fiveElement: FIVE_ELEMENTS.METAL,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.036,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.03,
      [ATTRIBUTE_TYPES.AGILITY]: 0.03,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.045,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.MAGICAL,
    color: "purple-800",
    race: RACE_TYPES.NETHER,
    attackRange: 2,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [130, 230],
      [ATTRIBUTE_TYPES.STRENGTH]: [100, 200],
      [ATTRIBUTE_TYPES.AGILITY]: [100, 200],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [200, 300],
      [ATTRIBUTE_TYPES.LUCK]: [80, 180],
    },
    initialSkills: [
      "life_death_book",
      "ghost_fire",
      "yin_yang_switch",
      "nether_portal",
    ],
    background:
      "地府中的生死簿掌管者，手持生死簿和朱笔，能够判断生死。在战斗中使用阴间法术，能够攻击敌人的灵魂，甚至可以短暂地将敌人传送到冥界中受苦。",
  },
  jadeRabbit: {
    id: "jadeRabbit",
    name: "玉兔",
    fiveElement: FIVE_ELEMENTS.WOOD,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.032,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.02,
      [ATTRIBUTE_TYPES.AGILITY]: 0.043,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.04,
      [ATTRIBUTE_TYPES.LUCK]: 0.035,
    },
    type: PET_TYPES.SUPPORT,
    color: "white",
    race: RACE_TYPES.SPIRIT,
    attackRange: 3,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [110, 210],
      [ATTRIBUTE_TYPES.STRENGTH]: [60, 160],
      [ATTRIBUTE_TYPES.AGILITY]: [180, 280],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [150, 250],
      [ATTRIBUTE_TYPES.LUCK]: [160, 260],
    },
    initialSkills: ["moonlight_power", "jump_attack", "healing", "luck_boost"],
    background:
      "月宫中的玉兔，捣药制作长生不老药，通灵聪慧。它身轻如燕，蕴含月华之力，能够为队友治愈伤口，并带来好运。虽然攻击力不高，但速度极快，可以轻松躲避敌人的攻击。",
  },
  goldenArmor: {
    id: "goldenArmor",
    name: "金甲天兵",
    fiveElement: FIVE_ELEMENTS.METAL,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.042,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.045,
      [ATTRIBUTE_TYPES.AGILITY]: 0.025,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.03,
      [ATTRIBUTE_TYPES.LUCK]: 0.02,
    },
    type: PET_TYPES.PHYSICAL,
    color: "amber-500",
    race: RACE_TYPES.WARRIOR,
    attackRange: 2,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [150, 250],
      [ATTRIBUTE_TYPES.STRENGTH]: [180, 280],
      [ATTRIBUTE_TYPES.AGILITY]: [100, 200],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [80, 180],
      [ATTRIBUTE_TYPES.LUCK]: [60, 160],
    },
    initialSkills: ["critical_strike", "divine_might", "combo_attack"],
    background:
      "天庭精锐部队的主力战士，身着金甲，手持神兵利器。他们是维护天庭秩序的中坚力量，战斗经验丰富，擅长近身搏斗和武器使用。",
  },
  heavenGeneral: {
    id: "heavenGeneral",
    name: "天罡战将",
    fiveElement: FIVE_ELEMENTS.EARTH,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.04,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.043,
      [ATTRIBUTE_TYPES.AGILITY]: 0.03,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.035,
      [ATTRIBUTE_TYPES.LUCK]: 0.022,
    },
    type: PET_TYPES.PHYSICAL,
    color: "amber-600",
    race: RACE_TYPES.WARRIOR,
    attackRange: 2,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [160, 260],
      [ATTRIBUTE_TYPES.STRENGTH]: [170, 270],
      [ATTRIBUTE_TYPES.AGILITY]: [110, 210],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [100, 200],
      [ATTRIBUTE_TYPES.LUCK]: [70, 170],
    },
    initialSkills: ["divine_might", "divine_protection", "defense_boost"],
    background:
      "天庭三十六天罡之一，统领天兵天将。身具天罡之力，可凝聚天地之气为己用，是天庭军队中的高级将领。",
  },
  qilin: {
    id: "qilin",
    name: "麒麟",
    fiveElement: FIVE_ELEMENTS.EARTH,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.045,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.042,
      [ATTRIBUTE_TYPES.AGILITY]: 0.038,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.045,
      [ATTRIBUTE_TYPES.LUCK]: 0.03,
    },
    type: PET_TYPES.MAGICAL,
    color: COLOR_TYPES.AMBER,
    race: RACE_TYPES.BEAST,
    attackRange: 2,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [180, 280],
      [ATTRIBUTE_TYPES.STRENGTH]: [160, 260],
      [ATTRIBUTE_TYPES.AGILITY]: [150, 250],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [180, 280],
      [ATTRIBUTE_TYPES.LUCK]: [120, 220],
    },
    initialSkills: ["magic_critical", "divine_protection", "magic_heart"],
    background:
      "上古四大瑞兽之首，形似麋身龙鳞，额生独角，尾如牛，蹄似马，浑身散发祥瑞之气。性格温和，不践生草，不食生物，具有极高的灵性和智慧。在战斗中能够运用神圣之力，既可进行强大的法术攻击，又能为队友提供保护。",
  },
  hundun: {
    id: "hundun",
    name: "混沌",
    fiveElement: FIVE_ELEMENTS.FIRE,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.05,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.03,
      [ATTRIBUTE_TYPES.AGILITY]: 0.02,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.045,
      [ATTRIBUTE_TYPES.LUCK]: 0.03,
    },
    type: PET_TYPES.MAGICAL,
    color: "gray-800",
    race: RACE_TYPES.ANCIENT_BEAST,
    attackRange: 2,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [250, 350],
      [ATTRIBUTE_TYPES.STRENGTH]: [100, 200],
      [ATTRIBUTE_TYPES.AGILITY]: [50, 150],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [200, 300],
      [ATTRIBUTE_TYPES.LUCK]: [100, 200],
    },
    initialSkills: ["chaos_devour", "divine_protection", "magic_surge"],
    background:
      "诞生于天地未开之前的原始神兽，形态不可名状，拥有吞噬一切的力量。",
  },
  yinglong: {
    id: "yinglong",
    name: "应龙",
    fiveElement: FIVE_ELEMENTS.WATER,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.042,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.04,
      [ATTRIBUTE_TYPES.AGILITY]: 0.035,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.045,
      [ATTRIBUTE_TYPES.LUCK]: 0.025,
    },
    type: PET_TYPES.MAGICAL,
    color: "cyan-700",
    race: RACE_TYPES.ANCIENT_BEAST,
    attackRange: 5,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [200, 300],
      [ATTRIBUTE_TYPES.STRENGTH]: [180, 280],
      [ATTRIBUTE_TYPES.AGILITY]: [150, 250],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [220, 320],
      [ATTRIBUTE_TYPES.LUCK]: [80, 180],
    },
    initialSkills: ["storm_judgment", "divine_might", "agility_boost"],
    background: "生有双翼的远古巨龙，能呼风唤雨，曾助黄帝战胜蚩尤，威震四海。",
  },
  baize: {
    id: "baize",
    name: "白泽",
    fiveElement: FIVE_ELEMENTS.WOOD,
    growthRates: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: 0.038,
      [ATTRIBUTE_TYPES.STRENGTH]: 0.02,
      [ATTRIBUTE_TYPES.AGILITY]: 0.035,
      [ATTRIBUTE_TYPES.INTELLIGENCE]: 0.05,
      [ATTRIBUTE_TYPES.LUCK]: 0.045,
    },
    type: PET_TYPES.SUPPORT,
    color: "yellow-300",
    race: RACE_TYPES.ANCIENT_BEAST,
    attackRange: 3,
    basicAttributeRanges: {
      [ATTRIBUTE_TYPES.CONSTITUTION]: [150, 250],
      [ATTRIBUTE_TYPES.STRENGTH]: [80, 180],
      [ATTRIBUTE_TYPES.AGILITY]: [140, 240],
      [ATTRIBUTE_TYPES.INTELLIGENCE]: [230, 330],
      [ATTRIBUTE_TYPES.LUCK]: [200, 300],
    },
    initialSkills: ["omniscience", "luck_boost", "healing"],
    background:
      "通晓万物情状的神兽，能言语，知过去未来，趋吉避凶。外形似狮，头有双角，身有山羊胡。",
  },
};

// 宠物评分计算函数
export const calculatePetScore = (petName, attributes, level) => {
  const pet = petConfig[petName];
  if (!pet) return 0;

  let score = 0;
  // 基础属性评分
  for (const attr in attributes) {
    const growthRate = pet.growthRates[attr];
    const value = attributes[attr];
    score += value * (1 + growthRate * level);
  }

  // 种族加成评分
  const race = raceConfig[pet.race];
  if (race) {
    for (const attr in race.bonus) {
      score += attributes[attr] * race.bonus[attr];
    }
  }

  return Math.floor(score);
};

// 获取宠物成长率评级
export const getPetGrowthRating = (petName) => {
  const pet = petConfig[petName];
  if (!pet) return {};

  const ratings = {};
  for (const attr in pet.growthRates) {
    const rate = pet.growthRates[attr];
    for (const [tier, { min }] of Object.entries(GROWTH_RATE_TIERS)) {
      if (rate >= min) {
        ratings[attr] = tier;
        break;
      }
    }
  }
  return ratings;
};
