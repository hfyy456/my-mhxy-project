import React, { useState, useEffect } from "react";
import SummonInfo from "./components/SummonInfo";
import SkillCatalog from "./components/SkillCatalog";
import PetCatalog from "./components/PetCatalog";
import HistoryModal from "./components/HistoryModal";
import ResultRecordModal from "./components/ResultRecordModal";
import ConfirmDialog from "./components/ConfirmDialog";
import ToastContainer from "./components/ToastContainer";
import {
  petConfig,
  skillConfig,
  qualityConfig,
  probabilityConfig,
} from "./config";

const App = () => {
  const [summon, setSummon] = useState({
    name: "幽灵",
    quality: "普通",
    attack: 0,
    defense: 0,
    speed: 0,
    hp: 0,
    skillSet: [],
  });
  const [pendingSkill, setPendingSkill] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [resultRecordList, setResultRecordList] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isResultRecordModalOpen, setIsResultRecordModalOpen] = useState(false);
  const [isSkillCatalogModalOpen, setIsSkillCatalogModalOpen] = useState(false);
  const [isPetCatalogModalOpen, setIsPetCatalogModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const getRandomPet = () => {
    const pets = Object.values(petConfig);
    return pets[Math.floor(Math.random() * pets.length)];
  };

  const getRandomQuality = () => {
    return qualityConfig.qualities[
      Math.floor(Math.random() * qualityConfig.qualities.length)
    ];
  };

  const getRandomAttribute = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  const getRandomSkill = () => {
    return skillConfig[Math.floor(Math.random() * skillConfig.length)].name;
  };

  const refineMonster = () => {
    const pet = getRandomPet();
    const quality = getRandomQuality();
    const qualityIndex = qualityConfig.qualities.indexOf(quality);
    const multiplier = qualityConfig.attributeMultipliers[qualityIndex];

    const newSummon = {
      name: Object.keys(petConfig).find((key) => petConfig[key] === pet),
      quality,
      attack: Math.floor(
        getRandomAttribute(...pet.attributeRanges.attack) * multiplier
      ),
      defense: Math.floor(
        getRandomAttribute(...pet.attributeRanges.defense) * multiplier
      ),
      speed: Math.floor(
        getRandomAttribute(...pet.attributeRanges.speed) * multiplier
      ),
      hp: Math.floor(
        getRandomAttribute(...pet.attributeRanges.hp) * multiplier
      ),
      skillSet: [],
    };

    const initialSkillCount = getRandomAttribute(
      probabilityConfig.initialSkillCount.min,
      probabilityConfig.initialSkillCount.max
    );
    const shuffledSkills = [...pet.initialSkills].sort(
      () => 0.5 - Math.random()
    );
    newSummon.skillSet = shuffledSkills.slice(0, initialSkillCount);

    setHistoryList((prev) => [
      ...prev,
      {
        name: newSummon.name,
        quality: newSummon.quality,
        attack: newSummon.attack,
        defense: newSummon.defense,
        speed: newSummon.speed,
        hp: newSummon.hp,
        skills: [...newSummon.skillSet],
      },
    ]);

    setSummon(newSummon);
    showResult(
      `炼妖成功！召唤兽 ${newSummon.name} (${newSummon.quality}) 生成完毕。`,
      "success"
    );
  };

  const bookSkill = () => {
    const skill = getRandomSkill();
    const success = Math.random() < probabilityConfig.bookSuccessRate;

    if (!success) {
      showResult("打书失败，技能未添加", "error");
      return;
    }

    const skillInfo = skillConfig.find((s) => s.name === skill);
    const activeSkills = summon.skillSet.filter((skillName) => {
      const skill = skillConfig.find((s) => s.name === skillName);
      return skill?.mode === "主动";
    }).length;

    if (skillInfo.mode === "主动" && activeSkills >= 2) {
      showResult("打书失败：最多只能拥有2个主动技能。", "error");
      return;
    }

    if (summon.skillSet.includes(skill)) {
      showResult(`打书成功！但是技能“${skill}”已存在，无需添加。`, "info");
    } else if (summon.skillSet.length >= 12) {
      setPendingSkill(skill);
      setIsConfirmDialogOpen(true);
    } else {
      setSummon((prev) => ({
        ...prev,
        skillSet: [...prev.skillSet, skill],
      }));
      showResult(
        `打书成功！获得技能：${skill} (${skillInfo.description})`,
        "success"
      );
    }
  };

  const confirmReplaceSkill = (confirm) => {
    setIsConfirmDialogOpen(false);

    if (confirm && pendingSkill) {
      const index = Math.floor(Math.random() * summon.skillSet.length);
      const replaced = summon.skillSet[index];
      const newSkillSet = [...summon.skillSet];
      newSkillSet[index] = pendingSkill;

      setSummon((prev) => ({
        ...prev,
        skillSet: newSkillSet,
      }));

      const skillInfo = skillConfig.find((s) => s.name === pendingSkill);
      showResult(
        `打书成功！技能“${replaced}”被“${pendingSkill}”覆盖。 (${skillInfo.description})`,
        "success"
      );
    } else {
      showResult("操作取消，未替换任何技能。", "info");
    }

    setPendingSkill(null);
  };

  const showResult = (message, type) => {
    const now = new Date();
    const timeString = now.toLocaleString();
    let iconClass;
    if (type === "success") {
      iconClass = "fa-solid fa-check-circle text-green-500";
    } else if (type === "error") {
      iconClass = "fa-solid fa-times-circle text-red-500";
    } else {
      iconClass = "fa-solid fa-info-circle text-blue-500";
    }

    const newToast = {
      message,
      iconClass,
      timeString,
    };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast !== newToast));
    }, 3000);

    setResultRecordList((prev) => [...prev, message]);
  };

  const viewHistory = () => {
    setIsHistoryModalOpen(true);
  };

  const closeHistory = () => {
    setIsHistoryModalOpen(false);
  };

  const viewResultRecord = () => {
    setIsResultRecordModalOpen(true);
  };

  const closeResultRecord = () => {
    setIsResultRecordModalOpen(false);
  };

  const showSkillCatalogModal = () => {
    setIsSkillCatalogModalOpen(true);
  };

  const closeSkillCatalogModal = () => {
    setIsSkillCatalogModalOpen(false);
  };

  const showPetCatalogModal = () => {
    setIsPetCatalogModalOpen(true);
  };

  const closePetCatalogModal = () => {
    setIsPetCatalogModalOpen(false);
  };

  return (
    <div className="game-viewport">
      <main className="game-panel rounded-xl shadow-lg p-6 md:p-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-dark mb-4 flex items-center">
            <i className="fa-solid fa-paw text-primary mr-2" />
          </h2>
          <SummonInfo summon={summon} updateSummonInfo={() => {}} />
          <div className="flex justify-center mt-8 gap-4">
            <button
              id="refineBtn"
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 flex items-center"
              onClick={refineMonster}
            >
              <i className="fa-solid fa-flask mr-2"></i> 炼妖
            </button>
            <button
              id="bookBtn"
              className="px-6 py-3 bg-secondary hover:bg-secondary/90 text-white rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary/50 flex items-center"
              onClick={bookSkill}
            >
              <i className="fa-solid fa-book mr-2"></i> 打书
            </button>
          </div>
          <details className="mb-8">
            <summary className="text-gray-600 hover:text-gray-800 cursor-pointer">
              更多功能
            </summary>
            <div className="flex flex-wrap justify-center mt-4 gap-4">
              <button
                id="exportBtn"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center text-sm"
              >
                <i className="fa-solid fa-download mr-2"></i> 导出
              </button>
              <button
                id="historyBtn"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center text-sm"
                onClick={viewHistory}
              >
                <i className="fa-solid fa-history mr-2"></i> 历史
              </button>
              <button
                id="skillCatalogBtn"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center text-sm"
                onClick={showSkillCatalogModal}
              >
                <i className="fa-solid fa-book-open mr-2"></i> 技能图鉴
              </button>
              <button
                id="petCatalogBtn"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center text-sm"
                onClick={showPetCatalogModal}
              >
                <i className="fa-solid fa-book-open mr-2"></i> 宠物图鉴
              </button>
              <button
                id="resultRecordBtn"
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 flex items-center text-sm"
                onClick={viewResultRecord}
              >
                <i className="fa-solid fa-list mr-2"></i> 结果记录
              </button>
            </div>
          </details>
        </div>
      </main>
      <HistoryModal
        historyList={historyList}
        isOpen={isHistoryModalOpen}
        onClose={closeHistory}
      />
      <ResultRecordModal
        resultRecordList={resultRecordList}
        isOpen={isResultRecordModalOpen}
        onClose={closeResultRecord}
      />
      <div
        id="skillCatalogModal"
        className={`fixed inset-0 flex items-center justify-center z-50 bg-black/50 ${
          isSkillCatalogModalOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        } transition-opacity duration-300`}
      >
        <div
          className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto transform ${
          isSkillCatalogModalOpen ? 'scale-100' : 'scale-95'
        } transition-transform duration-300"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-dark">技能图鉴</h3>
            <button
              id="closeSkillCatalogBtn"
              className="text-gray-500 hover:text-gray-700 transition-colors"
              onClick={closeSkillCatalogModal}
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>
          <SkillCatalog />
        </div>
      </div>
      <div
        id="petCatalogModal"
        className={`fixed inset-0 flex items-center justify-center z-50 bg-black/50 ${
          isPetCatalogModalOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        } transition-opacity duration-300`}
      >
        <div
          className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto transform ${
          isPetCatalogModalOpen ? 'scale-100' : 'scale-95'
        } transition-transform duration-300"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-dark">宠物图鉴</h3>
            <button
              id="closePetCatalogBtn"
              className="text-gray-500 hover:text-gray-700 transition-colors"
              onClick={closePetCatalogModal}
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>
          <PetCatalog />
        </div>
      </div>
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={() => confirmReplaceSkill(true)}
        onCancel={() => confirmReplaceSkill(false)}
      />
      <ToastContainer toasts={toasts} />
      <footer className="py-4 text-center text-gray-500 text-sm bg-white shadow-md">
        <p>© 2025 梦幻西游炼妖打书模拟器 | 仅供娱乐</p>
      </footer>
    </div>
  );
};

export default App;
