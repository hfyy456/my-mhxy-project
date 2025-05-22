import { createSlice } from '@reduxjs/toolkit';
import { FORMATION_ROWS, FORMATION_COLS } from '@/config/config';

const createInitialGrid = () => Array(FORMATION_ROWS).fill(null).map(() => Array(FORMATION_COLS).fill(null));

const initialState = {
  grid: createInitialGrid(), // 3x3 grid, e.g., [[null, null, null], [null, null, null], [null, null, null]]
  // อาจจะมีการเก็บชื่อ阵型หรือ ID ของ阵型ที่ใช้งานอยู่
  // currentFormationId: null,
  // formations: {}, // Object to store multiple saved formations
};

const formationSlice = createSlice({
  name: 'formation',
  initialState,
  reducers: {
    setSummonInSlot: (state, action) => {
      const { row, col, summonId } = action.payload;
      if (row >= 0 && row < FORMATION_ROWS && col >= 0 && col < FORMATION_COLS) {
        // Basic validation: Ensure summonId is not already in another slot if unique placement is required.
        // For now, simple placement.
        state.grid[row][col] = summonId; // summonId can be null to clear the slot
      } else {
        console.warn(`Invalid slot: [${row}, ${col}] for formation.`);
      }
    },
    clearFormation: (state) => {
      state.grid = createInitialGrid();
    },
    setFormation: (state, action) => {
      const { newGrid } = action.payload;
      if (newGrid && newGrid.length === FORMATION_ROWS && newGrid.every(row => row.length === FORMATION_COLS)) {
        state.grid = newGrid;
      } else {
        console.warn('Invalid grid provided for setFormation.');
      }
    },
    // Reducer to swap summons between two slots
    swapSummonsInSlots: (state, action) => {
      const { fromRow, fromCol, toRow, toCol } = action.payload;
      if (
        fromRow >= 0 && fromRow < FORMATION_ROWS && fromCol >= 0 && fromCol < FORMATION_COLS &&
        toRow >= 0 && toRow < FORMATION_ROWS && toCol >= 0 && toCol < FORMATION_COLS
      ) {
        const temp = state.grid[fromRow][fromCol];
        state.grid[fromRow][fromCol] = state.grid[toRow][toCol];
        state.grid[toRow][toCol] = temp;
      } else {
        console.warn('Invalid slots provided for swapSummonsInSlots.');
      }
    },
  },
});

export const {
  setSummonInSlot,
  clearFormation,
  setFormation,
  swapSummonsInSlots
} = formationSlice.actions;

// Selectors
export const selectFormationGrid = (state) => state.formation.grid;
export const selectSummonInSlot = (state, row, col) => {
  if (state.formation.grid && state.formation.grid[row] && state.formation.grid[row][col] !== undefined) {
    return state.formation.grid[row][col];
  }
  return null; // Or undefined, based on preference for empty slot representation
};

// New selector to count total summons in formation
export const selectTotalSummonsInFormation = (state) => {
  if (!state.formation.grid) return 0;
  let count = 0;
  state.formation.grid.forEach(row => {
    row.forEach(summonId => {
      if (summonId !== null) {
        count++;
      }
    });
  });
  return count;
};

export default formationSlice.reducer; 