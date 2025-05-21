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

  const panelStyle = {
    position: 'fixed',
    bottom: '50%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80%',
    maxWidth: '600px',
    padding: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    border: '1px solid #444',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    zIndex: 1000, // Ensure it's on top
    fontFamily: 'Arial, sans-serif',
  };

  const npcNameStyle = {
    fontSize: '1.2em',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#61dafb', // Light blue for NPC name
  };

  const dialogueTextStyle = {
    marginBottom: '20px',
    lineHeight: '1.6',
  };

  const optionsListStyle = {
    listStyleType: 'none',
    padding: 0,
  };

  const optionButtonStyle = {
    display: 'block',
    width: '100%',
    padding: '10px 15px',
    marginBottom: '8px',
    backgroundColor: '#333',
    color: '#eee',
    border: '1px solid #555',
    borderRadius: '4px',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.9em',
  };

  return (
    <div style={panelStyle}>
      <div style={npcNameStyle}>{interactingNpcData.name || 'NPC'}</div>
      <div style={dialogueTextStyle}>{currentDialogueNode.text}</div>
      <ul style={optionsListStyle}>
        {currentDialogueNode.options && currentDialogueNode.options.map((option, index) => (
          <li key={index}>
            <button 
              style={optionButtonStyle} 
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#555'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#333'}
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