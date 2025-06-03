import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectFormationGrid, setSummonInSlot, selectTotalSummonsInFormation } from '@/store/slices/formationSlice';
import { useSummonManager } from '@/hooks/useSummonManager';
import { formationDataManager } from '../utils/FormationDataManager'; // 导入数据管理器
import { FORMATION_ROWS, FORMATION_COLS } from '@/config/config';
import { summonConfig } from '@/config/summon/summonConfig';
import { uiText } from '@/config/ui/uiTextConfig';
import { TOAST_TYPES } from '@/config/enumConfig';

const MAX_SUMMONS_IN_FORMATION = 5;

const FormationSetup = (props) => {
  const { showToast } = props;
  const dispatch = useDispatch();
  const formationGrid = useSelector(selectFormationGrid);
  const totalSummonsInFormation = useSelector(selectTotalSummonsInFormation);
  
  // 使用面向对象的召唤兽管理系统
  const { 
    state: summonManagerState, 
    isLoading: summonManagerLoading, 
    error: summonManagerError 
  } = useSummonManager();
  
  // 从OOP管理器获取召唤兽数据
  const allPlayerSummons = useMemo(() => {
    if (!summonManagerState?.summonsData) return [];
    return Object.values(summonManagerState.summonsData);
  }, [summonManagerState?.summonsData]);

  const [selectedSummonId, setSelectedSummonId] = useState(null);
  
  // State for drag and drop visual feedback
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverSlot, setDraggedOverSlot] = useState(null);

  // 使用数据管理器计算阵型分析
  const formationAnalysis = useMemo(() => {
    return formationDataManager.analyzeFormation(formationGrid, allPlayerSummons);
  }, [formationGrid, allPlayerSummons]);

  // 使用数据管理器的方法
  const getSummonDisplayInfo = useCallback((summonId) => {
    return formationDataManager.getSummonDisplayInfo(summonId, allPlayerSummons);
  }, [allPlayerSummons]);

  const isSummonInGrid = useCallback((summonId) => {
    return formationDataManager.isSummonInGrid(formationGrid, summonId);
  }, [formationGrid]);

  const handleDragStart = (e, itemType, summonData, fromRow = null, fromCol = null) => {
    const dragPayload = formationDataManager.createDragPayload(itemType, summonData, fromRow, fromCol);
    e.dataTransfer.setData('application/json', JSON.stringify(dragPayload));
    setDraggedItem(dragPayload);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e) => {
    setDraggedItem(null);
    setDraggedOverSlot(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e, row, col) => {
    e.preventDefault();
    if (draggedItem) {
      setDraggedOverSlot({ row, col });
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDropOnGrid = (e, targetRow, targetCol) => {
    e.preventDefault();
    const droppedItemData = JSON.parse(e.dataTransfer.getData('application/json'));
    if (!droppedItemData) return;

    const { id: summonIdToPlace, type: sourceType, originalRow, originalCol } = droppedItemData;

    // 使用数据管理器验证放置
    const validation = formationDataManager.validateSummonPlacement(
      formationGrid, 
      summonIdToPlace, 
      targetRow, 
      targetCol, 
      sourceType
    );

    if (!validation.canPlace) {
      showToast(validation.reason, TOAST_TYPES.WARNING);
      setDraggedItem(null);
      setDraggedOverSlot(null);
      return;
    }

    // Clear all previous grid locations of this specific summonIdToPlace
    let alreadyInTargetSlotAndIsSameSummon = false;
    formationGrid.forEach((rowItems, r_idx) => {
      rowItems.forEach((currentSid, c_idx) => {
        if (currentSid === summonIdToPlace) {
          if (r_idx === targetRow && c_idx === targetCol) {
            alreadyInTargetSlotAndIsSameSummon = true;
          } else {
            dispatch(setSummonInSlot({ row: r_idx, col: c_idx, summonId: null }));
          }
        }
      });
    });

    if (sourceType === 'grid' && (originalRow !== targetRow || originalCol !== targetCol)) {
      if (!(originalRow === targetRow && originalCol === targetCol) && formationGrid[originalRow][originalCol] === summonIdToPlace) {
        dispatch(setSummonInSlot({ row: originalRow, col: originalCol, summonId: null }));
      }
    }
    
    if (!alreadyInTargetSlotAndIsSameSummon) {
      dispatch(setSummonInSlot({ row: targetRow, col: targetCol, summonId: summonIdToPlace }));
    }

    if (sourceType === 'list') {
      setSelectedSummonId(null);
    }
    
    setDraggedItem(null);
    setDraggedOverSlot(null);
  };

  const handleSelectSummonFromList = (summonId) => {
    setSelectedSummonId(summonId);
  };

  const handleGridSlotClick = (row, col) => {
    const currentSummonInSlot = formationGrid[row][col];
    if (selectedSummonId) {
      // 使用数据管理器验证放置
      const validation = formationDataManager.validateSummonPlacement(
        formationGrid, 
        selectedSummonId, 
        row, 
        col, 
        'list'
      );

      if (!validation.canPlace) {
        showToast(validation.reason, TOAST_TYPES.WARNING);
        setSelectedSummonId(null); 
        return;
      }

      // Clear any existing instance of selectedSummonId before placing it
      formationGrid.forEach((rItems, r_idx) => {
        rItems.forEach((sId, c_idx) => {
          if (sId === selectedSummonId) {
            if (r_idx !== row || c_idx !== col) {
              dispatch(setSummonInSlot({ row: r_idx, col: c_idx, summonId: null }));
            }
          }
        });
      });
      
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
    },
    analysisPanel: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#555',
      padding: '10px',
      marginBottom: '20px',
      backgroundColor: '#2c3e50',
    },
  };

  return (
    <div style={styles.container}>
      {/* 添加阵型分析信息显示 */}
      <div style={styles.analysisPanel}>
        <h4 style={{color: '#fff', marginBottom: '10px'}}>阵型分析</h4>
        <div style={{color: '#ccc', fontSize: '0.9em'}}>
          <div>总战力: <span style={{color: '#ffd700'}}>{formationAnalysis.totalPower}</span></div>
          <div>平均战力: <span style={{color: '#90EE90'}}>{formationAnalysis.averagePower}</span></div>
          <div>召唤兽数量: {formationAnalysis.totalSummons}/{formationAnalysis.maxSummons}</div>
          <div>前排: {formationAnalysis.positionAnalysis.front.length} | 
               中排: {formationAnalysis.positionAnalysis.mid.length} | 
               后排: {formationAnalysis.positionAnalysis.back.length}</div>
        </div>
      </div>
      
      <div style={styles.gridContainer}>
        {formationGrid && formationGrid.map((rowItems, rowIndex) =>
          rowItems.map((summonIdInCell, colIndex) => {
            const summonInfo = getSummonDisplayInfo(summonIdInCell);
            const isBeingDraggedOver = draggedOverSlot && draggedOverSlot.row === rowIndex && draggedOverSlot.col === colIndex;
            const currentCellItemIsDragged = draggedItem && draggedItem.type === 'grid' && draggedItem.originalRow === rowIndex && draggedItem.originalCol === colIndex;

            // 使用数据管理器获取位置样式
            const positionStyle = formationDataManager.getPositionStyle(colIndex);

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                style={{
                  ...styles.gridCell,
                  ...positionStyle,
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
                        <img 
                          src={summonConfig[summonInfo.id]?.icon || '/assets/summons/default.png'} 
                          alt="icon" 
                          style={{width:48,height:48,borderRadius:8,marginBottom:4,boxShadow:'0 1px 4px #0004'}} 
                        />
                        <div style={{fontWeight:'bold',fontSize:'1.1em',color:'#fff',textShadow:'0 1px 2px #0008'}}>
                          {summonInfo.name}
                        </div>
                        <div style={{fontSize:'0.9em',color:'#c3e6fc'}}>
                          Lv.{summonInfo.level}
                        </div>
                        <div style={{fontSize:'0.8em',color:'#ffd700'}}>
                          战力: {summonInfo.power}
                        </div>
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
        {summonManagerLoading && (
          <p style={{color: '#ffd700'}}>加载召唤兽数据中...</p>
        )}
        {summonManagerError && (
          <p style={{color: '#ff6b6b'}}>加载召唤兽数据失败: {summonManagerError.message}</p>
        )}
        {allPlayerSummons && allPlayerSummons.length > 0 ? (
          allPlayerSummons.map(summonInstance => {
            // 使用召唤兽实例的方法获取显示信息
            const basePetInfo = summonInstance.getConfig();
            const displayName = summonInstance.nickname || basePetInfo?.name || '召唤兽';
            const displayLevel = summonInstance.level || 'N/A';
            const displayPower = summonInstance.power || 0;

            const isSelected = selectedSummonId === summonInstance.id;
            const isBeingDragged = draggedItem && draggedItem.type === 'list' && draggedItem.id === summonInstance.id;
            const isInFormation = isSummonInGrid(summonInstance.id);
            
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
                key={summonInstance.id}
                style={listItemStyle}
                onClick={() => handleSelectSummonFromList(summonInstance.id)}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, 'list', {
                  id: summonInstance.id, 
                  name: displayName, 
                  level: displayLevel,
                  power: displayPower
                })}
                onDragEnd={handleDragEnd}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <div>{displayName}</div>
                    <div style={{fontSize: '0.9em', opacity: 0.8}}>
                      {uiText.labels.level || '等级:'} {displayLevel}
                    </div>
                  </div>
                  <div style={{textAlign: 'right', fontSize: '0.8em'}}>
                    <div style={{color: '#ffd700'}}>战力: {displayPower}</div>
                    {isInFormation ? <div style={{color: '#90EE90'}}>(已上阵)</div> : null}
                  </div>
                </div>
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