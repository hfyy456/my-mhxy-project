import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectNpcById, startInteraction } from '@/store/slices/npcSlice';

const NpcPanel = ({ npcId, onClose }) => {
  const dispatch = useDispatch();
  const npc = useSelector(selectNpcById(npcId));

  if (!npc) {
    return (
      <div className="p-4 text-white">
        <p>加载NPC信息失败或NPC不存在。</p>
      </div>
    );
  }

  const handleInteract = () => {
    dispatch(startInteraction({ npcId: npc.id }));
    onClose();
  };

  return (
    <div className="p-6 bg-slate-800 text-slate-100 rounded-lg shadow-xl max-w-md mx-auto">
      <div className="flex items-center justify-center mb-4">
        <h2 className="text-2xl font-bold text-sky-400">{npc.name}</h2>
      </div>

      {npc.avatar && (
        <div className="mb-4 flex justify-center">
          <img
            src={npc.avatar}
            alt={`${npc.name} 的头像`}
            className="w-32 h-32 rounded-full object-cover border-4 border-slate-700"
          />
        </div>
      )}

      {npc.description && (
        <p className="text-slate-300 mb-4 leading-relaxed">
          {npc.description}
        </p>
      )}

      {npc.dialogueGreeting && (
         <p className="text-slate-400 italic mb-4">"{npc.dialogueGreeting}"</p>
      )}

      {npc.stats && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h3 className="text-lg font-semibold text-sky-500 mb-2 text-center">基本属性</h3>
          <ul className="space-y-1 text-sm">
            {Object.entries(npc.stats).map(([key, value]) => (
              <li key={key} className="flex justify-between">
                <span className="text-slate-400">{npc.statNames?.[key] || key}:</span>
                <span className="text-slate-200">{value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex space-x-3">
        <button
          onClick={handleInteract}
          className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-medium py-2 px-4 rounded-md transition-colors duration-150 flex items-center justify-center"
        >
          <i className="fas fa-comments mr-2"></i> 对话
        </button>
      </div>
    </div>
  );
};

export default NpcPanel; 