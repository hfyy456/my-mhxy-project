/**
 * 面向对象背包系统示例
 * 展示：继承与多态、双向关联、单一职责、扩展性
 */
import React, { useState, useEffect } from 'react';
import { useInventoryManager, useInventoryActions } from '../hooks/useInventoryManager';

export default function OOPInventoryExample() {
  const inventoryState = useInventoryManager();
  const actions = useInventoryActions();
  const [log, setLog] = useState([]);
  const [selectedSummon, setSelectedSummon] = useState('summon_001');

  // 添加日志
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev.slice(-9), { message, type, timestamp }]);
  };

  // 演示继承与多态
  const demonstratePolymorphism = () => {
    addLog('=== 演示继承与多态 ===', 'header');
    
    // 创建不同类型的物品
    const items = [
      {
        name: '青龙偃月刀',
        type: 'equipment',
        subType: 'weapon',
        slotType: 'weapon',
        rarity: 'legendary',
        effects: { attack: 50, strength: 20 },
        requirements: { level: 30 },
        description: '关羽的专属武器，威力巨大'
      },
      {
        name: '超级金疮药',
        type: 'consumable',
        subType: 'potion',
        rarity: 'rare',
        quantity: 5,
        maxStack: 99,
        useEffect: { heal: 1000 },
        cooldown: 3000,
        description: '瞬间恢复1000生命值'
      },
      {
        name: '黑铁矿石',
        type: 'material',
        subType: 'ore',
        rarity: 'common',
        quantity: 20,
        maxStack: 999,
        craftingTypes: ['weapon', 'armor'],
        description: '用于锻造武器和防具的材料'
      },
      {
        name: '神秘钥匙',
        type: 'quest',
        rarity: 'unique',
        questId: 'main_quest_001',
        isKeyItem: true,
        description: '开启神秘宝箱的钥匙'
      }
    ];

    items.forEach(itemData => {
      const success = actions.addItem(itemData);
      addLog(`添加${itemData.name} (${itemData.type}类): ${success ? '成功' : '失败'}`);
    });

    addLog('不同类型物品创建完成，展示了继承体系', 'success');
  };

  // 演示use方法的多态行为
  const demonstrateUsePolymorphism = () => {
    addLog('=== 演示use方法多态 ===', 'header');
    
    // 获取背包中的物品
    const items = inventoryState.slots?.filter(slot => !slot.isEmpty) || [];
    
    items.slice(0, 4).forEach(slot => {
      const item = actions.getItemBySlot(slot.index);
      if (item) {
        addLog(`尝试使用 ${item.name} (${item.type}类):`);
        
        // 根据物品类型传入不同的目标
        let target = null;
        if (item.type === 'equipment') {
          target = selectedSummon; // 装备需要目标召唤兽
        } else if (item.type === 'consumable') {
          target = { name: '主角', hp: 500, maxHp: 1000 }; // 消耗品需要目标角色
        }
        
        const success = actions.useItem(slot.index, target);
        addLog(`  结果: ${success ? '成功' : '失败'} - 展示了${item.type}类的多态行为`);
      }
    });
  };

  // 演示双向关联
  const demonstrateBidirectionalAssociation = () => {
    addLog('=== 演示双向关联 ===', 'header');
    
    // 添加一个测试物品
    const testItem = {
      name: '测试双向关联物品',
      type: 'consumable',
      quantity: 3,
      description: '用于测试双向关联的物品'
    };
    
    const success = actions.addItem(testItem);
    if (success) {
      addLog('物品添加成功，物品已知道自己在背包中的位置');
      addLog('物品可以主动从背包中移除自己（双向关联）');
      
      // 模拟物品主动移除自己（这在实际使用中会在物品的方法中调用）
      const slots = inventoryState.slots?.filter(slot => !slot.isEmpty) || [];
      const lastSlot = slots[slots.length - 1];
      if (lastSlot) {
        setTimeout(() => {
          actions.removeItem(lastSlot.index);
          addLog('物品已通过双向关联从背包中移除自己', 'success');
        }, 2000);
      }
    }
  };

  // 演示单一职责
  const demonstrateSingleResponsibility = () => {
    addLog('=== 演示单一职责原则 ===', 'header');
    addLog('背包管理器：专注于物品存储和插槽管理');
    addLog('物品类：封装自身行为（使用、装备、堆叠等）');
    addLog('插槽类：管理插槽状态');
    addLog('工厂类：负责创建不同类型的物品实例');
    addLog('每个类都有明确、单一的职责', 'success');
  };

  // 演示扩展性
  const demonstrateExtensibility = () => {
    addLog('=== 演示扩展性 ===', 'header');
    addLog('系统支持轻松扩展新的物品类型：');
    addLog('1. 继承Item基类');
    addLog('2. 重写use方法实现特定逻辑');
    addLog('3. 在ItemFactory中添加创建逻辑');
    addLog('4. 无需修改现有代码');
    
    // 演示创建一个新类型的物品（假设我们扩展了一个新类型）
    const newTypeItem = {
      name: '神秘卷轴',
      type: 'special', // 假设的新类型
      description: '具有特殊效果的物品',
      rarity: 'epic'
    };
    
    addLog('即使遇到未知类型，系统仍能正常工作（回退到基类）');
    const success = actions.addItem(newTypeItem);
    addLog(`添加新类型物品: ${success ? '成功' : '失败'}`);
  };

  // 清理演示数据
  const clearDemo = () => {
    setLog([]);
    // 这里可以调用清理函数
  };

  // 物品使用统计
  const getItemTypeStats = () => {
    const slots = inventoryState.slots?.filter(slot => !slot.isEmpty) || [];
    const stats = {};
    
    slots.forEach(slot => {
      const item = actions.getItemBySlot(slot.index);
      if (item) {
        stats[item.type] = (stats[item.type] || 0) + 1;
      }
    });
    
    return stats;
  };

  const stats = getItemTypeStats();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">面向对象背包系统演示</h1>
        <p className="text-blue-100">展示继承与多态、双向关联、单一职责、扩展性等OOP核心原则</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 控制面板 */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🎮 演示控制</h2>
            
            <div className="space-y-3">
              <button
                onClick={demonstratePolymorphism}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                1️⃣ 演示继承与多态
              </button>
              
              <button
                onClick={demonstrateUsePolymorphism}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                2️⃣ 演示use方法多态
              </button>
              
              <button
                onClick={demonstrateBidirectionalAssociation}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                3️⃣ 演示双向关联
              </button>
              
              <button
                onClick={demonstrateSingleResponsibility}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                4️⃣ 演示单一职责
              </button>
              
              <button
                onClick={demonstrateExtensibility}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                5️⃣ 演示扩展性
              </button>
              
              <button
                onClick={clearDemo}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🧹 清空演示
              </button>
            </div>

            {/* 召唤兽选择 */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标召唤兽（装备演示用）:
              </label>
              <select
                value={selectedSummon}
                onChange={(e) => setSelectedSummon(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="summon_001">🐲 青龙</option>
                <option value="summon_002">🐯 白虎</option>
                <option value="summon_003">🦅 朱雀</option>
                <option value="summon_004">🐢 玄武</option>
              </select>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📊 背包统计</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {inventoryState.usedSlots || 0}
                </div>
                <div className="text-xs text-gray-600">已用插槽</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {inventoryState.gold || 0}
                </div>
                <div className="text-xs text-gray-600">金币</div>
              </div>
            </div>

            {/* 物品类型分布 */}
            <div className="mt-4">
              <h3 className="font-semibold text-gray-700 mb-2">物品类型分布:</h3>
              <div className="space-y-1">
                {Object.entries(stats).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center text-sm">
                    <span className="capitalize">{type}类:</span>
                    <span className="font-semibold">{count}个</span>
                  </div>
                ))}
                {Object.keys(stats).length === 0 && (
                  <div className="text-gray-500 text-sm">暂无物品</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 日志面板 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📝 演示日志</h2>
          
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {log.length === 0 ? (
              <div className="text-gray-500">点击上方按钮开始演示...</div>
            ) : (
              log.map((entry, index) => (
                <div 
                  key={index} 
                  className={`mb-1 ${
                    entry.type === 'header' ? 'text-yellow-400 font-bold' :
                    entry.type === 'success' ? 'text-green-300' :
                    entry.type === 'error' ? 'text-red-400' :
                    'text-green-400'
                  }`}
                >
                  <span className="text-gray-500">[{entry.timestamp}]</span> {entry.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* OOP原则说明 */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-purple-800 mb-4">🎯 核心设计原则说明</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-purple-700 mb-2">1. 继承与多态</h3>
            <ul className="text-sm text-purple-600 space-y-1">
              <li>• Equipment、Consumable继承Item基类</li>
              <li>• 重写use()方法实现不同逻辑</li>
              <li>• 装备→属性加成，消耗品→回血效果</li>
              <li>• 运行时动态调用正确的方法</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-purple-700 mb-2">2. 双向关联</h3>
            <ul className="text-sm text-purple-600 space-y-1">
              <li>• 背包知道包含哪些物品</li>
              <li>• 物品知道自己在背包的哪个位置</li>
              <li>• 物品可以主动从背包中移除自己</li>
              <li>• setInventory()建立关联关系</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-purple-700 mb-2">3. 单一职责</h3>
            <ul className="text-sm text-purple-600 space-y-1">
              <li>• InventoryManager：专注物品存储</li>
              <li>• Item类：封装物品自身行为</li>
              <li>• InventorySlot：管理插槽状态</li>
              <li>• ItemFactory：创建物品实例</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-purple-700 mb-2">4. 扩展性</h3>
            <ul className="text-sm text-purple-600 space-y-1">
              <li>• 新增物品类型只需继承Item</li>
              <li>• 重写use()方法实现特定逻辑</li>
              <li>• 在工厂中添加创建逻辑</li>
              <li>• 无需修改现有代码</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 