# 召唤兽类型系统 (Summon Nature Types)

## 概述

召唤兽类型系统为游戏增加了三种不同的召唤兽获取方式，每种类型都有独特的属性和成长特点，模仿《御灵录》的召唤兽系统。

## 三种召唤兽类型

### 🌿 野生 (Wild)
- **特点**: 在野外自然生长的召唤兽
- **初始等级**: 5-15级随机
- **基础属性倍数**: 1.0 (正常)
- **成长率倍数**: 1.0 (正常)
- **潜力点奖励**: 0 (无额外奖励)
- **优势**: 获得时就有一定等级，可以立即使用
- **劣势**: 由于有初始等级，失去了从0级开始培养的潜力点

### 👶 宝宝 (Baby)
- **特点**: 刚出生的幼体召唤兽，潜力巨大
- **初始等级**: 0级
- **基础属性倍数**: 1.15 (提升15%)
- **成长率倍数**: 1.1 (提升10%)
- **潜力点奖励**: +20点
- **优势**: 更好的基础属性和成长率，额外潜力点
- **劣势**: 需要从0级开始培养

### 🧬 变异 (Mutant)
- **特点**: 发生基因变异的特殊召唤兽，拥有超越常规的天赋
- **初始等级**: 0级
- **基础属性倍数**: 1.3 (提升30%)
- **成长率倍数**: 1.2 (提升20%)
- **潜力点奖励**: +40点
- **优势**: 最佳的属性和成长率，最多潜力点
- **劣势**: 需要从0级开始培养，获得难度最高

## 技术实现

### 配置文件

#### 枚举配置 (src/config/enumConfig.js)
```javascript
export const SUMMON_NATURE_TYPES = {
  WILD: "wild",
  BABY: "baby", 
  MUTANT: "mutant"
};

export const SUMMON_NATURE_CONFIG = {
  [SUMMON_NATURE_TYPES.WILD]: {
    name: "野生",
    baseAttributeMultiplier: 1.0,
    growthRateMultiplier: 1.0,
    initialLevelRange: [5, 15],
    potentialPointsBonus: 0
  }
  // ... 其他配置
};
```

#### UI文本配置 (src/config/ui/uiTextConfig.js)
```javascript
summonNatureTypes: {
  [SUMMON_NATURE_TYPES.WILD]: "野生",
  [SUMMON_NATURE_TYPES.BABY]: "宝宝",
  [SUMMON_NATURE_TYPES.MUTANT]: "变异"
}
```

### 生成函数

#### 修改后的生成函数 (src/utils/summonUtils.js)
```javascript
export const generateNewSummon = ({ 
  summonSourceId, 
  quality, 
  natureType = 'wild',  // 新增参数
  source, 
  dispatch 
}) => {
  // 根据类型调整属性和等级
  const natureConfig = SUMMON_NATURE_CONFIG[natureType];
  const baseAttributes = applyNatureMultiplier(baseAttributes, natureConfig);
  const initialLevel = calculateInitialLevel(natureConfig.initialLevelRange);
  const potentialPoints = calculatePotentialPoints(initialLevel, natureConfig);
  
  return {
    // ... 其他属性
    natureType,
    level: initialLevel,
    potentialPoints,
    basicAttributes: baseAttributes
  };
};
```

### 成长率调整

#### 动态成长率计算 (src/config/summon/summonConfig.js)
```javascript
export const getAdjustedGrowthRatesSync = (summonSourceId, natureType, natureConfig) => {
  const summonData = summonConfig[summonSourceId];
  const adjustedGrowthRates = {};
  
  Object.keys(summonData.growthRates).forEach(attr => {
    adjustedGrowthRates[attr] = summonData.growthRates[attr] * natureConfig.growthRateMultiplier;
  });
  
  return adjustedGrowthRates;
};
```

## UI显示

### 召唤兽信息界面
- 在召唤兽详情页面显示类型标签
- 不同类型使用不同的颜色和图标
- 野生：灰色 + 树图标
- 宝宝：蓝色 + 婴儿图标  
- 变异：紫色 + DNA图标

### 召唤兽列表
- 在召唤兽卡片上显示类型标识
- 支持按类型筛选和排序

## 游戏平衡

### 潜力点机制
- **野生召唤兽**: 由于有初始等级，失去了从0级培养的潜力点优势
- **宝宝召唤兽**: 0级开始 + 20点潜力点奖励 = 更多培养空间
- **变异召唤兽**: 0级开始 + 40点潜力点奖励 = 最大培养潜力

### 属性差异示例
以幽灵为例，基础体质范围 [100, 200]：

| 类型 | 基础体质范围 | 成长率 | 初始等级 | 潜力点 |
|------|-------------|--------|----------|--------|
| 野生 | [100, 200] | 0.035 | 5-15级 | 0 |
| 宝宝 | [115, 230] | 0.0385 | 0级 | +20 |
| 变异 | [130, 260] | 0.042 | 0级 | +40 |

## 使用示例

### 生成不同类型的召唤兽
```javascript
// 生成野生召唤兽
const wildSummon = generateNewSummon({
  summonSourceId: 'ghost',
  quality: 'normal',
  natureType: 'wild',
  source: 'capture'
});

// 生成宝宝召唤兽
const babySummon = generateNewSummon({
  summonSourceId: 'ghost', 
  quality: 'normal',
  natureType: 'baby',
  source: 'hatch'
});

// 生成变异召唤兽
const mutantSummon = generateNewSummon({
  summonSourceId: 'ghost',
  quality: 'normal', 
  natureType: 'mutant',
  source: 'special'
});
```

### 获取类型显示名称
```javascript
import { getSummonNatureTypeDisplayName } from '@/config/ui/uiTextConfig';

const displayName = getSummonNatureTypeDisplayName('baby'); // "宝宝"
```

## 测试

运行测试文件验证功能：
```javascript
// 在浏览器控制台中
import { runAllTests } from './src/test/summonNatureTest.js';
runAllTests();
```

## 扩展性

系统设计支持未来添加更多召唤兽类型：
1. 在 SUMMON_NATURE_TYPES 中添加新类型
2. 在 SUMMON_NATURE_CONFIG 中配置属性
3. 在 uiTextConfig.js 中添加显示名称
4. 更新UI组件以支持新类型的显示

## 注意事项

1. **向后兼容**: 现有召唤兽默认为野生类型
2. **数据迁移**: 升级时需要为现有召唤兽添加 natureType 字段
3. **平衡性**: 可根据游戏测试调整各类型的数值
4. **UI一致性**: 确保所有显示召唤兽的地方都支持类型显示 