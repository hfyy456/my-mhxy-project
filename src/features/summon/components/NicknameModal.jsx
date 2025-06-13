/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-19 03:52:36
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-19 04:20:10
 */
import React, { useState } from "react";
import CommonModal from "@/features/ui/components/CommonModal";

const NicknameModal = ({ isOpen, onClose, onConfirm, summonName }) => {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!nickname.trim()) {
      setError("请输入昵称");
      return;
    }
    if (nickname.length > 12) {
      setError("昵称不能超过12个字符");
      return;
    }
    onConfirm(nickname.trim());
    onClose();
  };

  return (
    <CommonModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="设置召唤兽昵称"
      className="w-[320px]"
    >
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-theme-primary rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-theme-light">设置昵称</h3>
            <button
              onClick={onClose}
              className="text-theme-secondary hover:text-theme-light"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="mb-6">
            <label htmlFor="nickname" className="block text-sm font-medium text-theme-secondary mb-2">
              请输入新的昵称
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError("");
              }}
              className="w-full px-3 py-2 bg-theme-secondary border border-theme-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent text-theme-light"
              placeholder="请输入昵称"
              maxLength={10}
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-theme-secondary hover:bg-theme-light text-theme-light rounded"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!nickname.trim()}
              className={`px-4 py-2 rounded ${
                nickname.trim()
                  ? "bg-theme-primary hover:bg-theme-primary-light text-white"
                  : "bg-theme-secondary text-theme-secondary cursor-not-allowed"
              }`}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </CommonModal>
  );
};

export default NicknameModal; 