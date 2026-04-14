import { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SKILLS } from '@shared/data';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import axios from 'axios';
import { toast } from '@/components/common/Toast';

function SkillScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, saveData, updateSaveData } = useAuth();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleBack = useCallback(() => navigate('/home'), [navigate]);

  const characterSkills = useMemo(() => {
    if (!saveData) return [];
    return SKILLS.filter(
      (s) => s.characterId === saveData.characterId || s.characterId === 'common',
    );
  }, [saveData?.characterId]);

  const handleUpgrade = useCallback(
    async (skillId: string) => {
      setUpgrading(skillId);
      try {
        const res = await axios.post('/api/game/skill-upgrade', { skillId });
        if (res.data.success && res.data.saveData) {
          updateSaveData(res.data.saveData);
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

      {/* Skill list */}
      <div className="space-y-3">
        {characterSkills.map((skill) => {
          const level = saveData.skillLevels?.[skill.id] ?? 0;
          const isMaxLevel = level >= 20;
          const isPassive = skill.type === 'passive';
          const upgradeCost = 1000 * Math.pow(level + 1, 2);
          const canAfford = gold >= upgradeCost;
          const levelBonus = level * 0.05;
          const effectiveMultiplier = skill.damageMultiplier > 0
            ? skill.damageMultiplier + skill.damageMultiplier * levelBonus
            : 0;
          const effectiveHealMultiplier = skill.healMultiplier > 0
            ? skill.healMultiplier + skill.healMultiplier * levelBonus
            : 0;

          return (
            <Card key={skill.id} className="p-4">
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

                {/* Upgrade button */}
                {!isPassive && (
                  <div className="flex-shrink-0 text-center">
                    {isMaxLevel ? (
                      <div className="text-xs text-yellow-400 font-bold py-2 px-3">MAX</div>
                    ) : (
                      <div>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!canAfford || upgrading === skill.id}
                          onClick={() => handleUpgrade(skill.id)}
                        >
                          {upgrading === skill.id ? '...' : '강화'}
                        </Button>
                        <p className={`text-[10px] mt-1 ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
                          {upgradeCost.toLocaleString()}G
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default SkillScreen;
