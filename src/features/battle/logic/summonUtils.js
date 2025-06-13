/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-02 03:53:16
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-13 09:38:03
 */
import { ATTRIBUTE_TYPES, PET_TYPES } from '@/config/enumConfig';
import { derivedAttributeConfig } from '@/config/config';

/**
 * Calculates the battle stats for a summon based on its template and level.
 * @param {object} summonTemplate - The summon's template object from summonConfig.
 * @param {number} level - The current level of the summon for this battle.
 * @returns {object} A stats object for the BattleUnit.
 */
export const calculateSummonStats = (summonTemplate, level) => {
  if (!summonTemplate || typeof level !== 'number' || level < 1) {
    console.error('[calculateSummonStats] Invalid summonTemplate or level provided.', { summonTemplate, level });
    // Return a default fallback stat structure or throw an error
    return {
      currentHp: 1, maxHp: 1, currentMp: 0, maxMp: 0,
      attack: 1, defense: 1, speed: 1,
      critRate: 0, critDamage: 1.5, hitRate: 1, dodgeRate: 0,
    };
  }

  const calculatedPrimaryAttributes = {};

  // Calculate primary attributes (CON, STR, AGI, INT, LCK)
  for (const attrKey in ATTRIBUTE_TYPES) {
    const attrType = ATTRIBUTE_TYPES[attrKey];
    const baseRange = summonTemplate.basicAttributeRanges?.[attrType];
    const growthRate = summonTemplate.growthRates?.[attrType];

    if (baseRange && typeof growthRate === 'number') {
      const baseValueL1 = (baseRange[0] + baseRange[1]) / 2;
      // Formula: BaseL1 * (1 + (Level - 1) * GrowthRate)
      calculatedPrimaryAttributes[attrType] = Math.floor(baseValueL1 * (1 + (level - 1) * growthRate));
    } else {
      // Fallback if data is missing, though ideally summonConfig should be complete
      calculatedPrimaryAttributes[attrType] = 0;
      console.warn(`[calculateSummonStats] Missing baseRange or growthRate for ${attrType} in summon: ${summonTemplate.id}`);
    }
  }
  
  const calculatedDerivedStats = {};

  // Calculate derived stats (HP, MP, PhysicalAttack, etc.)
  for (const derivedStatKey in derivedAttributeConfig) {
    const configEntry = derivedAttributeConfig[derivedStatKey];
    let rawDerivedValue = 0;

    if (configEntry.attributes && Array.isArray(configEntry.attributes)) {
      configEntry.attributes.forEach(primaryAttrKey => {
        rawDerivedValue += (calculatedPrimaryAttributes[primaryAttrKey] || 0);
      });
      calculatedDerivedStats[derivedStatKey] = Math.floor(rawDerivedValue * (configEntry.multiplier || 1));
    } else {
        calculatedDerivedStats[derivedStatKey] = 0;
        console.warn(`[calculateSummonStats] Missing 'attributes' array for derived stat: ${derivedStatKey}`);
    }
  }

  // Hit rate might not be in derivedAttributeConfig, provide a default
  const hitRate = calculatedDerivedStats.hitRate !== undefined ? calculatedDerivedStats.hitRate : 1.0;

  return {
    maxHp: Math.max(1, calculatedDerivedStats.hp || 1),
    currentHp: Math.max(1, calculatedDerivedStats.hp || 1),
    maxMp: Math.max(0, calculatedDerivedStats.mp || 0),
    currentMp: Math.max(0, calculatedDerivedStats.mp || 0),
    physicalAttack: Math.max(0, calculatedDerivedStats.physicalAttack || 0),
    magicalAttack: Math.max(0, calculatedDerivedStats.magicalAttack || 0),
    physicalDefense: Math.max(0, calculatedDerivedStats.physicalDefense || 0),
    magicalDefense: Math.max(0, calculatedDerivedStats.magicalDefense || 0),
    speed: Math.max(1, calculatedDerivedStats.speed || 1),
    critRate: Math.max(0, calculatedDerivedStats.critRate || 0),
    critDamage: Math.max(1.0, calculatedDerivedStats.critDamage || 1.5), // Crit damage is a multiplier, usually >= 1.0
    hitRate: Math.max(0, hitRate),
    dodgeRate: Math.max(0, calculatedDerivedStats.dodgeRate || 0),
  };
};
