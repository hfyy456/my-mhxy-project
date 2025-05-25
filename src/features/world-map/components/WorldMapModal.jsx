import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CommonModal from '@/features/ui/components/CommonModal';
import { changeRegionAction, setWorldMapOpenAction } from '@/store/slices/mapSlice';
import { selectCurrentRegionId, selectRegionsDiscovered } from '@/store/slices/mapSlice';
import { WORLD_REGIONS, REGION_TYPES, WORLD_MAP_CONFIG } from '@/config/map/worldMapConfig';

const WorldMapModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const currentRegionId = useSelector(selectCurrentRegionId);
  const regionsDiscovered = useSelector(selectRegionsDiscovered);
  
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  
  // 计算区域节点的位置和连接线
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = WORLD_MAP_CONFIG;
    
    // 设置画布大小
    canvas.width = width;
    canvas.height = height;
    
    // 清空画布
    ctx.fillStyle = WORLD_MAP_CONFIG.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制连接线
    ctx.strokeStyle = WORLD_MAP_CONFIG.lineColor;
    ctx.lineWidth = WORLD_MAP_CONFIG.lineWidth;
    
    // 绘制已发现区域之间的连接
    for (const regionId of regionsDiscovered) {
      const region = WORLD_REGIONS[regionId];
      if (!region) continue;
      
      const { position } = region;
      
      // 绘制与其连接的其他区域的连接线
      for (const connection of region.connections || []) {
        const connectedRegionId = connection.regionId;
        
        // 只绘制连接到已发现区域的线
        if (regionsDiscovered.includes(connectedRegionId)) {
          const connectedRegion = WORLD_REGIONS[connectedRegionId];
          if (!connectedRegion) continue;
          
          const startX = position.x;
          const startY = position.y;
          const endX = connectedRegion.position.x;
          const endY = connectedRegion.position.y;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      }
    }
    
    // 绘制区域节点
    for (const regionId of regionsDiscovered) {
      const region = WORLD_REGIONS[regionId];
      if (!region) continue;
      
      const { position } = region;
      const nodeSize = WORLD_MAP_CONFIG.regionNodeSize;
      const isCurrentRegion = regionId === currentRegionId;
      const isSelected = regionId === selectedRegion;
      const isHovered = regionId === hoveredRegion;
      
      // 确定区域颜色
      const regionType = REGION_TYPES[region.regionType];
      let fillColor = regionType ? regionType.color : '#6B7280';
      
      // 绘制节点背景
      ctx.beginPath();
      ctx.arc(position.x, position.y, nodeSize/2, 0, Math.PI * 2);
      
      // 当前区域或选中/悬停的区域有特殊样式
      if (isCurrentRegion) {
        ctx.fillStyle = '#9333EA'; // 紫色表示当前区域
        ctx.fill();
        
        // 绘制光晕效果
        ctx.beginPath();
        ctx.arc(position.x, position.y, nodeSize/2 + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(147, 51, 234, 0.3)';
        ctx.fill();
      } else if (isSelected || isHovered) {
        // 选中或悬停时加亮
        ctx.fillStyle = shadeColor(fillColor, 20);
        ctx.fill();
      } else {
        ctx.fillStyle = fillColor;
        ctx.fill();
      }
      
      // 添加边框
      ctx.strokeStyle = isSelected || isHovered ? '#ffffff' : '#4a5568';
      ctx.lineWidth = isSelected || isHovered ? 3 : 2;
      ctx.stroke();
      
      // 添加区域名称
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(region.name, position.x, position.y + nodeSize/2 + 15);
    }
  }, [isOpen, currentRegionId, regionsDiscovered, hoveredRegion, selectedRegion]);
  
  // 处理画布上的鼠标移动
  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检测鼠标是否悬停在某个区域节点上
    let foundRegion = null;
    for (const regionId of regionsDiscovered) {
      const region = WORLD_REGIONS[regionId];
      if (!region) continue;
      
      const { position } = region;
      const nodeSize = WORLD_MAP_CONFIG.regionNodeSize;
      const distance = Math.sqrt(
        Math.pow(x - position.x, 2) + Math.pow(y - position.y, 2)
      );
      
      if (distance <= nodeSize/2) {
        foundRegion = regionId;
        break;
      }
    }
    
    setHoveredRegion(foundRegion);
  };
  
  // 处理画布点击
  const handleCanvasClick = () => {
    if (hoveredRegion) {
      setSelectedRegion(hoveredRegion);
    }
  };
  
  // 处理传送到选中区域
  const handleTravelToRegion = () => {
    if (selectedRegion) {
      dispatch(changeRegionAction({ regionId: selectedRegion }));
      dispatch(setWorldMapOpenAction(false));
      if (onClose) onClose();
    }
  };
  
  // 辅助函数：调整颜色亮度
  const shadeColor = (color, percent) => {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
  };
  
  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title="世界地图"
      maxWidthClass="max-w-6xl"
      centerContent={false}
    >
      <div className="p-4 flex flex-col h-full" ref={containerRef}>
        <div className="flex-grow flex">
          <div className="w-3/4 pr-4 relative">
            <canvas 
              ref={canvasRef}
              className="border border-slate-600 rounded-lg shadow-lg bg-slate-900 w-full h-full"
              onMouseMove={handleMouseMove}
              onClick={handleCanvasClick}
            />
            
            {/* 图例 */}
            <div className="absolute bottom-4 left-4 bg-slate-800/70 p-2 rounded-md text-xs">
              <div className="text-white mb-1 font-bold">图例:</div>
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
                <span className="text-slate-200">当前区域</span>
              </div>
              {Object.values(REGION_TYPES).map(type => (
                <div key={type.id} className="flex items-center mb-1">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: type.color }}
                  ></div>
                  <span className="text-slate-200">{type.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="w-1/4 bg-slate-800 rounded-lg p-4 flex flex-col">
            <h3 className="text-lg font-bold text-slate-100 mb-4">区域信息</h3>
            
            {selectedRegion ? (
              <div className="flex-grow">
                <h4 className="text-xl font-bold text-purple-400 mb-2">
                  {WORLD_REGIONS[selectedRegion].name}
                </h4>
                <div className="text-sm text-slate-300 mb-4">
                  {WORLD_REGIONS[selectedRegion].description}
                </div>
                
                <div className="mb-4">
                  <div className="text-sm font-bold text-slate-200 mb-1">区域类型:</div>
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ 
                        backgroundColor: REGION_TYPES[WORLD_REGIONS[selectedRegion].regionType].color 
                      }}
                    ></div>
                    <span className="text-slate-300">
                      {REGION_TYPES[WORLD_REGIONS[selectedRegion].regionType].name}
                    </span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="text-sm font-bold text-slate-200 mb-1">连接区域:</div>
                  <ul className="text-sm text-slate-300">
                    {WORLD_REGIONS[selectedRegion].connections
                      .filter(conn => regionsDiscovered.includes(conn.regionId))
                      .map(conn => (
                        <li key={conn.regionId} className="mb-1">
                          → {WORLD_REGIONS[conn.regionId].name}
                        </li>
                      ))
                    }
                    {WORLD_REGIONS[selectedRegion].connections
                      .filter(conn => regionsDiscovered.includes(conn.regionId)).length === 0 && (
                      <li className="text-slate-400 italic">没有已发现的连接区域</li>
                    )}
                  </ul>
                </div>
                
                {selectedRegion !== currentRegionId && (
                  <button
                    onClick={handleTravelToRegion}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    传送到此区域
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center text-slate-400 text-center">
                <div>
                  <div className="text-3xl mb-2">🗺️</div>
                  <div>请从地图上选择一个区域查看详情</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CommonModal>
  );
};

export default WorldMapModal; 