import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGameStore } from '@/stores/gameStore';
import { CHARACTERS, ITEMS, TITLES } from '@shared/data';
import Card from '@/components/common/Card';
import StatBar from '@/components/common/StatBar';
import axios from 'axios';

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

function StatPercent({ label, base, equip, color }: { label: string; base: number; equip: number; color: string }) {
  const total = base + equip;
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>
        {Math.round(total * 100)}%
        {equip > 0 && <span className="text-xs text-green-400 ml-0.5">(+{Math.round(equip * 100)}%)</span>}
      </p>
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
      result.critRate += (itemDef.stats.critRate ?? 0) * mult;
      result.critDamage += (itemDef.stats.critDamage ?? 0) * mult;
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

  const expToNext = useMemo(() => (saveData?.level ?? 1) * 100, [saveData?.level]);

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

  const handlePrestige = useCallback(async () => {
    const nextPrestige = (saveData?.prestigeLevel ?? 0) + 1;
    const gemReward = 50 * nextPrestige;
    const confirmed = window.confirm(
      `환생하시겠습니까?\n\n` +
      `- 레벨이 1로 초기화됩니다\n` +
      `- 스킬 레벨이 초기화됩니다\n` +
      `- 심연 진행도가 초기화됩니다\n` +
      `- 장비, 강화, 업적, 골드, 젬은 유지됩니다\n\n` +
      `보상:\n` +
      `- 환생 레벨 ${nextPrestige} (전 스탯 +${nextPrestige * 2}%)\n` +
      `- 젬 ${gemReward}개`
    );
    if (!confirmed) return;
    try {
      const res = await axios.post('/api/game/prestige');
      if (res.data.success && res.data.saveData) {
        updateSaveData(res.data.saveData);
        alert(res.data.message);
      }
    } catch {
      alert('환생에 실패했습니다.');
    }
  }, [saveData?.prestigeLevel, updateSaveData]);

  const handleClaimDaily = useCallback(async () => {
    try {
      const res = await axios.post('/api/daily/claim');
      if (res.data.success && res.data.saveData) {
        updateSaveData(res.data.saveData);
        setDailyClaimed(true);
        setDailyStatus((prev) => prev ? { ...prev, canClaim: false } : null);
      }
    } catch {
      alert('보상 수령에 실패했습니다.');
    }
  }, [updateSaveData]);

  if (!saveData || !character || !baseStats) return null;

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
          {(saveData.prestigeLevel ?? 0) > 0 && (
            <span className="ml-1 text-purple-400">
              {'★'.repeat(saveData.prestigeLevel ?? 0)}{' '}
              <span className="text-[10px]">(환생 {saveData.prestigeLevel})</span>
            </span>
          )}
        </p>
        <div className="w-48 mt-2">
          <StatBar current={saveData.exp} max={expToNext} color="xp" label="EXP" showNumbers />
        </div>
        {saveData.level >= 60 && (
          <button
            type="button"
            onClick={handlePrestige}
            className="mt-3 px-4 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm font-bold transition-colors border border-purple-500"
          >
            환생 (Prestige)
          </button>
        )}
      </div>

      {/* Stats panel */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold text-dungeon-accent mb-3">능력치</h2>

        {/* HP / MP bars */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <StatBar current={baseStats.hp + equipStats.hp} max={baseStats.hp + equipStats.hp} color="health" label="HP" showNumbers />
            {equipStats.hp > 0 && <p className="text-[10px] text-green-400 text-right mt-0.5">장비 +{equipStats.hp}</p>}
          </div>
          <div>
            <StatBar current={baseStats.mp + equipStats.mp} max={baseStats.mp + equipStats.mp} color="mana" label="MP" showNumbers />
            {equipStats.mp > 0 && <p className="text-[10px] text-green-400 text-right mt-0.5">장비 +{equipStats.mp}</p>}
          </div>
        </div>

        {/* Core stats */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          <StatValue label="공격력" base={baseStats.attack} equip={equipStats.attack} />
          <StatValue label="방어력" base={baseStats.defense} equip={equipStats.defense} />
          <StatValue label="속도" base={baseStats.speed} equip={equipStats.speed} />
          <StatPercent label="치명타율" base={baseStats.critRate} equip={equipStats.critRate} color="text-yellow-400" />
          <StatPercent label="치명타 피해" base={baseStats.critDamage} equip={equipStats.critDamage} color="text-purple-400" />
        </div>

        {/* Gold & Gems */}
        <div className="flex gap-6 mt-4 pt-3 border-t border-dungeon-border">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-lg">G</span>
            <span className="font-bold">{saveData.gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400 text-lg">&#9670;</span>
            <span className="font-bold">{saveData.gems.toLocaleString()}</span>
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
        <Card hover onClick={() => navigate('/talents')} className="text-center py-6">
          <div className="text-3xl mb-2 text-purple-400">&#10038;</div>
          <p className="text-lg font-bold">특성</p>
          <p className="text-xs text-gray-500 mt-1">특성을 배분하세요</p>
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
        <Card hover onClick={() => navigate('/ranking')} className="text-center py-6">
          <div className="text-3xl mb-2 text-amber-400">&#127941;</div>
          <p className="text-lg font-bold">랭킹</p>
          <p className="text-xs text-gray-500 mt-1">순위를 확인하세요</p>
        </Card>
      </div>
    </div>
  );
}

export default HomeScreen;
