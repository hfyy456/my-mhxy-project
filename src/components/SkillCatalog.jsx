import React from "react";
import { skillConfig, skillTypeConfig } from "../config";
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
      <div className="mt-12 bg-white rounded-xl shadow-xl p-6">
        <div className="flex border-b mb-6">
          <button
            className="px-4 py-2 border-b-2 border-primary text-primary font-medium"
            onClick={() => filterSkills("all")}
          >
            全部技能
          </button>
          {Object.keys(skillTypeConfig).map((type) => (
            <button
              key={type}
              className="px-4 py-2 border-b-2 border-transparent hover:text-gray-600 font-medium"
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
              className={`bg-gray-50 rounded-lg p-4 border-l-4 border-${
                skillTypeConfig[skill.type].color
              } card-hover`}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-800">{skill.name}</h3>
                <span
                  className={`px-2 py-0.5 text-xs bg-${
                    skillTypeConfig[skill.type].color
                  }/10 text-${skillTypeConfig[skill.type].color} rounded-full`}
                >
                  {skill.type}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{skill.description}</p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-500">
                  <i className="fa-solid fa-book"></i> 兽决类型:{" "}
                  {skill.bookType}
                </span>
                <span className="text-xs text-gray-500">
                  <i className="fa-solid fa-star"></i> 技能价值: {skill.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CommonModal>
  );
};

export default SkillCatalog;
