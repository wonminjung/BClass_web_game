import { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { TALENTS } from '@shared/data';
import type { TalentNode } from '@shared/data/talents';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import axios from 'axios';
import { toast, confirm } from '@/components/common/Toast';

const BRANCH_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  offense: { label: '공격', color: 'text-red-400', icon: '\u2694' },
  defense: { label: '방어', color: 'text-blue-400', icon: '\u26E8' },
  utility: { label: '유틸', color: 'text-green-400', icon: '\u2728' },
};

function TalentScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, saveData, updateSaveData } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleBack = useCallback(() => navigate('/home'), [navigate]);

  const talentPoints = useMemo(() => saveData?.talentPoints ?? {}, [saveData?.talentPoints]);

  const totalInvested = useMemo(
    () => {
      let sum = 0;
      for (const [id, v] of Object.entries(talentPoints)) {
        const t = TALENTS.find(tt => tt.id === id);
        if (t && !t.premium) sum += v;
      }
      return sum;
    },
    [talentPoints],
  );

  const availablePoints = useMemo(
    () => (saveData?.level ?? 1) - totalInvested,
    [saveData?.level, totalInvested],
  );

  const branchPoints = useMemo(() => {
    const result: Record<string, number> = { offense: 0, defense: 0, utility: 0 };
    for (const [id, level] of Object.entries(talentPoints)) {
      const talent = TALENTS.find((t) => t.id === id);
      if (talent && !talent.premium) result[talent.branch] += level;
    }
    return result;
  }, [talentPoints]);

  const handleInvest = useCallback(async (talentId: string) => {
    setLoading(talentId);
    try {
      const res = await axios.post('/api/game/talent-invest', { talentId });
      if (res.data.success && res.data.saveData) {
        updateSaveData(res.data.saveData);
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : '특성 투자에 실패했습니다.';
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  }, [updateSaveData]);

  const handleReset = useCallback(async () => {
    const confirmed = await confirm(
      '특성 포인트를 초기화하시겠습니까?\n비용: 10,000 골드',
    );
    if (!confirmed) return;
    try {
      const res = await axios.post('/api/game/talent-reset');
      if (res.data.success && res.data.saveData) {
        updateSaveData(res.data.saveData);
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : '초기화에 실패했습니다.';
      toast.error(msg);
    }
  }, [updateSaveData]);

  if (!saveData) return null;

  const branches: ('offense' | 'defense' | 'utility')[] = ['offense', 'defense', 'utility'];

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dungeon-accent">특성 트리</h1>
          <p className="text-sm text-gray-500 mt-1">
            사용 가능: <span className="text-yellow-400 font-bold">{availablePoints}</span> 포인트
            {' '}(총 투자: {totalInvested})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="danger" size="sm" onClick={handleReset}>
            초기화 (10,000G)
          </Button>
          <Button variant="secondary" size="sm" onClick={handleBack}>
            돌아가기
          </Button>
        </div>
      </div>

      {/* Premium Talents */}
      <Card className="mb-6 p-4 border border-purple-500/30 bg-purple-900/10">
        <h2 className="text-lg font-bold text-purple-400 mb-1">상위 특성 (젬)</h2>
        <p className="text-xs text-gray-500 mb-3">레벨당 50젬 소모 / 포인트 초기화 영향 없음</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TALENTS.filter((t) => t.premium).map((talent: TalentNode) => {
            const currentLevel = talentPoints[talent.id] ?? 0;
            const isMaxed = currentLevel >= talent.maxLevel;
            const canInvest = (saveData?.gems ?? 0) >= 50 && !isMaxed;
            const branchCfg = BRANCH_CONFIG[talent.branch];

            return (
              <Card
                key={talent.id}
                className={`p-3 border ${isMaxed ? 'border-yellow-500/40' : 'border-purple-500/20'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-bold text-sm ${isMaxed ? 'text-yellow-400' : 'text-purple-300'}`}>
                    {talent.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] ${branchCfg.color}`}>{branchCfg.icon}</span>
                    <span className="text-xs text-gray-400">
                      {currentLevel}/{talent.maxLevel}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">{talent.description}</p>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: Math.min(talent.maxLevel, 20) }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i < currentLevel ? 'bg-purple-400' : 'bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!canInvest || loading === talent.id}
                  onClick={() => handleInvest(talent.id)}
                  className="w-full py-1 text-xs font-bold rounded bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {loading === talent.id ? '...' : isMaxed ? '최대' : '+1 (50젬)'}
                </button>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Talent branches */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {branches.map((branch) => {
          const config = BRANCH_CONFIG[branch];
          const talents = TALENTS.filter((t) => t.branch === branch && !t.premium);
          const invested = branchPoints[branch];

          return (
            <div key={branch}>
              <div className="text-center mb-3">
                <span className={`text-2xl ${config.color}`}>{config.icon}</span>
                <h2 className={`text-lg font-bold ${config.color}`}>{config.label}</h2>
                <p className="text-xs text-gray-500">투자: {invested}pt</p>
              </div>
              <div className="space-y-3">
                {talents.map((talent: TalentNode) => {
                  const currentLevel = talentPoints[talent.id] ?? 0;
                  const isMaxed = currentLevel >= talent.maxLevel;
                  const isLocked = invested < talent.requiredPoints;
                  const canInvest = availablePoints > 0 && !isMaxed && !isLocked;

                  return (
                    <Card
                      key={talent.id}
                      className={`p-3 ${isLocked ? 'opacity-40' : ''} ${isMaxed ? 'border border-yellow-500/40' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-bold text-sm ${isMaxed ? 'text-yellow-400' : 'text-gray-200'}`}>
                          {talent.name}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {currentLevel}/{talent.maxLevel}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{talent.description}</p>
                      {isLocked && (
                        <p className="text-xs text-red-400 mb-2">
                          해금 조건: {branch} 계열 {talent.requiredPoints}pt 투자
                        </p>
                      )}
                      {/* Level pips */}
                      <div className="flex gap-0.5 mb-2">
                        {Array.from({ length: talent.maxLevel }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full ${
                              i < currentLevel ? 'bg-dungeon-accent' : 'bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={!canInvest || loading === talent.id}
                        onClick={() => handleInvest(talent.id)}
                        className="w-full py-1 text-xs font-bold rounded bg-dungeon-accent/20 text-dungeon-accent hover:bg-dungeon-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading === talent.id ? '...' : isMaxed ? '최대' : isLocked ? '잠김' : '+1 투자'}
                      </button>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TalentScreen;
