import React, { useState, useMemo } from 'react';

const VerticalSummonSelector = ({ 
  summons = [], 
  onSummonSelect, 
  selectedCell,
  formationSummons = [] 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('全部');

  // 过滤召唤兽
  const filteredSummons = useMemo(() => {
    if (!summons) return [];
    
    return summons.filter(summon => {
      const matchesSearch = !searchTerm || 
        summon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summon.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === '全部' || summon.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [summons, searchTerm, typeFilter]);

  // 获取所有召唤兽类型
  const summonTypes = useMemo(() => {
    if (!summons) return [];
    const types = [...new Set(summons.map(s => s.type))];
    return ['全部', ...types];
  }, [summons]);

  // 检查召唤兽是否已上阵
  const isSummonInFormation = (summonId) => {
    return formationSummons.includes(summonId);
  };

  // 获取品质对应的样式
  const getQualityStyle = (quality) => {
    const styles = {
      normal: 'from-gray-500 to-gray-600',
      good: 'from-green-500 to-green-600', 
      rare: 'from-blue-500 to-blue-600',
      epic: 'from-purple-500 to-purple-600',
      legendary: 'from-orange-500 to-orange-600'
    };
    return styles[quality] || styles.normal;
  };

  const handleSummonClick = (summon) => {
    if (onSummonSelect) {
      onSummonSelect(summon);
    }
  };

  const handleDragStart = (e, summon) => {
    e.dataTransfer.setData('application/json', JSON.stringify(summon));
    e.dataTransfer.effectAllowed = 'copy';
    // 添加拖拽的视觉反馈
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 搜索和过滤栏 */}
      <div className="flex gap-2 mb-3 px-1 flex-shrink-0">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="搜索召唤兽..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 pl-8 bg-slate-700 text-white text-sm rounded border border-slate-600 focus:border-blue-400 outline-none"
          />
          <svg className="absolute left-2.5 top-2 w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-2 py-1.5 bg-slate-700 text-white text-sm rounded border border-slate-600 focus:border-blue-400 outline-none"
        >
          {summonTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* 召唤兽网格 - 可滚动区域 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0  scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        <div className="grid grid-cols-3 gap-3 p-3 pb-6">
          {filteredSummons.map(summon => {
            const isInFormation = isSummonInFormation(summon.id);
            
            return (
              <div
                key={summon.id}
                className={`
                  relative bg-slate-800 rounded-lg p-2 border transition-all duration-200 cursor-pointer
                  ${isInFormation 
                    ? 'border-green-400 bg-green-400/10' 
                    : 'border-slate-600 hover:border-slate-500'
                  }
                  hover:bg-slate-700 hover:scale-105 hover:z-10
                `}
                style={{
                  transformOrigin: 'center center'
                }}
                onDoubleClick={() => handleSummonClick(summon)}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, summon)}
                onDragEnd={handleDragEnd}
              >
                {/* 上阵状态标识 */}
                {isInFormation && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center z-10">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {/* 召唤兽头像 */}
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getQualityStyle(summon.quality)} flex items-center justify-center mb-2 mx-auto`}>
                  <span className="text-white font-bold text-sm">
                    {summon.name.charAt(0)}
                  </span>
                </div>
                
                {/* 召唤兽信息 */}
                <div className="text-center">
                  <div className="text-white text-xs font-medium truncate mb-1">
                    {summon.name}
                  </div>
                  <div className="text-slate-400 text-xs mb-1">
                    {summon.type}
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-400">Lv.{summon.level}</span>
                    <span className="text-orange-400">{summon.power}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 滚动提示 */}
        {filteredSummons.length > 9 && (
          <div className="text-center py-2 text-xs text-slate-500">
            共 {filteredSummons.length} 个召唤兽 • 可滚动查看更多
          </div>
        )}
      </div>

      {/* 底部提示信息 - 固定位置 */}
      <div className="flex-shrink-0 mt-3">
    
        {filteredSummons.length === 0 && (
          <div className="text-center text-slate-400 py-4">
            暂无召唤兽
          </div>
        )}
      </div>
    </div>
  );
};

export default VerticalSummonSelector; 