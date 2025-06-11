import React, { useState } from 'react';
import { Col } from 'antd';
import PlayerFormationEditor from './PlayerFormationEditor';

const BattleBriefing = () => {
  const [playerFormation, setPlayerFormation] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [allPlayerSummons, setAllPlayerSummons] = useState([]);

  const handleFormationChange = (newFormation) => {
    setPlayerFormation(newFormation);
  };

  const handleCellClick = (cell) => {
    setSelectedCell(cell);
  };

  return (
    <div className="flex h-full">
      <Col span={5} className="h-full">
        <PlayerFormationEditor
          playerFormation={playerFormation}
          onFormationChange={handleFormationChange}
          onCellClick={handleCellClick}
          selectedCell={selectedCell}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped(!isFlipped)}
          allPlayerSummons={allPlayerSummons}
        />
      </Col>

      <Col span={4} className="h-full flex flex-col justify-between">
        {/* Rest of the component content */}
      </Col>
    </div>
  );
};

export default BattleBriefing; 