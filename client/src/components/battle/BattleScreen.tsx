import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCombat } from '@/hooks/useCombat';
import { useAuth } from '@/hooks/useAuth';
import { SKILLS, ITEMS } from '@shared/data';
import StatBar from '@/components/common/StatBar';
import SkillBar from './SkillBar';
import BattleResult from './BattleResult';
import type { BattleFighter } from '@shared/types';

const EnemyCard = React.memo(function EnemyCard({
  enemy,
  isSelected,
  onSelect,
}: {
  enemy: BattleFighter;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const handleClick = useCallback(() => {
    if (enemy.isAlive) onSelect(enemy.id);
  }, [enemy.id, enemy.isAlive, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!enemy.isAlive}
      className={`panel p-3 transition-all duration-200 min-w-[120px] ${
        !enemy.isAlive
          ? 'opacity-30 cursor-not-allowed'
          : isSelected
            ? 'border-dungeon-health shadow-md shadow-dungeon-health/20'
            : 'hover:border-dungeon-accent/50 cursor-pointer'
      }`}
    >
      <div className="w-14 h-14 mx-auto bg-dungeon-bg rounded-lg mb-2 flex items-center justify-center">
        <span className={`text-2xl ${enemy.isAlive ? 'text-dungeon-health' : 'text-gray-700'}`}>
          &#128128;
        </span>
      </div>
      <p className="text-xs font-bold text-center truncate mb-1">{enemy.name}</p>
      <StatBar current={enemy.currentHp} max={enemy.maxHp} color="health" showNumbers={false} />
      <p className="text-[10px] text-gray-500 text-center mt-0.5">
        {enemy.currentHp}/{enemy.maxHp}
      </p>
    </button>
  );
});

function BattleScreen() {
  const { dungeonId } = useParams<{ dungeonId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, saveData, updateSaveData } = useAuth();
  const {
    battleState,
    battleLog,
    rewards,
    levelUp,
    isAnimating,
    isPlayerTurn,
    isVictory,
    isDefeat,
    startBattle,
    startAbyssBattle,
    useSkill,
    useAbyssSkill,
    canUseSkill,
    getSkillStates,
    resetBattle,
    useBattleItem,
    abyssFloor,
    abyssNextFloor,
  } = useCombat();

  const isAbyssMode = dungeonId === 'abyss';

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll battle log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [battleLog]);

  // Start battle on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
    resetBattle();
    if (isAbyssMode) {
      startAbyssBattle();
    } else if (dungeonId) {
      startBattle(dungeonId);
    }
  }, [dungeonId, isAbyssMode, isAuthenticated, navigate, resetBattle, startBattle, startAbyssBattle]);

  // Auto-select first alive enemy
  useEffect(() => {
    if (battleState) {
      const firstAlive = battleState.enemies.find((e) => e.isAlive);
      if (firstAlive && !selectedTargetId) {
        setSelectedTargetId(firstAlive.id);
      }
      // 현재 타겟이 죽었으면 다음 살아있는 적 선택
      if (selectedTargetId) {
        const currentTarget = battleState.enemies.find((e) => e.id === selectedTargetId);
        if (currentTarget && !currentTarget.isAlive) {
          const nextAlive = battleState.enemies.find((e) => e.isAlive);
          setSelectedTargetId(nextAlive?.id ?? null);
        }
      }
    }
  }, [battleState, selectedTargetId]);

  const characterSkills = useMemo(() => {
    if (!saveData?.characterId) return [];
    return SKILLS.filter((s) => s.characterId === saveData.characterId || s.characterId === 'common');
  }, [saveData?.characterId]);

  const handleTargetSelect = useCallback((id: string) => {
    setSelectedTargetId(id);
  }, []);

  const handleSkillSelect = useCallback(
    async (skillId: string) => {
      if (!isPlayerTurn || isAnimating || !canUseSkill(skillId)) return;

      const skill = SKILLS.find((s) => s.id === skillId);
      if (!skill) return;

      let targetId: string;
      if (skill.targetType === 'self' || skill.targetType === 'all_enemies' || skill.targetType === 'all_allies') {
        targetId = battleState?.player.id ?? 'player';
      } else {
        // Use selected target, or auto-pick first alive enemy
        const target = selectedTargetId
          ? battleState?.enemies.find((e) => e.id === selectedTargetId && e.isAlive)
          : null;
        const fallback = battleState?.enemies.find((e) => e.isAlive);
        targetId = target?.id ?? fallback?.id ?? '';
        if (!targetId) return;
        if (!target && fallback) setSelectedTargetId(fallback.id);
      }

      const result = isAbyssMode
        ? await useAbyssSkill(skillId, targetId)
        : await useSkill(skillId, targetId);

      // 승리 시 서버에서 반환한 saveData로 로컬 상태 동기화
      if (result?.saveData) {
        updateSaveData(result.saveData);
      }
    },
    [isPlayerTurn, isAnimating, canUseSkill, selectedTargetId, useSkill, battleState, updateSaveData],
  );

  const handleContinue = useCallback(() => {
    resetBattle();
    navigate('/dungeon');
  }, [resetBattle, navigate]);

  const handleRetry = useCallback(() => {
    if (dungeonId) {
      setSelectedTargetId(null);
      resetBattle();
      startBattle(dungeonId);
    }
  }, [dungeonId, resetBattle, startBattle]);

  const handleHome = useCallback(() => {
    resetBattle();
    navigate('/home');
  }, [resetBattle, navigate]);

  const handleNextFloor = useCallback(() => {
    setSelectedTargetId(null);
    resetBattle();
    startAbyssBattle();
  }, [resetBattle, startAbyssBattle]);

  const logTypeColor: Record<string, string> = {
    damage: 'text-dungeon-health',
    heal: 'text-dungeon-xp',
    buff: 'text-dungeon-mana',
    debuff: 'text-purple-400',
    defeat: 'text-dungeon-gold',
    system: 'text-gray-500',
  };

  if (!battleState) {
    return (
      <div className="max-w-4xl mx-auto p-4 min-h-screen flex items-center justify-center">
        <p className="text-gray-500">전투 준비 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen flex flex-col">
      {/* Turn indicator */}
      <div className="text-center mb-2">
        {isAbyssMode && abyssFloor !== null && (
          <span className="text-sm font-bold text-purple-400 mr-3">
            심연 {abyssFloor}층 {abyssFloor > 0 && abyssFloor % 10 === 0 ? '(BOSS)' : ''}
          </span>
        )}
        {!isAbyssMode && (
          <span className="text-xs text-gray-400 mr-2">
            웨이브 {(battleState.log.filter((l) => l.type === 'system' && l.message.includes('웨이브')).length) + 1}/3
          </span>
        )}
        <span className="text-xs text-gray-500">턴 {battleState.turn}</span>
        <span className="text-xs text-dungeon-accent ml-3">
          {battleState.status === 'player_turn'
            ? '당신의 턴'
            : battleState.status === 'enemy_turn'
              ? '적의 턴'
              : ''}
        </span>
      </div>

      {/* Enemy area */}
      <div className="flex gap-3 justify-center flex-wrap mb-4">
        {battleState.enemies.map((enemy) => (
          <EnemyCard
            key={enemy.id}
            enemy={enemy}
            isSelected={selectedTargetId === enemy.id}
            onSelect={handleTargetSelect}
          />
        ))}
      </div>

      {/* Battle log */}
      <div
        ref={logRef}
        className="flex-1 min-h-[160px] max-h-[220px] overflow-y-auto panel mb-4 text-sm space-y-1"
      >
        {battleLog.length === 0 && (
          <p className="text-gray-600 text-center">전투가 시작됩니다...</p>
        )}
        {battleLog.map((entry, idx) => (
          <p key={idx} className={logTypeColor[entry.type] ?? 'text-gray-400'}>
            <span className="text-gray-600 text-xs mr-2">[{entry.turn}]</span>
            {entry.message}
          </p>
        ))}
      </div>

      {/* Player stats */}
      <div className="panel mb-3">
        <div className="flex items-center gap-4 mb-2">
          <span className="font-bold text-sm">{battleState.player.name}</span>
          {battleState.player.statusEffects.map((eff, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-dungeon-bg text-purple-300">
              {eff.type} ({eff.remainingTurns})
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatBar
            current={battleState.player.currentHp}
            max={battleState.player.maxHp}
            color="health"
            label="HP"
            showNumbers
          />
          <StatBar
            current={battleState.player.currentMp}
            max={battleState.player.maxMp}
            color="mana"
            label="MP"
            showNumbers
          />
        </div>
      </div>

      {/* Skill bar */}
      <SkillBar
        skills={characterSkills}
        skillStates={getSkillStates()}
        currentMp={battleState.player.currentMp}
        onSkillSelect={handleSkillSelect}
      />

      {/* Consumable items */}
      {isPlayerTurn && saveData?.inventory && (() => {
        const consumables = saveData.inventory
          .map((s) => ({ slot: s, data: ITEMS.find((i) => i.id === s.itemId) }))
          .filter((c) => c.data?.type === 'consumable' && c.slot.quantity > 0);
        if (consumables.length === 0) return null;
        return (
          <div className="flex gap-2 mt-2 justify-center flex-wrap">
            {consumables.map((c) => (
              <button
                key={c.slot.itemId}
                type="button"
                disabled={isAnimating}
                onClick={async () => {
                  if (isAnimating) return;
                  const result = await useBattleItem(c.slot.itemId);
                  if (result?.saveData) updateSaveData(result.saveData);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dungeon-panel border border-dungeon-border hover:border-green-500/50 transition-colors disabled:opacity-50"
              >
                <span className="text-sm">{c.data?.useEffect?.type === 'heal_hp' ? '\u2764' : '\uD83D\uDCA7'}</span>
                <span className="text-xs text-gray-200">{c.data?.name}</span>
                <span className="text-[10px] text-gray-500">x{c.slot.quantity}</span>
              </button>
            ))}
          </div>
        );
      })()}

      {/* Result modal */}
      <BattleResult
        isOpen={isVictory || isDefeat}
        isVictory={isVictory}
        rewards={rewards}
        levelUp={levelUp}
        onContinue={handleContinue}
        onRetry={handleRetry}
        onHome={handleHome}
        isAbyss={isAbyssMode}
        abyssFloor={abyssFloor}
        abyssNextFloor={abyssNextFloor}
        onNextFloor={handleNextFloor}
      />
    </div>
  );
}

export default BattleScreen;
