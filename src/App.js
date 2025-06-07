/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:47:53
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-07 03:17:00
 */
import React, { useState } from 'react';
import { useToast } from '@/hooks/useToast';

function App() {
  const [toasts, setToasts] = useState([]);
  const { showResult, addTestToast } = useToast(toasts, setToasts, gameManager);
  
  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer toasts={toasts} />
    </div>
  );
}

export default App; 
