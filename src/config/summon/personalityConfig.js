import { ATTRIBUTE_TYPES } from '../enumConfig';

export const PERSONALITY_EFFECT_MODIFIER = 0.05; // 5% modification (for normal personalities, and negative effect for extreme)
export const EXTREME_POSITIVE_MODIFIER = 0.10; // 10% positive modification for extreme personalities

export const PERSONALITY_TYPES = {
  BRAVE: 'brave',
  TIMID: 'timid',
  CALM: 'calm',
  STUBBORN: 'stubborn',
  JOLLY: 'jolly',
  LONELY: 'lonely',
  ADAMANT: 'adamant',
  MODEST: 'modest',
  BOLD: 'bold',
  IMPISH: 'impish',
  CAREFUL: 'careful',
  GENTLE: 'gentle',
  HASTY: 'hasty',
  NAIVE: 'naive',
  NEUTRAL: 'neutral',
  // Extreme Personalities
  RECKLESS: 'reckless',   // 鲁莽: ++力量, -敏捷, -智力
  FOCUSED: 'focused',   // 专注: ++智力, -力量, -运气
  RESOLUTE: 'resolute', // 坚毅: ++体质, -敏捷, -运气
  SWIFT: 'swift',     // 迅捷: ++敏捷, -体质, -力量
  BLESSED: 'blessed',   // 祝福: ++运气, -体质, -智力
};

export const personalityConfig = {
  // Normal Personalities (using PERSONALITY_EFFECT_MODIFIER for both increase and decrease)
  [PERSONALITY_TYPES.BRAVE]: {
    id: PERSONALITY_TYPES.BRAVE,
    name: '勇敢',
    increasedStat: ATTRIBUTE_TYPES.STRENGTH,
    decreasedStat: ATTRIBUTE_TYPES.INTELLIGENCE,
    description: '提升力量(+5%)，但会降低智力(-5%)。',
  },
  [PERSONALITY_TYPES.TIMID]: {
    id: PERSONALITY_TYPES.TIMID,
    name: '胆小',
    increasedStat: ATTRIBUTE_TYPES.AGILITY,
    decreasedStat: ATTRIBUTE_TYPES.STRENGTH,
    description: '提升敏捷(+5%)，但会降低力量(-5%)。',
  },
  [PERSONALITY_TYPES.CALM]: {
    id: PERSONALITY_TYPES.CALM,
    name: '冷静',
    increasedStat: ATTRIBUTE_TYPES.INTELLIGENCE,
    decreasedStat: ATTRIBUTE_TYPES.AGILITY,
    description: '提升智力(+5%)，但会降低敏捷(-5%)。',
  },
  [PERSONALITY_TYPES.STUBBORN]: {
    id: PERSONALITY_TYPES.STUBBORN,
    name: '固执',
    increasedStat: ATTRIBUTE_TYPES.CONSTITUTION,
    decreasedStat: ATTRIBUTE_TYPES.LUCK,
    description: '提升体质(+5%)，但会降低运气(-5%)。',
  },
  [PERSONALITY_TYPES.JOLLY]: {
    id: PERSONALITY_TYPES.JOLLY,
    name: '开朗',
    increasedStat: ATTRIBUTE_TYPES.LUCK,
    decreasedStat: ATTRIBUTE_TYPES.CONSTITUTION,
    description: '提升运气(+5%)，但会降低体质(-5%)。',
  },
  [PERSONALITY_TYPES.LONELY]: {
    id: PERSONALITY_TYPES.LONELY,
    name: '孤僻',
    increasedStat: ATTRIBUTE_TYPES.STRENGTH,
    decreasedStat: ATTRIBUTE_TYPES.CONSTITUTION,
    description: '提升力量(+5%)，但会降低体质(-5%)。',
  },

  [PERSONALITY_TYPES.MODEST]: {
    id: PERSONALITY_TYPES.MODEST,
    name: '保守',
    increasedStat: ATTRIBUTE_TYPES.INTELLIGENCE,
    decreasedStat: ATTRIBUTE_TYPES.STRENGTH,
    description: '提升智力(+5%)，但会降低力量(-5%)。',
  },
  [PERSONALITY_TYPES.BOLD]: {
    id: PERSONALITY_TYPES.BOLD,
    name: '大胆',
    increasedStat: ATTRIBUTE_TYPES.CONSTITUTION,
    decreasedStat: ATTRIBUTE_TYPES.STRENGTH,
    description: '提升体质(+5%)，但会降低力量(-5%)。',
  },
  [PERSONALITY_TYPES.IMPISH]: {
    id: PERSONALITY_TYPES.IMPISH,
    name: '淘气',
    increasedStat: ATTRIBUTE_TYPES.CONSTITUTION,
    decreasedStat: ATTRIBUTE_TYPES.INTELLIGENCE,
    description: '提升体质(+5%)，但会降低智力(-5%)。',
  },
  [PERSONALITY_TYPES.CAREFUL]: {
    id: PERSONALITY_TYPES.CAREFUL,
    name: '慎重',
    increasedStat: ATTRIBUTE_TYPES.LUCK, 
    decreasedStat: ATTRIBUTE_TYPES.INTELLIGENCE,
    description: '提升运气(+5%)，但会降低智力(-5%)。',
  },
  [PERSONALITY_TYPES.GENTLE]: {
    id: PERSONALITY_TYPES.GENTLE,
    name: '温顺',
    increasedStat: ATTRIBUTE_TYPES.LUCK, 
    decreasedStat: ATTRIBUTE_TYPES.CONSTITUTION,
    description: '提升运气(+5%)，但会降低体质(-5%)。',
  },
  [PERSONALITY_TYPES.HASTY]: {
    id: PERSONALITY_TYPES.HASTY,
    name: '急躁',
    increasedStat: ATTRIBUTE_TYPES.AGILITY, 
    decreasedStat: ATTRIBUTE_TYPES.CONSTITUTION,
    description: '提升敏捷(+5%)，但会降低体质(-5%)。',
  },
  [PERSONALITY_TYPES.NAIVE]: {
    id: PERSONALITY_TYPES.NAIVE,
    name: '天真',
    increasedStat: ATTRIBUTE_TYPES.AGILITY,
    decreasedStat: ATTRIBUTE_TYPES.LUCK,
    description: '提升敏捷(+5%)，但会降低运气(-5%)。',
  },
  [PERSONALITY_TYPES.NEUTRAL]: {
    id: PERSONALITY_TYPES.NEUTRAL,
    name: '中庸',
    increasedStat: null,
    decreasedStat: null,
    description: '属性不受性格影响。',
  },
  // Extreme Personalities
  [PERSONALITY_TYPES.RECKLESS]: {
    id: PERSONALITY_TYPES.RECKLESS,
    name: '鲁莽',
    isExtreme: true,
    extremeStat: ATTRIBUTE_TYPES.STRENGTH,
    decreasedStat1: ATTRIBUTE_TYPES.AGILITY,
    decreasedStat2: ATTRIBUTE_TYPES.INTELLIGENCE,
    description: '大幅提升力量(+10%)，但会降低敏捷(-5%)和智力(-5%)。',
  },
  [PERSONALITY_TYPES.FOCUSED]: {
    id: PERSONALITY_TYPES.FOCUSED,
    name: '专注',
    isExtreme: true,
    extremeStat: ATTRIBUTE_TYPES.INTELLIGENCE,
    decreasedStat1: ATTRIBUTE_TYPES.STRENGTH,
    decreasedStat2: ATTRIBUTE_TYPES.LUCK,
    description: '大幅提升智力(+10%)，但会降低力量(-5%)和运气(-5%)。',
  },
  [PERSONALITY_TYPES.RESOLUTE]: {
    id: PERSONALITY_TYPES.RESOLUTE,
    name: '坚毅',
    isExtreme: true,
    extremeStat: ATTRIBUTE_TYPES.CONSTITUTION,
    decreasedStat1: ATTRIBUTE_TYPES.AGILITY, // Changed from SPEED to AGILITY as speed is not a base ATTRIBUTE_TYPE
    decreasedStat2: ATTRIBUTE_TYPES.LUCK,
    description: '大幅提升体质(+10%)，但会降低敏捷(-5%)和运气(-5%)。',
  },
  [PERSONALITY_TYPES.SWIFT]: {
    id: PERSONALITY_TYPES.SWIFT,
    name: '迅捷',
    isExtreme: true,
    extremeStat: ATTRIBUTE_TYPES.AGILITY,
    decreasedStat1: ATTRIBUTE_TYPES.CONSTITUTION,
    decreasedStat2: ATTRIBUTE_TYPES.STRENGTH,
    description: '大幅提升敏捷(+10%)，但会降低体质(-5%)和力量(-5%)。',
  },
  [PERSONALITY_TYPES.BLESSED]: {
    id: PERSONALITY_TYPES.BLESSED,
    name: '祝福',
    isExtreme: true,
    extremeStat: ATTRIBUTE_TYPES.LUCK,
    decreasedStat1: ATTRIBUTE_TYPES.CONSTITUTION,
    decreasedStat2: ATTRIBUTE_TYPES.INTELLIGENCE,
    description: '大幅提升运气(+10%)，但会降低体质(-5%)和智力(-5%)。',
  },
};

// Helper function to get a random personality ID
export const getRandomPersonalityId = () => {
  const ids = Object.keys(personalityConfig);
  // Ensure NEUTRAL is also a possible outcome if it's in personalityConfig
  // const filteredIds = ids.filter(id => personalityConfig[id]); // Not strictly necessary if all keys in PERSONALITY_TYPES are in config
  return ids[Math.floor(Math.random() * ids.length)];
};

// Helper function to get personality display name
export const getPersonalityDisplayName = (personalityId) => {
  return personalityConfig[personalityId]?.name || '未知性格';
}; 