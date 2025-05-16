import {
  equipmentConfig,
  getEquipmentWithQualityEffects,
} from "../config/equipmentConfig";
import { qualityConfig } from "../config/config";

// 装备也可能有等级、强化等概念，暂时先简单实现
class EquipmentEntity {
  constructor(configName, quality, level = 1) {
    // 在所有类别中查找装备配置
    let foundConfig = null;
    let itemSlotType = null; // Variable to store the category/slotType
    for (const categoryKey in equipmentConfig) { // categoryKey is e.g., "饰品", "遗物"
      foundConfig = equipmentConfig[categoryKey].find(
        (eq) => eq.name === configName
      );
      if (foundConfig) {
        itemSlotType = categoryKey; // Store the category key as slotType
        break;
      }
    }
    if (!foundConfig) {
      throw new Error(
        `Equipment configuration for "${configName}" not found.`
      );
    }
    this.baseConfig = foundConfig;
    this.slotType = itemSlotType; // Set this.slotType

    this.id = `${this.baseConfig.name}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)}`; // 唯一ID
    this.name = this.baseConfig.name;
    this.level = level; // 装备等级，默认为1
    this.quality = quality; // 装备品质

    // 定义哪些效果是百分比，不应被 floor
    const percentageEffectKeys = [
      "critRate",
      "critDamage",
      "dodgeRate",
      "fireResistance",
    ]; // 根据你的配置添加更多

    // 初始化效果，此时先不考虑等级，只考虑品质
    const rawEffects = this.baseConfig.effects;
    const qualityIndex = qualityConfig.names.indexOf(quality);
    const qualityMultiplier =
      qualityConfig.attributeMultipliers[qualityIndex] || 1;

    this.initialEffectsWithQuality = {}; // 存储仅应用品质乘数后的效果，用于等级重算
    if (rawEffects) {
      for (const effectKey in rawEffects) {
        if (rawEffects.hasOwnProperty(effectKey)) {
          let value = rawEffects[effectKey] * qualityMultiplier;
          if (percentageEffectKeys.includes(effectKey)) {
            // 对于百分比属性，保留小数
            this.initialEffectsWithQuality[effectKey] = parseFloat(
              value.toFixed(5)
            ); // 保留一定精度
          } else {
            // 对于固定数值属性，向下取整
            this.initialEffectsWithQuality[effectKey] = Math.floor(value);
          }
        }
      }
    }

    this.finalEffects = {}; // finalEffects 将在 recalculateEffects 中计算
    this.recalculateEffects(); // 初始化时即计算最终效果（包含等级）

    // 如果有 getEquipmentWithQualityEffects 这样的函数，并且它适用于单个装备对象，可以考虑使用
    // const equipWithQuality = getEquipmentWithQualityEffects({ name: this.name, effects: this.baseConfig.effects, quality: this.quality });
    // this.finalEffects = equipWithQuality.effects;

    // 其他可能的属性：
    // this.enhancementLevel = 0; // 强化等级
    // this.gemSlots = []; //宝石插槽
    // this.ownerId = null; // 拥有者ID (玩家或召唤兽)
  }

  recalculateEffects() {
    const rawEffectsFromBase = this.baseConfig.effects; // 应基于最原始的配置效果
    const qualityIndex = qualityConfig.names.indexOf(this.quality);
    const qualityMultiplier =
      qualityConfig.attributeMultipliers[qualityIndex] || 1;

    // 定义哪些效果是百分比，不应被 floor - 与构造函数中保持一致
    const percentageEffectKeys = [
      "critRate",
      "critDamage",
      "dodgeRate",
      "fireResistance",
    ];

    this.finalEffects = {};
    if (rawEffectsFromBase) {
      for (const effectKey in rawEffectsFromBase) {
        if (rawEffectsFromBase.hasOwnProperty(effectKey)) {
          let baseValue = rawEffectsFromBase[effectKey];
          let valueWithQuality = baseValue * qualityMultiplier;

          // 应用等级效果：示例中等级影响是原始值的百分比增加
          // (效果基础值 * 品质乘子) * (1 + (等级-1)*等级影响因子)
          // 注意：等级对百分比属性的影响方式可能不同，这里简化为统一处理
          let finalValue = valueWithQuality * (1 + (this.level - 1) * 0.05); // 0.05 是每级5%的增长示例

          if (percentageEffectKeys.includes(effectKey)) {
            this.finalEffects[effectKey] = parseFloat(finalValue.toFixed(5)); // 保留精度，例如0.05表示5%
          } else {
            this.finalEffects[effectKey] = Math.floor(finalValue);
          }
        }
      }
    }
    // console.log(
    //   `${this.name} effects recalculated for level ${this.level} and quality ${this.quality}:`,
    //   JSON.stringify(this.finalEffects)
    // );
  }

  // 方法示例：获取装备的最终效果
  getEffects() {
    return this.finalEffects;
  }

  // 方法示例：升级装备 (如果装备有等级概念)
  levelUp(levels = 1) {
    this.level += levels;
    // 可能需要重新计算属性或应用其他升级逻辑
    console.log(`${this.name} leveled up to ${this.level}.`);
    this.recalculateEffects(); // 假设有这个方法
  }

  // TODO: 可能需要更多方法，例如强化、镶嵌宝石等
}

export default EquipmentEntity;
