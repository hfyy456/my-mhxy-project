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
      <div className="w-64 p-1">
        <div className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 p-3 rounded-lg border border-amber-600/30 shadow-xl">
          <h3 className="text-lg font-bold text-amber-100 mb-3 border-b border-amber-600/30 pb-2 text-center">
            <i className="fas fa-map-marker-alt mr-2 text-amber-400"></i>
            地块信息
          </h3>
          <p className="text-sm text-amber-200/80">请在地图上选择一个地块查看详情。</p>
        </div>
      </div>
    );
  }

  const { row, col } = selectedCoords;
  const cellData = currentMapData.grid[row]?.[col];

  if (!cellData) {
    return (
      <div className="w-64 p-1">
        <div className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 p-3 rounded-lg border border-amber-600/30 shadow-xl">
          <h3 className="text-lg font-bold text-amber-100 mb-3 border-b border-amber-600/30 pb-2 text-center">
            <i className="fas fa-map-marker-alt mr-2 text-amber-400"></i>
            地块信息
          </h3>
          <p className="text-sm text-red-400">无法获取选中地块的数据。</p>
        </div>
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
    <div className="w-64 p-1">
      <div className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 p-3 rounded-lg border border-amber-600/30 shadow-xl flex flex-col space-y-3">
        <h3 className="text-lg font-bold text-amber-100 mb-2 border-b border-amber-600/30 pb-2 text-center">
          <i className="fas fa-map-marker-alt mr-2 text-amber-400"></i>
          地块信息
        </h3>
        
        <div className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 p-2 rounded border border-slate-600/30">
          <div className="mb-1">
            <span className="font-semibold text-amber-200/90">坐标:</span> 
            <span className="text-amber-100">({row}, {col})</span>
          </div>
          <div>
            <span className="font-semibold text-amber-200/90">类型:</span> 
            <span style={{ 
              color: cellTypeInfo.color, 
              marginLeft: '0.25rem', 
              padding: '0.1rem 0.5rem', 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              borderRadius: '0.25rem',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}>
              {cellTypeInfo.name}
            </span>
          </div>
        </div>

      {content && (
        <div className="pt-2 mt-1">
          <h4 className="text-md font-bold text-amber-100 mb-2 text-center bg-gradient-to-r from-amber-800/30 to-amber-700/30 py-1 rounded border-y border-amber-600/30">
            <i className="fas fa-info-circle mr-2 text-amber-400"></i>
            内容信息
          </h4>
          {content.type === TILE_CONTENT_TYPES.PORTAL && (
            <div className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 p-2 rounded border border-slate-600/30">
              <p>
                <span className="font-semibold text-amber-200/90">传送门:</span> 
                <span className="text-amber-100">{content.label || '未命名传送门'}</span>
              </p>
              <button 
                onClick={handlePortalTravel}
                className="mt-3 w-full bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white py-2 px-3 rounded-lg border border-purple-300/30 shadow-md text-sm transition-all duration-150 flex items-center justify-center font-medium"
                style={{
                  boxShadow: '0 0 8px rgba(168, 85, 247, 0.3)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                }}
              >
                <i className="fas fa-dungeon mr-2"></i>传 送
              </button>
            </div>
          )}
          {content.type === TILE_CONTENT_TYPES.NPC && npcConfig[content.id] && (
            <div className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 p-2 rounded border border-slate-600/30">
              <p>
                <span className="font-semibold text-amber-200/90">NPC:</span> 
                <button 
                  onClick={() => onOpenNpcPanel(content.id)} 
                  className="ml-1 text-sky-300 hover:text-sky-200 underline cursor-pointer font-medium"
                  style={{
                    textShadow: '0 0 5px rgba(56, 189, 248, 0.5)'
                  }}
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
            <div className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 p-2 rounded border border-slate-600/30">
              <p><span className="font-semibold text-amber-200/90">其他:</span> <span className="text-amber-100">{content.id || content.type}</span></p>
            </div>
          )}
        </div>
      )}
      {!content && (
         <p className="text-sm text-amber-200/60 italic mt-2 pt-2 text-center bg-gradient-to-r from-slate-700/30 to-slate-800/30 p-2 rounded border border-slate-600/20">
           <i className="fas fa-info-circle mr-1 opacity-70"></i>
           该地块没有可交互内容
         </p>
      )}
      </div>
    </div>
  );
};

export default TileInfoPanel;