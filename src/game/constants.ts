import { BirdSkin, GameDifficulty } from '../types/game';

// Logical canvas bounds (scaled to viewport while preserving aspect ratio)
export const CANVAS_WIDTH = 420;
export const CANVAS_HEIGHT = 680;
export const GROUND_HEIGHT = 100;

// Base physics parameters
export const PHYSICS = {
  normal: {
    gravity: 1200, // px / s²
    flapStrength: -390, // px / s
    basePipeSpeed: 160,
    maxPipeSpeed: 240,
    speedIncreasePerScore: 1.2,
    pipeGap: 138,
    minPipeGap: 120,
    pipeDistance: 215, // distance between consecutive pipes
  },
  easy: {
    gravity: 1050,
    flapStrength: -360,
    basePipeSpeed: 135,
    maxPipeSpeed: 190,
    speedIncreasePerScore: 0.8,
    pipeGap: 162,
    minPipeGap: 145,
    pipeDistance: 240,
  },
  hard: {
    gravity: 1350,
    flapStrength: -415,
    basePipeSpeed: 185,
    maxPipeSpeed: 280,
    speedIncreasePerScore: 1.8,
    pipeGap: 122,
    minPipeGap: 108,
    pipeDistance: 195,
  },
};

export const PIPE_WIDTH = 68;
export const PIPE_COLLAR_HEIGHT = 28;
export const PIPE_COLLAR_OVERHANG = 4;
export const MIN_PIPE_HEIGHT = 70;

// Bird dimensions and hitbox
export const BIRD = {
  radius: 17,
  hitboxRadius: 13.5, // Slightly forgiving for good game feel
  startX: 110,
  maxRotation: 75 * (Math.PI / 180), // 75 deg dive
  minRotation: -25 * (Math.PI / 180), // -25 deg flap up
  rotationSpeedUp: 10,
  rotationSpeedDown: 4,
};

// Bird Skins
export const BIRD_SKINS: BirdSkin[] = [
  {
    id: 'classic',
    name: 'Chirpy',
    bodyColor: '#facc15',
    bellyColor: '#fef08a',
    wingColor: '#eab308',
    beakColor: '#ea580c',
    outlineColor: '#451a03',
    eyeColor: '#1e293b',
    blushColor: '#fb7185',
    unlockedAt: 0,
  },
  {
    id: 'blaze',
    name: 'Blaze',
    bodyColor: '#ef4444',
    bellyColor: '#fde047',
    wingColor: '#dc2626',
    beakColor: '#f59e0b',
    outlineColor: '#450a0a',
    eyeColor: '#0f172a',
    blushColor: '#fca5a5',
    unlockedAt: 10,
  },
  {
    id: 'neon',
    name: 'Neon',
    bodyColor: '#06b6d4',
    bellyColor: '#a5f3fc',
    wingColor: '#0891b2',
    beakColor: '#ec4899',
    outlineColor: '#083344',
    eyeColor: '#020617',
    blushColor: '#67e8f9',
    unlockedAt: 20,
  },
  {
    id: 'shadow',
    name: 'Shadow',
    bodyColor: '#334155',
    bellyColor: '#94a3b8',
    wingColor: '#1e293b',
    beakColor: '#e11d48',
    outlineColor: '#020617',
    eyeColor: '#f8fafc',
    blushColor: '#fda4af',
    unlockedAt: 35,
  },
  {
    id: 'pip',
    name: 'Royale',
    bodyColor: '#8b5cf6',
    bellyColor: '#f472b6',
    wingColor: '#7c3aed',
    beakColor: '#fbbf24',
    outlineColor: '#2e1065',
    eyeColor: '#0f172a',
    blushColor: '#fbcfe8',
    unlockedAt: 50,
  },
];

// Themes
export const THEMES = {
  day: {
    name: 'Sunny Day',
    skyTop: '#38bdf8',
    skyBottom: '#bae6fd',
    cloudColor: 'rgba(255, 255, 255, 0.85)',
    sunColor: '#fde047',
    hillColor1: '#86efac',
    hillColor2: '#4ade80',
    groundTop: '#22c55e',
    groundBody: '#d97706',
    pipeLight: '#4ade80',
    pipeMain: '#22c55e',
    pipeDark: '#15803d',
    pipeBorder: '#14532d',
  },
  sunset: {
    name: 'Golden Sunset',
    skyTop: '#f97316',
    skyBottom: '#fde047',
    cloudColor: 'rgba(254, 215, 170, 0.75)',
    sunColor: '#fb923c',
    hillColor1: '#d97706',
    hillColor2: '#b45309',
    groundTop: '#eab308',
    groundBody: '#92400e',
    pipeLight: '#84cc16',
    pipeMain: '#65a30d',
    pipeDark: '#4d7c0f',
    pipeBorder: '#365314',
  },
  night: {
    name: 'Starry Night',
    skyTop: '#0f172a',
    skyBottom: '#1e293b',
    cloudColor: 'rgba(148, 163, 184, 0.3)',
    sunColor: '#f8fafc', // Moon
    hillColor1: '#334155',
    hillColor2: '#1e293b',
    groundTop: '#15803d',
    groundBody: '#78350f',
    pipeLight: '#22c55e',
    pipeMain: '#16a34a',
    pipeDark: '#14532d',
    pipeBorder: '#052e16',
  },
};

// Medals
export const getMedal = (score: number) => {
  if (score >= 50) {
    return {
      type: 'platinum' as const,
      title: 'Platinum Medal',
      color: '#e0e7ff',
      glowColor: '#818cf8',
    };
  }
  if (score >= 25) {
    return {
      type: 'gold' as const,
      title: 'Gold Medal',
      color: '#facc15',
      glowColor: '#eab308',
    };
  }
  if (score >= 10) {
    return {
      type: 'silver' as const,
      title: 'Silver Medal',
      color: '#cbd5e1',
      glowColor: '#94a3b8',
    };
  }
  if (score >= 5) {
    return {
      type: 'bronze' as const,
      title: 'Bronze Medal',
      color: '#d97706',
      glowColor: '#b45309',
    };
  }
  return {
    type: 'none' as const,
    title: 'No Medal',
    color: '#64748b',
    glowColor: 'transparent',
  };
};
