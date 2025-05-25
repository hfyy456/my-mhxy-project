import React, { useEffect, useRef, useCallback } from 'react';
import { useApplication } from '@pixi/react';
import { useDispatch } from 'react-redux';
import { setSelectedTileCoordinatesAction, changeRegionAction } from '@/store/slices/mapSlice';
import { startInteraction } from '@/store/slices/npcSlice';
import { useSelector } from 'react-redux';
import { selectPlayerPosition } from '@/store/slices/mapSlice';
import { TILE_CONTENT_TYPES } from '@/config/map/mapConfig';

const DOUBLE_TAP_TIMEOUT = 300; // ms
const DRAG_START_THRESHOLD = 5; // pixels
const OVERSCROLL_FACTOR = 0.5; // Adjust for more/less resistance

function PixiAppEventHandler({
  rows,
  cols,
  cellSize,
  onCellDoubleClick,
  worldOffset,
  setWorldOffset,
  worldContainerRef,
  grid,
  showToast,
}) {
  const app = useApplication();
  const dispatch = useDispatch();
  const playerPosition = useSelector(selectPlayerPosition);

  const lastTapRef = useRef({ time: 0, row: -1, col: -1 });
  const isDraggingRef = useRef(false);
  const dragStartPointRef = useRef({ x: 0, y: 0 });
  const initialWorldOffsetRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);

  const animationRef = useRef(null);

  useEffect(() => {
    return () => {
      if (app && app.app && app.app.ticker && animationRef.current) {
        app.app.ticker.remove(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [app]);

  const handleStageTap = useCallback((event) => {
    if (!app || !app.app || !app.app.stage || !worldContainerRef.current) return;
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    const worldContainerInstance = worldContainerRef.current;
    const localPos = event.getLocalPosition(worldContainerInstance);

    const col = Math.floor(localPos.x / cellSize);
    const row = Math.floor(localPos.y / cellSize);

    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return;
    }

    const currentTime = Date.now();
    const { time: lastTapTime, row: lastTapRow, col: lastTapCol } = lastTapRef.current;

    if (
      currentTime - lastTapTime < DOUBLE_TAP_TIMEOUT &&
      lastTapRow === row &&
      lastTapCol === col
    ) {
      // Double tap logic (e.g., for pathfinding)
      if (onCellDoubleClick) {
        onCellDoubleClick(row, col);
      }
      lastTapRef.current = { time: 0, row: -1, col: -1 }; // Reset for next double tap
    } else {
      // Single tap logic: primarily for selecting a tile
      lastTapRef.current = { time: currentTime, row, col };
      dispatch(setSelectedTileCoordinatesAction({ row, col }));

      // The following direct interaction logic will be moved to an information panel
      // and triggered based on the selected tile.

      // // Check for content on the tapped cell
      // if (grid && grid[row] && grid[row][col]) {
      //   const cellData = grid[row][col];

      //   // Handle Portal Click (MOVED TO INFO PANEL)
      //   if (cellData.content && cellData.content.type === TILE_CONTENT_TYPES.PORTAL) {
      //     const { targetRegionId, targetEnterPoint, label } = cellData.content;
      //     if (targetRegionId && targetEnterPoint && playerPosition) {
      //       const isPlayerAtPortal = playerPosition.row === row && playerPosition.col === col;
      //       const isPlayerAdjacentToPortal = Math.abs(playerPosition.row - row) <= 1 &&
      //                                      Math.abs(playerPosition.col - col) <= 1;
      //       if (isPlayerAtPortal || isPlayerAdjacentToPortal) {
      //         if (showToast) {
      //           showToast(`正在传送至 ${label || targetRegionId}...`, 'info');
      //         }
      //         dispatch(changeRegionAction({ regionId: targetRegionId, enterPoint: targetEnterPoint }));
      //         lastTapRef.current = { time: 0, row: -1, col: -1 }; 
      //         return; 
      //       } else if (showToast) {
      //         showToast("传送门太远了，请靠近后再试。", "warning");
      //       }
      //     }
      //   } 
      //   // Handle NPC Click (MOVED TO INFO PANEL)
      //   else if (cellData.content && cellData.content.type === TILE_CONTENT_TYPES.NPC) {
      //     const npcId = cellData.content.id;
      //     if (npcId && playerPosition) {
      //       const isAdjacent = Math.abs(playerPosition.row - row) <= 1 &&
      //                          Math.abs(playerPosition.col - col) <= 1 &&
      //                          (playerPosition.row !== row || playerPosition.col !== col);
      //       if (isAdjacent) {
      //         dispatch(startInteraction({ npcId }));
      //         lastTapRef.current = { time: 0, row: -1, col: -1 }; 
      //       } else if (showToast) {
      //         showToast("NPC太远了，无法互动。", "info");
      //       }
      //     }
      //   }
      // }
    }
  }, [app, rows, cols, cellSize, dispatch, onCellDoubleClick, playerPosition, worldContainerRef, grid, showToast]);

  const handlePointerDown = useCallback((event) => {
    if (!app || !app.app || !event.target || !worldContainerRef.current) return;
    if (animationRef.current && app.app.ticker) {
        app.app.ticker.remove(animationRef.current);
        animationRef.current = null;
    }

    isDraggingRef.current = true; 
    didDragRef.current = false;
    const worldContainerInstance = worldContainerRef.current;
    const localPos = event.getLocalPosition(worldContainerInstance.parent); 
    dragStartPointRef.current = { x: localPos.x, y: localPos.y };
    initialWorldOffsetRef.current = { ...worldOffset };
  }, [app, worldOffset, worldContainerRef]);

  const handlePointerMove = useCallback((event) => {
    if (!isDraggingRef.current || !app || !app.app || !app.app.renderer || !app.app.screen || !worldContainerRef.current) return;

    if (!didDragRef.current) {
      const worldContainerInstance = worldContainerRef.current;
      const localPos = event.getLocalPosition(worldContainerInstance.parent);
      const dxInitial = localPos.x - dragStartPointRef.current.x;
      const dyInitial = localPos.y - dragStartPointRef.current.y;
      if (Math.abs(dxInitial) > DRAG_START_THRESHOLD || Math.abs(dyInitial) > DRAG_START_THRESHOLD) {
          didDragRef.current = true; 
      } else {
          return; 
      }
    }
    
    const worldContainerInstance = worldContainerRef.current; 
    const localPos = event.getLocalPosition(worldContainerInstance.parent);
    const dx = localPos.x - dragStartPointRef.current.x;
    const dy = localPos.y - dragStartPointRef.current.y;

    let targetX = initialWorldOffsetRef.current.x + dx;
    let targetY = initialWorldOffsetRef.current.y + dy;

    const viewportWidth = app.app.screen.width;
    const viewportHeight = app.app.screen.height;
    const worldPixelWidth = cols * cellSize;
    const worldPixelHeight = rows * cellSize;

    const minX = Math.min(0, viewportWidth - worldPixelWidth);
    const maxX = Math.max(0, viewportWidth > worldPixelWidth ? viewportWidth - worldPixelWidth : 0); 
    const minY = Math.min(0, viewportHeight - worldPixelHeight);
    const maxY = Math.max(0, viewportHeight > worldPixelHeight ? viewportHeight - worldPixelHeight : 0);

    let newX = targetX;
    let newY = targetY;

    if (targetX > maxX) {
      newX = maxX + (targetX - maxX) * OVERSCROLL_FACTOR;
    } else if (targetX < minX) {
      newX = minX + (targetX - minX) * OVERSCROLL_FACTOR;
    }

    if (targetY > maxY) {
      newY = maxY + (targetY - maxY) * OVERSCROLL_FACTOR;
    } else if (targetY < minY) {
      newY = minY + (targetY - minY) * OVERSCROLL_FACTOR;
    }
    setWorldOffset({ x: newX, y: newY });

  }, [app, rows, cols, cellSize, setWorldOffset, worldContainerRef, worldOffset]);


  const handlePointerUpOrOutside = useCallback(() => {
    const wasActuallyDragging = didDragRef.current;
    isDraggingRef.current = false; 
    didDragRef.current = false;

    if (!wasActuallyDragging) return; 
    
    if (!app || !app.app || !app.app.renderer || !app.app.screen) return;

    const viewportWidth = app.app.screen.width;
    const viewportHeight = app.app.screen.height;
    const worldPixelWidth = cols * cellSize;
    const worldPixelHeight = rows * cellSize;

    const minX = Math.min(0, viewportWidth - worldPixelWidth);
    const maxX = Math.max(0, viewportWidth > worldPixelWidth ? viewportWidth - worldPixelWidth : 0);
    const minY = Math.min(0, viewportHeight - worldPixelHeight);
    const maxY = Math.max(0, viewportHeight > worldPixelHeight ? viewportHeight - worldPixelHeight : 0);

    let currentX = worldOffset.x;
    let currentY = worldOffset.y;

    const clampedX = Math.max(minX, Math.min(currentX, maxX));
    const clampedY = Math.max(minY, Math.min(currentY, maxY));

    if (currentX !== clampedX || currentY !== clampedY) {
      if (animationRef.current && app.app.ticker) {
        app.app.ticker.remove(animationRef.current);
        animationRef.current = null;
      }

      const animateSnapBack = () => {
        let newWorldX = worldOffset.x; 
        let newWorldY = worldOffset.y; 

        const diffX = clampedX - newWorldX; 
        const diffY = clampedY - newWorldY;

        if (Math.abs(diffX) < 0.5 && Math.abs(diffY) < 0.5) {
          setWorldOffset({ x: clampedX, y: clampedY });
          if (animationRef.current && app.app.ticker) {
            app.app.ticker.remove(animationRef.current);
            animationRef.current = null;
          }
          return;
        }

        newWorldX += diffX * 0.15;
        newWorldY += diffY * 0.15;

        setWorldOffset({ x: newWorldX, y: newWorldY });
      };

      animationRef.current = animateSnapBack;
      app.app.ticker.add(animationRef.current);
    }
  }, [app, worldOffset, setWorldOffset, rows, cols, cellSize]);


  useEffect(() => {
    if (app && app.app && app.app.stage && app.app.renderer && app.app.screen) {
      const stage = app.app.stage;
      stage.eventMode = 'static';
      stage.hitArea = app.app.screen;

      stage.off('pointertap', handleStageTap);
      stage.off('pointerdown', handlePointerDown);
      stage.off('pointermove', handlePointerMove);
      stage.off('pointerup', handlePointerUpOrOutside);
      stage.off('pointerupoutside', handlePointerUpOrOutside);

      stage.on('pointertap', handleStageTap);
      stage.on('pointerdown', handlePointerDown);
      stage.on('pointermove', handlePointerMove);
      stage.on('pointerup', handlePointerUpOrOutside);
      stage.on('pointerupoutside', handlePointerUpOrOutside);

      return () => {
        if (stage && stage.destroyPhase === undefined) { 
          stage.off('pointertap', handleStageTap);
          stage.off('pointerdown', handlePointerDown);
          stage.off('pointermove', handlePointerMove);
          stage.off('pointerup', handlePointerUpOrOutside);
          stage.off('pointerupoutside', handlePointerUpOrOutside);
        }
        if (animationRef.current && app.app.ticker) {
            app.app.ticker.remove(animationRef.current);
            animationRef.current = null;
        }
      };
    }
  }, [app, handleStageTap, handlePointerDown, handlePointerMove, handlePointerUpOrOutside]);

  return null;
}

export default PixiAppEventHandler; 