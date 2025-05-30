/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-17 03:08:02
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-26 04:26:20
 */
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { petConfig } from "@/config/pet/petConfig";
import CommonModal from "@/features/ui/components/CommonModal";
import {
  selectAllSummons,
  setCurrentSummon,
} from "@/store/slices/summonSlice";
import { getAllRaces } from "@/config/pet/raceConfig";
import {
  getPetTypeDisplayName,
  getRaceTypeDisplayName,
  getAttributeDisplayName,
  getFiveElementDisplayName
} from "@/config/ui/uiTextConfig";
import { skillConfig } from "@/config/skill/skillConfig";
import { ATTRIBUTE_TYPES, FIVE_ELEMENT_COLORS } from "@/config/enumConfig";

// 加载召唤兽图片
const images = import.meta.glob("@/assets/summons/*.png", {
  eager: true,
});

const PetCatalog = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const allSummons = useSelector(selectAllSummons);
  const summonsList = Object.values(allSummons || {});
  const petEntries = Object.entries(petConfig);
  const allRaces = getAllRaces();
  const [selectedRace, setSelectedRace] = useState("全部");

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

  const filteredPets =
    selectedRace === "全部"
      ? petEntries
      : petEntries.filter(([_, pet]) => pet.race === selectedRace);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-slate-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl shadow-purple-500/30 flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-purple-300">召唤兽图鉴</h2>
          <button
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-full"
            onClick={onClose}
            aria-label="Close catalog"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-4 border-b border-slate-700 bg-slate-700/60">
          <div className="flex flex-wrap gap-2 items-center">
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedRace === "全部"
                  ? "bg-purple-600 hover:bg-purple-500 text-white shadow-md"
                  : "bg-slate-600 text-slate-300 hover:bg-slate-500 hover:text-white"
              }`}
              onClick={() => setSelectedRace("全部")}
            >
              全部
            </button>
            {allRaces.map((race) => (
              <button
                key={race}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedRace === race
                    ? "bg-purple-600 hover:bg-purple-500 text-white shadow-md"
                    : "bg-slate-600 text-slate-300 hover:bg-slate-500 hover:text-white"
                }`}
                onClick={() => setSelectedRace(race)}
              >
                {getRaceTypeDisplayName(race)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPets.length === 0 && (
            <div className="col-span-full text-center py-10">
              <p className="text-slate-400 text-lg">未找到符合条件的召唤兽。</p>
            </div>
          )}
          {filteredPets.map(([petId, pet]) => {
            const petInfo = petConfig[petId];
            const imageUrl =
              (petId && images[`/src/assets/summons/${petId}.png`]?.default) ||
              images["/src/assets/summons/default.png"]?.default;

            const typeColorClass = petInfo.color
              ? `border-${petInfo.color}`
              : "border-slate-500";

            return (
              <div
                key={petId}
                className="group bg-slate-700/70 rounded-lg p-4 shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 flex flex-col border border-slate-600 hover:border-purple-400/80"
              >
                <div className="flex items-start mb-3">
                  <div
                    className={`w-24 h-24 md:w-28 md:h-28 flex-shrink-0 mr-4 bg-slate-600/50 rounded-md flex items-center justify-center overflow-hidden border-2 ${typeColorClass} transition-colors duration-300`}
                  >
                    <img
                      src={imageUrl}
                      alt={petInfo.name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        if (images["/src/assets/summons/default.png"]?.default) {
                          e.target.src =
                            images["/src/assets/summons/default.png"].default;
                        }
                      }}
                    />
                  </div>

                  <div className="flex-grow">
                    <h3
                      className="text-lg md:text-xl font-semibold text-purple-300 mb-1.5 truncate"
                      title={petInfo.name}
                    >
                      {petInfo.name}
                    </h3>
                    <div>
                      <div className="mb-1.5"> 
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-${petInfo.color?.split('-')[0]}-600 text-${petInfo.color?.split('-')[0]}-100`}>{getPetTypeDisplayName(petInfo.type)}</span>
                      </div>
                      <div className="mb-1.5">
                        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-600 text-slate-100">{getRaceTypeDisplayName(petInfo.race)}</span>
                      </div>
                      <div>
                        <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${FIVE_ELEMENT_COLORS[petInfo.fiveElement] || 'bg-gray-500 text-white'}`}>{getFiveElementDisplayName(petInfo.fiveElement)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col flex-grow">
                  <p className="text-xs text-slate-400 line-clamp-3 mb-2 flex-shrink-0">
                    {petInfo.background}
                  </p>

                  <div className="mt-auto pt-3 border-t border-slate-600/70 text-xs text-slate-300 space-y-2">
                    <div className="mb-1.5">
                      <h5 className="text-xs font-semibold text-slate-400 mb-0.5">
                        成长率:
                      </h5>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        {Object.entries(petInfo.growthRates).map(
                          ([attrEnum, value]) => (
                            <div
                              key={attrEnum}
                              className="flex justify-between"
                            >
                              <span className="text-slate-400">
                                {getAttributeDisplayName(attrEnum) || attrEnum}:
                              </span>
                              <span className="font-medium text-white">
                                {(value || 0).toFixed(3)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="mb-1.5">
                      <h5 className="text-xs font-semibold text-slate-400 mb-0.5">
                        初始属性范围:
                      </h5>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        {Object.entries(petInfo.basicAttributeRanges).map(
                          ([attrEnum, range]) => (
                            <div
                              key={attrEnum}
                              className="flex justify-between"
                            >
                              <span className="text-slate-400">
                                {getAttributeDisplayName(attrEnum) || attrEnum}:
                              </span>
                              <span className="font-medium text-white">
                                {range.join("-")}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="mt-1">
                      <h5 className="text-xs font-semibold text-slate-400 mb-1">
                        初始技能:
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {petInfo.initialSkills.map((skillId) => {
                          const skill = skillConfig.find(
                            (s) => s.id === skillId
                          );
                          return (
                            <span
                              key={skillId}
                              className="px-2 py-0.5 text-xs font-medium rounded-full bg-sky-700 text-sky-100 whitespace-nowrap"
                            >
                              {skill ? skill.name : skillId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PetCatalog;
