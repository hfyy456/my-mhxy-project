/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-15 03:09:48
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-15 03:26:48
 */
import { createContext } from 'react';

/**
 * @description V3 战斗系统的 React Context
 * 
 * 这个 Context 用于在 React 组件树中传递 XState 战斗状态机的服务实例。
 * Provider 将提供状态机服务，而消费者（通过 Hook）可以访问它。
 */
export const BattleContextV3 = createContext(null); 