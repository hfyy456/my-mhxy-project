import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { summonConfig } from "@/config/config";
import { selectAllSummons } from "../../../store/slices/summonSlice";
import { generateUniqueId } from "@/utils/idUtils";
import { FIVE_ELEMENTS } from "@/config/enumConfig";
import { getSkillById } from "@/config/skill/skillConfig";

const SummonFusionModal = ({ isOpen, onClose, onFusion }) => {
  const summonsListObject = useSelector(selectAllSummons);
  const summonsList = useMemo(() => Object.values(summonsListObject || {}), [summonsListObject]);
  
  const [selectedSummon1, setSelectedSummon1] = useState(null);
  const [selectedSummon2, setSelectedSummon2] = useState(null);
  const [fusionInProgress, setFusionInProgress] = useState(false);

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setSelectedSummon1(null);
      setSelectedSummon2(null);
      setFusionInProgress(false);
    }
  }, [isOpen]);



  // 计算合成结果
  const calculateFusionResult = (summon1, summon2) => {
    // 获取两个召唤兽的配置
    const summon1Config = summonConfig[summon1.summonSourceId];
    const summon2Config = summonConfig[summon2.summonSourceId];

    if (!summon1Config || !summon2Config) {
      return null;
    }

    // 随机选择一个召唤兽作为基础
    const baseSummon = Math.random() < 0.5 ? summon1 : summon2;
    const baseSummonConfig = baseSummon === summon1 ? summon1Config : summon2Config;
    const secondarySummon = baseSummon === summon1 ? summon2 : summon1;
    
    // 生成合成结果
    const result = {
      id: generateUniqueId('summon'),
      summonSourceId: baseSummon.summonSourceId,
      name: baseSummonConfig.name,
      level: Math.max(1, Math.floor((summon1.level + summon2.level) / 3)),
      basicAttributes: { ...baseSummon.basicAttributes },
      race: baseSummonConfig.race,
      fiveElement: baseSummonConfig.fiveElement,
      // 计算继承的技能
      inheritedSkills: calculateInheritedSkills(baseSummon, secondarySummon),
      parentInfo: {
        parent1Id: summon1.id,
        parent1Name: summon1.name || summon1Config.name,
        parent2Id: summon2.id,
        parent2Name: summon2.name || summon2Config.name
      }
    };

    return result;
  };

  // 计算继承的技能
  const calculateInheritedSkills = (mainParent, secondaryParent) => {
    const inheritedSkills = [];
    const mainSkills = mainParent.skillSet || [];
    const secondarySkills = secondaryParent.skillSet || [];
    
    // 合并两个父母的技能集，去除重复
    const allSkills = [...new Set([...mainSkills, ...secondarySkills].filter(Boolean))];
    
    // 计算遗传概率，如果技能数量较多，降低概率
    const baseInheritChance = 0.3; // 基础遗传概率30%
    const inheritChance = Math.max(0.1, baseInheritChance - (allSkills.length > 6 ? 0.05 : 0)); // 技能多时降低概率
    
    // 对每个技能进行遗传判断
    allSkills.forEach(skill => {
      if (Math.random() < inheritChance) {
        inheritedSkills.push(skill);
      }
    });
    
    return inheritedSkills;
  };

  // 执行合成
  const handleFusion = () => {
    if (!selectedSummon1 || !selectedSummon2) {
      return;
    }
    
    setFusionInProgress(true);
    
    // 计算随机合成结果
    const fusionResult = calculateFusionResult(selectedSummon1, selectedSummon2);
    
    if (!fusionResult) {
      setFusionInProgress(false);
      return;
    }

    // 创建新的召唤兽
    const newSummon = {
      ...fusionResult,
      experience: 0,
      nickname: "",
      equippedItemIds: {},
      skillSet: fusionResult.inheritedSkills || []
    };

    // 调用父组件的合成处理函数
    onFusion(newSummon, selectedSummon1.id, selectedSummon2.id);
    
    // 重置状态
    setSelectedSummon1(null);
    setSelectedSummon2(null);
    setFusionInProgress(false);
    
    // 关闭模态框
    onClose();
  };

  // 获取五行元素对应的颜色
  const getElementColor = (element) => {
    switch (element) {
      case FIVE_ELEMENTS.METAL: return "text-gray-400";
      case FIVE_ELEMENTS.WOOD: return "text-green-500";
      case FIVE_ELEMENTS.WATER: return "text-blue-500";
      case FIVE_ELEMENTS.FIRE: return "text-red-500";
      case FIVE_ELEMENTS.EARTH: return "text-yellow-600";
      default: return "text-white";
    }
  };

  // 获取五行元素对应的图标
  const getElementIcon = (element) => {
    switch (element) {
      case FIVE_ELEMENTS.METAL: return "fa-solid fa-coins";
      case FIVE_ELEMENTS.WOOD: return "fa-solid fa-leaf";
      case FIVE_ELEMENTS.WATER: return "fa-solid fa-water";
      case FIVE_ELEMENTS.FIRE: return "fa-solid fa-fire";
      case FIVE_ELEMENTS.EARTH: return "fa-solid fa-mountain";
      default: return "fa-solid fa-question";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-slate-700 px-4 py-3 flex justify-between items-center">
          <h2 className="text-white font-semibold text-lg">召唤兽合成</h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="p-4 flex-grow overflow-y-auto">
          {/* 选择召唤兽部分 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h3 className="text-white font-medium mb-2">选择第一个召唤兽</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {summonsList.map(summon => (
                  <button
                    key={`summon1_${summon.id}`}
                    onClick={() => setSelectedSummon1(summon)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${
                      selectedSummon1?.id === summon.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600 hover:bg-slate-500 text-gray-200'
                    }`}
                    disabled={selectedSummon2?.id === summon.id}
                  >
                    <div className="flex items-center">
                      <span className="flex-grow">
                        {summon.nickname || summonConfig[summon.summonSourceId]?.name || "未知召唤兽"}
                      </span>
                      <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                        Lv.{summon.level}
                      </span>
                      <i className={`ml-2 ${getElementIcon(summonConfig[summon.summonSourceId]?.fiveElement)} ${getElementColor(summonConfig[summon.summonSourceId]?.fiveElement)}`}></i>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h3 className="text-white font-medium mb-2">选择第二个召唤兽</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {summonsList.map(summon => (
                  <button
                    key={`summon2_${summon.id}`}
                    onClick={() => setSelectedSummon2(summon)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${
                      selectedSummon2?.id === summon.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600 hover:bg-slate-500 text-gray-200'
                    }`}
                    disabled={selectedSummon1?.id === summon.id}
                  >
                    <div className="flex items-center">
                      <span className="flex-grow">
                        {summon.nickname || summonConfig[summon.summonSourceId]?.name || "未知召唤兽"}
                      </span>
                      <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                        Lv.{summon.level}
                      </span>
                      <i className={`ml-2 ${getElementIcon(summonConfig[summon.summonSourceId]?.fiveElement)} ${getElementColor(summonConfig[summon.summonSourceId]?.fiveElement)}`}></i>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 选择了两个召唤兽后显示合成信息 */}
          {selectedSummon1 && selectedSummon2 && (
            <div className="bg-slate-700/50 p-4 rounded-lg mb-4">
              <h4 className="text-white font-medium mb-2">选择的召唤兽</h4>
              <p className="text-gray-300 text-sm mb-4">
                合成后，原有的两个召唤兽将被消耗，随机生成一个新的召唤兽。
                每个技能有30%的概率被继承，如果技能数量较多，概率会适当降低。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800 p-3 rounded-md">
                  <div className="flex items-center">
                    <h5 className="text-white flex-grow">
                      {selectedSummon1?.nickname || summonConfig[selectedSummon1?.summonSourceId]?.name || "未知召唤兽"}
                    </h5>
                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                      Lv.{selectedSummon1?.level}
                    </span>
                    <i className={`ml-2 ${getElementIcon(summonConfig[selectedSummon1?.summonSourceId]?.fiveElement)} ${getElementColor(summonConfig[selectedSummon1?.summonSourceId]?.fiveElement)}`}></i>
                  </div>
                  {selectedSummon1?.skillSet?.filter(Boolean).length > 0 && (
                    <div className="mt-2">
                      <h6 className="text-xs text-gray-400 mb-1">技能:</h6>
                      <div className="flex flex-wrap gap-1">
                        {selectedSummon1.skillSet.filter(Boolean).map((skillId, idx) => {
                          const skillInfo = getSkillById(skillId);
                          return (
                            <div key={`s1_skill_${idx}`} className="relative group">
                              <span className="text-xs bg-slate-700 px-2 py-1 rounded flex items-center">
                                {skillInfo?.icon && <i className={`fas ${skillInfo.icon} mr-1 text-xs`}></i>}
                                {skillInfo?.name || skillId}
                              </span>
                              <div className="absolute z-10 hidden group-hover:block bg-slate-800 p-2 rounded shadow-lg min-w-[200px] text-xs text-gray-300 top-full left-0 mt-1">
                                <p className="font-medium text-white mb-1">{skillInfo?.name || skillId}</p>
                                <p>{skillInfo?.description || "无描述"}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-slate-800 p-3 rounded-md">
                  <div className="flex items-center">
                    <h5 className="text-white flex-grow">
                      {selectedSummon2?.nickname || summonConfig[selectedSummon2?.summonSourceId]?.name || "未知召唤兽"}
                    </h5>
                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                      Lv.{selectedSummon2?.level}
                    </span>
                    <i className={`ml-2 ${getElementIcon(summonConfig[selectedSummon2?.summonSourceId]?.fiveElement)} ${getElementColor(summonConfig[selectedSummon2?.summonSourceId]?.fiveElement)}`}></i>
                  </div>
                  {selectedSummon2?.skillSet?.filter(Boolean).length > 0 && (
                    <div className="mt-2">
                      <h6 className="text-xs text-gray-400 mb-1">技能:</h6>
                      <div className="flex flex-wrap gap-1">
                        {selectedSummon2.skillSet.filter(Boolean).map((skillId, idx) => {
                          const skillInfo = getSkillById(skillId);
                          return (
                            <div key={`s2_skill_${idx}`} className="relative group">
                              <span className="text-xs bg-slate-700 px-2 py-1 rounded flex items-center">
                                {skillInfo?.icon && <i className={`fas ${skillInfo.icon} mr-1 text-xs`}></i>}
                                {skillInfo?.name || skillId}
                              </span>
                              <div className="absolute z-10 hidden group-hover:block bg-slate-800 p-2 rounded shadow-lg min-w-[200px] text-xs text-gray-300 top-full left-0 mt-1">
                                <p className="font-medium text-white mb-1">{skillInfo?.name || skillId}</p>
                                <p>{skillInfo?.description || "无描述"}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-slate-700 px-4 py-3 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors"
          >
            取消
          </button>
          
          <button
            onClick={handleFusion}
            disabled={!selectedSummon1 || !selectedSummon2 || fusionInProgress}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedSummon1 && selectedSummon2 && !fusionInProgress
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-slate-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {fusionInProgress ? '合成中...' : '确认合成'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummonFusionModal;
