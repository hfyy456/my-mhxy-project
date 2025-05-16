import React from "react";
import { skillConfig, skillTypeConfig } from "../config/config";
import CommonModal from "./CommonModal";

const SkillCatalog = ({ isOpen, onClose }) => {
  const [filteredSkills, setFilteredSkills] = React.useState(
    Object.values(skillConfig)
  );

  const filterSkills = (type) => {
    if (type === "all") {
      setFilteredSkills(Object.values(skillConfig));
    } else {
      setFilteredSkills(
        Object.values(skillConfig).filter((skill) => skill.type === type)
      );
    }
  };

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} title="技能图鉴">
      <div className="mt-2 rounded-xl">
        <div className="flex border-b border-slate-700 mb-6">
          <button
            className="px-4 py-2 border-b-2 border-purple-500 text-purple-400 font-medium"
            onClick={() => filterSkills("all")}
          >
            全部技能
          </button>
          {Object.keys(skillTypeConfig).map((type) => (
            <button
              key={type}
              className="px-4 py-2 border-b-2 border-transparent text-gray-400 hover:text-purple-400 font-medium transition-colors duration-200"
              data-type={type}
              onClick={() => filterSkills(type)}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSkills.map((skill) => (
            <div
              key={skill.name}
              className={`bg-slate-700/80 rounded-lg p-4 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-purple-500/30 border-2 border-slate-600 hover:border-purple-500 card-hover relative overflow-hidden`}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-black opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-100 drop-shadow-md">{skill.name}</h3>
                  <span
                    className={`px-2 py-0.5 text-xs bg-${skillTypeConfig[skill.type]?.color || 'gray-500'}/30 text-gray-100 rounded-full border border-white/20`}
                  >
                    {skill.type}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-2 drop-shadow-sm h-10 overflow-y-auto">{skill.description}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-400 drop-shadow-sm">
                    <i className="fa-solid fa-book mr-1 text-purple-400"></i>兽决类型:{" "}
                    {skill.bookType || '未知'}
                  </span>
                  <span className="text-xs text-gray-400 drop-shadow-sm">
                    <i className="fa-solid fa-star mr-1 text-amber-400"></i>技能价值: {skill.value || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CommonModal>
  );
};

export default SkillCatalog;
