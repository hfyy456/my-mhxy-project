/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-21 04:48:39
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-21 05:01:28
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  equipItemToSummon,
  unequipItemFromSummon,
  recalculateSummonStats,
  selectSummonById,
  removeItemFromAllSummons,
  selectAllSummons
} from '../slices/summonSlice';
import {
  removeItemByItemId as removeItemFromInventory,
  addToInventory
} from '../slices/inventorySlice';
import { removeItem as removeItemFromItemSlice } from '../slices/itemSlice';

export const manageEquipItemThunk = createAsyncThunk(
  'equipment/equipItem',
  async ({ summonId, itemIdToEquip, slotType }, { dispatch, getState, rejectWithValue }) => {
    try {
      const summon = selectSummonById(getState(), summonId);
      if (!summon) {
        return rejectWithValue(`Summon ${summonId} not found for equipping.`);
      }

      const oldItemId = summon.equippedItemIds ? summon.equippedItemIds[slotType] : null;

      dispatch(equipItemToSummon({ summonId, itemId: itemIdToEquip, slotType }));

      await dispatch(recalculateSummonStats({ summonId }));
      return { summonId, equippedItem: itemIdToEquip, unequippedItem: oldItemId };
    } catch (error) {
      console.error('manageEquipItemThunk failed:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const manageUnequipItemThunk = createAsyncThunk(
  'equipment/unequipItem',
  async ({ summonId, slotType }, { dispatch, getState, rejectWithValue }) => {
    try {
      const summon = selectSummonById(getState(), summonId);
      const itemIdToUnequip = summon?.equippedItemIds?.[slotType];

      if (!itemIdToUnequip) {
        return rejectWithValue(`No item to unequip in slot ${slotType} for summon ${summonId}, or summon not found.`);
      }

      dispatch(unequipItemFromSummon({ summonId, itemId: itemIdToUnequip, slotType }));

      await dispatch(recalculateSummonStats({ summonId }));
      return { summonId, unequippedItem: itemIdToUnequip };
    } catch (error) {
      console.error('manageUnequipItemThunk failed:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const deleteItemThunk = createAsyncThunk(
  'items/deleteItem',
  async (itemIdToDelete, { dispatch, getState, rejectWithValue }) => {
    try {
      const summonsState = getState().summons;
      const affectedSummonIds = [];
      if (summonsState && summonsState.allSummons) {
        for (const summonId in summonsState.allSummons) {
          const summon = summonsState.allSummons[summonId];
          if (summon.equippedItemIds) {
            for (const slotType in summon.equippedItemIds) {
              if (summon.equippedItemIds[slotType] === itemIdToDelete) {
                if (!affectedSummonIds.includes(summonId)) {
                  affectedSummonIds.push(summonId);
                }
              }
            }
          }
        }
      }

      // 从所有召唤兽身上移除该物品的引用
      dispatch(removeItemFromAllSummons(itemIdToDelete));

      // 为受影响的召唤兽重新计算属性
      if (affectedSummonIds.length > 0) {
        await Promise.all(affectedSummonIds.map(id => dispatch(recalculateSummonStats({ summonId: id }))));
      }

      // 从背包槽位中移除该物品
      dispatch(removeItemFromInventory(itemIdToDelete));
      // 从主物品列表中移除该物品
      dispatch(removeItemFromItemSlice(itemIdToDelete));

      return { deletedItemId: itemIdToDelete };
    } catch (error) {
      console.error(`deleteItemThunk for ${itemIdToDelete} failed:`, error);
      return rejectWithValue(error.message);
    }
  }
); 