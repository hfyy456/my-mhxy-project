import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ReactDOM from 'react-dom';
// 移除Redux相关导入，使用OOP召唤兽管理系统
import { useSummonManager } from "@/hooks/useSummonManager";
import {
  skillConfig,
  qualityConfig,
  skillTypeConfig,
  summonConfig,
} from "@/config/config";
import {
  uiText,
  getQualityDisplayName,
  getAttributeDisplayName,
  getSkillTypeDisplayName,
  getSkillModeDisplayName,
  getFiveElementDisplayName,
  getSummonNatureTypeDisplayName,
} from "@/config/ui/uiTextConfig";
import { equipmentQualityConfig } from "@/config/item/summonEquipmentConfig";
import { SUMMON_NATURE_CONFIG, FIVE_ELEMENT_COLORS, ATTRIBUTE_TYPES } from "@/config/enumConfig";
import { personalityConfig, getPersonalityDisplayName, PERSONALITY_EFFECT_MODIFIER, PERSONALITY_TYPES } from "@/config/summon/personalityConfig";
import {
  useEquipmentSlotConfig,
} from "@/hooks/useInventoryManager";
import { useEquipmentRelationship, useSummonEquipmentStatus } from '../../../hooks/useEquipmentRelationship';
import inventoryManager from '@/store/InventoryManager'; // Import InventoryManager instance

// Restore ItemTooltip to a simpler version based on user feedback
const ItemTooltip = ({ item, position }) => {
  if (!item) return null;

  const itemQuality = item.quality || 'normal'; 
  // Use optional chaining for safety, fallback to a default color like white or a specific gray
  const qualityColorForName = equipmentQualityConfig?.textColors?.[itemQuality] || equipmentQualityConfig?.colors?.[itemQuality] || '#FFFFFF'; 
  const qualityColorForDisplay = equipmentQualityConfig?.textColors?.[itemQuality] || '#DDDDDD'; // Color for the (QualityName) part

  const formatAttributeValue = (stat, value) => {
    const percentageStats = [
      "critRate", "critDamage", "dodgeRate",
      "fireResistance", "waterResistance", "thunderResistance",
      "windResistance", "earthResistance",
    ];
    if (percentageStats.includes(stat)) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return Math.floor(value);
  };

  // Restore original className and dynamic positioning via position prop
  return (
    <div
      className="fixed bg-black bg-opacity-90 border border-slate-700 rounded-lg shadow-2xl p-3 text-sm text-white z-[100] pointer-events-none transition-opacity duration-150 opacity-100 max-w-xs"
      style={{
        left: position ? `${position.x}px` : '-10000px', // Position off-screen if no position
        top: position ? `${position.y}px` : '-10000px',  // Position off-screen if no position
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className={`font-medium`} style={{ color: qualityColorForName }}> 
          {item.name || "Unnamed Item"}
        </span>
        {item.quality && (
          <span className={`text-sm`} style={{ color: qualityColorForDisplay }}> 
            ({getQualityDisplayName(item.quality)})
          </span>
        )}
      </div>

      {item.description && (
        <p className="text-xs mb-2 text-gray-300">{item.description}</p>
      )}

      {item.finalEffects && Object.keys(item.finalEffects).length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-700">
          <p className="font-semibold mb-1 text-xs text-slate-200">属性加成:</p>
          {Object.entries(item.finalEffects).map(([stat, value]) => (
            <p key={stat} className="text-xs flex justify-between">
              <span className="text-gray-400">
                {getAttributeDisplayName(stat)}
              </span>
              <span className="text-green-400">
                +{formatAttributeValue(stat, value)}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

const images = import.meta.glob("@/assets/summons/*.png", {
  eager: true,
});
console.log("DEBUG: images object from import.meta.glob:", images);
console.log("DEBUG: images keys:", Object.keys(images));

// 定义基础属性的键和显示名称，以便于迭代
const BASIC_ATTRIBUTE_KEYS = [
  { key: "constitution", name: "体质" },
  { key: "strength", name: "力量" },
  { key: "agility", name: "敏捷" },
  { key: "intelligence", name: "智力" },
  { key: "luck", name: "运气" },
];

const SummonInfo = ({
  onOpenEquipmentSelectorForSlot,
  onOpenSkillEditorForSlot,
  onOpenNicknameModal,
}) => {
  // 使用OOP召唤兽管理系统替代Redux
  const {
    currentSummonFullData: summon,
    getSummonById,
    levelUpSummon,
    allocatePoints,
    resetPoints,
    deleteSummon,
    changeSummonNickname,
    isLoading,
    error
  } = useSummonManager();
  
  // 实例化新的装备关系 Hook
  const { unequipFromSlot } = useEquipmentRelationship();

  const [isReleaseConfirmOpen, setIsReleaseConfirmOpen] = useState(false);

  // Tooltip State
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipItem, setTooltipItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipTimeoutRef = useRef(null);

  // 使用装备槽位配置Hook
  const { slotConfig, getSlotDisplayName, getSlotIcon } =
    useEquipmentSlotConfig();

  // 使用装备关系Hook获取装备状态
  const {
    equipment,
    equippedItemIds,
    isEmpty: hasNoEquipment,
    getItemInSlot,
    hasItemInSlot
  } = useSummonEquipmentStatus(summon?.id);

  // 从召唤兽实例获取数据，确保数据的准确性
  const {
    summonSourceId,
    quality,
    level,
    experience,
    experienceToNextLevel,
    skillSet = [],
    basicAttributes = {},
    derivedAttributes = {},
    equipmentContributions = {},
    equipmentBonusesToBasic = {},
    potentialPoints = 0,
    allocatedPoints = {
      constitution: 0,
      strength: 0,
      agility: 0,
      intelligence: 0,
      luck: 0,
    },
    nickname,
    power,
    natureType,
    personalityId,
  } = summon || {};

  // 添加调试日志
  React.useEffect(() => {
    console.log("[SummonInfo] 召唤兽数据:", {
      summon: summon,
      equipmentFromHook: equipment,
      equipmentContributions: equipmentContributions,
      equipmentBonusesToBasic: equipmentBonusesToBasic,
      derivedAttributes: derivedAttributes,
      power: power
    });
  }, [summon, equipment, equipmentContributions, equipmentBonusesToBasic, derivedAttributes, power]);

  const qualityIndex = qualityConfig.names.indexOf(quality);
  const qualityColorName = quality
    ? `text-${qualityConfig.colors[quality]}`
    : "text-gray-400";

  const imageUrl =
    (summonSourceId &&
      images[`/src/assets/summons/${summonSourceId}.png`]?.default) ||
    images["/src/assets/summons/default.png"].default;

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
  progressPercentage = Math.min(Math.max(progressPercentage, 0), 100);

  const handleEquipmentSlotClick = useCallback(async (slotType) => {
    if (!summon) return;

    const itemId = equipment?.[slotType];
    const currentEquippedItem = itemId ? inventoryManager.getItemById(itemId) : null;

    if (currentEquippedItem) {
      if (window.confirm(`是否卸下 ${currentEquippedItem.name || '该装备'} (${getSlotDisplayName(slotType)})？`)) {
        try {
          const success = await unequipFromSlot(summon.id, slotType);
          if (success) {
            console.log(`[SummonInfo] 成功从槽位 ${slotType} 卸下装备 ${currentEquippedItem.name}`);
          } else {
            console.warn(`[SummonInfo] 从槽位 ${slotType} 卸下装备 ${currentEquippedItem.name} 失败`);
          }
        } catch (error) {
          console.error(`[SummonInfo] 卸下装备 ${currentEquippedItem.name} 时发生错误:`, error);
        }
      }
    } else {
      if (onOpenEquipmentSelectorForSlot) {
        onOpenEquipmentSelectorForSlot(summon.id, slotType);
      }
    }
  }, [summon, equipment, unequipFromSlot, onOpenEquipmentSelectorForSlot, getSlotDisplayName, inventoryManager]);

  const renderEquipmentSlots = () => {
    if (!slotConfig) return null;

    const slotsToRender = slotConfig.filter(
      (slot) => slot.type !== "unknown" && slot.type !== "special"
    );

    return slotsToRender.map((slot) => {
      const itemId = equipment?.[slot.type];
      const actualEquippedItem = itemId ? inventoryManager.getItemById(itemId) : null;

      const itemQuality = actualEquippedItem?.quality || "normal";
      const qualityColorDetail = equipmentQualityConfig.colors[itemQuality] || equipmentQualityConfig.colors.normal;
      
      const borderColorClass = actualEquippedItem ? `border-${qualityColorDetail}` : 'border-slate-600';
      const iconColorClass = actualEquippedItem ? `text-${qualityColorDetail}` : "text-slate-400";
      const nameColorClass = actualEquippedItem ? `text-${qualityColorDetail}` : "text-slate-300";
      // Use actualEquippedItem.icon if available, otherwise default slot.icon from config
      const slotIconToDisplay = actualEquippedItem?.icon || slot.icon || 'fa-question-circle'; 
      // Use actualEquippedItem.name if available, otherwise default slot.displayName from config
      const slotNameToDisplay = actualEquippedItem?.name || slot.displayName;

      return (
        <div
          key={slot.type}
          className={`w-full h-24 bg-slate-800 rounded-lg flex flex-col justify-center items-center border-2 ${borderColorClass} cursor-pointer hover:border-opacity-75 transition-all duration-200 p-2 relative group`}
          onClick={() => handleEquipmentSlotClick(slot.type)}
          onMouseEnter={(e) => {
            const eventTimestamp = Date.now(); // Add a timestamp for easier log corellation
            if (actualEquippedItem) {
              clearTimeout(tooltipTimeoutRef.current);
              const rect = e.currentTarget.getBoundingClientRect();
              const screenWidth = window.innerWidth;
              const screenHeight = window.innerHeight;
              const tooltipWidth = 280; 
              const tooltipHeightEstimate = 150;

            

              let xPos = rect.right + 5; 

              if (xPos + tooltipWidth > screenWidth) {
                xPos = rect.left - tooltipWidth - 5;
              }

              if (xPos < 0) {
                xPos = 5;
              }

              let yPos = rect.top;
              
              if (yPos + tooltipHeightEstimate > screenHeight) {
                console.log(`[SummonInfo ${eventTimestamp}] Tooltip (height: ${tooltipHeightEstimate}) would go off bottom screen edge (${yPos + tooltipHeightEstimate} > ${screenHeight}). Repositioning higher.`);
                yPos = screenHeight - tooltipHeightEstimate - 5;
                console.log(`[SummonInfo ${eventTimestamp}] New yPos (adjusted from bottom): ${yPos}`);
              }

              if (yPos < 0) {
                console.log(`[SummonInfo ${eventTimestamp}] Tooltip would go off top screen edge (${yPos} < 0). Adjusting to 5.`);
                yPos = 5;
              }
              
              console.log(`[SummonInfo ${eventTimestamp}] Attempting to setTooltipPosition with: xPos=${xPos}, yPos=${yPos}`);
              
              // Prepare item for Tooltip, ensuring finalEffects is present
              const itemForTooltip = {
                ...actualEquippedItem,
                finalEffects: actualEquippedItem.finalEffects || actualEquippedItem.effects
              };

              // Log the item being sent to the tooltip, including the potentially aliased finalEffects
              console.log('[SummonInfo onMouseEnter] itemForTooltip (with finalEffects):', JSON.stringify(itemForTooltip, null, 2));
              
              setTooltipPosition({ x: xPos, y: yPos });
              setTooltipItem(itemForTooltip); // Use the modified item
              setTooltipVisible(true); 
            } else {
              console.log(`[SummonInfo ${eventTimestamp}] actualEquippedItem is NOT present. Tooltip will not show.`);
            }
          }}
          onMouseLeave={(e) => {
            const eventTimestamp = Date.now();
            console.log(`[SummonInfo] MouseLeave triggered at ${eventTimestamp}`);
            setTooltipVisible(false);
          }}
        >
          <div className="w-10 h-10 flex items-center justify-center mb-1 text-2xl">
            <i className={`fas ${slotIconToDisplay} ${iconColorClass}`}></i>
          </div>
          <p className={`text-xs font-medium truncate w-full text-center ${nameColorClass}`}>
            {slotNameToDisplay}
          </p>
          {actualEquippedItem && (
            <span
              className={`absolute top-1 right-1 text-[10px] px-1 rounded-sm bg-slate-900 bg-opacity-70 ${nameColorClass}`}
            >
              Lv.{actualEquippedItem.level || "-"}
            </span>
          )}
          {actualEquippedItem && (
            <div
              className={`absolute bottom-1 left-1 w-2 h-2 rounded-full bg-green-400`}
              title="已装备"
            />
          )}
          {!actualEquippedItem && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                点击装备
              </span>
            </div>
          )}
        </div>
      );
    });
  };

  if (!summon) {
    return <div className="text-white">{uiText.general.loading}</div>;
  }

  const handleLevelUp = () => {
    if (!summon || !summon.id) return;
    if (
      summon.experience !== undefined &&
      summon.experienceToNextLevel !== Infinity
    ) {
      const experienceNeeded = Math.max(
        0,
        (Number(summon.experienceToNextLevel) || 0) -
          (Number(summon.experience) || 0)
      );
      if (experienceNeeded > 0) {
        // 使用OOP系统的升级方法，给予所需经验值
        levelUpSummon(summon.id, experienceNeeded);
      } else {
        levelUpSummon(summon.id, 1);
      }
    } else if (summon.experienceToNextLevel === Infinity) {
      console.log("[SummonInfo] Summon is already at max level.");
    }
  };

  const handleAllocatePoint = (attributeName, amount) => {
    if (!summon || !summon.id) return;
    console.log("[SummonInfo] 使用OOP系统分配属性点:", {
      summonId: summon.id,
      attributeName,
      amount,
    });
    // 使用OOP系统的分配点数方法，传递正确的参数
    allocatePoints(summon.id, attributeName, amount);
  };

  const handleResetPoints = () => {
    if (!summon || !summon.id) {
      console.error(
        "[SummonInfo] Cannot reset points: summon or summon.id is missing."
      );
      return;
    }
    // 使用OOP系统的重置点数方法
    resetPoints(summon.id);
  };

  const handleReleaseConfirm = () => {
    // 使用OOP系统的删除召唤兽方法
    deleteSummon(summon.id);
    setIsReleaseConfirmOpen(false);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Left Column */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5 flex flex-col gap-3">
          <div className="flex justify-center">
            <img
              className={`w-60 h-60 object-cover border-2 ${
                quality
                  ? `border-${qualityConfig.colors[quality]}`
                  : "border-slate-500"
              } shadow-lg rounded-lg transition-all duration-300`}
              src={imageUrl}
              alt={summon.name}
              onError={(e) => {
                e.target.src =
                  images["/src/assets/summons/default.png"].default;
              }}
            />
          </div>
          <div className="bg-slate-700/70 rounded-lg p-3 shadow-sm">
            {/* <h2 className="text-2xl font-bold text-purple-300 mb-1 text-center">{displayName}</h2> */}

            {/* Nickname Section */}
            <div className="flex justify-between items-center gap-2 mb-3">
              <div>
                <span className="text-xs text-gray-400 mr-1">昵称:</span>
                <span className="text-lg font-semibold text-purple-300">
                  {nickname || "未设置"}
                </span>
              </div>
              <button
                onClick={() => onOpenNicknameModal(summon)}
                className="text-xs p-1.5 bg-slate-600 hover:bg-slate-500 text-gray-200 rounded-md transition-colors leading-none"
              >
                <i className="fas fa-edit"></i>
              </button>
            </div>

            {/* Attribute Tags Section */}
            <div className="flex flex-wrap justify-start items-stretch gap-x-2 gap-y-2 mb-2">
              {/* Level Tag */}
              <div className="flex items-center bg-slate-600/50 px-3 py-1.5 rounded-lg shadow">
                <i className="fas fa-star text-yellow-400 mr-2"></i>
                <span className="text-xs font-semibold text-gray-100">
                  {level || 1}
                </span>
              </div>

              {/* Quality Tag */}
              <div
                className={`flex items-center ${
                  qualityConfig.bgColors?.[quality] || "bg-slate-600/50"
                } px-3 py-1.5 rounded-lg shadow`}
              >
                <i className={`fas fa-gem ${qualityColorName} mr-2`}></i>
                <span
                  className={`text-xs font-semibold ${
                    qualityConfig.textColors?.[quality] || qualityColorName
                  }`}
                >
                  {getQualityDisplayName(quality)}
                </span>
              </div>

              {/* Nature Type Tag - Corrected and uses SUMMON_NATURE_CONFIG */}
              {natureType && SUMMON_NATURE_CONFIG[natureType] && (
                <div className={`flex items-center px-3 py-1.5 rounded-lg shadow ${SUMMON_NATURE_CONFIG[natureType].bgColor || 'bg-slate-600/50'}`}>
                  <i className={`fas mr-2 ${
                    natureType === 'wild' ? 'fa-tree' : 
                    natureType === 'baby' ? 'fa-baby' :
                    natureType === 'mutant' ? 'fa-dna' :
                    'fa-question' 
                  } ${SUMMON_NATURE_CONFIG[natureType].color || 'text-gray-400'}`}></i>
                  <span className={`text-xs font-semibold ${SUMMON_NATURE_CONFIG[natureType].color || 'text-white'}`}>
                    {getSummonNatureTypeDisplayName(natureType)}
                  </span>
                </div>
              )}

              {/* Personality Tag - New */} 
              {personalityId && personalityConfig[personalityId] && (
                <div className={`flex items-center bg-slate-600/80 px-3 py-1.5 rounded-lg shadow`}>
                  <i className={`fas fa-grin-stars mr-2 text-yellow-300`}></i> 
                  <span className={`text-xs font-semibold text-white`}>
                    {getPersonalityDisplayName(personalityId)}
                  </span>
                </div>
              )}

              {/* Five Element Tag - Corrected to use FIVE_ELEMENT_COLORS */}
              {(summon.fiveElement || summonConfig[summon.summonSourceId]?.fiveElement) && (
                <div
                  className={`flex items-center px-3 py-1.5 rounded-lg shadow ${
                    FIVE_ELEMENT_COLORS[
                      summon.fiveElement ||
                        summonConfig[summon.summonSourceId]?.fiveElement
                    ]?.bgColor || 'bg-slate-600/50' 
                  }`}
                >
                  <i className={`fas fa-circle mr-2 ${
                    FIVE_ELEMENT_COLORS[
                      summon.fiveElement ||
                        summonConfig[summon.summonSourceId]?.fiveElement
                    ]?.textColor || 'text-gray-400'
                  }`}></i>
                  <span className={`text-xs font-semibold ${
                    FIVE_ELEMENT_COLORS[
                      summon.fiveElement ||
                        summonConfig[summon.summonSourceId]?.fiveElement
                    ]?.textColor || 'text-white'
                  }`}>
                    {getFiveElementDisplayName(
                      summon.fiveElement ||
                        summonConfig[summon.summonSourceId]?.fiveElement
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-2 px-2">
              <div className="flex justify-between mb-0.5">
                <span className="text-xs font-medium text-purple-300">
                  {uiText.labels.experience}
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
              {uiText.titles.coreAttributes}
            </h3>
            {/* 战力值展示 */}
            {typeof summon.power === "number" && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-yellow-400 font-bold text-base flex items-center">
                  <i className="fas fa-fire-alt mr-2"></i>战力值
                </span>
                <span className="text-lg font-extrabold text-yellow-300 drop-shadow">
                  {summon.power}
                </span>
              </div>
            )}
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
                (attr) =>
                  derivedAttributes.hasOwnProperty(attr.key) && (
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
        <div className="md:col-span-7 flex flex-col gap-3">
          <div className="bg-slate-700/70 rounded-lg p-3 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
              <i className="fa-solid fa-star text-purple-400 mr-2"></i>
              {uiText.titles.equipmentBar}
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {renderEquipmentSlots()}
            </div>
          </div>

          <div className="bg-slate-700/70 rounded-lg p-3 shadow-sm flex-grow">
            <h3 className="text-lg font-semibold text-gray-100 mb-2 flex justify-between items-center">
              <div className="flex items-center">
                <i className="fa-solid fa-fist-raised text-red-400 mr-2"></i>
                <span>{uiText.titles.basicAttributes}</span>
              </div>
              <span className="text-gray-400 font-normal text-xs ml-2">
                ({uiText.labels.remainingPoints}: {potentialPoints})
              </span>
            </h3>
            <ul className="space-y-1 mb-3 pt-2 border-t border-slate-600">
              {BASIC_ATTRIBUTE_KEYS.map(({ key, name: attrDisplayName }) => {
                const allocatedVal = allocatedPoints[key] || 0;
                const equipmentBonus = equipmentBonusesToBasic[key] || 0;
                const currentBaseAttr = basicAttributes[key] || 0; // This now includes personality effects from generation
                
                const displayValue = currentBaseAttr + allocatedVal + equipmentBonus;
                let personalityEffectIndicator = "";
                let indicatorColorClass = "";

                // Determine if the current attribute (key) is affected by personality for indicator purposes
                if (personalityId && personalityConfig[personalityId] && personalityConfig[personalityId].id !== PERSONALITY_TYPES.NEUTRAL) {
                  const selectedPersonality = personalityConfig[personalityId];
                  if (selectedPersonality.isExtreme) {
                    if (selectedPersonality.extremeStat === key) {
                      personalityEffectIndicator = " (++)";
                      indicatorColorClass = "text-emerald-400"; // Brighter green for extreme positive
                    } else if (selectedPersonality.decreasedStat1 === key || selectedPersonality.decreasedStat2 === key) {
                      personalityEffectIndicator = " (-)";
                      indicatorColorClass = "text-red-400";
                    }
                  } else {
                    if (selectedPersonality.increasedStat === key) {
                      personalityEffectIndicator = " (+)";
                      indicatorColorClass = "text-green-400";
                    } else if (selectedPersonality.decreasedStat === key) {
                      personalityEffectIndicator = " (-)";
                      indicatorColorClass = "text-red-400";
                    }
                  }
                }

                return (
                  <li
                    className="flex items-center py-2 border-b border-slate-800 last:border-b-0"
                    key={key}
                  >
                    <span className="w-16 text-gray-300 text-sm flex-shrink-0">
                      {getAttributeDisplayName(key)}
                    </span>
                    <div className="flex-grow px-2 text-right">
                      <span className="text-xs text-gray-500 mr-1.5 whitespace-nowrap">
                        (基:{currentBaseAttr} 加:{allocatedVal} 装:
                        {equipmentBonus})
                      </span>
                      <span className="font-semibold text-white text-sm">
                        {displayValue}
                        {personalityEffectIndicator && <span className={indicatorColorClass}>{personalityEffectIndicator}</span>}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleAllocatePoint(key, 1)}
                        disabled={potentialPoints < 1}
                        className="px-1.5 py-0.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded shadow-sm disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-150"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleAllocatePoint(key, 5)}
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
            {potentialPoints > 0 && (
              <div className="mt-2">
                <button
                  onClick={handleResetPoints}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-1.5 px-3 rounded-md text-xs shadow-sm transition-colors duration-150 mb-1.5"
                >
                  {uiText.buttons.resetPoints}
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-700/70 rounded-lg p-3 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
              <i className="fa-solid fa-bolt text-purple-400 mr-2"></i>
              {uiText.titles.skillSet}
              <span className="text-xs text-gray-400 ml-1">
                {uiText.labels.skillCount}
              </span>
            </h3>
            <ul id="skillSet" className="">
              <div className="grid grid-cols-4 gap-x-0 gap-y-0 items-center sm:w-[280px] mx-auto">
                {Array.from({ length: 12 }).map((_, i) => {
                  const skillId = i < skillSet.length ? skillSet[i] : null;
                  const skillInfo = skillId
                    ? skillConfig.find((s) => s.id === skillId)
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

                  const handleSkillSlotClick = () => {
                    if (typeof onOpenSkillEditorForSlot === "function") {
                      onOpenSkillEditorForSlot(i, skillId);
                    } else {
                      console.warn(
                        "[SummonInfo] onOpenSkillEditorForSlot is not defined."
                      );
                    }
                  };

                  if (!skillInfo) {
                    return (
                      <div
                        key={`empty-skill-${i}`}
                        className={`${baseSlotClasses} bg-slate-800 border-slate-700 hover:border-yellow-500`}
                        onClick={handleSkillSlotClick}
                      >
                        <div className="h-6 w-6 mb-1 flex items-center justify-center">
                          <i className="fa-solid fa-plus text-slate-600 text-2xl"></i>
                        </div>
                        <span className="text-xs text-center text-slate-600 leading-tight">
                          {uiText.emptyStates.emptySlot}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={skillId || i}
                      className={`${baseSlotClasses} bg-slate-800 border-slate-700 hover:border-${colorForSkill} hover:border-opacity-70`}
                      onClick={handleSkillSlotClick}
                    >
                      <div className="h-6 w-6 flex items-center justify-center">
                        <i
                          className={`fa-solid ${iconToDisplay} text-4xl text-${colorForSkill}`}
                        ></i>
                      </div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs bg-slate-800 text-white text-xs rounded-md py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none group-hover:pointer-events-auto shadow-lg border border-${colorForSkill} border-opacity-50">
                        <div className="flex items-center gap-2 mb-1.5">
                          <i
                            className={`fa-solid ${iconToDisplay} text-${colorForSkill} text-lg`}
                          ></i>
                          <p
                            className={`font-bold text-${colorForSkill} text-sm`}
                          >
                            {skillInfo.name}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-${colorForSkill} bg-opacity-20 text-${colorForSkill}`}
                          >
                            {getSkillTypeDisplayName(skillInfo.type) ||
                              uiText.general.unknown}
                          </span>
                          {skillInfo.mode && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-slate-700 text-gray-300">
                              {getSkillModeDisplayName(skillInfo.mode)}
                            </span>
                          )}
                          {skillInfo.cooldownRounds && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-900/50 text-blue-300">
                              <i className="fas fa-clock mr-1 text-xs"></i>
                              冷却: {skillInfo.cooldownRounds}回合
                            </span>
                          )}
                          {skillInfo.mpCost && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-indigo-900/50 text-indigo-300">
                              <i className="fas fa-tint mr-1 text-xs"></i>
                              法力: {skillInfo.mpCost}
                            </span>
                          )}
                        </div>

                        <p className="text-gray-300 mb-1.5 leading-relaxed">
                          {skillInfo.description}
                        </p>

                        {skillInfo.damage && (
                          <p className="text-xs text-gray-400 flex items-center">
                            <i className="fas fa-fire-alt mr-1"></i>
                            伤害:{" "}
                            {typeof skillInfo.damage === "function"
                              ? "基于属性计算"
                              : skillInfo.damage}
                          </p>
                        )}
                        {skillInfo.probability && (
                          <p className="text-xs text-gray-400 flex items-center">
                            <i className="fas fa-dice mr-1"></i>
                            触发概率: {skillInfo.probability * 100}%
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

      {/* Tooltip Display using Portal */}
      {(() => {
        if (typeof window !== 'undefined') {
          const renderTimestamp = Date.now();
        }
        if (tooltipVisible && tooltipItem && document.body) {
          return ReactDOM.createPortal(
            <ItemTooltip item={tooltipItem} position={tooltipPosition} />,
            document.body
          );
        }
        return null;
      })()}

      {/* 释放确认对话框 */}
      {isReleaseConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">确认释放</h3>
            <p className="text-gray-300 mb-6">
              确定要释放召唤兽 {summon.nickname || summon.name}{" "}
              吗？此操作不可撤销。
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsReleaseConfirmOpen(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
              >
                取消
              </button>
              <button
                onClick={handleReleaseConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded"
              >
                确认释放
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummonInfo;
