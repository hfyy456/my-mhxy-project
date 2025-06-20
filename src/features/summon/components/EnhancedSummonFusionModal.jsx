/**
 * 增强版召唤兽合成模态框
 * 提供完整的合成功能和美观的用户界面
 */

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { summonConfig } from "@/config/config";
import { generateUniqueId } from "@/utils/idUtils";
import { FIVE_ELEMENTS } from "@/config/enumConfig";
import { getSkillById } from "@/config/skill/skillConfig";
import { useSummonManager } from "../../../hooks/useSummonManager";
import summonFusionManager from "../../../store/SummonFusionManager";
import { FUSION_MATERIALS } from "../../../config/gachaConfig";

// 动画样式
const animationStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .animate-fadeInScale {
    animation: fadeInScale 0.6s ease-out forwards;
  }
`;

// 注入样式
if (!document.getElementById('fusion-modal-styles')) {
  const style = document.createElement('style');
  style.id = 'fusion-modal-styles';
  style.textContent = animationStyles;
  document.head.appendChild(style);
}

const EnhancedSummonFusionModal = ({ isOpen, onClose, onFusion }) => {
  const { allSummons: rawSummonsList, deleteSummon } = useSummonManager();
  
  // 安全地处理summonsList，确保它是数组
  const summonsList = useMemo(() => {
    if (!rawSummonsList) return [];
    if (Array.isArray(rawSummonsList)) return rawSummonsList;
    if (typeof rawSummonsList === 'object') return Object.values(rawSummonsList);
    return [];
  }, [rawSummonsList]);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSummon1, setSelectedSummon1] = useState(null);
  const [selectedSummon2, setSelectedSummon2] = useState(null);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [fusionResult, setFusionResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSummonSelector, setShowSummonSelector] = useState({ type: null, show: false });
  const [preview, setPreview] = useState(null);

  // 初始化材料
  useEffect(() => {
    if (isOpen) {
      summonFusionManager.initializeMaterials({
        beast_pill: 5,
        five_element_stone: 3,
        soul_crystal: 2
      });
    }
  }, [isOpen]);

  // 计算预览
  useEffect(() => {
    if (selectedSummon1 && selectedSummon2) {
      const newPreview = summonFusionManager.calculateFusionPreview(
        selectedSummon1, 
        selectedSummon2, 
        selectedMaterials
      );
      setPreview(newPreview);
    }
  }, [selectedSummon1, selectedSummon2, selectedMaterials]);

  const handleFusion = async () => {
    if (!selectedSummon1 || !selectedSummon2) return;

    setIsProcessing(true);
    try {
      const result = await summonFusionManager.performFusion(
        selectedSummon1,
        selectedSummon2,
        selectedMaterials,
        selectedElement
      );
      setFusionResult(result);
      setCurrentStep(4);
      
      if (result.success && result.newSummon) {
        // 添加新召唤兽
        onFusion(result.newSummon);
        
        // 删除原来的父母召唤兽
        if (result.parentSummonsToDelete && result.parentSummonsToDelete.length > 0) {
          for (const summonId of result.parentSummonsToDelete) {
            try {
              deleteSummon(summonId);
              console.log(`已删除召唤兽: ${summonId}`);
            } catch (error) {
              console.error(`删除召唤兽失败 ${summonId}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('合成失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setCurrentStep(1);
    setSelectedSummon1(null);
    setSelectedSummon2(null);
    setSelectedMaterials([]);
    setSelectedElement(null);
    setFusionResult(null);
    setShowSummonSelector({ type: null, show: false });
    setPreview(null);
  };

  const getElementColor = (element) => {
    const colors = {
      [FIVE_ELEMENTS.METAL]: 'from-yellow-400 to-amber-600',
      [FIVE_ELEMENTS.WOOD]: 'from-green-400 to-emerald-600', 
      [FIVE_ELEMENTS.WATER]: 'from-blue-400 to-cyan-600',
      [FIVE_ELEMENTS.FIRE]: 'from-red-400 to-orange-600',
      [FIVE_ELEMENTS.EARTH]: 'from-yellow-600 to-orange-700'
    };
    return colors[element] || 'from-gray-400 to-gray-600';
  };

  const getElementIcon = (element) => {
    const icons = {
      [FIVE_ELEMENTS.METAL]: '⚔️',
      [FIVE_ELEMENTS.WOOD]: '🌳',
      [FIVE_ELEMENTS.WATER]: '💧',
      [FIVE_ELEMENTS.FIRE]: '🔥',
      [FIVE_ELEMENTS.EARTH]: '⛰️'
    };
    return icons[element] || '⭐';
  };

  if (!isOpen) return null;

  // 召唤兽选择器组件
  const SummonSelector = ({ type, onSelect, selectedSummon, excludeSummon }) => (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
      onClick={() => setShowSummonSelector({ type: null, show: false })}
    >
      <div 
        className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">选择{type === 1 ? '第一只' : '第二只'}召唤兽</h3>
          <button
            onClick={() => setShowSummonSelector({ type: null, show: false })}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2">
          {summonsList.length > 0 ? (
            summonsList
              .filter(s => s && s.id !== excludeSummon?.id)
              .map(summon => (
                <button
                  key={summon.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(summon);
                    setShowSummonSelector({ type: null, show: false });
                  }}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                    selectedSummon?.id === summon.id
                      ? 'border-amber-500 bg-amber-500/20'
                      : 'border-slate-600 bg-slate-700/50 hover:border-amber-500/50'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br ${getElementColor(summon.fiveElement)} flex items-center justify-center text-2xl`}>
                      {getElementIcon(summon.fiveElement)}
                    </div>
                    <div className="text-white font-medium text-sm">
                      {summon.nickname || summon.name}
                    </div>
                    <div className="text-gray-400 text-xs">
                      Lv.{summon.level}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      技能: {summon.skillSet?.length || 0}个
                    </div>
                  </div>
                </button>
              ))
          ) : (
            <div className="col-span-full text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">😔</div>
              <div>暂无可用的召唤兽</div>
              <div className="text-sm mt-1">请先获得一些召唤兽</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 主界面内容
  const MainContent = () => (
    <div className="h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex justify-between items-center p-6 border-b border-amber-700/30">
        <h2 className="text-2xl font-bold text-white">高级召唤兽合成</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-2xl transition-colors"
        >
          ×
        </button>
      </div>

      {/* 主要内容区 */}
      <div className="flex-1 p-6 flex gap-6">
        {/* 左侧：召唤兽选择区 */}
        <div className="flex-1 space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">选择合成召唤兽</h3>
          
          {/* 召唤兽卡片 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 第一只召唤兽 */}
            <div
              onClick={() => setShowSummonSelector({ type: 1, show: true })}
              className="border-2 border-dashed border-blue-500/50 rounded-xl p-6 hover:border-blue-500 transition-all cursor-pointer bg-blue-500/10 hover:bg-blue-500/20"
            >
              {selectedSummon1 ? (
                <div className="text-center">
                  <div className={`w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br ${getElementColor(selectedSummon1.fiveElement)} flex items-center justify-center text-3xl`}>
                    {getElementIcon(selectedSummon1.fiveElement)}
                  </div>
                  <div className="text-white font-bold">
                    {selectedSummon1.nickname || selectedSummon1.name}
                  </div>
                  <div className="text-blue-300 text-sm">
                    Lv.{selectedSummon1.level}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    技能: {selectedSummon1.skillSet?.length || 0}个
                  </div>
                </div>
              ) : (
                <div className="text-center text-blue-300">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full border-2 border-dashed border-blue-500/50 flex items-center justify-center text-3xl">
                    +
                  </div>
                  <div className="font-medium">点击选择第一只召唤兽</div>
                </div>
              )}
            </div>

            {/* 第二只召唤兽 */}
            <div
              onClick={() => setShowSummonSelector({ type: 2, show: true })}
              className="border-2 border-dashed border-purple-500/50 rounded-xl p-6 hover:border-purple-500 transition-all cursor-pointer bg-purple-500/10 hover:bg-purple-500/20"
            >
              {selectedSummon2 ? (
                <div className="text-center">
                  <div className={`w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br ${getElementColor(selectedSummon2.fiveElement)} flex items-center justify-center text-3xl`}>
                    {getElementIcon(selectedSummon2.fiveElement)}
                  </div>
                  <div className="text-white font-bold">
                    {selectedSummon2.nickname || selectedSummon2.name}
                  </div>
                  <div className="text-purple-300 text-sm">
                    Lv.{selectedSummon2.level}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    技能: {selectedSummon2.skillSet?.length || 0}个
                  </div>
                </div>
              ) : (
                <div className="text-center text-purple-300">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full border-2 border-dashed border-purple-500/50 flex items-center justify-center text-3xl">
                    +
                  </div>
                  <div className="font-medium">点击选择第二只召唤兽</div>
                </div>
              )}
            </div>
          </div>

          {/* 合成材料选择 */}
          {selectedSummon1 && selectedSummon2 && (
            <div className="mt-6">
              <h4 className="text-white font-bold mb-3">合成材料</h4>
              <div className="grid grid-cols-3 gap-3">
                {Object.values(FUSION_MATERIALS).map(material => (
                  <button
                    key={material.id}
                    onClick={() => {
                      if (selectedMaterials.includes(material.id)) {
                        setSelectedMaterials(prev => prev.filter(id => id !== material.id));
                      } else {
                        setSelectedMaterials(prev => [...prev, material.id]);
                      }
                    }}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      selectedMaterials.includes(material.id)
                        ? 'border-amber-500 bg-amber-500/20'
                        : 'border-slate-600 bg-slate-700/30 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="text-white font-medium text-sm">
                      {material.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {material.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右侧：合成预览和结果 */}
        <div className="flex-1">
          {fusionResult ? (
            /* 合成结果 */
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-6">合成结果</h3>
              
              {fusionResult.success ? (
                <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-6 border border-green-500/30">
                  <div className="animate-bounce mb-4">
                    <div className="text-6xl">🎉</div>
                  </div>
                  
                  <div className="text-green-300 font-bold text-lg mb-4">
                    合成成功！
                  </div>
                  
                  {fusionResult.newSummon && (
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${getElementColor(fusionResult.newSummon.fiveElement)} flex items-center justify-center text-4xl`}>
                        {getElementIcon(fusionResult.newSummon.fiveElement)}
                      </div>
                      
                      <div className="text-white font-bold text-lg">
                        {fusionResult.newSummon.nickname}
                      </div>
                      <div className="text-gray-300 text-sm mb-2">
                        {fusionResult.newSummon.name} | Lv.{fusionResult.newSummon.level}
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        继承技能: {fusionResult.inheritedSkills?.length || 0}个
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 space-y-1">
                    {fusionResult.messages?.map((msg, index) => (
                      <div key={index} className="text-sm text-green-200">
                        {msg.message}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-red-900/50 to-pink-900/50 rounded-xl p-6 border border-red-500/30">
                  <div className="text-4xl mb-4">💔</div>
                  <div className="text-red-300 font-bold text-lg mb-4">
                    合成失败
                  </div>
                  <div className="text-red-200 text-sm">
                    {fusionResult.messages?.[0]?.message || '合成过程中出现了问题'}
                  </div>
                </div>
              )}
              
              <button
                onClick={reset}
                className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-lg text-white font-bold transition-all"
              >
                重新合成
              </button>
            </div>
          ) : preview ? (
            /* 合成预览 */
            <div>
              <h3 className="text-xl font-bold text-white mb-6 text-center">合成预览</h3>
              
              {/* 成功率 */}
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">成功率</span>
                  <span className="text-white font-bold">
                    {Math.round(preview.successRate * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000"
                    style={{ width: `${preview.successRate * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* 预期属性 */}
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <h4 className="text-white font-medium mb-3">预期属性</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">体质:</span>
                    <span className="text-white">{preview.predictedAttributes?.constitution || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">力量:</span>
                    <span className="text-white">{preview.predictedAttributes?.strength || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">敏捷:</span>
                    <span className="text-white">{preview.predictedAttributes?.agility || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">智力:</span>
                    <span className="text-white">{preview.predictedAttributes?.intelligence || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">幸运:</span>
                    <span className="text-white">{preview.predictedAttributes?.luck || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">等级:</span>
                    <span className="text-white">{preview.predictedLevel}</span>
                  </div>
                </div>
              </div>

              {/* 技能继承 */}
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                <h4 className="text-white font-medium mb-3">技能继承预览</h4>
                
                {/* 统计信息 */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <div className="text-blue-300 font-bold">
                      {preview.individualSkillInheritance?.length || 0}
                    </div>
                    <div className="text-gray-400">总技能数</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <div className="text-amber-300 font-bold">
                      {preview.individualSkillInheritance?.filter(skill => skill.fromSummon1 && skill.fromSummon2).length || 0}
                    </div>
                    <div className="text-gray-400">共同技能</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <div className="text-green-300 font-bold">
                      {Math.round((preview.individualSkillInheritance?.reduce((sum, skill) => sum + skill.inheritChance, 0) || 0))}
                    </div>
                    <div className="text-gray-400">预期继承数</div>
                  </div>
                </div>

                {/* 技能列表 */}
                {preview.individualSkillInheritance && preview.individualSkillInheritance.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {preview.individualSkillInheritance
                      .sort((a, b) => {
                        // 共同技能优先
                        if ((a.fromSummon1 && a.fromSummon2) !== (b.fromSummon1 && b.fromSummon2)) {
                          return (b.fromSummon1 && b.fromSummon2) - (a.fromSummon1 && a.fromSummon2);
                        }
                        // 按继承概率排序
                        return b.inheritChance - a.inheritChance;
                      })
                      .map((skill, index) => {
                        const skillInfo = getSkillById(skill.skillId);
                        const isCommon = skill.fromSummon1 && skill.fromSummon2;
                        const inheritPercent = Math.round(skill.inheritChance * 100);
                        
                        // 概率条颜色
                        let progressColor = 'from-red-500 to-red-600';
                        if (inheritPercent >= 70) progressColor = 'from-green-500 to-green-600';
                        else if (inheritPercent >= 50) progressColor = 'from-yellow-500 to-yellow-600';
                        else if (inheritPercent >= 30) progressColor = 'from-orange-500 to-orange-600';

                        return (
                          <div 
                            key={skill.skillId} 
                            className={`p-3 rounded-lg border transition-all ${
                              isCommon 
                                ? 'border-amber-500/50 bg-amber-500/10' 
                                : 'border-slate-600/50 bg-slate-700/30'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {isCommon && <span className="text-amber-400">👑</span>}
                                <span className="text-white font-medium text-sm">
                                  {skillInfo?.name || skill.skillId}
                                </span>
                                <span className="text-xs text-gray-400">
                                  来自: {
                                    isCommon ? '双方' :
                                    skill.fromSummon1 ? (selectedSummon1.nickname || selectedSummon1.name) :
                                    (selectedSummon2.nickname || selectedSummon2.name)
                                  }
                                </span>
                              </div>
                              <span className={`text-sm font-bold ${
                                inheritPercent >= 70 ? 'text-green-300' :
                                inheritPercent >= 50 ? 'text-yellow-300' :
                                inheritPercent >= 30 ? 'text-orange-300' : 'text-red-300'
                              }`}>
                                {inheritPercent}%
                              </span>
                            </div>
                            
                            {/* 继承概率条 */}
                            <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
                              <div 
                                className={`h-full bg-gradient-to-r ${progressColor} rounded-full transition-all duration-500`}
                                style={{ width: `${inheritPercent}%` }}
                              />
                            </div>
                            
                            {/* 技能描述 */}
                            {skillInfo?.description && (
                              <div className="text-xs text-gray-400 leading-relaxed">
                                {skillInfo.description}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    <div className="text-2xl mb-2">🚫</div>
                    <div>没有可继承的技能</div>
                  </div>
                )}
              </div>

              {/* 合成按钮 */}
              <button
                onClick={handleFusion}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 px-6 py-4 rounded-lg text-white font-bold text-lg transition-all disabled:cursor-not-allowed"
              >
                {isProcessing ? '合成中...' : '开始合成'}
              </button>
            </div>
          ) : (
            /* 等待选择 */
            <div className="text-center text-gray-400 mt-20">
              <div className="text-6xl mb-4">🧙‍♂️</div>
              <div className="text-lg">请选择两只召唤兽开始合成</div>
              <div className="text-sm mt-2">选择后可以预览合成效果</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col border border-amber-700/30"
        onClick={(e) => e.stopPropagation()}
      >
        <MainContent />
      </div>
      
      {/* 召唤兽选择弹窗 */}
      {showSummonSelector.show && (
        <SummonSelector
          type={showSummonSelector.type}
          onSelect={showSummonSelector.type === 1 ? setSelectedSummon1 : setSelectedSummon2}
          selectedSummon={showSummonSelector.type === 1 ? selectedSummon1 : selectedSummon2}
          excludeSummon={showSummonSelector.type === 1 ? selectedSummon2 : selectedSummon1}
        />
      )}
    </div>,
    document.body
  );
};

export default EnhancedSummonFusionModal; 