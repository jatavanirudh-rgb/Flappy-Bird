import { BirdSkin, GameTheme, Particle, Pipe } from '../types/game';
import {
  BIRD,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GROUND_HEIGHT,
  PIPE_COLLAR_HEIGHT,
  PIPE_COLLAR_OVERHANG,
  THEMES,
} from './constants';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private groundOffset: number = 0;
  private cloudOffset: number = 0;
  private hillOffset: number = 0;
  private stars: Array<{ x: number; y: number; size: number; phase: number }> = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    // Generate deterministic background stars for night mode
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - 120),
        size: Math.random() * 1.8 + 0.8,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  public updateOffsets(pipeSpeed: number, dt: number) {
    this.groundOffset = (this.groundOffset + pipeSpeed * dt) % 24;
    this.hillOffset = (this.hillOffset + pipeSpeed * 0.3 * dt) % CANVAS_WIDTH;
    this.cloudOffset = (this.cloudOffset + pipeSpeed * 0.15 * dt) % CANVAS_WIDTH;
  }

  public render(params: {
    theme: GameTheme;
    birdY: number;
    birdVy: number;
    birdRotation: number;
    birdSquash: number;
    wingAngle: number;
    skin: BirdSkin;
    pipes: Pipe[];
    particles: Particle[];
    shakeX: number;
    shakeY: number;
    flashAlpha: number;
    currentTime: number;
  }) {
    const { ctx } = this;
    const themeData = THEMES[params.theme];

    ctx.save();
    // Apply camera shake if any
    if (params.shakeX !== 0 || params.shakeY !== 0) {
      ctx.translate(params.shakeX, params.shakeY);
    }

    // 1. Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT);
    skyGrad.addColorStop(0, themeData.skyTop);
    skyGrad.addColorStop(1, themeData.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Stars (if night or sunset)
    if (params.theme === 'night' || params.theme === 'sunset') {
      this.renderStars(params.currentTime, params.theme === 'sunset' ? 0.35 : 0.9);
    }

    // 3. Sun / Moon
    this.renderCelestial(params.theme, params.currentTime);

    // 4. Parallax Distant Hills / Skyline
    this.renderHills(themeData);

    // 5. Parallax Fluffy Clouds
    this.renderClouds(themeData);

    // 6. Pipes
    this.renderPipes(params.pipes, themeData);

    // 7. Ground
    this.renderGround(themeData);

    // 8. Particles (below bird)
    this.renderParticles(params.particles);

    // 9. Bird
    this.renderBird({
      y: params.birdY,
      rotation: params.birdRotation,
      squash: params.birdSquash,
      wingAngle: params.wingAngle,
      skin: params.skin,
      time: params.currentTime,
    });

    // 10. Screen Flash on Impact
    if (params.flashAlpha > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, params.flashAlpha)})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    ctx.restore();
  }

  private renderStars(time: number, maxAlpha: number) {
    const { ctx } = this;
    this.stars.forEach((star) => {
      const alpha = (0.4 + 0.6 * Math.sin(time * 2.5 + star.phase)) * maxAlpha;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private renderCelestial(theme: GameTheme, time: number) {
    const { ctx } = this;
    const themeData = THEMES[theme];

    ctx.save();
    if (theme === 'night') {
      // Crescent Moon
      const moonX = CANVAS_WIDTH - 70;
      const moonY = 85;
      const moonR = 24;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR + 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      // Shadow cutout for crescent
      ctx.fillStyle = themeData.skyTop;
      ctx.beginPath();
      ctx.arc(moonX + 10, moonY - 4, moonR - 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Golden Sun with pulsating glow
      const sunX = CANVAS_WIDTH - 75;
      const sunY = 90;
      const sunR = 28;
      const glowScale = 1 + 0.06 * Math.sin(time * 2);

      // Outer glow
      const glowGrad = ctx.createRadialGradient(sunX, sunY, sunR * 0.8, sunX, sunY, sunR * 2 * glowScale);
      glowGrad.addColorStop(0, 'rgba(253, 224, 71, 0.45)');
      glowGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 2 * glowScale, 0, Math.PI * 2);
      ctx.fill();

      // Sun body
      ctx.fillStyle = themeData.sunColor;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderHills(themeData: typeof THEMES['day']) {
    const { ctx } = this;
    const baseY = CANVAS_HEIGHT - GROUND_HEIGHT;

    // Back hills
    ctx.fillStyle = themeData.hillColor1;
    ctx.beginPath();
    const hillStep = 110;
    const offset = this.hillOffset % (hillStep * 2);

    for (let x = -hillStep * 2; x < CANVAS_WIDTH + hillStep * 2; x += hillStep) {
      const hillX = x - offset;
      ctx.arc(hillX + 55, baseY + 30, 85, Math.PI, 0, false);
    }
    ctx.lineTo(CANVAS_WIDTH, baseY);
    ctx.lineTo(0, baseY);
    ctx.closePath();
    ctx.fill();

    // Foreground rolling green hills
    ctx.fillStyle = themeData.hillColor2;
    ctx.beginPath();
    const fStep = 150;
    const fOffset = (this.hillOffset * 1.5) % fStep;
    for (let x = -fStep; x < CANVAS_WIDTH + fStep * 2; x += fStep) {
      const hillX = x - fOffset;
      ctx.arc(hillX + 75, baseY + 18, 95, Math.PI, 0, false);
    }
    ctx.lineTo(CANVAS_WIDTH, baseY);
    ctx.lineTo(0, baseY);
    ctx.closePath();
    ctx.fill();
  }

  private renderClouds(themeData: typeof THEMES['day']) {
    const { ctx } = this;
    ctx.fillStyle = themeData.cloudColor;

    const clouds = [
      { baseX: 40, y: 70, scale: 0.9 },
      { baseX: 190, y: 130, scale: 0.65 },
      { baseX: 330, y: 85, scale: 1.1 },
      { baseX: 480, y: 145, scale: 0.75 },
    ];

    clouds.forEach((cloud) => {
      const x = ((cloud.baseX - this.cloudOffset) % (CANVAS_WIDTH + 140)) - 60;
      this.drawCloud(x, cloud.y, cloud.scale);
    });
  }

  private drawCloud(x: number, y: number, scale: number) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.arc(20, -10, 24, 0, Math.PI * 2);
    ctx.arc(44, 0, 18, 0, Math.PI * 2);
    ctx.arc(20, 10, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderPipes(pipes: Pipe[], themeData: typeof THEMES['day']) {
    const { ctx } = this;
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;

    pipes.forEach((pipe) => {
      const { x, topHeight, bottomY, width } = pipe;

      // TOP PIPE (coming down from ceiling)
      this.drawSinglePipe({
        x,
        y: 0,
        height: topHeight,
        width,
        isTop: true,
        themeData,
      });

      // BOTTOM PIPE (rising from bottomY down to ground)
      const bottomHeight = Math.max(0, groundY - bottomY);
      this.drawSinglePipe({
        x,
        y: bottomY,
        height: bottomHeight,
        width,
        isTop: false,
        themeData,
      });
    });
  }

  private drawSinglePipe(params: {
    x: number;
    y: number;
    height: number;
    width: number;
    isTop: boolean;
    themeData: typeof THEMES['day'];
  }) {
    const { ctx } = this;
    const { x, y, height, width, isTop, themeData } = params;
    if (height <= 0) return;

    ctx.save();

    // Main Pipe Body Dimensions
    const collarH = PIPE_COLLAR_HEIGHT;
    const overhang = PIPE_COLLAR_OVERHANG;
    const collarW = width + overhang * 2;
    const collarX = x - overhang;

    let bodyY: number;
    let bodyH: number;
    let collarY: number;

    if (isTop) {
      bodyY = y;
      bodyH = Math.max(0, height - collarH);
      collarY = y + bodyH;
    } else {
      collarY = y;
      bodyY = y + collarH;
      bodyH = Math.max(0, height - collarH);
    }

    // 1. Draw Body
    if (bodyH > 0) {
      // Pipe cylinder gradient
      const bodyGrad = ctx.createLinearGradient(x, 0, x + width, 0);
      bodyGrad.addColorStop(0, themeData.pipeDark);
      bodyGrad.addColorStop(0.18, themeData.pipeLight);
      bodyGrad.addColorStop(0.45, themeData.pipeMain);
      bodyGrad.addColorStop(0.85, themeData.pipeDark);
      bodyGrad.addColorStop(1, themeData.pipeBorder);

      ctx.fillStyle = bodyGrad;
      ctx.fillRect(x, bodyY, width, bodyH);

      // Dark borders
      ctx.strokeStyle = themeData.pipeBorder;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, bodyY, width, bodyH);

      // Shiny highlight vertical line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(x + 7, bodyY, 4, bodyH);
    }

    // 2. Draw Collar (flared pipe rim)
    const collarGrad = ctx.createLinearGradient(collarX, 0, collarX + collarW, 0);
    collarGrad.addColorStop(0, themeData.pipeDark);
    collarGrad.addColorStop(0.16, themeData.pipeLight);
    collarGrad.addColorStop(0.45, themeData.pipeMain);
    collarGrad.addColorStop(0.85, themeData.pipeDark);
    collarGrad.addColorStop(1, themeData.pipeBorder);

    ctx.fillStyle = collarGrad;
    ctx.fillRect(collarX, collarY, collarW, collarH);

    // Collar border
    ctx.strokeStyle = themeData.pipeBorder;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(collarX, collarY, collarW, collarH);

    // Shiny collar highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(collarX + 8, collarY + 2, 5, collarH - 4);

    // Dark rim lip shadow for 3D arcade depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    if (isTop) {
      ctx.fillRect(collarX + 2, collarY + collarH - 4, collarW - 4, 3);
    } else {
      ctx.fillRect(collarX + 2, collarY + 1, collarW - 4, 3);
    }

    ctx.restore();
  }

  private renderGround(themeData: typeof THEMES['day']) {
    const { ctx } = this;
    const y = CANVAS_HEIGHT - GROUND_HEIGHT;
    const h = GROUND_HEIGHT;

    ctx.save();

    // 1. Dirt Base
    ctx.fillStyle = themeData.groundBody;
    ctx.fillRect(0, y, CANVAS_WIDTH, h);

    // 2. Scrolling diagonal dirt stripes
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    const stripeWidth = 14;
    const totalStep = 24;
    const startX = -this.groundOffset - 24;

    ctx.beginPath();
    for (let x = startX; x < CANVAS_WIDTH + 48; x += totalStep) {
      ctx.moveTo(x, y + 16);
      ctx.lineTo(x + stripeWidth, y + 16);
      ctx.lineTo(x + stripeWidth - 14, y + h);
      ctx.lineTo(x - 14, y + h);
      ctx.closePath();
    }
    ctx.fill();

    // 3. Top Lush Grass Layer
    ctx.fillStyle = themeData.groundTop;
    ctx.fillRect(0, y, CANVAS_WIDTH, 14);

    // Grass blade scallops
    ctx.fillStyle = themeData.groundTop;
    const scallopR = 7;
    for (let x = -this.groundOffset; x < CANVAS_WIDTH + 24; x += scallopR * 2) {
      ctx.beginPath();
      ctx.arc(x + scallopR, y + 14, scallopR, 0, Math.PI);
      ctx.fill();
    }

    // Grass highlight line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(0, y, CANVAS_WIDTH, 3);

    // Dark separating line below grass
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, y + 14, CANVAS_WIDTH, 2);

    ctx.restore();
  }

  private renderParticles(particles: Particle[]) {
    const { ctx } = this;
    particles.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.rotation !== undefined) {
        ctx.rotate(p.rotation);
      }
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === 'feather') {
        // Oval feather shape
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'sparkle') {
        // 4-pointed star
        ctx.fillStyle = p.color;
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.3, -s * 0.3);
        ctx.lineTo(s, 0);
        ctx.lineTo(s * 0.3, s * 0.3);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.3, s * 0.3);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s * 0.3, -s * 0.3);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'ring') {
        // Expanding shockwave ring
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Dust circle
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  private renderBird(params: {
    y: number;
    rotation: number;
    squash: number; // 1 = normal, >1 stretch, <1 squash
    wingAngle: number; // -1 to 1 representing wing cycle
    skin: BirdSkin;
    time: number;
  }) {
    const { ctx } = this;
    const { y, rotation, squash, wingAngle, skin } = params;
    const x = BIRD.startX;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Apply squash and stretch
    const scaleX = 1 / squash;
    const scaleY = squash;
    ctx.scale(scaleX, scaleY);

    const r = BIRD.radius;

    // 1. Bird Body Drop Shadow (subtle)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 4, r + 2, r - 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Main Round Body
    ctx.fillStyle = skin.bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, r + 1, r, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body Outline
    ctx.strokeStyle = skin.outlineColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 3. Belly (cute lighter bottom half)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r - 1, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = skin.bellyColor;
    ctx.beginPath();
    ctx.ellipse(-2, r * 0.45, r * 0.85, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Tail Feathers (behind body on left)
    ctx.fillStyle = skin.wingColor;
    ctx.beginPath();
    ctx.moveTo(-r, 1);
    ctx.lineTo(-r - 7, -4);
    ctx.lineTo(-r - 6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = skin.outlineColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Wing (flapping up and down)
    // wingAngle oscillates between -1 (up) and 1 (down)
    const wingY = wingAngle * 4;
    const wingRot = wingAngle * 0.45;

    ctx.save();
    ctx.translate(-4, wingY);
    ctx.rotate(wingRot);

    ctx.fillStyle = skin.wingColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 6.5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = skin.outlineColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wing feather highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-1, -1.5, 6, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 6. Cute Blush
    ctx.fillStyle = skin.blushColor;
    ctx.beginPath();
    ctx.arc(6, 6, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 7. Cartoon Eye
    // Eye white
    const eyeX = 7;
    const eyeY = -4.5;
    const eyeR = 6;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = skin.outlineColor;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Eye Pupil & Iris
    ctx.fillStyle = skin.eyeColor;
    ctx.beginPath();
    ctx.arc(eyeX + 1.8, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();

    // White Glint/Sparkle in eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX + 1, eyeY - 1.5, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // 8. Beak (orange with top and bottom lips)
    const beakStartX = 11;
    const beakY = 0;

    // Upper beak
    ctx.fillStyle = skin.beakColor;
    ctx.beginPath();
    ctx.moveTo(beakStartX, beakY - 3);
    ctx.lineTo(beakStartX + 12, beakY + 1);
    ctx.lineTo(beakStartX, beakY + 3);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = skin.outlineColor;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Beak shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(beakStartX + 1, beakY - 2);
    ctx.lineTo(beakStartX + 7, beakY);
    ctx.lineTo(beakStartX + 1, beakY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
