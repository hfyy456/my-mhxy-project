/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 19:04:44
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-21 04:28:37
 */
import { BASE_CONFIG } from './baseConfig';
import { EQUIPMENT_SLOT_TYPES, EQUIPMENT_EFFECT_TYPES, QUALITY_TYPES } from './enumConfig';

export const petEquipmentConfig = {
  [EQUIPMENT_SLOT_TYPES.ACCESSORY]: [
    {
      id: "apprenticeAmulet",
      name: "学徒护符",
      description: "新手常用的护身符，能略微提升法力值。",
      icon: "fa-solid fa-gem",
      slotType: EQUIPMENT_SLOT_TYPES.ACCESSORY,
      effects: {
        [EQUIPMENT_EFFECT_TYPES.MP]: 20,
        [EQUIPMENT_EFFECT_TYPES.MAGICAL_ATTACK]: 5
      },
    },
    {
      id: "courageMedal",
      name: "勇气勋章",
      description: "授予勇敢者的勋章，能增加少量生命和攻击。",
      icon: "fa-solid fa-shield-halved",
      slotType: EQUIPMENT_SLOT_TYPES.ACCESSORY,
      effects: {
        [EQUIPMENT_EFFECT_TYPES.HP]: 30,
        [EQUIPMENT_EFFECT_TYPES.PHYSICAL_ATTACK]: 5
      },
    },
    {
      id: "agilityRing",
      name: "敏捷指环",
      description: "提升佩戴者的敏捷，使其行动更迅速。",
      icon: "fa-solid fa-ring",
      slotType: EQUIPMENT_SLOT_TYPES.ACCESSORY,
      effects: {
        [EQUIPMENT_EFFECT_TYPES.AGILITY]: 10,
        [EQUIPMENT_EFFECT_TYPES.SPEED]: 15
      },
    },
    {
      id: "scholarGlasses",
      name: "学者眼镜",
      description: "增强智力，略微提升法术暴击。",
      icon: "fa-solid fa-glasses",
      slotType: EQUIPMENT_SLOT_TYPES.ACCESSORY,
      effects: {
        [EQUIPMENT_EFFECT_TYPES.INTELLIGENCE]: 12,
        [EQUIPMENT_EFFECT_TYPES.CRIT_RATE]: 0.05
      },
    },
  ],
  [EQUIPMENT_SLOT_TYPES.RELIC]: [
    {
      id: "ancestralStone",
      name: "先祖之石",
      description: "蕴含先祖力量的石头，全面提升基础属性。",
      icon: "fa-solid fa-landmark",
      slotType: EQUIPMENT_SLOT_TYPES.RELIC,
      effects: {
        [EQUIPMENT_EFFECT_TYPES.CONSTITUTION]: 5,
        [EQUIPMENT_EFFECT_TYPES.STRENGTH]: 5,
        [EQUIPMENT_EFFECT_TYPES.AGILITY]: 5,
        [EQUIPMENT_EFFECT_TYPES.INTELLIGENCE]: 5
      },
    },
    {
      id: "lostScroll",
      name: "失落卷轴",
      description: "记载着古老知识的卷轴，大幅提升法术效果。",
      icon: "fa-solid fa-scroll",
      slotType: EQUIPMENT_SLOT_TYPES.RELIC,
      effects: {
        [EQUIPMENT_EFFECT_TYPES.MAGICAL_ATTACK]: 25,
        [EQUIPMENT_EFFECT_TYPES.CRIT_RATE]: 0.02
      },
    },
    {
      id: "guardianBarrier",
      name: "守护者壁垒",
      description: "古老文明的防御遗物，大幅提升双抗。",
      icon: "fa-solid fa-shield-heart",
      slotType: EQUIPMENT_SLOT_TYPES.RELIC,
      effects: {
        [EQUIPMENT_EFFECT_TYPES.PHYSICAL_DEFENSE]: 25,
        [EQUIPMENT_EFFECT_TYPES.MAGICAL_DEFENSE]: 25
      },
    },
  ],
  [EQUIPMENT_SLOT_TYPES.BLOODLINE]: [
    {
      id: "dragonBlood",
      name: "巨龙之血",
      description: "稀释的巨龙血液，赋予强大的生命力和火焰抗性。",
      icon: "fa-solid fa-fire",
      slotType: EQUIPMENT_SLOT_TYPES.BLOODLINE,
      effects: {
        [EQUIPMENT_EFFECT_TYPES.HP]: 100,
        [EQUIPMENT_EFFECT_TYPES.FIRE_RESISTANCE]: 0.1
      },
    },
    {
      id: "elfTears",
      name: "精灵之泪",
      description: "精灵族的圣物，提升敏捷和魔法恢复速度。",
      icon: "fa-solid fa-leaf",
      slotType: EQUIPMENT_SLOT_TYPES.BLOODLINE,
      effects: {
        [EQUIPMENT_EFFECT_TYPES.AGILITY]: 15,
        [EQUIPMENT_EFFECT_TYPES.MP_RECOVERY]: 5
      },
    },
    {
      id: "giantBloodline",
      name: "山岭巨人血脉",
      description: "注入山岭巨人的坚韧血液，大幅提升体质和生命值。",
      icon: "fa-solid fa-mountain",
      slotType: EQUIPMENT_SLOT_TYPES.BLOODLINE,
      effects: {
        [EQUIPMENT_EFFECT_TYPES.CONSTITUTION]: 15,
        [EQUIPMENT_EFFECT_TYPES.HP]: 150
      },
    },
  ],
  [EQUIPMENT_SLOT_TYPES.RUNE]: [
    {
      id: "strengthRune",
      name: "力量符文",
      description: "刻有力量印记的符文，增强物理攻击。",
      icon: "fa-solid fa-hand-fist",
      slotType: EQUIPMENT_SLOT_TYPES.RUNE,
      effects: {
        [EQUIPMENT_EFFECT_TYPES.PHYSICAL_ATTACK]: 15
      },
    },
    {
      id: "guardianRune",
      name: "守护符文",
      description: "提供基础的防御加持。",
      icon: "fa-solid fa-shield",
      slotType: EQUIPMENT_SLOT_TYPES.RUNE,
      effects: {
        [EQUIPMENT_EFFECT_TYPES.PHYSICAL_DEFENSE]: 10,
        [EQUIPMENT_EFFECT_TYPES.MAGICAL_DEFENSE]: 10
      },
    },
    {
      id: "precisionRune",
      name: "精准符文",
      description: "略微增加暴击伤害。",
      icon: "fa-solid fa-crosshairs",
      slotType: EQUIPMENT_SLOT_TYPES.RUNE,
      effects: {
        [EQUIPMENT_EFFECT_TYPES.CRIT_DAMAGE]: 0.02
      },
    },
    {
      id: "regenerationRune",
      name: "再生符文",
      description: "略微提升佩戴者的体质。",
      icon: "fa-solid fa-heart-pulse",
      slotType: EQUIPMENT_SLOT_TYPES.RUNE,
      effects: {
        [EQUIPMENT_EFFECT_TYPES.CONSTITUTION]: 5
      },
    },
  ],
};

// 装备品质配置
export const equipmentQualityConfig = {
  names: Object.values(QUALITY_TYPES),
  colors: BASE_CONFIG.QUALITY.colors,
  effectMultiplier: BASE_CONFIG.QUALITY.attributeMultipliers
};

// 根据品质调整装备效果
export function getEquipmentWithQualityEffects(equipment) {
  if (!equipment || !equipment.quality) {
    return equipment;
  }
  
  const qualityIndex = equipmentQualityConfig.names.indexOf(equipment.quality);
  if (qualityIndex === -1) {
    return equipment;
  }

  const multiplier = equipmentQualityConfig.effectMultiplier[qualityIndex] || 1;
  const newEffects = {};
  
  for (const key in equipment.effects) {
    newEffects[key] = Math.round(equipment.effects[key] * multiplier);
  }
  
  return { ...equipment, effects: newEffects };
}
