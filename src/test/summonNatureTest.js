/**
 * 召唤兽类型系统测试文件
 * 测试野生、宝宝、变异三种类型的召唤兽生成和属性差异
 */

import { generateNewSummon } from '../utils/summonUtils';
import { SUMMON_NATURE_TYPES, SUMMON_NATURE_CONFIG } from '../config/enumConfig';
import { getSummonNatureTypeDisplayName } from '../config/ui/uiTextConfig';

// 测试函数：生成不同类型的召唤兽
export const testSummonNatureTypes = () => {
  console.log('=== 召唤兽类型系统测试 ===');
  
  const testSummonId = 'ghost'; // 使用幽灵作为测试
  const testQuality = 'normal';
  
  // 测试三种类型的召唤兽
  const natureTypes = Object.values(SUMMON_NATURE_TYPES);
  const results = [];
  
  natureTypes.forEach(natureType => {
    console.log(`\n--- 测试 ${getSummonNatureTypeDisplayName(natureType)} 类型 ---`);
    
    try {
      const summon = generateNewSummon({
        summonSourceId: testSummonId,
        quality: testQuality,
        natureType: natureType,
        source: 'test',
        dispatch: null
      });
      
      const config = SUMMON_NATURE_CONFIG[natureType];
      
      console.log(`生成成功:`, {
        id: summon.id,
        name: summon.nickname,
        natureType: summon.natureType,
        level: summon.level,
        potentialPoints: summon.potentialPoints,
        basicAttributes: summon.basicAttributes,
        配置信息: {
          属性倍数: config.baseAttributeMultiplier,
          成长率倍数: config.growthRateMultiplier,
          等级范围: config.initialLevelRange,
          潜力点奖励: config.potentialPointsBonus
        }
      });
      
      results.push({
        natureType,
        summon,
        config
      });
      
    } catch (error) {
      console.error(`生成 ${natureType} 类型召唤兽失败:`, error);
    }
  });
  
  // 比较不同类型的差异
  console.log('\n=== 类型对比分析 ===');
  if (results.length >= 2) {
    const wild = results.find(r => r.natureType === SUMMON_NATURE_TYPES.WILD);
    const baby = results.find(r => r.natureType === SUMMON_NATURE_TYPES.BABY);
    const mutant = results.find(r => r.natureType === SUMMON_NATURE_TYPES.MUTANT);
    
    if (wild && baby) {
      console.log('\n野生 vs 宝宝:');
      console.log('等级差异:', wild.summon.level, 'vs', baby.summon.level);
      console.log('潜力点差异:', wild.summon.potentialPoints, 'vs', baby.summon.potentialPoints);
      console.log('体质属性差异:', wild.summon.basicAttributes.constitution, 'vs', baby.summon.basicAttributes.constitution);
    }
    
    if (baby && mutant) {
      console.log('\n宝宝 vs 变异:');
      console.log('等级差异:', baby.summon.level, 'vs', mutant.summon.level);
      console.log('潜力点差异:', baby.summon.potentialPoints, 'vs', mutant.summon.potentialPoints);
      console.log('体质属性差异:', baby.summon.basicAttributes.constitution, 'vs', mutant.summon.basicAttributes.constitution);
    }
  }
  
  return results;
};

// 测试成长率调整
export const testGrowthRateAdjustment = () => {
  console.log('\n=== 成长率调整测试 ===');
  
  const { getAdjustedGrowthRatesSync } = require('../config/summon/summonConfig');
  const testSummonId = 'ghost';
  
  Object.values(SUMMON_NATURE_TYPES).forEach(natureType => {
    const config = SUMMON_NATURE_CONFIG[natureType];
    const adjustedRates = getAdjustedGrowthRatesSync(testSummonId, natureType, config);
    
    console.log(`${getSummonNatureTypeDisplayName(natureType)} 成长率:`, adjustedRates);
  });
};

// 运行所有测试
export const runAllTests = () => {
  try {
    testSummonNatureTypes();
    testGrowthRateAdjustment();
    console.log('\n✅ 所有测试完成');
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
};

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  // 在浏览器环境中，将测试函数挂载到全局对象
  window.summonNatureTest = {
    testSummonNatureTypes,
    testGrowthRateAdjustment,
    runAllTests
  };
  
  console.log('召唤兽类型测试函数已加载，可以在控制台中运行:');
  console.log('- window.summonNatureTest.runAllTests()');
} 