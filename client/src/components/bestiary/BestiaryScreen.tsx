import { useEffect, useMemo, useCallback } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MONSTERS } from '@shared/data';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import type { Monster, BestiaryEntry } from '@shared/types';

const MonsterCard = React.memo(function MonsterCard({
  monster,
  entry,
}: {
  monster: Monster;
  entry: BestiaryEntry | null;
}) {
  const isEncountered = entry !== null && entry.killCount > 0;

  return (
    <Card className={`${isEncountered ? '' : 'opacity-50'}`}>
      {/* Monster image placeholder */}
      <div className="w-full aspect-square bg-dungeon-bg rounded-lg mb-2 flex items-center justify-center">
        {isEncountered ? (
          <span className="text-3xl text-dungeon-health">&#128128;</span>
        ) : (
          <span className="text-3xl text-gray-700">&#128274;</span>
        )}
      </div>

      <h3 className="text-sm font-bold text-center truncate">
        {isEncountered ? monster.name : '???'}
      </h3>

      {isEncountered ? (
        <p className="text-[10px] text-gray-500 text-center mt-0.5">
          처치: {entry.killCount}회
        </p>
      ) : (
        <p className="text-[10px] text-gray-600 text-center mt-0.5">
          미발견
        </p>
      )}
    </Card>
  );
});

function BestiaryScreen() {
  const navigate = useNavigate();
  const { saveData, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const bestiaryMap = useMemo(() => {
    const map = new Map<string, BestiaryEntry>();
    if (saveData?.bestiary) {
      for (const entry of saveData.bestiary) {
        map.set(entry.monsterId, entry);
      }
    }
    return map;
  }, [saveData?.bestiary]);

  const encounteredCount = useMemo(
    () => Array.from(bestiaryMap.values()).filter((e) => e.killCount > 0).length,
    [bestiaryMap],
  );

  const handleBack = useCallback(() => navigate('/home'), [navigate]);

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dungeon-accent">기록일지</h1>
          <p className="text-sm text-gray-500 mt-1">
            발견: {encounteredCount} / {MONSTERS.length}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleBack}>
          돌아가기
        </Button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {MONSTERS.map((monster) => (
          <MonsterCard
            key={monster.id}
            monster={monster}
            entry={bestiaryMap.get(monster.id) ?? null}
          />
        ))}
      </div>
    </div>
  );
}

export default BestiaryScreen;
