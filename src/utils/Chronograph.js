/**
 * Chronograph - A centralized time manager for the game.
 * 
 * This singleton class provides a central game loop (tick) and allows various
 * game modules (Managers) to register tasks that should be executed at a
 * specified interval. This avoids the use of multiple, uncoordinated setInterval
 * calls throughout the codebase, leading to better performance, easier debugging,
 * and centralized control over time-based events (e.g., pausing the entire game).
 */
class Chronograph {
  constructor() {
    if (Chronograph.instance) {
      return Chronograph.instance;
    }

    this.tasks = new Map(); // Using Map to easily add/remove tasks by a key
    this.tickIntervalId = null;
    this.lastTickTime = 0;
    this.isRunning = false;

    Chronograph.instance = this;
  }

  /**
   * Registers a new task to be executed at a given interval.
   * @param {string} key - A unique key for the task (e.g., 'homestead-resource-update').
   * @param {function} callback - The function to execute.
   * @param {number} intervalMs - The desired interval in milliseconds.
   */
  registerTask(key, callback, intervalMs) {
    if (this.tasks.has(key)) {
      console.warn(`[Chronograph] Task with key "${key}" is already registered. Overwriting.`);
    }
    this.tasks.set(key, {
      callback,
      interval: intervalMs,
      lastExecuted: 0, // Set to 0 to ensure it runs on the first applicable tick
    });
    console.log(`[Chronograph] Task "${key}" registered with interval ${intervalMs}ms.`);
  }

  /**
   * Unregisters a task by its key.
   * @param {string} key - The unique key of the task to remove.
   */
  unregisterTask(key) {
    if (this.tasks.delete(key)) {
      console.log(`[Chronograph] Task "${key}" unregistered.`);
    } else {
      console.warn(`[Chronograph] Attempted to unregister a non-existent task: "${key}".`);
    }
  }

  /**
   * The main game loop tick.
   * This method is called by setInterval and iterates through all registered tasks.
   */
  _tick() {
    const now = Date.now();
    
    for (const [key, task] of this.tasks.entries()) {
      // If lastExecuted is 0, it means it's a new task or should run immediately.
      // Otherwise, check if the interval has passed since the last execution.
      if (task.lastExecuted === 0 || (now - task.lastExecuted >= task.interval)) {
        try {
          task.callback();
          task.lastExecuted = now;
        } catch (error) {
          console.error(`[Chronograph] Error executing task "${key}":`, error);
        }
      }
    }
  }

  /**
   * Starts the main game loop.
   * @param {number} tickFrequencyMs - How often the main loop should run. Defaults to 1000ms.
   */
  start(tickFrequencyMs = 1000) {
    if (this.isRunning) {
      console.warn('[Chronograph] Start called but it is already running.');
      return;
    }
    
    this.lastTickTime = Date.now();
    this.tickIntervalId = setInterval(() => this._tick(), tickFrequencyMs);
    this.isRunning = true;
    console.log(`[Chronograph] Started with a tick frequency of ${tickFrequencyMs}ms.`);
  }

  /**
   * Stops the main game loop.
   */
  stop() {
    if (!this.isRunning) {
      console.warn('[Chronograph] Stop called but it is not running.');
      return;
    }

    clearInterval(this.tickIntervalId);
    this.tickIntervalId = null;
    this.isRunning = false;
    console.log('[Chronograph] Stopped.');
  }
}

const chronographInstance = new Chronograph();
export default chronographInstance; 