import { soundManager } from '../audio/soundManager';
import {
  BirdSkin,
  GameDifficulty,
  GameState,
  GameStats,
  GameTheme,
  Particle,
  Pipe,
} from '../types/game';
import {
  BIRD,
  BIRD_SKINS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GROUND_HEIGHT,
  MIN_PIPE_HEIGHT,
  PHYSICS,
  PIPE_WIDTH,
} from './constants';
import { GameRenderer } from './renderer';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: GameRenderer;

  // Game state
  public state: GameState = 'START';
  public score: number = 0;
  public difficulty: GameDifficulty = 'normal';
  public theme: GameTheme = 'day';
  public autoTheme: boolean = true;
  public skin: BirdSkin = BIRD_SKINS[0];

  // Physics state
  public birdY: number = CANVAS_HEIGHT / 2 - 20;
  public birdVy: number = 0;
  public birdRotation: number = 0;
  public birdSquash: number = 1.0;
  public wingPhase: number = 0;

  // World objects
  public pipes: Pipe[] = [];
  public particles: Particle[] = [];
  private pipeDistanceCounter: number = 0;

  // Juice & FX
  private shakeTime: number = 0;
  private shakeIntensity: number = 0;
  private flashAlpha: number = 0;
  private hitstopTimer: number = 0;
  private floatPhase: number = 0;

  // Loop control
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private isDestroyed: boolean = false;

  // Callbacks for React state
  public onStateChange?: (state: GameState) => void;
  public onScoreChange?: (score: number) => void;
  public onGameOver?: (score: number, isNewHighScore: boolean) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Could not get 2D canvas context');
    }
    this.ctx = context;
    this.renderer = new GameRenderer(this.ctx);

    this.resetBird();
  }

  public startLoop() {
    this.lastTime = performance.now();
    const loop = (currentTime: number) => {
      if (this.isDestroyed) return;

      const rawDt = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;
      // Clamp dt to prevent tunneling on frame drop
      const dt = Math.min(rawDt, 0.05);

      this.update(dt, currentTime / 1000);
      this.render(currentTime / 1000);

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  public setSkin(skin: BirdSkin) {
    this.skin = skin;
  }

  public setDifficulty(diff: GameDifficulty) {
    this.difficulty = diff;
  }

  public setTheme(theme: GameTheme) {
    this.theme = theme;
  }

  private resetBird() {
    this.birdY = CANVAS_HEIGHT / 2 - 40;
    this.birdVy = 0;
    this.birdRotation = 0;
    this.birdSquash = 1.0;
    this.wingPhase = 0;
    this.floatPhase = 0;
  }

  public start() {
    this.resetBird();
    this.pipes = [];
    this.particles = [];
    this.score = 0;
    this.pipeDistanceCounter = PHYSICS[this.difficulty].pipeDistance * 0.7; // spawn first pipe reasonably soon
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.flashAlpha = 0;
    this.hitstopTimer = 0;

    if (this.autoTheme) {
      this.theme = 'day';
    }

    this.state = 'PLAYING';
    this.onStateChange?.(this.state);
    this.onScoreChange?.(0);

    // Initial flap to launch into action
    this.flap();
  }

  public restart() {
    this.start();
  }

  public pause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.onStateChange?.(this.state);
    }
  }

  public resume() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      this.onStateChange?.(this.state);
    }
  }

  public togglePause() {
    if (this.state === 'PLAYING') {
      this.pause();
    } else if (this.state === 'PAUSED') {
      this.resume();
    }
  }

  public flap() {
    if (this.state === 'START') {
      this.start();
      return;
    }

    if (this.state !== 'PLAYING') return;

    const phys = PHYSICS[this.difficulty];
    this.birdVy = phys.flapStrength;
    this.birdSquash = 1.28; // Stretch vertically
    soundManager.playFlap();

    // Spawn cute feather particles behind bird
    this.spawnFeathers(BIRD.startX - 6, this.birdY + 2);

    // Track total flaps in lifetime stats
    this.incrementStat('totalFlaps');
  }

  private update(dt: number, currentTime: number) {
    // 1. Camera shake decay
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime <= 0) {
        this.shakeIntensity = 0;
      }
    }

    // 2. Screen flash decay
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 3.5);
    }

    // 3. Update particles in all states
    this.updateParticles(dt);

    // 4. Update according to state
    if (this.state === 'START') {
      // Gentle floating sine wave on start screen
      this.floatPhase += dt * 3.8;
      this.birdY = CANVAS_HEIGHT / 2 - 35 + Math.sin(this.floatPhase) * 12;
      this.birdRotation = Math.sin(this.floatPhase) * 0.12;
      this.wingPhase += dt * 7;
      // Scroll background slowly
      this.renderer.updateOffsets(30, dt);
      return;
    }

    if (this.state === 'PAUSED') {
      return;
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return; // Freeze movement briefly for punchy impact feel
    }

    const phys = PHYSICS[this.difficulty];
    const currentSpeed = Math.min(
      phys.maxPipeSpeed,
      phys.basePipeSpeed + this.score * phys.speedIncreasePerScore
    );

    // Dynamic Day/Night/Sunset progression
    if (this.autoTheme) {
      if (this.score >= 30) {
        this.theme = 'night';
      } else if (this.score >= 15) {
        this.theme = 'sunset';
      } else {
        this.theme = 'day';
      }
    }

    if (this.state === 'PLAYING') {
      // Update background scrolling
      this.renderer.updateOffsets(currentSpeed, dt);

      // Bird physics: gravity
      this.birdVy += phys.gravity * dt;
      this.birdY += this.birdVy * dt;

      // Bird rotation towards vertical velocity
      if (this.birdVy < 0) {
        // Tilting upward quickly
        const targetRot = Math.max(BIRD.minRotation, (this.birdVy / -phys.flapStrength) * BIRD.minRotation);
        this.birdRotation += (targetRot - this.birdRotation) * BIRD.rotationSpeedUp * dt;
        this.wingPhase += dt * 14; // Flap vigorously when ascending
      } else {
        // Tilting downward towards dive
        const diveFactor = Math.min(1, this.birdVy / 600);
        const targetRot = diveFactor * BIRD.maxRotation;
        this.birdRotation += (targetRot - this.birdRotation) * BIRD.rotationSpeedDown * dt;
        this.wingPhase += dt * 4; // Gentle flutter or glide when falling
      }

      // Bird squash & stretch spring back
      this.birdSquash += (1.0 - this.birdSquash) * 10 * dt;

      // Pipe spawning based on distance traveled
      this.pipeDistanceCounter += currentSpeed * dt;
      if (this.pipeDistanceCounter >= phys.pipeDistance) {
        this.pipeDistanceCounter = 0;
        this.spawnPipe();
      }

      // Update pipes
      const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
      for (let i = this.pipes.length - 1; i >= 0; i--) {
        const pipe = this.pipes[i];
        pipe.x -= currentSpeed * dt;

        // Scoring check
        if (!pipe.passed && pipe.x + pipe.width < BIRD.startX) {
          pipe.passed = true;
          this.score += 1;
          soundManager.playScore();
          this.onScoreChange?.(this.score);
          this.spawnScoreSparkles(pipe.x + pipe.width, pipe.topHeight + pipe.gap / 2);
          this.incrementStat('totalPipesPassed');
        }

        // Cleanup pipes that exited screen
        if (pipe.x + pipe.width < -40) {
          this.pipes.splice(i, 1);
        }
      }

      // Collision Detection
      const ceilingY = 0;
      const birdHitY = this.birdY;
      const r = BIRD.hitboxRadius;

      // Ground collision
      if (birdHitY + r >= groundY) {
        this.birdY = groundY - r;
        this.triggerGameOver(true);
        return;
      }

      // Ceiling soft-bounce
      if (birdHitY - r <= ceilingY) {
        this.birdY = ceilingY + r;
        if (this.birdVy < 0) this.birdVy = 0;
      }

      // Pipe collisions
      for (const pipe of this.pipes) {
        if (this.checkPipeCollision(pipe, BIRD.startX, birdHitY, r)) {
          this.triggerGameOver(false);
          return;
        }
      }
    } else if (this.state === 'GAMEOVER') {
      // In game over, bird falls with gravity until hitting ground
      const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
      if (this.birdY + BIRD.hitboxRadius < groundY) {
        this.birdVy += phys.gravity * 1.2 * dt;
        this.birdY += this.birdVy * dt;
        this.birdRotation = Math.min(BIRD.maxRotation, this.birdRotation + dt * 6);

        if (this.birdY + BIRD.hitboxRadius >= groundY) {
          this.birdY = groundY - BIRD.hitboxRadius;
          this.birdVy = 0;
          this.spawnImpactDust(BIRD.startX, groundY);
        }
      }
    }
  }

  private spawnPipe() {
    const phys = PHYSICS[this.difficulty];
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
    // Pipe gap slightly tightens with high score, but clamped to minPipeGap
    const gap = Math.max(phys.minPipeGap, phys.pipeGap - Math.floor(this.score / 12) * 2);

    const availableHeight = groundY - gap - MIN_PIPE_HEIGHT * 2;
    const topHeight = MIN_PIPE_HEIGHT + Math.random() * availableHeight;
    const bottomY = topHeight + gap;

    this.pipes.push({
      x: CANVAS_WIDTH + 10,
      topHeight,
      bottomY,
      width: PIPE_WIDTH,
      gap,
      passed: false,
    });
  }

  /**
   * Circle-to-AABB collision check
   */
  private checkPipeCollision(pipe: Pipe, birdX: number, birdY: number, radius: number): boolean {
    const collarOverhang = 4;
    const pipeLeft = pipe.x - collarOverhang;
    const pipeRight = pipe.x + pipe.width + collarOverhang;

    // Check if bird is within x range of pipe
    if (birdX + radius < pipeLeft || birdX - radius > pipeRight) {
      return false;
    }

    // Top pipe AABB: [pipeLeft, 0, pipeRight, pipe.topHeight]
    const closestTopX = Math.max(pipeLeft, Math.min(birdX, pipeRight));
    const closestTopY = Math.max(0, Math.min(birdY, pipe.topHeight));
    const distTopSq = (birdX - closestTopX) ** 2 + (birdY - closestTopY) ** 2;
    if (distTopSq < radius * radius) {
      return true;
    }

    // Bottom pipe AABB: [pipeLeft, pipe.bottomY, pipeRight, CANVAS_HEIGHT - GROUND_HEIGHT]
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
    const closestBottomX = Math.max(pipeLeft, Math.min(birdX, pipeRight));
    const closestBottomY = Math.max(pipe.bottomY, Math.min(birdY, groundY));
    const distBottomSq = (birdX - closestBottomX) ** 2 + (birdY - closestBottomY) ** 2;
    if (distBottomSq < radius * radius) {
      return true;
    }

    return false;
  }

  private triggerGameOver(hitGround: boolean) {
    if (this.state === 'GAMEOVER') return;

    this.state = 'GAMEOVER';
    this.hitstopTimer = 0.05; // 50ms dramatic hit freeze
    this.shakeTime = 0.35;
    this.shakeIntensity = 12;
    this.flashAlpha = 0.75;

    soundManager.playHit();
    if (!hitGround) {
      setTimeout(() => {
        soundManager.playDie();
      }, 100);
    }

    // Spawn impact particles
    this.spawnFeathers(BIRD.startX, this.birdY, 14);

    // Save statistics & check high score
    const isNewHighScore = this.saveGameEndStats(this.score);

    this.onStateChange?.(this.state);
    this.onGameOver?.(this.score, isNewHighScore);
  }

  private spawnFeathers(x: number, y: number, count: number = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 80 + 30;
      this.particles.push({
        x: x + (Math.random() * 8 - 4),
        y: y + (Math.random() * 8 - 4),
        vx: Math.cos(angle) * speed - 50,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 3,
        color: Math.random() > 0.4 ? this.skin.wingColor : this.skin.bodyColor,
        alpha: 1.0,
        life: 0,
        maxLife: Math.random() * 0.4 + 0.35,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 8,
        type: 'feather',
      });
    }
  }

  private spawnScoreSparkles(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = Math.random() * 110 + 50;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 3,
        color: ['#facc15', '#fde047', '#ffffff', '#38bdf8'][Math.floor(Math.random() * 4)],
        alpha: 1.0,
        life: 0,
        maxLife: 0.55,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 12,
        type: 'sparkle',
      });
    }
  }

  private spawnImpactDust(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const angle = -Math.PI * 0.2 - Math.random() * Math.PI * 0.6;
      const speed = Math.random() * 70 + 20;
      this.particles.push({
        x: x + (Math.random() * 16 - 8),
        y: y - 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 3,
        color: '#e2e8f0',
        alpha: 0.8,
        life: 0,
        maxLife: 0.45,
        type: 'dust',
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt; // slight particle gravity
      if (p.rotation !== undefined && p.vRot !== undefined) {
        p.rotation += p.vRot * dt;
      }
      p.alpha = 1 - p.life / p.maxLife;
    }
  }

  private render(currentTime: number) {
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTime > 0) {
      shakeX = (Math.random() * 2 - 1) * this.shakeIntensity;
      shakeY = (Math.random() * 2 - 1) * this.shakeIntensity;
    }

    const wingAngle = Math.sin(this.wingPhase);

    this.renderer.render({
      theme: this.theme,
      birdY: this.birdY,
      birdVy: this.birdVy,
      birdRotation: this.birdRotation,
      birdSquash: this.birdSquash,
      wingAngle,
      skin: this.skin,
      pipes: this.pipes,
      particles: this.particles,
      shakeX,
      shakeY,
      flashAlpha: this.flashAlpha,
      currentTime,
    });
  }

  private saveGameEndStats(score: number): boolean {
    let isNewHigh = false;
    try {
      const currentStats = this.getStats();
      if (score > currentStats.highScore) {
        currentStats.highScore = score;
        isNewHigh = true;
      }
      currentStats.totalGames += 1;
      currentStats.lastScore = score;

      localStorage.setItem('flappy_stats', JSON.stringify(currentStats));
      localStorage.setItem('flappy_highscore', String(currentStats.highScore));
    } catch {
      // ignore storage failure
    }
    return isNewHigh;
  }

  private incrementStat(key: keyof GameStats) {
    try {
      const currentStats = this.getStats();
      if (typeof currentStats[key] === 'number') {
        (currentStats[key] as number) += 1;
        localStorage.setItem('flappy_stats', JSON.stringify(currentStats));
      }
    } catch {
      // ignore
    }
  }

  public getStats(): GameStats {
    try {
      const raw = localStorage.getItem('flappy_stats');
      if (raw) {
        return JSON.parse(raw);
      }
      const legacyHigh = parseInt(localStorage.getItem('flappy_highscore') || '0', 10);
      return {
        highScore: isNaN(legacyHigh) ? 0 : legacyHigh,
        totalGames: 0,
        totalFlaps: 0,
        totalPipesPassed: 0,
        lastScore: 0,
      };
    } catch {
      return {
        highScore: 0,
        totalGames: 0,
        totalFlaps: 0,
        totalPipesPassed: 0,
        lastScore: 0,
      };
    }
  }
}
