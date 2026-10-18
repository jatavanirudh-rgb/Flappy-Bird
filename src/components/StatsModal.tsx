import React from 'react';
import { X, Trophy, Flame, Play, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { BIRD_SKINS } from '../game/constants';
import { GameStats } from '../types/game';

interface StatsModalProps {
  stats: GameStats;
  onClose: () => void;
  onResetStats: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose, onResetStats }) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-5 bg-slate-950/75 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-sm bg-slate-900 border-2 border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col text-slate-100 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-5">
          <Trophy className="w-6 h-6 text-amber-400" />
          <h2 className="font-arcade text-lg text-amber-400 tracking-wide">
            ARCADE STATS
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/10 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">High Score</span>
            <span className="font-arcade text-2xl text-amber-400 mt-1 tabular-nums">
              {stats.highScore}
            </span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/10 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Games Played</span>
            <span className="font-arcade text-2xl text-sky-400 mt-1 tabular-nums">
              {stats.totalGames}
            </span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/10 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Flaps</span>
            <span className="font-arcade text-xl text-emerald-400 mt-1 tabular-nums">
              {stats.totalFlaps}
            </span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/10 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Pipes Cleared</span>
            <span className="font-arcade text-xl text-purple-400 mt-1 tabular-nums">
              {stats.totalPipesPassed}
            </span>
          </div>
        </div>

        {/* Skins Unlock Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Skin Unlocks
            </span>
            <span className="text-[10px] text-slate-400">
              {BIRD_SKINS.filter((s) => stats.highScore >= s.unlockedAt).length} / {BIRD_SKINS.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {BIRD_SKINS.map((skin) => {
              const unlocked = stats.highScore >= skin.unlockedAt;
              return (
                <div
                  key={skin.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    unlocked
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                      : 'bg-slate-950/40 border-white/5 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-5 h-5 rounded-full border border-black/30 shadow-sm"
                      style={{ backgroundColor: skin.bodyColor }}
                    />
                    <span className="text-xs font-semibold">{skin.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    {unlocked ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">
                        Score {skin.unlockedAt} needed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-arcade text-xs rounded-xl font-bold shadow-md transition-all active:scale-95"
          >
            BACK
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset your local high score and stats?')) {
                soundManager.playClick();
                onResetStats();
              }
            }}
            className="py-2.5 px-3 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-[11px] rounded-xl font-medium transition-all"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
