import React from "react";
import { useSelector } from "react-redux";
import { useSummonManager } from "@/hooks/useSummonManager";
import {
  selectUnlockProgress,
  selectQualityCounts,
} from "@/store/slices/summonCatalogSlice";
import { playerBaseConfig } from "@/config/character/playerConfig";
import { getQualityDisplayName } from "@/config/ui/uiTextConfig";
import { qualityConfig } from "@/config/config";

export const PlayerInfo = () => {
  // 使用OOP召唤兽系统
  const { allSummons } = useSummonManager();

  const playerLevel = 1; // TODO: playerLevel should come from playerSlice
  const playerExperience = 450; // TODO: playerExperience should come from playerSlice
  const experienceToNextLevel = 1000; // TODO: Get this from playerLevelConfig based on playerLevel
  const experiencePercentage =
    experienceToNextLevel > 0
      ? (playerExperience / experienceToNextLevel) * 100
      : 0;

  const maxSummons = playerBaseConfig.getMaxSummonsByLevel(playerLevel);
  const currentSummonCount = Object.keys(allSummons || {}).length; // 修复：使用OOP召唤兽数据
  const unlockProgress = useSelector(selectUnlockProgress);
  const qualityCounts = useSelector(selectQualityCounts);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 顶部标题区域 */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-100 mb-2">
          <i className="fas fa-user-circle text-blue-400/90 mr-3"></i>
          玩家信息
        </h2>
        <p className="text-slate-400">查看你的游戏进度和状态</p>
      </div>

      {/* 主要信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* 等级信息 */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-100">
              <i className="fas fa-star text-yellow-400/90 mr-2"></i>
              等级
            </h3>
            <span className="text-2xl font-bold text-yellow-400">
              {playerLevel}
            </span>
          </div>
          <div className="relative w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-400 to-yellow-500 opacity-90 rounded-full"
              style={{ width: `${experiencePercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer"></div>
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>
              经验值: {playerExperience}/{experienceToNextLevel}
            </span>
            <span>{experiencePercentage.toFixed(0)}%</span>
          </div>
        </div>

        {/* 召唤兽信息 */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-100">
              <i className="fas fa-paw text-purple-400/90 mr-2"></i>
              召唤兽
            </h3>
            <span className="text-2xl font-bold text-purple-400">
              {currentSummonCount}/{maxSummons}
            </span>
          </div>
          <div className="relative w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-400 to-purple-500 opacity-90 rounded-full"
              style={{ width: `${(currentSummonCount / maxSummons) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer"></div>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            当前召唤兽数量 / 最大可拥有数量
          </div>
        </div>

        {/* 图鉴进度 */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-100">
              <i className="fas fa-book text-green-400/90 mr-2"></i>
              图鉴进度
            </h3>
            <span className="text-2xl font-bold text-green-400">
              {unlockProgress.unlocked}/{unlockProgress.total}
            </span>
          </div>
          <div className="relative w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-500 opacity-90 rounded-full"
              style={{ width: `${unlockProgress.percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer"></div>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            已解锁召唤兽 / 总召唤兽数
          </div>
        </div>
      </div>

      {/* 详细信息卡片 */}
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/60">
        <h3 className="text-xl font-semibold mb-4 text-slate-100">
          <i className="fas fa-info-circle text-blue-400/90 mr-2"></i>
          详细信息
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">注册时间</div>
            <div className="text-slate-100">2024-03-20</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">在线时长</div>
            <div className="text-slate-100">12小时30分钟</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">最后登录</div>
            <div className="text-slate-100">2024-03-20 15:30</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">战斗次数</div>
            <div className="text-slate-100">128次</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">胜率</div>
            <div className="text-slate-100">75%</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">最高连胜</div>
            <div className="text-slate-100">8连胜</div>
          </div>
        </div>
      </div>

      {/* 品质统计卡片 */}
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/60 mt-6">
        <h3 className="text-xl font-semibold mb-4 text-slate-100">
          <i className="fas fa-chart-pie text-indigo-400/90 mr-2"></i>
          品质统计
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {qualityConfig.names.map((qualityKey) => {
            const count = qualityCounts[qualityKey] || 0;
            const qualityDisplayName = getQualityDisplayName(qualityKey);
            const colorClass = `bg-quality-${qualityKey}`;

            return (
              <div
                key={qualityKey}
                className="flex items-center justify-between p-3 bg-slate-800/60 rounded-lg border border-slate-700/60"
              >
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${colorClass} mr-2`}
                  ></div>
                  <span className="text-slate-300">{qualityDisplayName}</span>
                </div>
                <span className="text-slate-400">{count}只</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
