import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  selectActivePlayerQuests,
  selectCompletedPlayerQuests,
  selectPlayerQuests, // For the 'ALL' filter
  selectAllQuestDefinitions,
} from '@/store/slices/questSlice';
import { QUEST_STATUS, OBJECTIVE_TYPES } from '@/config/questConfig';
import { uiText } from '@/config/uiTextConfig'; // Import uiText
import CommonModal from '@/features/ui/components/CommonModal';

const FILTER_TYPES = {
  ACTIVE: 'ACTIVE',       // In progress or pending turn-in
  COMPLETED: 'COMPLETED',  // Turned in
  ALL: 'ALL',              // All player quests
};

// Helper to get status display text
const getQuestStatusText = (status) => {
  switch (status) {
    case QUEST_STATUS.COMPLETED_PENDING_TURN_IN: return uiText.questLog.statusPendingTurnIn;
    case QUEST_STATUS.IN_PROGRESS: return uiText.questLog.statusInProgress;
    case QUEST_STATUS.TURNED_IN: return uiText.questLog.statusTurnedIn;
    case QUEST_STATUS.AVAILABLE: return uiText.questLog.statusAvailable;
    default: return status; // Fallback to the status key itself if no specific text is found
  }
};

const QuestSection = ({ quests, allQuestDefs }) => { // Removed title prop as it's handled by filter context
  if (!quests || quests.length === 0) {
    return <p className="text-center text-gray-400 py-4">{uiText.questLog.noQuestsInCategory}</p>;
  }
  return (
    <div className="mb-2">
      {quests.map(playerQuest => {
        const questDef = allQuestDefs[playerQuest.questDefId];
        if (!questDef) return <div key={playerQuest.runtimeId || playerQuest.id} className="text-gray-400">{uiText.questLog.unknownQuest.replace("{id}", playerQuest.questDefId)}</div>;
        
        let objectivesDisplay = null;
        if (playerQuest.objectives && (playerQuest.status === QUEST_STATUS.IN_PROGRESS || playerQuest.status === QUEST_STATUS.COMPLETED_PENDING_TURN_IN)) {
          objectivesDisplay = (
            <ul className="list-disc list-inside mt-1 mb-2 text-sm">
              {playerQuest.objectives.map(obj => (
                <li key={obj.id} className={`${obj.isCompleted ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                  {obj.description} 
                  {(obj.type === OBJECTIVE_TYPES.KILL_MONSTERS || obj.type === OBJECTIVE_TYPES.COLLECT_ITEMS) && obj.requiredAmount ? 
                      ` (${obj.currentAmount || 0}/${obj.requiredAmount})` : ''}
                </li>
              ))}
            </ul>
          );
        }

        let rewardsDisplay = null;
        if (questDef.rewards) {
          rewardsDisplay = (
            <div className="mt-2 pt-2 border-t border-gray-600/50">
              <h5 className="text-sm font-semibold text-green-400 mb-1">{uiText.questLog.rewardsLabel}</h5>
              <ul className="list-none pl-2 text-xs text-green-300">
                {questDef.rewards.experience > 0 && <li>{uiText.questLog.rewardExperience} {questDef.rewards.experience}</li>}
                {questDef.rewards.gold > 0 && <li>{uiText.questLog.rewardGold} {questDef.rewards.gold}</li>}
                {questDef.rewards.items && questDef.rewards.items.length > 0 && (
                  <li>{uiText.questLog.rewardItems}
                    <ul className="list-disc list-inside pl-3">
                      {questDef.rewards.items.map(item => (
                        <li key={item.itemId}>{item.itemId} x {item.quantity}</li> 
                      ))}
                    </ul>
                  </li>
                )}
              </ul>
            </div>
          );
        }

        return (
          <div key={playerQuest.runtimeId || questDef.id} className="mb-4 p-3 bg-gray-700 rounded-md shadow">
            <h4 className="text-lg font-medium text-sky-300">{questDef.title}</h4>
            <p className="text-sm text-gray-300 mt-1 mb-2 whitespace-pre-wrap">{questDef.description}</p>
            {playerQuest.status && (
                <p className="text-xs text-yellow-500 font-semibold mb-1">
                    {uiText.questLog.statusLabel} {getQuestStatusText(playerQuest.status)}
                </p>
            )}
            {objectivesDisplay}
            {rewardsDisplay}
          </div>
        );
      })}
    </div>
  );
};

const QuestLogPanel = ({ isOpen, onClose }) => {
  const [currentFilter, setCurrentFilter] = useState(FILTER_TYPES.ACTIVE);

  const activeQuests = useSelector(selectActivePlayerQuests);
  const completedQuests = useSelector(selectCompletedPlayerQuests);
  const allPlayerQuestsRaw = useSelector(selectPlayerQuests); 
  const allQuestDefs = useSelector(selectAllQuestDefinitions);

  const filteredQuests = useMemo(() => {
    let questsToDisplay = [];
    if (currentFilter === FILTER_TYPES.ACTIVE) {
      questsToDisplay = activeQuests;
    } else if (currentFilter === FILTER_TYPES.COMPLETED) {
      questsToDisplay = completedQuests;
    } else if (currentFilter === FILTER_TYPES.ALL) {
      questsToDisplay = Object.values(allPlayerQuestsRaw);
    }
    
    return questsToDisplay.sort((a, b) => {
        const statusOrder = {
            [QUEST_STATUS.IN_PROGRESS]: 1,
            [QUEST_STATUS.COMPLETED_PENDING_TURN_IN]: 2,
            [QUEST_STATUS.TURNED_IN]: 3,
            [QUEST_STATUS.AVAILABLE]: 4, // Should not appear in 'active' or 'completed' but good for 'all'
            [QUEST_STATUS.LOCKED]: 5,   // Same as above
            [QUEST_STATUS.FAILED]: 6,   // Same as above
        };
        const orderA = statusOrder[a.status] || 99;
        const orderB = statusOrder[b.status] || 99;

        if (orderA !== orderB) {
            return orderA - orderB;
        }
        return (b.acceptedAt || 0) - (a.acceptedAt || 0); // Newest accepted first for same status
    });
  }, [currentFilter, activeQuests, completedQuests, allPlayerQuestsRaw]);

  if (!isOpen) {
    return null;
  }

  const filterButtons = [
    { labelKey: 'filterActive', type: FILTER_TYPES.ACTIVE },
    { labelKey: 'filterCompleted', type: FILTER_TYPES.COMPLETED },
    { labelKey: 'filterAll', type: FILTER_TYPES.ALL },
  ];

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} title={uiText.questLog.title} className="w-full max-w-2xl">
        <div className="p-4 bg-gray-800 text-gray-200 rounded-b-md">
            <div className="mb-4 flex space-x-2 border-b border-gray-700 pb-3">
                {filterButtons.map(btn => (
                    <button 
                        key={btn.type} 
                        onClick={() => setCurrentFilter(btn.type)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors 
                                    ${currentFilter === btn.type 
                                        ? 'bg-purple-600 text-white' 
                                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`}
                    >
                        {uiText.questLog[btn.labelKey]}
                    </button>
                ))}
            </div>
            {/* Adjusted max height for the scrollable area to account for filter buttons */}
            <div className="max-h-[calc(80vh - 140px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <QuestSection quests={filteredQuests} allQuestDefs={allQuestDefs} />
            </div>
        </div>
    </CommonModal>
  );
};

export default QuestLogPanel; 