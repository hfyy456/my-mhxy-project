/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-21 02:52:59
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-01 04:12:41
 */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux"; // Import Redux hooks
import { Application, useApplication, extend } from "@pixi/react";
import {
  Container as PixiJsContainer, // Keep original import from pixi.js, aliased
  Sprite,
  Graphics,
} from "pixi.js";
// import { FixedSizeGrid } from 'react-window'; // <-- 注释掉 FixedSizeGrid
import {
  CELL_TYPES,
  MAP_VIEW_CONFIG,
  TILE_CONTENT_TYPES,
} from "@/config/map/mapConfig"; // 导入地图数据和类型
import { WORLD_REGIONS } from "@/config/map/worldMapConfig"; // 导入世界地图配置
import { findPathAStar } from "@/utils/pathfinding"; // 导入 A* 寻路算法
import {
  setPlayerPositionAction,
  selectPlayerPosition,
  setSelectedTileCoordinatesAction, // Import new action
  selectCurrentRegionId, // 选择当前区域ID
  selectCurrentRegionMapData, // 选择当前区域地图数据
  setWorldMapOpenAction // 打开/关闭世界地图
} from "@/store/slices/mapSlice"; // Import action and selector
import { startInteraction } from "@/store/slices/npcSlice"; // <--- 导入 startInteraction
import PlayerMarker from "./PlayerMarker"; // <--- 导入 PlayerMarker
import MapTilesRenderer from "./MapTilesRenderer"; // <--- IMPORTED MapTilesRenderer
import PixiAppEventHandler from "./PixiAppEventHandler"; // <--- IMPORT PixiAppEventHandler
import SelectedTileMarker from "./SelectedTileMarker"; // <--- IMPORT SelectedTileMarker
import WorldMapModal from "@/features/world-map/components/WorldMapModal"; // 导入世界地图组件
import TileInfoPanel from "@/features/ui/components/TileInfoPanel"; // <--- 导入 TileInfoPanel

// Module-level extend call for components used in this file or its direct children if they expect these tags
extend({
  Container: PixiJsContainer,
  Sprite,
  Graphics,
});

// Helper to convert hex string color to number, e.g., '#RRGGBB' to 0xRRGGBB
const hexColorToNumber = (hexString) => {
  if (hexString && typeof hexString === "string" && hexString.startsWith("#")) {
    return parseInt(hexString.slice(1), 16);
  }
  return 0x000000; // Default to black if invalid
};

// 新的 memoized MapCell 组件
const MapCell = React.memo(
  ({
    cellData, // cellData now includes { type: '...', content: { type: '...', id: '...'} | null }
    rowIndex,
    colIndex,
    isPlayerCell,
    isMapDragging,
    style,
  }) => {
    const appearance = getCellAppearance(cellData.type);

    let highlightStyle = {};
    let highlightClassName = "";
    let contentIndicator = null;

    if (cellData.content) {
      switch (cellData.content.type) {
        case TILE_CONTENT_TYPES.NPC:
          highlightClassName =
            "border-2 border-blue-400 shadow-blue-400/50 shadow-glow-sm";
          contentIndicator = (
            <span className="absolute top-0 right-0 text-xs p-0.5 bg-blue-500/80 text-white rounded-bl-md z-10">
              N
            </span>
          );
          break;
        case TILE_CONTENT_TYPES.MONSTER:
          highlightClassName =
            "border-2 border-red-400 shadow-red-400/50 shadow-glow-sm";
          contentIndicator = (
            <span className="absolute top-0 right-0 text-xs p-0.5 bg-red-500/80 text-white rounded-bl-md z-10">
              M
            </span>
          );
          break;
        case TILE_CONTENT_TYPES.RESOURCE:
          highlightClassName =
            "border-2 border-green-400 shadow-green-400/50 shadow-glow-sm";
          contentIndicator = (
            <span className="absolute top-0 right-0 text-xs p-0.5 bg-green-500/80 text-white rounded-bl-md z-10">
              R
            </span>
          );
          break;
        case TILE_CONTENT_TYPES.PORTAL:
          highlightClassName =
            "border-2 border-purple-400 shadow-purple-400/50 shadow-glow-sm";
          contentIndicator = (
            <span className="absolute top-0 right-0 text-xs p-0.5 bg-purple-500/80 text-white rounded-bl-md z-10">
              T
            </span>
          );
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
                       ${
                         isMapDragging ? "cursor-grabbing" : "cursor-pointer"
                       } transition-colors duration-100 
                       relative ${highlightClassName}`;
    if (!isPlayerCell) {
      if (appearance.className && !appearance.className.includes("bg-")) {
        combinedClassName += ` ${appearance.className}`;
      } else if (!appearance.style || !appearance.style.backgroundColor) {
        combinedClassName += ` ${appearance.className}`;
      }
    }

    return (
      <div
        className={combinedClassName}
        style={finalCellStyle}
        title={`单元格 (${rowIndex}, ${colIndex}) - ${cellData.type}${
          isPlayerCell ? " (玩家)" : ""
        }${cellData.content ? ` (${cellData.content.type})` : ""}`}
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
  }
);
MapCell.displayName = "MapCell";

const addGlowStyles = () => {
  const styleId = "glow-effect-style";
  if (document.getElementById(styleId)) return;
  const styleElement = document.createElement("style");
  styleElement.id = styleId;
  style.innerHTML = `
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
    .shadow-purple-400\/50 {
      --glow-color: rgba(192, 132, 252, 0.7);
    }
  `;
  document.head.appendChild(styleElement);
};

const addShakeAnimation = () => {
  const styleId = "shake-animation-style";
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.innerHTML = `
    @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); } 20%, 40%, 60%, 80% { transform: translateX(3px); } }
    .map-shake { animation: shake 0.3s ease-in-out; }
  `;
  document.head.appendChild(style);
};

const addScrollbarHideStyles = () => {
  const styleId = "scrollbar-hide-style";
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
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

// Create a WrappedPixiContainer using PixiComponent
const WrappedContainer = ({ x, y, children, label, ...rest }) => {
  return (
    <pixiContainer x={x} y={y} {...rest}>
      {children}
    </pixiContainer>
  );
};

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
  onOpenNpcPanel, // <-- Add new prop for NPC panel
}) => {
  const dispatch = useDispatch();
  const playerPosition = useSelector(selectPlayerPosition); // Get player position from Redux
  const currentRegionId = useSelector(selectCurrentRegionId); // 获取当前区域ID
  const currentMapData = useSelector(selectCurrentRegionMapData); // 获取当前区域地图数据
  
  // 从当前地图数据中获取行列数和网格
  const { rows, cols, grid } = currentMapData;
  
  const [calculatedCellSize, setCalculatedCellSize] = useState(0); // Initialize with 0 to ensure effect runs after calc
  const [worldOffset, setWorldOffset] = useState({ x: 0, y: 0 }); // This state is now controlled by PixiAppEventHandler drag
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false); // 世界地图模态框状态

  const [isAutoMoving, setIsAutoMoving] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const autoMoveTimeoutRef = useRef(null); // Ref to store timeout ID

  const mapContainerRef = useRef(null);
  const worldContainerRef = useRef(null); // <--- ADD worldContainerRef

  // Helper function to clamp coordinates for viewport buffering
  const clampCoordinate = useCallback(
    (rawValue, viewportDim, contentDim, bufferPx) => {
      let finalMin, finalMax;
      const initialOffset = (viewportDim - contentDim) / 2;

      if (contentDim <= viewportDim) {
        // Content fits or is smaller than viewport
        finalMin = -initialOffset; // Allows content left/top edge to align with viewport left/top
        finalMax = initialOffset; // Allows content right/bottom edge to align (or content left/top edge with vp right/bottom - content size)
      } else {
        // Content is larger than viewport
        // Left/Top edge of content (initialOffset + rawValue) should not go past `bufferPx` from viewport left/top.
        // So, rawValue <= bufferPx - initialOffset
        finalMax = bufferPx - initialOffset;

        // Right/Bottom edge of content (initialOffset + rawValue + contentDim) should not go before `viewportDim - bufferPx`.
        // So, rawValue >= viewportDim - bufferPx - contentDim - initialOffset
        finalMin = viewportDim - bufferPx - contentDim - initialOffset;
      }
      return Math.max(finalMin, Math.min(finalMax, rawValue));
    },
    []
  );

  useEffect(() => {
    if (mapContainerRef.current) {
      const containerWidth = mapContainerRef.current.clientWidth;
      const containerHeight = mapContainerRef.current.clientHeight;
      const sizeBasedOnWidth =
        containerWidth / MAP_VIEW_CONFIG.VIEWPORT_CELL_COUNT_TARGET;
      const sizeBasedOnHeight =
        containerHeight / MAP_VIEW_CONFIG.VIEWPORT_CELL_COUNT_TARGET;
      const newSize = Math.max(
        MAP_VIEW_CONFIG.DEFAULT_CELL_SIZE,
        Math.floor(Math.min(sizeBasedOnWidth, sizeBasedOnHeight))
      );
      if (newSize > 0 && calculatedCellSize !== newSize) {
        setCalculatedCellSize(newSize);
      }
    }
  }, [calculatedCellSize]); // Added calculatedCellSize to dependencies to avoid potential stale closure issues if it were part of the effect logic

  const triggerShake = useCallback(() => {
    if (mapContainerRef.current) {
      mapContainerRef.current.classList.add("map-shake");
      
      const startTime = performance.now();
      const duration = 300; // Duration of the animation
      
      const removeShakeClass = (timestamp) => {
        const elapsed = timestamp - startTime;
        if (elapsed >= duration) {
          mapContainerRef.current?.classList.remove("map-shake");
          return;
        }
        requestAnimationFrame(removeShakeClass);
      };
      
      requestAnimationFrame(removeShakeClass);
    }
  }, []);

  const attemptPlayerMove = useCallback(
    (targetRow, targetCol) => {
      if (
        targetRow < 0 ||
        targetRow >= rows ||
        targetCol < 0 ||
        targetCol >= cols
      ) {
        triggerShake();
        if (showToast) showToast("撞到边界了！", "warning");
        return false;
      }
      const cellData = grid[targetRow][targetCol];
      const cellType = cellData.type;
      const typeConfig = Object.values(CELL_TYPES).find(
        (ct) => ct.id === cellType
      );
      if (!typeConfig) {
        triggerShake();
        if (showToast) showToast("未知单元格类型！", "error");
        return false;
      }
      if (typeConfig.movementCost === Infinity) {
        triggerShake();
        if (showToast) showToast(`不能进入 ${typeConfig.name}！`, "error");
        return false;
      }
      dispatch(setPlayerPositionAction({ row: targetRow, col: targetCol }));
      return true;
    },
    [rows, cols, grid, showToast, triggerShake, dispatch]
  );

  const cancelAutoMove = useCallback(() => {
    setIsAutoMoving(false);
    setCurrentPath([]);
    setCurrentPathIndex(0);
    if (autoMoveTimeoutRef.current) {
      cancelAnimationFrame(autoMoveTimeoutRef.current);
      autoMoveTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Player centering logic: always try to center. Drag handling is internal to PixiAppEventHandler.
    if (mapContainerRef.current && playerPosition && calculatedCellSize > 0) {
      const canvasWidth = mapContainerRef.current.clientWidth;
      const canvasHeight =
        mapContainerRef.current.clientHeight -
        MAP_VIEW_CONFIG.TITLE_SECTION_HEIGHT_ESTIMATE -
        30;

      const playerWorldX =
        playerPosition.col * calculatedCellSize + calculatedCellSize / 2;
      const playerWorldY =
        playerPosition.row * calculatedCellSize + calculatedCellSize / 2;

      let targetWorldX = canvasWidth / 2 - playerWorldX;
      let targetWorldY = canvasHeight / 2 - playerWorldY;

      const worldPixelWidth = cols * calculatedCellSize;
      const worldPixelHeight = rows * calculatedCellSize;

      const minOffsetX = Math.min(0, canvasWidth - worldPixelWidth);
      const maxOffsetX = Math.max(
        0,
        canvasWidth > worldPixelWidth ? canvasWidth - worldPixelWidth : 0
      );
      const minOffsetY = Math.min(0, canvasHeight - worldPixelHeight);
      const maxOffsetY = Math.max(
        0,
        canvasHeight > worldPixelHeight ? canvasHeight - worldPixelHeight : 0
      );

      targetWorldX = Math.max(minOffsetX, Math.min(targetWorldX, maxOffsetX));
      targetWorldY = Math.max(minOffsetY, Math.min(targetWorldY, maxOffsetY));

      setWorldOffset({ x: targetWorldX, y: targetWorldY });
    }
  }, [
    playerPosition,
    calculatedCellSize,
    mapContainerRef.current?.clientWidth,
    mapContainerRef.current?.clientHeight,
    cols,
    rows,
  ]); // Removed isMapDraggingRef.current

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isAutoMoving) {
        cancelAutoMove();
      }
      // No drag check here, assuming keyboard input should always work or be handled by OS focus.
      let targetRow = playerPosition.row;
      let targetCol = playerPosition.col;
      switch (event.key) {
        case "ArrowUp":
          targetRow--;
          break;
        case "ArrowDown":
          targetRow++;
          break;
        case "ArrowLeft":
          targetCol--;
          break;
        case "ArrowRight":
          targetCol++;
          break;
        default:
          return;
      }
      attemptPlayerMove(targetRow, targetCol);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerPosition, attemptPlayerMove, isAutoMoving, cancelAutoMove]);

  const handlePixiCellDoubleClick = useCallback(
    (targetRow, targetCol) => {
      // PixiAppEventHandler now internally prevents onCellDoubleClick if a drag just occurred.
      if (isAutoMoving) {
        cancelAutoMove();
      }

      if (!playerPosition) return;

      const dr = Math.abs(targetRow - playerPosition.row);
      const dc = Math.abs(targetCol - playerPosition.col);

      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        attemptPlayerMove(targetRow, targetCol);
      } else {
        const startNode = { row: playerPosition.row, col: playerPosition.col };
        const endNode = { row: targetRow, col: targetCol };

        const path = findPathAStar(
          currentMapData,
          CELL_TYPES,
          startNode,
          endNode
        );

        if (path && path.length > 1) {
          setCurrentPath(path.slice(1));
          setCurrentPathIndex(0);
          setIsAutoMoving(true);
        } else {
          if (showToast) showToast("无法到达目标地点！", "warning");
        }
      }
    },
    [
      isAutoMoving,
      cancelAutoMove,
      playerPosition,
      attemptPlayerMove,
      currentMapData,
      showToast,
      dispatch,
    ]
  ); // Removed isMapDraggingRef.current

  useEffect(() => {
    if (
      isAutoMoving &&
      currentPath.length > 0 &&
      currentPathIndex < currentPath.length
    ) {
      if (autoMoveTimeoutRef.current) {
        cancelAnimationFrame(autoMoveTimeoutRef.current);
      }
      
      const startTime = performance.now();
      const moveDuration = 200;
      
      const executeMove = (timestamp) => {
        const elapsed = timestamp - startTime;
        if (elapsed < moveDuration) {
          autoMoveTimeoutRef.current = requestAnimationFrame(executeMove);
          return;
        }
        
        const nextStep = currentPath[currentPathIndex];
        const moveSuccess = attemptPlayerMove(nextStep.row, nextStep.col);

        if (moveSuccess) {
          setCurrentPathIndex((prevIndex) => prevIndex + 1);
        } else {
          cancelAutoMove();
        }
        
        autoMoveTimeoutRef.current = null;
      };
      
      autoMoveTimeoutRef.current = requestAnimationFrame(executeMove);
    } else if (
      isAutoMoving &&
      currentPathIndex >= currentPath.length &&
      currentPath.length > 0
    ) {
      cancelAutoMove();
    }
    return () => {
      if (autoMoveTimeoutRef.current) {
        cancelAnimationFrame(autoMoveTimeoutRef.current);
      }
    };
  }, [
    isAutoMoving,
    currentPath,
    currentPathIndex,
    attemptPlayerMove,
    cancelAutoMove,
  ]);

  useEffect(() => {
    // 强制初始化时将视口中心对准玩家位置
    const initializeViewportCenter = () => {
      if (mapContainerRef.current && playerPosition && calculatedCellSize > 0) {
        const canvasWidth = mapContainerRef.current.clientWidth;
        const canvasHeight =
          mapContainerRef.current.clientHeight -
          MAP_VIEW_CONFIG.TITLE_SECTION_HEIGHT_ESTIMATE -
          30;

        if (canvasWidth <= 0 || canvasHeight <= 0) {
          // 容器尺寸还未准备好，等待下一帧再试
          requestAnimationFrame(initializeViewportCenter);
          return;
        }

        const playerWorldX =
          playerPosition.col * calculatedCellSize + calculatedCellSize / 2;
        const playerWorldY =
          playerPosition.row * calculatedCellSize + calculatedCellSize / 2;

        let targetWorldX = canvasWidth / 2 - playerWorldX;
        let targetWorldY = canvasHeight / 2 - playerWorldY;

        const worldPixelWidth = cols * calculatedCellSize;
        const worldPixelHeight = rows * calculatedCellSize;

        const minOffsetX = Math.min(0, canvasWidth - worldPixelWidth);
        const maxOffsetX = Math.max(
          0,
          canvasWidth > worldPixelWidth ? canvasWidth - worldPixelWidth : 0
        );
        const minOffsetY = Math.min(0, canvasHeight - worldPixelHeight);
        const maxOffsetY = Math.max(
          0,
          canvasHeight > worldPixelHeight ? canvasHeight - worldPixelHeight : 0
        );

        targetWorldX = Math.max(minOffsetX, Math.min(targetWorldX, maxOffsetX));
        targetWorldY = Math.max(minOffsetY, Math.min(targetWorldY, maxOffsetY));

        console.log("初始化视口中心位置:", {
          player: playerPosition,
          offset: { x: targetWorldX, y: targetWorldY }
        });

        setWorldOffset({ x: targetWorldX, y: targetWorldY });
      }
    };

    // 组件挂载或玩家位置变化时执行一次
    initializeViewportCenter();
  }, [playerPosition, calculatedCellSize, cols, rows, setWorldOffset]);

  // 处理区域变更
  useEffect(() => {
    // 重置视图和路径
    setWorldOffset({ x: 0, y: 0 });
    setCurrentPath([]);
    setCurrentPathIndex(0);
    setIsAutoMoving(false);
    if (autoMoveTimeoutRef.current) {
      clearTimeout(autoMoveTimeoutRef.current);
      autoMoveTimeoutRef.current = null;
    }
    
    // 显示区域信息提示
    if (currentRegionId && WORLD_REGIONS[currentRegionId]) {
      showToast(`已进入: ${WORLD_REGIONS[currentRegionId].name}`, "info");
    }
  }, [currentRegionId, showToast]);

  // 打开世界地图
  const handleOpenWorldMap = () => {
    setIsWorldMapOpen(true);
    dispatch(setWorldMapOpenAction(true));
  };
  
  // 关闭世界地图
  const handleCloseWorldMap = () => {
    setIsWorldMapOpen(false);
    dispatch(setWorldMapOpenAction(false));
  };

  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 select-none overflow-hidden relative cursor-auto`}
      style={{
        backgroundImage: `url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" opacity="0.1"><path d="M0 0L100 100M100 0L0 100" stroke="white" stroke-width="0.5"/></svg>')`,
        boxShadow: 'inset 0 0 50px rgba(0, 0, 0, 0.5)'
      }}
      tabIndex={0}
    >
      {/* 注释掉或移除这个左上角的信息块以避免与 TileInfoPanel 重叠 */}
      {/* <div className="absolute top-4 left-4 bg-slate-800/80 p-2 rounded shadow text-slate-300 text-xs z-20">
        {playerPosition && (
          <>
            <div>
              Player: ({playerPosition.row}, {playerPosition.col})
            </div>
            <div>
              区域: {WORLD_REGIONS[currentRegionId]?.name || "未知区域"}
            </div>
          </>
        )}
        <div>
          @pixi/react Stage:{" "}
          {mapContainerRef.current &&
          mapContainerRef.current.querySelector("canvas")
            ? "Rendered"
            : "Not Yet"}
        </div>
      </div> */}

      <div className="text-center mb-4 relative">
        <div className="inline-block px-8 py-2 bg-gradient-to-r from-amber-700/80 via-yellow-500/80 to-amber-700/80 rounded-lg border-2 border-yellow-300/70 shadow-lg">
          <h2 className="text-2xl text-yellow-100 font-bold tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {WORLD_REGIONS[currentRegionId]?.name || "游戏地图"}
          </h2>
          <div className="text-sm text-yellow-200/90 mt-1">
            {WORLD_REGIONS[currentRegionId]?.description || ""}
          </div>
        </div>
      </div>

      {mapContainerRef.current && calculatedCellSize > 0 && (
        <Application
          width={mapContainerRef.current.clientWidth}
          height={
            mapContainerRef.current.clientHeight -
            MAP_VIEW_CONFIG.TITLE_SECTION_HEIGHT_ESTIMATE -
            30
          }
          options={{
            backgroundColor: hexColorToNumber(
              CELL_TYPES.EMPTY.color || "#1a202c"
            ),
          }}
        >
          <PixiAppEventHandler
            cellSize={calculatedCellSize}
            rows={rows}
            cols={cols}
            grid={grid}
            showToast={showToast}
            onCellDoubleClick={handlePixiCellDoubleClick}
            worldOffset={worldOffset}
            setWorldOffset={setWorldOffset}
            worldContainerRef={worldContainerRef}
          />
          <pixiContainer
            ref={worldContainerRef}
            x={worldOffset.x}
            y={worldOffset.y}
          >
            <MapTilesRenderer
              mapData={currentMapData}
              cellSize={calculatedCellSize}
              cellTypesConfig={CELL_TYPES}
            />
            {playerPosition && calculatedCellSize > 0 && (
              <PlayerMarker cellSize={calculatedCellSize} />
            )}
            <SelectedTileMarker cellSize={calculatedCellSize} />
          </pixiContainer>
        </Application>
      )}

      {/* 添加世界地图按钮 */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={handleOpenWorldMap}
          className="bg-gradient-to-b from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white py-2 px-4 rounded-lg border border-indigo-300 shadow-lg transition-all duration-150 text-sm flex items-center gap-2 font-medium"
          style={{
            boxShadow: '0 0 10px rgba(79, 70, 229, 0.5)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
          }}
        >
          <i className="fas fa-globe"></i> 世界地图
        </button>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-3 z-20">
        {/* 梦幻西游风格的菜单按钮组 */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 p-3 rounded-lg border border-slate-600/50 shadow-xl">
          <button
            onClick={onOpenSummonSystem}
            className="w-full mb-2 bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white py-2 px-4 rounded-lg border border-purple-300/50 shadow-md transition-all duration-150 text-sm flex items-center gap-2 font-medium"
            style={{
              boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
            }}
          >
            <i className="fas fa-dragon"></i> 召唤兽
          </button>
          <button
            onClick={onOpenIncubator}
            className="w-full mb-2 bg-gradient-to-b from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-800 py-2 px-4 rounded-lg border border-yellow-300/70 shadow-md transition-all duration-150 text-sm flex items-center gap-2 font-medium"
            style={{
              boxShadow: '0 0 8px rgba(251, 191, 36, 0.4)',
              textShadow: '0 1px 1px rgba(255, 255, 255, 0.3)'
            }}
          >
            <i className="fas fa-egg"></i> 孵化器
          </button>
          <button
            onClick={onOpenPlayerInfo}
            className="w-full mb-2 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white py-2 px-4 rounded-lg border border-blue-300/50 shadow-md transition-all duration-150 text-sm flex items-center gap-2 font-medium"
            style={{
              boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
            }}
          >
            <i className="fas fa-user"></i> 角色
          </button>
          <button
            onClick={onOpenInventory}
            className="w-full mb-2 bg-gradient-to-b from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 text-white py-2 px-4 rounded-lg border border-orange-300/50 shadow-md transition-all duration-150 text-sm flex items-center gap-2 font-medium"
            style={{
              boxShadow: '0 0 8px rgba(249, 115, 22, 0.4)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
            }}
          >
            <i className="fas fa-briefcase"></i> 背包
          </button>
          <button
            onClick={onOpenQuestLog}
            className="w-full mb-2 bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 text-white py-2 px-4 rounded-lg border border-teal-300/50 shadow-md transition-all duration-150 text-sm flex items-center gap-2 font-medium"
            style={{
              boxShadow: '0 0 8px rgba(20, 184, 166, 0.4)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
            }}
          >
            <i className="fas fa-scroll"></i> 任务
          </button>
          <button
            onClick={onOpenMinimap}
            className="w-full mb-2 bg-gradient-to-b from-lime-500 to-lime-700 hover:from-lime-400 hover:to-lime-600 text-white py-2 px-4 rounded-lg border border-lime-300/50 shadow-md transition-all duration-150 text-sm flex items-center gap-2 font-medium"
            style={{
              boxShadow: '0 0 8px rgba(132, 204, 22, 0.4)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
            }}
          >
            <i className="fas fa-map-marked-alt"></i> 小地图
          </button>
          <button
            onClick={onOpenSettings}
            className="w-full bg-gradient-to-b from-slate-600 to-slate-800 hover:from-slate-500 hover:to-slate-700 text-white py-2 px-4 rounded-lg border border-slate-400/30 shadow-md transition-all duration-150 text-sm flex items-center gap-2 font-medium"
            style={{
              boxShadow: '0 0 8px rgba(100, 116, 139, 0.4)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
            }}
          >
            <i className="fas fa-cog"></i> 设置
          </button>
        </div>
      </div>
      
      {/* 左侧信息面板 - 梦幻西游风格 */}
      <div className="absolute left-4 top-4 z-20">
        <div className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 p-1 rounded-lg border border-slate-600/60 shadow-xl">
          <TileInfoPanel 
            showToast={showToast} 
            onOpenNpcPanel={onOpenNpcPanel}
          />
        </div>
      </div>

      {/* 世界地图模态框 */}
      <WorldMapModal 
        isOpen={isWorldMapOpen} 
        onClose={handleCloseWorldMap} 
      />

    </div>
  );
};

export default GameMap;
