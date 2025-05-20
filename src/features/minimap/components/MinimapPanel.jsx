import React from 'react';
import { useSelector } from 'react-redux';
import CommonModal from '@/features/ui/components/CommonModal';
import { initialMapData, CELL_TYPES } from '@/config/mapConfig';
import { selectPlayerPosition } from '@/store/slices/mapSlice';

const MINIMAP_CELL_SIZE_PX = 5; 
const PLAYER_INDICATOR_COLOR = 'red'; 
const PLAYER_INDICATOR_SIZE_PX = MINIMAP_CELL_SIZE_PX;

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

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} title="小地图" maxWidthClass="max-w-max">
      <div className="p-4 bg-slate-800" style={{ width: mapWidth + 4, height: mapHeight + 4, overflow: 'hidden' }}>
        <div style={{
          position: 'relative',
          width: mapWidth,
          height: mapHeight,
          backgroundColor: CELL_TYPES.EMPTY.color, 
        }}>
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
                left: playerPosition.col * MINIMAP_CELL_SIZE_PX,
                top: playerPosition.row * MINIMAP_CELL_SIZE_PX,
                width: PLAYER_INDICATOR_SIZE_PX,
                height: PLAYER_INDICATOR_SIZE_PX,
                backgroundColor: PLAYER_INDICATOR_COLOR,
                boxShadow: '0 0 3px 1px white', 
              }}
              title={`玩家: (${playerPosition.col}, ${playerPosition.row})`}
            />
          )}
        </div>
      </div>
    </CommonModal>
  );
};

export default MinimapPanel; 