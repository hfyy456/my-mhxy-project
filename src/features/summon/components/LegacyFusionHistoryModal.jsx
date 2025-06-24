/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-05 02:55:37
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-24 07:08:25
 */
/**
 * 召唤兽合成历史模态框
 * 显示历史合成记录和统计信息
 */

import React from 'react';
import CommonModal from '@/features/ui/components/CommonModal';
import HistoryModal from './HistoryModal';

const FusionHistoryModal = ({ isOpen, onClose, historyList }) => {
  return (
    <CommonModal isOpen={isOpen} onClose={onClose} title="融合历史记录">
      <div className="max-h-[60vh] overflow-y-auto p-1">
        <HistoryModal historyList={historyList} />
      </div>
    </CommonModal>
  );
};

export default FusionHistoryModal; 