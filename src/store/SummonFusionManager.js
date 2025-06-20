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
import { FUSION_RULES, FUSION_MATERIALS } from '../config/gachaConfig';
import { createCreatureFromTemplate } from '@/utils/summonUtils';

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
    // 根据新的遗传模型，融合出的宝宝/变异召唤兽等级总是从0开始。
    // 野生召唤兽目前不会通过融合产生。
    return 0;
  }
  
  /**
   * 计算融合后的预测属性，现在仅用于预览
   */
  calculatePredictedAttributes(summon1, summon2, materials = []) {
    //
    // 重要提示：此函数现在主要用于UI预览，
    // 实际生成召唤兽的属性计算在 generateNewSummon 中完成，
    // 并且基于的是 `innateAttributes` (先天属性) 的遗传。
    //
    // 为了给用户一个大致的预期，我们可以模拟一个简化的计算，
    // 但最终结果以 `generateNewSummon` 为准。

    const tempOffspringNatureType = this._determineOffspringNatureType(summon1.natureType, summon2.natureType, materials);
    const natureConfig = SUMMON_NATURE_CONFIG[tempOffspringNatureType];

    const predictedInnate = this._calculateInheritedInnateAttributes(summon1, summon2, materials);
    const finalPredictedInnate = {};
    for(const attr in predictedInnate) {
        finalPredictedInnate[attr] = Math.floor(predictedInnate[attr] * natureConfig.baseAttributeMultiplier);
    }
    
    // 这是一个非常粗略的估计，只基于0级和先天属性
    return finalPredictedInnate;
  }
  
  /**
   * 计算可能的五行属性
   */
  calculatePossibleElements(summon1, summon2, materials = []) {
    const possibleElements = [summon1?.fiveElement, summon2?.fiveElement].filter(Boolean);
    
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
    if (!summon1?.fiveElement || !summon2?.fiveElement) {
      return 0;
    }
    
    const element1 = summon1.fiveElement;
    const element2 = summon2.fiveElement;
    
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
    // 生成默认昵称
    const generateDefaultNickname = (baseSummonConfig) => {
        const prefix = baseSummonConfig?.name || '召唤兽';
        const randomSuffix = Math.floor(Math.random() * 900) + 100;
        return `${prefix}${randomSuffix}`;
    };

    // 1. 确定后代的 natureType
    const offspringNatureType = this._determineOffspringNatureType(summon1.natureType, summon2.natureType, materials);

    // 2. 随机选择一个父本作为物种模板
    const baseSummon = Math.random() < 0.5 ? summon1 : summon2;
    const baseSummonConfig = summonConfig[baseSummon.summonSourceId];
    if (!baseSummonConfig) {
        throw new Error(`无法找到召唤兽配置: ${baseSummon.summonSourceId}`);
    }

    // 3. 计算遗传的裸体属性和成长率 (不再应用natureType加成)
    const finalInnateAttributes = this._calculateInheritedInnateAttributes(summon1, summon2, materials);
    const finalGrowthRates = this._calculateInheritedGrowthRates(summon1, summon2, materials);

    // 4. (已移除) natureType 加成现在由核心工具函数 `calculateFinalBasicAttributes` 统一处理

    // 5. 计算其他属性 (技能、等级、性格)
    const inheritedSkills = this.calculateInheritedSkills(summon1, summon2, materials);
    const newLevel = this.calculatePredictedLevel(summon1, summon2, materials);
    const personalityId = getRandomPersonalityId();
    
    // 确定五行属性
    let finalElement = selectedElement;
    if (!finalElement) {
      const possibleElements = this.calculatePossibleElements(summon1, summon2, materials);
      finalElement = possibleElements[Math.floor(Math.random() * possibleElements.length)];
    }

    // 6. 使用工厂函数创建基础实例
    const newSummonInstance = createCreatureFromTemplate({
        templateId: baseSummon.summonSourceId,
        level: newLevel,
        natureType: offspringNatureType,
    });
    
    if (!newSummonInstance) {
        throw new Error("Failed to create summon instance from template.");
    }

    // 7. 使用遗传计算结果覆盖模板默认值
    newSummonInstance.id = generateUniqueId('summon'); // 确保ID是新生成的
    newSummonInstance.nickname = generateDefaultNickname(baseSummonConfig);
    newSummonInstance.innateAttributes = finalInnateAttributes; // 使用纯粹的遗传属性
    newSummonInstance.basicAttributes = { ...finalInnateAttributes }; // 初始基础属性等于先天属性
    newSummonInstance.growthRates = finalGrowthRates; // 使用纯粹的遗传成长率
    newSummonInstance.skillSet = inheritedSkills;
    newSummonInstance.personalityId = personalityId;
    newSummonInstance.fiveElement = finalElement; // 设置五行
    newSummonInstance.parentInfo = {
        parent1Id: summon1.id,
        parent1Name: summon1.nickname || summon1.name,
        parent2Id: summon2.id,
        parent2Name: summon2.nickname || summon2.name,
        fusionTime: Date.now(),
        fusionMaterials: materials.map(m => m.id),
    };

    // 7. 更新潜力点 (宝宝和变异有额外加成)
    newSummonInstance.potentialPoints = (newSummonInstance.potentialPoints || 0) + (SUMMON_NATURE_CONFIG[offspringNatureType]?.potentialPointsBonus || 0);

    return newSummonInstance;
  }
  
  /**
   * 根据父母双方的 natureType 和所用材料，决定后代的 natureType
   * @private
   */
  _determineOffspringNatureType(natureType1, natureType2, materials = []) {
    const { WILD, BABY, MUTANT } = SUMMON_NATURE_TYPES;
    let babyChance = 0;
    let mutantChance = 0;

    const natureTypes = [natureType1, natureType2];

    if (natureTypes.every(t => t === WILD)) {
        // 父母都是野生 -> 100% 野生
        return WILD;
    }

    if (natureTypes.includes(MUTANT)) {
        // 有一方是变异
        babyChance = 0.7; // 70% 几率是宝宝
        mutantChance = 0.25; // 25% 几率是变异
    } else if (natureTypes.every(t => t === BABY)) {
        // 双方都是宝宝
        babyChance = 0.95; // 95% 几率是宝宝
        mutantChance = 0.05; // 5% 几率突变成变异
    } else if (natureTypes.includes(BABY)) {
        // 一方是宝宝，一方是野生
        babyChance = 0.6; // 60% 几率是宝宝
    }

    // TODO: 材料对概率的影响
    // materials.forEach(material => { ... });

    const rand = Math.random();
    if (rand < mutantChance) {
        return MUTANT;
    }
    if (rand < mutantChance + babyChance) {
        return BABY;
    }
    return WILD;
  }

  /**
   * 计算遗传的、未受 natureType 加成的先天属性
   * @private
   */
  _calculateInheritedInnateAttributes(summon1, summon2, materials = []) {
    const inherited = {};
    const attrs = Object.keys(summon1.innateAttributes);

    for (const attr of attrs) {
        const val1 = summon1.innateAttributes[attr] || 0;
        const val2 = summon2.innateAttributes[attr] || 0;
        const avg = (val1 + val2) / 2;
        // 引入 +/- 5% 的随机遗传浮动
        const fluctuation = 1 + (Math.random() - 0.5) * 0.1; 
        inherited[attr] = Math.floor(avg * fluctuation);
    }
    return inherited;
  }

  /**
   * 计算遗传的、未受 natureType 加成的成长率
   * @private
   */
  _calculateInheritedGrowthRates(summon1, summon2, materials = []) {
      const inherited = {};
      const rates = Object.keys(summon1.growthRates);

      for (const rate of rates) {
          const val1 = summon1.growthRates[rate] || 0;
          const val2 = summon2.growthRates[rate] || 0;
          const avg = (val1 + val2) / 2;
          // 引入 +/- 5% 的随机遗传浮动
          const fluctuation = 1 + (Math.random() - 0.5) * 0.1;
          // 成长率保留多位小数
          inherited[rate] = avg * fluctuation;
      }
      return inherited;
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