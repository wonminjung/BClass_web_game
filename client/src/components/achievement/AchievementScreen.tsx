import { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ACHIEVEMENTS, TITLES } from '@shared/data';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import axios from 'axios';
import { toast } from '@/components/common/Toast';

function AchievementScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, saveData, updateSaveData } = useAuth();
  const [titleLoading, setTitleLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleBack = useCallback(() => navigate('/home'), [navigate]);

  const progressValues = useMemo(() => {
    if (!saveData) return {};
    return {
      total_kills: saveData.totalKills ?? 0,
      level: saveData.level,
      max_enhance: Math.max(0, ...Object.values(saveData.enhanceLevels ?? {}).map((e) => e.level)),
      abyss_highest: saveData.abyssHighest ?? 0,
      gold: saveData.gold,
      bestiary_count: saveData.bestiary?.length ?? 0,
    } as Record<string, number>;
  }, [saveData]);

  const completedIds = useMemo(
    () => new Set(saveData?.achievements ?? []),
    [saveData?.achievements],
  );

  const handleEquipTitle = useCallback(async (titleId: string) => {
    setTitleLoading(titleId);
    try {
      const res = await axios.post('/api/game/equip-title', { titleId });
      if (res.data.success && res.data.saveData) {
        updateSaveData(res.data.saveData);
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : '칭호 장착에 실패했습니다.';
      toast.error(msg);
    } finally {
      setTitleLoading(null);
    }
  }, [updateSaveData]);

  const equippedTitle = saveData?.equippedTitle ?? '';

  if (!saveData) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dungeon-accent">업적</h1>
          <p className="text-sm text-gray-500 mt-1">
            {completedIds.size} / {ACHIEVEMENTS.length} 완료
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleBack}>
          돌아가기
        </Button>
      </div>

      {/* Titles section */}
      <Card className="mb-6 p-4">
        <h2 className="text-lg font-bold text-yellow-400 mb-3">칭호</h2>
        <div className="space-y-2">
          {TITLES.map((title) => {
            const unlocked = completedIds.has(title.requirement);
            const isEquipped = equippedTitle === title.id;

            return (
              <div
                key={title.id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  unlocked ? 'bg-dungeon-panel' : 'bg-dungeon-panel/30 opacity-50'
                } ${isEquipped ? 'border border-yellow-500/60' : ''}`}
              >
                <div>
                  <span className={`font-bold text-sm ${isEquipped ? 'text-yellow-400' : unlocked ? 'text-gray-200' : 'text-gray-500'}`}>
                    {title.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">{title.description}</span>
                  {title.bonus && (
                    <span className="text-xs text-green-400 ml-2">
                      [{title.bonus.stat === 'atkPercent' ? '공격력' : title.bonus.stat === 'hpPercent' ? 'HP' : title.bonus.stat === 'goldPercent' ? '골드 획득' : title.bonus.stat} +{title.bonus.value}%]
                    </span>
                  )}
                </div>
                {unlocked && (
                  <button
                    type="button"
                    disabled={titleLoading === title.id}
                    onClick={() => handleEquipTitle(isEquipped ? '' : title.id)}
                    className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                      isEquipped
                        ? 'bg-yellow-600/30 text-yellow-400 hover:bg-red-600/30 hover:text-red-400'
                        : 'bg-dungeon-accent/20 text-dungeon-accent hover:bg-dungeon-accent/30'
                    }`}
                  >
                    {titleLoading === title.id ? '...' : isEquipped ? '해제' : '장착'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Achievement list */}
      <div className="space-y-3">
        {ACHIEVEMENTS.map((ach) => {
          const completed = completedIds.has(ach.id);
          const current = progressValues[ach.condition.type] ?? 0;
          const target = ach.condition.value;
          const progress = Math.min(current / target, 1);

          return (
            <Card
              key={ach.id}
              className={`p-4 ${completed ? 'border-2 border-yellow-500/60' : 'opacity-70'}`}
            >
              <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                  completed
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-700/50 text-gray-600'
                }`}>
                  {completed ? '\u2713' : '\u25CB'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold ${completed ? 'text-yellow-400' : 'text-gray-300'}`}>
                      {ach.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{ach.description}</p>

                  {/* Progress bar */}
                  {!completed && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">진행도</span>
                        <span className="text-gray-400">
                          {current.toLocaleString()} / {target.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-dungeon-bg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-dungeon-accent rounded-full transition-all duration-500"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Reward */}
                  <div className="mt-2 flex gap-3 text-xs">
                    {ach.reward.gold && (
                      <span className={completed ? 'text-yellow-400' : 'text-gray-600'}>
                        <span className="text-yellow-400">G</span> {ach.reward.gold.toLocaleString()}
                      </span>
                    )}
                    {ach.reward.gems && (
                      <span className={completed ? 'text-purple-400' : 'text-gray-600'}>
                        <span className="text-purple-400">&#9670;</span> {ach.reward.gems.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default AchievementScreen;
