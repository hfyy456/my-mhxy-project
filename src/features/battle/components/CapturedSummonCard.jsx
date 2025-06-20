import React from 'react';

const images = import.meta.glob("@/assets/summons/*.png", { eager: true });

const getSummonSprite = (summonSourceId) => {
  const path = `/src/assets/summons/${summonSourceId}.png`;
  if (images[path]) {
    return images[path].default;
  }
  const defaultPath = '/src/assets/summons/default.png';
  return images[defaultPath]?.default || '';
};

const CapturedSummonCard = ({ summon, isClaimed, onClaim }) => {
  return (
    <div className={`bg-gray-700 p-3 rounded-lg flex items-center justify-between transition-all duration-300 ${isClaimed ? 'opacity-50' : ''}`}>
      <div className="flex items-center">
        <img src={getSummonSprite(summon.summonSourceId)} alt={summon.name} className="w-12 h-12 rounded-full mr-4 border-2 border-amber-400" />
        <div>
          <p className="font-bold text-lg">{summon.name}</p>
          <p className="text-sm text-gray-400">等级: {summon.level}</p>
        </div>
      </div>
      <button
        onClick={() => onClaim(summon.id)}
        disabled={isClaimed}
        className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ${
          isClaimed
            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {isClaimed ? '已认领' : '认领'}
      </button>
    </div>
  );
};

export default CapturedSummonCard; 