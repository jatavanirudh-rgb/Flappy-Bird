import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Award, Share2, Check } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { getMedal } from '../game/constants';
import { GameStats } from '../types/game';

interface GameOverModalProps {
  score: number;
  isNewHighScore: boolean;
  stats: GameStats;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  isNewHighScore,
  stats,
  onRestart,
  onHome,
}) => {
  const medal = getMedal(score);
  const [copied, setCopied] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  // Trigger high score celebration & count up
  useEffect(() => {
    if (isNewHighScore && score > 0) {
      soundManager.playMedal();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#facc15', '#ef4444', '#38bdf8', '#22c55e', '#a855f7'],
        });
      } catch {
        // Confetti fallback
      }
    }

    // Score count-up
    let current = 0;
    const duration = Math.min(800, score * 30 + 100);
    const stepTime = Math.max(16, duration / Math.max(1, score));
    const timer = setInterval(() => {
      current += 1;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(current);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score, isNewHighScore]);

  const handleShare = () => {
    soundManager.playClick();
    const text = `I scored ${score} in Flappy Bird Arcade! Can you beat my high score of ${stats.highScore}? 🐦🕹️`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-5 bg-slate-950/65 backdrop-blur-sm pointer-events-auto animate-fade-in">
      {/* Title */}
      <div className="mb-4 text-center">
        <h2 className="font-arcade text-3xl sm:text-4xl text-rose-500 tracking-wider drop-shadow-[0_4px_0_#881337] text-stroke-1">
          GAME OVER
        </h2>
        {isNewHighScore && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 font-arcade text-xs rounded-full shadow-lg animate-bounce">
            ★ NEW HIGH SCORE! ★
          </div>
        )}
      </div>

      {/* Retro Scoreboard Card */}
      <div className="w-full max-w-xs bg-gradient-to-b from-amber-100 to-amber-200 border-4 border-amber-600 rounded-2xl p-5 shadow-[0_10px_25px_rgba(0,0,0,0.5)] text-slate-900 relative">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Medal Section */}
          <div className="flex flex-col items-center justify-center p-3 bg-amber-50/80 rounded-xl border-2 border-amber-300 min-w-[90px]">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">
              Medal
            </span>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-inner"
              style={{
                backgroundColor: medal.color,
                borderColor: medal.glowColor,
                boxShadow: medal.type !== 'none' ? `0 0 12px ${medal.glowColor}` : 'none',
              }}
            >
              {medal.type !== 'none' ? (
                <Award className="w-7 h-7 text-slate-900 drop-shadow" />
              ) : (
                <span className="text-xs text-slate-500 font-bold">-</span>
              )}
            </div>
            <span className="text-[9px] font-bold mt-1 text-slate-700 capitalize">
              {medal.type !== 'none' ? medal.type : 'None'}
            </span>
          </div>

          {/* Right: Scores */}
          <div className="flex-1 flex flex-col gap-3">
            {/* Score */}
            <div className="bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-300 text-right">
              <span className="text-[10px] uppercase font-bold text-amber-900 block text-left">
                Score
              </span>
              <span className="font-arcade text-2xl text-slate-900 tabular-nums">
                {animatedScore}
              </span>
            </div>

            {/* Best */}
            <div className="bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-300 text-right">
              <span className="text-[10px] uppercase font-bold text-amber-900 block text-left">
                Best
              </span>
              <span className="font-arcade text-2xl text-amber-600 tabular-nums">
                {stats.highScore}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-xs">
        <button
          onClick={() => {
            soundManager.playClick();
            onRestart();
          }}
          className="w-full py-3.5 px-6 bg-gradient-to-b from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 font-arcade text-sm rounded-xl shadow-[0_5px_0_#065f46,0_8px_15px_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-[0_0_0_#065f46] transition-all flex items-center justify-center gap-2 border-2 border-emerald-200"
        >
          <RotateCcw className="w-4 h-4 stroke-[2.5]" />
          <span>PLAY AGAIN</span>
        </button>

        <div className="flex items-center gap-2 w-full">
          <button
            onClick={() => {
              soundManager.playClick();
              onHome();
            }}
            className="flex-1 py-2.5 px-4 bg-slate-900/80 hover:bg-slate-800 text-white font-medium text-xs rounded-xl border border-white/20 hover:border-white/40 transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Menu & Skins</span>
          </button>

          <button
            onClick={handleShare}
            className="py-2.5 px-4 bg-slate-900/80 hover:bg-slate-800 text-amber-300 font-medium text-xs rounded-xl border border-white/20 hover:border-white/40 transition-all flex items-center justify-center gap-1.5 shadow-md"
            title="Share Score"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Keyboard Quick Hint */}
      <span className="mt-4 text-[11px] text-white/70 font-mono">
        Press <span className="font-bold text-amber-300">SPACE</span> or <span className="font-bold text-amber-300">ENTER</span> to restart
      </span>
    </div>
  );
};
