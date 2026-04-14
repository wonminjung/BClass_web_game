import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCombat } from '@/hooks/useCombat';
import { useCombatStore } from '@/stores/combatStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { SKILLS, ITEMS } from '@shared/data';
import StatBar from '@/components/common/StatBar';
import SkillBar from './SkillBar';
import BattleResult from './BattleResult';
import type { BattleFighter } from '@shared/types';

const getMonsterEmoji = (name: string) => {
  if (name.includes('구울') || name.includes('언데드')) return '\u{1F480}';
  if (name.includes('거미')) return '\u{1F577}';
  if (name.includes('기사') || name.includes('오크')) return '\u2694\uFE0F';
  if (name.includes('악마') || name.includes('에레다르') || name.includes('파멸')) return '\u{1F47F}';
  if (name.includes('용') || name.includes('드레이크') || name.includes('비룡')) return '\u{1F409}';
  if (name.includes('리치') || name.includes('사제') || name.includes('흑마')) return '\u{1F9D9}';
  if (name.includes('정령') || name.includes('거신')) return '\u{1F525}';
  if (name.includes('히드라') || name.includes('늪')) return '\u{1F40D}';
  if (name.includes('가고일')) return '\u{1F5FF}';
  if (name.includes('군주') || name.includes('살게라스') || name.includes('아키몬드')) return '\u{1F608}';
  if (name.includes('아서스') || name.includes('초갈')) return '\u{1F451}';
  if (name.includes('발키르')) return '\u{1F47C}';
  return '\u{1F480}';
};

const EnemyCard = React.memo(function EnemyCard({
  enemy,
  isSelected,
  isFlashing,
  onSelect,
}: {
  enemy: BattleFighter;
  isSelected: boolean;
  isFlashing: boolean;
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
      className={`panel p-2 sm:p-3 transition-all min-w-[100px] sm:min-w-[120px] ${
        !enemy.isAlive
          ? 'duration-500 scale-75 opacity-30 cursor-not-allowed'
          : isSelected
            ? 'duration-200 border-dungeon-health shadow-md shadow-dungeon-health/20'
            : 'duration-200 hover:border-dungeon-accent/50 cursor-pointer'
      } ${isFlashing ? 'animate-pulse bg-red-900/30' : ''}`}
    >
      <div className="w-14 h-14 mx-auto bg-dungeon-bg rounded-lg mb-2 flex items-center justify-center">
        <span className={`text-2xl ${enemy.isAlive ? 'text-dungeon-health' : 'text-gray-700'}`}>
          {getMonsterEmoji(enemy.name)}
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
    error: combatError,
    startBattle,
    startAbyssBattle,
    startWeeklyBossBattle,
    useSkill,
    useAbyssSkill,
    useWeeklyBossSkill,
    getSkillStates,
    resetBattle,
    useBattleItem,
    abyssFloor,
    abyssNextFloor,
  } = useCombat();

  const isAbyssMode = dungeonId === 'abyss';
  const isWeeklyBossMode = dungeonId === 'weekly_boss';

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [flashEnemies, setFlashEnemies] = useState<Set<string>>(new Set());
  const [healFlash, setHealFlash] = useState(false);
  const [skillText, setSkillText] = useState<string | null>(null);
  const [autoBattle, setAutoBattle] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [bossIntro, setBossIntro] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const autoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleSkillSelectRef = useRef<(skillId: string) => Promise<void>>();
  const handleNextFloorRef = useRef<() => void>();
  const useBattleItemRef = useRef(useBattleItem);
  useBattleItemRef.current = useBattleItem;

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
    } else if (isWeeklyBossMode) {
      startWeeklyBossBattle();
    } else if (dungeonId) {
      startBattle(dungeonId);
    }
  }, [dungeonId, isAbyssMode, isWeeklyBossMode, isAuthenticated, navigate, resetBattle, startBattle, startAbyssBattle, startWeeklyBossBattle]);

  // Boss entrance overlay
  useEffect(() => {
    if (battleState && battleState.enemies.length === 1 && battleState.turn === 1) {
      setBossIntro(true);
      setTimeout(() => setBossIntro(false), 1500);
    }
  }, [battleState?.id]);

  // Auto-select first alive enemy
  useEffect(() => {
    if (battleState) {
      const firstAlive = battleState.enemies.find((e) => e.isAlive);

      // 타겟이 없거나, 현재 타겟이 적 목록에 없거나, 죽었으면 재선택
      if (!selectedTargetId || !battleState.enemies.find((e) => e.id === selectedTargetId && e.isAlive)) {
        setSelectedTargetId(firstAlive?.id ?? null);
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
      // 항상 스토어에서 최신 상태를 가져옴 (클로저 문제 방지)
      const state = useCombatStore.getState();
      const currentBattle = state.battleState;
      if (!currentBattle || currentBattle.status !== 'player_turn') return;
      if (state.isAnimating) return;

      const skill = SKILLS.find((s) => s.id === skillId);
      if (!skill || skill.type === 'passive') return;

      let targetId: string;
      if (skill.targetType === 'self' || skill.targetType === 'all_enemies' || skill.targetType === 'all_allies') {
        targetId = 'player';
      } else {
        const aliveEnemies = currentBattle.enemies.filter((e) => e.isAlive);
        const target = aliveEnemies.find((e) => e.id === selectedTargetId) ?? aliveEnemies[0];
        if (!target) return;
        targetId = target.id;
        if (targetId !== selectedTargetId) setSelectedTargetId(targetId);
      }

      const prevLogLen = useCombatStore.getState().battleLog.length;

      const result = isAbyssMode
        ? await useAbyssSkill(skillId, targetId)
        : isWeeklyBossMode
          ? await useWeeklyBossSkill(skillId, targetId)
          : await useSkill(skillId, targetId);

      if (result?.saveData) {
        updateSaveData(result.saveData);
      }

      // Show skill name floating text
      setSkillText(skill.name);
      setTimeout(() => setSkillText(null), 800 / battleSpeed);

      // Check new log entries for damage/heal
      const newLog = useCombatStore.getState().battleLog;
      const newEntries = newLog.slice(prevLogLen);

      const hasDamage = newEntries.some((e) => e.type === 'damage');
      const hasHeal = newEntries.some((e) => e.type === 'heal');

      if (hasDamage) {
        // Flash all enemies that were targeted
        const hitIds = new Set<string>();
        if (skill.targetType === 'all_enemies' && result?.battleState) {
          result.battleState.enemies.forEach((e) => hitIds.add(e.id));
        } else if (targetId !== 'player') {
          hitIds.add(targetId);
        }
        setFlashEnemies(hitIds);
        setTimeout(() => setFlashEnemies(new Set()), 300 / battleSpeed);
      }

      if (hasHeal) {
        setHealFlash(true);
        setTimeout(() => setHealFlash(false), 300 / battleSpeed);
      }
    },
    [selectedTargetId, useSkill, useAbyssSkill, useWeeklyBossSkill, isAbyssMode, isWeeklyBossMode, updateSaveData, battleSpeed],
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

  // Keep refs in sync for auto-battle to avoid stale closures
  handleSkillSelectRef.current = handleSkillSelect;
  handleNextFloorRef.current = handleNextFloor;

  // Auto-battle logic
  useEffect(() => {
    if (!autoBattle) {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
      return;
    }

    autoIntervalRef.current = setInterval(() => {
      const state = useCombatStore.getState();
      const battle = state.battleState;
      if (!battle) return;

      // On defeat, stop auto-battle
      if (battle.status === 'defeat') {
        setAutoBattle(false);
        return;
      }

      // On victory in abyss mode, auto-progress to next floor
      if (battle.status === 'victory' && isAbyssMode) {
        handleNextFloorRef.current?.();
        return;
      }

      // Only act on player turn and not animating
      if (battle.status !== 'player_turn' || state.isAnimating) return;

      // Auto potion when HP < 30%
      if (battle.player.currentHp / battle.player.maxHp < 0.3) {
        const authState = useAuthStore.getState();
        const inv = authState.saveData?.inventory;
        const hpPotion = inv?.find((s: any) => s.itemId.startsWith('hp_potion') && s.quantity > 0);
        if (hpPotion) {
          useBattleItemRef.current(hpPotion.itemId);
          return;
        }
      }

      // Pick best skill: highest damageMultiplier with cooldown=0 and sufficient MP
      const playerMp = battle.player.currentMp;
      const skillStates = state.skillStates;
      const charId = saveData?.characterId;
      const availableSkills = SKILLS
        .filter((s) => (s.characterId === charId || s.characterId === 'common') && s.type !== 'passive')
        .filter((s) => {
          const ss = skillStates.find((st) => st.skillId === s.id);
          const onCooldown = ss ? ss.currentCooldown > 0 : false;
          return !onCooldown && s.manaCost <= playerMp;
        });

      let chosenSkillId: string;
      if (availableSkills.length > 0) {
        const aliveCount = battle.enemies.filter((e) => e.isAlive).length;

        if (aliveCount >= 2) {
          // 2마리 이상: 광역기 우선, 없으면 단일 최강
          const aoeSkills = availableSkills.filter((s) => s.targetType === 'all_enemies');
          if (aoeSkills.length > 0) {
            aoeSkills.sort((a, b) => b.damageMultiplier - a.damageMultiplier);
            chosenSkillId = aoeSkills[0].id;
          } else {
            availableSkills.sort((a, b) => b.damageMultiplier - a.damageMultiplier);
            chosenSkillId = availableSkills[0].id;
          }
        } else {
          // 1마리: 단일 대상 최강 스킬
          const singleSkills = availableSkills.filter((s) => s.targetType === 'single_enemy');
          if (singleSkills.length > 0) {
            singleSkills.sort((a, b) => b.damageMultiplier - a.damageMultiplier);
            chosenSkillId = singleSkills[0].id;
          } else {
            availableSkills.sort((a, b) => b.damageMultiplier - a.damageMultiplier);
            chosenSkillId = availableSkills[0].id;
          }
        }
      } else {
        chosenSkillId = 'common_basic_attack';
      }

      handleSkillSelectRef.current?.(chosenSkillId);
    }, 500 / battleSpeed);

    return () => {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
    };
  }, [autoBattle, battleSpeed, isAbyssMode, saveData?.characterId]);

  // Keyboard shortcut: 'a' toggles auto-battle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') {
        // Ignore if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        setAutoBattle((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const logTypeColor: Record<string, string> = {
    damage: 'text-red-300',
    heal: 'text-green-300',
    buff: 'text-blue-300',
    debuff: 'text-purple-300',
    defeat: 'text-gray-500',
    system: 'text-yellow-300 italic',
  };

  if (!battleState) {
    return (
      <div className="max-w-4xl mx-auto p-4 min-h-screen flex items-center justify-center">
        <p className="text-gray-500">전투 준비 중...</p>
      </div>
    );
  }

  const bgGradient = isAbyssMode ? 'from-purple-950/20' : isWeeklyBossMode ? 'from-red-950/20' : 'from-gray-950/10';

  return (
    <div className={`max-w-4xl mx-auto p-2 sm:p-4 min-h-screen flex flex-col bg-gradient-to-b ${bgGradient} to-transparent`}>
      {/* Turn indicator */}
      <div className="text-center mb-2 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
        {isAbyssMode && abyssFloor !== null && (
          <span className="text-sm font-bold text-purple-400">
            심연 {abyssFloor}층 {abyssFloor > 0 && abyssFloor % 10 === 0 ? '(BOSS)' : ''}
          </span>
        )}
        {!isAbyssMode && (
          <span className="text-xs text-gray-400">
            웨이브 {(battleState.log.filter((l) => l.type === 'system' && l.message.includes('웨이브')).length) + 1}/3
          </span>
        )}
        <span className="text-xs text-gray-500">턴 {battleState.turn}</span>
        <span className="text-xs text-dungeon-accent">
          {battleState.status === 'player_turn'
            ? '당신의 턴'
            : battleState.status === 'enemy_turn'
              ? '적의 턴'
              : ''}
        </span>
        <button
          type="button"
          onClick={() => setAutoBattle((prev) => !prev)}
          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
            autoBattle
              ? 'border-green-500 text-green-400 bg-green-900/30'
              : 'border-dungeon-border text-gray-400 hover:border-gray-500'
          }`}
        >
          자동 전투 {autoBattle ? 'ON' : 'OFF'}
        </button>
        <button
          type="button"
          onClick={() => setBattleSpeed((s) => (s >= 3 ? 1 : s + 1))}
          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
            battleSpeed > 1
              ? 'border-yellow-500 text-yellow-400 bg-yellow-900/30'
              : 'border-dungeon-border text-gray-400 hover:border-gray-500'
          }`}
        >
          x{battleSpeed}
        </button>
      </div>

      {/* Error display */}
      {combatError && (
        <div className="text-center text-red-400 text-xs mb-2 py-1 px-3 bg-red-900/20 rounded">
          {combatError}
        </div>
      )}

      {/* Enemy area */}
      <div className="flex gap-3 justify-center flex-wrap mb-4">
        {battleState.enemies.map((enemy) => (
          <EnemyCard
            key={enemy.id}
            enemy={enemy}
            isSelected={selectedTargetId === enemy.id}
            isFlashing={flashEnemies.has(enemy.id)}
            onSelect={handleTargetSelect}
          />
        ))}
      </div>

      {/* Battle log */}
      <div
        ref={logRef}
        className="flex-1 min-h-[100px] sm:min-h-[160px] max-h-[160px] sm:max-h-[220px] overflow-y-auto panel mb-4 text-xs sm:text-sm space-y-1"
      >
        {battleLog.length === 0 && (
          <p className="text-gray-600 text-center">전투가 시작됩니다...</p>
        )}
        {battleLog.map((entry, idx) =>
          entry.message.includes('치명타') ? (
            <p key={idx} className="text-yellow-300 font-bold">
              <span className="text-gray-600 text-xs mr-2">[{entry.turn}]</span>
              &#x26A1; {entry.message}
            </p>
          ) : (
            <p key={idx} className={logTypeColor[entry.type] ?? 'text-gray-400'}>
              <span className="text-gray-600 text-xs mr-2">[{entry.turn}]</span>
              {entry.message}
            </p>
          ),
        )}
      </div>

      {/* Player stats */}
      <div className={`panel mb-3 transition-colors duration-300 ${healFlash ? 'bg-green-900/20' : ''}`}>
        <div className="flex items-center gap-4 mb-2">
          <span className="font-bold text-sm">{battleState.player.name}</span>
          {battleState.player.statusEffects.map((eff, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-dungeon-bg text-purple-300">
              {eff.type} ({eff.remainingTurns})
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-2">
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
        <div className="flex gap-3 text-[11px]">
          <span className="text-red-400">ATK {battleState.player.attack.toLocaleString()}</span>
          <span className="text-blue-400">DEF {battleState.player.defense.toLocaleString()}</span>
          <span className="text-green-400">SPD {battleState.player.speed}</span>
          <span className="text-gray-600 text-[9px]">(실제 전투 수치)</span>
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
                <span className="text-sm">{c.data?.useEffect?.type === 'heal_hp' ? '\u2764' : c.data?.useEffect?.type === 'heal_mp' ? '\uD83D\uDCA7' : c.data?.useEffect?.type === 'buff_attack' ? '\u2694\uFE0F' : c.data?.useEffect?.type === 'buff_defense' ? '\uD83D\uDEE1\uFE0F' : '\u2728'}</span>
                <span className="text-xs text-gray-200">{c.data?.name}</span>
                <span className="text-[10px] text-gray-500">x{c.slot.quantity}</span>
              </button>
            ))}
          </div>
        );
      })()}

      {/* Boss intro overlay */}
      {bossIntro && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 bg-black/40">
          <span className="text-5xl font-black text-red-500 animate-pulse tracking-widest">BOSS</span>
        </div>
      )}

      {/* Skill name floating text */}
      {skillText && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <span className="text-3xl font-bold text-white animate-bounce opacity-80">{skillText}</span>
        </div>
      )}

      {/* Result modal */}
      <BattleResult
        isOpen={isVictory || isDefeat}
        isVictory={isVictory}
        rewards={rewards}
        levelUp={levelUp}
        onContinue={handleContinue}
        onRetry={handleRetry}
        onHome={handleHome}
        stats={battleState?.stats}
        isAbyss={isAbyssMode}
        abyssFloor={abyssFloor}
        abyssNextFloor={abyssNextFloor}
        onNextFloor={handleNextFloor}
      />
    </div>
  );
}

export default BattleScreen;
