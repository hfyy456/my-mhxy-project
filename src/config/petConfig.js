export const petConfig = {
  幽灵: {
    growthRates: {
      constitution: 0.035,
      strength: 0.025,
      agility: 0.038,
      intelligence: 0.042,
      luck: 0.02,
    },
    type: "法攻",
    color: "blue-500",
    basicAttributeRanges: {
      constitution: [100, 200],
      strength: [80, 180],
      agility: [120, 220],
      intelligence: [150, 250],
      luck: [50, 150],
    },
    initialSkills: ["法术暴击", "敏捷", "感知", "魔之心"],
    background:
      "来自幽冥世界的神秘生灵，掌握着强大的法术力量。它们生前多为修炼者，因执念不散而化为幽灵，擅长使用各种神秘法术攻击敌人。",
  },
  持国巡守: {
    growthRates: {
      constitution: 0.035,
      strength: 0.045,
      agility: 0.025,
      intelligence: 0.02,
      luck: 0.02,
    },
    type: "物攻",
    color: "red-500",

    basicAttributeRanges: {
      constitution: [100, 200],
      strength: [180, 280],
      agility: [80, 180],
      intelligence: [50, 150],
      luck: [50, 150],
    },
    initialSkills: ["必杀", "连击", "偷袭", "强力"],
    background:
      "天宫的守卫者，拥有强大的战斗力和忠诚的品格。它们曾是天界的战士，因犯错被贬下凡间，凭借着天生的战斗本能和强大的力量，成为了战场上的杀戮机器。",
  },
  雷鸟人: {
    growthRates: {
      constitution: 0.03,
      strength: 0.025,
      agility: 0.04,
      intelligence: 0.03,
      luck: 0.02,
    },
    type: "速度",
    color: "yellow-500",

    basicAttributeRanges: {
      constitution: [80, 180],
      strength: [60, 160],
      agility: [200, 300],
      intelligence: [80, 180],
      luck: [60, 160],
    },
    initialSkills: ["敏捷", "偷袭", "感知", "幸运"],
    background:
      "居住在雷泽中的神兽，身体轻盈如燕，速度快如闪电。它们能够操纵雷电之力，在战斗中常常出其不意地攻击敌人，让对手防不胜防。",
  },
  吸血鬼: {
    growthRates: {
      constitution: 0.045,
      strength: 0.025,
      agility: 0.02,
      intelligence: 0.02,
      luck: 0.02,
    },
    type: "生命",
    color: "green-500",

    basicAttributeRanges: {
      constitution: [200, 300],
      strength: [100, 200],
      agility: [60, 160],
      intelligence: [80, 180],
      luck: [80, 180],
    },
    initialSkills: ["神佑复生", "隐身", "反震", "防御"],
    background:
      "来自异域的神秘生物，以吸食鲜血为生。它们拥有强大的生命力和恢复能力，能够在战斗中不断地补充自己的体力，是战场上的不死之身。",
  },
  // 新增召唤兽
  机关鸟: {
    growthRates: {
      constitution: 0.035,
      strength: 0.025,
      agility: 0.038,
      intelligence: 0.042,
      luck: 0.02,
    },
    type: "法攻",
    color: "orange-500",

    basicAttributeRanges: {
      constitution: [100, 200],
      strength: [80, 180],
      agility: [150, 250],
      intelligence: [180, 280],
      luck: [60, 160],
    },
    initialSkills: ["法术连击", "魔之心", "敏捷"],
    background:
      "由古代工匠精心打造的机关生物，体内蕴含着强大的法术能量。它们能够发射各种元素法术，攻击范围广泛，是团队战斗中的重要火力支援。",
  },
  猫灵: {
    growthRates: {
      constitution: 0.035,
      strength: 0.045,
      agility: 0.025,
      intelligence: 0.02,
      luck: 0.02,
    },
    type: "物攻",
    color: "pink-500",

    basicAttributeRanges: {
      constitution: [120, 220],
      strength: [200, 300],
      agility: [120, 220],
      intelligence: [60, 160],
      luck: [80, 180],
    },
    initialSkills: ["必杀", "偷袭", "夜战"],
    background:
      "修炼成精的猫妖，身姿婀娜，行动敏捷。它们擅长在夜间行动，凭借着敏锐的感官和强大的爆发力，常常在瞬间给予敌人致命一击。",
  },
  狂豹: {
    growthRates: {
      constitution: 0.035,
      strength: 0.043,
      agility: 0.025,
      intelligence: 0.02,
      luck: 0.02,
    },
    type: "物攻",
    color: "brown-500",

    basicAttributeRanges: {
      constitution: [110, 210],
      strength: [190, 290],
      agility: [100, 200],
      intelligence: [50, 150],
      luck: [70, 170],
    },
    initialSkills: ["强力", "偷袭", "连击"],
    background:
      "生活在深山老林中的猛兽，性格暴躁，攻击力极强。它们拥有锋利的爪子和牙齿，能够轻易地撕裂敌人的防御，是战场上的恐怖杀手。",
  },
  混沌兽: {
    growthRates: {
      constitution: 0.035,
      strength: 0.025,
      agility: 0.035,
      intelligence: 0.045,
      luck: 0.02,
    },
    type: "法攻",
    color: "indigo-500",

    basicAttributeRanges: {
      constitution: [120, 220],
      strength: [80, 180],
      agility: [130, 230],
      intelligence: [200, 300],
      luck: [70, 170],
    },
    initialSkills: ["法术暴击", "魔之心", "法术波动"],
    background:
      "来自混沌空间的神秘生物，身体中蕴含着混沌之力。它们能够操纵各种元素的力量，施展出强大的法术攻击，甚至可以扭曲空间，让敌人陷入困境。",
  },
  夜叉: {
    growthRates: {
      constitution: 0.038,
      strength: 0.045,
      agility: 0.025,
      intelligence: 0.02,
      luck: 0.022,
    },
    type: "物攻",
    color: "cyan-500",

    basicAttributeRanges: {
      constitution: [130, 230],
      strength: [200, 300],
      agility: [110, 210],
      intelligence: [60, 160],
      luck: [80, 180],
    },
    initialSkills: ["必杀", "偷袭", "夜战"],
    background:
      "来自幽冥界的战士，身体强壮，战斗力惊人。它们擅长使用各种武器，在战斗中勇往直前，不畏强敌，是战场上的无畏先锋。",
  },
  蛟龙: {
    growthRates: {
      constitution: 0.035,
      strength: 0.025,
      agility: 0.038,
      intelligence: 0.042,
      luck: 0.02,
    },
    type: "法攻",
    color: "teal-500",

    basicAttributeRanges: {
      constitution: [100, 200],
      strength: [80, 180],
      agility: [140, 240],
      intelligence: [190, 290],
      luck: [70, 170],
    },
    initialSkills: ["法术连击", "魔之心", "水漫金山"],
    background:
      "生活在江河湖海中的龙族后裔，拥有操控水流的能力。它们能够施展出强大的水系法术，攻击范围广泛，并且可以在水中自由穿梭，是战场上的多面手。",
  },
  凤凰: {
    growthRates: {
      constitution: 0.035,
      strength: 0.025,
      agility: 0.04,
      intelligence: 0.042,
      luck: 0.023,
    },
    type: "法攻",
    color: "orange-600",

    basicAttributeRanges: {
      constitution: [110, 210],
      strength: [90, 190],
      agility: [150, 250],
      intelligence: [200, 300],
      luck: [80, 180],
    },
    initialSkills: ["法术暴击", "魔之心", "烈火"],
    background:
      "传说中的神鸟，象征着重生和希望。它们拥有操控火焰的能力，能够施展出毁灭性的火系法术，将敌人烧成灰烬。同时，凤凰还拥有复活的能力，能够在关键时刻挽救队友的生命。",
  },
  雾中仙: {
    growthRates: {
      constitution: 0.035,
      strength: 0.025,
      agility: 0.025,
      intelligence: 0.035,
      luck: 0.02,
    },
    type: "辅助",
    color: "purple-600",
    basicAttributeRanges: {
      constitution: [150, 250],
      strength: [80, 180],
      agility: [100, 200],
      intelligence: [120, 220],
      luck: [100, 200],
    },
    initialSkills: ["法术防御", "幸运", "反震"],
    background:
      "居住在迷雾森林中的神秘仙子，掌握着治愈和防御的魔法。它们能够为队友施加各种增益状态，提高团队的生存能力，同时也能够使用强大的防御法术，保护队友免受敌人的攻击。",
  },
  灵鹤: {
    growthRates: {
      constitution: 0.035,
      strength: 0.025,
      agility: 0.04,
      intelligence: 0.043,
      luck: 0.022,
    },
    type: "法攻",
    color: "blue-600",
    basicAttributeRanges: {
      constitution: [120, 220],
      strength: [90, 190],
      agility: [160, 260],
      intelligence: [210, 310],
      luck: [90, 190],
    },
    initialSkills: ["法术暴击", "魔之心", "泰山压顶"],
    background:
      "栖息在高山之上的灵禽，拥有超凡的智慧和强大的法术能力。它们能够施展出各种元素法术，攻击敌人的同时还能够为队友提供支援，是团队中不可或缺的重要成员。",
  },
  星灵仙子: {
    type: "法攻",
    growthRates: {
      constitution: 0.035,
      strength: 0.025,
      agility: 0.042,
      intelligence: 0.045,
      luck: 0.023,
    },
    color: "pink-600",

    basicAttributeRanges: {
      constitution: [130, 230],
      strength: [100, 200],
      agility: [170, 270],
      intelligence: [220, 320],
      luck: [100, 200],
    },
    initialSkills: ["法术连击", "魔之心", "奔雷咒"],
    background:
      "来自星空的神秘仙子，身体中蕴含着星辰之力。它们能够操纵雷电之力，施展出强大的雷系法术，攻击范围广泛，并且可以在战斗中提高自己的速度和命中率，让敌人难以捉摸。",
  },
};
