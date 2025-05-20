import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux'; // Import Redux hooks
import { FixedSizeGrid } from 'react-window'; // 导入 FixedSizeGrid
import { initialMapData, CELL_TYPES, MAP_VIEW_CONFIG, TILE_CONTENT_TYPES } from '@/config/mapConfig'; // 导入地图数据和类型
import { findPathAStar } from '@/utils/pathfinding'; // 导入 A* 寻路算法
import { 
  setPlayerPositionAction, 
  selectPlayerPosition, 
  setSelectedTileCoordinatesAction, // Import new action
  // selectSelectedTileCoordinates // Selector will be used in TileInfoPanel
} from '@/store/slices/mapSlice'; // Import action and selector

// 辅助函数，根据单元格类型返回不同的样式或内容
const getCellAppearance = (cellTypeId) => {
  const typeConfig = Object.values(CELL_TYPES).find(ct => ct.id === cellTypeId);

  if (typeConfig && typeConfig.color) {
    let content = ' '; 
    if (typeConfig.id === CELL_TYPES.GRASS.id) content = '░';
    if (typeConfig.id === CELL_TYPES.WATER.id) content = '≈';
    if (typeConfig.id === CELL_TYPES.MOUNTAIN.id) content = '▲';
    if (typeConfig.id === CELL_TYPES.FOREST.id) content = '♣';
    if (typeConfig.id === CELL_TYPES.EMPTY.id) content = '·';
    if (typeConfig.id === CELL_TYPES.TOWN.id) content = '■';
    if (typeConfig.id === CELL_TYPES.BRIDGE.id) content = '=';
    
    return {
      style: { backgroundColor: typeConfig.color }, 
      className: 'hover:brightness-110', 
      content: content 
    };
  }

  // Fallback with explicit style object for consistency, though color comes from className here
  switch (cellTypeId) {
    case CELL_TYPES.GRASS.id:
      return { style: {}, className: 'bg-green-700 hover:bg-green-600 text-green-300', content: '░' };
    case CELL_TYPES.WATER.id:
      return { style: {}, className: 'bg-blue-700 hover:bg-blue-600 text-blue-300', content: '≈' };   
    case CELL_TYPES.MOUNTAIN.id:
      return { style: {}, className: 'bg-gray-700 hover:bg-gray-600 text-gray-400', content: '▲' };  
    case CELL_TYPES.FOREST.id:
      return { style: {}, className: 'bg-emerald-800 hover:bg-emerald-700 text-emerald-400', content: '♣' };
    case CELL_TYPES.EMPTY.id:
    default:
      return { style: {}, className: 'bg-slate-800 hover:bg-slate-700 text-slate-500', content: '·' };
  }
};

// 新的 memoized MapCell 组件
const MapCell = React.memo(({
  cellData, // cellData now includes { type: '...', content: { type: '...', id: '...'} | null }
  rowIndex, 
  colIndex, 
  isPlayerCell,
  isMapDragging, 
  style 
}) => {
  const appearance = getCellAppearance(cellData.type);
  
  let highlightStyle = {};
  let highlightClassName = '';
  let contentIndicator = null;

  if (cellData.content) {
    switch (cellData.content.type) {
      case TILE_CONTENT_TYPES.NPC:
        highlightClassName = 'border-2 border-blue-400 shadow-blue-400/50 shadow-glow-sm';
        contentIndicator = <span className="absolute top-0 right-0 text-xs p-0.5 bg-blue-500/80 text-white rounded-bl-md z-10">N</span>;
        break;
      case TILE_CONTENT_TYPES.MONSTER:
        highlightClassName = 'border-2 border-red-400 shadow-red-400/50 shadow-glow-sm';
        contentIndicator = <span className="absolute top-0 right-0 text-xs p-0.5 bg-red-500/80 text-white rounded-bl-md z-10">M</span>;
        break;
      case TILE_CONTENT_TYPES.RESOURCE:
        highlightClassName = 'border-2 border-green-400 shadow-green-400/50 shadow-glow-sm';
        contentIndicator = <span className="absolute top-0 right-0 text-xs p-0.5 bg-green-500/80 text-white rounded-bl-md z-10">R</span>;
        break;
    }
  }
  
  const finalCellStyle = {
    ...style, 
    ...(isPlayerCell ? {} : appearance.style || {}),
    ...highlightStyle, 
  };

  let combinedClassName = `w-full h-full border-t border-l border-slate-700/50 
                       flex items-center justify-center 
                       text-lg font-mono 
                       hover:border-amber-500 
                       ${isMapDragging ? 'cursor-grabbing' : 'cursor-pointer'} transition-colors duration-100 
                       relative ${highlightClassName}`; 
  if (!isPlayerCell) {
    if (appearance.className && !appearance.className.includes('bg-')) {
        combinedClassName += ` ${appearance.className}`;
    } else if (!appearance.style || !appearance.style.backgroundColor) {
        combinedClassName += ` ${appearance.className}`;
    }
  }

  return (
    <div
      className={combinedClassName}
      style={finalCellStyle} 
      title={`单元格 (${rowIndex}, ${colIndex}) - ${cellData.type}${isPlayerCell ? ' (玩家)' : ''}${cellData.content ? ` (${cellData.content.type})` : ''}`}
    >
      {isPlayerCell ? (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/70 rounded-sm z-10">
          <span className="text-white font-bold">P</span>
        </div>
      ) : null}
      {appearance.content} 
      {!isPlayerCell && contentIndicator} 
    </div>
  );
});
MapCell.displayName = 'MapCell';

const addGlowStyles = () => {
  const styleId = 'glow-effect-style';
  if (document.getElementById(styleId)) return;
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.innerHTML = `
    .shadow-glow-sm {
      box-shadow: 0 0 7px 1.5px var(--glow-color, rgba(255, 255, 255, 0.3)); 
    }
    .shadow-blue-400\/50 {
      --glow-color: rgba(96, 165, 250, 0.7); 
    }
    .shadow-red-400\/50 {
      --glow-color: rgba(248, 113, 113, 0.7); 
    }
    .shadow-green-400\/50 {
      --glow-color: rgba(74, 222, 128, 0.7); 
    }
  `;
  document.head.appendChild(styleElement);
};

const addShakeAnimation = () => {
  const styleId = 'shake-animation-style';
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); } 20%, 40%, 60%, 80% { transform: translateX(3px); } }
    .map-shake { animation: shake 0.3s ease-in-out; }
  `;
  document.head.appendChild(style);
};

const addScrollbarHideStyles = () => {
  const styleId = 'scrollbar-hide-style';
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    .no-scrollbar {
      -ms-overflow-style: none;  
      scrollbar-width: none;  
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;  
    }
  `;
  document.head.appendChild(style);
};

// const VIEWPORT_CELL_COUNT_TARGET = 8; // Adjusted to 8 for even larger cells
// const VIEWPORT_EDGE_BUFFER_CELLS = 0.5; // How many cells of buffer at viewport edges

// Define props for GameMap
const GameMap = ({ 
  showToast, // Receive showToast prop
  onOpenSummonSystem, 
  onOpenIncubator, 
  onOpenPlayerInfo, 
  onOpenInventory, 
  onOpenSettings,
  onOpenQuestLog,
  onOpenMinimap, // <-- Add new prop here
}) => {
  const { rows, cols, grid } = initialMapData;
  const [calculatedCellSize, setCalculatedCellSize] = useState(MAP_VIEW_CONFIG.DEFAULT_CELL_SIZE); // Default, will be updated
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const dispatch = useDispatch();
  const playerPosition = useSelector(selectPlayerPosition); // Get player position from Redux

  const [isMapDragging, setIsMapDragging] = useState(false);

  const [isAutoMoving, setIsAutoMoving] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const autoMoveTimeoutRef = useRef(null); // Ref to store timeout ID

  const mapContainerRef = useRef(null);
  const gridRef = useRef(null); // Ref for FixedSizeGrid instance
  const gridOuterDOMRef = useRef(null); // << NEW REF for the outer DOM element of the grid
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const initialScrollOffsetOnDrag = useRef({ top: 0, left: 0 }); // For drag
  const dragStartInfoRef = useRef(null); // Stores {x, y, time} on mousedown
  const [scrollOffset, setScrollOffset] = useState({ top: 0, left: 0 }); // To store current grid scroll

  // isMapDraggingRef and its useEffect are correctly placed here, before Cell useCallback
  const isMapDraggingRef = useRef(isMapDragging);
  useEffect(() => {
    isMapDraggingRef.current = isMapDragging;
  }, [isMapDragging]);

  // Helper function to clamp coordinates for viewport buffering
  const clampCoordinate = useCallback((rawValue, viewportDim, contentDim, bufferPx) => {
    let finalMin, finalMax;
    const initialOffset = (viewportDim - contentDim) / 2;

    if (contentDim <= viewportDim) { // Content fits or is smaller than viewport
      finalMin = -initialOffset; // Allows content left/top edge to align with viewport left/top
      finalMax = initialOffset;  // Allows content right/bottom edge to align (or content left/top edge with vp right/bottom - content size)
    } else { // Content is larger than viewport
      // Left/Top edge of content (initialOffset + rawValue) should not go past `bufferPx` from viewport left/top.
      // So, rawValue <= bufferPx - initialOffset
      finalMax = bufferPx - initialOffset;
      
      // Right/Bottom edge of content (initialOffset + rawValue + contentDim) should not go before `viewportDim - bufferPx`.
      // So, rawValue >= viewportDim - bufferPx - contentDim - initialOffset
      finalMin = viewportDim - bufferPx - contentDim - initialOffset;
    }
    return Math.max(finalMin, Math.min(finalMax, rawValue));
  }, []);

  useEffect(() => {
    addShakeAnimation(); // Add animation styles on mount
    addScrollbarHideStyles(); // Add scrollbar hiding styles on mount
    addGlowStyles(); // Add glow styles on mount
  }, []);

  // Calculate cell size based on viewport
  useEffect(() => {
    if (mapContainerRef.current) {
      const containerWidth = mapContainerRef.current.clientWidth;
      const containerHeight = mapContainerRef.current.clientHeight;
      // Calculate cell size to fit VIEWPORT_CELL_COUNT_TARGET in the smaller dimension
      const sizeBasedOnWidth = containerWidth / MAP_VIEW_CONFIG.VIEWPORT_CELL_COUNT_TARGET;
      const sizeBasedOnHeight = containerHeight / MAP_VIEW_CONFIG.VIEWPORT_CELL_COUNT_TARGET;
      setCalculatedCellSize(Math.max(MAP_VIEW_CONFIG.DEFAULT_CELL_SIZE, Math.floor(Math.min(sizeBasedOnWidth, sizeBasedOnHeight)))); // Ensure a minimum size
    }
    // Watch for resize events to recalculate (optional, for now just on mount)
    // const handleResize = () => { /* recalculate */ };
    // window.addEventListener('resize', handleResize);
    // return () => window.removeEventListener('resize', handleResize);
  }, []); // Recalculate if viewport target changes, or on mount.

  const triggerShake = useCallback(() => {
    if (mapContainerRef.current) {
      mapContainerRef.current.classList.add('map-shake');
      setTimeout(() => {
        mapContainerRef.current?.classList.remove('map-shake');
      }, 300); // Duration of the animation
    }
  }, []);

  const handleGridScroll = useCallback(({ scrollTop, scrollLeft }) => {
    setScrollOffset({ top: scrollTop, left: scrollLeft });
  }, []);

  // Temporarily disable drag listeners to test double-click interference
  // /*
  useEffect(() => {
    const mapElement = mapContainerRef.current;
    if (!mapElement) return;

    const DRAG_THRESHOLD_PIXELS = 5; // Minimum pixels to move before drag starts

    const handleMouseDown = (event) => {
      const currentMapElement = mapContainerRef.current;
      // console.log('[DragDebug] Mousedown event triggered. Target:', event.target);
      // ... (keep other initial logs if needed for bailout check, but simplify for now)
      
      const clickedOnMapBackground = event.target === currentMapElement;
      const gridOuterElement = gridOuterDOMRef.current;
      const clickedInsideGrid = gridOuterElement && gridOuterElement.contains && typeof gridOuterElement.contains === 'function' && gridOuterElement.contains(event.target);
      
      if (!clickedOnMapBackground && !clickedInsideGrid) {
        // console.log('[DragDebug] Mousedown: bail, click target not on map or grid.');
        return;
      }
      
      if (event.button !== 0) return; 
      
      // Don't set isMapDragging true yet. Just record potential drag start.
      dragStartInfoRef.current = {
        x: event.clientX,
        y: event.clientY,
        time: Date.now(),
        initialScrollLeft: scrollOffset.left,
        initialScrollTop: scrollOffset.top
      };
      // console.log('[DragDebug] Potential drag started:', dragStartInfoRef.current);
      // No cursor change or setIsMapDragging yet.
    };

    const handleMouseUp = () => {
      if (isMapDragging) {
        console.log('[DragDebug] Mouseup: Stopping drag.');
        setIsMapDragging(false);
        document.body.style.cursor = 'default'; 
      }
      // Always clear drag start info on mouseup, regardless of whether drag actually happened.
      dragStartInfoRef.current = null;
      // console.log('[DragDebug] Mouseup: Cleared dragStartInfoRef.');
    };

    const handleMouseMove = (event) => {
      if (!dragStartInfoRef.current) { // Mouse button is not down, or mousedown was not on a draggable area
        return;
      }

      if (isMapDragging) { // Already dragging, continue to scroll
        const dx = event.clientX - lastMousePosition.current.x;
        const dy = event.clientY - lastMousePosition.current.y;
        
        if (gridRef.current) {
          const newScrollLeft = initialScrollOffsetOnDrag.current.left - dx;
          const newScrollTop = initialScrollOffsetOnDrag.current.top - dy;
          gridRef.current.scrollTo({
            scrollLeft: newScrollLeft,
            scrollTop: newScrollTop
          });
        }
      } else { // Mouse button is down, but not yet officially dragging. Check threshold.
        const distX = Math.abs(event.clientX - dragStartInfoRef.current.x);
        const distY = Math.abs(event.clientY - dragStartInfoRef.current.y);

        if (distX > DRAG_THRESHOLD_PIXELS || distY > DRAG_THRESHOLD_PIXELS) {
          console.log('[DragDebug] Drag threshold exceeded. Starting drag officially.');
          setIsMapDragging(true);
          // Set initial positions for ongoing drag calculation
          lastMousePosition.current = { x: dragStartInfoRef.current.x, y: dragStartInfoRef.current.y };
          initialScrollOffsetOnDrag.current = { left: dragStartInfoRef.current.initialScrollLeft, top: dragStartInfoRef.current.initialScrollTop };
          document.body.style.cursor = 'grabbing';

          // Perform the first scroll adjustment based on movement from actual mousedown to current position
          // This is important because lastMousePosition is set to mousedown pos, not current event.clientX/Y
          const dxFromInitial = event.clientX - dragStartInfoRef.current.x;
          const dyFromInitial = event.clientY - dragStartInfoRef.current.y;
          if (gridRef.current) {
            gridRef.current.scrollTo({
              scrollLeft: dragStartInfoRef.current.initialScrollLeft - dxFromInitial,
              scrollTop: dragStartInfoRef.current.initialScrollTop - dyFromInitial
            });
          }
        }
      }
    };

    mapElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      mapElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.style.cursor = 'default'; 
    };
  }, [isMapDragging, scrollOffset]);
  // */

  const attemptPlayerMove = useCallback((targetRow, targetCol) => {
    if (targetRow < 0 || targetRow >= rows || targetCol < 0 || targetCol >= cols) {
      triggerShake();
      showToast('撞到边界了！', 'warning');
      return false;
    }
    const cellData = grid[targetRow][targetCol]; // Get the cell object
    const cellType = cellData.type; // Get the type string (e.g., 'GRASS')
    const typeConfig = Object.values(CELL_TYPES).find(ct => ct.id === cellType); // Find the config object

    if (!typeConfig) { // Should not happen if map data is correct
      console.error(`Unknown cell type: ${cellType} at ${targetRow},${targetCol}`);
      triggerShake();
      showToast('未知单元格类型！', 'error');
      return false;
    }

    if (typeConfig.movementCost === Infinity) {
      triggerShake();
      showToast(`不能进入 ${typeConfig.name}！`, 'error');
      return false;
    }
    
    // Update player position in Redux store
    dispatch(setPlayerPositionAction({ row: targetRow, col: targetCol }));

    // Scroll to the new player position
    if (gridRef.current) {
      gridRef.current.scrollToItem({
        align: 'center',
        rowIndex: targetRow,
        columnIndex: targetCol
      });
    }
    return true;
  }, [rows, cols, grid, showToast, triggerShake, dispatch]);

  // Function to cancel auto movement
  const cancelAutoMove = useCallback(() => {
    setIsAutoMoving(false);
    setCurrentPath([]);
    setCurrentPathIndex(0);
    if (autoMoveTimeoutRef.current) {
      clearTimeout(autoMoveTimeoutRef.current);
      autoMoveTimeoutRef.current = null;
    }
  }, []);

  // Effect to center map on player if not dragging
  useEffect(() => {
    if (mapContainerRef.current && gridRef.current && !isMapDragging && playerPosition) {
      const viewportWidth = mapContainerRef.current.clientWidth;
      const viewportHeight = mapContainerRef.current.clientHeight;

      const pannableContentWidth = initialMapData.cols * calculatedCellSize;
      const pannableContentHeight = (initialMapData.rows * calculatedCellSize) + MAP_VIEW_CONFIG.TITLE_SECTION_HEIGHT_ESTIMATE;

      const playerOffsetX = (playerPosition.col + 0.5) * calculatedCellSize;
      const playerOffsetY = MAP_VIEW_CONFIG.TITLE_SECTION_HEIGHT_ESTIMATE + (playerPosition.row + 0.5) * calculatedCellSize;
      
      let targetX = (pannableContentWidth / 2) - playerOffsetX;
      let targetY = (pannableContentHeight / 2) - playerOffsetY;

      const bufferPx = calculatedCellSize * MAP_VIEW_CONFIG.VIEWPORT_EDGE_BUFFER_CELLS;

      const clampedX = clampCoordinate(targetX, viewportWidth, pannableContentWidth, bufferPx);
      const clampedY = clampCoordinate(targetY, viewportHeight, pannableContentHeight, bufferPx);
      
      setPosition({ x: clampedX, y: clampedY });
    }
  }, [playerPosition, isMapDragging, calculatedCellSize, initialMapData.cols, initialMapData.rows, clampCoordinate]); // Dependencies updated, removed titleSectionHeightEstimate

  // Keyboard control
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isMapDragging) return; // Prevent player movement while dragging map
      
      if (isAutoMoving) { // If auto-moving, cancel it on key press
        cancelAutoMove();
      }

      let targetRow = playerPosition.row;
      let targetCol = playerPosition.col;
      switch (event.key) {
        case 'ArrowUp': targetRow--; break;
        case 'ArrowDown': targetRow++; break;
        case 'ArrowLeft': targetCol--; break;
        case 'ArrowRight': targetCol++; break;
        default: return;
      }
      attemptPlayerMove(targetRow, targetCol);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPosition, attemptPlayerMove, isMapDragging, isAutoMoving, cancelAutoMove]); // Added isMapDragging and isAutoMoving
  
  // Double-click control
  const handleCellDoubleClick = useCallback((targetRow, targetCol) => {
    console.log(`[DoubleClickDebug] handleCellDoubleClick called for (${targetRow}, ${targetCol}). isMapDragging: ${isMapDragging}, isAutoMoving: ${isAutoMoving}`);

    if (isMapDragging) {
      console.log('[DoubleClickDebug] Bailing out: isMapDragging is true.');
      return;
    }

    if (isAutoMoving) { // If already auto-moving, cancel current and start new
      console.log('[DoubleClickDebug] Cancelling existing auto-move.');
      cancelAutoMove();
    }

    if (!playerPosition) return; // Guard if playerPosition is not yet available

    const dr = Math.abs(targetRow - playerPosition.row);
    const dc = Math.abs(targetCol - playerPosition.col);
    
    console.log(`[DoubleClickDebug] Delta row: ${dr}, Delta col: ${dc}`);

    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) { // Adjacent cell
      console.log('[DoubleClickDebug] Attempting move to adjacent cell.');
      attemptPlayerMove(targetRow, targetCol);
    } else { // Distant cell, try pathfinding
      console.log('[DoubleClickDebug] Attempting pathfinding to distant cell.');
      const startNode = { row: playerPosition.row, col: playerPosition.col };
      const endNode = { row: targetRow, col: targetCol };
      
      // Pass initialMapData (which has rows, cols, grid) and CELL_TYPES (for movement costs)
      const path = findPathAStar(initialMapData, CELL_TYPES, startNode, endNode);

      if (path && path.length > 1) { // path includes start node, so > 1 means a path exists
        console.log('[DoubleClickDebug] Path found, starting auto-move.', path);
        setCurrentPath(path.slice(1)); // Remove start node from path
        setCurrentPathIndex(0);
        setIsAutoMoving(true);
      } else {
        console.log('[DoubleClickDebug] No path found.');
        showToast('无法到达目标地点！', 'warning');
      }
    }
  }, [isMapDragging, isAutoMoving, cancelAutoMove, playerPosition, attemptPlayerMove, initialMapData, showToast, dispatch]); // Added dispatch

  // Effect to execute auto movement steps
  useEffect(() => {
    if (isAutoMoving && currentPath.length > 0 && currentPathIndex < currentPath.length) {
      // Clear any existing timeout before setting a new one
      if (autoMoveTimeoutRef.current) {
        clearTimeout(autoMoveTimeoutRef.current);
      }

      autoMoveTimeoutRef.current = setTimeout(() => {
        const nextStep = currentPath[currentPathIndex];
        const moveSuccess = attemptPlayerMove(nextStep.row, nextStep.col);
        
        if (moveSuccess) {
          setCurrentPathIndex(prevIndex => prevIndex + 1);
        } else { // Should not happen if pathfinding is correct
          console.error("Auto-move failed, path was likely invalid.");
          cancelAutoMove(); // Cancel auto-move if a step fails
        }
      }, 200); // Adjust delay as needed (e.g., 200ms)
    } else if (isAutoMoving && currentPathIndex >= currentPath.length && currentPath.length > 0) {
      // Reached end of path
      cancelAutoMove();
    }
    // Cleanup timeout on unmount or when dependencies change stopping the auto-move
    return () => {
      if (autoMoveTimeoutRef.current) {
        clearTimeout(autoMoveTimeoutRef.current);
      }
    };
  }, [isAutoMoving, currentPath, currentPathIndex, attemptPlayerMove, cancelAutoMove]);

  // Initial map centering - no changes needed, will be handled by the main auto-center effect
  // The useEffect with [] deps for initial centering is removed as the main one handles it.

  // Cell renderer for FixedSizeGrid
  const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
    const cellData = grid[rowIndex][columnIndex]; 
    if (!cellData) return null; 
    if (!playerPosition) return null; 

    const dispatchHook = useDispatch(); // Renamed to avoid conflict with GameMap's dispatch if any scope issue, though unlikely here.

    const handleClick = () => {
      if (isMapDraggingRef.current) { 
        return;
      }
      // console.log(`[MapCellClick] Clicked on cell (${rowIndex}, ${columnIndex})`);
      dispatchHook(setSelectedTileCoordinatesAction({ row: rowIndex, col: columnIndex }));
    };

    const handleDoubleClick = () => {
      // console.log(`[GridCellDebug] DoubleClick on FixedSizeGrid cell wrapper (${rowIndex}, ${columnIndex}). isMapDragging: ${isMapDraggingRef.current}`);
      if (!isMapDraggingRef.current) { 
         handleCellDoubleClick(rowIndex, columnIndex);
      } else {
        // console.log('[GridCellDebug] DoubleClick ignored because isMapDragging is true.');
      }
    };

    return (
      <div 
        style={style} 
        onClick={handleClick} 
        onDoubleClick={handleDoubleClick} 
        title={`单元格 (${rowIndex}, ${columnIndex}) - ${cellData.type}${rowIndex === playerPosition.row && columnIndex === playerPosition.col ? ' (玩家)' : ''}${cellData.content ? ` (${cellData.content.type})` : ''}`}
      >
        <MapCell // MapCell will now internally decide its highlight based on cellData.content
          cellData={cellData}
          rowIndex={rowIndex}
          colIndex={columnIndex}
          isPlayerCell={rowIndex === playerPosition.row && columnIndex === playerPosition.col}
          isMapDragging={isMapDragging} 
          style={{ width: '100%', height: '100%' }} 
        />
      </div>
    );
  }, [grid, playerPosition, isMapDragging, handleCellDoubleClick, dispatch, isMapDraggingRef]); // dispatch from GameMap scope

  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (mapContainerRef.current) {
        setViewportSize({
            width: mapContainerRef.current.clientWidth,
            height: mapContainerRef.current.clientHeight - MAP_VIEW_CONFIG.TITLE_SECTION_HEIGHT_ESTIMATE - 30, // Adjusted for title and some padding
        });
    }
  }, [calculatedCellSize]); // Recalculate if cell size changes, or on mount

  return (
    <div 
      ref={mapContainerRef}
      className={`w-full h-screen bg-slate-900 flex flex-col items-center justify-center p-4 select-none overflow-hidden relative ${isMapDragging ? 'cursor-grabbing' : 'cursor-auto'}`}
      tabIndex={0} 
    >
      <div className="absolute top-4 left-4 bg-slate-800/80 p-2 rounded shadow text-slate-300 text-xs z-20">
        {playerPosition && <div>Player: ({playerPosition.row}, {playerPosition.col})</div>}
        <div>Cell Size: {calculatedCellSize}px</div>
      </div>

      <div className="text-center mb-4 text-2xl text-slate-200 font-bold tracking-wider">游戏地图</div>
      
      {viewportSize.width > 0 && viewportSize.height > 0 && grid.length > 0 ? (
        <FixedSizeGrid
          ref={gridRef}
          outerRef={gridOuterDOMRef} 
          className="grid rounded-md shadow-xl border border-slate-600 bg-slate-700 no-scrollbar"
          columnCount={cols}
          rowCount={rows}
          columnWidth={calculatedCellSize}
          rowHeight={calculatedCellSize}
          height={viewportSize.height} 
          width={viewportSize.width}   
          onScroll={handleGridScroll} 
          itemData={{ grid, playerPosition, isMapDragging, handleCellDoubleClick, dispatch }} // dispatch from GameMap scope
        >
          {Cell} 
        </FixedSizeGrid>
      ) : (
        <div className="text-slate-400">Loading map...</div> 
      )}

      <div className="absolute bottom-4 right-4 flex flex-col gap-3 z-20">
         <button onClick={onOpenSummonSystem} className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded-md shadow-lg transition-all duration-150 text-sm flex items-center gap-2"><i className="fas fa-dragon"></i> 召唤</button>
        <button onClick={onOpenIncubator} className="bg-yellow-500 hover:bg-yellow-400 text-slate-800 py-2 px-4 rounded-md shadow-lg transition-all duration-150 text-sm flex items-center gap-2"><i className="fas fa-egg"></i> 孵化器</button>
        <button onClick={onOpenPlayerInfo} className="bg-blue-500 hover:bg-blue-400 text-white py-2 px-4 rounded-md shadow-lg transition-all duration-150 text-sm flex items-center gap-2"><i className="fas fa-user"></i> 角色</button>
        <button onClick={onOpenInventory} className="bg-orange-500 hover:bg-orange-400 text-white py-2 px-4 rounded-md shadow-lg transition-all duration-150 text-sm flex items-center gap-2"><i className="fas fa-briefcase"></i> 背包</button>
        <button onClick={onOpenQuestLog} className="bg-teal-500 hover:bg-teal-400 text-white py-2 px-4 rounded-md shadow-lg transition-all duration-150 text-sm flex items-center gap-2"><i className="fas fa-scroll"></i> 任务</button>
        <button onClick={onOpenMinimap} className="bg-lime-500 hover:bg-lime-400 text-white py-2 px-4 rounded-md shadow-lg transition-all duration-150 text-sm flex items-center gap-2"><i className="fas fa-map-marked-alt"></i> 小地图</button> 
        <button onClick={onOpenSettings} className="bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-md shadow-lg transition-all duration-150 text-sm flex items-center gap-2"><i className="fas fa-cog"></i> 设置</button>
      </div>
    </div>
  );
};

export default GameMap; 