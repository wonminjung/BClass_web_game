import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PETS } from '@shared/data';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import axios from 'axios';
import { toast, confirm } from '@/components/common/Toast';

const rarityTextColors: Record<string, string> = {
  common: 'text-gray-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
  mythic: 'text-rose-400',
};

const rarityBorders: Record<string, string> = {
  common: 'border-gray-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500',
  mythic: 'border-rose-500',
};

const rarityBgGlow: Record<string, string> = {
  common: '',
  rare: 'shadow-blue-500/20 shadow-lg',
  epic: 'shadow-purple-500/20 shadow-lg',
  legendary: 'shadow-yellow-500/30 shadow-xl',
  mythic: 'shadow-rose-500/30 shadow-xl',
};

const rarityLabels: Record<string, string> = {
  common: '일반',
  rare: '레어',
  epic: '에픽',
  legendary: '전설',
  mythic: '신화',
};

const petEmojis: Record<string, string> = {
  pet_wolf: '\uD83D\uDC3A',
  pet_cat: '\uD83D\uDC31',
  pet_turtle: '\uD83D\uDC22',
  pet_eagle: '\uD83E\uDD85',
  pet_phoenix: '\uD83D\uDD25',
  pet_dragon: '\uD83D\uDC09',
  pet_unicorn: '\uD83E\uDD84',
  pet_demon: '\uD83D\uDC7F',
  pet_angel: '\uD83D\uDC7C',
  pet_myth_dragon: '\uD83D\uDC32',
  pet_myth_void: '\uD83D\uDC7E',
  pet_myth_eagle: '\uD83E\uDD85',
  pet_myth_unicorn: '\uD83E\uDD84',
  pet_myth_reaper: '\uD83D\uDC80',
};

const statLabels: Record<string, string> = {
  atkPercent: '공격력',
  defPercent: '방어력',
  hpPercent: '체력',
  mpPercent: '마나',
  critRateFlat: '치명타율',
};

function formatBonus(stat: string, value: number, petMult: number): string {
  const scaledValue = value * petMult;
  if (stat === 'critRateFlat') return `${statLabels[stat] ?? stat} +${Math.round(scaledValue * 100)}%`;
  return `${statLabels[stat] ?? stat} +${scaledValue.toFixed(1)}%`;
}

function getEnhanceCostForLevel(level: number): number {
  return Math.min(10, level + 2);
}

function PetScreen() {
  const navigate = useNavigate();
  const { saveData, isAuthenticated, updateSaveData } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const ownedPets = saveData?.ownedPets ?? [];
  const activePet = saveData?.activePet ?? '';
  const petLevels = saveData?.petLevels ?? {};
  const petEnhanceExp = saveData?.petEnhanceExp ?? {};

  const handleSummon = useCallback(async (petId: string) => {
    if (loading) return;
    const pet = PETS.find((p) => p.id === petId);
    if (!pet) return;

    const confirmed = await confirm(
      `${pet.name}을(를) 소환하시겠습니까?\n비용: ${pet.summonCost} 젬`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await axios.post('/api/pets/summon', { petId });
      if (res.data.success && res.data.saveData) {
        updateSaveData(res.data.saveData);
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : '소환에 실패했습니다.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [loading, updateSaveData]);

  const handleEquip = useCallback(async (petId: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const newPetId = activePet === petId ? '' : petId;
      const res = await axios.post('/api/pets/equip', { petId: newPetId });
      if (res.data.success && res.data.saveData) {
        updateSaveData(res.data.saveData);
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : '장착에 실패했습니다.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [loading, activePet, updateSaveData]);

  if (!saveData) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          &larr; 돌아가기
        </button>
        <h1 className="text-2xl font-bold text-dungeon-accent">펫</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-purple-400">&#9670;</span>
          <span className="font-bold">{saveData.gems.toLocaleString()}</span>
        </div>
      </div>

      {/* Active pet banner */}
      {activePet && (() => {
        const pet = PETS.find((p) => p.id === activePet);
        if (!pet) return null;
        const level = petLevels[pet.id] ?? 0;
        const petMult = 1 + level * 0.1;
        const combatAtk = Math.round(pet.attack * petMult);
        return (
          <Card className="mb-6 text-center">
            <p className="text-xs text-gray-500 mb-1">장착 중인 펫</p>
            <p className="text-3xl mb-1">{petEmojis[pet.id] ?? '?'}</p>
            <p className={`text-lg font-bold ${rarityTextColors[pet.rarity]}`}>
              {pet.name} {level > 0 && <span className="text-sm text-amber-400">+{level}</span>}
            </p>
            <p className="text-xs text-orange-400 mt-1">전투 공격력: {combatAtk}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {pet.bonus.map((b, i) => (
                <span key={i} className="text-xs bg-dungeon-panel px-2 py-1 rounded text-green-400">
                  {formatBonus(b.stat, b.value, petMult)}
                </span>
              ))}
            </div>
          </Card>
        );
      })()}

      {/* Pet grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PETS.map((pet) => {
          const owned = ownedPets.includes(pet.id);
          const isActive = activePet === pet.id;
          const level = petLevels[pet.id] ?? 0;
          const exp = petEnhanceExp[pet.id] ?? 0;
          const petMult = 1 + level * 0.1;
          const nextCost = getEnhanceCostForLevel(level);
          const combatAtk = Math.round(pet.attack * petMult);

          return (
            <Card
              key={pet.id}
              className={`relative border-2 ${rarityBorders[pet.rarity]} ${rarityBgGlow[pet.rarity]} ${
                isActive ? 'ring-2 ring-dungeon-accent' : ''
              } ${!owned ? 'opacity-70' : ''}`}
            >
              {/* Rarity badge */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${rarityTextColors[pet.rarity]}`}>
                  {rarityLabels[pet.rarity]}
                </span>
                <div className="flex items-center gap-2">
                  {owned && level > 0 && (
                    <span className="text-xs font-bold text-amber-400">+{level}</span>
                  )}
                  {isActive && (
                    <span className="text-xs bg-dungeon-accent/20 text-dungeon-accent px-2 py-0.5 rounded">
                      장착 중
                    </span>
                  )}
                </div>
              </div>

              {/* Pet icon and name */}
              <div className="text-center mb-3">
                <p className="text-4xl mb-2">{petEmojis[pet.id] ?? '?'}</p>
                <p className={`text-lg font-bold ${rarityTextColors[pet.rarity]}`}>{pet.name}</p>
                <p className="text-xs text-gray-500 mt-1">{pet.description}</p>
              </div>

              {/* Combat ATK */}
              {owned && (
                <p className="text-center text-xs text-orange-400 mb-2">
                  전투 공격력: {combatAtk}
                </p>
              )}

              {/* Enhancement progress */}
              {owned && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                    <span>강화 경험치</span>
                    <span>{exp} / {nextCost}</span>
                  </div>
                  <div className="w-full bg-dungeon-bg rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, (exp / nextCost) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Bonus stats */}
              <div className="flex flex-wrap justify-center gap-1 mb-4">
                {pet.bonus.map((b, i) => (
                  <span key={i} className="text-xs bg-dungeon-bg px-2 py-1 rounded text-green-400">
                    {formatBonus(b.stat, b.value, owned ? petMult : 1)}
                  </span>
                ))}
              </div>

              {/* Action button */}
              <div className="text-center">
                {owned ? (
                  <Button
                    size="sm"
                    variant={isActive ? 'secondary' : 'primary'}
                    onClick={() => handleEquip(pet.id)}
                    disabled={loading}
                  >
                    {isActive ? '해제' : '장착'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleSummon(pet.id)}
                    disabled={loading || saveData.gems < pet.summonCost}
                  >
                    소환 ({pet.summonCost} &#9670;)
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default PetScreen;
