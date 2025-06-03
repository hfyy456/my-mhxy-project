import React, { useState, useEffect } from "react";
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
  getRaceTypeDisplayName,
  getSkillModeDisplayName,
  getFiveElementDisplayName,
} from "@/config/ui/uiTextConfig";
import { equipmentQualityConfig } from "@/config/item/summonEquipmentConfig";
import { FIVE_ELEMENT_COLORS } from "@/config/enumConfig";
import {
  useEquipmentSlotConfig,
  useInventoryActions,
} from "@/hooks/useInventoryManager";
import inventoryManager from "@/store/InventoryManager";

// 修改ItemTooltip组件
const ItemTooltip = ({ item, position }) => {
  const itemQualityColorName = item.quality
    ? equipmentQualityConfig.colors[item.quality] || "normal"
    : "normal";

  // 格式化属性值的显示
  const formatAttributeValue = (stat, value) => {
    // 处理百分比属性
    const percentageStats = [
      "critRate",
      "critDamage",
      "dodgeRate",
      "fireResistance",
      "waterResistance",
      "thunderResistance",
      "windResistance",
      "earthResistance",
    ];
    if (percentageStats.includes(stat)) {
      return `${(value * 100).toFixed(1)}%`;
    }
    // 处理整数属性
    return Math.floor(value);
  };

  return (
    <div
      className="fixed bg-black bg-opacity-90 border border-slate-700 rounded-lg shadow-2xl p-3 text-sm text-white z-[100] pointer-events-none transition-opacity duration-150 opacity-100 max-w-xs"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className={`text-${itemQualityColorName} font-medium`}>
          {item.name}
        </span>
        <span className={`text-sm text-${itemQualityColorName}`}>
          ({getQualityDisplayName(item.quality)})
        </span>
      </div>

      <p className="text-gray-300 text-xs mb-2">{item.description}</p>

      {item.finalEffects && Object.keys(item.finalEffects).length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-700">
          <p className="text-slate-200 font-semibold mb-1 text-xs">属性加成:</p>
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
  
  const [isReleaseConfirmOpen, setIsReleaseConfirmOpen] = useState(false);

  // 使用装备槽位配置Hook
  const { slotConfig, getSlotDisplayName, getSlotIcon } =
    useEquipmentSlotConfig();
  const { getSummonEquipmentStatus } = useInventoryActions();

  // 简化装备数据获取 - 直接从召唤兽实例获取装备数据
  const [equippedItems, setEquippedItems] = React.useState({});
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  useEffect(() => {
    const loadEquippedItems = async () => {
      if (!summon?.id) {
        setEquippedItems({});
        return;
      }

      try {
        // 获取召唤兽实例
        const summonInstance = getSummonById(summon.id);
        if (!summonInstance) {
          console.warn(`[SummonInfo] 找不到召唤兽: ${summon.id}`);
          setEquippedItems({});
          return;
        }

        // 直接从召唤兽实例获取装备数据
        const equippedItemsData = await summonInstance.getEquippedItems();
        setEquippedItems(equippedItemsData);
        
        console.log("[SummonInfo] 装备数据已加载:", equippedItemsData);
      } catch (error) {
        console.error("[SummonInfo] 加载装备数据失败:", error);
        setEquippedItems({});
      }
    };

    loadEquippedItems();
  }, [summon?.id, getSummonById, refreshTrigger]);

  // 监听装备变化事件并强制刷新
  React.useEffect(() => {
    const handleEquipmentChange = () => {
      console.log('[SummonInfo] 装备变化事件触发，强制刷新数据');
      setRefreshTrigger(prev => prev + 1);
      
      // 延迟一点再刷新，确保数据同步
      setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 100);
    };

    // 监听InventoryManager的装备事件
    inventoryManager.on("item_equipped_to_summon", handleEquipmentChange);
    inventoryManager.on("item_unequipped_from_summon", handleEquipmentChange);
    inventoryManager.on("inventory_changed", handleEquipmentChange);

    return () => {
      inventoryManager.off("item_equipped_to_summon", handleEquipmentChange);
      inventoryManager.off("item_unequipped_from_summon", handleEquipmentChange);
      inventoryManager.off("inventory_changed", handleEquipmentChange);
    };
  }, [summon?.id]);

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
  } = summon || {};

  // 添加调试日志
  React.useEffect(() => {
    console.log("[SummonInfo] 召唤兽数据:", {
      summon: summon,
      equippedItems: equippedItems,
      equipmentContributions: equipmentContributions,
      equipmentBonusesToBasic: equipmentBonusesToBasic,
      derivedAttributes: derivedAttributes,
      power: power
    });
  }, [summon, equippedItems, equipmentContributions, equipmentBonusesToBasic, derivedAttributes, power]);

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

  const handleEquipItem = (slotType) => {
    if (!summon) return;
    console.log("[SummonInfo] handleEquipItem called for slot:", slotType);
    if (typeof onOpenEquipmentSelectorForSlot === "function") {
      onOpenEquipmentSelectorForSlot(slotType);
    } else {
      console.warn(
        "[SummonInfo] onOpenEquipmentSelectorForSlot is not a function"
      );
    }
  };

  // 使用正确的装备槽位配置
  const displayEquipmentSlots = slotConfig.map((slotConfigItem) => ({
    type: slotConfigItem.type,
    defaultIcon: slotConfigItem.icon,
    displayTypeName: slotConfigItem.displayName,
    description: slotConfigItem.description,
  }));

  const displayName =
    summonConfig[summonSourceId]?.name ||
    summonSourceId ||
    uiText.general.unknown;

  // 添加tooltip状态
  const [tooltipItem, setTooltipItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipTimeoutRef = React.useRef(null);

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

  // 修改装备槽渲染部分
  const renderEquipmentSlots = () => {
    return displayEquipmentSlots.map((slot) => {
      const equippedItem = equippedItems[slot.type];

      const itemQuality = equippedItem?.quality || "normal";
      const qualityColorDetail =
        equipmentQualityConfig.colors[itemQuality] ||
        equipmentQualityConfig.colors.normal;

      const borderColorClass = `border-${qualityColorDetail}`;
      const iconColorClass = equippedItem
        ? `text-${qualityColorDetail}`
        : "text-slate-400";
      const nameColorClass = equippedItem
        ? `text-${qualityColorDetail}`
        : "text-slate-300";

      return (
        <div
          key={slot.type}
          className={`w-full h-24 bg-slate-800 rounded-lg flex flex-col justify-center items-center border-2 ${borderColorClass} cursor-pointer hover:border-opacity-75 transition-all duration-200 p-2 relative group`}
          onClick={() => handleEquipItem(slot.type)}
          title={slot.description}
          onMouseEnter={(e) => {
            if (equippedItem) {
              const rect = e.currentTarget.getBoundingClientRect();
              const screenWidth = window.innerWidth;
              const tooltipWidth = 280; // 估算tooltip宽度
              const x =
                rect.left + rect.width + tooltipWidth > screenWidth
                  ? rect.left - tooltipWidth - 5
                  : rect.left + rect.width + 5;

              let y = rect.top;
              const tooltipHeight = 150; // 估算tooltip高度
              if (rect.top + tooltipHeight > window.innerHeight) {
                y = window.innerHeight - tooltipHeight - 5;
              }
              if (y < 0) y = 5;

              setTooltipPosition({ x, y });
              setTooltipItem(equippedItem);
              tooltipTimeoutRef.current = setTimeout(
                () => setTooltipVisible(true),
                300
              );
            }
          }}
          onMouseLeave={() => {
            clearTimeout(tooltipTimeoutRef.current);
            setTooltipVisible(false);
          }}
        >
          <div className="w-10 h-10 flex items-center justify-center mb-1 text-2xl">
            <i
              className={`fas ${
                equippedItem && equippedItem.icon
                  ? equippedItem.icon
                  : slot.defaultIcon
              } ${iconColorClass}`}
            ></i>
          </div>
          <p
            className={`text-xs font-medium truncate w-full text-center ${nameColorClass}`}
          >
            {equippedItem ? equippedItem.name : slot.displayTypeName}
          </p>
          {/* 显示装备等级和品质指示器 */}
          {equippedItem && (
            <span
              className={`absolute top-1 right-1 text-[10px] px-1 rounded-sm bg-slate-900 bg-opacity-70 ${nameColorClass}`}
            >
              Lv.{equippedItem.level || "-"}
            </span>
          )}
          {/* 显示装备状态指示器 */}
          {equippedItem && (
            <div
              className={`absolute bottom-1 left-1 w-2 h-2 rounded-full bg-green-400`}
              title="已装备"
            />
          )}
          {/* 空槽位提示 */}
          {!equippedItem && (
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
              alt={name}
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

              {/* Race Tag */}
              <div className="flex items-center bg-slate-600/50 px-3 py-1.5 rounded-lg shadow">
                <i className="fas fa-paw text-sky-400 mr-2"></i>
                <span className="text-xs font-semibold text-gray-100 ">
                  {getRaceTypeDisplayName(summon.race)}
                </span>
              </div>

              {/* Five Element Tag */}
              {(summon.fiveElement ||
                summonConfig[summon.summonSourceId]?.fiveElement) && (
                <div
                  className={`flex items-center px-3 py-1.5 rounded-lg shadow ${
                    FIVE_ELEMENT_COLORS[
                      summon.fiveElement ||
                        summonConfig[summon.summonSourceId]?.fiveElement
                    ] || "bg-gray-500 text-white"
                  }`}
                >
                  <i className="fas fa-adjust mr-2"></i>
                  <span className="text-xs font-semibold">
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
                const currentBaseAttr = basicAttributes[key] || 0;
                const totalVal =
                  currentBaseAttr + allocatedVal + equipmentBonus;

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
                        {totalVal}
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

      {/* Tooltip Display */}
      {tooltipVisible && tooltipItem && (
        <ItemTooltip item={tooltipItem} position={tooltipPosition} />
      )}

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
