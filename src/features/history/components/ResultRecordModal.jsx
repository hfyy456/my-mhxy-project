/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 01:44:08
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-17 02:19:03
 */
import React from "react";
import CommonModal from "@/features/ui/components/CommonModal";

const ResultRecordModal = ({ resultRecordList, isOpen, onClose }) => {
  return (
    <CommonModal isOpen={isOpen} onClose={onClose} title="结果记录">
      <div id="resultRecordContent" className="space-y-2 text-gray-300">
        {resultRecordList.length === 0 ? (
          <p className="text-gray-400 italic text-center py-8">暂无结果记录。</p>
        ) : (
          resultRecordList.map((record, index) => (
            <p key={record.id || index} className="py-2 px-1 border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50 rounded transition-colors duration-150">
              {record}
            </p>
          ))
        )}
      </div>
    </CommonModal>
  );
};

export default ResultRecordModal; 