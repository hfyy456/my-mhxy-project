/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 21:21:02
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-17 06:00:14
 */
import { petConfig, qualityConfig, derivedAttributeConfig, STANDARD_EQUIPMENT_SLOTS, levelExperienceRequirements } from "../config/config";
import { getRandomAttribute, getRandomQuality } from "../gameLogic"; // 需要 gameLogic 中的一些辅助函数
// import { equipmentConfig } from "../config/equipmentConfig"; //不再直接在此文件中使用 equipmentConfig 进行查找
import EquipmentEntity from "./EquipmentEntity";
import EquipmentManager from "../managers/EquipmentManager"; // 仍然需要它来处理可能的实体获取

class Summon {
    constructor(name, quality, level = 1, initialEquipmentEntities = null, initialSkills = []) {
        if (!petConfig[name]) {
            throw new Error(`Pet configuration for "${name}" not found.`);
        }
        const basePetConfig = petConfig[name];

        this.id = `${name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        this.name = name;
        this.level = level;
        this.quality = quality;
        
        this.experience = 0;
        this.experienceToNextLevel = this.getExperienceForLevel(this.level);
        this.baseConfig = basePetConfig;
        this.potentialPoints = 0;
        this.allocatedPoints = {
            constitution: 0, strength: 0, agility: 0, intelligence: 0, luck: 0,
        };

        const qualityIndex = qualityConfig.names.indexOf(quality);
        const qualityMultiplier = qualityConfig.attributeMultipliers[qualityIndex] || 1;
        
        this.basicAttributes = {
            constitution: Math.floor(getRandomAttribute(...basePetConfig.basicAttributeRanges.constitution) * qualityMultiplier),
            strength: Math.floor(getRandomAttribute(...basePetConfig.basicAttributeRanges.strength) * qualityMultiplier),
            agility: Math.floor(getRandomAttribute(...basePetConfig.basicAttributeRanges.agility) * qualityMultiplier),
            intelligence: Math.floor(getRandomAttribute(...basePetConfig.basicAttributeRanges.intelligence) * qualityMultiplier),
            luck: Math.floor(getRandomAttribute(...basePetConfig.basicAttributeRanges.luck) * qualityMultiplier),
        };

        // 初始化装备槽位，所有槽位默认为 null
        this.equippedItems = {};
        STANDARD_EQUIPMENT_SLOTS.forEach(slot => {
            this.equippedItems[slot] = null;
        });

        // 如果有初始装备，尝试直接装备它们
        // initialEquipmentEntities 预期是一个 EquipmentEntity 实例的数组
        if (initialEquipmentEntities && Array.isArray(initialEquipmentEntities)) {
            initialEquipmentEntities.forEach(entity => {
                if (entity instanceof EquipmentEntity && entity.slotType && this.equippedItems.hasOwnProperty(entity.slotType)) {
                    // 确保实体在Manager中注册，如果还没有的话 (虽然通常在创建时就注册了)
                    if (!EquipmentManager.hasEquipment(entity.id)) {
                        EquipmentManager.registerEquipment(entity);
                    }
                    
                    if (!this.equippedItems[entity.slotType]) { // 如果槽位为空
                        this.equippedItems[entity.slotType] = entity;
                        console.log(`[Summon Constructor] Initial equipment: ${entity.name} equipped to ${entity.slotType}`);
                    } else {
                        // 如果槽位已被占据，可以选择替换或忽略，这里简单忽略并警告
                        console.warn(`[Summon Constructor] Slot ${entity.slotType} already occupied by ${this.equippedItems[entity.slotType].name}. Cannot auto-equip initial ${entity.name}.`);
                        // 可选：如果需要将未装备的初始物品放入某种形式的"待处理"列表或返回给调用者，可以在此处理
                    }
                } else {
                     console.warn(`[Summon Constructor] Invalid initial equipment data or slotType for an entity:`, entity);
                }
            });
        }

        this.skillSet = [...initialSkills];
        this.derivedAttributes = {};
        this.equipmentContributions = {}; // 将在 recalculateStats 中计算
        this.recalculateStats(); // 确保初始装备的效果被计算
    }

    recalculateStats() {
        let currentBasicAttributes = { ...this.basicAttributes };
        for (const attr in this.allocatedPoints) {
            if (currentBasicAttributes.hasOwnProperty(attr)) {
                currentBasicAttributes[attr] += this.allocatedPoints[attr];
            }
        }

        const basicAttributesWithEquipment = { ...currentBasicAttributes };
        const equipmentBonusesToBasic = {}; // 用于存储装备对基础属性的直接加成值

        // 遍历当前装备的物品以累加其效果
        for (const slotType in this.equippedItems) {
            const equippedEntity = this.equippedItems[slotType];
            if (equippedEntity && equippedEntity instanceof EquipmentEntity) {
                const effects = equippedEntity.getEffects(); // EquipmentEntity应该有一个 getEffects 方法
                if (effects) {
                    for (const attr in effects) {
                        // 应用于基础属性的加成
                        if (basicAttributesWithEquipment.hasOwnProperty(attr)) {
                            basicAttributesWithEquipment[attr] += effects[attr];
                            equipmentBonusesToBasic[attr] = (equipmentBonusesToBasic[attr] || 0) + effects[attr];
                        }
                        // 对于非基础属性（如直接加成派生属性的情况），单独记录
                        // 注意：当前派生属性计算是基于处理后的基础属性，所以这里主要关注对基础属性的影响
                    }
                }
            }
        }

        this.currentBasicAttributesWithEq = basicAttributesWithEquipment; // 保存应用了装备加成后的基础属性
        this.equipmentBonusesToBasic = equipmentBonusesToBasic; // 保存装备对基础属性的总加成

        // --- 计算派生属性 ---
        const derived = {};
        const equipmentContributionsToDerived = {}; // 用于存储装备对派生属性的直接加成值

        for (const [attribute, config] of Object.entries(derivedAttributeConfig)) {
            let value = 0;
            // 从应用了装备加成的基础属性计算派生属性的基础值
            for (const attr of config.attributes) {
                value += Number(basicAttributesWithEquipment[attr] * config.multiplier);
            }

            // 检查装备是否直接增加此派生属性
            let directEquipmentBonusToDerived = 0;
            for (const slotType in this.equippedItems) {
                const equippedEntity = this.equippedItems[slotType];
                if (equippedEntity && equippedEntity instanceof EquipmentEntity) {
                    const effects = equippedEntity.getEffects();
                    if (effects && effects.hasOwnProperty(attribute)) {
                        // 假设效果键与派生属性键匹配 (例如 "critRate", "hp")
                        // 并且这个效果不是已经通过基础属性计算间接影响过了
                        if (!basicAttributesWithEquipment.hasOwnProperty(attribute)) { // 确保不是对基础属性的重复计算
                           directEquipmentBonusToDerived += effects[attribute];
                        }
                    }
                }
            }
            
            if (directEquipmentBonusToDerived !== 0) {
                equipmentContributionsToDerived[attribute] = directEquipmentBonusToDerived;
            }
            value += directEquipmentBonusToDerived;


            if (["critRate", "critDamage", "dodgeRate"].includes(attribute)) {
                derived[attribute] = parseFloat(value.toFixed(5)); 
            } else {
                derived[attribute] = Math.floor(value);
            }
        }
        this.derivedAttributes = derived;
        // this.equipmentContributions 现在可以更精确地反映对派生属性的直接加成 (如果设计如此)
        // 或者，如果 equipmentContributions 旨在显示所有装备效果的总和，则需要不同的累积方式
        this.equipmentContributions = { ...equipmentBonusesToBasic, ...equipmentContributionsToDerived };

        console.log("[Summon.recalculateStats] Stats recalculated. Current Summon instance:", this);
    }

    // 为召唤兽装备一件物品到指定的装备槽
    equipItem(equipmentEntityToEquip, targetSlotType) {
        let unequippedEntity = null; // 用于存储被替换下的物品实体

        // --- 1. 输入验证 ---
        if (!STANDARD_EQUIPMENT_SLOTS.includes(targetSlotType)) {
            console.warn(`[Summon.equipItem] 无效的目标装备槽类型: ${targetSlotType}。有效槽位: ${STANDARD_EQUIPMENT_SLOTS.join(', ')}`);
            return { success: false, message: `无效的装备槽类型: ${targetSlotType}` };
        }
        if (!equipmentEntityToEquip || !(equipmentEntityToEquip instanceof EquipmentEntity) || !equipmentEntityToEquip.id) {
            console.warn(`[Summon.equipItem] 尝试装备一个无效的物品实体对象。`, equipmentEntityToEquip);
            return { success: false, message: `要装备的物品无效或不是一个有效的装备实体。` };
        }

        // --- 2. 兼容性检查 ---
        if (equipmentEntityToEquip.slotType !== targetSlotType) {
            console.warn(`[Summon.equipItem] 物品 ${equipmentEntityToEquip.name} (实际类型: ${equipmentEntityToEquip.slotType}) 不能装备到目标 ${targetSlotType} 槽位。`);
            return { success: false, message: `物品 ${equipmentEntityToEquip.name} (类型: ${equipmentEntityToEquip.slotType}) 不能装备到 ${targetSlotType} 槽位。` };
        }

        // --- 3. 处理目标槽位上当前已装备的物品 ---
        const currentlyEquippedEntity = this.equippedItems[targetSlotType];

        if (currentlyEquippedEntity) {
            if (currentlyEquippedEntity.id === equipmentEntityToEquip.id) {
                console.log(`[Summon.equipItem] 物品 ${equipmentEntityToEquip.name} 已经装备在 ${targetSlotType} 槽位。无需操作。`);
                // 即使无需操作，也最好返回一致的成功结构
                return { success: true, unequippedItemEntityId: null, message: "物品已装备，无需变更。" };
            } else {
                console.log(`[Summon.equipItem] 正在从 ${targetSlotType} 槽位卸下 ${currentlyEquippedEntity.name}。`);
                unequippedEntity = currentlyEquippedEntity; // 保存被替换的实体
                // this.equippedItems[targetSlotType] = null; // 先不设为null，直接在下一步覆盖
            }
        }

        // --- 4. 装备新物品 ---
        console.log(`[Summon.equipItem] 正在将 ${equipmentEntityToEquip.name} (品质: ${equipmentEntityToEquip.quality}) 装备到 ${targetSlotType} 槽位。`);
        this.equippedItems[targetSlotType] = equipmentEntityToEquip;

        // --- 5. 完成与状态更新 ---
        this.recalculateStats();
        console.log(`[Summon.equipItem] 成功装备 ${equipmentEntityToEquip.name}。属性已重新计算。`);
        
        return { 
            success: true, 
            unequippedItemEntityId: unequippedEntity ? unequippedEntity.id : null, // 返回被卸下物品的ID
            message: `成功将 ${equipmentEntityToEquip.name} 装备到 ${targetSlotType}。` + (unequippedEntity ? ` 替换下的物品: ${unequippedEntity.name}` : "")
        };
    }

    // 从指定槽位卸下装备
    unequipItem(slotTypeToUnequip) {
        if (!STANDARD_EQUIPMENT_SLOTS.includes(slotTypeToUnequip)) {
            console.warn(`[Summon.unequipItem] 尝试从无效的槽位卸下装备: ${slotTypeToUnequip}`);
            return { success: false, message: `无效的装备槽类型: ${slotTypeToUnequip}`, unequippedItemEntityId: null };
        }

        const currentlyEquippedEntity = this.equippedItems[slotTypeToUnequip];

        if (!currentlyEquippedEntity) {
            console.log(`[Summon.unequipItem] 槽位 ${slotTypeToUnequip} 当前没有装备物品。`);
            return { success: false, message: `槽位 ${slotTypeToUnequip} 没有装备物品。`, unequippedItemEntityId: null };
        }

        console.log(`[Summon.unequipItem] 正在从 ${slotTypeToUnequip} 槽位卸下 ${currentlyEquippedEntity.name}。`);
        this.equippedItems[slotTypeToUnequip] = null; // 将槽位置为空
        
        this.recalculateStats(); // 重新计算属性
        console.log(`[Summon.unequipItem] 成功卸下 ${currentlyEquippedEntity.name}。属性已重新计算。`);

        return { 
            success: true, 
            unequippedItemEntityId: currentlyEquippedEntity.id, // 返回被卸下物品的ID
            message: `成功从 ${slotTypeToUnequip} 卸下 ${currentlyEquippedEntity.name}。`
        };
    }
    
    addSkill(skillName) {
        if (!this.skillSet.includes(skillName) && this.skillSet.length < 12) {
            this.skillSet.push(skillName);
            return true;
        }
        return false;
    }

    getExperienceForLevel(level) {
        if (level < levelExperienceRequirements.length && levelExperienceRequirements[level] !== null) {
            return levelExperienceRequirements[level];
        }
        console.warn(`[Summon Class] Experience requirement for level ${level} not configured. Assuming max level or error.`);
        return Infinity;
    }

    addExperience(amount) {
        if (amount <= 0) return { leveledUp: false, message: "经验值必须为正。" };
        if (this.experienceToNextLevel === Infinity) {
            return { leveledUp: false, message: `${this.name} 已达到最高等级，无法再获得经验。` };
        }

        this.experience += amount;
        let leveledUpThisGain = false;
        let messages = [];

        while (this.experience >= this.experienceToNextLevel && this.experienceToNextLevel !== Infinity) {
            this.experience -= this.experienceToNextLevel;
            const levelUpSuccess = this._performActualLevelUp();
            if (levelUpSuccess) {
                leveledUpThisGain = true;
                messages.push(`${this.name} 升到了 ${this.level} 级！`);
                this.experienceToNextLevel = this.getExperienceForLevel(this.level);
                if (this.experienceToNextLevel === Infinity) {
                    messages.push(`${this.name} 已达到配置的最高等级！`);
                    this.experience = 0; 
                    break; 
                }
            } else {
                this.experience += this.experienceToNextLevel; 
                messages.push(`${this.name} 升级失败，请检查日志。`);
                break; 
            }
        }
        
        const finalMessage = messages.length > 0 ? messages.join(" ") : `${this.name} 获得了 ${amount} 点经验值。`;
        return { leveledUp: leveledUpThisGain, message: finalMessage };
    }
    
    _performActualLevelUp() {
        this.level += 1;
        this.potentialPoints += 5;
        let growthMessage = "基础属性成长: ";
        const changedAttributes = [];
        if (this.baseConfig && this.baseConfig.growthRates) {
            for (const attr in this.baseConfig.growthRates) {
                if (this.basicAttributes.hasOwnProperty(attr)) {
                    const growthRateValue = this.baseConfig.growthRates[attr]; 
                    if (growthRateValue > 0) {
                        const oldValue = this.basicAttributes[attr]; 
                        const newValueRaw = oldValue * (1 + growthRateValue); 
                        this.basicAttributes[attr] = Math.floor(newValueRaw); 
                        changedAttributes.push(`${attr}: ${oldValue} -> ${this.basicAttributes[attr]}`);
                    }
                }
            }
        }
        growthMessage += changedAttributes.join(", ");
        console.log(growthMessage);
        return true;
    }
}

export default Summon; 