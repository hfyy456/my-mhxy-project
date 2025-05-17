/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 02:57:02
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-17 02:59:07
 */
import { useSelector } from 'react-redux';
// import GameManager from '@/game/GameManager'; // Removed GameManager
import { selectCurrentSummonFullData, selectRefinementHistory } from '@/store/slices/summonSlice'; // Assuming history is in summonSlice
// 如果 resultRecordList 需要保留, 则需要相应的 slice 和 selector
// import { selectResultRecords } from '@/store/slices/resultRecordSlice'; 

export const useGameState = () => {
  // const [gameManager] = useState(() => new GameManager()); // Removed
  // const [summon, setSummon] = useState(() => gameManager.getCurrentSummon()); // Replaced by selector
  // const [summonVersion, setSummonVersion] = useState(0); // No longer needed
  // const [historyList, setHistoryList] = useState(() => gameManager.getHistoryList()); // Replaced by selector
  // const [resultRecordList, setResultRecordList] = useState(() => gameManager.getResultRecordList()); // Temporarily removed or to be handled by Redux

  const currentSummon = useSelector(selectCurrentSummonFullData);
  const historyList = useSelector(selectRefinementHistory); // Assuming this selector exists
  // const resultRecordList = useSelector(selectResultRecords); // If feature is kept

  // useEffect(() => {
    // gameManager.on("summonUpdated", (newSummon) => {
      // setSummon(newSummon);
      // setSummonVersion(prevVersion => prevVersion + 1);
      // console.log("[useGameState] summonUpdated event. New summon instance:", newSummon);
    // });

    // gameManager.on("historyUpdated", (newHistory) => {
      // setHistoryList(newHistory);
    // });

    // gameManager.on("resultRecordUpdated", (newRecords) => {
      // setResultRecordList(newRecords);
    // });

    // return () => {
      // gameManager.removeAllListeners();
    // };
  // }, [gameManager]); // Removed GameManager dependency

  return {
    // gameManager, // Removed
    summon: currentSummon, // Renamed for compatibility with components expecting 'summon'
    // setSummon, // Removed, state managed by Redux
    historyList,
    // resultRecordList, // Temporarily removed
  };
}; 