import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/useToast";
import { 
  formatEffectDisplay, 
  getAttributeDisplayName, 
  validateEffectConfig,
  migrateEffectFormat 
} from '@/utils/equipmentEffectUtils';

const ConfigManager = () => {
  const [activeTab, setActiveTab] = useState('items');
  const [itemsConfig, setItemsConfig] = useState(null);
  const [summonsConfig, setSummonsConfig] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('equipments');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState({});
  const [toasts, setToasts] = useState([]);
  const { showResult } = useToast(toasts, setToasts);

  // 加载配置文件
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        // 直接导入JSON文件
        const itemsModule = await import('/src/config/item/allItems.json');
        const summonsModule = await import('/src/config/summon/allSummons.json');
        
        setItemsConfig(itemsModule.default);
        setSummonsConfig(summonsModule.default);
        showResult('配置文件加载成功', 'success');
      } catch (error) {
        console.error('加载配置文件失败:', error);
        showResult('配置文件加载失败，请检查文件路径', 'error');
      }
    };

    loadConfigs();
  }, [showResult]);

  // 保存配置到JSON文件 (使用Electron IPC)
  const saveConfig = async (configType, data) => {
    try {
      // 检查是否在Electron环境中
      if (window.electronAPI && window.electronAPI.config) {
        // 确定文件名
        const fileName = configType === 'items' ? 'allItems.json' : 'allSummons.json';
        
        // 先创建备份
        const backupResult = await window.electronAPI.config.backupFile(fileName, configType);
        if (backupResult.success) {
          console.log('备份创建成功:', backupResult.message);
        }
        
        // 保存到文件
        const result = await window.electronAPI.config.saveFile(fileName, data, configType);
        
        if (result.success) {
          showResult(`${configType === 'items' ? '物品' : '召唤兽'}配置保存到文件成功`, 'success');
          console.log('文件保存路径:', result.path);
        } else {
          throw new Error(result.message || '保存失败');
        }
      } else {
        // 降级到localStorage保存
        const key = configType === 'items' ? 'gameConfig_items' : 'gameConfig_summons';
        localStorage.setItem(key, JSON.stringify(data, null, 2));
        showResult(`${configType === 'items' ? '物品' : '召唤兽'}配置保存到本地存储成功`, 'success');
      }
      
      if (configType === 'items') {
        setItemsConfig(data);
      } else {
        setSummonsConfig(data);
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      showResult(`配置保存失败: ${error.message}`, 'error');
    }
  };

  // 开始编辑
  const startEdit = (item) => {
    setSelectedItem(item);
    setEditingData(JSON.parse(JSON.stringify(item)));
    setIsEditing(true);
  };

  // 保存编辑
  const saveEdit = () => {
    // 验证物品效果配置
    if (activeTab === 'items' && editingData.effects) {
      const validation = validateEffectConfig(editingData.effects);
      if (!validation.isValid) {
        showResult(`配置验证失败: ${validation.errors.join(', ')}`, 'error');
        return;
      }
    }

    if (activeTab === 'items') {
      const newConfig = { ...itemsConfig };
      newConfig[selectedCategory][editingData.id] = editingData;
      saveConfig('items', newConfig);
    } else {
      const newConfig = { ...summonsConfig };
      newConfig[editingData.id] = editingData;
      saveConfig('summons', newConfig);
    }
    setIsEditing(false);
    setSelectedItem(null);
  };

  // 取消编辑
  const cancelEdit = () => {
    setIsEditing(false);
    setSelectedItem(null);
    setEditingData({});
  };

  // 删除项目
  const deleteItem = (itemId) => {
    if (window.confirm('确定要删除这个配置吗？')) {
      if (activeTab === 'items') {
        const newConfig = { ...itemsConfig };
        delete newConfig[selectedCategory][itemId];
        saveConfig('items', newConfig);
      } else {
        const newConfig = { ...summonsConfig };
        delete newConfig[itemId];
        saveConfig('summons', newConfig);
      }
    }
  };

  // 添加新项目
  const addNewItem = () => {
    const newId = `new_${Date.now()}`;
    const newItem = activeTab === 'items' 
      ? {
          id: newId,
          name: '新物品',
          type: selectedCategory === 'equipments' ? 'equipment' : selectedCategory.slice(0, -1),
          description: '新物品描述',
          icon: 'fa-plus',
          ...(selectedCategory === 'equipments' && {
            slotType: 'accessory',
            effects: {
              // 示例效果 - 使用新格式
              hp: { type: 'flat', value: 10 },
              physicalAttack: { type: 'percent', value: 5 }
            },
            requirements: { level: 1 }
          }),
          ...(selectedCategory === 'consumables' && {
            effects: {},
            usageLimit: 1
          }),
          ...(selectedCategory === 'materials' && {
            rarity: 'common',
            stackable: true,
            maxStack: 99
          })
        }
      : {
          id: newId,
          name: '新召唤兽',
          fiveElement: 'metal',
          quality: 'normal',
          growthRates: {
            constitution: 0.03,
            strength: 0.03,
            agility: 0.03,
            intelligence: 0.03,
            luck: 0.02
          },
          type: 'physical',
          color: 'blue',
          attackRange: 3,
          basicAttributeRanges: {
            constitution: [100, 200],
            strength: [100, 200],
            agility: [100, 200],
            intelligence: [100, 200],
            luck: [50, 150]
          },
          guaranteedInitialSkills: [],
          initialSkillPool: [],
          initialSkillCountMean: 1,
          initialSkillCountStdDev: 1,
          background: '新召唤兽的背景故事'
        };

    startEdit(newItem);
  };

  // 导出配置到JSON文件
  const exportConfig = async (configType) => {
    try {
      const data = configType === 'items' ? itemsConfig : summonsConfig;
      const fileName = `${configType}_config_export_${new Date().toISOString().slice(0, 10)}.json`;
      
      if (window.electronAPI && window.electronAPI.config) {
        const result = await window.electronAPI.config.saveFile(fileName, data, configType);
        if (result.success) {
          showResult(`配置导出成功: ${fileName}`, 'success');
        } else {
          throw new Error(result.message);
        }
      } else {
        // Web环境下载功能
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        showResult(`配置导出成功: ${fileName}`, 'success');
      }
    } catch (error) {
      console.error('导出配置失败:', error);
      showResult(`导出失败: ${error.message}`, 'error');
    }
  };

  // 从文件重新加载配置
  const reloadConfig = async (configType) => {
    try {
      if (window.electronAPI && window.electronAPI.config) {
        const fileName = configType === 'items' ? 'allItems.json' : 'allSummons.json';
        const result = await window.electronAPI.config.loadFile(fileName, configType);
        
        if (result.success) {
          if (configType === 'items') {
            setItemsConfig(result.data);
          } else {
            setSummonsConfig(result.data);
          }
          showResult(`${configType === 'items' ? '物品' : '召唤兽'}配置重新加载成功`, 'success');
        } else {
          throw new Error(result.message);
        }
      } else {
        showResult('仅在Electron环境中支持从文件重新加载', 'warning');
      }
    } catch (error) {
      console.error('重新加载配置失败:', error);
      showResult(`重新加载失败: ${error.message}`, 'error');
    }
  };

  // 迁移物品效果格式
  const migrateItemEffects = () => {
    if (!itemsConfig) {
      showResult('没有物品配置需要迁移', 'warning');
      return;
    }

    try {
      let migratedCount = 0;
      const newConfig = { ...itemsConfig };

      // 遍历所有分类
      Object.keys(newConfig).forEach(category => {
        if (newConfig[category] && typeof newConfig[category] === 'object') {
          Object.keys(newConfig[category]).forEach(itemId => {
            const item = newConfig[category][itemId];
            if (item && item.effects) {
              const oldEffects = item.effects;
              const newEffects = migrateEffectFormat(oldEffects);
              
              // 检查是否有变化
              if (JSON.stringify(oldEffects) !== JSON.stringify(newEffects)) {
                newConfig[category][itemId].effects = newEffects;
                migratedCount++;
              }
            }
          });
        }
      });

      if (migratedCount > 0) {
        setItemsConfig(newConfig);
        showResult(`成功迁移 ${migratedCount} 个物品的效果格式`, 'success');
      } else {
        showResult('所有物品已经是新格式，无需迁移', 'info');
      }
    } catch (error) {
      console.error('迁移失败:', error);
      showResult(`迁移失败: ${error.message}`, 'error');
    }
  };

  // 使用工具函数格式化属性值显示
  const formatEffectValue = (key, effect) => {
    return formatEffectDisplay(key, effect);
  };

  // 渲染物品列表
  const renderItemsList = () => {
    if (!itemsConfig) return <div>加载中...</div>;

    const items = itemsConfig[selectedCategory] || {};
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(items).map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => startEdit(item)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  编辑
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  删除
                </button>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-2">{item.description}</p>
            
            {/* 显示装备效果 */}
            {item.effects && Object.keys(item.effects).length > 0 && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                <div className="font-semibold text-gray-700 mb-1">效果:</div>
                {Object.entries(item.effects).slice(0, 3).map(([key, effect]) => (
                  <div key={key} className="text-green-600">
                    {getAttributeDisplayName(key)}: {formatEffectValue(key, effect)}
                  </div>
                ))}
                {Object.keys(item.effects).length > 3 && (
                  <div className="text-gray-500">...等{Object.keys(item.effects).length}个效果</div>
                )}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-2">
              <div>ID: {item.id}</div>
              <div>类型: {item.type}</div>
              {item.slotType && <div>槽位: {item.slotType}</div>}
              {item.rarity && <div>稀有度: {item.rarity}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 渲染召唤兽列表
  const renderSummonsList = () => {
    if (!summonsConfig) return <div>加载中...</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(summonsConfig).map((summon) => (
          <div key={summon.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-800">{summon.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => startEdit(summon)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  编辑
                </button>
                <button
                  onClick={() => deleteItem(summon.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  删除
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <div>五行: {summon.fiveElement}</div>
              <div>品质: {summon.quality}</div>
              <div>类型: {summon.type}</div>
              <div>颜色: {summon.color}</div>
              <div>攻击范围: {summon.attackRange}</div>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">{summon.background}</p>
          </div>
        ))}
      </div>
    );
  };

  // 渲染编辑表单
  const renderEditForm = () => {
    if (!isEditing || !editingData) return null;

    const updateField = (path, value) => {
      const newData = { ...editingData };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      setEditingData(newData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">编辑配置</h2>
            <div className="space-x-2">
              <button
                onClick={saveEdit}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                保存
              </button>
              <button
                onClick={cancelEdit}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                取消
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
              <input
                type="text"
                value={editingData.id || ''}
                onChange={(e) => updateField('id', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input
                type="text"
                value={editingData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {activeTab === 'items' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={editingData.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">图标</label>
                  <input
                    type="text"
                    value={editingData.icon || ''}
                    onChange={(e) => updateField('icon', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {editingData.slotType !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">槽位类型</label>
                    <select
                      value={editingData.slotType || ''}
                      onChange={(e) => updateField('slotType', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="accessory">饰品</option>
                      <option value="relic">遗物</option>
                      <option value="bloodline">血脉</option>
                      <option value="rune">符文</option>
                    </select>
                  </div>
                )}

                {/* 物品效果配置 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">物品效果</label>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="space-y-3">
                      {[
                        { key: 'hp', label: '生命值', allowPercent: true },
                        { key: 'mp', label: '法力值', allowPercent: true },
                        { key: 'attack', label: '攻击力', allowPercent: true },
                        { key: 'defense', label: '防御力', allowPercent: true },
                        { key: 'physicalAttack', label: '物理攻击', allowPercent: true },
                        { key: 'magicalAttack', label: '法术攻击', allowPercent: true },
                        { key: 'physicalDefense', label: '物理防御', allowPercent: true },
                        { key: 'magicalDefense', label: '法术防御', allowPercent: true },
                        { key: 'agility', label: '敏捷', allowPercent: true },
                        { key: 'speed', label: '速度', allowPercent: true },
                        { key: 'intelligence', label: '智力', allowPercent: true },
                        { key: 'constitution', label: '体质', allowPercent: true },
                        { key: 'strength', label: '力量', allowPercent: true },
                        { key: 'critRate', label: '暴击率', allowPercent: false }, // 本身就是百分比
                        { key: 'critDamage', label: '暴击伤害', allowPercent: false }, // 本身就是百分比
                        { key: 'dodgeRate', label: '闪避率', allowPercent: false }, // 本身就是百分比
                        { key: 'mpRecovery', label: '法力回复', allowPercent: true },
                        { key: 'fireResistance', label: '火焰抗性', allowPercent: false }, // 本身就是百分比
                        { key: 'waterResistance', label: '水系抗性', allowPercent: false },
                        { key: 'thunderResistance', label: '雷电抗性', allowPercent: false },
                        { key: 'poisonResistance', label: '毒素抗性', allowPercent: false }
                      ].map(({ key, label, allowPercent }) => {
                        // 获取当前效果值，可能是数字或对象
                        const currentEffect = editingData.effects?.[key];
                        let currentValue = '';
                        let currentType = 'flat'; // 'flat' 或 'percent'
                        
                        if (typeof currentEffect === 'number') {
                          // 兼容旧格式：直接数字
                          currentValue = currentEffect;
                          currentType = 'flat';
                        } else if (currentEffect && typeof currentEffect === 'object') {
                          // 新格式：对象包含type和value
                          currentValue = currentEffect.value || '';
                          currentType = currentEffect.type || 'flat';
                        }

                        return (
                          <div key={key} className="grid grid-cols-5 gap-2 items-center">
                            <label className="text-xs text-gray-600">{label}</label>
                            
                            {/* 数值输入 */}
                            <input
                              type="number"
                              step={!allowPercent && (key.includes('Rate') || key.includes('Damage') || key.includes('Resistance')) ? '0.01' : '1'}
                              value={currentValue}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  const newEffects = { ...editingData.effects };
                                  delete newEffects[key];
                                  setEditingData({ ...editingData, effects: newEffects });
                                } else {
                                  const numValue = !allowPercent && (key.includes('Rate') || key.includes('Damage') || key.includes('Resistance'))
                                    ? parseFloat(value) 
                                    : (currentType === 'percent' ? parseFloat(value) : parseInt(value));
                                  
                                  const effectValue = allowPercent ? {
                                    type: currentType,
                                    value: numValue
                                  } : numValue;
                                  
                                  updateField(`effects.${key}`, effectValue);
                                }
                              }}
                              className="p-1 text-xs border border-gray-300 rounded"
                              placeholder="0"
                            />
                            
                            {/* 类型选择器（仅对支持百分比的属性显示） */}
                            {allowPercent ? (
                              <select
                                value={currentType}
                                onChange={(e) => {
                                  const newType = e.target.value;
                                  if (currentValue !== '') {
                                    const effectValue = {
                                      type: newType,
                                      value: newType === 'percent' ? parseFloat(currentValue) : parseInt(currentValue)
                                    };
                                    updateField(`effects.${key}`, effectValue);
                                  }
                                }}
                                className="p-1 text-xs border border-gray-300 rounded"
                              >
                                <option value="flat">数值</option>
                                <option value="percent">百分比</option>
                              </select>
                            ) : (
                              <span className="text-xs text-gray-500 text-center">百分比</span>
                            )}
                            
                            {/* 显示示例 */}
                            <span className="text-xs text-gray-500 col-span-2">
                              {currentValue && (
                                allowPercent ? (
                                  currentType === 'percent' ? `+${currentValue}%` : `+${currentValue}`
                                ) : (
                                  key.includes('Rate') || key.includes('Damage') || key.includes('Resistance') 
                                    ? `${(currentValue * 100).toFixed(1)}%` 
                                    : `+${currentValue}`
                                )
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'summons' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">五行</label>
                    <select
                      value={editingData.fiveElement || ''}
                      onChange={(e) => updateField('fiveElement', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="metal">金</option>
                      <option value="wood">木</option>
                      <option value="water">水</option>
                      <option value="fire">火</option>
                      <option value="earth">土</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">品质</label>
                    <select
                      value={editingData.quality || ''}
                      onChange={(e) => updateField('quality', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="normal">普通</option>
                      <option value="rare">稀有</option>
                      <option value="epic">史诗</option>
                      <option value="legendary">传说</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                    <select
                      value={editingData.type || ''}
                      onChange={(e) => updateField('type', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="physical">物理</option>
                      <option value="magical">法术</option>
                      <option value="speed">敏捷</option>
                      <option value="defense">防御</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">攻击范围</label>
                    <input
                      type="number"
                      value={editingData.attackRange || 0}
                      onChange={(e) => updateField('attackRange', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">背景故事</label>
                  <textarea
                    value={editingData.background || ''}
                    onChange={(e) => updateField('background', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                  />
                </div>

                {/* 成长率配置 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">成长率配置</label>
                  <div className="grid grid-cols-5 gap-2 bg-gray-50 p-3 rounded">
                    {['constitution', 'strength', 'agility', 'intelligence', 'luck'].map((attr) => (
                      <div key={attr}>
                        <label className="block text-xs text-gray-600 mb-1">
                          {attr === 'constitution' ? '体质' : 
                           attr === 'strength' ? '力量' : 
                           attr === 'agility' ? '敏捷' : 
                           attr === 'intelligence' ? '智力' : '运气'}
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          max="1"
                          value={editingData.growthRates?.[attr] || 0}
                          onChange={(e) => updateField(`growthRates.${attr}`, parseFloat(e.target.value))}
                          className="w-full p-1 text-xs border border-gray-300 rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 基础属性范围配置 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">基础属性范围</label>
                  <div className="space-y-2 bg-gray-50 p-3 rounded">
                    {['constitution', 'strength', 'agility', 'intelligence', 'luck'].map((attr) => (
                      <div key={attr} className="grid grid-cols-3 gap-2 items-center">
                        <label className="text-sm text-gray-600">
                          {attr === 'constitution' ? '体质' : 
                           attr === 'strength' ? '力量' : 
                           attr === 'agility' ? '敏捷' : 
                           attr === 'intelligence' ? '智力' : '运气'}:
                        </label>
                        <input
                          type="number"
                          placeholder="最小值"
                          value={editingData.basicAttributeRanges?.[attr]?.[0] || ''}
                          onChange={(e) => {
                            const newRanges = { ...editingData.basicAttributeRanges };
                            if (!newRanges[attr]) newRanges[attr] = [0, 0];
                            newRanges[attr][0] = parseInt(e.target.value) || 0;
                            setEditingData({ ...editingData, basicAttributeRanges: newRanges });
                          }}
                          className="p-1 text-sm border border-gray-300 rounded"
                        />
                        <input
                          type="number"
                          placeholder="最大值"
                          value={editingData.basicAttributeRanges?.[attr]?.[1] || ''}
                          onChange={(e) => {
                            const newRanges = { ...editingData.basicAttributeRanges };
                            if (!newRanges[attr]) newRanges[attr] = [0, 0];
                            newRanges[attr][1] = parseInt(e.target.value) || 0;
                            setEditingData({ ...editingData, basicAttributeRanges: newRanges });
                          }}
                          className="p-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">游戏配置管理器</h1>
            <div className="text-sm text-gray-600 flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${window.electronAPI ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span>{window.electronAPI ? 'Electron环境 (支持文件保存)' : 'Web环境 (仅本地存储)'}</span>
            </div>
          </div>
          
          {/* 标签页导航 */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('items')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'items'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                物品管理
              </button>
              <button
                onClick={() => setActiveTab('summons')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'summons'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                召唤兽管理
              </button>
            </nav>
          </div>

          {/* 工具栏 */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-4 items-center">
              {activeTab === 'items' && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="equipments">装备</option>
                  <option value="consumables">消耗品</option>
                  <option value="materials">材料</option>
                </select>
              )}
              
              {/* 文件操作按钮 */}
              <div className="flex space-x-2">
                <button
                  onClick={() => exportConfig(activeTab)}
                  className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm flex items-center space-x-1"
                >
                  <span>📁</span>
                  <span>导出</span>
                </button>
                
                <button
                  onClick={() => reloadConfig(activeTab)}
                  className="bg-orange-600 text-white px-3 py-2 rounded hover:bg-orange-700 text-sm flex items-center space-x-1"
                >
                  <span>🔄</span>
                  <span>重载</span>
                </button>
                
                {activeTab === 'items' && (
                  <button
                    onClick={() => migrateItemEffects()}
                    className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 text-sm flex items-center space-x-1"
                  >
                    <span>⚡</span>
                    <span>迁移</span>
                  </button>
                )}
              </div>
            </div>
            
            <button
              onClick={addNewItem}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center space-x-2"
            >
              <span>+</span>
              <span>添加新{activeTab === 'items' ? '物品' : '召唤兽'}</span>
            </button>
          </div>

          {/* 内容区域 */}
          <div className="mb-6">
            {!itemsConfig && !summonsConfig ? (
              <div className="text-center py-8">
                <div className="text-gray-500">正在加载配置文件...</div>
              </div>
            ) : (
              <div>
                {activeTab === 'items' ? renderItemsList() : renderSummonsList()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 编辑模态框 */}
      {renderEditForm()}
    </div>
  );
};

export default ConfigManager; 