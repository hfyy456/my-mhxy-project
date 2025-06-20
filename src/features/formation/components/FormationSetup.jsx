import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectFormationGrid, setSummonInSlot, selectTotalSummonsInFormation } from '@/store/slices/formationSlice';
import { useSummonManager } from '@/hooks/useSummonManager';
import { formationDataManager } from '../utils/FormationDataManager'; // 导入数据管理器
import { FORMATION_ROWS, FORMATION_COLS } from '@/config/config';
import { summonConfig } from '@/config/summon/summonConfig';
import { uiText } from '@/config/ui/uiTextConfig';
import { TOAST_TYPES } from '@/config/enumConfig';

const images = import.meta.glob("@/assets/summons/*.png", { eager: true });
const getSummonSprite = (summonSourceId) => {
  if (!summonSourceId) return images['/src/assets/summons/default.png']?.default || '';
  const path = `/src/assets/summons/${summonSourceId}.png`;
  return images[path]?.default || images['/src/assets/summons/default.png']?.default || '';
};

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
      borderColor: 'var(--color-primary)',
      padding: '10px',
      marginRight: '30px',
      backgroundColor: 'var(--color-dark)',
    },
    gridCell: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--color-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'grab',
      backgroundColor: 'rgba(115, 92, 136, 0.2)', // dreamyPurple-300 with opacity
      minHeight: '100px',
      position: 'relative',
      transition: 'background-color 0.2s ease, border-color 0.2s ease, border-style 0.2s ease',
    },
    frontRowCell: { // Style for Front Row (Rightmost column, colIndex === 2 for 3 cols)
        backgroundColor: 'rgba(217, 200, 178, 0.2)', // dreamyPurple-500 with opacity
        borderColor: 'rgba(217, 200, 178, 0.5)', // dreamyPurple-500 with more opacity
    },
    midRowCell: { // Style for Mid Row (Middle column, colIndex === 1 for 3 cols)
        backgroundColor: 'rgba(115, 92, 136, 0.2)', // dreamyPurple-300 with opacity
        borderColor: 'rgba(115, 92, 136, 0.5)', // dreamyPurple-300 with more opacity
    },
    backRowCell: { // Style for Back Row (Leftmost column, colIndex === 0 for 3 cols)
        backgroundColor: 'rgba(86, 62, 104, 0.2)', // dreamyPurple-400 with opacity
        borderColor: 'rgba(86, 62, 104, 0.5)', // dreamyPurple-400 with more opacity
    },
    gridCellDraggingOver: {
      backgroundColor: 'rgba(115, 92, 136, 0.4)', // dreamyPurple-300 with more opacity
      borderStyle: 'dashed',
      borderColor: 'var(--color-primary)',
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
        borderColor: 'var(--color-primary)',
    },
    summonListContainer: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--color-primary)',
      padding: '10px',
      width: '200px',
      maxHeight: `${FORMATION_ROWS * 100 + (FORMATION_ROWS -1) * 10 + 20}px`,
      overflowY: 'auto',
      backgroundColor: 'var(--color-dark)',
    },
    summonListItem: {
      padding: '8px',
      margin: '5px 0',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--color-primary)',
      cursor: 'grab',
      backgroundColor: 'rgba(115, 92, 136, 0.2)', // dreamyPurple-300 with opacity
      transition: 'background-color 0.2s ease',
    },
    summonListItemSelected: {
      backgroundColor: 'rgba(115, 92, 136, 0.5)', // dreamyPurple-300 with more opacity
      borderColor: 'var(--color-secondary)',
    },
    summonListItemInUse: {
      backgroundColor: 'rgba(217, 200, 178, 0.2)', // dreamyPurple-500 with opacity
      borderColor: 'rgba(217, 200, 178, 0.5)', // dreamyPurple-500 with more opacity
    },
    summonName: {
      fontWeight: 'bold',
      fontSize: '14px',
      marginBottom: '5px',
    },
    summonLevel: {
      fontSize: '12px',
      color: '#aaa',
    },
    analysisContainer: {
      marginLeft: '20px',
      padding: '10px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--color-primary)',
      backgroundColor: 'var(--color-dark)',
      width: '200px',
    },
    analysisTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '10px',
      color: 'var(--color-secondary)',
    },
    analysisItem: {
      marginBottom: '8px',
      fontSize: '14px',
    },
    analysisLabel: {
      fontWeight: 'bold',
      marginRight: '5px',
      color: 'var(--color-secondary)',
    },
    analysisValue: {
      color: '#fff',
    },
    positionLabel: {
      position: 'absolute',
      top: '5px',
      right: '5px',
      fontSize: '10px',
      color: 'rgba(255, 255, 255, 0.7)',
    },
    emptySlot: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: '24px',
    },
  };

  return (
    <div style={styles.container}>
      {/* 添加阵型分析信息显示 */}
      <div style={styles.analysisContainer}>
        <h4 style={styles.analysisTitle}>阵型分析</h4>
        <div style={styles.analysisItem}>
          <span style={styles.analysisLabel}>总战力:</span>
          <span style={styles.analysisValue}>{formationAnalysis.totalPower}</span>
        </div>
        <div style={styles.analysisItem}>
          <span style={styles.analysisLabel}>平均战力:</span>
          <span style={styles.analysisValue}>{formationAnalysis.averagePower}</span>
        </div>
        <div style={styles.analysisItem}>
          <span style={styles.analysisLabel}>召唤兽数量:</span>
          <span style={styles.analysisValue}>{formationAnalysis.totalSummons}/{formationAnalysis.maxSummons}</span>
        </div>
        <div style={styles.analysisItem}>
          <span style={styles.analysisLabel}>前排:</span>
          <span style={styles.analysisValue}>{formationAnalysis.positionAnalysis.front.length} | 中排: {formationAnalysis.positionAnalysis.mid.length} | 后排: {formationAnalysis.positionAnalysis.back.length}</span>
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
                  borderColor: isBeingDraggedOver || currentCellItemIsDragged ? 'var(--color-primary)' : (positionStyle.borderColor || 'var(--color-primary)'),
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
                      <div style={styles.emptySlot}>
                        <i className="fa fa-plus"></i>
                        <div style={styles.positionLabel}>空</div>
                      </div>
                    )}
                    {summonIdInCell && (
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:'100%'}}>
                        <img 
                          src={getSummonSprite(summonInfo.summonSourceId)} 
                          alt="icon" 
                          style={{width:48,height:48,borderRadius:8,marginBottom:4,boxShadow:'0 1px 4px #0004'}} 
                        />
                        <div style={styles.summonName}>
                          {summonInfo.name}
                        </div>
                        <div style={styles.summonLevel}>
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
              listItemStyle = { ...listItemStyle, ...styles.summonListItemInUse };
            }
            if (isSelected && !isBeingDragged && !isInFormation) {
              listItemStyle = styles.summonListItemSelected;
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
                    <div style={styles.summonName}>{displayName}</div>
                    <div style={styles.summonLevel}>
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
          <p style={{ marginTop: '10px', color: 'var(--color-primary)' }}>
            已选择: {getSummonDisplayInfo(selectedSummonId).name}. 点击格子放置或拖拽放置。
          </p>
        )}
      </div>
    </div>
  );
};

export default FormationSetup; 