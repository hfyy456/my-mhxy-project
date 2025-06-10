/**
 * Formation - 阵型数据模型类
 * 负责单个阵型的数据管理和业务逻辑
 */

import { generateUniqueId } from '@/utils/idUtils';
import { FORMATION_ROWS, FORMATION_COLS } from '@/config/config';

export class Formation {
  constructor(options = {}) {
    this.id = options.id || generateUniqueId('formation');
    this.name = options.name || '新阵型';
    this.grid = options.grid || this._createEmptyGrid();
    this.createdAt = options.createdAt || Date.now();
    this.updatedAt = options.updatedAt || Date.now();
    this.description = options.description || '';
    this.tags = options.tags || [];
  }

  /**
   * 创建空阵型网格
   * @private
   */
  _createEmptyGrid() {
    return Array(FORMATION_ROWS).fill(null).map(() => Array(FORMATION_COLS).fill(null));
  }

  /**
   * 设置召唤兽到指定位置
   * @param {number} row - 行索引
   * @param {number} col - 列索引
   * @param {string|null} summonId - 召唤兽ID，null表示清空
   * @returns {boolean} 操作是否成功
   */
  setSummonAt(row, col, summonId) {
    if (!this._isValidPosition(row, col)) {
      return false;
    }

    // 如果要放置召唤兽，先清除该召唤兽在其他位置的存在
    if (summonId) {
      this._clearSummonFromGrid(summonId);
    }

    this.grid[row][col] = summonId;
    this.updatedAt = Date.now();
    return true;
  }

  /**
   * 获取指定位置的召唤兽ID
   * @param {number} row - 行索引
   * @param {number} col - 列索引
   * @returns {string|null} 召唤兽ID或null
   */
  getSummonAt(row, col) {
    if (!this._isValidPosition(row, col)) {
      return null;
    }
    return this.grid[row][col];
  }

  /**
   * 移除召唤兽
   * @param {string} summonId - 召唤兽ID
   * @returns {boolean} 是否找到并移除
   */
  removeSummon(summonId) {
    return this._clearSummonFromGrid(summonId);
  }

  /**
   * 获取召唤兽在阵型中的位置
   * @param {string} summonId - 召唤兽ID
   * @returns {Object|null} {row, col} 或 null
   */
  getSummonPosition(summonId) {
    for (let row = 0; row < FORMATION_ROWS; row++) {
      for (let col = 0; col < FORMATION_COLS; col++) {
        if (this.grid[row][col] === summonId) {
          return { row, col };
        }
      }
    }
    return null;
  }

  /**
   * 检查召唤兽是否在阵型中
   * @param {string} summonId - 召唤兽ID
   * @returns {boolean}
   */
  hasSummon(summonId) {
    return this.getSummonPosition(summonId) !== null;
  }

  /**
   * 获取阵型中所有召唤兽ID列表
   * @returns {Array<string>} 召唤兽ID数组
   */
  getAllSummonIds() {
    const summonIds = [];
    this.grid.forEach(row => {
      row.forEach(summonId => {
        if (summonId) {
          summonIds.push(summonId);
        }
      });
    });
    return summonIds;
  }

  /**
   * 获取阵型中召唤兽总数
   * @returns {number}
   */
  getSummonCount() {
    return this.getAllSummonIds().length;
  }

  /**
   * 检查阵型是否为空
   * @returns {boolean}
   */
  isEmpty() {
    return this.getSummonCount() === 0;
  }

  /**
   * 检查阵型是否已满
   * @param {number} maxSummons - 最大召唤兽数量，默认5
   * @returns {boolean}
   */
  isFull(maxSummons = 5) {
    return this.getSummonCount() >= maxSummons;
  }

  /**
   * 清空阵型
   */
  clear() {
    this.grid = this._createEmptyGrid();
    this.updatedAt = Date.now();
  }

  /**
   * 复制阵型
   * @param {string} newName - 新阵型名称
   * @returns {Formation} 新的阵型实例
   */
  clone(newName = null) {
    return new Formation({
      name: newName || `${this.name} 副本`,
      grid: this.grid.map(row => [...row]), // 深拷贝网格
      description: this.description,
      tags: [...this.tags]
    });
  }

  /**
   * 交换两个位置的召唤兽
   * @param {number} fromRow - 源行索引
   * @param {number} fromCol - 源列索引
   * @param {number} toRow - 目标行索引
   * @param {number} toCol - 目标列索引
   * @returns {boolean} 操作是否成功
   */
  swapSummons(fromRow, fromCol, toRow, toCol) {
    if (!this._isValidPosition(fromRow, fromCol) || !this._isValidPosition(toRow, toCol)) {
      return false;
    }

    const temp = this.grid[fromRow][fromCol];
    this.grid[fromRow][fromCol] = this.grid[toRow][toCol];
    this.grid[toRow][toCol] = temp;
    this.updatedAt = Date.now();
    return true;
  }

  /**
   * 获取按位置分类的召唤兽分析
   * @returns {Object} 位置分析结果
   */
  getPositionAnalysis() {
    const analysis = {
      front: [], // 前排 (col === 2)
      mid: [],   // 中排 (col === 1)
      back: []   // 后排 (col === 0)
    };

    this.grid.forEach((row, rowIndex) => {
      row.forEach((summonId, colIndex) => {
        if (summonId) {
          const positionData = {
            summonId,
            position: { row: rowIndex, col: colIndex }
          };

          if (colIndex === 2) analysis.front.push(positionData);
          else if (colIndex === 1) analysis.mid.push(positionData);
          else if (colIndex === 0) analysis.back.push(positionData);
        }
      });
    });

    return analysis;
  }

  /**
   * 验证阵型有效性
   * @param {Object} options - 验证选项
   * @returns {Object} {isValid: boolean, errors: Array<string>}
   */
  validate(options = {}) {
    const errors = [];
    const summonCount = this.getSummonCount();

    // 检查是否为空
    if (summonCount === 0) {
      errors.push('阵型中没有召唤兽');
    }

    // 检查最大数量限制
    const maxSummons = options.maxSummons || 5;
    if (summonCount > maxSummons) {
      errors.push(`召唤兽数量超过限制 (${summonCount}/${maxSummons})`);
    }

    // 检查重复召唤兽
    const summonIds = this.getAllSummonIds();
    const uniqueIds = new Set(summonIds);
    if (summonIds.length !== uniqueIds.size) {
      errors.push('阵型中存在重复的召唤兽');
    }

    // 检查名称
    if (!this.name || this.name.trim().length === 0) {
      errors.push('阵型名称不能为空');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 序列化为JSON
   * @returns {Object} 可序列化的对象
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      grid: this.grid,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      description: this.description,
      tags: this.tags
    };
  }

  /**
   * 从JSON数据创建Formation实例
   * @param {Object} data - JSON数据
   * @returns {Formation} Formation实例
   */
  static fromJSON(data) {
    return new Formation(data);
  }

  /**
   * 更新阵型信息
   * @param {Object} updates - 更新的字段
   */
  update(updates) {
    const allowedFields = ['name', 'description', 'tags'];
    allowedFields.forEach(field => {
      if (updates.hasOwnProperty(field)) {
        this[field] = updates[field];
      }
    });
    this.updatedAt = Date.now();
  }

  // 私有方法

  /**
   * 检查位置是否有效
   * @private
   */
  _isValidPosition(row, col) {
    return row >= 0 && row < FORMATION_ROWS && col >= 0 && col < FORMATION_COLS;
  }

  /**
   * 从网格中清除指定召唤兽
   * @private
   */
  _clearSummonFromGrid(summonId) {
    let found = false;
    for (let row = 0; row < FORMATION_ROWS; row++) {
      for (let col = 0; col < FORMATION_COLS; col++) {
        if (this.grid[row][col] === summonId) {
          this.grid[row][col] = null;
          found = true;
        }
      }
    }
    if (found) {
      this.updatedAt = Date.now();
    }
    return found;
  }
} 