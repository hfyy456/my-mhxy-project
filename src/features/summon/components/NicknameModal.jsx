/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-19 03:52:36
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-19 04:20:10
 */
import React, { useState } from "react";
import CommonModal from "@/features/ui/components/CommonModal";

const NicknameModal = ({ isOpen, onClose, onConfirm, petName }) => {
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
      <div className="mb-4">
        <p className="text-gray-300 mb-2">为你的{petName}起一个昵称吧！</p>
        <input
          type="text"
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            setError("");
          }}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          placeholder="请输入昵称（不超过12个字符）"
          maxLength={12}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
        >
          确定
        </button>
      </div>
    </CommonModal>
  );
};

export default NicknameModal; 