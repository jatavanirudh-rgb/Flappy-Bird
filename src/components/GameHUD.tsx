import React, { useEffect, useState } from 'react';
import { Pause, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { GameDifficulty, GameState } from '../types/game';

interface GameHUDProps {
  score: number;
  highScore: number;
  gameState: GameState;
  difficulty: GameDifficulty;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  highScore,
  gameState,
  difficulty,
  isMuted,
  onToggleMute,
  onPause,
}) => {
  const [pop, setPop] = useState(false);

  // Score bounce effect on increment
  useEffect(() => {
    if (score > 0) {
      setPop(true);
      const timer = setTimeout(() => setPop(false), 160);
      return () => clearTimeout(timer);
    }
  }, [score]);

  if (gameState !== 'PLAYING') return null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none p-4 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="w-full flex items-start justify-between">
        {/* Left: Difficulty Badge & High Score */}
        <div className="flex flex-col gap-1 items-start">
          <div className="bg-black/45 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-full text-[10px] text-white/80 font-mono capitalize">
            {difficulty} mode
          </div>
          {highScore > 0 && (
            <div className="bg-black/35 backdrop-blur-sm border border-amber-400/30 px-2.5 py-0.5 rounded-full text-[10px] text-amber-300 font-mono">
              Best: {highScore}
            </div>
          )}
        </div>

        {/* Center: Large Arcade Score */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4">
          <div
            className={`font-arcade text-4xl sm:text-5xl text-white tracking-widest drop-shadow-[0_4px_0_#000] text-stroke-2 select-none tabular-nums transition-transform duration-150 ${
              pop ? 'scale-125 text-amber-300' : 'scale-100'
            }`}
          >
            {score}
          </div>
        </div>

        {/* Right: Controls (Pause & Mute) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleMute();
            }}
            className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md"
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            aria-label="Toggle mute"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onPause();
            }}
            className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md"
            title="Pause (P / Esc)"
            aria-label="Pause game"
          >
            <Pause className="w-4 h-4 fill-current text-amber-300" />
          </button>
        </div>
      </div>

      {/* Bottom Minimal Tap Hint on mobile/first play */}
      {score === 0 && (
        <div className="w-full text-center pb-2">
          <span className="text-xs text-white/80 font-mono bg-black/40 px-3 py-1 rounded-full border border-white/10 animate-pulse">
            Tap / Click / Space to Flap
          </span>
        </div>
      )}
    </div>
  );
};
