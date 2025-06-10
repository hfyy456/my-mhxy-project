import React from 'react';
import { useSelector } from 'react-redux';
import { selectUnlockedFeatures } from '@/store/slices/enhancedHomesteadSlice';

const HomesteadActionBar = ({ 
  onOpenSummonSystem,
  onOpenInventory,
  onOpenPlayerInfo,
  onOpenSettings,
  onOpenWorldMap,
  onOpenQuestLog,
  onStartDungeonDemo,
  onOpenFormationSystem
}) => {
  const unlockedFeatures = useSelector(selectUnlockedFeatures);

  const actionButtons = [
    {
      id: 'summons',
      icon: '🐾',
      label: '召唤兽',
      onClick: onOpenSummonSystem,
      isUnlocked: true,
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'formation',
      icon: '⚔️',
      label: '阵型',
      onClick: onOpenFormationSystem,
      isUnlocked: true,
      gradient: 'from-red-500 to-orange-600'
    },
    {
      id: 'inventory',
      icon: '🎒',
      label: '背包',
      onClick: onOpenInventory,
      isUnlocked: true,
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      id: 'player',
      icon: '👤',
      label: '角色',
      onClick: onOpenPlayerInfo,
      isUnlocked: true,
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      id: 'shops',
      icon: '🏪',
      label: '商店',
      onClick: () => console.log('Open shops'),
      isUnlocked: unlockedFeatures?.shops?.length > 0,
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'crafting',
      icon: '🔨',
      label: '制作',
      onClick: () => console.log('Open crafting'),
      isUnlocked: unlockedFeatures?.craftingStations?.length > 0,
      gradient: 'from-red-500 to-pink-600'
    },
    {
      id: 'training',
      icon: '🏟️',
      label: '训练',
      onClick: () => console.log('Open training'),
      isUnlocked: unlockedFeatures?.trainingFacilities?.length > 0,
      gradient: 'from-yellow-500 to-orange-600'
    },
    {
      id: 'quests',
      icon: '📋',
      label: '任务',
      onClick: onOpenQuestLog,
      isUnlocked: unlockedFeatures?.questGivers?.length > 0,
      gradient: 'from-teal-500 to-green-600'
    },
    {
      id: 'worldmap',
      icon: '🗺️',
      label: '地图',
      onClick: onOpenWorldMap,
      isUnlocked: unlockedFeatures?.teleportPoints?.length > 0,
      gradient: 'from-violet-500 to-purple-600'
    },
    {
      id: 'dungeon',
      icon: '🏰',
      label: '副本',
      onClick: onStartDungeonDemo,
      isUnlocked: true,
      gradient: 'from-rose-500 to-fuchsia-600'
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: '设置',
      onClick: onOpenSettings,
      isUnlocked: true,
      gradient: 'from-gray-500 to-slate-600'
    }
  ];

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-30">
      <div className="bg-black/30 backdrop-blur-lg border border-white/20 rounded-2xl p-3 shadow-2xl">
        <div className="flex flex-col gap-2">
          {actionButtons.map(button => (
            <button
              key={button.id}
              onClick={button.onClick}
              disabled={!button.isUnlocked}
              className={`
                relative group flex flex-col items-center justify-center
                w-16 h-16 rounded-xl transition-all duration-300 overflow-hidden
                ${button.isUnlocked 
                  ? 'hover:scale-110 cursor-pointer transform-gpu' 
                  : 'cursor-not-allowed opacity-50'
                }
              `}
              title={button.isUnlocked ? button.label : `${button.label} (建造相关建筑解锁)`}
            >
              {/* 背景渐变 */}
              <div className={`
                absolute inset-0 rounded-xl transition-all duration-300
                ${button.isUnlocked 
                  ? `bg-gradient-to-br ${button.gradient} group-hover:shadow-lg group-hover:shadow-current/50`
                  : 'bg-gray-700/50'
                }
              `} />
              
              {/* 悬停光效 */}
              {button.isUnlocked && (
                <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/20 transition-all duration-300" />
              )}
              
              {/* 内容 */}
              <div className="relative z-10 flex flex-col items-center justify-center text-white">
                <span className="text-xl mb-1 group-hover:scale-110 transition-transform duration-300">
                  {button.icon}
                </span>
                <span className="text-xs font-semibold text-center leading-tight">
                  {button.label}
                </span>
              </div>
              
              {/* 锁定覆盖层 */}
              {!button.isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
                  <div className="text-center">
                    <span className="text-red-400 text-lg block mb-1">🔒</span>
                    <span className="text-red-300 text-xs">未解锁</span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* 侧边提示 */}
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-300/80">
            💡 建造解锁
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomesteadActionBar; 