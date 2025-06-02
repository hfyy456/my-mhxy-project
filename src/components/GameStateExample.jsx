/**
 * 游戏状态管理示例组件
 * 展示如何使用GameStateManager替代Redux
 */
import React from 'react';
import { 
  useSummons, 
  useInventory, 
  useGameScene, 
  useGameActions,
  useGameStateSelector,
  useBatchGameActions 
} from '../hooks/useGameState';

// 召唤兽管理示例
function SummonManager() {
  const { summons, addSummon, updateSummon } = useSummons();
  const { summons: summonActions } = useGameActions();

  const handleAddSummon = () => {
    addSummon({
      name: '新召唤兽',
      level: 1,
      attributes: {
        hp: 120,
        mp: 60,
        attack: 15,
        defense: 12,
        speed: 8
      },
      skills: ['普通攻击']
    });
  };

  const handleLevelUp = (summonId) => {
    summonActions.levelUp(summonId);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">召唤兽管理</h3>
      
      <button 
        onClick={handleAddSummon}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        添加召唤兽
      </button>

      <div className="space-y-2">
        {summons.map(summon => (
          <div key={summon.id} className="border p-3 rounded">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold">{summon.name}</h4>
                <p className="text-sm text-gray-600">等级: {summon.level}</p>
                <p className="text-xs">
                  血量: {summon.attributes.hp} | 
                  攻击: {summon.attributes.attack} |
                  防御: {summon.attributes.defense}
                </p>
              </div>
              <button
                onClick={() => handleLevelUp(summon.id)}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm"
              >
                升级
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 背包管理示例
function InventoryManager() {
  const { items, gold, capacity, addItem, updateGold } = useInventory();
  const { inventory: inventoryActions } = useGameActions();

  const handleAddItem = () => {
    addItem({
      name: `道具${Math.floor(Math.random() * 1000)}`,
      type: 'consumable',
      rarity: 'common',
      description: '一个普通的道具'
    }, Math.floor(Math.random() * 5) + 1);
  };

  const handleAddGold = () => {
    inventoryActions.addGold(100);
  };

  const handleSpendGold = () => {
    inventoryActions.spendGold(50);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">背包管理</h3>
      
      <div className="mb-4">
        <p className="text-lg">金币: <span className="text-yellow-600 font-bold">{gold}</span></p>
        <p className="text-sm text-gray-600">容量: {items.length}/{capacity}</p>
      </div>

      <div className="flex space-x-2 mb-4">
        <button 
          onClick={handleAddItem}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          添加道具
        </button>
        <button 
          onClick={handleAddGold}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          获得金币
        </button>
        <button 
          onClick={handleSpendGold}
          className="bg-red-500 text-white px-4 py-2 rounded"
          disabled={gold < 50}
        >
          花费金币
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {items.map(item => (
          <div key={item.id} className="border p-2 rounded text-sm">
            <div className="flex justify-between">
              <span className="font-medium">{item.name}</span>
              <span className="text-gray-500">x{item.quantity}</span>
            </div>
            <p className="text-xs text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 场景管理示例
function SceneManager() {
  const { scene, sceneData, changeScene } = useGameScene();

  const scenes = [
    { id: 'main', name: '主界面' },
    { id: 'battle', name: '战斗场景' },
    { id: 'shop', name: '商店' },
    { id: 'inventory', name: '背包' }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">场景管理</h3>
      
      <p className="mb-4">当前场景: <span className="font-semibold">{scene}</span></p>
      
      <div className="grid grid-cols-2 gap-2">
        {scenes.map(sceneInfo => (
          <button
            key={sceneInfo.id}
            onClick={() => changeScene(sceneInfo.id, { timestamp: Date.now() })}
            className={`px-3 py-2 rounded text-sm ${
              scene === sceneInfo.id 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {sceneInfo.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// 批量操作示例
function BatchOperationsExample() {
  const { batchActions, isBatching } = useBatchGameActions();
  const gameActions = useGameActions();

  const handleBatchOperations = () => {
    batchActions([
      () => gameActions.summons.add({
        name: '批量召唤兽1',
        level: 5,
        attributes: { hp: 200, mp: 100, attack: 20, defense: 15, speed: 10 }
      }),
      () => gameActions.summons.add({
        name: '批量召唤兽2',
        level: 7,
        attributes: { hp: 250, mp: 120, attack: 25, defense: 18, speed: 12 }
      }),
      () => gameActions.inventory.addGold(500),
      () => gameActions.inventory.addItem({
        name: '批量道具',
        type: 'equipment',
        rarity: 'rare'
      }, 10),
      () => gameActions.scene.goto('battle', { battleId: 'batch-test' })
    ]);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">批量操作示例</h3>
      
      <button
        onClick={handleBatchOperations}
        disabled={isBatching}
        className={`px-4 py-2 rounded ${
          isBatching 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-purple-500 hover:bg-purple-600'
        } text-white`}
      >
        {isBatching ? '执行中...' : '执行批量操作'}
      </button>

      <p className="text-sm text-gray-600 mt-2">
        点击按钮将批量执行：添加2个召唤兽、增加500金币、添加10个道具、切换到战斗场景
      </p>
    </div>
  );
}

// 性能优化示例
function OptimizedGoldDisplay() {
  // 只监听金币变化，不会因为其他状态变化而重新渲染
  const gold = useGameStateSelector(state => state.inventory.gold);

  return (
    <div className="bg-yellow-100 p-2 rounded">
      <p className="text-sm">优化的金币显示: <span className="font-bold">{gold}</span></p>
      <p className="text-xs text-gray-600">只在金币变化时重新渲染</p>
    </div>
  );
}

// 主示例组件
export default function GameStateExample() {
  const { save } = useGameActions();

  const handleManualSave = () => {
    save.manual();
  };

  const handleLoadGame = () => {
    save.load();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">游戏状态管理示例</h1>
        <p className="text-gray-600 mb-6">
          使用面向对象的GameStateManager替代Redux，实现数据与逻辑分离
        </p>
        
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={handleManualSave}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            手动保存
          </button>
          <button
            onClick={handleLoadGame}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            加载游戏
          </button>
        </div>

        <OptimizedGoldDisplay />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SummonManager />
        <InventoryManager />
        <SceneManager />
        <BatchOperationsExample />
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-bold mb-2">优势说明:</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• 面向对象设计，数据和逻辑分离</li>
          <li>• 基于EventEmitter的响应式更新</li>
          <li>• 与Electron Store自动集成，实现持久化</li>
          <li>• 支持批量操作，减少重复渲染</li>
          <li>• 性能优化的选择器Hook</li>
          <li>• 自动保存机制，防止数据丢失</li>
        </ul>
      </div>
    </div>
  );
} 