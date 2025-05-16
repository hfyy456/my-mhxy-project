/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 19:04:44
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-17 04:43:12
 */
export const equipmentConfig = {
  饰品: [
    {
      name: "学徒护符",
      description: "新手常用的护身符，能略微提升法力值。",
      icon: "fa-solid fa-gem", // 示例图标，可替换
      slotType: "饰品",
      effects: { mp: 20, magicalAttack: 5 },
    },
    {
      name: "勇气勋章",
      description: "授予勇敢者的勋章，能增加少量生命和攻击。",
      icon: "fa-solid fa-shield-halved", // 示例图标
      slotType: "饰品",
      effects: { hp: 30, physicalAttack: 5 },
    },
    {
      name: "敏捷指环",
      description: "提升佩戴者的敏捷，使其行动更迅速。",
      icon: "fa-solid fa-ring",
      slotType: "饰品",
      effects: { agility: 10, speed: 15 },
    },
    {
      name: "学者眼镜",
      description: "增强智力，略微提升法术暴击。",
      icon: "fa-solid fa-glasses",
      slotType: "饰品",
      effects: { intelligence: 12, critRate: 0.05 },
    },
  ],
  遗物: [
    {
      name: "先祖之石",
      description: "蕴含先祖力量的石头，全面提升基础属性。",
      icon: "fa-solid fa-landmark", // 示例图标
      slotType: "遗物",
      effects: { constitution: 5, strength: 5, agility: 5, intelligence: 5 },
    },
    {
      name: "失落卷轴",
      description: "记载着古老知识的卷轴，大幅提升法术效果。",
      icon: "fa-solid fa-scroll", // 示例图标
      slotType: "遗物",
      effects: { magicalAttack: 25, critRate: 0.02 },
    },
    {
      name: "守护者壁垒",
      description: "古老文明的防御遗物，大幅提升双抗。",
      icon: "fa-solid fa-shield-heart",
      slotType: "遗物",
      effects: { physicalDefense: 25, magicalDefense: 25 },
    },
  ],
  血脉: [
    {
      name: "巨龙之血",
      description: "稀释的巨龙血液，赋予强大的生命力和火焰抗性。",
      icon: "fa-solid fa-fire", // 示例图标
      slotType: "血脉",
      effects: { hp: 100, fireResistance: 0.1 },
    },
    {
      name: "精灵之泪",
      description: "精灵族的圣物，提升敏捷和魔法恢复速度。",
      icon: "fa-solid fa-leaf", // 示例图标
      slotType: "血脉",
      effects: { agility: 15, mpRecovery: 5 },
    },
    {
      name: "山岭巨人血脉",
      description: "注入山岭巨人的坚韧血液，大幅提升体质和生命值。",
      icon: "fa-solid fa-mountain",
      slotType: "血脉",
      effects: { constitution: 15, hp: 150 },
    },
  ],
  符文: [
    {
      name: "力量符文",
      description: "刻有力量印记的符文，增强物理攻击。",
      icon: "fa-solid fa-hand-fist", // 示例图标
      slotType: "符文",
      effects: { physicalAttack: 15 },
    },
    {
      name: "守护符文",
      description: "提供基础的防御加持。",
      icon: "fa-solid fa-shield", // 示例图标
      slotType: "符文",
      effects: { physicalDefense: 10, magicalDefense: 10 },
    },
    {
      name: "精准符文",
      description: "略微增加暴击伤害。",
      icon: "fa-solid fa-crosshairs",
      slotType: "符文",
      effects: { critDamage: 0.02 },
    },
    {
      name: "再生符文",
      description: "略微提升佩戴者的体质。",
      icon: "fa-solid fa-heart-pulse",
      slotType: "符文",
      effects: { constitution: 5 },
    },
  ],
};

// 装备品质配置 (如果需要统一管理)
export const equipmentQualityConfig = {
  names: ["普通", "优秀", "精良", "卓越", "完美"],
  colors: {
    普通: "normal",
    优秀: "excellent",
    精良: "rare",
    卓越: "epic",
    完美: "perfect",
  },
  effectMultiplier: [1.0, 1.2, 1.5, 1.8, 2.2], // 品质对效果的乘数
};

// 示例：根据品质调整装备效果
export function getEquipmentWithQualityEffects(equipment) {
  // This function now fully relies on the passed `equipment` object having a `quality` property,
  // which will be added dynamically when an item is equipped.
  if (!equipment || !equipment.quality) {
    // console.warn("[getEquipmentWithQualityEffects] Equipment or equipment.quality is missing.");
    return equipment; // Return original if quality is somehow missing
  }
  const qualityDetails = equipmentQualityConfig.names.indexOf(
    equipment.quality
  );
  if (qualityDetails === -1) {
    // console.warn(`[getEquipmentWithQualityEffects] Quality "${equipment.quality}" not found in config.`);
    return equipment; // 品质不存在则返回原效果
  }

  const multiplier =
    equipmentQualityConfig.effectMultiplier[qualityDetails] || 1;
  const newEffects = {};
  for (const key in equipment.effects) {
    newEffects[key] = Math.round(equipment.effects[key] * multiplier);
  }
  return { ...equipment, effects: newEffects };
}
