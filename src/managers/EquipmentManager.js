/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 04:59:52
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-17 05:07:06
 */
import EquipmentEntity from '../entities/EquipmentEntity';

class EquipmentManager {
  constructor() {
    if (EquipmentManager.instance) {
      return EquipmentManager.instance;
    }
    this.equipmentRegistry = new Map();
    EquipmentManager.instance = this;
  }

  /**
   * Registers an equipment instance.
   * If the equipment already has an ID and is registered, it might update it or throw an error.
   * For simplicity, we'll assume new equipment is registered.
   * @param {EquipmentEntity} equipmentInstance - The equipment instance to register.
   * @returns {string} The ID of the registered equipment.
   */
  registerEquipment(equipmentInstance) {
    if (!(equipmentInstance instanceof EquipmentEntity)) {
      console.error("Invalid object passed to registerEquipment. Expected EquipmentEntity instance.", equipmentInstance);
      throw new Error("Invalid object type: Expected EquipmentEntity.");
    }
    if (!equipmentInstance.id) {
      console.error("Equipment instance must have an ID to be registered.", equipmentInstance);
      throw new Error("Equipment instance is missing an ID.");
    }
    if (this.equipmentRegistry.has(equipmentInstance.id)) {
      // console.warn(`Equipment with ID ${equipmentInstance.id} already registered. Overwriting.`);
      // Or, if IDs are globally unique and pre-generated, this might be an error.
      // For now, let's allow re-registration / update.
    }
    this.equipmentRegistry.set(equipmentInstance.id, equipmentInstance);
    return equipmentInstance.id;
  }

  /**
   * Retrieves an equipment instance by its ID.
   * @param {string} id - The ID of the equipment to retrieve.
   * @returns {EquipmentEntity | undefined} The equipment instance, or undefined if not found.
   */
  getEquipmentById(id) {
    if (!id) {
      console.warn("Attempted to get equipment with null or undefined ID.");
      return undefined;
    }
    return this.equipmentRegistry.get(id);
  }

  /**
   * Removes an equipment instance from the registry.
   * @param {string} id - The ID of the equipment to remove.
   * @returns {boolean} True if the equipment was removed, false otherwise.
   */
  removeEquipment(id) {
    return this.equipmentRegistry.delete(id);
  }

  // getAllEquipment() {
  //   return Array.from(this.equipmentRegistry.values());
  // }

  // For debugging or specific use cases
  hasEquipment(id) {
    return this.equipmentRegistry.has(id);
  }
}

// Export a singleton instance
const instance = new EquipmentManager();
export default instance; 