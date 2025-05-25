import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectSelectedTileCoordinates,
  selectCurrentRegionMapData,
  selectPlayerPosition,
  changeRegionAction 
} from '@/store/slices/mapSlice';
// import { startInteraction } from '@/store/slices/npcSlice'; // 不再需要
import { CELL_TYPES, TILE_CONTENT_TYPES } from '@/config/map/mapConfig';
import { npcs as npcConfig } from '@/config/character/npcConfig'; 

const TileInfoPanel = ({ showToast, onOpenNpcPanel }) => {
  const dispatch = useDispatch();
  const selectedCoords = useSelector(selectSelectedTileCoordinates);
  const currentMapData = useSelector(selectCurrentRegionMapData);
  const playerPosition = useSelector(selectPlayerPosition);

  if (!selectedCoords || !currentMapData || !currentMapData.grid) {
    return (
      <div className="w-64 bg-slate-800 p-4 rounded-lg shadow-xl text-slate-300 fixed top-1/2 left-4 transform -translate-y-1/2">
        <h3 className="text-lg font-bold text-slate-100 mb-3 border-b border-slate-700 pb-2">地块信息</h3>
        <p className="text-sm">请在地图上选择一个地块查看详情。</p>
      </div>
    );
  }

  const { row, col } = selectedCoords;
  const cellData = currentMapData.grid[row]?.[col];

  if (!cellData) {
    return (
      <div className="w-64 bg-slate-800 p-4 rounded-lg shadow-xl text-slate-300 fixed top-1/2 left-4 transform -translate-y-1/2">
        <h3 className="text-lg font-bold text-slate-100 mb-3 border-b border-slate-700 pb-2">地块信息</h3>
        <p className="text-sm text-red-400">无法获取选中地块的数据。</p>
      </div>
    );
  }

  const cellTypeInfo = CELL_TYPES[cellData.type] || { name: '未知类型', color: '#888' };
  const content = cellData.content;

  const handlePortalTravel = () => {
    if (content && content.type === TILE_CONTENT_TYPES.PORTAL && content.targetRegionId && content.targetEnterPoint && playerPosition) {
      const isPlayerAtPortal = playerPosition.row === row && playerPosition.col === col;
      const isPlayerAdjacentToPortal = Math.abs(playerPosition.row - row) <= 1 && Math.abs(playerPosition.col - col) <= 1;

      if (isPlayerAtPortal || isPlayerAdjacentToPortal) {
        if (showToast) showToast(`正在传送至 ${content.label || content.targetRegionId}...`, 'info');
        dispatch(changeRegionAction({ regionId: content.targetRegionId, enterPoint: content.targetEnterPoint }));
      } else {
        if (showToast) showToast("传送门太远了，请靠近后再试。", 'warning');
      }
    }
  };

  return (
    <div className="w-64 bg-slate-800 p-4 rounded-lg shadow-xl text-slate-300 fixed top-1/2 left-4 transform -translate-y-1/2 flex flex-col space-y-3">
      <h3 className="text-lg font-bold text-slate-100 mb-2 border-b border-slate-700 pb-2">地块信息</h3>
      
      <div>
        <span className="font-semibold text-slate-400">坐标:</span> ({row}, {col})
      </div>
      <div>
        <span className="font-semibold text-slate-400">类型:</span> 
        <span style={{ color: cellTypeInfo.color, marginLeft: '0.25rem', padding: '0.1rem 0.3rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem'}}>
          {cellTypeInfo.name}
        </span>
      </div>

      {content && (
        <div className="border-t border-slate-700 pt-3 mt-2">
          <h4 className="text-md font-bold text-slate-100 mb-2">内容信息</h4>
          {content.type === TILE_CONTENT_TYPES.PORTAL && (
            <div>
              <p><span className="font-semibold text-slate-400">传送门:</span> {content.label || '未命名传送门'}</p>
              <button 
                onClick={handlePortalTravel}
                className="mt-2 w-full bg-purple-600 hover:bg-purple-500 text-white py-2 px-3 rounded-md text-sm transition-colors duration-150 flex items-center justify-center">
                <i className="fas fa-dungeon mr-2"></i>传 送
              </button>
            </div>
          )}
          {content.type === TILE_CONTENT_TYPES.NPC && npcConfig[content.id] && (
            <div>
              <p>
                <span className="font-semibold text-slate-400">NPC:</span> 
                <button 
                  onClick={() => onOpenNpcPanel(content.id)} 
                  className="ml-1 text-sky-400 hover:text-sky-300 underline cursor-pointer"
                >
                  {npcConfig[content.id].name || '未知NPC'}
                </button>
              </p>
              {/* 对话按钮已被移除 */}
              {/* <p className="text-xs text-slate-400 mt-1">{npcConfig[content.id].description || ''}</p> */}
              {/* <button 
                onClick={handleNpcInteract}
                className="mt-2 w-full bg-sky-600 hover:bg-sky-500 text-white py-2 px-3 rounded-md text-sm transition-colors duration-150 flex items-center justify-center">
                <i className="fas fa-comments mr-2"></i>对 话
              </button> */}
            </div>
          )}
          {/* Future content types like MONSTER, RESOURCE can be added here */} 
          {content.type !== TILE_CONTENT_TYPES.PORTAL && content.type !== TILE_CONTENT_TYPES.NPC && (
            <p><span className="font-semibold text-slate-400">其他:</span> {content.id || content.type}</p>
          )}
        </div>
      )}
      {!content && (
         <p className="text-sm text-slate-500 italic mt-2 pt-3 border-t border-slate-700">该地块没有可交互内容。</p>
      )}
    </div>
  );
};

export default TileInfoPanel; 