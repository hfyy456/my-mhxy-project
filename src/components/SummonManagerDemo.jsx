/**
 * 面向对象召唤兽管理系统演示组件 - 简化版
 * 展示封装等OOP特性，使用现有的装备和技能系统
 */
import React, { useState } from 'react';
import {
  useSummonManager,
  useCurrentSummon,
  useSummonList,
  useSummonStats,
  useSummonOperations
} from '@/hooks/useSummonManager';
import { useInventoryActions, useInventoryItems } from '@/hooks/useInventoryManager';
import { skillConfig } from '@/config/skill/skillConfig';
import { generateNewSummon } from '@/utils/summonUtils';
import { getSummonNatureTypeDisplayName } from '@/config/ui/uiTextConfig';
import { SUMMON_SOURCES, SUMMON_NATURE_TYPES } from '@/config/enumConfig';

const SummonManagerDemo = () => {
  const [selectedTab, setSelectedTab] = useState('list');
  const [selectedQuality, setSelectedQuality] = useState('');
  const [selectedSummonId, setSelectedSummonId] = useState(null);

  // 使用各种Hook
  const {
    allSummons,
    currentSummonId,
    currentSummonFullData,
    isLoading,
    error,
    levelUpSummon,
    allocatePoints,
    resetPoints,
    learnSkill,
    forgetSkill,
    changeSummonNickname,
    createSummon,
    deleteSummon,
    cloneSummon,
    clearError,
    manager
  } = useSummonManager();

  // 使用装备系统
  const { equipItem, unequipItem, getEquippableItems, getSummonEquipmentStatus } = useInventoryActions();
  const inventoryItems = useInventoryItems();

  const { summon: currentSummon } = useCurrentSummon();
  
  const { summons: filteredSummons } = useSummonList({
    quality: selectedQuality || undefined,
    sortBy: 'power',
    sortOrder: 'desc'
  });

  const derivedAttributes = useSummonStats();
  const { batchRecalculate } = useSummonOperations();

  // 获取当前选中的召唤兽（用于演示）
  const selectedSummon = selectedSummonId ? allSummons[selectedSummonId] : currentSummon;

  // 创建召唤兽
  const handleCreateSummon = () => {
    // 使用现有的召唤兽类型
    const availableSummonTypes = ['ghost', 'heavenGuard', 'thunderBird', 'vampire', 'mechanicalBird', 'catSpirit', 'wildLeopard'];
    const randomSummonType = availableSummonTypes[Math.floor(Math.random() * availableSummonTypes.length)];
    const qualities = ['normal', 'rare', 'epic', 'legendary', 'mythic'];
    const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
    const natureTypes = Object.values(SUMMON_NATURE_TYPES);
    const randomNatureType = natureTypes[Math.floor(Math.random() * natureTypes.length)];
    
    // 使用现有的generateNewSummon函数
    const summonData = generateNewSummon({
      summonSourceId: randomSummonType,
      quality: randomQuality,
      natureType: randomNatureType,
      source: SUMMON_SOURCES.MANUAL, // 使用手动来源
      dispatch: null // 暂时不使用dispatch
    });

    const result = createSummon(summonData);
    if (result) {
      console.log(`[Demo] 创建了${getSummonNatureTypeDisplayName(randomNatureType)}召唤兽:`, result);
      setSelectedSummonId(result.id);
    }
  };

  // 测试升级
  const handleTestLevelUp = () => {
    if (selectedSummonId) {
      levelUpSummon(selectedSummonId, null); // null表示升1级
    }
  };

  // 测试潜力点分配
  const handleAllocatePoints = (attribute, amount) => {
    if (selectedSummonId) {
      const allocation = { [attribute]: amount };
      allocatePoints(selectedSummonId, allocation);
    }
  };

  // 测试学习技能
  const handleLearnSkill = () => {
    if (selectedSummonId && skillConfig.length > 0) {
      const randomSkill = skillConfig[Math.floor(Math.random() * skillConfig.length)];
      learnSkill(selectedSummonId, randomSkill.id || randomSkill.name);
    }
  };

  // 获取可装备的物品
  const equippableItems = getEquippableItems();

  // 渲染召唤兽卡片
  const renderSummonCard = (summon) => (
    <div
      key={summon.id}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        selectedSummonId === summon.id
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onClick={() => setSelectedSummonId(summon.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg">
          {summon.nickname || summon.id}
        </h3>
        <div className="flex flex-col items-end space-y-1">
          <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">
            召唤兽
          </span>
          {summon.natureType && (
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              summon.natureType === 'wild' ? 'bg-gray-100 text-gray-700' :
              summon.natureType === 'baby' ? 'bg-blue-100 text-blue-700' :
              summon.natureType === 'mutant' ? 'bg-purple-100 text-purple-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {getSummonNatureTypeDisplayName(summon.natureType)}
            </span>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-600 space-y-1">
        <p>等级: {summon.level} | 品质: {summon.quality}</p>
        <p>战力: {summon.power || 0}</p>
        <p>经验: {summon.experience}</p>
        <p>潜力点: {summon.potentialPoints}</p>
        <p>技能数: {summon.skillSet?.length || 0}</p>
        {summon.natureType && (
          <p className="text-xs text-gray-500">
            类型: {getSummonNatureTypeDisplayName(summon.natureType)}
          </p>
        )}
      </div>

      <div className="mt-2 flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            cloneSummon(summon.id);
          }}
          className="px-2 py-1 bg-green-500 text-white rounded text-xs"
        >
          复制
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteSummon(summon.id);
          }}
          className="px-2 py-1 bg-red-500 text-white rounded text-xs"
        >
          删除
        </button>
      </div>
    </div>
  );

  // 渲染技能管理界面（使用现有技能系统）
  const renderSkillManagement = () => (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="font-bold text-lg mb-3">技能管理</h3>
      
      {/* 已学技能 */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">已学技能</h4>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {(selectedSummon?.skillSet || []).map((skillId, index) => {
            if (!skillId) return null;
            const skill = skillConfig.find(s => s.id === skillId || s.name === skillId) || { id: skillId, name: skillId };
            return (
              <div key={`${skillId}-${index}`} className="flex items-center justify-between p-2 bg-green-50 rounded border">
                <div>
                  <span className="text-sm font-medium">{skill.name || skill.id}</span>
                  <p className="text-xs text-gray-500">{skill.description || '技能描述'}</p>
                  <p className="text-xs text-blue-500">{skill.mode || skill.type}</p>
                </div>
                <button
                  onClick={() => forgetSkill(selectedSummonId, skillId)}
                  className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                >
                  遗忘
                </button>
              </div>
            );
          })}
        </div>
        {(!selectedSummon?.skillSet || selectedSummon.skillSet.filter(s => s).length === 0) && (
          <p className="text-gray-500 text-sm">还没有学习任何技能</p>
        )}
      </div>

      {/* 可学技能（从现有技能配置） */}
      <div>
        <h4 className="font-medium mb-2">可学技能</h4>
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {skillConfig.slice(0, 12).map(skill => {
            const skillId = skill.id || skill.name;
            const isLearned = selectedSummon?.skillSet?.includes(skillId);
            return (
              <div key={skillId} className={`flex items-center justify-between p-3 rounded border ${
                isLearned ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200 hover:border-blue-300'
              }`}>
                <div>
                  <span className="font-medium">{skill.name}</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{skill.mode || skill.type}</span>
                  <p className="text-sm text-gray-600 mt-1">{skill.description || '技能描述'}</p>
                </div>
                <button
                  onClick={() => learnSkill(selectedSummonId, skillId)}
                  disabled={isLearned}
                  className={`px-3 py-1 rounded text-sm ${
                    isLearned 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  {isLearned ? '已学会' : '学习'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // 渲染装备管理界面（使用现有装备系统）
  const renderEquipmentManagement = () => (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="font-bold text-lg mb-3">装备管理</h3>
      
      {/* 已装备物品 */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">已装备</h4>
        <div className="grid grid-cols-1 gap-2 mb-3">
          {selectedSummon?.equipment && Object.keys(selectedSummon.equipment).length > 0 ? (
            Object.entries(selectedSummon.equipment).map(([slotType, itemId]) => {
              const item = inventoryItems.find(item => item.id === itemId) || { id: itemId, name: itemId };
              return (
                <div key={slotType} className="flex items-center justify-between p-2 bg-green-50 rounded border">
                  <div>
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{slotType}</span>
                    {item.attributes && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Object.entries(item.attributes).map(([attr, value]) => `+${value} ${attr}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => unequipItem(selectedSummonId, slotType)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                  >
                    卸下
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-sm">没有装备任何物品</p>
          )}
        </div>
      </div>

      {/* 可装备物品（从背包系统） */}
      <div>
        <h4 className="font-medium mb-2">可装备物品</h4>
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {equippableItems.slice(0, 10).map(item => {
            const isEquipped = selectedSummon?.equipment && Object.values(selectedSummon.equipment).includes(item.id);
            return (
              <div key={item.id} className={`flex items-center justify-between p-3 rounded border ${
                isEquipped ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200 hover:border-blue-300'
              }`}>
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{item.slotType}</span>
                  {item.attributes && (
                    <p className="text-sm text-gray-600 mt-1">
                      {Object.entries(item.attributes).map(([attr, value]) => `+${value} ${attr}`).join(', ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => equipItem(item.id, selectedSummonId)}
                  disabled={isEquipped}
                  className={`px-3 py-1 rounded text-sm ${
                    isEquipped 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isEquipped ? '已装备' : '装备'}
                </button>
              </div>
            );
          })}
          {equippableItems.length === 0 && (
            <p className="text-gray-500 text-sm">背包中没有可装备的物品</p>
          )}
        </div>
      </div>
    </div>
  );

  // 渲染当前召唤兽详情
  const renderCurrentSummonDetails = () => {
    if (!selectedSummon) {
      return (
        <div className="text-center text-gray-500 py-8">
          请选择一个召唤兽查看详情
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-bold text-lg mb-3">基本信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-600">昵称:</label>
              <input
                type="text"
                value={selectedSummon.nickname || ''}
                onChange={(e) => changeSummonNickname(selectedSummonId, e.target.value)}
                className="w-full px-2 py-1 border rounded"
                placeholder="输入昵称..."
              />
            </div>
            <div>
              <label className="block text-gray-600">等级:</label>
              <span className="font-medium">{selectedSummon.level}</span>
            </div>
            <div>
              <label className="block text-gray-600">品质:</label>
              <span className="font-medium">{selectedSummon.quality}</span>
            </div>
            <div>
              <label className="block text-gray-600">战力:</label>
              <span className="font-medium text-blue-600">{selectedSummon.power || 0}</span>
            </div>
            <div>
              <label className="block text-gray-600">潜力点:</label>
              <span className="font-medium text-green-600">{selectedSummon.potentialPoints}</span>
            </div>
            <div>
              <label className="block text-gray-600">经验值:</label>
              <span className="font-medium">{selectedSummon.experience}</span>
            </div>
          </div>
        </div>

        {/* 基础属性 */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-bold text-lg mb-3">基础属性</h3>
          <div className="space-y-2">
            {Object.entries(selectedSummon.basicAttributes || {}).map(([attr, value]) => (
              <div key={attr} className="flex items-center justify-between">
                <span className="capitalize">{attr}:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{value}</span>
                  <span className="text-gray-500">
                    (+{selectedSummon.allocatedPoints?.[attr] || 0})
                  </span>
                  <button
                    onClick={() => handleAllocatePoints(attr, 1)}
                    disabled={selectedSummon.potentialPoints <= 0}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs disabled:bg-gray-300"
                  >
                    +1
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => resetPoints(selectedSummonId)}
            className="mt-3 px-3 py-1 bg-yellow-500 text-white rounded text-sm"
          >
            重置分配
          </button>
        </div>

        {/* 技能管理 */}
        {renderSkillManagement()}

        {/* 装备管理 */}
        {renderEquipmentManagement()}

        {/* 操作按钮 */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-bold text-lg mb-3">操作</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleTestLevelUp}
              className="px-3 py-2 bg-green-500 text-white rounded"
            >
              升级 (+1级)
            </button>
            <button
              onClick={() => cloneSummon(selectedSummonId)}
              className="px-3 py-2 bg-blue-500 text-white rounded"
            >
              复制召唤兽
            </button>
            <button
              onClick={handleLearnSkill}
              className="px-3 py-2 bg-purple-500 text-white rounded"
            >
              学习随机技能
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 渲染统计信息
  const renderStats = () => (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-bold text-lg mb-3">总体统计</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>总数量: {derivedAttributes.total}</div>
          <div>平均等级: {derivedAttributes.averageLevel.toFixed(1)}</div>
          <div>总战力: {derivedAttributes.totalPower}</div>
          <div>平均战力: {derivedAttributes.averagePower.toFixed(0)}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-bold text-lg mb-3">品质分布</h3>
        <div className="space-y-2">
          {Object.entries(derivedAttributes.byQuality).map(([quality, count]) => (
            <div key={quality} className="flex justify-between">
              <span className="capitalize">{quality}:</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-bold text-lg mb-3">系统信息</h3>
        <div className="space-y-2 text-sm">
          <div>可学技能总数: {skillConfig.length}</div>
          <div>可装备物品总数: {equippableItems.length}</div>
          <div>背包物品总数: {inventoryItems.length}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-bold text-lg mb-3">批量操作</h3>
        <div className="space-x-2">
          <button
            onClick={() => batchRecalculate()}
            className="px-3 py-2 bg-blue-500 text-white rounded"
          >
            重算所有属性
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">面向对象召唤兽管理系统演示</h1>
        <p className="text-gray-600">
          展示封装等OOP特性。使用现有的装备和技能系统，支持基础属性管理、技能学习、装备系统等功能。
        </p>
        {selectedSummon && (
          <p className="text-sm text-blue-600 mt-2">
            当前选中: {selectedSummon.nickname || selectedSummon.id}
          </p>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex justify-between items-center">
            <div>
              <strong>错误: {error.message}</strong>
              {error.details && <p className="text-sm mt-1">{error.details}</p>}
            </div>
            <button
              onClick={clearError}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 快速创建按钮 */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold mb-3">快速创建召唤兽</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleCreateSummon}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            创建召唤兽
          </button>
          <button
            onClick={() => {
              console.log('=== 开始召唤兽类型系统测试 ===');
              if (window.summonNatureTest) {
                window.summonNatureTest.runAllTests();
              } else {
                console.error('测试函数未加载，请刷新页面重试');
              }
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            运行类型测试
          </button>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          {[
            { id: 'list', label: '召唤兽列表' },
            { id: 'details', label: '详细信息' },
            { id: 'derivedAttributes', label: '统计信息' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 -mb-px ${
                selectedTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：召唤兽列表 */}
        <div className="lg:col-span-1">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-bold text-lg mb-3">召唤兽列表</h3>
            
            {/* 过滤器 */}
            <div className="mb-4 space-y-2">
              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value="">所有品质</option>
                <option value="normal">普通</option>
                <option value="rare">稀有</option>
                <option value="epic">史诗</option>
                <option value="legendary">传说</option>
              </select>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredSummons.map(renderSummonCard)}
              {filteredSummons.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  没有召唤兽
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：详情/统计 */}
        <div className="lg:col-span-2">
          {selectedTab === 'list' && (
            <div className="text-center text-gray-500 py-8">
              切换到"详细信息"或"统计信息"标签页查看更多内容
            </div>
          )}
          {selectedTab === 'details' && renderCurrentSummonDetails()}
          {selectedTab === 'derivedAttributes' && renderStats()}
        </div>
      </div>
    </div>
  );
};

export default SummonManagerDemo; 