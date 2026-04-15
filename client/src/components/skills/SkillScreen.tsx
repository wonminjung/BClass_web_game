import { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SKILLS } from '@shared/data';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import axios from 'axios';
import { toast } from '@/components/common/Toast';

const MAX_SLOTS = 5;
const MAX_SLOTS_EXTRA = 6;

function SkillScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, saveData, updateSaveData } = useAuth();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [equippedSkillIds, setEquippedSkillIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleBack = useCallback(() => navigate('/home'), [navigate]);

  const maxSlots = saveData?.extraSkillSlot ? MAX_SLOTS_EXTRA : MAX_SLOTS;

  const characterSkills = useMemo(() => {
    if (!saveData) return [];
    return SKILLS.filter(
      (s) => s.characterId === saveData.characterId || s.characterId === 'common',
    );
  }, [saveData?.characterId]);

  const activeSkills = useMemo(() => {
    return characterSkills.filter((s) => s.type === 'active');
  }, [characterSkills]);

  // Initialize equipped skills from saveData or auto-equip first N unlocked active skills
  useEffect(() => {
    if (!saveData) return;
    if (saveData.equippedSkills && saveData.equippedSkills.length > 0) {
      setEquippedSkillIds(saveData.equippedSkills);
    } else {
      // Auto-equip first N unlocked active skills
      const unlocked = activeSkills
        .filter((s) => saveData.level >= (s.unlockLevel ?? 1))
        .filter((s) => s.id !== 'common_basic_attack')
        .slice(0, maxSlots);
      const ids = unlocked.map((s) => s.id);
      setEquippedSkillIds(ids);
      // Save to server
      if (ids.length > 0) {
        axios.post('/api/game/equip-skills', { skillIds: ids }).then((res) => {
          if (res.data.success && res.data.saveData) {
            updateSaveData(res.data.saveData);
          }
        }).catch(() => {});
      }
    }
  }, [saveData?.characterId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveEquippedSkills = useCallback(
    async (newIds: string[]) => {
      setSaving(true);
      try {
        const res = await axios.post('/api/game/equip-skills', { skillIds: newIds });
        if (res.data.success && res.data.saveData) {
          updateSaveData(res.data.saveData);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || '스킬 장착에 실패했습니다.');
      } finally {
        setSaving(false);
      }
    },
    [updateSaveData],
  );

  const handleEquip = useCallback(
    (skillId: string) => {
      if (equippedSkillIds.includes(skillId)) return;
      if (equippedSkillIds.length >= maxSlots) {
        toast.info(`최대 ${maxSlots}개의 스킬만 장착할 수 있습니다. 먼저 장착 해제해주세요.`);
        return;
      }
      const newIds = [...equippedSkillIds, skillId];
      setEquippedSkillIds(newIds);
      saveEquippedSkills(newIds);
    },
    [equippedSkillIds, maxSlots, saveEquippedSkills],
  );

  const handleUnequip = useCallback(
    (skillId: string) => {
      const newIds = equippedSkillIds.filter((id) => id !== skillId);
      setEquippedSkillIds(newIds);
      saveEquippedSkills(newIds);
    },
    [equippedSkillIds, saveEquippedSkills],
  );

  const handleUpgrade = useCallback(
    async (skillId: string, amount: number) => {
      setUpgrading(skillId);
      try {
        const res = await axios.post('/api/game/skill-upgrade', { skillId, amount });
        if (res.data.success && res.data.saveData) {
          updateSaveData(res.data.saveData);
          toast.success(`${res.data.levelsGained ?? 1}레벨 강화! (${res.data.goldSpent?.toLocaleString()}G)`);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || '스킬 강화에 실패했습니다.');
      } finally {
        setUpgrading(null);
      }
    },
    [updateSaveData],
  );

  if (!saveData) return null;

  const gold = saveData.gold;

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dungeon-accent">스킬</h1>
          <p className="text-sm text-yellow-400 mt-1">G {gold.toLocaleString()}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleBack}>
          돌아가기
        </Button>
      </div>

      {/* Equipped Skill Slots */}
      <Card className="p-4 mb-6">
        <h2 className="text-sm font-bold text-gray-300 mb-3">장착된 스킬</h2>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded border border-gray-700">
            <span className="text-[10px] text-gray-400">기본 공격</span>
            <span className="text-[10px] text-green-400">(항상 사용 가능)</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: maxSlots }).map((_, idx) => {
            const skillId = equippedSkillIds[idx];
            const skill = skillId ? SKILLS.find((s) => s.id === skillId) : null;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => skill && handleUnequip(skill.id)}
                disabled={saving}
                className={`relative w-20 h-20 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                  skill
                    ? 'border-dungeon-accent bg-dungeon-accent/10 hover:bg-red-900/20 hover:border-red-400 cursor-pointer'
                    : 'border-gray-700 border-dashed bg-gray-900/50 cursor-default'
                }`}
                title={skill ? `${skill.name} (클릭하여 해제)` : '빈 슬롯'}
              >
                {skill ? (
                  <>
                    <span className="text-lg">{skill.name[0]}</span>
                    <span className="text-[9px] text-gray-300 truncate w-full text-center px-1">
                      {skill.name}
                    </span>
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-[8px] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      X
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-600">+</span>
                )}
              </button>
            );
          })}
        </div>
        {equippedSkillIds.length === 0 && (
          <p className="text-xs text-gray-500 mt-2">아래 목록에서 스킬을 클릭하여 장착하세요.</p>
        )}
      </Card>

      {/* Skill list */}
      <div className="space-y-3">
        {characterSkills.map((skill) => {
          const level = saveData.skillLevels?.[skill.id] ?? 0;
          const maxLevel = saveData.level;
          const isMaxLevel = level >= maxLevel;
          const isPassive = skill.type === 'passive';
          const nextCost = 500 + level * 50 + Math.floor(level * level * 0.5);
          const canAfford = gold >= nextCost;
          const levelBonus = level * 0.05;
          const effectiveMultiplier = skill.damageMultiplier > 0
            ? skill.damageMultiplier + skill.damageMultiplier * levelBonus
            : 0;
          const effectiveHealMultiplier = skill.healMultiplier > 0
            ? skill.healMultiplier + skill.healMultiplier * levelBonus
            : 0;
          const unlockLevel = skill.unlockLevel ?? 1;
          const isUnlocked = saveData.level >= unlockLevel;
          const isEquipped = equippedSkillIds.includes(skill.id);
          const isBasicAttack = skill.id === 'common_basic_attack';

          return (
            <Card
              key={skill.id}
              className={`p-4 transition-all ${
                !isUnlocked ? 'opacity-50' : ''
              } ${isEquipped ? 'ring-1 ring-dungeon-accent' : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Skill info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-100">{skill.name}</h3>
                    {isPassive ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
                        패시브
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-400">
                        액티브
                      </span>
                    )}
                    {isEquipped && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-dungeon-accent/20 text-dungeon-accent">
                        장착됨
                      </span>
                    )}
                    {!isUnlocked && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/50 text-red-400">
                        Lv.{unlockLevel} 해금
                      </span>
                    )}
                    {!isPassive && (
                      <span className={`text-xs font-bold ${
                        level >= 20 ? 'text-yellow-400' : level >= 10 ? 'text-purple-400' : level > 0 ? 'text-blue-400' : 'text-gray-500'
                      }`}>
                        Lv.{level}
                        {isMaxLevel && ' (MAX)'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{skill.description}</p>

                  {/* Skill stats */}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs">
                    {effectiveMultiplier > 0 && (
                      <span className="text-red-400">
                        피해 x{effectiveMultiplier.toFixed(2)}
                        {level > 0 && (
                          <span className="text-green-400 ml-1">
                            (+{(skill.damageMultiplier * levelBonus).toFixed(2)})
                          </span>
                        )}
                      </span>
                    )}
                    {effectiveHealMultiplier > 0 && (
                      <span className="text-green-400">
                        회복 x{effectiveHealMultiplier.toFixed(2)}
                        {level > 0 && (
                          <span className="text-green-300 ml-1">
                            (+{(skill.healMultiplier * levelBonus).toFixed(2)})
                          </span>
                        )}
                      </span>
                    )}
                    {skill.manaCost > 0 && (
                      <span className="text-blue-400">MP {skill.manaCost}</span>
                    )}
                    {skill.cooldown > 0 && (
                      <span className="text-gray-400">CD {skill.cooldown}턴</span>
                    )}
                    {skill.special && (
                      <span className="text-purple-300 text-[10px]">[{skill.special}]</span>
                    )}
                  </div>

                  {/* Status effect */}
                  {skill.statusEffect && (
                    <p className="text-[11px] text-purple-400 mt-1">
                      효과: {skill.statusEffect.type} (
                      {skill.statusEffect.duration > 0 ? `${skill.statusEffect.duration}턴` : '영구'}
                      , {skill.statusEffect.value})
                    </p>
                  )}
                </div>

                {/* Equip + Upgrade buttons */}
                <div className="flex-shrink-0 text-center space-y-2">
                  {/* Equip/Unequip button for active non-basic skills */}
                  {!isPassive && !isBasicAttack && isUnlocked && (
                    <div>
                      {isEquipped ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUnequip(skill.id)}
                          disabled={saving}
                          className="!px-3 !py-1 !text-[10px]"
                        >
                          해제
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleEquip(skill.id)}
                          disabled={saving || equippedSkillIds.length >= maxSlots}
                          className="!px-3 !py-1 !text-[10px]"
                        >
                          장착
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Upgrade buttons */}
                  {!isPassive && (
                    <>
                      {isMaxLevel ? (
                        <div className="text-xs text-yellow-400 font-bold py-2 px-3">MAX</div>
                      ) : (
                        <>
                          <div className="flex gap-1">
                            {[1, 10, 100].map((amt) => (
                              <Button
                                key={amt}
                                variant={amt === 1 ? 'primary' : 'secondary'}
                                size="sm"
                                disabled={!canAfford || upgrading === skill.id}
                                onClick={() => handleUpgrade(skill.id, amt)}
                                className="!px-2 !py-1 !text-[10px]"
                              >
                                {upgrading === skill.id ? '...' : `+${amt}`}
                              </Button>
                            ))}
                          </div>
                          <p className={`text-[10px] ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
                            다음: {nextCost.toLocaleString()}G
                          </p>
                          <p className="text-[9px] text-gray-500">{level} / {maxLevel}</p>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default SkillScreen;
