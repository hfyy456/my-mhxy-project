import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSummonManager } from "@/hooks/useSummonManager";
import summonFusionManager from "@/store/SummonFusionManager";
import { FIVE_ELEMENTS, SUMMON_NATURE_CONFIG, FIVE_ELEMENT_COLORS } from "@/config/enumConfig";
import { summonConfig } from '@/config/summon/summonConfig';
import { getSkillById } from '@/config/skill/skillConfig';
import { getAttributeDisplayName, getSummonNatureTypeDisplayName, getFiveElementDisplayName } from '@/config/ui/uiTextConfig';
import { personalityConfig, getPersonalityDisplayName } from '@/config/summon/personalityConfig';

// Correctly load all summon sprites using Vite's glob import
const images = import.meta.glob("@/assets/summons/*.png", { eager: true });

// Move getSummonSprite to the top-level scope to be accessible by all components in this file.
const getSummonSprite = (summonSourceId) => {
  if (!summonSourceId) return images['/src/assets/summons/default.png']?.default || '';
  const path = `/src/assets/summons/${summonSourceId}.png`;
  return images[path]?.default || images['/src/assets/summons/default.png']?.default || '';
};

const TabButton = ({ isActive, onClick, children }) => (
  <button
    className={`px-6 py-3 text-lg font-semibold transition-all duration-300 border-b-4 ${
      isActive
        ? 'text-yellow-300 border-yellow-400'
        : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

const SummonResultDetail = ({ summon }) => {
  if (!summon) return null;

  const renderStat = (label, value, isPercent = false) => (
    <div className="flex justify-between items-center text-sm py-1.5">
      <span className="text-gray-400">{label}</span>
      <span className="font-mono text-white tracking-wider">{isPercent ? `${(value * 100).toFixed(0)}%` : Math.floor(value)}</span>
    </div>
  );

  return (
    <div className="bg-black/20 p-6 rounded-lg border border-gray-700 w-full">
        <div className="text-center mb-6">
            <h3 className="text-3xl font-bold text-white">{summon.nickname || summonConfig[summon.summonSourceId]?.name}</h3>
            <p className="text-gray-400 text-md">等级: {summon.level}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Basic Attributes */}
            <div>
                <h4 className="text-lg font-semibold text-yellow-300 mb-3 border-b border-yellow-500/30 pb-2">基础属性</h4>
                <div className="space-y-1">
                    {summon.basicAttributes && Object.entries(summon.basicAttributes).map(([key, value]) => 
                        renderStat(getAttributeDisplayName(key) || key, value)
                    )}
                </div>
            </div>

            {/* Column 2: Growth Aptitudes */}
            <div>
                <h4 className="text-lg font-semibold text-yellow-300 mb-3 border-b border-yellow-500/30 pb-2">成长资质</h4>
                <div className="space-y-1">
                    {summon.aptitudeRatios && Object.entries(summon.aptitudeRatios).map(([key, value]) =>
                        renderStat(getAttributeDisplayName(key), value, true)
                    )}
                </div>
            </div>

            {/* Column 3: Skills */}
            <div>
                <h4 className="text-lg font-semibold text-yellow-300 mb-3 border-b border-yellow-500/30 pb-2">持有技能</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {summon.skillSet.length > 0 ? summon.skillSet.map(skillId => {
                        const skill = getSkillById(skillId);
                        return (
                            <div key={skillId} className="text-sm bg-gray-800/60 p-2 rounded">
                                <p className="font-semibold text-cyan-400">{skill?.name || "未知技能"}</p>
                                <p className="text-xs text-gray-400">{skill?.description || "暂无描述"}</p>
                            </div>
                        )
                    }) : (
                        <div className="text-center text-gray-500 py-4 h-full flex items-center justify-center">
                            <p>该召唤兽没有携带任何技能</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

const SummonSelectionModal = ({ isOpen, onClose, summons, onSelect, excludeId }) => {
  if (!isOpen) return null;

  const [selectedSummon, setSelectedSummon] = useState(null);
  const availableSummons = summons.filter(s => s.id !== excludeId);
  
  // Set initial selection
  useEffect(() => {
    if (availableSummons.length > 0) {
      setSelectedSummon(availableSummons[0]);
    } else {
      setSelectedSummon(null);
    }
  }, [isOpen]);

  const renderStat = (label, value, isPercent = false) => (
    <div className="flex justify-between items-center text-sm py-2">
      <span className="text-gray-400">{label}</span>
      <span className="font-mono text-white tracking-wider">{isPercent ? `${(value * 100).toFixed(0)}%` : Math.floor(value)}</span>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
      <div className="bg-gray-900/90 backdrop-blur-sm border border-yellow-500/10 rounded-xl p-4 w-full max-w-6xl h-[85vh] flex gap-6">
        
        {/* Left Side: Summon List */}
        <div className="w-1/4 flex flex-col bg-black/20 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-yellow-400 mb-4 flex-shrink-0 text-center">选择召唤兽</h2>
            <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-2">
              {availableSummons.map(summon => {
                const isSelected = selectedSummon && summon.id === selectedSummon.id;
                return (
                    <div 
                      key={summon.id} 
                      className={`px-4 py-2 rounded-lg border transition-all cursor-pointer ${isSelected ? 'bg-yellow-500/20 border-yellow-500' : 'bg-gray-800/50 border-gray-700 hover:border-yellow-500/50'}`}
                      onMouseEnter={() => setSelectedSummon(summon)}
                      onClick={() => {
                        onSelect(summon);
                        onClose();
                      }}
                    >
                      <p className="font-bold text-white text-base">{summon.nickname || summonConfig[summon.summonSourceId]?.name}</p>
                      <p className="text-sm text-gray-400">等级: {summon.level}</p>
                    </div>
                )
              })}
            </div>
        </div>

        {/* Right Side: Preview Panel */}
        <div className="w-3/4 bg-black/10 rounded-lg p-8 flex flex-col relative">
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white text-2xl z-10">
                <i className="fas fa-times"></i>
            </button>

            {selectedSummon ? (
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h3 className="text-4xl font-bold text-white">{selectedSummon.nickname || summonConfig[selectedSummon.summonSourceId]?.name}</h3>
                        <p className="text-gray-400 text-lg">等级: {selectedSummon.level}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-10 flex-grow">
                        {/* Column 1: Basic Attributes */}
                        <div>
                            <h4 className="text-xl font-semibold text-yellow-300 mb-4 border-b-2 border-yellow-500/50 pb-2 inline-block">基础属性</h4>
                            <div className="space-y-1">
                                {Object.entries(selectedSummon.basicAttributes).map(([key, value]) => 
                                    renderStat(getAttributeDisplayName(key) || key, value)
                                )}
                            </div>
                        </div>

                        {/* Column 2: Growth Aptitudes */}
                        <div>
                            <h4 className="text-xl font-semibold text-yellow-300 mb-4 border-b-2 border-yellow-500/50 pb-2 inline-block">成长资质</h4>
                            <div className="space-y-1">
                                {Object.entries(selectedSummon.aptitudeRatios).map(([key, value]) =>
                                    renderStat(getAttributeDisplayName(key), value, true)
                                )}
                            </div>
                        </div>

                        {/* Column 3: Skills */}
                        <div>
                            <h4 className="text-xl font-semibold text-yellow-300 mb-4 border-b-2 border-yellow-500/50 pb-2 inline-block">持有技能</h4>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                {selectedSummon.skillSet.length > 0 ? selectedSummon.skillSet.map(skillId => {
                                    const skill = getSkillById(skillId);
                                    return (
                                        <div key={skillId} className="text-sm bg-gray-800/80 p-3 rounded-lg">
                                            <p className="font-semibold text-cyan-300">{skill?.name || "未知技能"}</p>
                                            <p className="text-xs text-gray-400">{skill?.description || "暂无描述"}</p>
                                        </div>
                                    )
                                }) : (
                                    <div className="text-center text-gray-500 py-4 h-full flex items-center justify-center">
                                        <p>该召唤兽没有携带任何技能</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                     <div className="flex justify-center mt-8">
                        <button 
                            onClick={() => {
                                onSelect(selectedSummon);
                                onClose();
                            }}
                            className="w-full max-w-sm px-6 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-bold transition-all shadow-lg hover:shadow-green-500/40"
                        >
                            选择 {selectedSummon.nickname || summonConfig[selectedSummon.summonSourceId]?.name}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <i className="fas fa-eye text-5xl mb-4"></i>
                    <p>请在左侧选择一只召唤兽以预览</p>
                </div>
            )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const SummonCard = ({ summon, onSelect, emptyText = "尚未选择", children }) => {
  if (!summon) {
    return (
      <div 
        className="bg-gray-800/50 p-4 rounded-lg text-center border-2 border-dashed border-gray-600 h-full flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 transition-colors"
        onClick={onSelect}
      >
        <i className="fas fa-plus-circle text-4xl text-gray-500 mb-2"></i>
        <p className="font-bold text-gray-400">{emptyText}</p>
      </div>
    );
  }
  
  const config = summonConfig[summon.summonSourceId] || {};
  return (
    <div className="bg-gray-800/80 p-4 rounded-lg text-center border border-gray-700 shadow-lg h-full flex flex-col items-center justify-center relative" onClick={onSelect}>
      <img src={getSummonSprite(summon.summonSourceId)} alt={config.name || 'Summon'} className="w-28 h-28 mx-auto mb-3 object-contain"/>
      <p className="font-bold text-lg text-white">{summon.nickname || config.name}</p>
      <p className="text-base text-gray-300">等级: {summon.level}</p>
      {children && <div className="mt-4 w-full">{children}</div>}
    </div>
  );
};

const CompactSummonSelector = ({ summon, onSelect, emptyText, side }) => {
  const sideClass = side === 'left' ? 'items-start text-left' : 'items-end text-right';
  const borderClass = side === 'left' ? 'border-r-2' : 'border-l-2';

  const renderStat = (label, value, isPercent = false) => (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-mono text-white tracking-wider">{isPercent ? `${(value * 100).toFixed(0)}%` : Math.floor(value)}</span>
    </div>
  );

  return (
    <div className={`flex flex-col justify-center p-4 h-full ${sideClass} ${borderClass} border-yellow-500/10`}>
      {summon ? (
        <div className="flex flex-col items-center gap-3 w-full">
          <img src={getSummonSprite(summon.summonSourceId)} alt={summon.name} className="w-24 h-24 rounded-full border-4 border-gray-600 shadow-lg"/>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{summon.nickname || summonConfig[summon.summonSourceId]?.name}</p>
            <p className="text-md text-gray-400">等级: {summon.level}</p>
          </div>
           <div className="flex flex-wrap justify-center gap-1.5 my-1">
              {/* Nature Type Tag */}
              {summon.natureType && SUMMON_NATURE_CONFIG[summon.natureType] && (
                <div 
                  className={`flex items-center px-2 py-0.5 rounded-full text-xs shadow-sm cursor-help ${SUMMON_NATURE_CONFIG[summon.natureType].bgColor || 'bg-slate-600/50'}`}
                  title={`自然属性: ${getSummonNatureTypeDisplayName(summon.natureType)} - ${SUMMON_NATURE_CONFIG[summon.natureType].description}`}
                >
                  <i className={`fas mr-1 ${SUMMON_NATURE_CONFIG[summon.natureType].icon} ${SUMMON_NATURE_CONFIG[summon.natureType].color}`}></i>
                  <span className={SUMMON_NATURE_CONFIG[summon.natureType].color || 'text-white'}>
                    {getSummonNatureTypeDisplayName(summon.natureType)}
                  </span>
                </div>
              )}
               {/* Personality Tag */} 
              {summon.personalityId && personalityConfig[summon.personalityId] && (
                <div 
                  className="flex items-center bg-pink-600/50 px-2 py-0.5 rounded-full text-xs shadow-sm cursor-help"
                  title={`性格: ${getPersonalityDisplayName(summon.personalityId)} - ${personalityConfig[summon.personalityId].description}`}
                >
                  <i className="fas fa-grin-stars mr-1 text-pink-300"></i> 
                  <span className="text-pink-100">{getPersonalityDisplayName(summon.personalityId)}</span>
                </div>
              )}
              {/* Five Element Tag */}
              {summon.fiveElement && (
                <div 
                  className={`flex items-center px-2 py-0.5 rounded-full text-xs shadow-sm cursor-help ${FIVE_ELEMENT_COLORS[summon.fiveElement] || 'bg-slate-600/50 text-white'}`}
                  title={`五行: ${getFiveElementDisplayName(summon.fiveElement)}`}
                >
                  <i className="fas fa-circle mr-1"></i>
                  <span>{getFiveElementDisplayName(summon.fiveElement)}</span>
                </div>
              )}
          </div>
          <button onClick={onSelect} className="mt-1 w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            更换
          </button>
          
          <div className="mt-2 w-full bg-black/20 p-3 rounded-lg space-y-3">
             <div>
                <h4 className="font-semibold text-yellow-300 mb-1 text-center border-b border-gray-700 pb-1">核心属性</h4>
                <div className="space-y-1">
                    {Object.entries(summon.basicAttributes).map(([key, value]) => renderStat(getAttributeDisplayName(key), value))}
                </div>
            </div>
            <div>
                <h4 className="font-semibold text-yellow-300 mb-1 text-center border-b border-gray-700 pb-1">成长资质</h4>
                <div className="space-y-1">
                    {Object.entries(summon.aptitudeRatios).map(([key, value]) => renderStat(getAttributeDisplayName(key), value, true))}
                </div>
            </div>
          </div>

          <div className="mt-2 w-full bg-black/20 p-3 rounded-lg">
            <h4 className="font-semibold text-yellow-300 mb-2 text-center border-b border-gray-700 pb-1">持有技能 ({summon.skillSet.length})</h4>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-2">
                {summon.skillSet.length > 0 ? summon.skillSet.map(skillId => {
                    const skill = getSkillById(skillId);
                    return (
                         <div key={skillId} className="text-xs bg-gray-800/60 p-1.5 rounded text-center">
                            <p className="font-semibold text-cyan-400">{skill?.name || "未知"}</p>
                        </div>
                    )
                }) : (
                  <p className="text-xs text-gray-500 text-center">无任何技能</p>
                )}
            </div>
           </div>
        </div>
      ) : (
        <div 
          className="w-full h-full flex flex-col items-center justify-center bg-black/20 rounded-lg border-2 border-dashed border-gray-600 cursor-pointer hover:border-yellow-500 hover:bg-black/30 transition-all"
          onClick={onSelect}
        >
          <i className="fas fa-plus-circle text-5xl text-gray-500 mb-3"></i>
          <p className="font-bold text-gray-400">{emptyText}</p>
        </div>
      )}
    </div>
  );
};

const FusionTab = ({ summonsList, onFusionSuccess, onSelectSummon: onOpenSelector, onShowDetails }) => {
  const { createSummon, deleteSummon } = useSummonManager();
  
  const [selectedSummon1, setSelectedSummon1] = useState(null);
  const [selectedSummon2, setSelectedSummon2] = useState(null);
  const [fusionPreview, setFusionPreview] = useState(null);
  const [fusionResult, setFusionResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (selectedSummon1 && selectedSummon2) {
      const preview = summonFusionManager.calculateFusionPreview(selectedSummon1, selectedSummon2);
      setFusionPreview(preview);
    } else {
      setFusionPreview(null);
    }
  }, [selectedSummon1, selectedSummon2]);

  const handleFusion = async () => {
    if (!selectedSummon1 || !selectedSummon2) return;
    setIsProcessing(true);
    try {
      const result = await summonFusionManager.performFusion(selectedSummon1, selectedSummon2);
      setFusionResult(result);
      if (result.success && result.newSummon) {
        const newSummonData = typeof result.newSummon.toJSON === 'function' 
          ? result.newSummon.toJSON()
          : { ...result.newSummon };

        createSummon(newSummonData);
        deleteSummon(selectedSummon1.id);
        deleteSummon(selectedSummon2.id);
        onFusionSuccess(result.newSummon);
        setSelectedSummon1(null);
        setSelectedSummon2(null);
        setFusionPreview(null);
      }
    } catch (error) {
      console.error('合成失败:', error);
      setFusionResult({ success: false, messages: [{ message: '发生意外错误' }] });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStatRange = (label, range) => (
    <div className="flex justify-between items-center text-sm py-1">
      <span className="text-gray-400">{label}</span>
      <span className="font-mono text-white tracking-wider">{Math.floor(range.min)} - {Math.floor(range.max)}</span>
    </div>
  );
  
  return (
    <div className="flex flex-col h-full">
      {fusionResult && (
         <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[100] animate-fade-in">
             <div className="w-full max-w-4xl p-4">
                 <SummonResultDetail summon={fusionResult.newSummon} />
                 <div className="flex justify-center gap-4 mt-6">
                    <button onClick={() => { setFusionResult(null); onShowDetails(fusionResult.newSummon.id); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all text-lg">
                        前往详情
                    </button>
                     <button onClick={() => setFusionResult(null)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg text-lg">
                        继续融合
                    </button>
                </div>
             </div>
         </div>
      )}

      <div className="grid grid-cols-12 flex-grow gap-2">
        <div className="col-span-3">
          <CompactSummonSelector summon={selectedSummon1} onSelect={() => onOpenSelector(setSelectedSummon1, selectedSummon2?.id)} emptyText="选择主召唤兽" side="left"/>
        </div>

        <div className="col-span-6 flex flex-col items-center justify-center p-4 bg-black/20 rounded-lg relative">
           <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>
           {fusionPreview ? (
             <div className="w-full text-center animate-fade-in z-10">
                <p className="text-lg text-gray-400">预计成功率</p>
                <p className="text-6xl font-bold text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)] my-2">{(fusionPreview.successRate * 100).toFixed(0)}%</p>
                <img 
                  src={getSummonSprite(selectedSummon1.summonSourceId)} 
                  alt="preview" 
                  className="w-40 h-40 mx-auto my-4 opacity-50 saturate-0"
                  style={{ filter: 'brightness(0.2) drop-shadow(0 0 15px #000)'}}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-left">
                  <div>
                    <h4 className="font-semibold text-yellow-300 border-b border-yellow-500/20 pb-1 mb-2">属性范围</h4>
                    {Object.entries(fusionPreview.predictedAttributes).map(([key, value]) => renderStatRange(getAttributeDisplayName(key), value))}
                  </div>
                  <div>
                     <h4 className="font-semibold text-yellow-300 border-b border-yellow-500/20 pb-1 mb-2">技能遗传</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
                        {fusionPreview.individualSkillInheritance.map(({ skillId, inheritChance }) => {
                          const skill = getSkillById(skillId);
                          if (!skill) return null;
                          return (
                            <div key={skillId} className="flex justify-between items-center text-sm">
                              <span className="text-cyan-400">{skill.name}</span>
                              <span className="font-mono text-gray-400">{(inheritChance * 100).toFixed(0)}%</span>
                            </div>
                          );
                        })}
                      </div>
                  </div>
                </div>
             </div>
           ) : (
            <div className="text-center text-gray-600">
              <i className="fas fa-flask text-6xl mb-4"></i>
              <h3 className="text-2xl font-semibold">等待融合</h3>
              <p>请在两侧选择召唤兽</p>
            </div>
           )}
        </div>
        
        <div className="col-span-3">
          <CompactSummonSelector summon={selectedSummon2} onSelect={() => onOpenSelector(setSelectedSummon2, selectedSummon1?.id)} emptyText="选择副召唤兽" side="right"/>
        </div>
      </div>
      
       <div className="flex-shrink-0 p-4 text-center border-t-2 border-yellow-500/10">
            <button 
              onClick={handleFusion}
              disabled={!selectedSummon1 || !selectedSummon2 || isProcessing}
              className="w-full max-w-md px-8 py-4 bg-purple-700 hover:bg-purple-600 rounded-xl disabled:bg-gray-600 disabled:cursor-not-allowed transition-all text-xl font-bold shadow-lg hover:shadow-purple-500/30 disabled:shadow-none ring-2 ring-purple-500/50 hover:ring-purple-400"
            >
              {isProcessing ? '融合中...' : '开始融合'}
            </button>
        </div>
    </div>
  );
};

// --- RefiningTab Component ---
const RefiningTab = ({ summonsList, showToast, onSelectSummon: onOpenSelector, onShowDetails }) => {
  const { updateSummon } = useSummonManager();

  const [selectedSummon, setSelectedSummon] = useState(null);
  const [refinedSummon, setRefinedSummon] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const originalSummon = selectedSummon;

  const handleRefinePreview = () => {
    if (!originalSummon) return;
    setIsProcessing(true);
    
    // 创建一个深拷贝用于洗炼预览
    const summonToRefine = originalSummon.clone(); 
    summonToRefine.refine();
    setRefinedSummon(summonToRefine);
    
    setIsProcessing(false);
  };
  
  const handleConfirmRefine = () => {
    if (!refinedSummon) return;
    updateSummon(refinedSummon.id, refinedSummon.toJSON());
    showToast('洗炼成功！属性已更新。', 'success');
    setSelectedSummon(refinedSummon);
    setRefinedSummon(null); // 清空预览
  };

  const handleSelect = (setter) => {
    setRefinedSummon(null);
    onOpenSelector(setter);
  }

  const renderAttributes = (summon, comparisonSummon) => {
    if (!summon) return <div className="text-gray-500">N/A</div>;
    return (
      <div className="space-y-2">
        {Object.entries(summon.derivedAttributes).map(([key, value]) => {
            const originalValue = comparisonSummon ? comparisonSummon.derivedAttributes[key] : null;
            const diff = originalValue !== null ? value - originalValue : 0;
            let color = "text-white";
            if (diff > 0) color = "text-green-400";
            if (diff < 0) color = "text-red-400";

            return (
               <div key={key} className="flex justify-between text-sm">
                 <span className="text-gray-400 capitalize">{key}:</span>
                 <span className={`font-mono ${color}`}>
                    {typeof value === 'number' ? value.toFixed(2) : value}
                    {diff !== 0 && (
                        <span className="ml-2 text-xs">({diff > 0 ? '+' : ''}{diff.toFixed(2)})</span>
                    )}
                </span>
               </div>
            )
        })}
      </div>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <h3 className="text-xl text-white mb-4 text-center">选择要洗炼的召唤兽</h3>
                <SummonCard summon={selectedSummon} onSelect={() => handleSelect(setSelectedSummon)} emptyText="选择召唤兽">
                    {selectedSummon && (
                        <div className="mt-6 flex flex-col gap-4 items-center">
                            {!refinedSummon ? (
                              <button
                                onClick={handleRefinePreview}
                                disabled={!originalSummon || isProcessing}
                                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded disabled:bg-gray-500 transition-all text-lg font-semibold"
                              >
                                {isProcessing ? '处理中...' : '预览洗炼效果'}
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={handleConfirmRefine}
                                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded transition-all text-lg font-semibold"
                                >
                                  确认替换
                                </button>
                                <button
                                  onClick={() => setRefinedSummon(null)}
                                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 rounded transition-all text-lg font-semibold"
                                >
                                  取消
                                </button>
                              </>
                            )}
                        </div>
                    )}
                </SummonCard>
            </div>
            <div className="md:col-span-2">
                 <h3 className="text-xl text-white mb-4 text-center">属性对比</h3>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <h4 className="text-lg text-yellow-300 mb-3">洗炼前</h4>
                      {renderAttributes(originalSummon)}
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <h4 className="text-lg text-green-300 mb-3">洗炼后</h4>
                      {renderAttributes(refinedSummon, originalSummon)}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

// --- AlchemyTab Component ---
const AlchemyTab = ({ showToast, onSelectSummon: onShowDetails }) => {
  const { createSummon } = useSummonManager();
  const [lastSummoned, setLastSummoned] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const summonableList = useMemo(() => Object.values(summonConfig), []);

  const handleAlchemy = () => {
    setIsProcessing(true);
    setLastSummoned(null);

    // Simulate a delay for effect
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * summonableList.length);
      const randomSummonConfig = summonableList[randomIndex];
      
      // 直接调用 hook 中的 createSummon 方法
      const newSummon = createSummon({
        summonSourceId: randomSummonConfig.id,
      });

      if (newSummon) {
        setLastSummoned(newSummon);
        showToast(`恭喜！你通过炼妖获得了【${newSummon.nickname || newSummon.name}】!`, 'success');
      } else {
        showToast('炼妖失败，请稍后再试。', 'error');
      }

      setIsProcessing(false);
    }, 1500); // 1.5 second delay
  };

  if (lastSummoned) {
    return (
       <div className="flex flex-col items-center justify-center text-center p-8 h-full w-full">
            <h3 className="text-2xl font-bold text-green-400 mb-4">炼金成功!</h3>
            <div className="mb-6 w-full max-w-3xl">
              <SummonResultDetail summon={lastSummoned} />
            </div>
            <div className="flex gap-4">
               <button onClick={() => onShowDetails(lastSummoned.id)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all">
                    查看详情
                </button>
                <button onClick={() => setLastSummoned(null)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-all">
                    继续炼金
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col items-center justify-center">
      <div className="w-full max-w-md p-8 bg-gray-800/50 rounded-2xl shadow-xl text-center">
        <h3 className="text-3xl font-bold text-purple-300 mb-4">神秘炼妖</h3>
        <p className="text-gray-400 mb-8">消耗神秘力量，召唤一只未知的召唤兽。</p>
        <button
          onClick={handleAlchemy}
          disabled={isProcessing}
          className="w-full px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-500 transition-all text-xl font-bold shadow-lg hover:shadow-purple-500/50 disabled:shadow-none"
        >
          {isProcessing ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              召唤中...
            </>
          ) : '开始炼妖'}
        </button>
      </div>
    </div>
  );
};

// --- SummonHomePanel Component ---
const SummonHomePanel = ({ isOpen, onClose, onFusionSuccess, showToast, onSelectSummon }) => {
  const [activeTab, setActiveTab] = useState('fusion');
  const { allSummons: rawSummonsList } = useSummonManager();
  
  const summonsList = useMemo(() => {
    if (!rawSummonsList) return [];
    if (Array.isArray(rawSummonsList)) return rawSummonsList;
    if (typeof rawSummonsList === 'object') return Object.values(rawSummonsList);
    return [];
  }, [rawSummonsList]);

  // State for the selection modal
  const [modalState, setModalState] = useState({
      isOpen: false,
      onSelectCallback: () => {},
      excludeId: null,
  });

  const handleOpenSelector = (onSelectCallback, excludeId = null) => {
      setModalState({
          isOpen: true,
          onSelectCallback: onSelectCallback,
          excludeId,
      });
  };
  
  const handleSelectSummonInModal = (summon) => {
    if (typeof modalState.onSelectCallback === 'function') {
        modalState.onSelectCallback(summon);
    }
    setModalState({ isOpen: false, onSelectCallback: () => {}, excludeId: null }); // Close modal and clear state
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'fusion':
        return <FusionTab 
                    summonsList={summonsList}
                    onFusionSuccess={onFusionSuccess} 
                    onSelectSummon={handleOpenSelector}
                    onShowDetails={onSelectSummon}
                />;
      case 'refining':
        return <RefiningTab 
                    summonsList={summonsList} 
                    showToast={showToast} 
                    onSelectSummon={handleOpenSelector}
                    onShowDetails={onSelectSummon}
                />;
      case 'alchemy':
        return <AlchemyTab 
                  showToast={showToast} 
                  onSelectSummon={onSelectSummon} 
                />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border border-yellow-500/30 text-white rounded-2xl w-[85vw] max-w-[1400px] h-[90vh] shadow-2xl flex flex-col m-auto">
      <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <i className="fas fa-home text-yellow-400 text-xl"></i>
            <h2 className="text-2xl font-bold">召唤兽之家</h2>
        </div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-800/50 p-1 rounded-lg">
          <TabButton isActive={activeTab === 'fusion'} onClick={() => setActiveTab('fusion')}>融合</TabButton>
          <TabButton isActive={activeTab === 'refining'} onClick={() => setActiveTab('refining')}>洗炼</TabButton>
          <TabButton isActive={activeTab === 'alchemy'} onClick={() => setActiveTab('alchemy')}>炼妖</TabButton>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors text-2xl"
        >
          <i className="fas fa-times-circle"></i>
        </button>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        {renderContent()}
      </div>
       <SummonSelectionModal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, onSelectCallback: () => {}, excludeId: null })}
        summons={summonsList}
        onSelect={handleSelectSummonInModal}
        excludeId={modalState.excludeId}
      />
    </div>
  );
};

export default SummonHomePanel; 