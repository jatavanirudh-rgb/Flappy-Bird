import React, { useEffect, useRef } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../game/constants';
import { GameEngine } from '../game/gameEngine';

interface GameCanvasProps {
  engineRef: React.MutableRefObject<GameEngine | null>;
  onInitEngine: (engine: GameEngine) => void;
  onCanvasClick: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engineRef,
  onInitEngine,
  onCanvasClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // High DPI scaling
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (ctx) {
      ctx.scale(dpr, dpr);
      // Crisp pixel rendering
      ctx.imageSmoothingEnabled = true;
    }

    const engine = new GameEngine(canvas);
    engineRef.current = engine;
    onInitEngine(engine);
    engine.startLoop();

    return () => {
      engine.destroy();
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Only primary button
    if (e.button !== 0) return;
    onCanvasClick();
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      style={{
        width: '100%',
        height: '100%',
        touchAction: 'none',
      }}
      className="block cursor-pointer select-none"
    />
  );
};
