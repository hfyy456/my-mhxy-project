import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAutoSaveEnabled } from '@/store/slices/saveSlice';
import { createNewSave } from '@/utils/saveManager';

const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5分钟

export const useAutoSave = () => {
  const autoSaveEnabled = useSelector(selectAutoSaveEnabled);

  useEffect(() => {
    if (!autoSaveEnabled) {
      return;
    }

    const autoSaveTimer = setInterval(() => {
      createNewSave('自动存档');
    }, AUTO_SAVE_INTERVAL);

    return () => {
      clearInterval(autoSaveTimer);
    };
  }, [autoSaveEnabled]);
}; 