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
  const [activeSkillsConfig, setActiveSkillsConfig] = useState(null);
  const [passiveSkillsConfig, setPassiveSkillsConfig] = useState(null);
  const [buffsConfig, setBuffsConfig] = useState(null);
  const [worldMapConfig, setWorldMapConfig] = useState(null);
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
        const activeSkillsModule = await import('/src/config/skill/activeSkills.json');
        const passiveSkillsModule = await import('/src/config/skill/passiveSkills.json');
        const buffsModule = await import('/src/config/buff/buffs.json');
        // 导入世界地图配置JSON文件
        const worldMapModule = await import('/src/config/map/worldMapConfig.json');
        
        setItemsConfig(itemsModule.default);
        setSummonsConfig(summonsModule.default);
        setActiveSkillsConfig(activeSkillsModule.default);
        setPassiveSkillsConfig(passiveSkillsModule.default);
        setBuffsConfig(buffsModule.default);
        setWorldMapConfig(worldMapModule.default);
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
        // 确定文件名和配置类型
        let fileName, apiConfigType;
        switch (configType) {
          case 'items':
            fileName = 'allItems.json';
            apiConfigType = 'items';
            break;
          case 'summons':
            fileName = 'allSummons.json';
            apiConfigType = 'summons';
            break;
          case 'activeSkills':
            fileName = 'activeSkills.json';
            apiConfigType = 'skills';
            break;
          case 'passiveSkills':
            fileName = 'passiveSkills.json';
            apiConfigType = 'skills';
            break;
          case 'buffs':
            fileName = 'buffs.json';
            apiConfigType = 'buffs';
            break;
          case 'worldMap':
            fileName = 'worldMapConfig.json';
            apiConfigType = 'map';
            break;
          default:
            throw new Error('未知的配置类型');
        }
        
        // 先创建备份
        const backupResult = await window.electronAPI.config.backupFile(fileName, apiConfigType);
        if (backupResult.success) {
          console.log('备份创建成功:', backupResult.message);
        }
        
        // 保存到文件
        const result = await window.electronAPI.config.saveFile(fileName, data, apiConfigType);
        
        if (result.success) {
          const typeNames = {
            items: '物品',
            summons: '召唤兽',
            activeSkills: '主动技能',
            passiveSkills: '被动技能',
            buffs: 'Buff效果',
            worldMap: '世界地图'
          };
          showResult(`${typeNames[configType]}配置保存到文件成功`, 'success');
          console.log('文件保存路径:', result.path);
        } else {
          throw new Error(result.message || '保存失败');
        }
      } else {
        // 降级到localStorage保存
        const key = `gameConfig_${configType}`;
        localStorage.setItem(key, JSON.stringify(data, null, 2));
        const typeNames = {
          items: '物品',
          summons: '召唤兽',
          activeSkills: '主动技能',
          passiveSkills: '被动技能',
          buffs: 'Buff效果',
          worldMap: '世界地图'
        };
        showResult(`${typeNames[configType]}配置保存到本地存储成功`, 'success');
      }
      
      // 更新状态
      switch (configType) {
        case 'items':
          setItemsConfig(data);
          break;
        case 'summons':
          setSummonsConfig(data);
          break;
        case 'activeSkills':
          setActiveSkillsConfig(data);
          break;
        case 'passiveSkills':
          setPassiveSkillsConfig(data);
          break;
        case 'buffs':
          setBuffsConfig(data);
          break;
        case 'worldMap':
          setWorldMapConfig(data);
          break;
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

    switch (activeTab) {
      case 'items':
        const newItemsConfig = { ...itemsConfig };
        newItemsConfig[selectedCategory][editingData.id] = editingData;
        saveConfig('items', newItemsConfig);
        break;
      case 'summons':
        const newSummonsConfig = { ...summonsConfig };
        newSummonsConfig[editingData.id] = editingData;
        saveConfig('summons', newSummonsConfig);
        break;
      case 'activeSkills':
        const newActiveSkillsConfig = { ...activeSkillsConfig };
        const activeSkillIndex = newActiveSkillsConfig.skills.findIndex(skill => skill.id === editingData.id);
        if (activeSkillIndex >= 0) {
          newActiveSkillsConfig.skills[activeSkillIndex] = editingData;
        } else {
          newActiveSkillsConfig.skills.push(editingData);
        }
        saveConfig('activeSkills', newActiveSkillsConfig);
        break;
      case 'passiveSkills':
        const newPassiveSkillsConfig = { ...passiveSkillsConfig };
        const passiveSkillIndex = newPassiveSkillsConfig.skills.findIndex(skill => skill.id === editingData.id);
        if (passiveSkillIndex >= 0) {
          newPassiveSkillsConfig.skills[passiveSkillIndex] = editingData;
        } else {
          newPassiveSkillsConfig.skills.push(editingData);
        }
        saveConfig('passiveSkills', newPassiveSkillsConfig);
        break;
      case 'buffs':
        const newBuffsConfig = [...buffsConfig];
        const buffIndex = newBuffsConfig.findIndex(buff => buff.id === editingData.id);
        if (buffIndex >= 0) {
          newBuffsConfig[buffIndex] = editingData;
        } else {
          newBuffsConfig.push(editingData);
        }
        saveConfig('buffs', newBuffsConfig);
        break;
      case 'worldMap':
        // 世界地图配置的保存逻辑
        saveConfig('worldMap', editingData);
        break;
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
      switch (activeTab) {
        case 'items':
          const newItemsConfig = { ...itemsConfig };
          delete newItemsConfig[selectedCategory][itemId];
          saveConfig('items', newItemsConfig);
          break;
        case 'summons':
          const newSummonsConfig = { ...summonsConfig };
          delete newSummonsConfig[itemId];
          saveConfig('summons', newSummonsConfig);
          break;
        case 'activeSkills':
          const newActiveSkillsConfig = { ...activeSkillsConfig };
          newActiveSkillsConfig.skills = newActiveSkillsConfig.skills.filter(skill => skill.id !== itemId);
          saveConfig('activeSkills', newActiveSkillsConfig);
          break;
        case 'passiveSkills':
          const newPassiveSkillsConfig = { ...passiveSkillsConfig };
          newPassiveSkillsConfig.skills = newPassiveSkillsConfig.skills.filter(skill => skill.id !== itemId);
          saveConfig('passiveSkills', newPassiveSkillsConfig);
          break;
        case 'buffs':
          const newBuffsConfig = buffsConfig.filter(buff => buff.id !== itemId);
          saveConfig('buffs', newBuffsConfig);
          break;
      }
    }
  };

  // 添加新项目
  const addNewItem = () => {
    const newId = `new_${Date.now()}`;
    let newItem;

    switch (activeTab) {
      case 'items':
        newItem = {
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
        };
        break;
      case 'summons':
        newItem = {
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
        break;
      case 'activeSkills':
        newItem = {
          id: newId,
          name: '新主动技能',
          description: '新主动技能描述',
          type: 'magical',
          icon: 'fa-magic',
          mode: 'active',
          targetType: 'single',
          cooldownRounds: 3,
          mpCost: 20,
          damage: 1.5,
          applyBuffs: []
        };
        break;
      case 'passiveSkills':
        newItem = {
          id: newId,
          name: '新被动技能',
          description: '新被动技能描述',
          type: 'defensive',
          icon: 'fa-shield',
          mode: 'passive',
          targetType: 'none',
          timing: 'always',
          probability: 1.0,
          permanentBuffs: [],
          triggerBuffs: []
        };
        break;
      case 'buffs':
        newItem = {
          id: newId,
          name: '新Buff效果',
          description: '新Buff效果描述',
          icon: 'fa-plus',
          type: 'positive',
          effectType: 'stat_modifier',
          applyType: 'highest',
          targetAttribute: 'attack',
          value: 10,
          valueMultiplier: 0,
          maxStacks: 1,
          durationRounds: 3
        };
        break;
      case 'worldMap':
        newItem = {
          id: newId,
          name: '新地图区域',
          description: '新地图区域描述',
          position: { top: '50%', left: '50%' },
          color: 'blue',
          icon: '🏔️',
          unlocked: true,
          nodes: []
        };
        break;
      default:
        newItem = {};
    }

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
    if (!itemsConfig) return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-purple-400 mb-4"></i>
          <div className="text-slate-400">正在加载配置文件...</div>
        </div>
      </div>
    );

    const items = itemsConfig[selectedCategory] || {};
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(items).map((item) => (
          <div key={item.id} className="group bg-slate-700/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-600/50 p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-purple-500/20 hover:shadow-xl transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30">
                  <i className={`fas ${item.icon || 'fa-cube'} text-purple-400`}></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">{item.name}</h3>
                  <div className="text-xs text-slate-400">ID: {item.id}</div>
                </div>
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(item)}
                  className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-all duration-300 hover:scale-110"
                  title="编辑"
                >
                  <i className="fas fa-edit text-sm"></i>
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-all duration-300 hover:scale-110"
                  title="删除"
                >
                  <i className="fas fa-trash text-sm"></i>
                </button>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-4 line-clamp-2">{item.description}</p>
            
            {/* 显示装备效果 */}
            {item.effects && Object.keys(item.effects).length > 0 && (
              <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-sparkles text-amber-400 text-sm"></i>
                  <div className="font-medium text-amber-300 text-sm">效果</div>
                </div>
                <div className="space-y-1">
                  {Object.entries(item.effects).slice(0, 3).map(([key, effect]) => (
                    <div key={key} className="text-emerald-400 text-xs flex items-center gap-2">
                      <i className="fas fa-arrow-up text-emerald-500 text-xs"></i>
                      <span>{getAttributeDisplayName(key)}: {formatEffectValue(key, effect)}</span>
                    </div>
                  ))}
                  {Object.keys(item.effects).length > 3 && (
                    <div className="text-slate-400 text-xs">
                      <i className="fas fa-ellipsis-h mr-1"></i>
                      等{Object.keys(item.effects).length}个效果
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="text-xs text-slate-400 space-y-1 pt-3 border-t border-slate-600/30">
              <div className="flex items-center gap-2">
                <i className="fas fa-tag text-slate-500"></i>
                <span>类型: {item.type}</span>
              </div>
              {item.slotType && (
                <div className="flex items-center gap-2">
                  <i className="fas fa-puzzle-piece text-slate-500"></i>
                  <span>槽位: {item.slotType}</span>
                </div>
              )}
              {item.rarity && (
                <div className="flex items-center gap-2">
                  <i className="fas fa-gem text-slate-500"></i>
                  <span>稀有度: {item.rarity}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 渲染召唤兽列表
  const renderSummonsList = () => {
    if (!summonsConfig) return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-purple-400 mb-4"></i>
          <div className="text-slate-400">正在加载配置文件...</div>
        </div>
      </div>
    );

    const getQualityColor = (quality) => {
      const colors = {
        normal: 'from-slate-600 to-slate-700',
        rare: 'from-blue-600 to-blue-700',
        epic: 'from-purple-600 to-purple-700',
        legendary: 'from-amber-500 to-orange-600'
      };
      return colors[quality] || colors.normal;
    };

    const getQualityIcon = (quality) => {
      const icons = {
        normal: 'fa-circle',
        rare: 'fa-star',
        epic: 'fa-gem',
        legendary: 'fa-crown'
      };
      return icons[quality] || icons.normal;
    };

    const getFiveElementIcon = (element) => {
      const icons = {
        metal: 'fa-shield-alt',
        wood: 'fa-tree',
        water: 'fa-tint',
        fire: 'fa-fire',
        earth: 'fa-mountain'
      };
      return icons[element] || 'fa-circle';
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(summonsConfig).map((summon) => (
          <div key={summon.id} className="group bg-slate-700/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-600/50 p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-purple-500/20 hover:shadow-xl transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 bg-gradient-to-r ${getQualityColor(summon.quality)} rounded-xl shadow-lg`}>
                  <i className="fas fa-dragon text-white text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">{summon.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`flex items-center gap-1 px-2 py-1 bg-gradient-to-r ${getQualityColor(summon.quality)} rounded-full text-xs text-white`}>
                      <i className={`fas ${getQualityIcon(summon.quality)}`}></i>
                      <span>{summon.quality}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(summon)}
                  className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-all duration-300 hover:scale-110"
                  title="编辑"
                >
                  <i className="fas fa-edit text-sm"></i>
                </button>
                <button
                  onClick={() => deleteItem(summon.id)}
                  className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-all duration-300 hover:scale-110"
                  title="删除"
                >
                  <i className="fas fa-trash text-sm"></i>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <i className={`fas ${getFiveElementIcon(summon.fiveElement)} text-emerald-400`}></i>
                <span>五行: {summon.fiveElement}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <i className="fas fa-fist-raised text-red-400"></i>
                <span>类型: {summon.type}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <i className="fas fa-palette text-blue-400"></i>
                <span>颜色: {summon.color}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <i className="fas fa-crosshairs text-amber-400"></i>
                <span>范围: {summon.attackRange}</span>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
              <div className="text-xs text-slate-400 line-clamp-3">
                {summon.background}
              </div>
            </div>
            
            <div className="text-xs text-slate-400 pt-3 border-t border-slate-600/30">
              <div className="flex items-center gap-2">
                <i className="fas fa-fingerprint text-slate-500"></i>
                <span>ID: {summon.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 渲染主动技能列表
  const renderActiveSkillsList = () => {
    if (!activeSkillsConfig) return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-purple-400 mb-4"></i>
          <div className="text-slate-400">正在加载配置文件...</div>
        </div>
      </div>
    );

    const getSkillTypeColor = (type) => {
      const colors = {
        physical: 'from-red-600 to-red-700',
        magical: 'from-blue-600 to-blue-700',
        defensive: 'from-green-600 to-green-700',
        support: 'from-purple-600 to-purple-700',
        healing: 'from-pink-600 to-pink-700',
        survival: 'from-amber-600 to-orange-600'
      };
      return colors[type] || colors.physical;
    };

    const getSkillTypeIcon = (type) => {
      const icons = {
        physical: 'fa-sword',
        magical: 'fa-magic',
        defensive: 'fa-shield',
        support: 'fa-hands-helping',
        healing: 'fa-heart',
        survival: 'fa-heart-pulse'
      };
      return icons[type] || 'fa-magic';
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeSkillsConfig.skills.map((skill) => (
          <div key={skill.id} className="group bg-slate-700/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-600/50 p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-purple-500/20 hover:shadow-xl transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 bg-gradient-to-r ${getSkillTypeColor(skill.type)} rounded-xl shadow-lg`}>
                  <i className={`fas ${skill.icon || getSkillTypeIcon(skill.type)} text-white text-lg`}></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">{skill.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`flex items-center gap-1 px-2 py-1 bg-gradient-to-r ${getSkillTypeColor(skill.type)} rounded-full text-xs text-white`}>
                      <i className={`fas ${getSkillTypeIcon(skill.type)}`}></i>
                      <span>{skill.type}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(skill)}
                  className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-all duration-300 hover:scale-110"
                  title="编辑"
                >
                  <i className="fas fa-edit text-sm"></i>
                </button>
                <button
                  onClick={() => deleteItem(skill.id)}
                  className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-all duration-300 hover:scale-110"
                  title="删除"
                >
                  <i className="fas fa-trash text-sm"></i>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <i className="fas fa-bullseye text-emerald-400"></i>
                <span>目标: {skill.targetType}</span>
              </div>
              {skill.cooldownRounds && (
                <div className="flex items-center gap-2 text-slate-300">
                  <i className="fas fa-clock text-amber-400"></i>
                  <span>冷却: {skill.cooldownRounds}回合</span>
                </div>
              )}
              {skill.mpCost && (
                <div className="flex items-center gap-2 text-slate-300">
                  <i className="fas fa-droplet text-blue-400"></i>
                  <span>消耗: {skill.mpCost}MP</span>
                </div>
              )}
              {skill.damage && (
                <div className="flex items-center gap-2 text-slate-300">
                  <i className="fas fa-burst text-red-400"></i>
                  <span>伤害: {skill.damage}x</span>
                </div>
              )}
            </div>
            
            <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
              <div className="text-xs text-slate-400 line-clamp-3">
                {skill.description}
              </div>
            </div>
            
            <div className="text-xs text-slate-400 pt-3 border-t border-slate-600/30">
              <div className="flex items-center gap-2">
                <i className="fas fa-fingerprint text-slate-500"></i>
                <span>ID: {skill.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 渲染被动技能列表
  const renderPassiveSkillsList = () => {
    if (!passiveSkillsConfig) return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-purple-400 mb-4"></i>
          <div className="text-slate-400">正在加载配置文件...</div>
        </div>
      </div>
    );

    const getSkillTypeColor = (type) => {
      const colors = {
        physical: 'from-red-600 to-red-700',
        magical: 'from-blue-600 to-blue-700',
        defensive: 'from-green-600 to-green-700',
        support: 'from-purple-600 to-purple-700',
        speed: 'from-yellow-600 to-amber-600',
        survival: 'from-orange-600 to-red-600'
      };
      return colors[type] || colors.defensive;
    };

    const getSkillTypeIcon = (type) => {
      const icons = {
        physical: 'fa-fist-raised',
        magical: 'fa-sparkles',
        defensive: 'fa-shield-alt',
        support: 'fa-hands-helping',
        speed: 'fa-running',
        survival: 'fa-heart-pulse'
      };
      return icons[type] || 'fa-shield-alt';
    };

    const getTimingText = (timing) => {
      const timingMap = {
        always: '永久生效',
        battle_start: '战斗开始',
        turn_start: '回合开始',
        turn_end: '回合结束',
        before_normal_attack: '攻击前',
        after_normal_attack: '攻击后',
        on_physical_damage: '受物理伤害时',
        on_magical_damage: '受法术伤害时',
        on_any_damage: '受伤害时',
        on_death: '死亡时'
      };
      return timingMap[timing] || timing;
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {passiveSkillsConfig.skills.map((skill) => (
          <div key={skill.id} className="group bg-slate-700/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-600/50 p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-purple-500/20 hover:shadow-xl transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 bg-gradient-to-r ${getSkillTypeColor(skill.type)} rounded-xl shadow-lg`}>
                  <i className={`fas ${skill.icon || getSkillTypeIcon(skill.type)} text-white text-lg`}></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">{skill.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`flex items-center gap-1 px-2 py-1 bg-gradient-to-r ${getSkillTypeColor(skill.type)} rounded-full text-xs text-white`}>
                      <i className={`fas ${getSkillTypeIcon(skill.type)}`}></i>
                      <span>{skill.type}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(skill)}
                  className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-all duration-300 hover:scale-110"
                  title="编辑"
                >
                  <i className="fas fa-edit text-sm"></i>
                </button>
                <button
                  onClick={() => deleteItem(skill.id)}
                  className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-all duration-300 hover:scale-110"
                  title="删除"
                >
                  <i className="fas fa-trash text-sm"></i>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 mb-4 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <i className="fas fa-clock text-amber-400"></i>
                <span>触发: {getTimingText(skill.timing)}</span>
              </div>
              {skill.probability && skill.probability < 1 && (
                <div className="flex items-center gap-2 text-slate-300">
                  <i className="fas fa-dice text-green-400"></i>
                  <span>几率: {(skill.probability * 100).toFixed(0)}%</span>
                </div>
              )}
            </div>
            
            <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
              <div className="text-xs text-slate-400 line-clamp-3">
                {skill.description}
              </div>
            </div>
            
            <div className="text-xs text-slate-400 pt-3 border-t border-slate-600/30">
              <div className="flex items-center gap-2">
                <i className="fas fa-fingerprint text-slate-500"></i>
                <span>ID: {skill.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 渲染Buff列表
  const renderBuffsList = () => {
    if (!buffsConfig) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-purple-400 mb-4"></i>
            <p className="text-slate-400">正在加载Buff配置...</p>
          </div>
        </div>
      );
    }

    const getBuffTypeColor = (type) => {
      const colors = {
        positive: 'from-emerald-500 to-green-500',
        negative: 'from-red-500 to-rose-500',
        neutral: 'from-amber-500 to-yellow-500'
      };
      return colors[type] || 'from-slate-500 to-slate-600';
    };

    const getBuffTypeIcon = (type) => {
      const icons = {
        positive: 'fa-arrow-up',
        negative: 'fa-arrow-down',
        neutral: 'fa-minus'
      };
      return icons[type] || 'fa-question';
    };

    const getEffectTypeText = (effectType) => {
      const typeMap = {
        stat_modifier: '属性修改',
        stat_multiplier: '属性倍率',
        stun: '眩晕',
        freeze: '冻结',
        silence: '沉默',
        stealth: '隐身',
        fear: '恐惧',
        damage_over_time: '持续伤害',
        heal_over_time: '持续治疗',
        shield: '护盾',
        reflect: '反弹',
        special: '特殊效果'
      };
      return typeMap[effectType] || effectType;
    };

    const getApplyTypeText = (applyType) => {
      const typeMap = {
        stack: '可叠加',
        refresh: '刷新时间',
        replace: '替换现有',
        highest: '保留最高'
      };
      return typeMap[applyType] || applyType;
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {buffsConfig.map(buff => (
          <div 
            key={buff.id} 
            className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-purple-500/30 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 bg-gradient-to-r ${getBuffTypeColor(buff.type)} rounded-xl shadow-lg`}>
                    <i className={`fas ${buff.icon || getBuffTypeIcon(buff.type)} text-white text-lg`}></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                      {buff.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 bg-gradient-to-r ${getBuffTypeColor(buff.type)} text-white text-xs font-medium rounded-full shadow-sm`}>
                        {buff.type === 'positive' ? '正面' : buff.type === 'negative' ? '负面' : '中性'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => startEdit(buff)}
                    className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-lg shadow-sm transition-all duration-300 transform hover:scale-110"
                  >
                    <i className="fas fa-edit text-sm"></i>
                  </button>
                  <button
                    onClick={() => deleteItem(buff.id)}
                    className="p-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-lg shadow-sm transition-all duration-300 transform hover:scale-110"
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3 mb-4 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <i className="fas fa-cog text-purple-400"></i>
                  <span>效果: {getEffectTypeText(buff.effectType)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <i className="fas fa-layer-group text-blue-400"></i>
                  <span>应用: {getApplyTypeText(buff.applyType)}</span>
                </div>
                {buff.durationRounds !== undefined && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <i className="fas fa-clock text-amber-400"></i>
                    <span>持续: {buff.durationRounds === -1 ? '永久' : `${buff.durationRounds}回合`}</span>
                  </div>
                )}
                {buff.maxStacks && buff.maxStacks > 1 && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <i className="fas fa-stack-overflow text-green-400"></i>
                    <span>最大层数: {buff.maxStacks}</span>
                  </div>
                )}
              </div>
              
              <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
                <div className="text-xs text-slate-400 line-clamp-3">
                  {buff.description}
                </div>
              </div>
              
              <div className="text-xs text-slate-400 pt-3 border-t border-slate-600/30">
                <div className="flex items-center gap-2">
                  <i className="fas fa-fingerprint text-slate-500"></i>
                  <span>ID: {buff.id}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 渲染世界地图列表
  const renderWorldMapList = () => {
    if (!worldMapConfig) {
      return (
        <div className="text-center py-12">
          <i className="fas fa-map text-4xl text-slate-400 mb-4"></i>
          <p className="text-slate-400">暂无世界地图配置数据</p>
        </div>
      );
    }

    const getRegionColor = (regionId) => {
      const colors = {
        dongsheng_region: 'from-emerald-500 to-emerald-600',
        xiniu_region: 'from-amber-500 to-amber-600',
        nanzhan_region: 'from-blue-500 to-blue-600',
        beijulu_region: 'from-purple-500 to-purple-600'
      };
      return colors[regionId] || 'from-gray-500 to-gray-600';
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(worldMapConfig).map((region) => (
          <div
            key={region.id}
            className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
            onClick={() => startEdit(region)}
          >
                         <div className={`h-32 bg-gradient-to-br ${getRegionColor(region.id)} p-4 relative overflow-hidden`}>
               <div className="absolute inset-0 bg-black/20"></div>
               <div className="relative z-10 h-full flex flex-col justify-between">
                 <div className="flex justify-between items-start">
                   <div className="text-3xl">🏔️</div>
                   <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                     region.isUnlocked ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
                   }`}>
                     {region.isUnlocked ? '已解锁' : '未解锁'}
                   </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{region.name}</h3>
                  <p className="text-white/80 text-sm">{region.description}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-300">节点数量</span>
                                 <span className="px-2 py-1 bg-slate-700 rounded-full text-xs font-medium text-slate-300">
                   {Object.keys(region.nodes || {}).length}
                 </span>
              </div>
              
                             {region.nodes && Object.keys(region.nodes).length > 0 && (
                 <div className="space-y-2">
                   <div className="text-xs text-slate-400 mb-2">包含节点：</div>
                   <div className="grid grid-cols-2 gap-1">
                     {Object.values(region.nodes).slice(0, 4).map((node) => (
                       <div key={node.id} className="flex items-center gap-1 text-xs text-slate-300 truncate">
                         <span>🏛️</span>
                         <span className="truncate">{node.name}</span>
                       </div>
                     ))}
                     {Object.keys(region.nodes).length > 4 && (
                       <div className="text-xs text-slate-400 col-span-2">
                         +{Object.keys(region.nodes).length - 4} 更多...
                       </div>
                     )}
                   </div>
                 </div>
               )}
              
              <div className="text-xs text-slate-400 pt-3 border-t border-slate-600/30">
                <div className="flex items-center gap-2">
                  <i className="fas fa-fingerprint text-slate-500"></i>
                  <span>ID: {region.id}</span>
                </div>
              </div>
            </div>
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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-5xl max-h-[90vh] overflow-hidden w-full">
          <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <i className="fas fa-edit text-white"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">编辑配置</h2>
                <p className="text-sm text-slate-400">修改{activeTab === 'items' ? '物品' : '召唤兽'}配置信息</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={saveEdit}
                className="group bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
              >
                <i className="fas fa-save group-hover:animate-pulse"></i>
                <span>保存</span>
              </button>
              <button
                onClick={cancelEdit}
                className="group bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
              >
                <i className="fas fa-times group-hover:animate-pulse"></i>
                <span>取消</span>
              </button>
            </div>
          </div>
          
          <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">ID</label>
                <input
                  type="text"
                  value={editingData.id || ''}
                  onChange={(e) => updateField('id', e.target.value)}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  placeholder="请输入唯一ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">名称</label>
                <input
                  type="text"
                  value={editingData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  placeholder="请输入名称"
                />
              </div>
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

            {activeTab === 'worldMap' && (
              <>
                {/* 基础信息 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">描述</label>
                  <textarea
                    value={editingData.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                    rows="3"
                    placeholder="请输入区域描述"
                  />
                </div>

                {/* 位置配置 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">X坐标</label>
                    <input
                      type="number"
                      value={editingData.position?.x || 0}
                      onChange={(e) => updateField('position.x', parseInt(e.target.value) || 0)}
                      className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                      placeholder="X坐标"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Y坐标</label>
                    <input
                      type="number"
                      value={editingData.position?.y || 0}
                      onChange={(e) => updateField('position.y', parseInt(e.target.value) || 0)}
                      className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                      placeholder="Y坐标"
                    />
                  </div>
                </div>

                {/* 等级要求和解锁状态 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">等级要求</label>
                    <input
                      type="number"
                      value={editingData.levelRequirement || 1}
                      onChange={(e) => updateField('levelRequirement', parseInt(e.target.value) || 1)}
                      className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                      placeholder="等级要求"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">解锁状态</label>
                    <select
                      value={editingData.isUnlocked ? 'true' : 'false'}
                      onChange={(e) => updateField('isUnlocked', e.target.value === 'true')}
                      className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                    >
                      <option value="true">已解锁</option>
                      <option value="false">未解锁</option>
                    </select>
                  </div>
                </div>

                {/* 背景图片 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">背景图片</label>
                  <input
                    type="text"
                    value={editingData.backgroundImage || ''}
                    onChange={(e) => updateField('backgroundImage', e.target.value)}
                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                    placeholder="背景图片文件名（如：dongsheng_bg.jpg）"
                  />
                </div>

                {/* 解锁条件 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">解锁条件</label>
                  <div className="space-y-3">
                    {(editingData.unlockConditions || []).map((condition, index) => (
                      <div key={index} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">条件类型</label>
                            <select
                              value={condition.type || 'level'}
                              onChange={(e) => updateField(`unlockConditions.${index}.type`, e.target.value)}
                              className="w-full p-2 bg-slate-600/50 border border-slate-500 rounded text-white text-sm"
                            >
                              <option value="level">等级要求</option>
                              <option value="quest">任务完成</option>
                              <option value="item">道具持有</option>
                              <option value="region">区域访问</option>
                              <option value="node">节点完成</option>
                              <option value="story">剧情进度</option>
                            </select>
                          </div>
                          
                          {condition.type === 'level' && (
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">等级值</label>
                              <input
                                type="number"
                                value={condition.value || 1}
                                onChange={(e) => updateField(`unlockConditions.${index}.value`, parseInt(e.target.value) || 1)}
                                className="w-full p-2 bg-slate-600/50 border border-slate-500 rounded text-white text-sm"
                                min="1"
                              />
                            </div>
                          )}
                          
                          {condition.type === 'quest' && (
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">任务ID</label>
                              <input
                                type="text"
                                value={condition.questId || ''}
                                onChange={(e) => updateField(`unlockConditions.${index}.questId`, e.target.value)}
                                className="w-full p-2 bg-slate-600/50 border border-slate-500 rounded text-white text-sm"
                                placeholder="任务ID"
                              />
                            </div>
                          )}
                          
                          {condition.type === 'item' && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">道具ID</label>
                                <input
                                  type="text"
                                  value={condition.itemId || ''}
                                  onChange={(e) => updateField(`unlockConditions.${index}.itemId`, e.target.value)}
                                  className="w-full p-2 bg-slate-600/50 border border-slate-500 rounded text-white text-sm"
                                  placeholder="道具ID"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">数量</label>
                                <input
                                  type="number"
                                  value={condition.amount || 1}
                                  onChange={(e) => updateField(`unlockConditions.${index}.amount`, parseInt(e.target.value) || 1)}
                                  className="w-full p-2 bg-slate-600/50 border border-slate-500 rounded text-white text-sm"
                                  min="1"
                                />
                              </div>
                            </>
                          )}
                          
                          <div className="flex items-end">
                            <button
                              onClick={() => {
                                const newConditions = [...(editingData.unlockConditions || [])];
                                newConditions.splice(index, 1);
                                updateField('unlockConditions', newConditions);
                              }}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => {
                        const newConditions = [...(editingData.unlockConditions || []), { type: 'level', value: 1 }];
                        updateField('unlockConditions', newConditions);
                      }}
                      className="w-full p-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors"
                    >
                      + 添加解锁条件
                    </button>
                  </div>
                </div>

                {/* 节点管理 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">节点列表</label>
                  <div className="space-y-4">
                    {Object.entries(editingData.nodes || {}).map(([nodeId, node]) => (
                      <div key={nodeId} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-lg font-semibold text-white">{node.name}</h4>
                          <button
                            onClick={() => {
                              const newNodes = { ...editingData.nodes };
                              delete newNodes[nodeId];
                              updateField('nodes', newNodes);
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                          >
                            删除节点
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">节点ID</label>
                            <input
                              type="text"
                              value={node.id || ''}
                              onChange={(e) => updateField(`nodes.${nodeId}.id`, e.target.value)}
                              className="w-full p-2 bg-slate-600/50 border border-slate-500 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">节点名称</label>
                            <input
                              type="text"
                              value={node.name || ''}
                              onChange={(e) => updateField(`nodes.${nodeId}.name`, e.target.value)}
                              className="w-full p-2 bg-slate-600/50 border border-slate-500 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">等级要求</label>
                            <input
                              type="number"
                              value={node.levelRequirement || 1}
                              onChange={(e) => updateField(`nodes.${nodeId}.levelRequirement`, parseInt(e.target.value) || 1)}
                              className="w-full p-2 bg-slate-600/50 border border-slate-500 rounded text-white text-sm"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">解锁状态</label>
                            <select
                              value={node.isUnlocked ? 'true' : 'false'}
                              onChange={(e) => updateField(`nodes.${nodeId}.isUnlocked`, e.target.value === 'true')}
                              className="w-full p-2 bg-slate-600/50 border border-slate-500 rounded text-white text-sm"
                            >
                              <option value="true">已解锁</option>
                              <option value="false">未解锁</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-slate-400 mb-1">描述</label>
                          <textarea
                            value={node.description || ''}
                            onChange={(e) => updateField(`nodes.${nodeId}.description`, e.target.value)}
                            className="w-full p-2 bg-slate-600/50 border border-slate-500 rounded text-white text-sm"
                            rows="2"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">位置X</label>
                            <input
                              type="number"
                              value={node.position?.x || 0}
                              onChange={(e) => updateField(`nodes.${nodeId}.position.x`, parseInt(e.target.value) || 0)}
                              className="w-full p-2 bg-slate-600/50 border border-slate-500 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">位置Y</label>
                            <input
                              type="number"
                              value={node.position?.y || 0}
                              onChange={(e) => updateField(`nodes.${nodeId}.position.y`, parseInt(e.target.value) || 0)}
                              className="w-full p-2 bg-slate-600/50 border border-slate-500 rounded text-white text-sm"
                            />
                          </div>
                        </div>
                        
                        {/* 交互配置 */}
                        <div className="mt-4">
                          <label className="block text-xs font-medium text-slate-400 mb-2">交互配置</label>
                          <div className="space-y-2">
                            {(node.interactions || []).map((interaction, interactionIndex) => (
                              <div key={interactionIndex} className="p-3 bg-slate-600/30 rounded border border-slate-500">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">交互ID</label>
                                    <input
                                      type="text"
                                      value={interaction.id || ''}
                                      onChange={(e) => updateField(`nodes.${nodeId}.interactions.${interactionIndex}.id`, e.target.value)}
                                      className="w-full p-1 bg-slate-500/50 border border-slate-400 rounded text-white text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">交互类型</label>
                                    <select
                                      value={interaction.type || 'NPC'}
                                      onChange={(e) => updateField(`nodes.${nodeId}.interactions.${interactionIndex}.type`, e.target.value)}
                                      className="w-full p-1 bg-slate-500/50 border border-slate-400 rounded text-white text-xs"
                                    >
                                      <option value="NPC">NPC对话</option>
                                      <option value="BATTLE">进入战斗</option>
                                      <option value="DUNGEON">副本挑战</option>
                                      <option value="SHOP">商店购买</option>
                                      <option value="EVENT">触发事件</option>
                                      <option value="QUEST">任务委托</option>
                                      <option value="TELEPORT">传送点</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">交互名称</label>
                                    <input
                                      type="text"
                                      value={interaction.name || ''}
                                      onChange={(e) => updateField(`nodes.${nodeId}.interactions.${interactionIndex}.name`, e.target.value)}
                                      className="w-full p-1 bg-slate-500/50 border border-slate-400 rounded text-white text-xs"
                                    />
                                  </div>
                                </div>
                                
                                <div className="mt-2">
                                  <label className="block text-xs text-slate-400 mb-1">描述</label>
                                  <input
                                    type="text"
                                    value={interaction.description || ''}
                                    onChange={(e) => updateField(`nodes.${nodeId}.interactions.${interactionIndex}.description`, e.target.value)}
                                    className="w-full p-1 bg-slate-500/50 border border-slate-400 rounded text-white text-xs"
                                  />
                                </div>
                                
                                <div className="flex justify-end mt-2">
                                  <button
                                    onClick={() => {
                                      const newInteractions = [...(node.interactions || [])];
                                      newInteractions.splice(interactionIndex, 1);
                                      updateField(`nodes.${nodeId}.interactions`, newInteractions);
                                    }}
                                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                                  >
                                    删除交互
                                  </button>
                                </div>
                              </div>
                            ))}
                            
                            <button
                              onClick={() => {
                                const newInteractions = [...(node.interactions || []), {
                                  id: `new_interaction_${Date.now()}`,
                                  type: 'NPC',
                                  name: '新交互',
                                  description: '新交互描述'
                                }];
                                updateField(`nodes.${nodeId}.interactions`, newInteractions);
                              }}
                              className="w-full p-2 border border-dashed border-slate-500 rounded text-slate-400 hover:border-slate-400 hover:text-slate-300 transition-colors text-xs"
                            >
                              + 添加交互
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => {
                        const newNodeId = `new_node_${Date.now()}`;
                        const newNodes = {
                          ...editingData.nodes,
                          [newNodeId]: {
                            id: newNodeId,
                            name: '新节点',
                            description: '新节点描述',
                            position: { x: 100, y: 100 },
                            levelRequirement: 1,
                            unlockConditions: [],
                            isUnlocked: false,
                            interactions: []
                          }
                        };
                        updateField('nodes', newNodes);
                      }}
                      className="w-full p-4 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors"
                    >
                      + 添加新节点
                    </button>
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
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 p-6">
      {/* 装饰性背景元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg">
                <i className="fas fa-cogs text-2xl text-white"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  游戏配置管理器
                </h1>
                <p className="text-slate-400 text-sm mt-1">管理游戏中的物品、召唤兽等配置数据</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                window.electronAPI 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${window.electronAPI ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`}></div>
                <span className="text-sm font-medium">
                  {window.electronAPI ? 'Electron环境' : 'Web环境'}
                </span>
              </div>
            </div>
          </div>
          
          {/* 标签页导航 */}
          <div className="border-b border-slate-700/50 mb-8">
            <nav className="-mb-px flex space-x-1">
              <button
                onClick={() => setActiveTab('items')}
                className={`relative py-3 px-6 font-medium text-sm rounded-t-lg transition-all duration-300 ${
                  activeTab === 'items'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg border-b-2 border-purple-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <i className="fas fa-shield-alt mr-2"></i>
                物品管理
                {activeTab === 'items' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('summons')}
                className={`relative py-3 px-6 font-medium text-sm rounded-t-lg transition-all duration-300 ${
                  activeTab === 'summons'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg border-b-2 border-purple-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <i className="fas fa-dragon mr-2"></i>
                召唤兽管理
                {activeTab === 'summons' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('activeSkills')}
                className={`relative py-3 px-6 font-medium text-sm rounded-t-lg transition-all duration-300 ${
                  activeTab === 'activeSkills'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg border-b-2 border-purple-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <i className="fas fa-magic mr-2"></i>
                主动技能
                {activeTab === 'activeSkills' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('passiveSkills')}
                className={`relative py-3 px-6 font-medium text-sm rounded-t-lg transition-all duration-300 ${
                  activeTab === 'passiveSkills'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg border-b-2 border-purple-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <i className="fas fa-shield-alt mr-2"></i>
                被动技能
                {activeTab === 'passiveSkills' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('buffs')}
                className={`relative py-3 px-6 font-medium text-sm rounded-t-lg transition-all duration-300 ${
                  activeTab === 'buffs'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg border-b-2 border-purple-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <i className="fas fa-sparkles mr-2"></i>
                Buff效果
                {activeTab === 'buffs' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('worldMap')}
                className={`relative py-3 px-6 font-medium text-sm rounded-t-lg transition-all duration-300 ${
                  activeTab === 'worldMap'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg border-b-2 border-purple-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <i className="fas fa-globe mr-2"></i>
                世界地图
                {activeTab === 'worldMap' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400"></div>
                )}
              </button>
            </nav>
          </div>

          {/* 工具栏 */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex space-x-4 items-center">
              {activeTab === 'items' && (
                <div className="relative">
                  <i className="fas fa-filter absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm"></i>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  >
                    <option value="equipments" className="bg-slate-700">🛡️ 装备</option>
                    <option value="consumables" className="bg-slate-700">🧪 消耗品</option>
                    <option value="materials" className="bg-slate-700">💎 材料</option>
                  </select>
                </div>
              )}
              
              {/* 文件操作按钮 */}
              <div className="flex space-x-3">
                <button
                  onClick={() => exportConfig(activeTab)}
                  className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
                >
                  <i className="fas fa-download group-hover:animate-bounce"></i>
                  <span>导出</span>
                </button>
                
                <button
                  onClick={() => reloadConfig(activeTab)}
                  className="group bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-4 py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
                >
                  <i className="fas fa-sync-alt group-hover:animate-spin"></i>
                  <span>重载</span>
                </button>
                
                {activeTab === 'items' && (
                  <button
                    onClick={() => migrateItemEffects()}
                    className="group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
                  >
                    <i className="fas fa-magic group-hover:animate-pulse"></i>
                    <span>迁移</span>
                  </button>
                )}
              </div>
            </div>
            
            <button
              onClick={addNewItem}
              className="group bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center space-x-3 transform hover:scale-105"
            >
              <i className="fas fa-plus group-hover:rotate-90 transition-transform duration-300"></i>
              <span className="font-medium">添加新{
                activeTab === 'items' ? '物品' : 
                activeTab === 'summons' ? '召唤兽' :
                activeTab === 'activeSkills' ? '主动技能' :
                activeTab === 'passiveSkills' ? '被动技能' :
                activeTab === 'buffs' ? 'Buff效果' :
                activeTab === 'worldMap' ? '地图区域' : '项目'
              }</span>
            </button>
          </div>

          {/* 内容区域 */}
          <div className="mb-8">
            {!itemsConfig && !summonsConfig ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="relative">
                    <i className="fas fa-cogs text-6xl text-purple-400/50 mb-6 animate-spin"></i>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-purple-400 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <div className="text-slate-400 text-lg">正在加载配置文件...</div>
                  <div className="text-slate-500 text-sm mt-2">请稍候，系统正在初始化配置数据</div>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* 统计信息 */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <i className="fas fa-chart-bar text-2xl text-purple-400"></i>
                      <div>
                        <div className="text-lg font-semibold text-white">
                          {activeTab === 'items' 
                            ? Object.keys(itemsConfig[selectedCategory] || {}).length
                            : activeTab === 'summons'
                            ? Object.keys(summonsConfig || {}).length
                            : activeTab === 'activeSkills'
                            ? (activeSkillsConfig?.skills?.length || 0)
                            : activeTab === 'passiveSkills'
                            ? (passiveSkillsConfig?.skills?.length || 0)
                            : activeTab === 'buffs'
                            ? (buffsConfig?.length || 0)
                            : activeTab === 'worldMap'
                            ? Object.keys(worldMapConfig || {}).length
                            : 0
                          }
                        </div>
                        <div className="text-sm text-slate-400">
                          {activeTab === 'items' ? '物品总数' : 
                           activeTab === 'summons' ? '召唤兽总数' :
                           activeTab === 'activeSkills' ? '主动技能总数' :
                           activeTab === 'passiveSkills' ? '被动技能总数' :
                           activeTab === 'buffs' ? 'Buff总数' :
                           activeTab === 'worldMap' ? '地图区域总数' : '总数'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-emerald-600/20 to-green-600/20 border border-emerald-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <i className="fas fa-database text-2xl text-emerald-400"></i>
                      <div>
                        <div className="text-lg font-semibold text-white">
                          {activeTab === 'items' ? '3' : '1'}
                        </div>
                        <div className="text-sm text-slate-400">
                          {activeTab === 'items' ? '分类数量' : '配置文件'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <i className="fas fa-clock text-2xl text-amber-400"></i>
                      <div>
                        <div className="text-lg font-semibold text-white">
                          {new Date().toLocaleDateString()}
                        </div>
                        <div className="text-sm text-slate-400">最后更新</div>
                      </div>
                    </div>
                  </div>
                </div>

                {activeTab === 'items' ? renderItemsList() : 
                 activeTab === 'summons' ? renderSummonsList() :
                 activeTab === 'activeSkills' ? renderActiveSkillsList() :
                 activeTab === 'passiveSkills' ? renderPassiveSkillsList() :
                 activeTab === 'buffs' ? renderBuffsList() :
                 activeTab === 'worldMap' ? renderWorldMapList() : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 编辑模态框 */}
      {renderEditForm()}
      
      {/* Toast消息 */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-300 ${
              toast.type === 'success' 
                ? 'bg-emerald-600/90 border-emerald-500 text-white' 
                : toast.type === 'error'
                ? 'bg-red-600/90 border-red-500 text-white'
                : 'bg-amber-600/90 border-amber-500 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <i className={`fas ${
                toast.type === 'success' ? 'fa-check-circle' 
                : toast.type === 'error' ? 'fa-exclamation-circle'
                : 'fa-info-circle'
              }`}></i>
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfigManager; 