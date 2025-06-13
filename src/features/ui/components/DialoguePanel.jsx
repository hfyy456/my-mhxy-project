/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-22 00:03:24
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-22 04:27:26
 */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectInteractingNpcId, selectCurrentDialogue, selectNpcById } from '@/store/slices/npcSlice';
import { handleDialogueOptionSelectThunk } from '@/store/thunks/dialogueThunks';
// import { npcs as npcConfig } from '../../config/npcConfig'; // Not needed if npcSlice.npcs has all static data

const DialoguePanel = () => {
  const dispatch = useDispatch();
  const interactingNpcId = useSelector(selectInteractingNpcId);
  const currentDialogueNode = useSelector(selectCurrentDialogue); // This selector returns the full node object
  
  // Get the NPC's static data (like name) using their ID
  // Assuming selectNpcById returns the full NPC object from state.npcs.npcs[npcId]
  const interactingNpcData = useSelector(selectNpcById(interactingNpcId));

  if (!interactingNpcId || !currentDialogueNode || !interactingNpcData) {
    return null; // Don't render if no active interaction or data missing
  }

  const handleOptionClick = (option) => {
    dispatch(handleDialogueOptionSelectThunk(interactingNpcId, option));
  };

  return (
    <div className="fixed bottom-1/2 left-1/2 transform -translate-x-1/2 w-4/5 max-w-[600px] p-5 bg-theme-dark/80 text-theme-light border border-theme-primary rounded-lg shadow-lg z-[1000] font-sans">
      <div className="text-xl font-bold mb-2.5 text-theme-primary">{interactingNpcData.name || 'NPC'}</div>
      <div className="mb-5 leading-relaxed">{currentDialogueNode.text}</div>
      <ul className="list-none p-0">
        {currentDialogueNode.options && currentDialogueNode.options.map((option, index) => (
          <li key={index}>
            <button 
              className="block w-full py-2.5 px-4 mb-2 bg-theme-dark text-theme-light border border-theme-primary/50 rounded hover:bg-theme-primary/20 transition-colors text-left cursor-pointer text-sm"
              onClick={() => handleOptionClick(option)}
            >
              {option.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DialoguePanel; 