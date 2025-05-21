/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-22 02:23:44
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-22 02:41:38
 */
import React from 'react';
import { useSelector } from 'react-redux';
import { Graphics as OriginalPixiGraphics } from 'pixi.js';
import { extend } from '@pixi/react';
import { selectSelectedTileCoordinates } from '@/store/slices/mapSlice';

// 扩展 PixiJS 组件
extend({ Graphics: OriginalPixiGraphics });

const SelectedTileMarker = ({ cellSize }) => {
  const selectedCoords = useSelector(selectSelectedTileCoordinates);

  const draw = React.useCallback((g) => {
    if (cellSize <= 0) return;

    g.clear();
    g.rect(0, 0, cellSize, cellSize);
    g.stroke({ width: 2, color: 0xffff00, alpha: 0.7 });
  }, [cellSize]);

  if (!selectedCoords || cellSize <= 0) {
    return null;
  }

  const { row, col } = selectedCoords;
  const x = col * cellSize;
  const y = row * cellSize;

  return (
    <pixiGraphics 
      x={x} 
      y={y} 
      draw={draw} 
    />
  );
};

export default SelectedTileMarker; 