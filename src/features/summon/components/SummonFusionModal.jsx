import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { summonConfig } from "@/config/config";
// import { selectAllSummons } from "../../../store/slices/summonSlice"; // 已移除Redux召唤兽系统
import { generateUniqueId } from "@/utils/idUtils";
import { FIVE_ELEMENTS } from "@/config/enumConfig";
import { getSkillById } from "@/config/skill/skillConfig";
import { useSummonManager } from "../../../hooks/useSummonManager"; // 使用OOP召唤兽系统

const SummonFusionModal = ({ isOpen, onClose, onFusion }) => {
  // const summonsListObject = useSelector(selectAllSummons); // 已移除Redux召唤兽系统
  // const summonsList = useMemo(() => Object.values(summonsListObject || {}), [summonsListObject]);
  
  // 使用OOP召唤兽系统
  const { allSummons } = useSummonManager();
  const summonsList = useMemo(() => Object.values(allSummons || {}), [allSummons]);
  
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
      <div className="bg-theme-modal rounded-lg p-6 max-w-2xl w-full mx-4 border border-theme-dark">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-theme-dark">召唤兽融合</h3>
          <button
            onClick={onClose}
            className="text-theme-secondary hover:text-theme-dark"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 主召唤兽 */}
          <div className="bg-theme-light border border-theme-dark rounded-lg p-4">
            <h4 className="text-lg font-medium text-theme-dark mb-4">主召唤兽</h4>
            {selectedSummon1 ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-theme-light rounded-lg flex items-center justify-center">
                  <img
                    src={summonConfig[selectedSummon1.summonSourceId]?.icon}
                    alt={summonConfig[selectedSummon1.summonSourceId]?.name}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div>
                  <h5 className="text-base font-medium text-theme-dark">
                    {selectedSummon1.nickname || summonConfig[selectedSummon1.summonSourceId]?.name}
                  </h5>
                  <p className="text-sm text-theme-secondary">
                    等级: {selectedSummon1.level}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-theme-secondary">请选择主召唤兽</p>
              </div>
            )}
          </div>

          {/* 材料召唤兽 */}
          <div className="bg-theme-light border border-theme-dark rounded-lg p-4">
            <h4 className="text-lg font-medium text-theme-dark mb-4">材料召唤兽</h4>
            {selectedSummon2 ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-theme-light rounded-lg flex items-center justify-center">
                  <img
                    src={summonConfig[selectedSummon2.summonSourceId]?.icon}
                    alt={summonConfig[selectedSummon2.summonSourceId]?.name}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div>
                  <h5 className="text-base font-medium text-theme-dark">
                    {selectedSummon2.nickname || summonConfig[selectedSummon2.summonSourceId]?.name}
                  </h5>
                  <p className="text-sm text-theme-secondary">
                    等级: {selectedSummon2.level}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-theme-secondary">请选择材料召唤兽</p>
              </div>
            )}
          </div>
        </div>

        {/* 融合结果预览 */}
        <div className="mt-6 bg-theme-light border border-theme-dark rounded-lg p-4">
          <h4 className="text-lg font-medium text-theme-dark mb-4">融合结果预览</h4>
          {fusionInProgress ? (
            <div className="text-center py-4">
              <p className="text-theme-secondary">
                合成中...
              </p>
            </div>
          ) : selectedSummon1 && selectedSummon2 ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-theme-light rounded-lg flex items-center justify-center">
                <img
                  src={summonConfig[fusionResult.summonSourceId]?.icon}
                  alt={fusionResult.name}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div>
                <h5 className="text-base font-medium text-theme-dark">
                  {fusionResult.name}
                </h5>
                <p className="text-sm text-theme-secondary">
                  等级: {fusionResult.level}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-theme-secondary">
                选择两个召唤兽后显示融合结果
              </p>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-theme-dark hover:bg-theme-primary text-theme-light rounded"
          >
            取消
          </button>
          <button
            onClick={handleFusion}
            disabled={!selectedSummon1 || !selectedSummon2 || fusionInProgress}
            className={`px-4 py-2 rounded ${
              selectedSummon1 && selectedSummon2 && !fusionInProgress
                ? "bg-theme-primary hover:bg-theme-primary-light text-white"
                : "bg-theme-light text-theme-secondary cursor-not-allowed"
            }`}
          >
            {fusionInProgress ? '合成中...' : '确认融合'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummonFusionModal;
