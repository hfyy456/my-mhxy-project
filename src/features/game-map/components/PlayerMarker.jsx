import React from 'react';
import { useSelector } from 'react-redux';
import { Graphics as PixiJsGraphics } from 'pixi.js';
import { extend } from '@pixi/react';

import { selectPlayerPosition } from '@/store/slices/mapSlice';

// 扩展 PixiJS 组件
extend({ Graphics: PixiJsGraphics });

const PlayerMarker = ({ cellSize }) => {
  const playerPosition = useSelector(selectPlayerPosition);

  if (!playerPosition || !cellSize || cellSize <= 0) {
    // console.log('[PlayerMarker] Not rendering: no playerPosition or invalid cellSize', playerPosition, cellSize);
    return null;
  }

  // PlayerMarker component's x,y will be the center of the cell
  const markerX = playerPosition.col * cellSize + cellSize / 2;
  const markerY = playerPosition.row * cellSize + cellSize / 2;
  const radius = cellSize / 3; // Example radius

  // console.log(`[PlayerMarker] Rendering at (${markerX}, ${markerY}), radius: ${radius}`);

  return (
    <pixiGraphics
      x={markerX}
      y={markerY}
      draw={(g) => {
        g.clear();
        g.circle(0, 0, radius);
        g.fill(0xff0000);
      }}
    />
  );
};

export default PlayerMarker; 