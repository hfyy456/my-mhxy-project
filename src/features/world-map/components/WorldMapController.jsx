import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import WorldMapSelector from './WorldMapSelector';
import RegionDetailView from './RegionDetailView';
import { createNodeInteractionHandler } from '../systems/NodeInteractionHandler';

const WorldMapController = ({ 
  isOpen, 
  onClose, 
  showToast = () => {} // 默认空函数，避免报错
}) => {
  const dispatch = useDispatch();
  
  // 状态管理
  const [currentView, setCurrentView] = useState('world_map'); // 'world_map' | 'region_detail'
  const [selectedRegion, setSelectedRegion] = useState(null);
  
  // 创建交互处理器
  const interactionHandler = createNodeInteractionHandler(dispatch, showToast);

  // 处理区域选择
  const handleRegionSelect = useCallback((regionId) => {
    setSelectedRegion(regionId);
    setCurrentView('region_detail');
    showToast(`进入 ${regionId} 区域`, 'info');
  }, [showToast]);

  // 返回世界地图
  const handleBackToWorldMap = useCallback(() => {
    setCurrentView('world_map');
    setSelectedRegion(null);
    showToast('返回世界地图', 'info');
  }, [showToast]);

  // 处理节点交互
  const handleNodeInteraction = useCallback(async (interactionData) => {
    try {
      showToast('正在处理交互...', 'info');
      
      const result = await interactionHandler.handleInteraction(interactionData);
      
      if (result.success) {
        showToast(`交互成功: ${result.message}`, 'success');
        
        // 根据交互类型执行额外操作
        switch (result.type) {
          case 'battle':
            // 可以在这里处理战斗后的逻辑
            break;
          case 'dungeon':
            // 可以在这里处理副本后的逻辑
            break;
          case 'quest':
            // 可以在这里处理任务接受后的逻辑
            break;
          case 'shop':
            // 可以在这里打开商店界面
            break;
          case 'teleport':
            // 可以在这里处理传送逻辑
            break;
          default:
            break;
        }
        
        return result;
      } else {
        showToast(`交互失败: ${result.message}`, 'error');
        return result;
      }
    } catch (error) {
      showToast(`交互错误: ${error.message}`, 'error');
      console.error('节点交互处理错误:', error);
      return { success: false, error: error.message };
    }
  }, [interactionHandler, showToast]);

  // 处理关闭
  const handleClose = useCallback(() => {
    setCurrentView('world_map');
    setSelectedRegion(null);
    onClose();
  }, [onClose]);

  // 根据当前视图渲染对应组件
  const renderCurrentView = () => {
    switch (currentView) {
      case 'world_map':
        return (
          <WorldMapSelector
            isOpen={isOpen}
            onClose={handleClose}
            onRegionSelect={handleRegionSelect}
          />
        );
      
      case 'region_detail':
        return (
          <RegionDetailView
            isOpen={isOpen}
            onClose={handleClose}
            regionId={selectedRegion}
            onNodeInteraction={handleNodeInteraction}
            onBackToWorldMap={handleBackToWorldMap}
          />
        );
      
      default:
        return null;
    }
  };

  return renderCurrentView();
};

export default WorldMapController; 