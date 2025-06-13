/*
 * @Author: Claude
 * @Date: 2025-01-27
 * @Description: 行动类型选择器 - 纯UI组件
 */
import React from "react";
import "./ActionTypeSelector.css";

/**
 * 行动类型选择器组件
 * 纯UI组件，所有数据通过props传入
 * @param {Object} props
 * @param {Object} props.selectedUnit - 选中的单位
 * @param {string} props.selectedAction - 当前选中的行动类型
 * @param {Array} props.availableActions - 可用的行动类型列表
 * @param {Function} props.onActionSelect - 行动类型选择回调
 * @param {boolean} props.disabled - 是否禁用
 * @param {string} props.className - 额外的CSS类名
 */
const ActionTypeSelector = ({
  selectedUnit,
  selectedAction,
  availableActions = ["attack", "defend", "skill", "capture", "item", "escape"],
  onActionSelect,
  disabled = false,
  className = "",
}) => {
  // 行动类型配置
  const actionConfigs = {
    attack: { icon: "⚔️", label: "攻击", color: "red" },
    defend: { icon: "🛡️", label: "防御", color: "blue" },
    skill: { icon: "✨", label: "技能", color: "purple" },
    item: { icon: "🎒", label: "背包", color: "amber" },
    capture: { icon: "🥅", label: "捕捉", color: "green" },
    escape: { icon: "💨", label: "逃跑", color: "gray" },
  };

  // 如果没有选中单位，显示提示
  if (!selectedUnit) {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg border border-white/10 p-4 shadow-lg text-white font-sans flex flex-col items-center justify-center ${className}`}
      >
        <div className="text-blue-300 text-sm md:text-base mb-2">
          请选择一个单位
        </div>
        <div className="text-xs text-gray-400 text-center">
          点击上方状态栏中的召唤兽
        </div>
      </div>
    );
  }

  // 处理行动选择
  const handleActionSelect = (actionType) => {
    if (disabled || !onActionSelect) return;
    onActionSelect(actionType);
  };

  // 获取按钮样式
  const getButtonStyle = (actionType) => {
    const config = actionConfigs[actionType];
    const isSelected = selectedAction === actionType;

    if (disabled) {
      return "bg-gray-600/50 text-gray-400 cursor-not-allowed";
    }

    if (isSelected) {
      return `bg-gradient-to-r from-${config.color}-700 to-${config.color}-600 text-white ring-${config.color}-500`;
    }

    return "bg-gradient-to-b from-gray-700 to-gray-800 text-gray-200 ring-gray-500 hover:from-gray-600 hover:to-gray-700";
  };

  return (
    <div
      className={`w-full h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg border border-white/10 p-2 shadow-lg text-white font-sans flex flex-col ${className}`}
    >
      {/* 标题区域 */}
      <div className="flex items-center justify-between mb-1 pb-1 border-b border-gray-600/50">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center mr-2">
            <span className="text-blue-300 text-xs">⚙️</span>
          </div>
          <div className="text-blue-300 font-bold">选择行动类型</div>
        </div>
      </div>

      {/* 单位信息区域 */}
      <div className="mb-2 bg-gray-700/30 rounded-lg p-1 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-700/50 flex items-center justify-center mr-2">
            <span className="text-amber-300 text-xs">🐲</span>
          </div>
          <div>
            <div className="text-amber-300 text-sm font-medium">
              {selectedUnit.name}
            </div>
            <div className="text-xs text-gray-300">
              HP: {selectedUnit.stats?.currentHp || 0}/
              {selectedUnit.stats?.maxHp || 0} | MP:{" "}
              {selectedUnit.stats?.currentMp || 0}/
              {selectedUnit.stats?.maxMp || 0}
            </div>
          </div>
        </div>
      </div>

      {/* 行动类型按钮列表 */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        {availableActions.map((actionType) => {
          const config = actionConfigs[actionType];
          if (!config) return null;

          return (
            <button
              key={actionType}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800 shadow-sm ${getButtonStyle(
                actionType
              )}`}
              onClick={() => handleActionSelect(actionType)}
              disabled={disabled}
              aria-pressed={selectedAction === actionType}
              aria-label={`选择${config.label}行动`}
            >
              <div className="flex items-center">
                <span className="mr-2">{config.icon}</span>
                <span>{config.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 禁用状态提示 */}
      {disabled && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          行动选择已禁用
        </div>
      )}
    </div>
  );
};

export default ActionTypeSelector;
