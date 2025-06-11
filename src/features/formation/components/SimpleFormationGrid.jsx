import React from 'react';

const SimpleFormationGrid = ({
  grid,
  isEditable = false,
  onCellClick,
  onDragStart,
  onDrop,
  renderCell,
  colLabels = [],
}) => {
  const handleDragStart = (row, col) => {
    if (isEditable && onDragStart) {
      onDragStart(row, col);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
      <div className="flex flex-col gap-2">
        {colLabels.length > 0 && (
          <div className="flex gap-2 pl-2">
            {colLabels.map((label, index) => (
              <div key={index} className="w-24 text-center text-sm text-slate-400 font-medium">
                {label}
              </div>
            ))}
          </div>
        )}
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  w-24 h-24 flex items-center justify-center
                  border-2 rounded-lg
                  ${isEditable 
                    ? 'border-slate-600 hover:border-slate-500 active:border-slate-400 cursor-pointer transition-colors' 
                    : 'border-slate-700'
                  }
                  ${cell ? 'bg-slate-700/50' : 'bg-slate-800/50'}
                `}
                onClick={() => isEditable && onCellClick && onCellClick(rowIndex, colIndex)}
                onDragStart={() => handleDragStart(rowIndex, colIndex)}
                onDrop={(e) => isEditable && onDrop && onDrop(e, rowIndex, colIndex)}
                onDragOver={handleDragOver}
                draggable={isEditable && cell}
              >
                {cell && renderCell && renderCell(cell)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleFormationGrid; 