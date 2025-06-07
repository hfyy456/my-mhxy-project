import React, { useState } from 'react';
import DungeonEntrance from './DungeonEntrance.jsx';
import DungeonGameplay from './DungeonGameplay.jsx';
import { DungeonManager } from '../classes/DungeonManager.js';

const DungeonMain = () => {
  const [dungeonManager] = useState(() => new DungeonManager());
  const [currentView, setCurrentView] = useState('entrance'); // 'entrance' | 'gameplay'
  const [currentDungeonId, setCurrentDungeonId] = useState(null);

  const handleEnterDungeon = (dungeonId) => {
    setCurrentDungeonId(dungeonId);
    setCurrentView('gameplay');
  };

  const handleExitDungeon = () => {
    setCurrentDungeonId(null);
    setCurrentView('entrance');
  };

  return (
    <div className="min-h-screen">
      {currentView === 'entrance' && (
        <DungeonEntrance 
          dungeonManager={dungeonManager}
          onEnterDungeon={handleEnterDungeon} 
        />
      )}
      
      {currentView === 'gameplay' && (
        <DungeonGameplay 
          dungeonManager={dungeonManager}
          dungeonId={currentDungeonId}
          onExit={handleExitDungeon}
        />
      )}
    </div>
  );
};

export default DungeonMain; 