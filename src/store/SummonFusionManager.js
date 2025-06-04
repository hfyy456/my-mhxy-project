/**
 * 召唤兽合成管理器
 * 负责处理召唤兽合成的所有逻辑和数据管理
 * 遵循面向对象编程原则，数据和逻辑分离
 */

import { summonConfig } from '@/config/config';
import { generateUniqueId } from '@/utils/idUtils';
import { FIVE_ELEMENTS, SUMMON_NATURE_TYPES, SUMMON_NATURE_CONFIG } from '@/config/enumConfig';
import { personalityConfig, getRandomPersonalityId, PERSONALITY_EFFECT_MODIFIER, PERSONALITY_TYPES, EXTREME_POSITIVE_MODIFIER } from '@/config/summon/personalityConfig';
import EventEmitter from 'events';

/**
 * 合成材料配置
 */
export const FUSION_MATERIALS = {
  BEAST_PILL: {
    id: 'beast_pill',
    name: '兽丹',
    description: '提升合成成功率和技能继承概率',
    successRateBonus: 0.2,
    skillInheritBonus: 0.15,
    rarity: 'rare'
  },
  FIVE_ELEMENT_STONE: {
    id: 'five_element_stone', 
    name: '五行石',
    description: '可指定新生召唤兽的五行属性',
    allowElementChoice: true,
    rarity: 'epic'
  },
  SOUL_CRYSTAL: {
    id: 'soul_crystal',
    name: '魂晶',
    description: '大幅提升合成后召唤兽的等级和属性',
    levelBonus: 5,
    attributeBonus: 0.3,
    rarity: 'legendary'
  }
};

/**
 * 合成规则配置
 */
export const FUSION_RULES = {
  // 基础成功率
  BASE_SUCCESS_RATE: 0.7,
  
  // 技能继承规则
  SKILL_INHERIT: {
    BASE_RATE: 0.32, // 基础继承率32%（30%-35%范围内）
    RATE_VARIANCE: 0.03, // 随机波动±3%，实现30%-35%范围
    SKILL_DECREASE_FACTOR: 0.02 // 技能数量多时的递减因子降低
  },
  
  // 五行相克加成
  ELEMENT_COMPATIBILITY: {
    [FIVE_ELEMENTS.METAL]: {
      [FIVE_ELEMENTS.WOOD]: 0.1,  // 金克木，轻微加成
      [FIVE_ELEMENTS.FIRE]: -0.1, // 火克金，轻微减成
    },
    [FIVE_ELEMENTS.WOOD]: {
      [FIVE_ELEMENTS.EARTH]: 0.1,
      [FIVE_ELEMENTS.METAL]: -0.1,
    },
    [FIVE_ELEMENTS.WATER]: {
      [FIVE_ELEMENTS.FIRE]: 0.1,
      [FIVE_ELEMENTS.EARTH]: -0.1,
    },
    [FIVE_ELEMENTS.FIRE]: {
      [FIVE_ELEMENTS.METAL]: 0.1,
      [FIVE_ELEMENTS.WATER]: -0.1,
    },
    [FIVE_ELEMENTS.EARTH]: {
      [FIVE_ELEMENTS.WATER]: 0.1,
      [FIVE_ELEMENTS.WOOD]: -0.1,
    }
  },
  
  // 等级影响
  LEVEL_IMPACT: {
    MIN_LEVEL_RATIO: 0.3, // 最低等级保留比例
    MAX_LEVEL_RATIO: 0.8, // 最高等级保留比例
    AVERAGE_WEIGHT: 0.6    // 平均值权重
  }
};

/**
 * 合成结果类
 */
class FusionResult {
  constructor(data) {
    this.success = data.success || false;
    this.newSummon = data.newSummon || null;
    this.inheritedSkills = data.inheritedSkills || [];
    this.attributes = data.attributes || {};
    this.messages = data.messages || [];
    this.consumedMaterials = data.consumedMaterials || [];
    this.parentSummonsToDelete = data.parentSummonsToDelete || [];
  }
  
  addMessage(message, type = 'info') {
    this.messages.push({ message, type, timestamp: Date.now() });
  }
  
  getMessages() {
    return this.messages;
  }
}

/**
 * 召唤兽合成管理器
 */
class SummonFusionManager extends EventEmitter {
  constructor() {
    super();
    this.fusionHistory = [];
    this.availableMaterials = {};
  }
  
  /**
   * 初始化合成材料
   */
  initializeMaterials(materials = {}) {
    this.availableMaterials = { ...materials };
    this.emit('materials_updated', this.availableMaterials);
  }
  
  /**
   * 添加合成材料
   */
  addMaterial(materialId, quantity = 1) {
    if (!this.availableMaterials[materialId]) {
      this.availableMaterials[materialId] = 0;
    }
    this.availableMaterials[materialId] += quantity;
    this.emit('materials_updated', this.availableMaterials);
  }
  
  /**
   * 消耗合成材料
   */
  consumeMaterial(materialId, quantity = 1) {
    if (!this.availableMaterials[materialId] || this.availableMaterials[materialId] < quantity) {
      return false;
    }
    this.availableMaterials[materialId] -= quantity;
    this.emit('materials_updated', this.availableMaterials);
    return true;
  }
  
  /**
   * 计算合成预览
   */
  calculateFusionPreview(summon1, summon2, selectedMaterials = []) {
    const preview = {
      successRate: this.calculateSuccessRate(summon1, summon2, selectedMaterials),
      skillInheritRate: this.calculateSkillInheritRate(summon1, summon2, selectedMaterials),
      individualSkillInheritance: this.calculateIndividualSkillInheritance(summon1, summon2, selectedMaterials),
      predictedLevel: this.calculatePredictedLevel(summon1, summon2, selectedMaterials),
      predictedAttributes: this.calculatePredictedAttributes(summon1, summon2, selectedMaterials),
      possibleElements: this.calculatePossibleElements(summon1, summon2, selectedMaterials),
      materialCosts: this.calculateMaterialCosts(selectedMaterials)
    };
    
    return preview;
  }
  
  /**
   * 计算成功率
   */
  calculateSuccessRate(summon1, summon2, materials = []) {
    let baseRate = FUSION_RULES.BASE_SUCCESS_RATE;
    
    // 五行相克影响
    const elementBonus = this.getElementCompatibilityBonus(summon1, summon2);
    baseRate += elementBonus;
    
    // 等级差异影响
    const levelDiff = Math.abs(summon1.level - summon2.level);
    const levelPenalty = Math.min(levelDiff * 0.01, 0.2); // 最多减少20%
    baseRate -= levelPenalty;
    
    // 材料加成
    materials.forEach(materialId => {
      const material = FUSION_MATERIALS[materialId];
      if (material && material.successRateBonus) {
        baseRate += material.successRateBonus;
      }
    });
    
    return Math.max(0.1, Math.min(0.95, baseRate)); // 限制在10%-95%之间
  }
  
  /**
   * 计算技能继承率
   */
  calculateSkillInheritRate(summon1, summon2, materials = []) {
    const allSkills = [...new Set([...(summon1.skillSet || []), ...(summon2.skillSet || [])])];
    
    // 基础继承率在30%-35%范围内随机
    let baseRate = FUSION_RULES.SKILL_INHERIT.BASE_RATE + 
                   (Math.random() - 0.5) * 2 * FUSION_RULES.SKILL_INHERIT.RATE_VARIANCE;
    
    // 技能数量影响（轻微递减）
    if (allSkills.length > 6) {
      baseRate -= (allSkills.length - 6) * FUSION_RULES.SKILL_INHERIT.SKILL_DECREASE_FACTOR;
    }
    
    // 材料加成
    materials.forEach(materialId => {
      const material = FUSION_MATERIALS[materialId];
      if (material && material.skillInheritBonus) {
        baseRate += material.skillInheritBonus;
      }
    });
    
    // 确保在合理范围内
    return Math.max(0.25, Math.min(0.65, baseRate)); // 25%-65%范围
  }
  
  /**
   * 计算每个技能的具体继承概率
   */
  calculateIndividualSkillInheritance(summon1, summon2, materials = []) {
    const skills1 = summon1.skillSet || [];
    const skills2 = summon2.skillSet || [];
    const allSkills = [...new Set([...skills1, ...skills2])];
    
    const baseRate = this.calculateSkillInheritRate(summon1, summon2, materials);
    
    return allSkills.map(skillId => {
      const fromSummon1 = skills1.includes(skillId);
      const fromSummon2 = skills2.includes(skillId);
      
      let skillRate = baseRate;
      
      // 如果两个召唤兽都有这个技能，概率会有轻微提升
      if (fromSummon1 && fromSummon2) {
        skillRate = Math.min(0.85, baseRate * 1.2);
      }
      
      return {
        skillId,
        fromSummon1,
        fromSummon2,
        inheritChance: skillRate
      };
    });
  }
  
  /**
   * 计算预期等级
   */
  calculatePredictedLevel(summon1, summon2, materials = []) {
    const avgLevel = (summon1.level + summon2.level) / 2;
    let predictedLevel = Math.floor(avgLevel * FUSION_RULES.LEVEL_IMPACT.AVERAGE_WEIGHT);
    
    // 材料等级加成
    materials.forEach(materialId => {
      const material = FUSION_MATERIALS[materialId];
      if (material && material.levelBonus) {
        predictedLevel += material.levelBonus;
      }
    });
    
    return Math.max(1, predictedLevel);
  }
  
  /**
   * 计算预期属性
   */
  calculatePredictedAttributes(summon1, summon2, materials = []) {
    const config1 = summonConfig[summon1.summonSourceId];
    const config2 = summonConfig[summon2.summonSourceId];
    
    if (!config1 || !config2) return {};
    
    const predictedAttributes = {};
    const attributeTypes = ['constitution', 'strength', 'agility', 'intelligence', 'luck'];
    
    attributeTypes.forEach(attr => {
      const attr1 = summon1.basicAttributes?.[attr] || 0;
      const attr2 = summon2.basicAttributes?.[attr] || 0;
      const avgValue = (attr1 + attr2) / 2;
      
      // 基础值计算
      predictedAttributes[attr] = Math.floor(avgValue * 0.7);
      
      // 材料属性加成
      materials.forEach(materialId => {
        const material = FUSION_MATERIALS[materialId];
        if (material && material.attributeBonus) {
          predictedAttributes[attr] *= (1 + material.attributeBonus);
        }
      });
      
      predictedAttributes[attr] = Math.floor(predictedAttributes[attr]);
    });
    
    return predictedAttributes;
  }
  
  /**
   * 计算可能的五行属性
   */
  calculatePossibleElements(summon1, summon2, materials = []) {
    const config1 = summonConfig[summon1.summonSourceId];
    const config2 = summonConfig[summon2.summonSourceId];
    
    const possibleElements = [config1?.fiveElement, config2?.fiveElement].filter(Boolean);
    
    // 五行石可以选择任意五行
    const hasFiveElementStone = materials.includes('five_element_stone');
    if (hasFiveElementStone) {
      return Object.values(FIVE_ELEMENTS);
    }
    
    return [...new Set(possibleElements)];
  }
  
  /**
   * 计算材料消耗
   */
  calculateMaterialCosts(materials = []) {
    const costs = {};
    materials.forEach(materialId => {
      costs[materialId] = (costs[materialId] || 0) + 1;
    });
    return costs;
  }
  
  /**
   * 获取五行相克加成
   */
  getElementCompatibilityBonus(summon1, summon2) {
    const config1 = summonConfig[summon1.summonSourceId];
    const config2 = summonConfig[summon2.summonSourceId];
    
    if (!config1 || !config2) return 0;
    
    const element1 = config1.fiveElement;
    const element2 = config2.fiveElement;
    
    const compatibility = FUSION_RULES.ELEMENT_COMPATIBILITY[element1];
    return compatibility?.[element2] || 0;
  }
  
  /**
   * 执行合成
   */
  async performFusion(summon1, summon2, selectedMaterials = [], selectedElement = null) {
    const fusionId = generateUniqueId('fusion');
    const startTime = Date.now();
    
    try {
      // 计算成功率
      const successRate = this.calculateSuccessRate(summon1, summon2, selectedMaterials);
      const isSuccess = Math.random() < successRate;
      
      const result = new FusionResult({ success: isSuccess });
      
      if (!isSuccess) {
        // 生成大海龟作为安慰奖
        const seaTurtleConfig = summonConfig['seaTurtle'];
        const consolationSummon = {
          id: generateUniqueId('summon'),
          summonSourceId: 'seaTurtle',
          name: seaTurtleConfig.name,
          nickname: `神秘海龟·${generateUniqueId('nick')?.slice(-4) || Math.random().toString(36).slice(-4)}`,
          level: Math.max(1, Math.floor((summon1.level + summon2.level) / 4)), // 较低等级
          experience: 0,
          basicAttributes: {
            constitution: Math.floor(Math.random() * 100) + 180,
            strength: Math.floor(Math.random() * 100) + 80,
            agility: Math.floor(Math.random() * 100) + 40,
            intelligence: Math.floor(Math.random() * 100) + 120,
            luck: Math.floor(Math.random() * 100) + 90
          },
          fiveElement: seaTurtleConfig.fiveElement,
          skillSet: ['turtle_shell'], // 只给基础技能
          equippedItemIds: {},
          parentInfo: {
            parent1Id: summon1.id,
            parent1Name: summon1.nickname || summon1.name,
            parent2Id: summon2.id,
            parent2Name: summon2.nickname || summon2.name,
            fusionTime: Date.now(),
            fusionMaterials: selectedMaterials,
            isConsolationPrize: true
          }
        };

        result.success = true; // 修改为成功
        result.newSummon = consolationSummon;
        result.inheritedSkills = consolationSummon.skillSet;
        result.attributes = consolationSummon.basicAttributes;
        result.addMessage('合成失败！但是神秘的大海龟从虚空中出现了！', 'success');
        result.addMessage('虽然合成没有按预期进行，但你获得了一个特殊的伙伴', 'info');
        
        // 删除原来的召唤兽（失败时也删除）
        result.parentSummonsToDelete = [summon1.id, summon2.id];
        
        this.addToHistory(fusionId, summon1, summon2, result, selectedMaterials);
        this.emit('fusion_completed', { fusionId, result, duration: Date.now() - startTime });
        return result;
      }
      
      // 消耗材料
      const materialCosts = this.calculateMaterialCosts(selectedMaterials);
      for (const [materialId, quantity] of Object.entries(materialCosts)) {
        if (!this.consumeMaterial(materialId, quantity)) {
          throw new Error(`材料不足: ${FUSION_MATERIALS[materialId]?.name || materialId}`);
        }
      }
      result.consumedMaterials = materialCosts;
      
      // 生成新召唤兽
      const newSummon = this.generateNewSummon(summon1, summon2, selectedMaterials, selectedElement);
      result.newSummon = newSummon;
      result.inheritedSkills = newSummon.skillSet || [];
      result.attributes = newSummon.basicAttributes;
      
      // 删除原来的召唤兽（合成成功后）
      result.parentSummonsToDelete = [summon1.id, summon2.id];
      
      result.addMessage(`合成成功！获得了${newSummon.name}`, 'success');
      
      // 记录历史
      this.addToHistory(fusionId, summon1, summon2, result, selectedMaterials);
      
      this.emit('fusion_completed', { fusionId, result, duration: Date.now() - startTime });
      
      return result;
      
    } catch (error) {
      const result = new FusionResult({ success: false });
      result.addMessage(`合成过程中发生错误: ${error.message}`, 'error');
      return result;
    }
  }
  
  /**
   * 生成新召唤兽
   */
  generateNewSummon(summon1, summon2, materials = [], selectedElement = null) {
    // 随机选择基础召唤兽
    const baseSummon = Math.random() < 0.5 ? summon1 : summon2;
    const baseSummonConfig = summonConfig[baseSummon.summonSourceId];
    
    // 确保配置存在
    if (!baseSummonConfig) {
      throw new Error(`无法找到召唤兽配置: ${baseSummon.summonSourceId}`);
    }
    
    // 确定五行属性
    let finalElement = selectedElement;
    if (!finalElement) {
      const possibleElements = this.calculatePossibleElements(summon1, summon2, materials);
      finalElement = possibleElements[Math.floor(Math.random() * possibleElements.length)];
    }
    
    // 计算新召唤兽的属性
    const newAttributes = this.calculatePredictedAttributes(summon1, summon2, materials);
    
    // 计算继承的技能
    const inheritedSkills = this.calculateInheritedSkills(summon1, summon2, materials);
    
    // 计算等级
    const newLevel = this.calculatePredictedLevel(summon1, summon2, materials);

    // ---- START: Determine natureType and initialPotentialPoints ----
    const natureTypeKeys = Object.keys(SUMMON_NATURE_TYPES);
    const randomNatureTypeKey = natureTypeKeys[Math.floor(Math.random() * natureTypeKeys.length)];
    const natureTypeToSet = SUMMON_NATURE_TYPES[randomNatureTypeKey];
    const natureConfigForSelectedType = SUMMON_NATURE_CONFIG[natureTypeToSet] || SUMMON_NATURE_CONFIG[SUMMON_NATURE_TYPES.WILD];
    
    let initialPotentialPoints = 0;
    // 宝宝和变异通常0级开始，有额外潜力点
    // 野生则根据 initialLevelRange, 但这里 newLevel 是计算好的，我们简单判断 newLevel 是否为0
    if (newLevel === 0 && natureConfigForSelectedType.potentialPointsBonus) {
      initialPotentialPoints = natureConfigForSelectedType.potentialPointsBonus;
    }
    // ---- END: Determine natureType and initialPotentialPoints ----
    
    // ---- START: Get Personality ID for Fused Summon ----
    const personalityId = getRandomPersonalityId();
    const selectedPersonality = personalityConfig[personalityId];

    // newAttributes is already calculated. We will modify it directly.
    if (selectedPersonality && selectedPersonality.id !== PERSONALITY_TYPES.NEUTRAL) {
      if (selectedPersonality.isExtreme) {
        const { extremeStat, decreasedStat1, decreasedStat2 } = selectedPersonality;
        if (extremeStat && newAttributes.hasOwnProperty(extremeStat)) {
          newAttributes[extremeStat] = Math.floor(newAttributes[extremeStat] * (1 + EXTREME_POSITIVE_MODIFIER));
        }
        if (decreasedStat1 && newAttributes.hasOwnProperty(decreasedStat1)) {
          newAttributes[decreasedStat1] = Math.floor(newAttributes[decreasedStat1] * (1 - PERSONALITY_EFFECT_MODIFIER)); // Using normal negative for decreased
        }
        if (decreasedStat2 && newAttributes.hasOwnProperty(decreasedStat2)) {
          newAttributes[decreasedStat2] = Math.floor(newAttributes[decreasedStat2] * (1 - PERSONALITY_EFFECT_MODIFIER)); // Using normal negative for decreased
        }
      } else {
        const { increasedStat, decreasedStat } = selectedPersonality;
        if (increasedStat && newAttributes.hasOwnProperty(increasedStat)) {
          newAttributes[increasedStat] = Math.floor(newAttributes[increasedStat] * (1 + PERSONALITY_EFFECT_MODIFIER));
        }
        if (decreasedStat && newAttributes.hasOwnProperty(decreasedStat)) {
          newAttributes[decreasedStat] = Math.floor(newAttributes[decreasedStat] * (1 - PERSONALITY_EFFECT_MODIFIER));
        }
      }
    }
    // ---- END: Get Personality ID for Fused Summon (attributes not modified here) ----
    
    // 生成默认昵称
    const generateDefaultNickname = () => {
      const baseSummonConfig = summonConfig[baseSummon.summonSourceId];
      const prefix = baseSummonConfig?.name || '召唤兽';
      const randomSuffix = Math.floor(Math.random() * 900) + 100; // 100-999
      return `${prefix}${randomSuffix}`; // New: name prefix + suffix
    };
    
    // 生成新召唤兽
    const newSummon = {
      id: generateUniqueId('summon'),
      summonSourceId: baseSummon.summonSourceId,
      name: baseSummonConfig.name,
      nickname: generateDefaultNickname(),
      level: newLevel,
      experience: 0,
      basicAttributes: newAttributes,
      fiveElement: finalElement,
      skillSet: inheritedSkills,
      equippedItemIds: {},
      parentInfo: {
        parent1Id: summon1.id,
        parent1Name: summon1.nickname || summon1.name,
        parent2Id: summon2.id,
        parent2Name: summon2.nickname || summon2.name,
        fusionTime: Date.now(),
        fusionMaterials: materials
      },
      quality: summonConfig[baseSummon.summonSourceId]?.quality || 'normal', // 使用配置中的固定品质
      natureType: natureTypeToSet,
      personalityId: personalityId,
      growthRates: { ...baseSummonConfig.growthRates },
      potentialPoints: initialPotentialPoints
    };
    
    return newSummon;
  }
  
  /**
   * 计算继承的技能
   */
  calculateInheritedSkills(summon1, summon2, materials = []) {
    const skills1 = summon1.skillSet || [];
    const skills2 = summon2.skillSet || [];
    const allSkills = [...new Set([...skills1, ...skills2])];
    
    // 技能上限：双方技能数之和减1
    const maxSkills = Math.max(1, skills1.length + skills2.length - 1);
    
    const inheritedSkills = [];
    
    // 1. 首先确保获得新召唤兽种类的必带技能
    const baseSummon = Math.random() < 0.5 ? summon1 : summon2;
    const baseSummonConfig = summonConfig[baseSummon.summonSourceId];
    
    if (baseSummonConfig && baseSummonConfig.guaranteedInitialSkills) {
      // 添加必带技能
      baseSummonConfig.guaranteedInitialSkills.forEach(skill => {
        if (!inheritedSkills.includes(skill)) {
          inheritedSkills.push(skill);
        }
      });
    }
    
    // 2. 然后按照概率继承其他技能
    const remainingSkills = allSkills.filter(skill => !inheritedSkills.includes(skill));
    
    // 为每个技能计算具体的继承概率
    remainingSkills.forEach(skillId => {
      const fromSummon1 = skills1.includes(skillId);
      const fromSummon2 = skills2.includes(skillId);
      
      // 基础继承率
      let inheritChance = FUSION_RULES.SKILL_INHERIT.BASE_RATE + 
                         (Math.random() - 0.5) * 2 * FUSION_RULES.SKILL_INHERIT.RATE_VARIANCE;
      
      // 如果两个召唤兽都有这个技能，概率提升
      if (fromSummon1 && fromSummon2) {
        inheritChance *= 1.3; // 30%提升
      }
      
      // 材料加成
      materials.forEach(materialId => {
        const material = FUSION_MATERIALS[materialId];
        if (material && material.skillInheritBonus) {
          inheritChance += material.skillInheritBonus;
        }
      });
      
      // 确保概率在合理范围内
      inheritChance = Math.max(0.25, Math.min(0.7, inheritChance));
      
      // 根据概率决定是否继承，且不超过上限
      if (Math.random() < inheritChance && inheritedSkills.length < maxSkills) {
        inheritedSkills.push(skillId);
      }
    });
    
    return inheritedSkills;
  }
  
  /**
   * 添加到历史记录
   */
  addToHistory(fusionId, summon1, summon2, result, materials) {
    const historyEntry = {
      id: fusionId,
      timestamp: Date.now(),
      parent1: {
        id: summon1.id,
        name: summon1.nickname || summon1.name,
        level: summon1.level
      },
      parent2: {
        id: summon2.id,
        name: summon2.nickname || summon2.name,
        level: summon2.level
      },
      materials: materials,
      result: {
        success: result.success,
        newSummonId: result.newSummon?.id,
        newSummonName: result.newSummon?.name,
        messages: result.messages
      }
    };
    
    this.fusionHistory.unshift(historyEntry);
    
    // 限制历史记录数量
    if (this.fusionHistory.length > 100) {
      this.fusionHistory = this.fusionHistory.slice(0, 100);
    }
    
    this.emit('history_updated', this.fusionHistory);
  }
  
  /**
   * 获取合成历史
   */
  getFusionHistory() {
    return this.fusionHistory;
  }
  
  /**
   * 获取可用材料
   */
  getAvailableMaterials() {
    return this.availableMaterials;
  }
  
  /**
   * 清除历史记录
   */
  clearHistory() {
    this.fusionHistory = [];
    this.emit('history_updated', this.fusionHistory);
  }
}

// 创建单例
const summonFusionManager = new SummonFusionManager();

export default summonFusionManager;
export { SummonFusionManager, FusionResult }; 