/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 22:46:29
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-22 02:56:33
 */
import { EQUIPMENT_SLOT_TYPES, SKILL_TYPES, ELEMENT_TYPES, RACE_TYPES, PET_TYPES, QUALITY_TYPES, SKILL_MODES, FIVE_ELEMENTS } from './enumConfig';

export const uiText = {
  // 通用文本
  general: {
    loading: "加载中...",
    confirm: "确认",
    cancel: "取消",
    back: "返回",
    save: "保存",
    delete: "删除",
    edit: "编辑",
    unknown: "未知"
  },

  // 标签文本
  labels: {
    level: "等级:",
    quality: "品质:",
    experience: "经验:",
    race: "种族:",
    type: "类型:",
    fiveElement: "五行:",
    currentValue: "当前值:",
    maxValue: "最大值:",
    remainingPoints: "剩余点数:",
    skillCount: "(最多12个)",
  },

  // 标题文本
  titles: {
    coreAttributes: "核心属性",
    equipmentBar: "装备栏",
    basicAttributes: "基础属性",
    skills: "技能",
    petList: "召唤兽列表",
    petDetails: "召唤兽详情",
    skillEditor: "技能编辑",
    equipmentSelector: "装备选择",
    summonModal: "召唤兽",
    playerInfoModal: "角色信息",
    incubatorModal: "孵化器",
    settingsModal: "设置",
    npcPanelModal: "NPC 信息",
    questLogModal: "任务日志",
    formationModal: "阵型设置"
  },

  // 阵型特定文本 (New Section)
  formation: {
    frontRow: "前阵",
    midRow: "中枢",
    backRow: "后阵",
    maxSummonsReached: "阵型已满，最多允许5个召唤兽。",
    summonCount: "当前数量: {count}/5"
  },

  // 属性名称
  attributes: {
    hp: "生命值",
    mp: "法力值",
    physicalAttack: "物理攻击",
    magicalAttack: "法术攻击",
    physicalDefense: "物理防御",
    magicalDefense: "法术防御",
    speed: "速度",
    critRate: "暴击率",
    critDamage: "暴击伤害",
    dodgeRate: "闪避率",
    constitution: "体质",
    strength: "力量",
    agility: "敏捷",
    intelligence: "智力",
    luck: "幸运",
    fireResistance: "火抗性",
    waterResistance: "水抗性",
    thunderResistance: "雷抗性",
    windResistance: "风抗性",
    earthResistance: "土抗性",
    lightResistance: "光抗性",
    darkResistance: "暗抗性",
    mpRecovery: "法力恢复"
  },

  // 装备槽位类型
  equipmentSlots: {
    [EQUIPMENT_SLOT_TYPES.ACCESSORY]: "饰品",
    [EQUIPMENT_SLOT_TYPES.RELIC]: "遗物",
    [EQUIPMENT_SLOT_TYPES.BLOODLINE]: "血脉",
    [EQUIPMENT_SLOT_TYPES.RUNE]: "符文"
  },

  // 技能类型
  skillTypes: {
    [SKILL_TYPES.PHYSICAL]: "物理",
    [SKILL_TYPES.MAGICAL]: "法术",
    [SKILL_TYPES.DEFENSIVE]: "防御",
    [SKILL_TYPES.SUPPORT]: "辅助",
    [SKILL_TYPES.SURVIVAL]: "生存",
    [SKILL_TYPES.SPEED]: "速度"
  },

  // 元素类型
  elementTypes: {
    [ELEMENT_TYPES.PHYSICAL]: "物理",
    [ELEMENT_TYPES.FIRE]: "火",
    [ELEMENT_TYPES.WATER]: "水",
    [ELEMENT_TYPES.THUNDER]: "雷",
    [ELEMENT_TYPES.WIND]: "风",
    [ELEMENT_TYPES.EARTH]: "土",
    [ELEMENT_TYPES.LIGHT]: "光",
    [ELEMENT_TYPES.DARK]: "暗",
    [ELEMENT_TYPES.POISON]: "毒",
    [ELEMENT_TYPES.NATURE]: "自然"
  },

  // 品质类型
  qualityTypes: {
    [QUALITY_TYPES.NORMAL]: "普通",
    [QUALITY_TYPES.RARE]: "稀有",
    [QUALITY_TYPES.EPIC]: "史诗",
    [QUALITY_TYPES.LEGENDARY]: "传说",
    [QUALITY_TYPES.MYTHIC]: "神话"
  },

  // 宠物类型
  petTypes: {
    [PET_TYPES.PHYSICAL]: "物理攻击型",
    [PET_TYPES.MAGICAL]: "法术攻击型",
    [PET_TYPES.DEFENSE]: "生命防御型",
    [PET_TYPES.SPEED]: "速度敏捷型",
    [PET_TYPES.SUPPORT]: "辅助支援型"
  },

  // 种族类型
  raceTypes: {
    [RACE_TYPES.CELESTIAL]: "仙灵",
    [RACE_TYPES.NETHER]: "冥灵",
    [RACE_TYPES.BEAST]: "瑞兽",
    [RACE_TYPES.SPIRIT]: "精怪",
    [RACE_TYPES.MACHINE]: "机关",
    [RACE_TYPES.WARRIOR]: "神兵",
    [RACE_TYPES.ANCIENT_BEAST]: "上古神兽"
  },

  // 技能模式
  skillModes: {
    [SKILL_MODES.PASSIVE]: "被动技能",
    [SKILL_MODES.ACTIVE]: "主动技能"
  },

  // 五行类型
  fiveElements: {
    [FIVE_ELEMENTS.METAL]: "金",
    [FIVE_ELEMENTS.WOOD]: "木",
    [FIVE_ELEMENTS.WATER]: "水",
    [FIVE_ELEMENTS.FIRE]: "火",
    [FIVE_ELEMENTS.EARTH]: "土"
  },

  // 按钮文本
  buttons: {
    petCatalog: "召唤兽图鉴",
    refineHistory: "炼妖历史",
    refineToGetSummon: "炼妖获取召唤兽",
    refine: "炼妖",
    levelUp: "升级",
    resetPoints: "重置点数",
    learnSkill: "学习技能",
    replaceSkill: "替换技能",
    equipItem: "装备",
    unequipItem: "卸下",
    evolve: "进化",
    train: "培养",
    selectSummon: "选择此召唤兽",
    confirmSelect: "确认选择",
    cancelSelect: "取消选择"
  },

  // 提示和消息
  messages: {
    maxLevelReached: "已达到最高等级",
    skillLearnSuccess: "技能学习成功",
    skillLearnFailed: "技能学习失败",
    equipmentSuccess: "装备成功",
    equipmentFailed: "装备失败",
    confirmDelete: "确认要删除吗？",
    confirmReset: "确认要重置吗？",
    saveSuccess: "保存成功",
    saveFailed: "保存失败",
    inventoryFull: "背包已满"
  },

  // 通知消息
  notifications: {
    selectSummonFirst: "请先选择一个召唤兽",
    noSummonData: "当前没有召唤兽数据，请先创建或选择一个召唤兽",
    maxLevelReached: "已达到最高等级",
    skillLearnSuccess: "技能学习成功",
    skillLearnFailed: "技能学习失败",
    equipmentSuccess: "装备成功",
    equipmentFailed: "装备失败"
  },

  // 空状态提示
  emptyStates: {
    noSkills: "暂无技能",
    noEquipment: "暂无装备",
    emptySlot: "空栏位",
    noData: "暂无数据"
  },

  // 任务日志相关文本
  questLog: {
    title: "任务日志", // Missielogboek
    filterActive: "当前", // Huidig
    filterCompleted: "已完成", // Voltooid
    filterAll: "全部", // Alles
    noQuestsInCategory: "此分类中没有任务。", // Geen missies in deze categorie.
    unknownQuest: "未知任务 (ID: {id})", // Onbekende missie (ID: {id})
    rewardsLabel: "奖励:", // Beloningen:
    rewardExperience: "经验:", // Ervaring:
    rewardGold: "金币:", // Goud:
    rewardItems: "物品:", // Items:
    statusLabel: "状态:", // Status:
    statusPendingTurnIn: "待交付", // Wacht op inleveren
    statusInProgress: "进行中", // Bezig
    statusTurnedIn: "已完成", // Voltooid
    statusAvailable: "可接取", // Beschikbaar
    // Voeg hier meer quest-gerelateerde teksten toe indien nodig
  }
};

// 获取属性显示名称
export const getAttributeDisplayName = (key) => {
  return uiText.attributes[key] || key;
};

// 获取技能类型显示名称
export const getSkillTypeDisplayName = (type) => {
  return uiText.skillTypes[type] || uiText.general.unknown;
};

// 获取元素类型显示名称
export const getElementTypeDisplayName = (type) => {
  return uiText.elementTypes[type] || uiText.general.unknown;
};

// 获取种族类型显示名称
export const getRaceTypeDisplayName = (type) => {
  return uiText.raceTypes[type] || uiText.general.unknown;
};

// 获取品质显示名称
export const getQualityDisplayName = (quality) => {
  return uiText.qualityTypes[quality] || uiText.general.unknown;
};

// 获取宠物类型显示名称
export const getPetTypeDisplayName = (type) => {
  return uiText.petTypes[type] || uiText.general.unknown;
};

// 获取技能模式显示名称
export const getSkillModeDisplayName = (mode) => {
  return uiText.skillModes[mode] || uiText.general.unknown;
};

// 获取五行显示名称
export const getFiveElementDisplayName = (element) => {
  return uiText.fiveElements[element] || uiText.general.unknown;
};
