/**
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 10:00:00
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-17 10:00:00
 * @Description: Manages all summoned beast instances created through monster breeding.
 */

class SummonManager {
    constructor() {
        if (SummonManager.instance) {
            return SummonManager.instance;
        }
        this.summons = {}; // Store summons by their ID for easy access
        SummonManager.instance = this;
    }

    /**
     * Adds a new summon instance to the manager.
     * @param {Summon} summonInstance - The summon instance to add.
     */
    addSummon(summonInstance) {
        if (!summonInstance || !summonInstance.id) {
            console.error("[SummonManager] Attempted to add an invalid summon instance:", summonInstance);
            return false;
        }
        if (this.summons[summonInstance.id]) {
            console.warn(`[SummonManager] Summon with ID ${summonInstance.id} already exists. Overwriting is not allowed by default. Consider if this is intended.`);
            // Depending on requirements, you might want to throw an error, update, or ignore.
            // For now, we will simply not add it again if ID exists.
            return false;
        }
        this.summons[summonInstance.id] = summonInstance;
        console.log(`[SummonManager] Summon ${summonInstance.name} (ID: ${summonInstance.id}) added to manager.`);
        return true;
    }

    /**
     * Retrieves a summon instance by its ID.
     * @param {string} summonId - The ID of the summon to retrieve.
     * @returns {Summon|null} The summon instance or null if not found.
     */
    getSummonById(summonId) {
        return this.summons[summonId] || null;
    }

    /**
     * Retrieves all summon instances.
     * @returns {Object<string, Summon>} An object containing all summon instances, keyed by their ID.
     */
    getAllSummons() {
        return { ...this.summons }; // Return a shallow copy to prevent direct modification
    }

    /**
     * Retrieves all summon instances as an array.
     * @returns {Summon[]} An array of all summon instances.
     */
    getAllSummonsAsArray() {
        return Object.values(this.summons);
    }
    
    /**
     * Removes a summon instance by its ID.
     * @param {string} summonId - The ID of the summon to remove.
     * @returns {boolean} True if the summon was removed, false otherwise.
     */
    removeSummon(summonId) {
        if (this.summons[summonId]) {
            delete this.summons[summonId];
            console.log(`[SummonManager] Summon with ID ${summonId} removed.`);
            return true;
        }
        console.warn(`[SummonManager] Summon with ID ${summonId} not found for removal.`);
        return false;
    }

    /**
     * Clears all summons from the manager.
     */
    clearAllSummons() {
        this.summons = {};
        console.log("[SummonManager] All summons cleared.");
    }
}

// Export a singleton instance of the manager
const summonManagerInstance = new SummonManager();
export default summonManagerInstance; 