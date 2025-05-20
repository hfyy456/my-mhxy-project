import { createSlice } from '@reduxjs/toolkit';
import { initialMapData } from '@/config/mapConfig'; // 确保路径正确

// Helper function to get initial player position from mapConfig
const getInitialPlayerPosition = () => {
  const { rows, cols, playerStartLocation } = initialMapData;
  if (playerStartLocation === 'center') {
    return { row: Math.floor(rows / 2), col: Math.floor(cols / 2) };
  }
  if (
    typeof playerStartLocation === 'object' &&
    playerStartLocation !== null &&
    typeof playerStartLocation.row === 'number' &&
    typeof playerStartLocation.col === 'number'
  ) {
    return { row: playerStartLocation.row, col: playerStartLocation.col };
  }
  // Default fallback to center if config is incorrect
  console.warn(
    'Invalid playerStartLocation in mapConfig for mapSlice, defaulting to center.'
  );
  return { row: Math.floor(rows / 2), col: Math.floor(cols / 2) };
};

const initialState = {
  playerPosition: getInitialPlayerPosition(),
  selectedTileCoordinates: null, // { row: number, col: number } | null
  // Potentially other map-related states in the future, e.g., currentMapId, fogOfWarData
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setPlayerPositionAction: (state, action) => {
      // Payload should be { row: number, col: number }
      if (
        action.payload &&
        typeof action.payload.row === 'number' &&
        typeof action.payload.col === 'number'
      ) {
        state.playerPosition = action.payload;
      } else {
        console.error('Invalid payload for setPlayerPositionAction:', action.payload);
      }
    },
    setSelectedTileCoordinatesAction: (state, action) => {
      // Payload can be { row: number, col: number } or null to deselect
      if (action.payload === null) {
        state.selectedTileCoordinates = null;
      } else if (
        action.payload &&
        typeof action.payload.row === 'number' &&
        typeof action.payload.col === 'number'
      ) {
        state.selectedTileCoordinates = action.payload;
      } else {
        console.error(
          'Invalid payload for setSelectedTileCoordinatesAction:',
          action.payload
        );
      }
    },
    // Example: movePlayerAction: (state, action) => {
    //   const { dr, dc } = action.payload; // delta row, delta col
    //   const newRow = state.playerPosition.row + dr;
    //   const newCol = state.playerPosition.col + dc;
    //   // Add boundary checks from initialMapData.rows/cols if needed here,
    //   // or ensure they are done before dispatching.
    //   // For now, assume validation happens in GameMap or a thunk.
    //   state.playerPosition = { row: newRow, col: newCol };
    // }
  },
});

export const { setPlayerPositionAction, setSelectedTileCoordinatesAction } = mapSlice.actions;

// Selectors
export const selectPlayerPosition = (state) => state.map.playerPosition;
export const selectSelectedTileCoordinates = (state) => state.map.selectedTileCoordinates;

export default mapSlice.reducer; 