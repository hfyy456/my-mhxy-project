/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 22:46:29
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-16 22:48:05
 */
export const uiText = {
  // General
  loading: "加载中...",
  levelLabel: "等级:",
  qualityLabel: "品质:",
  experienceLabel: "经验:",
  equipActionLabel: "可装备", // For empty equipment slot tooltip
  emptySlotLabel: "空栏位", // For empty skill slot
  typeLabel: "类型:", // For skill tooltip

  // Section Titles
  coreAttributesTitle: "核心属性",
  equipmentBarTitle: "装备栏",
  basicAttributesTitle: "基础属性",
  skillsTitle: "技能",
  skillsMaxCountInfo: "(最多12个)",

  // Attributes - used in core, basic, and equipment tooltips
  attr: {
    hp: "生命值",
    mp: "法力值",
    physicalAttack: "物攻", // Could be "物攻" for brevity if preferred
    magicalAttack: "法攻", // Could be "法攻"
    physicalDefense: "物防", // Could be "物抗"
    magicalDefense: "法防", // Could be "法抗"
    speed: "速度",
    critRate: "暴击率",
    critDamage: "暴击伤害",
    dodgeRate: "闪避率",
    constitution: "体质",
    strength: "力量",
    agility: "敏捷",
    intelligence: "智力",
    luck: "幸运",
    fireResistance: "火抗性",
    mpRecovery: "法力恢复",
    // Add any other attributes that appear in UI here
  },

  // Equipment Slot Types (display names for empty slots, and potentially for titles if needed)
  slotTypes: {
    饰品: "饰品",
    遗物: "遗物",
    血脉: "血脉",
    符文: "符文",
  },
  // You can add more specific texts as needed
};

// Helper function to get attribute display name
export const getAttributeDisplayName = (key) => {
  return uiText.attr[key] || key;
};
