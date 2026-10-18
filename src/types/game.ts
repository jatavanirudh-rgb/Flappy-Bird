export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type GameTheme = 'day' | 'sunset' | 'night';

export type GameDifficulty = 'normal' | 'easy' | 'hard';

export interface BirdSkin {
  id: string;
  name: string;
  bodyColor: string;
  bellyColor: string;
  wingColor: string;
  beakColor: string;
  outlineColor: string;
  eyeColor: string;
  blushColor: string;
  unlockedAt: number; // score needed to unlock
}

export interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number; // y coordinate where bottom pipe starts
  passed: boolean;
  width: number;
  gap: number;
  highlighted?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation?: number;
  vRot?: number;
  type: 'feather' | 'sparkle' | 'dust' | 'ring';
}

export interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
}

export interface Hill {
  x: number;
  radius: number;
  color: string;
}

export interface GameStats {
  highScore: number;
  totalGames: number;
  totalFlaps: number;
  totalPipesPassed: number;
  lastScore: number;
}

export interface MedalInfo {
  type: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
  title: string;
  color: string;
  glowColor: string;
}
