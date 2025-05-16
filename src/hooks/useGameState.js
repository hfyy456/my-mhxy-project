/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 02:57:02
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-17 02:59:07
 */
import { useState, useEffect } from 'react';
import GameManager from '../game/GameManager';

export const useGameState = () => {
  const [gameManager] = useState(() => new GameManager());
  const [summon, setSummon] = useState(() => gameManager.getCurrentSummon());
  const [summonVersion, setSummonVersion] = useState(0);
  const [historyList, setHistoryList] = useState(() => gameManager.getHistoryList());
  const [resultRecordList, setResultRecordList] = useState(() => gameManager.getResultRecordList());

  useEffect(() => {
    gameManager.on("summonUpdated", (newSummon) => {
      setSummon(newSummon);
      setSummonVersion(prevVersion => prevVersion + 1);
      console.log("[useGameState] summonUpdated event. New summon instance:", newSummon);
    });

    gameManager.on("historyUpdated", (newHistory) => {
      setHistoryList(newHistory);
    });

    gameManager.on("resultRecordUpdated", (newRecords) => {
      setResultRecordList(newRecords);
    });

    return () => {
      gameManager.removeAllListeners();
    };
  }, [gameManager]);

  return {
    gameManager,
    summon,
    setSummon,
    historyList,
    resultRecordList
  };
}; 