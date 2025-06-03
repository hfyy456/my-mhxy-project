/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-01 05:46:30
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-04 05:48:44
 * @FilePath: \my-mhxy-project\src\features\tower\components\TowerBattlePreparation.jsx
 * @Description: 封妖塔战斗准备组件
 */

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// import { selectAllSummons } from '@/store/slices/summonSlice'; // 已移除Redux召唤兽系统
import { useSummonManager } from '@/hooks/useSummonManager'; // 使用OOP召唤兽系统
import { FIVE_ELEMENTS } from '@/config/enumConfig';

// 封妖塔战斗准备组件
const TowerBattlePreparation = ({ floor, floorConfig, onCancel, onStartBattle }) => {
  // 使用OOP召唤兽系统
  const { allSummons } = useSummonManager();
  const summonsList = Object.values(allSummons || {}); // 转换为数组
  
  // 使用formation slice的选择器
  const formationGrid = useSelector(state => state.formation?.grid || Array(3).fill(null).map(() => Array(3).fill(null)));
  
  // 由于没有formations选择器，我们创建一个简单的formations数组
  const formations = [{
    id: 'default',
    name: '默认阵型',
    positions: formationGrid.flatMap((row, rowIndex) => 
      row.map((summonId, colIndex) => ({
        row: rowIndex,
        col: colIndex,
        summonId
      }))
    )
  }];
  
  // 本地状态
  const [selectedFormationId, setSelectedFormationId] = useState('default'); // 默认选中我们创建的阵型
  const [selectedSummons, setSelectedSummons] = useState([]);
  const [availableSummons, setAvailableSummons] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // 检查楼层是否有五行限制
  const hasFiveElementRestriction = floorConfig?.environment?.effect?.type === 'fiveElementRestriction';
  const restrictedElements = hasFiveElementRestriction ? floorConfig.environment.effect.restrictedElements : [];
  
  // 当阵型网格变化时，更新选中的召唤兽
  useEffect(() => {
    // 从阵型网格中获取所有非空的召唤兽ID
    const summonIds = formationGrid.flat().filter(Boolean);
    
    // 根据ID获取召唤兽对象
    const summons = summonIds.map(id => summonsList.find(s => s.id === id)).filter(Boolean);
    setSelectedSummons(summons);
  }, [formationGrid, summonsList]);
  
  // 过滤可用的召唤兽（考虑五行限制）
  useEffect(() => {
    let filtered = [...summonsList];
    
    // 如果有五行限制，过滤掉受限制的五行召唤兽
    if (hasFiveElementRestriction && restrictedElements.length > 0) {
      filtered = filtered.filter(summon => !restrictedElements.includes(summon.fiveElement));
    }
    
    setAvailableSummons(filtered);
  }, [summonsList, hasFiveElementRestriction, restrictedElements]);
  
  // 验证阵容是否符合要求
  const validateFormation = () => {
    // 阵型已经默认选择，无需检查
    
    // 检查阵型中是否有召唤兽
    if (selectedSummons.length === 0) {
      setErrorMessage('请在阵型中添加召唤兽');
      return false;
    }
    
    // 检查五行限制
    if (hasFiveElementRestriction) {
      const hasRestrictedElement = selectedSummons.some(summon => 
        restrictedElements.includes(summon.fiveElement)
      );
      
      if (hasRestrictedElement) {
        const elementNames = restrictedElements
          .map(elem => FIVE_ELEMENTS[elem])
          .join('、');
        
        setErrorMessage(`当前楼层限制使用${elementNames}五行的召唤兽`);
        return false;
      }
    }
    
    // 通过验证
    setErrorMessage(null);
    return true;
  };
  
  // 处理开始战斗
  const handleStartBattle = () => {
    if (validateFormation()) {
      onStartBattle({
        formationId: 'default',
        formation: {
          id: 'default',
          name: '默认阵型',
          grid: formationGrid
        },
        summons: selectedSummons
      });
    }
  };
  
  return (
    <div className="h-full p-4 overflow-y-auto">
      {/* 标题 */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold">战斗准备</h3>
        <p className="text-gray-400 mt-1">
          准备挑战封妖塔第 {floor} 层
          {floorConfig?.isBossFloor ? ' (BOSS层)' : ''}
        </p>
      </div>
      
      {/* 环境提示 */}
      {hasFiveElementRestriction && (
        <div className="mb-6 bg-yellow-900 bg-opacity-30 border border-yellow-800 rounded-lg p-4">
          <h4 className="text-lg font-bold text-yellow-500 flex items-center">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            五行限制
          </h4>
          <p className="mt-1 text-yellow-200">
            本层限制使用
            {restrictedElements.map(elem => FIVE_ELEMENTS[elem]).join('、')}
            五行的召唤兽参战。
          </p>
        </div>
      )}
      
      {/* 当前阵型信息 */}
      <div className="mb-6">
        <h4 className="text-xl font-bold mb-2">当前阵型</h4>
        <div className="p-3 border rounded-md border-purple-500 bg-purple-100 bg-opacity-20">
          <div className="font-bold">默认阵型</div>
          <div className="text-sm text-gray-400 mt-1">
            {selectedSummons.length} 个召唤兽
          </div>
        </div>
      </div>
      
      {/* 已选召唤兽 */}
      <div className="mb-6">
        <h4 className="text-lg font-bold mb-3">出战阵容</h4>
        {selectedSummons.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {selectedSummons.map(summon => (
              <div 
                key={summon.id}
                className="bg-gray-800 rounded-lg p-3 flex items-center"
              >
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                  <i className="fas fa-paw text-blue-400"></i>
                </div>
                <div>
                  <div className="font-bold">{summon.name}</div>
                  <div className="text-sm text-gray-400">
                    Lv.{summon.level} · {FIVE_ELEMENTS[summon.fiveElement]} · {summon.race}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-500">
            <i className="fas fa-info-circle mr-1"></i>
            请选择一个阵型
          </div>
        )}
      </div>
      
      {/* 错误提示 */}
      {errorMessage && (
        <div className="mb-6 bg-red-900 bg-opacity-30 border border-red-800 rounded-lg p-4">
          <p className="text-red-400">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {errorMessage}
          </p>
        </div>
      )}
      
      {/* 操作按钮 */}
      <div className="mt-8 flex justify-center space-x-4">
        <button
          className="px-6 py-3 rounded-lg text-lg font-bold bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200"
          onClick={onCancel}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          返回
        </button>
        
        <button
          className="px-6 py-3 rounded-lg text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white transition-colors duration-200"
          onClick={handleStartBattle}
        >
          <i className="fas fa-fire-alt mr-2"></i>
          开始战斗
        </button>
      </div>
    </div>
  );
};

export default TowerBattlePreparation;
