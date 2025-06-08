/**
 * @file UnitStateMachine.js
 * @description Defines the possible states for a battle unit's Finite State Machine (FSM).
 * This is not a class, but a constant definition file to enforce state consistency.
 */

export const UNIT_FSM_STATES = {
  /**
   * The unit is waiting for its turn or is inactive. Default state.
   */
  IDLE: 'IDLE',

  /**
   * It's the unit's turn, and it is awaiting player input.
   * (Primarily for player-controlled units).
   */
  AWAITING_INPUT: 'AWAITING_INPUT',

  /**
   * The unit is actively executing an action (e.g., playing an attack animation).
   * The UI can use this state to highlight the active unit.
   */
  EXECUTING: 'EXECUTING',
  
  /**
   * The unit is under a stun effect and cannot act.
   * The main battle state machine will skip this unit's turn.
   */
  STUNNED: 'STUNNED',

  /**
   * The unit's HP has dropped to 0 or below.
   * The UI can use this to render a defeated sprite or apply a grayscale filter.
   */
  DEFEATED: 'DEFEATED',
}; 