import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGameStore } from '@/stores/gameStore';
import { CHARACTERS, ITEMS, TITLES } from '@shared/data';
import { calculateTotalStats } from '@shared/utils/calcStats';
import Card from '@/components/common/Card';
import StatBar from '@/components/common/StatBar';
import axios from 'axios';
import { toast } from '@/components/common/Toast';

const APPEARANCE_COLORS = [
  '#8B5CF6', // purple (default)
  '#EF4444', // red
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

function formatSaveCode(code: string): string {
  return code.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}

function StatValue({ label, base, equip }: { label: string; base: number; equip: number }) {
  const colors: Record<string, string> = {
    '공격력': 'text-red-400',
    '방어력': 'text-blue-400',
    '속도': 'text-green-400',
  };
  const color = colors[label] ?? 'text-gray-200';
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>
        {base + equip}
        {equip > 0 && <span className="text-xs text-green-400 ml-0.5">(+{equip})</span>}
      </p>
    </div>
  );
}

function StatPercent({ label, base, equip, color, doubleCritPercent }: { label: string; base: number; equip: number; color: string; doubleCritPercent?: number }) {
  const total = base + equip;
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>
        {Math.round(total * 100)}%
        {equip > 0 && <span className="text-xs text-green-400 ml-0.5">(+{Math.round(equip * 100)}%)</span>}
      </p>
      {doubleCritPercent !== undefined && doubleCritPercent > 0 && (
        <p className="text-[10px] text-orange-400 font-bold">(더블크리 {Math.round(doubleCritPercent)}%)</p>
      )}
    </div>
  );
}

function HomeScreen() {
  const navigate = useNavigate();
  const { saveCode, saveData, isAuthenticated, logout, updateSaveData } = useAuth();
  const { loadGameData } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [dailyStatus, setDailyStatus] = useState<{ canClaim: boolean; reward: { gold: number; description: string } } | null>(null);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [achievementToast, setAchievementToast] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
    loadGameData();
    axios.get('/api/daily/status').then((res) => {
      if (res.data) setDailyStatus(res.data);
    }).catch(() => {});
  }, [isAuthenticated, navigate, loadGameData]);

  useEffect(() => {
    const completed = saveData?.achievements?.length ?? 0;
    const lastSeen = parseInt(localStorage.getItem('lastSeenAchievements') ?? '0');
    if (completed > lastSeen) {
      const newCount = completed - lastSeen;
      setAchievementToast(`${newCount}개의 새로운 업적 달성!`);
      localStorage.setItem('lastSeenAchievements', String(completed));
      setTimeout(() => setAchievementToast(null), 3000);
    }
  }, [saveData?.achievements?.length]);

  const character = useMemo(
    () => CHARACTERS.find((c) => c.id === saveData?.characterId) ?? null,
    [saveData?.characterId],
  );

  // Calculate equipment bonus stats
  const equipStats = useMemo(() => {
    const result = { hp: 0, mp: 0, attack: 0, defense: 0, speed: 0, critRate: 0, critDamage: 0 };
    if (!saveData) return result;
    for (const slotItemId of Object.values(saveData.equippedItems)) {
      if (!slotItemId) continue;
      const itemDef = ITEMS.find((i) => i.id === slotItemId);
      if (!itemDef?.stats) continue;
      const enh = saveData.enhanceLevels?.[slotItemId];
      const mult = 1 + (enh?.level ?? 0);
      result.hp += (itemDef.stats.hp ?? 0) * mult;
      result.mp += (itemDef.stats.mp ?? 0) * mult;
      result.attack += (itemDef.stats.attack ?? 0) * mult;
      result.defense += (itemDef.stats.defense ?? 0) * mult;
      result.speed += (itemDef.stats.speed ?? 0) * mult;
      result.critRate += (itemDef.stats.critRate ?? 0);
      result.critDamage += (itemDef.stats.critDamage ?? 0);
    }
    return result;
  }, [saveData?.equippedItems, saveData?.enhanceLevels]);

  const baseStats = useMemo(() => {
    if (!character || !saveData) return null;
    const bonus = saveData.level - 1;
    return {
      hp: character.baseStats.maxHp + bonus * 15,
      mp: character.baseStats.maxMp + bonus * 5,
      attack: character.baseStats.attack + bonus * 3,
      defense: character.baseStats.defense + bonus * 2,
      speed: character.baseStats.speed + bonus * 1,
      critRate: character.baseStats.critRate,
      critDamage: character.baseStats.critDamage,
    };
  }, [character, saveData]);

  // Total combat stats (shared calculation)
  const totalStats = useMemo(() => saveData ? calculateTotalStats(saveData) : null, [saveData]);

  const expToNext = useMemo(() => {
    const lv = saveData?.level ?? 1;
    return Math.round(lv * 100 + lv * lv * lv * 0.01);
  }, [saveData?.level]);

  const handleLogout = useCallback(() => { logout(); navigate('/'); }, [logout, navigate]);
  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(saveCode); } catch {
      const el = document.createElement('textarea');
      el.value = saveCode; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }, [saveCode]);
  const handleDungeon = useCallback(() => navigate('/dungeon'), [navigate]);
  const handleInventory = useCallback(() => navigate('/inventory'), [navigate]);
  const handleBestiary = useCallback(() => navigate('/bestiary'), [navigate]);
  const handleShop = useCallback(() => navigate('/shop'), [navigate]);
  const handleSkills = useCallback(() => navigate('/skills'), [navigate]);
  const handleAchievements = useCallback(() => navigate('/achievements'), [navigate]);
  const handlePets = useCallback(() => navigate('/pets'), [navigate]);
  const handleArtifacts = useCallback(() => navigate('/artifacts'), [navigate]);

  const [blessingLoading, setBlessingLoading] = useState<string | null>(null);
  const [blessingCountdowns, setBlessingCountdowns] = useState<Record<string, string>>({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const appearanceColor = saveData?.appearance?.color ?? '#8B5CF6';

  const handleColorChange = useCallback(async (color: string) => {
    try {
      const res = await axios.post('/api/game/appearance', { color });
      if (res.data.success && res.data.saveData) {
        updateSaveData(res.data.saveData);
      }
    } catch {
      // silent fail
    }
    setShowColorPicker(false);
  }, [updateSaveData]);

  // Close color picker on outside click
  useEffect(() => {
    if (!showColorPicker) return;
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showColorPicker]);

  const BLESSING_NAMES: Record<string, string> = {
    warrior: '전사의 유산',
    sage: '현자의 지혜',
    plunderer: '약탈자의 행운',
    guardian: '수호자의 축복',
  };

  const handleBuyBlessing = useCallback(async (blessingType: string) => {
    setBlessingLoading(blessingType);
    try {
      const res = await axios.post('/api/game/buy-blessing', { blessingType });
      if (res.data.success && res.data.saveData) {
        updateSaveData(res.data.saveData);
        toast.success(res.data.message);
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : '축복 구매에 실패했습니다.';
      toast.error(msg);
    } finally {
      setBlessingLoading(null);
    }
  }, [updateSaveData]);

  // Blessing countdown timer
  useEffect(() => {
    const blessings = saveData?.blessings ?? [];
    if (blessings.length === 0) return;
    const tick = () => {
      const now = Date.now();
      const result: Record<string, string> = {};
      for (const b of blessings) {
        const diff = new Date(b.expiresAt).getTime() - now;
        if (diff > 0) {
          const m = Math.floor(diff / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          result[b.type] = `${m}:${String(s).padStart(2, '0')}`;
        }
      }
      setBlessingCountdowns(result);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [saveData?.blessings]);

  const handleClaimDaily = useCallback(async () => {
    try {
      const res = await axios.post('/api/daily/claim');
      if (res.data.success && res.data.saveData) {
        updateSaveData(res.data.saveData);
        setDailyClaimed(true);
        setDailyStatus((prev) => prev ? { ...prev, canClaim: false } : null);
      }
    } catch {
      toast.error('보상 수령에 실패했습니다.');
    }
  }, [updateSaveData]);

  if (!saveData || !character || !baseStats || !totalStats) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen relative">
      {achievementToast && (
        <div className="fixed top-4 right-4 z-50 bg-orange-500/90 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce text-sm font-bold">
          &#127942; {achievementToast}
        </div>
      )}
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={handleCopy}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors font-mono"
          title="클릭하여 세이브 코드 복사">
          {copied ? '복사됨!' : formatSaveCode(saveCode)}
        </button>
        <button type="button" onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          로그아웃
        </button>
      </div>

      {/* Daily reward banner */}
      {dailyStatus && (
        dailyStatus.canClaim && !dailyClaimed ? (
          <div className="mb-4 p-3 rounded-lg border-2 border-yellow-500 bg-yellow-500/10 text-center">
            <p className="text-yellow-400 font-bold text-sm mb-2">
              일일 보상 수령 가능! ({dailyStatus.reward.description})
            </p>
            <button
              type="button"
              onClick={handleClaimDaily}
              className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-bold transition-colors"
            >
              받기
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-600 text-xs mb-4">오늘의 보상 수령 완료</p>
        )
      )}

      {/* Blessings section */}
      <Card className="mb-4 p-3">
        <h3 className="text-sm font-bold text-purple-400 mb-2">&#10024; 축복 (30분간 효과)</h3>
        <div className="grid grid-cols-3 gap-2">
          {([
            { type: 'exp_2x', label: '경험치 2배', icon: '&#128218;', cost: 100 },
            { type: 'gold_2x', label: '골드 2배', icon: '&#128176;', cost: 100 },
            { type: 'drop_2x', label: '드랍 2배', icon: '&#127808;', cost: 100 },
          ] as const).map((blessing) => {
            const isActive = !!blessingCountdowns[blessing.type];
            return (
              <div key={blessing.type} className={`text-center p-2 rounded-lg border ${isActive ? 'border-purple-500 bg-purple-500/10' : 'border-dungeon-border'}`}>
                <div className="text-lg mb-1" dangerouslySetInnerHTML={{ __html: blessing.icon }} />
                <p className="text-xs font-bold text-gray-200">{blessing.label}</p>
                {isActive ? (
                  <p className="text-xs text-purple-400 font-bold mt-1">{blessingCountdowns[blessing.type]}</p>
                ) : (
                  <button
                    type="button"
                    disabled={blessingLoading === blessing.type || (saveData?.gems ?? 0) < blessing.cost}
                    onClick={() => handleBuyBlessing(blessing.type)}
                    className="mt-1 px-2 py-0.5 text-[10px] font-bold rounded bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {blessingLoading === blessing.type ? '...' : `${blessing.cost} 젬`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Character portrait */}
      <div className="flex flex-col items-center mb-6 relative">
        <div
          className="w-24 h-24 bg-dungeon-panel border-2 rounded-full flex items-center justify-center mb-3 cursor-pointer hover:scale-105 transition-transform"
          style={{ borderColor: appearanceColor }}
          onClick={() => setShowColorPicker((v) => !v)}
          title="클릭하여 테마 색상 변경"
        >
          <span className="text-3xl font-bold" style={{ color: appearanceColor }}>{character.name[0]}</span>
        </div>
        {/* Color picker */}
        {showColorPicker && (
          <div ref={colorPickerRef} className="absolute top-28 z-40 bg-dungeon-panel border border-dungeon-border rounded-lg p-3 shadow-xl">
            <p className="text-xs text-gray-400 mb-2 text-center">테마 색상 선택</p>
            <div className="grid grid-cols-4 gap-2">
              {APPEARANCE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorChange(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    appearanceColor === color ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-100">{saveData.playerName}</h1>
        {(saveData.equippedTitle ?? '') !== '' && (() => {
          const title = TITLES.find((t) => t.id === saveData.equippedTitle);
          return title ? (
            <p className="text-xs text-yellow-300 font-bold">{title.name}</p>
          ) : null;
        })()}
        <p className="text-sm text-dungeon-accent">{character.title} - {character.name}</p>
        <p className="text-xs text-yellow-400 mt-1">
          Lv. {saveData.level}
          {(saveData.prestigeLevel ?? 0) > 0 && (() => {
            const p = saveData.prestigeLevel ?? 0;
            let stars = '';
            let color = 'text-gray-400';
            if (p >= 100) {
              const crowns = Math.floor(p / 100);
              const remainder = Math.floor((p % 100) / 50);
              const gold = Math.floor((p % 50) / 20);
              const purple = Math.floor((p % 20) / 10);
              const blue = Math.floor((p % 10) / 5);
              const gray = p % 5;
              stars = '👑'.repeat(crowns) + (remainder > 0 ? '🌟'.repeat(remainder) : '') + (gold > 0 ? '💫'.repeat(gold) : '') + (purple > 0 ? '⭐'.repeat(purple) : '') + (blue > 0 ? '★'.repeat(blue) : '') + (gray > 0 ? '✦'.repeat(gray) : '');
              color = 'text-red-400';
            } else if (p >= 50) {
              stars = '🌟'.repeat(Math.floor((p - 50) / 10) + 1);
              color = 'text-yellow-400';
            } else if (p >= 20) {
              stars = '💫'.repeat(Math.floor((p - 20) / 10) + 1);
              color = 'text-purple-400';
            } else if (p >= 10) {
              stars = '⭐'.repeat(p - 9);
              color = 'text-blue-400';
            } else if (p >= 5) {
              stars = '★'.repeat(p - 4);
              color = 'text-green-400';
            } else {
              stars = '✦'.repeat(p);
              color = 'text-gray-400';
            }
            return (
              <span className={`ml-1 ${color}`}>
                {stars} <span className="text-[10px]">(환생 {p})</span>
              </span>
            );
          })()}
        </p>
        <div className="w-48 mt-2">
          <StatBar current={saveData.exp} max={expToNext} color="xp" label="EXP" showNumbers />
        </div>
      </div>

      {/* Prestige badge */}
      {(saveData.prestigeLevel ?? 0) > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm mb-2">
          <span className="text-purple-400">환생 {saveData.prestigeLevel}회</span>
          {saveData.prestigeBlessingType && (
            <span className="text-yellow-400 text-xs">축복: {BLESSING_NAMES[saveData.prestigeBlessingType]}</span>
          )}
        </div>
      )}

      {/* Prestige available notification */}
      {saveData.level >= (300 + (saveData.prestigeLevel ?? 0)) && (
        <div className="flex justify-center mb-4">
          <button onClick={() => navigate('/prestige')} className="animate-pulse bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold">
            &#10024; 환생 가능!
          </button>
        </div>
      )}

      {/* Stats panel */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold text-dungeon-accent mb-3">능력치</h2>

        {/* HP / MP bars */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <StatBar current={totalStats?.hp ?? 0} max={totalStats?.hp ?? 0} color="health" label="HP" showNumbers />
            <p className="text-[10px] text-gray-500 text-right mt-0.5">기본 {baseStats.hp}{equipStats.hp > 0 ? ` + 장비 ${equipStats.hp}` : ''}{(totalStats?.hp ?? 0) > baseStats.hp + equipStats.hp ? ` + 보너스 ${(totalStats?.hp ?? 0) - baseStats.hp - equipStats.hp}` : ''}</p>
          </div>
          <div>
            <StatBar current={totalStats?.mp ?? 0} max={totalStats?.mp ?? 0} color="mana" label="MP" showNumbers />
            <p className="text-[10px] text-gray-500 text-right mt-0.5">기본 {baseStats.mp}{equipStats.mp > 0 ? ` + 장비 ${equipStats.mp}` : ''}{(totalStats?.mp ?? 0) > baseStats.mp + equipStats.mp ? ` + 보너스 ${(totalStats?.mp ?? 0) - baseStats.mp - equipStats.mp}` : ''}</p>
          </div>
        </div>

        {/* Core stats — show total with breakdown */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          <StatValue label="공격력" base={baseStats.attack} equip={(totalStats?.atk ?? baseStats.attack) - baseStats.attack} />
          <StatValue label="방어력" base={baseStats.defense} equip={(totalStats?.def ?? baseStats.defense) - baseStats.defense} />
          <StatValue label="속도" base={baseStats.speed} equip={equipStats.speed} />
          <StatPercent label="치명타율" base={baseStats.critRate} equip={(totalStats?.crit ?? baseStats.critRate) - baseStats.critRate} color="text-yellow-400" doubleCritPercent={saveData?.critOverflow && (totalStats?.crit ?? 0) > 1 ? ((totalStats?.crit ?? 0) - 1) * 100 : undefined} />
          <StatPercent label="치명타 피해" base={baseStats.critDamage} equip={(totalStats?.critDmg ?? baseStats.critDamage) - baseStats.critDamage} color="text-purple-400" />
        </div>

        {/* Bonus percentages */}
        {(totalStats.bonusExp > 0 || totalStats.bonusGold > 0 || totalStats.bonusDrop > 0 || totalStats.lifesteal > 0 || totalStats.reflect > 0 || totalStats.hpRegen > 0) && (
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-dungeon-border text-center text-[11px]">
            {totalStats.bonusExp > 0 && <div><span className="text-gray-500">경험치</span><br/><span className="text-green-400 font-bold">+{totalStats.bonusExp}%</span></div>}
            {totalStats.bonusGold > 0 && <div><span className="text-gray-500">골드</span><br/><span className="text-yellow-400 font-bold">+{totalStats.bonusGold}%</span></div>}
            {totalStats.bonusDrop > 0 && <div><span className="text-gray-500">드랍률</span><br/><span className="text-purple-400 font-bold">+{totalStats.bonusDrop}%</span></div>}
            {totalStats.lifesteal > 0 && <div><span className="text-gray-500">흡혈</span><br/><span className="text-red-400 font-bold">+{totalStats.lifesteal.toFixed(1)}%</span></div>}
            {totalStats.reflect > 0 && <div><span className="text-gray-500">반사</span><br/><span className="text-blue-400 font-bold">+{totalStats.reflect.toFixed(1)}%</span></div>}
            {totalStats.hpRegen > 0 && <div><span className="text-gray-500">턴HP회복</span><br/><span className="text-pink-400 font-bold">+{totalStats.hpRegen.toFixed(1)}%</span></div>}
          </div>
        )}

        {/* Passive tree special effects */}
        {totalStats.passiveSpecials && totalStats.passiveSpecials.length > 0 && (
          <div className="mt-3 pt-3 border-t border-dungeon-border">
            <p className="text-[10px] text-yellow-500 font-bold mb-1">특수 효과</p>
            <div className="flex flex-wrap gap-1">
              {totalStats.passiveSpecials.map((sp: string, i: number) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-yellow-900/20 text-yellow-300/80 border border-yellow-800/30" title={sp}>
                  {sp.split(':')[0]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Gold & Gems */}
        <div className="flex gap-6 mt-3 pt-3 border-t border-dungeon-border">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-lg">G</span>
            <span className="font-bold">{saveData.gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400 text-lg">&#9670;</span>
            <span className="font-bold">{(saveData.gems ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </Card>

      {/* Menu buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card hover onClick={handleDungeon} className="text-center py-6">
          <div className="text-3xl mb-2 text-red-400">&#9876;</div>
          <p className="text-lg font-bold">던전</p>
          <p className="text-xs text-gray-500 mt-1">던전에 도전하세요</p>
        </Card>
        <Card hover onClick={handleShop} className="text-center py-6">
          <div className="text-3xl mb-2 text-green-400">&#9878;</div>
          <p className="text-lg font-bold">상점</p>
          <p className="text-xs text-gray-500 mt-1">아이템을 구매하세요</p>
        </Card>
        <Card hover onClick={handleInventory} className="text-center py-6">
          <div className="text-3xl mb-2 text-yellow-400">&#9776;</div>
          <p className="text-lg font-bold">장비</p>
          <p className="text-xs text-gray-500 mt-1">장비를 관리하세요</p>
        </Card>
        <Card hover onClick={handleSkills} className="text-center py-6">
          <div className="text-3xl mb-2 text-cyan-400">&#9884;</div>
          <p className="text-lg font-bold">스킬</p>
          <p className="text-xs text-gray-500 mt-1">스킬을 강화하세요</p>
        </Card>
        <Card hover onClick={() => navigate('/passive')} className="text-center py-6">
          <div className="text-3xl mb-2 text-purple-400">&#10038;</div>
          <p className="text-lg font-bold">특성 트리</p>
          <p className="text-xs text-gray-500 mt-1">패시브 트리를 배분하세요</p>
        </Card>
        <Card hover onClick={handlePets} className="text-center py-6">
          <div className="text-3xl mb-2 text-pink-400">&#128062;</div>
          <p className="text-lg font-bold">펫</p>
          <p className="text-xs text-gray-500 mt-1">동료를 소환하세요</p>
        </Card>
        <Card hover onClick={handleAchievements} className="text-center py-6">
          <div className="text-3xl mb-2 text-orange-400">&#127942;</div>
          <p className="text-lg font-bold">업적</p>
          <p className="text-xs text-gray-500 mt-1">업적을 확인하세요</p>
        </Card>
        <Card hover onClick={handleBestiary} className="text-center py-6">
          <div className="text-3xl mb-2 text-dungeon-accent">&#9733;</div>
          <p className="text-lg font-bold">기록일지</p>
          <p className="text-xs text-gray-500 mt-1">몬스터를 확인하세요</p>
        </Card>
        <Card hover onClick={handleArtifacts} className="text-center py-6">
          <div className="text-3xl mb-2 text-purple-400">&#128302;</div>
          <p className="text-lg font-bold">유물</p>
          <p className="text-xs text-gray-500 mt-1">영구 강화 (젬)</p>
        </Card>
        <Card hover onClick={() => navigate('/ranking')} className="text-center py-6">
          <div className="text-3xl mb-2 text-amber-400">&#127941;</div>
          <p className="text-lg font-bold">랭킹</p>
          <p className="text-xs text-gray-500 mt-1">순위를 확인하세요</p>
        </Card>
        <Card hover onClick={() => navigate('/prestige')} className="text-center py-6">
          <div className="text-3xl mb-2 text-purple-400">&#9760;</div>
          <p className="text-lg font-bold">환생</p>
          <p className="text-xs text-gray-500 mt-1">영혼의 시련</p>
        </Card>
        <Card hover onClick={() => navigate('/gacha')} className="text-center py-6 border-rose-500/30">
          <div className="text-3xl mb-2 text-rose-400">&#127183;</div>
          <p className="text-lg font-bold text-rose-400">소환</p>
          <p className="text-xs text-gray-500 mt-1">신화 장비를 뽑으세요</p>
        </Card>
        <Card hover onClick={() => navigate('/pachinko')} className="text-center py-6">
          <div className="text-3xl mb-2 text-yellow-400">&#127920;</div>
          <p className="text-lg font-bold">파칭코</p>
          <p className="text-xs text-gray-500 mt-1">골드를 사용하세요</p>
        </Card>
      </div>
    </div>
  );
}

export default HomeScreen;
