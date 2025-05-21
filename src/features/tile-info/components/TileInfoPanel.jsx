import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectSelectedTileCoordinates,
  setSelectedTileCoordinatesAction,
} from '@/store/slices/mapSlice';
import {
  initialMapData,
  CELL_TYPES,
  TILE_CONTENT_TYPES,
  monsters as monsterData,
  resources as resourceData,
} from '@/config/mapConfig';
import { npcs as npcData } from '@/config/npcConfig';

const TileInfoPanel = () => {
  const dispatch = useDispatch();
  const selectedCoords = useSelector(selectSelectedTileCoordinates);

  if (!selectedCoords) {
    return null; // Don't render if no tile is selected
  }

  const { row, col } = selectedCoords;
  const cell = initialMapData.grid[row]?.[col];

  console.log(`[TileInfoDebug] Selected cell at (${row}, ${col}):`, JSON.parse(JSON.stringify(cell))); // Log the full cell object

  if (!cell) {
    console.error('Selected tile data not found!', selectedCoords);
    return null;
  }

  const cellTypeInfo = Object.values(CELL_TYPES).find(ct => ct.id === cell.type);
  const content = cell.content;
  let contentDetails = null;

  if (content) {
    switch (content.type) {
      case TILE_CONTENT_TYPES.NPC:
        contentDetails = npcData[content.id];
        if (contentDetails) console.log(`[TileInfoDebug] NPC Found: ${contentDetails.name} at (${row}, ${col})`, contentDetails);
        break;
      case TILE_CONTENT_TYPES.MONSTER:
        contentDetails = monsterData[content.id];
        if (contentDetails) console.log(`[TileInfoDebug] Monster Found: ${contentDetails.name} at (${row}, ${col})`, contentDetails);
        break;
      case TILE_CONTENT_TYPES.RESOURCE:
        contentDetails = resourceData[content.id];
        if (contentDetails) console.log(`[TileInfoDebug] Resource Found: ${contentDetails.name} at (${row}, ${col})`, contentDetails);
        break;
      default:
        contentDetails = null;
    }
  }

  const handleClose = () => {
    dispatch(setSelectedTileCoordinatesAction(null));
  };

  return (
    <div 
      className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-slate-700/90 p-4 rounded-lg shadow-xl text-slate-200 w-64 max-h-[80vh] overflow-y-auto z-30"
    >
      <button 
        onClick={handleClose} 
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-100 text-xl font-bold"
        title="关闭面板"
      >
        &times;
      </button>
      <h3 className="text-lg font-semibold border-b border-slate-500 pb-2 mb-3">
        地块信息 ({row}, {col})
      </h3>
      
      {cellTypeInfo && (
        <div className="mb-3">
          <p><span className="font-semibold">类型:</span> {cellTypeInfo.name}</p>
          <p><span className="font-semibold">移动耗费:</span> {cellTypeInfo.movementCost === Infinity ? '不可通行' : cellTypeInfo.movementCost}</p>
        </div>
      )}

      {contentDetails ? (
        <div>
          <h4 className="text-md font-semibold mb-1">内容: {contentDetails.name} ({content.type})</h4>
          {/* Render more details based on content type */}
          {content.type === TILE_CONTENT_TYPES.NPC && (
            <div className="text-sm">
              {contentDetails.questsToStart?.length > 0 && <p>可接任务: {contentDetails.questsToStart.join(', ')}</p>}
              {/* Add more NPC details, e.g., button to talk */} 
            </div>
          )}
          {content.type === TILE_CONTENT_TYPES.MONSTER && (
            <div className="text-sm">
              <p>HP: {contentDetails.stats?.hp}, ATK: {contentDetails.stats?.attack}</p>
              {/* Add more Monster details, e.g., button to attack */} 
            </div>
          )}
          {content.type === TILE_CONTENT_TYPES.RESOURCE && (
            <div className="text-sm">
              <p>产出: {contentDetails.itemIdYield}</p>
              <p>采集时间: {contentDetails.gatherTimeSeconds}s</p>
              {/* Add more Resource details, e.g., button to gather */} 
            </div>
          )}
          {contentDetails.sprite && <img src={`/assets/sprites/${contentDetails.sprite}`} alt={contentDetails.name} className="w-16 h-16 mt-2 object-contain" />}
        </div>
      ) : (
        <p className="text-sm text-slate-400">该地块无特殊内容。</p>
      )}
    </div>
  );
};

export default TileInfoPanel; 