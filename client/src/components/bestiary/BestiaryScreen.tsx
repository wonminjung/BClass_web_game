import { useEffect, useMemo, useCallback, useState } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MONSTERS, ITEMS } from '@shared/data';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import type { Monster, BestiaryEntry, DropRecord, Item } from '@shared/types';

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

const itemMap = new Map<string, Item>(ITEMS.map((item) => [item.id, item]));

const RARITY_COLOR: Record<string, string> = {
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
  mythic: 'text-rose-400',
};

const DropHistoryEntry = React.memo(function DropHistoryEntry({
  record,
}: {
  record: DropRecord;
}) {
  const item = itemMap.get(record.itemId);
  if (!item) return null;

  const colorClass = RARITY_COLOR[item.rarity] ?? 'text-gray-300';
  const formattedDate = record.date.slice(0, 10);

  return (
    <div className="flex items-center gap-3 p-3 bg-dungeon-surface rounded-lg">
      <div className="w-10 h-10 flex-shrink-0 rounded bg-dungeon-bg flex items-center justify-center overflow-hidden">
        <img
          src={item.iconUrl}
          alt={item.name}
          className="w-8 h-8 object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            if (e.currentTarget.nextElementSibling) {
              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
            }
          }}
        />
        <span className="text-lg hidden items-center justify-center">&#128142;</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${colorClass}`}>{item.name}</p>
        <p className="text-xs text-gray-500">{record.source}</p>
      </div>
      <p className="text-xs text-gray-500 flex-shrink-0">{formattedDate}</p>
    </div>
  );
});

function DropHistoryTab({ dropHistory }: { dropHistory: DropRecord[] }) {
  const sorted = useMemo(
    () => [...dropHistory].sort((a, b) => b.date.localeCompare(a.date)),
    [dropHistory],
  );

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-500">아직 획득한 영웅/전설 장비가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((record, idx) => (
        <DropHistoryEntry key={`${record.itemId}-${record.date}-${idx}`} record={record} />
      ))}
    </div>
  );
}

function BestiaryScreen() {
  const navigate = useNavigate();
  const { saveData, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'bestiary' | 'drops'>('bestiary');

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
          {activeTab === 'bestiary' && (
            <p className="text-sm text-gray-500 mt-1">
              발견: {encounteredCount} / {MONSTERS.length}
            </p>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={handleBack}>
          돌아가기
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-colors ${
            activeTab === 'bestiary'
              ? 'bg-dungeon-surface text-dungeon-accent border-b-2 border-dungeon-accent'
              : 'bg-dungeon-bg text-gray-500 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('bestiary')}
        >
          몬스터 도감
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-colors ${
            activeTab === 'drops'
              ? 'bg-dungeon-surface text-dungeon-accent border-b-2 border-dungeon-accent'
              : 'bg-dungeon-bg text-gray-500 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('drops')}
        >
          획득 기록
        </button>
      </div>

      {activeTab === 'bestiary' ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {MONSTERS.map((monster) => (
            <MonsterCard
              key={monster.id}
              monster={monster}
              entry={bestiaryMap.get(monster.id) ?? null}
            />
          ))}
        </div>
      ) : (
        <DropHistoryTab dropHistory={saveData?.dropHistory ?? []} />
      )}
    </div>
  );
}

export default BestiaryScreen;
