/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { soundManager } from './audio/soundManager';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { StatsModal } from './components/StatsModal';
import { TitleScreen } from './components/TitleScreen';
import { BIRD_SKINS } from './game/constants';
import { GameEngine } from './game/gameEngine';
import { BirdSkin, GameDifficulty, GameState, GameStats, GameTheme } from './types/game';

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);

  // React state synced with engine
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState<number>(0);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [volume, setVolume] = useState<number>(soundManager.getVolume());

  // Preferences & customization
  const [difficulty, setDifficulty] = useState<GameDifficulty>(() => {
    try {
      const saved = localStorage.getItem('flappy_difficulty');
      if (saved === 'easy' || saved === 'normal' || saved === 'hard') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'normal';
  });

  const [selectedSkin, setSelectedSkin] = useState<BirdSkin>(() => {
    try {
      const savedSkinId = localStorage.getItem('flappy_skin');
      const found = BIRD_SKINS.find((s) => s.id === savedSkinId);
      if (found) return found;
    } catch {
      // ignore
    }
    return BIRD_SKINS[0];
  });

  const [theme, setTheme] = useState<GameTheme>('day');
  const [autoTheme, setAutoTheme] = useState<boolean>(true);
  const [stats, setStats] = useState<GameStats>({
    highScore: 0,
    totalGames: 0,
    totalFlaps: 0,
    totalPipesPassed: 0,
    lastScore: 0,
  });

  const handleInitEngine = (engine: GameEngine) => {
    engine.setDifficulty(difficulty);
    engine.setSkin(selectedSkin);
    engine.setTheme(theme);
    engine.autoTheme = autoTheme;

    // Load initial stats
    setStats(engine.getStats());

    // Connect callbacks
    engine.onStateChange = (newState) => {
      setGameState(newState);
    };

    engine.onScoreChange = (newScore) => {
      setScore(newScore);
    };

    engine.onGameOver = (_finalScore, isNewHigh) => {
      setIsNewHighScore(isNewHigh);
      setStats(engine.getStats());
    };
  };

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scroll on space/arrows
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (gameState === 'START') {
          engineRef.current?.start();
        } else if (gameState === 'PLAYING') {
          engineRef.current?.flap();
        } else if (gameState === 'GAMEOVER') {
          engineRef.current?.restart();
        } else if (gameState === 'PAUSED') {
          engineRef.current?.resume();
        }
        return;
      }

      if (e.code === 'Enter') {
        if (gameState === 'START') {
          engineRef.current?.start();
        } else if (gameState === 'GAMEOVER') {
          engineRef.current?.restart();
        }
        return;
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameState === 'PLAYING') {
          engineRef.current?.pause();
        } else if (gameState === 'PAUSED') {
          engineRef.current?.resume();
        }
        return;
      }

      if (e.code === 'KeyM') {
        handleToggleMute();
        return;
      }
    };

    // Pause on window blur
    const handleBlur = () => {
      if (gameState === 'PLAYING') {
        engineRef.current?.pause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState]);

  const handleCanvasClick = () => {
    if (gameState === 'START') {
      engineRef.current?.start();
    } else if (gameState === 'PLAYING') {
      engineRef.current?.flap();
    }
  };

  const handleSelectSkin = (skin: BirdSkin) => {
    setSelectedSkin(skin);
    try {
      localStorage.setItem('flappy_skin', skin.id);
    } catch {
      // ignore
    }
    if (engineRef.current) {
      engineRef.current.setSkin(skin);
    }
  };

  const handleChangeDifficulty = (newDiff: GameDifficulty) => {
    setDifficulty(newDiff);
    try {
      localStorage.setItem('flappy_difficulty', newDiff);
    } catch {
      // ignore
    }
    if (engineRef.current) {
      engineRef.current.setDifficulty(newDiff);
    }
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleChangeVolume = (vol: number) => {
    soundManager.setVolume(vol);
    setVolume(vol);
    if (isMuted && vol > 0) {
      soundManager.toggleMute();
      setIsMuted(false);
    }
  };

  const handleSetTheme = (newTheme: GameTheme, auto: boolean) => {
    setTheme(newTheme);
    setAutoTheme(auto);
    if (engineRef.current) {
      engineRef.current.setTheme(newTheme);
      engineRef.current.autoTheme = auto;
    }
  };

  const handleResetStats = () => {
    try {
      localStorage.removeItem('flappy_stats');
      localStorage.removeItem('flappy_highscore');
    } catch {
      // ignore
    }
    if (engineRef.current) {
      setStats(engineRef.current.getStats());
    }
    setIsStatsOpen(false);
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 flex items-center justify-center overflow-hidden font-game">
      {/* Background ambient gradient glow */}
      <div className="absolute inset-0 bg-radial from-slate-900 to-slate-950 opacity-80 pointer-events-none" />

      {/* Retro Arcade Machine Bezel Container */}
      <div className="relative w-full h-full max-w-[440px] max-h-[720px] sm:rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_0_4px_#334155] border-0 sm:border-4 sm:border-slate-800 bg-black flex flex-col">
        {/* Game Area */}
        <div className="relative flex-1 w-full h-full overflow-hidden select-none">
          {/* Canvas Rendering Layer */}
          <GameCanvas
            engineRef={engineRef}
            onInitEngine={handleInitEngine}
            onCanvasClick={handleCanvasClick}
          />

          {/* HUD Overlay (Score, Perimeter Buttons) */}
          <GameHUD
            score={score}
            highScore={stats.highScore}
            gameState={gameState}
            difficulty={difficulty}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onPause={() => engineRef.current?.pause()}
          />

          {/* Title Screen Overlay */}
          {gameState === 'START' && (
            <TitleScreen
              onStart={() => engineRef.current?.start()}
              onOpenStats={() => setIsStatsOpen(true)}
              selectedSkin={selectedSkin}
              onSelectSkin={handleSelectSkin}
              difficulty={difficulty}
              onChangeDifficulty={handleChangeDifficulty}
              stats={stats}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
            />
          )}

          {/* Game Over Modal */}
          {gameState === 'GAMEOVER' && (
            <GameOverModal
              score={score}
              isNewHighScore={isNewHighScore}
              stats={stats}
              onRestart={() => engineRef.current?.restart()}
              onHome={() => {
                if (engineRef.current) {
                  engineRef.current.state = 'START';
                  setGameState('START');
                }
              }}
            />
          )}

          {/* Pause Modal */}
          {gameState === 'PAUSED' && (
            <PauseModal
              onResume={() => engineRef.current?.resume()}
              onRestart={() => engineRef.current?.restart()}
              onHome={() => {
                if (engineRef.current) {
                  engineRef.current.state = 'START';
                  setGameState('START');
                }
              }}
              theme={theme}
              autoTheme={autoTheme}
              onSetTheme={handleSetTheme}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              volume={volume}
              onChangeVolume={handleChangeVolume}
            />
          )}

          {/* Lifetime Stats Modal */}
          {isStatsOpen && (
            <StatsModal
              stats={stats}
              onClose={() => setIsStatsOpen(false)}
              onResetStats={handleResetStats}
            />
          )}
        </div>
      </div>
    </div>
  );
}
