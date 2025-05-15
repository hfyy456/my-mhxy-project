export const petConfig = {
  幽灵: {
    growthRates: {
      constitution: 0.5,
      strength: 0.3,
      agility: 0.6,
      intelligence: 0.8,
      luck: 0.3,
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
    initialSkills: ["高级法术暴击", "高级敏捷", "高级感知", "高级魔之心"],
  },
  持国巡守: {
    growthRates: {
      constitution: 0.5,
      strength: 0.8,
      agility: 0.3,
      intelligence: 0.3,
      luck: 0.3,
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
    initialSkills: ["高级必杀", "高级连击", "高级偷袭", "高级强力"],
  },
  雷鸟人: {
    growthRates: {
      constitution: 0.3,
      strength: 0.3,
      agility: 0.8,
      intelligence: 0.3,
      luck: 0.3,
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
    initialSkills: ["高级敏捷", "高级偷袭", "高级感知", "高级幸运"],
  },
  吸血鬼: {
    growthRates: {
      constitution: 0.8,
      strength: 0.3,
      agility: 0.3,
      intelligence: 0.3,
      luck: 0.3,
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
    initialSkills: ["高级神佑复生", "高级隐身", "高级反震", "高级防御"],
  },
  // 新增召唤兽
  机关鸟: {
    growthRates: {
      constitution: 0.5,
      strength: 0.3,
      agility: 0.6,
      intelligence: 0.8,
      luck: 0.3,
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
    initialSkills: ["高级法术连击", "高级魔之心", "高级敏捷"],
  },
  猫灵: {
    growthRates: {
      constitution: 0.5,
      strength: 0.8,
      agility: 0.3,
      intelligence: 0.3,
      luck: 0.3,
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
    initialSkills: ["高级必杀", "高级偷袭", "高级夜战"],
  },
  狂豹: {
    growthRates: {
      constitution: 0.5,
      strength: 0.8,
      agility: 0.3,
      intelligence: 0.3,
      luck: 0.3,
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
    initialSkills: ["高级强力", "高级偷袭", "高级连击"],
  },
  混沌兽: {
    growthRates: {
      constitution: 0.5,
      strength: 0.3,
      agility: 0.6,
      intelligence: 0.8,
      luck: 0.3,
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
    initialSkills: ["高级法术暴击", "高级魔之心", "高级法术波动"],
  },
  夜叉: {
    growthRates: {
      constitution: 0.5,
      strength: 0.8,
      agility: 0.3,
      intelligence: 0.3,
      luck: 0.3,
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
    initialSkills: ["高级必杀", "高级偷袭", "高级夜战"],
  },
  蛟龙: {
    growthRates: {
      constitution: 0.5,
      strength: 0.3,
      agility: 0.6,
      intelligence: 0.8,
      luck: 0.3,
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
    initialSkills: ["高级法术连击", "高级魔之心", "高级水漫金山"],
  },
  凤凰: {
    growthRates: {
      constitution: 0.5,
      strength: 0.3,
      agility: 0.6,
      intelligence: 0.8,
      luck: 0.3,
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
    initialSkills: ["高级法术暴击", "高级魔之心", "高级烈火"],
  },
  雾中仙: {
    growthRates: {
      constitution: 0.5,
      strength: 0.3,
      agility: 0.3,
      intelligence: 0.5,
      luck: 0.3,
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
    initialSkills: ["高级法术防御", "高级幸运", "高级反震"],
  },
  灵鹤: {
    growthRates: {
      constitution: 0.5,
      strength: 0.3,
      agility: 0.6,
      intelligence: 0.8,
      luck: 0.3,
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
    initialSkills: ["高级法术暴击", "高级魔之心", "高级泰山压顶"],
  },
  星灵仙子: {
    type: "法攻",
    growthRates: {
      constitution: 0.5,
      strength: 0.3,
      agility: 0.6,
      intelligence: 0.8,
      luck: 0.3,
    },
    color: "pink-600",

    basicAttributeRanges: {
      constitution: [130, 230],
      strength: [100, 200],
      agility: [170, 270],
      intelligence: [220, 320],
      luck: [100, 200],
    },
    initialSkills: ["高级法术连击", "高级魔之心", "高级奔雷咒"],
  },
};
