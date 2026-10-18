import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Sun, Moon, Sunset } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { GameTheme } from '../types/game';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  theme: GameTheme;
  autoTheme: boolean;
  onSetTheme: (theme: GameTheme, auto: boolean) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  volume: number;
  onChangeVolume: (vol: number) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  theme,
  autoTheme,
  onSetTheme,
  isMuted,
  onToggleMute,
  volume,
  onChangeVolume,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-5 bg-slate-950/70 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-xs bg-slate-900/90 border-2 border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Title */}
        <h2 className="font-arcade text-2xl text-amber-400 mb-6 drop-shadow-[0_2px_0_#92400e] text-stroke-1">
          PAUSED
        </h2>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full mb-6">
          <button
            onClick={() => {
              soundManager.playClick();
              onResume();
            }}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-arcade text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 border border-emerald-300 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onRestart();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Run</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onHome();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Title Screen</span>
          </button>
        </div>

        {/* Audio Setting */}
        <div className="w-full bg-slate-950/60 rounded-xl p-3 border border-white/10 mb-3 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-300 font-medium">Sound Effects</span>
            <button
              onClick={() => {
                soundManager.playClick();
                onToggleMute();
              }}
              className="text-white hover:text-amber-300 p-1"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        {/* Environment Theme Toggle */}
        <div className="w-full bg-slate-950/60 rounded-xl p-3 border border-white/10 text-left">
          <span className="text-xs text-slate-300 font-medium block mb-2">Environment</span>
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            <button
              onClick={() => onSetTheme('day', true)}
              className={`py-1.5 px-1 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                autoTheme
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <span>Auto</span>
            </button>
            <button
              onClick={() => onSetTheme('day', false)}
              className={`py-1.5 px-1 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                !autoTheme && theme === 'day'
                  ? 'bg-sky-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Day</span>
            </button>
            <button
              onClick={() => onSetTheme('sunset', false)}
              className={`py-1.5 px-1 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                !autoTheme && theme === 'sunset'
                  ? 'bg-orange-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Sunset className="w-3.5 h-3.5" />
              <span>Sunset</span>
            </button>
            <button
              onClick={() => onSetTheme('night', false)}
              className={`py-1.5 px-1 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                !autoTheme && theme === 'night'
                  ? 'bg-indigo-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Night</span>
            </button>
          </div>
        </div>

        <p className="mt-4 text-[10px] text-slate-400 font-mono">
          Press ESC or P to resume
        </p>
      </div>
    </div>
  );
};
