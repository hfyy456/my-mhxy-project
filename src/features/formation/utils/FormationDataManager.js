/**
 * FormationDataManager - 阵型数据管理类
 * 负责处理阵型相关的数据逻辑和业务规则
 * 遵循面向对象编程和数据逻辑分离原则
 */

import { FORMATION_ROWS, FORMATION_COLS } from '@/config/config';
import { summonConfig } from '@/config/summon/summonConfig';

export class FormationDataManager {
  constructor() {
    this.maxSummonsInFormation = 5;
  }

  /**
   * 检查召唤兽是否在阵型网格中
   * @param {Array<Array>} formationGrid - 阵型网格
   * @param {string} summonId - 召唤兽ID
   * @returns {boolean}
   */
  isSummonInGrid(formationGrid, summonId) {
    if (!formationGrid || !summonId) return false;
    
    for (const row of formationGrid) {
      if (row.includes(summonId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 计算阵型中召唤兽的总数
   * @param {Array<Array>} formationGrid - 阵型网格
   * @returns {number}
   */
  getTotalSummonsInFormation(formationGrid) {
    if (!formationGrid) return 0;
    
    let count = 0;
    formationGrid.forEach(row => {
      row.forEach(summonId => {
        if (summonId !== null) {
          count++;
        }
      });
    });
    return count;
  }

  /**
   * 获取召唤兽在网格中的位置
   * @param {Array<Array>} formationGrid - 阵型网格
   * @param {string} summonId - 召唤兽ID
   * @returns {Object|null} {row, col} 或 null
   */
  getSummonPosition(formationGrid, summonId) {
    if (!formationGrid || !summonId) return null;
    
    for (let row = 0; row < formationGrid.length; row++) {
      for (let col = 0; col < formationGrid[row].length; col++) {
        if (formationGrid[row][col] === summonId) {
          return { row, col };
        }
      }
    }
    return null;
  }

  /**
   * 验证是否可以放置召唤兽到指定位置
   * @param {Array<Array>} formationGrid - 阵型网格
   * @param {string} summonId - 召唤兽ID
   * @param {number} targetRow - 目标行
   * @param {number} targetCol - 目标列
   * @param {string} sourceType - 来源类型 ('list' 或 'grid')
   * @returns {Object} {canPlace: boolean, reason?: string}
   */
  validateSummonPlacement(formationGrid, summonId, targetRow, targetCol, sourceType) {
    // 检查位置是否有效
    if (targetRow < 0 || targetRow >= FORMATION_ROWS || 
        targetCol < 0 || targetCol >= FORMATION_COLS) {
      return { canPlace: false, reason: '位置无效' };
    }

    const currentTotal = this.getTotalSummonsInFormation(formationGrid);
    const isAlreadyInGrid = this.isSummonInGrid(formationGrid, summonId);
    const targetSlotOccupied = formationGrid[targetRow][targetCol] !== null;

    // 如果从列表拖拽，且召唤兽不在网格中，且目标位置为空，检查是否超出最大数量
    if (sourceType === 'list' && !isAlreadyInGrid && !targetSlotOccupied) {
      if (currentTotal >= this.maxSummonsInFormation) {
        return { canPlace: false, reason: '阵型已满，无法添加更多召唤兽' };
      }
    }

    return { canPlace: true };
  }

  /**
   * 获取召唤兽显示信息
   * @param {string} summonId - 召唤兽ID
   * @param {Array} allSummons - 所有召唤兽实例数组
   * @returns {Object} 显示信息对象
   */
  getSummonDisplayInfo(summonId, allSummons) {
    if (!summonId) {
      return { 
        name: '空', 
        id: null, 
        level: null, 
        power: 0,
        quality: null,
        derivedAttributes: null
      };
    }
    
    // 查找召唤兽实例
    const summonInstance = allSummons.find(s => s.id === summonId);
    if (!summonInstance) {
      return { 
        name: '未知召唤兽', 
        id: summonId, 
        level: 'N/A', 
        power: 0,
        quality: null,
        derivedAttributes: null
      };
    }
    
    // 使用召唤兽实例的方法获取配置信息
    const basePetInfo = summonInstance.getConfig();
    
    return {
      id: summonInstance.id,
      name: summonInstance.nickname || basePetInfo?.name || '召唤兽',
      level: summonInstance.level,
      power: summonInstance.power || 0,
      quality: summonInstance.quality,
      derivedAttributes: summonInstance.derivedAttributes,
      instance: summonInstance // 保留实例引用用于更多操作
    };
  }

  /**
   * 计算阵型战力
   * @param {Array<Array>} formationGrid - 阵型网格
   * @param {Array} allSummons - 所有召唤兽实例数组
   * @returns {number} 总战力
   */
  calculateFormationPower(formationGrid, allSummons) {
    let totalPower = 0;
    
    if (!formationGrid || !allSummons) return totalPower;
    
    formationGrid.forEach(row => {
      row.forEach(summonId => {
        if (summonId) {
          const summonInfo = this.getSummonDisplayInfo(summonId, allSummons);
          totalPower += summonInfo.power || 0;
        }
      });
    });
    
    return totalPower;
  }

  /**
   * 获取位置样式配置
   * @param {number} colIndex - 列索引
   * @returns {Object} 样式对象
   */
  getPositionStyle(colIndex) {
    const styles = {
      frontRowCell: {
        backgroundColor: '#4a5568',
        borderColor: '#a0aec0',
      },
      midRowCell: {
        backgroundColor: '#38a169',
        borderColor: '#9ae6b4',
      },
      backRowCell: {
        backgroundColor: '#3182ce',
        borderColor: '#90cdf4',
      }
    };

    if (FORMATION_COLS === 3) {
      if (colIndex === 2) return styles.frontRowCell; // 前排
      if (colIndex === 1) return styles.midRowCell;   // 中排
      if (colIndex === 0) return styles.backRowCell;  // 后排
    }

    return {};
  }

  /**
   * 创建拖拽数据载荷
   * @param {string} itemType - 项目类型
   * @param {Object} summonData - 召唤兽数据
   * @param {number} fromRow - 来源行
   * @param {number} fromCol - 来源列
   * @returns {Object} 拖拽载荷
   */
  createDragPayload(itemType, summonData, fromRow = null, fromCol = null) {
    return {
      id: summonData.id,
      type: itemType,
      originalRow: fromRow,
      originalCol: fromCol,
      name: summonData.name,
      level: summonData.level,
      power: summonData.power
    };
  }

  /**
   * 分析阵型配置
   * @param {Array<Array>} formationGrid - 阵型网格
   * @param {Array} allSummons - 所有召唤兽实例数组
   * @returns {Object} 阵型分析结果
   */
  analyzeFormation(formationGrid, allSummons) {
    const totalPower = this.calculateFormationPower(formationGrid, allSummons);
    const totalSummons = this.getTotalSummonsInFormation(formationGrid);
    
    // 按位置分析召唤兽分布
    const positionAnalysis = {
      front: [], // 前排 (colIndex === 2)
      mid: [],   // 中排 (colIndex === 1)
      back: []   // 后排 (colIndex === 0)
    };

    if (formationGrid) {
      formationGrid.forEach((row, rowIndex) => {
        row.forEach((summonId, colIndex) => {
          if (summonId) {
            const summonInfo = this.getSummonDisplayInfo(summonId, allSummons);
            const positionData = {
              ...summonInfo,
              position: { row: rowIndex, col: colIndex }
            };

            if (colIndex === 2) positionAnalysis.front.push(positionData);
            else if (colIndex === 1) positionAnalysis.mid.push(positionData);
            else if (colIndex === 0) positionAnalysis.back.push(positionData);
          }
        });
      });
    }

    return {
      totalPower,
      totalSummons,
      maxSummons: this.maxSummonsInFormation,
      isEmpty: totalSummons === 0,
      isFull: totalSummons >= this.maxSummonsInFormation,
      positionAnalysis,
      averagePower: totalSummons > 0 ? Math.round(totalPower / totalSummons) : 0
    };
  }
}

// 创建单例实例
export const formationDataManager = new FormationDataManager();
export default formationDataManager; 