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
import { equipmentQualityConfig } from "@/config/item/equipmentConfig";
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

  const formatAttributeValue = (stat, effect) => {
    // 百分比属性列表
    const percentageStats = [
      "critRate", "critDamage", "dodgeRate",
      "fireResistance", "waterResistance", "thunderResistance",
      "windResistance", "earthResistance",
    ];
    
    if (typeof effect === 'number') {
      // 兼容旧格式
      if (percentageStats.includes(stat)) {
        return `${(effect * 100).toFixed(1)}%`;
      }
      return Math.floor(effect);
    } else if (effect && typeof effect === 'object') {
      // 新格式
      const { type, value } = effect;
      if (type === 'percent') {
        return `${value}%`;
      } else {
        return Math.floor(value);
      }
    }
    return '0';
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

      {item.effects && Object.keys(item.effects).length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-700">
          <p className="font-semibold mb-1 text-xs text-slate-200">属性加成:</p>
          {Object.entries(item.effects).map(([stat, effect]) => (
            <p key={stat} className="text-xs flex justify-between">
              <span className="text-gray-400">
                {getAttributeDisplayName(stat)}
              </span>
              <span className="text-green-400">
                +{formatAttributeValue(stat, effect)}
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

  // 计算是否可以升级
  const canLevelUp = targetExperience !== Infinity && currentExperience >= targetExperience;

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
          className={`w-full h-20 bg-slate-800 rounded-lg flex flex-col justify-center items-center border-2 ${borderColorClass} cursor-pointer hover:border-opacity-75 transition-all duration-200 p-1.5 relative group`}
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
              
              // Log the item being sent to the tooltip
              console.log('[SummonInfo onMouseEnter] actualEquippedItem:', JSON.stringify(actualEquippedItem, null, 2));
              
              setTooltipPosition({ x: xPos, y: yPos });
              setTooltipItem(actualEquippedItem);
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
          <div className="w-8 h-8 flex items-center justify-center mb-0.5 text-xl">
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
    <div className="flex flex-col space-y-3 max-w-none">
      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex justify-center p-2">
            <div className="relative">
              <img
                className={`w-44 h-44 object-cover border-4 ${
                  quality
                    ? `border-${qualityConfig.colors[quality]}`
                    : "border-slate-500"
                } shadow-xl rounded-xl transition-all duration-300 hover:shadow-2xl hover:scale-105`}
                src={imageUrl}
                alt={summon.name}
                onError={(e) => {
                  e.target.src =
                    images["/src/assets/summons/default.png"].default;
                }}
              />
              {/* 品质光效 */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-t ${
                qualityConfig.gradients?.[quality] || "from-transparent to-transparent"
              } opacity-20 pointer-events-none`}></div>
            </div>
          </div>
          
          {/* 小标签区域 - 头像下方 */}
          <div className="flex flex-wrap justify-center gap-1 mb-2">
            {/* Quality Tag */}
            <div 
              className={`flex items-center ${
                qualityConfig.bgColors?.[quality] || "bg-slate-600/50"
              } px-2 py-1 rounded-md text-xs shadow-sm cursor-help`}
              title={`品质: ${getQualityDisplayName(quality)} - 属性倍率: ${qualityConfig.attributeMultipliers[qualityConfig.names.indexOf(quality)] || 1.0}x`}
            >
              <i className={`fas fa-gem ${qualityColorName} mr-1`}></i>
              <span className={qualityConfig.textColors?.[quality] || qualityColorName}>
                {getQualityDisplayName(quality)}
              </span>
            </div>

            {/* Nature Type Tag */}
            {natureType && SUMMON_NATURE_CONFIG[natureType] && (
              <div 
                className={`flex items-center px-2 py-1 rounded-md text-xs shadow-sm cursor-help ${
                  SUMMON_NATURE_CONFIG[natureType].bgColor || 'bg-slate-600/50'
                }`}
                title={`自然属性: ${getSummonNatureTypeDisplayName(natureType)} - ${SUMMON_NATURE_CONFIG[natureType].description || '影响召唤兽的基础属性'}`}
              >
                <i className={`fas mr-1 ${
                  natureType === 'wild' ? 'fa-tree' : 
                  natureType === 'baby' ? 'fa-baby' :
                  natureType === 'mutant' ? 'fa-dna' :
                  'fa-question' 
                } ${SUMMON_NATURE_CONFIG[natureType].color || 'text-gray-400'}`}></i>
                <span className={SUMMON_NATURE_CONFIG[natureType].color || 'text-white'}>
                  {getSummonNatureTypeDisplayName(natureType)}
                </span>
              </div>
            )}

            {/* Personality Tag */} 
            {personalityId && personalityConfig[personalityId] && (
              <div 
                className="flex items-center bg-pink-600/50 px-2 py-1 rounded-md text-xs shadow-sm cursor-help"
                title={`性格: ${getPersonalityDisplayName(personalityId)} - ${personalityConfig[personalityId].description || '影响基础属性的分配'}`}
              >
                <i className="fas fa-grin-stars mr-1 text-pink-300"></i> 
                <span className="text-pink-100">
                  {getPersonalityDisplayName(personalityId)}
                </span>
              </div>
            )}

            {/* Five Element Tag */}
            {(summon.fiveElement || summonConfig[summon.summonSourceId]?.fiveElement) && (
              <div 
                className={`flex items-center px-2 py-1 rounded-md text-xs shadow-sm cursor-help ${
                  FIVE_ELEMENT_COLORS[
                    summon.fiveElement ||
                      summonConfig[summon.summonSourceId]?.fiveElement
                  ] || 'bg-slate-600/50 text-white'
                }`}
                title={`五行: ${getFiveElementDisplayName(
                  summon.fiveElement ||
                    summonConfig[summon.summonSourceId]?.fiveElement
                )} - 影响技能相克和法术伤害`}
              >
                <i className="fas fa-circle mr-1"></i>
                <span>
                  {getFiveElementDisplayName(
                    summon.fiveElement ||
                      summonConfig[summon.summonSourceId]?.fiveElement
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="bg-slate-700/70 rounded-lg p-2 shadow-sm">
            {/* Nickname Section */}
            <div className="flex justify-between items-center gap-2 mb-2">
              <div className="flex-1">
                <span className="text-xs text-gray-400 block mb-0.5">昵称</span>
                <span className="text-base font-bold text-purple-300">
                  {nickname || "未设置"}
                </span>
              </div>
              <button
                onClick={() => onOpenNicknameModal(summon)}
                className="p-1.5 bg-slate-600 hover:bg-slate-500 text-gray-200 rounded-lg transition-colors duration-200 hover:scale-105"
                title="编辑昵称"
              >
                <i className="fas fa-edit text-xs"></i>
              </button>
            </div>

            {/* Experience Section */}
            <div className="mt-2 px-1">
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 px-1.5 py-0.5 rounded-lg shadow">
                    <div className="flex items-center">
                      <i className="fas fa-star text-yellow-100 mr-1 text-xs"></i>
                      <span className="text-sm font-bold text-white">
                        Lv.{level || 1}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-300 bg-slate-800/50 px-1.5 py-0.5 rounded">
                  {currentExperience} / {targetExperience === Infinity ? "MAX" : targetExperience}
                </span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-1.5 shadow-inner">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-400 h-1.5 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="h-full rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/70 rounded-lg p-2.5 shadow-sm flex-grow">
            <h3 className="text-base font-semibold text-gray-100 mb-2.5 flex justify-between items-center border-b border-slate-600/50 pb-1.5">
              <div className="flex items-center">
                <i className="fa-solid fa-fist-raised text-red-400 mr-1.5 text-sm"></i>
                <span>{uiText.titles.basicAttributes}</span>
              </div>
              <span className="bg-slate-600/50 px-1.5 py-0.5 rounded text-xs text-amber-300 font-medium">
                剩余: {potentialPoints}
              </span>
            </h3>
            <div className="space-y-2 mb-4">
              {BASIC_ATTRIBUTE_KEYS.map(({ key, name: attrDisplayName }) => {
                const allocatedVal = allocatedPoints[key] || 0;
                const equipmentBonus = equipmentBonusesToBasic[key] || 0;
                const currentBaseAttr = basicAttributes[key] || 0;
                
                const displayValue = currentBaseAttr + allocatedVal + equipmentBonus;
                let personalityEffectIndicator = "";
                let indicatorColorClass = "";

                if (personalityId && personalityConfig[personalityId] && personalityConfig[personalityId].id !== PERSONALITY_TYPES.NEUTRAL) {
                  const selectedPersonality = personalityConfig[personalityId];
                  if (selectedPersonality.isExtreme) {
                    if (selectedPersonality.extremeStat === key) {
                      personalityEffectIndicator = " (++)";
                      indicatorColorClass = "text-emerald-400";
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
                  <div
                    className="bg-slate-800/50 rounded-lg p-3 hover:bg-slate-800/70 transition-colors"
                    key={key}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-300 text-sm font-medium">
                          {getAttributeDisplayName(key)}
                        </span>
                        {(allocatedVal > 0 || equipmentBonus > 0) && (
                          <span className="text-xs text-green-400">
                            +{allocatedVal + equipmentBonus}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">
                          {displayValue}
                        </span>
                        <button
                          onClick={() => handleAllocatePoint(key, 1)}
                          disabled={potentialPoints < 1}
                          className="w-6 h-6 bg-green-600 hover:bg-green-500 text-white text-xs rounded shadow-sm disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleAllocatePoint(key, 5)}
                          disabled={potentialPoints < 5}
                          className="w-6 h-6 bg-green-700 hover:bg-green-600 text-white text-xs rounded shadow-sm disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* 操作按钮区域 */}
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleLevelUp}
                  disabled={!canLevelUp}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-500 text-white font-medium py-2.5 px-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed text-sm"
                >
                  <i className="fas fa-arrow-up mr-1"></i>
                  升级
                </button>
                
                <button
                  onClick={handleResetPoints}
                  disabled={Object.values(allocatedPoints).every(val => val === 0)}
                  className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-gray-600 disabled:to-gray-500 text-white font-medium py-2.5 px-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed text-sm"
                  title="重置所有已分配的属性点"
                >
                  <i className="fas fa-undo mr-1"></i>
                  重置
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7  flex flex-col gap-3">
          <div className="bg-slate-700/70 rounded-lg p-2 shadow-sm">
            <h3 className="text-base font-semibold text-gray-100 mb-2 flex items-center border-b border-slate-600/50 pb-1">
              <i className="fa-solid fa-gem text-purple-400 mr-1 text-sm"></i>
              {uiText.titles.equipmentBar}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {renderEquipmentSlots()}
            </div>
          </div>

          <div className="bg-slate-700/70 rounded-lg p-2 shadow-sm flex-grow">
            <h3 className="text-base font-semibold text-gray-100 mb-2 flex items-center border-b border-slate-600/50 pb-1">
              <i className="fa-solid fa-star text-purple-400 mr-1 text-sm"></i>
              {uiText.titles.coreAttributes}
            </h3>
            
            {/* 战力值展示 */}
            {typeof summon.power === "number" && (
              <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-lg p-1.5 mb-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-yellow-400 font-bold text-xs flex items-center">
                    <i className="fas fa-fire-alt mr-1"></i>战力值
                  </span>
                  <span className="text-base font-extrabold text-yellow-300 drop-shadow">
                    {summon.power.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: "hp", icon: "fa-heart", color: "text-red-400" },
                { key: "mp", icon: "fa-tint", color: "text-blue-400" },
                { key: "physicalAttack", icon: "fa-sword", color: "text-orange-400" },
                { key: "magicalAttack", icon: "fa-magic", color: "text-purple-400" },
                { key: "physicalDefense", icon: "fa-shield", color: "text-gray-400" },
                { key: "magicalDefense", icon: "fa-shield-alt", color: "text-indigo-400" },
                { key: "speed", icon: "fa-bolt", color: "text-yellow-400" },
                { key: "critRate", icon: "fa-crosshairs", color: "text-red-400", isPercent: true },
                { key: "critDamage", icon: "fa-bomb", color: "text-red-500", isPercent: true },
                { key: "dodgeRate", icon: "fa-running", color: "text-green-400", isPercent: true },
              ].map(
                (attr) =>
                  derivedAttributes.hasOwnProperty(attr.key) && (
                    <div className="bg-slate-800/50 rounded-lg p-1.5 hover:bg-slate-800/70 transition-colors" key={attr.key}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-gray-300 flex items-center text-xs">
                          <i className={`fas ${attr.icon} ${attr.color} mr-1 text-xs`}></i>
                          {getAttributeDisplayName(attr.key)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">
                          {attr.isPercent
                            ? `${(derivedAttributes[attr.key] * 100).toFixed(1)}%`
                            : Math.floor(derivedAttributes[attr.key]).toLocaleString()}
                        </span>
                        {equipmentContributions &&
                        equipmentContributions[attr.key] !== undefined &&
                        equipmentContributions[attr.key] !== 0 && (
                          <span className="text-green-400 text-xs font-medium">
                            +{attr.isPercent
                              ? `${(equipmentContributions[attr.key] * 100).toFixed(1)}%`
                              : Math.floor(equipmentContributions[attr.key]).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )
              )}
            </div>
          </div>

          <div className="bg-slate-700/70 rounded-lg p-2 shadow-sm">
            <h3 className="text-base font-semibold text-gray-100 mb-2 flex items-center border-b border-slate-600/50 pb-1">
              <i className="fa-solid fa-bolt text-purple-400 mr-1 text-sm"></i>
              {uiText.titles.skillSet}
              <span className="text-xs text-amber-300 ml-2 bg-slate-600/50 px-1.5 py-0.5 rounded">
                {uiText.labels.skillCount}
              </span>
            </h3>
            <ul id="skillSet" className="">
              <div className="grid grid-cols-4 gap-x-0 gap-y-0 items-center sm:w-[224px] mx-auto">
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
                    "w-16 h-16 rounded flex flex-col justify-center items-center p-1 shadow-md relative group cursor-pointer border-2";

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
                        <div className="h-5 w-5 mb-1 flex items-center justify-center">
                          <i className="fa-solid fa-plus text-slate-600 text-xl"></i>
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
                      <div className="h-5 w-5 flex items-center justify-center">
                        <i
                          className={`fa-solid ${iconToDisplay} text-3xl text-${colorForSkill}`}
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
