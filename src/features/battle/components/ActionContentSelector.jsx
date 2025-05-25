import React, { useState } from 'react';
import { endBattle } from '@/store/slices/battleSlice';
import { activeSkillConfig } from '@/config/skill/activeSkillConfig';
import { SKILL_TYPES } from '@/config/enumConfig';

// 获取技能图标
 const getSkillIcon = (skill) => {
  if (skill.icon) return <i className={`fas ${skill.icon}`}></i>;
  
  switch (skill.type) {
    case SKILL_TYPES.MAGICAL:
      return '🔮'; // 魔法图标
    case SKILL_TYPES.ATTACK:
      return '⚔️'; // 攻击图标
    case SKILL_TYPES.SUPPORT:
      return '🛡️'; // 支援图标
    case SKILL_TYPES.HEALING:
      return '💚'; // 治疗图标
    default:
      return '✨'; // 默认图标
  }
};

// 获取技能类型文本
 const getSkillTypeText = (type) => {
  switch (type) {
    case SKILL_TYPES.MAGICAL:
      return '魔法';
    case SKILL_TYPES.ATTACK:
      return '攻击';
    case SKILL_TYPES.SUPPORT:
      return '支援';
    case SKILL_TYPES.HEALING:
      return '治疗';
    case SKILL_TYPES.PASSIVE:
      return '被动';
    default:
      return '未知';
  }
};

const ActionContentSelector = ({ 
  selectedUnit, 
  selectedAction, 
  selectedSkill, 
  setSelectedSkill, 
  selectedTarget, 
  setSelectedTarget, 
  getTargets, 
  getActiveSkills, // 使用新的 getActiveSkills 函数
  confirmAction, 
  hasAction,
  getActionDescription,
  dispatch,
  setUnitAction,
  selectedUnitId
}) => {
  // 添加状态来跟踪当前步骤：1 = 选择技能，2 = 选择目标
  const [skillStep, setSkillStep] = useState(1);
  
  // 重置步骤状态
  React.useEffect(() => {
    if (selectedAction !== 'skill') {
      setSkillStep(1);
    }
  }, [selectedAction]);
  
  // 重置技能选择
  React.useEffect(() => {
    setSelectedSkill(null);
    setSelectedTarget(null);
  }, [selectedAction, setSelectedSkill, setSelectedTarget]);
  if (!selectedUnit) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg border border-white/10 p-2 shadow-lg text-white font-sans flex flex-col items-center justify-center">
        <div className="text-blue-300 text-sm md:text-base mb-2">请选择一个单位</div>
        <div className="text-xs text-gray-400 text-center">点击上方状态栏中的召唤兽</div>
      </div>
    );
  }

  // 如果单位已有行动
  if (hasAction) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg border border-white/10 p-2 shadow-lg text-white font-sans flex flex-col">
        <div className="flex items-center mb-4 pb-2 border-b border-gray-600/50">
          <div className="w-6 h-6 rounded-full bg-green-900/50 flex items-center justify-center mr-2">
            <span className="text-green-300 text-xs">✓</span>
          </div>
          <div className="text-green-300 font-bold">行动已设置</div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-green-900/20 rounded-lg border border-green-800/30 p-2 mb-3 max-w-md">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center mr-2 border border-blue-700/50">
                <span className="text-blue-300 text-sm">🔄</span>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-300 mb-1">{selectedUnit.name}</div>
                <div className="text-sm font-medium text-blue-300 bg-blue-900/30 px-3 py-1 rounded-md border border-blue-800/30 inline-block">
                  {getActionDescription(hasAction)}
                </div>
              </div>
            </div>
            
            <div className="text-sm text-blue-200">
              你可以点击下方按钮重新设置行动，或者选择其他召唤兽来设置行动。
            </div>
          </div>
          
          <button 
            className="px-3 py-1.5 bg-gradient-to-r from-red-700 to-red-600 text-white rounded-lg transition-all duration-300 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-red-500 shadow-sm"
            onClick={() => dispatch(setUnitAction({
              unitId: selectedUnitId,
              action: null
            }))}
          >
            <div className="flex items-center">
              <span className="mr-2">🔄</span>
              <span>重新设置行动</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // 根据选择的行动类型显示不同内容
  const renderActionContent = () => {
    // 如果选择了逃跑，显示逃跑确认
    if (selectedAction === 'escape') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-gray-700/50 rounded-lg border border-gray-600/50 p-4 mb-6 max-w-md">
            <div className="flex items-start">
              <span className="text-gray-300 mr-2 mt-0.5">💨</span>
              <span className="text-sm text-gray-300">逃跑将结束当前战斗，但可能会失去一些战利品。确定要逃跑吗？</span>
            </div>
          </div>
          
          <button 
            className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-lg transition-all duration-300 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-lg"
            onClick={() => dispatch(endBattle())}
          >
            <div className="flex items-center justify-center">
              <span className="mr-2">💨</span>
              <span>确认逃跑</span>
            </div>
          </button>
        </div>
      );
    }
    
    // 如果选择了背包，显示背包选项
    if (selectedAction === 'item') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-amber-900/20 rounded-lg border border-amber-800/30 p-4 mb-6 max-w-md">
            <div className="flex items-start">
              <span className="text-amber-300 mr-2 mt-0.5">🎒</span>
              <span className="text-sm text-amber-200">背包功能暂未实现，请选择其他行动。</span>
            </div>
          </div>
        </div>
      );
    }
    
    // 如果选择了防御，直接显示确认按钮
    if (selectedAction === 'defend') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-blue-900/20 rounded-lg border border-blue-800/30 p-4 mb-6 max-w-md">
            <div className="flex items-start">
              <span className="text-blue-300 mr-2 mt-0.5">💡</span>
              <span className="text-sm text-blue-200">防御可以减少受到的伤害，并有机会抵消部分负面效果。</span>
            </div>
          </div>
          
          <button 
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg transition-all duration-300 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-lg"
            onClick={confirmAction}
          >
            <div className="flex items-center justify-center">
              <span className="mr-2">✅</span>
              <span>确认防御</span>
            </div>
          </button>
        </div>
      );
    }
    
    // 如果选择了攻击，显示目标选择
    if (selectedAction === 'attack') {
      const targets = getTargets();
      
      return (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center mb-4 pb-2 border-b border-gray-600/50">
            <div className="w-6 h-6 rounded-full bg-red-900/50 flex items-center justify-center mr-2">
              <span className="text-red-300 text-xs">🎯</span>
            </div>
            <div className="text-red-300 font-bold">选择攻击目标</div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900/30">
            {targets.length === 0 ? (
              <div className="bg-red-900/20 rounded-lg border border-red-800/30 p-4 mb-2">
                <div className="flex items-start">
                  <span className="text-red-300 mr-2 mt-0.5">⚠️</span>
                  <span className="text-sm text-red-200">没有可攻击的目标！所有敌人都超出了攻击范围。请考虑移动到更靠前的位置或选择其他行动。</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {targets.map(target => (
                  <button
                    key={target.id}
                    className={`p-3 rounded-lg transition-all duration-200 shadow-sm ${selectedTarget === target.id ? 'bg-gradient-to-r from-red-600 to-red-500 text-white font-medium ring-1 ring-red-400' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200'}`}
                    onClick={() => setSelectedTarget(target.id)}
                  >
                    <div className="flex items-center text-xs">
                      <span className="mr-2">👹</span>
                      <span>{target.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <button 
              className={`w-full px-4 py-2 rounded-lg font-bold text-white text-xs transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-green-500 shadow-md ${!selectedTarget ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'}`}
              onClick={confirmAction}
              disabled={!selectedTarget}
            >
              <div className="flex items-center justify-center">
                <span className="mr-2">✅</span>
                <span>确认攻击</span>
              </div>
            </button>
          </div>
        </div>
      );
    }
    
    // 如果选择了技能，按照步骤显示不同的内容
    if (selectedAction === 'skill') {
      const activeSkills = getActiveSkills();
      console.log('渲染主动技能列表:', activeSkills);
      
      return (
        <div className="flex-1 flex flex-col">
          {/* 步骤指示器 */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-600/50">
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${skillStep === 1 ? 'bg-purple-900/80 text-purple-200' : 'bg-gray-700/50 text-gray-400'}`}>
                <span className="text-xs">1</span>
              </div>
              <div className={`text-sm font-medium ${skillStep === 1 ? 'text-purple-300' : 'text-gray-400'}`}>选择技能</div>
            </div>
            
            <div className="flex-grow mx-2 border-t border-dashed border-gray-600/30 self-center"></div>
            
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${skillStep === 2 ? 'bg-red-900/80 text-red-200' : 'bg-gray-700/50 text-gray-400'}`}>
                <span className="text-xs">2</span>
              </div>
              <div className={`text-sm font-medium ${skillStep === 2 ? 'text-red-300' : 'text-gray-400'}`}>选择目标</div>
            </div>
          </div>
          
          {/* 步骤 1: 选择技能 */}
          {skillStep === 1 && (
            <>
              <div className="mb-2">
                {activeSkills.length === 0 ? (
                  <div className="bg-purple-900/20 rounded-lg border border-purple-800/30 p-4 mb-2">
                    <div className="flex items-start">
                      <span className="text-purple-300 mr-2 mt-0.5">⚠️</span>
                      <span className="text-sm text-purple-200">此单位没有可用的主动技能！</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1 mb-2">
                    {activeSkills.map(skill => (
                      <button
                        key={skill.id}
                        className={`p-2 rounded-lg transition-all duration-200 shadow-sm ${selectedSkill === skill.id ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium ring-1 ring-purple-400' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200'}`}
                        onClick={() => {
                          setSelectedSkill(skill.id);
                          console.log('选择技能:', skill.name, '影响范围将被高亮显示');
                        }}
                      >
                        <div className="flex items-center">
                          <span className="mr-2">{getSkillIcon(skill)}</span>
                          <span className="text-xs">{skill.name}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          MP: {skill.mpCost || 0} | 类型: {getSkillTypeText(skill.type)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 技能详情显示 */}
              {selectedSkill && (
                <div className="bg-gray-800/50 rounded-lg p-2 mb-3 border border-purple-500/20">
                  <div className="text-xs text-purple-300 font-medium mb-1">技能详情</div>
                  <div className="text-[10px] text-gray-300 mb-1">
                    {activeSkills.find(s => s.id === selectedSkill)?.description || '无描述'}
                  </div>
                </div>
              )}
              
              <div className="mt-auto">
                <button 
                  className={`w-full px-4 py-2 rounded-lg font-bold text-white text-xs transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-md ${!selectedSkill ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-blue-600 to-blue-500'}`}
                  onClick={() => selectedSkill && setSkillStep(2)}
                  disabled={!selectedSkill}
                >
                  <div className="flex items-center justify-center">
                    <span className="mr-2">➡️</span>
                    <span>下一步: 选择目标</span>
                  </div>
                </button>
              </div>
            </>
          )}
          
          {/* 步骤 2: 选择目标 */}
          {skillStep === 2 && (
            <>
              <div className="mb-2">
                {getTargets().length === 0 ? (
                  <div className="bg-red-900/20 rounded-lg border border-red-800/30 p-3 mb-2">
                    <div className="flex items-start">
                      <span className="text-red-300 mr-2 mt-0.5">⚠️</span>
                      <span className="text-xs text-red-200">没有可用技能的目标！所有敌人都超出了技能范围。</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1 mb-2">
                    {getTargets().map(target => (
                      <button
                        key={target.id}
                        className={`p-2 rounded-lg transition-all duration-200 shadow-sm text-xs ${selectedTarget === target.id ? 'bg-gradient-to-r from-red-600 to-red-500 text-white font-medium ring-1 ring-red-400' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200'}`}
                        onClick={() => setSelectedTarget(target.id)}
                      >
                        <div className="flex items-center">
                          <span className="mr-1">👹</span>
                          <span>{target.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 mt-auto">
                <button 
                  className="flex-1 px-4 py-2 rounded-lg font-bold text-white text-xs transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-gray-500 shadow-md bg-gray-700 hover:bg-gray-600"
                  onClick={() => {
                    setSkillStep(1);
                    setSelectedTarget(null);
                  }}
                >
                  <div className="flex items-center justify-center">
                    <span className="mr-2">⬅️</span>
                    <span>返回</span>
                  </div>
                </button>
                
                <button 
                  className={`flex-1 px-4 py-2 rounded-lg font-bold text-white text-xs transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-green-500 shadow-md ${!selectedTarget ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-green-600 to-green-500'}`}
                  onClick={confirmAction}
                  disabled={!selectedTarget}
                >
                  <div className="flex items-center justify-center">
                    <span className="mr-2">✅</span>
                    <span>确认使用技能</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      );
    }
    
    // 默认显示提示选择行动类型
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-blue-300 text-sm md:text-base mb-2">请先选择行动类型</div>
        <div className="text-xs text-gray-400 text-center">在左侧选择攻击、防御或技能</div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg border border-white/10 p-2 shadow-lg text-white font-sans flex flex-col">
      {renderActionContent()}
    </div>
  );
};

export default ActionContentSelector;
