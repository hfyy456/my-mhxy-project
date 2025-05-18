/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-19 05:26:54
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-19 05:32:21
 */
import { petConfig } from '@/config/petConfig';
import { qualityConfig } from '@/config/config';

/**
 * 生成新的召唤兽数据
 * @param {Object} params - 生成召唤兽所需的参数
 * @param {string} params.petId - 召唤兽的ID
 * @param {string} params.quality - 召唤兽的品质
 * @param {'incubation' | 'refinement' | 'capture' | 'gift'} params.source - 召唤兽的来源
 * @returns {Object} 新的召唤兽数据
 */
export const generateNewSummon = ({ petId, quality, source }) => {
  const petData = petConfig[petId];
  if (!petData) {
    throw new Error(`找不到召唤兽配置：${petId}`);
  }

  // 生成唯一ID
  const summonId = `${petId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // 基础数据结构
  const newSummon = {
    id: summonId,
    petId: petId,
    nickname: petData.name,
    level: 1,
    quality: quality,
    experience: 0,
    potentialPoints: 0,
    allocatedPoints: {
      constitution: 0,
      strength: 0,
      agility: 0,
      intelligence: 0,
      luck: 0
    },
    basicAttributes: petData.basicAttributeRanges ? {
      constitution: getRandomAttribute(...petData.basicAttributeRanges.constitution),
      strength: getRandomAttribute(...petData.basicAttributeRanges.strength),
      agility: getRandomAttribute(...petData.basicAttributeRanges.agility),
      intelligence: getRandomAttribute(...petData.basicAttributeRanges.intelligence),
      luck: getRandomAttribute(...petData.basicAttributeRanges.luck)
    } : {},
    skillSet: petData.initialSkills || [],
    equippedItemIds: {},
    race: petData.race,
    source: source, // 记录召唤兽的来源
    obtainedAt: new Date().toISOString(), // 获得时间
  };

  // 根据品质调整属性
  if (quality) {
    const qualityIndex = qualityConfig.names.indexOf(quality);
    const qualityMultiplier = qualityConfig.attributeMultipliers[qualityIndex] || 1;
    Object.keys(newSummon.basicAttributes).forEach(attr => {
      newSummon.basicAttributes[attr] = Math.floor(newSummon.basicAttributes[attr] * qualityMultiplier);
    });
  }

  return newSummon;
};

/**
 * 获取随机属性值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机属性值
 */
const getRandomAttribute = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

