import React from "react";
import {
  skillConfig,
  qualityConfig,
  skillTypeConfig,
  STANDARD_EQUIPMENT_SLOTS,
} from "../../../config/config";
import { equipmentConfig, equipmentQualityConfig } from "../../../config/equipmentConfig";
import EquipmentEntity from "../../../entities/EquipmentEntity";
import { uiText, getAttributeDisplayName } from "../../../config/uiTextConfig";

const images = import.meta.glob("../../../assets/summons/*.png", { eager: true });

// 定义基础属性的键和显示名称，以便于迭代
const BASIC_ATTRIBUTE_KEYS = [
  { key: "constitution", name: "体质" },
  { key: "strength", name: "力量" },
  { key: "agility", name: "敏捷" },
  { key: "intelligence", name: "智力" },
  { key: "luck", name: "运气" },
];

const SummonInfo = ({ summon, updateSummonInfo, onLevelUp, onEquipItem, onAllocatePoint, onResetPoints }) => {
  // Destructure all necessary properties directly from the Summon instance
  const {
    name,
    quality,
    level,
    experience,
    experienceToNextLevel,
    skillSet = [], // Default to empty array if undefined
    equippedItems = {}, // MODIFIED: Was 'equipment', to match Summon.js
    basicAttributes = {}, // Default to empty object
    derivedAttributes = {}, // Default to empty object
    equipmentContributions = {}, // Default to empty object
    equipmentBonusesToBasic = {}, // Default to empty object
    potentialPoints = 0,
    allocatedPoints = {
      constitution: 0,
      strength: 0,
      agility: 0,
      intelligence: 0,
      luck: 0,
    }, // 提供默认值
  } = summon || {}; // Ensure summon itself is not null/undefined

  const qualityIndex = qualityConfig.names.indexOf(quality);
  const qualityColorName = quality ? qualityConfig.colors[quality] : "normal"; // Use direct mapping

  const imageUrl =
    (name && images[`../../../assets/summons/${name}.png`]?.default) ||
    images["../../../assets/summons/default.png"].default;

  // 计算经验百分比
  let progressPercentage = 0;
  const currentExperience = experience === undefined ? 0 : experience;
  const targetExperience =
    experienceToNextLevel === undefined ? 0 : experienceToNextLevel;

  if (targetExperience === Infinity) {
    progressPercentage = 100; // 满级
  } else if (targetExperience > 0) {
    progressPercentage = (currentExperience / targetExperience) * 100;
  }
  progressPercentage = Math.min(Math.max(progressPercentage, 0), 100); // 确保在 0-100之间

  // 处理装备物品
  const handleEquipItem = (slotType) => {
    if (!summon) {
      return { success: false, message: '请先选择一个召唤兽' };
    }

    try {
      const result = onEquipItem(slotType);
      
      if (result && result.success) {
        return { 
          success: true, 
          message: result.message,
          equippedItem: result.equippedItem,
          unequippedItem: result.unequippedItem
        };
      } else {
        return { success: false, message: result?.message || '装备失败' };
      }
    } catch (error) {
      console.error('装备物品失败:', error);
      return { success: false, message: '装备物品失败' };
    }
  };

  const displayEquipmentSlots = STANDARD_EQUIPMENT_SLOTS.map((slotType) => {
    const iconMap = {
      饰品: "fa-ring",
      遗物: "fa-gem",
      血脉: "fa-dna",
      符文: "fa-circle-notch",
    };
    const defaultIcon = iconMap[slotType] || "fa-question-circle";
    return {
      type: slotType,
      defaultIcon,
      displayTypeName: uiText.slotTypes[slotType] || slotType,
    };
  });

  if (!summon) {
    return <div className="text-white">{uiText.loading}</div>;
  }

  console.log("[SummonInfo] Rendering with summon prop:", summon);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Left Column */}
      <div className="md:col-span-1 flex flex-col gap-3">
        <div className="flex justify-center">
          <img
            className="w-70 h-70 object-cover border-2 border-purple-500 shadow-lg"
            src={imageUrl}
            alt={name}
            onError={(e) => {
              e.target.src = images["../../../assets/summons/default.png"].default;
            }}
          />
        </div>
        <div className="bg-slate-700/70 rounded-lg p-3 shadow-sm text-center">
          <h2 className="text-xl font-bold text-purple-400 mb-1">{name}</h2>
          <div className="flex justify-center items-center space-x-4">
            <p className="text-sm text-gray-300">
              {uiText.levelLabel}{" "}
              <span className="font-semibold text-gray-100">{level || 1}</span>
            </p>
            <p className="text-sm text-gray-300">
              {uiText.qualityLabel}{" "}
              <span className={`font-semibold text-${qualityColorName}`}>
                {quality}
              </span>
            </p>
          </div>
          {/* 经验进度条 */}
          <div className="mt-2 px-2">
            <div className="flex justify-between mb-0.5">
              <span className="text-xs font-medium text-purple-300">
                {uiText.experienceLabel}
              </span>
              <span className="text-xs font-medium text-gray-300">
                {currentExperience} /{" "}
                {targetExperience === Infinity ? "MAX" : targetExperience}
              </span>
            </div>
            <div className="w-full bg-slate-500 rounded-full h-1.5 dark:bg-gray-700">
              <div
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="bg-slate-700/70 rounded-lg p-3 shadow-sm flex-grow">
          <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
            <i className="fa-solid fa-star text-purple-400 mr-2"></i>
            {uiText.coreAttributesTitle}
          </h3>
          <ul className="space-y-2 mb-2">
            {[
              { key: "hp" },
              { key: "mp" },
              { key: "physicalAttack" },
              { key: "magicalAttack" },
              { key: "physicalDefense" },
              { key: "magicalDefense" },
              { key: "speed" },
              { key: "critRate", isPercent: true },
              { key: "critDamage", isPercent: true },
              { key: "dodgeRate", isPercent: true },
            ].map(
              (attr) => (
                <li className="flex justify-between" key={attr.key}>
                  <span className="text-gray-300">
                    {getAttributeDisplayName(attr.key)}
                  </span>
                  <span className="font-semibold text-white">
                    {attr.isPercent
                      ? `${(derivedAttributes[attr.key] * 100).toFixed(1)}%`
                      : derivedAttributes[attr.key]}
                    {equipmentContributions &&
                    equipmentContributions[attr.key] !== undefined &&
                    equipmentContributions[attr.key] !== 0 ? (
                      <span className="text-green-400 ml-1">
                        (+
                        {attr.isPercent
                          ? `${(
                              equipmentContributions[attr.key] * 100
                            ).toFixed(1)}%`
                          : equipmentContributions[attr.key]}
                        )
                      </span>
                    ) : null}
                  </span>
                </li>
              )
            )}
          </ul>
        </div>
      </div>

      {/* Right Column */}
      <div className="md:col-span-2 flex flex-col gap-3">
        <div className="bg-slate-700/70 rounded-lg p-3 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
            <i className="fa-solid fa-user-shield text-yellow-400 mr-2"></i>
            {uiText.equipmentBarTitle}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {displayEquipmentSlots.map((slot) => {
              const equippedEntity = equippedItems[slot.type];
              const isEntity = equippedEntity instanceof EquipmentEntity;
              const itemQualityColorName = isEntity
                ? equipmentQualityConfig.colors[equippedEntity.quality] ||
                  "normal"
                : "slate-600";
              const borderColorClass = isEntity
                ? `border-${itemQualityColorName}`
                : "border-slate-600";
              const iconColorClass = isEntity
                ? `text-${itemQualityColorName}`
                : "text-slate-400";
              const nameColorClass = isEntity
                ? `text-${itemQualityColorName}`
                : "text-slate-300";

              const displayName = isEntity ? equippedEntity.name : "";
              const displayIcon =
                isEntity && equippedEntity.baseConfig
                  ? equippedEntity.baseConfig.icon
                  : slot.defaultIcon;
              const displayQuality = isEntity ? equippedEntity.quality : "";
              const displayLevel = isEntity ? equippedEntity.level : "";
              const displayDescription =
                isEntity && equippedEntity.baseConfig
                  ? equippedEntity.baseConfig.description
                  : uiText.equipActionLabel;
              const displayEffects = isEntity
                ? equippedEntity.getEffects()
                : {};

              return (
                <div
                  key={slot.type}
                  className={`w-full h-24 bg-slate-800 rounded-lg flex flex-col justify-center items-center border-2 ${borderColorClass} cursor-pointer hover:border-opacity-75 transition-all duration-200 p-2 relative group ${
                    isEntity ? "" : "hover:border-yellow-500"
                  }`}
                  onClick={() => handleEquipItem(slot.type)}
                >
                  {isEntity ? (
                    <>
                      <i
                        className={`fa-solid ${displayIcon} ${iconColorClass} text-3xl mb-1`}
                      ></i>
                      <span
                        className={`text-xs ${nameColorClass} font-medium text-center leading-tight`}
                      >
                        {displayName}
                      </span>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-30 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 whitespace-normal text-center shadow-lg pointer-events-none">
                        <p className={`font-bold text-${itemQualityColorName}`}>
                          {displayName} <br />
                          (Lvl: {displayLevel}, {displayQuality})
                        </p>
                        <p className="text-slate-300 italic">
                          {displayDescription}
                        </p>
                        <hr className="border-slate-600 my-1" />
                        <ul className="text-left text-slate-300 space-y-0.5">
                          {Object.entries(displayEffects).map(
                            ([effectKey, effectValue]) => {
                              const currentDisplayName =
                                getAttributeDisplayName(effectKey);
                              let displayValue = effectValue;
                              if (
                                [
                                  "critRate",
                                  "critDamage",
                                  "dodgeRate",
                                  "fireResistance",
                                ].includes(effectKey)
                              ) {
                                displayValue = `${(effectValue * 100).toFixed(
                                  1
                                )}%`;
                              }
                              return (
                                <li key={effectKey}>
                                  {currentDisplayName}: +{displayValue}
                                </li>
                              );
                            }
                          )}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      <i
                        className={`fa-solid ${slot.defaultIcon} text-slate-400 text-3xl mb-2`}
                      ></i>
                      <span className="text-xs text-slate-300 font-medium text-center">
                        {slot.displayTypeName}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-700/70 rounded-lg p-3 shadow-sm flex-grow">
          <h3 className="text-lg font-semibold text-gray-100 mb-2 flex justify-between items-center">
            <div className="flex items-center">
              <i className="fa-solid fa-fist-raised text-red-400 mr-2"></i>
              <span>基础属性和潜力分配</span>
            </div>
            <span className="text-gray-400 font-normal text-xs ml-2">
              (剩余潜力点: {potentialPoints})
            </span>
          </h3>
          <ul className="space-y-1 mb-3 pt-2 border-t border-slate-600">
            {BASIC_ATTRIBUTE_KEYS.map(({ key, name: attrDisplayName }) => {
              const allocatedVal = allocatedPoints[key] || 0;
              const equipmentBonus = equipmentBonusesToBasic[key] || 0;
              const currentBaseAttr = basicAttributes[key] || 0;
              const totalVal = currentBaseAttr + allocatedVal + equipmentBonus;

              return (
                <li
                  className="flex items-center py-2 border-b border-slate-800 last:border-b-0"
                  key={key}
                >
                  {/* Column 1: Attribute Name */}
                  <span className="w-16 text-gray-300 text-sm flex-shrink-0">
                    {attrDisplayName}
                  </span>

                  {/* Column 2: Breakdown & Total Value */}
                  <div className="flex-grow px-2 text-right">
                    <span className="text-xs text-gray-500 mr-1.5 whitespace-nowrap">
                      (基:{currentBaseAttr} 加:{allocatedVal} 装:
                      {equipmentBonus})
                    </span>
                    <span className="font-semibold text-white text-sm">
                      {totalVal}
                    </span>
                  </div>

                  {/* Column 3: Buttons */}
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <button
                      onClick={() => onAllocatePoint(key, 1)}
                      disabled={potentialPoints < 1}
                      className="px-1.5 py-0.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded shadow-sm disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => onAllocatePoint(key, 5)}
                      disabled={potentialPoints < 5}
                      className="px-1.5 py-0.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded shadow-sm disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      +5
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-slate-700/70 rounded-lg p-3 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
            <i className="fa-solid fa-bolt text-purple-400 mr-2"></i>
            {uiText.skillsTitle}
            <span className="text-xs text-gray-400 ml-1">
              {uiText.skillsMaxCountInfo}
            </span>
          </h3>
          <ul id="skills" className="">
            <div className="grid grid-cols-4 gap-x-0 gap-y-0 items-center sm:w-[280px] mx-auto">
              {Array.from({ length: 12 }).map((_, i) => {
                const skillName = i < skillSet.length ? skillSet[i] : null;
                const skillInfo = skillName
                  ? skillConfig.find((s) => s.name === skillName)
                  : null;

                const currentTypeConfig =
                  skillInfo?.type && skillTypeConfig[skillInfo.type]
                    ? skillTypeConfig[skillInfo.type]
                    : { color: "gray-500", icon: "fa-question-circle" };

                const iconToDisplay =
                  skillInfo?.icon ||
                  currentTypeConfig.icon ||
                  "fa-question-circle";
                const colorForSkill = currentTypeConfig.color;

                const baseSlotClasses =
                  "w-20 h-20 rounded flex flex-col justify-center items-center p-1 shadow-md relative group cursor-pointer border-2";

                if (!skillName) {
                  return (
                    <div
                      key={`empty-skill-${i}`}
                      className={`${baseSlotClasses} bg-slate-800 border-slate-700`}
                    >
                      <div className="h-6 w-6 mb-1 flex items-center justify-center">
                        <i className="fa-solid fa-plus text-slate-600 text-2xl"></i>
                      </div>
                      <span className="text-xs text-center text-slate-600 leading-tight">
                        {uiText.emptySlotLabel}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={skillName || i}
                    className={`${baseSlotClasses} bg-slate-800 border-slate-700`}
                  >
                    <div className="h-6 w-6 flex items-center justify-center">
                      <i
                        className={`fa-solid ${iconToDisplay} text-4xl text-${colorForSkill}`}
                      ></i>
                    </div>
                    <div className={`text-xs text-center text-gray-200 relative top-3`}>
                      <span className={`text-xs text-center text-gray-200 leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full`}>
                        {skillInfo.name}
                      </span>
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none group-hover:pointer-events-auto">
                      <p className={`font-bold text-${colorForSkill}`}>
                        {skillInfo.name} (
                        {skillInfo.type || uiText.attr.unknownType || "无类型"})
                      </p>
                      <p>{skillInfo.description}</p>
                      {skillInfo.mode && (
                        <p className="text-xs text-slate-400">
                          {uiText.typeLabel} {skillInfo.mode}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SummonInfo; 