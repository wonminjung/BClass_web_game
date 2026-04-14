import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGameStore } from '@/stores/gameStore';
import { CHARACTERS, ITEMS, TITLES, SETS, GEMS, PETS, ARTIFACTS } from '@shared/data';
import Card from '@/components/common/Card';
import StatBar from '@/components/common/StatBar';
import axios from 'axios';
import { toast, confirm } from '@/components/common/Toast';

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

  // Total combat stats (matching server calculation)
  const totalStats = useMemo(() => {
    if (!baseStats || !saveData) return null;
    let hp = baseStats.hp + equipStats.hp;
    let mp = baseStats.mp + equipStats.mp;
    let atk = baseStats.attack + equipStats.attack;
    let def = baseStats.defense + equipStats.defense;
    let spd = baseStats.speed + equipStats.speed;
    let crit = baseStats.critRate + equipStats.critRate;
    let critDmg = baseStats.critDamage + equipStats.critDamage;

    // Socketed gems
    const equippedIds = Object.values(saveData.equippedItems).filter(Boolean) as string[];
    for (const id of equippedIds) {
      for (const gemId of (saveData.socketedGems?.[id] ?? [])) {
        const gem = GEMS.find((g) => g.id === gemId);
        if (!gem) continue;
        if (gem.stat === 'attack') atk += gem.value;
        else if (gem.stat === 'defense') def += gem.value;
        else if (gem.stat === 'hp') hp += gem.value;
        else if (gem.stat === 'mp') mp += gem.value;
        else if (gem.stat === 'speed') spd += gem.value;
        else if (gem.stat === 'critRate') crit += gem.value;
        else if (gem.stat === 'critDamage') critDmg += gem.value;
      }
    }

    // Set bonuses
    for (const set of SETS) {
      const count = set.pieces.filter((p) => equippedIds.includes(p)).length;
      for (const b of set.bonuses) {
        if (count >= b.requiredCount && b.stats) {
          atk = Math.round(atk * (1 + (b.stats.atkPercent ?? 0) / 100));
          def = Math.round(def * (1 + (b.stats.defPercent ?? 0) / 100));
          hp = Math.round(hp * (1 + (b.stats.hpPercent ?? 0) / 100));
          mp = Math.round(mp * (1 + (b.stats.mpPercent ?? 0) / 100));
          crit += b.stats.critRateFlat ?? 0;
          critDmg *= (1 + (b.stats.critDmgPercent ?? 0) / 100);
        }
      }
    }

    // Prestige
    const pBonus = 1 + (saveData.prestigeLevel ?? 0) * 0.02;
    hp = Math.round(hp * pBonus); mp = Math.round(mp * pBonus);
    atk = Math.round(atk * pBonus); def = Math.round(def * pBonus);

    // Talents
    const tp = saveData.talentPoints ?? {};
    atk = Math.round(atk * (1 + (tp['off_atk'] ?? 0) * 3 / 100));
    def = Math.round(def * (1 + (tp['def_def'] ?? 0) * 3 / 100));
    hp = Math.round(hp * (1 + (tp['def_hp'] ?? 0) * 5 / 100));
    mp = Math.round(mp * (1 + (tp['util_mp'] ?? 0) * 5 / 100));
    crit += (tp['off_crit'] ?? 0) * 0.01;
    critDmg *= (1 + (tp['off_critdmg'] ?? 0) * 5 / 100);

    // Title
    if (saveData.equippedTitle) {
      const title = TITLES.find((t) => t.id === saveData.equippedTitle);
      if (title?.bonus) {
        if (title.bonus.stat === 'atkPercent') atk = Math.round(atk * (1 + title.bonus.value / 100));
        if (title.bonus.stat === 'defPercent') def = Math.round(def * (1 + title.bonus.value / 100));
        if (title.bonus.stat === 'hpPercent') hp = Math.round(hp * (1 + title.bonus.value / 100));
      }
    }

    // Pet
    if (saveData.activePet) {
      const pet = PETS.find((p) => p.id === saveData.activePet);
      if (pet) {
        for (const b of pet.bonus) {
          if (b.stat === 'atkPercent') atk = Math.round(atk * (1 + b.value / 100));
          if (b.stat === 'defPercent') def = Math.round(def * (1 + b.value / 100));
          if (b.stat === 'hpPercent') hp = Math.round(hp * (1 + b.value / 100));
          if (b.stat === 'mpPercent') mp = Math.round(mp * (1 + b.value / 100));
          if (b.stat === 'critRateFlat') crit += b.value;
        }
      }
    }

    // Artifacts
    for (const art of ARTIFACTS) {
      const lv = (saveData.artifacts ?? {})[art.id] ?? 0;
      if (lv <= 0) continue;
      const val = art.effectPerLevel * lv;
      if (art.effectType === 'hpPercent') hp = Math.round(hp * (1 + val / 100));
      if (art.effectType === 'mpPercent') mp = Math.round(mp * (1 + val / 100));
      if (art.effectType === 'atkPercent') atk = Math.round(atk * (1 + val / 100));
      if (art.effectType === 'defPercent') def = Math.round(def * (1 + val / 100));
    }

    // Calculate bonus percentages
    const pLvl = saveData.prestigeLevel ?? 0;
    let bonusExp = pLvl * 10;
    let bonusGold = pLvl * 5 + (tp['util_gold'] ?? 0) * 5;
    let bonusDrop = pLvl * 1;
    for (const art of ARTIFACTS) {
      const lv2 = (saveData.artifacts ?? {})[art.id] ?? 0;
      if (lv2 <= 0) continue;
      const val2 = art.effectPerLevel * lv2;
      if (art.effectType === 'expPercent') bonusExp += val2;
      if (art.effectType === 'goldPercent') bonusGold += val2;
      if (art.effectType === 'dropRatePercent') bonusDrop += val2;
    }

    return { hp, mp, atk, def, spd, crit, critDmg, bonusExp, bonusGold, bonusDrop };
  }, [baseStats, equipStats, saveData]);

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
  const handleArtifacts = useCallback(() => navigate('/artifacts'), [navigate]);

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
    const arts = saveData?.artifacts ?? {};
    const gemBoost = (arts['art_gem'] ?? 0) * 10;
    const levelKeep = (arts['art_level_keep'] ?? 0) * 5;
    const abyssKeep = (arts['art_abyss_keep'] ?? 0) * 5;

    const nextPrestige = (saveData?.prestigeLevel ?? 0) + 1;
    const baseGems = 50 * nextPrestige;
    const levelBonus = Math.max(0, (saveData?.level ?? 60) - 60) * 2;
    const abyssBonus = Math.floor((saveData?.abyssHighest ?? 0) * 0.5);
    const rawGems = baseGems + levelBonus + abyssBonus;
    const totalGems = Math.round(rawGems * (1 + gemBoost / 100));

    const keptLevel = Math.max(1, Math.floor((saveData?.level ?? 1) * levelKeep / 100));
    const keptAbyss = Math.floor((saveData?.abyssFloor ?? 0) * abyssKeep / 100);

    const confirmed = await confirm(
      `환생하시겠습니까?\n\n` +
      `초기화:\n` +
      `- 레벨 ${saveData?.level} → ${keptLevel > 1 ? `Lv.${keptLevel} (${levelKeep}% 유지)` : '1'}\n` +
      `- 스킬 레벨, 특성 포인트\n` +
      `- 심연 ${saveData?.abyssFloor}층 → ${keptAbyss > 0 ? `${keptAbyss}층 (${abyssKeep}% 유지)` : '0층'}\n\n` +
      `유지: 장비, 강화, 업적, 골드, 젬, 유물\n\n` +
      `보상:\n` +
      `- 환생 Lv.${nextPrestige} (전 스탯 +${nextPrestige * 2}%)\n` +
      `- 젬 ${totalGems}개${gemBoost > 0 ? ` (부스트 +${gemBoost}%)` : ''}`
    );
    if (!confirmed) return;
    try {
      const res = await axios.post('/api/game/prestige');
      if (res.data.success && res.data.saveData) {
        updateSaveData(res.data.saveData);
        toast.success(res.data.message);
      }
    } catch {
      toast.error('환생에 실패했습니다.');
    }
  }, [saveData, updateSaveData]);

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
          <StatPercent label="치명타율" base={baseStats.critRate} equip={(totalStats?.crit ?? baseStats.critRate) - baseStats.critRate} color="text-yellow-400" />
          <StatPercent label="치명타 피해" base={baseStats.critDamage} equip={(totalStats?.critDmg ?? baseStats.critDamage) - baseStats.critDamage} color="text-purple-400" />
        </div>

        {/* Bonus percentages */}
        {(totalStats.bonusExp > 0 || totalStats.bonusGold > 0 || totalStats.bonusDrop > 0) && (
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-dungeon-border text-center text-[11px]">
            {totalStats.bonusExp > 0 && <div><span className="text-gray-500">경험치</span><br/><span className="text-green-400 font-bold">+{totalStats.bonusExp}%</span></div>}
            {totalStats.bonusGold > 0 && <div><span className="text-gray-500">골드</span><br/><span className="text-yellow-400 font-bold">+{totalStats.bonusGold}%</span></div>}
            {totalStats.bonusDrop > 0 && <div><span className="text-gray-500">드랍률</span><br/><span className="text-purple-400 font-bold">+{totalStats.bonusDrop}%</span></div>}
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
      </div>
    </div>
  );
}

export default HomeScreen;
