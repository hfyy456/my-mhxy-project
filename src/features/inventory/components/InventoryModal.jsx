/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-03 04:49:24
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-24 07:35:37
 */
/**
 * 背包系统模态框
 * 主背包系统的模态框包装器
 */
import React from 'react';
import InventorySystem from './InventorySystem';
import CommonModal from '../../ui/components/CommonModal';

const InventoryModal = ({ isOpen, onClose }) => {
  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title="🎒 背包系统"
      maxWidthClass="max-w-7xl"
      fullScreen={true}
    >
      <InventorySystem />
    </CommonModal>
  );
};

export default InventoryModal; 