import React from 'react';

const ResultRecordModal = ({ resultRecordList, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 opacity-100 pointer-events-auto transition-opacity duration-300">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto transform scale-100 transition-transform duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-dark">结果记录</h3>
          <button className="text-gray-500 hover:text-gray-700 transition-colors" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        <div id="resultRecordContent" className="space-y-4">
          {resultRecordList.length === 0 ? (
            <p className="text-gray-500 italic">暂无结果记录。</p>
          ) : (
            resultRecordList.map((record, index) => (
              <p key={index}>{record}</p>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultRecordModal;