import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCombat } from '@/hooks/useCombat';
import { useCombatStore } from '@/stores/combatStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { SKILLS, ITEMS } from '@shared/data';
import SkillBar from './SkillBar';
import BattleResult from './BattleResult';
import AnimatedSprite from './AnimatedSprite';
import BattleEffect from './BattleEffect';
import type { EffectType } from './BattleEffect';
import { CLASS_SPRITES, getMonsterSprite, getDungeonBackground } from '@/config/spriteMap';
import { PETS } from '@shared/data';

const PET_EMOJIS: Record<string, string> = {
  pet_wolf: '\uD83D\uDC3A', pet_cat: '\uD83D\uDC31', pet_turtle: '\uD83D\uDC22',
  pet_eagle: '\uD83E\uDD85', pet_phoenix: '\uD83D\uDD25', pet_dragon: '\uD83D\uDC09',
  pet_unicorn: '\uD83E\uDD84', pet_demon: '\uD83D\uDC7F', pet_angel: '\uD83D\uDC7C',
  pet_myth_dragon: '\uD83D\uDC32', pet_myth_void: '\uD83D\uDC7E', pet_myth_eagle: '\uD83E\uDD85',
  pet_myth_unicorn: '\uD83E\uDD84', pet_myth_reaper: '\uD83D\uDC80',
};
import type { BattleFighter } from '@shared/types';

const EnemyCard = React.memo(function EnemyCard({
  enemy,
  isSelected,
  isFlashing,
  effectType,
  isLunging,
  onSelect,
}: {
  enemy: BattleFighter;
  isSelected: boolean;
  isFlashing: boolean;
  effectType: EffectType | null;
  isLunging: boolean;
  onSelect: (id: string) => void;
}) {
  const handleClick = useCallback(() => {
    if (enemy.isAlive) onSelect(enemy.id);
  }, [enemy.id, enemy.isAlive, onSelect]);

  const spriteSet = useMemo(() => getMonsterSprite(enemy.name, enemy.monsterId), [enemy.name, enemy.monsterId]);
  const isBoss = enemy.name.includes('보스') || enemy.name.includes('군주') || enemy.name.includes('왕');

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!enemy.isAlive}
      className={`relative flex flex-col items-center transition-all ${
        !enemy.isAlive
          ? 'duration-500 opacity-30 cursor-not-allowed'
          : isSelected
            ? 'duration-200 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]'
            : 'duration-200 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)] cursor-pointer'
      }`}
    >
      {/* Sprite (facing left) */}
      <div className={`relative ${isFlashing ? 'animate-shake' : ''} ${isLunging ? 'animate-lunge-left' : ''} ${!enemy.isAlive ? 'grayscale rotate-90 translate-y-2' : ''}`}
           style={{ transition: enemy.isAlive ? 'none' : 'all 0.5s ease' }}>
        {isSelected && enemy.isAlive && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 animate-pulse z-30" />
        )}
        <AnimatedSprite
          frames={isLunging && enemy.isAlive ? spriteSet.run : (enemy.isAlive ? spriteSet.idle : spriteSet.idle.slice(0, 1))}
          fps={isLunging ? 12 : (enemy.isAlive ? 6 : 0)}
          width={isBoss ? 72 : 48}
          height={isBoss ? 72 : 48}
          flip={true}
          paused={!enemy.isAlive}
        />
        {effectType && <BattleEffect type={effectType} />}
        {isFlashing && !effectType && (
          <div className="absolute inset-0 bg-red-500/40 rounded mix-blend-screen" />
        )}
      </div>

      {/* Name + HP below sprite */}
      <p className="text-[9px] font-bold truncate max-w-[70px] leading-none mt-0.5">{enemy.name}</p>
      <div className="w-14">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
            style={{ width: `${Math.max(0, (enemy.currentHp / enemy.maxHp) * 100)}%` }}
          />
        </div>
      </div>
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
    startPrestigeTrialBattle,
    useSkill,
    useAbyssSkill,
    useWeeklyBossSkill,
    usePrestigeTrialSkill,
    getSkillStates,
    resetBattle,
    useBattleItem,
    abyssFloor,
    abyssNextFloor,
  } = useCombat();

  const isAbyssMode = dungeonId === 'abyss';
  const isWeeklyBossMode = dungeonId === 'weekly_boss';
  const isTrialMode = dungeonId === 'prestige_trial';

  const dungeonBg = getDungeonBackground(dungeonId ?? '');
  const playerSprites = CLASS_SPRITES[saveData?.characterId ?? ''] ?? CLASS_SPRITES.dark_knight;
  const activePetData = useMemo(() => {
    if (!saveData?.activePet) return null;
    return PETS.find((p) => p.id === saveData.activePet) ?? null;
  }, [saveData?.activePet]);

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [flashEnemies, setFlashEnemies] = useState<Set<string>>(new Set());
  const [playerAttacking, setPlayerAttacking] = useState(false);
  const [enemyEffects, setEnemyEffects] = useState<Record<string, EffectType>>({});
  const [enemyLunging, setEnemyLunging] = useState<string | null>(null);
  const [playerEffect, setPlayerEffect] = useState<EffectType | null>(null);
  const [petAttacking, setPetAttacking] = useState(false);
  const [skillText, setSkillText] = useState<string | null>(null);
  const [autoBattle, setAutoBattle] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [bossIntro, setBossIntro] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const autoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleSkillSelectRef = useRef<(skillId: string) => Promise<void>>();
  const handleNextFloorRef = useRef<() => void>();
  const autoNextFloorCalled = useRef(false);
  const animLockRef = useRef(false);
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
    } else if (isTrialMode) {
      startPrestigeTrialBattle();
    } else if (dungeonId) {
      startBattle(dungeonId);
    }
  }, [dungeonId, isAbyssMode, isWeeklyBossMode, isTrialMode, isAuthenticated, navigate, resetBattle, startBattle, startAbyssBattle, startWeeklyBossBattle, startPrestigeTrialBattle]);

  // Clear stale effects when enemies change (new wave)
  const prevEnemyIds = useRef('');
  useEffect(() => {
    const currentIds = battleState?.enemies.map(e => e.id).join(',') ?? '';
    if (prevEnemyIds.current && currentIds !== prevEnemyIds.current) {
      setFlashEnemies(new Set());
      setEnemyEffects({});
      setEnemyLunging(null);
    }
    prevEnemyIds.current = currentIds;
  }, [battleState?.enemies]);

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

      const animType = (skill.animation ?? 'slash') as EffectType;
      const isAttack = skill.targetType !== 'self' && skill.targetType !== 'all_allies';
      const effectDelay = isAttack ? 250 / battleSpeed : 0;
      const totalAnimTime = isAttack ? 600 / battleSpeed : 300 / battleSpeed;

      // Lock to prevent auto-battle from firing during animation
      animLockRef.current = true;

      // ── 1단계: 공격 모션 + 이펙트 먼저 표시 (서버 호출 전) ──
      setSkillText(skill.name);
      setTimeout(() => setSkillText(null), 800 / battleSpeed);

      if (isAttack) {
        // 플레이어 돌진
        setPlayerAttacking(true);
        setTimeout(() => setPlayerAttacking(false), 500 / battleSpeed);

        // 타겟에 이펙트 표시
        setTimeout(() => {
          const hitIds = new Set<string>();
          if (skill.targetType === 'all_enemies') {
            currentBattle.enemies.filter(e => e.isAlive).forEach((e) => hitIds.add(e.id));
          } else {
            hitIds.add(targetId);
          }
          const effects: Record<string, EffectType> = {};
          hitIds.forEach((id) => { effects[id] = animType; });
          setEnemyEffects(effects);
          setFlashEnemies(hitIds);
          setTimeout(() => {
            setEnemyEffects({});
            setFlashEnemies(new Set());
          }, 400 / battleSpeed);
        }, effectDelay);
      } else if (skill.targetType === 'self' || skill.targetType === 'all_allies') {
        setPlayerEffect(skill.animation === 'heal' ? 'heal' : 'buff');
        setTimeout(() => setPlayerEffect(null), 500 / battleSpeed);
      }

      // ── 2단계: 이펙트 보여준 후 서버 호출 ──
      await new Promise(r => setTimeout(r, totalAnimTime));

      const prevLogLen = useCombatStore.getState().battleLog.length;

      const result = isAbyssMode
        ? await useAbyssSkill(skillId, targetId)
        : isWeeklyBossMode
          ? await useWeeklyBossSkill(skillId, targetId)
          : isTrialMode
            ? await usePrestigeTrialSkill(skillId, targetId)
            : await useSkill(skillId, targetId);

      if (result?.saveData) {
        updateSaveData(result.saveData);
      }

      // ── 3단계: 펫 공격 애니메이션 ──
      const newLog = useCombatStore.getState().battleLog;
      const newEntries = newLog.slice(prevLogLen);
      const hasPetAttack = newEntries.some((e) => e.message.startsWith('[펫]'));
      if (hasPetAttack && activePetData) {
        setPetAttacking(true);
        setTimeout(() => setPetAttacking(false), 400 / battleSpeed);
      }

      // Unlock auto-battle
      animLockRef.current = false;
    },
    [selectedTargetId, useSkill, useAbyssSkill, useWeeklyBossSkill, isAbyssMode, isWeeklyBossMode, updateSaveData, battleSpeed, activePetData],
  );

  const handleContinue = useCallback(() => {
    resetBattle();
    if (isTrialMode) {
      navigate('/prestige');
    } else {
      navigate('/dungeon');
    }
  }, [resetBattle, navigate, isTrialMode]);

  const handleRetry = useCallback(() => {
    if (!dungeonId) return;
    setSelectedTargetId(null);
    resetBattle();
    if (isTrialMode) {
      startPrestigeTrialBattle();
    } else if (isWeeklyBossMode) {
      startWeeklyBossBattle();
    } else if (isAbyssMode) {
      startAbyssBattle();
    } else {
      startBattle(dungeonId);
    }
  }, [dungeonId, isTrialMode, isWeeklyBossMode, isAbyssMode, resetBattle, startBattle, startPrestigeTrialBattle, startWeeklyBossBattle, startAbyssBattle]);

  const handleHome = useCallback(() => {
    resetBattle();
    navigate('/home');
  }, [resetBattle, navigate]);

  const handleNextFloor = useCallback(() => {
    autoNextFloorCalled.current = false;
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

      // On victory in abyss mode, auto-progress to next floor (once)
      if (battle.status === 'victory' && isAbyssMode) {
        if (!autoNextFloorCalled.current) {
          autoNextFloorCalled.current = true;
          handleNextFloorRef.current?.();
        }
        return;
      }

      // Only act on player turn and not animating (including local animation lock)
      if (battle.status !== 'player_turn' || state.isAnimating || animLockRef.current) return;

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
      const equipped = saveData?.equippedSkills;
      const availableSkills = SKILLS
        .filter((s) => (s.characterId === charId || s.characterId === 'common') && s.type !== 'passive')
        .filter((s) => {
          // Filter by equipped skills if set
          if (equipped && equipped.length > 0) {
            if (s.id !== 'common_basic_attack' && !equipped.includes(s.id)) return false;
          }
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

  const [playerHit, setPlayerHit] = useState(false);
  const prevPlayerHp = useRef(0);

  // Detect when player takes damage -> enemy lunge + player hit animation
  useEffect(() => {
    if (battleState && battleState.player.currentHp < prevPlayerHp.current) {
      // Find a random alive enemy to show as attacker
      const aliveEnemies = battleState.enemies.filter((e) => e.isAlive);
      const attacker = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      if (attacker) {
        setEnemyLunging(attacker.id);
        setTimeout(() => setEnemyLunging(null), 400);
      }
      // Player hit + effect
      setTimeout(() => {
        setPlayerHit(true);
        setPlayerEffect('enemy_attack');
        setTimeout(() => {
          setPlayerHit(false);
          setPlayerEffect(null);
        }, 300);
      }, 150);
    }
    prevPlayerHp.current = battleState?.player.currentHp ?? 0;
  }, [battleState?.player.currentHp]);

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

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col">
      {/* Top bar: turn info + controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/60 border-b border-gray-800">
        <div className="flex items-center gap-2 text-xs">
          {isAbyssMode && abyssFloor !== null && (
            <span className="font-bold text-purple-400">
              심연 {abyssFloor}층{abyssFloor > 0 && abyssFloor % 10 === 0 ? ' BOSS' : ''}
            </span>
          )}
          {!isAbyssMode && (
            <span className="text-gray-400">
              W{(battleState.log.filter((l) => l.type === 'system' && l.message.includes('웨이브')).length) + 1}/3
            </span>
          )}
          <span className="text-gray-500">T{battleState.turn}</span>
          <span className={`font-bold ${battleState.status === 'player_turn' ? 'text-green-400' : battleState.status === 'enemy_turn' ? 'text-red-400' : 'text-gray-500'}`}>
            {battleState.status === 'player_turn' ? 'YOUR TURN' : battleState.status === 'enemy_turn' ? 'ENEMY TURN' : ''}
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setAutoBattle((prev) => !prev)}
            className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors ${
              autoBattle ? 'border-green-500 text-green-400 bg-green-900/40' : 'border-gray-700 text-gray-500 hover:border-gray-500'
            }`}
          >
            AUTO {autoBattle ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => setBattleSpeed((s) => (s >= 3 ? 1 : s + 1))}
            className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors ${
              battleSpeed > 1 ? 'border-yellow-500 text-yellow-400 bg-yellow-900/40' : 'border-gray-700 text-gray-500 hover:border-gray-500'
            }`}
          >
            x{battleSpeed}
          </button>
        </div>
      </div>

      {/* Error display */}
      {combatError && (
        <div className="text-center text-red-400 text-xs py-1 px-3 bg-red-900/20">
          {combatError}
        </div>
      )}

      {/* ═══ Battle Field (좌: 플레이어+펫 / 우: 적) ═══ */}
      <div
        className="relative flex-shrink-0 flex items-center justify-between px-6 sm:px-10"
        style={{
          background: dungeonBg.gradient,
          height: '480px',
          borderBottom: '2px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Left side: Player + Pet */}
        <div className="flex flex-col items-center gap-1 z-10">
          <div className={`relative ${playerHit ? 'animate-shake' : ''} ${playerAttacking ? 'animate-lunge-right' : ''}`}>
            <AnimatedSprite
              frames={playerAttacking ? playerSprites.run : (playerHit ? playerSprites.hit : playerSprites.idle)}
              fps={playerAttacking ? 12 : (playerHit ? 12 : 6)}
              width={88}
              height={88}
            />
            {playerEffect && <BattleEffect type={playerEffect} />}
          </div>
          <span className="text-[11px] font-bold">{battleState.player.name}</span>
          <span className="text-[9px] text-gray-400">Lv.{saveData?.level ?? '?'}</span>

          {activePetData && (
            <div className={`flex flex-col items-center ${petAttacking ? 'animate-lunge-right' : ''}`}>
              <span className={`text-3xl ${petAttacking ? 'animate-bounce' : ''}`}>
                {PET_EMOJIS[activePetData.id] ?? '\uD83D\uDC3E'}
              </span>
              <span className="text-[8px] text-yellow-400">{activePetData.name}</span>
            </div>
          )}
        </div>

        {/* Right side: Enemies (세로 배치, 5마리 고정 영역) */}
        <div className="flex flex-col gap-1 items-center z-10 justify-center h-full">
          {battleState.enemies.map((enemy) => (
            <EnemyCard
              key={enemy.id}
              enemy={enemy}
              isSelected={selectedTargetId === enemy.id}
              isFlashing={flashEnemies.has(enemy.id)}
              effectType={enemyEffects[enemy.id] ?? null}
              isLunging={enemyLunging === enemy.id}
              onSelect={handleTargetSelect}
            />
          ))}
        </div>
      </div>

      {/* ═══ Player Status Panel (RPG UI 스타일) ═══ */}
      <div className="bg-gradient-to-b from-gray-900/95 to-black/95 border-y border-gray-700/50 px-3 py-2.5">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          {/* HP/MP bars */}
          <div className="flex-1 space-y-1.5">
            {/* HP */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 w-8">
                <span className="text-xs font-bold text-red-400">HP</span>
              </div>
              <div className="flex-1 h-4 bg-black rounded border border-gray-600 overflow-hidden relative">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${(battleState.player.currentHp / battleState.player.maxHp) * 100}%`,
                    background: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 50%, #991b1b 100%)',
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                  {battleState.player.currentHp.toLocaleString()} / {battleState.player.maxHp.toLocaleString()}
                </span>
              </div>
            </div>
            {/* MP */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 w-8">
                <span className="text-xs font-bold text-blue-400">MP</span>
              </div>
              <div className="flex-1 h-4 bg-black rounded border border-gray-600 overflow-hidden relative">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${(battleState.player.currentMp / battleState.player.maxMp) * 100}%`,
                    background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 50%, #1e3a8a 100%)',
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                  {battleState.player.currentMp.toLocaleString()} / {battleState.player.maxMp.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-gray-700" />

          {/* Stats */}
          <div className="flex flex-col gap-1 text-[11px] min-w-[120px]">
            <div className="flex justify-between">
              <span className="text-gray-500">ATK</span>
              <span className="text-red-400 font-bold">{battleState.player.attack.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">DEF</span>
              <span className="text-blue-400 font-bold">{battleState.player.defense.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">SPD</span>
              <span className="text-green-400 font-bold">{battleState.player.speed}</span>
            </div>
          </div>

          {/* Buffs */}
          {battleState.player.statusEffects.length > 0 && (
            <>
              <div className="w-px h-10 bg-gray-700" />
              <div className="flex flex-col gap-1 min-w-[50px]">
                {battleState.player.statusEffects.map((eff, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-700/40 text-center whitespace-nowrap">
                    {eff.type === 'attack_up' ? '\u2694 ATK+' : eff.type === 'defense_up' ? '\uD83D\uDEE1 DEF+' : eff.type === 'poison' ? '\u2620 독' : eff.type === 'regen' ? '\u2728 재생' : eff.type === 'shield' ? '\uD83D\uDCA0 보호막' : eff.type === 'burn' ? '\uD83D\uDD25 화상' : eff.type === 'bleed' ? '\uD83E\uDE78 출혈' : eff.type} {eff.remainingTurns}t
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══ Bottom UI Panel ═══ */}
      <div className="flex-1 flex flex-col bg-black/80">
        {/* Battle log */}
        <div
          ref={logRef}
          className="h-[360px] overflow-y-auto px-3 py-2 text-xs space-y-0.5 border-b border-gray-800/50"
        >
          {battleLog.length === 0 && (
            <p className="text-gray-600 text-center">전투가 시작됩니다...</p>
          )}
          {battleLog.map((entry, idx) =>
            entry.message.includes('치명타') ? (
              <p key={idx} className="text-yellow-300 font-bold">
                <span className="text-gray-600 text-[10px] mr-1">[{entry.turn}]</span>
                &#x26A1; {entry.message}
              </p>
            ) : (
              <p key={idx} className={logTypeColor[entry.type] ?? 'text-gray-400'}>
                <span className="text-gray-600 text-[10px] mr-1">[{entry.turn}]</span>
                {entry.message}
              </p>
            ),
          )}
        </div>

        {/* Skill bar */}
        <div className="px-2 py-2">
          <SkillBar
            skills={characterSkills}
            skillStates={getSkillStates()}
            currentMp={battleState.player.currentMp}
            onSkillSelect={handleSkillSelect}
            equippedSkillIds={saveData?.equippedSkills}
          />
        </div>

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
      </div>

      {/* Boss intro overlay */}
      {bossIntro && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 bg-black/60">
          <div className="flex flex-col items-center gap-2">
            <span className="text-5xl font-black text-red-500 animate-pulse tracking-widest">BOSS</span>
            <span className="text-sm text-red-300/70">{battleState.enemies[0]?.name}</span>
          </div>
        </div>
      )}

      {/* Skill name floating text */}
      {skillText && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <span className="text-2xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-bounce opacity-90">{skillText}</span>
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
