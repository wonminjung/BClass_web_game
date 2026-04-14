import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ARTIFACTS } from '@shared/data';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import axios from 'axios';
import { toast } from '@/components/common/Toast';

function ArtifactScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, saveData, updateSaveData } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleUpgrade = useCallback(async (artifactId: string) => {
    try {
      const res = await axios.post('/api/game/artifact-upgrade', { artifactId });
      if (res.data.success && res.data.saveData) {
        updateSaveData(res.data.saveData);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '업그레이드 실패');
    }
  }, [updateSaveData]);

  if (!saveData) return null;
  const gems = saveData.gems ?? 0;
  const arts = saveData.artifacts ?? {};

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-purple-400">유물</h1>
          <p className="text-sm text-purple-300 mt-1">&#9670; {gems.toLocaleString()} 젬</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/home')}>돌아가기</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ARTIFACTS.map((art) => {
          const level = arts[art.id] ?? 0;
          const isMax = level >= art.maxLevel;
          const cost = isMax ? 0 : art.costPerLevel(level + 1);
          const canAfford = gems >= cost;
          const totalEffect = art.effectPerLevel * level;

          return (
            <Card key={art.id} className={`p-4 ${isMax ? 'border-yellow-500/30' : ''}`}>
              <div className="flex items-start gap-3">
                <span className="text-3xl">{art.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-200">{art.name}</h3>
                    <span className={`text-xs font-bold ${isMax ? 'text-yellow-400' : 'text-gray-400'}`}>
                      Lv.{level}/{art.maxLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{art.description}</p>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-dungeon-bg rounded mt-2">
                    <div
                      className={`h-full rounded ${isMax ? 'bg-yellow-500' : 'bg-purple-500'}`}
                      style={{ width: `${(level / art.maxLevel) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-green-400">
                      +{totalEffect}{art.effectUnit}
                      {!isMax && <span className="text-gray-500"> → +{totalEffect + art.effectPerLevel}{art.effectUnit}</span>}
                    </span>
                    {!isMax ? (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!canAfford}
                        onClick={() => handleUpgrade(art.id)}
                      >
                        {canAfford ? `${cost} 젬` : '젬 부족'}
                      </Button>
                    ) : (
                      <span className="text-xs text-yellow-400 font-bold">MAX</span>
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

export default ArtifactScreen;
