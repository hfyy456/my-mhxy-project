import React from 'react';
import { useSelector } from 'react-redux';
import CommonModal from '@/features/ui/components/CommonModal';
import { initialMapData, CELL_TYPES } from '@/config/mapConfig';
import { selectPlayerPosition } from '@/store/slices/mapSlice';

const MINIMAP_CELL_SIZE_PX = 8;
const PLAYER_INDICATOR_COLOR = '#ff3333';
const PLAYER_INDICATOR_SIZE_PX = MINIMAP_CELL_SIZE_PX * 1.2;

const getMinimapCellColor = (cellTypeId) => {
  const typeConfig = Object.values(CELL_TYPES).find(ct => ct.id === cellTypeId);
  return typeConfig ? typeConfig.color : CELL_TYPES.EMPTY.color;
};

const MinimapPanel = ({ isOpen, onClose }) => {
  const { grid, rows, cols } = initialMapData;
  const playerPosition = useSelector(selectPlayerPosition);

  if (!isOpen) return null;

  const mapWidth = cols * MINIMAP_CELL_SIZE_PX;
  const mapHeight = rows * MINIMAP_CELL_SIZE_PX;
  const containerPadding = 20;
  const modalWidth = mapWidth + (containerPadding * 2);
  const modalHeight = mapHeight + (containerPadding * 2) + 60; // 加上标题栏的高度

  return (
    <CommonModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="小地图" 
      maxWidthClass="max-w-max"
      centerContent={true}
      style={{
        width: `${modalWidth}px`,
        minWidth: `${modalWidth}px`,
        height: `${modalHeight}px`,
      }}
    >
      <div 
        className="relative bg-slate-800 rounded-lg"
        style={{
          width: mapWidth,
          height: mapHeight,
          backgroundColor: CELL_TYPES.EMPTY.color,
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              style={{
                position: 'absolute',
                left: colIndex * MINIMAP_CELL_SIZE_PX,
                top: rowIndex * MINIMAP_CELL_SIZE_PX,
                width: MINIMAP_CELL_SIZE_PX,
                height: MINIMAP_CELL_SIZE_PX,
                backgroundColor: getMinimapCellColor(cell.type),
              }}
              title={`(${colIndex}, ${rowIndex}) - ${cell.type}`}
            />
          ))
        )}
        {playerPosition && (
          <div
            style={{
              position: 'absolute',
              left: (playerPosition.col * MINIMAP_CELL_SIZE_PX) - (PLAYER_INDICATOR_SIZE_PX - MINIMAP_CELL_SIZE_PX) / 2,
              top: (playerPosition.row * MINIMAP_CELL_SIZE_PX) - (PLAYER_INDICATOR_SIZE_PX - MINIMAP_CELL_SIZE_PX) / 2,
              width: PLAYER_INDICATOR_SIZE_PX,
              height: PLAYER_INDICATOR_SIZE_PX,
              backgroundColor: PLAYER_INDICATOR_COLOR,
              boxShadow: '0 0 4px 2px white',
              borderRadius: '50%',
              zIndex: 10,
              transition: 'all 0.2s ease-out',
            }}
            title={`玩家: (${playerPosition.col}, ${playerPosition.row})`}
          />
        )}
      </div>
    </CommonModal>
  );
};

export default MinimapPanel; 