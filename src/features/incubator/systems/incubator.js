/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-19 03:43:20
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-19 03:45:26
 */
import { eggConfig, eggQualityConfig } from '@/config/summon/eggConfig';
import { summonConfig } from '@/config/summon/summonConfig';

export class Incubator {
  constructor() {
    this.incubatingEggs = new Map(); // 正在孵化的蛋 Map<eggId, {eggType, startTime, remainingTime, quality}>
  }

  // 随机生成蛋的品质
  generateEggQuality() {
    const totalWeight = eggQualityConfig.weight.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < eggQualityConfig.names.length; i++) {
      random -= eggQualityConfig.weight[i];
      if (random <= 0) {
        return eggQualityConfig.names[i];
      }
    }
    return eggQualityConfig.names[0]; // 默认返回普通品质
  }

  // 根据蛋的品质生成召唤兽的品质
  generatePetQuality(eggQuality) {
    const qualityIndex = eggQualityConfig.names.indexOf(eggQuality);
    const qualities = eggQualityConfig.names;
    const chances = eggQualityConfig.summonQualityChances[qualityIndex];
    
    const random = Math.random();
    let sum = 0;
    
    // 根据概率表决定最终品质
    for (let i = 0; i < qualities.length; i++) {
      sum += chances[i];
      if (random < sum) {
        return qualities[i];
      }
    }
    
    return qualities[0]; // 默认返回普通品质
  }

  // 开始孵化蛋
  startIncubation(eggId, eggType) {
    if (!eggConfig[eggType]) {
      throw new Error(`未知的蛋类型: ${eggType}`);
    }

    const quality = this.generateEggQuality();
    const baseHatchTime = eggConfig[eggType].baseHatchTime;
    const qualityIndex = eggQualityConfig.names.indexOf(quality);
    const timeMultiplier = eggQualityConfig.timeMultiplier[qualityIndex];
    const totalHatchTime = Math.floor(baseHatchTime * timeMultiplier);

    this.incubatingEggs.set(eggId, {
      eggType,
      startTime: Date.now(),
      remainingTime: totalHatchTime,
      quality,
    });

    return {
      eggId,
      eggType,
      quality,
      hatchTime: totalHatchTime,
      startTime: Date.now(),
    };
  }

  // 检查孵化进度
  checkProgress(eggId) {
    const egg = this.incubatingEggs.get(eggId);
    if (!egg) {
      throw new Error(`找不到正在孵化的蛋: ${eggId}`);
    }

    const elapsed = (Date.now() - egg.startTime) / 1000; // 转换为秒
    const remainingTime = Math.max(0, egg.remainingTime - elapsed);
    const progress = ((egg.remainingTime - remainingTime) / egg.remainingTime) * 100;

    return {
      eggId,
      eggType: egg.eggType,
      quality: egg.quality,
      progress: Math.min(100, progress),
      remainingTime: Math.max(0, remainingTime),
      isComplete: remainingTime <= 0,
    };
  }

  // 完成孵化
  completeIncubation(eggId) {
    const egg = this.incubatingEggs.get(eggId);
    if (!egg) {
      throw new Error(`找不到正在孵化的蛋: ${eggId}`);
    }

    const eggData = eggConfig[egg.eggType];
    const possiblePets = eggData.possiblePets;
    
    // 随机选择一个可能的宠物
    const randomPet = possiblePets[Math.floor(Math.random() * possiblePets.length)];
    
    // 根据蛋的品质决定召唤兽的品质
    const summonQuality = this.generatePetQuality(egg.quality);
    
    // 从培养皿中移除这个蛋
    this.incubatingEggs.delete(eggId);

    // 返回孵化结果
    return {
      eggId,
      eggType: egg.eggType,
      eggQuality: egg.quality,
      summonType: randomPet,
      summonQuality: summonQuality,
      summonData: summonConfig[randomPet],
    };
  }

  // 加速孵化
  accelerateIncubation(eggId, seconds) {
    const egg = this.incubatingEggs.get(eggId);
    if (!egg) {
      throw new Error(`找不到正在孵化的蛋: ${eggId}`);
    }

    egg.remainingTime = Math.max(0, egg.remainingTime - seconds);
    return this.checkProgress(eggId);
  }

  // 获取所有正在孵化的蛋
  getAllIncubatingEggs() {
    const eggs = [];
    for (const [eggId, egg] of this.incubatingEggs) {
      const progress = this.checkProgress(eggId);
      eggs.push({
        eggId,
        ...progress,
        eggData: eggConfig[egg.eggType],
      });
    }
    return eggs;
  }

  // 取消孵化
  cancelIncubation(eggId) {
    if (!this.incubatingEggs.has(eggId)) {
      throw new Error(`找不到正在孵化的蛋: ${eggId}`);
    }
    
    const egg = this.incubatingEggs.get(eggId);
    this.incubatingEggs.delete(eggId);
    
    return {
      eggId,
      eggType: egg.eggType,
      quality: egg.quality,
      status: 'cancelled',
    };
  }
} 