import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectFormationGrid, setSummonInSlot, selectTotalSummonsInFormation } from '@/store/slices/formationSlice';
import { useSummons, useSummonById } from '@/store/reduxSetup'; // Assuming useSummons provides array of summon objects
import { FORMATION_ROWS, FORMATION_COLS } from '@/config/config';
import { summonConfig } from '@/config/summon/summonConfig'; // To get summon names or images
import { uiText } from '@/config/ui/uiTextConfig'; // <-- Import uiText
import { TOAST_TYPES } from '@/config/enumConfig'; // Import TOAST_TYPES

const MAX_SUMMONS_IN_FORMATION = 5;

const FormationSetup = (props) => {
  const { showToast } = props;
  const dispatch = useDispatch();
  const formationGrid = useSelector(selectFormationGrid);
  const totalSummonsInFormation = useSelector(selectTotalSummonsInFormation); // Get total count
  const summonsAsObject = useSummons(); // Get the object from Redux
  const allPlayerSummons = useMemo(() => summonsAsObject ? Object.values(summonsAsObject) : [], [summonsAsObject]); // Convert to array

  const [selectedSummonId, setSelectedSummonId] = useState(null);
  const [summonDetailsCache, setSummonDetailsCache] = useState({});

  // State for drag and drop visual feedback
  const [draggedItem, setDraggedItem] = useState(null); // Stores info about the item being dragged
  const [draggedOverSlot, setDraggedOverSlot] = useState(null); // {row, col} of slot being dragged over

  // Helper to check if a summon is currently in the formation grid
  const isSummonInGrid = useCallback((summonIdToCheck) => {
    if (!formationGrid || !summonIdToCheck) return false;
    for (const row of formationGrid) {
      if (row.includes(summonIdToCheck)) {
        return true;
      }
    }
    return false;
  }, [formationGrid]);

  // Cache summon details to avoid repeated lookups if useSummonById is expensive
  // or if allPlayerSummons doesn't immediately contain all details needed for display.
  useEffect(() => {
    const newCache = { ...summonDetailsCache };
    let cacheUpdated = false;
    if (formationGrid && allPlayerSummons) { // Added null check for allPlayerSummons just in case
      formationGrid.forEach(row => {
        row.forEach(summonIdInGrid => { // Renamed summonId to summonIdInGrid for clarity
          if (summonIdInGrid && !newCache[summonIdInGrid]) {
            const summon = allPlayerSummons.find(s => s.id === summonIdInGrid); // allPlayerSummons is now an array
            if (summon) {
              newCache[summonIdInGrid] = summon;
              cacheUpdated = true;
            }
          }
        });
      });
    }
    if (cacheUpdated) {
      setSummonDetailsCache(newCache);
    }
  }, [formationGrid, allPlayerSummons, summonDetailsCache]);

  const getSummonDisplayInfo = (summonId) => {
    if (!summonId) return { name: '空', id: null, level: null }; // Added level here
    // Ensure allPlayerSummons is treated as an array here too if find is used
    const summon = summonDetailsCache[summonId] || (allPlayerSummons ? allPlayerSummons.find(s => s.id === summonId) : null);
    if (!summon) return { name: '未知召唤兽', id: summonId, level: 'N/A' }; // Added level here
    const basePetInfo = summonConfig[summon.summonSourceId];
    return {
      id: summon.id, // Make sure to return id
      name: summon.nickname || basePetInfo?.name || '召唤兽',
      level: summon.level, // Ensure level is returned
    };
  };

  const handleDragStart = (e, itemType, summonData, fromRow = null, fromCol = null) => {
    const dragPayload = {
      id: summonData.id,
      type: itemType, // 'list' or 'grid'
      originalRow: fromRow,
      originalCol: fromCol,
      name: summonData.name // For display or other purposes if needed
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragPayload));
    setDraggedItem(dragPayload);
    e.dataTransfer.effectAllowed = 'move';
    // Visual feedback for the source item (optional, browser provides ghost)
    // e.currentTarget.style.opacity = '0.5'; 
  };

  const handleDragEnd = (e) => {
    setDraggedItem(null);
    setDraggedOverSlot(null);
    // Reset opacity if changed in onDragStart
    // e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDragEnter = (e, row, col) => {
    e.preventDefault();
    if (draggedItem) { // Only highlight if an item is being dragged
        setDraggedOverSlot({ row, col });
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Only clear if leaving the specific cell to another or outside
    // This can be tricky if moving quickly between cells. A common approach is to clear onDragEnd for the whole grid.
    // For now, let's try clearing it. If it flickers, we might adjust.
    // setDraggedOverSlot(null); 
  };

  const handleDropOnGrid = (e, targetRow, targetCol) => {
    e.preventDefault();
    const droppedItemData = JSON.parse(e.dataTransfer.getData('application/json'));
    if (!droppedItemData) return;

    const { id: summonIdToPlace, type: sourceType, originalRow, originalCol } = droppedItemData;
    const summonCurrentlyInTargetSlot = formationGrid[targetRow][targetCol];

    // If trying to place a summon from the list into a slot that would exceed the MAX count,
    // AND the summon to place is NOT already in the grid, AND the target slot is NOT already occupied by this same summon,
    // AND the target slot IS occupied by a DIFFERENT summon (meaning it is a replacement of a different summon)
    // OR the target slot is EMPTY
    // THEN, if totalSummonsInFormation is already at MAX, and this is a new summon being added (not a move of an existing one, and not replacing itself)
    // and the target is empty (meaning it's an add not a replace), then block.
    // The new logic allows replacement even if full.

    if (sourceType === 'list') {
        const isPlacingSummonAlreadyInGrid = isSummonInGrid(summonIdToPlace);
        // If the formation is full, AND we are trying to add a NEW summon (not in grid yet)
        // AND the target slot is EMPTY (meaning it's not a replacement, but an addition to an empty slot)
        // THEN, we should block it.
        if (totalSummonsInFormation >= MAX_SUMMONS_IN_FORMATION && 
            !isPlacingSummonAlreadyInGrid && 
            summonCurrentlyInTargetSlot === null) {
            showToast(uiText.formation.maxSummonsReached, TOAST_TYPES.WARNING);
            setDraggedItem(null);
            setDraggedOverSlot(null);
            return;
        }
    }

    // 1. Clear all previous grid locations of this specific summonIdToPlace (ensures uniqueness)
    let alreadyInTargetSlotAndIsSameSummon = false;
    formationGrid.forEach((rowItems, r_idx) => {
      rowItems.forEach((currentSid, c_idx) => {
        if (currentSid === summonIdToPlace) {
          if (r_idx === targetRow && c_idx === targetCol) {
            alreadyInTargetSlotAndIsSameSummon = true; // Dragged to its own spot
          } else {
            dispatch(setSummonInSlot({ row: r_idx, col: c_idx, summonId: null })); // Clear old spot
          }
        }
      });
    });

    // 2. If dragging from a grid cell (move within grid), clear the original cell if it wasn't the target
    if (sourceType === 'grid' && (originalRow !== targetRow || originalCol !== targetCol)) {
        // Only clear if it wasn't the cell that contained summonIdToPlace and was already cleared by the loop above.
        // This ensures if we drag from slot A to B, slot A becomes empty.
        if (!(originalRow === targetRow && originalCol === targetCol) && formationGrid[originalRow][originalCol] === summonIdToPlace) {
             // This condition means the original slot was where summonIdToPlace was, and it's not the target.
             // The loop above would have cleared it IF summonIdToPlace was indeed in originalRow, originalCol.
             // However, the loop only clears if currentSid === summonIdToPlace. What if we drag from an empty cell originally?
             // The most straightforward is: if we started dragging from a grid cell, and it's not the target cell, that original cell should become null,
             // unless it was already going to be the target of summonIdToPlace (which means it was a drag to self, handled by alreadyInTargetSlotAndIsSameSummon)
             // Let's simplify: if we are moving from a grid cell, and it's not to the same cell, dispatch null for the original.
             // The uniqueness check for summonIdToPlace handles its part.
             dispatch(setSummonInSlot({ row: originalRow, col: originalCol, summonId: null }));
        }
    }
    
    // 3. Place the summon in the new target slot, unless it was a drag to its own existing spot.
    if (!alreadyInTargetSlotAndIsSameSummon) {
        dispatch(setSummonInSlot({ row: targetRow, col: targetCol, summonId: summonIdToPlace }));
    }

    // 4. Clear list selection if item came from list
    if (sourceType === 'list') {
      setSelectedSummonId(null);
    }
    
    setDraggedItem(null);
    setDraggedOverSlot(null);
  };

  const handleSelectSummonFromList = (summonId) => {
    setSelectedSummonId(summonId);
    // console.log(`Selected summon ${summonId} for placement.`);
  };

  const handleGridSlotClick = (row, col) => {
    const currentSummonInSlot = formationGrid[row][col];
    if (selectedSummonId) {
      const isSelectedSummonAlreadyInGrid = isSummonInGrid(selectedSummonId);
      const currentSummonInTargetSlot = formationGrid[row][col];

      // If formation is full, AND we are trying to add a NEWLY selected summon (not in grid yet)
      // AND the target slot is EMPTY (meaning it's not a replacement)
      // THEN, block it.
      if (totalSummonsInFormation >= MAX_SUMMONS_IN_FORMATION && 
          !isSelectedSummonAlreadyInGrid && 
          currentSummonInTargetSlot === null) {
          showToast(uiText.formation.maxSummonsReached, TOAST_TYPES.WARNING);
          setSelectedSummonId(null); 
          return;
      }

      // Clear any existing instance of selectedSummonId before placing it
      formationGrid.forEach((rItems, r_idx) => {
        rItems.forEach((sId, c_idx) => {
          if (sId === selectedSummonId) {
            if (r_idx !== row || c_idx !== col) { // Don't clear if it's the target slot itself initially
                 dispatch(setSummonInSlot({ row: r_idx, col: c_idx, summonId: null }));
            }
          }
        });
      });
      // Place the selected summon
      dispatch(setSummonInSlot({ row, col, summonId: selectedSummonId }));
      setSelectedSummonId(null); 
    } else if (currentSummonInSlot) {
      dispatch(setSummonInSlot({ row, col, summonId: null }));
    }
  };

  // Basic styling for grid and list (inline for simplicity, can be moved to CSS)
  const styles = {
    container: { display: 'flex', padding: '20px', fontFamily: 'Arial, sans-serif', color: '#eee' },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: `repeat(${FORMATION_COLS}, 100px)`,
      gridTemplateRows: `repeat(${FORMATION_ROWS}, 100px)`,
      gap: '10px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#555',
      padding: '10px',
      marginRight: '30px',
      backgroundColor: '#2c3e50',
    },
    gridCell: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#777',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'grab',
      backgroundColor: '#34495e',
      minHeight: '100px',
      position: 'relative',
      transition: 'background-color 0.2s ease, border-color 0.2s ease, border-style 0.2s ease',
    },
    frontRowCell: { // Style for Front Row (Rightmost column, colIndex === 2 for 3 cols)
        backgroundColor: '#4a5568', // Darker Slate
        borderColor: '#a0aec0', // Lighter Slate for border
    },
    midRowCell: { // Style for Mid Row (Middle column, colIndex === 1 for 3 cols)
        backgroundColor: '#38a169', // Green
        borderColor: '#9ae6b4', // Lighter Green
    },
    backRowCell: { // Style for Back Row (Leftmost column, colIndex === 0 for 3 cols)
        backgroundColor: '#3182ce', // Blue
        borderColor: '#90cdf4', // Lighter Blue
    },
    gridCellDraggingOver: {
      backgroundColor: '#4a6e8a',
      borderStyle: 'dashed',
      borderColor: '#00bcd4',
    },
    gridCellContent: {
        padding: '5px',
        borderRadius: '4px',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    draggingItem: {
        opacity: 0.5,
        borderWidth: '2px',
        borderStyle: 'dashed',
        borderColor: '#00bcd4',
    },
    summonListContainer: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#555',
      padding: '10px',
      width: '200px',
      maxHeight: `${FORMATION_ROWS * 100 + (FORMATION_ROWS -1) * 10 + 20}px`,
      overflowY: 'auto',
      backgroundColor: '#2c3e50',
    },
    summonListItem: {
      padding: '8px',
      margin: '5px 0',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#777',
      cursor: 'grab',
      backgroundColor: '#34495e',
      transition: 'background-color 0.2s ease, border-color 0.2s ease, border-style 0.2s ease',
    },
    selectedSummonListItem: {
      padding: '8px',
      margin: '5px 0',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#00bcd4',
      cursor: 'grab',
      backgroundColor: '#00796b',
      fontWeight: 'bold',
      color: 'white',
    },
    summonListItemInFormation: { // Style for summon in list that is already in formation
        backgroundColor: '#5A67D8', // Indigo-ish background
        borderColor: '#7f9cf5', // Lighter indigo border
        color: '#e0e0e0', // Lighter text for contrast
        // You could add an icon or ::after pseudo-element with CSS if not using inline styles for everything
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.gridContainer}>
        {formationGrid && formationGrid.map((rowItems, rowIndex) =>
          rowItems.map((summonIdInCell, colIndex) => {
            const summonInfo = getSummonDisplayInfo(summonIdInCell);
            const isBeingDraggedOver = draggedOverSlot && draggedOverSlot.row === rowIndex && draggedOverSlot.col === colIndex;
            const currentCellItemIsDragged = draggedItem && draggedItem.type === 'grid' && draggedItem.originalRow === rowIndex && draggedItem.originalCol === colIndex;

            let positionStyle = {};
            if (FORMATION_COLS === 3) { // Assuming 3 columns for specific styling
                if (colIndex === 2) positionStyle = styles.frontRowCell; // Rightmost = Front
                else if (colIndex === 1) positionStyle = styles.midRowCell; // Middle = Mid
                else if (colIndex === 0) positionStyle = styles.backRowCell; // Leftmost = Back
            }

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                style={{
                  ...styles.gridCell,
                  ...positionStyle, // Apply position-specific style
                  ...(isBeingDraggedOver ? styles.gridCellDraggingOver : {}),
                  boxShadow: summonIdInCell ? '0 2px 8px rgba(0,0,0,0.18)' : '0 1px 2px rgba(0,0,0,0.08)',
                  borderRadius: '14px',
                  borderWidth: isBeingDraggedOver || currentCellItemIsDragged ? '2px' : '1px',
                  borderColor: isBeingDraggedOver || currentCellItemIsDragged ? '#00bcd4' : (positionStyle.borderColor || '#777'),
                  background: !summonIdInCell ? 'linear-gradient(135deg, #2d3748 60%, #4fd1c5 100%)' : positionStyle.backgroundColor,
                  transition: 'all 0.18s',
                }}
                onClick={() => !draggedItem && handleGridSlotClick(rowIndex, colIndex)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, rowIndex, colIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDropOnGrid(e, rowIndex, colIndex)}
              >
                <div
                  style={{
                    ...styles.gridCellContent,
                    cursor: summonIdInCell ? 'grab' : 'pointer',
                    ...(currentCellItemIsDragged ? styles.draggingItem : {})
                  }}
                  draggable={!!summonIdInCell}
                  onDragStart={(e) => summonIdInCell && handleDragStart(e, 'grid', summonInfo, rowIndex, colIndex)}
                  onDragEnd={handleDragEnd}
                >
                  <div style={{width:'100%',height:'100%',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {!summonIdInCell && (
                      <div style={{textAlign:'center', color:'#b2f5ea', fontSize:'2.2em', opacity:0.7}}>
                        <i className="fa fa-plus"></i>
                        <div style={{fontSize:'0.9em', color:'#81e6d9'}}>空</div>
                      </div>
                    )}
                    {summonIdInCell && (
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:'100%'}}>
                        <img src={summonConfig[summonInfo.id]?.icon || '/assets/summons/default.png'} alt="icon" style={{width:48,height:48,borderRadius:8,marginBottom:4,boxShadow:'0 1px 4px #0004'}} />
                        <div style={{fontWeight:'bold',fontSize:'1.1em',color:'#fff',textShadow:'0 1px 2px #0008'}}>{summonInfo.name}</div>
                        <div style={{fontSize:'0.9em',color:'#c3e6fc'}}>Lv.{summonInfo.level}</div>
                        <button
                          style={{position:'absolute',top:4,right:4,background:'rgba(0,0,0,0.5)',border:'none',borderRadius:'50%',width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',zIndex:2}}
                          title="移除该召唤兽"
                          onClick={e=>{e.stopPropagation();dispatch(setSummonInSlot({row:rowIndex,col:colIndex,summonId:null}));}}
                        >
                          <i className="fa fa-times" style={{color:'#fff',fontSize:12}}></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div style={styles.summonListContainer}>
        <h3>{uiText.titles.formationModal || '选择召唤兽放置'}</h3>
        <p style={{color: '#ccc', marginBottom: '10px'}}>
          {uiText.formation.summonCount.replace('{count}', totalSummonsInFormation)}
        </p>
        {allPlayerSummons && allPlayerSummons.length > 0 ? (
          allPlayerSummons.map(summon => {
            const displayName = summon.nickname || (summonConfig[summon.summonSourceId] ? summonConfig[summon.summonSourceId].name : '召唤兽');
            const displayLevel = summon.level || 'N/A';

            const isSelected = selectedSummonId === summon.id;
            const isBeingDragged = draggedItem && draggedItem.type === 'list' && draggedItem.id === summon.id;
            const isInFormation = isSummonInGrid(summon.id);
            
            let listItemStyle = styles.summonListItem;
            if (isInFormation && !isBeingDragged) {
                listItemStyle = { ...listItemStyle, ...styles.summonListItemInFormation };
            }
            if (isSelected && !isBeingDragged && !isInFormation) {
                 listItemStyle = styles.selectedSummonListItem;
            }
            if (isBeingDragged) {
                listItemStyle = {...styles.summonListItem, ...styles.draggingItem};
            }

            return (
              <div
                key={summon.id}
                style={listItemStyle}
                onClick={() => handleSelectSummonFromList(summon.id)}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, 'list', {id: summon.id, name: displayName, level: displayLevel })}
                onDragEnd={handleDragEnd}
              >
                {displayName} ({uiText.labels.level || '等级:'} {displayLevel}) {isInFormation ? "(已上阵)" : ""}
              </div>
            );
          })
        ) : (
          <p>{uiText.notifications.noSummonData}</p>
        )}
        {selectedSummonId && !draggedItem && ( 
            <p style={{ marginTop: '10px', color: '#00bcd4' }}>
                已选择: {getSummonDisplayInfo(selectedSummonId).name}. 点击格子放置或拖拽放置。
            </p>
        )}
      </div>
    </div>
  );
};

export default FormationSetup; 