import { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGameStore } from '@/stores/gameStore';
import { CHARACTERS, ITEMS } from '@shared/data';
import Card from '@/components/common/Card';
import StatBar from '@/components/common/StatBar';

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
  const { saveCode, saveData, isAuthenticated, logout } = useAuth();
  const { loadGameData } = useGameStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
    loadGameData();
  }, [isAuthenticated, navigate, loadGameData]);

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

  if (!saveData || !character || !baseStats) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen relative">
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

      {/* Character portrait */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 bg-dungeon-panel border-2 border-dungeon-accent/40 rounded-full flex items-center justify-center mb-3">
          <span className="text-3xl text-dungeon-accent font-bold">{character.name[0]}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-100">{saveData.playerName}</h1>
        <p className="text-sm text-dungeon-accent">{character.title} - {character.name}</p>
        <p className="text-xs text-yellow-400 mt-1">Lv. {saveData.level}</p>
        <div className="w-48 mt-2">
          <StatBar current={saveData.exp} max={expToNext} color="xp" label="EXP" showNumbers />
        </div>
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
        <Card hover onClick={handleDungeon} className="text-center py-8">
          <div className="text-3xl mb-2 text-red-400">&#9876;</div>
          <p className="text-lg font-bold">던전</p>
          <p className="text-xs text-gray-500 mt-1">던전에 도전하세요</p>
        </Card>
        <Card hover onClick={handleShop} className="text-center py-8">
          <div className="text-3xl mb-2 text-green-400">&#9878;</div>
          <p className="text-lg font-bold">상점</p>
          <p className="text-xs text-gray-500 mt-1">아이템을 구매하세요</p>
        </Card>
        <Card hover onClick={handleInventory} className="text-center py-8">
          <div className="text-3xl mb-2 text-yellow-400">&#9776;</div>
          <p className="text-lg font-bold">장비 & 가방</p>
          <p className="text-xs text-gray-500 mt-1">장비를 관리하세요</p>
        </Card>
        <Card hover onClick={handleBestiary} className="text-center py-8">
          <div className="text-3xl mb-2 text-dungeon-accent">&#9733;</div>
          <p className="text-lg font-bold">기록일지</p>
          <p className="text-xs text-gray-500 mt-1">몬스터를 확인하세요</p>
        </Card>
      </div>
    </div>
  );
}

export default HomeScreen;
