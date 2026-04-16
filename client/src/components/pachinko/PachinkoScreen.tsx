import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import Button from '@/components/common/Button';
import { toast } from '@/components/common/Toast';

/* ── Fixed pocket config (matches server POCKET_REWARDS order) ── */
const POCKET_CONFIG = [
  { id: 'jackpot', label: '잭팟', color: '#EF4444' },
  { id: 'miss', label: '꽝', color: '#6B7280' },
  { id: 'gems', label: '젬', color: '#06B6D4' },
  { id: 'stone_epic', label: '영웅', color: '#8B5CF6' },
  { id: 'gold_s', label: '소골드', color: '#D4A017' },
  { id: 'stone_rare', label: '희귀', color: '#3B82F6' },
  { id: 'gold_m', label: '중골드', color: '#EAB308' },
  { id: 'miss2', label: '꽝', color: '#6B7280' },
  { id: 'gold_l', label: '대골드', color: '#F59E0B' },
] as const;

interface MultiSummary {
  counts: Record<string, number>;
  totalGold: number;
  totalGems: number;
  totalItems: number;
}

/* ── Stats persisted in localStorage ── */
interface PachinkoStats {
  totalPlays: number;
  totalSpent: number;
  totalGoldWon: number;
  totalGemsWon: number;
}

function loadStats(): PachinkoStats {
  try {
    const raw = localStorage.getItem('pachinko_stats');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { totalPlays: 0, totalSpent: 0, totalGoldWon: 0, totalGemsWon: 0 };
}

function saveStats(s: PachinkoStats) {
  localStorage.setItem('pachinko_stats', JSON.stringify(s));
}

/* ── Constants ── */
const COST_1 = 100_000;
const COST_10 = 900_000;
const COST_100 = 8_000_000;

/* ── Canvas / Physics Constants ── */
const CANVAS_W = 500;
const CANVAS_H = 700;
const SLOT_COUNT = 9;

// Physics
const GRAVITY = 0.15;
const FRICTION = 0.98;
const BOUNCE_DAMPING = 0.7;
const PEG_BOUNCE = 0.6;
const BALL_RADIUS = 6;
const BALL_BALL_BOUNCE = 0.5;
const PEG_RADIUS = 5;

// Layout
const PEG_START_Y = 120;
const PEG_END_Y = 480;

const POCKET_TOP_Y = 550;
const POCKET_BOTTOM_Y = 670;
const POCKET_W = CANVAS_W / SLOT_COUNT;
const DIVIDER_W = 3;
const DIVIDER_H = 80;

/* ── Ball interface ── */
interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
  settled: boolean;
  resultSlot: number;
  color: string;
  trail: { x: number; y: number }[];
  settleTime: number;
}

/* ── Spark effect ── */
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

/* ── Build pegs (triangle shape with random jitter) ── */
function buildPegs(): { x: number; y: number }[] {
  const pegs: { x: number; y: number }[] = [];
  const totalRows = 12;
  const minCols = 3;
  const maxCols = 11;
  for (let row = 0; row < totalRows; row++) {
    const t = row / (totalRows - 1);
    const cols = Math.round(minCols + t * (maxCols - minCols));
    const even = row % 2 === 0;
    const actualCols = even ? cols : cols + 1;
    const spacing = (CANVAS_W - 40) / actualCols;
    const startX = 20 + spacing / 2;
    const y = PEG_START_Y + row * ((PEG_END_Y - PEG_START_Y) / (totalRows - 1));

    // Jitter: 20% of spacing, clamped between 5~12px
    const maxJitter = Math.max(5, Math.min(12, spacing * 0.2));

    for (let col = 0; col < actualCols; col++) {
      const baseX = startX + col * spacing + (even ? 0 : spacing * 0.5 - spacing / actualCols * 0.5);
      const jx = (Math.random() * 2 - 1) * maxJitter;
      const jy = (Math.random() * 2 - 1) * maxJitter * 0.6; // less vertical jitter

      // Clamp within canvas bounds
      const finalX = Math.max(PEG_RADIUS + 5, Math.min(CANVAS_W - PEG_RADIUS - 5, baseX + jx));
      const finalY = Math.max(PEG_START_Y, Math.min(PEG_END_Y, y + jy));

      pegs.push({ x: finalX, y: finalY });
    }
  }
  return pegs;
}

// Initial peg layout (will be regenerated each play)
let PEGS = buildPegs();

/* ── Divider positions ── */
function buildDividers(): { x: number; y1: number; y2: number }[] {
  const divs: { x: number; y1: number; y2: number }[] = [];
  for (let i = 0; i <= SLOT_COUNT; i++) {
    divs.push({
      x: i * POCKET_W,
      y1: POCKET_TOP_Y,
      y2: POCKET_TOP_Y + DIVIDER_H,
    });
  }
  return divs;
}

const DIVIDERS = buildDividers();

/* ── Pocket centers ── */
function getPocketCenterX(slot: number): number {
  return slot * POCKET_W + POCKET_W / 2;
}

/* ── Component ── */
function PachinkoScreen() {
  const navigate = useNavigate();
  const saveData = useAuthStore((s) => s.saveData);
  const updateSaveData = useAuthStore((s) => s.updateSaveData);

  const [playing, setPlaying] = useState(false);
  const [multiSummary, setMultiSummary] = useState<MultiSummary | null>(null);
  const [singlePocket, setSinglePocket] = useState<number | null>(null);
  const [stats, setStats] = useState<PachinkoStats>(loadStats);
  const [runningTally, setRunningTally] = useState<Record<string, number>>({});
  const [jackpotFlash, setJackpotFlash] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const animFrameRef = useRef<number>(0);
  const playingRef = useRef(false);
  const pocketFlashRef = useRef<number[]>(new Array(SLOT_COUNT).fill(0));
  const pocketPopupRef = useRef<({ label: string; color: string; life: number; offsetY: number } | null)[]>(new Array(SLOT_COUNT).fill(null));
  const onAllSettledRef = useRef<(() => void) | null>(null);
  const jackpotFlashRef = useRef(0);
  const pendingCountRef = useRef<1 | 10 | 100>(1);

  const gold = saveData?.gold ?? 0;

  /* ── Physics step ── */
  const physicsStep = useCallback(() => {
    const balls = ballsRef.current;
    const sparks = sparksRef.current;

    for (const ball of balls) {
      if (!ball.active || ball.settled) continue;

      // Gravity
      ball.vy += GRAVITY;

      // Friction
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;

      // Move
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Trail
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 5) ball.trail.shift();

      // Peg collisions
      for (const peg of PEGS) {
        const dx = ball.x - peg.x;
        const dy = ball.y - peg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = ball.radius + PEG_RADIUS;
        if (dist < minDist && dist > 0) {
          // Separate
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          ball.x += nx * overlap;
          ball.y += ny * overlap;

          // Reflect
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx -= 2 * dot * nx;
          ball.vy -= 2 * dot * ny;

          // Damping + random deflection
          ball.vx *= PEG_BOUNCE;
          ball.vy *= PEG_BOUNCE;
          ball.vx += (Math.random() - 0.5) * 1.0;

          // Spark
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          if (speed > 1) {
            for (let s = 0; s < 3; s++) {
              sparks.push({
                x: peg.x + nx * PEG_RADIUS,
                y: peg.y + ny * PEG_RADIUS,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 15,
                maxLife: 15,
                color: '#FFD700',
              });
            }
          }
        }
      }

      // Ball-ball collisions
      for (const other of balls) {
        if (other === ball || !other.active || other.settled) continue;
        const dx = ball.x - other.x;
        const dy = ball.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = ball.radius + other.radius;
        if (dist < minDist && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          ball.x += nx * (overlap / 2);
          ball.y += ny * (overlap / 2);
          other.x -= nx * (overlap / 2);
          other.y -= ny * (overlap / 2);

          // Elastic collision
          const dvx = ball.vx - other.vx;
          const dvy = ball.vy - other.vy;
          const dvDotN = dvx * nx + dvy * ny;
          if (dvDotN > 0) {
            ball.vx -= dvDotN * nx * BALL_BALL_BOUNCE;
            ball.vy -= dvDotN * ny * BALL_BALL_BOUNCE;
            other.vx += dvDotN * nx * BALL_BALL_BOUNCE;
            other.vy += dvDotN * ny * BALL_BALL_BOUNCE;
          }
        }
      }

      // Wall collisions
      if (ball.x < ball.radius) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx) * BOUNCE_DAMPING;
      }
      if (ball.x > CANVAS_W - ball.radius) {
        ball.x = CANVAS_W - ball.radius;
        ball.vx = -Math.abs(ball.vx) * BOUNCE_DAMPING;
      }
      if (ball.y < ball.radius) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy) * BOUNCE_DAMPING;
      }

      // Funnel walls at top of pocket area
      if (ball.y >= POCKET_TOP_Y - 20 && ball.y < POCKET_TOP_Y) {
        const pocketIdx = Math.floor(ball.x / POCKET_W);
        const pocketCenter = pocketIdx * POCKET_W + POCKET_W / 2;
        const diff = pocketCenter - ball.x;
        ball.vx += diff * 0.01;
      }

      // Divider collisions
      if (ball.y >= POCKET_TOP_Y && ball.y <= POCKET_TOP_Y + DIVIDER_H) {
        for (const div of DIVIDERS) {
          const dx = ball.x - div.x;
          if (Math.abs(dx) < ball.radius + DIVIDER_W / 2) {
            if (dx < 0) {
              ball.x = div.x - ball.radius - DIVIDER_W / 2;
              ball.vx = -Math.abs(ball.vx) * BOUNCE_DAMPING;
            } else {
              ball.x = div.x + ball.radius + DIVIDER_W / 2;
              ball.vx = Math.abs(ball.vx) * BOUNCE_DAMPING;
            }
          }
        }
      }

      // Settle check
      if (ball.y >= POCKET_BOTTOM_Y - 10) {
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (speed < 2 || ball.y > POCKET_BOTTOM_Y + 5) {
          ball.settled = true;
          ball.settleTime = Date.now();
          ball.vy = 0;
          ball.vx = 0;

          // Determine pocket from actual physics position
          const visualSlot = Math.max(0, Math.min(SLOT_COUNT - 1, Math.floor(ball.x / POCKET_W)));
          ball.resultSlot = visualSlot;

          // Snap to pocket center
          ball.x = getPocketCenterX(visualSlot);
          ball.y = POCKET_BOTTOM_Y - ball.radius - 5;

          // Flash the pocket + show reward popup
          const cfg = POCKET_CONFIG[visualSlot];
          pocketFlashRef.current[visualSlot] = 1.0;
          if (cfg) {
            pocketPopupRef.current[visualSlot] = {
              label: cfg.label,
              color: cfg.color,
              life: 60,
              offsetY: 0,
            };
          }

          // Jackpot flash
          if (visualSlot === 0) {
            jackpotFlashRef.current = 1.0;
            setJackpotFlash(1);
          }

          // Update running tally
          if (cfg) {
            setRunningTally(prev => ({
              ...prev,
              [cfg.label]: (prev[cfg.label] || 0) + 1,
            }));
          }
        }
      }

      // Bottom wall
      if (ball.y > POCKET_BOTTOM_Y) {
        ball.y = POCKET_BOTTOM_Y - ball.radius - 5;
        ball.vy = -Math.abs(ball.vy) * 0.3;
      }
    }

    // Update sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life--;
      if (s.life <= 0) sparks.splice(i, 1);
    }

    // Decay pocket flashes
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (pocketFlashRef.current[i] > 0) {
        pocketFlashRef.current[i] *= 0.95;
        if (pocketFlashRef.current[i] < 0.01) pocketFlashRef.current[i] = 0;
      }
    }

    // Decay jackpot flash
    if (jackpotFlashRef.current > 0) {
      jackpotFlashRef.current *= 0.93;
      if (jackpotFlashRef.current < 0.01) {
        jackpotFlashRef.current = 0;
        setJackpotFlash(0);
      }
    }

    // Check if all settled
    const activeBalls = balls.filter(b => b.active);
    if (activeBalls.length > 0 && activeBalls.every(b => b.settled)) {
      if (onAllSettledRef.current) {
        const cb = onAllSettledRef.current;
        onAllSettledRef.current = null;
        // Small delay so user sees the final state
        setTimeout(cb, 500);
      }
    }
  }, []);

  /* ── Render frame ── */
  const renderFrame = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = CANVAS_W;
    const h = CANVAS_H;

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0a0a1a');
    bg.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Jackpot full-screen flash
    if (jackpotFlashRef.current > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${jackpotFlashRef.current * 0.3})`;
      ctx.fillRect(0, 0, w, h);
    }

    // Pegs
    for (const peg of PEGS) {
      ctx.save();
      ctx.shadowColor = '#6366F1';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
      const pegGrad = ctx.createRadialGradient(peg.x - 1, peg.y - 1, 0, peg.x, peg.y, PEG_RADIUS);
      pegGrad.addColorStop(0, '#818CF8');
      pegGrad.addColorStop(1, '#6366F1');
      ctx.fillStyle = pegGrad;
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = '#A5B4FC';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Pocket area background
    ctx.fillStyle = 'rgba(10, 10, 30, 0.5)';
    ctx.fillRect(0, POCKET_TOP_Y, w, DIVIDER_H + 50);

    // Pocket fills with FIXED labels and colors
    for (let i = 0; i < SLOT_COUNT; i++) {
      const px = i * POCKET_W;
      const flash = pocketFlashRef.current[i];
      const popupInfo = pocketPopupRef.current[i];
      const cfg = POCKET_CONFIG[i];

      // Base fill with pocket's own color (subtle)
      ctx.fillStyle = cfg.color + '15';
      ctx.fillRect(px, POCKET_TOP_Y, POCKET_W, DIVIDER_H);

      // Flash overlay when ball lands
      if (flash > 0) {
        ctx.fillStyle = cfg.color + Math.floor(flash * 200).toString(16).padStart(2, '0');
        ctx.fillRect(px, POCKET_TOP_Y, POCKET_W, DIVIDER_H);
      }

      // Fixed pocket label (always visible)
      ctx.fillStyle = cfg.color + '90';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cfg.label, px + POCKET_W / 2, POCKET_TOP_Y + DIVIDER_H - 10);

      // Reward popup text (shows after ball lands, floats up)
      if (popupInfo && popupInfo.life > 0) {
        const alpha = Math.min(1, popupInfo.life / 30);
        ctx.fillStyle = popupInfo.color;
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(popupInfo.label, px + POCKET_W / 2, POCKET_TOP_Y + DIVIDER_H / 2 - popupInfo.offsetY);
        ctx.globalAlpha = 1;
        popupInfo.life -= 1;
        popupInfo.offsetY += 0.3;
      }
    }

    // Divider walls
    for (const div of DIVIDERS) {
      if (div.x <= 0 || div.x >= w) continue;
      const dGrad = ctx.createLinearGradient(div.x - DIVIDER_W / 2, 0, div.x + DIVIDER_W / 2, 0);
      dGrad.addColorStop(0, '#9CA3AF');
      dGrad.addColorStop(0.5, '#E5E7EB');
      dGrad.addColorStop(1, '#9CA3AF');
      ctx.fillStyle = dGrad;
      ctx.fillRect(div.x - DIVIDER_W / 2, div.y1, DIVIDER_W, DIVIDER_H);
    }

    // Left and right walls
    const wallGrad = ctx.createLinearGradient(0, 0, DIVIDER_W, 0);
    wallGrad.addColorStop(0, '#9CA3AF');
    wallGrad.addColorStop(1, '#6B7280');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, POCKET_TOP_Y, DIVIDER_W, DIVIDER_H);
    ctx.fillRect(w - DIVIDER_W, POCKET_TOP_Y, DIVIDER_W, DIVIDER_H);

    // Funnel guides
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, POCKET_TOP_Y - 40);
    ctx.lineTo(0, POCKET_TOP_Y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w - 20, POCKET_TOP_Y - 40);
    ctx.lineTo(w, POCKET_TOP_Y);
    ctx.stroke();

    // Sparks
    for (const spark of sparksRef.current) {
      const alpha = spark.life / spark.maxLife;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, 2 * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.fill();
    }

    // Balls
    for (const ball of ballsRef.current) {
      if (!ball.active) continue;

      // Trail
      for (let i = 0; i < ball.trail.length; i++) {
        const t = ball.trail[i];
        const alpha = (i + 1) / (ball.trail.length + 1) * 0.4;
        const r = ball.radius * ((i + 1) / ball.trail.length) * 0.7;
        ctx.beginPath();
        ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.fill();
      }

      // Shadow/glow
      ctx.save();
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = ball.settled ? 4 : 10;

      // Ball body
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      const ballGrad = ctx.createRadialGradient(
        ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
        ball.x, ball.y, ball.radius
      );
      ballGrad.addColorStop(0, '#FFD700');
      ballGrad.addColorStop(1, '#B8860B');
      ctx.fillStyle = ballGrad;
      ctx.fill();

      // Highlight
      ctx.beginPath();
      ctx.arc(ball.x - ball.radius * 0.25, ball.y - ball.radius * 0.25, ball.radius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

      ctx.restore();
    }

    // Border
    ctx.strokeStyle = '#4c1d95';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Drop zone indicator
    ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
    ctx.fillRect(0, 0, w, 40);
    ctx.strokeStyle = '#6366F150';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(w, 40);
    ctx.stroke();
  }, []);

  /* ── Animation loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    ctx.scale(dpr, dpr);

    let running = true;

    const loop = () => {
      if (!running) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (ballsRef.current.length > 0) {
        physicsStep();
      }
      renderFrame(ctx);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [physicsStep, renderFrame]);

  /* ── Spawn a ball (no target - pure physics) ── */
  const spawnBall = useCallback(() => {
    const baseX = 250;
    const x = baseX + (Math.random() - 0.5) * 30;
    const ball: Ball = {
      x,
      y: 20,
      vx: (Math.random() - 0.5) * 2,
      vy: 2,
      radius: BALL_RADIUS,
      active: true,
      settled: false,
      resultSlot: -1,
      color: '#FFD700',
      trail: [],
      settleTime: 0,
    };
    ballsRef.current.push(ball);
  }, []);

  /* ── Send results to server after all balls settle ── */
  const sendResults = useCallback(async (count: 1 | 10 | 100, cost: number) => {
    const pocketResults = ballsRef.current.map(b => b.resultSlot);

    try {
      const res = await axios.post('/api/pachinko/play', { count, pockets: pocketResults });
      if (!res.data.success) {
        toast.error(res.data.message || '플레이에 실패했습니다.');
        setPlaying(false);
        playingRef.current = false;
        return;
      }

      if (res.data.saveData) {
        updateSaveData(res.data.saveData);
      }

      // Update stats
      setStats((prev) => {
        const next = {
          ...prev,
          totalPlays: prev.totalPlays + count,
          totalSpent: prev.totalSpent + cost,
          totalGoldWon: prev.totalGoldWon + (res.data.totalRewards?.gold ?? 0),
          totalGemsWon: prev.totalGemsWon + (res.data.totalRewards?.gems ?? 0),
        };
        saveStats(next);
        return next;
      });

      // Show result
      if (count === 1) {
        const pocket = pocketResults[0];
        setSinglePocket(pocket);
      } else {
        const summary = buildMultiSummary(pocketResults);
        setMultiSummary(summary);
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : '파칭코 플레이에 실패했습니다.';
      toast.error(msg);
    } finally {
      setPlaying(false);
      playingRef.current = false;
    }
  }, [updateSaveData]);

  /* ── Play handler ── */
  const doPlay = useCallback((count: 1 | 10 | 100) => {
    const cost = count === 1 ? COST_1 : count === 10 ? COST_10 : COST_100;
    if (gold < cost) {
      toast.error('골드가 부족합니다.');
      return;
    }

    // Regenerate peg layout each game
    PEGS = buildPegs();

    setPlaying(true);
    playingRef.current = true;
    setSinglePocket(null);
    setMultiSummary(null);
    setRunningTally({});
    ballsRef.current = [];
    sparksRef.current = [];
    pocketFlashRef.current = new Array(SLOT_COUNT).fill(0);
    pocketPopupRef.current = new Array(SLOT_COUNT).fill(null);
    jackpotFlashRef.current = 0;
    setJackpotFlash(0);
    pendingCountRef.current = count;

    // Spawn balls with staggered timing
    const spawnInterval = count === 1 ? 0 : count === 10 ? 300 : 80;

    for (let i = 0; i < count; i++) {
      if (i === 0) {
        spawnBall();
      } else {
        setTimeout(() => {
          if (playingRef.current) {
            spawnBall();
          }
        }, i * spawnInterval);
      }
    }

    // Set callback for when all balls settle - THEN send to server
    onAllSettledRef.current = () => {
      sendResults(count, cost);
    };

    // Safety timeout
    const maxTime = count === 1 ? 15000 : count === 10 ? 25000 : 60000;
    setTimeout(() => {
      if (playingRef.current) {
        for (const ball of ballsRef.current) {
          if (!ball.settled) {
            ball.settled = true;
            ball.settleTime = Date.now();
            const slot = Math.max(0, Math.min(SLOT_COUNT - 1, Math.floor(ball.x / POCKET_W)));
            ball.resultSlot = slot;
            ball.x = getPocketCenterX(slot);
            ball.y = POCKET_BOTTOM_Y - ball.radius - 5;
            ball.vx = 0;
            ball.vy = 0;
          }
        }
        if (onAllSettledRef.current) {
          const cb = onAllSettledRef.current;
          onAllSettledRef.current = null;
          cb();
        }
      }
    }, maxTime);
  }, [gold, spawnBall, sendResults]);

  /* Build multi-play summary from pocket indices */
  const buildMultiSummary = (pockets: number[]): MultiSummary => {
    const counts: Record<string, number> = {};
    let totalGold = 0;
    let totalGems = 0;
    let totalItems = 0;

    for (const p of pockets) {
      const cfg = POCKET_CONFIG[p];
      if (cfg) {
        counts[cfg.label] = (counts[cfg.label] ?? 0) + 1;
      }
      // Approximate totals from pocket config (server has exact values)
      if (cfg?.id === 'gold_s') totalGold += 30000;
      else if (cfg?.id === 'gold_m') totalGold += 80000;
      else if (cfg?.id === 'gold_l') totalGold += 250000;
      else if (cfg?.id === 'gems') totalGems += 50;
      else if (cfg?.id === 'jackpot') { totalGems += 500; totalItems += 5; }
      else if (cfg?.id === 'stone_epic') totalItems += 1;
      else if (cfg?.id === 'stone_rare') totalItems += 2;
    }
    return { counts, totalGold, totalGems, totalItems };
  };

  const singlePocketColor = useMemo(() => {
    if (singlePocket == null) return '#fff';
    return POCKET_CONFIG[singlePocket]?.color ?? '#fff';
  }, [singlePocket]);

  const singlePocketLabel = useMemo(() => {
    if (singlePocket == null) return '';
    return POCKET_CONFIG[singlePocket]?.label ?? '';
  }, [singlePocket]);

  if (!saveData) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          &larr; 돌아가기
        </button>
        <h1 className="text-xl font-bold text-yellow-400">파칭코</h1>
        <div className="text-sm text-gray-400">
          <span className="text-yellow-400 font-bold">{gold.toLocaleString()}</span> G
        </div>
      </div>

      {/* Main content: canvas + side panel */}
      <div className="flex gap-4 justify-center mb-4">
        {/* Canvas */}
        <div
          className="rounded-lg overflow-hidden flex-shrink-0"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            boxShadow: jackpotFlash > 0
              ? `0 0 ${30 * jackpotFlash}px rgba(239, 68, 68, ${jackpotFlash * 0.5})`
              : '0 0 20px rgba(99, 102, 241, 0.2)',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: CANVAS_W, height: CANVAS_H }}
          />
        </div>

        {/* Side panel: running tally */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-dungeon-panel rounded-lg border border-gray-700 p-3">
            <h3 className="text-xs font-bold text-gray-400 mb-2 border-b border-gray-700 pb-2">
              {playing ? '진행중...' : '현재 결과'}
            </h3>
            {Object.keys(runningTally).length === 0 && !playing && singlePocket == null && !multiSummary && (
              <p className="text-xs text-gray-600 text-center py-4">플레이를 시작하세요</p>
            )}
            {Object.entries(runningTally).map(([label, count]) => {
              const cfg = POCKET_CONFIG.find(s => s.label === label);
              return (
                <div key={label} className="flex items-center justify-between text-xs py-1">
                  <span style={{ color: cfg?.color ?? '#9CA3AF' }}>{label}</span>
                  <span className="text-gray-300 font-bold">x{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Play Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4 max-w-xl mx-auto">
        <Button
          onClick={() => doPlay(1)}
          disabled={playing || gold < COST_1}
          className="py-3 bg-dungeon-panel border border-yellow-500/30 hover:border-yellow-500/60 hover:bg-yellow-500/10 transition-all disabled:opacity-40"
        >
          <div className="text-center">
            <p className="text-sm font-bold text-yellow-400">1회</p>
            <p className="text-[10px] text-gray-400">{COST_1.toLocaleString()}G</p>
          </div>
        </Button>
        <Button
          onClick={() => doPlay(10)}
          disabled={playing || gold < COST_10}
          className="py-3 bg-dungeon-panel border border-yellow-500/40 hover:border-yellow-500/70 hover:bg-yellow-500/15 transition-all disabled:opacity-40 relative"
        >
          <div className="text-center">
            <p className="text-sm font-bold text-yellow-300">10회</p>
            <p className="text-[10px] text-gray-400">{COST_10.toLocaleString()}G</p>
          </div>
          <span className="absolute -top-2 -right-1 text-[9px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-bold">
            -10%
          </span>
        </Button>
        <Button
          onClick={() => doPlay(100)}
          disabled={playing || gold < COST_100}
          className="py-3 bg-dungeon-panel border border-yellow-500/50 hover:border-yellow-500/80 hover:bg-yellow-500/20 transition-all disabled:opacity-40 relative"
        >
          <div className="text-center">
            <p className="text-sm font-bold text-yellow-200">100회</p>
            <p className="text-[10px] text-gray-400">{COST_100.toLocaleString()}G</p>
          </div>
          <span className="absolute -top-2 -right-1 text-[9px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-bold">
            -20%
          </span>
        </Button>
      </div>

      {/* Single Result Display */}
      {singlePocket != null && !playing && (
        <div
          className="mb-4 p-4 text-center rounded-lg border-2 bg-dungeon-panel max-w-xl mx-auto"
          style={{ borderColor: singlePocketColor + '80' }}
        >
          <p className="text-xs text-gray-500 mb-1">결과</p>
          <p className="text-2xl font-bold mb-1" style={{ color: singlePocketColor }}>
            {singlePocketLabel}
          </p>
          {singlePocket === 0 && (
            <div className="mt-2 text-yellow-400 animate-pulse text-sm font-bold">
              JACKPOT!
            </div>
          )}
        </div>
      )}

      {/* Multi Result Summary */}
      {multiSummary && !playing && (
        <div className="mb-4 p-4 rounded-lg border border-gray-700 bg-dungeon-panel max-w-xl mx-auto">
          <h3 className="text-sm font-bold text-yellow-400 mb-3">결과 요약</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(multiSummary.counts).map(([label, count]) => {
              const cfg = POCKET_CONFIG.find((s) => s.label === label);
              return (
                <span
                  key={label}
                  className="text-xs px-2 py-1 rounded-lg border"
                  style={{
                    borderColor: (cfg?.color ?? '#6B7280') + '60',
                    backgroundColor: (cfg?.color ?? '#6B7280') + '15',
                    color: cfg?.color ?? '#9CA3AF',
                  }}
                >
                  {label} x{count}
                </span>
              );
            })}
          </div>
          <div className="border-t border-dungeon-border pt-2 text-sm">
            <p className="text-gray-300">
              총 획득:{' '}
              {multiSummary.totalGold > 0 && (
                <span className="text-yellow-400 font-bold">{multiSummary.totalGold.toLocaleString()}G</span>
              )}
              {multiSummary.totalGems > 0 && (
                <span className="text-cyan-400 font-bold ml-2">+{multiSummary.totalGems}젬</span>
              )}
              {multiSummary.totalItems > 0 && (
                <span className="text-green-400 font-bold ml-2">+아이템 {multiSummary.totalItems}개</span>
              )}
              {multiSummary.totalGold === 0 && multiSummary.totalGems === 0 && multiSummary.totalItems === 0 && (
                <span className="text-gray-500">없음</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="text-center text-[11px] text-gray-600 space-y-0.5 mt-6">
        <p>총 플레이: {stats.totalPlays.toLocaleString()}회</p>
        <p>총 투입: {stats.totalSpent.toLocaleString()}G</p>
        <p>
          총 획득: {stats.totalGoldWon.toLocaleString()}G
          {stats.totalGemsWon > 0 && ` + ${stats.totalGemsWon}젬`}
        </p>
      </div>

      {/* Pocket Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-1">
        {POCKET_CONFIG.map((s) => (
          <span
            key={s.id}
            className="text-[9px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: s.color + '20', color: s.color }}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default PachinkoScreen;
