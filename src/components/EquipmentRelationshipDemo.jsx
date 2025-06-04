/**
 * 装备关系管理演示组件
 * 展示和测试装备关系管理器的功能
 */
import React, { useState, useEffect } from 'react';
import { 
  useEquipmentRelationship, 
  useEquipmentStatistics,
  useItemEquipmentStatus,
  useSummonEquipmentStatus 
} from '../hooks/useEquipmentRelationship';

const EquipmentRelationshipDemo = () => {
  const {
    equipItem,
    unequipItem,
    unequipFromSlot,
    swapEquipment,
    removeAllSummonEquipment,
    validateConsistency,
    repairConsistency,
    getSummonEquipment,
    getAllEquipmentRelations,
    isItemEquipped,
    isLoading,
    error,
    clearError
  } = useEquipmentRelationship();

  const statistics = useEquipmentStatistics();
  
  const [testItemId, setTestItemId] = useState('test_item_001');
  const [testSummonId, setTestSummonId] = useState('test_summon_001');
  const [testSlotType, setTestSlotType] = useState('weapon');
  const [testSummonId2, setTestSummonId2] = useState('test_summon_002');
  const [selectedItemForStatus, setSelectedItemForStatus] = useState('');
  const [selectedSummonForStatus, setSelectedSummonForStatus] = useState('');

  // 测试物品的装备状态
  const itemStatus = useItemEquipmentStatus(selectedItemForStatus);
  
  // 测试召唤兽的装备状态
  const summonEquipmentStatus = useSummonEquipmentStatus(selectedSummonForStatus);

  const [allRelations, setAllRelations] = useState([]);
  const [validationResult, setValidationResult] = useState(null);

  // 更新关系列表
  const updateRelations = () => {
    setAllRelations(getAllEquipmentRelations());
  };

  useEffect(() => {
    updateRelations();
  }, [getAllEquipmentRelations]);

  // 测试功能
  const handleTestEquip = async () => {
    console.log('测试装备:', { testItemId, testSummonId, testSlotType });
    const success = await equipItem(testItemId, testSummonId, testSlotType);
    console.log('装备结果:', success);
    updateRelations();
  };

  const handleTestUnequip = async () => {
    console.log('测试卸装:', testItemId);
    const success = await unequipItem(testItemId);
    console.log('卸装结果:', success);
    updateRelations();
  };

  const handleTestUnequipFromSlot = async () => {
    console.log('测试从槽位卸装:', { testSummonId, testSlotType });
    const success = await unequipFromSlot(testSummonId, testSlotType);
    console.log('槽位卸装结果:', success);
    updateRelations();
  };

  const handleTestSwap = async () => {
    console.log('测试交换装备:', { testSummonId, testSummonId2, testSlotType });
    const success = await swapEquipment(testSummonId, testSummonId2, testSlotType);
    console.log('交换结果:', success);
    updateRelations();
  };

  const handleTestRemoveAll = async () => {
    console.log('测试移除所有装备:', testSummonId);
    const removedItems = await removeAllSummonEquipment(testSummonId);
    console.log('移除的装备:', removedItems);
    updateRelations();
  };

  const handleValidate = () => {
    const result = validateConsistency();
    setValidationResult(result);
    console.log('验证结果:', result);
  };

  const handleRepair = () => {
    const result = repairConsistency();
    console.log('修复结果:', result);
    setValidationResult(result.finalValidation);
    updateRelations();
  };

  const handleCreateTestData = async () => {
    // 创建一些测试数据
    await equipItem('item_001', 'summon_001', 'weapon');
    await equipItem('item_002', 'summon_001', 'armor');
    await equipItem('item_003', 'summon_002', 'weapon');
    await equipItem('item_004', 'summon_003', 'accessory');
    updateRelations();
  };

  const handleClearTestData = async () => {
    // 清除所有测试数据
    for (const relation of allRelations) {
      await unequipItem(relation.itemId);
    }
    updateRelations();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">装备关系管理系统演示</h1>

      {/* 错误显示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex justify-between">
            <span>错误: {error}</span>
            <button 
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          正在处理装备操作...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 基本操作测试 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">基本操作测试</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">物品ID:</label>
              <input
                type="text"
                value={testItemId}
                onChange={(e) => setTestItemId(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="输入物品ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">召唤兽ID:</label>
              <input
                type="text"
                value={testSummonId}
                onChange={(e) => setTestSummonId(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="输入召唤兽ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">槽位类型:</label>
              <select
                value={testSlotType}
                onChange={(e) => setTestSlotType(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="weapon">武器</option>
                <option value="armor">防具</option>
                <option value="accessory">饰品</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">召唤兽2 ID (用于交换):</label>
              <input
                type="text"
                value={testSummonId2}
                onChange={(e) => setTestSummonId2(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="输入第二个召唤兽ID"
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleTestEquip}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={isLoading}
              >
                装备
              </button>
              <button
                onClick={handleTestUnequip}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={isLoading}
              >
                卸装
              </button>
              <button
                onClick={handleTestUnequipFromSlot}
                className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                disabled={isLoading}
              >
                从槽位卸装
              </button>
              <button
                onClick={handleTestSwap}
                className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                disabled={isLoading}
              >
                交换装备
              </button>
            </div>
            <button
              onClick={handleTestRemoveAll}
              className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              disabled={isLoading}
            >
              移除所有装备
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">统计信息</h2>
          
          <div className="space-y-2 text-sm">
            <div>总装备关系: {statistics.totalRelations}</div>
            <div>装备的召唤兽: {statistics.totalSummons}</div>
            <div>平均装备数: {statistics.averageEquipmentPerSummon.toFixed(2)}</div>
            
            <div className="mt-3">
              <div className="font-medium">槽位分布:</div>
              {Object.entries(statistics.slotTypeDistribution).map(([slot, count]) => (
                <div key={slot} className="ml-2">
                  {slot}: {count}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 状态查询测试 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">状态查询测试</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">查询物品装备状态:</label>
              <input
                type="text"
                value={selectedItemForStatus}
                onChange={(e) => setSelectedItemForStatus(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="输入物品ID"
              />
              {selectedItemForStatus && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                  <div>是否装备: {itemStatus.isEquipped ? '是' : '否'}</div>
                  {itemStatus.isEquipped && (
                    <>
                      <div>装备的召唤兽: {itemStatus.summonId}</div>
                      <div>装备槽位: {itemStatus.slotType}</div>
                      <div>装备时间: {new Date(itemStatus.equippedAt).toLocaleString()}</div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">查询召唤兽装备状态:</label>
              <input
                type="text"
                value={selectedSummonForStatus}
                onChange={(e) => setSelectedSummonForStatus(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="输入召唤兽ID"
              />
              {selectedSummonForStatus && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                  <div>装备槽位数: {summonEquipmentStatus.slotCount}</div>
                  <div>是否有装备: {summonEquipmentStatus.isEmpty ? '否' : '是'}</div>
                  {!summonEquipmentStatus.isEmpty && (
                    <div>
                      <div className="font-medium mt-2">装备详情:</div>
                      {Object.entries(summonEquipmentStatus.equipment).map(([slot, itemId]) => (
                        <div key={slot} className="ml-2">
                          {slot}: {itemId}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 数据一致性检查 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">数据一致性检查</h2>
          
          <div className="space-y-2">
            <button
              onClick={handleValidate}
              className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              验证数据一致性
            </button>
            <button
              onClick={handleRepair}
              className="w-full px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              修复数据不一致
            </button>
          </div>

          {validationResult && (
            <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
              <div className={validationResult.isConsistent ? 'text-green-600' : 'text-red-600'}>
                数据一致性: {validationResult.isConsistent ? '正常' : '存在问题'}
              </div>
              <div>总关系数: {validationResult.totalRelations}</div>
              <div>问题数量: {validationResult.issues.length}</div>
              {validationResult.issues.length > 0 && (
                <div className="mt-2">
                  <div className="font-medium">问题详情:</div>
                  {validationResult.issues.map((issue, index) => (
                    <div key={index} className="ml-2 text-red-600">
                      {issue.message} - {issue.itemId}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 当前装备关系列表 */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">当前装备关系</h2>
          <div className="space-x-2">
            <button
              onClick={handleCreateTestData}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              创建测试数据
            </button>
            <button
              onClick={handleClearTestData}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              清除所有数据
            </button>
            <button
              onClick={updateRelations}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              刷新
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">物品ID</th>
                <th className="p-2 text-left">召唤兽ID</th>
                <th className="p-2 text-left">槽位类型</th>
                <th className="p-2 text-left">装备时间</th>
                <th className="p-2 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {allRelations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">
                    暂无装备关系
                  </td>
                </tr>
              ) : (
                allRelations.map((relation, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{relation.itemId}</td>
                    <td className="p-2">{relation.summonId}</td>
                    <td className="p-2">{relation.slotType}</td>
                    <td className="p-2">{new Date(relation.equippedAt).toLocaleString()}</td>
                    <td className="p-2">
                      <button
                        onClick={() => unequipItem(relation.itemId).then(updateRelations)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        disabled={isLoading}
                      >
                        卸装
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EquipmentRelationshipDemo; 