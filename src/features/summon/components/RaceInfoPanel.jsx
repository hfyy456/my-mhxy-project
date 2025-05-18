import React from 'react';
import { raceConfig, getRaceTraits } from '@/config/raceConfig';

const RaceInfoPanel = ({ race }) => {
  if (!race || !raceConfig[race]) {
    return <div className="p-4 bg-slate-800 rounded-lg">未知种族</div>;
  }

  const raceData = raceConfig[race];
  const traits = getRaceTraits(race);
  
  // 获取种族加成显示值
  const getBonusDisplay = (value) => {
    if (!value) return '0%';
    return value > 0 ? `+${(value * 100).toFixed(0)}%` : `${(value * 100).toFixed(0)}%`;
  };
  
  return (
    <div className="flex flex-col bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
      <div className={`bg-${raceData.color} p-3 text-white font-bold text-center text-lg`}>
        {race}
      </div>
      
      <div className="p-4 space-y-4">
        <div>
          <p className="text-gray-300 text-sm">{raceData.description}</p>
        </div>
        
        <div>
          <h3 className="text-white font-medium mb-2">种族特性</h3>
          <div className="grid grid-cols-1 gap-2">
            {traits.map((trait, index) => (
              <div 
                key={index} 
                className="bg-slate-700 rounded px-3 py-2 text-sm text-white"
              >
                {trait}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-white font-medium mb-2">属性加成</h3>
          <div className="grid grid-cols-2 gap-2">
            {raceData.bonus && Object.entries(raceData.bonus).map(([attr, value]) => (
              <div 
                key={attr} 
                className="flex justify-between bg-slate-700 rounded px-3 py-2"
              >
                <span className="text-sm text-gray-300">
                  {attr === 'constitution' && '体质'}
                  {attr === 'strength' && '力量'}
                  {attr === 'agility' && '敏捷'}
                  {attr === 'intelligence' && '灵力'}
                  {attr === 'luck' && '幸运'}
                </span>
                <span className={`text-sm ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {getBonusDisplay(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceInfoPanel; 