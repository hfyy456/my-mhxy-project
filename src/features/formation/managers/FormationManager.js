/**
 * FormationManager - 多阵型管理器
 * 负责管理多个阵型，提供CRUD操作，支持持久化存储
 */

import { Formation } from '../models/Formation.js';
import { generateUniqueId } from '@/utils/idUtils';

export class FormationManager {
  constructor() {
    this.formations = new Map(); // 存储所有阵型 Map<id, Formation>
    this.currentFormationId = null; // 当前选中的阵型ID
    this.maxFormations = 10; // 最大阵型数量
    this.storageKey = 'formation_manager_data'; // localStorage键名
    
    // 初始化时加载数据
    this.loadFromStorage();
    
    // 如果没有任何阵型，创建默认阵型
    if (this.formations.size === 0) {
      this.createDefaultFormation();
    }
  }

  /**
   * 创建新阵型
   * @param {string} name - 阵型名称
   * @param {Object} options - 可选参数
   * @returns {string|null} 新阵型的ID，如果失败返回null
   */
  createFormation(name = '新阵型', options = {}) {
    // 检查数量限制
    if (this.formations.size >= this.maxFormations) {
      console.warn(`阵型数量已达到上限 (${this.maxFormations})`);
      return null;
    }

    // 检查名称重复
    if (this.isNameExists(name)) {
      name = this.generateUniqueName(name);
    }

    const formation = new Formation({
      name,
      ...options
    });

    this.formations.set(formation.id, formation);
    
    // 如果这是第一个阵型，设为当前阵型
    if (this.currentFormationId === null) {
      this.currentFormationId = formation.id;
    }

    this.saveToStorage();
    return formation.id;
  }

  /**
   * 删除阵型
   * @param {string} formationId - 阵型ID
   * @returns {boolean} 删除是否成功
   */
  deleteFormation(formationId) {
    if (!this.formations.has(formationId)) {
      return false;
    }

    // 不能删除最后一个阵型
    if (this.formations.size <= 1) {
      console.warn('不能删除最后一个阵型');
      return false;
    }

    this.formations.delete(formationId);

    // 如果删除的是当前阵型，切换到第一个可用阵型
    if (this.currentFormationId === formationId) {
      const firstFormationId = this.formations.keys().next().value;
      this.currentFormationId = firstFormationId || null;
    }

    this.saveToStorage();
    return true;
  }

  /**
   * 获取阵型
   * @param {string} formationId - 阵型ID
   * @returns {Formation|null} 阵型实例
   */
  getFormation(formationId) {
    return this.formations.get(formationId) || null;
  }

  /**
   * 获取当前阵型
   * @returns {Formation|null} 当前阵型实例
   */
  getCurrentFormation() {
    if (!this.currentFormationId) {
      return null;
    }
    return this.getFormation(this.currentFormationId);
  }

  /**
   * 设置当前阵型
   * @param {string} formationId - 阵型ID
   * @returns {boolean} 设置是否成功
   */
  setCurrentFormation(formationId) {
    if (!this.formations.has(formationId)) {
      return false;
    }
    
    this.currentFormationId = formationId;
    this.saveToStorage();
    return true;
  }

  /**
   * 获取所有阵型列表
   * @returns {Array<Formation>} 阵型列表
   */
  getAllFormations() {
    return Array.from(this.formations.values());
  }

  /**
   * 获取阵型信息摘要
   * @returns {Array<Object>} 阵型摘要列表
   */
  getFormationSummaries() {
    return this.getAllFormations().map(formation => ({
      id: formation.id,
      name: formation.name,
      summonCount: formation.getSummonCount(),
      isEmpty: formation.isEmpty(),
      createdAt: formation.createdAt,
      updatedAt: formation.updatedAt,
      description: formation.description,
      isCurrent: formation.id === this.currentFormationId
    }));
  }

  /**
   * 重命名阵型
   * @param {string} formationId - 阵型ID
   * @param {string} newName - 新名称
   * @returns {boolean} 重命名是否成功
   */
  renameFormation(formationId, newName) {
    const formation = this.getFormation(formationId);
    if (!formation) {
      return false;
    }

    // 检查名称重复（排除自身）
    if (this.isNameExists(newName, formationId)) {
      console.warn(`阵型名称 "${newName}" 已存在`);
      return false;
    }

    formation.update({ name: newName });
    this.saveToStorage();
    return true;
  }

  /**
   * 复制阵型
   * @param {string} formationId - 要复制的阵型ID
   * @param {string} newName - 新阵型名称
   * @returns {string|null} 新阵型ID，失败返回null
   */
  duplicateFormation(formationId, newName = null) {
    const sourceFormation = this.getFormation(formationId);
    if (!sourceFormation) {
      return null;
    }

    // 检查数量限制
    if (this.formations.size >= this.maxFormations) {
      console.warn(`阵型数量已达到上限 (${this.maxFormations})`);
      return null;
    }

    // 生成新名称
    if (!newName) {
      newName = `${sourceFormation.name} 副本`;
    }
    if (this.isNameExists(newName)) {
      newName = this.generateUniqueName(newName);
    }

    const newFormation = sourceFormation.clone(newName);
    this.formations.set(newFormation.id, newFormation);
    this.saveToStorage();
    return newFormation.id;
  }

  /**
   * 更新阵型中的召唤兽位置
   * @param {string} formationId - 阵型ID
   * @param {number} row - 行索引
   * @param {number} col - 列索引
   * @param {string|null} summonId - 召唤兽ID
   * @returns {boolean} 更新是否成功
   */
  setSummonInFormation(formationId, row, col, summonId) {
    const formation = this.getFormation(formationId);
    if (!formation) {
      return false;
    }

    const success = formation.setSummonAt(row, col, summonId);
    if (success) {
      this.saveToStorage();
    }
    return success;
  }

  /**
   * 更新当前阵型中的召唤兽位置
   * @param {number} row - 行索引
   * @param {number} col - 列索引
   * @param {string|null} summonId - 召唤兽ID
   * @returns {boolean} 更新是否成功
   */
  setCurrentSummon(row, col, summonId) {
    if (!this.currentFormationId) {
      return false;
    }
    return this.setSummonInFormation(this.currentFormationId, row, col, summonId);
  }

  /**
   * 获取当前阵型的网格数据（用于战斗系统）
   * @returns {Array<Array>|null} 阵型网格或null
   */
  getCurrentFormationGrid() {
    const formation = this.getCurrentFormation();
    return formation ? formation.grid : null;
  }

  /**
   * 获取当前阵型的召唤兽ID列表
   * @returns {Array<string>} 召唤兽ID数组
   */
  getCurrentSummonIds() {
    const formation = this.getCurrentFormation();
    return formation ? formation.getAllSummonIds() : [];
  }

  /**
   * 检查当前阵型是否有效（非空）
   * @returns {boolean} 是否有效
   */
  isCurrentFormationValid() {
    const formation = this.getCurrentFormation();
    if (!formation) {
      return false;
    }
    return !formation.isEmpty();
  }

  /**
   * 获取当前阵型分析
   * @param {Array} allSummons - 所有召唤兽实例数组
   * @returns {Object|null} 阵型分析结果
   */
  getCurrentFormationAnalysis(allSummons = []) {
    const formation = this.getCurrentFormation();
    if (!formation) {
      return null;
    }

    const positionAnalysis = formation.getPositionAnalysis();
    const summonIds = formation.getAllSummonIds();
    
    // 计算战力（需要召唤兽数据）
    let totalPower = 0;
    if (allSummons && allSummons.length > 0) {
      summonIds.forEach(summonId => {
        const summon = allSummons.find(s => s.id === summonId);
        if (summon) {
          totalPower += summon.power || 0;
        }
      });
    }

    return {
      formationId: formation.id,
      formationName: formation.name,
      totalSummons: formation.getSummonCount(),
      maxSummons: 5,
      isEmpty: formation.isEmpty(),
      isFull: formation.isFull(),
      totalPower,
      averagePower: formation.getSummonCount() > 0 ? Math.round(totalPower / formation.getSummonCount()) : 0,
      positionAnalysis
    };
  }

  /**
   * 清空指定阵型
   * @param {string} formationId - 阵型ID
   * @returns {boolean} 清空是否成功
   */
  clearFormation(formationId) {
    const formation = this.getFormation(formationId);
    if (!formation) {
      return false;
    }

    formation.clear();
    this.saveToStorage();
    return true;
  }

  /**
   * 导出阵型数据
   * @param {string} formationId - 阵型ID
   * @returns {Object|null} 阵型数据
   */
  exportFormation(formationId) {
    const formation = this.getFormation(formationId);
    return formation ? formation.toJSON() : null;
  }

  /**
   * 导入阵型数据
   * @param {Object} formationData - 阵型数据
   * @returns {string|null} 导入的阵型ID，失败返回null
   */
  importFormation(formationData) {
    try {
      // 检查数量限制
      if (this.formations.size >= this.maxFormations) {
        console.warn(`阵型数量已达到上限 (${this.maxFormations})`);
        return null;
      }

      // 生成新ID避免冲突
      const newData = { ...formationData };
      newData.id = generateUniqueId('formation');
      
      // 确保名称唯一
      if (this.isNameExists(newData.name)) {
        newData.name = this.generateUniqueName(newData.name);
      }

      const formation = Formation.fromJSON(newData);
      this.formations.set(formation.id, formation);
      this.saveToStorage();
      return formation.id;
    } catch (error) {
      console.error('导入阵型失败:', error);
      return null;
    }
  }

  // 持久化存储方法

  /**
   * 保存到localStorage
   */
  saveToStorage() {
    try {
      const data = {
        formations: Object.fromEntries(
          Array.from(this.formations.entries()).map(([id, formation]) => [id, formation.toJSON()])
        ),
        currentFormationId: this.currentFormationId,
        version: '1.0.0'
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('保存阵型数据到localStorage失败:', error);
    }
  }

  /**
   * 从localStorage加载
   */
  loadFromStorage() {
    try {
      const dataStr = localStorage.getItem(this.storageKey);
      if (!dataStr) {
        return;
      }

      const data = JSON.parse(dataStr);
      this.formations.clear();

      // 加载阵型数据
      if (data.formations) {
        Object.entries(data.formations).forEach(([id, formationData]) => {
          const formation = Formation.fromJSON(formationData);
          this.formations.set(id, formation);
        });
      }

      // 恢复当前阵型ID
      this.currentFormationId = data.currentFormationId;
      
      // 验证当前阵型ID是否仍然有效
      if (this.currentFormationId && !this.formations.has(this.currentFormationId)) {
        this.currentFormationId = null;
      }

    } catch (error) {
      console.error('从localStorage加载阵型数据失败:', error);
      this.formations.clear();
      this.currentFormationId = null;
    }
  }

  /**
   * 清空所有数据
   */
  reset() {
    this.formations.clear();
    this.currentFormationId = null;
    localStorage.removeItem(this.storageKey);
    this.createDefaultFormation();
  }

  // 工具方法

  /**
   * 创建默认阵型
   * @private
   */
  createDefaultFormation() {
    const defaultId = this.createFormation('默认阵型', {
      description: '系统默认阵型'
    });
    this.currentFormationId = defaultId;
  }

  /**
   * 检查名称是否已存在
   * @private
   */
  isNameExists(name, excludeId = null) {
    return Array.from(this.formations.values()).some(
      formation => formation.name === name && formation.id !== excludeId
    );
  }

  /**
   * 生成唯一名称
   * @private
   */
  generateUniqueName(baseName) {
    let counter = 1;
    let newName = `${baseName} (${counter})`;
    
    while (this.isNameExists(newName)) {
      counter++;
      newName = `${baseName} (${counter})`;
    }
    
    return newName;
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const formations = this.getAllFormations();
    return {
      totalFormations: formations.length,
      maxFormations: this.maxFormations,
      currentFormationId: this.currentFormationId,
      emptyFormations: formations.filter(f => f.isEmpty()).length,
      fullFormations: formations.filter(f => f.isFull()).length
    };
  }
}

// 创建单例实例
export const formationManager = new FormationManager(); 