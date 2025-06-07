/**
 * NPC管理器演示组件 - 展示OOP NPC系统功能
 * 核心功能：NPC创建、管理、场景分配、交互演示
 * 
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-07
 */

import React, { useState, useEffect } from 'react';
import { useNpcManager } from '@/hooks/useNpcManager';
import { NPC_TYPES, NPC_STATES } from '@/config/enumConfig';
import { allNpcTemplates, getNpcTemplatesByType } from '@/config/character/npcTemplatesConfig';

const NpcManagerDemo = ({ onClose }) => {
  // 使用NPC管理器Hook
  const {
    npcs,
    templates,
    statistics,
    activeInteractions,
    isInitialized,
    error,
    createNpc,
    removeNpc,
    getNpc,
    getNpcsByType,
    assignNpcToDungeon,
    assignNpcToNode,
    assignNpcToQuest,
    assignNpcToHomestead,
    getNpcsInDungeon,
    getNpcsInNode,
    getNpcsInQuest,
    getNpcInHomestead,
    startInteraction,
    endInteraction,
    createNpcsFromTemplates,
    resetAllNpcs,
    isNpcAssignedTo,
    clearError,
    refreshState
  } = useNpcManager();

  // 本地状态
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedNpcId, setSelectedNpcId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [createForm, setCreateForm] = useState({
    templateId: '',
    overrides: {
      name: '',
      displayName: '',
      level: 1
    }
  });
  const [assignmentForm, setAssignmentForm] = useState({
    npcId: '',
    sceneType: 'dungeon',
    sceneId: '',
    role: 'npc'
  });
  const [queryForm, setQueryForm] = useState({
    sceneType: 'dungeon',
    sceneId: ''
  });

  // 选中的NPC详情
  const selectedNpc = selectedNpcId ? npcs[selectedNpcId] : null;

  // 获取NPC列表
  const npcList = Object.values(npcs);

  // 处理创建NPC
  const handleCreateNpc = () => {
    if (!createForm.templateId) {
      alert('请选择NPC模板');
      return;
    }

    const overrides = {};
    if (createForm.overrides.name) overrides.name = createForm.overrides.name;
    if (createForm.overrides.displayName) overrides.displayName = createForm.overrides.displayName;
    if (createForm.overrides.level > 1) overrides.level = createForm.overrides.level;

    const newNpc = createNpc(createForm.templateId, overrides);
    if (newNpc) {
      alert(`创建NPC成功: ${newNpc.name} (${newNpc.id})`);
      setCreateForm({
        templateId: '',
        overrides: { name: '', displayName: '', level: 1 }
      });
    }
  };

  // 处理删除NPC
  const handleRemoveNpc = (npcId) => {
    if (confirm('确定要删除这个NPC吗？')) {
      const success = removeNpc(npcId);
      if (success) {
        alert('NPC删除成功');
        if (selectedNpcId === npcId) {
          setSelectedNpcId(null);
        }
      }
    }
  };

  // 处理场景分配
  const handleAssignNpc = () => {
    const { npcId, sceneType, sceneId, role } = assignmentForm;
    if (!npcId || !sceneId) {
      alert('请填写完整的分配信息');
      return;
    }

    let success = false;
    switch (sceneType) {
      case 'dungeon':
        success = assignNpcToDungeon(npcId, sceneId, role);
        break;
      case 'node':
        success = assignNpcToNode(npcId, sceneId, role);
        break;
      case 'quest':
        success = assignNpcToQuest(npcId, sceneId, role);
        break;
      case 'homestead':
        success = assignNpcToHomestead(npcId, sceneId, role);
        break;
      default:
        alert('未知的场景类型');
        return;
    }

    if (success) {
      alert(`分配成功: NPC ${npcId} 已分配到 ${sceneType} ${sceneId}`);
      setAssignmentForm({ npcId: '', sceneType: 'dungeon', sceneId: '', role: 'npc' });
    }
  };

  // 查询场景中的NPC
  const handleQueryScene = () => {
    const { sceneType, sceneId } = queryForm;
    if (!sceneId) {
      alert('请输入场景ID');
      return;
    }

    let result = [];
    switch (sceneType) {
      case 'dungeon':
        result = getNpcsInDungeon(sceneId);
        break;
      case 'node':
        result = getNpcsInNode(sceneId);
        break;
      case 'quest':
        result = getNpcsInQuest(sceneId);
        break;
      case 'homestead':
        const npc = getNpcInHomestead(sceneId);
        result = npc ? [npc] : [];
        break;
      default:
        alert('未知的场景类型');
        return;
    }

    alert(`${sceneType} ${sceneId} 中的NPC: ${result.length > 0 ? result.map(n => n.name).join(', ') : '无'}`);
  };

  // 处理交互
  const handleStartInteraction = (npcId) => {
    const interactionId = startInteraction(npcId);
    if (interactionId) {
      alert(`开始与NPC交互: ${interactionId}`);
    }
  };

  const handleEndInteraction = (interactionId) => {
    const success = endInteraction(interactionId);
    if (success) {
      alert(`结束交互: ${interactionId}`);
    }
  };

  // 批量创建示例NPC
  const handleCreateSampleNpcs = () => {
    const sampleConfigs = [
      { templateId: 'village_elder', count: 1 },
      { templateId: 'blacksmith', count: 1 },
      { templateId: 'alchemist', count: 1 },
      { templateId: 'traveling_merchant', count: 2 },
      { templateId: 'city_guard', count: 3 }
    ];

    const createdNpcs = createNpcsFromTemplates(sampleConfigs);
    alert(`批量创建完成，共创建 ${createdNpcs.length} 个NPC`);
  };

  // 渲染概览标签页
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* 统计信息 */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">系统统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{statistics.totalNpcs || 0}</div>
            <div className="text-sm text-gray-600">总NPC数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{statistics.activeNpcs || 0}</div>
            <div className="text-sm text-gray-600">活跃NPC</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{statistics.totalTemplates || 0}</div>
            <div className="text-sm text-gray-600">模板数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{statistics.totalInteractions || 0}</div>
            <div className="text-sm text-gray-600">总交互数</div>
          </div>
        </div>
      </div>

      {/* 错误显示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-700 hover:text-red-900">✕</button>
          </div>
        </div>
      )}

      {/* 系统状态 */}
      <div className="flex items-center space-x-4">
        <div className={`px-3 py-1 rounded-full text-sm ${isInitialized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {isInitialized ? '已初始化' : '初始化中'}
        </div>
        <button
          onClick={refreshState}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          刷新状态
        </button>
        <button
          onClick={handleCreateSampleNpcs}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          创建示例NPC
        </button>
        <button
          onClick={() => {
            if (confirm('确定要重置所有NPC吗？')) {
              resetAllNpcs();
            }
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          重置所有NPC
        </button>
      </div>
    </div>
  );

  // 渲染NPC管理标签页
  const renderNpcManagementTab = () => (
    <div className="space-y-6">
      {/* 创建NPC表单 */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">创建NPC</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <select
            value={createForm.templateId}
            onChange={(e) => setCreateForm(prev => ({ ...prev, templateId: e.target.value }))}
            className="border rounded px-3 py-2"
          >
            <option value="">选择模板</option>
            {Object.keys(templates).map(templateId => (
              <option key={templateId} value={templateId}>
                {templates[templateId].name} ({templateId})
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="自定义名称 (可选)"
            value={createForm.overrides.name}
            onChange={(e) => setCreateForm(prev => ({
              ...prev,
              overrides: { ...prev.overrides, name: e.target.value }
            }))}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="显示名称 (可选)"
            value={createForm.overrides.displayName}
            onChange={(e) => setCreateForm(prev => ({
              ...prev,
              overrides: { ...prev.overrides, displayName: e.target.value }
            }))}
            className="border rounded px-3 py-2"
          />
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="等级"
              min="1"
              max="100"
              value={createForm.overrides.level}
              onChange={(e) => setCreateForm(prev => ({
                ...prev,
                overrides: { ...prev.overrides, level: parseInt(e.target.value) || 1 }
              }))}
              className="border rounded px-3 py-2 flex-1"
            />
            <button
              onClick={handleCreateNpc}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              创建
            </button>
          </div>
        </div>
      </div>

      {/* NPC列表 */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">NPC列表 ({npcList.length})</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {npcList.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              暂无NPC，请先创建一些NPC
            </div>
          ) : (
            <div className="divide-y">
              {npcList.map(npc => (
                <div key={npc.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          npc.state === NPC_STATES.IDLE ? 'bg-green-500' :
                          npc.state === NPC_STATES.TALKING ? 'bg-blue-500' :
                          npc.state === NPC_STATES.BUSY ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}
                      />
                      <div>
                        <div className="font-medium">{npc.displayName}</div>
                        <div className="text-sm text-gray-500">
                          {npc.id} | {npc.type} | Lv.{npc.level}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedNpcId(npc.id)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        详情
                      </button>
                      <button
                        onClick={() => handleStartInteraction(npc.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        交互
                      </button>
                      <button
                        onClick={() => handleRemoveNpc(npc.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  {/* 分配信息 */}
                  {(npc.assignments.dungeons.length > 0 || npc.assignments.nodes.length > 0 || 
                    npc.assignments.quests.length > 0 || npc.assignments.homestead) && (
                    <div className="mt-2 text-xs text-gray-600">
                      分配到: 
                      {npc.assignments.dungeons.length > 0 && ` 副本[${npc.assignments.dungeons.join(',')}]`}
                      {npc.assignments.nodes.length > 0 && ` 节点[${npc.assignments.nodes.join(',')}]`}
                      {npc.assignments.quests.length > 0 && ` 任务[${npc.assignments.quests.join(',')}]`}
                      {npc.assignments.homestead && ` 家园[${npc.assignments.homestead}]`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 渲染场景分配标签页
  const renderSceneAssignmentTab = () => (
    <div className="space-y-6">
      {/* 分配表单 */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">场景分配</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={assignmentForm.npcId}
            onChange={(e) => setAssignmentForm(prev => ({ ...prev, npcId: e.target.value }))}
            className="border rounded px-3 py-2"
          >
            <option value="">选择NPC</option>
            {npcList.map(npc => (
              <option key={npc.id} value={npc.id}>
                {npc.displayName} ({npc.id})
              </option>
            ))}
          </select>
          <select
            value={assignmentForm.sceneType}
            onChange={(e) => setAssignmentForm(prev => ({ ...prev, sceneType: e.target.value }))}
            className="border rounded px-3 py-2"
          >
            <option value="dungeon">副本</option>
            <option value="node">节点</option>
            <option value="quest">任务</option>
            <option value="homestead">家园</option>
          </select>
          <input
            type="text"
            placeholder="场景ID"
            value={assignmentForm.sceneId}
            onChange={(e) => setAssignmentForm(prev => ({ ...prev, sceneId: e.target.value }))}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="角色 (可选)"
            value={assignmentForm.role}
            onChange={(e) => setAssignmentForm(prev => ({ ...prev, role: e.target.value }))}
            className="border rounded px-3 py-2"
          />
          <button
            onClick={handleAssignNpc}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            分配
          </button>
        </div>
      </div>

      {/* 查询表单 */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">场景查询</h3>
        <div className="flex space-x-4">
          <select
            value={queryForm.sceneType}
            onChange={(e) => setQueryForm(prev => ({ ...prev, sceneType: e.target.value }))}
            className="border rounded px-3 py-2"
          >
            <option value="dungeon">副本</option>
            <option value="node">节点</option>
            <option value="quest">任务</option>
            <option value="homestead">家园</option>
          </select>
          <input
            type="text"
            placeholder="场景ID"
            value={queryForm.sceneId}
            onChange={(e) => setQueryForm(prev => ({ ...prev, sceneId: e.target.value }))}
            className="border rounded px-3 py-2 flex-1"
          />
          <button
            onClick={handleQueryScene}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            查询
          </button>
        </div>
      </div>

      {/* 场景分配统计 */}
      {statistics.assignmentCounts && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">分配统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{statistics.assignmentCounts.dungeons || 0}</div>
              <div className="text-sm text-gray-600">副本场景</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{statistics.assignmentCounts.nodes || 0}</div>
              <div className="text-sm text-gray-600">节点场景</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{statistics.assignmentCounts.quests || 0}</div>
              <div className="text-sm text-gray-600">任务场景</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">{statistics.assignmentCounts.homesteads || 0}</div>
              <div className="text-sm text-gray-600">家园场景</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染NPC详情标签页
  const renderNpcDetailsTab = () => {
    if (!selectedNpc) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-500">请先选择一个NPC查看详情</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">基本信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><strong>ID:</strong> {selectedNpc.id}</div>
            <div><strong>模板ID:</strong> {selectedNpc.templateId}</div>
            <div><strong>名称:</strong> {selectedNpc.name}</div>
            <div><strong>显示名称:</strong> {selectedNpc.displayName}</div>
            <div><strong>类型:</strong> {selectedNpc.type}</div>
            <div><strong>状态:</strong> {selectedNpc.state}</div>
            <div><strong>等级:</strong> {selectedNpc.level}</div>
            <div><strong>阵营:</strong> {selectedNpc.faction}</div>
          </div>
        </div>

        {/* 功能配置 */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">功能配置</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(selectedNpc.functions).map(([func, enabled]) => (
              <div key={func} className={`px-3 py-1 rounded text-sm ${enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {func}: {enabled ? '✓' : '✗'}
              </div>
            ))}
          </div>
        </div>

        {/* 属性信息 */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">属性</h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(selectedNpc.attributes).map(([attr, value]) => (
              <div key={attr} className="text-center">
                <div className="text-xl font-bold">{value}</div>
                <div className="text-sm text-gray-600">{attr}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 分配信息 */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">场景分配</h3>
          <div className="space-y-2">
            {selectedNpc.assignments.dungeons.length > 0 && (
              <div><strong>副本:</strong> {selectedNpc.assignments.dungeons.join(', ')}</div>
            )}
            {selectedNpc.assignments.nodes.length > 0 && (
              <div><strong>节点:</strong> {selectedNpc.assignments.nodes.join(', ')}</div>
            )}
            {selectedNpc.assignments.quests.length > 0 && (
              <div><strong>任务:</strong> {selectedNpc.assignments.quests.join(', ')}</div>
            )}
            {selectedNpc.assignments.homestead && (
              <div><strong>家园:</strong> {selectedNpc.assignments.homestead}</div>
            )}
            {Object.values(selectedNpc.assignments).every(v => Array.isArray(v) ? v.length === 0 : !v) && (
              <div className="text-gray-500">暂无场景分配</div>
            )}
          </div>
        </div>

        {/* 服务和任务 */}
        {(selectedNpc.services.length > 0 || selectedNpc.questIds.length > 0 || selectedNpc.teachableSkills.length > 0) && (
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">服务与任务</h3>
            {selectedNpc.services.length > 0 && (
              <div className="mb-2"><strong>服务:</strong> {selectedNpc.services.join(', ')}</div>
            )}
            {selectedNpc.questIds.length > 0 && (
              <div className="mb-2"><strong>任务:</strong> {selectedNpc.questIds.join(', ')}</div>
            )}
            {selectedNpc.teachableSkills.length > 0 && (
              <div><strong>可教授技能:</strong> {selectedNpc.teachableSkills.join(', ')}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-5/6 flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">NPC管理器演示 - OOP配置化系统</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* 标签页导航 */}
        <div className="flex border-b">
          {[
            { id: 'overview', label: '概览' },
            { id: 'management', label: 'NPC管理' },
            { id: 'assignment', label: '场景分配' },
            { id: 'details', label: 'NPC详情' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 标签页内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'management' && renderNpcManagementTab()}
          {activeTab === 'assignment' && renderSceneAssignmentTab()}
          {activeTab === 'details' && renderNpcDetailsTab()}
        </div>

        {/* 活动交互显示 */}
        {Object.keys(activeInteractions).length > 0 && (
          <div className="border-t p-4 bg-gray-50">
            <h4 className="font-semibold mb-2">活动交互 ({Object.keys(activeInteractions).length})</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(activeInteractions).map(([interactionId, interaction]) => (
                <div key={interactionId} className="bg-blue-100 px-3 py-1 rounded flex items-center space-x-2">
                  <span className="text-sm">{interaction.npcId}</span>
                  <button
                    onClick={() => handleEndInteraction(interactionId)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    结束
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NpcManagerDemo; 