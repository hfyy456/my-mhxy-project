import React from 'react';

// 获取技能图标
const getSkillIcon = (skill) => {
  if (skill.icon) return <i className={`fas ${skill.icon}`}></i>;
  
  const iconMap = {
    'MAGICAL': '🔮',
    'ATTACK': '⚔️', 
    'SUPPORT': '🛡️',
    'HEALING': '💚'
  };
  
  return iconMap[skill.type] || '✨';
};

// 获取技能类型文本
const getSkillTypeText = (type) => {
  const typeMap = {
    'MAGICAL': '魔法',
    'ATTACK': '攻击', 
    'SUPPORT': '支援',
    'HEALING': '治疗',
    'PASSIVE': '被动'
  };
  
  return typeMap[type] || '未知';
};

const ActionContentSelector = ({ 
  // 基础数据
  selectedUnit,
  selectedAction,
  selectedSkill,
  selectedTarget,
  hasAction,
  
  // 数据列表
  activeSkills = [],
  validTargets = [],
  
  // 状态信息
  actionDescription = '',
  skillStep = 1,
  loading = false,
  error = null,
  
  // 回调函数
  onSkillSelect,
  onTargetSelect, 
  onConfirmAction,
  onResetAction,
  onEscapeBattle,
  onNextStep,
  onPrevStep,
  
  // 新增：捕捉相关
  capturableTargets = [],
  
  // 配置
  showStepIndicator = true,
  disabled = false
}) => {
  // 处理无选中单位的情况
  if (!selectedUnit) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg border border-white/10 p-2 shadow-lg text-white font-sans flex flex-col items-center justify-center">
        <div className="text-blue-300 text-sm md:text-base mb-2">请选择一个单位</div>
        <div className="text-xs text-gray-400 text-center">点击上方状态栏中的召唤兽</div>
      </div>
    );
  }

  // 显示加载中状态
  if (loading) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg border border-white/10 p-2 shadow-lg text-white font-sans flex flex-col items-center justify-center">
        <div className="text-blue-300 text-sm mb-2">处理中...</div>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-300"></div>
      </div>
    );
  }

  // 显示错误状态
  if (error) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg border border-white/10 p-2 shadow-lg text-white font-sans flex flex-col items-center justify-center">
        <div className="text-red-300 text-sm mb-2">错误</div>
        <div className="text-xs text-gray-400 text-center">{error}</div>
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
                  {actionDescription}
                </div>
              </div>
            </div>
            
            <div className="text-sm text-blue-200">
              你可以点击下方按钮重新设置行动，或者选择其他召唤兽来设置行动。
            </div>
          </div>
          
          <button 
            className="px-3 py-1.5 bg-gradient-to-r from-red-700 to-red-600 text-white rounded-lg transition-all duration-300 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-red-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onResetAction}
            disabled={disabled}
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
    // 逃跑确认
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
            className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-lg transition-all duration-300 font-bold text-sm focus:outline-none focus:ring-gray-400 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onEscapeBattle}
            disabled={disabled}
          >
            <div className="flex items-center justify-center">
              <span className="mr-2">💨</span>
              <span>确认逃跑</span>
            </div>
          </button>
        </div>
      );
    }
    
    // 背包功能
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
    
    // 防御确认
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
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg transition-all duration-300 font-bold text-sm focus:outline-none focus:ring-green-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onConfirmAction}
            disabled={disabled}
          >
            <div className="flex items-center justify-center">
              <span className="mr-2">✅</span>
              <span>确认防御</span>
            </div>
          </button>
        </div>
      );
    }
    
    // 捕捉目标选择
    if (selectedAction === 'capture') {
      return (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center mb-4 pb-2 border-b border-gray-600/50">
            <div className="w-6 h-6 rounded-full bg-green-900/50 flex items-center justify-center mr-2">
              <span className="text-green-300 text-xs">🥅</span>
            </div>
            <div className="text-green-300 font-bold">选择捕捉目标</div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900/30 pr-1 py-1">
            {capturableTargets.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="bg-gray-700/30 rounded-lg border border-gray-600/50 p-3 text-center">
                  <span className="text-xs text-gray-300">当前没有可捕捉的目标。</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {capturableTargets.map(target => {
                  const chancePercentage = (target.captureChance * 100).toFixed(0);
                  let chanceColor = 'text-green-300';
                  if (target.captureChance < 0.5) chanceColor = 'text-yellow-300';
                  if (target.captureChance < 0.2) chanceColor = 'text-red-400';

                  return (
                    <button
                      key={target.id}
                      className={`p-1.5 rounded-md transition-all duration-200 shadow-sm border ${selectedTarget === target.id ? 'bg-green-800/60 border-green-500' : 'bg-gray-700/40 border-transparent hover:bg-gray-700/70'}`}
                      onClick={() => onTargetSelect?.(target.id)}
                      disabled={disabled}
                    >
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold text-white truncate">{target.name}</span>
                        <span className={`font-black ${chanceColor}`}>{chancePercentage}%</span>
                      </div>
                      <div className="w-full bg-black/30 rounded-full h-1">
                        <div className="bg-red-500 h-1 rounded-full" style={{ width: `${(target.stats.currentHp / target.stats.maxHp) * 100}%` }}></div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="mt-auto pt-1">
            <button 
              className={`w-full px-3 py-1.5 rounded-lg font-bold text-white text-xs transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 shadow-lg ${(!selectedTarget || disabled) ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'}`}
              onClick={onConfirmAction}
              disabled={!selectedTarget || disabled}
            >
              <div className="flex items-center justify-center">
                <span className="mr-2">✅</span>
                <span>确认捕捉</span>
              </div>
            </button>
          </div>
        </div>
      );
    }
    
    // 攻击目标选择
    if (selectedAction === 'attack') {
      return (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center mb-4 pb-2 border-b border-gray-600/50">
            <div className="w-6 h-6 rounded-full bg-red-900/50 flex items-center justify-center mr-2">
              <span className="text-red-300 text-xs">🎯</span>
            </div>
            <div className="text-red-300 font-bold">选择攻击目标</div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900/30">
            {validTargets.length === 0 ? (
              <div className="bg-red-900/20 rounded-lg border border-red-800/30 p-4 mb-2">
                <div className="flex items-start">
                  <span className="text-red-300 mr-2 mt-0.5">⚠️</span>
                  <span className="text-sm text-red-200">没有可攻击的目标！所有敌人都超出了攻击范围。请考虑移动到更靠前的位置或选择其他行动。</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {validTargets.map(target => (
                  <button
                    key={target.id}
                    className={`p-3 rounded-lg transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${selectedTarget === target.id ? 'bg-gradient-to-r from-red-600 to-red-500 text-white font-medium ring-1 ring-red-400' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200'}`}
                    onClick={() => onTargetSelect?.(target.id)}
                    disabled={disabled}
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
              className={`w-full px-4 py-2 rounded-lg font-bold text-white text-xs transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-green-500 shadow-md ${(!selectedTarget || disabled) ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'}`}
              onClick={onConfirmAction}
              disabled={!selectedTarget || disabled}
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
    
    // 技能选择和目标选择
    if (selectedAction === 'skill') {
      return (
        <div className="flex-1 flex flex-col">
          {/* 步骤指示器 */}
          {showStepIndicator && (
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
          )}
          
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
                        className={`p-2 rounded-lg transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${selectedSkill === skill.id ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium ring-1 ring-purple-400' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200'}`}
                        onClick={() => onSkillSelect?.(skill.id)}
                        disabled={disabled}
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
                  className={`w-full px-4 py-2 rounded-lg font-bold text-white text-xs transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-md ${(!selectedSkill || disabled) ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-blue-600 to-blue-500'}`}
                  onClick={onNextStep}
                  disabled={!selectedSkill || disabled}
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
                {validTargets.length === 0 ? (
                  <div className="bg-red-900/20 rounded-lg border border-red-800/30 p-3 mb-2">
                    <div className="flex items-start">
                      <span className="text-red-300 mr-2 mt-0.5">⚠️</span>
                      <span className="text-xs text-red-200">没有可用技能的目标！所有敌人都超出了技能范围。</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1 mb-2">
                    {validTargets.map(target => (
                      <button
                        key={target.id}
                        className={`p-2 rounded-lg transition-colors duration-200 shadow-sm text-xs disabled:opacity-50 disabled:cursor-not-allowed ${selectedTarget === target.id ? 'bg-gradient-to-r from-red-600 to-red-500 text-white font-medium ring-1 ring-red-400' : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200'}`}
                        onClick={() => onTargetSelect?.(target.id)}
                        disabled={disabled}
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
                  className="flex-1 px-4 py-2 rounded-lg font-bold text-white text-xs transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-gray-500 shadow-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={onPrevStep}
                  disabled={disabled}
                >
                  <div className="flex items-center justify-center">
                    <span className="mr-2">⬅️</span>
                    <span>返回</span>
                  </div>
                </button>
                
                <button 
                  className={`flex-1 px-4 py-2 rounded-lg font-bold text-white text-xs transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-green-500 shadow-md ${(!selectedTarget || disabled) ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-green-600 to-green-500'}`}
                  onClick={onConfirmAction}
                  disabled={!selectedTarget || disabled}
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
