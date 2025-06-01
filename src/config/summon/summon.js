import { summonConfig } from './summonConfig';
import { GROWTH_RATE_TIERS, ATTRIBUTE_TYPES } from './enumConfig';

// 计算宠物评分
export const calculateSummonScore = (summonName, attributes, level) => {
  const summon = summonConfig[summonName];
  if (!summon) return 0;

  let score = 0;
  const weights = {
    [ATTRIBUTE_TYPES.CONSTITUTION]: 1,
    [ATTRIBUTE_TYPES.STRENGTH]: 1,
    [ATTRIBUTE_TYPES.AGILITY]: 1,
    [ATTRIBUTE_TYPES.INTELLIGENCE]: 1,
    [ATTRIBUTE_TYPES.LUCK]: 0.5
  };

  // 计算属性得分
  Object.entries(attributes).forEach(([attr, value]) => {
    const weight = weights[attr] || 1;
    score += value * weight;
  });

  // 考虑等级因素
  score = score * (1 + level * 0.1);

  return Math.round(score);
};

// 获取宠物成长等级评价
export const getSummonGrowthRating = (summonName) => {
  const summon = summonConfig[summonName];
  if (!summon) return null;

  // 计算平均成长率
  const growthRates = summon.growthRates;
  const avgGrowthRate = Object.values(growthRates).reduce((a, b) => a + b, 0) / Object.keys(growthRates).length;

  // 根据成长率判断等级
  for (const [tier, { min, label }] of Object.entries(GROWTH_RATE_TIERS)) {
    if (avgGrowthRate >= min) {
      return { tier, label, avgGrowthRate };
    }
  }

  return { tier: 'D', label: '较差', avgGrowthRate };
};

// 计算宠物属性范围
export const calculateAttributeRange = (summonName, attribute, level) => {
  const summon = summonConfig[summonName];
  if (!summon) return null;

  const baseRange = summon.basicAttributeRanges[attribute];
  const growthRate = summon.growthRates[attribute];

  return {
    min: Math.round(baseRange[0] * (1 + growthRate * level)),
    max: Math.round(baseRange[1] * (1 + growthRate * level))
  };
}; 