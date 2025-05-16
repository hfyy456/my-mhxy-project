import React, { useState } from 'react';
import { useToast } from './hooks/useToast';

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