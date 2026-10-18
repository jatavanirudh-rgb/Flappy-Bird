import React from 'react';
import { Volume2, VolumeX, BarChart2, Sparkles, Lock, Trophy } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { BIRD_SKINS } from '../game/constants';
import { BirdSkin, GameDifficulty, GameStats } from '../types/game';

interface TitleScreenProps {
  onStart: () => void;
  onOpenStats: () => void;
  selectedSkin: BirdSkin;
  onSelectSkin: (skin: BirdSkin) => void;
  difficulty: GameDifficulty;
  onChangeDifficulty: (diff: GameDifficulty) => void;
  stats: GameStats;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenStats,
  selectedSkin,
  onSelectSkin,
  difficulty,
  onChangeDifficulty,
  stats,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-6 pointer-events-auto">
      {/* Top Header Icons */}
      <div className="w-full flex items-center justify-between max-w-sm">
        {/* High Score Badge */}
        <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-md border border-amber-400/40 px-3.5 py-1.5 rounded-full shadow-lg">
          <Trophy className="w-4 h-4 text-amber-400 drop-shadow animate-pulse" />
          <span className="text-xs uppercase tracking-wider text-amber-200 font-bold">Best</span>
          <span className="font-arcade text-amber-300 text-sm">{stats.highScore}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenStats();
            }}
            className="w-10 h-10 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/20 hover:border-white/50 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md"
            title="Lifetime Stats"
            aria-label="View lifetime statistics"
          >
            <BarChart2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleMute();
            }}
            className="w-10 h-10 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/20 hover:border-white/50 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md"
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            aria-label="Toggle mute"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Title Lockup */}
      <div className="flex flex-col items-center text-center my-auto">
        {/* Retro Title with 3D Pop Shadow */}
        <div className="relative group cursor-pointer mb-2" onClick={onStart}>
          <h1 className="font-arcade text-3xl sm:text-4xl text-amber-400 tracking-wider drop-shadow-[0_4px_0_#92400e] text-stroke-1 filter select-none transition-transform group-hover:scale-105">
            FLAPPY BIRD
          </h1>
          <div className="text-[10px] tracking-widest text-emerald-300 uppercase font-semibold mt-1 bg-emerald-950/40 border border-emerald-500/30 px-3 py-0.5 rounded-full inline-block">
            Classic 2D Arcade
          </div>
        </div>

        {/* Start Game CTA Button */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onStart();
            }}
            className="group relative px-8 py-4 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 font-arcade text-base sm:text-lg rounded-2xl shadow-[0_6px_0_#b45309,0_10px_20px_rgba(0,0,0,0.35)] active:translate-y-1.5 active:shadow-[0_0_0_#b45309] transition-all flex items-center gap-3 border-2 border-amber-200"
          >
            <Sparkles className="w-5 h-5 text-amber-900 animate-spin" style={{ animationDuration: '4s' }} />
            <span>PLAY GAME</span>
            <Sparkles className="w-5 h-5 text-amber-900 animate-spin" style={{ animationDuration: '4s' }} />
          </button>

          <p className="text-xs text-white/90 font-medium tracking-wide bg-black/40 px-3.5 py-1.5 rounded-full border border-white/10 shadow-sm animate-pulse">
            Press <span className="font-bold text-amber-300 font-mono">SPACE</span>, Click, or Tap to Fly!
          </p>
        </div>

        {/* Bird Skins Selector */}
        <div className="mt-8 w-full max-w-xs bg-slate-950/60 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Select Bird
            </span>
            <span className="text-[10px] text-amber-300 font-medium">
              {selectedSkin.name}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {BIRD_SKINS.map((skin) => {
              const isLocked = stats.highScore < skin.unlockedAt;
              const isSelected = selectedSkin.id === skin.id;

              return (
                <button
                  key={skin.id}
                  onClick={() => {
                    if (!isLocked) {
                      soundManager.playClick();
                      onSelectSkin(skin);
                    }
                  }}
                  disabled={isLocked}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-amber-400/25 border-2 border-amber-400 shadow-md scale-105'
                      : isLocked
                      ? 'bg-slate-900/40 border border-slate-800 opacity-60 cursor-not-allowed'
                      : 'bg-slate-900/80 border border-white/10 hover:border-white/30 hover:scale-105'
                  }`}
                  title={
                    isLocked
                      ? `Locked: Reach score ${skin.unlockedAt} to unlock`
                      : skin.name
                  }
                >
                  {/* Skin Avatar Preview */}
                  <div
                    className="w-6 h-6 rounded-full relative flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: skin.bodyColor }}
                  >
                    <div
                      className="w-2.5 h-2 rounded-full absolute -right-0.5"
                      style={{ backgroundColor: skin.beakColor }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-white absolute top-1 right-1 flex items-center justify-center"
                    >
                      <div className="w-1 h-1 rounded-full bg-slate-900" />
                    </div>
                  </div>

                  {isLocked && (
                    <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="mt-4 flex items-center gap-1.5 bg-slate-950/50 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs">
          {(['easy', 'normal', 'hard'] as GameDifficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => {
                soundManager.playClick();
                onChangeDifficulty(diff);
              }}
              className={`px-3 py-1 rounded-lg capitalize font-medium transition-all ${
                difficulty === diff
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Controls Hint Footer */}
      <div className="text-[11px] text-white/70 tracking-wide font-mono bg-black/50 px-3 py-1 rounded-full border border-white/10 shadow-sm">
        SPACE Flap · P Pause · M Mute
      </div>
    </div>
  );
};
