/*
 * @Author: Cascade AI
 * @Date: 2025-05-29
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-29 02:40:16
 * @Description: BUFF状态检查器，用于检测BUFF是否生效
 */

/**
 * 检查BUFF是否生效
 * @param {Object} buff - BUFF对象
 * @returns {boolean} - 如果BUFF生效返回true，否则返回false
 */
export const isBuffActive = (buff) => {
  if (!buff) {
    return false;
  }
  
  // 如果isActive属性未定义或为true，则认为是生效的
  return buff.isActive !== false;
};

/**
 * 检查单位是否有特定ID的BUFF，并且该BUFF处于生效状态
 * @param {Object} unit - 战斗单位
 * @param {string} buffId - BUFF ID
 * @returns {boolean} - 如果有该BUFF且生效，返回true，否则返回false
 */
export const hasActiveBuff = (unit, buffId) => {
  if (!unit || !unit.statusEffects || unit.statusEffects.length === 0) {
    return false;
  }
  
  const buff = unit.statusEffects.find(effect => effect.buffId === buffId);
  return buff ? isBuffActive(buff) : false;
};

/**
 * 设置BUFF的生效状态
 * @param {Object} unit - 战斗单位
 * @param {string} buffId - BUFF ID
 * @param {boolean} isActive - 是否生效
 * @returns {Object} - 包含设置结果的对象 { success, message, buff }
 */
export const setBuffActiveState = (unit, buffId, isActive) => {
  if (!unit || !unit.statusEffects) {
    return { success: false, message: '单位不存在或没有状态效果' };
  }
  
  const buffIndex = unit.statusEffects.findIndex(effect => effect.buffId === buffId);
  
  if (buffIndex === -1) {
    return { success: false, message: `单位没有ID为 ${buffId} 的BUFF` };
  }
  
  const buff = unit.statusEffects[buffIndex];
  const oldState = buff.isActive !== false;
  
  // 如果状态没有变化，直接返回
  if (oldState === isActive) {
    return { 
      success: true, 
      message: `BUFF "${buffId}" 的状态没有变化，仍然${isActive ? '生效中' : '未生效'}`,
      buff
    };
  }
  
  // 设置新状态
  buff.isActive = isActive;
  
  return { 
    success: true, 
    message: `BUFF "${buffId}" 现在${isActive ? '生效' : '失效'}`,
    buff
  };
};

/**
 * 获取单位所有生效中的BUFF
 * @param {Object} unit - 战斗单位
 * @returns {Array} - 生效中的BUFF数组
 */
export const getActiveBuffs = (unit) => {
  if (!unit || !unit.statusEffects) {
    return [];
  }
  
  return unit.statusEffects.filter(buff => isBuffActive(buff));
};

/**
 * 获取单位所有未生效的BUFF
 * @param {Object} unit - 战斗单位
 * @returns {Array} - 未生效的BUFF数组
 */
export const getInactiveBuffs = (unit) => {
  if (!unit || !unit.statusEffects) {
    return [];
  }
  
  return unit.statusEffects.filter(buff => !isBuffActive(buff));
};

/**
 * 切换BUFF的生效状态
 * @param {Object} unit - 战斗单位
 * @param {string} buffId - BUFF ID
 * @returns {Object} - 包含切换结果的对象 { success, message, buff, newState }
 */
export const toggleBuffActiveState = (unit, buffId) => {
  if (!unit || !unit.statusEffects) {
    return { success: false, message: '单位不存在或没有状态效果' };
  }
  
  const buffIndex = unit.statusEffects.findIndex(effect => effect.buffId === buffId);
  
  if (buffIndex === -1) {
    return { success: false, message: `单位没有ID为 ${buffId} 的BUFF` };
  }
  
  const buff = unit.statusEffects[buffIndex];
  const oldState = buff.isActive !== false;
  const newState = !oldState;
  
  // 设置新状态
  buff.isActive = newState;
  
  return { 
    success: true, 
    message: `BUFF "${buffId}" 的状态已从${oldState ? '生效' : '失效'}切换为${newState ? '生效' : '失效'}`,
    buff,
    newState
  };
};
