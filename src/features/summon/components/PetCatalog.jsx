/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:08:02
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-18 02:48:12
 */
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { petConfig } from "../../../config/config";
import CommonModal from "../../ui/components/CommonModal";
import { selectAllSummons, setCurrentSummon } from "../../../store/slices/summonSlice";
import { getAllRaces } from '@/config/raceConfig';
import { getPetTypeDisplayName, getRaceTypeDisplayName } from "@/config/uiTextConfig";

const PetCatalog = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const allSummons = useSelector(selectAllSummons);
  const summonsList = Object.values(allSummons || {});
  const petEntries = Object.entries(petConfig);
  const allRaces = getAllRaces();
  const [selectedRace, setSelectedRace] = useState('全部');

  const typeText = {
    法攻: "法术攻击型",
    物攻: "物理攻击型",
    速度: "速度型",
    生命: "防御型",
    辅助: "辅助型",
  };

  const handleSelectSummon = (summonId) => {
    dispatch(setCurrentSummon(summonId));
    onClose();
  };

  const filteredPets = selectedRace === '全部' 
    ? petEntries 
    : petEntries.filter(([_, pet]) => pet.race === selectedRace);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-10">
      <div className="bg-slate-800 rounded-lg w-full max-w-5xl max-h-[80vh] overflow-hidden shadow-xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">召唤兽图鉴</h2>
          <button
            className="text-slate-400 hover:text-white"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-700 bg-slate-700/50">
          <div className="flex flex-wrap gap-2">
            <button 
              className={`px-3 py-1 rounded-full text-sm ${selectedRace === '全部' ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}
              onClick={() => setSelectedRace('全部')}
            >
              全部
            </button>
            {allRaces.map(race => (
              <button 
                key={race}
                className={`px-3 py-1 rounded-full text-sm ${selectedRace === race ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}
                onClick={() => setSelectedRace(race)}
              >
                {race}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredPets.map(([petId, pet]) => (
            <div key={petId} className="bg-slate-700 rounded-lg p-2 shadow">
              <h3 className="text-lg font-semibold text-white mb-2">{pet.name}</h3>
              <div className="text-sm text-slate-300">
                <div className="mb-1">
                  <span className="font-medium text-slate-200">类型: </span>
                  <span className={`text-${pet.color}`}>{getPetTypeDisplayName(pet.type)}</span>
                </div>
                <div className="mb-1">
                  <span className="font-medium text-slate-200">种族: </span>
                  <span>{getRaceTypeDisplayName(pet.race)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400 line-clamp-3">{pet.background}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PetCatalog; 