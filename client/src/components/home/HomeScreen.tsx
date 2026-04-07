import { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGameStore } from '@/stores/gameStore';
import { CHARACTERS } from '@shared/data';
import Card from '@/components/common/Card';
import StatBar from '@/components/common/StatBar';
import Button from '@/components/common/Button';

function formatSaveCode(code: string): string {
  return code.replace(/(.{4})/g, '$1-').replace(/-$/, '');
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

  const levelStats = useMemo(() => {
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

  const expToNext = useMemo(() => {
    const level = saveData?.level ?? 1;
    return level * 100;
  }, [saveData?.level]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(saveCode);
    } catch {
      const el = document.createElement('textarea');
      el.value = saveCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [saveCode]);

  const handleDungeon = useCallback(() => navigate('/dungeon'), [navigate]);
  const handleInventory = useCallback(() => navigate('/inventory'), [navigate]);
  const handleBestiary = useCallback(() => navigate('/bestiary'), [navigate]);

  if (!saveData || !character || !levelStats) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen relative">
      {/* Top bar: save code + logout */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors font-mono"
          title="클릭하여 세이브 코드 복사"
        >
          {copied ? '복사됨!' : formatSaveCode(saveCode)}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          로그아웃
        </button>
      </div>

      {/* Character portrait & info */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 bg-dungeon-panel border-2 border-dungeon-accent/40 rounded-full flex items-center justify-center mb-3">
          <span className="text-3xl text-dungeon-accent font-bold">
            {character.name[0]}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-100">{saveData.playerName}</h1>
        <p className="text-sm text-dungeon-accent">{character.title} - {character.name}</p>
        <p className="text-xs text-dungeon-gold mt-1">Lv. {saveData.level}</p>
        <div className="w-48 mt-2">
          <StatBar
            current={saveData.exp}
            max={expToNext}
            color="xp"
            label="EXP"
            showNumbers
          />
        </div>
      </div>

      {/* Stats panel - level-scaled */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold text-dungeon-accent mb-3">능력치</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatBar current={levelStats.hp} max={levelStats.hp} color="health" label="HP" showNumbers />
          <StatBar current={levelStats.mp} max={levelStats.mp} color="mana" label="MP" showNumbers />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mt-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">공격력</p>
            <p className="text-lg font-bold text-dungeon-health">{levelStats.attack}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">방어력</p>
            <p className="text-lg font-bold text-dungeon-mana">{levelStats.defense}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">속도</p>
            <p className="text-lg font-bold text-dungeon-xp">{levelStats.speed}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">치명타율</p>
            <p className="text-lg font-bold text-dungeon-gold">
              {Math.round(levelStats.critRate * 100)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">치명타 피해</p>
            <p className="text-lg font-bold text-purple-400">
              x{levelStats.critDamage}
            </p>
          </div>
        </div>

        {/* Gold & Gems */}
        <div className="flex gap-6 mt-4 pt-3 border-t border-dungeon-border">
          <div className="flex items-center gap-2">
            <span className="text-dungeon-gold text-lg">G</span>
            <span className="font-bold">{saveData.gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400 text-lg">&#9670;</span>
            <span className="font-bold">{saveData.gems.toLocaleString()}</span>
          </div>
        </div>
      </Card>

      {/* Menu buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hover onClick={handleDungeon} className="text-center py-8">
          <div className="text-3xl mb-2 text-dungeon-health">&#9876;</div>
          <p className="text-lg font-bold">던전 진입</p>
          <p className="text-xs text-gray-500 mt-1">어둠의 던전에 도전하세요</p>
        </Card>
        <Card hover onClick={handleInventory} className="text-center py-8">
          <div className="text-3xl mb-2 text-dungeon-gold">&#9776;</div>
          <p className="text-lg font-bold">가방</p>
          <p className="text-xs text-gray-500 mt-1">아이템과 장비를 관리하세요</p>
        </Card>
        <Card hover onClick={handleBestiary} className="text-center py-8">
          <div className="text-3xl mb-2 text-dungeon-accent">&#9733;</div>
          <p className="text-lg font-bold">기록일지</p>
          <p className="text-xs text-gray-500 mt-1">발견한 몬스터를 확인하세요</p>
        </Card>
      </div>
    </div>
  );
}

export default HomeScreen;
