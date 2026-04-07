import { useEffect, useCallback } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGameStore } from '@/stores/gameStore';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import type { Dungeon } from '@shared/types';

const DungeonCard = React.memo(function DungeonCard({
  dungeon,
  playerLevel,
  onSelect,
}: {
  dungeon: Dungeon;
  playerLevel: number;
  onSelect: (id: string) => void;
}) {
  const isLocked = playerLevel < dungeon.requiredLevel;

  const handleClick = useCallback(() => {
    if (!isLocked) onSelect(dungeon.id);
  }, [dungeon.id, isLocked, onSelect]);

  return (
    <Card
      hover={!isLocked}
      onClick={handleClick}
      className={`relative overflow-hidden ${isLocked ? 'opacity-50' : ''}`}
    >
      {/* Image placeholder with gradient */}
      <div className="w-full h-32 bg-gradient-to-b from-dungeon-accent/10 to-dungeon-bg rounded-lg mb-3 flex items-center justify-center">
        {isLocked ? (
          <span className="text-4xl text-gray-600">&#128274;</span>
        ) : (
          <span className="text-4xl text-dungeon-accent/60">&#9876;</span>
        )}
      </div>

      <h3 className="text-lg font-bold text-gray-100">{dungeon.name}</h3>
      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{dungeon.description}</p>

      <div className="flex items-center justify-between text-xs">
        <span className={`${isLocked ? 'text-dungeon-health' : 'text-dungeon-xp'}`}>
          필요 레벨: {dungeon.requiredLevel}
        </span>
        <span className="text-dungeon-gold">
          보상: {dungeon.rewards.gold}G / {dungeon.rewards.exp} EXP
        </span>
      </div>

      <div className="text-xs text-gray-600 mt-1">
        웨이브: {dungeon.waves.length}
      </div>

      {isLocked && (
        <div className="absolute inset-0 bg-dungeon-bg/40 flex items-center justify-center">
          <p className="text-sm text-gray-400 font-bold">레벨 {dungeon.requiredLevel} 필요</p>
        </div>
      )}
    </Card>
  );
});

function DungeonSelect() {
  const navigate = useNavigate();
  const { saveData, isAuthenticated } = useAuth();
  const { dungeons, loadGameData } = useGameStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
    loadGameData();
  }, [isAuthenticated, navigate, loadGameData]);

  const handleSelect = useCallback(
    (dungeonId: string) => {
      navigate(`/battle/${dungeonId}`);
    },
    [navigate],
  );

  const handleBack = useCallback(() => navigate('/home'), [navigate]);

  const playerLevel = saveData?.level ?? 1;

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dungeon-accent">던전 선택</h1>
          <p className="text-sm text-gray-500">도전할 던전을 선택하세요</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleBack}>
          돌아가기
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {dungeons.map((dungeon) => (
          <DungeonCard
            key={dungeon.id}
            dungeon={dungeon}
            playerLevel={playerLevel}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}

export default DungeonSelect;
