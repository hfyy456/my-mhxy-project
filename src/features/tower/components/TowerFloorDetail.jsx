/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-01 05:45:30
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-01 05:45:30
 * @FilePath: \my-mhxy-project\src\features\tower\components\TowerFloorDetail.jsx
 * @Description: 封妖塔楼层详情组件
 */

import React from 'react';
import { ELEMENT_TYPES, FIVE_ELEMENTS } from '@/config/enumConfig';

// 封妖塔楼层详情组件
const TowerFloorDetail = ({ floor, floorConfig, canChallenge, onChallenge }) => {
  if (!floorConfig) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">
          <i className="fas fa-spinner fa-spin text-2xl"></i>
          <p className="mt-2">加载中...</p>
        </div>
      </div>
    );
  }
  
  // 获取环境效果描述
  const getEnvironmentEffectDescription = (effect) => {
    if (!effect) return '无特殊效果';
    
    switch (effect.type) {
      case 'attributeModifier':
        return `${effect.target === 'player' ? '我方' : '敌方'}${effect.attributes.map(attr => `${attr.name}${attr.value > 0 ? '增加' : '降低'}${Math.abs(attr.value)}%`).join('，')}`;
      case 'elementEnhance':
        return `${effect.element}系技能伤害增加${effect.value}%`;
      case 'elementRestriction':
        return `限制使用${effect.element}系技能`;
      case 'fiveElementRestriction':
        const restrictedElements = effect.restrictedElements.map(elem => FIVE_ELEMENTS[elem]).join('、');
        return `限制${restrictedElements}五行的召唤兽参战`;
      default:
        return '未知效果';
    }
  };
  
  // 获取敌人列表
  const getEnemyList = () => {
    if (!floorConfig.enemies || floorConfig.enemies.length === 0) {
      return <p className="text-gray-500 italic">暂无敌人信息</p>;
    }
    
    return (
      <div className="grid grid-cols-2 gap-3">
        {floorConfig.enemies.map((enemy, index) => (
          <div key={index} className="bg-gray-800 rounded p-3 flex items-center">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mr-3">
              <i className={`fas fa-${enemy.isBoss ? 'crown' : 'skull'} ${enemy.isBoss ? 'text-yellow-500' : 'text-gray-500'}`}></i>
            </div>
            <div>
              <div className="font-bold">{enemy.name}</div>
              <div className="text-sm text-gray-400">
                {enemy.level ? `Lv.${enemy.level}` : ''}
                {enemy.element ? ` · ${ELEMENT_TYPES[enemy.element]}系` : ''}
                {enemy.isBoss ? ' · BOSS' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // 获取奖励列表
  const getRewardsList = () => {
    if (!floorConfig.rewards) {
      return <p className="text-gray-500 italic">暂无奖励信息</p>;
    }
    
    // 将奖励对象转换为数组形式便于渲染
    const rewardsArray = [];
    
    // 添加经验和金币奖励
    if (floorConfig.rewards.exp) {
      rewardsArray.push({
        type: 'exp',
        name: '经验值',
        amount: floorConfig.rewards.exp,
        chance: 100
      });
    }
    
    if (floorConfig.rewards.gold) {
      rewardsArray.push({
        type: 'currency',
        name: '金币',
        amount: floorConfig.rewards.gold,
        chance: 100
      });
    }
    
    // 添加固定掉落物品
    if (floorConfig.rewards.guaranteedItems && floorConfig.rewards.guaranteedItems.length > 0) {
      floorConfig.rewards.guaranteedItems.forEach(item => {
        rewardsArray.push({
          type: 'item',
          name: item.itemId, // 实际应该使用物品名称，这里暂用ID
          amount: item.quantity,
          chance: 100
        });
      });
    }
    
    // 添加随机掉落物品
    if (floorConfig.rewards.randomItems && floorConfig.rewards.randomItems.length > 0) {
      floorConfig.rewards.randomItems.forEach(item => {
        rewardsArray.push({
          type: 'item',
          name: item.itemId, // 实际应该使用物品名称，这里暂用ID
          amount: item.quantity,
          chance: Math.round(item.chance * 100) // 将概率转换为百分比
        });
      });
    }
    
    if (rewardsArray.length === 0) {
      return <p className="text-gray-500 italic">暂无奖励信息</p>;
    }
    
    return (
      <div className="grid grid-cols-2 gap-3">
        {rewardsArray.map((reward, index) => (
          <div key={index} className="bg-gray-800 rounded p-3 flex items-center">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-3">
              <i className={`fas fa-${reward.type === 'item' ? 'box' : reward.type === 'currency' ? 'coins' : reward.type === 'exp' ? 'star' : 'gem'} text-yellow-500`}></i>
            </div>
            <div>
              <div className="font-bold">{reward.name}</div>
              <div className="text-sm text-gray-400">
                {reward.amount ? `数量: ${reward.amount}` : ''}
                {reward.chance < 100 ? ` · 几率: ${reward.chance}%` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="h-full p-4 overflow-y-auto">
      {/* 楼层标题 */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold flex items-center">
          <span>第 {floor} 层</span>
          {floorConfig.isBossFloor && (
            <span className="ml-3 px-3 py-1 text-sm bg-red-900 text-red-200 rounded-full">
              BOSS层
            </span>
          )}
        </h3>
        <p className="text-gray-400 mt-1">{floorConfig.description || '挑战封妖塔，获取丰厚奖励'}</p>
      </div>
      
      {/* 环境效果 */}
      <div className="mb-6">
        <h4 className="text-lg font-bold mb-2 flex items-center">
          <i className="fas fa-wind text-blue-400 mr-2"></i>
          环境效果
        </h4>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-3">
              <i className={`fas fa-${floorConfig.environment?.icon || 'mountain'} text-blue-400`}></i>
            </div>
            <div>
              <div className="font-bold">{floorConfig.environment?.name || '普通环境'}</div>
              <div className="text-sm text-gray-400">
                {getEnvironmentEffectDescription(floorConfig.environment?.effect)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 敌人列表 */}
      <div className="mb-6">
        <h4 className="text-lg font-bold mb-2 flex items-center">
          <i className="fas fa-skull text-red-400 mr-2"></i>
          出没妖怪
        </h4>
        {getEnemyList()}
      </div>
      
      {/* 奖励列表 */}
      <div className="mb-6">
        <h4 className="text-lg font-bold mb-2 flex items-center">
          <i className="fas fa-gift text-yellow-400 mr-2"></i>
          通关奖励
        </h4>
        {getRewardsList()}
      </div>
      
      {/* 挑战按钮 */}
      <div className="mt-8 flex justify-center">
        <button
          className={`px-6 py-3 rounded-lg text-lg font-bold transition-colors duration-200 ${
            canChallenge 
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white' 
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
          onClick={canChallenge ? onChallenge : undefined}
          disabled={!canChallenge}
        >
          <i className="fas fa-fire-alt mr-2"></i>
          开始挑战
        </button>
      </div>
      
      {/* 锁定提示 */}
      {!canChallenge && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          <i className="fas fa-lock mr-1"></i>
          需要先通过前面的楼层才能挑战此层
        </div>
      )}
    </div>
  );
};

export default TowerFloorDetail;
