import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { toast, confirm } from '@/components/common/Toast';
import type { PassiveNode } from '@shared/types/passiveTree';

/* ── Color helpers ── */

function statColor(stat?: string): string {
  if (!stat) return '#9CA3AF';
  if (/atk|damage|penetration|defIgnore|reflect|dot|aoe|skill/i.test(stat)) return '#EF4444';
  if (/def/i.test(stat)) return '#3B82F6';
  if (/hp|life|hpRegen/i.test(stat)) return '#10B981';
  if (/crit/i.test(stat)) return '#EAB308';
  if (/spd|cooldown/i.test(stat)) return '#06B6D4';
  if (/mp|mana/i.test(stat)) return '#A855F7';
  if (/gold|drop|exp/i.test(stat)) return '#F59E0B';
  return '#9CA3AF';
}

/* ── Shape paths ── */

function diamondPath(cx: number, cy: number, r: number) {
  return `M${cx},${cy - r} L${cx + r},${cy} L${cx},${cy + r} L${cx - r},${cy} Z`;
}

function hexPath(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return `M${pts.join(' L')} Z`;
}

/* ── Constants ── */

const CANVAS = 1000;
const RESET_COST = 10000;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;

/* ── Component ── */

export default function PassiveTreeScreen() {
  const navigate = useNavigate();
  const { saveData, updateSaveData } = useAuth();

  const [tree, setTree] = useState<PassiveNode[]>([]);
  const [allocated, setAllocated] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<PassiveNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Pan/zoom state
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: CANVAS, h: CANVAS });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Fetch tree data ── */

  const fetchTree = useCallback(async () => {
    try {
      const res = await axios.get('/api/passive/tree');
      const nodes = res.data.data?.nodes ?? res.data.nodes ?? [];
      const alloc = res.data.data?.allocatedNodes ?? res.data.allocatedNodes ?? [];
      // Auto-allocate start node if not already
      if (!alloc.includes('start')) {
        alloc.push('start');
        // Also tell server
        axios.post('/api/passive/allocate', { nodeId: 'start' }).catch(() => {});
      }
      setTree(nodes);
      setAllocated(alloc);
    } catch {
      toast.error('특성 트리를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  /* ── Derived data ── */

  const nodeMap = useMemo(() => {
    const m = new Map<string, PassiveNode>();
    tree.forEach((n) => m.set(n.id, n));
    return m;
  }, [tree]);

  const allocatedSet = useMemo(() => new Set(allocated), [allocated]);
  const allocatedCount = useMemo(() => {
    const m = new Map<string, number>();
    allocated.forEach((id) => m.set(id, (m.get(id) ?? 0) + 1));
    return m;
  }, [allocated]);

  const MAX_BY_TYPE: Record<string, number> = { start: 1, minor: 3, notable: 10, keystone: 5 };

  const totalAllocated = useMemo(
    () => allocated.reduce((s, nId) => {
      const n = nodeMap.get(nId);
      return s + (n?.cost ?? 0);
    }, 0),
    [allocated, nodeMap],
  );

  // Total points needed to max everything

  // Aggregate invested stats
  const investedStats = useMemo(() => {
    const stats: Record<string, { label: string; value: number; unit: string }> = {};
    const STAT_LABELS: Record<string, [string, string]> = {
      atkPercent: ['공격력', '%'], defPercent: ['방어력', '%'], hpPercent: ['HP', '%'], mpPercent: ['MP', '%'],
      spdFlat: ['속도', ''], critRate: ['크리율', '%'], critDamage: ['크리뎀', '%'],
      goldPercent: ['골드', '%'], expPercent: ['경험치', '%'], dropPercent: ['드랍률', '%'],
      lifesteal: ['흡혈', '%'], reflect: ['반사', '%'], penetration: ['관통', '%'],
      defIgnore: ['방무시', '%'], skillDamage: ['스킬뎀', '%'], cooldownReduce: ['쿨감', '턴'],
      aoeDamage: ['광역뎀', '%'], dotDamage: ['DoT뎀', '%'], manaRegen: ['MP재생', '%'], hpRegen: ['HP재생', '%'],
    };
    allocated.forEach((nId) => {
      const n = nodeMap.get(nId);
      if (!n?.effect.stat || !n.effect.value) return;
      const key = n.effect.stat;
      if (!stats[key]) {
        const [label, unit] = STAT_LABELS[key] ?? [key, ''];
        stats[key] = { label, value: 0, unit };
      }
      stats[key].value += n.effect.value;
    });
    // Collect special (keystone/notable) effects with investment level
    const specials: { name: string; type: string; desc: string; level: number; maxLevel: number }[] = [];
    const seenSpecials = new Set<string>();
    allocated.forEach((nId) => {
      const n = nodeMap.get(nId);
      if (n?.effect.special && !seenSpecials.has(n.id)) {
        seenSpecials.add(n.id);
        const count = allocatedCount.get(n.id) ?? 0;
        const maxLv = MAX_BY_TYPE[n.type] ?? 1;
        specials.push({ name: n.name, type: n.type, desc: n.effect.description, level: count, maxLevel: maxLv });
      }
    });
    return { stats, specials };
  }, [allocated, nodeMap],
  );

  const prestige = saveData?.prestigeLevel ?? 0;
  const maxPassivePoints = 300 + prestige;
  const level = Math.min(saveData?.level ?? 1, maxPassivePoints);
  const availablePoints = level - totalAllocated;

  const availableNodes = useMemo(() => {
    const s = new Set<string>();
    const hasAnyAllocated = allocatedSet.size > 0;
    tree.forEach((n) => {
      const count = allocatedCount.get(n.id) ?? 0;
      const maxLevel = MAX_BY_TYPE[n.type] ?? 1;
      if (count >= maxLevel) return;
      if (n.cost > availablePoints) return;
      // Start node is always available if nothing allocated yet
      if (n.type === 'start' && !hasAnyAllocated) { s.add(n.id); return; }
      // Already invested but not maxed -> can keep investing
      if (count > 0) { s.add(n.id); return; }
      // New node: neighbor must be at MAX level to unlock
      const hasMaxedNeighbor = n.connections.some((cid) => {
        const neighborNode = nodeMap.get(cid);
        if (!neighborNode) return false;
        if (neighborNode.type === 'start') return true; // start is always "maxed"
        const neighborCount = allocatedCount.get(cid) ?? 0;
        const neighborMax = MAX_BY_TYPE[neighborNode.type] ?? 1;
        return neighborCount >= neighborMax;
      });
      if (hasMaxedNeighbor) s.add(n.id);
    });
    return s;
  }, [tree, allocatedSet, allocatedCount, availablePoints, nodeMap]);

  /* ── Allocate ── */

  const handleAllocate = useCallback(
    async (nodeId: string) => {
      if (!availableNodes.has(nodeId)) return;
      try {
        const res = await axios.post('/api/passive/allocate', { nodeId });
        if (res.data.success) {
          setAllocated((prev) => [...prev, nodeId]);
          if (res.data.saveData) updateSaveData(res.data.saveData);
          toast.success('특성 노드 활성화!');
        }
      } catch (e: any) {
        toast.error(e.response?.data?.error ?? '할당에 실패했습니다');
      }
    },
    [availableNodes, updateSaveData],
  );

  /* ── Reset ── */

  const handleReset = useCallback(async () => {
    const ok = await confirm(
      `특성 초기화에 ${RESET_COST.toLocaleString()} 골드가 필요합니다.\n초기화하시겠습니까?`,
    );
    if (!ok) return;
    try {
      const res = await axios.post('/api/passive/reset');
      if (res.data.success) {
        setAllocated([]);
        if (res.data.saveData) updateSaveData(res.data.saveData);
        toast.success('특성 트리가 초기화되었습니다');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? '초기화에 실패했습니다');
    }
  }, [updateSaveData]);

  /* ── Pan & Zoom ── */

  // Native wheel handler to prevent page scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setViewBox((vb) => {
        const factor = e.deltaY > 0 ? 1.1 : 0.9;
        const rect = el.getBoundingClientRect();

        const mx = vb.x + (e.clientX - rect.left) / rect.width * vb.w;
        const my = vb.y + (e.clientY - rect.top) / rect.height * vb.h;

        let nw = vb.w * factor;
        let nh = vb.h * factor;
        nw = Math.max(CANVAS / MAX_ZOOM, Math.min(CANVAS / MIN_ZOOM, nw));
        nh = Math.max(CANVAS / MAX_ZOOM, Math.min(CANVAS / MIN_ZOOM, nh));

        const nx = mx - (mx - vb.x) * (nw / vb.w);
        const ny = my - (my - vb.y) * (nh / vb.h);

        return { x: nx, y: ny, w: nw, h: nh };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [viewBox],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = (e.clientX - panStart.current.x) / rect.width * viewBox.w;
      const dy = (e.clientY - panStart.current.y) / rect.height * viewBox.h;
      setViewBox((vb) => ({ ...vb, x: panStart.current.vx - dx, y: panStart.current.vy - dy }));
    },
    [isPanning, viewBox.w, viewBox.h],
  );

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  /* ── Tooltip helpers ── */

  const handleNodeHover = useCallback(
    (node: PassiveNode, e: React.MouseEvent) => {
      setHovered(node);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    },
    [],
  );

  const handleNodeLeave = useCallback(() => {
    setHovered(null);
  }, []);

  /* ── Render connections ── */

  const connections = useMemo(() => {
    const drawn = new Set<string>();
    const lines: JSX.Element[] = [];

    tree.forEach((node) => {
      node.connections.forEach((cid) => {
        const key = [node.id, cid].sort().join('|');
        if (drawn.has(key)) return;
        drawn.add(key);
        const other = nodeMap.get(cid);
        if (!other) return;

        const aAlloc = allocatedSet.has(node.id);
        const bAlloc = allocatedSet.has(cid);
        const aAvail = availableNodes.has(node.id);
        const bAvail = availableNodes.has(cid);

        let color = '#2A2A3A';
        let width = 1;
        let opacity = 0.4;

        if (aAlloc && bAlloc) {
          color = '#EAB308';
          width = 2.5;
          opacity = 0.9;
        } else if ((aAlloc && bAvail) || (bAlloc && aAvail)) {
          color = '#EAB308';
          width = 1.5;
          opacity = 0.4;
        } else if (aAlloc || bAlloc) {
          color = '#6B7280';
          width = 1;
          opacity = 0.5;
        }

        lines.push(
          <line
            key={key}
            x1={node.x}
            y1={node.y}
            x2={other.x}
            y2={other.y}
            stroke={color}
            strokeWidth={width}
            opacity={opacity}
          />,
        );
      });
    });
    return lines;
  }, [tree, nodeMap, allocatedSet, availableNodes]);

  /* ── Render nodes ── */

  const renderedNodes = useMemo(() => {
    return tree.map((node) => {
      const isAlloc = allocatedSet.has(node.id);
      const count = allocatedCount.get(node.id) ?? 0;
      const maxLevel = MAX_BY_TYPE[node.type] ?? 1;
      const isAvail = availableNodes.has(node.id);
      const col = isAlloc ? statColor(node.effect.stat) : '#4B5563';
      const cursor = isAvail ? 'pointer' : (isAlloc && count >= maxLevel) ? 'default' : 'not-allowed';

      const filterUrl = isAlloc ? `url(#glow-${node.id})` : undefined;

      let shape: JSX.Element;

      switch (node.type) {
        case 'start':
          shape = (
            <circle
              cx={node.x}
              cy={node.y}
              r={8}
              fill="#EAB308"
              stroke="#FDE047"
              strokeWidth={2}
            />
          );
          break;

        case 'minor':
          shape = (
            <circle
              cx={node.x}
              cy={node.y}
              r={6}
              fill={isAlloc ? col : '#1F2937'}
              stroke={isAlloc ? col : isAvail ? '#9CA3AF' : '#374151'}
              strokeWidth={isAlloc ? 2 : 1.5}
            />
          );
          break;

        case 'notable':
          shape = (
            <path
              d={diamondPath(node.x, node.y, 10)}
              fill={isAlloc ? col : '#1F2937'}
              stroke={isAlloc ? '#F97316' : isAvail ? '#9CA3AF' : '#4B5563'}
              strokeWidth={isAlloc ? 2.5 : 1.5}
            />
          );
          break;

        case 'keystone':
          shape = (
            <path
              d={hexPath(node.x, node.y, 14)}
              fill={isAlloc ? col : '#1F2937'}
              stroke={isAlloc ? '#EAB308' : isAvail ? '#D4A017' : '#6B7280'}
              strokeWidth={isAlloc ? 3 : 2}
            />
          );
          break;
      }

      return (
        <g
          key={node.id}
          style={{ cursor, filter: filterUrl }}
          onClick={(e) => {
            e.stopPropagation();
            if (isAvail) handleAllocate(node.id);
          }}
          onMouseEnter={(e) => handleNodeHover(node, e)}
          onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
          onMouseLeave={handleNodeLeave}
        >
          {/* Glow filter */}
          {isAlloc && (
            <defs>
              <filter id={`glow-${node.id}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation={node.type === 'keystone' ? 5 : node.type === 'notable' ? 4 : 3}
                  result="blur"
                />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          )}
          {shape}
          {/* Icon/emoji label */}
          {node.icon && (
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={node.type === 'keystone' ? 11 : node.type === 'notable' ? 9 : 7}
              fill="#fff"
              pointerEvents="none"
            >
              {node.icon}
            </text>
          )}
          {/* Level count badge */}
          {count > 0 && maxLevel > 1 && node.type !== 'start' && (
            <text
              x={node.x + (node.type === 'keystone' ? 14 : node.type === 'notable' ? 11 : 8)}
              y={node.y - (node.type === 'keystone' ? 10 : node.type === 'notable' ? 8 : 5)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={6}
              fill={count >= maxLevel ? '#EAB308' : '#D1D5DB'}
              fontWeight="bold"
              pointerEvents="none"
            >
              {count}/{maxLevel}
            </text>
          )}
        </g>
      );
    });
  }, [tree, allocatedSet, allocatedCount, availableNodes, handleAllocate, handleNodeHover, handleNodeLeave]);

  /* ── Background stars ── */

  const stars = useMemo(() => {
    const s: JSX.Element[] = [];
    const rng = (seed: number) => {
      let x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 200; i++) {
      s.push(
        <circle
          key={`star-${i}`}
          cx={rng(i * 7 + 1) * CANVAS}
          cy={rng(i * 13 + 3) * CANVAS}
          r={rng(i * 3 + 5) * 1.2 + 0.3}
          fill="#fff"
          opacity={rng(i * 11 + 7) * 0.15 + 0.05}
        />,
      );
    }
    return s;
  }, []);

  /* ── Loading ── */

  if (loading) {
    return (
      <div className="min-h-screen bg-dungeon-dark flex items-center justify-center">
        <p className="text-gray-400 animate-pulse text-lg">특성 트리 로딩 중...</p>
      </div>
    );
  }

  /* ── Render ── */

  return (
    <div className="h-screen overflow-hidden bg-dungeon-dark flex flex-col relative select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-dungeon-darker/80 border-b border-dungeon-border z-10">
        <button
          onClick={() => navigate('/home')}
          className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          <span>&larr;</span> 돌아가기
        </button>
        <h1 className="text-lg font-bold text-dungeon-accent">특성 트리</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">
            포인트: <span className="text-dungeon-accent font-bold">{availablePoints}</span>
            <span className="text-gray-500 text-xs ml-1">/ {level}</span>
          </span>
          <span className="text-xs text-gray-500">배분: {totalAllocated}</span>
          <button
            onClick={handleReset}
            className="text-xs px-3 py-1.5 rounded bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-700/40 transition-colors"
          >
            초기화
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
      {/* ═══ Left Panel: 투자 요약 ═══ */}
      <div className="w-[220px] flex-shrink-0 bg-black/80 border-r border-gray-700/50 overflow-y-auto">
        <div className="p-3 space-y-3">
          {/* Points summary */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">포인트</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">사용</span>
              <span className="text-white font-bold">{totalAllocated}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">잔여</span>
              <span className="text-dungeon-accent font-bold">{availablePoints.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">레벨</span>
              <span className="text-gray-500">{level}</span>
            </div>
          </div>

          <div className="border-t border-gray-700/50" />

          {/* Stat bonuses */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">투자 스탯</h3>
            {Object.entries(investedStats.stats).length === 0 ? (
              <p className="text-[11px] text-gray-600">아직 투자한 스탯이 없습니다</p>
            ) : (
              Object.entries(investedStats.stats).map(([key, { label, value, unit }]) => (
                <div key={key} className="flex justify-between text-[11px]">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-bold ${
                    key.includes('atk') || key.includes('skill') || key.includes('aoe') || key.includes('dot') ? 'text-red-400' :
                    key.includes('def') || key.includes('reflect') ? 'text-blue-400' :
                    key.includes('hp') ? 'text-green-400' :
                    key.includes('mp') || key.includes('mana') ? 'text-purple-400' :
                    key.includes('crit') ? 'text-yellow-400' :
                    key.includes('spd') || key.includes('cool') ? 'text-cyan-400' :
                    key.includes('gold') || key.includes('exp') || key.includes('drop') ? 'text-amber-400' :
                    'text-gray-300'
                  }`}>
                    +{unit === '%' ? (value * 100).toFixed(2) : Number.isInteger(value) ? value : value.toFixed(2)}{unit}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Special effects */}
          {investedStats.specials.length > 0 && (
            <>
              <div className="border-t border-gray-700/50" />
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider">특수 효과</h3>
                {investedStats.specials.map((sp, i) => (
                  <div key={i} className="bg-yellow-900/20 rounded px-2 py-1.5 border border-yellow-800/30">
                    <div className="flex items-center justify-between">
                      <p className={`text-[10px] font-bold ${sp.type === 'keystone' ? 'text-yellow-400' : 'text-orange-400'}`}>
                        {sp.type === 'keystone' ? '\u2B50' : '\u25C6'} {sp.name}
                      </p>
                      <span className={`text-[9px] font-bold ${sp.level >= sp.maxLevel ? 'text-green-400' : 'text-gray-400'}`}>
                        {sp.level}/{sp.maxLevel}
                      </span>
                    </div>
                    <p className="text-[9px] text-yellow-300/70 mt-0.5">{sp.desc}</p>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${sp.level >= sp.maxLevel ? 'bg-green-500' : 'bg-yellow-600'}`}
                        style={{ width: `${(sp.level / sp.maxLevel) * 100}%` }}
                      />
                    </div>
                    <p className="text-[8px] text-gray-500 mt-0.5">효과: {Math.round((sp.level / sp.maxLevel) * 100)}%</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="border-t border-gray-700/50" />

          {/* Preset save/load */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">프리셋 저장</h3>
            {[0, 1, 2].map((slot) => {
              const key = `passivePreset_${saveData?.characterId ?? 'unknown'}_${slot}`;
              const saved = localStorage.getItem(key);
              const savedData: string[] | null = saved ? JSON.parse(saved) : null;
              const savedCount = savedData?.length ?? 0;
              return (
                <div key={slot} className="flex gap-1">
                  <button
                    onClick={() => {
                      localStorage.setItem(key, JSON.stringify(allocated));
                      toast.success(`프리셋 ${slot + 1} 저장 완료 (${allocated.length}개 노드)`);
                    }}
                    className="flex-1 text-[10px] py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                  >
                    저장 {slot + 1}
                  </button>
                  <button
                    onClick={async () => {
                      if (!savedData || savedData.length === 0) {
                        toast.error('저장된 프리셋이 없습니다');
                        return;
                      }
                      const ok = await confirm(`프리셋 ${slot + 1} (${savedCount}개 노드)을 불러오시겠습니까?\n현재 트리를 초기화하고 순차적으로 투자합니다.`);
                      if (!ok) return;
                      // Reset first
                      try {
                        await axios.post('/api/passive/reset');
                        setAllocated([]);
                      } catch { toast.error('초기화 실패'); return; }
                      // Apply nodes sequentially
                      let applied = 0;
                      for (const nodeId of savedData) {
                        try {
                          const res = await axios.post('/api/passive/allocate', { nodeId });
                          if (res.data.success) {
                            applied++;
                            setAllocated((prev) => [...prev, nodeId]);
                            if (res.data.saveData) updateSaveData(res.data.saveData);
                          }
                        } catch { break; }
                      }
                      toast.success(`프리셋 ${slot + 1} 적용: ${applied}/${savedData.length}개 노드`);
                    }}
                    className={`flex-1 text-[10px] py-1 rounded border transition-colors ${
                      savedData
                        ? 'bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 border-blue-700/40'
                        : 'bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed'
                    }`}
                    disabled={!savedData}
                  >
                    {savedData ? `불러오기 (${savedCount})` : '비어있음'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          preserveAspectRatio="xMidYMid meet"
          className="bg-[#0B0D13]"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="#1A1C28"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect x="-500" y="-500" width="2000" height="2000" fill="url(#grid)" />

          {/* Stars */}
          {stars}

          {/* Connections */}
          {connections}

          {/* Nodes */}
          {renderedNodes}
        </svg>
      </div>

      </div>{/* end flex container */}

      {/* Tooltip */}
      {hovered && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipPos.x + 16,
            top: tooltipPos.y - 8,
            maxWidth: 260,
          }}
        >
          <div className="bg-gray-900 border border-gray-600 rounded-lg shadow-2xl px-3 py-2 text-sm" style={{ backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center gap-2 mb-1">
              {hovered.icon && <span className="text-base">{hovered.icon}</span>}
              <span
                className="font-bold"
                style={{
                  color:
                    hovered.type === 'keystone'
                      ? '#EAB308'
                      : hovered.type === 'notable'
                        ? '#F97316'
                        : '#E5E7EB',
                }}
              >
                {hovered.name}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 ml-auto">
                {hovered.type}
              </span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed">{hovered.effect.description}</p>
            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-700/50">
              <span className="text-xs text-gray-400">
                비용: <span className="text-dungeon-accent">{hovered.cost}</span> 포인트
              </span>
              {(() => {
                const c = allocatedCount.get(hovered.id) ?? 0;
                const mx = MAX_BY_TYPE[hovered.type] ?? 1;
                if (c > 0) return <span className="text-[10px] text-green-400 font-semibold">{c}/{mx} 투자</span>;
                if (availableNodes.has(hovered.id)) return <span className="text-[10px] text-yellow-400">클릭하여 활성화</span>;
                return null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
