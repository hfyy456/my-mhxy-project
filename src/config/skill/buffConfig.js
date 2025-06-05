/*
 * @Author: Cascade
 * @Date: 2025-05-24 02:46:07
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-06 07:28:20
 */

// 导入新的buff配置加载器
import {
  getAllBuffs,
  getBuffById,
  getBuffsByType,
  getBuffsByEffectType,
  getBuffsByElement,
  isBuffPermanent,
  isBuffStackable,
  createBuffInstance,
  buffConfig as loadedBuffConfig,
  BUFF_TYPES,
  BUFF_TARGET_TYPES,
  BUFF_EFFECT_TYPES,
  BUFF_APPLY_TYPES
} from '../buff/buffConfigLoader';

// 向后兼容：导出原有的枚举和配置
export {
  BUFF_TYPES,
  BUFF_TARGET_TYPES,
  BUFF_EFFECT_TYPES,
  BUFF_APPLY_TYPES,
  getAllBuffs,
  getBuffById,
  getBuffsByType,
  getBuffsByEffectType,
  getBuffsByElement,
  isBuffPermanent,
  isBuffStackable,
  createBuffInstance
};

// 向后兼容：导出原有的buffConfig数组
export const buffConfig = loadedBuffConfig;
