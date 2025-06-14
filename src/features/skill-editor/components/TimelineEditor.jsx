import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const styles = {
  timeline: { padding: '10px', border: '1px solid #eee', borderRadius: '5px', backgroundColor: '#f9f9f9', minHeight: '100px' },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    marginBottom: '8px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  rangeInput: { flex: 1, marginLeft: '10px' }
};

export const TimelineEditor = ({ script, onScriptChange }) => {

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(script);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onScriptChange(items);
  };

  const handleDelayChange = (index, newDelay) => {
    const newScript = [...script];
    newScript[index].delay = Number(newDelay);
    onScriptChange(newScript);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="timeline">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} style={styles.timeline}>
            {script.map((step, index) => (
              <Draggable key={`${step.type}-${index}`} draggableId={`${step.type}-${index}`} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={styles.step}
                  >
                    <span>{`Step ${index + 1}: ${step.type} on '${step.target}'`}</span>
                    <input
                      type="range"
                      min="0"
                      max="3000" // max delay of 3 seconds
                      step="10"
                      value={step.delay}
                      onChange={(e) => handleDelayChange(index, e.target.value)}
                      style={styles.rangeInput}
                    />
                    <span>{step.delay}ms</span>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}; 