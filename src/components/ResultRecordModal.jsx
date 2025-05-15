import React from "react";
import CommonModal from "./CommonModal";

const ResultRecordModal = ({ resultRecordList, isOpen, onClose }) => {
  return (
    <CommonModal isOpen={isOpen} onClose={onClose} title="结果记录">
      <div id="resultRecordContent" className="space-y-4">
        {resultRecordList.length === 0 ? (
          <p className="text-gray-500 italic">暂无结果记录。</p>
        ) : (
          resultRecordList.map((record, index) => (
            <p key={record.id || index}>{record}</p>
          ))
        )}
      </div>
    </CommonModal>
  );
};

export default ResultRecordModal;
