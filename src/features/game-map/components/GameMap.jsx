import React, { useState, useRef, useEffect, useCallback } from 'react';
import { initialMapData, CELL_TYPES } from '@/config/mapConfig'; // 导入地图数据和类型
import { findPathAStar } from '@/utils/pathfinding'; // 导入 A* 寻路算法

// 辅助函数，根据单元格类型返回不同的样式或内容
const getCellAppearance = (cellType) => {
  switch (cellType) {
    case CELL_TYPES.GRASS.id:
      return { className: 'bg-green-700 hover:bg-green-600 text-green-300', content: '░' }; // 草地
    case CELL_TYPES.WATER.id:
      return { className: 'bg-blue-700 hover:bg-blue-600 text-blue-300', content: '≈' };    // 水域
    case CELL_TYPES.MOUNTAIN.id:
      return { className: 'bg-gray-700 hover:bg-gray-600 text-gray-400', content: '▲' };  // 山脉
    case CELL_TYPES.FOREST.id:
      return { className: 'bg-emerald-800 hover:bg-emerald-700 text-emerald-400', content: '♣' }; // 森林
    case CELL_TYPES.EMPTY.id:
    default:
      return { className: 'bg-slate-800 hover:bg-slate-700 text-slate-500', content: '·' }; // 空
  }
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

const VIEWPORT_CELL_COUNT_TARGET = 8; // Adjusted to 8 for even larger cells
const VIEWPORT_EDGE_BUFFER_CELLS = 0.5; // How many cells of buffer at viewport edges

// Define props for GameMap
const GameMap = ({ 
  showToast, // Receive showToast prop
  onOpenSummonSystem, 
  onOpenIncubator, 
  onOpenPlayerInfo, 
  onOpenInventory, 
  onOpenSettings 
}) => {
  const { rows, cols, grid } = initialMapData;
  const [calculatedCellSize, setCalculatedCellSize] = useState(40); // Default, will be updated
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [playerPosition, setPlayerPosition] = useState({ row: Math.floor(rows / 2), col: Math.floor(cols / 2) }); // 玩家初始位置
  const [isMapDragging, setIsMapDragging] = useState(false); // Changed from useRef to useState

  const [isAutoMoving, setIsAutoMoving] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const autoMoveTimeoutRef = useRef(null); // Ref to store timeout ID

  const mapContainerRef = useRef(null);
  const pannableRef = useRef(null); // New ref for the pannable container
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const titleSectionHeightEstimate = 45; // px, for "游戏地图" title + margin (e.g., text-2xl + mb-4)

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
  }, []);

  // Calculate cell size based on viewport
  useEffect(() => {
    if (mapContainerRef.current) {
      const containerWidth = mapContainerRef.current.clientWidth;
      const containerHeight = mapContainerRef.current.clientHeight;
      // Calculate cell size to fit VIEWPORT_CELL_COUNT_TARGET in the smaller dimension
      const sizeBasedOnWidth = containerWidth / VIEWPORT_CELL_COUNT_TARGET;
      const sizeBasedOnHeight = containerHeight / VIEWPORT_CELL_COUNT_TARGET;
      setCalculatedCellSize(Math.max(10, Math.floor(Math.min(sizeBasedOnWidth, sizeBasedOnHeight)))); // Ensure a minimum size
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
    
    // 未来可以在这里扣除行动点： typeConfig.movementCost

    setPlayerPosition({ row: targetRow, col: targetCol });
    return true;
  }, [rows, cols, grid, showToast, triggerShake]);

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
    if (mapContainerRef.current && pannableRef.current && !isMapDragging) {
      const viewportWidth = mapContainerRef.current.clientWidth;
      const viewportHeight = mapContainerRef.current.clientHeight;

      const pannableContentWidth = initialMapData.cols * calculatedCellSize;
      const pannableContentHeight = (initialMapData.rows * calculatedCellSize) + titleSectionHeightEstimate;

      const playerOffsetX = (playerPosition.col + 0.5) * calculatedCellSize;
      const playerOffsetY = titleSectionHeightEstimate + (playerPosition.row + 0.5) * calculatedCellSize;
      
      let targetX = (pannableContentWidth / 2) - playerOffsetX;
      let targetY = (pannableContentHeight / 2) - playerOffsetY;

      const bufferPx = calculatedCellSize * VIEWPORT_EDGE_BUFFER_CELLS;

      const clampedX = clampCoordinate(targetX, viewportWidth, pannableContentWidth, bufferPx);
      const clampedY = clampCoordinate(targetY, viewportHeight, pannableContentHeight, bufferPx);
      
      setPosition({ x: clampedX, y: clampedY });
    }
  }, [playerPosition, isMapDragging, calculatedCellSize, initialMapData.cols, initialMapData.rows, titleSectionHeightEstimate, clampCoordinate]); // Dependencies updated

  // Mouse drag logic
  useEffect(() => {
    const pannableEl = pannableRef.current;
    if (!pannableEl) return;

    const handleMouseDown = (event) => {
      // Drag can start by clicking children like cells, or title, or pannable background.
      if (event.button !== 0) return; 
      // Check if the event target is an interactive element like a button *inside* pannable, if any were added later.
      // For now, this is fine.
      setIsMapDragging(true);
      lastMousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
      setIsMapDragging(false);
    };

    const handleMouseMove = (event) => {
      if (!isMapDragging) return;
      const dx = event.clientX - lastMousePosition.current.x;
      const dy = event.clientY - lastMousePosition.current.y;
      lastMousePosition.current = { x: event.clientX, y: event.clientY };
      
      setPosition(prevPos => {
        const newRawX = prevPos.x + dx;
        const newRawY = prevPos.y + dy;

        if (!mapContainerRef.current) return { x: newRawX, y: newRawY }; // Should not happen
        
        const viewportWidth = mapContainerRef.current.clientWidth;
        const viewportHeight = mapContainerRef.current.clientHeight;
        const pannableContentWidth = initialMapData.cols * calculatedCellSize;
        const pannableContentHeight = (initialMapData.rows * calculatedCellSize) + titleSectionHeightEstimate;
        const bufferPx = calculatedCellSize * VIEWPORT_EDGE_BUFFER_CELLS;

        const clampedX = clampCoordinate(newRawX, viewportWidth, pannableContentWidth, bufferPx);
        const clampedY = clampCoordinate(newRawY, viewportHeight, pannableContentHeight, bufferPx);
        
        return { x: clampedX, y: clampedY };
      });
    };

    pannableEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      pannableEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isMapDragging, setIsMapDragging, calculatedCellSize, initialMapData.cols, initialMapData.rows, titleSectionHeightEstimate, clampCoordinate]); // Added dependencies for clamping

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
  const handleCellDoubleClick = (targetRow, targetCol) => {
    if (isMapDragging) return; // Prevent move on double click if map is being dragged

    if (isAutoMoving) { // If already auto-moving, cancel current and start new
      cancelAutoMove();
    }

    const dr = Math.abs(targetRow - playerPosition.row);
    const dc = Math.abs(targetCol - playerPosition.col);
    
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) { // Adjacent cell
      attemptPlayerMove(targetRow, targetCol);
    } else { // Distant cell, try pathfinding
      const startNode = { row: playerPosition.row, col: playerPosition.col };
      const endNode = { row: targetRow, col: targetCol };
      
      // Pass initialMapData (which has rows, cols, grid) and CELL_TYPES (for movement costs)
      const path = findPathAStar(initialMapData, CELL_TYPES, startNode, endNode);

      if (path && path.length > 1) { // path includes start node, so > 1 means a path exists
        setCurrentPath(path.slice(1)); // Remove start node from path
        setCurrentPathIndex(0);
        setIsAutoMoving(true);
      } else {
        showToast('无法到达目标地点！', 'warning');
      }
    }
  };

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

  return (
    <div 
      ref={mapContainerRef}
      className={`w-full h-screen bg-slate-900 flex flex-col items-center justify-center p-4 select-none overflow-hidden relative ${isMapDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      tabIndex={0} 
    >
      <div className="absolute top-4 left-4 bg-slate-800/80 p-2 rounded shadow text-slate-300 text-xs z-20">
        <div>位置: X: {position.x.toFixed(0)}, Y: {position.y.toFixed(0)}</div>
        <div>玩家: ({playerPosition.row}, {playerPosition.col})</div>
        <div>单元格尺寸: {calculatedCellSize}px</div>
        {isMapDragging && <div className="text-red-400">拖拽中...</div>}
      </div>
      
      <div // This is the new pannable container. It will be centered by mapContainerRef's flex properties.
        ref={pannableRef}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transformOrigin: 'center center', // Explicitly set, though default for many cases
          transition: isMapDragging ? 'none' : 'transform 0.2s ease-out',
          // The cursor is handled by mapContainerRef based on isMapDragging
        }}
        // onMouseDown is now added via useEffect to pannableRef.current
      >
        <div className="text-center mb-4 text-2xl text-slate-200 font-bold tracking-wider">游戏地图</div>
        <div 
          className="grid gap-0 bg-slate-700 rounded-md shadow-xl border border-slate-600 pointer-events-auto" // pointer-events-auto for cell interactions
          style={{ 
            gridTemplateColumns: `repeat(${cols}, ${calculatedCellSize}px)`,
            // No transform here, it's on pannableRef
          }}
        >
          {grid.map((rowArr, rowIndex) =>
            rowArr.map((cell, colIndex) => {
              const appearance = getCellAppearance(cell.type);
              const isPlayerCell = rowIndex === playerPosition.row && colIndex === playerPosition.col;
              // Cell dimensions are now dynamic
              const cellStyle = {
                width: `${calculatedCellSize}px`,
                height: `${calculatedCellSize}px`,
              };
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`border-t border-l border-slate-700/50 
                             flex items-center justify-center 
                             text-lg font-mono 
                             hover:border-amber-500 
                             ${isMapDragging ? 'cursor-grabbing' : 'cursor-pointer'} transition-colors duration-100 
                             relative 
                             ${isPlayerCell ? '' : appearance.className}`}
                  style={cellStyle} // Apply dynamic cell size
                  title={`单元格 (${rowIndex}, ${colIndex}) - ${cell.type}${isPlayerCell ? ' (玩家)' : ''}`}
                  onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                >
                  {isPlayerCell ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/70 rounded-sm z-10">
                      <span className="text-white font-bold">P</span>
                    </div>
                  ) : null}
                  {appearance.content}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-3 z-20">
        <button
          onClick={onOpenSummonSystem}
          className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded-md shadow-lg transition-all duration-150 text-sm flex items-center gap-2"
        >
          <i className="fas fa-dragon"></i> 召唤
        </button>
        <button
          onClick={onOpenIncubator}
          className="bg-yellow-500 hover:bg-yellow-400 text-slate-800 py-2 px-4 rounded-md shadow-lg transition-all duration-150 text-sm flex items-center gap-2"
        >
          <i className="fas fa-egg"></i> 孵化器
        </button>
        <button
          onClick={onOpenPlayerInfo}
          className="bg-blue-500 hover:bg-blue-400 text-white py-2 px-4 rounded-md shadow-lg transition-all duration-150 text-sm flex items-center gap-2"
        >
          <i className="fas fa-user"></i> 角色
        </button>
        <button
          onClick={onOpenInventory}
          className="bg-orange-500 hover:bg-orange-400 text-white py-2 px-4 rounded-md shadow-lg transition-all duration-150 text-sm flex items-center gap-2"
        >
          <i className="fas fa-briefcase"></i> 背包
        </button>
        <button
          onClick={onOpenSettings}
          className="bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-md shadow-lg transition-all duration-150 text-sm flex items-center gap-2"
        >
          <i className="fas fa-cog"></i> 设置
        </button>
      </div>
    </div>
  );
};

export default GameMap; 