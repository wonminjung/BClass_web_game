import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { toast } from '@/components/common/Toast';

/* ── Reward types & colors ── */
const SLOT_CONFIG = [
  { id: 'miss',         label: '꽝',       color: '#6B7280' },
  { id: 'gold_small',   label: '소량 골드', color: '#D4A017' },
  { id: 'gold_medium',  label: '중량 골드', color: '#EAB308' },
  { id: 'gold_large',   label: '대량 골드', color: '#F59E0B' },
  { id: 'stone_normal', label: '일반 강화석', color: '#22C55E' },
  { id: 'stone_rare',   label: '희귀 강화석', color: '#3B82F6' },
  { id: 'stone_epic',   label: '영웅 강화석', color: '#8B5CF6' },
  { id: 'gem',          label: '젬',       color: '#06B6D4' },
  { id: 'jackpot',      label: '잭팟',     color: '#EF4444' },
] as const;

type Position = 'left' | 'center' | 'right';

interface PlayResult {
  slot: number;
  reward: {
    type: string;
    label: string;
    amount: number;
    unit: string;
  };
}

interface MultiSummary {
  counts: Record<string, number>;
  totalGold: number;
  totalGems: number;
  totalStones: number;
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
const COST_1 = 10_000;
const COST_10 = 90_000;
const COST_100 = 800_000;

const BOARD_W = 360;
const BOARD_H = 420;
const PEG_ROWS = 7;
const SLOT_COUNT = 9;
const SLOT_W = BOARD_W / SLOT_COUNT;

/* ── Pre-calculated ball paths (one per target slot 0-8) ── */
function buildPath(slotIndex: number, startX: number): { x: number; y: number }[] {
  const targetX = SLOT_W * slotIndex + SLOT_W / 2;
  const steps = 10;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Ease toward target X with some wobble
    const wobble = Math.sin(t * Math.PI * 4) * (1 - t) * 30;
    const x = startX + (targetX - startX) * t + wobble;
    const y = t * (BOARD_H - 40);
    points.push({ x, y });
  }
  return points;
}

/* ── Peg positions ── */
function buildPegs(): { x: number; y: number }[] {
  const pegs: { x: number; y: number }[] = [];
  for (let row = 0; row < PEG_ROWS; row++) {
    const count = row % 2 === 0 ? 8 : 9;
    const offset = row % 2 === 0 ? SLOT_W / 2 : 0;
    for (let col = 0; col < count; col++) {
      pegs.push({
        x: offset + col * (BOARD_W / (count - 1 || 1)),
        y: 30 + row * 45,
      });
    }
  }
  return pegs;
}

const PEGS = buildPegs();

/* ── Component ── */
function PachinkoScreen() {
  const navigate = useNavigate();
  const saveData = useAuthStore((s) => s.saveData);
  const updateSaveData = useAuthStore((s) => s.updateSaveData);

  const [position, setPosition] = useState<Position>('center');
  const [playing, setPlaying] = useState(false);
  const [singleResult, setSingleResult] = useState<PlayResult | null>(null);
  const [multiSummary, setMultiSummary] = useState<MultiSummary | null>(null);
  const [multiProgress, setMultiProgress] = useState<{ current: number; total: number } | null>(null);
  const [stats, setStats] = useState<PachinkoStats>(loadStats);
  const [_litSlot, setLitSlot] = useState<number | null>(null);

  const animFrameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gold = saveData?.gold ?? 0;

  /* ── Draw board ── */
  const drawBoard = useCallback((ballPos?: { x: number; y: number }, highlightSlot?: number | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = BOARD_W * dpr;
    canvas.height = BOARD_H * dpr;
    ctx.scale(dpr, dpr);

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, BOARD_H);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    // Border
    ctx.strokeStyle = '#4c1d95';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, BOARD_W - 2, BOARD_H - 2);

    // Pegs
    for (const peg of PEGS) {
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#7c3aed';
      ctx.fill();
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Slot dividers + labels
    const slotY = BOARD_H - 35;
    for (let i = 0; i < SLOT_COUNT; i++) {
      const x = i * SLOT_W;
      const cfg = SLOT_CONFIG[i];
      const isHighlighted = highlightSlot === i;

      // Slot background
      if (isHighlighted) {
        ctx.fillStyle = cfg.color + '60';
        ctx.fillRect(x, slotY, SLOT_W, 35);
        // Glow
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = cfg.color + '40';
        ctx.fillRect(x, slotY, SLOT_W, 35);
        ctx.shadowBlur = 0;
      }

      // Divider
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(x, slotY);
        ctx.lineTo(x, BOARD_H);
        ctx.strokeStyle = '#4c1d95';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Slot label
      ctx.fillStyle = isHighlighted ? '#fff' : cfg.color;
      ctx.font = `bold ${isHighlighted ? 9 : 8}px sans-serif`;
      ctx.textAlign = 'center';

      // For jackpot, draw with gradient effect
      if (cfg.id === 'jackpot') {
        const grad = ctx.createLinearGradient(x, slotY + 10, x + SLOT_W, slotY + 25);
        grad.addColorStop(0, '#EF4444');
        grad.addColorStop(1, '#F59E0B');
        ctx.fillStyle = grad;
      }
      ctx.fillText(cfg.label, x + SLOT_W / 2, slotY + 14);

      // Slot color indicator bar
      ctx.fillStyle = cfg.color;
      ctx.fillRect(x + 4, BOARD_H - 6, SLOT_W - 8, 4);
    }

    // Horizontal line above slots
    ctx.beginPath();
    ctx.moveTo(0, slotY);
    ctx.lineTo(BOARD_W, slotY);
    ctx.strokeStyle = '#6d28d9';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ball
    if (ballPos) {
      ctx.beginPath();
      ctx.arc(ballPos.x, ballPos.y, 8, 0, Math.PI * 2);
      const ballGrad = ctx.createRadialGradient(ballPos.x - 2, ballPos.y - 2, 1, ballPos.x, ballPos.y, 8);
      ballGrad.addColorStop(0, '#fbbf24');
      ballGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = ballGrad;
      ctx.fill();
      ctx.strokeStyle = '#fcd34d';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Ball glow
      ctx.beginPath();
      ctx.arc(ballPos.x, ballPos.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
      ctx.fill();
    }
  }, []);

  /* ── Initial draw ── */
  useEffect(() => {
    drawBoard();
  }, [drawBoard]);

  /* ── Animate single ball ── */
  const animateBall = useCallback((path: { x: number; y: number }[], slotIndex: number, onDone: () => void) => {
    let step = 0;
    const totalSteps = path.length;
    const frameDuration = 80; // ms between frames

    const animate = () => {
      if (step >= totalSteps) {
        setLitSlot(slotIndex);
        drawBoard(path[totalSteps - 1], slotIndex);
        onDone();
        return;
      }
      drawBoard(path[step], step >= totalSteps - 2 ? slotIndex : null);
      step++;
      animFrameRef.current = window.setTimeout(animate, frameDuration) as unknown as number;
    };
    animate();
  }, [drawBoard]);

  /* ── API call ── */
  const doPlay = useCallback(async (count: 1 | 10 | 100) => {
    const cost = count === 1 ? COST_1 : count === 10 ? COST_10 : COST_100;
    if (gold < cost) {
      toast.error('골드가 부족합니다.');
      return;
    }

    setPlaying(true);
    setSingleResult(null);
    setMultiSummary(null);
    setLitSlot(null);
    setMultiProgress(count > 1 ? { current: 0, total: count } : null);

    try {
      const res = await axios.post('/api/pachinko/play', { position, count });
      if (!res.data.success) {
        toast.error(res.data.message || '플레이에 실패했습니다.');
        setPlaying(false);
        setMultiProgress(null);
        return;
      }

      const results: PlayResult[] = res.data.results;
      if (res.data.saveData) {
        updateSaveData(res.data.saveData);
      }

      // Update stats
      setStats((prev) => {
        const next = {
          ...prev,
          totalPlays: prev.totalPlays + count,
          totalSpent: prev.totalSpent + cost,
          totalGoldWon: prev.totalGoldWon + (res.data.totalGold ?? 0),
          totalGemsWon: prev.totalGemsWon + (res.data.totalGems ?? 0),
        };
        saveStats(next);
        return next;
      });

      if (count === 1 && results.length === 1) {
        // Single play: full animation
        const result = results[0];
        const startX = position === 'left' ? BOARD_W * 0.2 : position === 'right' ? BOARD_W * 0.8 : BOARD_W * 0.5;
        const path = buildPath(result.slot, startX);
        animateBall(path, result.slot, () => {
          setSingleResult(result);
          setPlaying(false);
        });
      } else {
        // Multi play: rapid-fire
        const startX = position === 'left' ? BOARD_W * 0.2 : position === 'right' ? BOARD_W * 0.8 : BOARD_W * 0.5;
        let idx = 0;

        const nextBall = () => {
          if (idx >= results.length) {
            // Show summary
            const summary = buildMultiSummary(results);
            setMultiSummary(summary);
            setMultiProgress(null);
            setPlaying(false);
            drawBoard(undefined, undefined);
            return;
          }

          const result = results[idx];
          const path = buildPath(result.slot, startX);
          setMultiProgress({ current: idx + 1, total: count });

          // Quick animation: only show start and end
          drawBoard(path[0], null);
          setTimeout(() => {
            drawBoard(path[path.length - 1], result.slot);
            setLitSlot(result.slot);
            idx++;
            setTimeout(nextBall, 60);
          }, 40);
        };
        nextBall();
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : '파칭코 플레이에 실패했습니다.';
      toast.error(msg);
      setPlaying(false);
      setMultiProgress(null);
    }
  }, [gold, position, updateSaveData, animateBall, drawBoard]);

  /* Cleanup timeouts on unmount */
  useEffect(() => {
    return () => {
      if (animFrameRef.current) clearTimeout(animFrameRef.current);
    };
  }, []);

  /* Build multi-play summary */
  const buildMultiSummary = (results: PlayResult[]): MultiSummary => {
    const counts: Record<string, number> = {};
    let totalGold = 0;
    let totalGems = 0;
    let totalStones = 0;

    for (const r of results) {
      const label = r.reward.label;
      counts[label] = (counts[label] ?? 0) + 1;
      if (r.reward.unit === 'G') totalGold += r.reward.amount;
      if (r.reward.unit === '젬') totalGems += r.reward.amount;
      if (r.reward.unit === '개') totalStones += r.reward.amount;
    }
    return { counts, totalGold, totalGems, totalStones };
  };

  const slotColorForResult = useMemo(() => {
    if (singleResult == null) return '#fff';
    return SLOT_CONFIG[singleResult.slot]?.color ?? '#fff';
  }, [singleResult]);

  if (!saveData) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 min-h-screen">
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

      {/* Position Selector */}
      <div className="flex gap-2 mb-4 justify-center">
        {([
          { pos: 'left' as Position, icon: '\u25C0', label: '좌측', sub: '강화석\u2191' },
          { pos: 'center' as Position, icon: '\u25CF', label: '중앙', sub: '밸런스' },
          { pos: 'right' as Position, icon: '\u25B6', label: '우측', sub: '골드/젬\u2191' },
        ]).map(({ pos, icon, label, sub }) => (
          <button
            key={pos}
            type="button"
            disabled={playing}
            onClick={() => setPosition(pos)}
            className={`flex-1 max-w-[120px] py-2 px-3 rounded-lg border text-center transition-all ${
              position === pos
                ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400 shadow-lg shadow-yellow-500/20'
                : 'border-gray-700 bg-dungeon-panel text-gray-500 hover:border-gray-500'
            } disabled:cursor-not-allowed`}
          >
            <div className="text-lg">{icon}</div>
            <div className="text-xs font-bold">{label}</div>
            <div className="text-[10px] text-gray-500">{sub}</div>
          </button>
        ))}
      </div>

      {/* Pachinko Board */}
      <Card className="mb-4 p-3 flex justify-center">
        <canvas
          ref={canvasRef}
          style={{ width: BOARD_W, height: BOARD_H }}
          className="rounded-lg"
        />
      </Card>

      {/* Multi-play progress bar */}
      {multiProgress && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{multiProgress.current}/{multiProgress.total} 진행중...</span>
            <span>{Math.round((multiProgress.current / multiProgress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-dungeon-bg rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-yellow-500 transition-all duration-100"
              style={{ width: `${(multiProgress.current / multiProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Play Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
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
      {singleResult && !playing && (
        <div
          className="mb-4 p-4 text-center rounded-lg border-2 bg-dungeon-panel"
          style={{ borderColor: slotColorForResult + '80' }}
        >
          <p className="text-xs text-gray-500 mb-1">결과</p>
          <p className="text-2xl font-bold mb-1" style={{ color: slotColorForResult }}>
            {singleResult.reward.label}
          </p>
          <p className="text-lg font-bold text-gray-200">
            +{singleResult.reward.amount.toLocaleString()} {singleResult.reward.unit}
          </p>
          {singleResult.slot === 8 && (
            <div className="mt-2 text-yellow-400 animate-pulse text-sm font-bold">
              JACKPOT!
            </div>
          )}
        </div>
      )}

      {/* Multi Result Summary */}
      {multiSummary && !playing && (
        <Card className="mb-4 p-4">
          <h3 className="text-sm font-bold text-yellow-400 mb-3">결과 요약</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(multiSummary.counts).map(([label, count]) => {
              const cfg = SLOT_CONFIG.find((s) => s.label === label);
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
              {multiSummary.totalStones > 0 && (
                <span className="text-green-400 font-bold ml-2">+강화석 {multiSummary.totalStones}개</span>
              )}
              {multiSummary.totalGold === 0 && multiSummary.totalGems === 0 && multiSummary.totalStones === 0 && (
                <span className="text-gray-500">없음</span>
              )}
            </p>
          </div>
        </Card>
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

      {/* Slot Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-1">
        {SLOT_CONFIG.map((s) => (
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
